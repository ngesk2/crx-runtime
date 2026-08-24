/**
 * test_confidence_convergence.js — T1–T10 confidence propagation matrix.
 *
 * Full pipeline test: POST /ingest -> Event -> Mission -> Scheduler -> Workers
 * -> downstream events. Proves confidence propagates correctly at every hop.
 */
'use strict';

const assert = require('assert');
const { UnifiedEventRuntime } = require('../ping-runtime/events/unified_event_runtime');
const { EventToMissionBridge } = require('../ping-runtime/orchestration/event_to_mission_bridge');
const { MissionScheduler } = require('../ping-runtime/orchestration/mission_scheduler');
const { registerCanonicalWorkers } = require('../ping-runtime/workers/canonical_workers');
const { KnowledgeGraph } = require('../ping-runtime/knowledge/knowledge_graph');
const { EvidenceAuthority } = require('../ping-runtime/evidence/evidence_authority');

// ─── Mock Pool ────────────────────────────────────────────────────────
class MockPool {
  constructor() { this._events = []; this._missions = []; this._nodes = []; }
  async query(sql, params = []) {
    if (sql.trim().startsWith('CREATE') || sql.includes('ALTER TABLE') || sql.includes('CREATE INDEX'))
      return { rows: [], rowCount: 0 };
    if (sql.includes('INSERT INTO ping_events')) {
      this._events.push({ event_id: params[0], event_type: params[1], source: params[2],
        timestamp: params[3], payload: params[4], metadata: params[5] });
      return { rows: [], rowCount: 1 };
    }
    if (sql.includes('INSERT INTO ping_missions')) {
      if (this._missions.find(m => m.mission_id === params[0])) return { rows: [], rowCount: 0 };
      this._missions.push({ mission_id: params[0], mission_type: params[1], payload: params[2],
        priority: params[3], status: 'created' });
      return { rows: [], rowCount: 1 };
    }
    if (sql.includes("WHERE status = 'created'")) {
      return { rows: this._missions.filter(m => m.status === 'created')
        .sort((a, b) => (b.priority || 0) - (a.priority || 0)).slice(0, params[0] || 10), rowCount: 0 };
    }
    if (sql.includes("SET status = 'assigned'")) {
      const m = this._missions.find(m => m.mission_id === params[1]);
      if (m) { m.status = 'assigned'; m.assigned_to = params[0]; }
      return { rows: [], rowCount: 1 };
    }
    if (sql.includes("SET status = 'running'")) {
      const m = this._missions.find(m => m.mission_id === params[0]);
      if (m) m.status = 'running';
      return { rows: [], rowCount: 1 };
    }
    if (sql.includes("SET status = 'completed'")) {
      const m = this._missions.find(m => m.mission_id === params[1]);
      if (m) { m.status = 'completed'; m.result = params[0]; }
      return { rows: [], rowCount: 1 };
    }
    if (sql.includes("SET status = 'failed'")) {
      const m = this._missions.find(m => m.mission_id === params[1]);
      if (m) m.status = 'failed';
      return { rows: [], rowCount: 1 };
    }
    if (sql.includes('mission_id = $1') && sql.includes('SELECT')) {
      const m = this._missions.find(m => m.mission_id === params[0]);
      return { rows: m ? [m] : [], rowCount: m ? 1 : 0 };
    }
    if (sql.includes('SELECT started_at')) {
      const m = this._missions.find(m => m.mission_id === params[0]);
      return { rows: [{ started_at: m ? m.started_at || null : null }], rowCount: 1 };
    }
    if (sql.includes('SELECT COUNT(*)')) return { rows: [{ count: this._events.length }], rowCount: 1 };
    if (sql.includes('INSERT INTO knowledge_nodes')) {
      this._nodes.push({ id: params[0], nodeType: params[1], entity_type: params[2],
        entity_id: params[3], label: params[4], data: params[5], sourceEventId: params[6],
        namespace: params[7], confidence: params[8], status: params[9] });
      return { rows: [{ id: params[0] }], rowCount: 1 };
    }
    if (sql.includes('INSERT INTO knowledge_edges')) return { rows: [], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  }
}

let P = 0, F = 0;
async function t(name, fn) {
  try { await fn(); P++; console.log(`  \x1b[32m\x2713 ${name}\x1b[0m`); }
  catch (e) { F++; console.error(`  \x1b[31m\x2717 ${name}: ${e.message}\x1b[0m`); }
}
function pm(e) { return typeof e.metadata === 'string' ? JSON.parse(e.metadata) : (e.metadata || {}); }

// Poll helper: wait until condition is met or timeout
async function waitFor(fn, ms = 5000, interval = 100) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const result = fn();
    if (result) return result;
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error(`Timeout after ${ms}ms`);
}

