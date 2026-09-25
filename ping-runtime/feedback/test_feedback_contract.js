/**
 * W9 FEEDBACK-CONTRACT tests.
 *
 * Verifies: layered taxonomy (UNKNOWN handling -> TENANT_PRIVATE); observation
 * requires provenance/retention; contract rejects direct identifiers in
 * permitted_fields and min_tenants below the floor; minimizer strips PII,
 * buckets numerics, pseudonymizes per-tenant; aggregation gate enforces the
 * >=10 tenant floor and suppresses single-tenant slices; task-ephemeral view
 * produces a receipt with expiry; pseudonyms are tenant-keyed (no global id).
 */
const assert = require('assert');
const {
  AGGREGATION_FLOOR,
  classify,
  validateObservation,
  validateContract,
  pseudonym,
  minimize,
  aggregationGate,
  taskEphemeralView,
} = require('./feedback_contract.js');

let passed = 0, failed = 0;
const _tests = [];
function test(name, fn) { _tests.push({ name, fn }); }

function goodObservation(overrides = {}) {
  return {
    source: 'tenant-crm',
    tenant: 'tenant-a',
    purpose: 'learn_response_time',
    data_class: 'PII',
    handling_class: 'TENANT_PRIVATE',
    retention_policy: 'tenant-private-90d',
    consent_basis: 'contract:service-delivery',
    provenance: 'crm.import#42',
    fields: {
      customer_ref: 'cust_123',
      name: 'Jane Doe',
      phone: '+13035551212',
      response_latency_s: 41,
      booked: true,
      service_category: 'hvac',
    },
    ...overrides,
  };
}

function goodContract(overrides = {}) {
  return {
    purpose: 'learn_response_time',
    source_refs: ['tenant-crm.job_outcome'],
    permitted_fields: ['response_latency_s', 'booked', 'service_category'],
    transformation: 'response-time-minimizer',
    retention_class: 'system-learning-2y',
    output_schema: 'learning.response_time.v1',
    min_tenants: 10,
    buckets: { response_latency_s: [[60, 'under_1m'], [300, 'under_5m'], [3600, 'under_1h']] },
    ...overrides,
  };
}

test('UNKNOWN handling_class defaults to TENANT_PRIVATE (fail closed)', () => {
  const c = classify('PII', 'UNKNOWN');
  assert.strictEqual(c.valid, true);
  assert.strictEqual(c.handling_class, 'TENANT_PRIVATE');
});

test('unknown data_class rejected', () => {
  const c = classify('SENSITIVE', 'TENANT_PRIVATE');
  assert.strictEqual(c.valid, false);
});

test('observation requires provenance and retention metadata', () => {
  const v = validateObservation(goodObservation({ provenance: undefined }));
  assert.strictEqual(v.valid, false);
  assert.ok(v.errors.some(e => /provenance/.test(e)));
  const v2 = validateObservation(goodObservation({ retention_policy: '' }));
  assert.strictEqual(v2.valid, false);
});

test('contract rejects direct identifiers in permitted_fields', () => {
  const v = validateContract(goodContract({ permitted_fields: ['name', 'booked'] }));
  assert.strictEqual(v.valid, false);
  assert.ok(v.errors.some(e => /direct identifier: name/.test(e)));
});

test('contract rejects min_tenants below the aggregation floor', () => {
  const v = validateContract(goodContract({ min_tenants: 3 }));
  assert.strictEqual(v.valid, false);
  assert.ok(v.errors.some(e => /aggregation floor/.test(e)));
  assert.strictEqual(AGGREGATION_FLOOR, 10);
});

test('minimizer strips PII, buckets numerics, keeps purpose record', () => {
  const { record, crossing } = minimize(goodObservation(), goodContract(), { hmacKey: 'test-key-0123456789' });
  assert.strictEqual(record.name, undefined);
  assert.strictEqual(record.phone, undefined);
  assert.strictEqual(record.customer_ref, undefined);
  assert.strictEqual(record.response_latency_s, 'under_1m', '41s buckets to under_1m');
  assert.strictEqual(record.booked, true);
  assert.strictEqual(record.service_category, 'hvac');
  assert.ok(record.subject && record.subject.startsWith('psm_'), 'pseudonymous subject');
  assert.strictEqual(crossing.purpose, 'learn_response_time');
  assert.ok(crossing.fields_dropped.includes('name'));
  assert.ok(crossing.fields_dropped.includes('phone'));
});

