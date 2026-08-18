/**
 * Regression test: mission_runtime.js mission_id generation must not use
 * raw Date.now().
 *
 * Prior defect: create() built mission_id via
 * `sha256(missionType:Date.now():payload)` — a raw wall-clock bypass in a
 * replay-visible identity. Full deterministic content-addressing is a
 * documented P0 deferral; the minimal constitutional-compliant fix routes
 * the time through constitutionalTimeAuthority.nowAsMillis(), preserving
 * uniqueness semantics.
 *
 * Note: duration_ms (elapsed-time) at line ~138 is intentionally left as
 * Date.now() — it measures a mission duration, not a timestamp decision.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS ${name}`); } catch (e) { failed++; console.log(`  FAIL ${name}: ${e.message}`); }
}

const file = path.join(__dirname, '..', 'ping-runtime', 'orchestration', 'mission_runtime.js');
const source = fs.readFileSync(file, 'utf8');

function main() {
  console.log('=== mission_runtime.js mission_id uses constitutional time authority ===');

  test('no Date.now() in mission_id generation', () => {
    assert.ok(!source.includes('${missionType}:${Date.now()}:'), 'mission_id no longer uses Date.now()');
  });

  test('imports constitutional time authority', () => {
    assert.ok(source.includes("require('../authorities/constitutional_time_authority.js')"), 'time authority import present');
  });

  test('mission_id uses nowAsMillis()', () => {
    assert.ok(source.includes('${missionType}:${constitutionalTimeAuthority.nowAsMillis()}'), 'mission_id uses nowAsMillis()');
  });

  test('only remaining Date.now() is the elapsed-time duration_ms', () => {
    const sites = source.match(/Date\.now\(\)/g) || [];
    assert.ok(sites.length <= 1, `at most one Date.now() site (found ${sites.length})`);
    assert.ok(source.includes('duration_ms = Date.now() - new Date(row.rows[0].started_at).getTime()'), 'remaining site is elapsed-time duration');
  });

  test('module loads without error', () => {
    delete require.cache[require.resolve('../ping-runtime/orchestration/mission_runtime.js')];
    const mod = require('../ping-runtime/orchestration/mission_runtime.js');
    assert.ok(mod.MissionRuntime || mod.missionRuntime, 'exports MissionRuntime');
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
