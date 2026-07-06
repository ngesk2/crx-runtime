/**
 * Replay Repository Port
 * 
 * Tier 2 — Constitutional Port (Domain Semantics)
 * 
 * Hides replay persistence behind a domain-specific port.
 * 
 * Constitutional Constraint: Single replay repository authority for all replay operations.
 * 
 * Replay Repository Port owns:
 * - Replay log storage
 * - Transcript storage
 * - Replay retrieval
 * 
 * Note: This replaces generic CRUD with constitutional replay semantics.
 * 
 * Implementations:
 * - PostgreSQLReplayRepositoryProvider (current)
 * - Future: EventStoreDB, etc.
 */

class ReplayRepositoryPort {
  constructor(provider) {
    this._provider = provider;
    this._portId = this._generatePortId();
  }

  /**
   * Append replay event
   * @param {Object} event - Replay event to append
   * @param {Object} options - Append options
   * @returns {Promise<Object>} Appended event
   */
  async appendReplay(event, options = {}) {
    return this._provider.appendReplay(event, options);
  }

  /**
   * Load transcript
   * @param {string} transcriptId - Transcript ID
   * @param {Object} options - Load options
   * @returns {Promise<Object>} Loaded transcript
   */
  async loadTranscript(transcriptId, options = {}) {
    return this._provider.loadTranscript(transcriptId, options);
  }

  /**
   * Load replay log
   * @param {string} logId - Log ID
   * @param {Object} options - Load options
   * @returns {Promise<Object>} Loaded replay log
   */
  async loadReplayLog(logId, options = {}) {
    return this._provider.loadReplayLog(logId, options);
  }

  /**
   * Find transcripts by criteria
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Transcripts
   */
  async findTranscripts(criteria, options = {}) {
    return this._provider.findTranscripts(criteria, options);
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
    return `replay_repository.${providerName.toLowerCase()}`;
  }
}

/**
 * Replay Repository Provider Interface
 * 
 * All replay repository providers must implement this interface.
 */
class ReplayRepositoryProvider {
  async appendReplay(event, options) {
    throw new Error('appendReplay() must be implemented');
  }

  async loadTranscript(transcriptId, options) {
    throw new Error('loadTranscript() must be implemented');
  }

  async loadReplayLog(logId, options) {
    throw new Error('loadReplayLog() must be implemented');
  }

  async findTranscripts(criteria, options) {
    throw new Error('findTranscripts() must be implemented');
  }
}

module.exports = {
  ReplayRepositoryPort,
  ReplayRepositoryProvider
};
