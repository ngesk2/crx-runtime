/**
 * Evidence Authority — Regression Tests (Phase E)
 *
 * Covers accumulate / verify / rank per PING_CANONICAL_BOUNDARY_PLAN.md E.1:
 *   - accumulate resolves supporting events from ping_events.
 *   - verify (valid canonical object) recomputes hash via canonicalObjectVerifier.
 *   - verify (tampered canonical object) is rejected + counted tampered.
 *   - verify (namespace consistency) rejects mismatched identity.namespace.
 *   - verify (Qdrant hit) traces source_event_id back to a real PG event.
 *   - rank down-ranks `embedding: 'fallback'`, prioritizes approved, last rejects.
 *
 * Run: node test_evidence_authority.js
 */

const assert = require('assert');
const { EvidenceAuthority } = require('./evidence_authority');

// ─── Test runner ──────────────────────────────────────────────────────
let passed = 0, failed = 0;
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

async function run() {
  console.log('=== Evidence Authority ===\n');
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

// ─── Mock pool with ping_events ───────────────────────────────────────

class MockPool {
  constructor(events = []) {
    this._events = events;
  }
  async query(sql, params = []) {
    const S = sql.trim();
    if (S.startsWith('SELECT') && S.includes('FROM ping_events')) {
      if (S.includes('WHERE event_id IN')) {
        const rows = this._events.filter((e) => params.includes(e.event_id));
        return { rows, rowCount: rows.length };
      }
      if (S.includes('WHERE event_id = $1')) {
        const rows = this._events.filter((e) => e.event_id === params[0]);
        return { rows, rowCount: rows.length };
      }
    }
    return { rows: [], rowCount: 0 };
  }
}

function backingEvent(eventId, overrides = {}) {
  return {
    event_id: eventId,
    event_type: 'OBSERVATION_CREATED',
    source: 'observation',
    timestamp: '2026-08-05T00:00:00.000Z',
    payload: { documentId: 'doc-1' },
    metadata: overrides.metadata || { canonical_hash: `hash-${eventId}` },
    namespace: 'core::owner',
    ...overrides,
  };
}

// ─── accumulate ───────────────────────────────────────────────────────

test('accumulate resolves supporting events from ping_events', async () => {
  const pool = new MockPool([
    backingEvent('evt-a'),
    backingEvent('evt-b'),
  ]);
  const authority = new EvidenceAuthority({ pool });
  const events = await authority.accumulate(['evt-a', 'evt-b', 'evt-missing']);
  assert.strictEqual(events.length, 2, 'resolves only existing events');
  assert.strictEqual(events[0].event_id, 'evt-a');
  assert.strictEqual(events[1].event_id, 'evt-b');
  assert.strictEqual(authority.getStats().accumulated, 2);
});

test('accumulate with no ids or no pool returns []', async () => {
  const pool = new MockPool([backingEvent('evt-a')]);
  const authority = new EvidenceAuthority({ pool });
  assert.deepStrictEqual(await authority.accumulate([]), []);
  assert.deepStrictEqual(await authority.accumulate(null), []);
  const noPool = new EvidenceAuthority({ eventRuntime: {} });
  assert.deepStrictEqual(await noPool.accumulate(['evt-a']), []);
});

// ─── verify — canonical object ────────────────────────────────────────

const goodVerifier = (obj) =>
  obj.canonical_hash === 'sha256-ok' ? { valid: true, error: null } : { valid: false, error: 'canonical_hash mismatch' };

test('verify: valid canonical object (hash + lineage + namespace consistent)', async () => {
  const authority = new EvidenceAuthority({ pool: new MockPool(), canonicalObjectVerifier: goodVerifier });
  const result = await authority.verify({
    kind: 'Observation',
    canonical_hash: 'sha256-ok',
    payload: { documentId: 'doc-1' },
    lineage: { source_id: 'evt-a', derivation_path: ['Event', 'Observation'] },
    namespace: 'core::owner',
    identity: { namespace: 'core::owner' },
  });
  assert.strictEqual(result.verified, true);
  assert.strictEqual(authority.getStats().verified, 1);
});

test('verify: tampered canonical object is rejected and counted tampered', async () => {
  const authority = new EvidenceAuthority({ pool: new MockPool(), canonicalObjectVerifier: goodVerifier });
  const result = await authority.verify({
    kind: 'Observation',
    canonical_hash: 'sha256-WRONG',
    payload: { documentId: 'doc-1' },
    lineage: { source_id: 'evt-a' },
    namespace: 'core::owner',
  });
  assert.strictEqual(result.verified, false);
  assert.ok(result.reason.includes('mismatch'));
  assert.strictEqual(authority.getStats().tampered, 1);
});

test('verify: namespace consistency — identity.namespace mismatch rejects', async () => {
  const authority = new EvidenceAuthority({ pool: new MockPool(), canonicalObjectVerifier: goodVerifier });
  const result = await authority.verify({
    kind: 'Observation',
    canonical_hash: 'sha256-ok',
    payload: { documentId: 'doc-1' },
    lineage: { source_id: 'evt-a' },
    namespace: 'core::owner',
    identity: { namespace: 'tenant::hpp' },
  });
  assert.strictEqual(result.verified, false, 'mismatched identity namespace must fail');
  assert.strictEqual(result.checks.namespace, false);
});

test('verify: missing lineage rejects', async () => {
  const authority = new EvidenceAuthority({ pool: new MockPool(), canonicalObjectVerifier: goodVerifier });
  const result = await authority.verify({
    kind: 'Observation',
    canonical_hash: 'sha256-ok',
    payload: { documentId: 'doc-1' },
    namespace: 'core::owner',
  });
  assert.strictEqual(result.verified, false);
  assert.strictEqual(result.checks.lineage, false);
});

// ─── verify — Qdrant hit ──────────────────────────────────────────────

test('verify: Qdrant hit traces source_event_id to backing PG event', async () => {
  const pool = new MockPool([
    backingEvent('evt-a', { metadata: { canonical_hash: 'hash-evt-a' } }),
  ]);
  const authority = new EvidenceAuthority({ pool, canonicalObjectVerifier: goodVerifier });
  const hit = {
    id: 'evt-a',
    score: 0.87,
    payload: { canonical_hash: 'hash-evt-a', namespace: 'core::owner', source_event_id: 'evt-a' },
  };
  const result = await authority.verify(hit);
  assert.strictEqual(result.verified, true);
  assert.strictEqual(result.checks.backingEvent, true);
});

test('verify: Qdrant hit with missing backing event is unverified', async () => {
  const authority = new EvidenceAuthority({ pool: new MockPool(), canonicalObjectVerifier: goodVerifier });
  const hit = {
    id: 'evt-ghost',
    score: 0.9,
    payload: { canonical_hash: 'hash-x', namespace: 'core::owner', source_event_id: 'evt-ghost' },
  };
  const result = await authority.verify(hit);
  assert.strictEqual(result.verified, false);
  assert.strictEqual(result.checks.backingEvent, false);
  assert.strictEqual(result.checks.hash, false, 'hash cannot be trusted without backing event');
});

test('verify: Qdrant hit namespace mismatch against backing row rejects', async () => {
  const pool = new MockPool([backingEvent('evt-a')]);
  const authority = new EvidenceAuthority({ pool });
  const hit = {
    id: 'evt-a',
    score: 0.8,
    payload: { canonical_hash: 'hash-evt-a', namespace: 'tenant::hpp', source_event_id: 'evt-a' },
  };
  const result = await authority.verify(hit);
  assert.strictEqual(result.verified, false);
  assert.strictEqual(result.checks.namespace, false);
});

test('verify: Qdrant hit canonical_hash must match backing metadata', async () => {
  const pool = new MockPool([backingEvent('evt-a')]);
  const authority = new EvidenceAuthority({ pool });
  const hit = {
    id: 'evt-a',
    score: 0.8,
    payload: { canonical_hash: 'hash-EVIL', namespace: 'core::owner', source_event_id: 'evt-a' },
  };
  const result = await authority.verify(hit);
  assert.strictEqual(result.verified, false);
  assert.strictEqual(result.checks.hash, false);
});

// ─── rank ─────────────────────────────────────────────────────────────

test('rank: approved first, fallback down-ranked, rejected last (controlled baseline)', async () => {
  const authority = new EvidenceAuthority({ pool: new MockPool() });
  const ranked = authority.rank([
    { id: 'fallback-hit', confidence: 1.0, provenance: 1.0, embedding: 'fallback' },
    { id: 'approved-node', confidence: 1.0, provenance: 1.0, approved: true },
    { id: 'rejected-node', confidence: 1.0, provenance: 1.0, rejected: true },
    { id: 'plain-node', confidence: 1.0, provenance: 1.0 },
  ]);
  assert.strictEqual(ranked[0].id, 'approved-node', 'approved promoted to top');
  assert.strictEqual(ranked[3].id, 'rejected-node', 'rejected last');
  const fallbackIdx = ranked.findIndex((r) => r.id === 'fallback-hit');
  const plainIdx = ranked.findIndex((r) => r.id === 'plain-node');
  assert.ok(plainIdx < fallbackIdx, 'fallback embedding down-ranked below plain node at equal baseline');
  assert.ok(ranked[plainIdx].rank_score > ranked[fallbackIdx].rank_score, 'fallback penalty applied');
  for (const r of ranked) {
    assert.strictEqual(typeof r.rank_score, 'number');
    assert.ok(r.rank_score >= 0);
  }
  assert.strictEqual(authority.getStats().ranked, 4);
});

test('rank: fallback detected via payload.embedding too', async () => {
  const authority = new EvidenceAuthority({ pool: new MockPool() });
  const ranked = authority.rank([
    { id: 'a', confidence: 1.0, provenance: 1.0, payload: { embedding: 'fallback' } },
    { id: 'b', confidence: 1.0, provenance: 1.0 },
  ]);
  assert.strictEqual(ranked[0].id, 'b', 'non-fallback first');
  assert.ok(ranked[0].rank_score > ranked[1].rank_score);
});

run();
