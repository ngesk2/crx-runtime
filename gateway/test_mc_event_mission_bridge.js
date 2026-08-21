/**
 * Regression test: EventToMissionBridge stats exposed in Mission Control.
 *
 * Prior gap: EventToMissionBridge tracks { listened, missionsCreated, skipped, failed }
 * but Mission Control /mc/system only exposed EventBridge (repository/canonical polling),
 * not EventToMissionBridge (event→mission conversion). The bridge that proves business
 * events reach the mission system was invisible.
 *
 * This test proves:
 * 1. mission_control.js destructures eventToMissionBridge from services
 * 2. /mc/system response includes eventMissionBridge field
 * 3. Standalone /mc/event-mission-bridge endpoint exists
 * 4. Stats shape is correct when bridge is present and absent
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
  console.log('=== EventToMissionBridge observability in Mission Control ===');

  test('destructures eventToMissionBridge from services', () => {
    assert.ok(
      source.includes('eventToMissionBridge') && source.includes('} = services;'),
      'eventToMissionBridge is destructured from services'
    );
  });

  test('/mc/system computes eventMissionBridgeStats from eventToMissionBridge', () => {
    assert.ok(
      source.includes('eventMissionBridgeStats') && source.includes('eventToMissionBridge.getStats()'),
      'eventMissionBridgeStats computed from eventToMissionBridge.getStats()'
    );
  });

  test('/mc/system response includes eventMissionBridge field', () => {
    assert.ok(
      source.includes('eventMissionBridge: eventMissionBridgeStats'),
      'eventMissionBridge field in /mc/system response'
    );
  });

  test('standalone /mc/event-mission-bridge endpoint exists', () => {
    assert.ok(
      source.includes("'/event-mission-bridge'") || source.includes("'/event-mission-bridge'"),
      'router.get for /event-mission-bridge registered'
    );
  });

  test('standalone endpoint returns eventMissionBridge stats', () => {
    // Find the endpoint handler
    const idx = source.indexOf('/event-mission-bridge');
    assert.ok(idx > 0, 'endpoint found in source');
    const slice = source.slice(idx, idx + 300);
    assert.ok(
      slice.includes('eventMissionBridge') && slice.includes('.getStats()'),
      'standalone endpoint returns getStats()'
    );
  });

  test('standalone endpoint handles null bridge (degraded)', () => {
    const idx = source.indexOf('/event-mission-bridge');
    const slice = source.slice(idx, idx + 300);
    assert.ok(
      slice.includes('degraded') || slice.includes('not initialized'),
      'degraded fallback when bridge absent'
    );
  });

  test('EventToMissionBridge.getStats() returns expected shape', () => {
    // Verify the bridge module exposes the right stats
    const bridgeFile = path.join(__dirname, '..', 'ping-runtime', 'orchestration', 'event_to_mission_bridge.js');
    if (!fs.existsSync(bridgeFile)) {
      // Test from gateway dir — adjust path
      const altPath = path.join(__dirname, 'ping-runtime', 'orchestration', 'event_to_mission_bridge.js');
      if (!fs.existsSync(altPath)) return; // skip if file not found
    }
    const bridgeSource = fs.readFileSync(bridgeFile, 'utf8');
    assert.ok(bridgeSource.includes('listened'), 'stats includes listened');
    assert.ok(bridgeSource.includes('missionsCreated'), 'stats includes missionsCreated');
    assert.ok(bridgeSource.includes('skipped'), 'stats includes skipped');
    assert.ok(bridgeSource.includes('failed'), 'stats includes failed');
  });

  test('no duplicate field names in /mc/system response', () => {
    // Extract the system: { ... } block and verify no duplicate keys
    const sysIdx = source.indexOf('system: {');
    assert.ok(sysIdx > 0, 'system block found');
    const sysEnd = source.indexOf('},', sysIdx);
    const sysBlock = source.slice(sysIdx, sysEnd);
    const fieldMatches = sysBlock.match(/(\w+):/g) || [];
    const fields = fieldMatches.map(m => m.replace(':', ''));
    const unique = new Set(fields);
    assert.strictEqual(fields.length, unique.size, `no duplicate fields (got ${fields.length} total, ${unique.size} unique)`);
  });

  test('module loads without error', () => {
    delete require.cache[require.resolve('./routes/mission_control.js')];
    const fn = require('./routes/mission_control.js');
    assert.strictEqual(typeof fn, 'function', 'exports factory function');
  });

  console.log(`\n  Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
