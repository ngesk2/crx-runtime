#!/usr/bin/env node
/**
 * Mission Card Endpoints — proof test (ad-hoc, repo convention: gateway/tests/).
 *
 * Exercises the REAL route module + REAL exterior auth middleware + REAL
 * MissionRuntime against a scratch Postgres, mounted exactly as
 * GatewayRuntime mounts them:
 *   /api/v1/missions -> exteriorAuth.middleware() -> mission card routes
 *
 * Run:
 *   MUSE_LEVEL_1_KEY=<key1> MUSE_LEVEL_2_KEY=<key2> \
 *   MC_PROOF_PGHOST=127.0.0.1 MC_PROOF_PGPORT=54399 MC_PROOF_PGDB=postgres \
 *   MC_PROOF_PGUSER=postgres MC_PROOF_PGPASSWORD=<pw> \
 *   node gateway/tests/mission_cards.test.js
 *
 * The scratch PG must exist and be empty-ish (the test drops and recreates
 * its own tables). Never point this at a production database.
 */
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const { MissionRuntime } = require(path.join(REPO_ROOT, 'ping-runtime/orchestration/mission_runtime.js'));
const ExteriorAuthMiddleware = require(path.join(REPO_ROOT, 'gateway/exterior_auth_middleware.js'));
const createMissionCardRoutes = require(path.join(REPO_ROOT, 'gateway/routes/mission_cards.js'));

const PORT = parseInt(process.env.MC_PROOF_PORT || '18091', 10);
const KEY1 = process.env.MUSE_LEVEL_1_KEY;   // -> agent 'muse'
const KEY2 = process.env.MUSE_LEVEL_2_KEY;   // -> agent 'muse-level-2'
if (!KEY1 || !KEY2) {
  console.error('MUSE_LEVEL_1_KEY and MUSE_LEVEL_2_KEY must be set (test credentials).');
  process.exit(2);
}

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log(`PASS ${name}`); }
  else { fail++; console.log(`FAIL ${name}${extra ? ' :: ' + extra : ''}`); }
}

