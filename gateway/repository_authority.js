/**
 * Repository Authority
 * 
 * Ω.69 — Repository Authority
 * 
 * Compiles RepositoryRoot from ImportGraphRoot, CallGraphRoot, TypeGraphRoot, ArchitectureGraphRoot.
 * 
 * Constitutional Constraint: Repository Authority owns RepositoryRoot object creation.
 * Pipeline only coordinates authorities.
 * RepositoryRoot consumes graph roots, does not compute them manually.
 */

const { CanonicalAuthority } = require('./canonical_authority');
const { ConstitutionalObjectFactory, OperationalEnvelope, OperationalMetadataCollector } = require('./operational_envelope');

class RepositoryAuthority {
  constructor(postgresPool, objectRegistry, witnessChain) {
    this._postgres = postgresPool;
    this._objectRegistry = objectRegistry;
    this._witnessChain = witnessChain;
    this._constitutionalObjectFactory = new ConstitutionalObjectFactory();
    this._operationalMetadataCollector = new OperationalMetadataCollector();
    this._repositoryCache = new Map(); // repo_id → RepositoryRoot
    this._initialized = false;
  }

  /**
   * Initialize repository authority
   */
  async initialize() {
    await this._loadRepositoryCache();
    this._initialized = true;
    console.log('[RepositoryAuthority] Initialized');
  }

  /**
   * Compile RepositoryRoot from wrapped constitutional objects
   * 
   * Constitutional Constraint: RepositoryAuthority receives constitutional objects, not hashes.
   * RepositoryAuthority computes all Merkle roots internally.
   * 
   * @param {string} repoId - Repository identifier
   * @param {string} commitSha - Commit SHA
   * @param {Array} wrappedFiles - Array of wrapped file objects
   * @param {Array} wrappedSymbols - Array of wrapped symbol objects
   * @param {Object} wrappedGraphs - Object containing wrapped graph objects
   * @returns {Object} Wrapped RepositoryRoot object (constitutional + envelope)
   */
  async compile(repoId, commitSha, wrappedFiles, wrappedSymbols, wrappedGraphs) {
    console.log(`[RepositoryAuthority] Compiling repository root: ${repoId}`);

    try {
      // Compute file root from wrapped files
      const fileRoot = this._computeRoot(wrappedFiles);
      
      // Compute symbol root from wrapped symbols
      const symbolRoot = this._computeRoot(wrappedSymbols);
      
      // Extract graph roots from wrapped graphs
      const graphRoots = {
        import_graph_root: wrappedGraphs.import_graph_root?.constitutional_object?.canonical_hash || null,
        call_graph_root: wrappedGraphs.call_graph_root?.constitutional_object?.canonical_hash || null,
        type_graph_root: wrappedGraphs.type_graph_root?.constitutional_object?.canonical_hash || null,
        architecture_graph_root: null,
      };

      // Compute overall graph root from graph roots
      const graphRoot = this._computeGraphRoot(graphRoots);

      // Compute counts
      const counts = {
        file_count: wrappedFiles.length,
        symbol_count: wrappedSymbols.length,
        graph_count: Object.keys(wrappedGraphs).length,
      };

      // Create RepositoryRoot constitutional object
      const repositoryObject = this._constitutionalObjectFactory.createRepositoryObject({
        repo_id: repoId,
        commit_sha: commitSha,
        file_root: fileRoot,
        symbol_root: symbolRoot,
        graph_root: graphRoot,
        file_count: counts.file_count,
        symbol_count: counts.symbol_count,
        graph_count: counts.graph_count,
      });

      // Wrap in operational envelope
      const operationalMetadata = this._operationalMetadataCollector.collect({
        pipeline_stage: 'repository',
        source: 'RepositoryAuthority',
      });
      const envelope = OperationalEnvelope.wrap(repositoryObject, operationalMetadata);

      // Register constitutional object
      await this._objectRegistry.register(repositoryObject);

      const wrappedRepositoryRoot = {
        constitutional_object: repositoryObject,
        operational_envelope: envelope,
      };

      // Cache repository root
      this._repositoryCache.set(repoId, wrappedRepositoryRoot);
      await this._persistRepositoryCache(repoId, wrappedRepositoryRoot);

      console.log(`[RepositoryAuthority] Compiled repository root: ${repoId}`);
      return wrappedRepositoryRoot;
    } catch (error) {
      console.error(`[RepositoryAuthority] Failed to compile repository root: ${repoId}`, error.message);
      throw error;
    }
  }

