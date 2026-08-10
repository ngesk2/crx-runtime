/**
 * Canonical Object Envelope Tests
 *
 * Verifies the consolidated shared envelope contract:
 * - All producers build through createCanonicalObject()
 * - Deterministic ID and hash
 * - Verification recomputes hash correctly
 * - CanonicalObjectAuthority and ConstitutionalObjectFactory delegate
 *
 * Run: node test_canonical_object.js
 */

const assert = require('assert');

const {
  createCanonicalObject,
  verifyCanonicalObject,
  CANONICAL_OBJECT_SCHEMA_VERSION,
  CANONICAL_OBJECT_CONSTITUTION_VERSION,
} = require('../ping-runtime/canonicalization/canonical_object');
const { canonicalObjectAuthority } = require('./canonical_object_authority');
const { constitutionalObjectFactory } = require('./constitutional_object_factory');

// Test runner
let passed = 0;
let failed = 0;
const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function run() {
  console.log('=== Canonical Object Envelope Tests ===\n');
  for (const { name, fn } of tests) {
    try {
      fn();
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

// --- Envelope shape ---

test('createCanonicalObject returns full envelope contract', () => {
  const obj = createCanonicalObject({
    kind: 'Symbol',
    payload: { name: 'foo', language: 'js' },
    authority: 'TestAuthority',
  });
  const required = [
    'id', 'kind', 'authority', 'canonical_hash', 'canonical_bytes',
    'identity', 'lineage', 'relationships', 'health', 'confidence',
    'metadata', 'payload', 'witness', 'certificate',
    'schema_version', 'constitution_version',
  ];
  for (const field of required) {
    assert.ok(obj[field] !== undefined, `missing field: ${field}`);
  }
});

test('requires kind, payload, authority', () => {
  assert.throws(() => createCanonicalObject({ payload: {}, authority: 'A' }));
  assert.throws(() => createCanonicalObject({ kind: 'K', authority: 'A' }));
  assert.throws(() => createCanonicalObject({ kind: 'K', payload: {} }));
});

// --- Determinism ---

test('ID and hash are deterministic for identical input', () => {
  const input = { kind: 'Symbol', payload: { name: 'foo', signature: 'x' }, authority: 'A' };
  const a = createCanonicalObject(input);
  const b = createCanonicalObject(input);
  assert.strictEqual(a.id, b.id);
  assert.strictEqual(a.canonical_hash, b.canonical_hash);
});

test('ID and hash change with payload', () => {
  const a = createCanonicalObject({ kind: 'Symbol', payload: { name: 'foo' }, authority: 'A' });
  const b = createCanonicalObject({ kind: 'Symbol', payload: { name: 'bar' }, authority: 'A' });
  assert.notStrictEqual(a.id, b.id);
  assert.notStrictEqual(a.canonical_hash, b.canonical_hash);
});

test('ID is content-addressed from canonical bytes', () => {
  const obj = createCanonicalObject({ kind: 'Commit', payload: { sha: 'abc' }, authority: 'A' });
  assert.ok(obj.id.startsWith('Commit_'));
});

// --- Verification ---

test('verifyCanonicalObject recomputes hash from payload', () => {
  const obj = createCanonicalObject({ kind: 'Repository', payload: { name: 'r' }, authority: 'A' });
  assert.deepStrictEqual(verifyCanonicalObject(obj), { valid: true, error: null });
});

test('verifyCanonicalObject detects tampered payload', () => {
  const obj = createCanonicalObject({ kind: 'Repository', payload: { name: 'r' }, authority: 'A' });
  obj.payload.name = 'tampered';
  const result = verifyCanonicalObject(obj);
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.error, 'canonical_hash mismatch');
});

test('verifyCanonicalObject rejects malformed input', () => {
  assert.strictEqual(verifyCanonicalObject(null).valid, false);
  assert.strictEqual(verifyCanonicalObject({}).valid, false);
  assert.strictEqual(verifyCanonicalObject({ kind: 'K', payload: 'x' }).valid, false);
});

// --- Producer delegation ---

test('CanonicalObjectAuthority.create delegates to shared envelope', () => {
  const obj = canonicalObjectAuthority.create('Symbol', { name: 'foo', language: 'js' });
  assert.strictEqual(obj.authority, 'CanonicalObjectAuthority');
  assert.deepStrictEqual(verifyCanonicalObject(obj), { valid: true, error: null });
  assert.strictEqual(obj.schema_version, CANONICAL_OBJECT_SCHEMA_VERSION);
});

test('CanonicalObjectAuthority honors lineage options', () => {
  const obj = canonicalObjectAuthority.create('Commit', { sha: 'abc' }, {
    derivation_path: ['Repo', 'Commit'],
    provenance_chain: ['repo_1'],
  });
  assert.deepStrictEqual(obj.lineage.derivation_path, ['Repo', 'Commit']);
  assert.deepStrictEqual(obj.lineage.provenance_chain, ['repo_1']);
});

test('ConstitutionalObjectFactory.createObject delegates to shared envelope', () => {
  const obj = constitutionalObjectFactory.createObject({
    id: 'sym_1',
    kind: 'Symbol',
    payload: { canonical_name: 'foo' },
    authority: 'SymbolObjectAuthority',
  });
  assert.strictEqual(obj.id, 'sym_1');
  assert.strictEqual(obj.authority, 'SymbolObjectAuthority');
  assert.deepStrictEqual(verifyCanonicalObject(obj), { valid: true, error: null });
});

test('Factory keeps legacy lineage contract (source_id/source_kind)', () => {
  const obj = constitutionalObjectFactory.createObject({
    id: 'sym_1',
    kind: 'Symbol',
    payload: { canonical_name: 'foo' },
    authority: 'A',
    sourceId: 'ast_9',
    sourceKind: 'AST',
  });
  assert.strictEqual(obj.lineage.source_id, 'ast_9');
  assert.strictEqual(obj.lineage.source_kind, 'AST');
});

test('ConstitutionalObjectFactory.createSymbol produces valid envelope', () => {
  const obj = constitutionalObjectFactory.createSymbol({
    canonical_name: 'Foo.bar',
    language: 'TypeScript',
    kind: 'Method',
    signature: 'Foo.bar(x: number): string',
  });
  assert.strictEqual(obj.kind, 'Symbol');
  assert.deepStrictEqual(verifyCanonicalObject(obj), { valid: true, error: null });
});

run();
