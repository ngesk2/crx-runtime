/**
 * Proof Authority
 * 
 * Ω.72 — Proof Authority
 * 
 * Compiles ProofRoot from RepositoryRoot, MissionRoots, ReflectionRoots.
 * 
 * Constitutional Constraint: Proof Authority owns Proof object creation.
 * Proof generation is centralized, not duplicated in pipeline.
 */

const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { ConstitutionalObjectFactory, OperationalEnvelope, OperationalMetadataCollector } = require('./operational_envelope');

class ProofAuthority {
  constructor(postgresPool, objectRegistry, witnessChain) {
    this._postgres = postgresPool;
    this._objectRegistry = objectRegistry;
    this._witnessChain = witnessChain;
    this._constitutionalObjectFactory = new ConstitutionalObjectFactory();
    this._operationalMetadataCollector = new OperationalMetadataCollector();
    this._proofCache = new Map(); // repo_id → ProofRoot
    this._initialized = false;
  }

  /**
   * Initialize proof authority
   */
  async initialize() {
    await this._loadProofCache();
    this._initialized = true;
    console.log('[ProofAuthority] Initialized');
  }

  /**
   * Compile ProofRoot from RepositoryRoot, MissionRoots, ReflectionRoots
   * 
   * @param {Object} repositoryRoot - Repository root object
   * @param {Array} missionRoots - Array of mission root objects
   * @param {Array} reflectionRoots - Array of reflection root objects
   * @returns {Object} Wrapped ProofRoot object (constitutional + envelope)
   */
  async compile(repositoryRoot, missionRoots, reflectionRoots) {
    console.log('[ProofAuthority] Compiling proof root');

    try {
      // Extract roots
      const repositoryRootHash = repositoryRoot.constitutional_object.canonical_hash;
      const missionRootHashes = missionRoots.map(m => m.constitutional_object.canonical_hash);
      const reflectionRootHashes = reflectionRoots.map(r => r.constitutional_object.canonical_hash);

      // Compute mission root
      const missionRoot = this._computeMissionRoot(missionRootHashes);

      // Compute reflection root
      const reflectionRoot = this._computeReflectionRoot(reflectionRootHashes);

      // Compute overall proof root
      const proofRoot = this._computeProofRoot({
        repository_root: repositoryRootHash,
        mission_root: missionRoot,
        reflection_root: reflectionRoot,
      });

      // Create Proof constitutional object
      const proofObject = this._constitutionalObjectFactory.createProofObject({
        repository_root: repositoryRootHash,
        mission_root: missionRoot,
        reflection_root: reflectionRoot,
        proof_root: proofRoot,
        mission_count: missionRoots.length,
        reflection_count: reflectionRoots.length,
      });

      // Wrap in operational envelope
      const operationalMetadata = this._operationalMetadataCollector.collect({
        pipeline_stage: 'proof',
        source: 'ProofAuthority',
      });
      const envelope = OperationalEnvelope.wrap(proofObject, operationalMetadata);

      // Register constitutional object
      await this._objectRegistry.register(proofObject);

      // Witness proof
      await this._witnessProof(proofObject);

      const wrappedProofRoot = {
        constitutional_object: proofObject,
        operational_envelope: envelope,
      };

      // Cache proof root
      const repoId = repositoryRoot.constitutional_object.payload.repo_id;
      this._proofCache.set(repoId, wrappedProofRoot);
      await this._persistProofCache(repoId, wrappedProofRoot);

      console.log('[ProofAuthority] Compiled proof root');
      return wrappedProofRoot;
    } catch (error) {
      console.error('[ProofAuthority] Failed to compile proof root', error.message);
      throw error;
    }
  }

  /**
   * Compute mission root from mission hashes
   * 
   * @param {Array} missionHashes - Array of mission hashes
   * @returns {string} Mission root hash
   */
  _computeMissionRoot(missionHashes) {
    if (missionHashes.length === 0) {
      return null;
    }

    // Use domain-separated hash function
    return CanonicalAuthority.hash(missionHashes.sort());
  }

  /**
   * Compute reflection root from reflection hashes
   * 
   * @param {Array} reflectionHashes - Array of reflection hashes
   * @returns {string} Reflection root hash
   */
  _computeReflectionRoot(reflectionHashes) {
    if (reflectionHashes.length === 0) {
      return null;
    }

    // Use domain-separated hash function
    return CanonicalAuthority.hash(reflectionHashes.sort());
  }

