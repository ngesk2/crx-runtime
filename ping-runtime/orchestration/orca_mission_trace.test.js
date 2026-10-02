'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const { MissionRuntime } = require('./mission_runtime.js');
const { MissionScheduler } = require('./mission_scheduler.js');
const { WorkerRuntime } = require('../workers/worker_runtime.js');
const { registerCanonicalWorkers } = require('../workers/canonical_workers.js');
const { EventToMissionBridge } = require('./event_to_mission_bridge.js');

let fakeNow = Date.now();
const realDateNow = Date.now;
Date.now = () => fakeNow;
const iso = () => new Date(fakeNow).toISOString();

class FakePool {
  constructor() { this.missions = new Map(); }
  _inList(sql) { const m = sql.match(/status IN \(([^)]+)\)/); return m ? m[1].split(',').map(s => s.trim().replace(/'/g, '')) : null; }
  async query(sql, params = []) {
    const S = sql.replace(/\s+/g, ' ').trim();
    if (/^(CREATE|ALTER)/.test(S)) return { rows: [], rowCount: 0 };
    const byId = (id) => this.missions.get(id);

    if (S.includes('INSERT INTO ping_missions')) {
      const id = params[0];
      if (this.missions.has(id)) return { rows: [], rowCount: 0 };
      this.missions.set(id, {
        mission_id: id, mission_type: params[1], payload: params[2],
        priority: params[3] || 0, created_by: params[4] || null,
        status: 'created', result: null, assigned_to: null,
        created_at: iso(), started_at: null, completed_at: null,
        error: null, retries: 0, retry_at: null, lease_until: null, claimed_at: null,
        tenant_id: params[5] || 'UNKNOWN',
      });
      return { rows: [], rowCount: 1 };
    }
    if (S.includes('SELECT retries FROM ping_missions')) {
      const m = byId(params[0]);
      return m ? { rows: [{ retries: m.retries }], rowCount: 1 } : { rows: [], rowCount: 0 };
    }
    if (S.includes('SELECT started_at FROM ping_missions')) {
      const m = byId(params[0]);
      return m ? { rows: [{ started_at: m.started_at }], rowCount: 1 } : { rows: [], rowCount: 0 };
    }
    if (S.includes('SELECT * FROM ping_missions') && S.includes('WHERE mission_id')) {
      const m = byId(params[0]);
      return m ? { rows: [m], rowCount: 1 } : { rows: [], rowCount: 0 };
    }
    if (S.includes("SET status = 'assigned'")) {
      const m = byId(params[1]);
      if (!m || m.status !== 'created') return { rows: [], rowCount: 0 };
      m.status = 'assigned'; m.assigned_to = params[0];
      m.claimed_at = iso(); m.lease_until = new Date(fakeNow + 60000).toISOString();
      return { rows: [{ mission_id: m.mission_id }], rowCount: 1 };
    }
    if (S.includes("SET status = 'running'")) {
      const m = byId(params[0]);
      if (!m || m.status !== 'assigned') return { rows: [], rowCount: 0 };
      m.status = 'running'; m.started_at = iso();
      return { rows: [], rowCount: 1 };
    }
    if (S.includes("SET status = 'completed'")) {
      const m = byId(params[1]);
      if (!m || m.status !== 'running') return { rows: [], rowCount: 0 };
      m.status = 'completed'; m.result = params[0]; m.completed_at = iso();
      return { rows: [], rowCount: 1 };
    }
    if (S.includes("SET status = 'retry_pending'")) {
      const m = byId(params[3]);
      const allowed = this._inList(S) || [];
      if (!m || !allowed.includes(m.status)) return { rows: [], rowCount: 0 };
      m.status = 'retry_pending'; m.error = params[0]; m.retries = params[1]; m.retry_at = params[2];
      return { rows: [], rowCount: 1 };
    }
    if (S.includes("SET status = 'failed'") && S.includes('retries')) {
      const m = byId(params[2]);
      const allowed = this._inList(S) || [];
      if (!m || !allowed.includes(m.status)) return { rows: [], rowCount: 0 };
      m.status = 'failed'; m.error = params[0]; m.retries = params[1]; m.completed_at = iso();
      return { rows: [], rowCount: 1 };
    }
    if (S.includes("SET status = 'failed'")) {
      const m = byId(params[1]);
      const allowed = this._inList(S) || [];
      if (!m || !allowed.includes(m.status)) return { rows: [], rowCount: 0 };
      m.status = 'failed'; m.error = params[0]; m.completed_at = iso();
      return { rows: [], rowCount: 1 };
    }
    if (S.includes("SET status = 'created'") && S.includes('retry_at = NULL')) {
      const out = [];
      for (const m of this.missions.values()) {
        if (m.status === 'retry_pending' && m.retry_at && Date.parse(m.retry_at) <= fakeNow) {
          m.status = 'created'; m.assigned_to = null; m.lease_until = null;
          m.claimed_at = null; m.retry_at = null;
          out.push({ mission_id: m.mission_id });
        }
      }
      return { rows: out, rowCount: out.length };
    }
    if (S.includes("SET status = 'created'")) {
      const out = [];
      for (const m of this.missions.values()) {
        if (['running', 'assigned'].includes(m.status) && m.lease_until && Date.parse(m.lease_until) < fakeNow) {
          m.status = 'created'; m.assigned_to = null; m.lease_until = null;
          m.claimed_at = null; m.retry_at = iso();
          out.push({ mission_id: m.mission_id });
        }
      }
      return { rows: out, rowCount: out.length };
    }
    if (S.includes('SET lease_until = NOW()')) {
      const m = byId(params[1]);
      if (!m || !['running', 'assigned'].includes(m.status) || !m.lease_until) return { rows: [], rowCount: 0 };
      m.lease_until = new Date(fakeNow + params[0] * 1000).toISOString();
      return { rows: [], rowCount: 1 };
    }
    if (S.includes('COALESCE(started_at')) {
      const cutoff = Date.parse(params[0]);
      const rows = [...this.missions.values()].filter(m =>
        ['running', 'assigned'].includes(m.status) &&
        Date.parse(m.started_at || m.claimed_at || m.created_at) < cutoff);
      return { rows, rowCount: rows.length };
    }
    if (S.includes('WHERE status =') && S.includes('LIMIT')) {
      const limit = params[0] || 10;
      const rows = [...this.missions.values()]
        .filter(m => m.status === 'created')
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
        .slice(0, limit);
      return { rows, rowCount: rows.length };
    }
    if (S.includes('SELECT * FROM ping_missions WHERE mission_id')) {
      const m = byId(params[0]);
      return m ? { rows: [m], rowCount: 1 } : { rows: [], rowCount: 0 };
    }
    if (S.includes('WHERE hold_at IS NOT NULL')) {
      const rows = [...this.missions.values()].filter(m => m.hold_at);
      return { rows, rowCount: rows.length };
    }
    if (S.includes("SET hold_at = NOW()")) {
      const m = byId(params[0]);
      if (!m || !['running', 'assigned', 'created'].includes(m.status) || m.hold_at) return { rows: [], rowCount: 0 };
      m.hold_at = iso(); m.hold_reason = params[1] || null;
      return { rows: [], rowCount: 1 };
    }
    if (S.includes("SET hold_at = NULL")) {
      const m = byId(params[0]);
      if (!m || !m.hold_at) return { rows: [], rowCount: 0 };
      m.hold_at = null; m.hold_reason = null;
      if (params[2]?.includes('PROVEN_OCCURRED')) {
        m.status = 'completed'; m.result = params[1]; m.completed_at = iso();
      } else if (params[2]?.includes('PROVEN_NOT_OCCURRED')) {
        m.status = 'created'; m.assigned_to = null; m.lease_until = null; 
        m.claimed_at = null; m.retry_at = null; m.started_at = null;
      } else {
        m.status = 'completed'; m.result = params[1]; m.completed_at = iso();
      }
      return { rows: [], rowCount: 1 };
    }
    throw new Error('FakePool: unhandled SQL: ' + S.slice(0, 140));
  }
}

class FakeEventRuntime {
  constructor() { this._handlers = new Map(); this._events = []; }
  on(eventType, handler) { if (!this._handlers.has(eventType)) this._handlers.set(eventType, []); this._handlers.get(eventType).push(handler); }
  async emit(eventType, source, payload, options = {}) {
    const event = { event_id: 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8), event_type: eventType, source, payload, namespace: options.namespace, tenant_id: options.tenant_id, correlation_id: options.correlation_id, causation_id: options.causation_id, metadata: options.metadata, timestamp: iso() };
    this._events.push(event);
    const handlers = this._handlers.get(eventType) || [];
    for (const h of handlers) { try { await h(event); } catch (e) { console.error('Handler error for ' + eventType + ':', e.message); } }
    return { status: 'ok', eventId: event.event_id };
  }
  getEvents() { return this._events; }
  getEventsByType(type) { return this._events.filter(e => e.event_type === type); }
}

function makeHarness() {
  fakeNow = realDateNow();
  const pool = new FakePool();
  const eventRuntime = new FakeEventRuntime();
  const missionRuntime = new MissionRuntime({ pool, eventRuntime });
  const workerRuntime = new WorkerRuntime({ pool });
  registerCanonicalWorkers(workerRuntime, { eventRuntime, pool, eventValidator: { isRegistered: () => true } });
  const bridge = new EventToMissionBridge({ eventRuntime, missionRuntime });
  bridge.start();
  const deadLetterAuthority = { async recordDeadLetter(job, error) { console.log('[DLQ]', job.job_id, error.message); } };
  const scheduler = new MissionScheduler({
    missionRuntime, workerRuntime, eventRuntime, deadLetterAuthority,
    retryPolicy: { max_attempts: 3, backoff_delay_ms: 5000 },
    pollIntervalMs: 3600000, dispatchTimeoutMs: 5000, stuckThresholdMs: 600000,
  });
  return { pool, eventRuntime, missionRuntime, workerRuntime, bridge, scheduler, advance: (ms) => { fakeNow += ms; } };
}

test('ORCA TRACE: LEAD_CREATED -> full pipeline execution', async () => {
  const h = makeHarness();
  console.log('\n=== ORCA MISSION TRACE START ===');
  console.log('INTENT: Process new lead');
  console.log('\n1. POLICY: Emitting LEAD_CREATED event');
  const leadEvent = { event_id: 'evt_lead_001', event_type: 'LEAD_CREATED', source: 'email-connector', namespace: 'tenant::happy-place', tenant_id: 'happy-place', correlation_id: 'corr_lead_001', payload: { leadId: 'lead_001', name: 'John Smith', email: 'john@example.com', company: 'Acme Corp' }, metadata: { canonical_hash: 'hash_123', confidence: 0.9 } };
  await h.eventRuntime.emit('LEAD_CREATED', 'email-connector', leadEvent.payload, { namespace: leadEvent.namespace, tenant_id: leadEvent.tenant_id, correlation_id: leadEvent.correlation_id, metadata: leadEvent.metadata });
  console.log('   Event emitted to UnifiedEventRuntime');
  await new Promise(r => setTimeout(r, 10));
  const pending = await h.missionRuntime.getPending(10, 'happy-place');
  console.log('   Missions pending: ' + pending.length);
  assert.ok(pending.length > 0, 'Mission should be created');
  const mission = pending[0];
  console.log('   Mission created: ' + mission.mission_id + ' (' + mission.mission_type + ')');
  assert.equal(mission.mission_type, 'LEAD_FOLLOWUP');
  assert.equal(mission.tenant_id, 'happy-place');
  assert.equal(mission.status, 'created');
  console.log('\n3. MISSION: Scheduler dispatching to WorkerRuntime');
  await h.scheduler._poll();
  console.log('   Scheduler poll complete');
  const stats = h.scheduler.getStats();
  console.log('   Scheduler stats: ' + JSON.stringify(stats, null, 2));
  const missionAfter = await h.missionRuntime.getMission(mission.mission_id);
  console.log('   Mission status: ' + missionAfter.status);
  console.log('   Mission assigned_to: ' + missionAfter.assigned_to);
  console.log('\n4. EXECUTOR SELECTION: WorkerRuntime dispatch');
  const workerStats = h.workerRuntime.getStats();
  console.log('   Worker stats: ' + JSON.stringify(workerStats.workers, null, 2));
  console.log('\n5. EXECUTION: Checking downstream events');
  const events = h.eventRuntime.getEvents();
  console.log('   Total events: ' + events.length);
  for (const e of events) { console.log('   Event: ' + e.event_type + ' (tenant: ' + e.tenant_id + ', corr: ' + e.correlation_id + ')'); }
  const obsEvents = h.eventRuntime.getEventsByType('OBSERVATION_CREATED');
  console.log('\n6. INDEPENDENT VERIFICATION: OBSERVATION_CREATED events: ' + obsEvents.length);
  console.log('\n7. OUTCOME: Final mission state');
  const finalMission = await h.missionRuntime.getMission(mission.mission_id);
  console.log('   Final status: ' + finalMission.status);
  console.log('   Result: ' + JSON.stringify(finalMission.result));
  console.log('\n=== ORCA MISSION TRACE COMPLETE ===\n');
});