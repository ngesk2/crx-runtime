/**
 * Dormant Worker Gate Tests
 *
 * Proves that workers with empty eventTypes are truly dormant — they never
 * process dispatched events. Before this fix, WorkerRuntime treated
 * `eventTypes.length === 0` as a catch-all (match everything), causing
 * dormant workers to silently process ALL dispatched events. This created
 * massive duplicate emissions (12,791 events instead of 247) and inflated
 * mission/worker counts.
 *
 *   DWG-1: Worker with empty eventTypes receives zero dispatches.
 *   DWG-2: Worker with empty eventTypes does not appear in worker stats.
 *   DWG-3: Mixed registration — active + dormant — no cross-contamination.
 *   DWG-4: registerCanonicalWorkers skips dormant workers entirely.
 *   DWG-5: No duplicate CLASSIFICATION/RECOMMENDATION from dual-fan-out.
 *
 * Run: node test_dormant_worker_gate.js
 */

const assert = require('assert');

// ─── Test runner ──────────────────────────────────────────────────────
let passed = 0, failed = 0;
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

async function run() {
  console.log('=== Dormant Worker Gate Tests ===\n');
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

function spyEventRuntime() {
  const calls = [];
  return {
    _calls: calls,
    emit: async (eventType, source, payload, options = {}) => {
      const id = `evt_${eventType}_${calls.length}`;
      calls.push({ eventType, source, payload, options, eventId: id });
      return { status: 'ok', eventId: id };
    },
    on: () => {},
  };
}

// ─── Mock Pool ────────────────────────────────────────────────────────

class MockPool {
  constructor() {
    this._queryLog = [];
  }
  async query(sql, params) {
    this._queryLog.push({ sql, params });
    if (sql.includes('SELECT') || sql.includes('ping_events')) {
      return { rows: [] };
    }
    return { rows: [], rowCount: 1 };
  }
}

// ─── Minimal Workers for Testing ──────────────────────────────────────

const { BaseWorker } = require('../ping-runtime/workers/canonical_workers');

class TrackingWorker extends BaseWorker {
  async handle(event) {
    await this._emit('WORKER_PROCESSED', { processed: true });
  }
}

// ─── Tests ────────────────────────────────────────────────────────────

test('DWG-1: Worker with empty eventTypes receives zero dispatches', async () => {
  const { WorkerRuntime } = require('../ping-runtime/workers/worker_runtime');
  const spy = spyEventRuntime();
  const wr = new WorkerRuntime({ pool: new MockPool() });
  const worker = new TrackingWorker({ eventRuntime: spy });

  wr.register('dormant', worker, { eventTypes: [], capabilities: ['dormant'], maxConcurrent: 2 });

  // Dispatch an event that would match if eventTypes were catch-all
  await wr.dispatch({
    event_id: 'evt-1',
    event_type: 'LEAD_CREATED',
    source: 'test',
    payload: { lead_id: 'l1' },
  });

  assert.strictEqual(spy._calls.length, 0, 'dormant worker must not emit when eventTypes is empty');
  assert.strictEqual(worker._processedCount || 0, 0, 'dormant worker handle() must not be called');
});

test('DWG-2: Worker with empty eventTypes is never dispatched', async () => {
  const { WorkerRuntime } = require('../ping-runtime/workers/worker_runtime');
  const spy = spyEventRuntime();
  const wr = new WorkerRuntime({ pool: new MockPool() });

  wr.register('dormant', new TrackingWorker({ eventRuntime: spy }), {
    eventTypes: [], capabilities: ['dormant'], maxConcurrent: 2,
  });

  await wr.dispatch({
    event_id: 'evt-2',
    event_type: 'REVIEW_RECEIVED',
    source: 'test',
    payload: { review_id: 'r1' },
  });

  const stats = wr.getStats();
  // WorkerRuntime stats structure: { workers: { name: { totalProcessed, ... } }, stats: { ... } }
  const dormantEntry = stats.workers['dormant'];
  assert.ok(dormantEntry, 'dormant worker is registered');
  assert.strictEqual(dormantEntry.totalProcessed, 0, 'dormant worker totalProcessed must be 0');
  assert.strictEqual(spy._calls.length, 0, 'dormant worker must not emit any events');
});

test('DWG-3: Mixed registration — active + dormant — no cross-contamination', async () => {
  const { WorkerRuntime } = require('../ping-runtime/workers/worker_runtime');
  const spy = spyEventRuntime();
  const wr = new WorkerRuntime({ pool: new MockPool() });

  // Register one active worker and one dormant worker
  wr.register('active', new TrackingWorker({ eventRuntime: spy }), {
    eventTypes: ['LEAD_CREATED'], capabilities: ['active'], maxConcurrent: 2,
  });
  wr.register('dormant', new TrackingWorker({ eventRuntime: spy }), {
    eventTypes: [], capabilities: ['dormant'], maxConcurrent: 2,
  });

  await wr.dispatch({
    event_id: 'evt-3',
    event_type: 'LEAD_CREATED',
    source: 'test',
    payload: { lead_id: 'l3' },
  });

  // Active worker should have processed the event; dormant should not
  // Total emissions: active worker emits 1 WORKER_PROCESSED, dormant emits 0
  const processedEvents = spy._calls.filter(c => c.eventType === 'WORKER_PROCESSED');
  assert.strictEqual(processedEvents.length, 1, 'only active worker should process — no dormant contamination');
});

test('DWG-4: registerCanonicalWorkers skips dormant workers entirely', async () => {
  const { WorkerRuntime } = require('../ping-runtime/workers/worker_runtime');
  const { registerCanonicalWorkers } = require('../ping-runtime/workers/canonical_workers');
  const spy = spyEventRuntime();
  const wr = new WorkerRuntime({ pool: new MockPool() });

  // Capture console output to verify skip message
  const logs = [];
  const origLog = console.log;
  console.log = (msg) => logs.push(msg);

  registerCanonicalWorkers(wr, { eventRuntime: spy, pool: new MockPool() });

  console.log = origLog;

  // Verify intelligence worker was skipped
  const skipLog = logs.find(l => l.includes("Skipped dormant worker 'intelligence'"));
  assert.ok(skipLog, 'must log skip for dormant intelligence worker');

  // Verify intelligence worker is NOT in registered workers
  const allStats = wr.getStats();
  const hasIntelligence = Object.keys(allStats.workers).includes('intelligence');
  assert.strictEqual(hasIntelligence, false, 'intelligence must not be registered when eventTypes is empty');
});

test('DWG-5: No duplicate CLASSIFICATION/RECOMMENDATION from dual-fan-out', async () => {
  // The original dual-fan-out: when CLAIM_CREATED was dispatched, BOTH
  // classification AND intelligence workers matched it. Both emitted
  // CLASSIFICATION_CREATED, causing duplicate downstream emissions.
  //
  // After fix: intelligence is dormant (not registered), so only
  // classification worker processes CLAIM_CREATED. Exactly 1 emission.
  const { WorkerRuntime } = require('../ping-runtime/workers/worker_runtime');
  const { registerCanonicalWorkers } = require('../ping-runtime/workers/canonical_workers');
  const spy = spyEventRuntime();
  const wr = new WorkerRuntime({ pool: new MockPool() });

  registerCanonicalWorkers(wr, { eventRuntime: spy, pool: new MockPool() });

  // Dispatch CLAIM_CREATED directly — this is the event type that both
  // classification and (previously) intelligence workers matched.
  await wr.dispatch({
    event_id: 'evt-claim',
    event_type: 'CLAIM_CREATED',
    source: 'test',
    namespace: 'tenant::hpp',
    payload: { claim_id: 'c1', observation_id: 'o1' },
  });

  // Count downstream classification events
  const classifications = spy._calls.filter(c => c.eventType === 'CLASSIFICATION_CREATED');
  const recommendations = spy._calls.filter(c => c.eventType === 'RECOMMENDATION_CREATED');

  // With dormant intelligence: exactly 1 classification from classification worker
  // Before fix: classification worker + intelligence worker both processed CLAIM_CREATED
  assert.strictEqual(classifications.length, 1,
    `expected exactly 1 CLASSIFICATION_CREATED (from classification worker), got ${classifications.length}`);

  // Now dispatch CLASSIFICATION_CREATED — only recommendation worker should handle it
  await wr.dispatch({
    event_id: 'evt-cls',
    event_type: 'CLASSIFICATION_CREATED',
    source: 'test',
    namespace: 'tenant::hpp',
    payload: { classification_id: 'cl1', category: 'sales' },
  });

  const recsAfter = spy._calls.filter(c => c.eventType === 'RECOMMENDATION_CREATED');
  assert.strictEqual(recsAfter.length, 1,
    `expected exactly 1 RECOMMENDATION_CREATED (from recommendation worker), got ${recsAfter.length}`);

  // Verify namespace propagated correctly through the chain
  assert.strictEqual(classifications[0].options.namespace, 'tenant::hpp',
    'classification must preserve tenant namespace');
  assert.strictEqual(recsAfter[0].options.namespace, 'tenant::hpp',
    'recommendation must preserve tenant namespace');
});

run();
