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

  // Test 2: Every mapping has required fields (worker field removed — single decider is MISSION_WORKER_MAP)
  test('Every mapping has missionType and priority (no dead worker field)', () => {
    for (const [eventType, mapping] of Object.entries(EVENT_MISSION_MAP)) {
      assert.ok(mapping.missionType, `${eventType} missing missionType`);
      assert.ok(typeof mapping.priority === 'number', `${eventType} missing priority`);
      assert.strictEqual(mapping.worker, undefined, `${eventType} must NOT have dead worker field (single decider = MISSION_WORKER_MAP)`);
    }
  });

  // Test 3: Single decider — all business event missions resolve through MISSION_WORKER_MAP
  test('All business event missions resolve through MISSION_WORKER_MAP (single decider)', () => {
    const { MISSION_WORKER_MAP } = require('../ping-runtime/orchestration/mission_scheduler');
    const businessEvents = ['CUSTOMER_CREATED', 'CUSTOMER_UPDATED', 'LEAD_CREATED', 'LEAD_CONVERTED',
      'PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_COMPLETED', 'ESTIMATE_CREATED', 'ESTIMATE_SENT',
      'ESTIMATE_ACCEPTED', 'INVOICE_CREATED', 'INVOICE_SENT', 'INVOICE_PAID', 'REVIEW_RECEIVED',
      'REVIEW_RESPONDED', 'EMAIL_RECEIVED', 'GOOGLE_REVIEW_RECEIVED'];
    for (const eventType of businessEvents) {
      const mapping = EVENT_MISSION_MAP[eventType];
      assert.ok(mapping, `${eventType} missing from EVENT_MISSION_MAP`);
      const workerName = MISSION_WORKER_MAP[mapping.missionType];
      assert.strictEqual(workerName, 'observation', `${eventType} → ${mapping.missionType} should resolve to observation worker via MISSION_WORKER_MAP`);
    }
  });

  // Test 4: Downstream pipeline events resolve correctly through single decider
  test('Downstream pipeline resolves through MISSION_WORKER_MAP (single decider)', () => {
    const { MISSION_WORKER_MAP } = require('../ping-runtime/orchestration/mission_scheduler');
    assert.strictEqual(MISSION_WORKER_MAP[EVENT_MISSION_MAP['OBSERVATION_CREATED'].missionType], 'claim');
    assert.strictEqual(MISSION_WORKER_MAP[EVENT_MISSION_MAP['CLAIM_CREATED'].missionType], 'classification');
    assert.strictEqual(MISSION_WORKER_MAP[EVENT_MISSION_MAP['CLASSIFICATION_CREATED'].missionType], 'recommendation');
    assert.strictEqual(MISSION_WORKER_MAP[EVENT_MISSION_MAP['RECOMMENDATION_CREATED'].missionType], 'projection');
    assert.strictEqual(MISSION_WORKER_MAP[EVENT_MISSION_MAP['PROJECTION_CREATED'].missionType], 'replay');
    assert.strictEqual(MISSION_WORKER_MAP[EVENT_MISSION_MAP['REPLAY_COMPLETED'].missionType], 'witness');
    assert.strictEqual(MISSION_WORKER_MAP[EVENT_MISSION_MAP['WITNESS_CREATED'].missionType], 'lineage');
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

  // A persisted duplicate is already canonical history. Re-dispatching it would
  // repeat mission creation and integration side effects on every retry.
  await testAsync('Persisted duplicate does not dispatch handlers or integrations twice', async () => {
    const pool = {
      async query(sql, params) {
        if (sql.includes('INSERT')) {
          // First insert succeeds, second returns rowCount: 0 (ON CONFLICT)
          if (!this._insertCount) this._insertCount = 0;
          this._insertCount++;
          return { rowCount: this._insertCount === 1 ? 1 : 0 };
        }
        if (sql.includes('SELECT')) {
          // Return the exact same payload for duplicate detection
          return { 
            rows: [{ 
              payload: { work_order_id: 'wo-1', result_id: 'result-1' },
              metadata: {},
              namespace: 'core::system'
            }] 
          };
        }
        return { rows: [] };
      },
    };
    const integrationManager = {
      calls: 0,
      async emit() { this.calls++; },
    };
    const eventRuntime = new UnifiedEventRuntime({ pool, integrationManager });
    let handlerCalls = 0;
    eventRuntime.on('WORKER_COMPLETED', async () => { handlerCalls++; });

    const args = [
      'WORKER_COMPLETED',
      'worker-runtime:external-agent-adapter',
      { work_order_id: 'wo-1', result_id: 'result-1' },
      { namespace: 'core::system', logical_id: 'result-1' },
    ];
    const first = await eventRuntime.emit(...args);
    const duplicate = await eventRuntime.emit(...args);

    assert.strictEqual(first.deduplicated, undefined);
    assert.strictEqual(duplicate.deduplicated, true);
    assert.strictEqual(first.eventId, duplicate.eventId);
    assert.strictEqual(handlerCalls, 1);
    assert.strictEqual(integrationManager.calls, 1);
    assert.strictEqual(eventRuntime.getStats().deduplicated, 1);
    assert.strictEqual(eventRuntime.getStats().emitted, 1);
  });

  // Test: Concurrent duplicate emissions produce one canonical outcome
  await testAsync('Concurrent duplicate emissions produce one canonical outcome', async () => {
    let handlerCalls = 0;
    const pool = {
      async query(sql, params) {
        if (sql.includes('INSERT') && sql.includes('ping_events')) {
          // First insert succeeds, subsequent return rowCount: 0
          if (!this._insertCount) this._insertCount = 0;
          this._insertCount++;
          return { rowCount: this._insertCount === 1 ? 1 : 0 };
        }
        if (sql.includes('SELECT') && sql.includes('ping_events')) {
          // Return the same payload for duplicate detection
          return { 
            rows: [{ 
              payload: { value: 42 },
              metadata: {},
              namespace: null
            }] 
          };
        }
        return { rows: [] };
      },
    };
    const integrationManager = {
      calls: 0,
      async emit() { this.calls++; },
    };
    const er = new UnifiedEventRuntime({ pool, integrationManager });
    er.on('TEST_CONCURRENT', async () => { handlerCalls++; });
    const event = {
      type: 'TEST_CONCURRENT',
      source: 'test',
      payload: { value: 42 },
    };
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(er.emit(event.type, event.source, event.payload));
    }
    const results = await Promise.all(promises);
    const duplicates = results.filter(r => r.deduplicated).length;
    const nonDuplicates = results.filter(r => !r.deduplicated).length;
    assert.strictEqual(handlerCalls, 1, 'Handler should be called exactly once');
    assert.strictEqual(integrationManager.calls, 1, 'Integration should be called exactly once');
    assert.strictEqual(nonDuplicates, 1, 'Exactly one emission should be non-duplicate');
    assert.strictEqual(duplicates, 9, 'Nine emissions should be classified as duplicates');
    assert.strictEqual(er._stats.deduplicated, 9, 'Runtime should track 9 deduplications');
  });

  // Test: Collision detection - same event ID with different content should error
  await testAsync('Collision detection: same event ID with different content errors', async () => {
    const storedEvents = {};
    const pool = {
      async query(sql, params) {
        if (sql.includes('INSERT') && sql.includes('ping_events')) {
          // Always return rowCount: 0 to simulate ON CONFLICT DO NOTHING
          // (event_id already exists from first insert)
          return { rowCount: 0 };
        }
        if (sql.includes('SELECT') && sql.includes('ping_events')) {
          // Return the originally persisted payload (value: 42)
          // This will differ from the second emission's payload (value: 999)
          return { 
            rows: [{ 
              payload: { value: 42 },
              metadata: {},
              namespace: null
            }] 
          };
        }
        return { rows: [] };
      },
    };
    const integrationManager = {
      calls: 0,
      async emit() { this.calls++; },
    };
    const er = new UnifiedEventRuntime({ pool, integrationManager });
    
    // First emission - this will be stored (we fake it by returning rowCount: 0 on SELECT)
    await er.emit('TEST_COLLISION', 'test', { value: 42 });
    
    // Second emission with same event type/source but different payload
    // This should now be detected as a collision and error
    const result = await er.emit('TEST_COLLISION', 'test', { value: 999 });
    
    assert.strictEqual(result.status, 'error', 'Collision should return error status');
    assert.strictEqual(result.collision, true, 'Error should be marked as collision');
    assert.ok(result.error.includes('Collision detected'), 'Error message should mention collision');
  });

  console.log(`\n=== Summary ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
