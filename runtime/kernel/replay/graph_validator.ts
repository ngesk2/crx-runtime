/**
 * GRAPH VALIDATOR
 * 
 * Comprehensive lineage graph validation.
 * 
 * Requirements:
 * - Cycle detection
 * - Orphan detection
 * - Depth enforcement
 * - Deterministic traversal ordering
 */

import { ReplayState, LineageGraph } from './replay_types';
import { DeterministicFailureFactory } from './deterministic_failure';
import { REPLAY_LIMITS } from './replay_limits';

export class GraphValidator {
  /**
   * Validate lineage graph comprehensively
   */
  static validateLineageGraph(state: ReplayState): void {
    // 1. Detect cycles
    const cycles = this.detectCycles(state);
    if (cycles.length > 0) {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.create(
          'LINEAGE_CYCLE_DETECTED' as any,
          'LINEAGE_VALIDATION' as any,
          { cycles }
        )
      );
    }

    // 2. Detect orphans
    const orphans = this.detectOrphans(state);
    if (orphans.length > 0) {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.create(
          'LINEAGE_ORPHAN_DETECTED' as any,
          'LINEAGE_VALIDATION' as any,
          { orphans }
        )
      );
    }

    // 3. Validate depth
    const maxDepth = this.calculateMaxDepth(state);
    if (maxDepth > REPLAY_LIMITS.MAX_LINEAGE_DEPTH) {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.executionLimitExceeded(
          'MAX_LINEAGE_DEPTH',
          REPLAY_LIMITS.MAX_LINEAGE_DEPTH,
          maxDepth
        )
      );
    }
  }

  /**
   * Detect cycles with deterministic traversal ordering
   */
  private static detectCycles(state: ReplayState): string[] {
    const cycles: string[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    // Deterministic node ordering
    const sortedArtifactIds = Array.from(state.artifacts.keys()).sort((a, b) => {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    });

    for (const artifactId of sortedArtifactIds) {
      if (this.hasCycleDFS(artifactId, state, visited, recursionStack)) {
        cycles.push(artifactId);
      }
    }

    return cycles;
  }

  private static hasCycleDFS(
    artifactId: string,
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

    const artifact = state.artifacts.get(artifactId as any);
    if (artifact) {
      // Deterministic neighbor ordering
      const sortedLineage = [...artifact.artifact_lineage].sort((a, b) => {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      });

      for (const parentId of sortedLineage) {
        if (!visited.has(parentId)) {
          if (this.hasCycleDFS(parentId, state, visited, recursionStack, depth + 1)) {
            return true;
          }
        } else if (recursionStack.has(parentId)) {
          return true;
        }
      }
    }

    recursionStack.delete(artifactId);
    return false;
  }

  /**
   * Detect orphan artifacts (parents that don't exist in state)
   * Constitutional rule: an artifact is orphaned if its lineage references non-existent parents
   * Root nodes (never referenced) are valid and NOT orphans
   * Leaf nodes (never reference others) are valid and NOT orphans
   */
  private static detectOrphans(state: ReplayState): string[] {
    const orphans: string[] = [];

    for (const [artifactId, artifactState] of state.artifacts) {
      // Check if all parents in lineage exist in state
      for (const parentId of artifactState.artifact_lineage) {
        if (!state.artifacts.has(parentId as any)) {
          orphans.push(artifactId);
          break; // One missing parent is enough to be orphaned
        }
      }
    }

    return orphans;
  }

  /**
   * Calculate maximum lineage depth
   */
  private static calculateMaxDepth(state: ReplayState): number {
    let maxDepth = 0;

    for (const artifactId of state.artifacts.keys()) {
      const depth = this.calculateDepth(artifactId, state, 0);
      maxDepth = Math.max(maxDepth, depth);
    }

    return maxDepth;
  }

  private static calculateDepth(
    artifactId: string,
    state: ReplayState,
    currentDepth: number
  ): number {
    // Constitutional depth guard to prevent stack overflow
    if (currentDepth > REPLAY_LIMITS.MAX_LINEAGE_DEPTH) {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.executionLimitExceeded(
          'MAX_LINEAGE_DEPTH',
          REPLAY_LIMITS.MAX_LINEAGE_DEPTH,
          currentDepth
        )
      );
    }

    const artifact = state.artifacts.get(artifactId as any);
    if (!artifact || artifact.artifact_lineage.length === 0) {
      return currentDepth;
    }

    let maxChildDepth = currentDepth;
    for (const parentId of artifact.artifact_lineage) {
      const childDepth = this.calculateDepth(parentId, state, currentDepth + 1);
      maxChildDepth = Math.max(maxChildDepth, childDepth);
    }

    return maxChildDepth;
  }
}
