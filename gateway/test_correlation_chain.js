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

// ─── Bridge + Scheduler correlation threading ─────────────────────────

test('CORR-6: Bridge stores correlation_id in mission payload', async () => {
  const { EventToMissionBridge } = require('../ping-runtime/orchestration/event_to_mission_bridge');
  const { MissionRuntime } = require('../ping-runtime/orchestration/mission_runtime');

  const missionRuntime = new MissionRuntime();
  missionRuntime.create = async function(missionType, payload, opts) {
    this._lastPayload = payload;
    return 'mission_test_1';
  };

  const bridge = new EventToMissionBridge({ missionRuntime });
  bridge._missionRuntime = missionRuntime;

  // Emit a worker output event (as it would appear from BaseWorker._emit)
  await bridge._handleEvent({
    event_id: 'worker_output_event_id',
    event_type: 'OBSERVATION_CREATED',
    source: 'ObservationWorker',
    namespace: 'core::owner',
    metadata: { correlation_id: 'root_event_123', confidence: 0.8 },
    payload: { documentId: 'doc1' },
  });

  assert.strictEqual(missionRuntime._lastPayload.correlation_id, 'root_event_123',
    'Bridge must store correlation_id in mission payload');
  assert.strictEqual(missionRuntime._lastPayload.event_id, 'worker_output_event_id');
  assert.strictEqual(missionRuntime._lastPayload.event_type, 'OBSERVATION_CREATED');
});

test('CORR-7: Bridge uses event_id as correlation_id fallback when metadata absent', async () => {
  const { EventToMissionBridge } = require('../ping-runtime/orchestration/event_to_mission_bridge');
  const { MissionRuntime } = require('../ping-runtime/orchestration/mission_runtime');

  const missionRuntime = new MissionRuntime();
  missionRuntime.create = async function(missionType, payload, opts) {
    this._lastPayload = payload;
    return 'mission_test_2';
  };

  const bridge = new EventToMissionBridge({ missionRuntime });
  bridge._missionRuntime = missionRuntime;

  await bridge._handleEvent({
    event_id: 'fallback_event_id',
    event_type: 'REVIEW_RECEIVED',
    source: 'api',
    namespace: 'core::owner',
    metadata: {},
    payload: { rating: 5 },
  });

  assert.strictEqual(missionRuntime._lastPayload.correlation_id, 'fallback_event_id',
    'Without metadata.correlation_id, bridge should fall back to event.event_id');
});

test('CORR-8: Scheduler includes correlation_id in synthetic event metadata', async () => {
  const { MissionScheduler } = require('../ping-runtime/orchestration/mission_scheduler');

  const dispatchedEvents = [];
  const mockWorkerRuntime = {
    getStats: () => ({ workers: { observation: {} } }),
    dispatch: async (event) => {
      dispatchedEvents.push(event);
      return { status: 'ok', workerName: 'observation' };
    },
  };
  const mockMissionRuntime = {
    getPending: async () => [{
      mission_id: 'mis_abc',
      mission_type: 'REVIEW_RESPONSE',
      status: 'pending',
      payload: {
        event_id: 'trigger_event_id',
        event_type: 'REVIEW_RECEIVED',
        correlation_id: 'root_corr_456',
        namespace: 'tenant::hpp',
        payload: { rating: 5 },
      },
    }],
    assign: async () => {},
    start: async () => {},
    complete: async () => {},
  };

  const scheduler = new MissionScheduler({ workerRuntime: mockWorkerRuntime, missionRuntime: mockMissionRuntime });
  await scheduler._dispatch(mockMissionRuntime.getPending.mock_results?.[0] || {
    mission_id: 'mis_abc',
    mission_type: 'REVIEW_RESPONSE',
    status: 'pending',
    payload: {
      event_id: 'trigger_event_id',
      event_type: 'REVIEW_RECEIVED',
      correlation_id: 'root_corr_456',
      namespace: 'tenant::hpp',
      payload: { rating: 5 },
    },
  });

  assert.strictEqual(dispatchedEvents.length, 1, 'Should dispatch exactly 1 event');
  const syntheticEvent = dispatchedEvents[0];
  assert.strictEqual(syntheticEvent.metadata.correlation_id, 'root_corr_456',
    'Scheduler must thread correlation_id from mission payload into synthetic event metadata');
  assert.strictEqual(syntheticEvent.namespace, 'tenant::hpp',
    'Namespace must also be threaded');
  assert.strictEqual(syntheticEvent.event_id, 'trigger_event_id');
});

test('CORR-9: Bridge→Scheduler→Worker full path preserves root correlation_id', async () => {
  const { EventToMissionBridge } = require('../ping-runtime/orchestration/event_to_mission_bridge');
  const { MissionRuntime } = require('../ping-runtime/orchestration/mission_runtime');
  const { BaseWorker } = require('../ping-runtime/workers/canonical_workers');

  // Set up a spy event runtime
  const emitted = [];
  const mockRuntime = {
    emit: async (eventType, source, payload, opts) => {
      emitted.push({ eventType, source, payload, options: opts });
      return { status: 'ok', eventId: 'emitted_' + emitted.length };
    },
    on: () => {},
  };

  // Bridge creates mission
  const missionRuntime = new MissionRuntime();
  let createdPayload = null;
  missionRuntime.create = async (missionType, payload, opts) => {
    createdPayload = payload;
    return 'mis_chain';
  };

  const bridge = new EventToMissionBridge({ missionRuntime });

  // Simulate: spine emits REVIEW_RECEIVED with correlation_id = eventId
  await bridge._handleEvent({
    event_id: 'root_event_001',
    event_type: 'REVIEW_RECEIVED',
    source: 'api',
    namespace: 'tenant::hpp',
    metadata: { correlation_id: 'root_event_001' },
    payload: { rating: 5 },
  });

  // Now simulate what MissionScheduler does with the stored payload
  const schedulerPayload = createdPayload;
  const syntheticEvent = {
    event_id: schedulerPayload.event_id,
    event_type: schedulerPayload.event_type,
    source: schedulerPayload.source,
    namespace: schedulerPayload.namespace,
    metadata: {
      mission_type: 'REVIEW_RESPONSE',
      priority: 0,
      assigned_to: 'observation',
      correlation_id: schedulerPayload.correlation_id || schedulerPayload.event_id,
    },
  };

  // Observation worker receives the synthetic event and emits
  const worker = new BaseWorker({ eventRuntime: mockRuntime });
  worker._event = syntheticEvent;
  await worker._emit('OBSERVATION_CREATED', { docId: 'doc1' });

  // The emitted event must carry the root correlation_id
  assert.strictEqual(emitted[0].options.correlation_id, 'root_event_001',
    'Full bridge→scheduler→worker path must preserve root correlation_id');
  assert.strictEqual(emitted[0].options.namespace, 'tenant::hpp',
    'Namespace must survive the full path');
});

run();
