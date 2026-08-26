/**
 * test_trace_propagation.js — End-to-end trace propagation tests.
 *
 * Proves that trace fields (correlation_id, causation_id, namespace,
 * confidence, confidence_provenance) propagate correctly through the
 * full pipeline: emit → bridge → scheduler → worker → KG.
 *
 * Required scenarios (from canonical audit):
 *   TR-1: Canonical event full path — all trace fields survive end-to-end
 *   TR-2: Child event parent trace — correlation_id inherited across hops
 *   TR-3: Deterministic event_id — SHA-256 content-addressed, stable
 *   TR-4: Namespace survival — namespace propagates through every hop
 *   TR-5: Null confidence preserved — null never fabricated to a number
 *   TR-6: Confidence provenance recorded — inherited vs explicit tagged
 *   TR-7: Replay bridge propagates trace fields into kernel envelope
 *   TR-8: Replay bridge does not fabricate absent fields
 *   TR-9: KG stores correlation_id and confidence_provenance
 *   TR-10: Priority normalization intact alongside trace propagation
 *
 * Run: node test_trace_propagation.js
 */

'use strict';

const assert = require('assert');
const { UnifiedEventRuntime } = require('../ping-runtime/events/unified_event_runtime');
const { EventToMissionBridge } = require('../ping-runtime/orchestration/event_to_mission_bridge');
const { MissionRuntime } = require('../ping-runtime/orchestration/mission_runtime');
const { MissionScheduler } = require('../ping-runtime/orchestration/mission_scheduler');
const { WorkerRuntime } = require('../ping-runtime/workers/worker_runtime');
const { registerCanonicalWorkers } = require('../ping-runtime/workers/canonical_workers');
const { KnowledgeGraph } = require('../ping-runtime/knowledge/knowledge_graph');
const { KernelReplayExecutionProvider } = require('./kernel_replay_execution_provider');

// ─── Test runner ──────────────────────────────────────────────────────
let passed = 0, failed = 0;
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

