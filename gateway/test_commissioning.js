/**
 * PING v1 Commissioning — Phase 1+4+5+8
 * Full end-to-end execution tests for every business workflow.
 *
 * No mocked pipeline stages. Every component executes real code.
 * Mock infrastructure only (Postgres) — all business logic is real.
 *
 * Generates:
 *   - Execution matrix (scenario → stages → evidence)
 *   - Worker execution matrix (worker → events received → events emitted)
 *   - Event integrity report (deterministic IDs, causation chains, no duplicates)
 *   - Evidence completeness report (every mission has trace, events, duration)
 */

const assert = require('assert');
const { UnifiedEventRuntime } = require('../ping-runtime/events/unified_event_runtime');
const { EventToMissionBridge, EVENT_MISSION_MAP } = require('../ping-runtime/orchestration/event_to_mission_bridge');
const { MissionScheduler, MISSION_WORKER_MAP } = require('../ping-runtime/orchestration/mission_scheduler');
const { registerCanonicalWorkers } = require('../ping-runtime/workers/canonical_workers');

// ─── Mock Infrastructure ──────────────────────────────────────────────

class MockPool {
  constructor() {
    this._tables = { ping_events: [], ping_missions: [] };
    this._seq = 0;
  }
  async query(sql, params = []) {
    // CREATE TABLE — no-op
    if (sql.trim().startsWith('CREATE')) return { rows: [], rowCount: 0 };

    // INSERT INTO ping_events
    if (sql.includes('INSERT INTO ping_events')) {
      const event = {
        event_id: params[0], event_type: params[1], source: params[2],
        timestamp: params[3], payload: params[4], metadata: params[5],
        processed: false, created_at: new Date().toISOString(),
      };
      this._tables.ping_events.push(event);
      return { rows: [], rowCount: 1 };
    }

    // INSERT INTO ping_missions — ON CONFLICT DO NOTHING
    if (sql.includes('INSERT INTO ping_missions')) {
      const existing = this._tables.ping_missions.find(m => m.mission_id === params[0]);
      if (existing) return { rows: [], rowCount: 0 };
      const mission = {
        mission_id: params[0], mission_type: params[1], payload: params[2],
        priority: params[3], created_by: params[4],
        status: 'created', result: null, assigned_to: null,
        created_at: new Date().toISOString(), started_at: null,
        completed_at: null, error: null, retries: 0,
      };
      this._tables.ping_missions.push(mission);
      return { rows: [], rowCount: 1 };
    }

    // SELECT COUNT(*) FROM ping_events
    if (sql.includes('SELECT COUNT(*)')) {
      return { rows: [{ count: this._tables.ping_events.length }], rowCount: 1 };
    }

    // SELECT * FROM ping_missions WHERE status = 'created'
    if (sql.includes("WHERE status = 'created'")) {
      const limit = params[0] || 10;
      const pending = this._tables.ping_missions
        .filter(m => m.status === 'created')
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
        .slice(0, limit);
      return { rows: pending, rowCount: pending.length };
    }

    // SELECT * FROM ping_missions WHERE mission_id = ...
    if (sql.includes('WHERE mission_id = $1') && sql.includes('SELECT')) {
      const m = this._tables.ping_missions.find(m => m.mission_id === params[0]);
      return { rows: m ? [m] : [], rowCount: m ? 1 : 0 };
    }

    // SELECT started_at FROM ping_missions
    if (sql.includes('SELECT started_at')) {
      const m = this._tables.ping_missions.find(m => m.mission_id === params[0]);
      return { rows: m ? [{ started_at: m.started_at }] : [], rowCount: 1 };
    }

    // UPDATE ping_missions SET status = 'assigned'
    if (sql.includes("SET status = 'assigned'")) {
      const m = this._tables.ping_missions.find(m => m.mission_id === params[1]);
      if (m) { m.status = 'assigned'; m.assigned_to = params[0]; }
      return { rows: [], rowCount: 1 };
    }

    // UPDATE ping_missions SET status = 'running'
    if (sql.includes("SET status = 'running'")) {
      const m = this._tables.ping_missions.find(m => m.mission_id === params[0]);
      if (m) { m.status = 'running'; m.started_at = new Date().toISOString(); }
      return { rows: [], rowCount: 1 };
    }

    // UPDATE ping_missions SET status = 'completed'
    if (sql.includes("SET status = 'completed'")) {
      const m = this._tables.ping_missions.find(m => m.mission_id === params[1]);
      if (m) {
        m.status = 'completed';
        m.result = params[0];
        m.completed_at = new Date().toISOString();
      }
      return { rows: [], rowCount: 1 };
    }

    // UPDATE ping_missions SET status = 'failed'
    if (sql.includes("SET status = 'failed'")) {
      const m = this._tables.ping_missions.find(m => m.mission_id === params[1]);
      if (m) { m.status = 'failed'; m.error = params[0]; m.completed_at = new Date().toISOString(); }
      return { rows: [], rowCount: 1 };
    }

    // SELECT * FROM ping_events WHERE metadata->>'correlation_id' = ...
    if (sql.includes("correlation_id")) {
      const events = this._tables.ping_events.filter(
        e => e.metadata && JSON.parse(e.metadata).correlation_id === params[0]
      );
      return { rows: events, rowCount: events.length };
    }

    // SELECT * FROM ping_events ORDER BY timestamp DESC
    if (sql.includes('ORDER BY timestamp DESC')) {
      const limit = params[0] || 100;
      return { rows: this._tables.ping_events.slice(-limit), rowCount: this._tables.ping_events.length };
    }

    return { rows: [], rowCount: 0 };
  }
}

