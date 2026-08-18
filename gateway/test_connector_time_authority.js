/**
 * Regression test: live-path connectors must not bypass the constitutional
 * time authority with new Date().
 *
 * Prior defect: 5 live-wired connector modules built timestamps via
 * `new Date().toISOString()` — posthog_integration (event log),
 * sms_integration (event log), github_connector (_lastSync + event-stream
 * fallback), posthog_connector (_lastSync), google_connector (event-stream
 * fallback). These synthesize replay-visible timestamps and sync state.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS ${name}`); } catch (e) { failed++; console.log(`  FAIL ${name}: ${e.message}`); }
}

const modules = [
  'posthog_integration',
  'sms_integration',
  'github_connector',
  'posthog_connector',
  'google_connector',
];

function main() {
  console.log('=== ping-runtime connectors use constitutional time authority ===');

  for (const name of modules) {
    const file = path.join(__dirname, '..', 'ping-runtime', 'connectors', `${name}.js`);
    const source = fs.readFileSync(file, 'utf8');

    test(`${name}: no new Date() bypass remains`, () => {
      assert.strictEqual((source.match(/new Date\(\)/g) || []).length, 0, 'zero `new Date()` call sites');
    });

    test(`${name}: imports constitutional time authority`, () => {
      assert.ok(source.includes("require('../authorities/constitutional_time_authority.js')"), 'time authority import present');
    });

    test(`${name}: module loads without error`, () => {
      delete require.cache[require.resolve(file.replace(/\.js$/, ''))];
      const mod = require(file.replace(/\.js$/, ''));
      assert.ok(mod, 'module exports');
    });
  }

  test('nowAsISOString() returns valid ISO timestamp', () => {
    const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority');
    const iso = constitutionalTimeAuthority.nowAsISOString();
    assert.ok(!Number.isNaN(Date.parse(iso)), 'parses as date');
    assert.ok(iso.endsWith('Z'), 'UTC ISO timestamp');
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
