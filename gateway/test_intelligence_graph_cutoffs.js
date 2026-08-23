/**
 * Regression test: intelligence_graph.js must not contain dead
 * Date.now()-based cutoff computation.
 *
 * Prior defect: _gatherGitHistory computed `recentCutoff` and `monthCutoff`
 * via `new Date(Date.now() - ...).toISOString()` — constitutional time
 * bypasses on the live engine path (intelligence_graph is reachable via
 * engine.js, which is in the gateway bootstrap). Both variables were dead
 * code: computed but never consumed.
 *
 * The remaining `Date.now() - sevenDays` comparison at line ~316 is
 * legitimate elapsed-time logic (comparing git commit epoch times against
 * a rolling window), consistent with heartbeat-staleness handling.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS ${name}`); } catch (e) { failed++; console.log(`  FAIL ${name}: ${e.message}`); }
}

const file = path.join(__dirname, '..', 'ping-runtime', 'orchestration', 'intelligence_graph.js');
const source = fs.readFileSync(file, 'utf8');

function main() {
  console.log('=== intelligence_graph.js has no dead Date.now() cutoffs ===');

  test('no recentCutoff variable remains', () => {
    assert.ok(!source.includes('recentCutoff'), 'recentCutoff removed');
  });

  test('no monthCutoff variable remains', () => {
    assert.ok(!source.includes('monthCutoff'), 'monthCutoff removed');
  });

  test('no orphaned thirtyDays constant remains', () => {
    assert.ok(!source.includes('thirtyDays'), 'thirtyDays removed');
  });

  test('module loads without error', () => {
    delete require.cache[require.resolve('../ping-runtime/orchestration/intelligence_graph.js')];
    const mod = require('../ping-runtime/orchestration/intelligence_graph.js');
    assert.ok(mod, 'module exports');
  });

  test('sevenDays still used for the rolling git-history window', () => {
    assert.ok(source.includes('Date.now() - sevenDays'), 'elapsed-time comparison retained');
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
