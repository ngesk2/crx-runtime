const { ReplayAuthority } = require('./replay_authority');

/**
 * Compiler Lineage Authority
 *
 * Phase 2.4 — Authority Purity Fix
 *
 * Thin delegating authority that delegates to ReplayAuthority.
 *
 * Removed:
 * - Direct compiler execution
 * - Direct replay logging
 * - Direct consistency verification
 * - Witness generation orchestration (owned by ReplayAuthority)
 *
 * Architecture:
 * CompilerLineageAuthority.verifyCompilerUpgrade()
 *   ↓
 * ReplayAuthority
 *
 * Replay owns replay. Compiler owns compiler.
 */

class CompilerLineageAuthority {
  constructor(ports) {
    this._replayAuthority = new ReplayAuthority(ports);
  }

  /**
   * Verify compiler lineage
   * @param {Object} params - Validation parameters
   * @param {Object} params.generatorV1 - Generator v1 manifest
   * @param {Object} params.generatorV2 - Generator v2 manifest
   * @returns {Object} Validation result from ReplayAuthority
   */
  async verifyCompilerLineage(params) {
    const { generatorV1, generatorV2 } = params;

    // Delegate entirely to ReplayAuthority
    const result = await this._replayAuthority.verifyCompilerUpgrade({
      generatorV1,
      generatorV2,
    });

    return result;
  }
}

module.exports = { CompilerLineageAuthority };