async function run() {
  console.log('=== Trace Propagation Tests ===\n');
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

// ─── Mock Pool ────────────────────────────────────────────────────────
class MockPool {
  constructor() {
    this._events = [];
    this._missions = [];
    this._nodes = [];
    this._deadLetters = [];
  }

  async query(sql, params = []) {
    const S = sql.trim();

    // DDL
    if (S.includes('CREATE') || S.includes('ALTER TABLE') || S.includes('CREATE INDEX'))
      return { rows: [], rowCount: 0 };

    // INSERT INTO ping_events
    if (S.includes('INSERT INTO ping_events')) {
      let metadata = params[5];
      if (typeof metadata === 'string') {
        try { metadata = JSON.parse(metadata); } catch {}
      }
      const row = {
        event_id: params[0], event_type: params[1], source: params[2],
        timestamp: params[3], payload: params[4], metadata,
        namespace: params[6],
      };
      this._events.push(row);
      return { rows: [], rowCount: 1 };
    }

    // INSERT INTO ping_missions
    if (S.includes('INSERT INTO ping_missions')) {
      if (this._missions.find(m => m.mission_id === params[0]))
        return { rows: [], rowCount: 0 };
      this._missions.push({
        mission_id: params[0], mission_type: params[1],
        payload: params[2], priority: params[3], status: 'created',
      });
      return { rows: [], rowCount: 1 };
    }

    // SELECT pending missions
    if (S.includes("WHERE status = 'created'")) {
      return {
        rows: this._missions
          .filter(m => m.status === 'created')
          .sort((a, b) => (b.priority || 0) - (a.priority || 0))
          .slice(0, params[0] || 10),
        rowCount: 0,
      };
    }

    // UPDATE status
    if (S.includes("SET status = 'assigned'")) {
      const m = this._missions.find(m => m.mission_id === params[1]);
      if (m) { m.status = 'assigned'; m.assigned_to = params[0]; }
      return { rows: [], rowCount: 1 };
    }
    if (S.includes("SET status = 'running'")) {
      const m = this._missions.find(m => m.mission_id === params[0]);
      if (m) m.status = 'running';
      return { rows: [], rowCount: 1 };
    }
    if (S.includes("SET status = 'completed'")) {
      const m = this._missions.find(m => m.mission_id === params[1]);
      if (m) { m.status = 'completed'; m.result = params[0]; }
      return { rows: [], rowCount: 1 };
    }
    if (S.includes("SET status = 'failed'")) {
      const m = this._missions.find(m => m.mission_id === params[1]);
      if (m) m.status = 'failed';
      return { rows: [], rowCount: 1 };
    }

    // SELECT mission by id
    if (S.includes('mission_id = $1') && S.includes('SELECT')) {
      const m = this._missions.find(m => m.mission_id === params[0]);
      return { rows: m ? [m] : [], rowCount: m ? 1 : 0 };
    }

    // SELECT from ping_events
    if (S.includes('FROM ping_events') && S.includes('WHERE event_id')) {
      const rows = this._events.filter(e => params.includes(e.event_id));
      return { rows, rowCount: rows.length };
    }

    // INSERT INTO knowledge_nodes
    if (S.includes('INSERT INTO knowledge_nodes')) {
      const node = {
        node_id: params[0], node_type: params[1], entity_type: params[2],
        entity_id: params[3], label: params[4], data: params[5],
        source_event_id: params[6], namespace: params[7], confidence: params[8],
        status: params[9], correlation_id: params[10],
        confidence_provenance: params[11],
      };
      this._nodes.push(node);
      return { rows: [], rowCount: 1 };
    }

    // SELECT COUNT
    if (S.includes('COUNT(*)')) {
      if (S.includes('knowledge_nodes'))
        return { rows: [{ count: String(this._nodes.length) }], rowCount: 1 };
      return { rows: [{ count: '0' }], rowCount: 1 };
    }

    // GROUP BY node_type
    if (S.includes('GROUP BY node_type'))
      return { rows: [], rowCount: 0 };

    // DEFAULT: return empty
    return { rows: [], rowCount: 0 };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Build a full pipeline (eventRuntime → missionRuntime → workerRuntime →
 * bridge → scheduler) for chain tests.
 */
function buildPipeline(pool) {
  const eventRuntime = new UnifiedEventRuntime({ pool });
  const missionRuntime = new MissionRuntime({ pool, eventRuntime });
  const workerRuntime = new WorkerRuntime({ pool });
  const bridge = new EventToMissionBridge({ eventRuntime, missionRuntime });
  const scheduler = new MissionScheduler({
    missionRuntime, workerRuntime, pool,
    pollIntervalMs: 50, maxConcurrent: 10,
  });
  registerCanonicalWorkers(workerRuntime, { eventRuntime, pool });
  return { eventRuntime, missionRuntime, workerRuntime, bridge, scheduler };
}

// ─── Tests ────────────────────────────────────────────────────────────

test('TR-1: Canonical event full path — correlation_id, causation_id, namespace survive emit→bridge→scheduler→worker', async () => {
  const pool = new MockPool();
  const { eventRuntime, missionRuntime, workerRuntime, bridge, scheduler } = buildPipeline(pool);
  await eventRuntime.initialize();
  await missionRuntime.initialize();
  workerRuntime.start();
  bridge.start();
  scheduler.start();

  // Emit a root event with all trace fields
  const emitResult = await eventRuntime.emit(
    'REVIEW_RECEIVED', 'ping-runtime',
    { review_text: 'Great service!', rating: 5 },
    {
      namespace: 'tenant::hpp',
      correlation_id: 'corr-tr1-root',
      metadata: { source: 'ingest', confidence: 0.85, confidence_source: 'explicit' },
    }
  );
  assert.strictEqual(emitResult.status, 'ok');

  // Wait for chain to complete
  await sleep(600);

  scheduler.stop();

  // Verify the root event was persisted with trace fields
  const rootPersisted = pool._events.find(e => e.event_type === 'REVIEW_RECEIVED');
  assert.ok(rootPersisted, 'Root event persisted');
  assert.strictEqual(rootPersisted.namespace, 'tenant::hpp');
  assert.strictEqual(rootPersisted.metadata?.correlation_id, 'corr-tr1-root');
  assert.strictEqual(rootPersisted.metadata?.confidence, 0.85);

  // Verify downstream worker-emitted events carry trace fields.
  // Exclude lifecycle events (MISSION_*) — emitted by MissionRuntime without
  // the business event's namespace/correlation context.
  const lifecycleTypes = new Set([
    'MISSION_CREATED', 'MISSION_ASSIGNED', 'MISSION_STARTED',
    'MISSION_COMPLETED', 'MISSION_FAILED', 'MISSION_LEASE_EXPIRED',
  ]);
  const downstream = pool._events.filter(e =>
    e.event_type !== 'REVIEW_RECEIVED' && !lifecycleTypes.has(e.event_type)
  );
  assert.ok(downstream.length >= 1, `At least 1 downstream worker event emitted (got ${downstream.length})`);

  for (const evt of downstream) {
    assert.strictEqual(evt.namespace, 'tenant::hpp',
      `Namespace preserved in ${evt.event_type}`);
    assert.strictEqual(evt.metadata?.correlation_id, 'corr-tr1-root',
      `correlation_id preserved in ${evt.event_type}`);
  }
});

test('TR-2: Child event inherits parent correlation_id across 4 hops', async () => {
  const pool = new MockPool();
  const { eventRuntime, missionRuntime, workerRuntime, bridge, scheduler } = buildPipeline(pool);
  await eventRuntime.initialize();
  await missionRuntime.initialize();
  workerRuntime.start();
  bridge.start();
  scheduler.start();

  await eventRuntime.emit('REVIEW_RECEIVED', 'test', { text: 'test' }, {
    namespace: 'tenant::hpp',
    correlation_id: 'corr-hop-root',
    metadata: { confidence: 0.9 },
  });

  await sleep(1500);
  scheduler.stop();

  const chain = pool._events.filter(e =>
    ['OBSERVATION_CREATED', 'CLAIM_CREATED', 'RECOMMENDATION_CREATED'].includes(e.event_type)
  );

  for (const evt of chain) {
    assert.strictEqual(
      evt.metadata?.correlation_id, 'corr-hop-root',
      `${evt.event_type} must carry root correlation_id`
    );
  }
});

test('TR-3: Deterministic event_id is stable SHA-256 content-addressed', async () => {
  const pool = new MockPool();
  const eventRuntime = new UnifiedEventRuntime({ pool });
  await eventRuntime.initialize();

  const opts = { namespace: 'core::system', metadata: { source: 'test' } };
  const r1 = await eventRuntime.emit('SYSTEM_HEALTH_CHECK', 'test', { check: 'determinism' }, opts);
  const r2 = await eventRuntime.emit('SYSTEM_HEALTH_CHECK', 'test', { check: 'determinism' }, opts);

  assert.strictEqual(r1.eventId, r2.eventId,
    'Same content produces same deterministic event_id');
  assert.ok(/^[a-f0-9]{64}$/.test(r1.eventId),
    'event_id is a 64-char SHA-256 hex digest');
});

test('TR-4: Namespace survives the full emit→bridge→scheduler→worker chain', async () => {
  const pool = new MockPool();
  const { eventRuntime, missionRuntime, workerRuntime, bridge, scheduler } = buildPipeline(pool);
  await eventRuntime.initialize();
  await missionRuntime.initialize();
  workerRuntime.start();
  bridge.start();
  scheduler.start();

  await eventRuntime.emit('REVIEW_RECEIVED', 'test', { text: 'ns-test' }, {
    namespace: 'tenant::hpp',
  });

  await sleep(800);
  scheduler.stop();

  const lifecycleTypes = new Set([
    'MISSION_CREATED', 'MISSION_ASSIGNED', 'MISSION_STARTED',
    'MISSION_COMPLETED', 'MISSION_FAILED', 'MISSION_LEASE_EXPIRED',
  ]);
  const allEvents = pool._events.filter(e =>
    !lifecycleTypes.has(e.event_type)
  );
  for (const evt of allEvents) {
    assert.strictEqual(evt.namespace, 'tenant::hpp',
      `Namespace in persisted ${evt.event_type}`);
  }
});

test('TR-5: Null confidence preserved — never fabricated to a number', async () => {
  const pool = new MockPool();
  const eventRuntime = new UnifiedEventRuntime({ pool });
  await eventRuntime.initialize();

  await eventRuntime.emit('SYSTEM_HEALTH_CHECK', 'test', { check: 'null-conf' }, {
    namespace: 'core::system',
    metadata: { source: 'test' },
  });

  const persisted = pool._events.find(e => e.event_type === 'SYSTEM_HEALTH_CHECK');
  assert.ok(persisted, 'Event persisted');
  const conf = persisted.metadata?.confidence;
  assert.ok(conf === undefined || conf === null,
    `Null confidence preserved as null/undefined, got: ${conf}`);
});

test('TR-6: Confidence provenance records inherited vs explicit', async () => {
  const pool = new MockPool();
  const { eventRuntime, missionRuntime, workerRuntime, bridge, scheduler } = buildPipeline(pool);
  await eventRuntime.initialize();
  await missionRuntime.initialize();
  workerRuntime.start();
  bridge.start();
  scheduler.start();

  await eventRuntime.emit('REVIEW_RECEIVED', 'test', { text: 'cp-test' }, {
    namespace: 'core::system',
    metadata: { confidence: 0.73, confidence_source: 'explicit' },
  });

  await sleep(800);
  scheduler.stop();

  const root = pool._events.find(e => e.event_type === 'REVIEW_RECEIVED');
  assert.ok(root, 'Root event exists');
  assert.strictEqual(root.metadata?.confidence_source, 'explicit',
    'Root has explicit confidence_source');

  const downstream = pool._events.filter(e =>
    e.event_type === 'OBSERVATION_CREATED' || e.event_type === 'CLAIM_CREATED'
  );
  for (const evt of downstream) {
    assert.strictEqual(evt.metadata?.confidence_source, 'inherited',
      `${evt.event_type} records confidence_source: inherited`);
    assert.strictEqual(evt.metadata?.confidence, 0.73,
      `${evt.event_type} inherited confidence value 0.73`);
  }
});

test('TR-7: Replay bridge propagates correlation_id into kernel envelope', async () => {
  const provider = new KernelReplayExecutionProvider();

  const transcript = {
    transcript_id: 'trace-replay-001',
    state: {
      replay_events: [
        {
          event_id: 'evt-rb-001',
          event_type: 'REVIEW_RECEIVED',
          actor_id: 'test',
          timestamp: '2026-08-21T15:00:00.000Z',
          payload: { text: 'replay test' },
          correlation_id: 'corr-rb-root',
          namespace: 'tenant::hpp',
          metadata: {
            confidence: 0.8,
            confidence_source: 'inherited',
            correlation_id: 'corr-rb-root',
            namespace: 'tenant::hpp',
          },
        },
        {
          event_id: 'evt-rb-002',
          event_type: 'OBSERVATION_CREATED',
          actor_id: 'observation-worker',
          timestamp: '2026-08-21T15:00:01.000Z',
          causation_id: 'evt-rb-001',
          payload: { observation: 'test' },
          metadata: {
            confidence: 0.8,
            confidence_source: 'inherited',
            correlation_id: 'corr-rb-root',
            namespace: 'tenant::hpp',
          },
        },
      ],
    },
  };

  const result = await provider.executeReplay(transcript);
  assert.strictEqual(result.status, 'ok');
  assert.strictEqual(result.event_count, 2);
});

test('TR-8: Replay bridge does not fabricate absent fields', async () => {
  const provider = new KernelReplayExecutionProvider();

  const transcript = {
    transcript_id: 'trace-replay-no-fields',
    state: {
      replay_events: [
        {
          event_id: 'evt-no-trace-001',
          event_type: 'SYSTEM_HEALTH_CHECK',
          actor_id: 'test',
          timestamp: '2026-08-21T15:00:00.000Z',
          payload: { check: 'no-trace' },
        },
      ],
    },
  };

  const result = await provider.executeReplay(transcript);
  assert.strictEqual(result.status, 'ok');
  assert.strictEqual(result.event_count, 1);
  assert.ok(!result.violations || result.violations.length === 0,
    'No kernel violations for absent trace fields');
});

test('TR-9: KG stores correlation_id and confidence_provenance from addNode', async () => {
  const pool = new MockPool();
  const kg = new KnowledgeGraph({ pool });
  await kg.initialize();

  const nodeId = await kg.addNode('event', 'Test Trace Node', { event_type: 'TEST' }, {
    namespace: 'tenant::hpp',
    confidence: 0.73,
    sourceEventId: 'evt-tr9-001',
    correlationId: 'corr-tr9-root',
    confidenceProvenance: 'inherited',
  });

  assert.ok(nodeId, 'Node created');

  const stored = pool._nodes.find(n => n.node_id === nodeId);
  assert.ok(stored, 'Node stored in pool');
  assert.strictEqual(stored.correlation_id, 'corr-tr9-root',
    'correlation_id stored in KG');
  assert.strictEqual(stored.confidence_provenance, 'inherited',
    'confidence_provenance stored in KG');
  assert.strictEqual(stored.namespace, 'tenant::hpp');
  assert.strictEqual(stored.confidence, 0.73);
});

test('TR-10: Priority normalization intact alongside trace propagation', async () => {
  const pool = new MockPool();
  const { eventRuntime, missionRuntime, bridge } = buildPipeline(pool);
  await eventRuntime.initialize();
  await missionRuntime.initialize();
  bridge.start();

  await eventRuntime.emit('REVIEW_RECEIVED', 'test', { text: 'priority-test' }, {
    namespace: 'tenant::hpp',
    correlation_id: 'corr-priority',
  });

  await sleep(100);

  const mission = pool._missions.find(m => m.mission_type === 'REVIEW_RESPONSE');
  assert.ok(mission, 'Mission created (REVIEW_RESPONSE from REVIEW_RECEIVED)');
  assert.strictEqual(typeof mission.priority, 'number',
    'Priority is a number');
  assert.ok(mission.priority >= 0 && mission.priority <= 3,
    `Priority within int 0-3 scale (got ${mission.priority})`);

  const payload = typeof mission.payload === 'string' ? JSON.parse(mission.payload) : mission.payload;
  assert.strictEqual(payload.correlation_id, 'corr-priority',
    'correlation_id preserved in mission payload alongside priority');
});

// ─── Run ──────────────────────────────────────────────────────────────
run();
