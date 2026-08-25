"use strict";
/**
 * REPLAY INVARIANTS
 *
 * Pure TypeScript implementation of replay invariants.
 *
 * Requirements:
 * - deterministic invariant checking
 * - no side effects
 * - pure functional execution
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplayInvariants = void 0;
class ReplayInvariants {
    /**
     * Invariant: All artifacts must have valid hashes
     */
    static artifactHashInvariant = {
        invariant_id: 'ARTIFACT_HASH_VALID',
        invariant_type: 'VALIDATION',
        invariant_function: (state) => {
            for (const [artifactId, artifactState] of state.artifacts) {
                if (!artifactState.artifact_hash || typeof artifactState.artifact_hash !== 'string') {
                    return {
                        invariant_id: 'ARTIFACT_HASH_VALID',
                        violation_type: 'INVALID_HASH',
                        violation_details: { artifact_id: artifactId }
                    };
                }
            }
            return null;
        }
    };
    /**
     * Invariant: Lineage must be acyclic
     */
    static lineageAcyclicInvariant = {
        invariant_id: 'LINEAGE_ACYCLIC',
        invariant_type: 'VALIDATION',
        invariant_function: (state) => {
            // Check for cycles in lineage
            const visited = new Set();
            const recursionStack = new Set();
            for (const [artifactId, artifactState] of state.artifacts) {
                if (this.hasCycleInLineage(artifactId, artifactState.artifact_lineage, state, visited, recursionStack)) {
                    return {
                        invariant_id: 'LINEAGE_ACYCLIC',
                        violation_type: 'CYCLE_DETECTED',
                        violation_details: { artifact_id: artifactId }
                    };
                }
            }
            return null;
        }
    };
    /**
     * Invariant: All lineage parents must exist
     */
    static lineageParentExistsInvariant = {
        invariant_id: 'LINEAGE_PARENT_EXISTS',
        invariant_type: 'VALIDATION',
        invariant_function: (state) => {
            for (const [artifactId, artifactState] of state.artifacts) {
                for (const parentId of artifactState.artifact_lineage) {
                    if (!state.artifacts.has(parentId)) {
                        return {
                            invariant_id: 'LINEAGE_PARENT_EXISTS',
                            violation_type: 'MISSING_PARENT',
                            violation_details: { artifact_id: artifactId, missing_parent: parentId }
                        };
                    }
                }
            }
            return null;
        }
    };
    /**
     * Invariant: State version must be consistent
     */
    static stateVersionInvariant = {
        invariant_id: 'STATE_VERSION_CONSISTENT',
        invariant_type: 'VALIDATION',
        invariant_function: (state) => {
            if (!state.state_version || typeof state.state_version !== 'string') {
                return {
                    invariant_id: 'STATE_VERSION_CONSISTENT',
                    violation_type: 'INVALID_VERSION',
                    violation_details: {}
                };
            }
            return null;
        }
    };
    /**
     * Check for cycles in lineage
     */
    static hasCycleInLineage(artifactId, lineage, state, visited, recursionStack) {
        visited.add(artifactId);
        recursionStack.add(artifactId);
        for (const parentId of lineage) {
            if (!visited.has(parentId)) {
                const parentArtifact = state.artifacts.get(parentId);
                if (parentArtifact && this.hasCycleInLineage(parentId, parentArtifact.artifact_lineage, state, visited, recursionStack)) {
                    return true;
                }
            }
            else if (recursionStack.has(parentId)) {
                return true;
            }
        }
        recursionStack.delete(artifactId);
        return false;
    }
    /**
     * Get all standard replay invariants
     */
    static getStandardInvariants() {
        return [
            this.artifactHashInvariant,
            this.lineageAcyclicInvariant,
            this.lineageParentExistsInvariant,
            this.stateVersionInvariant
        ];
    }
}
exports.ReplayInvariants = ReplayInvariants;