async function post(path, body, key) {
  const headers = { 'Content-Type': 'application/json' };
  if (key) headers['Authorization'] = `Bearer ${key}`;
  const res = await fetch(`http://127.0.0.1:${PORT}${path}`, {
    method: 'POST',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try { json = await res.json(); } catch (_) {}
  return { status: res.status, json };
}

async function main() {
  const pool = new Pool({
    host: process.env.MC_PROOF_PGHOST || '127.0.0.1',
    port: parseInt(process.env.MC_PROOF_PGPORT || '54399', 10),
    database: process.env.MC_PROOF_PGDB || 'postgres',
    user: process.env.MC_PROOF_PGUSER || 'postgres',
    password: process.env.MC_PROOF_PGPASSWORD || 'proofpw123',
  });

  // Fresh state per run: mission ids are deterministic (idempotent create),
  // so clear the scratch tables to re-prove the positive transitions.
  await pool.query(`DROP TABLE IF EXISTS ping_missions, mission_card_order, exterior_agent_credentials`);

  const missionRuntime = new MissionRuntime({ pool, eventRuntime: null });
  await missionRuntime.initialize();

  const auth = new ExteriorAuthMiddleware(pool);
  await auth.initialize();

  const app = express();
  app.use(express.json());
  app.use('/api/v1/missions', auth.middleware(),
    createMissionCardRoutes({ missionRuntime, pool }));
  const server = await new Promise((resolve) => {
    const s = app.listen(PORT, '127.0.0.1', () => resolve(s));
  });
  console.log(`harness up on :${PORT}`);

  const TENANT = 'proof-tenant';
  const m1 = await missionRuntime.create('card', { n: 1 }, { tenant_id: TENANT });
  const m2 = await missionRuntime.create('card', { n: 2 }, { tenant_id: TENANT });
  const m3 = await missionRuntime.create('card', { n: 3 }, { tenant_id: TENANT });
  console.log(`missions: ${m1} ${m2} ${m3}`);

  // --- negative: unauthenticated approve denied ---
  let r = await post(`/api/v1/missions/cards/${m1}/approve`);
  check('unauthenticated approve -> 401 MISSING_AUTH',
    r.status === 401 && r.json && r.json.code === 'MISSING_AUTH', JSON.stringify(r.json));

  // --- negative: bad credential denied ---
  r = await post(`/api/v1/missions/cards/${m1}/approve`, {}, 'wrong-key');
  check('bad credential approve -> 401 INVALID_CREDENTIAL',
    r.status === 401 && r.json && r.json.code === 'INVALID_CREDENTIAL', JSON.stringify(r.json));

  // --- negative: fabricated approver identity denied ---
  r = await post(`/api/v1/missions/cards/${m1}/approve`, { approved_by: 'mallory' }, KEY1);
  check('fabricated approver identity -> 400 fabricated_identity',
    r.status === 400 && r.json && r.json.error === 'fabricated_identity', JSON.stringify(r.json));

  // --- positive: approve with authenticated caller ---
  r = await post(`/api/v1/missions/cards/${m1}/approve`, {}, KEY1);
  check('authenticated approve -> 200 ok/approved',
    r.status === 200 && r.json && r.json.status === 'ok' && r.json.mission_status === 'approved',
    JSON.stringify(r.json));
  let row = (await pool.query(
    `SELECT status, approved_by, approved_at FROM ping_missions WHERE mission_id=$1`, [m1])).rows[0];
  check('mission row: approved, approver=authenticated agent (muse), timestamp set',
    row && row.status === 'approved' && row.approved_by === 'muse' && !!row.approved_at,
    JSON.stringify(row));

  // --- approver follows the credential, not a default ---
  r = await post(`/api/v1/missions/cards/${m2}/approve`, {}, KEY2);
  row = (await pool.query(`SELECT approved_by FROM ping_missions WHERE mission_id=$1`, [m2])).rows[0];
  check('second credential approves as muse-level-2',
    r.status === 200 && row && row.approved_by === 'muse-level-2', JSON.stringify(row));

  // --- double approve fails closed ---
  r = await post(`/api/v1/missions/cards/${m1}/approve`, {}, KEY1);
  check('re-approve -> 409 mission_not_approvable',
    r.status === 409 && r.json && r.json.error === 'mission_not_approvable', JSON.stringify(r.json));

  // --- unknown mission ---
  r = await post(`/api/v1/missions/cards/nope-not-real/approve`, {}, KEY1);
  check('approve unknown id -> 404 mission_not_found',
    r.status === 404 && r.json && r.json.error === 'mission_not_found', JSON.stringify(r.json));

  // --- positive: reject with reason ---
  r = await post(`/api/v1/missions/cards/${m3}/reject`, { reason: 'not this quarter' }, KEY1);
  check('authenticated reject -> 200 ok/rejected',
    r.status === 200 && r.json && r.json.status === 'ok' && r.json.mission_status === 'rejected'
      && r.json.reason === 'not this quarter',
    JSON.stringify(r.json));
  row = (await pool.query(
    `SELECT status, rejected_by, rejected_at, rejection_reason FROM ping_missions WHERE mission_id=$1`, [m3])).rows[0];
  check('mission row: rejected, rejecter=muse, reason persisted, timestamp set',
    row && row.status === 'rejected' && row.rejected_by === 'muse'
      && row.rejection_reason === 'not this quarter' && !!row.rejected_at,
    JSON.stringify(row));

  // --- reject without reason: allowed, stored null ---
  const m4 = await missionRuntime.create('card', { n: 4 }, { tenant_id: TENANT });
  r = await post(`/api/v1/missions/cards/${m4}/reject`, {}, KEY1);
  row = (await pool.query(`SELECT status, rejection_reason FROM ping_missions WHERE mission_id=$1`, [m4])).rows[0];
  check('reject without reason -> 200, reason null',
    r.status === 200 && row && row.status === 'rejected' && row.rejection_reason === null,
    JSON.stringify(r.json) + ' / ' + JSON.stringify(row));

  // --- unauthenticated reject denied ---
  r = await post(`/api/v1/missions/cards/${m4}/reject`, { reason: 'x' });
  check('unauthenticated reject -> 401', r.status === 401, String(r.status));

  // --- fabricated rejecter denied ---
  const m5 = await missionRuntime.create('card', { n: 5 }, { tenant_id: TENANT });
  r = await post(`/api/v1/missions/cards/${m5}/reject`, { rejected_by: 'mallory' }, KEY1);
  check('fabricated rejecter identity -> 400 fabricated_identity',
    r.status === 400 && r.json && r.json.error === 'fabricated_identity', JSON.stringify(r.json));

  // --- positive: reorder persists and reads back ---
  r = await post(`/api/v1/missions/cards/reorder`, { cardIds: [m3, m2, m1] }, KEY1);
  check('reorder -> 200 with echoed order',
    r.status === 200 && r.json && r.json.status === 'ok'
      && JSON.stringify(r.json.cardIds) === JSON.stringify([m3, m2, m1]),
    JSON.stringify(r.json));
  row = (await pool.query(`SELECT card_ids, updated_by FROM mission_card_order WHERE order_key='default'`)).rows[0];
  check('order persisted in mission_card_order, updated_by=muse',
    row && JSON.stringify(row.card_ids) === JSON.stringify([m3, m2, m1]) && row.updated_by === 'muse',
    JSON.stringify(row));

  r = await post(`/api/v1/missions/cards/reorder`, { cardIds: [m1, m2, m3] }, KEY1);
  row = (await pool.query(`SELECT card_ids FROM mission_card_order WHERE order_key='default'`)).rows[0];
  check('second reorder overwrites; read-back matches latest',
    r.status === 200 && row && JSON.stringify(row.card_ids) === JSON.stringify([m1, m2, m3]),
    JSON.stringify(row));

  // --- reorder validation: typed 400s ---
  r = await post(`/api/v1/missions/cards/reorder`, { cardIds: [m1, m2, m3] });
  check('unauthenticated reorder -> 401', r.status === 401, String(r.status));
  r = await post(`/api/v1/missions/cards/reorder`, {}, KEY1);
  check('missing cardIds -> 400 card_ids_required',
    r.status === 400 && r.json && r.json.error === 'card_ids_required', JSON.stringify(r.json));
  r = await post(`/api/v1/missions/cards/reorder`, { cardIds: 'nope' }, KEY1);
  check('non-array cardIds -> 400 card_ids_not_array',
    r.status === 400 && r.json && r.json.error === 'card_ids_not_array', JSON.stringify(r.json));
  r = await post(`/api/v1/missions/cards/reorder`, { cardIds: ['a', 'a'] }, KEY1);
  check('duplicate ids -> 400 card_ids_duplicate',
    r.status === 400 && r.json && r.json.error === 'card_ids_duplicate', JSON.stringify(r.json));
  r = await post(`/api/v1/missions/cards/reorder`, { cardIds: [42] }, KEY1);
  check('non-string id -> 400 card_id_invalid',
    r.status === 400 && r.json && r.json.error === 'card_id_invalid', JSON.stringify(r.json));
  r = await post(`/api/v1/missions/cards/reorder`, { cardIds: ['  '] }, KEY1);
  check('blank id -> 400 card_id_invalid',
    r.status === 400 && r.json && r.json.error === 'card_id_invalid', JSON.stringify(r.json));

  // failed validations must not clobber the persisted order
  row = (await pool.query(`SELECT card_ids FROM mission_card_order WHERE order_key='default'`)).rows[0];
  check('failed reorder validations leave persisted order intact',
    row && JSON.stringify(row.card_ids) === JSON.stringify([m1, m2, m3]), JSON.stringify(row));

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  server.close();
  await pool.end();
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
