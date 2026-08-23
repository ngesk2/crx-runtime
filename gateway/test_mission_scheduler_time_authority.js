/**
 * Regression test: mission_scheduler.js must not bypass the constitutional
 * time authority with new Date().
 *
 * Prior defect: _dispatch completed missions with
 * `completed_at: new Date().toISOString()` inside the result payload —
 * a replay-visible timestamp on the live scheduler path (independent of
 * the phantom-complete behavior, which is Track A P0 gated).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS ${name}`); } catch (e) { failed++; console.log(`  FAIL ${name}: ${e.message}`); }
}

const file = path.join(__dirname, '..', 'ping-runtime', 'orchestration', 'mission_scheduler.js');
const source = fs.readFileSync(file, 'utf8');

function main() {
  console.log('=== mission_scheduler.js uses constitutional time authority ===');

  test('no new Date() bypass remains', () => {
    assert.strictEqual((source.match(/new Date\(\)/g) || []).length, 0, 'zero `new Date()` call sites');
  });

  test('imports constitutional time authority', () => {
    assert.ok(source.includes("require('../authorities/constitutional_time_authority.js')"), 'time authority import present');
  });

  test('completed_at uses nowAsISOString()', () => {
    assert.ok(source.includes('completed_at: constitutionalTimeAuthority.nowAsISOString()'), 'completed_at sourced from time authority');
  });

  test('module loads without error', () => {
    delete require.cache[require.resolve('../ping-runtime/orchestration/mission_scheduler.js')];
    const mod = require('../ping-runtime/orchestration/mission_scheduler.js');
    assert.ok(mod, 'module exports');
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
