"use strict";
/**
 * WITNESS AUTHORITY
 *
 * Pure TypeScript implementation of witness authority.
 *
 * Requirements:
 * - deterministic witness root
 * - Merkle tree construction
 * - pure functional execution
 * - replay reproducibility
 * - no infrastructure dependencies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WitnessAuthority = void 0;
const canonical_hash_authority_1 = require("./canonical_hash_authority");
const merkle_tree_1 = require("./merkle_tree");
const state_serializer_1 = require("./state_serializer");
const canonical_json_1 = require("./canonical_json");
const replay_types_1 = require("./replay_types");
class WitnessAuthority {
    hashAuthority;
    stateSerializer;
    witnessVersion;
    constructor(witnessVersion = 'v1') {
        this.hashAuthority = new canonical_hash_authority_1.CanonicalHashAuthority();
        this.stateSerializer = new state_serializer_1.StateSerializer();
        this.witnessVersion = witnessVersion;
    }
    /**
     * Generate witness root from replay result
     */
    generateWitnessRoot(replayResult) {
        return replayResult.witness_root;
    }
    /**
     * Generate witness from event stream
     * Witness Flow: event stream → canonicalization → fingerprint → invariant verification → replay state → witness root
     */
    generateWitness(eventStream, invariantRunner, state) {
        // Step 1: Canonicalization
        const canonicalBytes = this.canonicalizeEventStream(eventStream);
        // Step 2: Fingerprint
        const fingerprint = this.hashAuthority.computeFingerprint(canonicalBytes);
        // Step 3: Invariant verification
        const violations = invariantRunner.runInvariants(state);
        // Step 4: Build lineage graph
        const lineage = this.buildLineageGraph(state);
        // Step 5: Compute witness root
        const witnessRoot = this.computeWitnessRoot(canonicalBytes, fingerprint, lineage, state, violations);
        return witnessRoot;
    }
    /**
     * Canonicalize event stream
     */
    canonicalizeEventStream(eventStream) {
        const json = eventStream.toJSON();
        return this.hashAuthority.canonicalize(json);
    }
    /**
     * Build lineage graph from state
     * Constitutional rule: deterministic artifact iteration ordering
     */
    buildLineageGraph(state) {
        const edges = [];
        // Constitutional rule: sort artifact IDs deterministically for lineage derivation
        const sortedArtifactIds = Array.from(state.artifacts.keys()).sort((a, b) => {
            if (a < b)
                return -1;
            if (a > b)
                return 1;
            return 0;
        });
        for (const artifactId of sortedArtifactIds) {
            const artifactState = state.artifacts.get(artifactId);
            if (artifactState) {
                for (const parentId of artifactState.artifact_lineage) {
                    edges.push({
                        parent_id: parentId,
                        child_id: artifactId,
                        edge_type: 'derivation'
                    });
                }
            }
        }
        return {
            edges,
            graph_version: '1.0'
        };
    }
    /**
     * Compute witness root using Merkle tree construction
     */
    computeWitnessRoot(canonicalBytes, fingerprint, lineage, state, violations) {
        // Create base Merkle leaves from components
        const baseLeaves = [
            {
                leaf_id: (0, replay_types_1.toWitnessLeafId)('canonical_bytes'),
                leaf_bytes: Buffer.from(canonicalBytes.bytes, 'base64url'),
                leaf_hash: ''
            },
            {
                leaf_id: (0, replay_types_1.toWitnessLeafId)('fingerprint'),
                leaf_bytes: Buffer.from(fingerprint.hash.replace(/^sha256:/, ''), 'hex'),
                leaf_hash: ''
            },
            {
                leaf_id: (0, replay_types_1.toWitnessLeafId)('lineage'),
                leaf_bytes: canonical_json_1.CanonicalJson.toBuffer(lineage),
                leaf_hash: ''
            },
            {
                leaf_id: (0, replay_types_1.toWitnessLeafId)('state_version'),
                leaf_bytes: Buffer.from(state.state_version, 'utf8'),
                leaf_hash: ''
            },
            {
                leaf_id: (0, replay_types_1.toWitnessLeafId)('schema_version'),
                leaf_bytes: Buffer.from('1.0', 'utf8'),
                leaf_hash: ''
            },
            {
                leaf_id: (0, replay_types_1.toWitnessLeafId)('replay_version'),
                leaf_bytes: Buffer.from('1.0', 'utf8'),
                leaf_hash: ''
            },
            {
                leaf_id: (0, replay_types_1.toWitnessLeafId)('policy_version'),
                leaf_bytes: Buffer.from('1.0', 'utf8'),
                leaf_hash: ''
            },
            {
                leaf_id: (0, replay_types_1.toWitnessLeafId)('canonicalization_version'),
                leaf_bytes: Buffer.from('1.0', 'utf8'),
                leaf_hash: ''
            },
            {
                leaf_id: (0, replay_types_1.toWitnessLeafId)('hash_version'),
                leaf_bytes: Buffer.from('sha256', 'utf8'),
                leaf_hash: ''
            },
            {
                leaf_id: (0, replay_types_1.toWitnessLeafId)('artifact_count'),
                leaf_bytes: Buffer.from(state.artifacts.size.toString(), 'utf8'),
                leaf_hash: ''
            },
            {
                leaf_id: (0, replay_types_1.toWitnessLeafId)('state_contents'),
                leaf_bytes: this.stateSerializer.serializeState(state),
                leaf_hash: ''
            },
            {
                leaf_id: (0, replay_types_1.toWitnessLeafId)('violations_canonical'),
                leaf_bytes: this.stateSerializer.serializeViolations(violations),
                leaf_hash: ''
            }
        ];
        // Add leaf_count and tree_height after base leaves are constructed
        const leafCount = baseLeaves.length + 2;
        const treeHeight = baseLeaves.length > 0 ? Math.ceil(Math.log2(leafCount)) : 0;
        const leaves = [
            ...baseLeaves,
            {
                leaf_id: (0, replay_types_1.toWitnessLeafId)('leaf_count'),
                leaf_bytes: Buffer.from(leafCount.toString(), 'utf8'),
                leaf_hash: ''
            },
            {
                leaf_id: (0, replay_types_1.toWitnessLeafId)('tree_height'),
                leaf_bytes: Buffer.from(treeHeight.toString(), 'utf8'),
                leaf_hash: ''
            }
        ];
        // Build Merkle tree
        const merkleTree = new merkle_tree_1.MerkleTree(leaves, this.witnessVersion);
        const rootHash = merkleTree.getRootHash();
        return {
            witness_root: rootHash,
            witness_algorithm: `merkle_sha256_${this.witnessVersion}`,
            witness_version: this.witnessVersion,
            leaf_count: leafCount,
            tree_height: treeHeight
        };
    }
    /**
     * Verify witness root
     */
    verifyWitnessRoot(eventStream, invariantRunner, state, expectedWitnessRoot) {
        const actualWitnessRoot = this.generateWitness(eventStream, invariantRunner, state);
        return actualWitnessRoot.witness_root === expectedWitnessRoot.witness_root &&
            actualWitnessRoot.witness_algorithm === expectedWitnessRoot.witness_algorithm &&
            actualWitnessRoot.witness_version === expectedWitnessRoot.witness_version &&
            actualWitnessRoot.leaf_count === expectedWitnessRoot.leaf_count &&
            actualWitnessRoot.tree_height === expectedWitnessRoot.tree_height;
    }
}
exports.WitnessAuthority = WitnessAuthority;
