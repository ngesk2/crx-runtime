/**
 * OmniRouter
 * 
 * Priority 2: OmniRoute Constitution
 * 
 * The single constitutional routing layer for all authority invocations.
 * 
 * Constitutional Constraint:
 * Every authority invocation must pass through exactly one constitutional routing layer.
 * Nothing should directly instantiate or import another authority outside the router.
 * 
 * Architecture:
 * Execution
 *   ↓
 * OmniRouter
 *   ↓
 * Authority
 *   ↓
 * Witness
 *   ↓
 * Replay
 * 
 * OmniRouter owns:
 * - Authority resolution
 * - Version selection
 * - Constitutional upgrades
 * - Replay routing
 * - Runtime routing
 * - Verification routing
 * - Fallback routing
 * - Future distributed routing
 */

class OmniRouter {
  constructor() {
    this._routerVersion = '1.0.0';
    this._authorities = new Map(); // authority_id -> authority instance
    this._authorityVersions = new Map(); // authority_id -> version
    this._routingMode = 'runtime'; // 'runtime', 'replay', 'distributed'
    this._fallbackEnabled = true;
  }

  /**
   * Register authority
   * @param {string} authorityId - Authority identifier
   * @param {Object} authority - Authority instance
   * @param {string} version - Authority version
   */
  registerAuthority(authorityId, authority, version = '1.0.0') {
    this._authorities.set(authorityId, authority);
    this._authorityVersions.set(authorityId, version);
  }

  /**
   * Resolve authority by ID
   * @param {string} authorityId - Authority identifier
   * @param {string} preferredVersion - Preferred version (optional)
   * @returns {Object} Authority instance
   */
  resolveAuthority(authorityId, preferredVersion = null) {
    const authority = this._authorities.get(authorityId);
    if (!authority) {
      if (this._fallbackEnabled) {
        return this._getFallbackAuthority(authorityId);
      }
      throw new Error(`Authority not found: ${authorityId}`);
    }
    
    if (preferredVersion) {
      const currentVersion = this._authorityVersions.get(authorityId);
      if (currentVersion !== preferredVersion) {
        console.warn(`Version mismatch for ${authorityId}: requested ${preferredVersion}, have ${currentVersion}`);
      }
    }
    
    return authority;
  }

  /**
   * Route authority invocation
   * @param {string} authorityId - Authority identifier
   * @param {string} method - Method name
   * @param {Array} args - Method arguments
   * @param {Object} options - Routing options
   * @returns {*} Method result
   */
  route(authorityId, method, args, options = {}) {
    const authority = this.resolveAuthority(authorityId, options.version);
    
    // Apply routing mode
    if (this._routingMode === 'replay') {
      return this._routeReplay(authority, method, args, options);
    }
    if (this._routingMode === 'distributed') {
      return this._routeDistributed(authority, method, args, options);
    }
    
    // Default runtime routing
    return this._routeRuntime(authority, method, args, options);
  }

  /**
   * Route runtime invocation
   * @param {Object} authority - Authority instance
   * @param {string} method - Method name
   * @param {Array} args - Method arguments
   * @param {Object} options - Routing options
   * @returns {*} Method result
   * @private
   */
  _routeRuntime(authority, method, args, options) {
    if (typeof authority[method] !== 'function') {
      throw new Error(`Method not found: ${method}`);
    }
    return authority[method](...args);
  }

  /**
   * Route replay invocation
   * @param {Object} authority - Authority instance
   * @param {string} method - Method name
   * @param {Array} args - Method arguments
   * @param {Object} options - Routing options
   * @returns {*} Method result
   * @private
   */
  _routeReplay(authority, method, args, options) {
    // Replay routing ensures deterministic behavior
    // May intercept certain methods to enforce replay constraints
    if (method === 'now' || method === 'nowAsMillis' || method === 'nowAsDate') {
      // Time methods should use replay clock
      const { constitutionalClock } = require('./authorities/constitutional_clock');
      if (constitutionalClock.isReplayMode()) {
        return constitutionalClock[method]();
      }
    }
    
    return this._routeRuntime(authority, method, args, options);
  }

  /**
   * Route distributed invocation
   * @param {Object} authority - Authority instance
   * @param {string} method - Method name
   * @param {Array} args - Method arguments
   * @param {Object} options - Routing options
   * @returns {*} Method result
   * @private
   */
  _routeDistributed(authority, method, args, options) {
    // Distributed routing for future multi-node deployments
    // For now, delegate to runtime routing
    return this._routeRuntime(authority, method, args, options);
  }

  /**
   * Get fallback authority
   * @param {string} authorityId - Authority identifier
   * @returns {Object} Fallback authority
   * @private
   */
  _getFallbackAuthority(authorityId) {
    // Fallback logic for missing authorities
    // This allows graceful degradation during upgrades
    console.warn(`Using fallback for authority: ${authorityId}`);
    
    // Return a no-op fallback
    return {
      [authorityId]: () => {
        console.warn(`Fallback authority called: ${authorityId}`);
        return null;
      }
    };
  }

  /**
   * Set routing mode
   * @param {string} mode - Routing mode ('runtime', 'replay', 'distributed')
   */
  setRoutingMode(mode) {
    if (!['runtime', 'replay', 'distributed'].includes(mode)) {
      throw new Error(`Invalid routing mode: ${mode}`);
    }
    this._routingMode = mode;
  }

  /**
   * Get routing mode
   * @returns {string} Current routing mode
   */
  getRoutingMode() {
    return this._routingMode;
  }

  /**
   * Enable/disable fallback
   * @param {boolean} enabled - Fallback enabled
   */
  setFallbackEnabled(enabled) {
    this._fallbackEnabled = enabled;
  }

  /**
   * Get authority version
   * @param {string} authorityId - Authority identifier
   * @returns {string} Authority version
   */
  getAuthorityVersion(authorityId) {
    return this._authorityVersions.get(authorityId);
  }

  /**
   * Get all registered authorities
   * @returns {Array} Array of authority IDs
   */
  getRegisteredAuthorities() {
    return Array.from(this._authorities.keys());
  }

  /**
   * Get router version
   * @returns {string} Router version
   */
  getRouterVersion() {
    return this._routerVersion;
  }

  /**
   * Reset router (for testing)
   */
  _reset() {
    this._authorities.clear();
    this._authorityVersions.clear();
    this._routingMode = 'runtime';
    this._fallbackEnabled = true;
  }
}

// Singleton instance
const omniRouter = new OmniRouter();

module.exports = {
  OmniRouter,
  omniRouter
};
