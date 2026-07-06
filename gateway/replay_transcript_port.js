/**
 * Replay Transcript Port
 * 
 * Tier 2 — Constitutional Port
 * 
 * Hides transcript management behind a constitutional port.
 * 
 * Constitutional Constraint: Single transcript authority for all transcript operations.
 * 
 * Replay Transcript Port owns:
 * - Transcript creation
 * - Transcript retrieval
 * - Transcript lifecycle
 * 
 * Note: ReplayAuthority orchestrates, this port manages transcripts.
 * 
 * Implementations:
 * - PostgreSQLTranscriptProvider
 * - EventStoreDBTranscriptProvider
 */

class ReplayTranscriptPort {
  constructor(provider) {
    this._provider = provider;
    this._portId = this._generatePortId();
  }

  /**
   * Create transcript
   * @param {Object} transcriptData - Transcript data
   * @param {Object} options - Creation options
   * @returns {Promise<Object>} Created transcript
   */
  async createTranscript(transcriptData, options = {}) {
    return this._provider.createTranscript(transcriptData, options);
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
   * Update transcript
   * @param {string} transcriptId - Transcript ID
   * @param {Object} updates - Transcript updates
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated transcript
   */
  async updateTranscript(transcriptId, updates, options = {}) {
    return this._provider.updateTranscript(transcriptId, updates, options);
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
    return `replay_transcript.${providerName.toLowerCase()}`;
  }
}

/**
 * Replay Transcript Provider Interface
 * 
 * All transcript providers must implement this interface.
 */
class ReplayTranscriptProvider {
  async createTranscript(transcriptData, options) {
    throw new Error('createTranscript() must be implemented');
  }

  async loadTranscript(transcriptId, options) {
    throw new Error('loadTranscript() must be implemented');
  }

  async updateTranscript(transcriptId, updates, options) {
    throw new Error('updateTranscript() must be implemented');
  }

  async findTranscripts(criteria, options) {
    throw new Error('findTranscripts() must be implemented');
  }
}

module.exports = {
  ReplayTranscriptPort,
  ReplayTranscriptProvider
};
