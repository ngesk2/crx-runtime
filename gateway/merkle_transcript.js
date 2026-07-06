const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
const { runtimeFailureAuthority } = require('./runtime_failure_authority');
const { witnessAuthority } = require('./witness_authority');
const { constitutionVersionAuthority } = require('./constitution_version_authority');

/**
 * Merkle Transcript Structure
 * 
 * Architectural Enhancement 4 — Merkle Transcript Structure
 * 
 * Replace single hash with Merkle-style tree structure for scalable diffing:
 * 
 * Transcript Root
 *       |
 *  --------------
 *  |    |    |
 * Prompt
 * Inference
 * Streaming
 * Tools
 * Reducer
 * Completion
 * 
 * Benefits:
 * - Diff Engine can immediately identify what changed
 * - Scales much better than recomputing enormous blobs
 * - Enables incremental verification
 * - Supports partial transcript verification
 */

class MerkleTranscript {
  constructor() {
    // Removed serializer reference - use CanonicalAuthority directly
    this._failureAuthority = runtimeFailureAuthority;
    this._witnessAuthority = witnessAuthority;
    this._versionAuthority = constitutionVersionAuthority;
    this._transcriptVersion = '5.0.0';
  }

  /**
   * Create Merkle transcript
   * @param {Object} transcriptData - Transcript data
   * @returns {Object} Merkle transcript
   */
  createMerkleTranscript(transcriptData) {
    const transcriptId = this._generateTranscriptId(transcriptData);
    
    // Create leaf nodes
    const leaves = {
      runtime: this._createLeaf('runtime', transcriptData.runtime),
      prompt: this._createLeaf('prompt', transcriptData.prompt),
      model: this._createLeaf('model', transcriptData.model),
      inference: this._createLeaf('inference', transcriptData.inference),
      streaming: this._createLeaf('streaming', transcriptData.streaming),
      tools: this._createLeaf('tools', transcriptData.tools),
      reducer: this._createLeaf('reducer', transcriptData.reducer),
      checkpoints: this._createLeaf('checkpoints', transcriptData.checkpoints),
      completion: this._createLeaf('completion', transcriptData.completion),
      state: this._createLeaf('state', transcriptData.state)
    };

    // Create intermediate nodes
    const executionBranch = this._createBranch('execution', [leaves.runtime, leaves.prompt, leaves.model]);
    const processingBranch = this._createBranch('processing', [leaves.inference, leaves.streaming, leaves.tools]);
    const stateBranch = this._createBranch('state', [leaves.reducer, leaves.checkpoints, leaves.completion, leaves.state]);

    // Create root node
    const root = this._createRoot('transcript', [executionBranch, processingBranch, stateBranch]);

    const merkleTranscript = {
      transcript_id: transcriptId,
      transcript_version: this._transcriptVersion,
      constitutional_version: this._versionAuthority.getVersion('constitutional_schema'),
      
      // Merkle tree structure
      merkle_tree: {
        root: root,
        branches: {
          execution: executionBranch,
          processing: processingBranch,
          state: stateBranch
        },
        leaves: leaves
      },
      
      // Flat transcript data
      data: transcriptData,
      
      // Version manifest
      version_manifest: this._versionAuthority.createVersionManifest(),
      
      // Metadata
      transcript_metadata: {
        created_by: 'MerkleTranscript',
        frozen: true,
        hash: root.hash
      }
    };

    // Create transcript witness
    const transcriptWitness = this._witnessAuthority.createWitness(merkleTranscript, {
      authority: 'MerkleTranscript',
      authority_version: this._transcriptVersion
    });
    
    merkleTranscript.transcript_witness = transcriptWitness;

    // Deep freeze
    return this._freezeTranscript(merkleTranscript);
  }

  /**
   * Create leaf node
   * @param {string} type - Leaf type
   * @param {Object} data - Leaf data
   * @returns {Object} Leaf node
   */
  _createLeaf(type, data) {
    const leafData = {
      type: type,
      data: data,
      hash: this._computeLeafHash(data)
    };

    return {
      type: 'leaf',
      leaf_type: type,
      hash: leafData.hash,
      data: leafData
    };
  }

