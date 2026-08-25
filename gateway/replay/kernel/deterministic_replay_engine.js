"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeterministicReplayEngine = void 0;
const replay_state_machine_1 = require("./replay_state_machine");
const canonical_hash_authority_1 = require("./canonical_hash_authority");
const invariant_runner_1 = require("./invariant_runner");
const replay_invariants_1 = require("./replay_invariants");
const witness_authority_1 = require("./witness_authority");
class DeterministicReplayEngine {
    hashAuthority;
    invariantRunner;
    witnessAuthority;
    witnessVersion;
    constructor(witnessVersion = 'v1') {
        this.hashAuthority = new canonical_hash_authority_1.CanonicalHashAuthority();
        this.invariantRunner = new invariant_runner_1.InvariantRunner();
        this.witnessAuthority = new witness_authority_1.WitnessAuthority(witnessVersion);
        this.witnessVersion = witnessVersion;
        // Register standard invariants
        const standardInvariants = replay_invariants_1.ReplayInvariants.getStandardInvariants();
        for (const invariant of standardInvariants) {
            this.invariantRunner.registerInvariant(invariant);
        }
    }
    /**
     * Replay event stream deterministically
     */
    replay(eventStream) {
        // Create fresh state machine for each replay (pure functional approach)
        const stateMachine = new replay_state_machine_1.ReplayStateMachine();
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
        const witnessRoot = this.witnessAuthority.generateWitness(eventStream, this.invariantRunner, state);
        // Build lineage graph
        const lineageGraph = this.witnessAuthority.buildLineageGraph(state);
        return {
            canonical_bytes: canonicalBytes,
            fingerprint,
            lineage_graph: lineageGraph,
            state,
            witness_root: witnessRoot,
            violations,
            state_version: state.state_version,
            artifact_count: state.artifacts.size
        };
    }
}
exports.DeterministicReplayEngine = DeterministicReplayEngine;
