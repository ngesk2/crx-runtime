'use strict';
// AUTH-CONV-06 invariant: spine event identity is owned by IdentityAuthority
// (generateSpineEventId) with byte-identical scheme to the pre-change inline
// minting, and the collision check uses the single canonical serializer.
//
// Golden vectors were captured from the pre-change code 2026-09-24 before
// the inline minting was replaced. Any byte drift fails this test.
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { UnifiedEventRuntime } = require('./unified_event_runtime.js');
const { identityAuthority } = require('../authorities/identity_authority.js');
const { CanonicalBytes } = require('../authorities/canonical_authority.js');

const GOLDEN = [
  [
    'REVIEW_RECEIVED', 'email-connector',
    { payload: { a: 1 } },
    '247197fe66b8d98e7903659b23930745a3b7cbfe0c8f35b784625c53a51c8c91',
  ],
  [
    'REVIEW_RECEIVED', 'email-connector',
    { namespace: 'tenant::hpp', payload: { a: 1 } },
    'edc733f6896e65a740630dface9cb48b7e179838f3a93c5f9f831cdc6459d6bf',
  ],
  [
    'REVIEW_RECEIVED', 'email-connector',
    { namespace: 'tenant::hpp', logical_id: 'L1', payload: { a: 1 } },
    'c1fe05bcca559220430e9252a7df9acb4c92bb86c3c22e492464936262f0c032',
  ],
  [
    'CUSTOMER_CREATED', 'customer-authority',
    { payload: { nested: { x: [1, 2], y: 'z' } } },
    'ff90a33eb18b69f03f66740bd76be19965de987b5c681505abca6690a07f2fbf',
  ],
];

test('authority mints byte-identical golden event IDs', () => {
  for (const [type, source, options, expected] of GOLDEN) {
    assert.equal(
      identityAuthority.generateSpineEventId(type, source, options),
      expected,
      `drift for ${type}/${source}`
    );
  }
});

test('minting is deterministic and scheme-separated', () => {
  const a = identityAuthority.generateSpineEventId('T', 's', { payload: { a: 1 } });
  const b = identityAuthority.generateSpineEventId('T', 's', { payload: { a: 1 } });
  assert.equal(a, b, 'same input must mint same ID');
  assert.match(a, /^[0-9a-f]{64}$/, '64-char hex');
  const ns = identityAuthority.generateSpineEventId('T', 's', { namespace: 'n', payload: { a: 1 } });
  assert.notEqual(a, ns, 'namespace must change the ID');
  const lid = identityAuthority.generateSpineEventId('T', 's', { logical_id: 'L', payload: { a: 1 } });
  const lid2 = identityAuthority.generateSpineEventId('T', 's', { logical_id: 'L', payload: { a: 2 } });
  assert.equal(lid, lid2, 'logical_id must dominate payload (timestamp-stripped identity)');
});

test('UER.emit mints through the authority with identical bytes', async () => {
  const seen = [];
  const pool = {
    query: async (sql, params) => {
      seen.push({ sql, params });
      return { rowCount: 1, rows: [] };
    },
  };
  const uer = new UnifiedEventRuntime({ pool });
  for (const [type, source, options, expected] of GOLDEN) {
    seen.length = 0;
    const res = await uer.emit(type, source, options.payload, {
      namespace: options.namespace,
      logical_id: options.logical_id,
    });
    assert.equal(res.status, 'ok', `emit failed: ${res.error}`);
    assert.equal(res.eventId, expected, 'emit must return the golden ID');
    const insert = seen.find((q) => q.sql.includes('INSERT INTO ping_events'));
    assert.ok(insert, 'must persist via ping_events INSERT');
    assert.equal(insert.params[0], expected, 'INSERT event_id must be the golden ID');
  }
});

test('collision check uses deep-canonical bytes, not nested-blind shallow canon', () => {
  const p1 = { a: 1, nested: { x: 1, y: 2 } };
  const p4 = { a: 1, nested: { x: 1, y: 999 } }; // nested-only semantic difference
  // The OLD inline canon used an array replacer as a top-level whitelist, so
  // nested objects serialized as {} — nested differences were INVISIBLE and
  // the check silently treated semantically different payloads as duplicates.
  const oldCanon = (o) => JSON.stringify(o, Object.keys(o).sort());
  assert.equal(oldCanon(p1), oldCanon(p4), 'old shallow canon was nested-blind');
  // The declared single serializer sees the real difference -> fail closed works.
  assert.notEqual(
    CanonicalBytes.serializeString(p1),
    CanonicalBytes.serializeString(p4),
    'deep-canonical must detect nested semantic differences'
  );
  // And nested key reorder (same semantics) still compares equal:
  const p2 = { nested: { y: 2, x: 1 }, a: 1 };
  assert.equal(
    CanonicalBytes.serializeString(p1),
    CanonicalBytes.serializeString(p2),
    'deep-canonical must treat nested reorder as equal'
  );
});
