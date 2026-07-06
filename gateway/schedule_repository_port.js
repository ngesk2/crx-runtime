/**
 * Schedule Repository Port
 * 
 * Tier 2 — Constitutional Port (Domain Semantics)
 * 
 * Hides schedule persistence behind a domain-specific port.
 * 
 * Constitutional Constraint: Single schedule repository authority for all schedule operations.
 * 
 * Schedule Repository Port owns:
 * - Schedule storage
 * - Schedule retrieval
 * - Schedule lifecycle
 * 
 * Note: This replaces generic CRUD with constitutional schedule semantics.
 * 
 * Implementations:
 * - PostgreSQLScheduleRepositoryProvider (current)
 * - Future: pg-boss, BullMQ, etc.
 */

class ScheduleRepositoryPort {
  constructor(provider) {
    this._provider = provider;
    this._portId = this._generatePortId();
  }

  /**
   * Schedule job
   * @param {Object} job - Job to schedule
   * @param {Object} options - Schedule options
   * @returns {Promise<Object>} Scheduled job
   */
  async scheduleJob(job, options = {}) {
    return this._provider.scheduleJob(job, options);
  }

  /**
   * Load job
   * @param {string} jobId - Job ID
   * @param {Object} options - Load options
   * @returns {Promise<Object>} Loaded job
   */
  async loadJob(jobId, options = {}) {
    return this._provider.loadJob(jobId, options);
  }

  /**
   * Find jobs by criteria
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Jobs
   */
  async findJobs(criteria, options = {}) {
    return this._provider.findJobs(criteria, options);
  }

  /**
   * Update job status
   * @param {string} jobId - Job ID
   * @param {string} status - New status
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated job
   */
  async updateJobStatus(jobId, status, options = {}) {
    return this._provider.updateJobStatus(jobId, status, options);
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
    const providerName = this._provider.constructor.name;
    return `schedule_repository.${providerName.toLowerCase()}`;
  }
}

/**
 * Schedule Repository Provider Interface
 * 
 * All schedule repository providers must implement this interface.
 */
class ScheduleRepositoryProvider {
  async scheduleJob(job, options) {
    throw new Error('scheduleJob() must be implemented');
  }

  async loadJob(jobId, options) {
    throw new Error('loadJob() must be implemented');
  }

  async findJobs(criteria, options) {
    throw new Error('findJobs() must be implemented');
  }

  async updateJobStatus(jobId, status, options) {
    throw new Error('updateJobStatus() must be implemented');
  }
}

module.exports = {
  ScheduleRepositoryPort,
  ScheduleRepositoryProvider
};
