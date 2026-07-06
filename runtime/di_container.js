/**
 * Dependency Injection Container
 * 
 * Phase 3.1 — DI Container
 * 
 * Provides constitutional dependencies:
 * - adapters
 * - authorities
 * - policy
 * - clock
 * - id
 * - canonical
 * 
 * No require() inside authorities. Everything injected.
 */

class DIContainer {
  constructor() {
    this._adapters = new Map();
    this._authorities = new Map();
    this._services = new Map();
  }

  /**
   * Register adapter
   * 
   * @param {string} name - Adapter name
   * @param {Object} adapter - Adapter instance
   */
  registerAdapter(name, adapter) {
    this._adapters.set(name, adapter);
  }

  /**
   * Register authority
   * 
   * @param {string} name - Authority name
   * @param {Object} authority - Authority instance
   */
  registerAuthority(name, authority) {
    this._authorities.set(name, authority);
  }

  /**
   * Register service
   * 
   * @param {string} name - Service name
   * @param {Object} service - Service instance
   */
  registerService(name, service) {
    this._services.set(name, service);
  }

  /**
   * Get adapter
   * 
   * @param {string} name - Adapter name
   * @returns {Object} Adapter instance
   */
  getAdapter(name) {
    return this._adapters.get(name);
  }

  /**
   * Get authority
   * 
   * @param {string} name - Authority name
   * @returns {Object} Authority instance
   */
  getAuthority(name) {
    return this._authorities.get(name);
  }

  /**
   * Get service
   * 
   * @param {string} name - Service name
   * @returns {Object} Service instance
   */
  getService(name) {
    return this._services.get(name);
  }

  /**
   * Get all adapters
   * 
   * @returns {Map} All adapters
   */
  getAdapters() {
    return this._adapters;
  }

  /**
   * Get all authorities
   * 
   * @returns {Map} All authorities
   */
  getAuthorities() {
    return this._authorities;
  }

  /**
   * Get all services
   * 
   * @returns {Map} All services
   */
  getServices() {
    return this._services;
  }

  /**
   * Create authority with dependencies
   * 
   * @param {string} authorityClass - Authority class
   * @param {Object} dependencies - Dependency names
   * @returns {Object} Authority instance
   */
  createAuthority(authorityClass, dependencies = {}) {
    const resolvedDependencies = {};

    for (const [key, depName] of Object.entries(dependencies)) {
      if (this._adapters.has(depName)) {
        resolvedDependencies[key] = this._adapters.get(depName);
      } else if (this._authorities.has(depName)) {
        resolvedDependencies[key] = this._authorities.get(depName);
      } else if (this._services.has(depName)) {
        resolvedDependencies[key] = this._services.get(depName);
      } else {
        throw new Error(`Dependency not found: ${depName}`);
      }
    }

    return new authorityClass(...Object.values(resolvedDependencies));
  }

  /**
   * Initialize all registered components
   */
  async initialize() {
    console.log('[DIContainer] Initializing components');

    // Initialize adapters
    for (const [name, adapter] of this._adapters) {
      if (typeof adapter.initialize === 'function') {
        console.log(`[DIContainer] Initializing adapter: ${name}`);
        await adapter.initialize();
      }
    }

    // Initialize authorities
    for (const [name, authority] of this._authorities) {
      if (typeof authority.initialize === 'function') {
        console.log(`[DIContainer] Initializing authority: ${name}`);
        await authority.initialize();
      }
    }

    // Initialize services
    for (const [name, service] of this._services) {
      if (typeof service.initialize === 'function') {
        console.log(`[DIContainer] Initializing service: ${name}`);
        await service.initialize();
      }
    }

    console.log('[DIContainer] All components initialized');
  }

  /**
   * Close all registered components
   */
  async close() {
    console.log('[DIContainer] Closing components');

    // Close adapters
    for (const [name, adapter] of this._adapters) {
      if (typeof adapter.close === 'function') {
        console.log(`[DIContainer] Closing adapter: ${name}`);
        await adapter.close();
      }
    }

    // Close authorities
    for (const [name, authority] of this._authorities) {
      if (typeof authority.close === 'function') {
        console.log(`[DIContainer] Closing authority: ${name}`);
        await authority.close();
      }
    }

    // Close services
    for (const [name, service] of this._services) {
      if (typeof service.close === 'function') {
        console.log(`[DIContainer] Closing service: ${name}`);
        await service.close();
      }
    }

    console.log('[DIContainer] All components closed');
  }

  /**
   * Check health
   */
  async health() {
    const health = {
      healthy: true,
      adapters: {},
      authorities: {},
      services: {},
    };

    // Check adapters
    for (const [name, adapter] of this._adapters) {
      if (typeof adapter.health === 'function') {
        health.adapters[name] = await adapter.health();
      } else {
        health.adapters[name] = { healthy: true };
      }
    }

    // Check authorities
    for (const [name, authority] of this._authorities) {
      if (typeof authority.health === 'function') {
        health.authorities[name] = await authority.health();
      } else {
        health.authorities[name] = { healthy: true };
      }
    }

    // Check services
    for (const [name, service] of this._services) {
      if (typeof service.health === 'function') {
        health.services[name] = await service.health();
      } else {
        health.services[name] = { healthy: true };
      }
    }

    // Overall health
    const allHealthy = [
      ...Object.values(health.adapters),
      ...Object.values(health.authorities),
      ...Object.values(health.services),
    ].every(h => h.healthy);

    health.healthy = allHealthy;

    return health;
  }
}

module.exports = { DIContainer };
