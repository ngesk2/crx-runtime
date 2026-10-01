'use strict';
/**
 * T3 metamorphic property — restart convergence (k).
 *
 * WHAT INVARIANT?
 *   execute prefix -> crash -> restart -> continue  ===  uninterrupted
 *   execution. The event log is the source of truth; derived state is
 *   checkpointed as canonical bytes and restored on restart; the final
 *   state after a crash+restart is byte-identical to the state of a run
 *   that never crashed.
 * WHO OWNS IT? ReplayStateMachine (gateway/replay/kernel/) — the fold —
 *   plus CanonicalBytes (checkpoint codec). The property drives only public
 *   API: constructor(initialState), applyEvent, getState.
 * HOW CAN IT FAIL? Checkpoint codec loss (Map vs plain object), non-determinism
 *   in applyEvent across restarts, internal caches (seenEventIds) diverging
 *   the restored fold.
 * WHAT ATTACK DISPROVES IT? Crash at every possible prefix length k of a
 *   generated stream; compare the restarted final state digest against the
 *   uninterrupted digest.
 * WHAT EVIDENCE PROVES IT? Fixed-seed fast-check over streams x crash points.
 * CAN IT BE REPLAYED? Yes: seed + path.
 * DOES THE FAILURE BECOME PERMANENT REGRESSION KNOWLEDGE? Yes, BUG- ledger.
 * WHY CAN EXISTING RUNNER + LIBRARY + EXISTING PING AUTHORITY NOT EXPRESS THIS?
 *   node:test + fast-check + the existing replay kernel. This is a
 *   metamorphic relation over existing behavior, not a new runtime.
 *
 * Metamorphic relation: MR-restart(stream, k):
 *   fold(stream[0..n])  ==  restore(checkpoint(fold(stream[0..k]))) then fold(stream[k+1..n])
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { fc, replayStreamArb } = require('../_support/arbitraries');
const { fcOptions, RUNS } = require('../_support/budget');
const { withRegressionLedger } = require('../_support/regression');
const { CanonicalBytes } = require('../../ping-runtime/authorities/canonical_authority.js');
const { CanonicalEventEnvelope } = require('../../gateway/replay/kernel/canonical_event_envelope.js');
const { ReplayStateMachine } = require('../../gateway/replay/kernel/replay_state_machine.js');

const SEED = 20260940;
const INVARIANT = 'crash+restart+continue produces byte-identical final state to uninterrupted execution';

// Checkpoint codec: state -> canonical bytes -> state. Uses only CanonicalBytes.
function checkpoint(state) {
  const plain = {
    state_version: state.state_version,
    artifacts: Object.fromEntries([...state.artifacts.entries()].map(([id, a]) => [id, { ...a }])),
  };
  return CanonicalBytes.serialize(plain);
}
function restore(bytes) {
  const plain = CanonicalBytes.deserialize(bytes);
  return {
    state_version: plain.state_version,
    artifacts: new Map(Object.entries(plain.artifacts || {})),
  };
}
function stateDigest(state) {
  return checkpoint(state).toString('hex');
}

describe('restart convergence (k)', () => {
  it(`crash at k, restart, continue === uninterrupted over ${RUNS} (stream, k) pairs`, () => {
    const streamWithCrashPoint = replayStreamArb(12).chain((defs) =>
      fc.integer({ min: 0, max: defs.length }).map((k) => ({ defs, k })),
    );
    const prop = fc.property(streamWithCrashPoint, ({ defs, k }) => {
      const envelopes = defs.map((d) => new CanonicalEventEnvelope(d));
      // Uninterrupted execution.
      const smFull = new ReplayStateMachine();
      for (const e of envelopes) smFull.applyEvent(e);
      const uninterruptedDigest = stateDigest(smFull.getState());

      // Crash at k: checkpoint the prefix state as canonical bytes, drop everything.
      const smPrefix = new ReplayStateMachine();
      for (let i = 0; i < k; i++) smPrefix.applyEvent(envelopes[i]);
      const checkpointBytes = checkpoint(smPrefix.getState());

      // Restart: restore from the checkpoint bytes, continue with the suffix.
      // NOTE: lineage uses artifact-id parents only (see arbitraries), so the
      // restored machine — with fresh internal caches — resolves parents
      // from the restored artifact map exactly as the uninterrupted fold does.
      const smRestart = new ReplayStateMachine(restore(checkpointBytes));
      for (let i = k; i < envelopes.length; i++) smRestart.applyEvent(envelopes[i]);
      const restartedDigest = stateDigest(smRestart.getState());

      assert.equal(
        restartedDigest, uninterruptedDigest,
        `restart at k=${k} of ${envelopes.length} must converge to the uninterrupted state`,
      );
      // The checkpoint itself must be faithful: re-checkpointing the restored
      // prefix state is byte-identical (no codec loss at the crash boundary).
      assert.equal(
        checkpoint(restore(checkpointBytes)).toString('hex'),
        checkpointBytes.toString('hex'),
        'checkpoint codec must be lossless',
      );
    });
    withRegressionLedger(
      { property: 'metamorphic.restart-convergence', expectedInvariant: INVARIANT },
      SEED,
      () => fc.assert(prop, fcOptions(SEED)),
    );
  });
});
