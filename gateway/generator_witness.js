const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { witnessAuthority } = require('./witness_authority');

/**
 * Generator Witness
 * 
 * Phase 2.4 — Generator Witness
 * 
 * The witness should certify:
 * 
 * Generator
 *   ↓
 * Generator Witness
 *   ↓
 * Adapter
 *   ↓
 * Adapter Witness
 *   ↓
 * Proposal Witness
 * 
 * Generator witness includes:
 * - generator hash
 * - generator version
 * - compiler version
 * - dependency graph hash
 * - generator build hash
 * - generator configuration hash
 * - generator manifest hash
 * 
 * Now replay can prove not only "this adapter was generated"
 * but "this exact generator generated this adapter."
 */

class GeneratorWitness {
  constructor() {
    this._generatorWitnesses = new Map();
  }

  /**
   * Create generator witness
   * @param {Object} generatorManifest - Generator manifest
   * @param {Object} adapterSource - Generated adapter source
   * @param {Object} adapterManifest - Adapter manifest
   * @returns {Object} Generator witness
   */
  createGeneratorWitness(generatorManifest, adapterSource, adapterManifest) {
    const witnessData = {
      generator_id: generatorManifest.generator_id,
      generator_version: generatorManifest.generator_version,
      generator_hash: generatorManifest.generator_hash,
      generator_build_hash: generatorManifest.generator_build_hash,
      generator_dependencies_hash: generatorManifest.generator_dependencies_hash,
      generator_configuration_hash: generatorManifest.generator_configuration_hash,
      generator_manifest_hash: generatorManifest.generator_metadata.hash,
      adapter_id: adapterManifest.adapter_id,
      adapter_source_hash: adapterManifest.adapter_source_hash,
      adapter_manifest_hash: adapterManifest.manifest_metadata.hash,
      compiler_version: '1.0.0',
    };

    const witness = witnessAuthority.createWitness(witnessData, {
      authority: 'GeneratorWitness',
      authority_version: '1.0.0'
    });
    
    this._generatorWitnesses.set(witness.witness_id, witness);

    return witness;
  }

  /**
   * Verify generator witness
   * @param {Object} witness - Generator witness to verify
   * @param {Object} generatorManifest - Generator manifest
   * @param {Object} adapterManifest - Adapter manifest
   * @returns {boolean} True if valid
   */
  verifyGeneratorWitness(witness, generatorManifest, adapterManifest) {
    if (!witness || !witness.witness_metadata) {
      return false;
    }

    // Verify witness hash
    const computedHash = CanonicalAuthority.hash(witness);
    if (computedHash !== witness.witness_metadata.hash) {
      return false;
    }

    // Verify generator metadata matches
    if (witness.generator_hash !== generatorManifest.generator_hash) {
      return false;
    }

    if (witness.generator_build_hash !== generatorManifest.generator_build_hash) {
      return false;
    }

    if (witness.generator_dependencies_hash !== generatorManifest.generator_dependencies_hash) {
      return false;
    }

    if (witness.generator_configuration_hash !== generatorManifest.generator_configuration_hash) {
      return false;
    }

    if (witness.generator_manifest_hash !== generatorManifest.generator_metadata.hash) {
      return false;
    }

    // Verify adapter metadata matches
    if (witness.adapter_source_hash !== adapterManifest.adapter_source_hash) {
      return false;
    }

    if (witness.adapter_manifest_hash !== adapterManifest.manifest_metadata.hash) {
      return false;
    }

    return true;
  }

  /**
   * Get generator witness by ID
   * @param {string} witnessId - Witness ID
   * @returns {Object} Generator witness
   */
  getGeneratorWitness(witnessId) {
    return this._generatorWitnesses.get(witnessId);
  }

  /**
   * Clear all witnesses (for testing)
   */
  clear() {
    this._generatorWitnesses.clear();
  }

  /**
   * Get all generator witnesses
   * @returns {Array} Array of generator witnesses
   */
  getAllWitnesses() {
    return Array.from(this._generatorWitnesses.values());
  }
}

module.exports = { GeneratorWitness };
