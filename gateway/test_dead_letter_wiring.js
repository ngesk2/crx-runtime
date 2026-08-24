/**
 * Arrow 2 Test — DeadLetterAuthority Wiring
 *
 * Proves that MissionScheduler._failMission() routes exhausted retries
 * to DeadLetterAuthority.recordDeadLetter() when injected, and no-ops
 * gracefully when not injected.
 *
 * Mocks: MissionRuntime (failWithRetry returns exhaustion count),
 *        DeadLetterAuthority (tracks recordDeadLetter calls).
 * No Postgres, no Docker.
 */

const assert = require('assert');
const { MissionScheduler } = require('../ping-runtime/orchestration/mission_scheduler');

// ─── Mock MissionRuntime ─────────────────────────────────────────────

class MockMissionRuntime {
  constructor() {
    this._failWithRetryCalls = [];
  }

  async failWithRetry(missionId, error, retryPolicy) {
    this._failWithRetryCalls.push({ missionId, error, retryPolicy });
    // Simulate: this is the Nth retry, return the count
    return this._failWithRetryCalls.length;
  }

  async getPending() { return []; }
  async getActive() { return []; }
  async getStats() { return { total: 0, byStatus: {} }; }
}

// ─── Mock DeadLetterAuthority ────────────────────────────────────────

class MockDeadLetterAuthority {
  constructor() {
    this._recordCalls = [];
  }

  async recordDeadLetter(job, error) {
    this._recordCalls.push({ job, error: error.message });
  }
}

// ─── Mock WorkerRuntime ──────────────────────────────────────────────

class MockWorkerRuntime {
  getStats() {
    return { workers: { test: { status: 'idle', processed: 0 } }, status: 'ok', running: 0, processed: 0, failed: 0 };
  }
  async dispatch() { return { status: 'failed', error: 'worker crashed' }; }
}

// ─── Tests ───────────────────────────────────────────────────────────

async function testDLQRoutesExhaustedRetries() {
  const missionRuntime = new MockMissionRuntime();
  const deadLetterAuthority = new MockDeadLetterAuthority();
  const workerRuntime = new MockWorkerRuntime();
  const retryPolicy = { max_attempts: 3, backoff_delay_ms: 100 };

  const scheduler = new MissionScheduler({
    missionRuntime,
    workerRuntime,
    deadLetterAuthority,
    retryPolicy,
    pollIntervalMs: 100000,
    maxConcurrent: 5,
  });

  const mission = {
    mission_id: 'm_test_001',
    mission_type: 'OBSERVATION',
    payload: JSON.stringify({ event_type: 'REVIEW_RECEIVED', source: 'test' }),
  };

  // Simulate 3 failures (exhaustion)
  await scheduler._failMission(mission, 'worker error 1');
  await scheduler._failMission(mission, 'worker error 2');
  await scheduler._failMission(mission, 'worker error 3');

  // failWithRetry was called 3 times
  assert.strictEqual(missionRuntime._failWithRetryCalls.length, 3, 'Expected 3 failWithRetry calls');

  // After 3rd failure (retries=3 >= max_attempts=3), DLQ should have been called
  assert.strictEqual(deadLetterAuthority._recordCalls.length, 1, `Expected 1 DLQ record, got ${deadLetterAuthority._recordCalls.length}`);
  assert.strictEqual(deadLetterAuthority._recordCalls[0].job.job_id, 'm_test_001');
  assert.strictEqual(deadLetterAuthority._recordCalls[0].job.job_type, 'OBSERVATION');
  assert.ok(deadLetterAuthority._recordCalls[0].error.includes('worker error 3'), 'DLQ error should include final error');
  console.log('  PASS: exhausted retries routed to DLQ');
}

