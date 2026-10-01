'use strict';
/**
 * T2 constitutional property — originator preservation (i).
 *
 * WHAT INVARIANT?
 *   An authenticated principal P survives the pipeline unless a DOCUMENTED
 *   authority transformation occurs. Two concrete PING surfaces:
 *     1. tenant_capability_grant: grant.principal issued at validate time is
 *        byte-identical at check time and in break-glass audit records; no
 *        hop rewrites it, and a mismatched tenant/capability/purpose denies
 *        WITHOUT touching the principal.
 *     2. event->mission chain: the originator identities the runtime records
 *        (event source, mission created_by) survive verbatim in the stored
 *        rows; where the emitting identity changes (worker -> mission-runtime
 *        on MISSION_COMPLETED) it is the documented authority, never silent.
 * WHO OWNS IT? tenant_capability_grant.js (grant pipeline) +
 *   UnifiedEventRuntime.emit + MissionRuntime.create
 *   (ping-runtime/runtime/tenant_capability_grant.js,
 *   ping-runtime/events/unified_event_runtime.js,
 *   ping-runtime/orchestration/mission_runtime.js).
 * HOW CAN IT FAIL? A hop that normalizes/rewrites the principal (case-fold,
 *   prefix-strip); an audit record that names a different invoker; source or
 *   created_by dropped between emit and row.
 * WHAT ATTACK DISPROVES IT? Generate grants and requests; assert principal
 *   stability across validate->check->audit; generate events/missions and
 *   assert stored originator fields equal the issued ones.
 * WHAT EVIDENCE PROVES IT? Fixed-seed fast-check, zero counterexamples.
 * CAN IT BE REPLAYED? Yes: seed + path.
 * DOES THE FAILURE BECOME PERMANENT REGRESSION KNOWLEDGE? Yes, BUG- ledger.
 * WHY CAN EXISTING RUNNER + LIBRARY + EXISTING PING AUTHORITY NOT EXPRESS THIS?
 *   node:test + fast-check + existing authorities. KNOWN GAP (not papered
 *   over): ping-runtime has no cross-hop authenticated-principal field on
 *   mission payloads — TEST_GAP_CLASS material for the JEV shadow triage,
 *   not a property this suite can honestly assert today.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { fc, grantArb, domainObjectArb, sourceArb, tenantArb } = require('../_support/arbitraries');
const { fcOptions, RUNS } = require('../_support/budget');
const { withRegressionLedger } = require('../_support/regression');
const { PgStub } = require('../_support/pg_stub');
const { validateGrant, checkGrant } = require('../../ping-runtime/runtime/tenant_capability_grant.js');
const { UnifiedEventRuntime } = require('../../ping-runtime/events/unified_event_runtime.js');
const { MissionRuntime } = require('../../ping-runtime/orchestration/mission_runtime.js');

const SEED = 20260938;
const INVARIANT = 'principal/originator identity survives the pipeline; only documented authority transformations change the emitting identity';

describe('originator preservation (i)', () => {
  it(`grant principal survives validate->check->audit unchanged over ${RUNS} grants`, () => {
    const prop = fc.property(grantArb, (grant) => {
      const issued = JSON.parse(JSON.stringify(grant));
      assert.ok(validateGrant(grant).valid, 'generated grants must be valid');
      const audits = [];
      const res = checkGrant(grant, {
        capability: grant.capability, tenant: grant.tenant, purpose: grant.purpose,
      }, { now: Date.parse(grant.expiry) - 1000, onAudit: (r) => audits.push(r) });
      assert.ok(res.authorized, 'matching request must authorize');
      assert.equal(grant.principal, issued.principal, 'principal must not be rewritten by check');
      for (const a of audits) {
        assert.equal(a.principal, issued.principal, 'audit record must name the issued principal');
      }
      // Denials must not launder the principal either.
      const denied = checkGrant(grant, { capability: grant.capability, tenant: 'other-tenant', purpose: grant.purpose });
      assert.ok(!denied.authorized, 'tenant mismatch must deny');
      assert.equal(grant.principal, issued.principal, 'denial must not touch the principal');
    });
    withRegressionLedger(
      { property: 'principal.grant-preservation', expectedInvariant: INVARIANT },
      SEED,
      () => fc.assert(prop, fcOptions(SEED)),
    );
  });

  it(`event source and mission created_by survive to the stored rows over ${RUNS} cases`, async () => {
    const prop = fc.asyncProperty(
      domainObjectArb(), sourceArb, tenantArb,
      async (payload, source, tenantId) => {
        const pool = new PgStub();
        const events = new UnifiedEventRuntime({ pool });
        const missions = new MissionRuntime({ pool, eventRuntime: events });

        const eRes = await events.emit('REVIEW_RECEIVED', source, payload, { tenant_id: tenantId });
        assert.equal(pool.events.get(eRes.eventId).source, source, 'event source must survive emit->row');

        const missionId = await missions.create('LADDER_TEST_ORIGIN', { event_id: eRes.eventId }, {
          tenant_id: tenantId, createdBy: source,
        });
        const mRow = await missions.getMission(missionId);
        assert.equal(mRow.created_by, source, 'mission created_by must survive create->row');

        // Documented authority transformation: completion evidence is emitted
        // BY mission-runtime, not by the worker. The hop is named, not silent.
        await missions.assign(missionId, 'worker:comms-1');
        await missions.start(missionId);
        await missions.complete(missionId, { ok: true });
        const completed = [...pool.events.values()].find(
          (e) => e.event_type === 'MISSION_COMPLETED' && JSON.parse(e.payload).missionId === missionId,
        );
        assert.ok(completed, 'completion evidence must exist');
        assert.equal(completed.source, 'mission-runtime',
          'the emitting identity on completion is the documented authority (mission-runtime), never an anonymous hop');
      },
    );
    await withRegressionLedger(
      { property: 'principal.chain-originator', expectedInvariant: INVARIANT },
      SEED + 1,
      () => fc.assert(prop, fcOptions(SEED + 1)),
    );
  });
});
