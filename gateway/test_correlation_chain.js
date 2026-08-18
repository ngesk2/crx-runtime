/**
 * Event Correlation Chain Tests
 *
 * Proves that correlation_id propagates correctly through the full worker
 * chain so that all events from the same originating observation share a
 * single correlation group. Without this fix, every downstream event gets
 * its own event_id as correlation_id, breaking grouping.
 *
 *   CORR-1: Emitting with explicit correlation_id → passes through to spine.
 *   CORR-2: Emitting without correlation_id → worker forwards parent event's correlation_id.
 *   CORR-3: IntelligenceWorker dual-emit preserves correlation_id.
 *   CORR-4: Full chain preserves root correlation_id across 4 hops.
 *   CORR-5: Namespace preserved alongside correlation_id.
 *
 * Run: node test_correlation_chain.js
 */

const assert = require('assert');

// ─── Test runner ──────────────────────────────────────────────────────
let passed = 0, failed = 0;
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

async function run() {
  console.log('=== Correlation Chain Tests ===\n');
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

// ─── Mock EventRuntime ────────────────────────────────────────────────

/**
 * Spy that records emit options for later assertion.
 * Each emit returns a fake event_id derived deterministically from the type.
 */
function spyEventRuntime() {
  const calls = [];
  const runtime = {
    _calls: calls,
    emit: async (eventType, source, payload, options = {}) => {
      // Generate deterministic event_id (mimics real SHA-256 from UnifiedEventRuntime)
      const id = `evt_${eventType}_${calls.length}`;
      calls.push({ eventType, source, payload, options, eventId: id });
      return { status: 'ok', eventId: id };
    },
    on: () => {},
  };
  return runtime;
}

// ─── Tests ────────────────────────────────────────────────────────────

test('CORR-1: Explicit correlation_id passes through BaseWorker._emit', async () => {
  const { BaseWorker } = require('../ping-runtime/workers/canonical_workers');
  const runtime = spyEventRuntime();
  const worker = new BaseWorker({ eventRuntime: runtime });

  await worker._emit('TEST_EVENT', { data: 1 }, {
    causation_id: 'causation_abc',
    correlation_id: 'corr_explicit',
  });

  assert.strictEqual(runtime._calls.length, 1);
  assert.strictEqual(runtime._calls[0].options.correlation_id, 'corr_explicit');
});

test('CORR-2: BaseWorker._emit forwards parent event correlation_id', async () => {
  const { BaseWorker } = require('../ping-runtime/workers/canonical_workers');
  const runtime = spyEventRuntime();
  const worker = new BaseWorker({ eventRuntime: runtime });

  // Set the triggering event (mimics WorkerRuntime dispatch setting _event)
  worker._event = {
    event_id: 'parent_event_123',
    event_type: 'OBSERVATION_CREATED',
    namespace: 'core::owner',
    metadata: {
      correlation_id: 'root_correlation_xyz',
      causation_id: 'grandparent_event',
    },
  };

  await worker._emit('CLAIM_CREATED', { data: 2 }, {
    causation_id: 'parent_event_123',
  });

  assert.strictEqual(runtime._calls.length, 1);
  // Should forward parent's correlation_id, NOT create a new one
  assert.strictEqual(runtime._calls[0].options.correlation_id, 'root_correlation_xyz');
  assert.strictEqual(runtime._calls[0].options.causation_id, 'parent_event_123');
});

test('CORR-3: IntelligenceWorker dual-emit preserves correlation_id', async () => {
  const { IntelligenceWorker } = require('../ping-runtime/workers/intelligence_worker');
  const runtime = spyEventRuntime();
  const worker = new IntelligenceWorker({ eventRuntime: runtime });

  worker._event = {
    event_id: 'biz_event_456',
    event_type: 'REVIEW_RECEIVED',
    namespace: 'tenant::hpp',
    metadata: {
      correlation_id: 'biz_correlation_789',
    },
  };

  await worker.handle(worker._event);

  // IntelligenceWorker emits CLASSIFICATION_CREATED + RECOMMENDATION_CREATED
  assert.strictEqual(runtime._calls.length, 2);
  assert.strictEqual(runtime._calls[0].eventType, 'CLASSIFICATION_CREATED');
  assert.strictEqual(runtime._calls[1].eventType, 'RECOMMENDATION_CREATED');

  // Both should preserve the root correlation_id
  assert.strictEqual(runtime._calls[0].options.correlation_id, 'biz_correlation_789');
  assert.strictEqual(runtime._calls[1].options.correlation_id, 'biz_correlation_789');
});

test('CORR-4: Full chain preserves root correlation_id across 4 hops', async () => {
  const { BaseWorker } = require('../ping-runtime/workers/canonical_workers');
  const runtime = spyEventRuntime();

  // Simulate 4-hop chain: root → observation → claim → classification
  // All should share the same correlation_id = root event's event_id

  const ROOT_EVENT_ID = 'root_doc_import_001';
  let prevEventId = ROOT_EVENT_ID;

  // Hop 1: ObservationWorker
  const obs = new BaseWorker({ eventRuntime: runtime });
  obs._event = {
    event_id: ROOT_EVENT_ID,
    event_type: 'DOCUMENT_IMPORTED',
    namespace: 'core::owner',
    metadata: { correlation_id: ROOT_EVENT_ID }, // Root sets its own correlation_id
  };
  await obs._emit('OBSERVATION_CREATED', { docId: 'doc1' }, {
    causation_id: ROOT_EVENT_ID,
  });
  const obsCorr = runtime._calls[0].options.correlation_id;
  assert.strictEqual(obsCorr, ROOT_EVENT_ID, 'Hop 1: observation should have root correlation');
  prevEventId = runtime._calls[0].eventId;

  // Hop 2: ClaimWorker
  const claim = new BaseWorker({ eventRuntime: runtime });
  claim._event = {
    event_id: prevEventId,
    event_type: 'OBSERVATION_CREATED',
    namespace: 'core::owner',
    metadata: { correlation_id: obsCorr },
  };
  await claim._emit('CLAIM_CREATED', { docId: 'doc1' }, {
    causation_id: prevEventId,
  });
  const claimCorr = runtime._calls[1].options.correlation_id;
  assert.strictEqual(claimCorr, ROOT_EVENT_ID, 'Hop 2: claim should have root correlation');
  prevEventId = runtime._calls[1].eventId;

  // Hop 3: ClassificationWorker
  const classif = new BaseWorker({ eventRuntime: runtime });
  classif._event = {
    event_id: prevEventId,
    event_type: 'CLAIM_CREATED',
    namespace: 'core::owner',
    metadata: { correlation_id: claimCorr },
  };
  await classif._emit('CLASSIFICATION_CREATED', { docId: 'doc1' }, {
    causation_id: prevEventId,
  });
  const classCorr = runtime._calls[2].options.correlation_id;
  assert.strictEqual(classCorr, ROOT_EVENT_ID, 'Hop 3: classification should have root correlation');
  prevEventId = runtime._calls[2].eventId;

  // Hop 4: RecommendationWorker
  const rec = new BaseWorker({ eventRuntime: runtime });
  rec._event = {
    event_id: prevEventId,
    event_type: 'CLASSIFICATION_CREATED',
    namespace: 'core::owner',
    metadata: { correlation_id: classCorr },
  };
  await rec._emit('RECOMMENDATION_CREATED', { docId: 'doc1' }, {
    causation_id: prevEventId,
  });
  const recCorr = runtime._calls[3].options.correlation_id;
  assert.strictEqual(recCorr, ROOT_EVENT_ID, 'Hop 4: recommendation should have root correlation');

  // Verify all 4 hops share the same correlation_id
  const allCorr = runtime._calls.map(c => c.options.correlation_id);
  const unique = new Set(allCorr);
  assert.strictEqual(unique.size, 1, `All 4 hops should share correlation_id, got ${unique.size}`);
  assert.strictEqual([...unique][0], ROOT_EVENT_ID);
});

test('CORR-5: Namespace preserved alongside correlation_id', async () => {
  const { BaseWorker } = require('../ping-runtime/workers/canonical_workers');
  const runtime = spyEventRuntime();
  const worker = new BaseWorker({ eventRuntime: runtime });

  worker._event = {
    event_id: 'event_1',
    event_type: 'TEST',
    namespace: 'tenant::hpp',
    metadata: { correlation_id: 'corr_1' },
  };

  await worker._emit('DOWNSTREAM', { x: 1 }, { causation_id: 'event_1' });

  assert.strictEqual(runtime._calls[0].options.namespace, 'tenant::hpp');
  assert.strictEqual(runtime._calls[0].options.correlation_id, 'corr_1');
});

run();
