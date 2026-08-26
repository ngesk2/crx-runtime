/**
 * Phase D Namespace Propagation — Regression Tests
 *
 * Covers the namespace privacy boundary end-to-end:
 *   D1: KnowledgeGraph.knowledge_nodes has namespace + status columns
 *       (addNode stores them; queryNodes filters by them).
 *   D2: EventToMissionBridge threads event.namespace into the mission payload.
 *   D3: MissionScheduler dispatches namespace into the worker event.
 *   D4: WorkerRuntime tracks worker._event; BaseWorker._emit preserves the
 *       incoming event's namespace downstream.
 *
 * Run: node test_phase_d_namespace.js
 */

const assert = require('assert');
const { KnowledgeGraph } = require('../ping-runtime/knowledge/knowledge_graph');
const { MissionScheduler } = require('../ping-runtime/orchestration/mission_scheduler');
const { WorkerRuntime } = require('../ping-runtime/workers/worker_runtime');
const { registerCanonicalWorkers } = require('../ping-runtime/workers/canonical_workers');
const { EventToMissionBridge, EVENT_MISSION_MAP } = require('../ping-runtime/orchestration/event_to_mission_bridge');
const { MissionRuntime } = require('../ping-runtime/orchestration/mission_runtime');

// ─── Test runner ──────────────────────────────────────────────────────
let passed = 0, failed = 0;
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

