"use strict";
/**
 * REPLAY STATE MACHINE
 *
 * Pure TypeScript implementation of replay state machine.
 *
 * Requirements:
 * - deterministic state transitions
 * - immutable state
 * - no side effects
 * - pure functional execution
 * - deterministic failure envelopes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplayStateMachine = void 0;
const deterministic_failure_1 = require("./deterministic_failure");
class ReplayStateMachine {
    state;
    seenEventIds;
    eventToArtifactMap;
    constructor(initialState) {
        this.state = initialState || {
            artifacts: new Map(),
            state_version: '1.0'
        };
        this.seenEventIds = new Set();
        this.eventToArtifactMap = new Map();
    }
    /**
     * Get current state
     */
    getState() {
        return this.immutableCopy();
    }
    /**
     * Apply event to state
     */
    applyEvent(event) {
        const newState = this.immutableCopy();
        switch (event.getEventType()) {
            case 'artifact_commit':
                this.handleArtifactCommit(event, newState);
                break;
            case 'artifact_update':
                this.handleArtifactUpdate(event, newState);
                break;
            default:
                throw deterministic_failure_1.DeterministicFailureFactory.toError(deterministic_failure_1.DeterministicFailureFactory.unknownEventType(event.getEventType()));
        }
        this.state = newState;
        return newState;
    }
    /**
     * Handle artifact commit event
     */
    handleArtifactCommit(event, state) {
        const payload = event.getPayload();
        const artifactId = payload.artifact_id || event.getEventId();
        const artifactHash = payload.artifact_hash || '';
        const lineage = event.getLineage().parent_event_ids;
        const eventId = event.getEventId();
        // Constitutional rule: payload schema validation
        if (!payload || typeof payload !== 'object') {
            throw deterministic_failure_1.DeterministicFailureFactory.toError(deterministic_failure_1.DeterministicFailureFactory.invalidPayloadStructure());
        }
        // Constitutional rule: lineage structure validation
        if (!Array.isArray(lineage)) {
            throw deterministic_failure_1.DeterministicFailureFactory.toError(deterministic_failure_1.DeterministicFailureFactory.invalidLineageStructure());
        }
        for (const parentId of lineage) {
            if (typeof parentId !== 'string') {
                throw deterministic_failure_1.DeterministicFailureFactory.toError(deterministic_failure_1.DeterministicFailureFactory.invalidLineageParentType());
            }
        }
        // Constitutional rule: duplicate event_id detection
        if (this.seenEventIds.has(eventId)) {
            throw deterministic_failure_1.DeterministicFailureFactory.toError(deterministic_failure_1.DeterministicFailureFactory.duplicateEventId(eventId));
        }
        this.seenEventIds.add(eventId);
        // Constitutional rule: lineage namespace consistency
        // Lineage must use only event IDs or only artifact IDs, never both
        const hasEventIds = lineage.some(id => id.startsWith('evt-'));
        const hasArtifactIds = lineage.some(id => !id.startsWith('evt-'));
        if (hasEventIds && hasArtifactIds) {
            throw deterministic_failure_1.DeterministicFailureFactory.toError(deterministic_failure_1.DeterministicFailureFactory.lineageNamespaceViolation('mixed'));
        }
        // Constitutional rule: parent existence validation
        // Lineage may contain event IDs or artifact IDs
        // Convert event IDs to artifact IDs using eventToArtifactMap
        for (const parentId of lineage) {
            let parentArtifactId;
            if (parentId.startsWith('evt-')) {
                // Convert event ID to artifact ID
                parentArtifactId = this.eventToArtifactMap.get(parentId);
                if (!parentArtifactId) {
                    throw deterministic_failure_1.DeterministicFailureFactory.toError(deterministic_failure_1.DeterministicFailureFactory.parentEventNotFound(parentId));
                }
            }
            else {
                // Already an artifact ID
                parentArtifactId = parentId;
            }
            if (!state.artifacts.has(parentArtifactId)) {
                throw deterministic_failure_1.DeterministicFailureFactory.toError(deterministic_failure_1.DeterministicFailureFactory.parentNotFound(parentArtifactId));
            }
        }
        // Constitutional rule: duplicate artifact_id detection
        if (state.artifacts.has(artifactId)) {
            throw deterministic_failure_1.DeterministicFailureFactory.toError(deterministic_failure_1.DeterministicFailureFactory.duplicateArtifactId(artifactId));
        }
        state.artifacts.set(artifactId, {
            artifact_id: artifactId,
            artifact_hash: artifactHash,
            artifact_lineage: lineage
        });
        // Track event ID to artifact ID mapping
        this.eventToArtifactMap.set(eventId, artifactId);
    }
    /**
     * Handle artifact update event
     */
    handleArtifactUpdate(event, state) {
        const payload = event.getPayload();
        const artifactId = payload.artifact_id || event.getEventId();
        const artifactHash = payload.artifact_hash || '';
        const existing = state.artifacts.get(artifactId);
        if (existing) {
            state.artifacts.set(artifactId, {
                artifact_id: artifactId,
                artifact_hash: artifactHash,
                artifact_lineage: existing.artifact_lineage
            });
        }
    }
    /**
     * Get artifact state
     */
    getArtifactState(artifactId) {
        const artifact = this.state.artifacts.get(artifactId);
        return artifact ? { ...artifact } : null;
    }
    /**
     * Get all artifacts
     */
    getAllArtifacts() {
        return Array.from(this.state.artifacts.values()).map(a => ({ ...a }));
    }
    /**
     * Create immutable copy of state
     */
    immutableCopy() {
        const artifacts = new Map();
        for (const [key, value] of this.state.artifacts) {
            artifacts.set(key, { ...value });
        }
        return {
            artifacts,
            state_version: this.state.state_version
        };
    }
    /**
     * Reset state to initial
     */
    reset() {
        this.state = {
            artifacts: new Map(),
            state_version: '1.0'
        };
        this.seenEventIds.clear();
        this.eventToArtifactMap.clear();
    }
}
exports.ReplayStateMachine = ReplayStateMachine;
