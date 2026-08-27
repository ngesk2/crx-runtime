#!/usr/bin/env node
/**
 * EVAL-009: Replay Convergence
 *
 * Proves the constitutional replay path (ReplayWorker → KernelReplayExecutionProvider
 * → deterministic kernel) is:
 *
 *   (a) deterministic — same transcript → same fingerprint + witness_root,
 *   (b) failure-honest — verified can never be true when the kernel reports
 *       violations or a kernel_error (malformed, duplicate, circular),
 *   (c) trace-preserving — source_event_id/correlation_id/namespace survive
 *       worker → provider execution, never fabricated,
 *   (d) composition-injected — registerCanonicalWorkers wires replayProvider
 *       onto the registered ReplayWorker exactly as production does.
 *
 * No Docker dependency — infrastructure mocked.
 * This is the replay scenario extension of the constitutional eval harness.
 */

const { EventEmitter } = require('events');

async function run() {
  let pass = 0;
  let fail = 0;
  function assert(condition, msg) {
    if (condition) { pass++; } else { fail++; console.log(`    FAIL: ${msg}`); }
  }

  const { ReplayWorker, registerCanonicalWorkers } = require('../../ping-runtime/workers/canonical_workers.js');
  const { KernelReplayExecutionProvider } = require('../../gateway/kernel_replay_execution_provider.js');

  class MockEventRuntime {
    constructor() { this._emitted = []; }
    async emit(eventType, source, payload, options = {}) {
      this._emitted.push({ event_type: eventType, source, payload, options });
      return { status: 'ok', event_id: `evt-${this._emitted.length}` };
    }
  }

  const cleanTranscript = [{
    event_id: 'evt-a',
    event_type: 'OBSERVATION_CREATED',
    payload: { text: 'alpha' },
    metadata: { correlation_id: 'evt-root-009' },
    timestamp: '2026-08-21T00:00:00.000Z',
  }, {
    event_id: 'evt-b',
    event_type: 'CLAIM_CREATED',
    payload: { claimId: 'claim-b' },
    metadata: { correlation_id: 'evt-root-009' },
    timestamp: '2026-08-21T00:00:01.000Z',
  }];

  // (a) Determinism: same transcript twice → identical fingerprint + witness_root.
  const rt1 = new MockEventRuntime();
  const w1 = new ReplayWorker({ eventRuntime: rt1, replayProvider: new KernelReplayExecutionProvider() });
  const r1 = await w1.handle({
    event_id: 'evt-root-009',
    event_type: 'REPLAY_VERIFY',
    payload: { documentId: 'doc-009', replay_events: cleanTranscript },
    metadata: { correlation_id: 'evt-root-009', namespace: 'tenant::hpp' },
  });

  const rt2 = new MockEventRuntime();
  const w2 = new ReplayWorker({ eventRuntime: rt2, replayProvider: new KernelReplayExecutionProvider() });
  const r2 = await w2.handle({
    event_id: 'evt-root-009',
    event_type: 'REPLAY_VERIFY',
    payload: { documentId: 'doc-009', replay_events: cleanTranscript },
    metadata: { correlation_id: 'evt-root-009', namespace: 'tenant::hpp' },
  });

  assert(r1.replay.verified === true, `clean transcript verified (got ${r1.replay.verified})`);
  assert(r2.replay.verified === true, `clean transcript verified on 2nd run`);
  assert(r1.replay.fingerprint === r2.replay.fingerprint,
    `replay is deterministic (fingerprint ${r1.replay.fingerprint} === ${r2.replay.fingerprint})`);
  assert(r1.replay.witness_root === r2.replay.witness_root,
    `witness root deterministic (${r1.replay.witness_root} === ${r2.replay.witness_root})`);
  assert((r1.replay.violations || []).length === 0, 'clean transcript has zero kernel violations');

  // (b) Failure-honesty: verified MUST be false when violations exist.
  const dupTranscript = [{
    event_id: 'evt-dup',
    event_type: 'OBSERVATION_CREATED',
    payload: { text: 'dup' },
    metadata: {},
    timestamp: '2026-08-21T00:00:00.000Z',
  }, {
    event_id: 'evt-dup',
    event_type: 'OBSERVATION_CREATED',
    payload: { text: 'dup again' },
    metadata: {},
    timestamp: '2026-08-21T00:00:01.000Z',
  }];
  const rt3 = new MockEventRuntime();
  const w3 = new ReplayWorker({ eventRuntime: rt3, replayProvider: new KernelReplayExecutionProvider() });
  const r3 = await w3.handle({
    event_id: 'evt-root-dup',
    event_type: 'REPLAY_VERIFY',
    payload: { documentId: 'doc-dup', replay_events: dupTranscript },
    metadata: { correlation_id: 'evt-root-dup', namespace: 'core::owner' },
  });
  // The kernel may either report violations OR a kernel_error for malformed input;
  // in BOTH cases verified must be false (never a fabricated true).
  assert(r3.replay.verified === false,
    `duplicate ID must not be trusted as verified (got ${r3.replay.verified}, reason ${r3.replay.reason})`);

  // (c) Trace preservation on clean path — authority evidence carries the exact
  // triggering event trace (preserved, not invented).
  const rt4 = new MockEventRuntime();
  const w4 = new ReplayWorker({ eventRuntime: rt4, replayProvider: new KernelReplayExecutionProvider() });
  await w4.handle({
    event_id: 'evt-root-trace',
    event_type: 'REPLAY_VERIFY',
    payload: { documentId: 'doc-trace', replay_events: cleanTranscript },
    metadata: { correlation_id: 'evt-root-trace', namespace: 'tenant::hpp' },
  });
  const completed = rt4._emitted.find((e) => e.event_type === 'REPLAY_COMPLETED');
  assert(!!completed, 'REPLAY_COMPLETED emitted on verified path');
  const ev = completed && completed.payload.authority;
  assert(ev, 'authority evidence block present');
  if (ev) {
    assert(ev.authority === 'ReplayWorker', 'evidence.authority === ReplayWorker');
    assert(ev.provider === 'KernelReplayExecutionProvider', 'evidence.provider actual');
    assert(ev.source_event_id === 'evt-root-trace', 'source_event_id preserved');
    assert(ev.correlation_id === 'evt-root-trace', 'correlation_id preserved');
    assert(ev.namespace === 'tenant::hpp', 'namespace preserved (no tenant→core leak)');
    assert(ev.verified === true, 'evidence.verified true on verified path');
  }

  // (d) Composition injection: registerCanonicalWorkers wires replayProvider onto
  // the registered ReplayWorker exactly as production does.
  const captured = {};
  const workerRuntime = { register(name, worker, opts) { captured[name] = { worker, opts }; } };
  const provider = new KernelReplayExecutionProvider();
  const eventRuntime = { emit: async () => ({ status: 'ok', event_id: 'evt-x' }) };
  registerCanonicalWorkers(workerRuntime, { eventRuntime, replayProvider: provider });
  const rw = captured.replay;
  assert(rw, 'replay worker registered');
  assert(rw && rw.worker instanceof ReplayWorker, 'registered replay worker is a ReplayWorker');
  assert(rw && rw.worker._replayProvider === provider,
    'production-composition injection: replayProvider wired onto registered worker');
  assert(JSON.stringify(rw.opts.eventTypes) === JSON.stringify(['REPLAY_VERIFY', 'PROJECTION_CREATED']),
    'replay worker eventTypes exactly REPLAY_VERIFY + PROJECTION_CREATED');

  // (e) No-provider honesty: verified=false + no_replay_provider, no fabricated ids.
  const rt5 = new MockEventRuntime();
  const w5 = new ReplayWorker({ eventRuntime: rt5 }); // no provider injected
  const r5 = await w5.handle({
    event_id: 'evt-root-np',
    event_type: 'REPLAY_VERIFY',
    payload: { documentId: 'doc-np' },
    metadata: { correlation_id: 'evt-root-np', namespace: 'core::system' },
  });
  assert(r5.replay.verified === false, 'no-provider path reported verified:false');
  assert(r5.replay.reason === 'no_replay_provider', 'no-provider reason honest');
  const npEv = rt5._emitted.find((e) => e.event_type === 'REPLAY_COMPLETED').payload.authority;
  assert(npEv.verified === false, 'no-provider authority evidence verified:false');
  assert(npEv.reason === 'no_replay_provider', 'no-provider authority evidence reason honest');
  assert(npEv.deterministic_execution_identity === undefined,
    'no fabricated deterministic identity on no-op path');
  assert(npEv.canonical_input_hash === undefined, 'no fabricated input hash on no-op path');

  return { pass, fail };
}

module.exports = { run };
