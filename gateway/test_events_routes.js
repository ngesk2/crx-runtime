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

  console.log('\n=== POST /events convergence — routes through UnifiedEventRuntime ===');

  test('POST /events routes through eventRuntime.emit, not kernel pipeline', async () => {
    const router = makeRouter();
    let emitCalls = [];
    const fakeEventRuntime = {
      emit: async (eventType, source, payload, options) => {
        emitCalls.push({ eventType, source, payload, options });
        return { status: 'ok', eventId: 'evt-abc', event: {} };
      }
    };
    createEventRoutes(router, fakeEventRuntime, null);
    const handler = router._routes['POST /'];
    assert.ok(handler, 'POST / registered');
    let result = null;
    await handler(
      { body: { event_type: 'REVIEW_RECEIVED', aggregate_id: 'agg-1', aggregate_type: 'business', event_data: { text: 'great' } } },
      { json: (b) => { result = b; }, headersSent: false }
    );
    assert.strictEqual(emitCalls.length, 1);
    assert.strictEqual(emitCalls[0].eventType, 'REVIEW_RECEIVED');
    assert.strictEqual(emitCalls[0].source, 'api');
    assert.deepStrictEqual(emitCalls[0].payload, { text: 'great' });
    assert.deepStrictEqual(emitCalls[0].options.metadata, { aggregate_id: 'agg-1', aggregate_type: 'business' });
    assert.deepStrictEqual(result, { event_id: 'evt-abc', event_type: 'REVIEW_RECEIVED', status: 'ok' });
  });

  test('POST /events throws on missing required fields', async () => {
    const router = makeRouter();
    createEventRoutes(router, { emit: async () => ({ status: 'ok' }) }, null);
    const handler = router._routes['POST /'];
    let threw = null;
    try {
      await handler({ body: { event_type: 'X' } }, { json: () => {}, headersSent: false });
    } catch (e) { threw = e; }
    assert.ok(threw, 'should throw');
    assert.match(threw.message, /required/);
  });

  test('POST /events surfaces governance rejection', async () => {
    const router = makeRouter();
    const fakeEventRuntime = {
      emit: async () => ({ status: 'error', error: 'unknown event_type: FAKE' })
    };
    createEventRoutes(router, fakeEventRuntime, null);
    const handler = router._routes['POST /'];
    let threw = null;
    try {
      await handler(
        { body: { event_type: 'FAKE', aggregate_id: 'a', aggregate_type: 't', event_data: {} } },
        { json: () => {}, headersSent: false }
      );
    } catch (e) { threw = e; }
    assert.ok(threw, 'should throw on governance rejection');
    assert.match(threw.message, /unknown event_type/);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main();
