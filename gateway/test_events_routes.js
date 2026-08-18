const assert = require('assert');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS ${name}`); } catch(e) { failed++; console.log(`  FAIL ${name}: ${e.message}`); }
}

// Minimal express-like router capturing registered handlers
function makeRouter() {
  const routes = {};
  return {
    get: (p, h) => { routes[`GET ${p}`] = h; },
    post: (p, h) => { routes[`POST ${p}`] = h; },
    _routes: routes,
  };
}

function makeEventReadAuthority(overrides = {}) {
  return {
    markProcessed: async () => true,
    markFailed: async () => true,
    getUnprocessedEvents: async () => [],
    ...overrides,
  };
}

function makeRes() {
  let statusCode = 200;
  let body = null;
  return {
    status: (c) => { statusCode = c; return this; },
    json: (b) => { body = b; return this; },
    headersSent: false,
    _status: () => statusCode,
    _body: () => body,
  };
}

function main() {
  console.log('=== POST /events/processed and /events/failed failure surfacing ===');

  const createEventRoutes = require('./routes/events.js');

  test('markProcessed success returns {processed:true}', async () => {
    const router = makeRouter();
    createEventRoutes(router, null, null);
    const handler = router._routes['POST /events/processed'];
    assert.ok(handler, 'POST /events/processed registered');
    let result = null;
    await handler({ body: { event_id: 'evt-1', worker: 'w1' } }, { json: (b) => { result = b; }, headersSent: false });
    assert.deepStrictEqual(result, { processed: true, event_id: 'evt-1' });
  });

  test('markProcessed failure throws (not masked)', async () => {
    const router = makeRouter();
    createEventRoutes(router, null, null);
    const handler = router._routes['POST /events/processed'];
    let threw = null;
    try {
      await handler({ body: { event_id: 'evt-1', worker: 'w1' } }, { json: () => {}, headersSent: false });
    } catch (e) {
      threw = e;
    }
    assert.ok(threw, 'should throw when markProcessed returns false');
    assert.match(threw.message, /Failed to mark event processed/);
  });

  test('markFailed failure throws (not masked)', async () => {
    const router = makeRouter();
    createEventRoutes(router, null, null);
    const handler = router._routes['POST /events/failed'];
    let threw = null;
    try {
      await handler({ body: { event_id: 'evt-1', worker: 'w1', error: 'boom' } }, { json: () => {}, headersSent: false });
    } catch (e) {
      threw = e;
    }
    assert.ok(threw, 'should throw when markFailed returns false');
    assert.match(threw.message, /Failed to mark event failed/);
  });

  test('markFailed success returns {failed:true}', async () => {
    const router = makeRouter();
    createEventRoutes(router, null, null);
    const handler = router._routes['POST /events/failed'];
    let result = null;
    await handler({ body: { event_id: 'evt-2' } }, { json: (b) => { result = b; }, headersSent: false });
    assert.deepStrictEqual(result, { failed: true, event_id: 'evt-2' });
  });

  test('missing event_id throws on processed route', async () => {
    const router = makeRouter();
    createEventRoutes(router, null, null);
    const handler = router._routes['POST /events/processed'];
    let threw = null;
    try {
      await handler({ body: {} }, { json: () => {}, headersSent: false });
    } catch (e) {
      threw = e;
    }
    assert.ok(threw, 'should throw when event_id missing');
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main();
