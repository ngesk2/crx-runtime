/**
 * W9 FEEDBACK-CONTRACT — the narrow typed boundary between TenantOS business
 * truth and PING execution/learning. Blessed by Nolan 2026-09-25 as the
 * explicit exception to "no new architecture."
 *
 * Pipeline (MAXIMIZE direction: observe richly, learn in reduced form):
 *
 *   RAW OBSERVATION {source, tenant, purpose, classification, retention_policy,
 *                    consent_basis, provenance}
 *     -> TENANT-PRIVATE CANONICAL EVENT (full fidelity, tenant_id immutable)
 *     -> three branches:
 *        A. TASK-EPHEMERAL VIEW: purpose-limited field projection for a
 *           provider/tool call -> receipt {exposed_fields, to, at, expiry}
 *        B. TENANT KNOWLEDGE: tenant-scoped memory/playbooks (never leaves)
 *        C. LEARNING GATE -> SYSTEM LEARNING:
 *           identity reduction (deterministic minimizer) ->
 *           aggregation threshold (>=10 independent tenants) ->
 *           materiality check -> provenance retained
 *
 * Layered taxonomy (Nolan 2026-09-25):
 *   data_class: what a datum IS — PII, CUSTOMER_CONTENT, BUSINESS_CONFIDENTIAL,
 *     OPERATIONAL, DERIVED, AGGREGATE, PUBLIC
 *   handling_class: how it may be HANDLED — PUBLIC, TENANT_PRIVATE,
 *     TASK_EPHEMERAL, SYSTEM_LEARNING
 *   UNKNOWN handling defaults to TENANT_PRIVATE (fail closed).
 *
 * This is not an authority and not a database. It rides the existing event
 * architecture: contracts are validated here, transformations are pure
 * functions, and the resulting learning records flow through
 * UnifiedEventRuntime as ordinary tenant-scoped events.
 */
'use strict';

const crypto = require('crypto');

const TENANT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{0,63}$/;

// Seven data classes: what a datum IS.
const DATA_CLASSES = Object.freeze([
  'PII', 'CUSTOMER_CONTENT', 'BUSINESS_CONFIDENTIAL',
  'OPERATIONAL', 'DERIVED', 'AGGREGATE', 'PUBLIC',
]);

// Four operational classes: how a datum may be HANDLED.
const HANDLING_CLASSES = Object.freeze([
  'PUBLIC', 'TENANT_PRIVATE', 'TASK_EPHEMERAL', 'SYSTEM_LEARNING',
]);

const DEFAULT_HANDLING = 'TENANT_PRIVATE';

// Operational purposes for crossings (mirrors tenant_capability_grant.js).
const CROSSING_PURPOSES = Object.freeze([
  'customer_service', 'scheduling', 'fulfillment', 'billing_support',
  'safety', 'security_incident',
  'learn_response_time', 'learn_booking_pattern', 'learn_followup_timing',
  'learn_acquisition_source', 'learn_owner_correction', 'learn_site_composition',
]);

// Direct identifier fields the deterministic minimizer always strips.
const DIRECT_IDENTIFIERS = Object.freeze([
  'name', 'first_name', 'last_name', 'full_name',
  'phone', 'phone_number', 'mobile',
  'email', 'email_address',
  'address', 'street_address', 'street', 'city', 'zip', 'postal_code',
  'customer_id', 'external_customer_id',
]);

const AGGREGATION_FLOOR = 10;

function isValidTenantId(t) {
  return typeof t === 'string' && TENANT_ID_PATTERN.test(t);
}

/**
 * Classify a datum into the layered taxonomy.
 * UNKNOWN handling_class defaults to TENANT_PRIVATE (fail closed).
 */
function classify(dataClass, handlingClass) {
  if (dataClass !== undefined && dataClass !== null && !DATA_CLASSES.includes(dataClass)) {
    return { valid: false, error: `unknown data_class: ${dataClass}` };
  }
  let handling = handlingClass;
  if (handling === undefined || handling === null || handling === 'UNKNOWN') {
    handling = DEFAULT_HANDLING;
  }
  if (!HANDLING_CLASSES.includes(handling)) {
    return { valid: false, error: `unknown handling_class: ${handlingClass}` };
  }
  return { valid: true, data_class: dataClass || null, handling_class: handling };
}

/**
 * Validate a raw observation at ingestion. Provenance and retention metadata
 * are required (immediate control #4): an observation without them is
 * rejected, not defaulted.
 */
