/**
 * EVAL-007: Worker Failure Propagation
 *
 * Proves INV-030 (failure propagation), INV-028 (dormant workers).
 *
 * Worker throws → dispatch() rethrows (no swallow).
 * Dormant worker (empty eventTypes) matches nothing.
 */

let pass = 0;
let fail = 0;
function assert(condition, msg) {
  if (condition) { pass++; } else { fail++; console.log(`    FAIL: ${msg}`); }
}

async function run() {
  const { WorkerRuntime } = require('../../ping-runtime/workers/worker_runtime');

  const runtime = new WorkerRuntime();

  // Register a worker that throws
  runtime.register('throwing-worker', {
    handle(event) { throw new Error('Simulated failure'); }
  }, { eventTypes: ['FAIL_TEST'] });

  // INV-030: dispatch() throws on worker failure
  let caughtError = null;
  try {
    await runtime.dispatch({
      event_id: 'evt_1',
      event_type: 'FAIL_TEST',
      source: 'eval',
      payload: {},
    });
  } catch (err) {
    caughtError = err;
  }
  assert(caughtError !== null, 'dispatch threw on worker failure');
  assert(caughtError.message === 'Simulated failure', `error preserved: ${caughtError.message}`);

  // INV-028: Dormant worker (empty eventTypes) matches nothing
  let dormantCalled = false;
  runtime.register('dormant-worker', {
    handle(event) { dormantCalled = true; throw new Error('should not run'); }
  }, { eventTypes: [] });

  try {
    await runtime.dispatch({
      event_id: 'evt_2',
      event_type: 'FAIL_TEST',
      source: 'eval',
      payload: {},
    });
  } catch (err) {
    // The throwing worker fires again — that's fine
    if (err.message === 'should not run') dormantCalled = true;
  }
  assert(!dormantCalled, 'dormant worker was not called');

  // INV-029: Single dispatch path stats
  const fullStats = runtime.getStats();
  const s = fullStats.stats;
  assert(s.dispatched >= 1, `dispatched counter incremented: ${s.dispatched}`);
  assert(s.failed >= 1, `failed counter incremented: ${s.failed}`);

  return { pass, fail };
}

module.exports = { run };
