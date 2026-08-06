/**
 * Phase E+F: Evidence Verification + Hybrid Search + Knowledge Promotion
 *
 * Covers the retrieval + promotion front door end-to-end:
 *   E1: HybridSearch verifies every semantic hit against ping_events and drops
 *       foreign-namespace hits (privacy boundary).
 *   E2: POST /knowledge/search requires namespace + returns evidence+verified.
 *   E3: EvidenceAuthority.rank promotes approved, down-ranks fallback/rejected.
 *   F1: KnowledgePromoter promotes candidate → approved (confidence 1.0) on
 *       SNIPPET_APPROVED / AI_RESPONSE_ACCEPTED; down-ranks on rejection.
 *   F2: Promotion events are registered in the generated event registry.
 *
 * Run: node test_knowledge_search.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { KnowledgeGraph } = require('../ping-runtime/knowledge/knowledge_graph');
const { KnowledgePromoter } = require('../ping-runtime/knowledge/knowledge_promoter');
const { EvidenceAuthority } = require('../ping-runtime/evidence/evidence_authority');
const { HybridSearch } = require('../ping-runtime/search/hybrid_search');
const createKnowledgeRoutes = require('./routes/knowledge');

// ─── Test runner ──────────────────────────────────────────────────────
let passed = 0, failed = 0;
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

async function run() {
  console.log('=== Phase E+F: Evidence + Hybrid Search + Promotion ===\n');
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

// ─── Mock pool: knowledge_nodes + ping_events ─────────────────────────

class MockPool {
  constructor() {
    this._nodes = [];
    this._events = [];
  }

  addEvent(row) { this._events.push(row); return this; }

  async query(sql, params = []) {
    const S = sql.trim();

    // Knowledge graph DDL
    if (S.includes('knowledge_nodes') && S.includes('namespace VARCHAR')) {
      return { rows: [], rowCount: 0 };
    }
    if (S.includes('ADD COLUMN IF NOT EXISTS')) {
      return { rows: [], rowCount: 0 };
    }
    if (S.includes('CREATE INDEX IF NOT EXISTS')) {
      return { rows: [], rowCount: 0 };
    }
    if (S.includes('knowledge_edges') && S.includes('edge_id VARCHAR')) {
      return { rows: [], rowCount: 0 };
    }

    // ping_events SELECT (EvidenceAuthority)
    if (S.includes('FROM ping_events') && S.includes('WHERE event_id IN')) {
      const rows = this._events.filter(e => params.includes(e.event_id));
      return { rows, rowCount: rows.length };
    }
    if (S.includes('FROM ping_events') && S.includes('WHERE event_id = $1')) {
      const rows = this._events.filter(e => e.event_id === params[0]);
      return { rows, rowCount: rows.length };
    }

    // INSERT INTO knowledge_nodes
    if (S.includes('INSERT INTO knowledge_nodes')) {
      this._nodes.push({
        node_id: params[0], node_type: params[1], entity_type: params[2],
        entity_id: params[3], label: params[4], data: JSON.parse(params[5]),
        source_event_id: params[6], namespace: params[7],
        confidence: params[8], status: params[9],
        created_at: new Date().toISOString(),
      });
      return { rows: [], rowCount: 1 };
    }

    // UPDATE knowledge_nodes (KnowledgePromoter via updateNodeBySourceEvent)
    // Param order in the real SQL: WHERE source_event_id=$1 [, namespace=$2] then SET status=$, confidence=$.
    if (S.includes('UPDATE knowledge_nodes SET')) {
      const sourceEventId = params[0];
      const hasNsGuard = S.includes('AND namespace = $');
      const setStatus = S.includes('status = $');
      const setConfidence = S.includes('confidence = $');
      let setStart = hasNsGuard ? 2 : 1;
      const statusVal = setStatus ? params[setStart++] : null;
      const confidenceVal = setConfidence ? params[setStart++] : null;
      const nsGuard = hasNsGuard ? params[1] : null;
      const node = this._nodes.find(n =>
        n.source_event_id === sourceEventId &&
        (nsGuard == null || n.namespace === nsGuard)
      );
      if (!node) return { rows: [], rowCount: 0 };
      if (setStatus) node.status = statusVal;
      if (setConfidence) node.confidence = confidenceVal;
      return { rows: [], rowCount: 1 };
    }

    // SELECT * FROM knowledge_nodes (queryNodes / getNeighborhood / getStats)
    if (S.includes('SELECT * FROM knowledge_nodes')) {
      let rows = this._nodes.slice();
      let p = 0;
      if (S.includes('WHERE node_id = $1')) {
        rows = rows.filter(n => n.node_id === params[0]);
      } else {
        if (S.includes('AND namespace = $')) {
          const ns = params[p++];
          rows = rows.filter(n => n.namespace === ns);
        }
        if (S.includes('AND status = $')) {
          const st = params[p++];
          rows = rows.filter(n => n.status === st);
        }
        if (S.includes('ILIKE')) {
          const term = params[p++].replace(/%/g, '');
          rows = rows.filter(n => n.label.includes(term) || JSON.stringify(n.data).includes(term));
        }
        if (S.includes('LIMIT $')) {
          const lim = params[p++];
          rows = rows.slice(0, lim);
        }
      }
      return { rows, rowCount: rows.length };
    }

    // knowledge_edges reads
    if (S.includes('FROM knowledge_edges') && S.includes('SELECT COUNT')) {
      return { rows: [{ count: '0' }], rowCount: 1 };
    }
    if (S.includes('FROM knowledge_edges') && S.includes('WHERE source_id')) {
      return { rows: [], rowCount: 0 };
    }
    if (S.includes('FROM knowledge_nodes') && S.includes('SELECT COUNT')) {
      return { rows: [{ count: String(this._nodes.length) }], rowCount: 1 };
    }
    if (S.includes('GROUP BY node_type')) {
      return { rows: [], rowCount: 0 };
    }
    if (S.includes('SELECT COUNT') && S.includes('FROM knowledge_nodes')) {
      return { rows: [{ count: String(this._nodes.length) }], rowCount: 1 };
    }

    return { rows: [], rowCount: 0 };
  }
}

function backingEvent(eventId, namespace, overrides = {}) {
  return {
    event_id: eventId,
    event_type: 'OBSERVATION_CREATED',
    source: 'observation',
    timestamp: '2026-08-05T00:00:00.000Z',
    payload: { text: 'cedar fence needs repair' },
    metadata: { canonical_hash: `hash-${eventId}` },
    namespace,
    ...overrides,
  };
}

/** Fake embedding service — returns scripted Qdrant hits. */
function fakeEmbeddingService(hits) {
  return {
    async search(query, options = {}) {
      return hits;
    },
  };
}

