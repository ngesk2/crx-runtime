/**
 * Regression test: getEventsByType / getEventsByCorrelationId must query
 * repository_events, never the legacy `events` table.
 *
 * Prior defect: both methods ran `SELECT ... FROM events` with columns
 * (payload, correlation_id, created_at) that do NOT exist on the live
 * `events` table (pg_dump.sql:391-406 has event_data/timestamp instead).
 * Every query failed, was caught, and returned [] — so GET /system/state
 * always reported knowledge/missions/replay as 'unavailable'.
 *
 * repository_events (gateway/migration_engine.js migration 003) has all
 * three columns. This test proves both methods issue a repository_events
 * query and map rows correctly.
 */

const assert = require('assert');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS ${name}`); } catch (e) { failed++; console.log(`  FAIL ${name}: ${e.message}`); }
}

const { EventReadAuthority: KernelEventReadAuthority } = require('../runtime/kernel/event_read_authority');

function buildAuthority({ rows }) {
  const queries = [];
  const pool = {
    async query(sql, params) {
      queries.push({ sql, params });
      return { rows };
    },
  };
  return { authority: new KernelEventReadAuthority(pool), queries };
}

function main() {
  console.log('=== getEventsByType / getEventsByCorrelationId target repository_events ===');

  test('getEventsByType queries repository_events with all valid columns', async () => {
    const { authority, queries } = buildAuthority({
      rows: [{ event_id: 'e1', event_type: 'MISSION_CREATED', payload: { a: 1 }, correlation_id: 'c1', created_at: '2026-08-14T10:00:00.000Z' }],
    });
    const rows = await authority.getEventsByType('MISSION_CREATED', 100, 0);
    assert.strictEqual(queries.length, 1);
    assert.ok(!queries[0].sql.includes('FROM events'), 'does not query legacy events table');
    assert.ok(queries[0].sql.includes('FROM repository_events'), 'queries repository_events');
    assert.ok(queries[0].sql.includes('payload'), 'selects payload');
    assert.ok(queries[0].sql.includes('correlation_id'), 'selects correlation_id');
    assert.ok(queries[0].sql.includes('created_at'), 'selects created_at');
    assert.deepStrictEqual(queries[0].params, ['MISSION_CREATED', 100, 0]);
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].event_id, 'e1');
    assert.strictEqual(rows[0].timestamp, '2026-08-14T10:00:00.000Z');
  });

  test('getEventsByCorrelationId queries repository_events', async () => {
    const { authority, queries } = buildAuthority({
      rows: [{ event_id: 'e2', event_type: 'TEST', payload: {}, correlation_id: 'c9', created_at: '2026-08-14T09:00:00.000Z' }],
    });
    const rows = await authority.getEventsByCorrelationId('c9');
    assert.strictEqual(queries.length, 1);
    assert.ok(!queries[0].sql.includes('FROM events'), 'does not query legacy events table');
    assert.ok(queries[0].sql.includes('FROM repository_events'), 'queries repository_events');
    assert.deepStrictEqual(queries[0].params, ['c9']);
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].correlation_id, 'c9');
  });

  test('no remaining `FROM events` read in EventReadAuthority', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(path.join(__dirname, '..', 'runtime', 'kernel', 'event_read_authority.js'), 'utf8');
    const reads = source.match(/FROM events/g) || [];
    assert.strictEqual(reads.length, 0, `no bare 'FROM events' reads remain (found ${reads.length})`);
  });

  test('every query in EventReadAuthority references a known table', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(path.join(__dirname, '..', 'runtime', 'kernel', 'event_read_authority.js'), 'utf8');
    const lines = source.split('\n');
    for (const line of lines) {
      const m = line.match(/^\s*FROM\s+([a-z_]+)/);
      if (!m) continue;
      const table = m[1];
      // Function calls like `FROM get_recent_events_for_context($1)` have the
      // table token followed by `(` on the same line.
      const isFunction = /^\s*FROM\s+[a-z_]+\(/.test(line);
      assert.ok(isFunction || ['repository_events', 'event_processing'].includes(table), `table '${table}' is known (line: ${line.trim()})`);
    }
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
