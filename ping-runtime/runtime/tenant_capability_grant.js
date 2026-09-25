/**
 * W5 CAPABILITY — Tenant-scoped capability grant check.
 *
 * The smallest typed boundary for TenantOS Customer API capabilities
 * (principle 6). This is NOT an authority: it validates grant objects against
 * a fixed schema and fixed capability/purpose vocabularies. Grant issuance
 * belongs to the TenantOS Customer API (future); enforcement of
 * operational-vs-learning separation belongs here.
 *
 * A grant:
 *   {
 *     capability,  // one of TENANT_DATA_CAPABILITIES
 *     principal,   // worker/agent identity the grant is issued to
 *     tenant,      // tenant the grant is scoped to (must match the op)
 *     scope,       // least-privilege filter, e.g. { customer_id } or { fields: [...] }
 *     purpose,     // OPERATIONAL_PURPOSES only — learning purposes are rejected
 *     expiry,      // ISO timestamp; grant invalid after
 *     data_class,  // must be TASK_EPHEMERAL for data access grants
 *     break_glass, // optional: { reason, invoked_by } — see below
 *   }
 *
 * Break-glass (Nolan 2026-09-25): explicit invocation, time-bounded
 * (max 15 minutes), least-privilege (scope required, never wildcard),
 * auditable (invocation must be recorded by the caller via onAudit).
 * A break-glass grant NEVER authorizes learning use.
 *
 * Data-constitution mapping:
 *   - operational access != learning access (principle 5): purpose allowlist
 *     contains operational purposes only; SYSTEM_LEARNING data_class rejected.
 *   - TASK_EPHEMERAL discipline: grants authorize temporary exposure; the
 *     caller must discard the execution copy and record only non-PII evidence.
 */
'use strict';

const TENANT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{0,63}$/;

// Tenant Data Capabilities — the Customer API surface TenantOS exposes.
// PING agents never get broad SQL; they get these, scoped.
const TENANT_DATA_CAPABILITIES = Object.freeze([
  'customer.lookup',
  'customer.contact',
  'appointment.create',
  'appointment.read',
  'quote.follow_up',
  'review.request',
  'conversation.respond',
  'campaign.target',
]);

// Operational purposes only. Analytics/learning purposes are NOT grantable
// here: learning flows through the FeedbackContract (W9), never through
// operational data access.
const OPERATIONAL_PURPOSES = Object.freeze([
  'customer_service',
  'scheduling',
  'fulfillment',
  'billing_support',
  'safety',
  'security_incident',
]);

// Four operational classes (Nolan 2026-09-25 CEO direction): PUBLIC,
// TENANT_PRIVATE, TASK_EPHEMERAL, SYSTEM_LEARNING. Operational data access
// grants are TASK_EPHEMERAL only.
const OPERATIONAL_DATA_CLASS = 'TASK_EPHEMERAL';

const BREAK_GLASS_MAX_TTL_MS = 15 * 60 * 1000;

function isValidTenantId(t) {
  return typeof t === 'string' && TENANT_ID_PATTERN.test(t);
}

/**
 * Validate a grant object's shape and values.
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateGrant(grant) {
  const errors = [];
  if (!grant || typeof grant !== 'object') return { valid: false, errors: ['grant must be an object'] };

  if (!TENANT_DATA_CAPABILITIES.includes(grant.capability)) {
    errors.push(`unknown capability: ${grant.capability}`);
  }
  if (typeof grant.principal !== 'string' || grant.principal.length === 0) {
    errors.push('principal is required');
  }
  if (!isValidTenantId(grant.tenant)) {
    errors.push(`invalid tenant: ${grant.tenant}`);
  }
  if (!OPERATIONAL_PURPOSES.includes(grant.purpose)) {
    errors.push(`purpose not operational-grantable: ${grant.purpose}`);
  }
  if (!grant.scope || typeof grant.scope !== 'object') {
    errors.push('scope is required (least privilege; never wildcard)');
  }
  const expiryMs = Date.parse(grant.expiry);
  if (!Number.isFinite(expiryMs)) {
    errors.push(`invalid expiry: ${grant.expiry}`);
  }
  if (grant.data_class !== OPERATIONAL_DATA_CLASS) {
    errors.push(`data_class must be ${OPERATIONAL_DATA_CLASS} for operational access (got ${grant.data_class})`);
  }

  // Break-glass constraints.
  if (grant.break_glass) {
    const bg = grant.break_glass;
    if (typeof bg.reason !== 'string' || bg.reason.length === 0) {
      errors.push('break_glass.reason is required (explicit invocation)');
    }
    if (typeof bg.invoked_by !== 'string' || bg.invoked_by.length === 0) {
      errors.push('break_glass.invoked_by is required (auditable)');
    }
    if (Number.isFinite(expiryMs) && expiryMs - Date.now() > BREAK_GLASS_MAX_TTL_MS) {
      errors.push(`break_glass grant exceeds max TTL of 15 minutes`);
    }
    if (grant.scope && grant.scope.wildcard === true) {
      errors.push('break_glass scope must be least-privilege (wildcard forbidden)');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check a grant against a requested action.
 * @param {object} grant
 * @param {{ capability: string, tenant: string, purpose: string }} request
 * @param {{ now?: number, onAudit?: (record: object) => void }} opts
 * @returns {{ authorized: boolean, reason: string }}
 */
function checkGrant(grant, request, opts = {}) {
  const now = opts.now || Date.now();
  const v = validateGrant(grant);
  if (!v.valid) return { authorized: false, reason: `invalid grant: ${v.errors.join('; ')}` };
  if (Date.parse(grant.expiry) <= now) return { authorized: false, reason: 'grant expired' };
  if (grant.capability !== request.capability) {
    return { authorized: false, reason: `capability mismatch: grant=${grant.capability} request=${request.capability}` };
  }
  if (grant.tenant !== request.tenant) {
    return { authorized: false, reason: `tenant mismatch: grant=${grant.tenant} request=${request.tenant}` };
  }
  if (grant.purpose !== request.purpose) {
    return { authorized: false, reason: `purpose mismatch: grant=${grant.purpose} request=${request.purpose}` };
  }
  if (grant.break_glass && typeof opts.onAudit === 'function') {
    opts.onAudit({
      type: 'break_glass_invoked',
      capability: grant.capability,
      principal: grant.principal,
      tenant: grant.tenant,
      purpose: grant.purpose,
      reason: grant.break_glass.reason,
      invoked_by: grant.break_glass.invoked_by,
      at: new Date(now).toISOString(),
    });
  }
  return { authorized: true, reason: 'ok' };
}

module.exports = {
  TENANT_DATA_CAPABILITIES,
  OPERATIONAL_PURPOSES,
  OPERATIONAL_DATA_CLASS,
  BREAK_GLASS_MAX_TTL_MS,
  isValidTenantId,
  validateGrant,
  checkGrant,
};