  /**
   * Compute root from array of wrapped constitutional objects
   * 
   * Constitutional Constraint: RepositoryAuthority computes Merkle roots internally.
   * 
   * @param {Array} wrappedObjects - Array of wrapped constitutional objects
   * @returns {string} Root hash
   */
  _computeRoot(wrappedObjects) {
    if (!wrappedObjects || wrappedObjects.length === 0) {
      return null;
    }

    const { CanonicalAuthority } = require('./canonical_authority');
    const hashes = wrappedObjects.map(obj => obj.constitutional_object.canonical_hash);
    return CanonicalAuthority.hash(hashes);
  }

  /**
   * Compute graph root from graph roots
   * 
   * Constitutional Constraint: Uses domain-separated hash function.
   * RepositoryRoot consumes graph roots, does not compute them manually.
   * 
   * @param {Object} graphRoots - Graph roots
   * @returns {string} Graph root hash
   */
  _computeGraphRoot(graphRoots) {
    const rootValues = Object.values(graphRoots).filter(r => r !== null);
    if (rootValues.length === 0) {
      return null;
    }

    // Use domain-separated hash function
    return CanonicalAuthority.hashRepository(
      graphRoots.repo_id || 'unknown',
      graphRoots.commit_sha || 'unknown',
      graphRoots.file_root || null,
      graphRoots.symbol_root || null,
      CanonicalAuthority.hash(rootValues)
    );
  }

  /**
   * Get repository root by ID
   * 
   * @param {string} repoId - Repository ID
   * @returns {Object} Wrapped RepositoryRoot object
   */
  getRepositoryRoot(repoId) {
    return this._repositoryCache.get(repoId);
  }

  /**
   * Get all repository roots
   * 
   * @returns {Array} Array of all wrapped RepositoryRoot objects
   */
  getAllRepositoryRoots() {
    return Array.from(this._repositoryCache.values());
  }

  /**
   * Get statistics
   * 
   * @returns {Object} Statistics
   */
  getStatistics() {
    const repositories = this.getAllRepositoryRoots();
    
    const stats = {
      total_repositories: repositories.length,
      total_files: 0,
      total_symbols: 0,
      total_graphs: 0,
      average_files_per_repo: 0,
      average_symbols_per_repo: 0,
      average_graphs_per_repo: 0,
    };

    for (const repo of repositories) {
      const fileCount = repo.constitutional_object.payload.file_count;
      const symbolCount = repo.constitutional_object.payload.symbol_count;
      const graphCount = repo.constitutional_object.payload.graph_count;

      stats.total_files += fileCount;
      stats.total_symbols += symbolCount;
      stats.total_graphs += graphCount;
    }

    if (repositories.length > 0) {
      stats.average_files_per_repo = stats.total_files / repositories.length;
      stats.average_symbols_per_repo = stats.total_symbols / repositories.length;
      stats.average_graphs_per_repo = stats.total_graphs / repositories.length;
    }

    return stats;
  }

  /**
   * Persist repository cache
   * 
   * @param {string} repoId - Repository ID
   * @param {Object} wrappedRepositoryRoot - Wrapped RepositoryRoot object
   */
  async _persistRepositoryCache(repoId, wrappedRepositoryRoot) {
    try {
      await this._postgres.query(`
        INSERT INTO repository_cache (repo_id, constitutional_id, constitutional_hash, operational_metadata, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (repo_id) DO UPDATE SET
          constitutional_id = $2,
          constitutional_hash = $3,
          operational_metadata = $4,
          updated_at = NOW()
      `, [
        repoId,
        wrappedRepositoryRoot.constitutional_object.id,
        wrappedRepositoryRoot.constitutional_object.canonical_hash,
        JSON.stringify(wrappedRepositoryRoot.operational_envelope.getOperationalMetadata()),
      ]);
    } catch (error) {
      console.error('[RepositoryAuthority] Failed to persist repository cache:', error.message);
    }
  }

  /**
   * Load repository cache
   */
  async _loadRepositoryCache() {
    try {
      const result = await this._postgres.query(`
        SELECT repo_id, constitutional_id, constitutional_hash, operational_metadata
        FROM repository_cache
        ORDER BY updated_at DESC
        LIMIT 1000
      `);

      for (const row of result.rows) {
        this._repositoryCache.set(row.repo_id, {
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
      console.error('[RepositoryAuthority] Failed to load repository cache:', error.message);
    }
  }

  /**
   * Clear repository cache (memory only)
   */
  clearRepositoryCache() {
    this._repositoryCache.clear();
  }
}

module.exports = { RepositoryAuthority };
