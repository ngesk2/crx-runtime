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
 * - runtime-neutral (no Buffer, uses Uint8Array)
 */

import { ReplayState, ArtifactId } from './replay_types';
import { CanonicalJson } from './canonical_json';

export class StateSerializer {
  /**
   * Serialize replay state deterministically
   * Constitutional rule: does not mutate input state
   */
  serializeState(state: ReplayState): Uint8Array {
    const stateObj: any = {
      state_version: state.state_version,
      artifacts: {}
    };
    
    // Sort artifact IDs deterministically
    const sortedArtifactIds = Array.from(state.artifacts.keys()).sort((a, b) => {
      if (a < b) return -1;
      if (a > b) return 1;
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
    
    return CanonicalJson.toUint8Array(stateObj);
  }

  /**
   * Serialize invariant violations deterministically
   */
  serializeViolations(violations: any[]): Uint8Array {
    const violationsObj = {
      violations: violations.map(v => ({
        invariant_id: v.invariant_id,
        violation_type: v.violation_type,
        violation_details: v.violation_details
      })).sort((a, b) => {
        if (a.invariant_id < b.invariant_id) return -1;
        if (a.invariant_id > b.invariant_id) return 1;
        return 0;
      })
    };
    
    return CanonicalJson.toUint8Array(violationsObj);
  }
}
