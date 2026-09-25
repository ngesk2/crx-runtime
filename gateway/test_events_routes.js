const assert = require('assert');

let passed = 0, failed = 0;
const _tests = [];

function test(name, fn) {
  _tests.push({ name, fn });
}

// The module registers on its own express.Router() (stubbed to capture).
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
  console.log('=== POST /events/processed and /events/failed failure surfacing ===');

  // Lane O: stub express.Router to capture registered handlers (the module
  // creates its own Router; without this stub router._routes is undefined).
  const Module = require("module");
  const __origLoad = Module._load;
  const __captured = {};
  const __fakeRouter = { get: (p, h) => { __captured["GET " + p] = h; }, post: (p, h) => { __captured["POST " + p] = h; }, _routes: __captured };
  Module._load = function (request, parent, isMain) { if (request === "express") return { Router: () => __fakeRouter }; return __origLoad.call(this, request, parent, isMain); };
  const createEventRoutes = require('./routes/events.js');

  test('markProcessed success returns {processed:true}', async () => {
    const router = createEventRoutes(makeEventReadAuthority(), null);
    const handler = router._routes['POST /processed'];
    assert.ok(handler, 'POST /events/processed registered');
    let result = null;
    await handler(
      { body: { event_id: 'evt-1', worker: 'w1' }, query: { tenant: 'test-tenant' } },
      { json: (b) => { result = b; }, headersSent: false }
    );
    assert.deepStrictEqual(result, { processed: true, event_id: 'evt-1' });
  });

  test('markProcessed without tenant returns 400 tenant_required', async () => {
    const router = createEventRoutes(makeEventReadAuthority(), null);
    const handler = router._routes['POST /processed'];
    const res = makeRes();
    await handler({ body: { event_id: 'evt-1' }, query: {} }, res);
    assert.strictEqual(res._status(), 400);
    assert.strictEqual(res._body().error, 'tenant_required');
  });

  test('markProcessed cross-tenant event is refused with tenant_mismatch', async () => {
    const pool = {
      async query(sql, params) {
        assert.ok(sql.includes('tenant_id'), 'guard queries tenant_id');
        return { rows: [{ tenant_id: 'tenant-b' }] };
      }
    };
    const res = makeRes();
    let marked = false;
    const authority = makeEventReadAuthority({ markProcessed: async () => { marked = true; return true; } });
    const router = createEventRoutes(authority, null, pool);
    await router._routes['POST /processed'](
      { body: { event_id: 'evt-1' }, query: { tenant: 'tenant-a' } }, res);
    assert.strictEqual(res._status(), 400);
    assert.strictEqual(res._body().error, 'tenant_mismatch');
    assert.strictEqual(marked, false, 'must not touch a cross-tenant event');
  });

  test('markProcessed failure surfaces error (not masked as success)', async () => {
    const authority = makeEventReadAuthority({ markProcessed: async () => false });
    const router = createEventRoutes(authority, null);
    const handler = router._routes['POST /processed'];
    const res = makeRes();
    await handler(
      { body: { event_id: 'evt-1', worker: 'w1' }, query: { tenant: 'test-tenant' } },
      res);
    assert.strictEqual(res._status(), 500);
    assert.match(res._body().error, /Failed to mark event processed/);
  });

  test('markFailed failure surfaces error (not masked as success)', async () => {
    const authority = makeEventReadAuthority({ markFailed: async () => false });
    const router = createEventRoutes(authority, null);
    const handler = router._routes['POST /failed'];
    const res = makeRes();
    await handler(
      { body: { event_id: 'evt-1', worker: 'w1', error: 'boom' }, query: { tenant: 'test-tenant' } },
      res);
    assert.strictEqual(res._status(), 500);
    assert.match(res._body().error, /Failed to mark event failed/);
  });

  test('markFailed success returns {failed:true}', async () => {
    const router = createEventRoutes(makeEventReadAuthority(), null);
    const handler = router._routes['POST /failed'];
    let result = null;
    await handler(
      { body: { event_id: 'evt-2' }, query: { tenant: 'test-tenant' } },
      { json: (b) => { result = b; }, headersSent: false });
    assert.deepStrictEqual(result, { failed: true, event_id: 'evt-2' });
  });

  test('missing event_id throws on processed route', async () => {
    const router = createEventRoutes(makeEventReadAuthority(), null);
    const handler = router._routes['POST /processed'];
    let threw = null;
    try {
      await handler({ body: {}, query: { tenant: 'test-tenant' } }, { json: () => {}, headersSent: false });
    } catch (e) {
      threw = e;
    }
    assert.ok(threw, 'should throw when event_id missing');
  });

  console.log('\n=== POST /events convergence — routes through UnifiedEventRuntime ===');

  test('POST /events routes through eventRuntime.emit, not kernel pipeline', async () => {
    let emitCalls = [];
    const fakeEventRuntime = {
      emit: async (eventType, source, payload, options) => {
        emitCalls.push({ eventType, source, payload, options });
        return { status: 'ok', eventId: 'evt-abc', event: {} };
      }
    };
    const router = createEventRoutes(null, fakeEventRuntime, null);
    const handler = router._routes['POST /'];
    assert.ok(handler, 'POST / registered');
    let result = null;
    await handler(
      { body: { event_type: 'REVIEW_RECEIVED', aggregate_id: 'agg-1', aggregate_type: 'business', event_data: { text: 'great' }, tenant_id: 'tenant-a' } },
      { json: (b) => { result = b; }, headersSent: false }
    );
    assert.strictEqual(emitCalls.length, 1);
    assert.strictEqual(emitCalls[0].eventType, 'REVIEW_RECEIVED');
    assert.strictEqual(emitCalls[0].source, 'api');
    assert.deepStrictEqual(emitCalls[0].payload, { text: 'great' });
    assert.deepStrictEqual(emitCalls[0].options.metadata, { aggregate_id: 'agg-1', aggregate_type: 'business' });
    assert.strictEqual(emitCalls[0].options.tenant_id, 'tenant-a');
    assert.deepStrictEqual(result, { event_id: 'evt-abc', event_type: 'REVIEW_RECEIVED', status: 'ok' });
  });

  test('POST /events without tenant_id returns 400 tenant_required', async () => {
    let emitCalls = 0;
    const router = createEventRoutes(null, { emit: async () => { emitCalls++; return { status: 'ok' }; } }, null);
    const handler = router._routes['POST /'];
    const res = makeRes();
    await handler(
      { body: { event_type: 'X', aggregate_id: 'a', aggregate_type: 't', event_data: {} } },
      res
    );
    assert.strictEqual(res._status(), 400);
    assert.strictEqual(res._body().error, 'tenant_required');
    assert.strictEqual(emitCalls, 0, 'must not emit without tenant');
  });

  test('POST /events with tenant/namespace contradiction returns 400 tenant_mismatch', async () => {
    let emitCalls = 0;
    const router = createEventRoutes(null, { emit: async () => { emitCalls++; return { status: 'ok' }; } }, null);
    const handler = router._routes['POST /'];
    const res = makeRes();
    await handler(
      { body: { event_type: 'X', aggregate_id: 'a', aggregate_type: 't', event_data: {}, tenant_id: 'tenant-a', namespace: 'tenant::tenant-b' } },
      res
    );
    assert.strictEqual(res._status(), 400);
    assert.strictEqual(res._body().error, 'tenant_mismatch');
    assert.strictEqual(emitCalls, 0, 'must not emit on mismatch');
  });

  test('POST /events with payload tenant contradiction returns 400 tenant_mismatch', async () => {
    let emitCalls = 0;
    const router = createEventRoutes(null, { emit: async () => { emitCalls++; return { status: 'ok' }; } }, null);
    const handler = router._routes['POST /'];
    const res = makeRes();
    await handler(
      { body: { event_type: 'X', aggregate_id: 'a', aggregate_type: 't', event_data: { tenant_id: 'tenant-b' }, tenant_id: 'tenant-a' } },
      res
    );
    assert.strictEqual(res._status(), 400);
    assert.strictEqual(res._body().error, 'tenant_mismatch');
    assert.strictEqual(emitCalls, 0, 'must not emit on mismatch');
  });

  test('POST /events surfaces missing required fields (not masked)', async () => {
    const router = createEventRoutes(null, { emit: async () => ({ status: 'ok' }) }, null);
    const handler = router._routes['POST /'];
    const res = makeRes();
    await handler({ body: { event_type: 'X', tenant_id: 'tenant-a' } }, res);
    assert.strictEqual(res._status(), 500);
    assert.match(res._body().error, /required/);
  });

  test('POST /events surfaces governance rejection', async () => {
    const fakeEventRuntime = {
      emit: async () => ({ status: 'error', error: 'unknown event_type: FAKE' })
    };
    const router = createEventRoutes(null, fakeEventRuntime, null);
    const handler = router._routes['POST /'];
    const res = makeRes();
    await handler(
      { body: { event_type: 'FAKE', aggregate_id: 'a', aggregate_type: 't', event_data: {}, tenant_id: 'tenant-a' } },
      res
    );
    assert.strictEqual(res._status(), 500);
    assert.match(res._body().error, /unknown event_type/);
  });

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
