/**
 * Infrastructure Registry
 * 
 * Phase 3.12 — Infrastructure Registry
 * 
 * Registers and resolves infrastructure adapters.
 * ExecutionRuntime resolves adapters from registry.
 * No switch statements.
 */

class InfrastructureRegistry {
  constructor() {
    this._adapters = new Map(); // adapter_name → adapter_instance
  }

  /**
   * Register adapter
   * 
   * @param {string} name - Adapter name
   * @param {Object} adapter - Adapter instance
   */
  register(name, adapter) {
    this._adapters.set(name, adapter);
    console.log(`[InfrastructureRegistry] Registered adapter: ${name}`);
  }

  /**
   * Resolve adapter
   * 
   * @param {string} name - Adapter name
   * @returns {Object} Adapter instance
   */
  resolve(name) {
    const adapter = this._adapters.get(name);
    
    if (!adapter) {
      throw new Error(`Adapter not found: ${name}`);
    }

    return adapter;
  }

  /**
   * Check if adapter is registered
   * 
   * @param {string} name - Adapter name
   * @returns {boolean} True if registered
   */
  has(name) {
    return this._adapters.has(name);
  }

  /**
   * Get all registered adapter names
   * 
   * @returns {Array} Adapter names
   */
  getAdapterNames() {
    return Array.from(this._adapters.keys());
  }

  /**
   * Unregister adapter
   * 
   * @param {string} name - Adapter name
   */
  unregister(name) {
    this._adapters.delete(name);
    console.log(`[InfrastructureRegistry] Unregistered adapter: ${name}`);
  }

  /**
   * Clear all adapters
   */
  clear() {
    this._adapters.clear();
    console.log('[InfrastructureRegistry] Cleared all adapters');
  }

  /**
   * Get registry size
   * 
   * @returns {number} Number of registered adapters
   */
  size() {
    return this._adapters.size;
  }

  /**
   * Check health of all adapters
   * 
   * @returns {Object} Health status
   */
  async health() {
    const health = {
      healthy: true,
      adapters: {},
      total: this._adapters.size,
    };

    for (const [name, adapter] of this._adapters) {
      if (typeof adapter.health === 'function') {
        health.adapters[name] = await adapter.health();
        if (!health.adapters[name].healthy) {
          health.healthy = false;
        }
      } else {
        health.adapters[name] = { healthy: true, message: 'No health check' };
      }
    }

    return health;
  }
}

module.exports = { InfrastructureRegistry };
