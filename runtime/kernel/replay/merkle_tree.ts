/**
 * MERKLE TREE
 * 
 * Pure TypeScript implementation of Merkle tree construction.
 * 
 * Requirements:
 * - canonical leaf hashing
 * - deterministic leaf ordering
 * - byte concatenation for parent construction
 * - odd node handling (duplicate last node)
 * - witness proof generation
 * - runtime-neutral (no Buffer, no Node crypto)
 * 
 * PHASE 8: CONSTITUTIONAL IDENTITY SEPARATION
 * PHASE 9: CONSTITUTIONAL CLOSURE
 */

import { WitnessLeafId, toWitnessLeafId } from './replay_types';
import { DeterministicFailureFactory } from './deterministic_failure';
import { CertificateAuthority } from './certificate_authority';
import { concatBytes, utf8Encode, utf8Decode, hexDecode } from './byte_utils';

// Hash domain constants for constitutional governance
export const HASH_DOMAIN_LEAF = 0x00;
export const HASH_DOMAIN_PARENT = 0x01;

// Deterministic execution limits for bounded execution guarantees
export const MAX_MERKLE_LEAVES = 1000000;

export interface MerkleLeaf {
  leaf_id: WitnessLeafId; // Constitutional rule: witness leaf IDs are branded
  leaf_bytes: Uint8Array;
  leaf_hash: string;
}

export interface MerkleNode {
  node_hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
  leaf?: MerkleLeaf;
}

export type SiblingPosition = 'LEFT' | 'RIGHT';

export interface MerkleProof {
  leaf_hash: string;
  sibling_hashes: string[];
  sibling_positions: SiblingPosition[]; // Explicit LEFT/RIGHT position typing
  root_hash: string;
}

export class MerkleTree {
  private readonly leaves: MerkleLeaf[];
  private readonly root: MerkleNode;
  private readonly merkleVersion: string;

  constructor(leaves: MerkleLeaf[], merkleVersion: string = 'v1') {
    this.merkleVersion = merkleVersion;
    
    // Constitutional rule: enforce execution limits
    if (leaves.length > MAX_MERKLE_LEAVES) {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.executionLimitExceeded('MAX_MERKLE_LEAVES', MAX_MERKLE_LEAVES, leaves.length)
      );
    }
    
    // Constitutional rule: clone leaves to avoid mutating input objects
    this.leaves = leaves.map(leaf => ({
      leaf_id: leaf.leaf_id,
      leaf_bytes: leaf.leaf_bytes,
      leaf_hash: ''
    }));
    
    // Constitutional rule: reject duplicate leaf IDs
    const seenLeafIds = new Set<string>();
    for (const leaf of this.leaves) {
      if (seenLeafIds.has(leaf.leaf_id)) {
        throw DeterministicFailureFactory.toError(
          DeterministicFailureFactory.duplicateLeafId(leaf.leaf_id)
        );
      }
      seenLeafIds.add(leaf.leaf_id);
    }
    
    // Constitutional rule: deterministic leaf ordering by leaf_id
    this.leaves.sort((a, b) => {
      if (a.leaf_id < b.leaf_id) return -1;
      if (a.leaf_id > b.leaf_id) return 1;
      return 0;
    });
    
    // Compute leaf hashes
    for (const leaf of this.leaves) {
      leaf.leaf_hash = this.hashBytes(leaf.leaf_bytes);
    }
    
