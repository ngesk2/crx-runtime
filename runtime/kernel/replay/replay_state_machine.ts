/**
 * REPLAY STATE MACHINE
 *
 * CONSTITUTIONAL ROLE
 *
 * Authority: YES
 * Creates Truth: YES (State Derivation)
 * Derives Truth: YES (from events)
 * Stores Truth: NO (in-memory only)
 * Presents Truth: NO
 *
 * Constitutional Authority Class: STATE_MACHINE
 *
 * Truth Source:
 * runtime/replay/replay_event_stream.ts (events)
 *
 * Constitutional Flow:
 * 1. Receives events from ReplayEventStream
 * 2. Applies events in deterministic order
 * 3. Derives artifact state from events
 * 4. Derives lineage from events
 * 5. Enforces constitutional rules (lineage depth, namespace consistency, duplicate detection)
 *
 * This component DOES create constitutional truth (derived state).
 * It is the sole authority for state derivation from events.
 *
 * Pure TypeScript implementation of replay state machine.
 *
 * Requirements:
 * - deterministic state transitions
 * - immutable state
 * - no side effects
 * - pure functional execution
 * - deterministic failure envelopes
 *
 * Constitutional note:
 *
 * Graph legality currently enforced during replay application.
 *
 * Future constitutional evolution:
 *
 * AdmissionPolicy
 *   -> legality validation
 *   -> graph validation
 *   -> appendEvent
 *
 * Current implementation remains deterministic because
 * state promotion occurs only after graph validation succeeds.
 */

import { ReplayState, ArtifactState, CanonicalEventEnvelope, ArtifactId } from './replay_types';
import { DeterministicFailureFactory, ReplayPhase } from './deterministic_failure';
import { deepFreeze } from './utils/deep_freeze';
import { REPLAY_LIMITS } from './replay_limits';
import { GraphValidator } from './graph_validator';

export class ReplayStateMachine {
  private state: ReplayState;

  constructor(initialState?: ReplayState) {
    this.state = initialState || {
      artifacts: new Map<ArtifactId, ArtifactState>(),
      seen_event_ids: new Set<string>(),
      event_to_artifact_map: new Map<string, string>(),
      state_version: '1.0'
    };
  }

  /**
   * Get current state
   */
  getState(): ReplayState {
    return deepFreeze(this.immutableCopy());
  }

  /**
   * Apply event to state
   */
  applyEvent(event: CanonicalEventEnvelope): ReplayState {
    const newState = this.immutableCopy();
    
    switch (event.getEventType()) {
      case 'artifact_commit':
        this.handleArtifactCommit(event, newState);
        break;
      case 'artifact_update':
        this.handleArtifactUpdate(event, newState);
        break;
      default:
        throw DeterministicFailureFactory.toError(
          DeterministicFailureFactory.unknownEventType(event.getEventType())
        );
    }
    
    // Validate lineage graph after state update
    GraphValidator.validateLineageGraph(newState);
    
    this.state = newState;
    return newState;
  }

  /**
   * Handle artifact commit event
   */
  private handleArtifactCommit(event: CanonicalEventEnvelope, state: ReplayState): void {
    const payload = event.getPayload() as any;
    const artifactId = payload.artifact_id || event.getEventId();
    const artifactHash = payload.artifact_hash || '';
    const lineage = event.getLineage().parent_event_ids;
    const eventId = event.getEventId();
    
    // Constitutional rule: payload schema validation
    if (!payload || typeof payload !== 'object') {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.invalidPayloadStructure()
      );
    }
    
