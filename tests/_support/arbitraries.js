'use strict';
/**
 * Domain arbitraries for the ladder. We generate DOMAIN objects (events,
 * missions, grants, namespaces, replay streams), never meaningless random
 * JSON. All arbitraries avoid volatile fields (timestamps, Date.now) so
 * properties stay deterministic.
 */
const fc = require('fast-check');

const KEY_ALPHABET = ['a', 'b', 'c', 'id', 'name', 'type', 'value', 'ref', 'kind', 'label'];

// JSON-compatible scalar (no undefined/functions/symbols: canonical bytes
// treat them specially and they are not domain material).
const scalarArb = fc.oneof(
  fc.integer({ min: -1000000, max: 1000000 }),
  fc.string({ maxLength: 24 }),
  fc.boolean(),
  fc.constant(null),
);

function domainValueArb(depth = 2) {
  return fc.letrec((tie) => ({
    value: fc.oneof(
      scalarArb,
      tie('obj'),
      tie('arr'),
    ),
    obj: fc.dictionary(fc.constantFrom(...KEY_ALPHABET), tie('value'), { maxKeys: 5 }),
    arr: fc.array(tie('value'), { maxLength: 4 }),
  })).value;
}

const domainObjectArb = () => fc.dictionary(
  fc.constantFrom(...KEY_ALPHABET), domainValueArb(2), { minKeys: 1, maxKeys: 5 },
);

// Key-permuted clone: same semantics, different insertion order.
function keyPermuted(obj, rand) {
  if (Array.isArray(obj)) return obj.map((v) => keyPermuted(v, rand));
  if (obj && typeof obj === 'object') {
    const keys = Object.keys(obj);
    // deterministic Fisher-Yates driven by a seeded int
    for (let i = keys.length - 1; i > 0; i--) {
      const j = Math.abs(rand) % (i + 1);
      [keys[i], keys[j]] = [keys[j], keys[i]];
      rand = (rand * 1103515245 + 12345) & 0x7fffffff;
    }
    const out = {};
    for (const k of keys) out[k] = keyPermuted(obj[k], rand + k.length);
    return out;
  }
  return obj;
}

const tenantArb = fc.constantFrom('CG-001', 'acme', 'tenant-7', 'UNKNOWN');
const namespaceArb = fc.constantFrom('core::owner', 'core::system', 'tenant::acme', 'tenant::hpp');
const eventTypeArb = fc.constantFrom('REVIEW_RECEIVED', 'CUSTOMER_CREATED', 'MISSION_CREATED', 'ARTIFACT_STORED');
const sourceArb = fc.constantFrom('review-authority', 'mission-runtime', 'test-harness', 'ingest-api');

// Valid replay-kernel event definitions: artifact_commit / artifact_update
// with lineage that the DeterministicReplayEngine accepts (parents must
// exist; namespace-consistent).
function replayStreamArb(maxEvents = 12) {
  return fc.integer({ min: 1, max: maxEvents }).chain((n) =>
    fc.array(fc.string({ minLength: 1, maxLength: 12 }), { minLength: n, maxLength: n }).map((contents) => {
      const events = [];
      for (let i = 0; i < n; i++) {
        const parents = [];
        const parentCount = Math.min(i, 2);
        for (let p = 0; p < parentCount; p++) parents.push(`artifact-${p === 0 ? i - 1 : 0}`);
        events.push({
          event_id: `evt-${String(i).padStart(3, '0')}`,
          event_type: 'artifact_commit',
          actor_id: 'actor-001',
          timestamp: `2026-06-07T00:${String(i).padStart(2, '0')}:00Z`,
          payload: { artifact_id: `artifact-${i}`, artifact_content: contents[i] },
          lineage: { parent_event_ids: [...new Set(parents)] },
          schema_version: '1.0',
          replay_version: '1.0',
          policy_version: '1.0',
        });
      }
      return events;
    }),
  );
}

const grantArb = fc.record({
  capability: fc.constantFrom('customer.lookup', 'appointment.create', 'review.request'),
  principal: fc.constantFrom('worker:comms-1', 'worker:scheduler-2', 'agent:fyd-1'),
  tenant: fc.constantFrom('acme', 'hpp', 'CG-001'),
  scope: fc.constantFrom({ customer_id: 'c-1' }, { fields: ['name'] }),
  purpose: fc.constantFrom('customer_service', 'scheduling', 'fulfillment'),
  expiry: fc.constant(new Date(Date.now() + 3600e3).toISOString()),
  data_class: fc.constant('TASK_EPHEMERAL'),
});

module.exports = {
  fc, scalarArb, domainValueArb, domainObjectArb, keyPermuted,
  tenantArb, namespaceArb, eventTypeArb, sourceArb, replayStreamArb, grantArb,
};
