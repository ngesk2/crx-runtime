/**
 * Regression test: gateway modules wired via bootstrap/wiring.js must not
 * bypass the constitutional time authority with new Date().
 *
 * Prior defect: dependency_graph.js (validation report timestamp),
 * conversation_memory.js (2 Qdrant payload timestamps), and
 * document_ingestion.js (1 Qdrant payload timestamp) built timestamps via
 * `new Date().toISOString()` — constitutional time bypasses on the live
 * wiring path.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS ${name}`); } catch (e) { failed++; console.log(`  FAIL ${name}: ${e.message}`); }
}

const modules = [
  ['bootstrap/dependency_graph', path.join(__dirname, 'bootstrap', 'dependency_graph.js')],
  ['conversation_memory', path.join(__dirname, 'conversation_memory.js')],
  ['document_ingestion', path.join(__dirname, 'document_ingestion.js')],
];

function main() {
  console.log('=== wiring-path gateway modules use constitutional time authority ===');

  for (const [name, file] of modules) {
    const source = fs.readFileSync(file, 'utf8');

    test(`${name}: no new Date() bypass remains`, () => {
      assert.strictEqual((source.match(/new Date\(\)/g) || []).length, 0, 'zero `new Date()` call sites');
    });

    test(`${name}: imports constitutional time authority`, () => {
      assert.ok(source.includes("constitutional_time_authority.js"), 'time authority import present');
    });

    test(`${name}: uses nowAsISOString()`, () => {
      assert.ok(source.includes('constitutionalTimeAuthority.nowAsISOString()'), 'nowAsISOString() used');
    });

    test(`${name}: module loads without error`, () => {
      delete require.cache[require.resolve(file.replace(/\.js$/, ''))];
      const mod = require(file.replace(/\.js$/, ''));
      assert.ok(mod, 'module exports');
    });
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
