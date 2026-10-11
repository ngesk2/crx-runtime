'use strict';

// P2 write-authority closure — HTTP tenant-gate proofs (2026-10-11).
//
// Proves the minimum compatibility patch for the P0-identified bare
// mutating routes (/reviews, /projects, /knowledge): exterior Bearer <redacted>
// authentication PLUS the tenant-scope gate, bound to the agent's
// operator-provisioned allow-list. No Postgres needed: the middleware runs
// in degraded in-memory mode and the authorities are call-recording stubs.
//
// For every denial the test asserts: correct 401/403/400/503 AND zero
// recorded authority calls (no business-row change, no event, no receipt).

const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const ExteriorAuthMiddleware = require('../gateway/exterior_auth_middleware');
const { createReviewRoutes } = require('../gateway/routes/reviews');
const createProjectRoutes = require('../gateway/routes/projects');
const createKnowledgeRoutes = require('../gateway/routes/knowledge');
const createMissionCardRoutes = require('../gateway/routes/mission_cards');

process.env.MUSE_LEVEL_1_KEY = 'p2-key-muse';
process.env.MUSE_LEVEL_2_KEY = 'p2-key-muse-l2';

const deadPool = { query: async () => { throw new Error('pg unavailable in gate test'); } };

function stubAuthority(methods) {
  const calls = [];
  const stub = {};
  for (const m of methods) stub[m] = async (...args) => { calls.push([m, ...args]); return { ok: true }; };
  stub.calls = calls;
  return stub;
}

async function buildGateApp({ allowlist, authInstance = 'present', knowledgeNs = 'ns-a' } = {}) {
  process.env.EXTERIOR_TENANT_ALLOWLIST = JSON.stringify(allowlist);
  const auth = authInstance === 'present' ? new ExteriorAuthMiddleware(deadPool) : null;
  if (auth) await auth.initialize();

  const reviews = stubAuthority(['executeSyncReviews', 'executeReplyToReview']);
  const projects = stubAuthority(['executeCreateProject', 'executeUpdateProject', 'executeAddArtifact']);
  const knowledge = stubAuthority(['addNode', 'addEdge']);
  knowledge._pool = {
    query: async (sql, params) => {
      knowledge._lastQuery = [sql, params];
      if (/FROM knowledge_nodes/.test(sql)) {
        return knowledgeNs === null ? { rows: [] } : { rows: [{ namespace: knowledgeNs }] };
      }
      return { rows: [] };
    },
  };

  const app = express();
  app.use(express.json());
  app.use('/reviews', createReviewRoutes(reviews, auth));
  app.use('/projects', createProjectRoutes(projects, auth));
  app.use('/knowledge', createKnowledgeRoutes(knowledge, { auth }));
  return { app, reviews, projects, knowledge };
}

async function buildCardApp({ allowlist, missionTenant }) {
  process.env.EXTERIOR_TENANT_ALLOWLIST = JSON.stringify(allowlist);
  const auth = new ExteriorAuthMiddleware(deadPool);
  await auth.initialize();
  const calls = [];
  const missionRuntime = {
    approve: async (id, approver) => { calls.push(['approve', id, approver]); return { mission_id: id, status: 'approved', approved_by: approver, approved_at: new Date().toISOString() }; },
    reject: async (id, rejecter, reason) => { calls.push(['reject', id, rejecter, reason]); return { mission_id: id, status: 'rejected', rejected_by: rejecter, rejected_at: new Date().toISOString(), reason }; },
    calls,
  };
  const pool = {
    query: async (sql) => {
      if (/FROM ping_missions/.test(sql)) {
        return missionTenant === null ? { rows: [] } : { rows: [{ tenant_id: missionTenant }] };
      }
      return { rows: [] };
    },
  };
  const app = express();
  app.use(express.json());
  app.use('/api/v1/missions', auth.middleware(), createMissionCardRoutes({ missionRuntime, pool }));
  return { app, missionRuntime };
}

