const assert = require('assert');
const { EventToMissionBridge, EVENT_MISSION_MAP } = require('../ping-runtime/orchestration/event_to_mission_bridge');
const { UnifiedEventRuntime } = require('../ping-runtime/events/unified_event_runtime');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); } catch(e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

async function testAsync(name, fn) {
  try { await fn(); passed++; console.log(`  ✓ ${name}`); } catch(e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// Mock MissionRuntime that captures missions
class MockMissionRuntime {
  constructor() { this.missions = []; }
  async create(type, payload, options) {
    const id = `mission-${this.missions.length}`;
    this.missions.push({ id, type, payload, options });
    return id;
  }
}

async function main() {
  console.log('=== Event-to-Mission Bridge Tests ===');

  // Test 1: All mapped events are registered
  test('EVENT_MISSION_MAP has 23+ event types', () => {
    assert.ok(Object.keys(EVENT_MISSION_MAP).length >= 23);
  });

  // Test 2: Every mapping has required fields
  test('Every mapping has missionType, worker, priority', () => {
    for (const [eventType, mapping] of Object.entries(EVENT_MISSION_MAP)) {
      assert.ok(mapping.missionType, `${eventType} missing missionType`);
      assert.ok(mapping.worker, `${eventType} missing worker`);
      assert.ok(typeof mapping.priority === 'number', `${eventType} missing priority`);
    }
  });

  // Test 3: Business events map to observation worker
  test('All business events map to observation worker', () => {
    const businessEvents = ['CUSTOMER_CREATED', 'CUSTOMER_UPDATED', 'LEAD_CREATED', 'LEAD_CONVERTED',
      'PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_COMPLETED', 'ESTIMATE_CREATED', 'ESTIMATE_SENT',
      'ESTIMATE_ACCEPTED', 'INVOICE_CREATED', 'INVOICE_SENT', 'INVOICE_PAID', 'REVIEW_RECEIVED',
      'REVIEW_RESPONDED', 'EMAIL_RECEIVED', 'GOOGLE_REVIEW_RECEIVED'];
    for (const eventType of businessEvents) {
      assert.strictEqual(EVENT_MISSION_MAP[eventType].worker, 'observation', `${eventType} should map to observation`);
    }
  });

  // Test 4: Downstream pipeline events map correctly
  test('Downstream pipeline maps to correct workers', () => {
    assert.strictEqual(EVENT_MISSION_MAP['OBSERVATION_CREATED'].worker, 'claim');
    assert.strictEqual(EVENT_MISSION_MAP['CLAIM_CREATED'].worker, 'classification');
    assert.strictEqual(EVENT_MISSION_MAP['CLASSIFICATION_CREATED'].worker, 'recommendation');
    assert.strictEqual(EVENT_MISSION_MAP['RECOMMENDATION_CREATED'].worker, 'projection');
    assert.strictEqual(EVENT_MISSION_MAP['PROJECTION_CREATED'].worker, 'replay');
    assert.strictEqual(EVENT_MISSION_MAP['REPLAY_COMPLETED'].worker, 'witness');
    assert.strictEqual(EVENT_MISSION_MAP['WITNESS_CREATED'].worker, 'lineage');
    assert.strictEqual(EVENT_MISSION_MAP['LINEAGE_CREATED'], undefined, 'LINEAGE_CREATED is terminal — chain complete');
  });

  // Test 5: Bridge creates missions for business events
  await testAsync('Bridge creates REVIEW_RESPONSE mission for REVIEW_RECEIVED', async () => {
    const eventRuntime = new UnifiedEventRuntime();
    const missionRuntime = new MockMissionRuntime();
    const bridge = new EventToMissionBridge({ eventRuntime, missionRuntime });
    bridge.start();

    await eventRuntime.emit('REVIEW_RECEIVED', 'test', { review_id: 'r1', rating: 5 });

    assert.strictEqual(missionRuntime.missions.length, 1);
    assert.strictEqual(missionRuntime.missions[0].type, 'REVIEW_RESPONSE');
    assert.strictEqual(missionRuntime.missions[0].payload.event_type, 'REVIEW_RECEIVED');
    assert.strictEqual(missionRuntime.missions[0].options.priority, 3);
    assert.strictEqual(bridge.getStats().missionsCreated, 1);
  });

  // Test 6: Bridge handles multiple event types
  await testAsync('Bridge handles 5 different event types', async () => {
    const eventRuntime = new UnifiedEventRuntime();
    const missionRuntime = new MockMissionRuntime();
    const bridge = new EventToMissionBridge({ eventRuntime, missionRuntime });
    bridge.start();

    await eventRuntime.emit('CUSTOMER_CREATED', 'test', { customer_id: 'c1' });
    await eventRuntime.emit('LEAD_CREATED', 'test', { lead_id: 'l1' });
    await eventRuntime.emit('PROJECT_CREATED', 'test', { project_id: 'p1' });
    await eventRuntime.emit('ESTIMATE_SENT', 'test', { estimate_id: 'e1' });
    await eventRuntime.emit('REVIEW_RECEIVED', 'test', { review_id: 'r1' });

    assert.strictEqual(missionRuntime.missions.length, 5);
    const types = missionRuntime.missions.map(m => m.type);
    assert.deepStrictEqual(types, ['CUSTOMER_ONBOARD', 'LEAD_FOLLOWUP', 'PROJECT_SETUP', 'ESTIMATE_FOLLOWUP', 'REVIEW_RESPONSE']);
  });

  // Test 7: Bridge handles downstream pipeline events
  await testAsync('Bridge creates downstream pipeline missions', async () => {
    const eventRuntime = new UnifiedEventRuntime();
    const missionRuntime = new MockMissionRuntime();
    const bridge = new EventToMissionBridge({ eventRuntime, missionRuntime });
    bridge.start();

    await eventRuntime.emit('OBSERVATION_CREATED', 'test', { documentId: 'd1' });
    await eventRuntime.emit('CLAIM_CREATED', 'test', { documentId: 'd1' });
    await eventRuntime.emit('REPLAY_COMPLETED', 'test', { documentId: 'd1' });

    assert.strictEqual(missionRuntime.missions.length, 3);
    const types = missionRuntime.missions.map(m => m.type);
    assert.deepStrictEqual(types, ['CLAIM_GENERATE', 'CLASSIFICATION_CREATE', 'WITNESS_CREATE']);
  });

  // Test 8: Bridge ignores unmapped events
  await testAsync('Bridge ignores unmapped event types', async () => {
    const eventRuntime = new UnifiedEventRuntime();
    const missionRuntime = new MockMissionRuntime();
    const bridge = new EventToMissionBridge({ eventRuntime, missionRuntime });
    bridge.start();

    // SYSTEM_EVENT is not subscribed — handler never fires, no mission created
    await eventRuntime.emit('SYSTEM_EVENT', 'test', { message: 'heartbeat' });

    assert.strictEqual(missionRuntime.missions.length, 0);
    assert.strictEqual(bridge.getStats().missionsCreated, 0);
    assert.strictEqual(bridge.getStats().listened, 0);
  });

  // Test 9: Full chain — event → bridge → mission → scheduler maps to worker
  await testAsync('Full chain: event → bridge → mission → scheduler mapping', async () => {
    const { MISSION_WORKER_MAP } = require('../ping-runtime/orchestration/mission_scheduler');

    const eventRuntime = new UnifiedEventRuntime();
    const missionRuntime = new MockMissionRuntime();
    const bridge = new EventToMissionBridge({ eventRuntime, missionRuntime });
    bridge.start();

    await eventRuntime.emit('ESTIMATE_ACCEPTED', 'google-connector', { estimate_id: 'e1', project_id: 'p1' });

    assert.strictEqual(missionRuntime.missions.length, 1);
    const mission = missionRuntime.missions[0];
    assert.strictEqual(mission.type, 'ESTIMATE_CONVERT');

    const workerName = MISSION_WORKER_MAP[mission.type];
    assert.strictEqual(workerName, 'observation');
  });

  // Test 10: Bridge stats are accurate
  await testAsync('Bridge stats track listened/created/skipped/failed', async () => {
    const eventRuntime = new UnifiedEventRuntime();
    const missionRuntime = new MockMissionRuntime();
    const bridge = new EventToMissionBridge({ eventRuntime, missionRuntime });
    bridge.start();

    await eventRuntime.emit('REVIEW_RECEIVED', 'test', { review_id: 'r1' });
    await eventRuntime.emit('CUSTOMER_CREATED', 'test', { customer_id: 'c1' });

    const stats = bridge.getStats();
    assert.strictEqual(stats.listened, 2);
    assert.strictEqual(stats.missionsCreated, 2);
    assert.strictEqual(stats.failed, 0);
  });

  console.log(`\n=== Summary ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
