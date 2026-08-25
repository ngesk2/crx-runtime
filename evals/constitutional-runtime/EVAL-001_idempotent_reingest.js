/**
 * EVAL-001: Idempotent Re-Ingest
 *
 * Proves INV-001 (deterministic event ID), INV-007 (volatile stripping),
 * INV-014 (dedup on conflict).
 *
 * Same logical event ingested twice → same event_id, 0 new missions created.
 */

const { EventEmitter } = require('events');

function createMockPool() {
  const rows = [];
  return {
    _rows: rows,
    query(sql, params) {
      if (sql.includes('CREATE TABLE')) return Promise.resolve({});
      if (sql.includes('INSERT INTO ping_events')) {
        const eventId = params[0];
        const exists = rows.find(r => r.event_id === eventId);
        if (exists) return Promise.resolve({ rowCount: 0 });
        rows.push({
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
  const pool = createMockPool();
  const runtime = new UnifiedEventRuntime({ pool });

  const payload = { documentId: 'doc_001', text: 'Test document' };

  // Ingest same event twice — emit(eventType, source, payload, options)
  const result1 = await runtime.emit('REVIEW_RECEIVED', 'eval-source', payload, {
    namespace: 'tenant::hpp',
  });
  const result2 = await runtime.emit('REVIEW_RECEIVED', 'eval-source', payload, {
    namespace: 'tenant::hpp',
  });

  // INV-001: Same logical event → same event_id
  assert(result1.eventId === result2.eventId,
    `Event IDs must match: ${result1.eventId} vs ${result2.eventId}`);

  // INV-014: Second insert deduplicated
  const reviewEvents = pool._rows.filter(r => r.event_type === 'REVIEW_RECEIVED');
  assert(reviewEvents.length === 1,
    `Exactly 1 REVIEW_RECEIVED in pool (got ${reviewEvents.length})`);

  // INV-007: No physical timestamp in metadata
  const meta = reviewEvents[0]?.metadata;
  assert(meta && !meta.physical_timestamp, 'No physical_timestamp in metadata');

  // INV-017: Namespace preserved
  assert(reviewEvents[0]?.namespace === 'tenant::hpp',
    `Namespace preserved: ${reviewEvents[0]?.namespace}`);

  return { pass, fail };
}

module.exports = { run };
