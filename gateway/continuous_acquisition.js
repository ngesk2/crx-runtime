/**
 * Continuous Git Constitutional Acquisition
 * 
 * Ω.23 — Continuous Git Constitutional Acquisition
 * 
 * Instead of manually importing repositories, make Git acquisition autonomous.
 * 
 * Pipeline:
 * GitHub → Webhook/Poll → Acquire Commit → Immutable Snapshot → Constitutional Objects → Compiler
 * 
 * Each discovered commit becomes:
 * - Commit Object
 * - Tree Object
 * - Blob Objects
 * - Diff Objects
 * - File Version Objects
 * - Semantic Objects
 * 
 * Constitutional Constraint: Nothing skips acquisition.
 * Every Git change becomes immutable constitutional evidence.
 */

const crypto = require('crypto');
const { GitTransport } = require('./git_transport');
const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { semanticAuthority } = require('./semantic_authority');
const { snapshotAuthority } = require('./snapshot_authority');
const { AcquisitionAuthority } = require('./acquisition_authority');

class ContinuousAcquisition {
  constructor(postgresPool, objectRegistry, eventBus) {
    this._postgres = postgresPool;
    this._objectRegistry = objectRegistry;
    this._eventBus = eventBus;
    this._acquisitionAuthority = new AcquisitionAuthority(postgresPool, objectRegistry, eventBus);
    this._pollingInterval = 60000; // 1 minute default
    this._pollingTimer = null;
    this._initialized = false;
  }

  /**
   * Initialize continuous acquisition
   */
  async initialize() {
    await this._acquisitionAuthority.initialize();
    this._startPolling();
    this._initialized = true;
    console.log('[ContinuousAcquisition] Initialized');
  }

  /**
   * Track a repository for continuous acquisition
   */
  async trackRepository(owner, repo, webhookSecret = null) {
    await this._acquisitionAuthority.trackRepository(owner, repo, webhookSecret);
  }

  /**
   * Handle GitHub webhook push event
   */
  async handleWebhook(payload, signature) {
    await this._acquisitionAuthority.handleWebhook(payload, signature);
  }

  /**
   * Poll repositories for new commits
   */
  async _pollRepositories() {
    const tracked = this._acquisitionAuthority.getTrackedRepositories();
    for (const repo of tracked) {
      try {
        await this._acquisitionAuthority.acquireRepository(repo.owner, repo.repo);
      } catch (error) {
        console.error('[ContinuousAcquisition] Poll failed for:', repo.repo_id, error.message);
      }
    }
  }

  /**
   * Start polling timer
   */
  _startPolling() {
    if (this._pollingTimer) {
      clearInterval(this._pollingTimer);
    }
    this._pollingTimer = setInterval(() => {
      this._pollRepositories();
    }, this._pollingInterval);
  }

  /**
   * Stop polling timer
   */
  _stopPolling() {
    if (this._pollingTimer) {
      clearInterval(this._pollingTimer);
      this._pollingTimer = null;
    }
  }

  /**
   * Stop continuous acquisition
   */
  async stop() {
    this._stopPolling();
    this._initialized = false;
    console.log('[ContinuousAcquisition] Stopped');
  }
}

module.exports = { ContinuousAcquisition };
