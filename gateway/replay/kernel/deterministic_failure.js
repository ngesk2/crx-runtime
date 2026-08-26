"use strict";
/**
 * DETERMINISTIC FAILURE
 *
 * Pure TypeScript implementation of deterministic failure envelopes.
 *
 * Requirements:
 * - deterministic failure surfaces
 * - no runtime-dependent error messages
 * - constitutional failure codes
 * - structured failure context
 * - no infrastructure dependencies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeterministicFailureFactory = exports.ReplayPhase = exports.FailureCode = void 0;
var FailureCode;
(function (FailureCode) {
    // Parent existence failures
    FailureCode["PARENT_NOT_FOUND"] = "PARENT_NOT_FOUND";
    FailureCode["PARENT_EVENT_NOT_FOUND"] = "PARENT_EVENT_NOT_FOUND";
    // Duplicate detection failures
    FailureCode["DUPLICATE_EVENT_ID"] = "DUPLICATE_EVENT_ID";
    FailureCode["DUPLICATE_ARTIFACT_ID"] = "DUPLICATE_ARTIFACT_ID";
    // Lineage structure failures
    FailureCode["INVALID_LINEAGE_STRUCTURE"] = "INVALID_LINEAGE_STRUCTURE";
    FailureCode["INVALID_LINEAGE_PARENT_TYPE"] = "INVALID_LINEAGE_PARENT_TYPE";
    FailureCode["LINEAGE_NAMESPACE_VIOLATION"] = "LINEAGE_NAMESPACE_VIOLATION";
    // Payload structure failures
    FailureCode["INVALID_PAYLOAD_STRUCTURE"] = "INVALID_PAYLOAD_STRUCTURE";
    // Event type failures
    FailureCode["UNKNOWN_EVENT_TYPE"] = "UNKNOWN_EVENT_TYPE";
    // Merkle tree failures
    FailureCode["DUPLICATE_LEAF_ID"] = "DUPLICATE_LEAF_ID";
    FailureCode["EXECUTION_LIMIT_EXCEEDED"] = "EXECUTION_LIMIT_EXCEEDED";
    // Canonicalization failures
    FailureCode["CANONICALIZATION_ERROR"] = "CANONICALIZATION_ERROR";
    // Invariant failures
    FailureCode["INVARIANT_VIOLATION"] = "INVARIANT_VIOLATION";
    FailureCode["CYCLE_DETECTED"] = "CYCLE_DETECTED";
    FailureCode["FORBIDDEN_EDGE_DETECTED"] = "FORBIDDEN_EDGE_DETECTED";
    // General failures
    FailureCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
})(FailureCode || (exports.FailureCode = FailureCode = {}));
var ReplayPhase;
(function (ReplayPhase) {
    ReplayPhase["STATE_TRANSITION"] = "STATE_TRANSITION";
    ReplayPhase["LINEAGE_VALIDATION"] = "LINEAGE_VALIDATION";
    ReplayPhase["CANONICALIZATION"] = "CANONICALIZATION";
    ReplayPhase["WITNESS_GENERATION"] = "WITNESS_GENERATION";
    ReplayPhase["INVARIANT_CHECK"] = "INVARIANT_CHECK";
    ReplayPhase["MERKLE_CONSTRUCTION"] = "MERKLE_CONSTRUCTION";
})(ReplayPhase || (exports.ReplayPhase = ReplayPhase = {}));
class DeterministicFailureFactory {
    /**
     * Create deterministic failure envelope
     */
    static create(code, replayPhase, context, timestamp) {
        return {
            code,
            replay_phase: replayPhase,
            context,
            timestamp: timestamp || 'REPLAY_DETERMINISTIC_TIMESTAMP'
        };
    }
    /**
     * Parent not found failure
     */
    static parentNotFound(parentId) {
        return this.create(FailureCode.PARENT_NOT_FOUND, ReplayPhase.STATE_TRANSITION, { parent_id: parentId });
    }
    /**
     * Parent event not found failure
     */
    static parentEventNotFound(parentEventId) {
        return this.create(FailureCode.PARENT_EVENT_NOT_FOUND, ReplayPhase.STATE_TRANSITION, { parent_event_id: parentEventId });
    }
    /**
     * Duplicate event ID failure
     */
    static duplicateEventId(eventId) {
        return this.create(FailureCode.DUPLICATE_EVENT_ID, ReplayPhase.STATE_TRANSITION, { event_id: eventId });
    }
    /**
     * Duplicate artifact ID failure
     */
    static duplicateArtifactId(artifactId) {
        return this.create(FailureCode.DUPLICATE_ARTIFACT_ID, ReplayPhase.STATE_TRANSITION, { artifact_id: artifactId });
    }
    /**
     * Invalid lineage structure failure
     */
    static invalidLineageStructure() {
        return this.create(FailureCode.INVALID_LINEAGE_STRUCTURE, ReplayPhase.LINEAGE_VALIDATION, {});
    }
    /**
     * Invalid lineage parent type failure
     */
    static invalidLineageParentType() {
        return this.create(FailureCode.INVALID_LINEAGE_PARENT_TYPE, ReplayPhase.LINEAGE_VALIDATION, {});
    }
    /**
     * Lineage namespace violation failure
     */
    static lineageNamespaceViolation(parentId) {
        return this.create(FailureCode.LINEAGE_NAMESPACE_VIOLATION, ReplayPhase.LINEAGE_VALIDATION, { parent_id: parentId });
    }
    /**
     * Invalid payload structure failure
     */
    static invalidPayloadStructure() {
        return this.create(FailureCode.INVALID_PAYLOAD_STRUCTURE, ReplayPhase.STATE_TRANSITION, {});
    }
    /**
     * Unknown event type failure
     */
    static unknownEventType(eventType) {
        return this.create(FailureCode.UNKNOWN_EVENT_TYPE, ReplayPhase.STATE_TRANSITION, { event_type: eventType });
    }
    /**
     * Duplicate leaf ID failure
     */
    static duplicateLeafId(leafId) {
        return this.create(FailureCode.DUPLICATE_LEAF_ID, ReplayPhase.MERKLE_CONSTRUCTION, { leaf_id: leafId });
    }
    /**
     * Execution limit exceeded failure
     */
    static executionLimitExceeded(limitName, limitValue, actualValue) {
        return this.create(FailureCode.EXECUTION_LIMIT_EXCEEDED, ReplayPhase.MERKLE_CONSTRUCTION, { limit_name: limitName, limit_value: limitValue, actual_value: actualValue });
    }
    /**
     * Cycle detected failure
     */
    static cycleDetected(cyclePath) {
        return this.create(FailureCode.CYCLE_DETECTED, ReplayPhase.INVARIANT_CHECK, { cycle_path: cyclePath.join(' -> ') });
    }
    /**
     * Forbidden edge detected failure
     */
    static forbiddenEdgeDetected(fromId, toId) {
        return this.create(FailureCode.FORBIDDEN_EDGE_DETECTED, ReplayPhase.INVARIANT_CHECK, { from_id: fromId, to_id: toId });
    }
    /**
     * Convert deterministic failure to error for runtime use
     * This is the only place where Error should be created
     */
    static toError(failure) {
        const message = `${failure.code} in ${failure.replay_phase}`;
        const error = new Error(message);
        error.deterministicFailure = failure;
        return error;
    }
    /**
     * Extract deterministic failure from error if present
     */
    static fromError(error) {
        return error.deterministicFailure || null;
    }
}
exports.DeterministicFailureFactory = DeterministicFailureFactory;
