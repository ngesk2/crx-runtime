const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
const { runtimeFailureAuthority } = require('./runtime_failure_authority');
const { witnessAuthority } = require('./witness_authority');

/**
 * Merkle Replay Graph
 * 
 * Phase 7.3 — Merkle Replay Graph
 * 
 * Every node becomes a Merkle layer for subproof generation without revealing dependencies.
 * 
 * This enables proving specific execution paths without revealing full dependencies.
 * 
 * Example: Prove only Prompt → Inference → Completion without revealing tools.
 * 
 * Architecture:
 * 
 * Node Hash
 *     ↓
 * Merkle Layer
 *     ↓
 * Root
 * 
 * Benefits:
 * - Subproof generation for specific paths
 * - Privacy-preserving verification
 * - Distributed model verification
 * - Partial replay proof
 * - Incremental verification
 */

class MerkleReplayGraph {
  constructor() {
    // Removed serializer reference - use CanonicalAuthority directly
    this._failureAuthority = runtimeFailureAuthority;
    this._witnessAuthority = witnessAuthority;
    this._graphId = this._generateGraphId();
    this._graphVersion = '7.0.0';
    this._merkleTrees = new Map();
  }

  /**
   * Create Merkle tree from execution graph
   * @param {Object} executionGraph - Constitutional execution graph
   * @param {Object} transcript - Replay transcript
   * @returns {Object} Merkle tree
   */
  createMerkleTree(executionGraph, transcript) {
    const treeId = this._generateTreeId(executionGraph);
    
    // Create leaf hashes for each node
    const leafHashes = this._createLeafHashes(executionGraph, transcript);
    
    // Build Merkle tree layers
    const layers = this._buildMerkleLayers(leafHashes);
    
    // Compute root hash
    const rootHash = layers[layers.length - 1][0];
    
    const merkleTree = {
      tree_id: treeId,
      graph_version: executionGraph.graph_version,
      constitutional_version: executionGraph.constitutional_version,
      transcript_id: transcript.transcript_id,
      transcript_hash: transcript.transcript_metadata.hash,
      
      // Node hashes
      node_hashes: leafHashes,
      
      // Merkle layers
      layers: layers,
      
      // Root hash
      root_hash: rootHash,
      
      // Tree metadata
      tree_metadata: {
        frozen: true,
        hash: null
      }
    };
    
    // Compute tree hash
    const treeForHash = { ...merkleTree };
    delete treeForHash.tree_metadata.hash;
    merkleTree.tree_metadata.hash = CanonicalAuthority.hash(treeForHash);
    
    // Create tree witness
    const treeWitness = this._witnessAuthority.createWitness(merkleTree, {
      authority: 'MerkleReplayGraph',
      authority_version: this._graphVersion
    });
    merkleTree.tree_witness = treeWitness;
    
    // Deep freeze
    const frozenTree = this._freezeTree(merkleTree);
    
    this._merkleTrees.set(treeId, frozenTree);
    
    return frozenTree;
  }

  /**
   * Create leaf hashes for each node
   * @param {Object} executionGraph - Execution graph
   * @param {Object} transcript - Replay transcript
   * @returns {Object} Node hashes
   */
  _createLeafHashes(executionGraph, transcript) {
    const nodeHashes = {};
    
    for (const [nodeId, nodeDef] of Object.entries(executionGraph.nodes)) {
      const nodeData = this._extractNodeData(nodeId, nodeDef, transcript);
      const nodeHash = CanonicalAuthority.hash(nodeData);
      
      nodeHashes[nodeId] = {
        node_id: nodeId,
        node_type: nodeDef.node_type,
        witness_type: nodeDef.witness_type,
        dependencies: nodeDef.dependencies,
        node_hash: nodeHash,
        data_hash: CanonicalAuthority.hash(nodeData)
      };
    }
    
    return nodeHashes;
  }

  /**
   * Extract node data for hashing
   * @param {string} nodeId - Node ID
   * @param {Object} nodeDef - Node definition
   * @param {Object} transcript - Replay transcript
   * @returns {Object} Node data
   */
  _extractNodeData(nodeId, nodeDef, transcript) {
    if (nodeDef.witness_type && transcript[nodeDef.witness_type]) {
      return transcript[nodeDef.witness_type];
    }
    
    // For relationship proofs node
    if (nodeDef.node_type === 'prove_relationships') {
      return {
        node_id: nodeId,
        node_type: nodeDef.node_type,
        transcript_id: transcript.transcript_id
      };
    }
    
    return {
      node_id: nodeId,
      node_type: nodeDef.node_type
    };
  }

  /**
   * Build Merkle layers from leaf hashes
   * @param {Object} leafHashes - Leaf hashes
   * @returns {Array} Merkle layers
   */
  _buildMerkleLayers(leafHashes) {
    const layers = [];
    
    // Layer 0: Leaf hashes
    const leafLayer = Object.values(leafHashes).map(node => node.node_hash);
    layers.push(leafLayer);
    
    // Build subsequent layers
    let currentLayer = leafLayer;
    
    while (currentLayer.length > 1) {
      const nextLayer = [];
      
      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        const right = currentLayer[i + 1] || left; // Handle odd number of nodes
        
        const combined = CanonicalAuthority.hash({ left, right });
        nextLayer.push(combined);
      }
      
      layers.push(nextLayer);
      currentLayer = nextLayer;
    }
    
