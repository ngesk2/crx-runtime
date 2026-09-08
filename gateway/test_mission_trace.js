/**
 * Test: Mission Trace — causal chain resolution
 *
 * Proves that GET /mc/missions/:id/trace returns the full correlated event
 * chain for a mission, resolving correlation_id from the triggering event.
 */
const assert = require('assert');

// ── Mock pool ──────────────────────────────────────────────────────
function makeMockPool() {
  const store = { events: [], missions: [] };
  return {
    store,
    query(sql, params) {
      // INSERT mission
      if (sql.includes('INSERT INTO ping_missions')) {
        const m = {
          mission_id: params[0], mission_type: params[1], status: 'created',
          payload: params[2], priority: params[3], created_by: params[4],
          created_at: new Date().toISOString(),
        };
        store.missions.push(m);
        return { rows: [m], rowCount: 1 };
      }
      // SELECT mission by id
      if (sql.includes('SELECT * FROM ping_missions WHERE mission_id')) {
        const row = store.missions.find(m => m.mission_id === params[0]);
        return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
      }
      // SELECT correlation_id from triggering event
      if (sql.includes("metadata->>'correlation_id' AS cid FROM ping_events")) {
        const row = store.events.find(e => e.event_id === params[0]);
        const cid = row && row.metadata ? row.metadata.correlation_id : null;
        return { rows: cid ? [{ cid }] : [], rowCount: cid ? 1 : 0 };
      }
      // SELECT events by correlation_id
      if (sql.includes("metadata->>'correlation_id' =") && sql.includes('ORDER BY')) {
        const cid = params[0];
        const rows = store.events
          .filter(e => e.metadata && e.metadata.correlation_id === cid)
          .sort((a, b) => a.timestamp < b.timestamp ? -1 : 1);
        return { rows, rowCount: rows.length };
      }
      return { rows: [], rowCount: 0 };
    }
  };
}

// ── Test 1: getTrace resolves correlation_id from triggering event ──
async function testTraceResolvesCorrelationId() {
  const { MissionRuntime } = require('../ping-runtime/orchestration/mission_runtime.js');
  const pool = makeMockPool();
  const rt = new MissionRuntime({ pool });

  // Set up: root event with correlation_id = root_event_id
  const rootEventId = 'evt-root-001';
  pool.store.events.push({
    event_id: rootEventId, event_type: 'REVIEW_RECEIVED', source: 'test',
    timestamp: '2026-08-21T10:00:00Z', payload: { rating: 5 },
    metadata: { correlation_id: rootEventId, namespace: 'core::system' },
  });

  // Downstream events sharing the same correlation_id
  pool.store.events.push({
    event_id: 'evt-obs-002', event_type: 'OBSERVATION_CREATED', source: 'observation',
    timestamp: '2026-08-21T10:00:01Z', payload: { text: 'good review' },
    metadata: { correlation_id: rootEventId, namespace: 'core::system' },
  });
  pool.store.events.push({
    event_id: 'evt-claim-003', event_type: 'CLAIM_CREATED', source: 'claim',
    timestamp: '2026-08-21T10:00:02Z', payload: { claim: 'positive' },
    metadata: { correlation_id: rootEventId, namespace: 'core::system' },
  });

  // Create a mission for the root event (simulates bridge)
  const missionId = 'mis-test-001';
  pool.store.missions.push({
    mission_id: missionId, mission_type: 'OBSERVATION_CREATE', status: 'completed',
    payload: { event_id: rootEventId, event_type: 'REVIEW_RECEIVED' },
    created_at: '2026-08-21T10:00:00Z',
  });

  const trace = await rt.getTrace(missionId);
  assert(trace, 'trace should exist');
  assert.strictEqual(trace.correlation_id, rootEventId, 'correlation_id should be root event ID');
  assert.strictEqual(trace.eventCount, 3, 'should find all 3 events in the chain');
  assert.strictEqual(trace.events[0].event_type, 'REVIEW_RECEIVED', 'first event is the root');
  assert.strictEqual(trace.events[1].event_type, 'OBSERVATION_CREATED');
  assert.strictEqual(trace.events[2].event_type, 'CLAIM_CREATED');
  console.log('  ✓ T1: getTrace resolves correlation_id from triggering event');
}

// ── Test 2: getTrace returns null for unknown mission ──
async function testTraceNotFound() {
  const { MissionRuntime } = require('../ping-runtime/orchestration/mission_runtime.js');
  const pool = makeMockPool();
  const rt = new MissionRuntime({ pool });

  const trace = await rt.getTrace('nonexistent-mission');
  assert.strictEqual(trace, null, 'should return null for unknown mission');
  console.log('  ✓ T2: getTrace returns null for unknown mission');
}

// ── Test 3: getTrace falls back to event_id when event not in ping_events ──
async function testTraceFallbackToEventId() {
  const { MissionRuntime } = require('../ping-runtime/orchestration/mission_runtime.js');
  const pool = makeMockPool();
  const rt = new MissionRuntime({ pool });

  // Mission exists but triggering event is NOT in ping_events (e.g. different store)
  const rootEventId = 'evt-orphan-001';
  pool.store.missions.push({
    mission_id: 'mis-orphan', mission_type: 'OBSERVATION_CREATE', status: 'completed',
    payload: { event_id: rootEventId, event_type: 'REVIEW_RECEIVED' },
    created_at: '2026-08-21T10:00:00Z',
  });

  // An event with correlation_id = rootEventId exists (downstream)
  pool.store.events.push({
    event_id: 'evt-downstream', event_type: 'OBSERVATION_CREATED', source: 'obs',
    timestamp: '2026-08-21T10:00:01Z', payload: {},
    metadata: { correlation_id: rootEventId, namespace: 'core::system' },
  });

  const trace = await rt.getTrace('mis-orphan');
  assert(trace, 'trace should exist');
  assert.strictEqual(trace.correlation_id, rootEventId, 'fallback should use event_id as correlation_id');
  assert.strictEqual(trace.eventCount, 1, 'should find the downstream event');
  console.log('  ✓ T3: getTrace falls back to event_id when triggering event not in ping_events');
}