function hit({ id, namespace, canonicalHash, sourceEventId, score = 0.8, embedding = 'ollama' }) {
  return {
    id,
    score,
    payload: {
      kind: 'OBSERVATION_CREATED',
      namespace,
      canonical_hash: canonicalHash,
      source_event_id: sourceEventId,
      embedding,
      text: 'cedar fence needs repair',
    },
  };
}

/** Build the full Phase E/F stack over a shared pool. */
function buildStack(pool) {
  const kg = new KnowledgeGraph({ pool });
  const evidence = new EvidenceAuthority({
    pool,
    eventRuntime: null,
    canonicalObjectVerifier: (obj) =>
      obj.canonical_hash === obj.canonical_hash && typeof obj.canonical_hash === 'string'
        ? { valid: true, error: null }
        : { valid: false, error: 'no hash' },
  });
  return { kg, evidence };
}

// ─── E1: HybridSearch verification + namespace boundary ────────────────

test('E1: verified hits carry evidence + verified=true; foreign namespace dropped', async () => {
  const pool = new MockPool();
  pool.addEvent(backingEvent('evt-a', 'core::owner', { metadata: { canonical_hash: 'hash-evt-a' } }));
  const { kg, evidence } = buildStack(pool);
  const hybrid = new HybridSearch({
    embeddingService: fakeEmbeddingService([
      hit({ id: 'evt-a', namespace: 'core::owner', canonicalHash: 'hash-evt-a', sourceEventId: 'evt-a' }),
      hit({ id: 'evt-tenant', namespace: 'tenant::hpp', canonicalHash: 'hash-tenant', sourceEventId: 'evt-tenant' }),
    ]),
    evidenceAuthority: evidence,
    knowledgeGraph: kg,
  });

  const result = await hybrid.search({ query: 'cedar fence', namespace: 'core::owner' });
  assert.strictEqual(result.results.length, 1, 'tenant::hpp hit dropped by namespace boundary');
  const r = result.results[0];
  assert.strictEqual(r.verified, true, 'hit traced to backing PG event');
  assert.deepStrictEqual(r.evidence, ['evt-a']);
  assert.strictEqual(r.canonical_hash, 'hash-evt-a');
  assert.strictEqual(r.namespace, 'core::owner');
  assert.strictEqual(r.source, 'qdrant');
});