async function testDLQNotCalledBeforeExhaustion() {
  const missionRuntime = new MockMissionRuntime();
  const deadLetterAuthority = new MockDeadLetterAuthority();
  const workerRuntime = new MockWorkerRuntime();
  const retryPolicy = { max_attempts: 3, backoff_delay_ms: 100 };

  const scheduler = new MissionScheduler({
    missionRuntime,
    workerRuntime,
    deadLetterAuthority,
    retryPolicy,
    pollIntervalMs: 100000,
    maxConcurrent: 5,
  });

  const mission = {
    mission_id: 'm_test_002',
    mission_type: 'CLAIM',
    payload: JSON.stringify({ event_type: 'OBSERVATION_CREATED' }),
  };

  // Fail only once (not exhausted)
  await scheduler._failMission(mission, 'transient error');

  // DLQ should NOT have been called (retries=1 < max_attempts=3)
  assert.strictEqual(deadLetterAuthority._recordCalls.length, 0, `Expected 0 DLQ records, got ${deadLetterAuthority._recordCalls.length}`);
  console.log('  PASS: non-exhausted retries not routed to DLQ');
}

async function testDLQNotInjectedGracefulNoop() {
  const missionRuntime = new MockMissionRuntime();
  const workerRuntime = new MockWorkerRuntime();
  const retryPolicy = { max_attempts: 3, backoff_delay_ms: 100 };

  const scheduler = new MissionScheduler({
    missionRuntime,
    workerRuntime,
    // deadLetterAuthority intentionally omitted
    retryPolicy,
    pollIntervalMs: 100000,
    maxConcurrent: 5,
  });

  const mission = {
    mission_id: 'm_test_003',
    mission_type: 'PROJECTION',
    payload: JSON.stringify({ event_type: 'CLAIM_CREATED' }),
  };

  // Should not throw even without DLQ
  let threw = false;
  try {
    await scheduler._failMission(mission, 'exhausted without DLQ');
  } catch (e) {
    threw = true;
  }
  assert.strictEqual(threw, false, '_failMission should not throw without deadLetterAuthority');
  console.log('  PASS: missing deadLetterAuthority is graceful noop');
}

async function testDLQRecordContainsCorrectPayload() {
  const missionRuntime = new MockMissionRuntime();
  const deadLetterAuthority = new MockDeadLetterAuthority();
  const workerRuntime = new MockWorkerRuntime();
  const retryPolicy = { max_attempts: 1, backoff_delay_ms: 100 }; // exhaust on 1st failure

  const scheduler = new MissionScheduler({
    missionRuntime,
    workerRuntime,
    deadLetterAuthority,
    retryPolicy,
    pollIntervalMs: 100000,
    maxConcurrent: 5,
  });

  const mission = {
    mission_id: 'm_test_004',
    mission_type: 'LINEAGE',
    payload: { event_type: 'WITNESS_CREATED', documentId: 'doc_123' },
  };

  await scheduler._failMission(mission, 'boom');

  assert.strictEqual(deadLetterAuthority._recordCalls.length, 1);
  const record = deadLetterAuthority._recordCalls[0];
  assert.strictEqual(record.job.job_id, 'm_test_004');
  assert.strictEqual(record.job.job_type, 'LINEAGE');
  assert.deepStrictEqual(record.job.payload, { event_type: 'WITNESS_CREATED', documentId: 'doc_123' });
  console.log('  PASS: DLQ record contains correct job payload');
}

// ─── Run ─────────────────────────────────────────────────────────────

async function run() {
  console.log('Arrow 2: DeadLetterAuthority Wiring');
  console.log('─'.repeat(50));

  const tests = [
    testDLQRoutesExhaustedRetries,
    testDLQNotCalledBeforeExhaustion,
    testDLQNotInjectedGracefulNoop,
    testDLQRecordContainsCorrectPayload,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test();
      passed++;
    } catch (err) {
      failed++;
      console.error(`  FAIL: ${test.name}: ${err.message}`);
    }
  }

  console.log('─'.repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch(err => { console.error(err); process.exit(1); });
