/**
 * Constitutional Seed Repositories
 * 
 * Ω.92 — Seed Repository List with Constitutional Priorities
 * 
 * Curated repositories with constitutional priorities instead of scanning the entire ecosystem.
 */

const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { deterministicIdAuthority } = require('./deterministic_id_authority');

class ConstitutionalSeedRepositories {
  constructor(postgresPool) {
    this._postgres = postgresPool;
    this._seedRepos = new Map(); // repo_id → seed repo config
  }

  /**
   * Initialize seed repositories
   */
  async initialize() {
    console.log('[SeedRepositories] Initializing constitutional seed repositories');

    // Load seed repositories from PostgreSQL
    await this._loadSeedRepositories();

    // If empty, load default seed repositories
    if (this._seedRepos.size === 0) {
      await this._loadDefaultSeedRepositories();
    }

    console.log(`[SeedRepositories] Loaded ${this._seedRepos.size} seed repositories`);
  }

  /**
   * Load seed repositories from PostgreSQL
   */
  async _loadSeedRepositories() {
    try {
      const result = await this._postgres.query(`
        SELECT repo_id, seed_config
        FROM seed_repositories
        WHERE enabled = true
      `);

      for (const row of result.rows) {
        this._seedRepos.set(row.repo_id, row.seed_config);
      }
    } catch (error) {
      console.error('[SeedRepositories] Failed to load seed repositories:', error.message);
    }
  }

  /**
   * Load default seed repositories
   */
  async _loadDefaultSeedRepositories() {
    const defaultSeeds = [
      {
        repo_id: 'temporalio/sdk-typescript',
        owner: 'temporalio',
        name: 'sdk-typescript',
        category: 'workflow_engine',
        priority: 'critical',
        reason: 'Deterministic workflow compiler for replacing SchedulerAuthority',
        expected_loc_removed: 2700,
        expected_authority_replacement: 'SchedulerAuthority',
      },
      {
        repo_id: 'eventstore/eventstore',
        owner: 'eventstore',
        name: 'eventstore',
        category: 'event_sourcing',
        priority: 'high',
        reason: 'Event sourcing runtime for event-based architectures',
        expected_loc_removed: 0,
        expected_authority_replacement: null,
      },
      {
        repo_id: 'yjs/yjs',
        owner: 'yjs',
        name: 'yjs',
        category: 'crdt',
        priority: 'high',
        reason: 'CRDT implementation for collaborative editing',
        expected_loc_removed: 0,
        expected_authority_replacement: null,
      },
      {
        repo_id: 'tree-sitter/tree-sitter',
        owner: 'tree-sitter',
        name: 'tree-sitter',
        category: 'parser',
        priority: 'critical',
        reason: 'Incremental parsing library for ParserAuthority',
        expected_loc_removed: 2000,
        expected_authority_replacement: 'ParserAuthority',
      },
      {
        repo_id: 'llvm/llvm-project',
        owner: 'llvm',
        name: 'llvm-project',
        category: 'compiler',
        priority: 'high',
        reason: 'LLVM/MLIR concepts for compiler infrastructure',
        expected_loc_removed: 0,
        expected_authority_replacement: null,
      },
      {
        repo_id: 'google/dagger',
        owner: 'google',
        name: 'dagger',
        category: 'infrastructure',
        priority: 'medium',
        reason: 'Build system concepts for infrastructure',
        expected_loc_removed: 0,
        expected_authority_replacement: null,
      },
      {
        repo_id: 'open-telemetry/opentelemetry-js',
        owner: 'open-telemetry',
        name: 'opentelemetry-js',
        category: 'observability',
        priority: 'medium',
        reason: 'OpenTelemetry for observability',
        expected_loc_removed: 0,
        expected_authority_replacement: null,
      },
      {
        repo_id: 'quicktype-oss/quicktype',
        owner: 'quicktype-oss',
        name: 'quicktype',
        category: 'serialization',
        priority: 'medium',
        reason: 'Type inference and serialization',
        expected_loc_removed: 0,
        expected_authority_replacement: null,
      },
      {
        repo_id: 'tantivy-search/tantivy',
        owner: 'tantivy-search',
        name: 'tantivy',
        category: 'indexing',
        priority: 'medium',
        reason: 'Indexing concepts for search',
        expected_loc_removed: 0,
        expected_authority_replacement: null,
      },
      {
        repo_id: 'dgraph-io/dgraph',
        owner: 'dgraph-io',
        name: 'dgraph',
        category: 'graph_database',
        priority: 'medium',
        reason: 'Graph database for knowledge graph',
        expected_loc_removed: 0,
        expected_authority_replacement: null,
      },
    ];

    for (const seed of defaultSeeds) {
      await this.addSeedRepository(seed);
    }

    console.log('[SeedRepositories] Loaded default seed repositories');
  }

