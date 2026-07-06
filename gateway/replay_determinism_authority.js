const { CanonicalAuthority } = require('./canonical_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');

/**
 * Replay Determinism Authority
 * 
 * Phase 2.3 — Separate Determinism vs Reproducibility
 * 
 * Constitutional Law: Replay Determinism
 * 
 * same IR
 *   ↓
 * same adapter source
 *   ↓
 * same witness
 *   ↓
 * same hashes
 * 
 * This authority verifies that the adapter generation process
 * is deterministic given the same IR.
 */

class ReplayDeterminismAuthority {
  constructor() {
    this._replayRecords = new Map();
  }

  /**
   * Verify replay determinism
   * @param {Object} ir - Adapter IR
   * @param {Object} adapterSource - Generated adapter source
   * @param {Object} witness - Generated witness
   * @returns {Object} Replay determinism verification result
   */
  async verifyReplayDeterminism(ir, adapterSource, witness) {
    const irHash = CanonicalAuthority.hash(ir);
    const adapterSourceHash = CanonicalAuthority.hash(adapterSource);
    const witnessHash = CanonicalAuthority.hash(witness);

    // Check if we have a previous record for this IR
    const previousRecord = this._replayRecords.get(irHash);

    if (!previousRecord) {
      // First time seeing this IR - record it
      this._replayRecords.set(irHash, {
        ir_hash: irHash,
        adapter_source_hash: adapterSourceHash,
        witness_hash: witnessHash,
        timestamp: constitutionalTimeAuthority.now()
      });

      return {
        is_deterministic: true,
        is_first_run: true,
        ir_hash: irHash,
        adapter_source_hash: adapterSourceHash,
        witness_hash: witnessHash,
        message: 'First run - recorded baseline'
      };
    }

    // Verify determinism against previous record
    const isDeterministic = 
      previousRecord.adapter_source_hash === adapterSourceHash &&
      previousRecord.witness_hash === witnessHash;

    return {
      is_deterministic: isDeterministic,
      is_first_run: false,
      ir_hash: irHash,
      adapter_source_hash: adapterSourceHash,
      witness_hash: witnessHash,
      previous_adapter_source_hash: previousRecord.adapter_source_hash,
      previous_witness_hash: previousRecord.witness_hash,
      message: isDeterministic 
        ? 'Replay determinism verified' 
        : 'Replay determinism violated'
    };
  }

  /**
   * Get replay record for IR
   * @param {string} irHash - IR hash
   * @returns {Object} Replay record
   */
  getReplayRecord(irHash) {
    return this._replayRecords.get(irHash);
  }

  /**
   * Clear all replay records (for testing)
   */
  clear() {
    this._replayRecords.clear();
  }

  /**
   * Get all replay records
   * @returns {Array} Array of replay records
   */
  getAllRecords() {
    return Array.from(this._replayRecords.values());
  }
}

module.exports = { ReplayDeterminismAuthority };
