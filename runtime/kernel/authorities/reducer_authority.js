/**
 * Reducer Authority
 * 
 * Phase 36 Constitutional Refinement
 * 
 * Cryptographically binds reducer code to replay state.
 * 
 * Constitutional Constraint:
 * Different reducer code must NOT produce same event stream with different state.
 * 
 * Architecture:
 * ReducerAuthority
 *   ↓
 * ReducerHash (code fingerprint)
 *   ↓
 * ReducerWitness (execution proof)
 *   ↓
 * ReplayCertificate (state convergence proof)
 * 
 * Prevents constitutional drift where reducer mutations
 * silently change replay semantics.
 * 
 * PATCH_010: Moved to runtime/kernel/authorities/
 * Reducer registration is replay state, so it belongs in kernel.
 */

const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
const { witnessAuthority } = require('./witness_authority');
const { runtimeIdentityAuthority } = require('./runtime_identity_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');

class ReducerAuthority {
  constructor() {
    this._reducers = new Map(); // reducer_id -> reducer metadata
    this._authorityVersion = '1.0.0';
  }

  /**
   * Register reducer with cryptographic binding
   * @param {string} reducerId - Reducer identifier
   * @param {Function} reducerFn - Reducer function
   * @param {Object} metadata - Reducer metadata
   * @returns {Object} Reducer registration with hash
   */
  registerReducer(reducerId, reducerFn, metadata = {}) {
    const reducerCode = this._extractReducerCode(reducerFn);
    const reducerHash = this._computeReducerHash(reducerId, reducerCode);
    const canonicalVersion = metadata.canonicalVersion || '1.0.0';
    
    const reducerMetadata = {
      reducer_id: reducerId,
      reducer_hash: reducerHash,
      reducer_code: reducerCode,
      canonical_version: canonicalVersion,
      authority_version: this._authorityVersion,
      runtime_id: runtimeIdentityAuthority.getRuntimeId(),
      metadata: metadata,
      registered_at: constitutionalTimeAuthority.now(),
      frozen: true
    };
    
    // Create reducer witness
    const reducerWitness = witnessAuthority.createWitness(reducerMetadata, {
      authority: 'ReducerAuthority',
      authority_version: this._authorityVersion,
      reducer_id: reducerId
    });
    
    reducerMetadata.witness = reducerWitness;
    reducerMetadata.witness_hash = reducerWitness.witness_metadata?.hash || CanonicalAuthority.hash(reducerWitness);
    
    this._reducers.set(reducerId, reducerMetadata);
    
    return reducerMetadata;
  }

  /**
   * Get reducer by ID
   * @param {string} reducerId - Reducer identifier
   * @returns {Object|null} Reducer metadata
   */
  getReducer(reducerId) {
    return this._reducers.get(reducerId) || null;
  }

  /**
   * Verify reducer integrity
   * @param {string} reducerId - Reducer identifier
   * @returns {Object} Verification result
   */
  verifyReducer(reducerId) {
    const reducer = this._reducers.get(reducerId);
    if (!reducer) {
      return {
        valid: false,
        reason: 'Reducer not found'
      };
    }
    
    // Verify hash matches code
    const computedHash = this._computeReducerHash(reducer.reducer_id, reducer.reducer_code);
    if (computedHash !== reducer.reducer_hash) {
      return {
        valid: false,
        reason: 'Reducer hash mismatch - code has been modified'
      };
    }
    
    // Verify witness
    const witnessVerification = witnessAuthority.verifyWitness(reducer.witness);
    if (!witnessVerification.valid) {
      return witnessVerification;
    }
    
    return {
      valid: true,
      reason: 'Reducer verified'
    };
  }

  /**
   * Compute reducer hash from code
   * @param {string} reducerId - Reducer identifier
   * @param {string} reducerCode - Reducer source code
   * @returns {string} Reducer hash
   */
  _computeReducerHash(reducerId, reducerCode) {
    const canonicalData = {
      reducer_id: reducerId,
      reducer_code: reducerCode,
      authority_version: this._authorityVersion
    };
    return CanonicalAuthority.hash(canonicalData);
  }

  /**
   * Extract reducer source code
   * @param {Function} reducerFn - Reducer function
   * @returns {string} Source code
   */
  _extractReducerCode(reducerFn) {
    return reducerFn.toString();
  }

  /**
   * Get all registered reducers
   * @returns {Array} Array of reducer metadata
   */
  getAllReducers() {
    return Array.from(this._reducers.values());
  }

  /**
   * Get reducer count
   * @returns {number} Number of registered reducers
   */
  getReducerCount() {
    return this._reducers.size;
  }

  /**
   * Clear all reducers (for testing only)
   */
  _clear() {
    this._reducers.clear();
  }
}

// Singleton instance
const reducerAuthority = new ReducerAuthority();

module.exports = {
  ReducerAuthority,
  reducerAuthority
};
