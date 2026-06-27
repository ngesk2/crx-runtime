/**
 * DETERMINISTIC REPLAY ENGINE
 * 
 * Pure TypeScript implementation of deterministic replay engine.
 * 
 * Requirements:
 * - deterministic replay execution
 * - pure functional execution
 * - no side effects
 * - no infrastructure dependencies
 */

import { ReplayEventStream } from './replay_event_stream';
import { ReplayStateMachine } from './replay_state_machine';
import { CanonicalHashAuthority } from './canonical_hash_authority';
import { InvariantRunner } from './invariant_runner';
import { ReplayInvariants } from './replay_invariants';
import { WitnessAuthority } from './witness_authority';
import { ReplayResult, CanonicalBytes, Fingerprint, LineageGraph, WitnessRoot, InvariantViolation } from './replay_types';
import { deepFreeze } from './utils/deep_freeze';

export class DeterministicReplayEngine {
  private readonly hashAuthority: CanonicalHashAuthority;
  private readonly invariantRunner: InvariantRunner;
  private readonly witnessAuthority: WitnessAuthority;
  private readonly witnessVersion: string;

  constructor(witnessVersion: string = 'v1') {
    this.hashAuthority = new CanonicalHashAuthority();
    this.invariantRunner = new InvariantRunner();
    this.witnessAuthority = new WitnessAuthority(witnessVersion);
    this.witnessVersion = witnessVersion;
    
    // Register standard invariants
    const standardInvariants = ReplayInvariants.getStandardInvariants();
    for (const invariant of standardInvariants) {
      this.invariantRunner.registerInvariant(invariant);
    }
  }

  /**
   * Replay event stream deterministically
   */
  replay(eventStream: ReplayEventStream): ReplayResult {
    // Create fresh state machine for each replay (pure functional approach)
    const stateMachine = new ReplayStateMachine();
    
    // Process events in order
    const events = eventStream.getEvents();
    for (const event of events) {
      stateMachine.applyEvent(event);
    }
    
    // Get final state
    const state = stateMachine.getState();
    
    // Canonicalize entire event stream
    const canonicalBytes = this.hashAuthority.canonicalize(eventStream.toJSON());
    
    // Compute fingerprint
    const fingerprint = this.hashAuthority.computeFingerprint(canonicalBytes);
    
    // Run invariants
    const violations = this.invariantRunner.runInvariants(state);
    
    // Compute witness root through WitnessAuthority (sole witness authority)
    const { witnessRoot, lineageGraph } = this.witnessAuthority.generateWitness(
      eventStream,
      state,
      violations
    );
    
    const result: ReplayResult = {
      canonical_bytes: canonicalBytes,
      fingerprint,
      lineage_graph: lineageGraph,
      state,
      witness_root: witnessRoot,
      violations,
      state_version: state.state_version,
      artifact_count: state.artifacts.size
    };
    
    // Deep freeze result to prevent post-certification mutation
    // Constitutional law: Certified replay outputs must become observationally immutable
    return deepFreeze(result);
  }

}
