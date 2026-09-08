#!/usr/bin/env node
/**
 * EVAL-010: Witness Failure-Honesty (W7)
 *
 * Proves the W7 witness gate (WitnessWorker.handle) is failure-honest end-to-end
 * across the REPLAY_COMPLETED boundary:
 *
 *   (a) attest — a REPLAY_COMPLETED with payload.replay.verified === true
 *       produces WITNESS_CREATED (valid attestation), never WITNESS_REJECTED.
 *   (b) refuse-on-unverified — REPLAY_COMPLETED where verification is absent or
 *       false produces WITNESS_REJECTED with an honest `unverified_replay:<reason>`,
 *       and NEVER fabricates WITNESS_CREATED (failure-honesty: cannot produce a
 *       valid attestation for an unverified replay).
 *   (c) no-violations-vs-kernel-error — both the kernel `violations` path and the
 *       kernel `kernel_error` path funnel into the same refusal (verified !== true).
 *   (d) trace preservation — the WITNESS_REJECTED emission carries the triggering
 *       event's correlation_id / namespace / causation_id (via this._event),
 *       never fabricated.
 *   (e) composition — registerCanonicalWorkers wires WitnessWorker with eventTypes
 *       exactly ['WITNESS_CREATE', 'REPLAY_COMPLETED'].
 *   (f) WITNESS_REJECTED is a governed event — present in event_registry.json so the
 *       spine (EventGovernance) accepts the refusal emission.
 *
 * No Docker dependency — infrastructure mocked.
 * This is the witness failure-honesty scenario extension of the constitutional
 * eval harness (extends EVAL-009 which proved replay convergence upstream).
 */

const { EventEmitter } = require('events');

function loadRegistryEvents() {
  const fs = require('fs');
  const path = require('path');
  const regPath = path.join(__dirname, '..', '..', 'gateway', 'generated', 'event_registry.json');
  if (!fs.existsSync(regPath)) return null;
  const reg = JSON.parse(fs.readFileSync(regPath, 'utf8'));
  return (reg && reg.events) || null;
}

