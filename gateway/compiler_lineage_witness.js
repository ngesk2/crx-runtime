const { CanonicalAuthority, CanonicalBytes } = require('../ping-runtime/authorities/canonical_authority.js');
const { witnessAuthority } = require('./witness_authority');

/**
 * Compiler Lineage Witness
 * 
 * Phase 2.14 — Elevate Compiler Lineage Authority
 * 
 * Witness for compiler lineage verification.
 * Required before accepting any compiler upgrade.
 */

class CompilerLineageWitness {
  constructor() {
    // Removed serializer reference - use CanonicalAuthority directly
    this._lineageWitnesses = new Map();
  }

  /**
   * Create compiler lineage witness
   * @param {Object} lineageData - Lineage verification data
   * @param {Object} lineageData.v1_to_v1 - Test result v1 → v1
   * @param {Object} lineageData.v2_to_v2 - Test result v2 → v2
   * @param {Object} lineageData.v1_to_v2 - Test result v1 → v2
   * @param {Object} lineageData.v2_to_v1 - Test result v2 → v1
   * @param {Object} lineageData.consistency - Consistency verification results
   * @returns {Object} Compiler lineage witness
   */
  createLineageWitness(lineageData) {
    const witnessData = {
      source_generator_id: lineageData.v1_to_v1.generator_id,
      target_generator_id: lineageData.v2_to_v2.generator_id,
      source_generator_version: lineageData.v1_to_v1.generator_version,
      target_generator_version: lineageData.v2_to_v2.generator_version,
      tests: {
        v1_to_v1: {
          success: lineageData.v1_to_v1.success,
          artifact_hash: lineageData.v1_to_v1.artifact1_hash
        },
        v2_to_v2: {
          success: lineageData.v2_to_v2.success,
          artifact_hash: lineageData.v2_to_v2.artifact1_hash
        },
        v1_to_v2: {
          success: lineageData.v1_to_v2.success,
          artifact_hash: lineageData.v1_to_v2.artifact_hash
        },
        v2_to_v1: {
          success: lineageData.v2_to_v1.success,
          artifact_hash: lineageData.v2_to_v1.artifact_hash
        }
      },
      consistency: {
        hashes: lineageData.consistency.hashes.success,
        witnesses: lineageData.consistency.witnesses.success,
        approval: lineageData.consistency.approval.success
      },
      overall_success: lineageData.overall_success
    };

    const witness = witnessAuthority.createWitness(witnessData, {
      authority: 'CompilerLineageWitness',
      authority_version: '1.0.0'
    });

    this._lineageWitnesses.set(witness.witness_id, witness);
    return witness;
  }

  /**
   * Verify compiler lineage witness
   * @param {Object} witness - Witness to verify
   * @returns {boolean} True if valid
   */
  verifyLineageWitness(witness) {
    if (!witness || !witness.witness_metadata) {
      return false;
    }

    const computedHash = CanonicalAuthority.hash(witness);
    return computedHash === witness.witness_metadata.hash;
  }

  /**
   * Get lineage witness by ID
   * @param {string} witnessId - Witness ID
   * @returns {Object} Lineage witness
   */
  getLineageWitness(witnessId) {
    return this._lineageWitnesses.get(witnessId);
  }

  /**
   * Clear all witnesses (for testing)
   */
  clear() {
    this._lineageWitnesses.clear();
  }

  /**
   * Get all lineage witnesses
   * @returns {Array} Array of lineage witnesses
   */
  getAllWitnesses() {
    return Array.from(this._lineageWitnesses.values());
  }
}

module.exports = { CompilerLineageWitness };
