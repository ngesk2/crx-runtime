/**
 * Worker Port
 * 
 * Tier 2 — Constitutional Port
 * 
 * Hides all worker operations behind a single port.
 * 
 * Constitutional Constraint: Single worker authority for all worker operations.
 * 
 * Worker Port owns:
 * - Worker execution
 * - Worker lifecycle
 * - Worker status
 * 
 * Note: Scaling belongs to runtime orchestration, not constitutional execution.
 * 
 * Implementations:
 * - CustomWorkerProvider (current)
 * - Future: Temporal workers, pg-boss workers, etc.
 */

class WorkerPort {
  constructor(provider) {
    this._provider = provider;
    this._portId = this._generatePortId();
  }

  /**
   * Execute task
   * @param {Object} task - Task to execute
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Task result
   */
  async execute(task, options = {}) {
    return this._provider.execute(task, options);
  }

  /**
   * Get worker status
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} Worker status
   */
  async status(workerId) {
    return this._provider.status(workerId);
  }

  /**
   * Start worker
   * @param {Object} options - Worker options
   * @returns {Promise<string>} Worker ID
   */
  async start(options = {}) {
    return this._provider.start(options);
  }

  /**
   * Stop worker
   * @param {string} workerId - Worker ID
   * @returns {Promise<void>}
   */
  async stop(workerId) {
    return this._provider.stop(workerId);
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
    return `worker.${providerName.toLowerCase()}`;
  }
}

/**
 * Worker Provider Interface
 * 
 * All worker providers must implement this interface.
 */
class WorkerProvider {
  async execute(task, options) {
    throw new Error('execute() must be implemented');
  }

  async status(workerId) {
    throw new Error('status() must be implemented');
  }

  async start(options) {
    throw new Error('start() must be implemented');
  }

  async stop(workerId) {
    throw new Error('stop() must be implemented');
  }
}

module.exports = {
  WorkerPort,
  WorkerProvider
};
