/**
 * Regression test: routes/constitution.js computed_at must come from the
 * constitutional time authority, not new Date().
 *
 * Prior defect: GET /constitution response and its error path set
 * computed_at via `new Date().toISOString()` — a constitutional time
 * bypass on the live /constitution route (same class fixed in events.js,
 * mission_control.js, ops.js, orchestration.js).
 *
 * Latency measurement (Date.now() - startTime) is elapsed-time timing and
 * intentionally left as-is.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS ${name}`); } catch (e) { failed++; console.log(`  FAIL ${name}: ${e.message}`); }
}

const file = path.join(__dirname, 'routes', 'constitution.js');
const source = fs.readFileSync(file, 'utf8');

function main() {
  console.log('=== routes/constitution.js computed_at uses constitutional time authority ===');

  test('no new Date() bypass remains', () => {
    const bypasses = source.match(/new Date\(\)/g) || [];
    assert.strictEqual(bypasses.length, 0, 'zero `new Date()` call sites');
  });

  test('imports constitutional time authority', () => {
    assert.ok(source.includes("require('../../ping-runtime/authorities/constitutional_time_authority.js')"), 'time authority import present');
  });

  test('computed_at uses nowAsISOString() in success and error paths', () => {
    const sites = source.match(/computed_at: constitutionalTimeAuthority\.nowAsISOString\(\)/g) || [];
    assert.strictEqual(sites.length, 2, `exactly 2 computed_at sites fixed (found ${sites.length})`);
  });

  test('latency measurement retained as elapsed-time (not a timestamp decision)', () => {
    assert.ok(source.includes('latency_ms: Date.now() - startTime'), 'latency_ms still measured');
  });

  test('module loads without error', () => {
    delete require.cache[require.resolve('./routes/constitution.js')];
    const fn = require('./routes/constitution.js');
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
