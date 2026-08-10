/**
 * Ecosystem Intelligence
 * 
 * Ω.90 — Ecosystem Intelligence
 * 
 * Continuously search for:
 * - Compiler frameworks
 * - Event sourcing runtimes
 * - CRDT libraries
 * - Replay engines
 * - Workflow engines
 * - Graph databases
 * - Vector search
 * - Agent runtimes
 * - Distributed systems
 * - Deterministic execution engines
 */

const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { deterministicIdAuthority } = require('../ping-runtime/authorities/deterministic_id_authority');

class EcosystemIntelligence {
  constructor(postgresPool, githubAdapter, npmAdapter, cargoAdapter, pypiAdapter) {
    this._postgres = postgresPool;
    this._githubAdapter = githubAdapter;
    this._npmAdapter = npmAdapter;
    this._cargoAdapter = cargoAdapter;
    this._pypiAdapter = pypiAdapter;
    
    this._searchCategories = {
      compiler_frameworks: {
        keywords: ['compiler', 'parser', 'ast', 'transpiler', 'bundler', 'linter'],
        languages: ['typescript', 'rust', 'go', 'python'],
      },
      event_sourcing: {
        keywords: ['event sourcing', 'event store', 'cqrs', 'eventual consistency'],
        languages: ['typescript', 'rust', 'go', 'java', 'c#'],
      },
      crdt_libraries: {
        keywords: ['crdt', 'conflict-free', 'replicated data type', 'yjs', 'automerge'],
        languages: ['typescript', 'rust', 'go'],
      },
      replay_engines: {
        keywords: ['replay', 'time travel', 'deterministic', 'replayable', 'event log'],
        languages: ['typescript', 'rust', 'go', 'python'],
      },
      workflow_engines: {
        keywords: ['workflow', 'orchestration', 'temporal', 'cadence', 'airflow', 'dag'],
        languages: ['typescript', 'rust', 'go', 'python', 'java'],
      },
      graph_databases: {
        keywords: ['graph database', 'neo4j', 'arango', 'gremlin', 'cypher'],
        languages: ['typescript', 'rust', 'go', 'python', 'java'],
      },
      vector_search: {
        keywords: ['vector', 'embedding', 'similarity', 'faiss', 'ann', 'hnsw'],
        languages: ['typescript', 'rust', 'go', 'python'],
      },
      agent_runtimes: {
        keywords: ['agent', 'llm', 'autonomous', 'multi-agent', 'langchain'],
        languages: ['typescript', 'rust', 'go', 'python'],
      },
      distributed_systems: {
        keywords: ['distributed', 'consensus', 'raft', 'paxos', 'gossip', 'crdt'],
        languages: ['typescript', 'rust', 'go', 'java'],
      },
      deterministic_execution: {
        keywords: ['deterministic', 'replay', 'functional', 'pure', 'immutable'],
        languages: ['typescript', 'rust', 'go', 'haskell', 'elm'],
      },
    };
  }

  /**
   * Run ecosystem intelligence scan
   */
  async runEcosystemScan() {
    console.log('[EcosystemIntelligence] Running ecosystem intelligence scan');

    const discoveries = [];

    for (const [category, config] of Object.entries(this._searchCategories)) {
      console.log(`[EcosystemIntelligence] Scanning category: ${category}`);
      
      const categoryDiscoveries = await this._scanCategory(category, config);
      discoveries.push(...categoryDiscoveries);
    }

    // Score and store discoveries
    for (const discovery of discoveries) {
      await this._scoreAndStoreDiscovery(discovery);
    }

    console.log(`[EcosystemIntelligence] Ecosystem scan complete: ${discoveries.length} discoveries`);
    return discoveries;
  }

  /**
   * Scan a specific category
   */
  async _scanCategory(category, config) {
    const discoveries = [];

    // Search GitHub
    const githubDiscoveries = await this._searchGitHub(category, config);
    discoveries.push(...githubDiscoveries);

    // Search package registries
    const npmDiscoveries = await this._searchNPM(category, config);
    discoveries.push(...npmDiscoveries);

    const cargoDiscoveries = await this._searchCargo(category, config);
    discoveries.push(...cargoDiscoveries);

    const pypiDiscoveries = await this._searchPyPI(category, config);
    discoveries.push(...pypiDiscoveries);

    return discoveries;
  }

