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

export enum FailureCode {
  // Parent existence failures
  PARENT_NOT_FOUND = 'PARENT_NOT_FOUND',
  PARENT_EVENT_NOT_FOUND = 'PARENT_EVENT_NOT_FOUND',
  
  // Duplicate detection failures
  DUPLICATE_EVENT_ID = 'DUPLICATE_EVENT_ID',
  DUPLICATE_ARTIFACT_ID = 'DUPLICATE_ARTIFACT_ID',
  
  // Lineage structure failures
  INVALID_LINEAGE_STRUCTURE = 'INVALID_LINEAGE_STRUCTURE',
  INVALID_LINEAGE_PARENT_TYPE = 'INVALID_LINEAGE_PARENT_TYPE',
  LINEAGE_NAMESPACE_VIOLATION = 'LINEAGE_NAMESPACE_VIOLATION',
  
  // Payload structure failures
  INVALID_PAYLOAD_STRUCTURE = 'INVALID_PAYLOAD_STRUCTURE',
  
  // Event type failures
  UNKNOWN_EVENT_TYPE = 'UNKNOWN_EVENT_TYPE',
  
  // Event field validation failures
  INVALID_EVENT_ID = 'INVALID_EVENT_ID',
  INVALID_EVENT_TYPE = 'INVALID_EVENT_TYPE',
  INVALID_ACTOR_ID = 'INVALID_ACTOR_ID',
  INVALID_TIMESTAMP = 'INVALID_TIMESTAMP',
  INVALID_SCHEMA_VERSION = 'INVALID_SCHEMA_VERSION',
  INVALID_REPLAY_VERSION = 'INVALID_REPLAY_VERSION',
  INVALID_POLICY_VERSION = 'INVALID_POLICY_VERSION',
  INVALID_PARENT_EVENT_IDS = 'INVALID_PARENT_EVENT_IDS',
  
  // Merkle tree failures
  DUPLICATE_LEAF_ID = 'DUPLICATE_LEAF_ID',
  EXECUTION_LIMIT_EXCEEDED = 'EXECUTION_LIMIT_EXCEEDED',
  
  // Canonicalization failures
  CANONICALIZATION_ERROR = 'CANONICALIZATION_ERROR',
  
  // Invariant failures
  INVARIANT_VIOLATION = 'INVARIANT_VIOLATION',
  CYCLE_DETECTED = 'CYCLE_DETECTED',
  FORBIDDEN_EDGE_DETECTED = 'FORBIDDEN_EDGE_DETECTED',
  
  // General failures
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export enum ReplayPhase {
  STATE_TRANSITION = 'STATE_TRANSITION',
  LINEAGE_VALIDATION = 'LINEAGE_VALIDATION',
  CANONICALIZATION = 'CANONICALIZATION',
  WITNESS_GENERATION = 'WITNESS_GENERATION',
  INVARIANT_CHECK = 'INVARIANT_CHECK',
  MERKLE_CONSTRUCTION = 'MERKLE_CONSTRUCTION'
}

export interface FailureContext {
  [key: string]: string | number | boolean | null | undefined;
}

export interface DeterministicFailure {
  code: FailureCode;
  replay_phase: ReplayPhase;
  context: FailureContext;
}

export class DeterministicFailureError extends Error {
  readonly failure: DeterministicFailure;

  constructor(failure: DeterministicFailure) {
    super(`${failure.code} in ${failure.replay_phase}`);
    this.name = 'DeterministicFailureError';
    this.failure = failure;
  }
}

export class DeterministicFailureFactory {
  /**
   * Create deterministic failure envelope
   */
  static create(
    code: FailureCode,
    replayPhase: ReplayPhase,
    context: FailureContext
  ): DeterministicFailure {
    return {
      code,
      replay_phase: replayPhase,
      context
    };
  }

  /**
   * Parent not found failure
   */
  static parentNotFound(parentId: string): DeterministicFailure {
    return this.create(
      FailureCode.PARENT_NOT_FOUND,
      ReplayPhase.STATE_TRANSITION,
      { parent_id: parentId }
    );
  }

  /**
   * Parent event not found failure
   */
  static parentEventNotFound(parentEventId: string): DeterministicFailure {
    return this.create(
      FailureCode.PARENT_EVENT_NOT_FOUND,
      ReplayPhase.STATE_TRANSITION,
      { parent_event_id: parentEventId }
    );
  }

  /**
   * Duplicate event ID failure
   */
  static duplicateEventId(eventId: string): DeterministicFailure {
    return this.create(
      FailureCode.DUPLICATE_EVENT_ID,
      ReplayPhase.STATE_TRANSITION,
      { event_id: eventId }
    );
  }

  /**
   * Duplicate artifact ID failure
   */
  static duplicateArtifactId(artifactId: string): DeterministicFailure {
    return this.create(
      FailureCode.DUPLICATE_ARTIFACT_ID,
      ReplayPhase.STATE_TRANSITION,
      { artifact_id: artifactId }
    );
  }

  /**
   * Invalid lineage structure failure
   */
  static invalidLineageStructure(): DeterministicFailure {
    return this.create(
      FailureCode.INVALID_LINEAGE_STRUCTURE,
      ReplayPhase.LINEAGE_VALIDATION,
      {}
    );
  }