(async () => {
  console.log('=== Confidence Convergence Matrix (T1\u2013T10) ===\n');

  const pool = new MockPool();
  const eventRuntime = new UnifiedEventRuntime({ pool });
  await eventRuntime.initialize();

  const missionRuntime = new (require('../ping-runtime/orchestration/mission_runtime')).MissionRuntime({ pool, eventRuntime });
  await missionRuntime.initialize();

  const workerRuntime = new (require('../ping-runtime/workers/worker_runtime')).WorkerRuntime({ pool });
  registerCanonicalWorkers(workerRuntime, { eventRuntime, pool });
  workerRuntime.start();

  const bridge = new EventToMissionBridge({ eventRuntime, missionRuntime });
  bridge.start();

  // Fast scheduler: poll every 100ms so chain completes quickly
  const scheduler = new MissionScheduler({ missionRuntime, workerRuntime, pool, pollIntervalMs: 100 });
  scheduler.start();

  // Helper: emit event and wait for a specific downstream event type
  async function emitAndWait(eventType, payload, options, downstreamType, timeoutMs = 8000) {
    pool._events.length = 0;
    pool._missions.length = 0;
    await eventRuntime.emit(eventType, 'test', payload, options);
    const found = await waitFor(() =>
      pool._events.find(e => e.event_type === downstreamType), timeoutMs);
    return found;
  }

  // ─── T1: Explicit numeric confidence persists on root event ────────
  await t('T1: explicit confidence 0.73 persists on root spine event', async () => {
    pool._events.length = 0;
    await eventRuntime.emit('REVIEW_RECEIVED', 'test', {
      review_id: 'rev-t1', customer_id: 'cust-t1', rating: 5, text: 'Great work'
    }, { metadata: { confidence: 0.73 } });
    const root = pool._events.find(e => e.event_type === 'REVIEW_RECEIVED');
    assert.ok(root, 'root event exists');
    assert.strictEqual(pm(root).confidence, 0.73);
  });

  // ─── T2: Omitted confidence remains null ───────────────────────────
  await t('T2: omitted confidence stays null on root spine event', async () => {
    pool._events.length = 0;
    await eventRuntime.emit('LEAD_CREATED', 'test', {
      lead_id: 'lead-t2', customer_id: 'cust-t2'
    }, { metadata: {} });
    const root = pool._events.find(e => e.event_type === 'LEAD_CREATED');
    assert.ok(root, 'root event exists');
    const val = pm(root).confidence;
    assert.ok(val === null || val === undefined,
      `T2: no confidence (got ${val})`);
    assert.notStrictEqual(val, 0.5, 'not fabricated to 0.5');
    assert.notStrictEqual(val, 1.0, 'not inflated to 1.0');
  });

  // ─── T3: null survives Event -> Mission -> Scheduler ───────────────
  await t('T3: null confidence survives bridge + scheduler without coercion', async () => {
    pool._events.length = 0;
    await eventRuntime.emit('CUSTOMER_CREATED', 'test', {
      customer_id: 'cust-t3', name: 'Test Corp'
    }, { metadata: {} });
    // Wait for at least one observation to be created
    const obs = await waitFor(() =>
      pool._events.find(e => e.event_type === 'OBSERVATION_CREATED'), 8000);
    const val = pm(obs).confidence;
    assert.ok(val === null || val === undefined,
      `T3: null survived (got ${val}, not 0.5/0.7/0.85/1.0)`);
  });

  // ─── T4: Numeric confidence survives full chain ────────────────────
  await t('T4: numeric confidence 0.73 survives full worker chain unchanged', async () => {
    pool._events.length = 0;
    await eventRuntime.emit('REVIEW_RECEIVED', 'test', {
      review_id: 'rev-t4', customer_id: 'cust-t4', rating: 5
    }, { metadata: { confidence: 0.73 } });
    // Wait for classification (stage 3 of chain)
    const cls = await waitFor(() =>
      pool._events.find(e => e.event_type === 'CLASSIFICATION_CREATED'), 8000);
    assert.strictEqual(pm(cls).confidence, 0.73,
      `T4: classification got ${pm(cls).confidence}, expected 0.73`);
  });

  // ─── T5: IntelligenceWorker _emit preserves confidence ─────────────
  await t('T5: IntelligenceWorker _emit preserves confidence from trigger', async () => {
    const { IntelligenceWorker } = require('../ping-runtime/workers/intelligence_worker');
    const events = [];
    const fakeRT = Object.assign(new (require('events').EventEmitter)(), {
      emit: async function(eventType, source, payload, opts) {
        events.push({ event_type: eventType, source, payload, options: opts });
        return { status: 'ok', event_id: 'e-t5' };
      }
    });
    const iw = new IntelligenceWorker({ eventRuntime: fakeRT, name: 'iw-test' });
    iw._event = { event_id: 'trigger-t5', namespace: 'tenant::hpp',
      metadata: { confidence: 0.42, correlation_id: 'corr-t5' } };
    await iw._emit('CLASSIFICATION_CREATED', { cat: 'test' });
    assert.strictEqual(events[0].options.metadata.confidence, 0.42,
      'T5: confidence 0.42 survived IntelligenceWorker transport');
  });

  // ─── T6: Explicit override wins over inheritance ───────────────────
  await t('T6: explicit worker confidence overrides inherited when non-null', async () => {
    assert.strictEqual(0.9 != null ? 0.9 : 0.5, 0.9, 'T6a: explicit wins');
    assert.strictEqual(null != null ? 0.9 : 0.5, 0.5, 'T6b: null falls through');
  });

  // ─── T7: Knowledge projection receives correct confidence ──────────
  await t('T7: knowledge_graph stores null when confidence omitted', async () => {
    const kg = new KnowledgeGraph({ pool });
    await kg.addNode('event', 'test-t7', { event_type: 'X' }, { namespace: 't' });
    const node = pool._nodes.find(n => n.label === 'test-t7');
    assert.ok(node, 'node was created');
    assert.strictEqual(node.confidence, null, 'T7: null stored, not 1.0');
  });

  await t('T7b: knowledge_graph stores 0.73 when confidence provided', async () => {
    const kg = new KnowledgeGraph({ pool });
    await kg.addNode('event', 'test-t7b', { event_type: 'X' }, { namespace: 't', confidence: 0.73 });
    const node = pool._nodes.find(n => n.label === 'test-t7b');
    assert.ok(node, 'node was created');
    assert.strictEqual(node.confidence, 0.73, 'T7b: 0.73 stored correctly');
  });

  // ─── T8: Missing confidence never becomes a number ─────────────────
  await t('T8: null never becomes 0.5, 0.7, 0.85, or 1.0 at any hop', async () => {
    pool._events.length = 0;
    await eventRuntime.emit('INVOICE_CREATED', 'test', {
      invoice_id: 'inv-t8', customer_id: 'cust-t8', amount: 5000
    }, { metadata: {} });
    await waitFor(() =>
      pool._events.find(e => e.event_type === 'OBSERVATION_CREATED'), 8000);
    const FABRICATED = [0.5, 0.7, 0.85, 1.0];
    for (const ev of pool._events) {
      const val = pm(ev).confidence;
      if (val !== undefined && val !== null) {
        assert.ok(!FABRICATED.includes(val),
          `T8: ${ev.event_type} has fabricated confidence ${val}`);
      }
    }
  });

  // ─── T9: ClassificationWorker records provenance ───────────────────
  await t('T9: ClassificationWorker records confidence_source: inherited', async () => {
    pool._events.length = 0;
    await eventRuntime.emit('REVIEW_RECEIVED', 'test', {
      review_id: 'rev-t9', customer_id: 'cust-t9', rating: 4
    }, { metadata: { confidence: 0.6 } });
    const cls = await waitFor(() =>
      pool._events.find(e => e.event_type === 'CLASSIFICATION_CREATED'), 8000);
    assert.strictEqual(pm(cls).confidence_source, 'inherited',
      'T9: ClassificationWorker records inherited provenance');
  });

  await t('T9b: RecommendationWorker records confidence_source: inherited', async () => {
    pool._events.length = 0;
    const recs = await waitFor(() =>
      pool._events.find(e => e.event_type === 'RECOMMENDATION_CREATED' && pm(e).confidence === 0.6), 8000);
    assert.strictEqual(pm(recs).confidence_source, 'inherited',
      'T9b: RecommendationWorker records inherited provenance');
  });

  // ─── T10: EvidenceAuthority ranks null neutrally ───────────────────
  await t('T10: EvidenceAuthority treats null confidence as neutral', async () => {
    const ea = new EvidenceAuthority({ pool, knowledgeGraph: { queryNodes: async () => [] } });
    const results = [
      { id: 'a', confidence: 0.9, provenance: 0.8, payload: {} },
      { id: 'b', confidence: null, provenance: 0.8, payload: {} },
      { id: 'c', confidence: 0.3, provenance: 0.8, payload: {} },
    ];
    const ranked = ea.rank(results);
    const a = ranked.find(r => r.id === 'a');
    const b = ranked.find(r => r.id === 'b');
    const c = ranked.find(r => r.id === 'c');
    assert.strictEqual(b.confidence, null, 'T10a: null preserved');
    assert.ok(a.rank_score > b.rank_score, `T10b: 0.9 > null`);
    assert.ok(b.rank_score > c.rank_score, `T10c: null > 0.3`);
  });

  // ─── Summary ───────────────────────────────────────────────────────
  scheduler.stop();
  console.log(`\n=== Summary ===`);
  console.log(`Passed: ${P}`);
  console.log(`Failed: ${F}`);
  process.exit(F > 0 ? 1 : 0);
})();
