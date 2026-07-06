/**
 * Scheduler Port
 *
 * Phase 2.5 — Authority Purity Fix
 *
 * Hides all scheduling operations behind a single port.
 *
 * Constitutional Constraint: Single scheduler authority for all scheduling operations.
 *
 * Scheduler Port exposes only constitutional scheduling:
 * - schedule()
 * - cancel()
 * - status()
 *
 * Removed provider-specific semantics:
 * - heartbeat() (Temporal concept)
 * - resume() (Temporal concept)
 *
 * Note: No queue semantics, no provider-specific semantics. Just constitutional scheduling.
 *
 * Implementations:
 * - TemporalSchedulerProvider
 * - Future: pg-boss, etc.
 */

class SchedulerPort {
  constructor(provider) {
    this._provider = provider;
    this._portId = this._generatePortId();
  }

  /**
   * Schedule job
   * @param {Object} job - Job to schedule
   * @param {Object} options - Scheduling options
   * @returns {Promise<string>} Job ID
   */
  async schedule(job, options = {}) {
    return this._provider.schedule(job, options);
  }

  /**
   * Cancel job
   * @param {string} jobId - Job ID
   * @returns {Promise<void>}
   */
  async cancel(jobId) {
    return this._provider.cancel(jobId);
  }

  /**
   * Get job status (constitutional status, not provider-specific)
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Job status
   */
  async status(jobId) {
    return this._provider.status(jobId);
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
    return `scheduler.port`;
  }
}

/**
 * Scheduler Provider Interface
 *
 * All scheduler providers must implement this interface.
 */
class SchedulerProvider {
  async schedule(job, options) {
    throw new Error('schedule() must be implemented');
  }

  async cancel(jobId) {
    throw new Error('cancel() must be implemented');
  }

  async status(jobId) {
    throw new Error('status() must be implemented');
  }
}

module.exports = {
  SchedulerPort,
  SchedulerProvider
};
