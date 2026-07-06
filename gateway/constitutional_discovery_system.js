/**
 * Constitutional Discovery System
 * 
 * Ω.90 — Autonomous Constitutional Technology Acquisition
 * 
 * Continuous Discovery System that monitors the software ecosystem for new releases and architectural innovations.
 * 
 * Sources:
 * - GitHub Releases
 * - GitHub Trending
 * - Awesome lists
 * - Language ecosystems (Rust, Go, TypeScript, Python, Zig, C++, etc.)
 * - OSS package registries
 * 
 * Discovery Queue ordered by:
 * - Release freshness
 * - Architectural novelty
 * - Ecosystem adoption
 * - Compiler/runtime relevance
 * - Infrastructure relevance
 * - AI relevance
 */

const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { deterministicIdAuthority } = require('./deterministic_id_authority');

class ConstitutionalDiscoverySystem {
  constructor(postgresPool, githubAdapter) {
    this._postgres = postgresPool;
    this._githubAdapter = githubAdapter;
    this._discoveryQueue = new Map(); // repo_id → discovery record
    this._discoveredRepos = new Set(); // Set of discovered repo IDs
    this._sources = new Map(); // source → source config
  }

  /**
   * Initialize discovery system
   */
  async initialize() {
    console.log('[DiscoverySystem] Initializing constitutional discovery system');

    // Configure discovery sources
    this._configureSources();

    // Load previous discoveries
    await this._loadPreviousDiscoveries();

    console.log('[DiscoverySystem] Discovery system initialized');
  }

  /**
   * Configure discovery sources
   */
  _configureSources() {
    this._sources.set('github_releases', {
      enabled: true,
      priority: 1.0,
      languages: ['javascript', 'typescript', 'rust', 'go', 'python', 'zig', 'cpp'],
      refresh_interval_ms: 3600000, // 1 hour
    });

    this._sources.set('github_trending', {
      enabled: true,
      priority: 0.9,
      languages: ['javascript', 'typescript', 'rust', 'go', 'python'],
      refresh_interval_ms: 86400000, // 24 hours
    });

    this._sources.set('awesome_lists', {
      enabled: true,
      priority: 0.8,
      lists: [
        'awesome-rust',
        'awesome-go',
        'awesome-typescript',
        'awesome-python',
        'awesome-zig',
      ],
      refresh_interval_ms: 604800000, // 7 days
    });

    this._sources.set('language_ecosystems', {
      enabled: true,
      priority: 0.7,
      ecosystems: ['crates.io', 'npm', 'pypi', 'go modules'],
      refresh_interval_ms: 86400000, // 24 hours
    });
  }

  /**
   * Load previous discoveries from PostgreSQL
   */
  async _loadPreviousDiscoveries() {
    try {
      const result = await this._postgres.query(`
        SELECT repo_id, discovery_record
        FROM discovery_queue
        ORDER BY discovered_at DESC
        LIMIT 1000
      `);

      for (const row of result.rows) {
        this._discoveryQueue.set(row.repo_id, row.discovery_record);
        this._discoveredRepos.add(row.repo_id);
      }

      console.log(`[DiscoverySystem] Loaded ${this._discoveryQueue.size} previous discoveries`);
    } catch (error) {
      console.error('[DiscoverySystem] Failed to load previous discoveries:', error.message);
    }
  }

  /**
   * Run continuous discovery
   */
  async runContinuousDiscovery() {
    console.log('[DiscoverySystem] Running continuous discovery');

    const discoveries = [];

    // Discover from GitHub Releases
    if (this._sources.get('github_releases').enabled) {
      const releases = await this._discoverGitHubReleases();
      discoveries.push(...releases);
    }

    // Discover from GitHub Trending
    if (this._sources.get('github_trending').enabled) {
      const trending = await this._discoverGitHubTrending();
      discoveries.push(...trending);
    }

    // Discover from Awesome lists
    if (this._sources.get('awesome_lists').enabled) {
      const awesome = await this._discoverAwesomeLists();
      discoveries.push(...awesome);
    }

    // Discover from language ecosystems
    if (this._sources.get('language_ecosystems').enabled) {
      const ecosystems = await this._discoverLanguageEcosystems();
      discoveries.push(...ecosystems);
    }

    // Score and queue discoveries
    for (const discovery of discoveries) {
      await this._scoreAndQueueDiscovery(discovery);
    }

    console.log(`[DiscoverySystem] Continuous discovery complete: ${discoveries.length} new discoveries`);
    return discoveries;
  }

