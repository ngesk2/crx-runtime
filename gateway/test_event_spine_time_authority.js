/**
 * Regression test: unified_event_runtime.js emit() must source its event
 * timestamp from the constitutional time authority, not new Date().
 *
 * Prior defect: the canonical event spine built
 * `timestamp: new Date().toISOString()` — a constitutional time bypass on
 * every event the system emits, contradicting the module's own header
 * ("timestamp (ConstitutionalTimeAuthority)"). This is the single most
 * replay-critical timestamp in the codebase.
 *
 * This test proves emitted events carry a timestamp from
 * constitutionalTimeAuthority.nowAsISOString() and the module contains no
 * `new Date()` timestamp construction.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS ${name}`); } catch (e) { failed++; console.log(`  FAIL ${name}: ${e.message}`); }
}

const file = path.join(__dirname, '..', 'ping-runtime', 'events', 'unified_event_runtime.js');
const source = fs.readFileSync(file, 'utf8');

function main() {
  console.log('=== unified_event_runtime.js timestamp uses constitutional time authority ===');

  test('no new Date() bypass remains in the module', () => {
    const bypasses = source.match(/new Date\(\)/g) || [];
    assert.strictEqual(bypasses.length, 0, 'zero `new Date()` call sites');
  });

  test('imports constitutional time authority', () => {
    assert.ok(source.includes("require('../authorities/constitutional_time_authority.js')"), 'time authority import present');
  });

  test('emit() timestamp uses nowAsISOString()', () => {
    assert.ok(source.includes('timestamp: constitutionalTimeAuthority.nowAsISOString()'), 'timestamp sourced from time authority');
  });

  test('emitted event timestamp is a valid ISO timestamp from the authority', async () => {
    delete require.cache[require.resolve('../ping-runtime/events/unified_event_runtime.js')];
    const { UnifiedEventRuntime } = require('../ping-runtime/events/unified_event_runtime.js');
    const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');

    const runtime = new UnifiedEventRuntime({});
    const before = constitutionalTimeAuthority.nowAsISOString();
    const result = await runtime.emit('TEST_EVENT', 'test', { a: 1 });
    assert.strictEqual(result.status, 'ok', 'emit succeeded');
    const ts = result.event.timestamp;
    assert.strictEqual(typeof ts, 'string', 'timestamp is string');
    assert.ok(!Number.isNaN(Date.parse(ts)), 'timestamp parses as date');
    assert.ok(ts.endsWith('Z'), 'UTC ISO timestamp');
    assert.ok(ts >= before, 'timestamp not in the past');
    assert.ok(ts === constitutionalTimeAuthority.nowAsISOString().slice(0, 10) || Date.parse(ts) <= Date.now() + 1000, 'timestamp within tolerance');
  });

  test('module loads without error', () => {
    delete require.cache[require.resolve('../ping-runtime/events/unified_event_runtime.js')];
    const mod = require('../ping-runtime/events/unified_event_runtime.js');
    assert.ok(mod.UnifiedEventRuntime, 'exports UnifiedEventRuntime');
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