  /**
   * Compute proof root from roots
   * 
   * @param {Object} roots - Object containing roots
   * @returns {string} Proof root hash
   */
  _computeProofRoot(roots) {
    const rootValues = Object.values(roots).filter(r => r !== null);
    if (rootValues.length === 0) {
      return null;
    }

    // Use domain-separated hash function
    return CanonicalAuthority.hash(rootValues);
  }

  /**
   * Witness proof to witness chain
   * 
   * @param {Object} proofObject - Proof constitutional object
   */
  async _witnessProof(proofObject) {
    if (!this._witnessChain) {
      console.warn('[ProofAuthority] WitnessChain not initialized');
      return;
    }

    try {
      await this._witnessChain.witness({
        id: proofObject.id,
        kind: 'Proof',
        data: proofObject.payload,
        authority: proofObject.authority,
      });
    } catch (error) {
      console.error('[ProofAuthority] Failed to witness proof', error.message);
    }
  }

  /**
   * Get proof by repository ID
   * 
   * @param {string} repoId - Repository ID
   * @returns {Object} Wrapped ProofRoot object
   */
  getProof(repoId) {
    return this._proofCache.get(repoId);
  }

  /**
   * Get all proofs
   * 
   * @returns {Array} Array of all wrapped ProofRoot objects
   */
  getAllProofs() {
    return Array.from(this._proofCache.values());
  }

  /**
   * Verify proof
   * 
   * @param {Object} proofObject - Proof constitutional object
   * @returns {boolean} True if proof is valid
   */
  async verifyProof(proofObject) {
    // Verify proof root computation
    const expectedProofRoot = this._computeProofRoot({
      repository_root: proofObject.payload.repository_root,
      mission_root: proofObject.payload.mission_root,
      reflection_root: proofObject.payload.reflection_root,
    });

    return proofObject.payload.proof_root === expectedProofRoot;
  }

  /**
   * Get statistics
   * 
   * @returns {Object} Statistics
   */
  getStatistics() {
    const proofs = this.getAllProofs();
    
    const stats = {
      total_proofs: proofs.length,
      total_missions: 0,
      total_reflections: 0,
      average_missions_per_proof: 0,
      average_reflections_per_proof: 0,
    };

    for (const proof of proofs) {
      const missionCount = proof.constitutional_object.payload.mission_count;
      const reflectionCount = proof.constitutional_object.payload.reflection_count;

      stats.total_missions += missionCount;
      stats.total_reflections += reflectionCount;
    }

    if (proofs.length > 0) {
      stats.average_missions_per_proof = stats.total_missions / proofs.length;
      stats.average_reflections_per_proof = stats.total_reflections / proofs.length;
    }

    return stats;
  }

  /**
   * Persist proof cache
   * 
   * @param {string} repoId - Repository ID
   * @param {Object} wrappedProofRoot - Wrapped ProofRoot object
   */
  async _persistProofCache(repoId, wrappedProofRoot) {
    try {
      await this._postgres.query(`
        INSERT INTO proof_cache (repo_id, constitutional_id, constitutional_hash, operational_metadata, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (repo_id) DO UPDATE SET
          constitutional_id = $2,
          constitutional_hash = $3,
          operational_metadata = $4,
          updated_at = NOW()
      `, [
        repoId,
        wrappedProofRoot.constitutional_object.id,
        wrappedProofRoot.constitutional_object.canonical_hash,
        JSON.stringify(wrappedProofRoot.operational_envelope.getOperationalMetadata()),
      ]);
    } catch (error) {
      console.error('[ProofAuthority] Failed to persist proof cache:', error.message);
    }
  }

  /**
   * Load proof cache
   */
  async _loadProofCache() {
    try {
      const result = await this._postgres.query(`
        SELECT repo_id, constitutional_id, constitutional_hash, operational_metadata
        FROM proof_cache
        ORDER BY updated_at DESC
        LIMIT 1000
      `);

      for (const row of result.rows) {
        this._proofCache.set(row.repo_id, {
          constitutional_object: {
            id: row.constitutional_id,
            canonical_hash: row.constitutional_hash,
          },
          operational_envelope: {
            getOperationalMetadata: () => row.operational_metadata,
          },
        });
      }
    } catch (error) {
      console.error('[ProofAuthority] Failed to load proof cache:', error.message);
    }
  }

  /**
   * Clear proof cache (memory only)
   */
  clearProofCache() {
    this._proofCache.clear();
  }
}

module.exports = { ProofAuthority };
