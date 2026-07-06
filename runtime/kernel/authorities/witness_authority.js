const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');

/**
 * Witness Authority
 * 
 * Architectural Fix — Single Witness Authority
 * Phase 11.11 — Centralized Witness Generation from Constitutional Results
 * 
 * Single witness authority used by:
 * - StreamingAuthority
 * - PromptAuthority
 * - ModelAuthority
 * - RuntimeAuthority
 * - ToolGateway
 * - InferenceWitness
 * - ExecutionAuthority (Phase 11.6)
 * 
 * Phase 11.11 Enhancement:
 * - Authorities return constitutional results (inputs, outputs, canonical hashes, execution id, metadata)
 * - WitnessAuthority centralizes witness generation from constitutional results
 * - Uniform witness generation across all authorities
 * - Replayable and versionable witness generation
 * 
 * Constitutional rule:
 * Witness hashes must be computed WITHOUT the witness hash field,
 * then the hash is attached afterwards.
 * This prevents recursive serialization and undefined authority.
 */

class WitnessAuthority {
  constructor() {
    this._authorityId = this._generateAuthorityId();
    this._constitutionalVersion = '11.0.0';
  }

  /**
   * Create witness
   * @param {Object} witnessData - Witness data (without hash field)
   * @param {Object} options - Witness options
   * @param {string} options.authority - Authority that created the witness
   * @param {string} options.authority_version - Authority version
   * @returns {Object} Witness with hash
   */
  createWitness(witnessData, options = {}) {
    // Create witness without hash field
    const witness = {
      ...witnessData,
      authority: options.authority || 'unknown',
      authority_version: options.authority_version || '11.0.0',
      witness_metadata: {
        created_by: options.authority || 'WitnessAuthority',
        frozen: true,
        hash: null,
        constitutional_version: this._constitutionalVersion
      }
    };

    // Compute hash WITHOUT the hash field
    const witnessForHash = { ...witness };
    delete witnessForHash.witness_metadata.hash;
    
    // Attach hash afterwards
    witness.witness_metadata.hash = CanonicalAuthority.hash(witnessForHash);
    
    // Generate witness ID
    witness.witness_id = this._generateWitnessId(witness);
    
    return witness;
  }

  /**
   * Create witness from constitutional result
   * @param {Object} constitutionalResult - Constitutional result from authority
   * @returns {Object} Witness
   */
  createWitnessFromConstitutionalResult(constitutionalResult) {
    const witnessData = {
      execution_id: constitutionalResult.execution_id,
      input_hash: constitutionalResult.input_hash,
      output_hash: constitutionalResult.output_hash,
      authority: constitutionalResult.metadata.authority,
      node_id: constitutionalResult.metadata.node_id,
      success: constitutionalResult.metadata.success,
      constitutional_version: constitutionalResult.metadata.constitutional_version
    };

    return this.createWitness(witnessData, {
      authority: constitutionalResult.metadata.authority,
      authority_version: constitutionalResult.metadata.constitutional_version
    });
  }

  /**
   * Generate witness ID
   * @param {Object} witness - Witness
   * @returns {string} Witness ID
   */
  _generateWitnessId(witness) {
    const witnessData = {
      authority: witness.authority,
      execution_id: witness.execution_id,
      input_hash: witness.input_hash,
      output_hash: witness.output_hash
    };
    const hash = CanonicalAuthority.hash(witnessData);
    return `witness_${hash.substring(0, 16)}`;
  }

  /**
   * Verify witness
   * @param {Object} witness - Witness to verify
   * @returns {Object} Verification result
   */
  verifyWitness(witness) {
    if (!witness || !witness.witness_metadata) {
      return {
        valid: false,
        reason: 'Invalid witness structure'
      };
    }

    // Compute hash WITHOUT the hash field
    const witnessForHash = { ...witness };
    delete witnessForHash.witness_metadata.hash;
    
    const computedHash = CanonicalAuthority.hash(witnessForHash);
    
    if (computedHash !== witness.witness_metadata.hash) {
      return {
        valid: false,
        reason: 'Witness hash mismatch',
        expected: witness.witness_metadata.hash,
        actual: computedHash
      };
    }

    return {
      valid: true,
      reason: 'Witness verified'
    };
  }

  /**
   * Verify witness equivalence
   * @param {Object} witness1 - First witness
   * @param {Object} witness2 - Second witness
   * @returns {Object} Verification result
   */
  verifyWitnessEquivalence(witness1, witness2) {
    // Compare hashes
    if (witness1.witness_metadata.hash !== witness2.witness_metadata.hash) {
      return {
        valid: false,
        reason: 'Witness hash mismatch',
        witness1: witness1.witness_metadata.hash,
        witness2: witness2.witness_metadata.hash
      };
    }

    return {
      valid: true,
      reason: 'Witnesses are equivalent'
    };
  }

  /**
   * Get authority ID
   * @returns {string} Authority ID
   */
  getAuthorityId() {
    return this._authorityId;
  }

  /**
   * Generate authority ID
   * @returns {string} Authority ID
   */
  _generateAuthorityId() {
    const authorityData = {
      authority_version: '11.0.0',
      constitutional_version: '11.0.0'
    };
    const hash = CanonicalAuthority.hash(authorityData);
    return `witness_${hash.substring(0, 16)}`;
  }
}

// Singleton instance
const witnessAuthority = new WitnessAuthority();

module.exports = { WitnessAuthority, witnessAuthority };
