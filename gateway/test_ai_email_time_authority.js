/**
 * Regression test: huggingface_adapter.js and email_integration.js must
 * not bypass the constitutional time authority.
 *
 * Prior defect: 6 AI-metadata timestamps in huggingface_adapter.js and 1
 * event-log timestamp in email_integration.js were built via
 * `new Date().toISOString()` — constitutional time bypasses on the live
 * gateway bootstrap (both modules are wired into gateway_runtime.js).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS ${name}`); } catch (e) { failed++; console.log(`  FAIL ${name}: ${e.message}`); }
}

const files = {
  huggingface_adapter: path.join(__dirname, '..', 'ping-runtime', 'ai', 'huggingface_adapter.js'),
  email_integration: path.join(__dirname, '..', 'ping-runtime', 'connectors', 'email_integration.js'),
};

function main() {
  console.log('=== huggingface_adapter + email_integration use constitutional time authority ===');

  for (const [name, file] of Object.entries(files)) {
    const source = fs.readFileSync(file, 'utf8');

    test(`${name}: no new Date() bypass remains`, () => {
      assert.strictEqual((source.match(/new Date\(\)/g) || []).length, 0, 'zero `new Date()` call sites');
    });

    test(`${name}: imports constitutional time authority`, () => {
      assert.ok(source.includes("require('../authorities/constitutional_time_authority.js')"), 'time authority import present');
    });

    test(`${name}: timestamps use nowAsISOString()`, () => {
      const sites = source.match(/constitutionalTimeAuthority\.nowAsISOString\(\)/g) || [];
      assert.ok(sites.length >= 1, `at least one nowAsISOString() site (found ${sites.length})`);
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
