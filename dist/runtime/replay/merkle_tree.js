"use strict";
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
 *
 * PHASE 8: CONSTITUTIONAL IDENTITY SEPARATION
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerkleTree = exports.MAX_MERKLE_LEAVES = exports.HASH_DOMAIN_PARENT = exports.HASH_DOMAIN_LEAF = void 0;
const crypto = __importStar(require("crypto"));
const deterministic_failure_1 = require("./deterministic_failure");
// Hash domain constants for constitutional governance
exports.HASH_DOMAIN_LEAF = 0x00;
exports.HASH_DOMAIN_PARENT = 0x01;
// Deterministic execution limits for bounded execution guarantees
exports.MAX_MERKLE_LEAVES = 1000000;
class MerkleTree {
    leaves;
    root;
    merkleVersion;
    constructor(leaves, merkleVersion = 'v1') {
        this.merkleVersion = merkleVersion;
        // Constitutional rule: enforce execution limits
        if (leaves.length > exports.MAX_MERKLE_LEAVES) {
            throw deterministic_failure_1.DeterministicFailureFactory.toError(deterministic_failure_1.DeterministicFailureFactory.executionLimitExceeded('MAX_MERKLE_LEAVES', exports.MAX_MERKLE_LEAVES, leaves.length));
        }
        // Constitutional rule: clone leaves to avoid mutating input objects
        this.leaves = leaves.map(leaf => ({
            leaf_id: leaf.leaf_id,
            leaf_bytes: leaf.leaf_bytes,
            leaf_hash: ''
        }));
        // Constitutional rule: reject duplicate leaf IDs
        const seenLeafIds = new Set();
        for (const leaf of this.leaves) {
            if (seenLeafIds.has(leaf.leaf_id)) {
                throw deterministic_failure_1.DeterministicFailureFactory.toError(deterministic_failure_1.DeterministicFailureFactory.duplicateLeafId(leaf.leaf_id));
            }
            seenLeafIds.add(leaf.leaf_id);
        }
        // Constitutional rule: deterministic leaf ordering by leaf_id
        this.leaves.sort((a, b) => {
            if (a.leaf_id < b.leaf_id)
                return -1;
            if (a.leaf_id > b.leaf_id)
                return 1;
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
    getRootHash() {
        return this.root.node_hash;
    }
    /**
     * Generate witness proof for a leaf
     */
    generateProof(leafId) {
        const leaf = this.leaves.find(l => l.leaf_id === leafId);
        if (!leaf)
            return null;
        const proof = {
            leaf_hash: leaf.leaf_hash,
            sibling_hashes: [],
            sibling_positions: [],
            root_hash: this.root.node_hash
        };
        // Find path to root
        const path = this.findPath(leaf.leaf_hash, this.root, []);
        if (!path)
            return null;
        proof.sibling_hashes = path.sibling_hashes;
        proof.sibling_positions = path.sibling_positions;
        return proof;
    }
    /**
     * Verify witness proof
     */
    static verifyProof(proof) {
        let currentHash = proof.leaf_hash;
        for (let i = 0; i < proof.sibling_hashes.length; i++) {
            const siblingHash = proof.sibling_hashes[i];
            const position = proof.sibling_positions[i];
            if (position === 'LEFT') {
                currentHash = MerkleTree.hashParent(Buffer.from(siblingHash, 'hex'), Buffer.from(currentHash, 'hex'));
            }
            else {
                currentHash = MerkleTree.hashParent(Buffer.from(currentHash, 'hex'), Buffer.from(siblingHash, 'hex'));
            }
        }
        return currentHash === proof.root_hash;
    }
    /**
     * Build Merkle tree from leaves
     */
    buildTree(leaves) {
        if (leaves.length === 0) {
            throw new Error('Cannot build Merkle tree with zero leaves');
        }
        if (leaves.length === 1) {
            return {
                node_hash: leaves[0].leaf_hash,
                leaf: leaves[0]
            };
        }
        // Build leaf nodes
        let nodes = leaves.map(leaf => ({
            node_hash: leaf.leaf_hash,
            leaf
        }));
        // Build tree level by level
        while (nodes.length > 1) {
            const nextLevel = [];
            for (let i = 0; i < nodes.length; i += 2) {
                const left = nodes[i];
                const right = i + 1 < nodes.length ? nodes[i + 1] : left; // Duplicate last node if odd
                const parentHash = this.hashParent(Buffer.from(left.node_hash, 'hex'), Buffer.from(right.node_hash, 'hex'));
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
    findPath(leafHash, node, path) {
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
     */
    hashBytes(bytes, isLeaf = true) {
        const prefix = isLeaf ? Buffer.from([exports.HASH_DOMAIN_LEAF]) : Buffer.from([exports.HASH_DOMAIN_PARENT]);
        const combined = Buffer.concat([prefix, bytes]);
        return crypto.createHash('sha256').update(combined).digest('hex');
    }
    /**
     * Hash parent using byte concatenation with domain separation
     */
    hashParent(left, right) {
        const combined = Buffer.concat([left, right]);
        return this.hashBytes(combined, false);
    }
    /**
     * Static method to hash parent (for verification)
     */
    static hashParent(left, right) {
        const prefix = Buffer.from([exports.HASH_DOMAIN_PARENT]);
        const combined = Buffer.concat([prefix, left, right]);
        return crypto.createHash('sha256').update(combined).digest('hex');
    }
}
exports.MerkleTree = MerkleTree;