  /**
   * Discover from GitHub Releases
   */
  async _discoverGitHubReleases() {
    const discoveries = [];

    if (!this._githubAdapter) {
      console.warn('[DiscoverySystem] GitHub adapter not available');
      return discoveries;
    }

    try {
      const languages = this._sources.get('github_releases').languages;
      
      for (const language of languages) {
        const releases = await this._githubAdapter.getLatestReleases(language, 50);
        
        for (const release of releases) {
          const repoId = `${release.owner}/${release.name}`;
          
          if (this._discoveredRepos.has(repoId)) {
            continue;
          }

          const discovery = {
            repo_id: repoId,
            source: 'github_releases',
            language: language,
            release: {
              tag_name: release.tag_name,
              published_at: release.published_at,
              name: release.name,
            },
            discovered_at: constitutionalTimeAuthority.now(),
          };

          discoveries.push(discovery);
          this._discoveredRepos.add(repoId);
        }
      }
    } catch (error) {
      console.error('[DiscoverySystem] Failed to discover GitHub releases:', error.message);
    }

    return discoveries;
  }

  /**
   * Discover from GitHub Trending
   */
  async _discoverGitHubTrending() {
    const discoveries = [];

    if (!this._githubAdapter) {
      return discoveries;
    }

    try {
      const languages = this._sources.get('github_trending').languages;
      
      for (const language of languages) {
        const trending = await this._githubAdapter.getTrendingRepositories(language, 20);
        
        for (const repo of trending) {
          const repoId = `${repo.owner}/${repo.name}`;
          
          if (this._discoveredRepos.has(repoId)) {
            continue;
          }

          const discovery = {
            repo_id: repoId,
            source: 'github_trending',
            language: language,
            trending: {
              stars: repo.stars,
              forks: repo.forks,
              description: repo.description,
            },
            discovered_at: constitutionalTimeAuthority.now(),
          };

          discoveries.push(discovery);
          this._discoveredRepos.add(repoId);
        }
      }
    } catch (error) {
      console.error('[DiscoverySystem] Failed to discover GitHub trending:', error.message);
    }

    return discoveries;
  }

  /**
   * Discover from Awesome lists
   */
  async _discoverAwesomeLists() {
    const discoveries = [];

    if (!this._githubAdapter) {
      return discoveries;
    }

    try {
      const lists = this._sources.get('awesome_lists').lists;
      
      for (const listName of lists) {
        const awesomeRepos = await this._githubAdapter.getAwesomeListRepos(listName, 100);
        
        for (const repo of awesomeRepos) {
          const repoId = `${repo.owner}/${repo.name}`;
          
          if (this._discoveredRepos.has(repoId)) {
            continue;
          }

          const discovery = {
            repo_id: repoId,
            source: 'awesome_lists',
            list_name: listName,
            awesome: {
              category: repo.category,
              description: repo.description,
            },
            discovered_at: constitutionalTimeAuthority.now(),
          };

          discoveries.push(discovery);
          this._discoveredRepos.add(repoId);
        }
      }
    } catch (error) {
      console.error('[DiscoverySystem] Failed to discover awesome lists:', error.message);
    }

    return discoveries;
  }

  /**
   * Discover from language ecosystems
   */
  async _discoverLanguageEcosystems() {
    const discoveries = [];

    // Placeholder: Implement ecosystem-specific discovery
    // This would involve querying crates.io, npm, pypi, go modules APIs

    return discoveries;
  }

  /**
   * Score and queue discovery
   */
  async _scoreAndQueueDiscovery(discovery) {
    const score = this._computeDiscoveryScore(discovery);

    const discoveryRecord = {
      ...discovery,
      score: score,
      status: 'queued',
      queued_at: constitutionalTimeAuthority.now(),
    };

    this._discoveryQueue.set(discovery.repo_id, discoveryRecord);
    await this._persistDiscoveryRecord(discoveryRecord);
  }