  /**
   * Search GitHub for category
   */
  async _searchGitHub(category, config) {
    const discoveries = [];

    if (!this._githubAdapter) {
      return discoveries;
    }

    for (const keyword of config.keywords) {
      for (const language of config.languages) {
        try {
          const results = await this._githubAdapter.searchRepositories(
            `${keyword} language:${language}`,
            10
          );

          for (const repo of results) {
            const repoId = `${repo.owner}/${repo.name}`;
            
            discoveries.push({
              discovery_id: deterministicIdAuthority.generateIdFromObject({
                category,
                repo_id: repoId,
                keyword,
              }),
              category: category,
              source: 'github',
              repo_id: repoId,
              keyword: keyword,
              language: language,
              stars: repo.stars,
              forks: repo.forks,
              description: repo.description,
              url: repo.url,
              discovered_at: constitutionalTimeAuthority.now(),
            });
          }
        } catch (error) {
          console.error(`[EcosystemIntelligence] GitHub search failed for ${keyword} in ${language}:`, error.message);
        }
      }
    }

    return discoveries;
  }

  /**
   * Search NPM for category
   */
  async _searchNPM(category, config) {
    const discoveries = [];

    if (!this._npmAdapter) {
      return discoveries;
    }

    if (!config.languages.includes('typescript') && !config.languages.includes('javascript')) {
      return discoveries;
    }

    for (const keyword of config.keywords) {
      try {
        const results = await this._npmAdapter.searchPackages(keyword, 10);

        for (const pkg of results) {
          discoveries.push({
            discovery_id: deterministicIdAuthority.generateIdFromObject({
              category,
              package: pkg.name,
              keyword,
            }),
            category: category,
            source: 'npm',
            package: pkg.name,
            keyword: keyword,
            version: pkg.version,
            description: pkg.description,
            downloads: pkg.downloads,
            discovered_at: constitutionalTimeAuthority.now(),
          });
        }
      } catch (error) {
        console.error(`[EcosystemIntelligence] NPM search failed for ${keyword}:`, error.message);
      }
    }

    return discoveries;
  }

  /**
   * Search Cargo for category
   */
  async _searchCargo(category, config) {
    const discoveries = [];

    if (!this._cargoAdapter) {
      return discoveries;
    }

    if (!config.languages.includes('rust')) {
      return discoveries;
    }

    for (const keyword of config.keywords) {
      try {
        const results = await this._cargoAdapter.searchCrates(keyword, 10);

        for (const crate of results) {
          discoveries.push({
            discovery_id: deterministicIdAuthority.generateIdFromObject({
              category,
              crate: crate.name,
              keyword,
            }),
            category: category,
            source: 'cargo',
            crate: crate.name,
            keyword: keyword,
            version: crate.version,
            description: crate.description,
            downloads: crate.downloads,
            discovered_at: constitutionalTimeAuthority.now(),
          });
        }
      } catch (error) {
        console.error(`[EcosystemIntelligence] Cargo search failed for ${keyword}:`, error.message);
      }
    }

    return discoveries;
  }

  /**
   * Search PyPI for category
   */
  async _searchPyPI(category, config) {
    const discoveries = [];

    if (!this._pypiAdapter) {
      return discoveries;
    }

    if (!config.languages.includes('python')) {
      return discoveries;
    }

    for (const keyword of config.keywords) {
      try {
        const results = await this._pypiAdapter.searchPackages(keyword, 10);

        for (const pkg of results) {
          discoveries.push({
            discovery_id: deterministicIdAuthority.generateIdFromObject({
              category,
              package: pkg.name,
              keyword,
            }),
            category: category,
            source: 'pypi',
            package: pkg.name,
            keyword: keyword,
            version: pkg.version,
            description: pkg.description,
            discovered_at: constitutionalTimeAuthority.now(),
          });
        }
      } catch (error) {
        console.error(`[EcosystemIntelligence] PyPI search failed for ${keyword}:`, error.message);
      }
    }

    return discoveries;
  }

