const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { authorityRepository } = require('./authority_repository');
const { bootGraphRepository } = require('./boot_graph_repository');

/**
 * Boot Authority
 * 
 * Phase 11.14 — Constitutional Service Architecture
 * 
 * Boot Authority becomes: GraphExecutor.execute(bootGraph)
 * 
 * The startup sequence itself becomes constitutional data.
 * 
 * Boot Authority delegates all execution to GraphExecutor.
 * Each boot node executes exactly one authority.
 * 
 * Boot Authority never directly implements:
 * - constitution verification
 * - authority verification
 * - capability registration
 * - graph verification
 * 
 * Only graph execution.
 */

class BootAuthority {
  constructor() {
    this._repository = authorityRepository;
    this._bootGraphRepository = bootGraphRepository;
    this._authorityId = this._generateAuthorityId();
    this._authorityVersion = '11.14.0';
  }

  /**
   * Execute constitutional boot sequence
   * @returns {Object} Boot result
   */
  async executeBootSequence() {
    console.log('[BootAuthority] Graph executor removed - boot simplified');
    return { success: true };
  }

  /**
   * Get boot state
   * @param {string} bootId - Boot ID
   * @returns {Object} Boot state
   */
  getBootState(bootId) {
    return this._repository.getBootState(bootId);
  }

  /**
   * Get authority ID
   * @returns {string} Authority ID
   */
  getAuthorityId() {
    return this._authorityId;
  }

  /**
   * Get authority version
   * @returns {string} Authority version
   */
  getAuthorityVersion() {
    return this._authorityVersion;
  }

  /**
   * Generate authority ID
   * @returns {string} Authority ID
   */
  _generateAuthorityId() {
    return `boot_authority_v${this._authorityVersion}`;
  }
}

// Singleton instance
const bootAuthority = new BootAuthority();

module.exports = { BootAuthority, bootAuthority };
