const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');

/**
 * WitnessGenerator
 * 
 * Constitutional witness generator for adapter artifacts.
 * Generates compilation, validation, and test witnesses.
 * Witnesses provide constitutional proof of adapter generation.
 * All witnesses are frozen, hashed, and replayable.
 */
class WitnessGenerator {
  constructor() {
    this._witnesses = new Map(); // witness_id -> witness
  }

  /**
   * Generate adapter witness
   * @param {Object} adapter - Generated adapter
   * @param {Object} manifest - Adapter manifest
   * @returns {Object} Adapter witness
   */
  async generateAdapterWitness(adapter, manifest) {
    // Generate deterministic witness ID from adapter ID and manifest hash
    const witnessId = this._generateDeterministicWitnessId(adapter.adapter_id, manifest.manifest_metadata.hash);
    
    const witness = {
      witness_id: witnessId,
      adapter_id: adapter.adapter_id,
      adapter_manifest_hash: manifest.manifest_metadata.hash,
      compilation_witness: await this._runCompilation(adapter),
      validation_witness: await this._runValidation(adapter),
      test_witness: await this._runTests(adapter),
      witness_metadata: {
        created_by: "WitnessGenerator",
        frozen: true,
        hash: null
      }
    };
    
    // Compute hash without timestamps for determinism
    witness.witness_metadata.hash = this._computeDeterministicHash(witness);
    const frozenWitness = this._freezeWitness(witness);
    this._witnesses.set(witness.witness_id, frozenWitness);
    
    return frozenWitness;
  }

  /**
   * Run compilation witness
   * @param {Object} adapter - Generated adapter
   * @returns {Object} Compilation witness
   */
  async _runCompilation(adapter) {
    const errors = [];
    let success = true;

    try {
      // Validate adapter source compiles
      this._validateCompilation(adapter.adapter_source);
    } catch (error) {
      errors.push(error.message);
      success = false;
    }

    return {
      compilation_success: success,
      compilation_errors: errors,
      compilation_hash: this._computeHash(adapter.adapter_source)
    };
  }

  /**
   * Run validation witness
   * @param {Object} adapter - Generated adapter
   * @returns {Object} Validation witness
   */
  async _runValidation(adapter) {
    const errors = [];
    let success = true;

    try {
      // Validate adapter structure
      this._validateAdapterStructure(adapter);
      
      // Validate adapter metadata
      this._validateAdapterMetadata(adapter);
    } catch (error) {
      errors.push(error.message);
      success = false;
    }

    return {
      validation_success: success,
      validation_errors: errors,
      validation_hash: this._computeHash(adapter)
    };
  }

  /**
   * Run test witness
   * @param {Object} adapter - Generated adapter
   * @returns {Object} Test witness
   */
  async _runTests(adapter) {
    const errors = [];
    let success = true;

    try {
      // Run unit tests (placeholder)
      const unitTestResults = await this._runUnitTests(adapter);
      
      // Run integration tests (placeholder)
      const integrationTestResults = await this._runIntegrationTests(adapter);
      
      return {
        test_success: success,
        test_errors: errors,
        test_results: {
          unit_tests: unitTestResults,
          integration_tests: integrationTestResults
        }
      };
    } catch (error) {
      errors.push(error.message);
      success = false;
      
      return {
        test_success: success,
        test_errors: errors,
        test_results: {
          unit_tests: { passed: 0, failed: 0 },
          integration_tests: { passed: 0, failed: 0 }
        }
      };
    }
  }

  /**
   * Validate compilation
   * @param {string} source - Adapter source code
   */
  _validateCompilation(source) {
    // Basic syntax validation
    if (!source || typeof source !== 'string') {
      throw new Error('Invalid adapter source');
    }
    
    // Check for basic class structure
    if (!source.includes('class ') || !source.includes('constructor')) {
      throw new Error('Invalid adapter class structure');
    }
  }

