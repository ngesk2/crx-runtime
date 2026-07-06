/**
 * Execution Repository Port
 * 
 * Tier 2 — Constitutional Port (Domain Semantics)
 * 
 * Hides execution persistence behind a domain-specific port.
 * 
 * Constitutional Constraint: Single execution repository authority for all execution operations.
 * 
 * Execution Repository Port owns:
 * - Execution storage
 * - Execution retrieval
 * - Execution lifecycle
 * 
 * Note: This replaces generic CRUD with constitutional execution semantics.
 * 
 * Implementations:
 * - PostgreSQLExecutionRepositoryProvider (current)
 * - Future: EventStoreDB, MongoDB, etc.
 */

class ExecutionRepositoryPort {
  constructor(provider) {
    this._provider = provider;
    this._portId = this._generatePortId();
  }

  /**
   * Record execution
   * @param {Object} execution - Execution to record
   * @param {Object} options - Record options
   * @returns {Promise<Object>} Recorded execution
   */
  async recordExecution(execution, options = {}) {
    return this._provider.recordExecution(execution, options);
  }

  /**
   * Load execution
   * @param {string} executionId - Execution ID
   * @param {Object} options - Load options
   * @returns {Promise<Object>} Loaded execution
   */
  async loadExecution(executionId, options = {}) {
    return this._provider.loadExecution(executionId, options);
  }

  /**
   * Find executions by criteria
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Executions
   */
  async findExecutions(criteria, options = {}) {
    return this._provider.findExecutions(criteria, options);
  }

  /**
   * Update execution status
   * @param {string} executionId - Execution ID
   * @param {string} status - New status
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated execution
   */
  async updateExecutionStatus(executionId, status, options = {}) {
    return this._provider.updateExecutionStatus(executionId, status, options);
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
    return `execution_repository.${providerName.toLowerCase()}`;
  }
}

/**
 * Execution Repository Provider Interface
 * 
 * All execution repository providers must implement this interface.
 */
class ExecutionRepositoryProvider {
  async recordExecution(execution, options) {
    throw new Error('recordExecution() must be implemented');
  }

  async loadExecution(executionId, options) {
    throw new Error('loadExecution() must be implemented');
  }

  async findExecutions(criteria, options) {
    throw new Error('findExecutions() must be implemented');
  }

  async updateExecutionStatus(executionId, status, options) {
    throw new Error('updateExecutionStatus() must be implemented');
  }
}

module.exports = {
  ExecutionRepositoryPort,
  ExecutionRepositoryProvider
};
