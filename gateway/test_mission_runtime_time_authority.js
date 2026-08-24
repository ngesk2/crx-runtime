/**
 * Regression test: mission_runtime.js mission_id generation must not use
 * raw Date.now() for identity.
 *
 * Prior defect: create() built mission_id via
 * `sha256(missionType:Date.now():payload)` — a raw wall-clock bypass in a
 * replay-visible identity. The code was further migrated to full
 * deterministic content-addressing: sha256(missionType:event_id). This is
 * strictly superior — same event always produces the same mission.
 *
 * Date.now() is permitted for elapsed-time calculations only (duration_ms,
 * retry backoff) — it measures elapsed time, not identity.
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
  console.log('=== mission_runtime.js mission_id uses deterministic content-addressing ===');

  test('no Date.now() in mission_id generation', () => {
    assert.ok(!source.includes('${missionType}:${Date.now()}:'), 'mission_id no longer uses Date.now()');
  });

  test('mission_id uses deterministic SHA-256 of event_id', () => {
    assert.ok(source.includes("crypto.createHash('sha256')"), 'mission_id uses SHA-256');
    assert.ok(source.includes('payload.event_id'), 'mission_id derives from event_id for idempotency');
  });

  test('mission_id does not use nowAsMillis() for identity', () => {
    assert.ok(!source.includes('${missionType}:${constitutionalTimeAuthority.nowAsMillis()}'),
      'mission_id is fully deterministic, no time-based identity');
  });

  test('no Date.now() in identity paths (idempotency key and mission_id)', () => {
    // Extract the create() method body to verify no Date.now() in idempotency key
    const createMatch = source.match(/async create\(missionType[\s\S]*?return missionId;/);
    assert.ok(createMatch, 'create() method found');
    const createBody = createMatch[0];
    assert.ok(!createBody.includes('Date.now()'), 'no Date.now() in create() method (identity path)');
  });

  test('elapsed-time Date.now() sites are non-identity (duration and backoff)', () => {
    const sites = source.match(/Date\.now\(\)/g) || [];
    // duration_ms = Date.now() - started_at  (elapsed measurement)
    // retryAt = new Date(Date.now() + backoffMs)  (retry delay calculation)
    assert.ok(sites.length <= 2, `at most two Date.now() sites for elapsed-time (found ${sites.length})`);
    assert.ok(source.includes('duration_ms = Date.now()'), 'duration_ms site present');
    assert.ok(source.includes('Date.now() + backoffMs'), 'retry backoff site present');
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
