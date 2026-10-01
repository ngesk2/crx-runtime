'use strict';
/**
 * T2 constitutional property — authority uniqueness (g).
 *
 * WHAT INVARIANT?
 *   Every canonical decision type resolves to exactly ONE reachable
 *   authority — not zero, not two. For verdict-class events the single
 *   admission choke point (UnifiedEventRuntime._assertVerdictAuthority)
 *   binds each event type to exactly one producer source, and the binding
 *   matches the registry's authority_owner.
 * WHO OWNS IT? UnifiedEventRuntime (verdict admission) +
 *   gateway/generated/event_registry.json (authority_owner per event type).
 *   This adapts the APPROACH of tests/certification/authority_purity.test.js
 *   (scan a declared authority surface and assert a structural property),
 *   pointed at decision->authority resolution instead of import purity.
 * HOW CAN IT FAIL? A verdict type missing from VERDICT_PRODUCERS (zero
 *   authorities: anyone may forge it), a duplicated/conflicting binding
 *   (two authorities), registry drift (registry names an owner the choke
 *   point does not enforce).
 * WHAT ATTACK DISPROVES IT? Enumerate the registry; for each verdict type
 *   assert exactly one bound producer and registry/choke-point agreement;
 *   fuzz (eventType, source, payload) triples and assert the admit/reject
 *   decision is deterministic and matches the single-authority rule.
 * WHAT EVIDENCE PROVES IT? Fixed-seed fast-check over generated triples +
 *   exhaustive registry scan: zero counterexamples.
 * CAN IT BE REPLAYED? Yes: seed + path.
 * DOES THE FAILURE BECOME PERMANENT REGRESSION KNOWLEDGE? Yes, BUG- ledger.
 * WHY CAN EXISTING RUNNER + LIBRARY + EXISTING PING AUTHORITY NOT EXPRESS THIS?
 *   node:test + fast-check over the existing runtime and registry. The
 *   authority under test is PING's own; no new authority is created.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { fc } = require('../_support/arbitraries');
const { fcOptions, RUNS } = require('../_support/budget');
const { withRegressionLedger } = require('../_support/regression');
const { UnifiedEventRuntime } = require('../../ping-runtime/events/unified_event_runtime.js');

const SEED = 20260936;
const INVARIANT = 'every canonical decision (verdict-class event) type resolves to exactly one reachable authority';

// Registry authority_owner -> runtime producer source string (documented in
// unified_event_runtime.js: VERDICT_PRODUCERS binds owners to source strings).
const OWNER_TO_PRODUCER = {
  ReplayWorker: 'replay',
  WitnessWorker: 'witness',
  LineageWorker: 'lineage',
  JevShadowWorker: 'jev-shadow',
};

const VERDICT_TYPES = Object.keys({
  REPLAY_COMPLETED: 1, WITNESS_CREATED: 1, WITNESS_REJECTED: 1, LINEAGE_CREATED: 1, JEV_DECISION_EVALUATED: 1,
});

function loadRegistry() {
  const p = path.join(__dirname, '..', '..', 'gateway', 'generated', 'event_registry.json');
  return JSON.parse(fs.readFileSync(p, 'utf8')).events;
}

function qualifyingPayload(eventType) {
  switch (eventType) {
    case 'REPLAY_COMPLETED': return { replay: { verified: true } };
    case 'WITNESS_CREATED': return { witness: { attestation: 'att' }, upstreamEventId: 'e-1' };
    case 'WITNESS_REJECTED': return { reason: 'bad', upstreamEventId: 'e-1' };
    case 'LINEAGE_CREATED': return { lineage: {}, upstreamEventId: 'e-1' };
    case 'JEV_DECISION_EVALUATED': return { mode: 'shadow', evaluations: [] };
    default: return {};
  }
}

describe('authority uniqueness (g)', () => {
  it('registry: every verdict-class decision type names exactly one owner, matching the choke point', () => {
    const events = loadRegistry();
    const byType = new Map(events.map((e) => [e.event_type, e]));
    const rt = new UnifiedEventRuntime({});
    for (const t of VERDICT_TYPES) {
      const entry = byType.get(t);
      assert.ok(entry, `verdict type ${t} must exist in the registry (zero authorities is a failure)`);
      assert.ok(entry.authority_owner, `verdict type ${t} must name an authority_owner`);
      const producer = OWNER_TO_PRODUCER[entry.authority_owner];
      assert.ok(producer, `authority_owner ${entry.authority_owner} must map to exactly one producer source`);
      // The choke point must enforce the same single producer.
      const check = rt._assertVerdictAuthority(t, producer, qualifyingPayload(t));
      assert.ok(check.ok, `choke point must admit the bound producer for ${t}`);
      const impostor = rt._assertVerdictAuthority(t, producer === 'replay' ? 'witness' : 'replay', qualifyingPayload(t));
      assert.ok(!impostor.ok, `choke point must reject a second claimant for ${t} (two authorities is a failure)`);
    }
  });

  it(`admit/reject is deterministic and single-authority over ${RUNS} generated triples`, () => {
    const rt = new UnifiedEventRuntime({});
    const prop = fc.property(
      fc.constantFrom(...VERDICT_TYPES, 'REVIEW_RECEIVED', 'CUSTOMER_CREATED'),
      fc.constantFrom('replay', 'witness', 'lineage', 'jev-shadow', 'intruder'),
      fc.boolean(),
      (eventType, source, withProvenance) => {
        const payload = withProvenance ? qualifyingPayload(eventType) : { junk: 1 };
        const first = rt._assertVerdictAuthority(eventType, source, payload);
        const second = rt._assertVerdictAuthority(eventType, source, payload);
        assert.deepEqual(second, first, 'verdict admission must be deterministic');
        if (VERDICT_TYPES.includes(eventType)) {
          const expectedProducer = OWNER_TO_PRODUCER[
            loadRegistry().find((e) => e.event_type === eventType).authority_owner
          ];
          const admitted = first.ok;
          assert.equal(
            admitted, source === expectedProducer && withProvenance,
            `${eventType} must admit exactly the bound producer with qualifying provenance, nothing else`,
          );
        } else {
          assert.ok(first.ok, 'non-verdict types are not gated by the verdict choke point');
        }
      },
    );
    withRegressionLedger(
      { property: 'authority.verdict-uniqueness', expectedInvariant: INVARIANT },
      SEED,
      () => fc.assert(prop, fcOptions(SEED)),
    );
  });
});
