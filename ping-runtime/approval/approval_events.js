/**
 * Approval Events — canonical human-approval event vocabulary.
 *
 * Forensics fix (2026-09-30, "forensics fix it", items 3): the durable
 * human-approval record. Nolan's approval law is operator action today;
 * these types make the proposal and the decision durable `ping_events`
 * rows on the existing spine.
 *
 * This module is VOCABULARY, not authority:
 * - There is NO ApprovalAuthority (NONE-BY-DESIGN). The human operator is
 *   the approval authority by standing directive; this module only records
 *   what was proposed and what was decided.
 * - BusinessActionAuthority / EffectAuthority
 *   (ping-runtime/approval/business_action_authority.js,
 *   ping-runtime/approval/effect_authority.js) are UNWIRED in-memory
 *   classes (forensics P10/L5 recon-f). They are NOT used here and are NOT
 *   wired by this module. Do not wire them here.
 * - Every record goes through the SINGLE existing emit() choke point
 *   (UnifiedEventRuntime.emit). This module never touches persistence,
 *   identity minting, or the registry directly.
 * - NO EFFECT_* event types are defined here: zero EFFECT_* vocabulary
 *   exists in the runtime (verified 2026-09-30), so the effect lifecycle
 *   is design-only and inventing EFFECT_* events would fabricate a
 *   lifecycle that does not exist.
 *
 * Redaction: this module performs NO redaction of its own. Payloads pass
 * through emit(), where the emit-path redaction choke point (Interval 10
 * T06, unified_event_runtime.js — owned by another lane, DO NOT EDIT)
 * applies. When T06 lands, these event types inherit redaction
 * automatically because they ride the same choke point.
 *
 * Registry: PROPOSED_ACTION / ACTION_APPROVED / REJECTED are registered in
 * gateway/generated/event_generator.js `_productionEvents()`
 * (authority_owner 'Operator') and the governance namespaces
 * proposed/action/rejected are owned by PING in
 * ping-runtime/events/event_governance.js.
 */

// Canonical approval event types (forensics §1 row 10 / §2 arrow 13).
const APPROVAL_EVENT_TYPES = Object.freeze({
  PROPOSED_ACTION: 'PROPOSED_ACTION',
  ACTION_APPROVED: 'ACTION_APPROVED',
  REJECTED: 'REJECTED',
});

// Emit source for approval records. The operator is the human-approval
// authority by standing directive; the source string records who decided.
const APPROVAL_SOURCE = 'operator';

// Decision literals accepted by recordDecision().
const DECISIONS = Object.freeze(['APPROVED', 'REJECTED']);

function _requireRuntime(eventRuntime) {
  if (!eventRuntime || typeof eventRuntime.emit !== 'function') {
    throw new Error('[approval_events] eventRuntime with emit() is required');
  }
}

function _requireString(value, name) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`[approval_events] ${name} (non-empty string) is required`);
  }
  return value;
}

/**
 * Record that an action was PROPOSED for human approval.
 *
 * @param {object} eventRuntime — UnifiedEventRuntime instance (emit choke point)
 * @param {object} action — { actionId, capability, targetIdentity?, preview?,
 *   reason?, evidenceRefs?, risk?, proposedBy?, expiresAt? }
 * @param {object} [options] — { causationId?, correlationId?, namespace?,
 *   tenantId?, metadata? } passed through to emit()
 * @returns {Promise<{status, eventId, event}>} the emit() result
 */
async function recordProposedAction(eventRuntime, action, options = {}) {
  _requireRuntime(eventRuntime);
  if (!action || typeof action !== 'object') {
    throw new Error('[approval_events] action object is required');
  }
  const actionId = _requireString(action.actionId, 'action.actionId');
  const capability = _requireString(action.capability, 'action.capability');

  const payload = {
    action_id: actionId,
    capability,
    target_identity: action.targetIdentity || null,
    preview: action.preview || null,
    reason: action.reason || null,
    evidence_refs: Array.isArray(action.evidenceRefs) ? action.evidenceRefs : [],
    risk: action.risk || 'medium',
    proposed_by: action.proposedBy || APPROVAL_SOURCE,
    expires_at: action.expiresAt || null,
  };

  // logical_id makes re-recording the same proposal idempotent: the spine
  // mints a deterministic event_id, and ON CONFLICT DO NOTHING absorbs
  // the duplicate. Payload differences with the same logical_id fail
  // closed at the spine (event ID collision), never silently overwrite.
  return eventRuntime.emit(APPROVAL_EVENT_TYPES.PROPOSED_ACTION, APPROVAL_SOURCE, payload, {
    logical_id: `approval:${actionId}:proposed`,
    causation_id: options.causationId || null,
    correlation_id: options.correlationId,
    namespace: options.namespace,
    tenant_id: options.tenantId,
    metadata: options.metadata,
  });
}

/**
 * Record a human DECISION on a proposed action (APPROVED or REJECTED).
 *
 * @param {object} eventRuntime — UnifiedEventRuntime instance (emit choke point)
 * @param {object} decision — { actionId, decision: 'APPROVED'|'REJECTED',
 *   decidedBy, reason?, proposedActionEventId? }
 * @param {object} [options] — { causationId?, correlationId?, namespace?,
 *   tenantId?, metadata? } passed through to emit()
 * @returns {Promise<{status, eventId, event}>} the emit() result
 */
async function recordDecision(eventRuntime, decision, options = {}) {
  _requireRuntime(eventRuntime);
  if (!decision || typeof decision !== 'object') {
    throw new Error('[approval_events] decision object is required');
  }
  const actionId = _requireString(decision.actionId, 'decision.actionId');
  _requireString(decision.decidedBy, 'decision.decidedBy');
  if (!DECISIONS.includes(decision.decision)) {
    throw new Error(
      `[approval_events] decision.decision must be one of ${DECISIONS.join(', ')} (got '${decision.decision}')`
    );
  }

  const eventType = decision.decision === 'APPROVED'
    ? APPROVAL_EVENT_TYPES.ACTION_APPROVED
    : APPROVAL_EVENT_TYPES.REJECTED;

  const payload = {
    action_id: actionId,
    decision: decision.decision,
    decided_by: decision.decidedBy,
    reason: decision.reason || null,
  };

  return eventRuntime.emit(eventType, APPROVAL_SOURCE, payload, {
    logical_id: `approval:${actionId}:decision`,
    // Lineage: the decision is caused by the proposal. Prefer the explicit
    // proposal event id recorded by recordProposedAction's caller.
    causation_id: options.causationId || decision.proposedActionEventId || null,
    correlation_id: options.correlationId,
    namespace: options.namespace,
    tenant_id: options.tenantId,
    metadata: options.metadata,
  });
}

module.exports = {
  APPROVAL_EVENT_TYPES,
  APPROVAL_SOURCE,
  DECISIONS,
  recordProposedAction,
  recordDecision,
};
