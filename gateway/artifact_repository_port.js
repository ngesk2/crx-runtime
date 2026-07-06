/**
 * Artifact Repository Port
 * 
 * Tier 2 — Constitutional Port (Domain Semantics)
 * 
 * Hides artifact persistence behind a domain-specific port.
 * 
 * Constitutional Constraint: Single artifact repository authority for all artifact operations.
 * 
 * Artifact Repository Port owns:
 * - Artifact storage
 * - Artifact retrieval
 * - Artifact lifecycle
 * 
 * Note: This replaces generic CRUD with constitutional artifact semantics.
 * 
 * Implementations:
 * - PostgreSQLArtifactRepositoryProvider (current)
 * - Future: S3, MinIO, etc.
 */

class ArtifactRepositoryPort {
  constructor(provider) {
    this._provider = provider;
    this._portId = this._generatePortId();
  }

  /**
   * Store artifact
   * @param {Object} artifact - Artifact to store
   * @param {Object} options - Store options
   * @returns {Promise<Object>} Stored artifact
   */
  async storeArtifact(artifact, options = {}) {
    return this._provider.storeArtifact(artifact, options);
  }

  /**
   * Retrieve artifact
   * @param {string} artifactId - Artifact ID
   * @param {Object} options - Retrieve options
   * @returns {Promise<Object>} Retrieved artifact
   */
  async retrieveArtifact(artifactId, options = {}) {
    return this._provider.retrieveArtifact(artifactId, options);
  }

  /**
   * Find artifacts by criteria
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Artifacts
   */
  async findArtifacts(criteria, options = {}) {
    return this._provider.findArtifacts(criteria, options);
  }

  /**
   * Delete artifact
   * @param {string} artifactId - Artifact ID
   * @param {Object} options - Delete options
   * @returns {Promise<void>}
   */
  async deleteArtifact(artifactId, options = {}) {
    return this._provider.deleteArtifact(artifactId, options);
  }

  /**
   * Get port ID
   * @returns {string} Port ID
   */
  getPortId() {
    return this._portId;
  }

  /**
   * Generate port ID
   * @returns {string} Port ID
   */
  _generatePortId() {
    const providerName = this._provider.constructor.name;
    return `artifact_repository.${providerName.toLowerCase()}`;
  }
}

/**
 * Artifact Repository Provider Interface
 * 
 * All artifact repository providers must implement this interface.
 */
class ArtifactRepositoryProvider {
  async storeArtifact(artifact, options) {
    throw new Error('storeArtifact() must be implemented');
  }

  async retrieveArtifact(artifactId, options) {
    throw new Error('retrieveArtifact() must be implemented');
  }

  async findArtifacts(criteria, options) {
    throw new Error('findArtifacts() must be implemented');
  }

  async deleteArtifact(artifactId, options) {
    throw new Error('deleteArtifact() must be implemented');
  }
}

module.exports = {
  ArtifactRepositoryPort,
  ArtifactRepositoryProvider
};
