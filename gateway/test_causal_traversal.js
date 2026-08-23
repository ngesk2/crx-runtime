/**
 * Tests for UnifiedEventRuntime causal traversal queries.
 * Covers: getChildren, getDescendants, getAncestors, getCorrelationGroup.
 *
 * Uses mock pool — no live Postgres required.
 */
const assert = require('assert');

const { UnifiedEventRuntime } = require('../ping-runtime/events/unified_event_runtime');

function makeRuntime() {
  let queryFn;
  const pool = {
    query: (...args) => queryFn(...args),
  };
  const rt = new UnifiedEventRuntime({ pool });
  return {
    rt,
    mockQuery: (fn) => { queryFn = fn; },
  };
}

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${name}: ${err.message}`);
  }
}

// Seed data: 4-event chain
// REVIEW_RECEIVED → OBSERVATION → CLAIM → CLASSIFICATION
const ROOT = 'root-event-id-aaaa';
const OBS = 'observation-id-bbbb';
const CLAIM = 'claim-id-cccc';
const CLASS = 'classification-id-dddd';

const chain = [
  { event_id: ROOT, event_type: 'REVIEW_RECEIVED', source: 'ingest', metadata: { correlation_id: ROOT, causation_id: null }, namespace: 'core::owner' },
  { event_id: OBS, event_type: 'OBSERVATION_CREATED', source: 'observation', metadata: { correlation_id: ROOT, causation_id: ROOT }, namespace: 'core::owner' },
  { event_id: CLAIM, event_type: 'CLAIM_CREATED', source: 'claim', metadata: { correlation_id: ROOT, causation_id: OBS }, namespace: 'core::owner' },
  { event_id: CLASS, event_type: 'CLASSIFICATION_CREATED', source: 'classification', metadata: { correlation_id: ROOT, causation_id: CLAIM }, namespace: 'core::owner' },
];

async function run() {
  console.log('Causal Traversal Tests\n');

  await test('TRAVERSAL-1: getChildren returns direct children', async () => {
    const { rt, mockQuery } = makeRuntime();
    mockQuery((sql, params) => {
      assert.ok(sql.includes("metadata->>'causation_id'"), 'query uses causation index');
      assert.strictEqual(params[0], ROOT);
      return { rows: [chain[1]], rowCount: 1 };
    });
    const result = await rt.getChildren(ROOT);
    assert.strictEqual(result.status, 'ok');
    assert.strictEqual(result.events.length, 1);
    assert.strictEqual(result.events[0].event_id, OBS);
  });

  await test('TRAVERSAL-2: getChildren returns empty for leaf', async () => {
    const { rt, mockQuery } = makeRuntime();
    mockQuery(() => ({ rows: [], rowCount: 0 }));
    const result = await rt.getChildren(CLASS);
    assert.strictEqual(result.status, 'ok');
    assert.strictEqual(result.events.length, 0);
  });

  await test('TRAVERSAL-3: getDescendants returns full tree with depth', async () => {
    const { rt, mockQuery } = makeRuntime();
    mockQuery((sql, params) => {
      assert.ok(sql.includes('WITH RECURSIVE causal_tree'), 'query is recursive CTE');
      assert.strictEqual(params[0], ROOT);
      return { rows: [
        { ...chain[0], depth: 0, path: [ROOT] },
        { ...chain[1], depth: 1, path: [ROOT, OBS] },
        { ...chain[2], depth: 2, path: [ROOT, OBS, CLAIM] },
        { ...chain[3], depth: 3, path: [ROOT, OBS, CLAIM, CLASS] },
      ], rowCount: 4 };
    });
    const result = await rt.getDescendants(ROOT);
    assert.strictEqual(result.status, 'ok');
    assert.strictEqual(result.events.length, 4);
    assert.strictEqual(result.events[0].depth, 0);
    assert.strictEqual(result.events[3].depth, 3);
    assert.strictEqual(result.events[0].event_type, 'REVIEW_RECEIVED');
    assert.strictEqual(result.events[3].event_type, 'CLASSIFICATION_CREATED');
  });

  await test('TRAVERSAL-4: getAncestors returns chain to root', async () => {
    const { rt, mockQuery } = makeRuntime();
    mockQuery((sql, params) => {
      assert.ok(sql.includes('causal_chain'), 'query is causal chain CTE');
      assert.strictEqual(params[0], CLASS);
      return { rows: [
        { ...chain[3], depth: 0 },
        { ...chain[2], depth: 1 },
        { ...chain[1], depth: 2 },
        { ...chain[0], depth: 3 },
      ], rowCount: 4 };
    });
    const result = await rt.getAncestors(CLASS);
    assert.strictEqual(result.status, 'ok');
    assert.strictEqual(result.events.length, 4);
    assert.strictEqual(result.events[0].event_type, 'CLASSIFICATION_CREATED');
    assert.strictEqual(result.events[3].event_type, 'REVIEW_RECEIVED');
  });

  await test('TRAVERSAL-5: getCorrelationGroup returns all correlated events', async () => {
    const { rt, mockQuery } = makeRuntime();
    mockQuery((sql, params) => {
      assert.ok(sql.includes("metadata->>'correlation_id'"), 'query uses correlation index');
      assert.strictEqual(params[0], ROOT);
      return { rows: chain.map(e => ({ ...e })), rowCount: 4 };
    });
    const result = await rt.getCorrelationGroup(ROOT);
    assert.strictEqual(result.status, 'ok');
    assert.strictEqual(result.events.length, 4);
    for (const evt of result.events) {
      assert.strictEqual(evt.metadata.correlation_id, ROOT);
    }
  });

  await test('TRAVERSAL-6: getAncestors stops at root (no parent)', async () => {
    const { rt, mockQuery } = makeRuntime();
    mockQuery(() => ({ rows: [{ ...chain[0], depth: 0 }], rowCount: 1 }));
    const result = await rt.getAncestors(ROOT);
    assert.strictEqual(result.status, 'ok');
    assert.strictEqual(result.events.length, 1);
    assert.strictEqual(result.events[0].event_id, ROOT);
  });

  await test('TRAVERSAL-7: getDescendants respects maxDepth', async () => {
    const { rt, mockQuery } = makeRuntime();
    mockQuery((sql, params) => {
      assert.strictEqual(params[2], 3); // maxDepth = 3
      return { rows: [
        { ...chain[0], depth: 0 },
        { ...chain[1], depth: 1 },
        { ...chain[2], depth: 2 },
      ], rowCount: 3 };
    });
    const result = await rt.getDescendants(ROOT, 3);
    assert.strictEqual(result.status, 'ok');
    assert.strictEqual(result.events.length, 3);
  });

  await test('TRAVERSAL-8: getAncestors returns empty for unknown event', async () => {
    const { rt, mockQuery } = makeRuntime();
    mockQuery(() => ({ rows: [], rowCount: 0 }));
    const result = await rt.getAncestors('nonexistent-id');
    assert.strictEqual(result.status, 'ok');
    assert.strictEqual(result.events.length, 0);
  });

  await test('TRAVERSAL-9: getCorrelationGroup returns empty for unknown correlation', async () => {
    const { rt, mockQuery } = makeRuntime();
    mockQuery(() => ({ rows: [], rowCount: 0 }));
    const result = await rt.getCorrelationGroup('unknown');
    assert.strictEqual(result.status, 'ok');
    assert.strictEqual(result.events.length, 0);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
