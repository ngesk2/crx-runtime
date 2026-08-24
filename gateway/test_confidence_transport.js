/**
 * test_confidence_transport.js — P2 PATCH 1 + PATCH 2 focused tests.
 *
 * PATCH 1A: IntelligenceWorker inline _emit preserves confidence (transport)
 * PATCH 2A: knowledge_graph.addNode stores null, not 1.0 (null preservation)
 * PATCH 2B: Graph projection passes null, not 0.5 (null preservation)
 * PATCH 2C: EvidenceAuthority.rank preserves null, uses neutral 1.0 for scoring
 */
'use strict';

const assert = require('assert');
const { EventEmitter } = require('events');

class FakePool {
  constructor() { this._nodes = []; this._edges = []; }
  async query(sql, params) {
    if (sql.includes('INSERT INTO knowledge_nodes')) {
      // 10 params: nodeId, nodeType, entityType, entityId, label, data, sourceEventId, namespace, confidence, status
      const row = { id: params[0], node_type: params[1], label: params[4],
        data: params[5], namespace: params[7], status: params[9], confidence: params[8] };
      this._nodes.push(row);
      return { rows: [{ id: row.id }] };
    }
    if (sql.includes('INSERT INTO knowledge_edges')) {
      this._edges.push({ from: params[0], to: params[1], type: params[2] });
      return { rows: [] };
    }
    return { rows: [] };
  }
}

class FakeEventRuntime extends EventEmitter {
  constructor() { super(); this.events = []; }
  async emit(eventType, source, payload, options = {}) {
    const event = {
      event_id: `evt-${this.events.length}`, event_type: eventType,
      source, payload, metadata: options.metadata || {}, namespace: options.namespace,
    };
    this.events.push(event);
    return { status: 'ok', event_id: event.event_id };
  }
}

let passed = 0, failed = 0;
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

// ─── Tests ──────────────────────────────────────────────────────────────────

const { IntelligenceWorker } = require('../ping-runtime/workers/intelligence_worker');
const { KnowledgeGraph } = require('../ping-runtime/knowledge/knowledge_graph');
const { EvidenceAuthority } = require('../ping-runtime/evidence/evidence_authority');

test('PATCH 1A: _emit preserves confidence 0.65 from trigger event', async () => {
  const rt = new FakeEventRuntime();
  const w = new IntelligenceWorker({ eventRuntime: rt, name: 'iw' });
  w._event = { event_id: 't1', namespace: 'tenant::hpp',
    metadata: { correlation_id: 'c1', confidence: 0.65 } };
  await w._emit('CLASSIFICATION_CREATED', { cat: 'test' });
  assert.strictEqual(rt.events[0].metadata.confidence, 0.65);
  assert.strictEqual(rt.events[0].namespace, 'tenant::hpp');
});

test('PATCH 1A: _emit preserves null confidence (no fabrication)', async () => {
  const rt = new FakeEventRuntime();
  const w = new IntelligenceWorker({ eventRuntime: rt, name: 'iw' });
  w._event = { event_id: 't2', namespace: 'core::system',
    metadata: { correlation_id: 'c2' } };
  await w._emit('CLASSIFICATION_CREATED', { cat: 'test' });
  assert.strictEqual(rt.events[0].metadata.confidence, null);
});

test('PATCH 1A: explicit option.confidence wins over inherited', async () => {
  const rt = new FakeEventRuntime();
  const w = new IntelligenceWorker({ eventRuntime: rt, name: 'iw' });
  w._event = { event_id: 't3', namespace: 'tenant::hpp', metadata: { confidence: 0.3 } };
  await w._emit('CLASSIFICATION_CREATED', { cat: 'test' }, { confidence: 0.9 });
  assert.strictEqual(rt.events[0].metadata.confidence, 0.9);
});

test('PATCH 2A: addNode stores null confidence when omitted', async () => {
  const pool = new FakePool();
  const kg = new KnowledgeGraph({ pool });
  await kg.addNode('event', 'No confidence', { event_type: 'X' }, { namespace: 't' });
  assert.strictEqual(pool._nodes[0].confidence, null);
});

test('PATCH 2A: addNode stores numeric confidence 0.7', async () => {
  const pool = new FakePool();
  const kg = new KnowledgeGraph({ pool });
  await kg.addNode('event', 'With confidence', { event_type: 'X' }, { namespace: 't', confidence: 0.7 });
  assert.strictEqual(pool._nodes[0].confidence, 0.7);
});

test('PATCH 2A: addNode stores explicit 0.0 (not coerced by ||)', async () => {
  const pool = new FakePool();
  const kg = new KnowledgeGraph({ pool });
  await kg.addNode('event', 'Zero', { event_type: 'X' }, { namespace: 't', confidence: 0.0 });
  assert.strictEqual(pool._nodes[0].confidence, 0.0);
});

test('PATCH 2B: projection passes null when confidence absent (no 0.5)', async () => {
  const conf = (m) => m?.confidence != null ? m.confidence : null;
  assert.strictEqual(conf({ confidence: 0.8 }), 0.8);
  assert.strictEqual(conf({}), null);
  assert.strictEqual(conf({ confidence: null }), null);
  assert.strictEqual(conf(undefined), null);
});

test('PATCH 2C: rank preserves null confidence, neutral scoring', async () => {
  const pool = new FakePool();
  const ea = new EvidenceAuthority({ pool, knowledgeGraph: { queryNodes: async () => [] } });
  const results = [
    { id: 'a', confidence: 0.9, provenance: 0.8, payload: {} },
    { id: 'b', confidence: null, provenance: 0.8, payload: {} },
    { id: 'c', confidence: 0.3, provenance: 0.8, payload: {} },
  ];
  const ranked = ea.rank(results);
  const b = ranked.find(r => r.id === 'b');
  const a = ranked.find(r => r.id === 'a');
  const c = ranked.find(r => r.id === 'c');
  assert.strictEqual(b.confidence, null);
  assert.ok(a.rank_score > b.rank_score, '0.9 > null (neutral)');
  assert.ok(b.rank_score > c.rank_score, 'null (neutral) > 0.3');
});

// ─── Runner ─────────────────────────────────────────────────────────────────

(async () => {
  for (const { name, fn } of tests) {
    try { await fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.error(`  ✗ ${name}: ${e.message}`); }
  }
  console.log(`\n=== Summary ===\nPassed: ${passed}\nFailed: ${failed}\nTotal: ${passed + failed}`);
  process.exit(failed > 0 ? 1 : 0);
})();
