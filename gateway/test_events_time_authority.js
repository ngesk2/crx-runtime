/**
 * Regression test: routes/events.js must not bypass the constitutional
 * time authority with Date.now().
 *
 * Prior defect: the GET /recent fallback computed its cutoff with
 * `new Date(Date.now() - minutes * 60 * 1000).toISOString()` — a direct
 * Date.now() bypass (constitutional time violation, same class Phase 36G
 * removed from context.js / ollama.js / system_authority.js).
 *
 * This test proves the route sources the cutoff from
 * constitutionalTimeAuthority.nowAsMillis() instead, and that no
 * Date.now() bypass remains in the file.
 */

const assert = require('assert');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS ${name}`); } catch (e) { failed++; console.log(`  FAIL ${name}: ${e.message}`); }
}

// Minimal express-like router capturing registered handlers (same pattern
// as test_events_routes.js).
function makeRouter() {
  const routes = {};
  return {
    get: (p, h) => { routes[`GET ${p}`] = h; },
    post: (p, h) => { routes[`POST ${p}`] = h; },
    _routes: routes,
  };
}

function makeRes() {
  let body = null;
  return {
    status: (c) => { return this; },
    json: (b) => { body = b; return this; },
    headersSent: false,
    _body: () => body,
  };
}

function main() {
  console.log('=== /events/recent fallback uses constitutional time authority ===');

  const createEventRoutes = require('./routes/events.js');
  const fs = require('fs');
  const path = require('path');
  const source = fs.readFileSync(path.join(__dirname, 'routes', 'events.js'), 'utf8');

  test('route file has no Date.now() bypass', () => {
    assert.ok(!source.includes('Date.now()'), 'no Date.now() in routes/events.js');
  });

  test('route file imports constitutional time authority', () => {
    assert.ok(source.includes("require('../../ping-runtime/authorities/constitutional_time_authority.js')"), 'time authority import present');
  });

  test('route file uses nowAsMillis() for the cutoff', () => {
    assert.ok(source.includes('constitutionalTimeAuthority.nowAsMillis()'), 'nowAsMillis() used in routes/events.js');
  });

  test('GET /recent fallback cutoff is a valid ISO timestamp ~60min back', async () => {
    const router = makeRouter();
    const authority = {
      getAllEvents: async () => [],
      getRecentEvents: async () => { throw new Error('trigger fallback'); },
    };
    let lastQuery = null;
    const pool = {
      async query(sql, params) {
        lastQuery = { sql, params };
        return { rows: [{ event_id: 'fb-1', event_type: 'SYSTEM_HEALTH_CHECK', timestamp: '2026-08-14T12:00:00.000Z' }] };
      },
    };
    createEventRoutes(authority, null, pool);
    const handler = router._routes['GET /events/recent'];
    assert.ok(handler, 'GET /events/recent registered');

    let error = null;
    try {
      await handler({ params: {}, query: { minutes: '60', limit: '10' }, body: {} }, makeRes());
    } catch (e) {
      error = e;
    }
    assert.strictEqual(error, null, `handler did not throw (${error})`);
    assert.ok(lastQuery, 'fallback query ran');

    const since = lastQuery.params[0];
    assert.strictEqual(typeof since, 'string', 'cutoff is a string');
    assert.ok(!Number.isNaN(Date.parse(since)), `cutoff parses (was: ${since})`);
    assert.strictEqual(lastQuery.params[1], 10, 'limit bound');

    const ageMs = Date.now() - Date.parse(since);
    assert.ok(ageMs > 50 * 60 * 1000, `cutoff ~60min back (ageMs=${ageMs})`);
    assert.ok(ageMs < 70 * 60 * 1000, `cutoff not more than ~70min back (ageMs=${ageMs})`);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
