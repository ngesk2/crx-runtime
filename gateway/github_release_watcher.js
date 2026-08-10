/**
 * GitHub Release Watcher
 * 
 * Ω.90 — Actual GitHub Release Watcher
 * 
 * Poll GitHub Releases every few hours.
 * Detect new releases.
 * Compare against the last constitutional scan.
 * Queue only new repositories and new versions.
 */

const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { deterministicIdAuthority } = require('../ping-runtime/authorities/deterministic_id_authority');

class GitHubReleaseWatcher {
  constructor(postgresPool, githubAdapter) {
    this._postgres = postgresPool;
    this._githubAdapter = githubAdapter;
    this._lastScanTimestamp = null;
    this._processedReleases = new Set(); // Set of processed release IDs
    this._pollIntervalMs = 3600000; // 1 hour default
  }

  /**
   * Initialize release watcher
   */
  async initialize() {
    console.log('[GitHubReleaseWatcher] Initializing GitHub release watcher');

    // Load last scan timestamp
    await this._loadLastScanTimestamp();

    // Load processed releases
    await this._loadProcessedReleases();

    console.log('[GitHubReleaseWatcher] Release watcher initialized');
  }

  /**
   * Load last scan timestamp from PostgreSQL
   */
  async _loadLastScanTimestamp() {
    try {
      const result = await this._postgres.query(`
        SELECT timestamp
        FROM github_scan_metadata
        WHERE id = 'last_scan'
      `);

      if (result.rows.length > 0) {
        this._lastScanTimestamp = new Date(result.rows[0].timestamp);
        console.log(`[GitHubReleaseWatcher] Last scan: ${this._lastScanTimestamp.toISOString()}`);
      } else {
        this._lastScanTimestamp = new Date(constitutionalTimeAuthority.now() - (24 * 60 * 60 * 1000)); // Default to 24 hours ago
        console.log('[GitHubReleaseWatcher] No last scan found, defaulting to 24 hours ago');
      }
    } catch (error) {
      console.error('[GitHubReleaseWatcher] Failed to load last scan timestamp:', error.message);
      this._lastScanTimestamp = new Date(constitutionalTimeAuthority.now() - (24 * 60 * 60 * 1000));
    }
  }

  /**
   * Load processed releases from PostgreSQL
   */
  async _loadProcessedReleases() {
    try {
      const result = await this._postgres.query(`
        SELECT release_id
        FROM processed_releases
        WHERE processed_at > NOW() - INTERVAL '30 days'
      `);

      for (const row of result.rows) {
        this._processedReleases.add(row.release_id);
      }

      console.log(`[GitHubReleaseWatcher] Loaded ${this._processedReleases.size} processed releases`);
    } catch (error) {
      console.error('[GitHubReleaseWatcher] Failed to load processed releases:', error.message);
    }
  }

  /**
   * Run release scan
   */
  async runReleaseScan() {
    console.log('[GitHubReleaseWatcher] Running release scan');

    const startTime = constitutionalTimeAuthority.nowAsMillis();
    const newReleases = [];

    try {
      // Get repositories to watch
      const watchedRepos = await this._getWatchedRepositories();

      for (const repo of watchedRepos) {
        const releases = await this._fetchRepositoryReleases(repo.owner, repo.name);

        for (const release of releases) {
          const releaseId = `${repo.owner}/${repo.name}/${release.tag_name}`;

          // Skip if already processed
          if (this._processedReleases.has(releaseId)) {
            continue;
          }

          // Skip if release is older than last scan
          const releaseDate = new Date(release.published_at);
          if (releaseDate < this._lastScanTimestamp) {
            continue;
          }

          // Queue new release
          newReleases.push({
            release_id: releaseId,
            owner: repo.owner,
            name: repo.name,
            tag_name: release.tag_name,
            published_at: release.published_at,
            description: release.body || release.name,
            category: repo.category,
          });

          this._processedReleases.add(releaseId);
        }
      }

      // Update last scan timestamp
      await this._updateLastScanTimestamp(startTime);

      // Persist processed releases
      await this._persistProcessedReleases(newReleases);

      console.log(`[GitHubReleaseWatcher] Release scan complete: ${newReleases.length} new releases`);
      return newReleases;
    } catch (error) {
      console.error('[GitHubReleaseWatcher] Release scan failed:', error.message);
      throw error;
    }
  }

