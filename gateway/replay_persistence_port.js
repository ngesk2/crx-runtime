/**
 * Replay Persistence Port
 * 
 * Tier 2 — Constitutional Port
 * 
 * Hides replay persistence behind a constitutional port.
 * 
 * Constitutional Constraint: Single replay persistence authority for all replay persistence operations.
 * 
 * Replay Persistence Port owns:
 * - Replay log storage
 * - Transcript storage
 * - Replay persistence guarantees
 * 
 * Note: This is a specialized port for replay persistence, separate from generic persistence.
 * 
 * Implementations:
 * - PostgreSQLReplayPersistenceProvider
 * - EventStoreDBReplayPersistenceProvider
 */

class ReplayPersistencePort {
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
  async appendEvent(event, options = {}) {
    return this._provider.appendEvent(event, options);
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
   * Save transcript
   * @param {Object} transcript - Transcript to save
   * @param {Object} options - Save options
   * @returns {Promise<Object>} Saved transcript
   */
  async saveTranscript(transcript, options = {}) {
    return this._provider.saveTranscript(transcript, options);
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
    return `replay_persistence.${providerName.toLowerCase()}`;
  }
}

/**
 * Replay Persistence Provider Interface
 * 
 * All replay persistence providers must implement this interface.
 */
class ReplayPersistenceProvider {
  async appendEvent(event, options) {
    throw new Error('appendEvent() must be implemented');
  }

  async loadTranscript(transcriptId, options) {
    throw new Error('loadTranscript() must be implemented');
  }

  async saveTranscript(transcript, options) {
    throw new Error('saveTranscript() must be implemented');
  }
}

module.exports = {
  ReplayPersistencePort,
  ReplayPersistenceProvider
};