  /**
   * Create branch node
   * @param {string} type - Branch type
   * @param {Array} children - Child nodes
   * @returns {Object} Branch node
   */
  _createBranch(type, children) {
    const branchHash = this._computeBranchHash(children);

    return {
      type: 'branch',
      branch_type: type,
      hash: branchHash,
      children: children.map(child => ({
        type: child.type,
        hash: child.hash,
        leaf_type: child.leaf_type || null,
        branch_type: child.branch_type || null
      }))
    };
  }

  /**
   * Create root node
   * @param {string} type - Root type
   * @param {Array} children - Child nodes
   * @returns {Object} Root node
   */
  _createRoot(type, children) {
    const rootHash = this._computeBranchHash(children);

    return {
      type: 'root',
      root_type: type,
      hash: rootHash,
      children: children.map(child => ({
        type: child.type,
        hash: child.hash,
        branch_type: child.branch_type || null
      }))
    };
  }

  /**
   * Compute leaf hash
   * @param {Object} data - Leaf data
   * @returns {string} Leaf hash
   */
  _computeLeafHash(data) {
    // Exclude non-deterministic fields
    const cleanData = this._excludeNonDeterministicFields(data);
    return CanonicalAuthority.hash(cleanData);
  }

  /**
   * Compute branch hash
   * @param {Array} children - Child nodes
   * @returns {string} Branch hash
   */
  _computeBranchHash(children) {
    const hashes = children.map(child => child.hash).sort();
    const branchData = {
      type: 'branch',
      child_hashes: hashes
    };
    return CanonicalAuthority.hash(branchData);
  }

  /**
   * Exclude non-deterministic fields from data
   * @param {Object} data - Raw data
   * @returns {Object} Clean data
   */
  _excludeNonDeterministicFields(data) {
    const boundary = this._versionAuthority.getDeterminismBoundary();
    const cleanData = {};

    for (const key of Object.keys(data)) {
      if (this._versionAuthority.isWithinDeterminismBoundary(key) ||
          !this._versionAuthority.isExcludedFromDeterminismBoundary(key)) {
        cleanData[key] = data[key];
      }
    }

    return cleanData;
  }

  /**
   * Get root hash
   * @param {Object} merkleTranscript - Merkle transcript
   * @returns {string} Root hash
   */
  getRootHash(merkleTranscript) {
    return merkleTranscript.merkle_tree.root.hash;
  }

  /**
   * Get leaf hash
   * @param {Object} merkleTranscript - Merkle transcript
   * @param {string} leafType - Leaf type
   * @returns {string} Leaf hash
   */
  getLeafHash(merkleTranscript, leafType) {
    return merkleTranscript.merkle_tree.leaves[leafType]?.hash || null;
  }

  /**
   * Compare two Merkle transcripts
   * @param {Object} transcript1 - First transcript
   * @param {Object} transcript2 - Second transcript
   * @returns {Object} Comparison result
   */
  compareMerkleTranscripts(transcript1, transcript2) {
    const differences = [];

    // Compare root hashes
    if (transcript1.merkle_tree.root.hash !== transcript2.merkle_tree.root.hash) {
      differences.push({
        level: 'root',
        type: 'root_hash',
        transcript1: transcript1.merkle_tree.root.hash,
        transcript2: transcript2.merkle_tree.root.hash
      });
    }

    // Compare branches
    for (const branchName of Object.keys(transcript1.merkle_tree.branches)) {
      const branch1 = transcript1.merkle_tree.branches[branchName];
      const branch2 = transcript2.merkle_tree.branches[branchName];

      if (branch1.hash !== branch2.hash) {
        differences.push({
          level: 'branch',
          type: branchName,
          transcript1: branch1.hash,
          transcript2: branch2.hash
        });

        // Compare children of this branch
        const childDifferences = this._compareBranchChildren(branch1, branch2);
        differences.push(...childDifferences);
      }
    }

    // Compare leaves
    for (const leafName of Object.keys(transcript1.merkle_tree.leaves)) {
      const leaf1 = transcript1.merkle_tree.leaves[leafName];
      const leaf2 = transcript2.merkle_tree.leaves[leafName];

      if (leaf1.hash !== leaf2.hash) {
        differences.push({
          level: 'leaf',
          type: leafName,
          transcript1: leaf1.hash,
          transcript2: leaf2.hash
        });
      }
    }

    return {
      identical: differences.length === 0,
      differences: differences,
      summary: this._generateComparisonSummary(differences)
    };
  }