// ── Test 4: getTrace with no event_id in payload falls back to mission_id ──
async function testTraceFallbackToMissionId() {
  const { MissionRuntime } = require('../ping-runtime/orchestration/mission_runtime.js');
  const pool = makeMockPool();
  const rt = new MissionRuntime({ pool });

  pool.store.missions.push({
    mission_id: 'mis-noevent', mission_type: 'SYSTEM_HEALTH_CHECK', status: 'completed',
    payload: { health: 'ok' }, // no event_id
    created_at: '2026-08-21T10:00:00Z',
  });

  const trace = await rt.getTrace('mis-noevent');
  assert(trace, 'trace should exist');
  assert.strictEqual(trace.correlation_id, 'mis-noevent', 'fallback should use mission_id');
  assert.strictEqual(trace.eventCount, 0, 'no events match mission_id as correlation_id');
  console.log('  ✓ T4: getTrace falls back to mission_id when no event_id in payload');
}

// ── Test 5: Route returns 404 for unknown mission ──
async function testRouteNotFound() {
  const http = require('http');
  const express = require('express');
  const { MissionRuntime } = require('../ping-runtime/orchestration/mission_runtime.js');
  const pool = makeMockPool();
  const rt = new MissionRuntime({ pool });
  const mockEventRuntime = { query: async () => ({ events: [] }) };

  const app = express();
  const createMissionControlRoutes = require('./routes/mission_control.js');
  app.use('/mc', createMissionControlRoutes({ missionRuntime: rt, unifiedEventRuntime: mockEventRuntime, knowledgeGraph: null, aiRuntime: null, googleConnector: null, connectorRegistry: null, workerRuntime: null, missionScheduler: null, eventBridge: null, eventToMissionBridge: null }));

  const server = app.listen(0, () => {
    const port = server.address().port;
    http.get(`http://127.0.0.1:${port}/mc/missions/nonexistent/trace`, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        assert.strictEqual(res.statusCode, 404, 'should return 404');
        const json = JSON.parse(body);
        assert.strictEqual(json.status, 'not_found');
        server.close();
        console.log('  ✓ T5: GET /mc/missions/:id/trace returns 404 for unknown mission');
      });
    });
  });
}

// ── Test 6: Route returns trace for known mission ──
async function testRouteReturnsTrace() {
  const http = require('http');
  const express = require('express');
  const { MissionRuntime } = require('../ping-runtime/orchestration/mission_runtime.js');
  const pool = makeMockPool();
  const rt = new MissionRuntime({ pool });
  const mockEventRuntime = { query: async () => ({ events: [] }) };

  // Seed data
  const rootEventId = 'evt-route-001';
  pool.store.events.push({
    event_id: rootEventId, event_type: 'REVIEW_RECEIVED', source: 'test',
    timestamp: '2026-08-21T10:00:00Z', payload: { rating: 5 },
    metadata: { correlation_id: rootEventId, namespace: 'core::system' },
  });
  pool.store.events.push({
    event_id: 'evt-route-002', event_type: 'OBSERVATION_CREATED', source: 'obs',
    timestamp: '2026-08-21T10:00:01Z', payload: { text: 'great' },
    metadata: { correlation_id: rootEventId, namespace: 'core::system' },
  });
  pool.store.missions.push({
    mission_id: 'mis-route-001', mission_type: 'OBSERVATION_CREATE', status: 'completed',
    payload: { event_id: rootEventId, event_type: 'REVIEW_RECEIVED' },
    created_at: '2026-08-21T10:00:00Z',
  });

  const app = express();
  const createMissionControlRoutes = require('./routes/mission_control.js');
  app.use('/mc', createMissionControlRoutes({ missionRuntime: rt, unifiedEventRuntime: mockEventRuntime, knowledgeGraph: null, aiRuntime: null, googleConnector: null, connectorRegistry: null, workerRuntime: null, missionScheduler: null, eventBridge: null, eventToMissionBridge: null }));

  const server = app.listen(0, () => {
    const port = server.address().port;
    http.get(`http://127.0.0.1:${port}/mc/missions/mis-route-001/trace`, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        assert.strictEqual(res.statusCode, 200, 'should return 200');
        const json = JSON.parse(body);
        assert.strictEqual(json.status, 'ok');
        assert.strictEqual(json.trace.eventCount, 2, 'should find 2 events');
        assert.strictEqual(json.trace.correlation_id, rootEventId);
        assert.strictEqual(json.trace.mission.mission_id, 'mis-route-001');
        server.close();
        console.log('  ✓ T6: GET /mc/missions/:id/trace returns full trace');
      });
    });
  });
}

// ── Run ──
async function main() {
  console.log('\nMission Trace Tests');
  await testTraceResolvesCorrelationId();
  await testTraceNotFound();
  await testTraceFallbackToEventId();
  await testTraceFallbackToMissionId();
  await testRouteNotFound();
  await testRouteReturnsTrace();
  console.log('\nAll 6 mission trace tests passed.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
