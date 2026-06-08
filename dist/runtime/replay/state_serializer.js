"use strict";
/**
 * STATE SERIALIZER
 *
 * Pure TypeScript implementation of deterministic state serialization.
 *
 * Requirements:
 * - deterministic serialization
 * - pure functional execution
 * - no mutation of input state
 * - no infrastructure dependencies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateSerializer = void 0;
const canonical_json_1 = require("./canonical_json");
class StateSerializer {
    /**
     * Serialize replay state deterministically
     * Constitutional rule: does not mutate input state
     */
    serializeState(state) {
        const stateObj = {
            state_version: state.state_version,
            artifacts: {}
        };
        // Sort artifact IDs deterministically
        const sortedArtifactIds = Array.from(state.artifacts.keys()).sort((a, b) => {
            if (a < b)
                return -1;
            if (a > b)
                return 1;
            return 0;
        });
        for (const artifactId of sortedArtifactIds) {
            const artifactState = state.artifacts.get(artifactId);
            if (artifactState) {
                stateObj.artifacts[artifactId] = {
                    artifact_id: artifactState.artifact_id,
                    artifact_hash: artifactState.artifact_hash,
                    artifact_lineage: [...artifactState.artifact_lineage].sort()
                };
            }
        }
        return canonical_json_1.CanonicalJson.toBuffer(stateObj);
    }
    /**
     * Serialize invariant violations deterministically
     */
    serializeViolations(violations) {
        const violationsObj = {
            violations: violations.map(v => ({
                invariant_id: v.invariant_id,
                violation_type: v.violation_type,
                violation_details: v.violation_details
            })).sort((a, b) => {
                if (a.invariant_id < b.invariant_id)
                    return -1;
                if (a.invariant_id > b.invariant_id)
                    return 1;
                return 0;
            })
        };
        return canonical_json_1.CanonicalJson.toBuffer(violationsObj);
    }
}
exports.StateSerializer = StateSerializer;