  /**
   * Get watched repositories
   */
  async _getWatchedRepositories() {
    try {
      const result = await this._postgres.query(`
        SELECT owner, name, category
        FROM watched_repositories
        WHERE enabled = true
      `);

      return result.rows;
    } catch (error) {
      console.error('[GitHubReleaseWatcher] Failed to get watched repositories:', error.message);
      return [];
    }
  }

  /**
   * Fetch repository releases from GitHub
   */
  async _fetchRepositoryReleases(owner, name) {
    if (!this._githubAdapter) {
      console.warn('[GitHubReleaseWatcher] GitHub adapter not available');
      return [];
    }

    try {
      return await this._githubAdapter.getReleases(owner, name, 10);
    } catch (error) {
      console.error(`[GitHubReleaseWatcher] Failed to fetch releases for ${owner}/${name}:`, error.message);
      return [];
    }
  }

  /**
   * Update last scan timestamp
   */
  async _updateLastScanTimestamp(timestamp) {
    try {
      await this._postgres.query(`
        INSERT INTO github_scan_metadata (id, timestamp)
        VALUES ('last_scan', $1)
        ON CONFLICT (id) DO UPDATE SET
          timestamp = $1
      `, [new Date(timestamp).toISOString()]);
    } catch (error) {
      console.error('[GitHubReleaseWatcher] Failed to update last scan timestamp:', error.message);
    }
  }

  /**
   * Persist processed releases
   */
  async _persistProcessedReleases(releases) {
    if (releases.length === 0) {
      return;
    }

    try {
      for (const release of releases) {
        await this._postgres.query(`
          INSERT INTO processed_releases (release_id, release_data, processed_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (release_id) DO UPDATE SET
            release_data = $2,
            processed_at = NOW()
        `, [release.release_id, JSON.stringify(release)]);
      }
    } catch (error) {
      console.error('[GitHubReleaseWatcher] Failed to persist processed releases:', error.message);
    }
  }

  /**
   * Add watched repository
   */
  async addWatchedRepository(owner, name, category = 'general') {
    try {
      await this._postgres.query(`
        INSERT INTO watched_repositories (owner, name, category, enabled, created_at)
        VALUES ($1, $2, $3, true, NOW())
        ON CONFLICT (owner, name) DO UPDATE SET
          category = $3,
          enabled = true,
          updated_at = NOW()
      `, [owner, name, category]);

      console.log(`[GitHubReleaseWatcher] Added watched repository: ${owner}/${name}`);
    } catch (error) {
      console.error(`[GitHubReleaseWatcher] Failed to add watched repository ${owner}/${name}:`, error.message);
      throw error;
    }
  }

  /**
   * Remove watched repository
   */
  async removeWatchedRepository(owner, name) {
    try {
      await this._postgres.query(`
        UPDATE watched_repositories
        SET enabled = false, updated_at = NOW()
        WHERE owner = $1 AND name = $2
      `, [owner, name]);

      console.log(`[GitHubReleaseWatcher] Removed watched repository: ${owner}/${name}`);
    } catch (error) {
      console.error(`[GitHubReleaseWatcher] Failed to remove watched repository ${owner}/${name}:`, error.message);
      throw error;
    }
  }

  /**
   * Start polling
   */
  startPolling(intervalMs = null) {
    this._pollIntervalMs = intervalMs || this._pollIntervalMs;

    console.log(`[GitHubReleaseWatcher] Starting polling (interval: ${this._pollIntervalMs}ms)`);

    this._pollInterval = setInterval(async () => {
      try {
        await this.runReleaseScan();
      } catch (error) {
        console.error('[GitHubReleaseWatcher] Polling error:', error.message);
      }
    }, this._pollIntervalMs);
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (this._pollInterval) {
      clearInterval(this._pollInterval);
      this._pollInterval = null;
      console.log('[GitHubReleaseWatcher] Stopped polling');
    }
  }

  /**
   * Get release statistics
   */
  getReleaseStats() {
    return {
      last_scan: this._lastScanTimestamp?.toISOString() || null,
      processed_releases_count: this._processedReleases.size,
      poll_interval_ms: this._pollIntervalMs,
      is_polling: this._pollInterval !== null,
    };
  }
}

module.exports = { GitHubReleaseWatcher };
