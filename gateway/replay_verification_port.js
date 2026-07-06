/**
 * Replay Verification Port
 * 
 * Tier 2 — Constitutional Port
 * 
 * Hides replay verification behind a constitutional port.
 * 
 * Constitutional Constraint: Single replay verification authority for all replay verification operations.
 * 
 * Replay Verification Port owns:
 * - Replay integrity verification
 * - Replay determinism validation
 * - Replay verification guarantees
 * 
 * Note: ReplayAuthority orchestrates, this port verifies.
 * 
 * Implementations:
 * - CanonicalReplayVerificationProvider
 * - CustomReplayVerificationProvider
 */

class ReplayVerificationPort {
  constructor(provider) {
    this._provider = provider;
    this._portId = this._generatePortId();
  }

  /**
   * Verify transcript integrity
   * @param {string} transcriptId - Transcript ID
   * @param {Object} options - Verification options
   * @returns {Promise<Object>} Verification result
   */
  async verifyTranscript(transcriptId, options = {}) {
    return this._provider.verifyTranscript(transcriptId, options);
  }

  /**
   * Validate determinism
   * @param {string} transcriptId - Transcript ID
   * @param {Object} options - Validation options
   * @returns {Promise<Object>} Validation result
   */
  async validateDeterminism(transcriptId, options = {}) {
    return this._provider.validateDeterminism(transcriptId, options);
  }

  /**
   * Verify witness chain
   * @param {Object} transcript - Transcript to verify
   * @param {Object} options - Verification options
   * @returns {Promise<Object>} Verification result
   */
  async verifyWitnessChain(transcript, options = {}) {
    return this._provider.verifyWitnessChain(transcript, options);
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
    return `replay_verification.${providerName.toLowerCase()}`;
  }
}

/**
 * Replay Verification Provider Interface
 * 
 * All replay verification providers must implement this interface.
 */
class ReplayVerificationProvider {
  async verifyTranscript(transcriptId, options) {
    throw new Error('verifyTranscript() must be implemented');
  }

  async validateDeterminism(transcriptId, options) {
    throw new Error('validateDeterminism() must be implemented');
  }

  async verifyWitnessChain(transcript, options) {
    throw new Error('verifyWitnessChain() must be implemented');
  }
}

module.exports = {
  ReplayVerificationPort,
  ReplayVerificationProvider
};
