/**
 * Phase 0 Fixes — Regression Tests (C1/C2/C3)
 *
 * Covers:
 *   C1: EmbeddingService.subscribe() registers one handler per indexable type
 *       and projects matching events to Qdrant (mirrors graph-projection pattern).
 *   C2: MissionScheduler dispatches using mission.payload.event_type (fallback to
 *       mission_type) so workers receive the business event type they register for
 *       — prevents phantom completions.
 *   C3: registerCanonicalWorkers() passes embeddingService into ProjectionWorker.
 *   E2E: Business Event → EventToMissionBridge → MissionRuntime → MissionScheduler
 *        → WorkerRuntime → Canonical Worker → Embedding/Knowledge projection.
 *
 * Run: node test_phase0_fixes.js
 */

const assert = require('assert');
const { EmbeddingService, INDEXABLE_TYPES } = require('../ping-runtime/embeddings/embedding_service');
const { MissionScheduler } = require('../ping-runtime/orchestration/mission_scheduler');
const { WorkerRuntime } = require('../ping-runtime/workers/worker_runtime');
const { registerCanonicalWorkers, ProjectionWorker } = require('../ping-runtime/workers/canonical_workers');
const { UnifiedEventRuntime } = require('../ping-runtime/events/unified_event_runtime');
const { EventToMissionBridge } = require('../ping-runtime/orchestration/event_to_mission_bridge');
const { MissionRuntime } = require('../ping-runtime/orchestration/mission_runtime');

// ─── Test runner ──────────────────────────────────────────────────────
let passed = 0, failed = 0;
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