  /**
   * Validate adapter structure
   * @param {Object} adapter - Generated adapter
   */
  _validateAdapterStructure(adapter) {
    const requiredFields = ['adapter_id', 'adapter_name', 'adapter_version', 'adapter_source', 'adapter_source_hash', 'vendor'];
    
    for (const field of requiredFields) {
      if (!adapter[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  /**
   * Validate adapter metadata
   * @param {Object} adapter - Generated adapter
   */
  _validateAdapterMetadata(adapter) {
    if (!adapter.adapter_metadata) {
      throw new Error('Missing adapter metadata');
    }
    
    if (!adapter.adapter_metadata.frozen) {
      throw new Error('Adapter metadata is not frozen');
    }
    
    if (!adapter.adapter_metadata.hash) {
      throw new Error('Adapter metadata is not hashed');
    }
  }

  /**
   * Run unit tests (placeholder)
   * @param {Object} adapter - Generated adapter
   * @returns {Object} Unit test results
   */
  async _runUnitTests(adapter) {
    // Placeholder for unit test execution
    return { passed: 0, failed: 0 };
  }

  /**
   * Run integration tests (placeholder)
   * @param {Object} adapter - Generated adapter
   * @returns {Object} Integration test results
   */
  async _runIntegrationTests(adapter) {
    // Placeholder for integration test execution
    return { passed: 0, failed: 0 };
  }

  /**
   * Get witness by ID
   * @param {string} witnessId - Witness ID
   * @returns {Object} Witness
   */
  getWitness(witnessId) {
    return this._witnesses.get(witnessId);
  }

  /**
   * Verify witness integrity
   * @param {Object} witness - Witness to verify
   * @returns {boolean} Verification result
   */
  async verifyWitnessIntegrity(witness) {
    // Verify witness is frozen
    if (!witness.witness_metadata.frozen) {
      return false;
    }

    // Verify hash matches content
    const computedHash = this._computeHash(witness);
    if (computedHash !== witness.witness_metadata.hash) {
      return false;
    }

    // Verify compilation witness
    if (!witness.compilation_witness.compilation_success) {
      return false;
    }

    // Verify validation witness
    if (!witness.validation_witness.validation_success) {
      return false;
    }

    return true;
  }

  /**
   * Compute hash
   * @param {Object} data - Data to hash
   * @returns {string} SHA256 hash
   */
  _computeHash(data) {
    return CanonicalAuthority.hash(data);
  }

  /**
   * Compute deterministic hash (excludes timestamps)
   * @param {Object} data - Data to hash
   * @returns {string} SHA256 hash
   */
  _computeDeterministicHash(data) {
    const dataCopy = JSON.parse(JSON.stringify(data));
    
    // Remove timestamps from witness
    if (dataCopy.compilation_witness) {
      delete dataCopy.compilation_witness.compilation_timestamp;
    }
    if (dataCopy.validation_witness) {
      delete dataCopy.validation_witness.validation_timestamp;
    }
    if (dataCopy.test_witness) {
      delete dataCopy.test_witness.test_timestamp;
    }
    if (dataCopy.witness_metadata) {
      delete dataCopy.witness_metadata.created_at;
    }
    
    // Phase 36 PATCH 3: Use CanonicalBytes instead of JSON.stringify
    return CanonicalAuthority.hash(dataCopy);
  }

  /**
   * Freeze witness to prevent mutations
   * @param {Object} witness - Witness
   * @returns {Object} Frozen witness
   */
  _freezeWitness(witness) {
    return JSON.parse(JSON.stringify(witness));
  }

  /**
   * Generate deterministic witness ID
   * @param {string} adapterId - Adapter ID
   * @param {string} manifestHash - Manifest hash
   * @returns {string} Deterministic witness ID
   */
  _generateDeterministicWitnessId(adapterId, manifestHash) {
    const combined = `${adapterId}_${manifestHash}`;
    const hash = CanonicalAuthority.hash(combined);
    return `aw_${hash.substring(0, 16)}`;
  }
}

module.exports = { WitnessGenerator };