test('E1: unverifiable hit (no backing event) returns verified=false', async () => {
  const pool = new MockPool(); // empty ping_events
  const { kg, evidence } = buildStack(pool);
  const hybrid = new HybridSearch({
    embeddingService: fakeEmbeddingService([
      hit({ id: 'evt-ghost', namespace: 'core::owner', canonicalHash: 'hash-ghost', sourceEventId: 'evt-ghost' }),
    ]),
    evidenceAuthority: evidence,
    knowledgeGraph: kg,
  });
  const result = await hybrid.search({ query: 'cedar fence', namespace: 'core::owner' });
  assert.strictEqual(result.results.length, 1);
  assert.strictEqual(result.results[0].verified, false, 'ghost hit not verified');
});

// ─── E2: POST /knowledge/search route ──────────────────────────────────

test('E2: POST /knowledge/search returns verified results over HTTP', async () => {
  const pool = new MockPool();
  pool.addEvent(backingEvent('evt-a', 'core::owner', { metadata: { canonical_hash: 'hash-evt-a' } }));
  const { kg, evidence } = buildStack(pool);
  const hybrid = new HybridSearch({
    embeddingService: fakeEmbeddingService([
      hit({ id: 'evt-a', namespace: 'core::owner', canonicalHash: 'hash-evt-a', sourceEventId: 'evt-a' }),
    ]),
    evidenceAuthority: evidence,
    knowledgeGraph: kg,
  });

  const express = require('express');
  const app = express();
  app.use(express.json());
  app.use('/knowledge', createKnowledgeRoutes(kg, { hybridSearch: hybrid }));
  const server = await new Promise(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;

  try {
    const missing = await fetch(`http://127.0.0.1:${port}/knowledge/search`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: 'cedar fence' }), // no namespace
    });
    assert.strictEqual(missing.status, 400, 'namespace required');

    const ok = await fetch(`http://127.0.0.1:${port}/knowledge/search`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: 'cedar fence', namespace: 'core::owner' }),
    });
    const body = await ok.json();
    assert.strictEqual(ok.status, 200);
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.total, 1);
    assert.strictEqual(body.results[0].verified, true);
    assert.deepStrictEqual(body.results[0].evidence, ['evt-a']);
  } finally {
    server.close();
  }
});

test('E2: POST /knowledge/search 503 when hybrid search unavailable', async () => {
  const pool = new MockPool();
  const kg = new KnowledgeGraph({ pool });
  const express = require('express');
  const app = express();
  app.use(express.json());
  app.use('/knowledge', createKnowledgeRoutes(kg, { hybridSearch: null }));
  const server = await new Promise(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;
  try {
    const res = await fetch(`http://127.0.0.1:${port}/knowledge/search`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: 'x', namespace: 'core::owner' }),
    });
    assert.strictEqual(res.status, 503);
  } finally {
    server.close();
  }
});

// ─── E3: Ranking ───────────────────────────────────────────────────────

test('E3: rank promotes approved, down-ranks fallback and rejected', async () => {
  const pool = new MockPool();
  const { evidence } = buildStack(pool);
  const ranked = evidence.rank([
    { id: 'r', confidence: 1.0, provenance: 1.0, rejected: true },
    { id: 'a', confidence: 1.0, provenance: 1.0, approved: true },
    { id: 'f', confidence: 1.0, provenance: 1.0, embedding: 'fallback' },
    { id: 'p', confidence: 1.0, provenance: 1.0 },
  ]);
  assert.strictEqual(ranked[0].id, 'a');
  assert.strictEqual(ranked[3].id, 'r');
  const pIdx = ranked.findIndex(x => x.id === 'p');
  const fIdx = ranked.findIndex(x => x.id === 'f');
  assert.ok(pIdx < fIdx, 'plain above fallback at equal baseline');
});

// ─── F1: KnowledgePromoter ─────────────────────────────────────────────

async function seedCandidate(pool, sourceEventId, namespace) {
  const kg = new KnowledgeGraph({ pool });
  await kg.addNode('event', `OBSERVATION ${sourceEventId}`, { event_type: 'OBSERVATION_CREATED' }, {
    namespace,
    confidence: 0.5,
    status: 'candidate',
    sourceEventId,
  });
  return kg;
}