  /**
   * Add seed repository
   */
  async addSeedRepository(seedConfig) {
    const seed = {
      ...seedConfig,
      added_at: constitutionalTimeAuthority.now(),
      enabled: true,
    };

    this._seedRepos.set(seedConfig.repo_id, seed);
    await this._persistSeedRepository(seed);

    console.log(`[SeedRepositories] Added seed repository: ${seedConfig.repo_id} (priority: ${seedConfig.priority})`);
  }

  /**
   * Remove seed repository
   */
  async removeSeedRepository(repoId) {
    this._seedRepos.delete(repoId);

    try {
      await this._postgres.query(`
        UPDATE seed_repositories
        SET enabled = false, updated_at = NOW()
        WHERE repo_id = $1
      `, [repoId]);

      console.log(`[SeedRepositories] Removed seed repository: ${repoId}`);
    } catch (error) {
      console.error(`[SeedRepositories] Failed to remove seed repository ${repoId}:`, error.message);
    }
  }

  /**
   * Persist seed repository
   */
  async _persistSeedRepository(seed) {
    try {
      await this._postgres.query(`
        INSERT INTO seed_repositories (repo_id, seed_config, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (repo_id) DO UPDATE SET
          seed_config = $2,
          updated_at = NOW()
      `, [seed.repo_id, JSON.stringify(seed)]);
    } catch (error) {
      console.error(`[SeedRepositories] Failed to persist seed repository ${seed.repo_id}:`, error.message);
    }
  }

  /**
   * Get seed repositories by priority
   */
  getSeedRepositoriesByPriority() {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };

    return Array.from(this._seedRepos.values())
      .sort((a, b) => {
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        return new Date(a.added_at) - new Date(b.added_at);
      });
  }

  /**
   * Get seed repositories by category
   */
  getSeedRepositoriesByCategory(category) {
    return Array.from(this._seedRepos.values())
      .filter(seed => seed.category === category);
  }

  /**
   * Get critical priority repositories
   */
  getCriticalRepositories() {
    return Array.from(this._seedRepos.values())
      .filter(seed => seed.priority === 'critical');
  }

  /**
   * Get high priority repositories
   */
  getHighPriorityRepositories() {
    return Array.from(this._seedRepos.values())
      .filter(seed => seed.priority === 'high');
  }

  /**
   * Get seed repository
   */
  getSeedRepository(repoId) {
    return this._seedRepos.get(repoId);
  }

  /**
   * Get all seed repositories
   */
  getAllSeedRepositories() {
    return Array.from(this._seedRepos.values());
  }

  /**
   * Get seed repository statistics
   */
  getSeedRepositoryStats() {
    const repos = Array.from(this._seedRepos.values());

    const stats = {
      total: repos.length,
      by_priority: {
        critical: repos.filter(r => r.priority === 'critical').length,
        high: repos.filter(r => r.priority === 'high').length,
        medium: repos.filter(r => r.priority === 'medium').length,
        low: repos.filter(r => r.priority === 'low').length,
      },
      by_category: {},
      total_expected_loc_removed: 0,
    };

    for (const repo of repos) {
      stats.by_category[repo.category] = (stats.by_category[repo.category] || 0) + 1;
      stats.total_expected_loc_removed += repo.expected_loc_removed || 0;
    }

    return stats;
  }
}

module.exports = { ConstitutionalSeedRepositories };
