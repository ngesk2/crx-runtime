/**
 * Replay Execution Port
 * 
 * Tier 2 — Constitutional Port
 * 
 * Hides replay execution behind a constitutional port.
 * 
 * Constitutional Constraint: Single replay execution authority for all replay execution operations.
 * 
 * Replay Execution Port owns:
 * - Replay execution
 * - Replay orchestration
 * - Replay execution guarantees
 * 
 * Note: ReplayAuthority orchestrates, this port executes.
 * 
 * Implementations:
 * - TemporalReplayExecutionProvider
 * - CustomReplayExecutionProvider
 */

class ReplayExecutionPort {
  constructor(provider) {
    this._provider = provider;
    this._portId = this._generatePortId();
  }

  /**
   * Execute replay
   * @param {Object} transcript - Transcript to replay
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Replay result
   */
  async executeReplay(transcript, options = {}) {
    return this._provider.executeReplay(transcript, options);
  }

  /**
   * Get execution status
   * @param {string} executionId - Execution ID
   * @returns {Promise<Object>} Execution status
   */
  async getExecutionStatus(executionId) {
    return this._provider.getExecutionStatus(executionId);
  }

  /**
   * Cancel execution
   * @param {string} executionId - Execution ID
   * @returns {Promise<void>}
   */
  async cancelExecution(executionId) {
    return this._provider.cancelExecution(executionId);
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
    return `replay_execution.${providerName.toLowerCase()}`;
  }
}

/**
 * Replay Execution Provider Interface
 * 
 * All replay execution providers must implement this interface.
 */
class ReplayExecutionProvider {
  async executeReplay(transcript, options) {
    throw new Error('executeReplay() must be implemented');
  }

  async getExecutionStatus(executionId) {
    throw new Error('getExecutionStatus() must be implemented');
  }

  async cancelExecution(executionId) {
    throw new Error('cancelExecution() must be implemented');
  }
}

module.exports = {
  ReplayExecutionPort,
  ReplayExecutionProvider
};
