const assert = require('assert');

let passed = 0, failed = 0;
const _tests = [];
function test(name, fn) { _tests.push({ name, fn }); }

function makeRuntime(pool) {
  const { UnifiedEventRuntime } = require('./unified_event_runtime.js');
  const rt = new UnifiedEventRuntime({
    pool,
    eventValidator: { validateEventType: () => ({ valid: true }) },
    eventGovernance: { validateEvent: () => ({ valid: true }) },
  });
  return rt;
}

function makePool() {
  const queries = [];
  return {
    queries,
    async query(sql, params) {
      queries.push({ sql, params });
      return { rows: [] };
    }
  };
}

function main() {
  return (async () => {
  console.log('=== UnifiedEventRuntime.emit tenant isolation ===');

  test('explicit valid tenant_id is stamped on the event and INSERT', async () => {
    const pool = makePool();
    const rt = makeRuntime(pool);
    const result = await rt.emit('TEST_EVENT', 'api', { x: 1 }, { tenant_id: 'tenant-a' });
    assert.strictEqual(result.status, 'ok');
    assert.strictEqual(result.event.tenant_id, 'tenant-a');
    const insert = pool.queries.find(q => q.sql.includes('INSERT INTO ping_events'));
    assert.ok(insert, 'INSERT ran');
    assert.ok(insert.params.includes('tenant-a'), 'tenant bound in INSERT params');
  });

  test('invalid tenant_id returns error and does not INSERT', async () => {
    const pool = makePool();
    const rt = makeRuntime(pool);
    const result = await rt.emit('TEST_EVENT', 'api', { x: 1 }, { tenant_id: 'bad tenant!' });
    assert.strictEqual(result.status, 'error');
    assert.match(result.error, /invalid tenant_id/);
    const insert = pool.queries.find(q => q.sql.includes('INSERT INTO ping_events'));
    assert.ok(!insert, 'must not INSERT on invalid tenant');
  });

  test('tenant::<slug> namespace derives tenant when no explicit tenant_id', async () => {
    const pool = makePool();
    const rt = makeRuntime(pool);
    const result = await rt.emit('TEST_EVENT', 'api', { x: 1 }, { namespace: 'tenant::acme' });
    assert.strictEqual(result.status, 'ok');
    assert.strictEqual(result.event.tenant_id, 'acme');
  });

  test('no tenant context yields UNKNOWN (never guessed)', async () => {
    const pool = makePool();
    const rt = makeRuntime(pool);
    const result = await rt.emit('TEST_EVENT', 'api', { x: 1 }, {});
    assert.strictEqual(result.status, 'ok');
    assert.strictEqual(result.event.tenant_id, 'UNKNOWN');
  });

  test('explicit tenant_id wins over namespace slug', async () => {
    const pool = makePool();
    const rt = makeRuntime(pool);
    const result = await rt.emit('TEST_EVENT', 'api', { x: 1 }, {
      tenant_id: 'tenant-a',
      namespace: 'tenant::other'
    });
    assert.strictEqual(result.status, 'ok');
    assert.strictEqual(result.event.tenant_id, 'tenant-a');
  });

  test('tenant_id is part of deterministic identity (different tenants, different IDs)', async () => {
    const pool = makePool();
    const rt = makeRuntime(pool);
    const r1 = await rt.emit('TEST_EVENT', 'api', { x: 1 }, { tenant_id: 'tenant-a' });
    const r2 = await rt.emit('TEST_EVENT', 'api', { x: 1 }, { tenant_id: 'tenant-b' });
    assert.strictEqual(r1.status, 'ok');
    assert.strictEqual(r2.status, 'ok');
    assert.notStrictEqual(r1.eventId, r2.eventId, 'tenant must affect identity');
  });

  test('same tenant + same payload is idempotent (same event ID)', async () => {
    const pool = makePool();
    const rt = makeRuntime(pool);
    const r1 = await rt.emit('TEST_EVENT', 'api', { x: 1 }, { tenant_id: 'tenant-a' });
    const r2 = await rt.emit('TEST_EVENT', 'api', { x: 1 }, { tenant_id: 'tenant-a' });
    assert.strictEqual(r1.eventId, r2.eventId, 'idempotent for same tenant');
  });

  console.log('=== UnifiedEventRuntime traversal tenant scoping ===');

  test('getChildren passes tenant to SQL', async () => {
    const pool = makePool();
    pool.query = async (sql, params) => {
      pool.queries.push({ sql, params });
      return { rows: [] };
    };
    const rt = makeRuntime(pool);
    await rt.getChildren('evt-1', 50, 'tenant-a');
    const q = pool.queries[0];
    assert.ok(q.sql.includes('tenant_id'), 'SQL filters by tenant_id');
    assert.ok(q.params.includes('tenant-a'), 'tenant bound');
  });

  test('getDescendants scopes recursive CTE by tenant', async () => {
    const pool = makePool();
    pool.query = async (sql, params) => {
      pool.queries.push({ sql, params });
      return { rows: [] };
    };
    const rt = makeRuntime(pool);
    await rt.getDescendants('evt-1', 10, 200, 'tenant-a');
    const q = pool.queries[0];
    assert.ok(q.sql.includes('tenant_id'), 'SQL references tenant_id');
    assert.ok(q.params.includes('tenant-a'), 'tenant bound');
  });

  test('getAncestors scopes recursive CTE by tenant', async () => {
    const pool = makePool();
    pool.query = async (sql, params) => {
      pool.queries.push({ sql, params });
      return { rows: [] };
    };
    const rt = makeRuntime(pool);
    await rt.getAncestors('evt-1', 20, 'tenant-a');
    const q = pool.queries[0];
    assert.ok(q.sql.includes('tenant_id'), 'SQL references tenant_id');
    assert.ok(q.params.includes('tenant-a'), 'tenant bound');
  });

  test('getCorrelationGroup filters by tenant', async () => {
    const pool = makePool();
    pool.query = async (sql, params) => {
      pool.queries.push({ sql, params });
      return { rows: [] };
    };
    const rt = makeRuntime(pool);
    await rt.getCorrelationGroup('corr-1', 200, 'tenant-a');
    const q = pool.queries[0];
    assert.ok(q.sql.includes('tenant_id'), 'SQL filters by tenant_id');
    assert.ok(q.params.includes('tenant-a'), 'tenant bound');
  });

  })().then(async () => {
    for (const { name, fn } of _tests) {
      try { await fn(); passed++; console.log(`  PASS ${name}`); }
      catch (e) { failed++; console.log(`  FAIL ${name}: ${e.message}`); }
    }
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
  });
}

main();
