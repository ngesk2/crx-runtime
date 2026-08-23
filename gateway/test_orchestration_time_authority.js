/**
 * Regression test: routes/orchestration.js must not bypass the
 * constitutional time authority with new Date().
 *
 * Prior defect: POST /orchestration/missions set createdAt via
 * `new Date().toISOString()` — a constitutional time bypass on the live
 * /orchestration route (same class fixed in routes/events.js and
 * routes/mission_control.js).
 *
 * This test proves createdAt comes from
 * constitutionalTimeAuthority.nowAsISOString() and that no `new Date()`
 * bypass remains in the file.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS ${name}`); } catch (e) { failed++; console.log(`  FAIL ${name}: ${e.message}`); }
}

const file = path.join(__dirname, 'routes', 'orchestration.js');
const source = fs.readFileSync(file, 'utf8');

function main() {
  console.log('=== routes/orchestration.js createdAt uses constitutional time authority ===');

  test('no new Date() bypass remains', () => {
    const bypasses = source.match(/new Date\(\)/g) || [];
    assert.strictEqual(bypasses.length, 0, 'zero `new Date()` call sites');
  });

  test('imports constitutional time authority', () => {
    assert.ok(source.includes("require('../../ping-runtime/authorities/constitutional_time_authority.js')"), 'time authority import present');
  });

  test('createdAt uses nowAsISOString()', () => {
    assert.ok(source.includes('createdAt: constitutionalTimeAuthority.nowAsISOString()'), 'createdAt sourced from time authority');
  });

  test('nowAsISOString() returns valid ISO timestamp', () => {
    const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority');
    const iso = constitutionalTimeAuthority.nowAsISOString();
    assert.strictEqual(typeof iso, 'string');
    assert.ok(!Number.isNaN(Date.parse(iso)), 'parses as date');
  });

  test('module loads without error', () => {
    delete require.cache[require.resolve('./routes/orchestration.js')];
    const fn = require('./routes/orchestration.js');
    assert.strictEqual(typeof fn, 'function', 'exports factory function');
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
