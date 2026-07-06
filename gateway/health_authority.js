/**
 * Health Authority
 *
 * Phase 2.7.10 — Constitutional Boundary Collapse
 *
 * Owns runtime health aggregation.
 *
 * Constitutional Constraint:
 * - Health aggregation is constitutional
 * - Express routes delegate to this authority
 * - No health logic in controllers
 */

class HealthAuthority {
  constructor() {
    this._authorityId = this._generateAuthorityId();
    this._authorityVersion = '2.7.10';
    this._healthChecks = new Map();
  }

  /**
   * Register a health check
   * @param {string} name - Health check name
   * @param {Function} check - Health check function
   */
  registerHealthCheck(name, check) {
    this._healthChecks.set(name, check);
  }

  /**
   * Get overall health status
   * @returns {Promise<Object>} Health status
   */
  async getHealth() {
    const health = {
      status: 'healthy',
      uptime: process.uptime(),
      components: {}
    };

    for (const [name, check] of this._healthChecks) {
      try {
        const result = await check();
        health.components[name] = result;
        
        if (result.status !== 'healthy' && result.status !== 'ready' && result.status !== 'running') {
          health.status = 'unhealthy';
        }
      } catch (error) {
        health.components[name] = {
          status: 'error',
          error: error.message
        };
        health.status = 'unhealthy';
      }
    }

    return health;
  }

  /**
   * Get specific component health
   * @param {string} name - Component name
   * @returns {Promise<Object>} Component health
   */
  async getComponentHealth(name) {
    const check = this._healthChecks.get(name);
    if (!check) {
      throw new Error(`Health check not registered: ${name}`);
    }

    try {
      return await check();
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Generate authority ID
   * @returns {string} Authority ID
   */
  _generateAuthorityId() {
    return `health_authority_v${this._authorityVersion}`;
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
   * Clear all health checks (for testing)
   */
  clear() {
    this._healthChecks.clear();
  }
}

// Singleton instance
const healthAuthority = new HealthAuthority();

module.exports = { HealthAuthority, healthAuthority };
