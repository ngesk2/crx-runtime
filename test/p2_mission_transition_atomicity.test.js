'use strict';

// P2 write-authority closure — mission transition atomicity proofs (2026-10-11).
//
// Closes the reproduced mission write-before-event class: every processor
// state transition (assign/start/complete/fail/failWithRetry/approve/reject
// and the lease/retry sweeps) now runs its conditional UPDATE and its
// required MISSION_* evidence append in ONE transaction
// (MissionRuntime._transitionInTransaction). Evidence-append failure rolls
// the mutation back; tenant confinement is verified before mutation.
//
// Runs against the process-owned disposable schema on the dedicated test
// cluster only (same guard contract as mission_atomicity.test.js).

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');
const { MissionRuntime } = require('../ping-runtime/orchestration/mission_runtime');
const { UnifiedEventRuntime } = require('../ping-runtime/events/unified_event_runtime');

const root = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, '.test-database.json'), 'utf8'));
assert.equal(config.host, '127.0.0.1');
assert.equal(Number(config.port), 51590);
assert.equal(config.database, 'admission_proof');
const schema = 'p2_transitions_' + process.pid;
const adminPool = new Pool(config);
const pool = new Pool({ ...config, options: `-c search_path=${schema}` });

const runtime = new UnifiedEventRuntime({ pool });
const missions = new MissionRuntime({ pool, eventRuntime: runtime });
let schemaOwned = false;
let counter = 0;

function tenant() { return `p2mission-${process.pid}-${++counter}`; }

async function makeMission(t, missionType = 'p2-proof') {
  const payload = { namespace: `tenant::${t}`, event_id: `evt-${t}-${counter}`, input: 'x' };
  const id = await missions.create(missionType, payload, { tenant_id: t });
  return { id, type: missionType, payload };
}

async function statusOf(id) {
  const r = await pool.query('SELECT status, tenant_id, retries FROM ping_missions WHERE mission_id = $1', [id]);
  return r.rows[0];
}

async function eventsFor(id) {
  const r = await pool.query(
    `SELECT event_type, tenant_id FROM ping_events WHERE payload->>'missionId' = $1 ORDER BY created_at`,
    [id]);
  return r.rows;
}

async function installPingEventsFailure(suffix) {
  const fn = `p2_fail_${suffix}_${process.pid}`;
  const trg = `p2_trigger_${suffix}_${process.pid}`;
  await pool.query(`CREATE FUNCTION ${fn}() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN RAISE EXCEPTION 'synthetic ping_events insert failure'; END; $$`);
  await pool.query(`CREATE TRIGGER ${trg} BEFORE INSERT ON ping_events FOR EACH ROW EXECUTE FUNCTION ${fn}()`);
  return async () => {
    await pool.query(`DROP TRIGGER ${trg} ON ping_events`);
    await pool.query(`DROP FUNCTION ${fn}()`);
  };
}

before(async () => {
  assert.equal((await adminPool.query('SHOW cluster_name')).rows[0].cluster_name,
    'ping-admission-proof-20261010', 'Refuse DDL unless connected to the dedicated disposable cluster');
  assert.equal((await adminPool.query('SELECT count(*)::int AS n FROM pg_namespace WHERE nspname=$1', [schema])).rows[0].n,
    0, 'Refuse to reuse a schema not owned by this process');
  await adminPool.query(`CREATE SCHEMA "${schema}"`);
  schemaOwned = true;
  await runtime.initialize();
  await missions.initialize();
});

after(async () => {
  await pool.end();
  if (schemaOwned) await adminPool.query(`DROP SCHEMA "${schema}" CASCADE`);
  await adminPool.end();
});

test('assign -> start -> complete: each transition mutates exactly once and appends exactly one tenant-bound event', async () => {
  const t = tenant();
  const { id } = await makeMission(t);
  assert.equal(await eventsFor(id).then(r => r.length), 1); // MISSION_CREATED

  const claimed = await missions.assign(id, 'worker-1', { tenantId: t });
  assert.equal(claimed, 1);
  assert.equal((await statusOf(id)).status, 'assigned');
  assert.deepEqual((await eventsFor(id)).map(e => e.event_type),
    ['MISSION_CREATED', 'MISSION_ASSIGNED']);
  assert.ok((await eventsFor(id)).every(e => e.tenant_id === t));

  await missions.start(id, { tenantId: t });
  assert.equal((await statusOf(id)).status, 'running');
  await missions.complete(id, { ok: true }, { tenantId: t });
  assert.equal((await statusOf(id)).status, 'completed');
  assert.deepEqual((await eventsFor(id)).map(e => e.event_type),
    ['MISSION_CREATED', 'MISSION_ASSIGNED', 'MISSION_STARTED', 'MISSION_COMPLETED']);

  // Second claim on a completed mission matches zero rows: no mutation, no event.
  assert.equal(await missions.assign(id, 'worker-2', { tenantId: t }), 0);
  assert.equal((await eventsFor(id)).length, 4);
});

test('tenant_mismatch: declared tenant differing from the row aborts before mutation or evidence', async () => {
  const t = tenant();
  const { id } = await makeMission(t);
  await assert.rejects(() => missions.assign(id, 'worker-1', { tenantId: 'someone-elses-tenant' }),
    err => err.code === 'tenant_mismatch' || /tenant_mismatch/.test(err.message));
  assert.equal((await statusOf(id)).status, 'created');
  assert.deepEqual((await eventsFor(id)).map(e => e.event_type), ['MISSION_CREATED']);
});

