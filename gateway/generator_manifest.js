const { CanonicalAuthority, CanonicalBytes } = require('../ping-runtime/authorities/canonical_authority.js');

/**
 * Generator Manifest
 * 
 * Phase 2.1 — Generator as Constitutional Artifact
 * 
 * The CodeGenerator becomes a constitutional artifact.
 * Changing the generator itself becomes a constitutional proposal
 * instead of an invisible implementation detail.
 * 
 * Every artifact should contain:
 * - generator_id
 * - generator_version
 * - generator_hash
 * - generator_build_hash
 * - generator_dependencies_hash
 * - generator_configuration_hash
 */

class GeneratorManifest {
  constructor() {
    // Removed serializer reference - use CanonicalAuthority directly
    this._generatorManifests = new Map();
  }

  /**
   * Create generator manifest
   * @param {Object} generatorInfo - Generator information
   * @param {string} generatorInfo.generator_id - Generator ID
   * @param {string} generatorInfo.generator_version - Generator version
   * @param {string} generatorInfo.generator_source - Generator source code
   * @param {Object} generatorInfo.dependencies - Generator dependencies
   * @param {Object} generatorInfo.configuration - Generator configuration
   * @returns {Object} Generator manifest
   */
  createGeneratorManifest(generatorInfo) {
    const {
      generator_id,
      generator_version,
      generator_source,
      dependencies = {},
      configuration = {}
    } = generatorInfo;

    // Compute generator hash from source
    const generator_hash = CanonicalAuthority.hash({
      generator_source
    });

    // Compute generator build hash (simulated - in production this would be the actual build artifact)
    const generator_build_hash = this._computeBuildHash(generator_source, dependencies);

    // Compute dependencies hash
    const dependencies_hash = CanonicalAuthority.hash({
      dependencies
    });

    // Compute configuration hash
    const configuration_hash = CanonicalAuthority.hash({
      configuration
    });

    const manifest = {
      generator_id,
      generator_version,
      generator_hash,
      generator_build_hash,
      generator_dependencies_hash: dependencies_hash,
      generator_configuration_hash: configuration_hash,
      generator_metadata: {
        created_by: 'GeneratorManifest',
        frozen: true,
        hash: null
      }
    };

    // Compute manifest hash
    manifest.generator_metadata.hash = CanonicalAuthority.hash(manifest);

    // Store manifest
    this._generatorManifests.set(generator_id, manifest);

    return manifest;
  }

  /**
   * Get generator manifest by ID
   * @param {string} generatorId - Generator ID
   * @returns {Object} Generator manifest
   */
  getGeneratorManifest(generatorId) {
    return this._generatorManifests.get(generatorId);
  }

  /**
   * Verify generator manifest integrity
   * @param {Object} manifest - Generator manifest to verify
   * @returns {boolean} True if valid
   */
  verifyManifestIntegrity(manifest) {
    if (!manifest || !manifest.generator_metadata) {
      return false;
    }

    const computedHash = CanonicalAuthority.hash(manifest);
    return computedHash === manifest.generator_metadata.hash;
  }

  /**
   * Compute build hash from source and dependencies
   * @param {string} source - Generator source
   * @param {Object} dependencies - Dependencies
   * @returns {string} Build hash
   */
  _computeBuildHash(source, dependencies) {
    const buildInput = {
      source,
      dependencies
    };
    return CanonicalAuthority.hash(buildInput);
  }

  /**
   * Get all generator manifests
   * @returns {Array} Array of generator manifests
   */
  getAllManifests() {
    return Array.from(this._generatorManifests.values());
  }

  /**
   * Clear all manifests (for testing)
   */
  clear() {
    this._generatorManifests.clear();
  }
}

module.exports = { GeneratorManifest };