  /**
   * Score and store discovery
   */
  async _scoreAndStoreDiscovery(discovery) {
    const score = this._computeDiscoveryScore(discovery);

    const discoveryRecord = {
      ...discovery,
      score: score,
      status: 'queued',
      queued_at: constitutionalTimeAuthority.now(),
    };

    try {
      await this._postgres.query(`
        INSERT INTO ecosystem_discoveries (discovery_id, discovery_record, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (discovery_id) DO UPDATE SET
          discovery_record = $2,
          updated_at = NOW()
      `, [discovery.discovery_id, JSON.stringify(discoveryRecord)]);
    } catch (error) {
      console.error(`[EcosystemIntelligence] Failed to store discovery ${discovery.discovery_id}:`, error.message);
    }
  }

  /**
   * Compute discovery score
   */
  _computeDiscoveryScore(discovery) {
    let score = 0;

    // Source priority
    const sourcePriority = {
      github: 1.0,
      npm: 0.8,
      cargo: 0.9,
      pypi: 0.8,
    };
    score += (sourcePriority[discovery.source] || 0.5) * 0.3;

    // Popularity (stars, downloads)
    if (discovery.stars) {
      score += Math.min(1, discovery.stars / 10000) * 0.3;
    } else if (discovery.downloads) {
      score += Math.min(1, discovery.downloads / 1000000) * 0.3;
    }

    // Keyword relevance
    score += 0.2;

    // Category relevance
    const categoryRelevance = {
      compiler_frameworks: 0.9,
      replay_engines: 0.95,
      deterministic_execution: 0.95,
      event_sourcing: 0.8,
      crdt_libraries: 0.85,
      workflow_engines: 0.8,
    };
    score += (categoryRelevance[discovery.category] || 0.5) * 0.2;

    return Math.min(1, score);
  }

  /**
   * Get discoveries by category
   */
  async getDiscoveriesByCategory(category, limit = 20) {
    try {
      const result = await this._postgres.query(`
        SELECT discovery_record
        FROM ecosystem_discoveries
        WHERE discovery_record->>'category' = $1
        ORDER BY discovery_record->>'score' DESC
        LIMIT $2
      `, [category, limit]);

      return result.rows.map(row => row.discovery_record);
    } catch (error) {
      console.error(`[EcosystemIntelligence] Failed to get discoveries for ${category}:`, error.message);
      return [];
    }
  }

  /**
   * Get top discoveries across all categories
   */
  async getTopDiscoveries(limit = 50) {
    try {
      const result = await this._postgres.query(`
        SELECT discovery_record
        FROM ecosystem_discoveries
        ORDER BY discovery_record->>'score' DESC
        LIMIT $1
      `, [limit]);

      return result.rows.map(row => row.discovery_record);
    } catch (error) {
      console.error('[EcosystemIntelligence] Failed to get top discoveries:', error.message);
      return [];
    }
  }

  /**
   * Get discovery statistics
   */
  async getDiscoveryStats() {
    try {
      const result = await this._postgres.query(`
        SELECT 
          discovery_record->>'category' as category,
          discovery_record->>'source' as source,
          COUNT(*) as count
        FROM ecosystem_discoveries
        GROUP BY discovery_record->>'category', discovery_record->>'source'
      `);

      const stats = {
        total: 0,
        by_category: {},
        by_source: {},
      };

      for (const row of result.rows) {
        stats.total += parseInt(row.count, 10);
        stats.by_category[row.category] = (stats.by_category[row.category] || 0) + parseInt(row.count, 10);
        stats.by_source[row.source] = (stats.by_source[row.source] || 0) + parseInt(row.count, 10);
      }

      return stats;
    } catch (error) {
      console.error('[EcosystemIntelligence] Failed to get discovery stats:', error.message);
      return { total: 0, by_category: {}, by_source: {} };
    }
  }
}

module.exports = { EcosystemIntelligence };
