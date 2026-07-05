/**
 * Acquisition Authority
 * 
 * Ω.49 — Acquisition Authority
 * 
 * Constitutional acquisition orchestration authority.
 * 
 * Separates acquisition orchestration from implementation details.
 * This authority coordinates the full acquisition workflow.
 */

const { GitTransport } = require('./git_transport');
const { snapshotAuthority } = require('./snapshot_authority');
const { semanticAuthority } = require('./semantic_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { CanonicalAuthority } = require('./canonical_authority');

class AcquisitionAuthority {
  constructor(postgresPool, objectRegistry, eventBus) {
    this._postgres = postgresPool;
    this._objectRegistry = objectRegistry;
    this._eventBus = eventBus;
    this._gitTransport = new GitTransport();
    this._trackedRepositories = new Map();
    this._lastCommitMap = new Map();
    this._authorityVersion = '1.0.0';
  }

  /**
   * Initialize acquisition authority
   */
  async initialize() {
    await this._loadTrackedRepositories();
    console.log('[AcquisitionAuthority] Initialized with', this._trackedRepositories.size, 'repositories');
  }

  /**
   * Track a repository for acquisition
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} webhookSecret - Optional webhook secret
   */
  async trackRepository(owner, repo, webhookSecret = null) {
    const repoId = `${owner}/${repo}`;
    
    this._trackedRepositories.set(repoId, {
      owner,
      repo,
      webhookSecret,
      tracked_at: new Date(constitutionalTimeAuthority.now()).toISOString(),
    });

    await this._postgres.query(`
      INSERT INTO tracked_repositories (repo_id, owner, repo, webhook_secret, tracked_at, active)
      VALUES ($1, $2, $3, $4, NOW(), true)
      ON CONFLICT (repo_id) DO UPDATE SET
        webhook_secret = COALESCE($4, webhook_secret),
        active = true,
        tracked_at = NOW()
    `, [repoId, owner, repo, webhookSecret]);

    await this.acquireRepository(owner, repo);
    console.log('[AcquisitionAuthority] Tracking repository:', repoId);
  }

  /**
   * Acquire repository snapshot
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Object} Acquisition result
   */
  async acquireRepository(owner, repo) {
    const repoId = `${owner}/${repo}`;
    
    const snapshot = await this._gitTransport.fetchRepository(owner, repo);
    const snapshotObjects = snapshotAuthority.createFullSnapshot(snapshot, repoId);
    
    for (const obj of snapshotObjects) {
      await this._objectRegistry.register(obj);
    }

    const acquiredCommits = [];
    for (const commit of snapshot.commits) {
      const lastCommit = this._lastCommitMap.get(repoId);
      
      if (!lastCommit || commit.sha !== lastCommit) {
        const result = await this.acquireCommit(owner, repo, commit.sha, snapshot);
        acquiredCommits.push(result);
        this._lastCommitMap.set(repoId, commit.sha);
      }
    }

    return {
      repo_id: repoId,
      snapshot_objects: snapshotObjects.length,
      acquired_commits: acquiredCommits.length,
    };
  }

  /**
   * Acquire single commit
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} commitSha - Commit SHA
   * @param {Object} snapshot - Optional snapshot data
   * @returns {Object} Acquisition result
   */
  async acquireCommit(owner, repo, commitSha, snapshot = null) {
    const repoId = `${owner}/${repo}`;
    
    if (!snapshot) {
      snapshot = await this._gitTransport.fetchRepository(owner, repo);
    }

    const commit = snapshot.commits.find(c => c.sha === commitSha);
    if (!commit) {
      console.warn('[AcquisitionAuthority] Commit not found:', commitSha);
      return null;
    }

    const objects = [];
    const lifecycleId = identityAuthority.generateId('lifecycle', {
      repo_id: repoId,
      commit_sha: commitSha,
      timestamp: constitutionalTimeAuthority.now(),
    });

    // Create commit snapshot
    const commitSnapshot = snapshotAuthority.createCommitSnapshot(commit, repoId, lifecycleId);
    objects.push(commitSnapshot);

    // Create tree and blob snapshots
    if (commit.tree) {
      const treeSnapshot = snapshotAuthority.createTreeSnapshot(commit.tree, commitSha, repoId, lifecycleId);
      objects.push(treeSnapshot);

      for (const blob of commit.tree.blobs || []) {
        const blobSnapshot = snapshotAuthority.createBlobSnapshot(blob, commit.tree.sha, commitSha, repoId, lifecycleId);
        objects.push(blobSnapshot);
      }
    }

    // Create semantic objects
    for (const file of commit.files || []) {
      const semanticObj = semanticAuthority.classifyCommitType(file, commitSha, repoId, lifecycleId);
      objects.push(semanticObj);
    }

    // Register all objects
    for (const obj of objects) {
      await this._objectRegistry.register(obj);
    }

    // Emit acquisition event
    if (this._eventBus) {
      await this._eventBus.emit('commit_acquired', {
        repo_id: repoId,
        commit_sha: commitSha,
        objects_count: objects.length,
        lifecycle_id: lifecycleId,
      });
    }

    return {
      repo_id: repoId,
      commit_sha: commitSha,
      objects_count: objects.length,
      lifecycle_id: lifecycleId,
    };
  }

  /**
   * Handle webhook push event
   * @param {Object} payload - Webhook payload
   * @param {string} signature - Webhook signature
   */
  async handleWebhook(payload, signature) {
    const repoId = `${payload.repository.owner.login}/${payload.repository.name}`;
    const tracked = this._trackedRepositories.get(repoId);

    if (!tracked || !tracked.webhookSecret) {
      console.warn('[AcquisitionAuthority] Repository not tracked or no webhook secret:', repoId);
      return;
    }

    const expectedSignature = this._computeWebhookSignature(payload, tracked.webhookSecret);
    if (signature !== expectedSignature) {
      console.error('[AcquisitionAuthority] Invalid webhook signature for:', repoId);
      throw new Error('Invalid webhook signature');
    }

    if (payload.commits && payload.commits.length > 0) {
      for (const commit of payload.commits) {
        await this.acquireCommit(tracked.owner, tracked.repo, commit.id);
      }
    }

    console.log('[AcquisitionAuthority] Processed webhook for:', repoId, payload.commits?.length, 'commits');
  }

  /**
   * Load tracked repositories from database
   */
  async _loadTrackedRepositories() {
    const result = await this._postgres.query(
      'SELECT repo_id, owner, repo, webhook_secret, tracked_at FROM tracked_repositories WHERE active = true'
    );

    for (const row of result.rows) {
      this._trackedRepositories.set(row.repo_id, {
        owner: row.owner,
        repo: row.repo,
        webhookSecret: row.webhook_secret,
        tracked_at: row.tracked_at,
      });
    }
  }

  /**
   * Compute webhook signature
   * @param {Object} payload - Webhook payload
   * @param {string} secret - Webhook secret
   * @returns {string} Signature
   */
  _computeWebhookSignature(payload, secret) {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha1=${hmac.digest('hex')}`;
  }

  /**
   * Get tracked repositories
   * @returns {Array} Tracked repositories
   */
  getTrackedRepositories() {
    return Array.from(this._trackedRepositories.entries()).map(([repoId, data]) => ({
      repo_id: repoId,
      ...data,
    }));
  }

  /**
   * Get last commit for repository
   * @param {string} repoId - Repository identifier
   * @returns {string|null} Last commit SHA
   */
  getLastCommit(repoId) {
    return this._lastCommitMap.get(repoId) || null;
  }

  /**
   * Get authority version
   * @returns {string} Authority version
   */
  getAuthorityVersion() {
    return this._authorityVersion;
  }
}

module.exports = { AcquisitionAuthority };