    // Constitutional rule: lineage structure validation
    if (!Array.isArray(lineage)) {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.invalidLineageStructure()
      );
    }
    
    for (const parentId of lineage) {
      if (typeof parentId !== 'string') {
        throw DeterministicFailureFactory.toError(
          DeterministicFailureFactory.invalidLineageParentType()
        );
      }
    }
    
    // Enforce MAX_ARTIFACTS limit
    if (state.artifacts.size >= REPLAY_LIMITS.MAX_ARTIFACTS) {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.executionLimitExceeded(
          'MAX_ARTIFACTS',
          REPLAY_LIMITS.MAX_ARTIFACTS,
          state.artifacts.size
        )
      );
    }
    
    // Enforce MAX_LINEAGE_DEPTH limit
    const lineageDepth = this.calculateLineageDepth(lineage, state, 0);
    if (lineageDepth > REPLAY_LIMITS.MAX_LINEAGE_DEPTH) {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.executionLimitExceeded(
          'MAX_LINEAGE_DEPTH',
          REPLAY_LIMITS.MAX_LINEAGE_DEPTH,
          lineageDepth
        )
      );
    }
    
    // Constitutional rule: duplicate event_id detection
    if (state.seen_event_ids.has(eventId)) {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.duplicateEventId(eventId)
      );
    }
    state.seen_event_ids.add(eventId);
    
    // Constitutional rule: lineage namespace consistency
    // Lineage must use only event IDs or only artifact IDs, never both
    const hasEventIds = lineage.some(id => id.startsWith('evt-'));
    const hasArtifactIds = lineage.some(id => !id.startsWith('evt-'));
    if (hasEventIds && hasArtifactIds) {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.lineageNamespaceViolation('mixed')
      );
    }
    
    // Constitutional rule: parent existence validation
    // Lineage may contain event IDs or artifact IDs
    // Convert event IDs to artifact IDs using event_to_artifact_map
    // CRITICAL: Store normalized artifact IDs in artifact_lineage for constitutional consistency
    const normalizedLineage: string[] = [];
    for (const parentId of lineage) {
      let parentArtifactId: string;
      if (parentId.startsWith('evt-')) {
        // Convert event ID to artifact ID
        parentArtifactId = state.event_to_artifact_map.get(parentId);
        if (!parentArtifactId) {
          throw DeterministicFailureFactory.toError(
            DeterministicFailureFactory.parentEventNotFound(parentId)
          );
        }
      } else {
        // Already an artifact ID
        parentArtifactId = parentId;
      }
      
      if (!state.artifacts.has(parentArtifactId)) {
        throw DeterministicFailureFactory.toError(
          DeterministicFailureFactory.parentNotFound(parentArtifactId)
        );
      }
      
      normalizedLineage.push(parentArtifactId);
    }
    
    // Constitutional rule: duplicate artifact_id detection
    if (state.artifacts.has(artifactId)) {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.duplicateArtifactId(artifactId)
      );
    }
    
    state.artifacts.set(artifactId, {
      artifact_id: artifactId,
      artifact_hash: artifactHash,
      artifact_lineage: [...normalizedLineage]
    });
    
    // Track event ID to artifact ID mapping
    state.event_to_artifact_map.set(eventId, artifactId);
  }

  /**
   * Handle artifact update event
   */
  private handleArtifactUpdate(event: CanonicalEventEnvelope, state: ReplayState): void {
    const payload = event.getPayload() as any;
    const artifactId = payload.artifact_id || event.getEventId();
    const artifactHash = payload.artifact_hash || '';
    
    const existing = state.artifacts.get(artifactId);
    if (existing) {
      state.artifacts.set(artifactId, {
        artifact_id: artifactId,
        artifact_hash: artifactHash,
        artifact_lineage: [...existing.artifact_lineage]
      });
    }
  }

  /**
   * Get artifact state
   */
  getArtifactState(artifactId: string): ArtifactState | null {
    const artifact = this.state.artifacts.get(artifactId);
    return artifact ? deepFreeze({ ...artifact, artifact_lineage: [...artifact.artifact_lineage] }) : null;
  }

  /**
   * Get all artifacts
   * Constitutional rule: deterministic ordering
   */
  getAllArtifacts(): ArtifactState[] {
    return deepFreeze(
      Array.from(this.state.artifacts.values())
        .sort((a, b) => {
          if (a.artifact_id < b.artifact_id) return -1;
          if (a.artifact_id > b.artifact_id) return 1;
          return 0;
        })
        .map(a => ({ ...a, artifact_lineage: [...a.artifact_lineage] }))
    );
  }

  /**
   * Create immutable copy of state
   */
  private immutableCopy(): ReplayState {
    const artifacts = new Map<ArtifactId, ArtifactState>();
    for (const [key, value] of this.state.artifacts) {
      artifacts.set(key, { 
        ...value,
        artifact_lineage: [...value.artifact_lineage]
      });
    }
    
    const seenEventIds = new Set<string>(this.state.seen_event_ids);
    const eventToArtifactMap = new Map<string, string>(this.state.event_to_artifact_map);
    
    return {
      artifacts,
      seen_event_ids: seenEventIds,
      event_to_artifact_map: eventToArtifactMap,
      state_version: this.state.state_version
    };
  }

  /**
   * Reset state to initial
   */
  reset(): void {
    this.state = {
      artifacts: new Map<ArtifactId, ArtifactState>(),
      seen_event_ids: new Set<string>(),
      event_to_artifact_map: new Map<string, string>(),
      state_version: '1.0'
    };
  }

  /**
   * Calculate lineage depth for limit enforcement
   */
  private calculateLineageDepth(parentIds: string[], state: ReplayState, depth: number = 0): number {
    if (depth > REPLAY_LIMITS.MAX_LINEAGE_DEPTH) {
      return depth;
    }

    let maxDepth = depth;
    for (const parentId of parentIds) {
      const artifact = state.artifacts.get(parentId as any);
      if (artifact) {
        const childDepth = this.calculateLineageDepth(artifact.artifact_lineage, state, depth + 1);
        maxDepth = Math.max(maxDepth, childDepth);
      }
    }

    return maxDepth;
  }
}