    return layers;
  }

  /**
   * Generate subproof for specific path
   * @param {Object} merkleTree - Merkle tree
   * @param {Array} path - Array of node IDs in path
   * @returns {Object} Subproof
   */
  generateSubproof(merkleTree, path) {
    const subproof = {
      tree_id: merkleTree.tree_id,
      root_hash: merkleTree.root_hash,
      path: path,
      proofs: [],
      computed_root: null,
      valid: false
    };
    
    // Collect proofs for each node in path
    for (const nodeId of path) {
      const nodeHash = merkleTree.node_hashes[nodeId];
      if (!nodeHash) {
        throw this._failureAuthority.createFailure(
          'NODE_NOT_FOUND_IN_TREE',
          'MERKLE_VERIFICATION',
          { node_id: nodeId }
        );
      }
      
      subproof.proofs.push({
        node_id: nodeId,
        node_hash: nodeHash.node_hash,
        data_hash: nodeHash.data_hash
      });
    }
    
    // Compute root from path
    subproof.computed_root = this._computeRootFromPath(merkleTree, path);
    
    // Verify against tree root
    subproof.valid = subproof.computed_root === merkleTree.root_hash;
    
    return subproof;
  }

  /**
   * Compute root hash from specific path
   * @param {Object} merkleTree - Merkle tree
   * @param {Array} path - Array of node IDs
   * @returns {string} Computed root hash
   */
  _computeRootFromPath(merkleTree, path) {
    // Collect hashes for nodes in path
    const pathHashes = path.map(nodeId => {
      const nodeHash = merkleTree.node_hashes[nodeId];
      return nodeHash ? nodeHash.node_hash : null;
    }).filter(Boolean);
    
    if (pathHashes.length === 0) {
      return null;
    }
    
    // Build Merkle tree from path hashes only
    let currentLayer = pathHashes;
    
    while (currentLayer.length > 1) {
      const nextLayer = [];
      
      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        const right = currentLayer[i + 1] || left;
        
        const combined = CanonicalAuthority.hash({ left, right });
        nextLayer.push(combined);
      }
      
      currentLayer = nextLayer;
    }
    
    return currentLayer[0];
  }

  /**
   * Verify subproof
   * @param {Object} subproof - Subproof to verify
   * @param {string} expectedRoot - Expected root hash
   * @returns {Object} Verification result
   */
  verifySubproof(subproof, expectedRoot) {
    const computedRoot = this._computeRootFromPath(
      { node_hashes: Object.fromEntries(subproof.proofs.map(p => [p.node_id, { node_hash: p.node_hash }])) },
      subproof.path
    );
    
    return {
      valid: computedRoot === expectedRoot,
      computed_root: computedRoot,
      expected_root: expectedRoot,
      path: subproof.path.match
    };
  }

  /**
   * Get Merkle tree
   * @param {string} treeId - Tree ID
   * @returns {Object} Merkle tree
   */
  getMerkleTree(treeId) {
    return this._merkleTrees.get(treeId);
  }

  /**
   * Verify tree integrity
   * @param {Object} merkleTree - Merkle tree
   * @returns {Object} Verification result
   */
  verifyTreeIntegrity(merkleTree) {
    // Verify tree hash
    const treeForHash = { ...merkleTree };
    delete treeForHash.tree_metadata.hash;
    delete treeForHash.tree_witness;
    
    const computedHash = CanonicalAuthority.hash(treeForHash);
    
    if (computedHash !== merkleTree.tree_metadata.hash) {
      return {
        valid: false,
        reason: 'Tree hash mismatch',
        expected: merkleTree.tree_metadata.hash,
        actual: computedHash
      };
    }
    
    // Verify root hash from layers
    const computedRoot = merkleTree.layers[merkleTree.layers.length - 1][0];
    
    if (computedRoot !== merkleTree.root_hash) {
      return {
        valid: false,
        reason: 'Root hash mismatch',
        expected: merkleTree.root_hash,
        actual: computedRoot
      };
    }
    
    // Verify tree witness
    const witnessVerification = this._witnessAuthority.verifyWitness(merkleTree.tree_witness);
    if (!witnessVerification.valid) {
      return witnessVerification;
    }
    
    return {
      valid: true,
      reason: 'Tree verified'
    };
  }

  /**
   * Get graph ID
   * @returns {string} Graph ID
   */
  getGraphId() {
    return this._graphId;
  }

  /**
   * Get graph version
   * @returns {string} Graph version
   */
  getGraphVersion() {
    return this._graphVersion;
  }

  /**
   * Generate tree ID
   * @param {Object} executionGraph - Execution graph
   * @returns {string} Tree ID
   */
  _generateTreeId(executionGraph) {
    const idData = {
      graph_version: executionGraph.graph_version,
      constitutional_version: executionGraph.constitutional_version
    };
    const hash = CanonicalAuthority.hash(idData);
    return `merkle_tree_${hash.substring(0, 16)}`;
  }

  /**
   * Generate graph ID
   * @returns {string} Graph ID
   */
  _generateGraphId() {
    const graphData = {
      graph_version: this._graphVersion,
      constitutional_version: '7.0.0'
    };
    const hash = CanonicalAuthority.hash(graphData);
    return `merkle_replay_graph_${hash.substring(0, 16)}`;
  }

  /**
   * Deep freeze tree
   * @param {Object} tree - Merkle tree
   * @returns {Object} Frozen tree
   */
  _freezeTree(tree) {
    const freeze = (obj) => {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }

      if (Array.isArray(obj)) {
        obj.forEach(freeze);
        Object.freeze(obj);
        return obj;
      }

      Object.keys(obj).forEach(key => {
        freeze(obj[key]);
      });

      Object.freeze(obj);
      return obj;
    };

    return freeze(tree);
  }
}

// Singleton instance
const merkleReplayGraph = new MerkleReplayGraph();

module.exports = { MerkleReplayGraph, merkleReplayGraph };
