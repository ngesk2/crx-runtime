/**
 * Persistence Adapter
 * 
 * Ω.97.5 — Invert Git to Commit Manifest → Persistence Adapter → Git
 * 
 * Git becomes just one persistence backend.
 * Later you could swap Git for SQLite or S3 or IPFS without changing constitutional code.
 */

const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { deterministicIdAuthority } = require('../ping-runtime/authorities/deterministic_id_authority');
const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');

class PersistenceAdapter {
  constructor(postgresPool, backendType = 'git') {
    this._postgres = postgresPool;
    this._backendType = backendType;
    this._backend = null;
  }

  /**
   * Initialize persistence adapter
   */
  async initialize() {
    console.log(`[PersistenceAdapter] Initializing persistence adapter with backend: ${this._backendType}`);

    // Initialize backend based on type
    switch (this._backendType) {
      case 'git':
        const { GitPersistenceBackend } = require('./git_persistence_backend');
        this._backend = new GitPersistenceBackend(this._postgres);
        break;
      case 'sqlite':
        const { SQLitePersistenceBackend } = require('./sqlite_persistence_backend');
        this._backend = new SQLitePersistenceBackend(this._postgres);
        break;
      case 's3':
        const { S3PersistenceBackend } = require('./s3_persistence_backend');
        this._backend = new S3PersistenceBackend(this._postgres);
        break;
      case 'ipfs':
        const { IPFSPersistenceBackend } = require('./ipfs_persistence_backend');
        this._backend = new IPFSPersistenceBackend(this._postgres);
        break;
      default:
        throw new Error(`Unknown persistence backend: ${this._backendType}`);
    }

    await this._backend.initialize();

    console.log('[PersistenceAdapter] Persistence adapter initialized');
  }

  /**
   * Persist commit manifest
   * 
   * @param {Object} commitManifest - Commit manifest
   * @returns {Object} Persistence result
   */
  async persistCommit(commitManifest) {
    console.log('[PersistenceAdapter] Persisting commit manifest');

    // Validate commit manifest
    const validation = this._validateCommitManifest(commitManifest);
    if (!validation.valid) {
      throw new Error(`Commit manifest validation failed: ${validation.errors.join(', ')}`);
    }

    // Persist to backend
    const result = await this._backend.persist(commitManifest);

    return result;
  }

  /**
   * Retrieve commit manifest
   * 
   * @param {string} commitId - Commit identifier
   * @returns {Object} Commit manifest
   */
  async retrieveCommit(commitId) {
    console.log(`[PersistenceAdapter] Retrieving commit ${commitId}`);

    return await this._backend.retrieve(commitId);
  }

  /**
   * List commits
   * 
   * @param {Object} filters - Optional filters
   * @returns {Array} Commits
   */
  async listCommits(filters = {}) {
    console.log('[PersistenceAdapter] Listing commits');

    return await this._backend.list(filters);
  }

  /**
   * Rollback commit
   * 
   * @param {string} commitId - Commit identifier
   * @returns {Object} Rollback result
   */
  async rollbackCommit(commitId) {
    console.log(`[PersistenceAdapter] Rolling back commit ${commitId}`);

    return await this._backend.rollback(commitId);
  }

  /**
   * Validate commit manifest
   */
  _validateCommitManifest(commitManifest) {
    const errors = [];

    const required = ['commit_id', 'commit_sha', 'message', 'artifacts'];
    for (const field of required) {
      if (!(field in commitManifest)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }

  /**
   * Switch backend
   * 
   * @param {string} newBackendType - New backend type
   * @returns {Object} Switch result
   */
  async switchBackend(newBackendType) {
    console.log(`[PersistenceAdapter] Switching backend from ${this._backendType} to ${newBackendType}`);

    const oldBackend = this._backend;
    this._backendType = newBackendType;

    // Initialize new backend
    await this.initialize();

    // Migrate data if needed
    const migrationResult = await this._migrateData(oldBackend, this._backend);

    return {
      success: true,
      old_backend: oldBackend.constructor.name,
      new_backend: this._backend.constructor.name,
      migration_result: migrationResult,
    };
  }

  /**
   * Migrate data between backends
   */
  async _migrateData(oldBackend, newBackend) {
    console.log('[PersistenceAdapter] Migrating data between backends');

    // Get all commits from old backend
    const commits = await oldBackend.list({});

    // Persist to new backend
    for (const commit of commits) {
      await newBackend.persist(commit);
    }

    return {
      migrated_commits: commits.length,
    };
  }

  /**
   * Get backend type
   * 
   * @returns {string} Backend type
   */
  getBackendType() {
    return this._backendType;
  }

  /**
   * Get backend
   * 
   * @returns {Object} Backend instance
   */
  getBackend() {
    return this._backend;
  }

  /**
   * Publish contract
   * 
   * @returns {Object} Authority contract
   */
  publishContract() {
    return {
      authority_id: 'persistence-adapter',
      authority_name: 'PersistenceAdapter',
      version: '1.0.0',
      consumes: ['CommitManifest'],
      produces: ['PersistedCommit'],
      requires: [],
      guarantees: ['durable_persistence', 'backend_swappable'],
      failure_modes: ['persistence_failure', 'backend_unavailable'],
      rollback: 'supported',
      determinism: 'deterministic',
    };
  }
}

module.exports = { PersistenceAdapter };
