'use strict';
/**
 * T2 constitutional property — retry idempotency (j).
 *
 * WHAT INVARIANT?
 *   retry(operation) never silently duplicates a canonical side effect.
 *   Concretely: N attempts of the same logical operation (after response
 *   loss) produce exactly ONE canonical effect; the mission retry counter
 *   advances monotonically and terminates at failed (never loops forever,
 *   never resets); a second claim on an already-claimed mission wins zero rows.
 * WHO OWNS IT? MissionRuntime.create (idempotent mission_id) +
 *   MissionRuntime.assign (conditional claim) +
 *   MissionRuntime.failWithRetry (bounded attempts, F-01 repair) +
 *   UnifiedEventRuntime.emit (logical_id dedup)
 *   (ping-runtime/orchestration/mission_runtime.js,
 *   ping-runtime/events/unified_event_runtime.js).
 * HOW CAN IT FAIL? ON CONFLICT silently swallowing a semantically different
 *   payload under the same id; the retry counter reset (infinite loop);
 *   a stale worker winning a second claim; terminal retried into a new effect.
 * WHAT ATTACK DISPROVES IT? Attempt the same logical operation K times and
 *   count canonical rows/effects; drive failWithRetry past max_attempts and
 *   assert termination and monotonic counters.
 * WHAT EVIDENCE PROVES IT? Fixed-seed fast-check: one row per logical
 *   operation, bounded attempts, exclusive claims.
 * CAN IT BE REPLAYED? Yes: seed + path.
 * DOES THE FAILURE BECOME PERMANENT REGRESSION KNOWLEDGE? Yes, BUG- ledger.
 * WHY CAN EXISTING RUNNER + LIBRARY + EXISTING PING AUTHORITY NOT EXPRESS THIS?
 *   node:test + fast-check + the existing runtimes over the documented
 *   PgStub seam. Real concurrency races belong to the nightly Postgres
 *   lane (Testcontainers candidate), not to this property.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { fc, domainObjectArb, tenantArb } = require('../_support/arbitraries');
const { fcOptions, RUNS } = require('../_support/budget');
const { withRegressionLedger } = require('../_support/regression');
const { PgStub } = require('../_support/pg_stub');
const { UnifiedEventRuntime } = require('../../ping-runtime/events/unified_event_runtime.js');
const { MissionRuntime } = require('../../ping-runtime/orchestration/mission_runtime.js');

const SEED = 20260939;
const INVARIANT = 'retry(operation) never silently duplicates a canonical side effect; attempts are bounded and claims exclusive';

function makeStack() {
  const pool = new PgStub();
  const events = new UnifiedEventRuntime({ pool });
  const missions = new MissionRuntime({ pool, eventRuntime: events });
  return { pool, events, missions };
}

describe('retry idempotency (j)', () => {
  it(`K attempts of the same logical operation => exactly one canonical effect over ${RUNS} cases`, async () => {
    const prop = fc.asyncProperty(
      domainObjectArb(), tenantArb, fc.integer({ min: 2, max: 6 }),
      async (payload, tenantId, attempts) => {
        const { pool, events, missions } = makeStack();

        // Mission creation retried after response loss.
        const ids = [];
        for (let i = 0; i < attempts; i++) {
          ids.push(await missions.create('LADDER_TEST_RETRY', { event_id: 'evt-logic-1', task: payload }, { tenant_id: tenantId }));
        }
        for (const id of ids) assert.equal(id, ids[0], 'same logical mission must resolve to the same identity');
        assert.equal(pool.missions.size, 1, 'retried creation must not duplicate the mission row');

        // Event emission retried after response loss.
        const eids = [];
        for (let i = 0; i < attempts; i++) {
          const r = await events.emit('REVIEW_RECEIVED', 'test-harness', payload, { logical_id: 'logic-evt-1', tenant_id: tenantId });
          assert.equal(r.status, 'ok');
          eids.push(r.eventId);
        }
        for (const id of eids) assert.equal(id, eids[0]);
        assert.equal(
          [...pool.events.values()].filter((e) => e.event_type === 'REVIEW_RECEIVED').length, 1,
          'retried emission must not duplicate the event row',
        );

        // A second worker racing the claim wins zero rows.
        const missionId = ids[0];
        assert.equal(await missions.assign(missionId, 'worker:A'), 1);
        assert.equal(await missions.assign(missionId, 'worker:B'), 0, 'stale worker must never win a second claim');
        const mRow = await missions.getMission(missionId);
        assert.equal(mRow.assigned_to, 'worker:A', 'the first claim stands');
      },
    );
    await withRegressionLedger(
      { property: 'retry.no-duplicate-side-effects', expectedInvariant: INVARIANT },
      SEED,
      () => fc.assert(prop, fcOptions(SEED)),
    );
  });

  it(`failWithRetry advances monotonically and terminates over ${RUNS} cases`, async () => {
    const prop = fc.asyncProperty(
      tenantArb, fc.integer({ min: 2, max: 5 }),
      async (tenantId, maxAttempts) => {
        const { missions } = makeStack();
        const missionId = await missions.create('LADDER_TEST_RETRY', { n: 1 }, { tenant_id: tenantId });
        await missions.assign(missionId, 'worker:A');
        await missions.start(missionId);

        let last = 0;
        for (let i = 0; i < maxAttempts + 2; i++) {
          const next = await missions.failWithRetry(missionId, `boom-${i}`, { max_attempts: maxAttempts });
          assert.ok(next >= last, 'retry counter must advance monotonically, never reset');
          last = next;
        }
        const mRow = await missions.getMission(missionId);
        assert.equal(mRow.status, 'failed', 'retries must terminate at failed after max_attempts');
        assert.equal(mRow.retries, maxAttempts, 'counter must stop at max_attempts, not beyond');
        // Terminal is terminal: further retries change nothing.
        const before = mRow.retries;
        await missions.failWithRetry(missionId, 'late', { max_attempts: maxAttempts });
        const after = (await missions.getMission(missionId)).retries;
        assert.equal(after, before, 'a terminal mission must not accrue more attempts');
      },
    );
    await withRegressionLedger(
      { property: 'retry.bounded-termination', expectedInvariant: INVARIANT },
      SEED + 1,
      () => fc.assert(prop, fcOptions(SEED + 1)),
    );
  });
});
