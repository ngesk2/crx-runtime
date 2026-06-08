"use strict";
/**
 * REPLAY TYPES
 *
 * Pure TypeScript types for deterministic replay kernel.
 * No infrastructure dependencies.
 * No environment variable access.
 * No process/global mutation.
 *
 * PHASE 8: CONSTITUTIONAL IDENTITY SEPARATION
 * Branded types enforce identity domain correctness at compile time.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_REPLAY_DEPTH = exports.MAX_LINEAGE_EDGES = exports.MAX_EVENT_STREAM_SIZE = void 0;
exports.isEventId = isEventId;
exports.isArtifactId = isArtifactId;
exports.isWitnessLeafId = isWitnessLeafId;
exports.toEventId = toEventId;
exports.toArtifactId = toArtifactId;
exports.toWitnessLeafId = toWitnessLeafId;
// Deterministic execution limits for bounded execution guarantees
exports.MAX_EVENT_STREAM_SIZE = 1000000;
exports.MAX_LINEAGE_EDGES = 10000000;
exports.MAX_REPLAY_DEPTH = 1000;
// Type guards for branded types
function isEventId(id) {
    return id.startsWith('evt-');
}
function isArtifactId(id) {
    return id.startsWith('artifact-');
}
function isWitnessLeafId(id) {
    return id !== '';
}
// Safe constructors for branded types
function toEventId(id) {
    if (!isEventId(id)) {
        throw new Error(`Invalid event ID: ${id}. Event IDs must start with 'evt-'`);
    }
    return id;
}
function toArtifactId(id) {
    if (!isArtifactId(id)) {
        throw new Error(`Invalid artifact ID: ${id}. Artifact IDs must start with 'artifact-'`);
    }
    return id;
}
function toWitnessLeafId(id) {
    if (!isWitnessLeafId(id)) {
        throw new Error(`Invalid witness leaf ID: ${id}. Witness leaf IDs must not be empty`);
    }
    return id;
}
