const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');

/**
 * Reproducible Build Authority
 * 
 * Phase 2.3 — Separate Determinism vs Reproducibility
 * 
 * Constitutional Law: Reproducible Build
 * 
 * same source
 *   ↓
 * same compiled artifact
 *   ↓
 * same binary hash
 *   ↓
 * same deployment artifact
 * 
 * This authority verifies that the build process
 * is reproducible given the same source.
 */

class ReproducibleBuildAuthority {
  constructor() {
    this._buildRecords = new Map();
  }

  /**
   * Verify reproducible build
   * @param {Object} adapterSource - Adapter source code
   * @param {Object} compiledArtifact - Compiled artifact
   * @param {Object} deploymentArtifact - Deployment artifact
   * @returns {Object} Reproducible build verification result
   */
  async verifyReproducibleBuild(adapterSource, compiledArtifact, deploymentArtifact) {
    const sourceHash = CanonicalAuthority.hash(adapterSource);
    const compiledHash = CanonicalAuthority.hash(compiledArtifact);
    const deploymentHash = CanonicalAuthority.hash(deploymentArtifact);

    // Check if we have a previous record for this source
    const previousRecord = this._buildRecords.get(sourceHash);

    if (!previousRecord) {
      // First time seeing this source - record it
      this._buildRecords.set(sourceHash, {
        source_hash: sourceHash,
        compiled_hash: compiledHash,
        deployment_hash: deploymentHash,
        timestamp: constitutionalTimeAuthority.now()
      });

      return {
        is_reproducible: true,
        is_first_build: true,
        source_hash: sourceHash,
        compiled_hash: compiledHash,
        deployment_hash: deploymentHash,
        message: 'First build - recorded baseline'
      };
    }

    // Verify reproducibility against previous record
    const isReproducible = 
      previousRecord.compiled_hash === compiledHash &&
      previousRecord.deployment_hash === deploymentHash;

    return {
      is_reproducible: isReproducible,
      is_first_build: false,
      source_hash: sourceHash,
      compiled_hash: compiledHash,
      deployment_hash: deploymentHash,
      previous_compiled_hash: previousRecord.compiled_hash,
      previous_deployment_hash: previousRecord.deployment_hash,
      message: isReproducible 
        ? 'Reproducible build verified' 
        : 'Reproducible build violated'
    };
  }

  /**
   * Get build record for source
   * @param {string} sourceHash - Source hash
   * @returns {Object} Build record
   */
  getBuildRecord(sourceHash) {
    return this._buildRecords.get(sourceHash);
  }

  /**
   * Clear all build records (for testing)
   */
  clear() {
    this._buildRecords.clear();
  }

  /**
   * Get all build records
   * @returns {Array} Array of build records
   */
  getAllRecords() {
    return Array.from(this._buildRecords.values());
  }
}

module.exports = { ReproducibleBuildAuthority };
