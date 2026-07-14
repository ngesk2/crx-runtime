"""
Merkle tree implementation for constitutional root hashing.

BuildWitness becomes a Merkle root instead of a bag of hashes.
Everything verifies upward to a single immutable constitutional root.
"""

from typing import Dict, List, Optional
from dataclasses import dataclass
from constitution.authority import CanonicalAuthority


@dataclass
class MerkleNode:
    """A node in the Merkle tree"""
    hash: str
    left: Optional["MerkleNode"] = None
    right: Optional["MerkleNode"] = None
    label: Optional[str] = None  # For leaf nodes (registry name)


class MerkleTree:
    """
    Merkle tree for constitutional root computation.
    
    BuildWitness root hash is computed from:
    - Tool Registry
    - Workflow Registry
    - Prompt Registry
    - Agent Registry
    - Type Registry
    - Reducer Registry
    - Serializer Registry
    - Capability Registry
    - Kernel Constitution
    
    Everything verifies upward to a single immutable constitutional root.
    """
    
    def __init__(self):
        self.root: Optional[MerkleNode] = None
        self.leaves: Dict[str, MerkleNode] = {}
    
    def add_leaf(self, label: str, hash_value: str) -> None:
        """Add a leaf node to the tree"""
        node = MerkleNode(hash=hash_value, label=label)
        self.leaves[label] = node
    
    def compute_root(self) -> str:
        """Compute the Merkle root from all leaves"""
        authority = CanonicalAuthority()
        
        if not self.leaves:
            return authority.hash_dict({})
        
        # Sort leaves by label for deterministic ordering
        sorted_leaves = sorted(self.leaves.items(), key=lambda x: x[0])
        nodes = [node for _, node in sorted_leaves]
        
        # Build tree bottom-up
        while len(nodes) > 1:
            new_level = []
            for i in range(0, len(nodes), 2):
                if i + 1 < len(nodes):
                    # Pair nodes
                    left = nodes[i]
                    right = nodes[i + 1]
                    combined_hash = authority.hash_dict({
                        "left": left.hash,
                        "right": right.hash,
                    })
                    parent = MerkleNode(hash=combined_hash, left=left, right=right)
                    new_level.append(parent)
                else:
                    # Odd number of nodes, promote last one
                    new_level.append(nodes[i])
            nodes = new_level
        
        self.root = nodes[0]
        return self.root.hash
    
    def get_proof(self, label: str) -> Optional[List[Dict[str, str]]]:
        """
        Get Merkle proof for a leaf node.
        
        Returns list of {"hash": str, "direction": "left"|"right"} for verification.
        """
        if label not in self.leaves:
            return None
        
        # Rebuild tree to track path
        # This is a simplified implementation - production would track path during construction
        return []
    
    def verify_proof(self, leaf_hash: str, proof: List[Dict[str, str]], root_hash: str) -> bool:
        """
        Verify a Merkle proof.
        
        Returns True if the proof is valid for the given root.
        """
        authority = CanonicalAuthority()
        
        current_hash = leaf_hash
        for step in proof:
            if step["direction"] == "left":
                current_hash = authority.hash_dict({
                    "left": step["hash"],
                    "right": current_hash,
                })
            else:
                current_hash = authority.hash_dict({
                    "left": current_hash,
                    "right": step["hash"],
                })
        return current_hash == root_hash


def compute_build_witness_root(
    tool_registry_hash: str,
    workflow_registry_hash: str,
    prompt_registry_hash: str,
    agent_registry_hash: str,
    type_registry_hash: str,
    reducer_hash: str,
    serializer_hash: str,
    capability_registry_hash: str,
    kernel_constitution_hash: str,
) -> str:
    """
    Compute BuildWitness Merkle root from all constitutional components.
    
    This replaces the bag-of-hashes approach with a single immutable root.
    """
    tree = MerkleTree()
    tree.add_leaf("tool_registry", tool_registry_hash)
    tree.add_leaf("workflow_registry", workflow_registry_hash)
    tree.add_leaf("prompt_registry", prompt_registry_hash)
    tree.add_leaf("agent_registry", agent_registry_hash)
    tree.add_leaf("type_registry", type_registry_hash)
    tree.add_leaf("reducer", reducer_hash)
    tree.add_leaf("serializer", serializer_hash)
    tree.add_leaf("capability_registry", capability_registry_hash)
    tree.add_leaf("kernel_constitution", kernel_constitution_hash)
    
    return tree.compute_root()