  /**
   * Invalid lineage parent type failure
   */
  static invalidLineageParentType(): DeterministicFailure {
    return this.create(
      FailureCode.INVALID_LINEAGE_PARENT_TYPE,
      ReplayPhase.LINEAGE_VALIDATION,
      {}
    );
  }

  /**
   * Lineage namespace violation failure
   */
  static lineageNamespaceViolation(parentId: string): DeterministicFailure {
    return this.create(
      FailureCode.LINEAGE_NAMESPACE_VIOLATION,
      ReplayPhase.LINEAGE_VALIDATION,
      { parent_id: parentId }
    );
  }

  /**
   * Invalid payload structure failure
   */
  static invalidPayloadStructure(): DeterministicFailure {
    return this.create(
      FailureCode.INVALID_PAYLOAD_STRUCTURE,
      ReplayPhase.STATE_TRANSITION,
      {}
    );
  }

  /**
   * Unknown event type failure
   */
  static unknownEventType(eventType: string): DeterministicFailure {
    return this.create(
      FailureCode.UNKNOWN_EVENT_TYPE,
      ReplayPhase.STATE_TRANSITION,
      { event_type: eventType }
    );
  }

  /**
   * Invalid event ID failure
   */
  static invalidEventId(): DeterministicFailure {
    return this.create(
      FailureCode.INVALID_EVENT_ID,
      ReplayPhase.CANONICALIZATION,
      {}
    );
  }

  /**
   * Invalid event type failure
   */
  static invalidEventType(): DeterministicFailure {
    return this.create(
      FailureCode.INVALID_EVENT_TYPE,
      ReplayPhase.CANONICALIZATION,
      {}
    );
  }

  /**
   * Invalid actor ID failure
   */
  static invalidActorId(): DeterministicFailure {
    return this.create(
      FailureCode.INVALID_ACTOR_ID,
      ReplayPhase.CANONICALIZATION,
      {}
    );
  }

  /**
   * Invalid timestamp failure
   */
  static invalidTimestamp(): DeterministicFailure {
    return this.create(
      FailureCode.INVALID_TIMESTAMP,
      ReplayPhase.CANONICALIZATION,
      {}
    );
  }

  /**
   * Invalid schema version failure
   */
  static invalidSchemaVersion(): DeterministicFailure {
    return this.create(
      FailureCode.INVALID_SCHEMA_VERSION,
      ReplayPhase.CANONICALIZATION,
      {}
    );
  }

  /**
   * Invalid replay version failure
   */
  static invalidReplayVersion(): DeterministicFailure {
    return this.create(
      FailureCode.INVALID_REPLAY_VERSION,
      ReplayPhase.CANONICALIZATION,
      {}
    );
  }

  /**
   * Invalid policy version failure
   */
  static invalidPolicyVersion(): DeterministicFailure {
    return this.create(
      FailureCode.INVALID_POLICY_VERSION,
      ReplayPhase.CANONICALIZATION,
      {}
    );
  }

  /**
   * Invalid parent event IDs failure
   */
  static invalidParentEventIds(): DeterministicFailure {
    return this.create(
      FailureCode.INVALID_PARENT_EVENT_IDS,
      ReplayPhase.CANONICALIZATION,
      {}
    );
  }

  /**
   * Duplicate leaf ID failure
   */
  static duplicateLeafId(leafId: string): DeterministicFailure {
    return this.create(
      FailureCode.DUPLICATE_LEAF_ID,
      ReplayPhase.MERKLE_CONSTRUCTION,
      { leaf_id: leafId }
    );
  }

  /**
   * Execution limit exceeded failure
   */
  static executionLimitExceeded(limitName: string, limitValue: number, actualValue: number): DeterministicFailure {
    return this.create(
      FailureCode.EXECUTION_LIMIT_EXCEEDED,
      ReplayPhase.MERKLE_CONSTRUCTION,
      { limit_name: limitName, limit_value: limitValue, actual_value: actualValue }
    );
  }

  /**
   * Cycle detected failure
   */
  static cycleDetected(cyclePath: string[]): DeterministicFailure {
    return this.create(
      FailureCode.CYCLE_DETECTED,
      ReplayPhase.INVARIANT_CHECK,
      { cycle_path: cyclePath.join(' -> ') }
    );
  }

  /**
   * Forbidden edge detected failure
   */
  static forbiddenEdgeDetected(fromId: string, toId: string): DeterministicFailure {
    return this.create(
      FailureCode.FORBIDDEN_EDGE_DETECTED,
      ReplayPhase.INVARIANT_CHECK,
      { from_id: fromId, to_id: toId }
    );
  }

  /**
   * Convert deterministic failure to error for runtime use
   * This is the only place where DeterministicFailureError should be created
   */
  static toError(failure: DeterministicFailure): DeterministicFailureError {
    return new DeterministicFailureError(failure);
  }

  /**
   * Extract deterministic failure from error if present
   */
  static fromError(error: Error): DeterministicFailure | null {
    if (error instanceof DeterministicFailureError) {
      return error.failure;
    }
    return null;
  }
}
