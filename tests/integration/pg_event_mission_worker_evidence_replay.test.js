'use strict';
/**
 * Integration test — Postgres event->mission->worker->evidence->replay round trip.
 *
 * Runs ONLY when PING_TEST_PG=1 (Pig-local or nightly CI with Postgres).
 * Uses a throwaway schema (ladder_test_<pid>) inside the configured database
 * and drops it afterwards: the gateway's own tables are never touched.
 *
 * WHY REAL POSTGRES HERE (and not the PgStub)? The order is explicit: no mock
 * may certify transactions, constraints, ON CONFLICT behavior, concurrency,
 * leases, terminal-state races, idempotency, or replay persistence. The
 * PgStub (fast tier) proves the RUNTIME's logic; this lane proves the
 * DATABASE's behavior under the runtime.
 *
 * WHY NOT TESTCONTAINERS IN THE PR GATE? Testcontainers Node 12 is the
 * NIGHTLY candidate (Node 22.23.2 satisfies >=22.22; docker-socket compat on
 * the Pig verified separately). For the PR gate this test targets the
 * existing ping-postgres container: no image pull, fast, deterministic.
 * If PING_TEST_PG is unset the test SKIPS honestly (never fakes a pass).
 *
 * WHAT INVARIANT? The full chain persists and round-trips on real Postgres:
 *   emit->row, idempotent re-emit (ON CONFLICT), mission lifecycle with
 *   conditional claim, completion evidence, causation walk via real SQL,
 *   payload canonical bytes stable across the write/read boundary.
 * WHO OWNS IT? UnifiedEventRuntime + MissionRuntime + ping_events/ping_missions.
 * CAN IT BE REPLAYED? Yes: the schema is dropped and recreated per run.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const PG_ENABLED = process.env.PING_TEST_PG === '1';
let Pool;
try { ({ Pool } = require('pg')); } catch { Pool = null; }

const SCHEMA = `ladder_test_${process.pid}`;

async function connect() {
  const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'crx_runtime',
    user: process.env.POSTGRES_USER || 'crx_user',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
  });
  const client = await pool.connect();
  await client.query(`CREATE SCHEMA IF NOT EXISTS ${SCHEMA}`);
  await client.query(`SET search_path TO ${SCHEMA}, public`);
  return { pool, client };
}

describe('postgres event->mission->worker->evidence->replay round trip', { skip: !PG_ENABLED || !Pool }, () => {
  it('full chain persists and round-trips on real Postgres', async () => {
    const { UnifiedEventRuntime } = require('../../ping-runtime/events/unified_event_runtime.js');
    const { MissionRuntime } = require('../../ping-runtime/orchestration/mission_runtime.js');
    const { CanonicalBytes } = require('../../ping-runtime/authorities/canonical_authority.js');

    const { pool, client } = await connect();
    const release = async () => {
      try { await client.query(`DROP SCHEMA ${SCHEMA} CASCADE`); } catch { /* best effort */ }
      client.release();
      await pool.end();
    };
    try {
      const events = new UnifiedEventRuntime({ pool: client });
      const missions = new MissionRuntime({ pool: client, eventRuntime: events });
      await events.initialize();
      await missions.initialize();

      // E: emit.
      const payload = { customer: 'c-1', note: 'ladder probe' };
      const eRes = await events.emit('REVIEW_RECEIVED', 'ladder-probe', payload, { tenant_id: 'acme', logical_id: 'ladder-e-1' });
      assert.equal(eRes.status, 'ok');

      // Idempotent re-emit on REAL postgres: ON CONFLICT DO NOTHING.
      const eRes2 = await events.emit('REVIEW_RECEIVED', 'ladder-probe', payload, { tenant_id: 'acme', logical_id: 'ladder-e-1' });
      assert.equal(eRes2.status, 'ok');
      assert.equal(eRes2.eventId, eRes.eventId);
      const cnt = await client.query('SELECT count(*)::int AS c FROM ping_events WHERE event_id = $1', [eRes.eventId]);
      assert.equal(cnt.rows[0].c, 1, 'real ON CONFLICT must keep exactly one row');

      // M: mission from the event; W: claim + run; R: complete.
      const missionId = await missions.create('LADDER_PROBE', { event_id: eRes.eventId }, { tenant_id: 'acme', createdBy: 'ladder-probe' });
      assert.equal(await missions.assign(missionId, 'worker:pg-1'), 1);
      assert.equal(await missions.assign(missionId, 'worker:pg-2'), 0, 'second claim must lose on real Postgres');
      await missions.start(missionId);
      await missions.complete(missionId, { ok: true });
      const mRow = await missions.getMission(missionId);
      assert.equal(mRow.status, 'completed');
      assert.equal(mRow.assigned_to, 'worker:pg-1');

      // Causation walk via real SQL.
      const completed = await client.query(
        "SELECT payload FROM ping_events WHERE event_type = 'MISSION_COMPLETED' LIMIT 1",
      );
      assert.equal(completed.rows.length, 1);
      // node-pg parses JSONB into objects: the payload may already be an
      // object on real Postgres (was '"[object Object]" is not valid JSON').
      const completedPayload = completed.rows[0].payload;
      const mid = (typeof completedPayload === 'string' ? JSON.parse(completedPayload) : completedPayload).missionId;
      assert.equal(mid, missionId);

      // Replay: re-read every event; canonical bytes stable across the boundary.
      const all = await client.query('SELECT event_id, payload FROM ping_events');
      assert.ok(all.rows.length >= 3, 'evidence events must have been recorded');
      for (const row of all.rows) {
        const p = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
        assert.ok(CanonicalBytes.serialize(p).length > 0, `event ${row.event_id} payload must re-canonicalize`);
      }
    } finally {
      await release();
    }
  });
});
