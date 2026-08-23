/**
 * Regression test: routes/ops.js must not bypass the constitutional
 * time authority with new Date().
 *
 * Prior defect: 4 direct `new Date().toISOString()` sites on the live /ops
 * route surface (checked_at x2, generated_at x2) bypassing
 * ConstitutionalTimeAuthority — same class fixed in events.js /
 * mission_control.js / orchestration.js.
 *
 * This test proves all four timestamps come from
 * constitutionalTimeAuthority.nowAsISOString() and no bypass remains.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS ${name}`); } catch (e) { failed++; console.log(`  FAIL ${name}: ${e.message}`); }
}

const file = path.join(__dirname, 'routes', 'ops.js');
const source = fs.readFileSync(file, 'utf8');

function main() {
  console.log('=== routes/ops.js uses constitutional time authority ===');

  test('no new Date() bypass remains', () => {
    const bypasses = source.match(/new Date\(\)/g) || [];
    assert.strictEqual(bypasses.length, 0, 'zero `new Date()` call sites');
  });

  test('imports constitutional time authority', () => {
    assert.ok(source.includes("require('../../ping-runtime/authorities/constitutional_time_authority.js')"), 'time authority import present');
  });

  test('checked_at and generated_at use nowAsISOString()', () => {
    const sites = source.match(/constitutionalTimeAuthority\.nowAsISOString\(\)/g) || [];
    assert.strictEqual(sites.length, 4, `exactly 4 nowAsISOString() call sites (found ${sites.length})`);
    assert.ok(source.includes('checked_at: constitutionalTimeAuthority.nowAsISOString()'), 'checked_at sites fixed');
    assert.ok(source.includes('generated_at: constitutionalTimeAuthority.nowAsISOString()'), 'generated_at sites fixed');
  });

  test('module loads without error', () => {
    delete require.cache[require.resolve('./routes/ops.js')];
    const fn = require('./routes/ops.js');
    assert.strictEqual(typeof fn, 'function', 'exports factory function');
  });

  test('nowAsISOString() returns valid ISO timestamp', () => {
    const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority');
    const iso = constitutionalTimeAuthority.nowAsISOString();
    assert.strictEqual(typeof iso, 'string');
    assert.ok(!Number.isNaN(Date.parse(iso)), 'parses as date');
    assert.ok(iso.endsWith('Z'), 'UTC ISO timestamp');
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
