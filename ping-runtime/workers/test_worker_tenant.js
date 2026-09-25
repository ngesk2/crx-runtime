/**
 * W4 WORKER tenant pin tests.
 *
 * Verifies: worker _emit inherits the triggering event's tenant by default;
 * a contradicting explicit options.tenant_id throws (cross-tenant laundering
 * fails closed); an explicit tenant is honored when no event is pinned;
 * WorkerRuntime.dispatch pins the triggering event on the worker for the op.
 */
const assert = require('assert');

let passed = 0, failed = 0;
const _tests = [];
function test(name, fn) { _tests.push({ name, fn }); }

function makeWorker(eventRuntime) {
  const { BaseWorker } = require('./canonical_workers.js');
  const w = new BaseWorker({ eventRuntime });
  w._name = 'test-worker';
  return w;
}

function makeEventRuntime(capture) {
  return {
    async emit(eventType, source, payload, options) {
      capture.push({ eventType, source, payload, options });
      return { status: 'ok' };
    },
  };
}

test('_emit inherits tenant_id from the pinned triggering event', async () => {
  const capture = [];
  const w = makeWorker(makeEventRuntime(capture));
  w._event = { event_id: 'e1', tenant_id: 'tenant-a', namespace: 'tenant::tenant-a', metadata: {} };
  await w._emit('DOWNSTREAM', { x: 1 });
  assert.strictEqual(capture.length, 1);
  assert.strictEqual(capture[0].options.tenant_id, 'tenant-a');
});

test('_emit throws on contradicting explicit tenant (pin violation)', async () => {
  const capture = [];
  const w = makeWorker(makeEventRuntime(capture));
  w._event = { event_id: 'e1', tenant_id: 'tenant-a', namespace: 'tenant::tenant-a', metadata: {} };
  let threw = null;
  try {
    await w._emit('DOWNSTREAM', { x: 1 }, { tenant_id: 'tenant-b' });
  } catch (e) { threw = e; }
  assert.ok(threw, 'must throw');
  assert.match(threw.message, /tenant pin violation/);
  assert.strictEqual(capture.length, 0, 'no emission on pin violation');
});

test('_emit honors explicit tenant when no event is pinned', async () => {
  const capture = [];
  const w = makeWorker(makeEventRuntime(capture));
  w._event = null;
  await w._emit('DOWNSTREAM', { x: 1 }, { tenant_id: 'tenant-c' });
  assert.strictEqual(capture.length, 1);
  assert.strictEqual(capture[0].options.tenant_id, 'tenant-c');
});

test('_emit passes undefined tenant when neither pinned nor explicit (UER derives)', async () => {
  const capture = [];
  const w = makeWorker(makeEventRuntime(capture));
  w._event = null;
  await w._emit('DOWNSTREAM', { x: 1 });
  assert.strictEqual(capture.length, 1);
  assert.strictEqual(capture[0].options.tenant_id, undefined);
});

test('matching explicit tenant does not throw', async () => {
  const capture = [];
  const w = makeWorker(makeEventRuntime(capture));
  w._event = { event_id: 'e1', tenant_id: 'tenant-a', namespace: 'tenant::tenant-a', metadata: {} };
  await w._emit('DOWNSTREAM', { x: 1 }, { tenant_id: 'tenant-a' });
  assert.strictEqual(capture.length, 1);
  assert.strictEqual(capture[0].options.tenant_id, 'tenant-a');
});

test('intelligence worker _emit applies the same tenant pin', async () => {
  const capture = [];
  const { IntelligenceWorker } = require('./intelligence_worker.js');
  const w = new IntelligenceWorker({ eventRuntime: makeEventRuntime(capture) });
  w._event = { event_id: 'e1', tenant_id: 'tenant-a', namespace: 'tenant::tenant-a', metadata: {} };
  await w._emit('CLASSIFICATION_CREATED', { x: 1 });
  assert.strictEqual(capture[0].options.tenant_id, 'tenant-a');
  let threw = null;
  try {
    await w._emit('CLASSIFICATION_CREATED', { x: 1 }, { tenant_id: 'tenant-z' });
  } catch (e) { threw = e; }
  assert.ok(threw, 'must throw on pin violation');
  assert.match(threw.message, /tenant pin violation/);
});

test('WorkerRuntime.dispatch pins the triggering event for the op duration', async () => {
  const { WorkerRuntime } = require('./worker_runtime.js');
  const rt = new WorkerRuntime({ gatewayUrl: 'http://localhost:9' });
  const seen = [];
  const fakeWorker = {
    _event: null,
    async handle(event) {
      seen.push({ pinned: this._event, event });
      return { ok: true };
    },
  };
  rt._workers.set('fake', { worker: fakeWorker, eventTypes: ['T'], running: 0, maxConcurrent: 1, status: 'idle', totalProcessed: 0, totalFailed: 0, lastHeartbeat: 0 });
  const event = { event_id: 'e1', event_type: 'T', tenant_id: 'tenant-a' };
  await rt.dispatch(event);
  assert.strictEqual(seen.length, 1);
  assert.strictEqual(seen[0].pinned, event, 'worker saw the pinned event during handle');
  assert.strictEqual(fakeWorker._event, null, 'pin cleared after op');
});

async function main() {
  console.log('=== W4 WORKER tenant pin ===');
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