test('F1: SNIPPET_APPROVED promotes candidate to approved confidence 1.0', async () => {
  const pool = new MockPool();
  const kg = await seedCandidate(pool, 'evt-a', 'core::owner');
  const promoter = new KnowledgePromoter({ pool, knowledgeGraph: kg });

  const result = await promoter.handle({
    event_type: 'SNIPPET_APPROVED',
    payload: { sourceEventId: 'evt-a', namespace: 'core::owner' },
  });
  assert.strictEqual(result.promoted, true);
  assert.strictEqual(result.status, 'approved');
  const node = pool._nodes[0];
  assert.strictEqual(node.status, 'approved');
  assert.strictEqual(node.confidence, 1.0);
});

test('F1: AI_RESPONSE_REJECTED marks node rejected (down-ranked later)', async () => {
  const pool = new MockPool();
  const kg = await seedCandidate(pool, 'evt-a', 'core::owner');
  const promoter = new KnowledgePromoter({ pool, knowledgeGraph: kg });

  const result = await promoter.handle({
    event_type: 'AI_RESPONSE_REJECTED',
    payload: { sourceEventId: 'evt-a', namespace: 'core::owner' },
  });
  assert.strictEqual(result.status, 'rejected');
  assert.strictEqual(pool._nodes[0].status, 'rejected');
  assert.strictEqual(pool._nodes[0].confidence, 0.2);
});

test('F1: promoter returns notFound for unknown sourceEventId', async () => {
  const pool = new MockPool();
  const kg = await seedCandidate(pool, 'evt-a', 'core::owner');
  const promoter = new KnowledgePromoter({ pool, knowledgeGraph: kg });
  const result = await promoter.handle({
    event_type: 'SNIPPET_APPROVED',
    payload: { sourceEventId: 'evt-missing', namespace: 'core::owner' },
  });
  assert.strictEqual(result.promoted, false);
  assert.strictEqual(promoter.getStats().notFound, 1);
});

test('F1: promoted node ranks above its candidate peer in search', async () => {
  const pool = new MockPool();
  const kg = new KnowledgeGraph({ pool });
  await kg.addNode('event', 'cedar fence approved', { event_type: 'OBSERVATION_CREATED' }, {
    namespace: 'core::owner',
    confidence: 0.5,
    status: 'candidate',
    sourceEventId: 'evt-approved',
  });
  await kg.addNode('event', 'cedar fence candidate', { event_type: 'OBSERVATION_CREATED' }, {
    namespace: 'core::owner',
    confidence: 0.5,
    status: 'candidate',
    sourceEventId: 'evt-candidate',
  });
  const { evidence } = buildStack(pool);
  const hybrid = new HybridSearch({ evidenceAuthority: evidence, knowledgeGraph: kg });

  // Approve evt-approved via promoter
  const promoter = new KnowledgePromoter({ pool, knowledgeGraph: kg });
  await promoter.handle({
    event_type: 'SNIPPET_APPROVED',
    payload: { sourceEventId: 'evt-approved', namespace: 'core::owner' },
  });

  const result = await hybrid.search({ query: 'cedar fence', namespace: 'core::owner', limit: 10 });
  assert.strictEqual(result.results.length, 2);
  // hybrid only ranks KG nodes with evidenceAuthority — verify both return;
  // the approved node's rank_score must beat the candidate's.
  const approved = result.results.find(r => r.evidence.includes('evt-approved'));
  const candidate = result.results.find(r => r.evidence.includes('evt-candidate'));
  assert.ok(approved, 'approved node returned');
  assert.ok(candidate, 'candidate node returned');
  assert.strictEqual(approved.status, 'approved');
  assert.strictEqual(candidate.status, 'candidate');
  const aIdx = result.results.indexOf(approved);
  const cIdx = result.results.indexOf(candidate);
  assert.ok(aIdx < cIdx, 'approved outranks candidate');
});

// ─── F2: Registry registration ─────────────────────────────────────────

test('F2: promotion event types registered in generated event registry', () => {
  const registryPath = path.join(__dirname, 'generated', 'event_registry.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  const types = new Set(registry.events.map(e => e.event_type));
  for (const t of ['SNIPPET_APPROVED', 'SNIPPET_REJECTED', 'AI_RESPONSE_ACCEPTED', 'AI_RESPONSE_REJECTED']) {
    assert.ok(types.has(t), `${t} registered in event_registry.json`);
  }
});

run();
