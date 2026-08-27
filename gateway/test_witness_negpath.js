const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { WitnessWorker, registerCanonicalWorkers } = require('../ping-runtime/workers/canonical_workers');

// ─── Test runner ──────────────────────────────────────────────────────
let passed = 0, failed = 0;
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

async function run() {
  console.log('=== WitnessWorker Negative-Path (W7) Tests ===\n');
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (err) {
      console.log(`✗ ${name}`);
      console.log(`  ${err.message}`);
      failed++;
    }
  }
  console.log(`\n=== Summary ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

// ─── Mock EventRuntime (mirrors production spine folding semantics) ───
class MockEventRuntime {
  constructor() {
    this._emitted = [];
    this._handlers = new Map();
  }

  async emit(eventType, source, payload, options = {}) {
    const metadata = {
      ...(options.metadata || {}),
      namespace: options.namespace,
      correlation_id: options.correlation_id,
      causation_id: options.causation_id,
    };
    const event = {
      event_id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      event_type: eventType,
      source,
      payload,
      metadata,
      namespace: options.namespace,
      correlation_id: options.correlation_id,
      causation_id: options.causation_id,
      timestamp: new Date().toISOString(),
    };
    this._emitted.push(event);
    const handlers = this._handlers.get(eventType) || [];
    for (const h of handlers) {
      await h(event);
    }
    return { status: 'ok', event_id: event.event_id };
  }

  on(eventType, handler) {
    if (!this._handlers.has(eventType)) {
      this._handlers.set(eventType, []);
    }
    this._handlers.get(eventType).push(handler);
  }

  getEmitted() { return this._emitted; }
  emittedOf(type) { return this._emitted.filter((e) => e.event_type === type); }
}

function makeTrigger(overrides = {}) {
  return {
    event_id: 'evt-upstream-1',
    event_type: 'REPLAY_COMPLETED',
    namespace: 'tenant::hpp',
    metadata: {
      correlation_id: 'corr-root-1',
      causation_id: 'evt-replay-parent',
      confidence: 0.8,
    },
    payload: {
      documentId: 'doc_1',
      replay: {
        verified: true,
        reason: 'kernel_verified',
      },
      upstreamEventId: 'evt-replay-parent',
    },
    ...overrides,
  };
}

// WIT-NEG-1: Verified replay → witness attests normally (WITNESS_CREATED)
test('WIT-NEG-1: verified replay → WITNESS_CREATED, status ok', async () => {
  const eventRuntime = new MockEventRuntime();
  const worker = new WitnessWorker({ eventRuntime });

  const result = await worker.handle(makeTrigger());

  assert.equal(result.status, 'ok');
  assert.equal(result.witness.attestation, 'witness-evt-upstream-1');
  const created = eventRuntime.emittedOf('WITNESS_CREATED');
  assert.equal(created.length, 1);
  assert.equal(created[0].payload.documentId, 'doc_1');
  assert.equal(created[0].metadata.namespace, 'tenant::hpp');
  const rejected = eventRuntime.emittedOf('WITNESS_REJECTED');
  assert.equal(rejected.length, 0);
});

// WIT-NEG-2: No-provider replay (verified: false) → REFUSES, WITNESS_REJECTED
test('WIT-NEG-2: unverified replay (no_replay_provider) → WITNESS_REJECTED, no WITNESS_CREATED', async () => {
  const eventRuntime = new MockEventRuntime();
  const worker = new WitnessWorker({ eventRuntime });

  const result = await worker.handle(makeTrigger({
    payload: {
      documentId: 'doc_1',
      replay: { verified: false, reason: 'no_replay_provider' },
    },
  }));

  assert.equal(result.status, 'rejected');
  assert.equal(result.reason, 'unverified_replay:no_replay_provider');
  const created = eventRuntime.emittedOf('WITNESS_CREATED');
  assert.equal(created.length, 0, 'must NOT attest an unverified replay');
  const rejected = eventRuntime.emittedOf('WITNESS_REJECTED');
  assert.equal(rejected.length, 1);
  assert.equal(rejected[0].payload.reason, 'unverified_replay:no_replay_provider');
  assert.equal(rejected[0].payload.upstreamEventId, 'evt-upstream-1');
});

// WIT-NEG-3: kernel_error replay → WITNESS_REJECTED with kernel_error reason
test('WIT-NEG-3: kernel_error replay → WITNESS_REJECTED (kernel_error)', async () => {
  const eventRuntime = new MockEventRuntime();
  const worker = new WitnessWorker({ eventRuntime });

  const result = await worker.handle(makeTrigger({
    payload: {
      documentId: 'doc_1',
      replay: { verified: false, reason: 'kernel_error', error: 'boom' },
    },
  }));

  assert.equal(result.status, 'rejected');
  const rejected = eventRuntime.emittedOf('WITNESS_REJECTED');
  assert.equal(rejected.length, 1);
  assert.equal(rejected[0].payload.reason, 'unverified_replay:kernel_error');
});

// WIT-NEG-4: Missing replay object → REFUSES (cannot attest without evidence)
test('WIT-NEG-4: missing replay object → WITNESS_REJECTED', async () => {
  const eventRuntime = new MockEventRuntime();
  const worker = new WitnessWorker({ eventRuntime });

  const result = await worker.handle(makeTrigger({
    payload: { documentId: 'doc_1' }, // no replay key at all
  }));

  assert.equal(result.status, 'rejected');
  const created = eventRuntime.emittedOf('WITNESS_CREATED');
  assert.equal(created.length, 0, 'must NOT fabricate attestation without replay evidence');
  const rejected = eventRuntime.emittedOf('WITNESS_REJECTED');
  assert.equal(rejected.length, 1);
  assert.equal(rejected[0].payload.reason, 'unverified_replay:replay_not_verified');
});

// WIT-NEG-5: Direct WITNESS_CREATE command still attests (no regression)
test('WIT-NEG-5: WITNESS_CREATE direct command still attests normally', async () => {
  const eventRuntime = new MockEventRuntime();
  const worker = new WitnessWorker({ eventRuntime });

  const result = await worker.handle(makeTrigger({ event_type: 'WITNESS_CREATE' }));

  assert.equal(result.status, 'ok');
  const created = eventRuntime.emittedOf('WITNESS_CREATED');
  assert.equal(created.length, 1);
  const rejected = eventRuntime.emittedOf('WITNESS_REJECTED');
  assert.equal(rejected.length, 0);
});

// WIT-NEG-6: WITNESS_REJECTED registered in event_registry.json (governance gate)
test('WIT-NEG-6: WITNESS_REJECTED is registered in event_registry.json', () => {
  const registryPath = path.join(__dirname, 'generated', 'event_registry.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  const types = registry.events.map((e) => e.event_type);
  assert.ok(types.includes('WITNESS_REJECTED'), 'WITNESS_REJECTED must be registered');
  assert.ok(types.includes('WITNESS_CREATED'), 'WITNESS_CREATED must remain registered');
});

// WIT-NEG-7: Trace fields preserved on WITNESS_REJECTED emission
test('WIT-NEG-7: WITNESS_REJECTED preserves correlation/causation/namespace', async () => {
  const eventRuntime = new MockEventRuntime();
  const worker = new WitnessWorker({ eventRuntime });

  await worker.handle(makeTrigger({
    payload: { documentId: 'doc_1', replay: { verified: false, reason: 'kernel_failed' } },
  }));

  const rejected = eventRuntime.emittedOf('WITNESS_REJECTED');
  assert.equal(rejected.length, 1);
  assert.equal(rejected[0].metadata.correlation_id, 'corr-root-1');
  assert.equal(rejected[0].metadata.causation_id, 'evt-upstream-1');
  assert.equal(rejected[0].metadata.namespace, 'tenant::hpp');
});

// WIT-NEG-8: registerCanonicalWorkers wires WitnessWorker with REPLAY_COMPLETED
test('WIT-NEG-8: WitnessWorker registered with REPLAY_COMPLETED event type', () => {
  const registrations = [];
  const workerRuntime = {
    register(name, worker, opts) {
      registrations.push({ name, worker, opts });
    },
  };
  const options = { eventRuntime: new MockEventRuntime() };
  registerCanonicalWorkers(workerRuntime, options);
  const witness = registrations.find((r) => r.name === 'witness');
  assert.ok(witness, 'witness worker must be registered');
  assert.ok(witness.opts.eventTypes.includes('REPLAY_COMPLETED'));
  assert.ok(witness.opts.eventTypes.includes('WITNESS_CREATE'));
});

run();
