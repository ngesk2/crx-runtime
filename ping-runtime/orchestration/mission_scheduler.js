/**
 * Mission Scheduler — PING Core v1
 *
 * Bridges MissionRuntime ↔ WorkerRuntime.
 *
 * Flow:
 *   MissionRuntime.getPending()
 *       ↓
 *   MissionScheduler polls, matches mission_type to worker
 *       ↓
 *   WorkerRuntime.dispatch(mission)
 *       ↓
 *   Worker completes → MissionRuntime.complete(missionId, result)
 *       ↓
 *   Event emitted → Mission Control updates
 *
 * Design:
 *   - Polls on interval (default 5s)
 *   - Maps mission_type → worker name via MISSION_WORKER_MAP
 *   - Skips missions already assigned (idempotent)
 *   - Gracefully no-ops when dependencies unavailable
 *   - Single source of truth: MissionRuntime
 */

const crypto = require('crypto');
const { constitutionalTimeAuthority } = require('../authorities/constitutional_time_authority.js');

// Map mission_type → worker name
// Workers register with WorkerRuntime using these names
const MISSION_WORKER_MAP = {
  // Event pipeline missions
  DOCUMENT_IMPORT: 'observation',
  OBSERVATION_CREATE: 'observation',
  CLAIM_GENERATE: 'claim',
  CLASSIFICATION_CREATE: 'classification',
  RECOMMENDATION_CREATE: 'recommendation',
  PROJECTION_CREATE: 'projection',
  REPLAY_VERIFY: 'replay',
  WITNESS_CREATE: 'witness',
  LINEAGE_CREATE: 'lineage',

  // Knowledge missions
  KNOWLEDGE_EXTRACT: 'observation',
  KNOWLEDGE_INDEX: 'projection',

  // System missions
  SYSTEM_HEALTH_CHECK: 'observation',
  SYSTEM_AUDIT: 'claim',

  // Business missions (from EventToMissionBridge)
  CUSTOMER_ONBOARD: 'observation',
  CUSTOMER_UPDATE: 'observation',
  LEAD_FOLLOWUP: 'observation',
  LEAD_CONVERT: 'observation',
  PROJECT_SETUP: 'observation',
  PROJECT_UPDATE: 'observation',
  PROJECT_CLOSEOUT: 'observation',
  ESTIMATE_PREPARE: 'observation',
  ESTIMATE_FOLLOWUP: 'observation',
  ESTIMATE_CONVERT: 'observation',
  INVOICE_TRACK: 'observation',
  INVOICE_FOLLOWUP: 'observation',
  INVOICE_CLOSE: 'observation',
  REVIEW_RESPONSE: 'observation',
  REVIEW_ACK: 'observation',
  EMAIL_PROCESS: 'observation',
};

class MissionScheduler {
  /**
   * @param {object} options
   * @param {object} options.missionRuntime — MissionRuntime instance
   * @param {object} options.workerRuntime — WorkerRuntime instance
   * @param {object} options.eventRuntime — UnifiedEventRuntime instance (for emitting)
   * @param {number} options.pollIntervalMs — poll interval (default 5000)
   * @param {number} options.maxConcurrent — max missions processed in parallel (default 3)
   */
  constructor(options = {}) {
    this._missionRuntime = options.missionRuntime || null;
    this._workerRuntime = options.workerRuntime || null;
    this._eventRuntime = options.eventRuntime || null;
    this._pollIntervalMs = options.pollIntervalMs || 5000;
    this._maxConcurrent = options.maxConcurrent || 3;
    this._timer = null;
    this._running = false;
    this._processing = new Set(); // mission_ids currently being processed

    this._stats = {
      dispatched: 0,
      completed: 0,
      failed: 0,
      skipped: 0,
    };
  }

  /**
   * Start the scheduler polling loop.
   */
  start() {
    if (!this._missionRuntime || !this._workerRuntime) {
      console.log('[MissionScheduler] Degraded mode — scheduler disabled (missing dependencies)');
      return;
    }
    if (this._running) return;
    this._running = true;
    console.log(`[MissionScheduler] Started — polling every ${this._pollIntervalMs}ms, maxConcurrent=${this._maxConcurrent}`);
    this._timer = setInterval(() => this._poll(), this._pollIntervalMs);
    // Run immediately
    this._poll();
  }

