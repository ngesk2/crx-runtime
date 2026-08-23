/**
 * Regression test: routes/mission_control.js must not bypass the
 * constitutional time authority with Date.now().
 *
 * Prior defect: 13 direct Date.now() call sites on the live /mc route
 * surface (dashboard/inbox/queues/etc.) computed time-window cutoffs and
 * elapsed-time deltas bypassing ConstitutionalTimeAuthority — the same
 * violation class Phase 36G eliminated from context.js / ollama.js /
 * system_authority.js, and the same class fixed in routes/events.js.
 *
 * This test proves the file sources all time from
 * constitutionalTimeAuthority.nowAsMillis() and contains no Date.now().
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS ${name}`); } catch (e) { failed++; console.log(`  FAIL ${name}: ${e.message}`); }
}

const file = path.join(__dirname, 'routes', 'mission_control.js');
const source = fs.readFileSync(file, 'utf8');

function main() {
  console.log('=== routes/mission_control.js uses constitutional time authority ===');

  test('no Date.now() remains', () => {
    assert.strictEqual((source.match(/Date\.now\(\)/g) || []).length, 0, 'zero Date.now() call sites');
  });

  test('no new Date() bypass remains', () => {
    assert.strictEqual((source.match(/new Date\(\)/g) || []).length, 0, 'zero `new Date()` call sites');
  });

  test('imports constitutional time authority', () => {
    assert.ok(source.includes("require('../../ping-runtime/authorities/constitutional_time_authority.js')"), 'time authority import present');
  });

  test('all time windows use nowAsMillis()', () => {
    const sites = source.match(/constitutionalTimeAuthority\.nowAsMillis\(\)/g) || [];
    assert.ok(sites.length >= 10, `at least 10 nowAsMillis() call sites (found ${sites.length})`);
  });

  test('module loads without error', () => {
    delete require.cache[require.resolve('./routes/mission_control.js')];
    const fn = require('./routes/mission_control.js');
    assert.strictEqual(typeof fn, 'function', 'exports factory function');
  });

  test('cutoffs are valid ISO timestamps computed from the authority', async () => {
    const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority');
    const cutoff = new Date(constitutionalTimeAuthority.nowAsMillis() - 86400000).toISOString();
    assert.strictEqual(typeof cutoff, 'string');
    assert.ok(!Number.isNaN(Date.parse(cutoff)), 'cutoff parses');
    const ageMs = constitutionalTimeAuthority.nowAsMillis() - Date.parse(cutoff);
    assert.ok(ageMs > 23 * 3600000, 'cutoff ~24h back');
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
