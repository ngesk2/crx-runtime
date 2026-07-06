/**
 * Deterministic Failure Envelope
 * 
 * Ω.87.B — Constitutional Replay Remediation
 * 
 * Removes runtime leakage from errors.
 * 
 * Requirements:
 * - Failure code
 * - Phase
 * - Canonical metadata
 * - No runtime wording
 * - No stack traces
 */

const { CanonicalAuthority } = require('./canonical_authority');

class DeterministicFailureEnvelope {
  constructor(failureCode, phase, metadata = {}) {
    this.failure_code = failureCode;
    this.phase = phase;
    this.canonical_metadata = metadata;
    this.failure_id = this._generateFailureId();
  }

  /**
   * Generate deterministic failure ID
   * 
   * @returns {string} Failure ID
   */
  _generateFailureId() {
    const data = {
      failure_code: this.failure_code,
      phase: this.phase,
      metadata: this.canonical_metadata,
    };
    const hash = CanonicalAuthority.hash(data);
    return `failure-${hash.substring(0, 32)}`;
  }

  /**
   * Wrap error in deterministic envelope
   * 
   * @param {Error} error - Error
   * @param {string} failureCode - Failure code
   * @param {string} phase - Phase
   * @param {Object} metadata - Metadata
   * @returns {DeterministicFailureEnvelope} Envelope
   */
  static wrap(error, failureCode, phase, metadata = {}) {
    return new DeterministicFailureEnvelope(failureCode, phase, {
      ...metadata,
      error_name: error.name,
    });
  }

  /**
   * Convert to JSON
   * 
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      failure_id: this.failure_id,
      failure_code: this.failure_code,
      phase: this.phase,
      canonical_metadata: this.canonical_metadata,
    };
  }

  /**
   * Get failure code
   * 
   * @returns {string} Failure code
   */
  getFailureCode() {
    return this.failure_code;
  }

  /**
   * Get phase
   * 
   * @returns {string} Phase
   */
  getPhase() {
    return this.phase;
  }

  /**
   * Get metadata
   * 
   * @returns {Object} Metadata
   */
  getMetadata() {
    return this.canonical_metadata;
  }

  /**
   * Get failure ID
   * 
   * @returns {string} Failure ID
   */
  getFailureId() {
    return this.failure_id;
  }
}

// Standard failure codes
const FailureCodes = {
  UNKNOWN: 'UNKNOWN',
  AUTHORITY_ERROR: 'AUTHORITY_ERROR',
  COMPILATION_ERROR: 'COMPILATION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REPLAY_ERROR: 'REPLAY_ERROR',
  WITNESS_ERROR: 'WITNESS_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PARSING_ERROR: 'PARSING_ERROR',
  HASH_ERROR: 'HASH_ERROR',
};

module.exports = {
  DeterministicFailureEnvelope,
  FailureCodes,
};
