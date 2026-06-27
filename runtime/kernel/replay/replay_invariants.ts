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

import { InvariantDefinition, InvariantViolation, ReplayState } from './replay_types';
import { DeterministicFailureFactory } from './deterministic_failure';
import { REPLAY_LIMITS } from './replay_limits';

export class ReplayInvariants {
  /**
   * Invariant: All artifacts must have valid hashes
   */
  static artifactHashInvariant: InvariantDefinition = {
    invariant_id: 'ARTIFACT_HASH_VALID',
    invariant_type: 'VALIDATION',
    invariant_function: (state: ReplayState): InvariantViolation | null => {
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
  static lineageAcyclicInvariant: InvariantDefinition = {
    invariant_id: 'LINEAGE_ACYCLIC',
    invariant_type: 'VALIDATION',
    invariant_function: (state: ReplayState): InvariantViolation | null => {
      // Check for cycles in lineage
      const visited = new Set<string>();
      const recursionStack = new Set<string>();
      
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
  static lineageParentExistsInvariant: InvariantDefinition = {
    invariant_id: 'LINEAGE_PARENT_EXISTS',
    invariant_type: 'VALIDATION',
    invariant_function: (state: ReplayState): InvariantViolation | null => {
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
  static stateVersionInvariant: InvariantDefinition = {
    invariant_id: 'STATE_VERSION_CONSISTENT',
    invariant_type: 'VALIDATION',
    invariant_function: (state: ReplayState): InvariantViolation | null => {
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
  private static hasCycleInLineage(
    artifactId: string,
    lineage: string[],
    state: ReplayState,
    visited: Set<string>,
    recursionStack: Set<string>,
    depth: number = 0
  ): boolean {
    // Constitutional depth guard to prevent stack overflow
    if (depth > REPLAY_LIMITS.MAX_LINEAGE_DEPTH) {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.executionLimitExceeded(
          'MAX_LINEAGE_DEPTH',
          REPLAY_LIMITS.MAX_LINEAGE_DEPTH,
          depth
        )
      );
    }

    visited.add(artifactId);
    recursionStack.add(artifactId);
    
    for (const parentId of lineage) {
      if (!visited.has(parentId)) {
        const parentArtifact = state.artifacts.get(parentId as any);
        if (parentArtifact && this.hasCycleInLineage(parentId, parentArtifact.artifact_lineage, state, visited, recursionStack, depth + 1)) {
          return true;
        }
      } else if (recursionStack.has(parentId)) {
        return true;
      }
    }
    
    recursionStack.delete(artifactId);
    return false;
  }

  /**
   * Get all standard replay invariants
   */
  static getStandardInvariants(): InvariantDefinition[] {
    return [
      this.artifactHashInvariant,
      this.lineageAcyclicInvariant,
      this.lineageParentExistsInvariant,
      this.stateVersionInvariant
    ];
  }
}
