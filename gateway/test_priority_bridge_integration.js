/**
 * Integration Test: Priority Boundary at Bridge Ingress
 *
 * Proves that mapping.priority CANNOT reach MissionRuntime.create()
 * unnormalized. Tests the actual bridge→mission boundary, not the adapter
 * in isolation.
 *
 * Invariants tested:
 * 1. Every supported source scale becomes exactly 0, 1, 2, or 3
 * 2. mapping.priority cannot reach MissionRuntime.create() unnormalized
 * 3. Missing priority has one documented canonical result (1)
 * 4. Invalid priority behavior is deterministic
 * 5. Repeated normalization is idempotent
 * 6. Database-bound mission priority is canonical
 */

const { canonicalPriority } = require('../ping-runtime/boundaries/priority_boundary.js');
const { EventToMissionBridge, EVENT_MISSION_MAP } = require('../ping-runtime/orchestration/event_to_mission_bridge.js');

let passed = 0;
let failed = 0;

function assert(label, actual, expected) {
  if (actual === expected) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertRange(label, value) {
  const ok = Number.isInteger(value) && value >= 0 && value <= 3;
  if (ok) {
    passed++;
    console.log(`  ✓ ${label} — ${value} is in canonical range 0-3`);
  } else {
    failed++;
    console.error(`  ✗ ${label} — ${value} is NOT in canonical range 0-3`);
  }
}

async function run() {
  // ─── Group 1: All EVENT_MISSION_MAP priorities are canonical ─────
  console.log('Group 1: Every EVENT_MISSION_MAP entry normalizes to 0-3');
  for (const [eventType, mapping] of Object.entries(EVENT_MISSION_MAP)) {
    const normalized = canonicalPriority(mapping.priority);
    assertRange(`${eventType} priority`, normalized);
  }

  // ─── Group 2: Bridge wires canonicalPriority (mock inspection) ───
  console.log('Group 2: Bridge ingress normalization');
  {
    let capturedPriority = undefined;
    let createCalled = false;
    const mockMissionRuntime = {
      create: async (type, payload, options) => {
        createCalled = true;
        capturedPriority = options.priority;
        return 'mock-mission-id';
      },
    };
    const mockEventRuntime = { on: () => {}, emit: async () => {} };

    const bridge = new EventToMissionBridge({
      eventRuntime: mockEventRuntime,
      missionRuntime: mockMissionRuntime,
    });

    await bridge._handleEvent({
      event_type: 'REVIEW_RECEIVED',
      event_id: 'evt-review-001',
      source: 'test',
      namespace: 'core::test',
      payload: {},
      metadata: {},
    });

    assert('bridge creates mission', createCalled, true);
    assertRange('bridge-normalized priority is canonical', capturedPriority);
    assert('REVIEW_RECEIVED maps to 3', capturedPriority, 3);
  }

  // ─── Group 3: Bridge with anomalous mapping (simulated corruption) ──
  console.log('Group 3: Anomalous priority values cannot reach mission runtime');
  {
    let capturedPriority = undefined;
    const mockMissionRuntime = {
      create: async (type, payload, options) => {
        capturedPriority = options.priority;
        return 'mock-id';
      },
    };
    const mockEventRuntime = { on: () => {}, emit: async () => {} };
    const bridge = new EventToMissionBridge({
      eventRuntime: mockEventRuntime,
      missionRuntime: mockMissionRuntime,
    });

    const saved = EVENT_MISSION_MAP.TEST_ANOMALY;
    EVENT_MISSION_MAP.TEST_ANOMALY = { missionType: 'TEST', priority: 99 };

    await bridge._handleEvent({
      event_type: 'TEST_ANOMALY',
      event_id: 'evt-anomaly-001',
      source: 'test',
      namespace: 'core::test',
      payload: {},
      metadata: {},
    });

    if (saved !== undefined) {
      EVENT_MISSION_MAP.TEST_ANOMALY = saved;
    } else {
      delete EVENT_MISSION_MAP.TEST_ANOMALY;
    }

    assertRange('anomalous priority 99 normalized', capturedPriority);
    assert('99 → 1 (default for out-of-range)', capturedPriority, 1);
  }

  // ─── Group 4: Missing priority defaults to 1 ─────────────────────
  console.log('Group 4: Missing priority defaults to 1 (routine)');
  {
    let capturedPriority = undefined;
    const mockMissionRuntime = {
      create: async (type, payload, options) => {
        capturedPriority = options.priority;
        return 'mock-id';
      },
    };
    const mockEventRuntime = { on: () => {}, emit: async () => {} };
    const bridge = new EventToMissionBridge({
      eventRuntime: mockEventRuntime,
      missionRuntime: mockMissionRuntime,
    });

    const saved = EVENT_MISSION_MAP.TEST_MISSING;
    EVENT_MISSION_MAP.TEST_MISSING = { missionType: 'TEST' };

    await bridge._handleEvent({
      event_type: 'TEST_MISSING',
      event_id: 'evt-miss-001',
      source: 'test',
      namespace: 'core::test',
      payload: {},
      metadata: {},
    });

    if (saved !== undefined) {
      EVENT_MISSION_MAP.TEST_MISSING = saved;
    } else {
      delete EVENT_MISSION_MAP.TEST_MISSING;
    }

    assert('undefined priority → 1', capturedPriority, 1);
  }

  // ─── Group 5: Idempotence ───────────────────────────────────────
  console.log('Group 5: canonicalPriority is idempotent');
  {
    const values = [0, 1, 2, 3, 4, 5, 7, 8, 10, 'high', 'low', 'normal', null, undefined, 9.9];
    for (const v of values) {
      const once = canonicalPriority(v);
      const twice = canonicalPriority(once);
      assert(`canonicalPriority(${JSON.stringify(v)}) idempotent`, once, twice);
    }
  }

  // ─── Summary ─────────────────────────────────────────────────────
  console.log(`\n=== Summary ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) process.exit(1);
}

run().catch(err => { console.error(err); process.exit(1); });
