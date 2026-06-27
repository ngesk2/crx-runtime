/**
 * REPLAY VERIFICATION
 * 
 * Pure TypeScript implementation of replay verification.
 * Ported from constitutional-integration-lab/extracted/js_txt/deterministic_replay_harness.js
 * 
 * Requirements:
 * - deterministic replay execution
 * - witness comparison
 * - canonical replay assertions
 * - reproducibility verification
 * - state serialization equality
 * - violations equality
 * - lineage equality
 */

import { ReplayEventStream } from './replay_event_stream';
import { DeterministicReplayEngine } from './deterministic_replay_engine';
import { ReplayResult, WitnessRoot, Fingerprint, LineageGraph } from './replay_types';
import { StateSerializer } from './state_serializer';
import { CanonicalJson } from './canonical_json';

export class ReplayVerification {
  private readonly engine: DeterministicReplayEngine;
  private readonly stateSerializer: StateSerializer;

  constructor() {
    this.engine = new DeterministicReplayEngine();
    this.stateSerializer = new StateSerializer();
  }

  /**
   * Verify replay determinism
   * Constitutional rule: comprehensive comparison including state, violations, and lineage
   */
  verifyDeterminism(eventStream: ReplayEventStream, expectedResult: ReplayResult): boolean {
    const actualResult = this.engine.replay(eventStream);
    
    return (
      this.compareWitnessRoots(actualResult.witness_root, expectedResult.witness_root) &&
      this.compareFingerprints(actualResult.fingerprint, expectedResult.fingerprint) &&
      this.compareCanonicalBytes(actualResult.canonical_bytes, expectedResult.canonical_bytes) &&
      this.compareStateSerialization(actualResult.state, expectedResult.state) &&
      this.compareViolations(actualResult.violations, expectedResult.violations) &&
      this.compareLineage(actualResult.lineage_graph, expectedResult.lineage_graph) &&
      this.compareStateVersion(actualResult.state_version, expectedResult.state_version) &&
      this.compareArtifactCount(actualResult.artifact_count, expectedResult.artifact_count)
    );
  }

  /**
   * Verify witness root
   */
  verifyWitnessRoot(eventStream: ReplayEventStream, expectedWitnessRoot: WitnessRoot): boolean {
    const actualResult = this.engine.replay(eventStream);
    return this.compareWitnessRoots(actualResult.witness_root, expectedWitnessRoot);
  }

  /**
   * Verify fingerprint
   */
  verifyFingerprint(eventStream: ReplayEventStream, expectedFingerprint: Fingerprint): boolean {
    const actualResult = this.engine.replay(eventStream);
    return this.compareFingerprints(actualResult.fingerprint, expectedFingerprint);
  }

  /**
   * Verify canonical bytes
   */
  verifyCanonicalBytes(eventStream: ReplayEventStream, expectedCanonicalBytes: any): boolean {
    const actualResult = this.engine.replay(eventStream);
    return this.compareCanonicalBytes(actualResult.canonical_bytes, expectedCanonicalBytes);
  }

  /**
   * Verify replay reproducibility
   */
  verifyReproducibility(eventStream: ReplayEventStream, iterations: number = 10): boolean {
    const results: ReplayResult[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const result = this.engine.replay(eventStream);
      results.push(result);
    }
    
    // All results should be identical
    const firstResult = results[0];
    for (let i = 1; i < results.length; i++) {
      if (!this.compareReplayResults(firstResult, results[i])) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Compare replay results
   * Constitutional rule: comprehensive comparison including state, violations, and lineage
   */
  private compareReplayResults(actual: ReplayResult, expected: ReplayResult): boolean {
    return (
      this.compareWitnessRoots(actual.witness_root, expected.witness_root) &&
      this.compareFingerprints(actual.fingerprint, expected.fingerprint) &&
      this.compareCanonicalBytes(actual.canonical_bytes, expected.canonical_bytes) &&
      this.compareStateSerialization(actual.state, expected.state) &&
      this.compareViolations(actual.violations, expected.violations) &&
      this.compareLineage(actual.lineage_graph, expected.lineage_graph) &&
      this.compareStateVersion(actual.state_version, expected.state_version) &&
      this.compareArtifactCount(actual.artifact_count, expected.artifact_count)
    );
  }

  /**
   * Compare witness roots
   */
  private compareWitnessRoots(actual: WitnessRoot, expected: WitnessRoot): boolean {
    return actual.witness_root === expected.witness_root &&
           actual.witness_algorithm === expected.witness_algorithm &&
           actual.witness_version === expected.witness_version &&
           actual.leaf_count === expected.leaf_count &&
           actual.tree_height === expected.tree_height;
  }

  /**
   * Compare fingerprints
   */
  private compareFingerprints(actual: Fingerprint, expected: Fingerprint): boolean {
    return actual.hash === expected.hash &&
           actual.hash_algorithm === expected.hash_algorithm &&
           actual.hash_version === expected.hash_version;
  }

  /**
   * Compare canonical bytes
   */
  private compareCanonicalBytes(actual: any, expected: any): boolean {
    return actual.bytes === expected.bytes &&
           actual.canonicalization_version === expected.canonicalization_version;
  }

  /**
   * Compare state serialization
   * Constitutional rule: compare canonicalized state bytes
   */
  private compareStateSerialization(actual: any, expected: any): boolean {
    const actualBytes = this.stateSerializer.serializeState(actual);
    const expectedBytes = this.stateSerializer.serializeState(expected);
    return actualBytes.equals(expectedBytes);
  }

  /**
   * Compare violations
   * Constitutional rule: compare canonicalized violations
   */
  private compareViolations(actual: any[], expected: any[]): boolean {
    const actualBytes = this.stateSerializer.serializeViolations(actual);
    const expectedBytes = this.stateSerializer.serializeViolations(expected);
    return actualBytes.equals(expectedBytes);
  }

  /**
   * Compare lineage
   * Constitutional rule: compare canonicalized lineage
   */
  private compareLineage(actual: LineageGraph, expected: LineageGraph): boolean {
    const actualBytes = CanonicalJson.toBuffer(actual);
    const expectedBytes = CanonicalJson.toBuffer(expected);
    return actualBytes.equals(expectedBytes);
  }

  /**
   * Compare state version
   * Constitutional rule: compare state version strings
   */
  private compareStateVersion(actual: string, expected: string): boolean {
    return actual === expected;
  }

  /**
   * Compare artifact count
   * Constitutional rule: compare artifact counts
   */
  private compareArtifactCount(actual: number, expected: number): boolean {
    return actual === expected;
  }
}
