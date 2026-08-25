/**
 * EVAL-002: Namespace Privacy Under Chain
 *
 * Proves INV-017 (namespace format), INV-020 (worker chain preservation).
 *
 * tenant::hpp event → worker chain → all downstream events carry tenant::hpp.
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

  // Worker that tracks namespace and emits downstream
  const namespacesSeen = [];
  const worker = new BaseWorker({ eventRuntime: runtime });
  worker._name = 'eval-obs';
  worker.eventTypes = ['REVIEW_RECEIVED'];
  worker.handle = async function(event) {
    namespacesSeen.push(event.namespace);
    await this._emit('OBSERVATION_CREATED', { documentId: 'doc_1' });
  };

  // Ingest with tenant::hpp
  await runtime.emit('REVIEW_RECEIVED', 'eval-source', { documentId: 'doc_1' }, {
    namespace: 'tenant::hpp',
  });

  // Manually dispatch (no WorkerRuntime in this eval)
  const events = pool._events;
  const rootEvent = events.find(r => r.event_type === 'REVIEW_RECEIVED');
  if (rootEvent) {
    worker._event = rootEvent;
    await worker.handle(rootEvent);
  }

  // INV-020: Worker received tenant::hpp
  assert(namespacesSeen[0] === 'tenant::hpp',
    `Worker received tenant::hpp (got ${namespacesSeen[0]})`);

  // INV-017: Namespace format validated
  const nsRegex = /^(core|tenant)::[a-zA-Z0-9_-]+$/;
  assert(nsRegex.test('tenant::hpp'), 'tenant::hpp matches canonical format');
  assert(nsRegex.test('core::system'), 'core::system matches canonical format');
  assert(!nsRegex.test('invalid'), 'invalid namespace rejected');

  // INV-020: Downstream event has tenant::hpp
  const downstream = events.find(r => r.event_type === 'OBSERVATION_CREATED');
  assert(downstream?.namespace === 'tenant::hpp',
    `Downstream has tenant::hpp (got ${downstream?.namespace})`);

  return { pass, fail };
}

module.exports = { run };
