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

// Deterministic execution limits for bounded execution guarantees
export const MAX_EVENT_STREAM_SIZE = 1000000;
export const MAX_LINEAGE_EDGES = 10000000;
export const MAX_REPLAY_DEPTH = 1000;

// Branded types for constitutional identity separation
export type EventId = string & { readonly __brand: unique symbol };
export type ArtifactId = string & { readonly __brand: unique symbol };
export type WitnessLeafId = string & { readonly __brand: unique symbol };

// Type guards for branded types
export function isEventId(id: string): id is EventId {
  return id.startsWith('evt-');
}

export function isArtifactId(id: string): id is ArtifactId {
  return id.startsWith('artifact-');
}

export function isWitnessLeafId(id: string): id is WitnessLeafId {
  return id !== '';
}

import { DeterministicFailureFactory } from './deterministic_failure';

// Safe constructors for branded types
export function toEventId(id: string): EventId {
  if (!isEventId(id)) {
    throw DeterministicFailureFactory.toError(
      DeterministicFailureFactory.create(
        'INVALID_EVENT_ID' as any,
        'CANONICALIZATION' as any,
        { id, reason: 'Event IDs must start with evt-' }
      )
    );
  }
  return id as EventId;
}

export function toArtifactId(id: string): ArtifactId {
  if (!isArtifactId(id)) {
    throw DeterministicFailureFactory.toError(
      DeterministicFailureFactory.create(
        'INVALID_ARTIFACT_ID' as any,
        'CANONICALIZATION' as any,
        { id, reason: 'Artifact IDs must start with artifact-' }
      )
    );
  }
  return id as ArtifactId;
}

export function toWitnessLeafId(id: string): WitnessLeafId {
  if (!isWitnessLeafId(id)) {
    throw DeterministicFailureFactory.toError(
      DeterministicFailureFactory.create(
        'INVALID_WITNESS_LEAF_ID' as any,
        'CANONICALIZATION' as any,
        { id, reason: 'Witness leaf IDs must not be empty' }
      )
    );
  }
  return id as WitnessLeafId;
}

export interface CanonicalEventEnvelope {
  event_id: EventId;
  event_type: string;
  actor_id: string;
  timestamp: string;
  payload: unknown;
  lineage: {
    parent_event_ids: ArtifactId[]; // Constitutional rule: lineage uses artifact IDs only
  };
  schema_version: string;
  replay_version: string;
  policy_version: string;
}

export interface CanonicalBytes {
  bytes: string; // base64 encoded
  canonicalization_version: string;
}

export interface Fingerprint {
  hash: string;
  hash_algorithm: string;
  hash_version: string;
}

export interface LineageEdge {
  parent_id: ArtifactId; // Constitutional rule: lineage graph uses artifact IDs only
  child_id: ArtifactId; // Constitutional rule: lineage graph uses artifact IDs only
  edge_type: string;
}

export interface LineageGraph {
  edges: LineageEdge[];
  graph_version: string;
}

export interface ReplayState {
  artifacts: Map<ArtifactId, ArtifactState>; // Constitutional rule: state keyed by artifact IDs
  seen_event_ids: Set<string>; // Constitutional rule: track seen event IDs for duplicate detection
  event_to_artifact_map: Map<string, string>; // Constitutional rule: map event IDs to artifact IDs
  state_version: string;
}

export interface ArtifactState {
  artifact_id: ArtifactId; // Constitutional rule: artifact IDs are branded
  artifact_hash: string;
  artifact_lineage: ArtifactId[]; // Constitutional rule: lineage uses artifact IDs only
}

export interface WitnessRoot {
  witness_root: string;
  witness_algorithm: string;
  witness_version: string;
  leaf_count: number;
  tree_height: number;
}

export interface InvariantViolation {
  invariant_id: string;
  violation_type: string;
  violation_details: unknown;
}

export interface ReplayResult {
  canonical_bytes: CanonicalBytes;
  fingerprint: Fingerprint;
  lineage_graph: LineageGraph;
  state: ReplayState;
  witness_root: WitnessRoot;
  violations: InvariantViolation[];
  state_version: string;
  artifact_count: number;
}

export interface InvariantDefinition {
  invariant_id: string;
  invariant_type: string;
  invariant_function: (state: ReplayState) => InvariantViolation | null;
}

export interface DeterministicReplayConfig {
  canonicalization_version: string;
  hash_algorithm: string;
  hash_version: string;
  replay_version: string;
  policy_version: string;
}

export interface ReplayCertificate {
  certificate_commitment: string;
  witness_root: string;
  replay_commitment: string;
  event_commitment: string;
  derivation_graph_commitment: string;
  state_commitment: string;
  violation_commitment: string;
  constitutional_law_commitment: string;
  canonicalization_commitment: string;
  hash_authority_commitment: string;

  witness_law_version: string;
  replay_version: string;
  canonicalization_version: string;
  hash_version: string;

  witness_leaf_count: number;
  witness_tree_height: number;
}

/**
 * Execution Artifact
 * 
 * PHASE 6: EXECUTION ARTIFACT BOUNDARY
 * Separates provider execution from replay identity.
 * Provider runtime is NOT constitutional authority.
 * Replay identity must derive from execution artifacts.
 */
export interface ExecutionArtifact {
  provider: string;
  model: string;
  prompt: CanonicalBytes;
  response: CanonicalBytes;
  parameters: unknown; // Canonical JSON structure
  timing: DeterministicTiming;
}

/**
 * Deterministic Timing
 * Captures timing information for execution artifacts
 */
export interface DeterministicTiming {
  started_at: string; // ISO 8601 timestamp
  completed_at: string; // ISO 8601 timestamp
  duration_ms: number;
}
