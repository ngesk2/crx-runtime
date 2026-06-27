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

import { CanonicalHashAuthority } from '../witness/canonical_hash_authority';
import { ReplayEventStream } from './replay_event_stream';
import { InvariantRunner } from './invariant_runner';
import { MerkleTree, MerkleLeaf } from './merkle_tree';
import { StateSerializer } from './state_serializer';
import { CanonicalJson } from './canonical_json';
import { ReplayResult, WitnessRoot, CanonicalBytes, Fingerprint, LineageGraph, ReplayState, toWitnessLeafId } from './replay_types';
import { deepFreeze } from './utils/deep_freeze';
import { CertificateAuthority } from '../witness/certificate_authority';
import { getConstitutionalLawManifest } from './constitutional_law_manifest';
import { utf8Encode, hexDecode, base64UrlDecode } from './byte_utils';

export class WitnessAuthority {
  private readonly hashAuthority: CanonicalHashAuthority;
  private readonly stateSerializer: StateSerializer;
  private readonly witnessVersion: string;

  constructor(witnessVersion: string = 'v1') {
    this.hashAuthority = new CanonicalHashAuthority();
    this.stateSerializer = new StateSerializer();
    this.witnessVersion = witnessVersion;
  }

  /**
   * Generate witness root from replay result
   */
  generateWitnessRoot(replayResult: ReplayResult): WitnessRoot {
    return replayResult.witness_root;
  }

  /**
   * Generate witness from event stream
   * Witness Flow: event stream → canonicalization → fingerprint → invariant verification → replay state → witness root
   */
  generateWitness(
    eventStream: ReplayEventStream,
    state: ReplayState,
    violations: any[]
  ): { witnessRoot: WitnessRoot, lineageGraph: LineageGraph } {
    // Step 1: Canonicalization
    const canonicalBytes = this.canonicalizeEventStream(eventStream);
    
    // Step 2: Fingerprint
    const fingerprint = this.hashAuthority.computeFingerprint(canonicalBytes);
    
    // Step 3: Build lineage graph
    const lineage = this.buildLineageGraph(state);
    
    // Step 4: Compute witness root
    const witnessRoot = this.computeWitnessRoot(canonicalBytes, fingerprint, lineage, state, violations);
    
    // Deep freeze witness root to prevent post-certification mutation
    return deepFreeze({ witnessRoot, lineageGraph: lineage });
  }

  /**
   * Canonicalize event stream
   */
  private canonicalizeEventStream(eventStream: ReplayEventStream): CanonicalBytes {
    const json = eventStream.toJSON();
    return this.hashAuthority.canonicalize(json);
  }

  /**
   * Build lineage graph from state
   * Constitutional rule: deterministic artifact iteration ordering
   */
  public buildLineageGraph(state: ReplayState): LineageGraph {
    const edges: any[] = [];
    
    // Constitutional rule: sort artifact IDs deterministically for lineage derivation
    const sortedArtifactIds = Array.from(state.artifacts.keys()).sort((a, b) => {
      if (a < b) return -1;
      if (a > b) return 1;
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
  private computeWitnessRoot(
    canonicalBytes: CanonicalBytes,
    fingerprint: Fingerprint,
    lineage: LineageGraph,
    state: ReplayState,
    violations: any[]
  ): WitnessRoot {
    // Compute constitutional law commitment
    const lawManifest = getConstitutionalLawManifest();
    const constitutionalLawCommitment = CertificateAuthority.computeConstitutionalLawCommitment({
      invariant_definitions: lawManifest.invariant_definitions,
      replay_rules: lawManifest.replay_rules,
      witness_rules: lawManifest.witness_rules,
      failure_rules: lawManifest.failure_codes,
      authority_hierarchy: lawManifest.authority_hierarchy
    });

    // Create base Merkle leaves from components
    const baseLeaves: MerkleLeaf[] = [
      {
        leaf_id: toWitnessLeafId('canonical_bytes'),
        leaf_bytes: base64UrlDecode(canonicalBytes.bytes),
        leaf_hash: ''
      },
      {
        leaf_id: toWitnessLeafId('fingerprint'),
        leaf_bytes: hexDecode(fingerprint.hash.replace(/^sha256:/, '')),
        leaf_hash: ''
      },
      {
        leaf_id: toWitnessLeafId('lineage'),
        leaf_bytes: CanonicalJson.toUint8Array(lineage),
        leaf_hash: ''
      },
      {
        leaf_id: toWitnessLeafId('state_version'),
        leaf_bytes: utf8Encode(state.state_version),
        leaf_hash: ''
      },
      {
        leaf_id: toWitnessLeafId('schema_version'),
        leaf_bytes: utf8Encode('1.0'),
        leaf_hash: ''
      },
      {
        leaf_id: toWitnessLeafId('replay_version'),
        leaf_bytes: utf8Encode('1.0'),
        leaf_hash: ''
      },
      {
        leaf_id: toWitnessLeafId('policy_version'),
        leaf_bytes: utf8Encode('1.0'),
        leaf_hash: ''
      },
      {
        leaf_id: toWitnessLeafId('canonicalization_version'),
        leaf_bytes: utf8Encode('1.0'),
        leaf_hash: ''
      },
      {
        leaf_id: toWitnessLeafId('hash_version'),
        leaf_bytes: utf8Encode('sha256'),
        leaf_hash: ''
      },
      {
        leaf_id: toWitnessLeafId('artifact_count'),
        leaf_bytes: utf8Encode(state.artifacts.size.toString()),
        leaf_hash: ''
      },
      {
        leaf_id: toWitnessLeafId('state_contents'),
        leaf_bytes: this.stateSerializer.serializeState(state),
        leaf_hash: ''
      },
      {
        leaf_id: toWitnessLeafId('violations_canonical'),
        leaf_bytes: this.stateSerializer.serializeViolations(violations),
        leaf_hash: ''
      },
      {
        leaf_id: toWitnessLeafId('constitutional_law_commitment'),
        leaf_bytes: utf8Encode(constitutionalLawCommitment),
        leaf_hash: ''
      }
    ];
    
    // Add leaf_count and tree_height after base leaves are constructed
    const leafCount = baseLeaves.length + 2;
    const treeHeight = baseLeaves.length > 0 ? Math.ceil(Math.log2(leafCount)) : 0;
    
    const leaves: MerkleLeaf[] = [
      ...baseLeaves,
      {
        leaf_id: toWitnessLeafId('leaf_count'),
        leaf_bytes: utf8Encode(leafCount.toString()),
        leaf_hash: ''
      },
      {
        leaf_id: toWitnessLeafId('tree_height'),
        leaf_bytes: utf8Encode(treeHeight.toString()),
        leaf_hash: ''
      }
    ];
    
    // Build Merkle tree
    const merkleTree = new MerkleTree(leaves, this.witnessVersion);
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
  verifyWitnessRoot(
    eventStream: ReplayEventStream,
    state: ReplayState,
    violations: any[],
    expectedWitnessRoot: WitnessRoot
  ): boolean {
    const { witnessRoot: actualWitnessRoot } = this.generateWitness(eventStream, state, violations);
    
    return actualWitnessRoot.witness_root === expectedWitnessRoot.witness_root &&
           actualWitnessRoot.witness_algorithm === expectedWitnessRoot.witness_algorithm &&
           actualWitnessRoot.witness_version === expectedWitnessRoot.witness_version &&
           actualWitnessRoot.leaf_count === expectedWitnessRoot.leaf_count &&
           actualWitnessRoot.tree_height === expectedWitnessRoot.tree_height;
  }
}