function validateObservation(obs) {
  const errors = [];
  if (!obs || typeof obs !== 'object') return { valid: false, errors: ['observation must be an object'] };
  if (typeof obs.source !== 'string' || !obs.source) errors.push('source is required');
  if (!isValidTenantId(obs.tenant)) errors.push(`invalid tenant: ${obs.tenant}`);
  if (!CROSSING_PURPOSES.includes(obs.purpose)) errors.push(`unknown purpose: ${obs.purpose}`);
  const c = classify(obs.data_class, obs.handling_class);
  if (!c.valid) errors.push(c.error);
  if (typeof obs.retention_policy !== 'string' || !obs.retention_policy) errors.push('retention_policy is required');
  if (typeof obs.consent_basis !== 'string' || !obs.consent_basis) errors.push('consent_basis is required');
  if (typeof obs.provenance !== 'string' || !obs.provenance) errors.push('provenance is required');
  return { valid: errors.length === 0, errors };
}

/**
 * Validate a FeedbackContract.
 * contract: { purpose, source_refs, permitted_fields, transformation,
 *             retention_class, output_schema, min_tenants, buckets, branch }
 * branch: 'learning' (default, strict) or 'task_ephemeral' (operational).
 * Direct identifiers are banned from permitted_fields on the LEARNING branch
 * (identity reduction); the TASK-EPHEMERAL branch may carry identifiers for
 * a purpose-limited provider/tool call, but must declare ephemeral retention
 * and always produces an expiry receipt.
 */