    // Build Merkle tree
    this.root = this.buildTree(this.leaves);
  }

  /**
   * Get root hash
   */
  getRootHash(): string {
    return this.root.node_hash;
  }

  /**
   * Generate witness proof for a leaf
   */
  generateProof(leafId: string): MerkleProof | null {
    const leaf = this.leaves.find(l => l.leaf_id === leafId);
    if (!leaf) return null;

    const proof: MerkleProof = {
      leaf_hash: leaf.leaf_hash,
      sibling_hashes: [],
      sibling_positions: [],
      root_hash: this.root.node_hash
    };

    // Find path to root
    const path = this.findPath(leaf.leaf_hash, this.root, { sibling_hashes: [], sibling_positions: [] });
    if (!path) return null;

    proof.sibling_hashes = path.sibling_hashes;
    proof.sibling_positions = path.sibling_positions;

    return proof;
  }

  /**
   * Verify witness proof
   */
  static verifyProof(proof: MerkleProof): boolean {
    let currentHash = proof.leaf_hash;
    
    for (let i = 0; i < proof.sibling_hashes.length; i++) {
      const siblingHash = proof.sibling_hashes[i];
      const position = proof.sibling_positions[i];
      
      if (position === 'LEFT') {
        currentHash = MerkleTree.hashParent(
          this.hexToUint8Array(siblingHash),
          this.hexToUint8Array(currentHash)
        );
      } else {
        currentHash = MerkleTree.hashParent(
          this.hexToUint8Array(currentHash),
          this.hexToUint8Array(siblingHash)
        );
      }
    }
    
    return currentHash === proof.root_hash;
  }

  /**
   * Build Merkle tree from leaves
   */
  private buildTree(leaves: MerkleLeaf[]): MerkleNode {
    if (leaves.length === 0) {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.create(
          'INVALID_MERKLE_TREE' as any,
          'WITNESS_CONSTRUCTION' as any,
          { reason: 'Cannot build Merkle tree with zero leaves' }
        )
      );
    }

    if (leaves.length === 1) {
      return {
        node_hash: leaves[0].leaf_hash,
        leaf: leaves[0]
      };
    }

    // Build leaf nodes
    let nodes: MerkleNode[] = leaves.map(leaf => ({
      node_hash: leaf.leaf_hash,
      leaf
    }));

    // Build tree level by level
    while (nodes.length > 1) {
      const nextLevel: MerkleNode[] = [];
      
      for (let i = 0; i < nodes.length; i += 2) {
        const left = nodes[i];
        const right = i + 1 < nodes.length ? nodes[i + 1] : left; // Duplicate last node if odd
        
        const parentHash = this.hashParent(
          MerkleTree.hexToUint8Array(left.node_hash),
          MerkleTree.hexToUint8Array(right.node_hash)
        );
        
        nextLevel.push({
          node_hash: parentHash,
          left,
          right
        });
      }
      
      nodes = nextLevel;
    }

    return nodes[0];
  }

  /**
   * Find path from leaf to root
   */
  private findPath(
    leafHash: string,
    node: MerkleNode,
    path: { sibling_hashes: string[]; sibling_positions: SiblingPosition[] }
  ): { sibling_hashes: string[]; sibling_positions: SiblingPosition[] } | null {
    if (node.leaf && node.leaf.leaf_hash === leafHash) {
      return path;
    }

    if (node.left) {
      const leftPath = this.findPath(leafHash, node.left, {
        sibling_hashes: [...path.sibling_hashes],
        sibling_positions: [...path.sibling_positions]
      });
      
      if (leftPath) {
        if (node.right) {
          leftPath.sibling_hashes.push(node.right.node_hash);
          leftPath.sibling_positions.push('LEFT');
        }
        return leftPath;
      }
    }

    if (node.right) {
      const rightPath = this.findPath(leafHash, node.right, {
        sibling_hashes: [...path.sibling_hashes],
        sibling_positions: [...path.sibling_positions]
      });
      
      if (rightPath) {
        rightPath.sibling_hashes.push(node.left.node_hash);
        rightPath.sibling_positions.push('RIGHT');
        return rightPath;
      }
    }

    return null;
  }

  /**
   * Hash bytes using SHA-256 with domain separation
   * Leaf hashes use HASH_DOMAIN_LEAF prefix, parent hashes use HASH_DOMAIN_PARENT prefix
   * Constitutional rule: Uses CertificateAuthority for SHA-256 (sole hash authority)
   */
  private hashBytes(bytes: Uint8Array, isLeaf: boolean = true): string {
    const prefix = isLeaf ? new Uint8Array([HASH_DOMAIN_LEAF]) : new Uint8Array([HASH_DOMAIN_PARENT]);
    const combined = concatBytes(prefix, bytes);
    const string = utf8Decode(combined);
    return CertificateAuthority.sha256(string);
  }

  /**
   * Hash parent using byte concatenation with domain separation
   */
  private hashParent(left: Uint8Array, right: Uint8Array): string {
    const combined = concatBytes(left, right);
    return this.hashBytes(combined, false);
  }

  /**
   * Static method to hash parent (for verification)
   */
  private static hashParent(left: Uint8Array, right: Uint8Array): string {
    const prefix = new Uint8Array([HASH_DOMAIN_PARENT]);
    const combined = concatBytes(prefix, left, right);
    const string = utf8Decode(combined);
    return CertificateAuthority.sha256(string);
  }

  /**
   * Convert hex string to Uint8Array
   * Runtime-neutral implementation
   */
  private static hexToUint8Array(hex: string): Uint8Array {
    return hexDecode(hex);
  }
}