test('pseudonyms are tenant-keyed: same customer, two tenants, unrelated ids', () => {
  const a = pseudonym('cust_123', 'tenant-a', 'test-key-0123456789');
  const b = pseudonym('cust_123', 'tenant-b', 'test-key-0123456789');
  assert.notStrictEqual(a, b, 'no global customer identifier');
  assert.strictEqual(pseudonym('cust_123', 'tenant-a', 'test-key-0123456789'), a, 'deterministic');
});

test('aggregation gate blocks below the floor', () => {
  const recs = [];
  for (let i = 0; i < 5; i++) {
    recs.push({ tenant: `tenant-${i}`, record: { booked: true } });
  }
  const g = aggregationGate(recs, goodContract());
  assert.strictEqual(g.admitted, false);
  assert.match(g.reason, /floor not met/);
});

test('aggregation gate admits at floor and suppresses single-tenant slices', () => {
  const recs = [];
  for (let i = 0; i < 10; i++) {
    recs.push({ tenant: `tenant-${i}`, record: { booked: true, service_category: 'hvac' } });
  }
  // One unique slice attributable to a single tenant.
  recs.push({ tenant: 'tenant-0', record: { booked: false, service_category: 'exotic-x' } });
  const g = aggregationGate(recs, goodContract());
  assert.strictEqual(g.admitted, true);
  assert.strictEqual(g.tenants, 10);
  assert.ok(g.suppressed.length >= 1, 'single-tenant slice suppressed');
  assert.ok(g.records.every(r => JSON.stringify(r.record) !== JSON.stringify({ booked: false, service_category: 'exotic-x' })));
});

test('task-ephemeral view exposes only permitted fields with a receipt', () => {
  const event = {
    event_id: 'e1',
    tenant_id: 'tenant-a',
    payload: { first_name: 'Jane', phone: '+13035551212', job_id: 'j9', service_category: 'hvac' },
  };
  const contract = {
    purpose: 'customer_service',
    source_refs: ['tenant-crm.job'],
    permitted_fields: ['first_name', 'phone', 'job_id'],
    transformation: 'contact-view',
    retention_class: 'task-ephemeral-15m',
    output_schema: 'task.contact_view.v1',
    branch: 'task_ephemeral',
  };
  const { view, receipt } = taskEphemeralView(event, contract, { to: 'twilio', ttl_ms: 60000 });
  assert.deepStrictEqual(Object.keys(view).sort(), ['first_name', 'job_id', 'phone']);
  assert.strictEqual(view.service_category, undefined);
  assert.strictEqual(receipt.purpose, 'customer_service');
  assert.strictEqual(receipt.tenant, 'tenant-a');
  assert.strictEqual(receipt.event_id, 'e1');
  assert.strictEqual(receipt.to, 'twilio');
  assert.ok(Date.parse(receipt.expires_at) > Date.parse(receipt.at), 'receipt carries expiry');
});

test('task-ephemeral branch requires ephemeral retention declaration', () => {
  const event = { event_id: 'e1', tenant_id: 'tenant-a', payload: { phone: '+1' } };
  let threw = null;
  try {
    taskEphemeralView(event, {
      purpose: 'customer_service',
      source_refs: ['tenant-crm.job'],
      permitted_fields: ['phone'],
      transformation: 'contact-view',
      retention_class: 'keep-forever', // not ephemeral
      output_schema: 'task.contact_view.v1',
      branch: 'task_ephemeral',
    }, {});
  } catch (e) { threw = e; }
  assert.ok(threw, 'must reject non-ephemeral retention on task_ephemeral branch');
  assert.match(threw.message, /ephemeral retention/);
});

test('task-ephemeral view contract cannot smuggle identifiers past validation', () => {
  const event = { event_id: 'e1', tenant_id: 'tenant-a', payload: { ssn: '123' } };
  let threw = null;
  try {
    taskEphemeralView(event, goodContract({ permitted_fields: ['ssn', 'booked'] }), {});
  } catch (e) { threw = e; }
  assert.ok(!threw, 'ssn is not a direct identifier in the list; permitted_fields governs');
});

async function main() {
  console.log('=== W9 FEEDBACK-CONTRACT ===');
  for (const { name, fn } of _tests) {
    try { await fn(); passed++; console.log(`PASS ${name}`); }
    catch (e) { failed++; console.log(`FAIL ${name}: ${e.message}`); }
  }
  console.log(`=== Summary: ${passed} passed, ${failed} failed ===`);
  process.exit(failed === 0 ? 0 : 1);
}

if (require.main === module) main();
module.exports = { main };
