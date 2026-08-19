/**
 * Slice 3A — Runtime Convergence Regression Tests
 *
 * Proves the namespace privacy boundary is enforced at exactly one choke point
 * (UnifiedEventRuntime.emit → EventGovernance) and that downstream callers no
 * longer re-derive the 'core::system' default or drop the boundary.
 *
 *   S3A-1: Spine routes namespace into governance.
 *   S3A-2: No duplicate downstream defaulting (worker / bridge / scheduler).
 *   S3A-3: IntelligenceWorker preserves namespace (gap fix).
 *
 * Run: node test_slice3a_convergence.js
 */

const assert = require('assert');
const path = require('path');
const { UnifiedEventRuntime } = require('../ping-runtime/events/unified_event_runtime');
const { EventGovernance } = require('../ping-runtime/events/event_governance');
const { MissionScheduler } = require('../ping-runtime/orchestration/mission_scheduler');
const { WorkerRuntime } = require('../ping-runtime/workers/worker_runtime');
const { registerCanonicalWorkers } = require('../ping-runtime/workers/canonical_workers');
const { IntelligenceWorker } = require('../ping-runtime/workers/intelligence_worker');
const { EventToMissionBridge } = require('../ping-runtime/orchestration/event_to_mission_bridge');
const { MissionRuntime } = require('../ping-runtime/orchestration/mission_runtime');

// ─── Test runner ──────────────────────────────────────────────────────
let passed = 0, failed = 0;
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

