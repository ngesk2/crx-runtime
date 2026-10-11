const assert = require('assert');

let passed = 0, failed = 0;
const _tests = [];

function test(name, fn) {
  _tests.push({ name, fn });
}

// Each route factory registers on its own express.Router() (stubbed to capture).
// createEventRoutes(authority, runtime, pool) returns that capturing router.

function makeEventReadAuthority(overrides = {}) {
  return {
    markProcessed: async () => true,
    markFailed: async () => true,
    getUnprocessedEvents: async () => [],
    getAllEvents: async () => [],
    getRecentEvents: async () => [],
    getEventsByStream: async () => [],
    getEventStats: async () => null,
    ...overrides,
  };
}

function makeRes() {
  let statusCode = 200;
  let body = null;
  const res = {
    status: (c) => { statusCode = c; return res; },
    json: (b) => { body = b; res.headersSent = true; return res; },
    headersSent: false,
    _status: () => statusCode,
    _body: () => body,
  };
  return res;
}

function main() {
  return (async () => {
  console.log('=== POST /events/processed and /events/failed reject unsupported mutation ===');

  // Lane O: stub express.Router to capture registered handlers (the module
  // creates its own Router; without this stub router._routes is undefined).
  const Module = require("module");
  const __origLoad = Module._load;
  const __captured = {};
  const __fakeRouter = { get: (p, h) => { __captured["GET " + p] = h; }, post: (p, h) => { __captured["POST " + p] = h; }, _routes: __captured };
  Module._load = function (request, parent, isMain) { if (request === "express") return { Router: () => __fakeRouter }; return __origLoad.call(this, request, parent, isMain); };
  const createEventRoutes = require('./routes/events.js');

  const mutationCases = [
    { path: '/processed', body: { event_id: 'evt-1', worker: 'w1' }, query: { tenant: 'tenant-a' } },
    { path: '/processed', body: { event_id: 'evt-1' }, query: {} },
    { path: '/processed', body: { event_id: 'tenant-b-event' }, query: { tenant: 'tenant-a' } },
    { path: '/processed', body: {}, query: { tenant: 'tenant-a' } },
    { path: '/failed', body: { event_id: 'evt-1', error: 'retry' }, query: { tenant: 'tenant-a' } },
    { path: '/failed', body: { event_id: 'evt-1' }, query: {} },
    { path: '/failed', body: {}, query: { tenant: 'tenant-a' } },
  ];
  for (const [index, request] of mutationCases.entries()) {
    test(`POST /events${request.path} case ${index + 1} rejects before authority or SQL`, async () => {
      let mutations = 0, queries = 0;
      const authority = makeEventReadAuthority({
        markProcessed: async () => { mutations++; throw new Error('must not run'); },
        markFailed: async () => { mutations++; throw new Error('must not run'); },
      });
      const pool = { query: async () => { queries++; throw new Error('must not query'); } };
      const router = createEventRoutes(authority, null, pool);
      const res = makeRes();
      await router._routes['POST ' + request.path](request, res);
      assert.strictEqual(res._status(), 403);
      assert.strictEqual(res._body().error, 'commissioning_operation_unsupported');
      assert.strictEqual(mutations, 0);
      assert.strictEqual(queries, 0);
    });
  }

  console.log('\n=== POST /events requires a configured admission authority ===');
  const legacyCases = [
    { event_type: 'REVIEW_RECEIVED', aggregate_id: 'a', aggregate_type: 'business', event_data: {}, tenant_id: 'tenant-a' },
    { event_type: 'X', aggregate_id: 'a', aggregate_type: 't', event_data: {} },
    { event_type: 'X', aggregate_id: 'a', aggregate_type: 't', event_data: {}, tenant_id: 'tenant-a', namespace: 'tenant::tenant-b' },
    { event_type: 'X', aggregate_id: 'a', aggregate_type: 't', event_data: { tenant_id: 'tenant-b' }, tenant_id: 'tenant-a' },
    { event_type: 'X', tenant_id: 'tenant-a' },
    { event_type: 'FAKE', aggregate_id: 'a', aggregate_type: 't', event_data: {}, tenant_id: 'tenant-a', actor_id: 'owner' },
  ];
  for (const [index, body] of legacyCases.entries()) {
    test(`POST /events legacy case ${index + 1} rejects without raw emit`, async () => {
      let emissions = 0;
      const runtime = { emit: async () => { emissions++; throw new Error('must not emit'); } };
      const router = createEventRoutes(null, runtime, null);
      const res = makeRes();
      await router._routes['POST /']({ body }, res);
      assert.strictEqual(res._status(), 503);
      assert.strictEqual(res._body().error, 'commissioning_unconfigured');
      assert.strictEqual(emissions, 0);
    });
  }

  console.log('\n=== GET /events tenant isolation ===');

  test('GET / without tenant returns 400 tenant_required', async () => {
    const router = createEventRoutes(makeEventReadAuthority(), null);
    const handler = router._routes['GET /'];
    const res = makeRes();
    await handler({ query: {}, params: {} }, res);
    assert.strictEqual(res._status(), 400);
    assert.strictEqual(res._body().error, 'tenant_required');
  });

  test('GET / scopes pool query by tenant_id', async () => {
    let lastQuery = null;
    const pool = {
      async query(sql, params) {
        lastQuery = { sql, params };
        return { rows: [] };
      }
    };
    const router = createEventRoutes(makeEventReadAuthority(), null, pool);
    const handler = router._routes['GET /'];
    const res = makeRes();
    let result = null;
    const res2 = { json: (b) => { result = b; }, headersSent: false, status: (c) => res2 };
    await handler({ query: { tenant: 'tenant-a' }, params: {} }, res2);
    assert.ok(lastQuery, 'pool query ran');
    assert.ok(lastQuery.sql.includes('tenant_id = $3'), 'SQL filters by tenant_id: ' + lastQuery.sql);
    assert.ok(lastQuery.params.includes('tenant-a'), 'tenant bound as param');
  });

  test('GET / filters authority rows by tenant', async () => {
    const authority = makeEventReadAuthority({
      getAllEvents: async () => [
        { event_id: 'e1', tenant_id: 'tenant-a' },
        { event_id: 'e2', tenant_id: 'tenant-b' },
        { event_id: 'e3' },
      ],
    });
    const router = createEventRoutes(authority, null);
    const handler = router._routes['GET /'];
    let result = null;
    const res = { json: (b) => { result = b; }, headersSent: false, status: (c) => res };
    await handler({ query: { tenant: 'tenant-a' }, params: {} }, res);
    assert.strictEqual(result.count, 1);
    assert.strictEqual(result.events[0].event_id, 'e1');
  });

  })().then(async () => {
    // Run all registered tests sequentially (properly awaited).
    for (const { name, fn } of _tests) {
      try { await fn(); passed++; console.log(`  PASS ${name}`); }
      catch (e) { failed++; console.log(`  FAIL ${name}: ${e.message}`); }
    }
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
  });
}

main();