  /**
   * Compute discovery score
   * 
   * Factors:
   * - Release freshness (higher = more recent)
   * - Architectural novelty (higher = more novel)
   * - Ecosystem adoption (higher = more adopted)
   * - Compiler/runtime relevance (higher = more relevant)
   * - Infrastructure relevance (higher = more relevant)
   * - AI relevance (higher = more relevant)
   */
  _computeDiscoveryScore(discovery) {
    let score = 0;

    // Release freshness
    if (discovery.release) {
      const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
      const releaseAge = constitutionalTimeAuthority.nowAsMillis() - new Date(discovery.release.published_at).getTime();
      const freshnessScore = Math.max(0, 1 - (releaseAge / (30 * 24 * 60 * 60 * 1000))); // Decay over 30 days
      score += freshnessScore * 0.3;
    }

    // Ecosystem adoption (from trending stars)
    if (discovery.trending) {
      const stars = discovery.trending.stars || 0;
      const adoptionScore = Math.min(1, stars / 10000); // Normalize to 0-1
      score += adoptionScore * 0.2;
    }

    // Source priority
    const sourcePriority = this._sources.get(discovery.source)?.priority || 0.5;
    score += sourcePriority * 0.2;

    // Language relevance (prioritize languages relevant to PING)
    const relevantLanguages = ['javascript', 'typescript', 'rust', 'go'];
    const languageRelevance = relevantLanguages.includes(discovery.language) ? 1 : 0.5;
    score += languageRelevance * 0.1;

    // Architectural novelty (placeholder - would require analysis)
    score += 0.1;

    // AI relevance (placeholder - would require keyword analysis)
    score += 0.1;

    return Math.min(1, score);
  }

  /**
   * Persist discovery record to PostgreSQL
   */
  async _persistDiscoveryRecord(record) {
    try {
      await this._postgres.query(`
        INSERT INTO discovery_queue (repo_id, discovery_record, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (repo_id) DO UPDATE SET
          discovery_record = $2,
          updated_at = NOW()
      `, [record.repo_id, JSON.stringify(record)]);
    } catch (error) {
      console.error(`[DiscoverySystem] Failed to persist discovery record for ${record.repo_id}:`, error.message);
    }
  }

  /**
   * Get discovery queue ordered by score
   */
  getDiscoveryQueue(limit = 100) {
    const queue = Array.from(this._discoveryQueue.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return queue;
  }

  /**
   * Get next discovery from queue
   */
  getNextDiscovery() {
    const queue = this.getDiscoveryQueue(1);
    return queue.length > 0 ? queue[0] : null;
  }

  /**
   * Update discovery status
   */
  async updateDiscoveryStatus(repoId, status, metadata = {}) {
    const record = this._discoveryQueue.get(repoId);
    if (!record) {
      return;
    }

    record.status = status;
    record.status_updated_at = constitutionalTimeAuthority.now();
    record.metadata = { ...record.metadata, ...metadata };

    await this._persistDiscoveryRecord(record);
  }

  /**
   * Get discovery statistics
   */
  getDiscoveryStats() {
    const queue = Array.from(this._discoveryQueue.values());

    const stats = {
      total_discovered: this._discoveredRepos.size,
      queued: queue.filter(r => r.status === 'queued').length,
      processing: queue.filter(r => r.status === 'processing').length,
      completed: queue.filter(r => r.status === 'completed').length,
      failed: queue.filter(r => r.status === 'failed').length,
      ignored: queue.filter(r => r.status === 'ignored').length,
      by_source: {},
      by_language: {},
    };

    for (const record of queue) {
      stats.by_source[record.source] = (stats.by_source[record.source] || 0) + 1;
      if (record.language) {
        stats.by_language[record.language] = (stats.by_language[record.language] || 0) + 1;
      }
    }

    return stats;
  }
}

module.exports = { ConstitutionalDiscoverySystem };
