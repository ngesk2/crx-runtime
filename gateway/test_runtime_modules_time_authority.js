/**
 * Regression test: ping-runtime runtime modules must not bypass the
 * constitutional time authority with new Date() or Date.now().
 *
 * Prior defect: 6 live-path runtime modules (all wired into the gateway
 * bootstrap) constructed timestamps via `new Date().toISOString()` /
 * `Date.now()` — constitutional time bypasses (same class as the route
 * and spine fixes).
 *
 * Modules checked:
 *   runtime_fingerprint, drift_detector, analytics_policy,
 *   state_machine_executor, deployment_registry, integration_manager
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS ${name}`); } catch (e) { failed++; console.log(`  FAIL ${name}: ${e.message}`); }
}

const modules = [
  'runtime_fingerprint',
  'drift_detector',
  'analytics_policy',
  'state_machine_executor',
  'deployment_registry',
  'integration_manager',
];

function main() {
  console.log('=== ping-runtime runtime modules use constitutional time authority ===');

  for (const name of modules) {
    const file = path.join(__dirname, '..', 'ping-runtime', 'runtime', `${name}.js`);
    const source = fs.readFileSync(file, 'utf8');

    test(`${name}: no new Date()/Date.now() bypass remains`, () => {
      assert.strictEqual((source.match(/new Date\(\)/g) || []).length, 0, 'zero `new Date()` call sites');
      assert.strictEqual((source.match(/Date\.now\(\)/g) || []).length, 0, 'zero `Date.now()` call sites');
    });

    test(`${name}: imports constitutional time authority`, () => {
      assert.ok(source.includes("require('../authorities/constitutional_time_authority.js')"), 'time authority import present');
    });

    test(`${name}: uses nowAsISOString() or nowAsMillis()`, () => {
      const sites = source.match(/constitutionalTimeAuthority\.nowAsISOString\(\)/g) || [];
      const millis = source.match(/constitutionalTimeAuthority\.nowAsMillis\(\)/g) || [];
      assert.ok(sites.length + millis.length >= 1, `at least one authority time call (found ${sites.length + millis.length})`);
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