async function run() {
  console.log('=== Phase 0 Fixes (C1/C2/C3) ===\n');
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

// ─── Mocks ────────────────────────────────────────────────────────────

/** Minimal pool supporting UnifiedEventRuntime + MissionRuntime SQL shapes. */
class MockPool {
  constructor() {
    this._tables = { ping_events: [], ping_missions: [] };
  }
  async query(sql, params = []) {
    const S = sql.trim();
    if (S.startsWith('CREATE')) return { rows: [], rowCount: 0 };
    if (S.includes('INSERT INTO ping_events')) {
      this._tables.ping_events.push({
        event_id: params[0], event_type: params[1], source: params[2],
        timestamp: params[3], payload: params[4], metadata: params[5],
        processed: false,
      });
      return { rows: [], rowCount: 1 };
    }
    if (S.includes('INSERT INTO ping_missions')) {
      const mission = {
        mission_id: params[0], mission_type: params[1], payload: params[2],
        priority: params[3], created_by: params[4], status: 'created',
        result: null, assigned_to: null, created_at: new Date().toISOString(),
        started_at: null, completed_at: null, error: null, retries: 0,
      };
      this._tables.ping_missions.push(mission);
      return { rows: [], rowCount: 1 };
    }
    if (S.includes("WHERE status = 'created'")) {
      const limit = params[0] || 10;
      const pending = this._tables.ping_missions
        .filter(m => m.status === 'created')
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
        .slice(0, limit);
      return { rows: pending, rowCount: pending.length };
    }
    if (S.includes('SELECT * FROM ping_missions WHERE mission_id = $1')) {
      const m = this._tables.ping_missions.find(m => m.mission_id === params[0]);
      return { rows: m ? [m] : [], rowCount: m ? 1 : 0 };
    }
    if (S.includes('SELECT started_at')) {
      const m = this._tables.ping_missions.find(m => m.mission_id === params[0]);
      return { rows: m ? [{ started_at: m.started_at }] : [], rowCount: 1 };
    }
    if (S.includes("SET status = 'assigned'")) {
      const m = this._tables.ping_missions.find(m => m.mission_id === params[1]);
      if (m) { m.status = 'assigned'; m.assigned_to = params[0]; }
      return { rows: [], rowCount: 1 };
    }
    if (S.includes("SET status = 'running'")) {
      const m = this._tables.ping_missions.find(m => m.mission_id === params[0]);
      if (m) { m.status = 'running'; m.started_at = new Date().toISOString(); }
      return { rows: [], rowCount: 1 };
    }
    if (S.includes("SET status = 'completed'")) {
      const m = this._tables.ping_missions.find(m => m.mission_id === params[1]);
      if (m) { m.status = 'completed'; m.result = params[0]; m.completed_at = new Date().toISOString(); }
      return { rows: [], rowCount: 1 };
    }
    if (S.includes("SET status = 'failed'")) {
      const m = this._tables.ping_missions.find(m => m.mission_id === params[1]);
      if (m) { m.status = 'failed'; m.error = params[0]; }
      return { rows: [], rowCount: 1 };
    }
    if (S.includes('SELECT COUNT(*)')) {
      return { rows: [{ count: this._tables.ping_events.length }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }
}

function mockQdrant() {
  const upserts = [];
  return {
    upserts,
    async ensureCollection() {},
    async upsert(collection, points) { upserts.push({ collection, points }); },
    async search() { return []; },
  };
}

function mockAIRuntime() {
  return {
    async embed(text, opts) {
      return { status: 'ok', embedding: new Array(768).fill(0.25), model: (opts && opts.model) || 'nomic-embed-text' };
    },
  };
}

/** Fake eventRuntime recording .on() registrations and letting tests fire events. */
function fakeEventRuntime() {
  const handlers = new Map();
  const emitted = [];
  return {
    handlers,
    emitted,
    on(type, handler) {
      if (!handlers.has(type)) handlers.set(type, []);
      handlers.get(type).push(handler);
    },
    async fire(event) {
      const list = handlers.get(event.event_type) || [];
      for (const h of list) await h(event);
    },
    async emit(eventType, source, payload, options = {}) {
      const evt = {
        event_id: options.event_id || `evt-${emitted.length + 1}`,
        event_type: eventType,
        source,
        namespace: options.namespace || 'core::system',
        timestamp: new Date().toISOString(),
        payload,
        metadata: options.metadata || {},
      };
      emitted.push(evt);
      await this.fire(evt);
      return { status: 'ok', eventId: evt.event_id, event: evt };
    },
  };
}

// ─── C1: EmbeddingService.subscribe ───────────────────────────────────

test('C1: subscribe() registers exactly one handler per indexable type', () => {
  const es = new EmbeddingService({ aiRuntime: mockAIRuntime(), qdrantAdapter: mockQdrant() });
  const er = fakeEventRuntime();
  const result = es.subscribe(er);
  assert.strictEqual(result, es, 'subscribe() returns this for chaining');
  assert.strictEqual(er.handlers.size, INDEXABLE_TYPES.size, 'one handler per indexable type');
  for (const type of INDEXABLE_TYPES) {
    assert.ok(er.handlers.has(type), `handler registered for ${type}`);
  }
  assert.strictEqual(es.getStats().subscribed, INDEXABLE_TYPES.size);
});

test('C1: subscribing an indexable event projects to Qdrant', async () => {
  const qdrant = mockQdrant();
  const es = new EmbeddingService({ aiRuntime: mockAIRuntime(), qdrantAdapter: qdrant });
  const er = fakeEventRuntime();
  es.subscribe(er);
  await er.fire({
    event_id: 'evt-1',
    event_type: 'REVIEW_RECEIVED',
    namespace: 'core::owner',
    metadata: { canonical_hash: 'hash-1' },
    payload: { review_id: 'r1', text: 'Great work!' },
  });
  assert.strictEqual(qdrant.upserts.length, 1, 'one upsert on indexable event');
  assert.strictEqual(qdrant.upserts[0].collection, 'knowledge');
  assert.ok(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(qdrant.upserts[0].points[0].id), 'point ID is a UUID');
  assert.strictEqual(qdrant.upserts[0].points[0].payload.namespace, 'core::owner');
  assert.strictEqual(qdrant.upserts[0].points[0].payload.source_event_id, 'evt-1');
});

test('C1: subscribe() tolerates a non-indexable event (no upsert)', async () => {
  const qdrant = mockQdrant();
  const es = new EmbeddingService({ aiRuntime: mockAIRuntime(), qdrantAdapter: qdrant });
  const er = fakeEventRuntime();
  es.subscribe(er);
  await er.fire({ event_id: 'evt-2', event_type: 'MISSION_CREATED', namespace: 'core::system', payload: {} });
  assert.strictEqual(qdrant.upserts.length, 0, 'structural events are not projected');
});

// ─── C2: MissionScheduler dispatch ────────────────────────────────────

test('C2: dispatch uses mission.payload.event_type, not mission_type', async () => {
  const received = [];
  const wr = new WorkerRuntime();
  const spyWorker = {
    async handle(event) { received.push(event.event_type); return { status: 'ok' }; },
  };
  wr.register('observation', spyWorker, { eventTypes: ['REVIEW_RECEIVED'] });

  const scheduler = new MissionScheduler({
    missionRuntime: { assign: async () => {}, start: async () => {}, complete: async () => {}, fail: async () => {} },
    workerRuntime: wr,
  });

  await scheduler._dispatch({
    mission_id: 'm-1',
    mission_type: 'REVIEW_RESPONSE',          // mission type ≠ event type
    priority: 3,
    payload: JSON.stringify({ event_type: 'REVIEW_RECEIVED', review_id: 'r1' }),
  });

  assert.deepStrictEqual(received, ['REVIEW_RECEIVED'],
    'worker receives the business event type it registers for, not the mission type');
});

test('C2: dispatch falls back to mission_type when payload has no event_type', async () => {
  const received = [];
  const wr = new WorkerRuntime();
  const spyWorker = {
    async handle(event) { received.push(event.event_type); return { status: 'ok' }; },
  };
  wr.register('observation', spyWorker, { eventTypes: ['DOCUMENT_IMPORT'] });

  const scheduler = new MissionScheduler({
    missionRuntime: { assign: async () => {}, start: async () => {}, complete: async () => {}, fail: async () => {} },
    workerRuntime: wr,
  });

  await scheduler._dispatch({
    mission_id: 'm-2',
    mission_type: 'DOCUMENT_IMPORT',
    priority: 1,
    payload: JSON.stringify({ documentId: 'd1' }),   // no event_type field
  });

  assert.deepStrictEqual(received, ['DOCUMENT_IMPORT'], 'falls back to mission_type');
});

// ─── C3: ProjectionWorker receives embeddingService ───────────────────

test('C3: registerCanonicalWorkers passes embeddingService to ProjectionWorker', () => {
  const wr = new WorkerRuntime();
  const es = { projectToQdrant: async () => ({}) };
  registerCanonicalWorkers(wr, {
    eventRuntime: fakeEventRuntime(),
    pool: null,
    aiRuntime: mockAIRuntime(),
    embeddingService: es,
  });
  const stats = wr.getStats();
  assert.ok(stats.workers.projection, 'projection worker registered');
  const projectionEntry = Array.from(wr._workers.values()).find(w => w.worker instanceof ProjectionWorker);
  assert.ok(projectionEntry, 'ProjectionWorker instance registered');
  assert.strictEqual(projectionEntry.worker._embeddingService, es,
    'ProjectionWorker holds the embeddingService dependency');
});

test('C3: ProjectionWorker projects to Qdrant when embeddingService present', async () => {
  const qdrant = mockQdrant();
  const es = new EmbeddingService({ aiRuntime: mockAIRuntime(), qdrantAdapter: qdrant });
  const worker = new ProjectionWorker({ eventRuntime: fakeEventRuntime(), embeddingService: es });
  const result = await worker.handle({
    event_id: 'evt-3',
    event_type: 'PROJECTION_CREATE',
    namespace: 'core::owner',
    metadata: {},
    payload: { documentId: 'doc-1' },
  });
  assert.strictEqual(result.status, 'ok');
  assert.strictEqual(qdrant.upserts.length, 1, 'projection worker writes to Qdrant');
  assert.ok(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(qdrant.upserts[0].points[0].id), 'projection point ID is a UUID');
});

// ─── E2E: full canonical chain ────────────────────────────────────────

test('E2E: Business Event → Bridge → Mission → Scheduler → Worker → Embedding projection', async () => {
  const pool = new MockPool();
  const eventRuntime = new UnifiedEventRuntime({ pool });
  await eventRuntime.initialize();

  const missionRuntime = new MissionRuntime({ pool, eventRuntime });
  await missionRuntime.initialize();

  const workerRuntime = new WorkerRuntime({ pool });
  const qdrant = mockQdrant();
  const embeddingService = new EmbeddingService({ aiRuntime: mockAIRuntime(), qdrantAdapter: qdrant });
  registerCanonicalWorkers(workerRuntime, {
    eventRuntime,
    pool,
    aiRuntime: mockAIRuntime(),
    embeddingService,
  });
  workerRuntime.start();

  const bridge = new EventToMissionBridge({ eventRuntime, missionRuntime });
  bridge.start();

  const scheduler = new MissionScheduler({ missionRuntime, workerRuntime, eventRuntime, pollIntervalMs: 1000000, maxConcurrent: 5 });
  scheduler.start();

  // Seed a business event through the canonical boundary → pipeline
  const emitResult = await eventRuntime.emit('REVIEW_RECEIVED', 'review-authority', {
    review_id: 'r-e2e', customer_id: 'c-e2e', rating: 5, text: 'Excellent work!',
  });
  assert.strictEqual(emitResult.status, 'ok');

  // Drive the scheduler deterministically (no waiting on real interval)
  for (let i = 0; i < 8; i++) {
    await scheduler._poll();
  }

  const missions = pool._tables.ping_missions;
  const completed = missions.filter(m => m.status === 'completed');
  assert.ok(completed.length >= 1, `at least one mission completed (got ${completed.length})`);

  // The full chain must reach embedding projection: REVIEW_RECEIVED → ... → projection
  assert.ok(qdrant.upserts.length >= 1, `embedding projection occurred (got ${qdrant.upserts.length} upserts)`);

  const emittedTypes = new Set(pool._tables.ping_events.map(e => e.event_type));
  assert.ok(emittedTypes.has('OBSERVATION_CREATED'), 'observation worker ran');
  assert.ok(emittedTypes.has('CLAIM_CREATED'), 'claim worker ran');
  assert.ok(emittedTypes.has('CLASSIFICATION_CREATED'), 'classification worker ran');
  assert.ok(emittedTypes.has('RECOMMENDATION_CREATED'), 'recommendation worker ran');
  assert.ok(emittedTypes.has('PROJECTION_CREATED'), 'projection worker ran');

  const failed = missions.filter(m => m.status === 'failed');
  assert.strictEqual(failed.length, 0, `no phantom/failed missions (got ${failed.length} failed)`);

  scheduler.stop();
  workerRuntime.stop();
});

run();
