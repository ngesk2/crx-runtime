/**
 * LANE B (TenantOS) — tenant/identity ownership threading for the Mission
 * Control vertical slice.
 *
 * What this proves:
 *  1. MissionScheduler._dispatch threads the mission row's IMMUTABLE tenant_id
 *     (W3) into the worker dispatch event (top-level + metadata), so the
 *     Orca/headless-agent adapter and W4's tenant pin read the authoritative
 *     tenant — never the caller-claimed payload.namespace.
 *  2. POST /missions binds ownership at the dispatch entry: the namespace is
 *     DERIVED from the validated body tenant_id; a contradicting
 *     caller-supplied namespace fails closed (400 tenant_namespace_mismatch);
 *     created_by is stamped from the authenticated agent, not the body.
 *
 * Run: node --test ping-runtime/orchestration/test_lane_b_tenant_threading.js
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { MissionScheduler } = require('./mission_scheduler.js');

let express;
try {
  express = require('express');
} catch {
  express = require('../../gateway/node_modules/express');
}
const createMissionRoutes = require('../../gateway/routes/missions.js');

// ---------------------------------------------------------------------------
// 1. Scheduler dispatch event carries the authoritative tenant_id
// ---------------------------------------------------------------------------

describe('Lane B: scheduler threads mission tenant_id into dispatch event', () => {
  it('carries tenant_id top-level and in metadata, ignoring spoofed namespace', async () => {
    const captured = [];
    const completed = [];
    const stubMissionRuntime = {
      async assign() { return 1; },
      async start() { return 1; },
      async complete(id, result) { completed.push({ id, result }); return 1; },
      async failWithRetry() { return 99; },
    };
    const stubWorkerRuntime = {
      getStats() { return { workers: { observation: {} } }; },
      async dispatch(event) {
        captured.push(event);
        // Receipt shape per Lane A contract: matched worker ran ok.
        return { matched: true, routeExists: true, result: { status: 'ok' } };
      },
    };
    const scheduler = new MissionScheduler({
      missionRuntime: stubMissionRuntime,
      workerRuntime: stubWorkerRuntime,
      eventRuntime: null,
      deadLetterAuthority: null,
      pollIntervalMs: 60000,
    });

    const mission = {
      mission_id: 'm_lane_b_1',
      mission_type: 'OBSERVATION_CREATE', // -> 'observation' worker
      tenant_id: 'acme-1',                // immutable row value (W3)
      priority: 0,
      payload: {
        event_id: 'evt-1',
        event_type: 'DOCUMENT_IMPORT',
        source: 'mission-scheduler',
        // Caller-claimed namespace that contradicts the bound tenant.
        namespace: 'tenant::evil',
      },
    };

    await scheduler._dispatch(mission);

    assert.equal(captured.length, 1, 'exactly one dispatch event');
    const ev = captured[0];
    assert.equal(ev.tenant_id, 'acme-1', 'top-level tenant_id is the mission row value');
    assert.equal(ev.metadata.tenant_id, 'acme-1', 'metadata tenant_id is the mission row value');
    assert.notEqual(ev.tenant_id, 'evil', 'tenant never derived from spoofed namespace');
    assert.equal(completed.length, 1, 'mission completed on ok result');
  });

  it('passes null tenant through when the row has none (legacy)', async () => {
    const captured = [];
    const stubMissionRuntime = {
      async assign() { return 1; },
      async start() { return 1; },
      async complete() { return 1; },
      async failWithRetry() { return 99; },
    };
    const stubWorkerRuntime = {
      getStats() { return { workers: { observation: {} } }; },
      async dispatch(event) {
        captured.push(event);
        return { matched: true, routeExists: true, result: { status: 'ok' } };
      },
    };
    const scheduler = new MissionScheduler({
      missionRuntime: stubMissionRuntime,
      workerRuntime: stubWorkerRuntime,
      pollIntervalMs: 60000,
    });
    await scheduler._dispatch({
      mission_id: 'm_lane_b_legacy',
      mission_type: 'OBSERVATION_CREATE',
      tenant_id: null,
      priority: 0,
      payload: { event_id: 'evt-2', event_type: 'DOCUMENT_IMPORT' },
    });
    assert.equal(captured[0].tenant_id, null);
    assert.equal(captured[0].metadata.tenant_id, null);
  });
});

// ---------------------------------------------------------------------------
// 2. POST /missions ownership binding
// ---------------------------------------------------------------------------

describe('Lane B: POST /missions binds tenant ownership', () => {
  let server;
  let base;
  const created = [];

  before(async () => {
    const app = express();
    app.use(express.json());
    // Stand-in for exteriorAuthMiddleware: the real middleware guarantees this.
    app.use((req, res, next) => {
      req.authenticatedAgent = { agentId: 'muse-level-2', agentName: 'Muse Level 2' };
      next();
    });
    const stubMissionRuntime = {
      async create(missionType, payload, options) {
        created.push({ missionType, payload, options });
        return 'mid-lane-b';
      },
    };
    app.use('/missions', createMissionRoutes(stubMissionRuntime));
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve);
    });
    base = `http://127.0.0.1:${server.address().port}/missions`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('rejects a caller namespace contradicting the bound tenant (fail closed)', async () => {
    created.length = 0;
    const res = await fetch(base, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        missionType: 'LEAD_FOLLOWUP',
        payload: { namespace: 'tenant::evil' },
        tenant_id: 'acme-1',
      }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'tenant_namespace_mismatch');
    assert.equal(created.length, 0, 'no mission created on mismatch');
  });

  it('derives namespace from tenant and stamps the authenticated agent', async () => {
    created.length = 0;
    const res = await fetch(base, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        missionType: 'LEAD_FOLLOWUP',
        payload: { topic: 'headless-task' },
        createdBy: 'spoofed-agent',
        tenant_id: 'acme-1',
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.missionId, 'mid-lane-b');
    assert.equal(created.length, 1);
    assert.equal(created[0].payload.namespace, 'tenant::acme-1');
    assert.equal(created[0].options.tenant_id, 'acme-1');
    assert.equal(created[0].options.createdBy, 'muse-level-2',
      'created_by comes from the authenticated agent, not the body');
  });

  it('still requires tenant_id', async () => {
    const res = await fetch(base, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ missionType: 'LEAD_FOLLOWUP', payload: {} }),
    });
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, 'tenant_required');
  });
});