  /**
   * Compare branch children
   * @param {Object} branch1 - First branch
   * @param {Object} branch2 - Second branch
   * @returns {Array} Child differences
   */
  _compareBranchChildren(branch1, branch2) {
    const differences = [];

    for (let i = 0; i < Math.max(branch1.children.length, branch2.children.length); i++) {
      const child1 = branch1.children[i];
      const child2 = branch2.children[i];

      if (!child1 || !child2) {
        differences.push({
          level: 'child',
          type: 'missing_child',
          index: i,
          transcript1: child1 ? 'present' : 'missing',
          transcript2: child2 ? 'present' : 'missing'
        });
        continue;
      }

      if (child1.hash !== child2.hash) {
        differences.push({
          level: 'child',
          type: child1.leaf_type || child1.branch_type,
          index: i,
          transcript1: child1.hash,
          transcript2: child2.hash
        });
      }
    }

    return differences;
  }

  /**
   * Generate comparison summary
   * @param {Array} differences - Array of differences
   * @returns {Object} Summary
   */
  _generateComparisonSummary(differences) {
    const summary = {
      total_differences: differences.length,
      by_level: {
        root: 0,
        branch: 0,
        leaf: 0,
        child: 0
      },
      changed_components: new Set()
    };

    for (const diff of differences) {
      summary.by_level[diff.level]++;
      if (diff.type && diff.type !== 'root_hash' && diff.type !== 'missing_child') {
        summary.changed_components.add(diff.type);
      }
    }

    summary.changed_components = Array.from(summary.changed_components);

    return summary;
  }

  /**
   * Verify Merkle transcript integrity
   * @param {Object} merkleTranscript - Merkle transcript
   * @returns {Object} Verification result
   */
  verifyMerkleTranscript(merkleTranscript) {
    // Verify root hash
    const recomputedRoot = this._computeBranchHash(merkleTranscript.merkle_tree.root.children);
    if (recomputedRoot !== merkleTranscript.merkle_tree.root.hash) {
      return {
        valid: false,
        reason: 'Root hash verification failed',
        expected: merkleTranscript.merkle_tree.root.hash,
        actual: recomputedRoot
      };
    }

    // Verify all branches
    for (const branchName of Object.keys(merkleTranscript.merkle_tree.branches)) {
      const branch = merkleTranscript.merkle_tree.branches[branchName];
      const recomputedBranch = this._computeBranchHash(branch.children);
      if (recomputedBranch !== branch.hash) {
        return {
          valid: false,
          reason: `Branch ${branchName} hash verification failed`,
          expected: branch.hash,
          actual: recomputedBranch
        };
      }
    }

    // Verify all leaves
    for (const leafName of Object.keys(merkleTranscript.merkle_tree.leaves)) {
      const leaf = merkleTranscript.merkle_tree.leaves[leafName];
      const recomputedLeaf = this._computeLeafHash(leaf.data.data);
      if (recomputedLeaf !== leaf.hash) {
        return {
          valid: false,
          reason: `Leaf ${leafName} hash verification failed`,
          expected: leaf.hash,
          actual: recomputedLeaf
        };
      }
    }

    return {
      valid: true,
      reason: 'Merkle transcript verified'
    };
  }

  /**
   * Generate transcript ID
   * @param {Object} transcriptData - Transcript data
   * @returns {string} Transcript ID
   */
  _generateTranscriptId(transcriptData) {
    const idData = {
      runtime_hash: transcriptData.runtime?.witness_metadata?.hash,
      prompt_hash: transcriptData.prompt?.prompt_hash,
      model_digest: transcriptData.model?.digest,
      completion_hash: transcriptData.completion?.completion_hash
    };
    const hash = CanonicalAuthority.hash(idData);
    return `merkle_transcript_${hash.substring(0, 16)}`;
  }

  /**
   * Deep freeze transcript
   * @param {Object} transcript - Merkle transcript
   * @returns {Object} Frozen transcript
   */
  _freezeTranscript(transcript) {
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

    return freeze(transcript);
  }

  /**
   * Get transcript version
   * @returns {string} Transcript version
   */
  getTranscriptVersion() {
    return this._transcriptVersion;
  }
}

// Singleton instance
const merkleTranscript = new MerkleTranscript();

module.exports = { MerkleTranscript, merkleTranscript };
