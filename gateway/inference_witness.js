const { CanonicalAuthority, CanonicalBytes } = require('../ping-runtime/authorities/canonical_authority.js');
const { runtimeFailureAuthority } = require('./runtime_failure_authority');
const { witnessAuthority } = require('./witness_authority');

/**
 * Inference Witness
 * 
 * Phase 4.4 — Inference Witness
 * 
 * Record:
 * - prompt hash
 * - model digest
 * - temperature
 * - top_p
 * - seed
 * - token count
 * - completion hash
 * - runtime witness
 * - replay id
 * 
 * Everything replayable.
 */

class InferenceWitness {
  constructor() {
    // Removed serializer reference - use CanonicalAuthority directly
    this._failureAuthority = runtimeFailureAuthority;
    this._witnessHistory = new Map();
    this._witnessId = this._generateWitnessId();
  }

  /**
   * Create inference witness
   * @param {Object} witnessData - Witness data
   * @param {string} witnessData.prompt_hash - Prompt hash
   * @param {string} witnessData.model_digest - Model digest
   * @param {Object} witnessData.options - Generation options
   * @param {number} witnessData.token_count - Token count
   * @param {string} witnessData.completion_hash - Completion hash
   * @param {string} witnessData.runtime_witness - Runtime witness
   * @param {string} witnessData.replay_id - Replay ID
   * @returns {Object} Inference witness
   */
  createInferenceWitness(witnessData) {
    // Generate inference ID from constitutional data
    const inferenceId = this._generateInferenceId(witnessData);
    
    // Use explicit options (no defaults - parameter absent ≠ parameter = default)
    const options = witnessData.options || {};
    
    const witnessDataForAuthority = {
      inference_id: inferenceId,
      prompt_hash: witnessData.prompt_hash,
      model_digest: witnessData.model_digest,
      options: {
        temperature: options.temperature,
        top_p: options.top_p,
        seed: options.seed,
        num_predict: options.num_predict,
        top_k: options.top_k,
        repeat_penalty: options.repeat_penalty
      },
      token_count: witnessData.token_count,
      completion_hash: witnessData.completion_hash,
      runtime_witness: witnessData.runtime_witness,
      replay_id: witnessData.replay_id
    };

    const witness = witnessAuthority.createWitness(witnessDataForAuthority, {
      authority: 'InferenceWitness',
      authority_version: '4.0.0'
    });
    
    this._witnessHistory.set(inferenceId, witness);
    
    return witness;
  }

  /**
   * Verify inference witness
   * @param {Object} witness - Witness to verify
   * @returns {Object} Verification result
   */
  verifyInferenceWitness(witness) {
    // Use WitnessAuthority to verify (hashes copy with hash removed)
    return witnessAuthority.verifyWitness(witness);
  }

  /**
   * Verify replay equivalence
   * @param {Object} witness1 - First witness
   * @param {Object} witness2 - Second witness
   * @returns {Object} Verification result
   */
  verifyReplayEquivalence(witness1, witness2) {
    // Check prompt hash
    if (witness1.prompt_hash !== witness2.prompt_hash) {
      return {
        valid: false,
        reason: 'Prompt hash mismatch',
        witness1: witness1.prompt_hash,
        witness2: witness2.prompt_hash
      };
    }

    // Check model digest
    if (witness1.model_digest !== witness2.model_digest) {
      return {
        valid: false,
        reason: 'Model digest mismatch',
        witness1: witness1.model_digest,
        witness2: witness2.model_digest
      };
    }

    // Check options
    if (witness1.options.temperature !== witness2.options.temperature) {
      return {
        valid: false,
        reason: 'Temperature mismatch',
        witness1: witness1.options.temperature,
        witness2: witness2.options.temperature
      };
    }

    if (witness1.options.top_p !== witness2.options.top_p) {
      return {
        valid: false,
        reason: 'Top_p mismatch',
        witness1: witness1.options.top_p,
        witness2: witness2.options.top_p
      };
    }

    if (witness1.options.seed !== witness2.options.seed) {
      return {
        valid: false,
        reason: 'Seed mismatch',
        witness1: witness1.options.seed,
        witness2: witness2.options.seed
      };
    }

    // Check completion hash
    if (witness1.completion_hash !== witness2.completion_hash) {
      return {
        valid: false,
        reason: 'Completion hash mismatch',
        witness1: witness1.completion_hash,
        witness2: witness2.completion_hash
      };
    }

    // Use WitnessAuthority to verify witness equivalence
    return witnessAuthority.verifyWitnessEquivalence(witness1, witness2);
  }

  /**
   * Get witness by inference ID
   * @param {string} inferenceId - Inference ID
   * @returns {Object} Witness
   */
  getWitness(inferenceId) {
    return this._witnessHistory.get(inferenceId);
  }

  /**
   * Get witness by replay ID
   * @param {string} replayId - Replay ID
   * @returns {Object} Witness
   */
  getWitnessByReplayId(replayId) {
    for (const witness of this._witnessHistory.values()) {
      if (witness.replay_id === replayId) {
        return witness;
      }
    }
    return null;
  }

  /**
   * Get witness ID
   * @returns {string} Witness ID
   */
  getWitnessId() {
    return this._witnessId;
  }

  /**
   * Clear all witnesses (for testing)
   */
  clear() {
    this._witnessHistory.clear();
  }

  /**
   * Get all witnesses
   * @returns {Array} Array of witnesses
   */
  getAllWitnesses() {
    return Array.from(this._witnessHistory.values());
  }

  /**
   * Generate inference ID from constitutional data
   * @param {Object} witnessData - Witness data
   * @returns {string} Inference ID
   */
  _generateInferenceId(witnessData) {
    const inferenceData = {
      prompt_hash: witnessData.prompt_hash,
      model_digest: witnessData.model_digest,
      options: witnessData.options,
      replay_id: witnessData.replay_id
    };
    const hash = CanonicalAuthority.hash(inferenceData);
    return `inference_${hash.substring(0, 16)}`;
  }

  /**
   * Generate witness ID
   * @returns {string} Witness ID
   */
  _generateWitnessId() {
    const witnessData = {
      witness_version: '4.0.0',
      constitutional_version: '4.0.0'
    };
    const hash = CanonicalAuthority.hash(witnessData);
    return `inference_witness_${hash.substring(0, 16)}`;
  }
}

// Singleton instance
const inferenceWitness = new InferenceWitness();

module.exports = { InferenceWitness, inferenceWitness };
