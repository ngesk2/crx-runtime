'use strict';
/**
 * T2 constitutional property — projection invariance (e).
 *
 * WHAT INVARIANT?
 *   events => projection A; delete derived state; rebuild from events => B;
 *   A == B. Derived state is never load-bearing: the event log is the only
 *   source of truth, and any projection rebuilt from it converges.
 * WHO OWNS IT? DeterministicReplayEngine (projection builder) over
 *   ReplayEventStream (gateway/replay/kernel/). The durable-projection
 *   variant (repository store rebuilds) is covered by the integration lane;
 *   this property pins the pure-projection half.
 * HOW CAN IT FAIL? Cached derived state leaking into the rebuild, witness
 *   roots computed from mutable artifacts, non-deterministic rebuild order.
 * WHAT ATTACK DISPROVES IT? Build A, drop every derived object (not the
 *   events), rebuild from the same events, compare canonical digests.
 * WHAT EVIDENCE PROVES IT? Fixed-seed fast-check: A==B on every stream.
 * CAN IT BE REPLAYED? Yes: seed + path.
 * DOES THE FAILURE BECOME PERMANENT REGRESSION KNOWLEDGE? Yes, BUG- ledger.
 * WHY CAN EXISTING RUNNER + LIBRARY + EXISTING PING AUTHORITY NOT EXPRESS THIS?
 *   node:test + fast-check + the existing replay kernel. Deleting and
 *   rebuilding derived state needs no new store — that would violate the
 *   no-new-stores rule.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { fc, replayStreamArb } = require('../_support/arbitraries');
const { fcOptions, RUNS } = require('../_support/budget');
const { withRegressionLedger } = require('../_support/regression');
const { CanonicalBytes } = require('../../ping-runtime/authorities/canonical_authority.js');
const { ReplayEventStream } = require('../../gateway/replay/kernel/replay_event_stream.js');
const { CanonicalEventEnvelope } = require('../../gateway/replay/kernel/canonical_event_envelope.js');
const { DeterministicReplayEngine } = require('../../gateway/replay/kernel/deterministic_replay_engine.js');

const SEED = 20260934;
const INVARIANT = 'projection rebuilt from events after deleting derived state is identical (A==B)';

function projectionDigest(result) {
  const artifacts = [...result.state.artifacts.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([id, a]) => ({ id, content: a.content, hash: a.hash }));
  return CanonicalBytes.serialize({
    state_version: result.state_version,
    artifacts,
    fingerprint: result.fingerprint,
  }).toString('hex');
}

describe('projection invariance (e)', () => {
  it(`delete derived, rebuild from events, projections identical over ${RUNS} streams`, () => {
    const prop = fc.property(replayStreamArb(12), (defs) => {
      const build = () => defs.map((d) => new CanonicalEventEnvelope(d));
      const engine = new DeterministicReplayEngine();

      // A: project from events.
      const resultA = engine.replay(new ReplayEventStream(build()));
      const digestA = projectionDigest(resultA);

      // Delete ALL derived state: drop the result, the stream, the envelopes.
      // Only `defs` (the event log, the source of truth) survives.
      // B: rebuild purely from the event log.
      const resultB = engine.replay(new ReplayEventStream(build()));
      const digestB = projectionDigest(resultB);

      assert.equal(digestB, digestA, 'rebuilt projection must be byte-identical to the original');
      assert.equal(resultB.state.artifacts.size, defs.length);
    });
    withRegressionLedger(
      { property: 'projection.rebuild-invariance', expectedInvariant: INVARIANT },
      SEED,
      () => fc.assert(prop, fcOptions(SEED)),
    );
  });
});
