"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplayVerification = void 0;
const deterministic_replay_engine_1 = require("./deterministic_replay_engine");
const state_serializer_1 = require("./state_serializer");
const canonical_json_1 = require("./canonical_json");
class ReplayVerification {
    engine;
    stateSerializer;
    constructor() {
        this.engine = new deterministic_replay_engine_1.DeterministicReplayEngine();
        this.stateSerializer = new state_serializer_1.StateSerializer();
    }
    /**
     * Verify replay determinism
     * Constitutional rule: comprehensive comparison including state, violations, and lineage
     */
    verifyDeterminism(eventStream, expectedResult) {
        const actualResult = this.engine.replay(eventStream);
        return (this.compareWitnessRoots(actualResult.witness_root, expectedResult.witness_root) &&
            this.compareFingerprints(actualResult.fingerprint, expectedResult.fingerprint) &&
            this.compareCanonicalBytes(actualResult.canonical_bytes, expectedResult.canonical_bytes) &&
            this.compareStateSerialization(actualResult.state, expectedResult.state) &&
            this.compareViolations(actualResult.violations, expectedResult.violations) &&
            this.compareLineage(actualResult.lineage_graph, expectedResult.lineage_graph) &&
            this.compareStateVersion(actualResult.state_version, expectedResult.state_version) &&
            this.compareArtifactCount(actualResult.artifact_count, expectedResult.artifact_count));
    }
    /**
     * Verify witness root
     */
    verifyWitnessRoot(eventStream, expectedWitnessRoot) {
        const actualResult = this.engine.replay(eventStream);
        return this.compareWitnessRoots(actualResult.witness_root, expectedWitnessRoot);
    }
    /**
     * Verify fingerprint
     */
    verifyFingerprint(eventStream, expectedFingerprint) {
        const actualResult = this.engine.replay(eventStream);
        return this.compareFingerprints(actualResult.fingerprint, expectedFingerprint);
    }
    /**
     * Verify canonical bytes
     */
    verifyCanonicalBytes(eventStream, expectedCanonicalBytes) {
        const actualResult = this.engine.replay(eventStream);
        return this.compareCanonicalBytes(actualResult.canonical_bytes, expectedCanonicalBytes);
    }
    /**
     * Verify replay reproducibility
     */
    verifyReproducibility(eventStream, iterations = 10) {
        const results = [];
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
    compareReplayResults(actual, expected) {
        return (this.compareWitnessRoots(actual.witness_root, expected.witness_root) &&
            this.compareFingerprints(actual.fingerprint, expected.fingerprint) &&
            this.compareCanonicalBytes(actual.canonical_bytes, expected.canonical_bytes) &&
            this.compareStateSerialization(actual.state, expected.state) &&
            this.compareViolations(actual.violations, expected.violations) &&
            this.compareLineage(actual.lineage_graph, expected.lineage_graph) &&
            this.compareStateVersion(actual.state_version, expected.state_version) &&
            this.compareArtifactCount(actual.artifact_count, expected.artifact_count));
    }
    /**
     * Compare witness roots
     */
    compareWitnessRoots(actual, expected) {
        return actual.witness_root === expected.witness_root &&
            actual.witness_algorithm === expected.witness_algorithm &&
            actual.witness_version === expected.witness_version &&
            actual.leaf_count === expected.leaf_count &&
            actual.tree_height === expected.tree_height;
    }
    /**
     * Compare fingerprints
     */
    compareFingerprints(actual, expected) {
        return actual.hash === expected.hash &&
            actual.hash_algorithm === expected.hash_algorithm &&
            actual.hash_version === expected.hash_version;
    }
    /**
     * Compare canonical bytes
     */
    compareCanonicalBytes(actual, expected) {
        return actual.bytes === expected.bytes &&
            actual.canonicalization_version === expected.canonicalization_version;
    }
    /**
     * Compare state serialization
     * Constitutional rule: compare canonicalized state bytes
     */
    compareStateSerialization(actual, expected) {
        const actualBytes = this.stateSerializer.serializeState(actual);
        const expectedBytes = this.stateSerializer.serializeState(expected);
        return actualBytes.equals(expectedBytes);
    }
    /**
     * Compare violations
     * Constitutional rule: compare canonicalized violations
     */
    compareViolations(actual, expected) {
        const actualBytes = this.stateSerializer.serializeViolations(actual);
        const expectedBytes = this.stateSerializer.serializeViolations(expected);
        return actualBytes.equals(expectedBytes);
    }
    /**
     * Compare lineage
     * Constitutional rule: compare canonicalized lineage
     */
    compareLineage(actual, expected) {
        const actualBytes = canonical_json_1.CanonicalJson.toBuffer(actual);
        const expectedBytes = canonical_json_1.CanonicalJson.toBuffer(expected);
        return actualBytes.equals(expectedBytes);
    }
    /**
     * Compare state version
     * Constitutional rule: compare state version strings
     */
    compareStateVersion(actual, expected) {
        return actual === expected;
    }
    /**
     * Compare artifact count
     * Constitutional rule: compare artifact counts
     */
    compareArtifactCount(actual, expected) {
        return actual === expected;
    }
}
exports.ReplayVerification = ReplayVerification;
