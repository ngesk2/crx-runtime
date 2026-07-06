/**
 * Dependency Injection Container
 *
 * Phase 2.7.1 — Constitutional Boundary Collapse
 *
 * ALL construction happens here. No class constructs another service.
 *
 * Constitutional Constraint:
 * - Zero service construction outside Bootstrap
 * - Every dependency is injected
 * - No class may use `new` for another service
 */

class Container {
  constructor() {
    this._services = new Map();
    this._singletons = new Map();
  }

  /**
   * Register a service factory
   * @param {string} name - Service name
   * @param {Function} factory - Factory function
   * @param {boolean} singleton - Whether to cache as singleton
   */
  register(name, factory, singleton = true) {
    this._services.set(name, { factory, singleton });
  }

  /**
   * Resolve a service
   * @param {string} name - Service name
   * @returns {Object} Service instance
   */
  resolve(name) {
    if (this._singletons.has(name)) {
      return this._singletons.get(name);
    }

    const service = this._services.get(name);
    if (!service) {
      throw new Error(`Service not registered: ${name}`);
    }

    const instance = service.factory(this);

    if (service.singleton) {
      this._singletons.set(name, instance);
    }

    return instance;
  }

  /**
   * Check if service is registered
   * @param {string} name - Service name
   * @returns {boolean}
   */
  has(name) {
    return this._services.has(name) || this._singletons.has(name);
  }

  /**
   * Clear all services (for testing)
   */
  clear() {
    this._services.clear();
    this._singletons.clear();
  }
}

module.exports = { Container };