async function run() {
  console.log('=== Phase D Namespace Propagation ===\n');
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

// ─── Mock pool capturing knowledge_nodes + ping_missions ───────────────

class MockPool {
  constructor() {
    this._nodes = [];
    this._missions = [];
    this._ddl = { namespace: false, status: false };
  }
  async query(sql, params = []) {
    const S = sql.trim();
    if (S.includes('knowledge_nodes') && S.includes('namespace VARCHAR')) {
      this._ddl.namespace = true;
      this._ddl.status = true;
      return { rows: [], rowCount: 0 };
    }
    if (S.includes('ADD COLUMN IF NOT EXISTS namespace')) {
      this._ddl.namespace = true;
      return { rows: [], rowCount: 0 };
    }
    if (S.includes('ADD COLUMN IF NOT EXISTS status')) {
      this._ddl.status = true;
      return { rows: [], rowCount: 0 };
    }
    if (S.includes('INSERT INTO knowledge_nodes')) {
      this._nodes.push({
        node_id: params[0], node_type: params[1], entity_type: params[2],
        entity_id: params[3], label: params[4], data: params[5],
        source_event_id: params[6], namespace: params[7],
        confidence: params[8], status: params[9],
      });
      return { rows: [], rowCount: 1 };
    }
    if (S.includes('SELECT * FROM knowledge_nodes')) {
      let rows = this._nodes.slice();
      let p = 0;
      if (S.includes('AND namespace')) {
        const ns = params[p++];
        rows = rows.filter(n => n.namespace === ns);
      }
      if (S.includes('AND status')) {
        const st = params[p++];
        rows = rows.filter(n => n.status === st);
      }
      return { rows, rowCount: rows.length };
    }
    if (S.includes('INSERT INTO ping_missions')) {
      const existing = this._missions.find(m => m.mission_id === params[0]);
      if (existing) return { rows: [], rowCount: 0 };
      this._missions.push({
        mission_id: params[0], mission_type: params[1], payload: params[2],
        priority: params[3], created_by: params[4], status: 'created',
        result: null, assigned_to: null, created_at: new Date().toISOString(),
        started_at: null, completed_at: null, error: null, retries: 0,
      });
      return { rows: [], rowCount: 1 };
    }
    if (S.includes("WHERE status = 'created'")) {
      const limit = params[0] || 10;
      const pending = this._missions
        .filter(m => m.status === 'created')
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
        .slice(0, limit);
      return { rows: pending, rowCount: pending.length };
    }
    if (S.includes('SELECT * FROM ping_missions WHERE mission_id = $1')) {
      const m = this._missions.find(m => m.mission_id === params[0]);
      return { rows: m ? [m] : [], rowCount: m ? 1 : 0 };
    }
    if (S.includes('SELECT started_at')) {
      const m = this._missions.find(m => m.mission_id === params[0]);
      return { rows: m ? [{ started_at: m.started_at }] : [], rowCount: 1 };
    }
    if (S.includes("SET status = 'assigned'")) {
      const m = this._missions.find(m => m.mission_id === params[1]);
      if (m) { m.status = 'assigned'; m.assigned_to = params[0]; }
      return { rows: [], rowCount: 1 };
    }
    if (S.includes("SET status = 'running'")) {
      const m = this._missions.find(m => m.mission_id === params[0]);
      if (m) { m.status = 'running'; m.started_at = new Date().toISOString(); }
      return { rows: [], rowCount: 1 };
    }
    if (S.includes("SET status = 'completed'")) {
      const m = this._missions.find(m => m.mission_id === params[1]);
      if (m) { m.status = 'completed'; m.result = params[0]; m.completed_at = new Date().toISOString(); }
      return { rows: [], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }
}

/** Fake eventRuntime: records emissions, allows firing handlers. */
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

// ─── D1: KnowledgeGraph namespace/status columns ───────────────────────

test('D1: initialize() creates namespace + status columns/indexes', async () => {
  const pool = new MockPool();
  const kg = new KnowledgeGraph({ pool });
  await kg.initialize();
  assert.strictEqual(pool._ddl.namespace, true, 'namespace column created');
  assert.strictEqual(pool._ddl.status, true, 'status column created');
});

test('D1: addNode stores namespace/status/confidence; defaults applied', async () => {
  const pool = new MockPool();
  const kg = new KnowledgeGraph({ pool });
  const id = await kg.addNode('event', 'REVIEW_RECEIVED c1', { event_type: 'REVIEW_RECEIVED' }, {
    namespace: 'tenant::hpp',
    confidence: 0.5,
    status: 'candidate',
    sourceEventId: 'evt-123',
  });
  assert.ok(id);
  const stored = pool._nodes[0];
  assert.strictEqual(stored.namespace, 'tenant::hpp');
  assert.strictEqual(stored.status, 'candidate');
  assert.strictEqual(stored.confidence, 0.5);
  assert.strictEqual(stored.source_event_id, 'evt-123');

  const id2 = await kg.addNode('event', 'default ns', {});
  const stored2 = pool._nodes[1];
  assert.strictEqual(stored2.namespace, 'core::system', 'default namespace applied');
  assert.strictEqual(stored2.status, 'candidate', 'default status applied');
  assert.strictEqual(stored2.confidence, null, 'null confidence preserved — no truth inflation');
});

test('D1: queryNodes filters by namespace and status', async () => {
  const pool = new MockPool();
  const kg = new KnowledgeGraph({ pool });
  await kg.addNode('event', 'a', {}, { namespace: 'tenant::hpp', status: 'candidate' });
  await kg.addNode('event', 'b', {}, { namespace: 'core::system', status: 'candidate' });
  await kg.addNode('event', 'c', {}, { namespace: 'tenant::hpp', status: 'approved' });

  const tenantNodes = await kg.queryNodes({ namespace: 'tenant::hpp' });
  assert.strictEqual(tenantNodes.length, 2, 'tenant filter excludes core nodes');
  const approved = await kg.queryNodes({ namespace: 'tenant::hpp', status: 'approved' });
  assert.strictEqual(approved.length, 1, 'status filter narrows tenant set');
});

// ─── D2: Bridge threads namespace into mission ─────────────────────────

test('D2: EventToMissionBridge copies event.namespace into mission payload', async () => {
  const er = fakeEventRuntime();
  const pool = new MockPool();
  const mr = new MissionRuntime({ pool });
  const bridge = new EventToMissionBridge({ eventRuntime: er, missionRuntime: mr });
  bridge.start();

  await er.emit('LEAD_CREATED', 'test', { name: 'Acme' }, { namespace: 'tenant::hpp', event_id: 'evt-lead-1' });
  assert.strictEqual(pool._missions.length, 1, 'mission created for LEAD_CREATED');
  const payload = JSON.parse(pool._missions[0].payload);
  assert.strictEqual(payload.namespace, 'tenant::hpp', 'namespace threaded into mission payload');
  assert.strictEqual(payload.event_id, 'evt-lead-1');
});

// ─── D3: Scheduler dispatches namespace ────────────────────────────────

test('D3: MissionScheduler dispatch event carries namespace from mission payload', async () => {
  const pool = new MockPool();
  const mr = new MissionRuntime({ pool });
  const wr = new WorkerRuntime({ pool });
  const captured = [];
  const probeWorker = {
    handle: async (event) => { captured.push(event); },
  };
  wr.register('observation', probeWorker, { eventTypes: ['LEAD_CREATED'] });

  const sched = new MissionScheduler({ missionRuntime: mr, workerRuntime: wr, pollIntervalMs: 10 });
  await mr.create('LEAD_FOLLOWUP', {
    event_id: 'evt-lead-1',
    event_type: 'LEAD_CREATED',
    source: 'test',
    namespace: 'tenant::hpp',
    payload: { name: 'Acme' },
  }, { priority: 3 });

  sched.start();
  await new Promise(resolve => setTimeout(resolve, 50));
  sched.stop();
  assert.strictEqual(captured.length, 1, 'worker invoked');
  assert.strictEqual(captured[0].namespace, 'tenant::hpp', 'dispatch preserves tenant namespace');
  assert.strictEqual(captured[0].event_type, 'LEAD_CREATED', 'original business event type dispatched');
});

// ─── D4: Worker chain propagates namespace ─────────────────────────────

test('D4: BaseWorker._emit preserves incoming event namespace downstream', async () => {
  const er = fakeEventRuntime();
  const pool = new MockPool();
  const wr = new WorkerRuntime({ pool });
  registerCanonicalWorkers(wr, { eventRuntime: er, pool });

  // Dispatch a business event through WorkerRuntime (the production path);
  // the observation worker must emit OBSERVATION_CREATED with same namespace.
  await wr.dispatch({
    event_id: 'evt-lead-1',
    event_type: 'LEAD_CREATED',
    source: 'test',
    namespace: 'tenant::hpp',
    payload: { documentId: 'doc-1' },
  });

  const obs = er.emitted.find(e => e.event_type === 'OBSERVATION_CREATED');
  assert.ok(obs, 'OBSERVATION_CREATED emitted');
  assert.strictEqual(obs.namespace, 'tenant::hpp', 'worker preserves namespace on downstream event');
});

test('D4: WorkerRuntime.dispatch sets worker._event before handle, clears after', async () => {
  const pool = new MockPool();
  const wr = new WorkerRuntime({ pool });
  let seenEvent = null;
  let seenWorkerEvent = 'unset';
  wr.register('observation', {
    handle: async function (event) {
      seenEvent = event;
      seenWorkerEvent = this._event;
    },
  }, { eventTypes: ['LEAD_CREATED'] });

  await wr.dispatch({ event_type: 'LEAD_CREATED', namespace: 'tenant::hpp', event_id: 'evt-1' });
  assert.strictEqual(seenEvent.namespace, 'tenant::hpp', 'event delivered');
  assert.strictEqual(seenWorkerEvent.namespace, 'tenant::hpp', 'worker._event set before handle');
  assert.strictEqual(wr._workers.get('observation').worker._event, null, 'worker._event cleared after handle');
});

run();
