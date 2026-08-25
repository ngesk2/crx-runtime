/**
 * EVAL-003: Confidence Null Propagation
 *
 * Proves INV-016 (confidence carried not computed).
 *
 * Event with no confidence → full worker chain → all downstream confidence is null.
 */

const { EventEmitter } = require('events');

function createMockPool() {
  const events = [];
  return {
    _events: events,
    query(sql, params) {
      if (sql.includes('CREATE TABLE')) return Promise.resolve({});
      if (sql.includes('INSERT INTO ping_events')) {
        const eventId = params[0];
        const exists = events.find(r => r.event_id === eventId);
        if (exists) return Promise.resolve({ rowCount: 0 });
        events.push({
          event_id: eventId,
          event_type: params[1],
          source: params[2],
          timestamp: params[3],
          payload: typeof params[4] === 'string' ? JSON.parse(params[4]) : params[4],
          metadata: typeof params[5] === 'string' ? JSON.parse(params[5]) : params[5],
          namespace: params[6],
        });
        return Promise.resolve({ rowCount: 1 });
      }
      return Promise.resolve({ rowCount: 0, rows: [] });
    },
  };
}

async function run() {
  let pass = 0;
  let fail = 0;
  function assert(condition, msg) {
    if (condition) { pass++; } else { fail++; console.log(`    FAIL: ${msg}`); }
  }

  const { UnifiedEventRuntime } = require('../../ping-runtime/events/unified_event_runtime');
  const { BaseWorker } = require('../../ping-runtime/workers/canonical_workers');

  const pool = createMockPool();
  const runtime = new UnifiedEventRuntime({ pool });

  const confidenceValues = [];

  // Worker chain
  const obsWorker = new BaseWorker({ eventRuntime: runtime });
  obsWorker._name = 'eval-obs';
  obsWorker.handle = async function(event) {
    confidenceValues.push({ type: 'OBS', confidence: event.metadata?.confidence });
    await this._emit('OBSERVATION_CREATED', { documentId: 'doc_1' });
  };

  const claimWorker = new BaseWorker({ eventRuntime: runtime });
  claimWorker._name = 'eval-claim';
  claimWorker.handle = async function(event) {
    confidenceValues.push({ type: 'CLAIM', confidence: event.metadata?.confidence });
    await this._emit('CLAIM_CREATED', { claimId: 'claim_1' });
  };

  // Ingest with NO confidence
  await runtime.emit('REVIEW_RECEIVED', 'eval-source', { documentId: 'doc_1' }, {
    namespace: 'tenant::hpp',
  });

  // Dispatch through chain
  const rootEvent = pool._events.find(r => r.event_type === 'REVIEW_RECEIVED');
  obsWorker._event = rootEvent;
  await obsWorker.handle(rootEvent);

  const obsEvent = pool._events.find(r => r.event_type === 'OBSERVATION_CREATED');
  claimWorker._event = obsEvent;
  await claimWorker.handle(obsEvent);

  // INV-016: All downstream confidence is absent/null (not fabricated)
  const fabricatedValues = [0.5, 0.7, 0.8, 0.85, 1.0];
  for (const cv of confidenceValues) {
    assert(cv.confidence === null || cv.confidence === undefined,
      `${cv.type} confidence must be null/undefined (got ${cv.confidence})`);
    assert(!fabricatedValues.includes(cv.confidence),
      `${cv.type} confidence not fabricated`);
  }

  assert(confidenceValues.length >= 2,
    `At least 2 workers executed (got ${confidenceValues.length})`);

  return { pass, fail };
}

module.exports = { run };