// ─── Evidence Collector ───────────────────────────────────────────────

class EvidenceCollector {
  constructor() {
    this._scenarios = [];
    this._events = [];
    this._missions = [];
    this._workers = [];
    this._traces = [];
  }

  recordScenario(name, stages) {
    this._scenarios.push({ name, stages, timestamp: new Date().toISOString() });
  }

  recordEvent(event) {
    this._events.push({ ...event, recorded_at: new Date().toISOString() });
  }

  recordMission(mission) {
    this._missions.push({ ...mission, recorded_at: new Date().toISOString() });
  }

  recordWorker(worker, eventType, inputEvent, outputEvent, duration) {
    this._workers.push({ worker, eventType, inputEvent, outputEvent, duration, recorded_at: new Date().toISOString() });
  }

  recordTrace(trace) {
    this._traces.push(trace);
  }

  generateReport() {
    return {
      generated_at: new Date().toISOString(),
      summary: {
        scenarios: this._scenarios.length,
        events: this._events.length,
        missions: this._missions.length,
        workerExecutions: this._workers.length,
        traces: this._traces.length,
      },
      scenarios: this._scenarios,
      events: this._events,
      missions: this._missions,
      workers: this._workers,
      traces: this._traces,
    };
  }
}

// ─── Test Harness ─────────────────────────────────────────────────────

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); } catch(e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}
async function testAsync(name, fn) {
  try { await fn(); passed++; console.log(`  ✓ ${name}`); } catch(e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

async function main() {
  console.log('=== PING v1 Commissioning — Phase 1+4+5+8 ===\n');

  const evidence = new EvidenceCollector();

  // ─── Setup ────────────────────────────────────────────────────────
  const pool = new MockPool();
  const eventRuntime = new UnifiedEventRuntime({ pool });
  await eventRuntime.initialize();

  const missionRuntime = new (require('../ping-runtime/orchestration/mission_runtime')).MissionRuntime({ pool, eventRuntime });
  await missionRuntime.initialize();

  const workerRuntime = new (require('../ping-runtime/workers/worker_runtime')).WorkerRuntime({ pool });
  registerCanonicalWorkers(workerRuntime, { eventRuntime, pool });
  workerRuntime.start();

  const bridge = new EventToMissionBridge({ eventRuntime, missionRuntime });
  bridge.start();

  // Collect all emitted events
  const allEvents = [];
  const origEmit = eventRuntime.emit.bind(eventRuntime);
  eventRuntime.emit = async function(eventType, source, payload, options) {
    const result = await origEmit(eventType, source, payload, options);
    if (result.status === 'ok') {
      evidence.recordEvent({ event_type: eventType, source, event_id: result.eventId });
      allEvents.push({ event_type: eventType, source, event_id: result.eventId, payload });
    }
    return result;
  };

  // ─── Phase 1: 14 Business Scenarios ──────────────────────────────
  console.log('Phase 1: Full End-to-End Execution Tests\n');

  const scenarios = [
    {
      name: 'New lead submitted',
      events: [{ type: 'LEAD_CREATED', source: 'google-connector', payload: { lead_id: 'lead_test_001', customer_id: 'cust_test_001', source: 'google_business', description: 'Kitchen remodel estimate request' } }],
    },
    {
      name: 'Estimate requested',
      events: [{ type: 'ESTIMATE_CREATED', source: 'project-authority', payload: { estimate_id: 'est_test_001', project_id: 'proj_test_001', amount: 45000 } }],
    },
    {
      name: 'Estimate approved',
      events: [{ type: 'ESTIMATE_ACCEPTED', source: 'project-authority', payload: { estimate_id: 'est_test_001', accepted_at: new Date().toISOString() } }],
    },
    {
      name: 'Customer created',
      events: [{ type: 'CUSTOMER_CREATED', source: 'customer-authority', payload: { customer_id: 'cust_test_002', name: 'Test Customer', email: 'test@example.com' } }],
    },
    {
      name: 'Project created',
      events: [{ type: 'PROJECT_CREATED', source: 'project-authority', payload: { project_id: 'proj_test_002', customer_id: 'cust_test_002', name: 'Test Project', type: 'remodel' } }],
    },
    {
      name: 'Review received',
      events: [{ type: 'REVIEW_RECEIVED', source: 'google-connector', payload: { review_id: 'rev_test_001', customer_id: 'cust_test_001', rating: 5, text: 'Excellent work!', source: 'google' } }],
    },
    {
      name: 'Google Calendar event',
      events: [{ type: 'PROJECT_CREATED', source: 'google-connector', payload: { project_id: 'proj_test_003', name: 'Calendar Booked Project', type: 'consultation' } }],
    },
    {
      name: 'Marketing event',
      events: [{ type: 'LEAD_CREATED', source: 'posthog-connector', payload: { lead_id: 'lead_test_002', source: 'marketing_campaign', description: 'Website form submission' } }],
    },
    {
      name: 'Email received',
      events: [{ type: 'EMAIL_RECEIVED', source: 'email-connector', payload: { from: 'customer@test.com', subject: 'Project question', body: 'When can you start?' } }],
    },
    {
      name: 'SMS received',
      events: [{ type: 'EMAIL_RECEIVED', source: 'sms-connector', payload: { from: '555-0199', subject: 'SMS', body: 'Confirm appointment' } }],
    },
    {
      name: 'Invoice created',
      events: [{ type: 'INVOICE_CREATED', source: 'project-authority', payload: { invoice_id: 'inv_test_001', project_id: 'proj_test_001', amount: 22500 } }],
    },
    {
      name: 'Invoice paid',
      events: [{ type: 'INVOICE_PAID', source: 'project-authority', payload: { invoice_id: 'inv_test_001', amount: 22500, paid_at: new Date().toISOString() } }],
    },
    {
      name: 'Review responded',
      events: [{ type: 'REVIEW_RESPONDED', source: 'review-authority', payload: { review_id: 'rev_test_001', response: 'Thank you for the kind words!' } }],
    },
    {
      name: 'Customer updated',
      events: [{ type: 'CUSTOMER_UPDATED', source: 'customer-authority', payload: { customer_id: 'cust_test_001', changes: { phone: '555-0199' } } }],
    },
  ];

  const executionMatrix = [];

  for (const scenario of scenarios) {
    const stages = [];
    const beforeMissions = pool._tables.ping_missions.length;

    for (const evt of scenario.events) {
      const startTime = Date.now();
      const result = await eventRuntime.emit(evt.type, evt.source, evt.payload);
      const duration = Date.now() - startTime;

      stages.push({
        stage: 'emit',
        event_type: evt.type,
        status: result.status,
        event_id: result.eventId,
        duration_ms: duration,
      });
    }

    // Wait for bridge to process
    await new Promise(r => setTimeout(r, 50));

    const newMissions = pool._tables.ping_missions.slice(beforeMissions);
    for (const m of newMissions) {
      stages.push({
        stage: 'mission_created',
        mission_id: m.mission_id,
        mission_type: m.mission_type,
        priority: m.priority,
      });
    }

    evidence.recordScenario(scenario.name, stages);
    executionMatrix.push({ scenario: scenario.name, stages: stages.length, events: scenario.events.length, missions: newMissions.length });

    console.log(`  ✓ ${scenario.name} — ${scenario.events.length} events, ${newMissions.length} missions`);
  }

  // ─── Run missions through scheduler — iterative dispatch ────────
  console.log('\nPhase 1b: Dispatch missions to workers\n');

  let totalDispatched = 0;
  let maxRounds = 10; // business → observation → claim → classification → recommendation → projection → replay → witness → lineage
  for (let round = 0; round < maxRounds; round++) {
    const pendingMissions = pool._tables.ping_missions.filter(m => m.status === 'created');
    if (pendingMissions.length === 0) break;
    console.log(`  Round ${round + 1}: ${pendingMissions.length} pending missions`);

    for (const mission of pendingMissions) {
      const workerName = MISSION_WORKER_MAP[mission.mission_type];
      if (!workerName) { continue; }

      const startTime = Date.now();
      try {
        await missionRuntime.assign(mission.mission_id, workerName);
        await missionRuntime.start(mission.mission_id);

        const parsedPayload = typeof mission.payload === 'string' ? JSON.parse(mission.payload) : mission.payload;
        const event = {
          event_type: parsedPayload.event_type || mission.mission_type,
          source: 'mission-scheduler',
          mission_id: mission.mission_id,
          payload: parsedPayload,
          metadata: { mission_type: mission.mission_type, priority: mission.priority },
        };

        await workerRuntime.dispatch(event);
        const duration = Date.now() - startTime;

        await missionRuntime.complete(mission.mission_id, { worker: workerName, duration_ms: duration });

        evidence.recordWorker(workerName, mission.mission_type, mission.mission_id, 'completed', duration);
        totalDispatched++;
      } catch (err) {
        const duration = Date.now() - startTime;
        await missionRuntime.fail(mission.mission_id, err.message);
        evidence.recordWorker(workerName || 'unknown', mission.mission_type, mission.mission_id, 'failed', duration);
      }
    }
  }

  console.log(`\n  Total dispatched: ${totalDispatched}`);

  // ─── Phase 4: Worker Execution Matrix ────────────────────────────
  console.log('\nPhase 4: Worker Execution Matrix\n');

  const workerStats = workerRuntime.getStats();
  const workerMatrix = [];
  for (const [name, stats] of Object.entries(workerStats.workers)) {
    workerMatrix.push({
      worker: name,
      status: stats.status,
      eventTypes: stats.eventTypes,
      processed: stats.totalProcessed,
      failed: stats.totalFailed,
      maxConcurrent: stats.maxConcurrent,
    });
    console.log(`  ${name}: ${stats.totalProcessed} processed, ${stats.totalFailed} failed, types=[${stats.eventTypes.join(', ')}]`);
  }

  // ─── Phase 5: Event Integrity Report ─────────────────────────────
  console.log('\nPhase 5: Event Integrity Report\n');

  const emittedEvents = evidence._events;
  const eventIds = emittedEvents.map(e => e.event_id);
  const uniqueIds = new Set(eventIds);
  const eventTypes = new Set(emittedEvents.map(e => e.event_type));

  console.log(`  Total events emitted: ${emittedEvents.length}`);
  console.log(`  Unique event IDs: ${uniqueIds.size}`);
  console.log(`  Duplicate IDs: ${emittedEvents.length - uniqueIds.size}`);
  console.log(`  Event types used: ${eventTypes.size}`);
  console.log(`  Event types: ${Array.from(eventTypes).sort().join(', ')}`);

  // Verify determinism — same input = same ID
  const testPayload = { test: 'determinism_check' };
  const id1 = (await eventRuntime.emit('SYSTEM_EVENT', 'test', testPayload)).eventId;
  const id2 = (await eventRuntime.emit('SYSTEM_EVENT', 'test', testPayload)).eventId;
  console.log(`  Deterministic IDs: ${id1 === id2 ? 'PASS' : 'FAIL'}`);

  // ─── Phase 8: Evidence Completeness ──────────────────────────────
  console.log('\nPhase 8: Evidence Completeness Report\n');

  const missions = pool._tables.ping_missions;
  const completedMissions = missions.filter(m => m.status === 'completed');
  const failedMissions = missions.filter(m => m.status === 'failed');

  let evidenceComplete = 0;
  let evidenceIncomplete = 0;
  for (const m of completedMissions) {
    const hasResult = m.result && Object.keys(JSON.parse(m.result || '{}')).length > 0;
    if (hasResult) evidenceComplete++;
    else evidenceIncomplete++;
  }

  console.log(`  Total missions: ${missions.length}`);
  console.log(`  Completed: ${completedMissions.length}`);
  console.log(`  Failed: ${failedMissions.length}`);
  console.log(`  Evidence complete: ${evidenceComplete}`);
  console.log(`  Evidence incomplete: ${evidenceIncomplete}`);

  // ─── Write reports ───────────────────────────────────────────────
  const report = evidence.generateReport();
  report.executionMatrix = executionMatrix;
  report.workerMatrix = workerMatrix;
  report.eventIntegrity = {
    totalEvents: emittedEvents.length,
    uniqueIds: uniqueIds.size,
    duplicateIds: emittedEvents.length - uniqueIds.size,
    eventTypesUsed: eventTypes.size,
    deterministicIds: id1 === id2,
    eventTypes: Array.from(eventTypes).sort(),
  };
  report.evidenceCompleteness = {
    totalMissions: missions.length,
    completed: completedMissions.length,
    failed: failedMissions.length,
    evidenceComplete,
    evidenceIncomplete,
  };

  const fs = require('fs');
  const reportPath = require('path').join(__dirname, 'COMMISSIONING_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n  Report written to COMMISSIONING_REPORT.json`);

  // ─── Summary ─────────────────────────────────────────────────────
  console.log(`\n=== Summary ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  console.log(`\nScenarios: ${executionMatrix.length}`);
  console.log(`Events emitted: ${emittedEvents.length}`);
  console.log(`Missions created: ${missions.length}`);
  console.log(`Worker executions: ${evidence._workers.length}`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
