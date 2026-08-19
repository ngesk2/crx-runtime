// P7: Event Governance Authority
// Machine-readable event ownership policy.
// Validates: namespace, owner, schema, event_class.
// Runtime rejects invalid events — not warns.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { constitutionalTimeAuthority } = require('../authorities/constitutional_time_authority.js');

const NAMESPACE_OWNERS = {
  artifact: 'PING',
  claim: 'PING',
  candidate_claim: 'PING',
  document: 'PING',
  observation: 'PING',
  projection: 'PING',
  replay: 'PING',
  witness: 'PING',
  lineage: 'PING',
  agent: 'PING',
  worker: 'PING',
  tenant: 'PING',
  deployment: 'PING',
  runtime: 'PING',
  capability: 'PING',
  workflow: 'PING',
  context: 'PING',
  system: 'PING',
  event: 'PING',
  hash: 'PING',
  identity: 'PING',
  proof: 'PING',
  scheduler: 'PING',
  diagnostic: 'PING',
  consensus: 'PING',
  merge: 'PING',
  mission: 'PING',
  governance: 'PING',
  ownership: 'PING',
  query: 'PING',
  repair: 'PING',
  rule: 'PING',
  evidence: 'PING',
  execution: 'PING',
  constitutional_ir: 'PING',
  canonical_hash: 'PING',
  canonical_identity: 'PING',
  classification: 'PING',
  recommendation: 'PING',
  citation: 'PING',
  entity: 'PING',
  relationship: 'PING',
  topic: 'PING',
  repository: 'PING',
  file: 'PING',
  snippet: 'PING',
  ai: 'PING',

  // Business namespaces
  customer: 'HPP',
  review: 'HPP',
  lead: 'HPP',
  estimate: 'HPP',
  invoice: 'HPP',
  project: 'HPP',
  email: 'HPP',
  sms: 'HPP',
  google: 'HPP',
  github: 'HPP',
  system: 'HPP',
  worker: 'HPP',
};

class EventGovernance {
  constructor(repoRoot) {
    this._repoRoot = repoRoot;
    this._registry = null;
    this._ownershipPolicy = new Map();
    this._namespacePolicy = new Map();
    this._violations = [];
    this._stats = { total: 0, passed: 0, rejected: 0, violations: {} };
  }

  load() {
    const registryPath = path.join(this._repoRoot, 'gateway', 'generated', 'event_registry.json');
    if (!fs.existsSync(registryPath)) {
      throw new Error(`[EventGovernance] event_registry.json not found`);
    }

    this._registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    this._buildOwnershipPolicy();
    this._buildNamespacePolicy();

    console.log(`[EventGovernance] Loaded ${this._ownershipPolicy.size} ownership rules, ${this._namespacePolicy.size} namespace rules`);
    return this;
  }

  _buildOwnershipPolicy() {
    for (const event of this._registry.events) {
      const namespace = this._extractNamespace(event.event_type);
      this._ownershipPolicy.set(event.event_type, {
        event_type: event.event_type,
        authority_owner: event.authority_owner,
        event_class: event.event_class,
        source: event.source,
        namespace,
        expectedOwner: NAMESPACE_OWNERS[namespace] || 'UNKNOWN',
      });
    }
  }

  _buildNamespacePolicy() {
    const namespaces = new Map();
    for (const [eventType, policy] of this._ownershipPolicy) {
      if (!namespaces.has(policy.namespace)) {
        namespaces.set(policy.namespace, {
          namespace: policy.namespace,
          expectedOwner: policy.expectedOwner,
          eventTypes: [],
        });
      }
      namespaces.get(policy.namespace).eventTypes.push(eventType);
    }
    this._namespacePolicy = namespaces;
  }

  _extractNamespace(eventType) {
    if (eventType.includes('.')) {
      return eventType.split('.')[0].toLowerCase();
    }
    if (eventType.includes('_')) {
      const parts = eventType.split('_');
      if (parts[0] === eventType.split('_')[0].toUpperCase()) {
        return parts[0].toLowerCase();
      }
      return parts[0].toLowerCase();
    }
    return eventType.toLowerCase();
  }

  validateEvent(event) {
    this._stats.total++;

    if (!event || typeof event !== 'object') {
      return this._reject('INVALID_EVENT_OBJECT', 'Event must be a non-null object');
    }

    if (!event.event_type) {
      return this._reject('MISSING_EVENT_TYPE', 'Event must have event_type');
    }

    const policy = this._ownershipPolicy.get(event.event_type);
    if (!policy) {
      return this._reject('UNREGISTERED_EVENT', `Event type '${event.event_type}' is not in the governance policy`);
    }

    if (event.authority_owner && event.authority_owner !== policy.authority_owner) {
      return this._reject('OWNER_MISMATCH', `Event '${event.event_type}' declares owner '${event.authority_owner}' but policy requires '${policy.authority_owner}'`);
    }

    // Canonical privacy boundary (core::<name> | tenant::<id>). Routed here from
    // UnifiedEventRuntime.emit() step 3 — the single choke point. Distinct from the
    // event-type-prefix namespace below (that is the ownership policy, this is the
    // tenant privacy boundary).
    const canonicalNamespace = this._validateCanonicalNamespace(event.namespace);
    if (!canonicalNamespace.valid) {
      return this._reject('INVALID_NAMESPACE', canonicalNamespace.reason);
    }

    const namespaceValid = this._validateNamespace(policy.namespace, event);
    if (!namespaceValid.valid) {
      return this._reject('NAMESPACE_VIOLATION', namespaceValid.reason);
    }

    this._stats.passed++;
    return {
      valid: true,
      policy,
      namespace: policy.namespace,
    };
  }

  _validateNamespace(namespace, event) {
    if (namespace === 'unknown') {
      return { valid: false, reason: `Cannot determine namespace for event '${event.event_type}'` };
    }
    const expectedOwner = NAMESPACE_OWNERS[namespace];
    if (!expectedOwner) {
      return { valid: false, reason: `No owner defined for namespace '${namespace}'` };
    }
    return { valid: true };
  }

  _validateCanonicalNamespace(namespace) {
    if (namespace === undefined || namespace === null) {
      return { valid: true };
    }
    if (typeof namespace !== 'string' || !/^(core|tenant)::[a-zA-Z0-9_-]+$/.test(namespace)) {
      return {
        valid: false,
        reason: `Invalid canonical namespace '${namespace}' (must be core::<name> or tenant::<id>)`,
      };
    }
    return { valid: true };
  }

  _reject(code, reason) {
    this._stats.rejected++;
    this._stats.violations[code] = (this._stats.violations[code] || 0) + 1;
    this._violations.push({ code, reason, timestamp: constitutionalTimeAuthority.nowAsISOString() });
    return { valid: false, errors: [reason], code };
  }

  getOwnershipPolicy() {
    return Array.from(this._ownershipPolicy.values());
  }

  getNamespacePolicy() {
    return Array.from(this._namespacePolicy.values());
  }

  getViolations(limit = 50) {
    return this._violations.slice(-limit);
  }

  getStats() {
    return { ...this._stats };
  }

  getPolicyForEvent(eventType) {
    return this._ownershipPolicy.get(eventType) || null;
  }

  getEventsForNamespace(namespace) {
    const ns = this._namespacePolicy.get(namespace);
    return ns ? ns.eventTypes : [];
  }

  getHash() {
    const entries = Array.from(this._ownershipPolicy.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return crypto.createHash('sha256').update(JSON.stringify(entries)).digest('hex');
  }
}

module.exports = { EventGovernance, NAMESPACE_OWNERS };