async function req(app) {
  const server = await new Promise(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    async post(route, body, key) {
      const r = await fetch(base + route, { method: 'POST',
        headers: { 'content-type': 'application/json', ...(key ? { authorization: `Bearer ${key}` } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body) });
      const text = await r.text();
      let json = null;
      try { json = JSON.parse(text); } catch (_) {}
      return { status: r.status, json, text };
    },
    async close() { await new Promise(r => server.close(r)); },
  };
}

const ALLOW = { muse: ['tenant-a'], 'muse-level-2': ['*'] };

test('reviews/sync: no credential -> 401, zero authority calls', async () => {
  const { app, reviews } = await buildGateApp({ allowlist: ALLOW });
  const c = await req(app);
  const r = await c.post('/reviews/sync', { tenant_id: 'tenant-a', location_id: 'loc' });
  assert.equal(r.status, 401);
  assert.equal(r.json.code, 'MISSING_AUTH');
  assert.deepEqual(reviews.calls, []);
  await c.close();
});

test('reviews/sync: bad credential -> 401, zero authority calls', async () => {
  const { app, reviews } = await buildGateApp({ allowlist: ALLOW });
  const c = await req(app);
  const r = await c.post('/reviews/sync', { tenant_id: 'tenant-a', location_id: 'loc' }, 'wrong-key');
  assert.equal(r.status, 401);
  assert.deepEqual(reviews.calls, []);
  await c.close();
});

test('reviews/sync: valid key, out-of-scope tenant -> 403 tenant_not_authorized, zero calls', async () => {
  const { app, reviews } = await buildGateApp({ allowlist: ALLOW });
  const c = await req(app);
  const r = await c.post('/reviews/sync', { tenant_id: 'tenant-b', location_id: 'loc' }, 'p2-key-muse');
  assert.equal(r.status, 403);
  assert.equal(r.json.error, 'tenant_not_authorized');
  assert.deepEqual(reviews.calls, []);
  await c.close();
});

test('reviews/sync: valid key, in-scope tenant -> 200 and exactly one authority call', async () => {
  const { app, reviews } = await buildGateApp({ allowlist: ALLOW });
  const c = await req(app);
  const r = await c.post('/reviews/sync', { tenant_id: 'tenant-a', location_id: 'loc' }, 'p2-key-muse');
  assert.equal(r.status, 200);
  assert.equal(reviews.calls.length, 1);
  assert.deepEqual(reviews.calls[0][1], { tenantId: 'tenant-a', locationId: 'loc' });
  await c.close();
});

test('reviews/sync: valid key, unbound agent (empty allow-list) -> 403 tenant_scope_unconfigured', async () => {
  const { app, reviews } = await buildGateApp({ allowlist: {} });
  const c = await req(app);
  const r = await c.post('/reviews/sync', { tenant_id: 'tenant-a', location_id: 'loc' }, 'p2-key-muse');
  assert.equal(r.status, 403);
  assert.equal(r.json.error, 'tenant_scope_unconfigured');
  assert.deepEqual(reviews.calls, []);
  await c.close();
});

test('reviews/sync: valid key, no declared tenant -> 400 tenant_scope_required', async () => {
  const { app, reviews } = await buildGateApp({ allowlist: ALLOW });
  const c = await req(app);
  const r = await c.post('/reviews/sync', { location_id: 'loc' }, 'p2-key-muse');
  assert.equal(r.status, 400);
  assert.equal(r.json.error, 'tenant_scope_required');
  assert.deepEqual(reviews.calls, []);
  await c.close();
});

test('reviews/:id/reply: wildcard agent may act; scoped agent is confined', async () => {
  const { app, reviews } = await buildGateApp({ allowlist: ALLOW });
  const c = await req(app);
  const ok = await c.post('/reviews/r1/reply',
    { tenant_id: 'any-tenant', location_id: 'loc', reply_text: 'thanks' }, 'p2-key-muse-l2');
  assert.equal(ok.status, 200);
  const denied = await c.post('/reviews/r1/reply',
    { tenant_id: 'tenant-b', location_id: 'loc', reply_text: 'thanks' }, 'p2-key-muse');
  assert.equal(denied.status, 403);
  assert.equal(reviews.calls.length, 1);
  await c.close();
});

test('projects: mutations require declared tenant; recorded tenant is the gate-verified one', async () => {
  const { app, projects } = await buildGateApp({ allowlist: ALLOW });
  const c = await req(app);
  const noTenant = await c.post('/projects', { projectType: 't', title: 'x' }, 'p2-key-muse');
  assert.equal(noTenant.status, 400);
  const crossTenant = await c.post('/projects', { tenant_id: 'tenant-b', projectType: 't', title: 'x' }, 'p2-key-muse');
  assert.equal(crossTenant.status, 403);
  // snake_case body tenant is normalized to the gate-verified tenant on the command
  const ok = await c.post('/projects', { tenant_id: 'tenant-a', projectType: 't', title: 'x' }, 'p2-key-muse');
  assert.equal(ok.status, 201);
  assert.equal(projects.calls.length, 1);
  assert.equal(projects.calls[0][0], 'executeCreateProject');
  assert.equal(projects.calls[0][1].tenantId, 'tenant-a');
  const upd = await c.post('/projects', { tenantId: 'tenant-a', projectType: 't', title: 'y' }, 'p2-key-muse');
  assert.equal(upd.status, 201);
  await c.close();
});

test('projects/artifacts: out-of-scope tenant -> 403, zero calls', async () => {
  const { app, projects } = await buildGateApp({ allowlist: ALLOW });
  const c = await req(app);
  const r = await c.post('/projects/p1/artifacts',
    { tenant_id: 'tenant-b', artifactType: 'photo', title: 't' }, 'p2-key-muse');
  assert.equal(r.status, 403);
  assert.deepEqual(projects.calls, []);
  await c.close();
});

test('projects: auth unavailable -> 503 exterior_auth_unconfigured (fail closed, never bare)', async () => {
  const { app, projects } = await buildGateApp({ allowlist: ALLOW, authInstance: null });
  const c = await req(app);
  const r = await c.post('/projects', { tenant_id: 'tenant-a', projectType: 't', title: 'x' }, 'p2-key-muse');
  assert.equal(r.status, 503);
  assert.equal(r.json.error, 'exterior_auth_unconfigured');
  assert.deepEqual(projects.calls, []);
  await c.close();
});

test('knowledge/nodes: namespace is the scope; unlisted namespace -> 403', async () => {
  const { app, knowledge } = await buildGateApp({ allowlist: { muse: ['ns-a'] } });
  const c = await req(app);
  const ok = await c.post('/knowledge/nodes', { nodeType: 't', label: 'l', namespace: 'ns-a' }, 'p2-key-muse');
  assert.equal(ok.status, 200);
  const denied = await c.post('/knowledge/nodes', { nodeType: 't', label: 'l', namespace: 'ns-evil' }, 'p2-key-muse');
  assert.equal(denied.status, 403);
  assert.equal(denied.json.error, 'tenant_not_authorized');
  const missing = await c.post('/knowledge/nodes', { nodeType: 't', label: 'l' }, 'p2-key-muse');
  assert.equal(missing.status, 400);
  assert.equal(knowledge.calls.length, 1);
  await c.close();
});

test('knowledge/edges: scope resolved server-side from the source node', async () => {
  const { app, knowledge } = await buildGateApp({ allowlist: { muse: ['ns-a'] }, knowledgeNs: 'ns-a' });
  const c = await req(app);
  const ok = await c.post('/knowledge/edges', { sourceId: 'n1', targetId: 'n2', edgeType: 'rel' }, 'p2-key-muse');
  assert.equal(ok.status, 200);
  assert.equal(knowledge.calls.length, 1);
  // the edge body cannot smuggle a scope: the gate used the stored namespace
  assert.deepEqual(knowledge._lastQuery[1], ['n1']);
  await c.close();
});

test('knowledge/edges: source node in unlisted namespace -> 403, zero calls', async () => {
  const { app, knowledge } = await buildGateApp({ allowlist: { muse: ['ns-a'] }, knowledgeNs: 'ns-evil' });
  const c = await req(app);
  const r = await c.post('/knowledge/edges', { sourceId: 'n1', targetId: 'n2', edgeType: 'rel' }, 'p2-key-muse');
  assert.equal(r.status, 403);
  assert.equal(r.json.error, 'tenant_not_authorized');
  assert.deepEqual(knowledge.calls, []);
  await c.close();
});

test('knowledge/edges: unknown source node -> 404, zero calls', async () => {
  const { app, knowledge } = await buildGateApp({ allowlist: ALLOW, knowledgeNs: null });
  const c = await req(app);
  const r = await c.post('/knowledge/edges', { sourceId: 'nope', targetId: 'n2', edgeType: 'rel' }, 'p2-key-muse-l2');
  assert.equal(r.status, 404);
  assert.deepEqual(knowledge.calls, []);
  await c.close();
});

test('mission cards approve: out-of-scope mission tenant -> 403, runtime never called', async () => {
  const { app, missionRuntime } = await buildCardApp({ allowlist: ALLOW, missionTenant: 'tenant-b' });
  const c = await req(app);
  const r = await c.post('/api/v1/missions/cards/m1/approve', {}, 'p2-key-muse');
  assert.equal(r.status, 403);
  assert.equal(r.json.error, 'tenant_not_authorized');
  assert.deepEqual(missionRuntime.calls, []);
  await c.close();
});

test('mission cards approve: in-scope tenant -> 200 and runtime called once', async () => {
  const { app, missionRuntime } = await buildCardApp({ allowlist: ALLOW, missionTenant: 'tenant-a' });
  const c = await req(app);
  const r = await c.post('/api/v1/missions/cards/m1/approve', {}, 'p2-key-muse');
  assert.equal(r.status, 200);
  assert.equal(missionRuntime.calls.length, 1);
  assert.deepEqual(missionRuntime.calls[0], ['approve', 'm1', 'muse']);
  await c.close();
});

test('mission cards: missing mission -> 404 before any decision', async () => {
  const { app, missionRuntime } = await buildCardApp({ allowlist: ALLOW, missionTenant: null });
  const c = await req(app);
  const r = await c.post('/api/v1/missions/cards/m1/reject', { reason: 'no' }, 'p2-key-muse-l2');
  assert.equal(r.status, 404);
  assert.deepEqual(missionRuntime.calls, []);
  await c.close();
});