function validateContract(contract) {
  const errors = [];
  if (!contract || typeof contract !== 'object') return { valid: false, errors: ['contract must be an object'] };
  const branch = contract.branch || 'learning';
  if (branch !== 'learning' && branch !== 'task_ephemeral') {
    errors.push(`unknown branch: ${branch}`);
  }
  if (!CROSSING_PURPOSES.includes(contract.purpose)) errors.push(`unknown purpose: ${contract.purpose}`);
  if (!Array.isArray(contract.source_refs) || contract.source_refs.length === 0) {
    errors.push('source_refs must be a non-empty array');
  }
  if (!Array.isArray(contract.permitted_fields) || contract.permitted_fields.length === 0) {
    errors.push('permitted_fields must be a non-empty array (minimized view)');
  }
  if (branch === 'learning') {
    for (const f of contract.permitted_fields) {
      if (DIRECT_IDENTIFIERS.includes(f)) {
        errors.push(`permitted_fields must not contain direct identifier: ${f}`);
      }
    }
  } else {
    // Task-ephemeral: identifiers allowed only with declared ephemeral retention.
    if (!/ephemeral/i.test(contract.retention_class || '')) {
      errors.push('task_ephemeral contracts must declare ephemeral retention_class');
    }
  }
  if (typeof contract.transformation !== 'string' || !contract.transformation) {
    errors.push('transformation is required (named, versioned transform)');
  }
  if (typeof contract.retention_class !== 'string' || !contract.retention_class) {
    errors.push('retention_class is required');
  }
  if (typeof contract.output_schema !== 'string' || !contract.output_schema) {
    errors.push('output_schema is required');
  }
  const minT = contract.min_tenants === undefined ? AGGREGATION_FLOOR : contract.min_tenants;
  if (!Number.isInteger(minT) || minT < AGGREGATION_FLOOR) {
    errors.push(`min_tenants must be an integer >= ${AGGREGATION_FLOOR} (aggregation floor)`);
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Tenant-keyed HMAC pseudonym. Never a global customer identifier:
 * the same customer in two tenants yields unrelated pseudonyms.
 * Key management (rotation, storage) is an operator decision; the key is
 * injected, never invented here.
 */
function pseudonym(customerRef, tenantId, hmacKey) {
  if (!isValidTenantId(tenantId)) throw new Error('pseudonym: invalid tenant');
  if (typeof hmacKey !== 'string' || hmacKey.length < 16) {
    throw new Error('pseudonym: hmacKey must be a string of at least 16 chars');
  }
  return 'psm_' + crypto.createHmac('sha256', `tenant:${tenantId}:${hmacKey}`)
    .update(String(customerRef))
    .digest('hex').slice(0, 24);
}

/**
 * Deterministic minimizer: RAW -> identity-reduced learning record.
 * Keeps only permitted_fields, strips direct identifiers, buckets numerics
 * per contract.buckets, replaces customer refs with tenant-keyed pseudonyms.
 * Returns { record, crossing } where crossing is the purpose record for
 * the transformation (immediate control #3).
 */
function minimize(observation, contract, opts = {}) {
  const cv = validateContract(contract);
  if (!cv.valid) throw new Error(`minimize: invalid contract: ${cv.errors.join('; ')}`);
  const ov = validateObservation(observation);
  if (!ov.valid) throw new Error(`minimize: invalid observation: ${ov.errors.join('; ')}`);

  const fields = observation.fields || {};
  const record = {};
  const dropped = [];
  for (const f of contract.permitted_fields) {
    if (Object.prototype.hasOwnProperty.call(fields, f)) {
      let v = fields[f];
      // Bucketing: contract.buckets = { field: [[max, label], ...] }.
      const buckets = (contract.buckets || {})[f];
      if (buckets && typeof v === 'number') {
        const hit = buckets.find(([max]) => v <= max);
        v = hit ? hit[1] : 'above_max';
      }
      record[f] = v;
    }
  }
  for (const f of Object.keys(fields)) {
    if (!contract.permitted_fields.includes(f)) dropped.push(f);
  }
  // Customer reference -> tenant-keyed pseudonym (never the raw ref).
  if (fields.customer_ref && opts.hmacKey) {
    record.subject = pseudonym(fields.customer_ref, observation.tenant, opts.hmacKey);
  }

  const crossing = {
    purpose: contract.purpose,
    source_refs: contract.source_refs,
    tenant: observation.tenant,
    fields_in: Object.keys(fields),
    fields_out: Object.keys(record),
    fields_dropped: dropped,
    transformation: contract.transformation,
    policy_version: opts.policy_version || '1.0.0',
    transform_version: opts.transform_version || '1.0.0',
    at: new Date().toISOString(),
  };
  return { record, crossing };
}

/**
 * Aggregation gate: a batch of minimized records may become SYSTEM_LEARNING
 * only when >= min_tenants independent tenants contribute. Suppresses
 * uniquely identifying slices: any output dimension value that traces to a
 * single tenant is dropped.
 */
function aggregationGate(records, contract) {
  const cv = validateContract(contract);
  if (!cv.valid) throw new Error(`aggregationGate: invalid contract: ${cv.errors.join('; ')}`);
  const minT = contract.min_tenants === undefined ? AGGREGATION_FLOOR : contract.min_tenants;
  const tenants = new Set(records.map(r => r.tenant));
  if (tenants.size < minT) {
    return {
      admitted: false,
      reason: `aggregation floor not met: ${tenants.size} tenants < ${minT}`,
      tenants: tenants.size,
    };
  }
  // Suppress single-tenant slices: count tenants per dimension value.
  const suppressed = [];
  const admitted = records.filter(r => {
    // A record attributable to a tenant that is the SOLE contributor of its
    // outcome slice is suppressed. Conservative: keep records whose
    // (outcome) value appears from >= 2 tenants.
    return true;
  });
  const outcomeTenants = new Map();
  for (const r of admitted) {
    const key = JSON.stringify(r.record);
    if (!outcomeTenants.has(key)) outcomeTenants.set(key, new Set());
    outcomeTenants.get(key).add(r.tenant);
  }
  const final = [];
  for (const r of admitted) {
    const key = JSON.stringify(r.record);
    if (outcomeTenants.get(key).size < 2) {
      suppressed.push({ tenant: r.tenant, reason: 'single-tenant slice' });
    } else {
      final.push(r);
    }
  }
  return { admitted: true, records: final, suppressed, tenants: tenants.size };
}

/**
 * TASK-EPHEMERAL VIEW (branch A): purpose-limited projection of a
 * tenant-private event for a provider/tool call. Returns { view, receipt }.
 * The receipt records what was exposed, to whom, when, and when it expires.
 * The caller must discard the view after use (expiry) and record only
 * non-PII evidence.
 */
function taskEphemeralView(event, contract, opts = {}) {
  const cv = validateContract(contract);
  if (!cv.valid) throw new Error(`taskEphemeralView: invalid contract: ${cv.errors.join('; ')}`);
  if (!event || event.tenant_id === undefined) throw new Error('taskEphemeralView: event with tenant_id required');
  const view = {};
  const payload = event.payload || {};
  for (const f of contract.permitted_fields) {
    if (Object.prototype.hasOwnProperty.call(payload, f)) view[f] = payload[f];
  }
  const at = Date.now();
  const ttlMs = opts.ttl_ms || 15 * 60 * 1000;
  const receipt = {
    purpose: contract.purpose,
    tenant: event.tenant_id,
    event_id: event.event_id,
    exposed_fields: Object.keys(view),
    to: opts.to || 'provider/tool',
    at: new Date(at).toISOString(),
    expires_at: new Date(at + ttlMs).toISOString(),
    transformation: contract.transformation,
  };
  return { view, receipt };
}

module.exports = {
  DATA_CLASSES,
  HANDLING_CLASSES,
  CROSSING_PURPOSES,
  DIRECT_IDENTIFIERS,
  AGGREGATION_FLOOR,
  DEFAULT_HANDLING,
  isValidTenantId,
  classify,
  validateObservation,
  validateContract,
  pseudonym,
  minimize,
  aggregationGate,
  taskEphemeralView,
};
