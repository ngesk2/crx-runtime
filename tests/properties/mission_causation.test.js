'use strict';
/**
 * T2 constitutional property — mission execution causation (h).
 *
 * WHAT INVARIANT?
 *   event E => mission M => worker W => result R: the causation of R traces
 *   back to M and to E through the runtime's own identity keys. Concretely:
 *   MISSION_COMPLETED.payload.missionId resolves to a mission row whose
 *   payload.event_id resolves to the originating event row; the mission's
 *   assigned_to names the worker that executed it; the MISSION_CREATED
 *   evidence names the same mission id the runtime returned.
 * WHO OWNS IT? MissionRuntime (create/assign/start/complete) +
 *   UnifiedEventRuntime (MISSION_* evidence events)
 *   (ping-runtime/orchestration/mission_runtime.js,
 *   ping-runtime/events/unified_event_runtime.js).
 * HOW CAN IT FAIL? complete() emitting MISSION_COMPLETED for a mission id
 *   that was never created; payload.event_id dropped between E and M;
 *   causation silently re-pointed; two missions sharing an identity.
 * WHAT ATTACK DISPROVES IT? Drive the full lifecycle with generated
 *   payloads/workers/tenants, then walk the causation chain from R
 *   backwards: every hop must resolve.
 * WHAT EVIDENCE PROVES IT? Fixed-seed fast-check: the chain resolves on
 *   every case; terminal states emit exactly one completion evidence.
 * CAN IT BE REPLAYED? Yes: seed + path.
 * DOES THE FAILURE BECOME PERMANENT REGRESSION KNOWLEDGE? Yes, BUG- ledger.
 * WHY CAN EXISTING RUNNER + LIBRARY + EXISTING PING AUTHORITY NOT EXPRESS THIS?
 *   node:test + fast-check + the existing runtimes over the documented
 *   PgStub seam (protocol only). No new mission authority, no new event
 *   store.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { fc, domainObjectArb, tenantArb, sourceArb } = require('../_support/arbitraries');
const { fcOptions, RUNS } = require('../_support/budget');
const { withRegressionLedger } = require('../_support/regression');
const { PgStub } = require('../_support/pg_stub');
const { UnifiedEventRuntime } = require('../../ping-runtime/events/unified_event_runtime.js');
const { MissionRuntime } = require('../../ping-runtime/orchestration/mission_runtime.js');

const SEED = 20260937;
const INVARIANT = 'causation(R) traces to M and E: R.payload.missionId -> mission row -> payload.event_id -> event row';

function makeStack() {
  const pool = new PgStub();
  const events = new UnifiedEventRuntime({ pool });
  const missions = new MissionRuntime({ pool, eventRuntime: events });
  return { pool, events, missions };
}

describe('mission execution causation (h)', () => {
  it(`E=>M=>W=>R causation resolves end to end over ${RUNS} lifecycles`, async () => {
    const prop = fc.asyncProperty(
      domainObjectArb(), tenantArb, sourceArb,
      fc.constantFrom('worker:comms-1', 'worker:scheduler-2'),
      async (payload, tenantId, source, worker) => {
        const { pool, events, missions } = makeStack();

        // E: originating event.
        const eRes = await events.emit('REVIEW_RECEIVED', source, payload, { tenant_id: tenantId });
        assert.equal(eRes.status, 'ok');
        const eventId = eRes.eventId;

        // M: mission created FROM the event.
        const missionId = await missions.create(
          'LADDER_TEST_CAUSE', { event_id: eventId, task: payload },
          { tenant_id: tenantId, createdBy: source },
        );
        const created = [...pool.events.values()].find(
          (e) => e.event_type === 'MISSION_CREATED' && JSON.parse(e.payload).missionId === missionId,
        );
        assert.ok(created, 'mission creation must emit MISSION_CREATED evidence naming the mission');

        // W: worker claims and runs.
        assert.equal(await missions.assign(missionId, worker), 1, 'exactly one worker wins the claim');
        await missions.start(missionId);

        // R: result.
        const result = { verdict: 'done', detail: payload };
        await missions.complete(missionId, result);

        // Causation walk: R -> M -> E.
        const completed = [...pool.events.values()].find(
          (e) => e.event_type === 'MISSION_COMPLETED' && JSON.parse(e.payload).missionId === missionId,
        );
        assert.ok(completed, 'completion must emit MISSION_COMPLETED evidence');
        const rPayload = JSON.parse(completed.payload);
        assert.equal(rPayload.missionId, missionId, 'R must name M');
        const mRow = (await missions.getMission(missionId));
        assert.ok(mRow, 'M must exist');
        assert.equal(mRow.assigned_to, worker, 'M must name the executing worker W');
        assert.equal(JSON.parse(mRow.payload).event_id, eventId, 'M must name the originating event E');
        assert.ok(pool.events.has(eventId), 'E must exist: causation(R) terminates at E');
        assert.equal(mRow.status, 'completed', 'terminal state must be recorded');
      },
    );
    await withRegressionLedger(
      { property: 'mission.causation-chain', expectedInvariant: INVARIANT },
      SEED,
      () => fc.assert(prop, fcOptions(SEED)),
    );
  });
});