async function run() {
  console.log('=== Slice 3A Runtime Convergence ===\n');
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

// ─── Fixtures ─────────────────────────────────────────────────────────

const REPO_ROOT = path.join(__dirname, '..');

function governance() {
  return new EventGovernance(REPO_ROOT).load();
}

/** Records options.namespace verbatim (no defaulting) so we can assert on it. */
function spyEventRuntime() {
  const emissions = [];
  return {
    emissions,
    async emit(eventType, source, payload, options = {}) {
      emissions.push({ eventType, source, payload, options });
      return {
        status: 'ok',
        eventId: `evt-${emissions.length}`,
        event: {
          event_id: `evt-${emissions.length}`,
          event_type: eventType,
          source,
          namespace: options.namespace,
          timestamp: new Date().toISOString(),
          payload,
          metadata: options.metadata || {},
        },
      };
    },
  };
}

class MockPool {
  constructor() {
    this._missions = [];
  }
  async query(sql, params = []) {
    const S = sql.trim();
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

// ─── S3A-1: Spine routes namespace into governance ─────────────────────

test('S3A-1: emit rejects invalid canonical namespace at the spine', async () => {
  const er = new UnifiedEventRuntime({ eventGovernance: governance() });
  const result = await er.emit('LEAD_CREATED', 'test', { name: 'Acme' }, { namespace: 'not-a-namespace' });
  assert.strictEqual(result.status, 'error', 'invalid namespace must be rejected');
  assert.ok(result.error.includes('Invalid canonical namespace'), `got: ${result.error}`);
  assert.strictEqual(result.error.includes('core::'), true, 'error explains expected format');
});

test('S3A-1: emit accepts core:: / tenant:: namespaces and defaults to core::system', async () => {
  const er = new UnifiedEventRuntime({ eventGovernance: governance() });
  const tenant = await er.emit('LEAD_CREATED', 'test', { name: 'Acme' }, { namespace: 'tenant::hpp' });
  assert.strictEqual(tenant.status, 'ok');
  assert.strictEqual(tenant.event.namespace, 'tenant::hpp');

  const core = await er.emit('CUSTOMER_CREATED', 'test', { name: 'Bo' }, { namespace: 'core::owner' });
  assert.strictEqual(core.status, 'ok');
  assert.strictEqual(core.event.namespace, 'core::owner');

  const absent = await er.emit('LEAD_CREATED', 'test', { name: 'Acme' });
  assert.strictEqual(absent.status, 'ok');
  assert.strictEqual(absent.event.namespace, 'core::system', 'spine applies the single default');
});

test('S3A-1: EventGovernance.validateEvent is backward compatible + namespace-validating', async () => {
  const gov = governance();
  // No namespace provided (legacy callers) → still valid.
  const legacy = gov.validateEvent({ event_type: 'LEAD_CREATED' });
  assert.strictEqual(legacy.valid, true, 'absence of namespace must not break legacy callers');
  // Valid canonical namespace → valid.
  const ok = gov.validateEvent({ event_type: 'LEAD_CREATED', namespace: 'tenant::hpp' });
  assert.strictEqual(ok.valid, true);
  // Invalid canonical namespace → INVALID_NAMESPACE.
  const bad = gov.validateEvent({ event_type: 'LEAD_CREATED', namespace: 'hpp' });
  assert.strictEqual(bad.valid, false);
  assert.strictEqual(bad.code, 'INVALID_NAMESPACE');
  // Empty string is a bug, not a value.
  const empty = gov.validateEvent({ event_type: 'LEAD_CREATED', namespace: '' });
  assert.strictEqual(empty.valid, false);
});

// ─── S3A-2: No duplicate downstream defaulting ─────────────────────────

test('S3A-2: BaseWorker._emit passes namespace through verbatim (no core::system fallback)', async () => {
  const spy = spyEventRuntime();
  const wr = new WorkerRuntime({ pool: new MockPool() });
  registerCanonicalWorkers(wr, { eventRuntime: spy, pool: new MockPool() });

  // Without an incoming namespace → worker must NOT inject 'core::system'.
  await wr.dispatch({
    event_id: 'evt-a',
    event_type: 'LEAD_CREATED',
    source: 'test',
    payload: { documentId: 'doc-a' },
  });
  const emitted = spy.emissions.filter(e => e.eventType === 'OBSERVATION_CREATED');
  assert.ok(emitted.length >= 1, 'observation emitted');
  assert.strictEqual(emitted[0].options.namespace, undefined, 'worker passes no fallback default');

  // With a tenant namespace → preserved verbatim.
  await wr.dispatch({
    event_id: 'evt-b',
    event_type: 'LEAD_CREATED',
    source: 'test',
    namespace: 'tenant::hpp',
    payload: { documentId: 'doc-b' },
  });
  const emittedTenant = spy.emissions.filter(e => e.eventType === 'OBSERVATION_CREATED');
  assert.strictEqual(emittedTenant[emittedTenant.length - 1].options.namespace, 'tenant::hpp');
});

test('S3A-2: EventToMissionBridge does not re-default namespace', async () => {
  const spy = spyEventRuntime();
  const pool = new MockPool();
  const mr = new MissionRuntime({ pool });
  const bridge = new EventToMissionBridge({ eventRuntime: spy, missionRuntime: mr });

  // No namespace on the spine event → bridge must pass undefined, not 'core::system'.
  await bridge._handleEvent({
    event_id: 'evt-a',
    event_type: 'LEAD_CREATED',
    source: 'test',
    metadata: {},
    payload: { name: 'Acme' },
  });
  assert.strictEqual(pool._missions.length, 1, 'mission created');
  const payloadA = JSON.parse(pool._missions[0].payload);
  assert.strictEqual(payloadA.namespace, undefined, 'no duplicate default in bridge');

  // Namespace present → preserved.
  await bridge._handleEvent({
    event_id: 'evt-b',
    event_type: 'LEAD_CREATED',
    source: 'test',
    namespace: 'tenant::hpp',
    metadata: {},
    payload: { name: 'Bo' },
  });
  const payloadB = JSON.parse(pool._missions[1].payload);
  assert.strictEqual(payloadB.namespace, 'tenant::hpp');
});

test('S3A-2: MissionScheduler dispatch does not re-default namespace', async () => {
  const pool = new MockPool();
  const mr = new MissionRuntime({ pool });
  const wr = new WorkerRuntime({ pool });
  const captured = [];
  wr.register('observation', { handle: async (event) => { captured.push(event); } }, { eventTypes: ['LEAD_CREATED'] });
  const sched = new MissionScheduler({ missionRuntime: mr, workerRuntime: wr, pollIntervalMs: 10 });

  // Mission payload without namespace → dispatch must pass undefined.
  await mr.create('LEAD_FOLLOWUP', {
    event_id: 'evt-a',
    event_type: 'LEAD_CREATED',
    source: 'test',
    payload: { name: 'Acme' },
  }, { priority: 3 });

  sched.start();
  await new Promise(resolve => setTimeout(resolve, 50));
  sched.stop();
  assert.strictEqual(captured.length, 1, 'worker invoked');
  assert.strictEqual(captured[0].namespace, undefined, 'no duplicate default in scheduler dispatch');
});

// ─── S3A-3: IntelligenceWorker preserves namespace ─────────────────────

test('S3A-3: IntelligenceWorker preserves namespace on downstream emissions', async () => {
  const spy = spyEventRuntime();
  const wr = new WorkerRuntime({ pool: new MockPool() });
  wr.register('intelligence', new IntelligenceWorker({ eventRuntime: spy }), { eventTypes: ['LEAD_CREATED'] });

  await wr.dispatch({
    event_id: 'evt-a',
    event_type: 'LEAD_CREATED',
    source: 'test',
    namespace: 'tenant::hpp',
    payload: { lead_id: 'l1', name: 'Acme' },
  });

  const cls = spy.emissions.find(e => e.eventType === 'CLASSIFICATION_CREATED');
  const rec = spy.emissions.find(e => e.eventType === 'RECOMMENDATION_CREATED');
  assert.ok(cls, 'CLASSIFICATION_CREATED emitted');
  assert.ok(rec, 'RECOMMENDATION_CREATED emitted');
  assert.strictEqual(cls.options.namespace, 'tenant::hpp', 'classification preserves tenant namespace');
  assert.strictEqual(rec.options.namespace, 'tenant::hpp', 'recommendation preserves tenant namespace');
});

test('S3A-3: IntelligenceWorker passes undefined namespace when absent (no fallback)', async () => {
  const spy = spyEventRuntime();
  const wr = new WorkerRuntime({ pool: new MockPool() });
  wr.register('intelligence', new IntelligenceWorker({ eventRuntime: spy }), { eventTypes: ['LEAD_CREATED'] });

  await wr.dispatch({
    event_id: 'evt-b',
    event_type: 'LEAD_CREATED',
    source: 'test',
    payload: { lead_id: 'l2', name: 'Bo' },
  });

  const cls = spy.emissions.find(e => e.eventType === 'CLASSIFICATION_CREATED');
  assert.ok(cls, 'CLASSIFICATION_CREATED emitted');
  assert.strictEqual(cls.options.namespace, undefined, 'no fallback default injected by intelligence worker');
});

run();
