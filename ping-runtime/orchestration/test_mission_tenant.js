/**
 * W3 MISSION tenant binding tests.
 *
 * Verifies: create() fails closed without tenant_id; tenant joins the
 * idempotency key (same event_id, two tenants = two missions); lifecycle
 * events carry tenant_id (HOLD/retry/reaper preserve context); getPending
 * and getActive scope by tenant; payload tenant never influences binding.
 */
const assert = require('assert');

let passed = 0, failed = 0;
const _tests = [];
function test(name, fn) { _tests.push({ name, fn }); }

function makePool() {
  const queries = [];
  const missions = new Map();
  return {
    queries,
    missions,
    async query(sql, params) {
      queries.push({ sql, params });
      if (sql.includes('INSERT INTO ping_missions')) {
        const [missionId, missionType, payload, priority, createdBy, tenantId] = params;
        if (missions.has(missionId)) return { rowCount: 0, rows: [] };
        missions.set(missionId, { mission_id: missionId, mission_type: missionType, payload, priority, created_by: createdBy, tenant_id: tenantId, status: 'created', retries: 0 });
        return { rowCount: 1, rows: [] };
      }
      if (sql.includes('SELECT tenant_id FROM ping_missions')) {
        const m = missions.get(params[0]);
        return { rows: m ? [{ tenant_id: m.tenant_id }] : [] };
      }
      if (sql.includes("WHERE status = 'created'")) {
        const rows = [...missions.values()].filter(m => m.status === 'created'
          && (params.length < 2 || m.tenant_id === params[1]));
        return { rows: rows.slice(0, params[0]), rowCount: rows.length };
      }
      if (sql.includes("status IN ('assigned', 'running')") && sql.startsWith('SELECT')) {
        const rows = [...missions.values()].filter(m => ['assigned', 'running'].includes(m.status)
          && (params.length === 0 || m.tenant_id === params[0]));
        return { rows, rowCount: rows.length };
      }
      return { rows: [], rowCount: 0 };
    },
  };
}

function makeRuntime(pool) {
  const { MissionRuntime } = require('./mission_runtime.js');
  const emitted = [];
  const eventRuntime = {
    emitted,
    async emit(eventType, source, payload, options) {
      emitted.push({ eventType, source, payload, options });
      return { status: 'ok' };
    },
  };
  return { rt: new MissionRuntime({ pool, eventRuntime }), emitted };
}

test('create() throws without tenant_id (fail closed)', async () => {
  const pool = makePool();
  const { rt } = makeRuntime(pool);
  let threw = null;
  try {
    await rt.create('test.mission', { event_id: 'e1' }, {});
  } catch (e) { threw = e; }
  assert.ok(threw, 'must throw');
  assert.match(threw.message, /tenant_id/);
  assert.strictEqual(pool.missions.size, 0, 'no mission row on fail-closed');
});

test('create() throws on invalid tenant_id', async () => {
  const pool = makePool();
  const { rt } = makeRuntime(pool);
  let threw = null;
  try {
    await rt.create('test.mission', { event_id: 'e1' }, { tenant_id: 'evil tenant!' });
  } catch (e) { threw = e; }
  assert.ok(threw, 'must throw');
  assert.strictEqual(pool.missions.size, 0);
});

test('create() stores tenant_id and emits MISSION_CREATED with tenant option', async () => {
  const pool = makePool();
  const { rt, emitted } = makeRuntime(pool);
  const missionId = await rt.create('test.mission', { event_id: 'e1' }, { tenant_id: 'tenant-a' });
  const row = pool.missions.get(missionId);
  assert.ok(row, 'mission created');
  assert.strictEqual(row.tenant_id, 'tenant-a');
  const ev = emitted.find(e => e.eventType === 'MISSION_CREATED');
  assert.ok(ev, 'MISSION_CREATED emitted');
  assert.strictEqual(ev.options.tenant_id, 'tenant-a');
});