test('evidence-append failure rolls the transition back: no silent write-before-event', async () => {
  const t = tenant();
  const { id } = await makeMission(t);
  await missions.assign(id, 'worker-1', { tenantId: t });
  await missions.start(id, { tenantId: t });

  const remove = await installPingEventsFailure('start');
  await assert.rejects(() => missions.complete(id, { ok: true }, { tenantId: t }),
    err => err.code === 'mission_event_persist_failed');
  await remove();

  // The mutation did NOT commit: still running, no MISSION_COMPLETED.
  assert.equal((await statusOf(id)).status, 'running');
  assert.deepEqual((await eventsFor(id)).map(e => e.event_type),
    ['MISSION_CREATED', 'MISSION_ASSIGNED', 'MISSION_STARTED']);

  // After the fault clears the transition succeeds exactly once.
  await missions.complete(id, { ok: true }, { tenantId: t });
  assert.equal((await statusOf(id)).status, 'completed');
  assert.equal((await eventsFor(id)).filter(e => e.event_type === 'MISSION_COMPLETED').length, 1);
});

test('failWithRetry: attempt counting, retry_pending evidence, exhaustion to failed', async () => {
  const t = tenant();
  const { id } = await makeMission(t);
  await missions.assign(id, 'worker-1', { tenantId: t });
  await missions.start(id, { tenantId: t });

  const r1 = await missions.failWithRetry(id, 'boom-1', { max_attempts: 3, backoff_delay_ms: 60000, tenantId: t });
  assert.equal(r1, 1);
  let s = await statusOf(id);
  assert.equal(s.status, 'retry_pending');
  assert.equal(s.retries, 1);

  const r2 = await missions.failWithRetry(id, 'boom-2', { max_attempts: 3, backoff_delay_ms: 60000, tenantId: t });
  assert.equal(r2, 2);
  s = await statusOf(id);
  assert.equal(s.retries, 2);

  const r3 = await missions.failWithRetry(id, 'boom-3', { max_attempts: 3, backoff_delay_ms: 60000, tenantId: t });
  assert.equal(r3, 3);
  s = await statusOf(id);
  assert.equal(s.status, 'failed');
  assert.equal(s.retries, 3);

  const failed = (await eventsFor(id)).filter(e => e.event_type === 'MISSION_FAILED');
  assert.equal(failed.length, 3);
  assert.ok(failed.every(e => e.tenant_id === t));
});

test('approve/reject: authenticated decider required; evidence appended atomically', async () => {
  const t = tenant();
  const { id } = await makeMission(t);
  await assert.rejects(() => missions.approve(id, ''),
    err => err.code === 'APPROVER_REQUIRED');
  await assert.rejects(() => missions.reject(id, null),
    err => err.code === 'REJECTER_REQUIRED');

  const approved = await missions.approve(id, 'agent-1');
  assert.equal(approved.status, 'approved');
  assert.equal(approved.approved_by, 'agent-1');
  assert.ok(approved.approved_at);
  assert.equal((await statusOf(id)).status, 'approved');
  const ev = await eventsFor(id);
  assert.ok(ev.some(e => e.event_type === 'MISSION_APPROVED' && e.tenant_id === t));

  // A decided mission is not re-decideable: no second mutation, no second event.
  await assert.rejects(() => missions.reject(id, 'agent-2', 'late'),
    err => err.code === 'MISSION_NOT_REJECTABLE');
  assert.equal(ev.length, (await eventsFor(id)).length);
});

test('reapExpiredLeases: expired lease reclaimed with evidence; second sweep is a no-op', async () => {
  const t = tenant();
  const { id } = await makeMission(t);
  await missions.assign(id, 'worker-1', { tenantId: t });
  // Expire the lease manually (assign() stamps now()+60s).
  await pool.query(`UPDATE ping_missions SET lease_until = NOW() - INTERVAL '1 second' WHERE mission_id = $1`, [id]);

  const n = await missions.reapExpiredLeases();
  assert.equal(n, 1);
  assert.equal((await statusOf(id)).status, 'created');
  const ev = await eventsFor(id);
  assert.ok(ev.some(e => e.event_type === 'MISSION_LEASE_EXPIRED' && e.tenant_id === t));

  assert.equal(await missions.reapExpiredLeases(), 0);
});

test('reclaimRetryPending: due retry reclaimed with evidence', async () => {
  const t = tenant();
  const { id } = await makeMission(t);
  await missions.assign(id, 'worker-1', { tenantId: t });
  await missions.start(id, { tenantId: t });
  await missions.failWithRetry(id, 'flaky', { max_attempts: 5, backoff_delay_ms: 3600000, tenantId: t });
  assert.equal((await statusOf(id)).status, 'retry_pending');
  await pool.query(`UPDATE ping_missions SET retry_at = NOW() - INTERVAL '1 second' WHERE mission_id = $1`, [id]);

  const n = await missions.reclaimRetryPending();
  assert.equal(n, 1);
  assert.equal((await statusOf(id)).status, 'created');
  const ev = await eventsFor(id);
  assert.ok(ev.some(e => e.event_type === 'MISSION_RETRY_RECLAIMED' && e.tenant_id === t));
});

test('transition without a transactional event runtime fails closed (no silent mutation)', async () => {
  const bare = new MissionRuntime({ pool }); // no eventRuntime
  const t = tenant();
  const { id } = await makeMission(t);
  await assert.rejects(() => bare.assign(id, 'worker-1', { tenantId: t }),
    /same-pool transactional event runtime is required/);
  assert.equal((await statusOf(id)).status, 'created');
});