  /**
   * Stop the scheduler.
   */
  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    this._running = false;
    console.log('[MissionScheduler] Stopped');
  }

  /**
   * Single poll cycle: get pending missions, dispatch to workers.
   */
  async _poll() {
    if (!this._missionRuntime || !this._workerRuntime) return;
    if (this._processing.size >= this._maxConcurrent) return;

    try {
      const availableSlots = this._maxConcurrent - this._processing.size;
      const pending = await this._missionRuntime.getPending(availableSlots);

      for (const mission of pending) {
        if (this._processing.has(mission.mission_id)) continue;
        await this._dispatch(mission);
      }
    } catch (err) {
      console.error(`[MissionScheduler] Poll error: ${err.message}`);
    }
  }

  /**
   * Dispatch a mission to the appropriate worker.
   */
  async _dispatch(mission) {
    const workerName = MISSION_WORKER_MAP[mission.mission_type] || this._inferWorker(mission.mission_type);
    if (!workerName) {
      console.log(`[MissionScheduler] No worker for mission type '${mission.mission_type}' — skipping ${mission.mission_id}`);
      this._stats.skipped++;
      return;
    }

    // Check if worker is registered
    const stats = this._workerRuntime.getStats();
    if (!stats.workers[workerName]) {
      console.log(`[MissionScheduler] Worker '${workerName}' not registered — skipping ${mission.mission_id}`);
      this._stats.skipped++;
      return;
    }

    this._processing.add(mission.mission_id);

    try {
      // Assign mission
      await this._missionRuntime.assign(mission.mission_id, workerName);

      // Start mission
      await this._missionRuntime.start(mission.mission_id);

      // Build event for worker — dispatch on the ORIGINAL business event type
      // (mission.payload.event_type, stored by EventToMissionBridge), not the
      // mission_type. Workers register on business event types (e.g. LEAD_CREATED);
      // dispatching mission_type (e.g. LEAD_FOLLOWUP) would silently no-op and
      // produce a phantom completion. Mirrors test_commissioning.js:345-352.
      const payload = typeof mission.payload === 'string'
        ? JSON.parse(mission.payload)
        : (mission.payload || {});
      const event = {
        // Thread the original event fields through so downstream workers can
        // project (needs event_id), preserve namespace (privacy boundary) and
        // source, and unwrap the bridge's nested payload so workers read the
        // business payload directly (e.g. ObservationWorker's documentId).
        event_id: payload.event_id || mission.mission_id,
        event_type: payload.event_type || mission.mission_type,
        source: payload.source || 'mission-scheduler',
        // Namespace is set by the bridge from the spine event (always resolved);
        // the 'core::system' default is owned by UnifiedEventRuntime.emit() only.
        namespace: payload.namespace,
        mission_id: mission.mission_id,
        payload: payload.payload || payload,
        metadata: {
          mission_type: mission.mission_type,
          priority: mission.priority,
          assigned_to: workerName,
          canonical_hash: payload.canonical_hash || null,
        },
      };

      // Dispatch to worker
      await this._workerRuntime.dispatch(event);

      // Complete mission
      await this._missionRuntime.complete(mission.mission_id, {
        worker: workerName,
        completed_at: constitutionalTimeAuthority.nowAsISOString(),
      });

      this._stats.completed++;
    } catch (err) {
      console.error(`[MissionScheduler] Mission ${mission.mission_id} failed: ${err.message}`);
      try {
        await this._missionRuntime.fail(mission.mission_id, err.message);
      } catch (failErr) {
        console.error(`[MissionScheduler] Failed to mark mission as failed: ${failErr.message}`);
      }
      this._stats.failed++;
    } finally {
      this._processing.delete(mission.mission_id);
    }
  }

  /**
   * Infer worker name from mission type using naming convention.
   * DOCUMENT_IMPORT → document (no match → null)
   */
  _inferWorker(missionType) {
    // Try to match first word
    const prefix = missionType.split('_')[0].toLowerCase();
    const knownPrefixes = ['observation', 'claim', 'projection', 'replay', 'witness', 'lineage'];
    return knownPrefixes.includes(prefix) ? prefix : null;
  }

  /**
   * Get scheduler stats.
   */
  getStats() {
    return {
      ...this._stats,
      running: this._running,
      processing: this._processing.size,
      pollIntervalMs: this._pollIntervalMs,
      maxConcurrent: this._maxConcurrent,
    };
  }
}

module.exports = { MissionScheduler, MISSION_WORKER_MAP };
