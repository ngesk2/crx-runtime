'use strict';
/**
 * T1 unit tests — tenant capability grant validation.
 *
 * WHAT INVARIANT? Grants authorize least-privilege operational access only:
 *   unknown capabilities, non-operational purposes, SYSTEM_LEARNING data,
 *   missing scope, bad tenant, bad expiry all fail closed; break-glass is
 *   explicit, time-bounded (<=15min), scoped, and audited.
 * WHO OWNS IT? validateGrant / checkGrant
 *   (ping-runtime/runtime/tenant_capability_grant.js — a typed boundary,
 *   explicitly NOT an authority).
 * HOW CAN IT FAIL? A purpose allowlist hole, wildcard scope accepted,
 *   break-glass without audit, expiry in the past accepted.
 * WHAT ATTACK DISPROVES IT? Adversarial grant shapes across the schema.
 * WHAT EVIDENCE PROVES IT? Deterministic unit cases below.
 * CAN IT BE REPLAYED? Yes.
 * DOES THE FAILURE BECOME PERMANENT REGRESSION KNOWLEDGE? Yes, BUG- ledger.
 * WHY CAN EXISTING RUNNER + LIBRARY + EXISTING PING AUTHORITY NOT EXPRESS THIS?
 *   node:test alone suffices; pure function, fixed cases.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  validateGrant, checkGrant, BREAK_GLASS_MAX_TTL_MS,
} = require('../../ping-runtime/runtime/tenant_capability_grant.js');

const GOOD = {
  capability: 'customer.lookup',
  principal: 'worker:comms-1',
  tenant: 'acme',
  scope: { customer_id: 'c-1' },
  purpose: 'customer_service',
  expiry: new Date(Date.now() + 3600e3).toISOString(),
  data_class: 'TASK_EPHEMERAL',
};

describe('tenant capability grant validation (unit)', () => {
  it('accepts a well-formed operational grant', () => {
    assert.deepEqual(validateGrant(GOOD), { valid: true, errors: [] });
    const r = checkGrant(GOOD, { capability: 'customer.lookup', tenant: 'acme', purpose: 'customer_service' });
    assert.equal(r.authorized, true);
  });

  it('rejects unknown capability, non-operational purpose, learning data class', () => {
    assert.equal(validateGrant({ ...GOOD, capability: 'db.drop' }).valid, false);
    assert.equal(validateGrant({ ...GOOD, purpose: 'model_training' }).valid, false);
    assert.equal(validateGrant({ ...GOOD, data_class: 'SYSTEM_LEARNING' }).valid, false);
  });

  it('rejects missing scope, bad tenant, bad expiry, missing principal', () => {
    assert.equal(validateGrant({ ...GOOD, scope: undefined }).valid, false);
    assert.equal(validateGrant({ ...GOOD, tenant: 'not a tenant!!' }).valid, false);
    assert.equal(validateGrant({ ...GOOD, expiry: 'yesterday' }).valid, false);
    assert.equal(validateGrant({ ...GOOD, principal: '' }).valid, false);
  });

  it('expired grants deny at check time', () => {
    const expired = { ...GOOD, expiry: new Date(Date.now() - 1000).toISOString() };
    const r = checkGrant(expired, { capability: GOOD.capability, tenant: GOOD.tenant, purpose: GOOD.purpose });
    assert.equal(r.authorized, false);
    assert.match(r.reason, /expired/);
  });

  it('tenant/capability/purpose mismatch denies', () => {
    for (const req of [
      { capability: 'appointment.create', tenant: 'acme', purpose: 'customer_service' },
      { capability: 'customer.lookup', tenant: 'other', purpose: 'customer_service' },
      { capability: 'customer.lookup', tenant: 'acme', purpose: 'billing_support' },
    ]) {
      assert.equal(checkGrant(GOOD, req).authorized, false, JSON.stringify(req));
    }
  });

  it('break-glass requires reason, invoker, bounded TTL, and audits', () => {
    const bg = {
      ...GOOD,
      expiry: new Date(Date.now() + 10 * 60e3).toISOString(), // break-glass TTL max is 15 min
      break_glass: { reason: 'outage', invoked_by: 'nolan' },
    };
    assert.equal(validateGrant(bg).valid, true);
    assert.equal(BREAK_GLASS_MAX_TTL_MS, 15 * 60 * 1000);
    const audits = [];
    const r = checkGrant(bg,
      { capability: GOOD.capability, tenant: GOOD.tenant, purpose: GOOD.purpose },
      { onAudit: (a) => audits.push(a) });
    assert.equal(r.authorized, true);
    assert.equal(audits.length, 1);
    assert.equal(audits[0].principal, GOOD.principal);
    assert.equal(validateGrant({ ...bg, break_glass: { reason: '', invoked_by: 'nolan' } }).valid, false);
    assert.equal(validateGrant({ ...GOOD, break_glass: { reason: 'outage', invoked_by: 'nolan' } }).valid, false,
      '1-hour expiry must fail the 15-min break-glass TTL');
  });
});
