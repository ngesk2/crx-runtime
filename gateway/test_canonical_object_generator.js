/**
 * Canonical Object Generator Tests
 *
 * Verifies the Stage 1 source code ingestion pipeline:
 * - tree-sitter parse produces canonical Symbol/File/Repository objects
 * - All objects pass the shared envelope verification
 * - Deterministic IDs/hashes across runs
 * - Cross-language symbol extraction (JS/TS/Python)
 * - Canonical kind mapping (language disappears)
 * - Lineage + provenance contract
 *
 * Run: node test_canonical_object_generator.js
 */

const assert = require('assert');
const path = require('path');

const { CanonicalObjectGenerator } = require('./canonical_object_generator');
const { verifyCanonicalObject } = require('../ping-runtime/canonicalization/canonical_object');

let passed = 0;
let failed = 0;
const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function run() {
  console.log('=== Canonical Object Generator Tests ===\n');
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

const generator = new CanonicalObjectGenerator({ authority: 'CanonicalObjectGenerator' });

const JS_SAMPLE = `import { readFile } from 'fs';
const MAX_RETRIES = 3;
let count = 0;
function helper(a, b) { return a + b; }
class Service extends Base {
  constructor(name) { super(); this.name = name; }
  async run(x) { return x * 2; }
}
export interface Result { ok: boolean; }
`;

const TS_SAMPLE = `export interface User { id: number; name: string; }
type ID = string;
enum Color { Red, Green }
export class Service implements Base {
  private s: number;
  public async run(x: number): Promise<string> { return 'ok'; }
  protected helper(): void {}
}
function util<T>(x: T): T { return x; }
`;

const PY_SAMPLE = `import os
from pathlib import Path
CONST_VALUE = 3
def top(a, b):
    return a
class MyClass:
    def __init__(self):
        self.x = 1
    async def run(self):
        await self.go()
    @property
    def prop(self):
        return 1
`;

// --- JS extraction ---

test('JS: generates Symbol objects with valid envelopes', () => {
  const symbols = generator.generateSymbols({ filePath: 'a.js', content: JS_SAMPLE });
  assert.ok(symbols.length >= 5, `expected >=5 symbols, got ${symbols.length}`);
  for (const s of symbols) {
    assert.strictEqual(s.kind, 'Symbol');
    assert.deepStrictEqual(verifyCanonicalObject(s), { valid: true, error: null });
  }
});

test('JS: canonical kinds mapped (language disappears)', () => {
  const symbols = generator.generateSymbols({ filePath: 'a.js', content: JS_SAMPLE });
  const kinds = new Set(symbols.map((s) => s.payload.canonical_kind));
  assert.ok(kinds.has('Function'), `missing Function in ${[...kinds]}`);
  assert.ok(kinds.has('Class'), `missing Class in ${[...kinds]}`);
  assert.ok(kinds.has('Method'), `missing Method in ${[...kinds]}`);
  assert.ok(kinds.has('Import'), `missing Import in ${[...kinds]}`);
  assert.ok(kinds.has('Constant'), `missing Constant in ${[...kinds]}`);
});

test('JS: method carries parent + name prefix', () => {
  const symbols = generator.generateSymbols({ filePath: 'a.js', content: JS_SAMPLE });
  const run = symbols.find((s) => s.payload.canonical_name === 'Service.run');
  assert.ok(run, 'expected Service.run');
  assert.strictEqual(run.payload.canonical_kind, 'Method');
  assert.strictEqual(run.payload.parent, 'Service');
});

test('JS: span recorded in lines', () => {
  const symbols = generator.generateSymbols({ filePath: 'a.js', content: JS_SAMPLE });
  const helper = symbols.find((s) => s.payload.canonical_name === 'helper');
  assert.ok(helper);
  assert.ok(helper.payload.span.start_line >= 1);
  assert.ok(helper.payload.span.end_line >= helper.payload.span.start_line);
});

test('JS: provenance retains original language + node type', () => {
  const symbols = generator.generateSymbols({ filePath: 'a.js', content: JS_SAMPLE });
  const helper = symbols.find((s) => s.payload.canonical_name === 'helper');
  assert.strictEqual(helper.payload.provenance.language, 'javascript');
  assert.strictEqual(helper.payload.provenance.original_kind, 'function_declaration');
});

// --- Determinism ---

test('Symbols are deterministic across runs', () => {
  const a = generator.generateSymbols({ filePath: 'a.js', content: JS_SAMPLE });
  const b = generator.generateSymbols({ filePath: 'a.js', content: JS_SAMPLE });
  assert.strictEqual(a.length, b.length);
  for (let i = 0; i < a.length; i++) {
    assert.strictEqual(a[i].id, b[i].id, `symbol ${i} id differs`);
    assert.strictEqual(a[i].canonical_hash, b[i].canonical_hash, `symbol ${i} hash differs`);
  }
});

test('Same content different filename → same symbol IDs', () => {
  const a = generator.generateSymbols({ filePath: 'a.js', content: JS_SAMPLE });
  const b = generator.generateSymbols({ filePath: 'b.js', content: JS_SAMPLE });
  assert.strictEqual(a.length, b.length);
  assert.strictEqual(a[0].id, b[0].id);
});

// --- TS extraction ---

test('TS: interface, enum, type alias extracted', () => {
  const symbols = generator.generateSymbols({ filePath: 'a.ts', content: TS_SAMPLE });
  const kinds = new Set(symbols.map((s) => s.payload.canonical_kind));
  assert.ok(kinds.has('Interface'), `missing Interface in ${[...kinds]}`);
  assert.ok(kinds.has('Enum'), `missing Enum in ${[...kinds]}`);
  assert.ok(kinds.has('TypeAlias'), `missing TypeAlias in ${[...kinds]}`);
});

test('TS: visibility captured', () => {
  const symbols = generator.generateSymbols({ filePath: 'a.ts', content: TS_SAMPLE });
  const s = symbols.find((sym) => sym.payload.canonical_name === 'Service.s');
  assert.ok(s, 'expected Service.s field');
  assert.strictEqual(s.payload.visibility, 'private');
  const run = symbols.find((sym) => sym.payload.canonical_name === 'Service.run');
  assert.strictEqual(run.payload.visibility, 'public');
});

test('TS: return type + signature extracted', () => {
  const symbols = generator.generateSymbols({ filePath: 'a.ts', content: TS_SAMPLE });
  const run = symbols.find((sym) => sym.payload.canonical_name === 'Service.run');
  assert.strictEqual(run.payload.return_type, 'Promise<string>');
  assert.ok(run.payload.canonical_signature.includes('Promise<string>'));
});

// --- Python extraction ---

test('PY: functions, classes, methods, imports extracted', () => {
  const symbols = generator.generateSymbols({ filePath: 'a.py', content: PY_SAMPLE });
  const kinds = new Set(symbols.map((s) => s.payload.canonical_kind));
  assert.ok(kinds.has('Function'), `missing Function in ${[...kinds]}`);
  assert.ok(kinds.has('Class'), `missing Class in ${[...kinds]}`);
  assert.ok(kinds.has('Method'), `missing Method in ${[...kinds]}`);
  assert.ok(kinds.has('Import'), `missing Import in ${[...kinds]}`);
});

test('PY: method parent prefix', () => {
  const symbols = generator.generateSymbols({ filePath: 'a.py', content: PY_SAMPLE });
  const run = symbols.find((s) => s.payload.canonical_name === 'MyClass.run');
  assert.ok(run, 'expected MyClass.run');
  assert.strictEqual(run.payload.canonical_kind, 'Method');
});

test('PY: python visibility from name convention', () => {
  const src = `class K:\n    def __private(self):\n        pass\n    def _protected(self):\n        pass\n    def public(self):\n        pass\n`;
  const symbols = generator.generateSymbols({ filePath: 'a.py', content: src });
  const priv = symbols.find((s) => s.payload.canonical_name === 'K.__private');
  const prot = symbols.find((s) => s.payload.canonical_name === 'K._protected');
  const pub = symbols.find((s) => s.payload.canonical_name === 'K.public');
  assert.strictEqual(priv.payload.visibility, 'private');
  assert.strictEqual(prot.payload.visibility, 'protected');
  assert.strictEqual(pub.payload.visibility, 'public');
});

test('PY: decorators captured as modifiers', () => {
  const symbols = generator.generateSymbols({ filePath: 'a.py', content: PY_SAMPLE });
  const prop = symbols.find((s) => s.payload.canonical_name === 'MyClass.prop');
  assert.ok(prop, 'expected MyClass.prop');
  assert.ok(prop.payload.modifiers.includes('property'), `modifiers=${prop.payload.modifiers}`);
});

// --- Language detection + unsupported ---

test('Language detection by extension', () => {
  assert.strictEqual(generator.detectLanguage('x.js'), 'javascript');
  assert.strictEqual(generator.detectLanguage('x.ts'), 'typescript');
  assert.strictEqual(generator.detectLanguage('x.tsx'), 'typescript');
  assert.strictEqual(generator.detectLanguage('x.py'), 'python');
  assert.strictEqual(generator.detectLanguage('x.unknown'), null);
});

test('Unsupported language → empty symbols, no crash', () => {
  const symbols = generator.generateSymbols({ filePath: 'a.rb', content: 'def foo; end' });
  assert.deepStrictEqual(symbols, []);
});

// --- File + Repository objects ---

test('File object envelope + summary', () => {
  const symbols = generator.generateSymbols({ filePath: 'a.js', content: JS_SAMPLE });
  const file = generator.generateFileObject({ filePath: 'a.js', content: JS_SAMPLE, symbols });
  assert.strictEqual(file.kind, 'File');
  assert.deepStrictEqual(verifyCanonicalObject(file), { valid: true, error: null });
  assert.strictEqual(file.payload.path, 'a.js');
  assert.strictEqual(file.payload.language, 'javascript');
  assert.ok(file.payload.line_count >= 8);
  assert.strictEqual(file.payload.symbol_count, symbols.length);
});

test('Repository object aggregates files', () => {
  const s1 = generator.generateSymbols({ filePath: 'a.js', content: JS_SAMPLE });
  const f1 = generator.generateFileObject({ filePath: 'a.js', content: JS_SAMPLE, symbols: s1 });
  const s2 = generator.generateSymbols({ filePath: 'b.py', content: PY_SAMPLE });
  const f2 = generator.generateFileObject({ filePath: 'b.py', content: PY_SAMPLE, symbols: s2 });
  const repo = generator.generateRepositoryObject({
    name: 'test-repo',
    url: 'https://github.com/test/repo',
    defaultBranch: 'main',
    fileObjects: [f1, f2],
    symbolObjects: [...s1, ...s2],
  });
  assert.strictEqual(repo.kind, 'Repository');
  assert.deepStrictEqual(verifyCanonicalObject(repo), { valid: true, error: null });
  assert.strictEqual(repo.payload.name, 'test-repo');
  assert.strictEqual(repo.payload.file_count, 2);
  assert.strictEqual(repo.payload.symbol_count, s1.length + s2.length);
  assert.ok(repo.payload.language_counts.javascript === 1);
  assert.ok(repo.payload.language_counts.python === 1);
});

test('Repository object is deterministic', () => {
  const s1 = generator.generateSymbols({ filePath: 'a.js', content: JS_SAMPLE });
  const f1 = generator.generateFileObject({ filePath: 'a.js', content: JS_SAMPLE, symbols: s1 });
  const repoA = generator.generateRepositoryObject({ name: 'r', fileObjects: [f1], symbolObjects: s1 });
  const repoB = generator.generateRepositoryObject({ name: 'r', fileObjects: [f1], symbolObjects: s1 });
  assert.strictEqual(repoA.id, repoB.id);
  assert.strictEqual(repoA.canonical_hash, repoB.canonical_hash);
});

// --- Pipeline chain: symbols → file → repo ---

test('Full chain verifies: symbols → file → repository', () => {
  const symbols = generator.generateSymbols({ filePath: 'a.js', content: JS_SAMPLE });
  const file = generator.generateFileObject({ filePath: 'a.js', content: JS_SAMPLE, symbols });
  const repo = generator.generateRepositoryObject({ name: 'r', fileObjects: [file], symbolObjects: symbols });
  for (const obj of [...symbols, file, repo]) {
    assert.deepStrictEqual(verifyCanonicalObject(obj), { valid: true, error: null });
  }
  // File references symbol IDs
  const fileSymbolIds = new Set(file.payload.symbols.map((s) => s.id));
  for (const s of symbols) {
    assert.ok(fileSymbolIds.has(s.id), `file missing symbol ${s.id}`);
  }
});

// --- Class relationships ---

test('JS: class heritage extracted as relationships', () => {
  const symbols = generator.generateSymbols({ filePath: 'a.js', content: JS_SAMPLE });
  const service = symbols.find((s) => s.payload.canonical_name === 'Service');
  assert.ok(service, 'expected Service class');
  const rels = service.relationships;
  const extendsRels = rels.filter((r) => r.relation === 'extends');
  assert.ok(extendsRels.some((r) => r.target === 'Base'), `relationships=${JSON.stringify(rels)}`);
});

run();