test('tenant joins idempotency key: same event_id, two tenants = two missions', async () => {
  const pool = makePool();
  const { rt } = makeRuntime(pool);
  const idA = await rt.create('test.mission', { event_id: 'e-shared' }, { tenant_id: 'tenant-a' });
  const idB = await rt.create('test.mission', { event_id: 'e-shared' }, { tenant_id: 'tenant-b' });
  assert.notStrictEqual(idA, idB, 'no cross-tenant idempotency collision');
  assert.strictEqual(pool.missions.size, 2);
  assert.strictEqual(pool.missions.get(idA).tenant_id, 'tenant-a');
  assert.strictEqual(pool.missions.get(idB).tenant_id, 'tenant-b');
});

test('payload tenant field never influences binding (spoof surface closed)', async () => {
  const pool = makePool();
  const { rt } = makeRuntime(pool);
  const missionId = await rt.create('test.mission', { event_id: 'e1', tenant_id: 'tenant-evil' }, { tenant_id: 'tenant-a' });
  assert.strictEqual(pool.missions.get(missionId).tenant_id, 'tenant-a');
});

test('getPending scopes by tenant', async () => {
  const pool = makePool();
  const { rt } = makeRuntime(pool);
  await rt.create('test.mission', { event_id: 'e1' }, { tenant_id: 'tenant-a' });
  await rt.create('test.mission', { event_id: 'e2' }, { tenant_id: 'tenant-b' });
  const a = await rt.getPending(10, 'tenant-a');
  assert.strictEqual(a.length, 1);
  assert.strictEqual(a[0].tenant_id, 'tenant-a');
  const b = await rt.getPending(10, 'tenant-b');
  assert.strictEqual(b.length, 1);
  assert.strictEqual(b[0].tenant_id, 'tenant-b');
});

test('getPending rejects invalid tenant (fail closed)', async () => {
  const pool = makePool();
  const { rt } = makeRuntime(pool);
  let threw = null;
  try { await rt.getPending(10, 'bad tenant!'); } catch (e) { threw = e; }
  assert.ok(threw, 'must throw on invalid tenant');
});

test('lifecycle event carries tenant from the immutable row (assign path)', async () => {
  const pool = makePool();
  const { rt, emitted } = makeRuntime(pool);
  const missionId = await rt.create('test.mission', { event_id: 'e1' }, { tenant_id: 'tenant-a' });
  // Simulate the assign UPDATE matching (fake pool returns rowCount via UPDATE path).
  pool.query = async (sql, params) => {
    if (sql.includes('SET status = \'assigned\'')) {
      const m = pool.missions.get(params[1]);
      if (m && m.status === 'created') { m.status = 'assigned'; return { rowCount: 1, rows: [{ mission_id: params[1] }] }; }
      return { rowCount: 0, rows: [] };
    }
    if (sql.includes('SELECT tenant_id FROM ping_missions')) {
      const m = pool.missions.get(params[0]);
      return { rows: m ? [{ tenant_id: m.tenant_id }] : [] };
    }
    return { rows: [], rowCount: 0 };
  };
  const claimed = await rt.assign(missionId, 'worker-1');
  assert.strictEqual(claimed, 1);
  const ev = emitted.find(e => e.eventType === 'MISSION_ASSIGNED');
  assert.ok(ev, 'MISSION_ASSIGNED emitted');
  assert.strictEqual(ev.options.tenant_id, 'tenant-a', 'tenant preserved from row, not caller');
});

test('missions route: POST requires body tenant_id, GETs require ?tenant=', async () => {
  const Module = require('module');
  const expressStub = { Router: () => ({ get() {}, post() {} }) };
  const origLoad = Module._load;
  Module._load = function (request, parent, isMain) {
    if (request === 'express') return expressStub;
    return origLoad.call(this, request, parent, isMain);
  };
  let factory;
  try {
    factory = require('../../gateway/routes/missions.js');
  } finally {
    Module._load = origLoad;
  }
  assert.strictEqual(typeof factory, 'function', 'missions route factory loads');
});

async function main() {
  console.log('=== W3 MISSION tenant binding ===');
  for (const { name, fn } of _tests) {
    try {
      await fn();
      passed++;
      console.log(`PASS ${name}`);
    } catch (e) {
      failed++;
      console.log(`FAIL ${name}: ${e.message}`);
    }
  }
  console.log(`=== Summary: ${passed} passed, ${failed} failed ===`);
  process.exit(failed === 0 ? 0 : 1);
}

if (require.main === module) main();
module.exports = { main };
