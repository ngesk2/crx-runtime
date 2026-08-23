const { CanonicalAuthority, CanonicalBytes } = require('../ping-runtime/authorities/canonical_authority.js');
const { runtimeFailureAuthority } = require('./runtime_failure_authority');
const { witnessAuthority } = require('./witness_authority');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');

/**
 * Model Authority
 * 
 * Phase 4.2 — Model Authority
 * 
 * Owns:
 * - allowed models
 * - model digest verification
 * - constitutional model identity
 * 
 * Never identify a model by name alone.
 * 
 * Example:
 * llama3.1:8b
 *   digest: sha256:...
 *   constitutional_model_id: ...
 */

class ModelAuthority {
  constructor() {
    // Removed serializer reference - use CanonicalAuthority directly
    this._failureAuthority = runtimeFailureAuthority;
    this._allowedModels = new Map();
    this._modelDigests = new Map();
    this._runtimeMetadata = new Map();
    this._authorityId = this._generateAuthorityId();
  }

  /**
   * Register model
   * @param {Object} modelData - Model data
   * @param {string} modelData.name - Model name
   * @param {string} modelData.digest - Model digest (sha256:...)
   * @param {Object} modelData.metadata - Model metadata
   * @returns {Object} Registered model with constitutional ID
   */
  registerModel(modelData) {
    const constitutionalModelId = this._generateConstitutionalModelId(
      modelData.name,
      modelData.digest
    );

    // Check if digest already registered
    if (this._modelDigests.has(modelData.digest)) {
      const existingId = this._modelDigests.get(modelData.digest);
      const existingModel = this._allowedModels.get(existingId);
      
      // Forbid re-register with different metadata
      if (JSON.stringify(existingModel.metadata) !== JSON.stringify(modelData.metadata || {})) {
        throw this._failureAuthority.createFailure(
          'MODEL_DIGEST_MUTATION',
          'STATE_TRANSITION',
          { 
            digest: modelData.digest,
            existing_metadata: existingModel.metadata,
            new_metadata: modelData.metadata
          }
        );
      }
      
      return existingModel;
    }

    const model = {
      constitutional_model_id: constitutionalModelId,
      name: modelData.name,
      digest: modelData.digest,
      metadata: modelData.metadata || {},
      authority_id: this._authorityId,
      model_metadata: {
        created_by: 'ModelAuthority',
        frozen: true,
        hash: null
      }
    };

    // Compute model hash using WitnessAuthority
    model.model_metadata.hash = witnessAuthority.createWitness(model, {
      authority: 'ModelAuthority',
      authority_version: '4.0.0'
    }).witness_metadata.hash;
    
    // Runtime metadata is separate
    const runtimeMetadata = {
      constitutional_model_id: constitutionalModelId,
      registered_at: constitutionalTimeAuthority.nowAsMillis(),
      authority_id: this._authorityId
    };
    
    this._allowedModels.set(constitutionalModelId, model);
    this._modelDigests.set(modelData.digest, constitutionalModelId);
    this._runtimeMetadata.set(constitutionalModelId, runtimeMetadata);

    return { model, runtime_metadata };
  }

  /**
   * Get model by constitutional ID
   * @param {string} constitutionalModelId - Constitutional model ID
   * @returns {Object} Model
   */
  getModel(constitutionalModelId) {
    return this._allowedModels.get(constitutionalModelId);
  }

  /**
   * Get model by digest
   * @param {string} digest - Model digest
   * @returns {Object} Model
   */
  getModelByDigest(digest) {
    const constitutionalModelId = this._modelDigests.get(digest);
    if (!constitutionalModelId) {
      return null;
    }
    return this._allowedModels.get(constitutionalModelId);
  }

  /**
   * Verify model digest
   * @param {string} modelDigest - Model digest to verify
   * @returns {Object} Verification result
   */
  verifyModelDigest(modelDigest) {
    const constitutionalModelId = this._modelDigests.get(modelDigest);
    
    if (!constitutionalModelId) {
      return {
        valid: false,
        reason: 'Model digest not registered',
        digest: modelDigest
      };
    }

    const model = this._allowedModels.get(constitutionalModelId);
    
    if (model.digest !== modelDigest) {
      return {
        valid: false,
        reason: 'Model digest mismatch',
        expected: model.digest,
        actual: modelDigest
      };
    }

    return {
      valid: true,
      constitutional_model_id: constitutionalModelId,
      model: model,
      reason: 'Model digest verified'
    };
  }

  /**
   * Verify model identity
   * @param {string} constitutionalModelId - Constitutional model ID
   * @param {string} expectedDigest - Expected digest
   * @returns {Object} Verification result
   */
  verifyModelIdentity(constitutionalModelId, expectedDigest) {
    const model = this._allowedModels.get(constitutionalModelId);
    
    if (!model) {
      return {
        valid: false,
        reason: 'Model not registered',
        constitutional_model_id: constitutionalModelId
      };
    }

    if (model.digest !== expectedDigest) {
      return {
        valid: false,
        reason: 'Model digest mismatch',
        expected: model.digest,
        actual: expectedDigest
      };
    }

    return {
      valid: true,
      model: model,
      reason: 'Model identity verified'
    };
  }

  /**
   * Check if model is allowed
   * @param {string} constitutionalModelId - Constitutional model ID
   * @returns {boolean} True if allowed
   */
  isModelAllowed(constitutionalModelId) {
    return this._allowedModels.has(constitutionalModelId);
  }

  /**
   * Get all allowed models
   * @returns {Array} Array of allowed models
   */
  getAllowedModels() {
    return Array.from(this._allowedModels.values());
  }

  /**
   * Get authority ID
   * @returns {string} Authority ID
   */
  getAuthorityId() {
    return this._authorityId;
  }

  /**
   * Clear all models (for testing)
   */
  clear() {
    this._allowedModels.clear();
    this._modelDigests.clear();
    this._runtimeMetadata.clear();
  }

  /**
   * Generate constitutional model ID
   * @param {string} modelName - Model name
   * @param {string} modelDigest - Model digest
   * @returns {string} Constitutional model ID
   */
  _generateConstitutionalModelId(modelName, modelDigest) {
    const modelData = {
      name: modelName,
      digest: modelDigest
    };
    const hash = CanonicalAuthority.hash(modelData);
    return `model_${hash.substring(0, 16)}`;
  }

  /**
   * Generate authority ID
   * @returns {string} Authority ID
   */
  _generateAuthorityId() {
    const authorityData = {
      authority_version: '4.0.0',
      constitutional_version: '4.0.0'
    };
    const hash = CanonicalAuthority.hash(authorityData);
    return `model_${hash.substring(0, 16)}`;
  }
}

// Singleton instance
const modelAuthority = new ModelAuthority();

module.exports = { ModelAuthority, modelAuthority };
