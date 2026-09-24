'use strict';
/**
 * Regression tests — F-01 bounded retry repair + stuck-running watchdog.
 *
 * F-01 (reproduced against pristine HEAD in /tmp/f01-repro.js): a mission
 * whose worker threw entered retry_pending, and every subsequent poll
 * re-dispatched it to the worker with ZERO state progress — retries frozen
 * at 1, exhaustion unreachable, infinite identical re-execution. Root cause
 * chain:
 *   1. getPending() returned due retry_pending rows directly;
 *   2. _dispatch() ignored assign()'s rowCount, so the P0-1 conditional claim
 *      never gated dispatch (assign/start silently no-opped on the row);
 *   3. failWithRetry()'s retry-branch UPDATE matched only
 *      status IN ('running','assigned'), so a failure recorded against an
 *      already-retry_pending row updated zero rows — the counter never moved.
 *
 * These tests prove the repaired behavior: retries make state progress
 * (attempt counting, backoff gates, terminal exhaustion), dispatch is
 * claim-gated, dispatch timeouts and stuck-running missions emit HOLD
 * reconciliation records (never FAILED), and the fail path stays free of
 * deriveFailureRecord (held for a human word).
 *
 * Run: node --test mission_scheduler.retry_watchdog.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');

const { MissionRuntime } = require('./mission_runtime.js');
const { MissionScheduler } = require('./mission_scheduler.js');

// ── Controllable clock ──────────────────────────────────────────────
// Both the fake pool's NOW() and the runtime's Date.now() (retry_at,
// started_at, ...) follow this clock. It is reset for every harness so
// time advances in one test never leak into the next.
let fakeNow = Date.now();
const realDateNow = Date.now;
Date.now = () => fakeNow;
const iso = () => new Date(fakeNow).toISOString();

class FakePool {
  constructor() { this.missions = new Map(); }
  _inList(sql) {
    const m = sql.match(/status IN \(([^)]+)\)/);
    return m ? m[1].split(',').map(s => s.trim().replace(/'/g, '')) : null;
  }
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
    // reclaimRetryPending(): retry_pending + due retry_at -> created (retries kept)
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
    // reapExpiredLeases(): running/assigned + expired lease -> created
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
    // findStuckRunning()
    if (S.includes('COALESCE(started_at')) {
      const cutoff = Date.parse(params[0]);
      const rows = [...this.missions.values()].filter(m =>
        ['running', 'assigned'].includes(m.status) &&
        Date.parse(m.started_at || m.claimed_at || m.created_at) < cutoff);
      return { rows, rowCount: rows.length };
    }
    // getPending(): created ONLY (repaired semantics)
    if (S.includes('WHERE status =') && S.includes('LIMIT')) {
      const limit = params[0] || 10;
      const rows = [...this.missions.values()]
        .filter(m => m.status === 'created')
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
        .slice(0, limit);
      return { rows, rowCount: rows.length };
    }
    throw new Error(`FakePool: unhandled SQL: ${S.slice(0, 140)}`);
  }
}

function makeHarness(opts = {}) {
  fakeNow = realDateNow(); // fresh clock per harness — no cross-test leakage
  const pool = new FakePool();
  const emitted = [];
  const eventRuntime = {
    emitted,
    async emit(type, source, payload = {}) { emitted.push({ type, source, payload }); return { status: 'ok' }; },
  };
  const harness = { pool, events: eventRuntime, workerInvocations: 0, dlqRecords: [] };
  const behaviors = {
    throwing: async () => { harness.workerInvocations++; throw new Error('worker boom'); },
    hanging: () => { harness.workerInvocations++; return new Promise(() => {}); },
    ok: async () => { harness.workerInvocations++; return { status: 'ok' }; },
  };
  const workerRuntime = {
    getStats: () => ({ workers: { observation: {} } }),
    dispatch: behaviors[opts.worker || 'throwing'],
  };
  const deadLetterAuthority = {
    async recordDeadLetter(job, error) {
      harness.dlqRecords.push({ job, error: String((error && error.message) || error) });
    },
  };
  const mr = new MissionRuntime({ pool, eventRuntime });
  const sched = new MissionScheduler({
    missionRuntime: mr,
    workerRuntime,
    eventRuntime,
    deadLetterAuthority,
    retryPolicy: opts.retryPolicy || { max_attempts: 3, backoff_delay_ms: 5000 },
    pollIntervalMs: 3600000, // manual _poll() only
    dispatchTimeoutMs: opts.dispatchTimeoutMs,
    stuckThresholdMs: opts.stuckThresholdMs,
  });
  harness.mr = mr;
  harness.sched = sched;
  harness.advance = (ms) => { fakeNow += ms; };
  harness.now = () => fakeNow;
  return harness;
}

function holds(h) {
  return h.events.emitted.filter(e => e.type === 'MISSION_RECONCILE_HOLD');
}

// ── F-01: bounded retry ─────────────────────────────────────────────

test('F-01: retries make state progress — counted attempts, backoff gates, terminal exhaustion', async () => {
  const h = makeHarness({ worker: 'throwing', retryPolicy: { max_attempts: 3, backoff_delay_ms: 5000 } });
  const id = await h.mr.create('LEAD_FOLLOWUP', {
    event_id: 'evt-t1', event_type: 'LEAD_CREATED', correlation_id: 'corr-t1',
  });

  // Attempt 1: created -> assigned -> running -> throw -> retry_pending
  await h.sched._poll();
  let m = h.pool.missions.get(id);
  assert.equal(m.status, 'retry_pending');
  assert.equal(m.retries, 1);
  assert.equal(h.workerInvocations, 1);

  // Backoff gate holds: a poll before retry_at does NOT re-dispatch
  await h.sched._poll();
  assert.equal(h.workerInvocations, 1, 'no re-dispatch before the backoff gate elapses');
  assert.equal(h.pool.missions.get(id).status, 'retry_pending');

  // Attempt 2 (past backoff): reclaim -> created -> claim -> dispatch -> throw
  h.advance(6000);
  await h.sched._poll();
  m = h.pool.missions.get(id);
  assert.equal(m.status, 'retry_pending');
  assert.equal(m.retries, 2, 'attempt counter advanced — state progress');
  assert.equal(h.workerInvocations, 2);

  // Attempt 3 (past backoff): exhaustion -> failed + DLQ
  h.advance(6000);
  await h.sched._poll();
  m = h.pool.missions.get(id);
  assert.equal(m.status, 'failed', 'terminal state reached');
  assert.equal(m.retries, 3);
  assert.equal(h.workerInvocations, 3, 'worker invoked exactly once per attempt — no infinite re-execution');
  assert.equal(h.dlqRecords.length, 1);
  assert.equal(h.dlqRecords[0].job.job_id, id);

  // Terminal: further polls never touch it again
  h.advance(60000);
  await h.sched._poll();
  assert.equal(h.workerInvocations, 3);
  assert.equal(h.pool.missions.get(id).status, 'failed');

  // Re-entry was observable: one MISSION_RETRY_RECLAIMED per reclaimed attempt
  const reclaims = h.events.emitted.filter(e => e.type === 'MISSION_RETRY_RECLAIMED');
  assert.equal(reclaims.length, 2);
});

test('F-01: _dispatch never invokes the worker for a non-claimable row', async () => {
  const h = makeHarness({ worker: 'throwing' });
  const id = await h.mr.create('LEAD_FOLLOWUP', { event_id: 'evt-t2', event_type: 'LEAD_CREATED' });
  // A concurrent scheduler wins the claim first; this scheduler holds a stale snapshot.
  assert.equal(await h.mr.assign(id, 'other-scheduler'), 1);
  const staleRow = {
    mission_id: id, mission_type: 'LEAD_FOLLOWUP', status: 'created',
    payload: JSON.stringify({ event_id: 'evt-t2', event_type: 'LEAD_CREATED' }),
    priority: 0, created_at: iso(),
  };
  await h.sched._dispatch(staleRow);
  assert.equal(h.workerInvocations, 0, 'worker must not run when the claim guard rejects the row');
  assert.equal(h.sched.getStats().skipped, 1);
  const m = h.pool.missions.get(id);
  assert.equal(m.status, 'assigned');
  assert.equal(m.assigned_to, 'other-scheduler');
});

test('F-01: failWithRetry on an already-retry_pending row advances the counter (no silent no-op)', async () => {
  const h = makeHarness({ worker: 'throwing' });
  const id = await h.mr.create('LEAD_FOLLOWUP', { event_id: 'evt-t7', event_type: 'LEAD_CREATED' });
  await h.mr.assign(id, 'observation');
  await h.mr.start(id);
  await h.mr.failWithRetry(id, 'boom', { max_attempts: 5, backoff_delay_ms: 5000 });
  // A second failure recorded directly against the retry_pending row (the old F-01 shape)
  const next = await h.mr.failWithRetry(id, 'boom again', { max_attempts: 5, backoff_delay_ms: 5000 });
  assert.equal(next, 2);
  const m = h.pool.missions.get(id);
  assert.equal(m.retries, 2, 'every failure makes state progress');
  assert.equal(m.status, 'retry_pending');
});

test('reclaimRetryPending: backoff-gated re-entry, attempt counting preserved', async () => {
  const h = makeHarness({ worker: 'throwing', retryPolicy: { max_attempts: 5, backoff_delay_ms: 5000 } });
  const id = await h.mr.create('LEAD_FOLLOWUP', { event_id: 'evt-t6', event_type: 'LEAD_CREATED' });
  await h.mr.assign(id, 'observation');
  await h.mr.start(id);
  await h.mr.failWithRetry(id, 'boom', { max_attempts: 5, backoff_delay_ms: 5000 });
  let m = h.pool.missions.get(id);
  assert.equal(m.status, 'retry_pending');
  assert.equal(m.retries, 1);

  assert.equal(await h.mr.reclaimRetryPending(), 0, 'nothing reclaimed before the backoff gate');
  assert.equal(h.pool.missions.get(id).status, 'retry_pending');

  h.advance(6000);
  assert.equal(await h.mr.reclaimRetryPending(), 1);
  m = h.pool.missions.get(id);
  assert.equal(m.status, 'created');
  assert.equal(m.retries, 1, 'attempt counting persists across reclaims');
  assert.equal(m.retry_at, null);
  assert.equal(h.events.emitted.filter(e => e.type === 'MISSION_RETRY_RECLAIMED').length, 1);
});

// ── Watchdog ────────────────────────────────────────────────────────

test('watchdog: dispatch timeout emits HOLD reconciliation — never FAILED', async () => {
  const h = makeHarness({ worker: 'hanging', dispatchTimeoutMs: 50 });
  const id = await h.mr.create('LEAD_FOLLOWUP', {
    event_id: 'evt-t3', event_type: 'LEAD_CREATED', correlation_id: 'corr-t3',
  });

  // The dispatch timeout uses an unref'd timer (it must never hold the
  // process open in production). Keep a ref'd handle alive for the test so
  // the event loop survives until the timer fires.
  const keepAlive = setInterval(() => {}, 1000);
  try {
    await h.sched._poll(); // dispatch hangs -> 50ms timeout -> HOLD
  } finally {
    clearInterval(keepAlive);
  }

  const m = h.pool.missions.get(id);
  assert.equal(m.status, 'running', 'watchdog never mutates the mission row');
  assert.equal(m.retries, 0, 'no retry scheduled for an unknown outcome');

  const hs = holds(h);
  assert.equal(hs.length, 1, 'exactly one reconciliation record emitted');
  const record = hs[0].payload.record;
  assert.equal(hs[0].payload.missionId, id);
  assert.equal(record.status, 'HOLD_RECONCILE');
  assert.equal(record.outcome, 'unknown_hold');
  assert.equal(record.classification, 'UNKNOWN_EXECUTION');
  assert.equal(record.display, 'OUTCOME UNKNOWN — RECONCILIATION IN PROGRESS');
  assert.match(record.failure_id, /^fl-[0-9a-f]{12}$/);
  assert.equal(record.evidence.mission_id, id);
  assert.ok(record.replay.correlation_id, 'replay carries correlation identity');

  assert.ok(!h.events.emitted.some(e => e.type === 'MISSION_FAILED'), 'no MISSION_FAILED on timeout');
  assert.ok(!h.events.emitted.some(e => e.type === 'MISSION_RETRY_RECLAIMED'), 'no retry re-entry on timeout');

  const log = h.sched.getReconciliationLog();
  assert.equal(log.length, 1);
  assert.equal(log[0].mission_id, id);
  assert.equal(log[0].record.display, 'OUTCOME UNKNOWN — RECONCILIATION IN PROGRESS');
  assert.equal(h.sched.getStats().reconciled, 1);
});

test('watchdog: stuck-running scan reconciles old missions once; skips fresh and in-processing ones', async () => {
  const h = makeHarness({ worker: 'ok', stuckThresholdMs: 600000 });

  const oldId = await h.mr.create('LEAD_FOLLOWUP', {
    event_id: 'evt-t4a', event_type: 'LEAD_CREATED', correlation_id: 'corr-t4a',
  });
  await h.mr.assign(oldId, 'observation');
  await h.mr.start(oldId);
  h.pool.missions.get(oldId).started_at = new Date(h.now() - 20 * 60000).toISOString();

  const freshId = await h.mr.create('LEAD_FOLLOWUP', { event_id: 'evt-t4b', event_type: 'LEAD_CREATED' });
  await h.mr.assign(freshId, 'observation');
  await h.mr.start(freshId);

  const n = await h.sched.reconcileStuckRunning();
  assert.equal(n, 1, 'only the old mission is reconciled');
  const hs = holds(h);
  assert.equal(hs.length, 1);
  assert.equal(hs[0].payload.missionId, oldId);
  assert.equal(hs[0].payload.record.display, 'OUTCOME UNKNOWN — RECONCILIATION IN PROGRESS');
  assert.equal(h.pool.missions.get(oldId).status, 'running', 'scan never mutates the row');
  assert.equal(h.sched.getStats().watchdogScans, 1);

  // Dedupe: a second scan emits nothing new for the same mission
  assert.equal(await h.sched.reconcileStuckRunning(), 0);
  assert.equal(holds(h).length, 1);

  // Missions the scheduler is actively processing are skipped even when old
  const procId = await h.mr.create('LEAD_FOLLOWUP', { event_id: 'evt-t4c', event_type: 'LEAD_CREATED' });
  await h.mr.assign(procId, 'observation');
  await h.mr.start(procId);
  h.pool.missions.get(procId).started_at = new Date(h.now() - 30 * 60000).toISOString();
  h.sched._processing.add(procId);
  try {
    assert.equal(await h.sched.reconcileStuckRunning(), 0, 'in-processing missions are owned by lease renewal, not the watchdog');
  } finally {
    h.sched._processing.delete(procId);
  }
  assert.equal(holds(h).length, 1);
});

// ── Boundary: deriveFailureRecord stays out of the fail path ────────

test('boundary: the fail path never emits reconciliation records (held for a human word)', async () => {
  const h = makeHarness({ worker: 'throwing' });
  await h.mr.create('LEAD_FOLLOWUP', { event_id: 'evt-t5', event_type: 'LEAD_CREATED' });
  await h.sched._poll();
  assert.ok(h.events.emitted.some(e => e.type === 'MISSION_FAILED'), 'normal failures still emit MISSION_FAILED');
  assert.equal(holds(h).length, 0, 'no HOLD from the fail path');
  assert.equal(h.sched.getReconciliationLog().length, 0);
});