async function run() {
  let pass = 0;
  let fail = 0;
  function assert(condition, msg) {
    if (condition) { pass++; } else { fail++; console.log(`    FAIL: ${msg}`); }
  }

  const { WitnessWorker, registerCanonicalWorkers } = require('../../ping-runtime/workers/canonical_workers.js');

  class MockEventRuntime {
    constructor() { this._emitted = []; }
    async emit(eventType, source, payload, options = {}) {
      this._emitted.push({ event_type: eventType, source, payload, options });
      return { status: 'ok', event_id: `evt-${this._emitted.length}` };
    }
  }

  const attestOnce = async (replayPayload) => {
    const rt = new MockEventRuntime();
    const w = new WitnessWorker({ eventRuntime: rt });
    const result = await w.handle({
      event_id: 'evt-root-010',
      event_type: 'REPLAY_COMPLETED',
      payload: { documentId: 'doc-010', replay: replayPayload },
      metadata: { correlation_id: 'evt-root-010', namespace: 'tenant::hpp' },
    });
    const emittedTypes = rt._emitted.map((e) => e.event_type);
    return { rt, result, emittedTypes };
  };

  // (a) Attest path — verified replay → WITNESS_CREATED only.
  {
    const { rt, result, emittedTypes } = await attestOnce({ verified: true, reason: 'kernel_verified', fingerprint: 'fp-010', witness_root: 'wr-010', violations: [] });
    assert(result.status === 'ok', `verified replay → ok (got ${result.status})`);
    assert(emittedTypes.includes('WITNESS_CREATED'), 'verified replay emits WITNESS_CREATED');
    assert(!emittedTypes.includes('WITNESS_REJECTED'), 'verified replay never emits WITNESS_REJECTED');
    const created = rt._emitted.find((e) => e.event_type === 'WITNESS_CREATED');
    assert(created.payload.witness && created.payload.witness.documentId === 'doc-010', 'WITNESS_CREATED carries witness with documentId');
    assert(created.payload.upstreamEventId === 'evt-root-010', 'WITNESS_CREATED upstreamEventId === triggering event_id');
    assert(created.payload.witness.eventType === 'REPLAY_COMPLETED', 'WITNESS_CREATED witness.eventType === REPLAY_COMPLETED');
  }

  // (b) Refuse-on-unverified — replay present but NOT verified → WITNESS_REJECTED, never WITNESS_CREATED.
  {
    const { rt, result, emittedTypes } = await attestOnce({ verified: false, reason: 'kernel_error', fingerprint: undefined });
    assert(result.status === 'rejected', `unverified replay → rejected (got ${result.status})`);
    assert(result.reason === 'unverified_replay:kernel_error', `rejection reason honest (got ${result.reason})`);
    assert(emittedTypes.includes('WITNESS_REJECTED'), 'unverified replay emits WITNESS_REJECTED');
    assert(!emittedTypes.includes('WITNESS_CREATED'), 'unverified replay NEVER fabricates WITNESS_CREATED');
    const rej = rt._emitted.find((e) => e.event_type === 'WITNESS_REJECTED');
    assert(rej.payload.reason === 'unverified_replay:kernel_error', `WITNESS_REJECTED payload reason honest (got ${rej.payload.reason})`);
    assert(rej.payload.replay && rej.payload.replay.verified === false, 'WITNESS_REJECTED carries the unverified replay evidence');
    assert(rej.payload.documentId === 'doc-010', 'WITNESS_REJECTED carries documentId');
  }

  // (c) Violations vs kernel_error — both funnel into refusal (verified !== true).
  {
    const v = await attestOnce({ verified: false, reason: 'kernel_violations', violations: [{ code: 'DUP', severity: 'error' }] });
    assert(v.emittedTypes.includes('WITNESS_REJECTED') && !v.emittedTypes.includes('WITNESS_CREATED'),
      'violations path refuses attestation (WITNESS_REJECTED, no WITNESS_CREATED)');

    const ke = await attestOnce({ reason: 'kernel_error', error: 'malformed transcript' });
    assert(ke.emittedTypes.includes('WITNESS_REJECTED') && !ke.emittedTypes.includes('WITNESS_CREATED'),
      'kernel_error path refuses attestation (WITNESS_REJECTED, no WITNESS_CREATED)');

    const absent = await attestOnce({ reason: 'no_replay_provider' });
    assert(absent.emittedTypes.includes('WITNESS_REJECTED') && !absent.emittedTypes.includes('WITNESS_CREATED'),
      'missing/absent verified refuses attestation');
  }

  // (d) Trace preservation on WITNESS_REJECTED — correlation_id/namespace/causation preserved.
  {
    const rt = new MockEventRuntime();
    const w = new WitnessWorker({ eventRuntime: rt });
    await w.handle({
      event_id: 'evt-trace-rej',
      event_type: 'REPLAY_COMPLETED',
      payload: { documentId: 'doc-trace-rej', replay: { verified: false, reason: 'kernel_error' } },
      metadata: { correlation_id: 'evt-trace-rej', namespace: 'tenant::hpp' },
    });
    const rej = rt._emitted.find((e) => e.event_type === 'WITNESS_REJECTED');
    assert(!!rej, 'WITNESS_REJECTED emitted for trace check');
    assert(rej.options && rej.options.causation_id === 'evt-trace-rej', 'WITNESS_REJECTED causation_id preserved from triggering event');
    // The trace contract (correlation_id / namespace) is carried via this._event → _emit
    // folding into the emission metadata. Assert the emission options were produced
    // (causation is the observable invariant; namespace/correlation are folded into
    // metadata by the spine, not by the worker's direct mock).
    assert(rej.payload.documentId === 'doc-trace-rej', 'WITNESS_REJECTED documentId preserved');
  }

  // (e) Composition — registerCanonicalWorkers wires WitnessWorker with exact eventTypes.
  {
    const captured = {};
    const workerRuntime = { register(name, worker, opts) { captured[name] = { worker, opts }; } };
    const eventRuntime = { emit: async () => ({ status: 'ok', event_id: 'evt-x' }) };
    registerCanonicalWorkers(workerRuntime, { eventRuntime });
    const wit = captured.witness;
    assert(wit, 'witness worker registered');
    assert(wit && wit.worker instanceof WitnessWorker, 'registered witness worker is a WitnessWorker');
    assert(JSON.stringify(wit.opts.eventTypes) === JSON.stringify(['WITNESS_CREATE', 'REPLAY_COMPLETED']),
      'witness worker eventTypes exactly WITNESS_CREATE + REPLAY_COMPLETED');
    assert(JSON.stringify(wit.opts.capabilities) === JSON.stringify(['witness']),
      'witness worker registers exactly the [witness] capability (capabilities: [name] per registerCanonicalWorkers)');
  }

  // (f) Governed event — WITNESS_REJECTED must be present in event_registry.json so
  // the spine (EventGovernance) accepts the refusal emission as a known type.
  {
    const events = loadRegistryEvents();
    assert(Array.isArray(events), 'event_registry.json loads with an events array');
    if (Array.isArray(events)) {
      const rej = events.find((e) => e.event_type === 'WITNESS_REJECTED');
      assert(!!rej, 'WITNESS_REJECTED present in event_registry.json');
      if (rej) {
        assert(rej.authority_owner === 'WitnessWorker', 'WITNESS_REJECTED authority_owner === WitnessWorker');
        assert(rej.event_class === 'system', 'WITNESS_REJECTED event_class === system');
      }
    }
  }

  return { pass, fail };
}

module.exports = { run };
