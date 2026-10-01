'use strict';
/**
 * T2/T4 constitutional property — replay determinism (d).
 *
 * WHAT INVARIANT?
 *   state(events) == state(replay(events)): two replays of the same event
 *   stream produce identical snapshots (canonical bytes, fingerprint,
 *   witness root, state version, artifact set). Replay is a pure function
 *   of the event log; nothing else may influence it.
 * WHO OWNS IT? DeterministicReplayEngine + ReplayEventStream
 *   (gateway/replay/kernel/ — the single replay runtime; there is no second
 *   one and this ladder creates none).
 * HOW CAN IT FAIL? Mutable shared state between replays, Date.now()/random
 *   in witness generation, iteration-order dependence (Map/Set insertion
 *   order leaking into hashes), invariant runner side effects.
 * WHAT ATTACK DISPROVES IT? Replay the same stream N times; replay prefix
 *   streams; mutate nothing between runs. Any divergence is a failure.
 * WHAT EVIDENCE PROVES IT? Fixed-seed fast-check over generated valid
 *   artifact-commit streams: all snapshot digests equal across replays.
 *   This ADAPTS the hand-rolled FCA-12 ordering fuzz
 *   (tests/certification/replay-ordering-fuzz.test.ts): same engine, same
 *   claim, now generative with shrinking instead of 100 fixed iterations.
 *   The original file is preserved untouched.
 * CAN IT BE REPLAYED? Yes: seed + path + the generated stream.
 * DOES THE FAILURE BECOME PERMANENT REGRESSION KNOWLEDGE? Yes, BUG- ledger.
 * WHY CAN EXISTING RUNNER + LIBRARY + EXISTING PING AUTHORITY NOT EXPRESS THIS?
 *   node:test + fast-check + the existing replay kernel. The engine is the
 *   authority; the property is the falsifier.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { fc, replayStreamArb } = require('../_support/arbitraries');
const { fcOptions, RUNS } = require('../_support/budget');
const { withRegressionLedger } = require('../_support/regression');
const { ReplayEventStream } = require('../../gateway/replay/kernel/replay_event_stream.js');
const { CanonicalEventEnvelope } = require('../../gateway/replay/kernel/canonical_event_envelope.js');
const { DeterministicReplayEngine } = require('../../gateway/replay/kernel/deterministic_replay_engine.js');

const SEED = 20260933;
const INVARIANT = 'two replays of the same events produce identical snapshots (bytes, fingerprint, witness root, state)';

function snapshot(result) {
  return {
    canonical_bytes: result.canonical_bytes.toString('hex'),
    fingerprint: result.fingerprint,
    witness_root: JSON.stringify(result.witness_root),
    state_version: result.state_version,
    artifact_count: result.artifact_count,
    artifacts: JSON.stringify([...result.state.artifacts.keys()].sort()),
  };
}

describe('replay determinism (d)', () => {
  it(`same stream replayed twice yields identical snapshots over ${RUNS} streams`, () => {
    const prop = fc.property(replayStreamArb(12), (defs) => {
      const envelopes = defs.map((d) => new CanonicalEventEnvelope(d));
      const engine = new DeterministicReplayEngine();
      const first = snapshot(engine.replay(new ReplayEventStream(envelopes)));
      const second = snapshot(engine.replay(new ReplayEventStream(envelopes)));
      assert.deepEqual(second, first, 'replay must be a pure function of the event stream');
      assert.equal(first.artifact_count, defs.length, 'every committed artifact must appear in the replayed state');
    });
    withRegressionLedger(
      { property: 'replay.determinism', expectedInvariant: INVARIANT },
      SEED,
      () => fc.assert(prop, fcOptions(SEED)),
    );
  });

  it(`FCA-12 ordering fuzz, generative: same order, repeated execution, zero divergence over ${RUNS} streams`, () => {
    // The original hand-rolled test replayed one fixed 3-event stream 100x.
    // This property keeps that claim and generalizes the stream.
    const prop = fc.property(replayStreamArb(8), (defs) => {
      const engine = new DeterministicReplayEngine();
      const roots = [];
      for (let i = 0; i < 5; i++) {
        const envelopes = defs.map((d) => new CanonicalEventEnvelope(d));
        roots.push(JSON.stringify(engine.replay(new ReplayEventStream(envelopes)).witness_root));
      }
      for (const r of roots) assert.equal(r, roots[0], 'witness root must not drift across repeated replays');
    });
    withRegressionLedger(
      { property: 'replay.ordering-fuzz-adapted', expectedInvariant: INVARIANT },
      SEED + 1,
      () => fc.assert(prop, fcOptions(SEED + 1)),
    );
  });
});
