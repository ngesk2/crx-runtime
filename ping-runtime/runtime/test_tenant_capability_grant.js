/**
 * W5 CAPABILITY — tenant-scoped capability grant tests.
 *
 * Verifies: grant shape validation (fail closed); tenant/purpose/capability
 * mismatch rejected; expiry enforced; learning purposes and SYSTEM_LEARNING
 * data_class rejected (operational != learning); break-glass requires explicit
 * reason + invoker, max 15-min TTL, least-privilege scope, and audit record.
 */
const assert = require('assert');
const {
  TENANT_DATA_CAPABILITIES,
  OPERATIONAL_PURPOSES,
  validateGrant,
  checkGrant,
} = require('./tenant_capability_grant.js');

let passed = 0, failed = 0;
const _tests = [];
function test(name, fn) { _tests.push({ name, fn }); }

function goodGrant(overrides = {}) {
  return {
    capability: 'customer.contact',
    principal: 'worker:comms-1',
    tenant: 'tenant-a',
    scope: { customer_id: 'cust_123', fields: ['first_name', 'phone'] },
    purpose: 'customer_service',
    expiry: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    data_class: 'TASK_EPHEMERAL',
    ...overrides,
  };
}

const req = { capability: 'customer.contact', tenant: 'tenant-a', purpose: 'customer_service' };

test('valid operational grant authorizes', () => {
  const r = checkGrant(goodGrant(), req);
  assert.strictEqual(r.authorized, true, r.reason);
});

test('expired grant rejected', () => {
  const r = checkGrant(goodGrant({ expiry: new Date(Date.now() - 1000).toISOString() }), req);
  assert.strictEqual(r.authorized, false);
  assert.match(r.reason, /expired/);
});

test('tenant mismatch rejected (cross-tenant use fails closed)', () => {
  const r = checkGrant(goodGrant(), { ...req, tenant: 'tenant-b' });
  assert.strictEqual(r.authorized, false);
  assert.match(r.reason, /tenant mismatch/);
});

test('capability mismatch rejected', () => {
  const r = checkGrant(goodGrant(), { ...req, capability: 'customer.lookup' });
  assert.strictEqual(r.authorized, false);
  assert.match(r.reason, /capability mismatch/);
});

test('purpose mismatch rejected (purpose-bound grant)', () => {
  const r = checkGrant(goodGrant(), { ...req, purpose: 'scheduling' });
  assert.strictEqual(r.authorized, false);
  assert.match(r.reason, /purpose mismatch/);
});

test('learning purpose not grantable (operational != learning)', () => {
  const v = validateGrant(goodGrant({ purpose: 'analytics' }));
  assert.strictEqual(v.valid, false);
  assert.ok(v.errors.some(e => /not operational-grantable/.test(e)));
});

test('SYSTEM_LEARNING data_class rejected on operational grant', () => {
  const v = validateGrant(goodGrant({ data_class: 'SYSTEM_LEARNING' }));
  assert.strictEqual(v.valid, false);
  assert.ok(v.errors.some(e => /TASK_EPHEMERAL/.test(e)));
});

test('unknown capability rejected', () => {
  const v = validateGrant(goodGrant({ capability: 'database.raw_sql' }));
  assert.strictEqual(v.valid, false);
  assert.ok(v.errors.some(e => /unknown capability/.test(e)));
});

test('missing scope rejected (least privilege)', () => {
  const v = validateGrant(goodGrant({ scope: null }));
  assert.strictEqual(v.valid, false);
});

test('break-glass requires reason and invoker', () => {
  const v = validateGrant(goodGrant({ break_glass: {} }));
  assert.strictEqual(v.valid, false);
  assert.ok(v.errors.some(e => /reason/.test(e)));
  assert.ok(v.errors.some(e => /invoked_by/.test(e)));
});

test('break-glass TTL capped at 15 minutes', () => {
  const v = validateGrant(goodGrant({
    expiry: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    break_glass: { reason: 'outage triage', invoked_by: 'nolan' },
  }));
  assert.strictEqual(v.valid, false);
  assert.ok(v.errors.some(e => /15 minutes/.test(e)));
});

test('break-glass wildcard scope forbidden', () => {
  const v = validateGrant(goodGrant({
    scope: { wildcard: true },
    break_glass: { reason: 'outage triage', invoked_by: 'nolan' },
  }));
  assert.strictEqual(v.valid, false);
});

test('valid break-glass authorizes and emits audit record', () => {
  const audits = [];
  const r = checkGrant(goodGrant({
    break_glass: { reason: 'outage triage', invoked_by: 'nolan' },
  }), req, { onAudit: (a) => audits.push(a) });
  assert.strictEqual(r.authorized, true, r.reason);
  assert.strictEqual(audits.length, 1);
  assert.strictEqual(audits[0].type, 'break_glass_invoked');
  assert.strictEqual(audits[0].invoked_by, 'nolan');
});

test('non-break-glass grant emits no audit', () => {
  const audits = [];
  const r = checkGrant(goodGrant(), req, { onAudit: (a) => audits.push(a) });
  assert.strictEqual(r.authorized, true);
  assert.strictEqual(audits.length, 0);
});

test('capability vocabulary covers the Customer API surface', () => {
  for (const c of ['customer.lookup', 'customer.contact', 'appointment.create', 'quote.follow_up', 'review.request', 'conversation.respond', 'campaign.target']) {
    assert.ok(TENANT_DATA_CAPABILITIES.includes(c), `missing ${c}`);
  }
});

async function main() {
  console.log('=== W5 CAPABILITY tenant-scoped grants ===');
  for (const { name, fn } of _tests) {
    try { await fn(); passed++; console.log(`PASS ${name}`); }
    catch (e) { failed++; console.log(`FAIL ${name}: ${e.message}`); }
  }
  console.log(`=== Summary: ${passed} passed, ${failed} failed ===`);
  process.exit(failed === 0 ? 0 : 1);
}

if (require.main === module) main();
module.exports = { main };
