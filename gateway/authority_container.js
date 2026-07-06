/**
 * Authority Container
 * 
 * Phase 21 — Dependency Injection Container
 * 
 * Manages all constitutional authorities through dependency injection.
 * 
 * Replaces huge constructors with:
 * 
 * AuthorityContainer.get("PatchAuthority")
 * AuthorityContainer.get("PromptAuthority")
 * AuthorityContainer.get("MissionExecutionAuthority")
 * 
 * Authorities are registered once and resolved on demand.
 */

class AuthorityContainer {
  constructor() {
    this._authorities = new Map();
    this._singletons = new Map();
    this._factories = new Map();
  }

  /**
   * Register authority
   * @param {string} name - Authority name
   * @param {Object} instance - Authority instance
   */
  register(name, instance) {
    this._authorities.set(name, instance);
    this._singletons.set(name, instance);
  }

  /**
   * Register factory
   * @param {string} name - Authority name
   * @param {Function} factory - Factory function
   */
  registerFactory(name, factory) {
    this._factories.set(name, factory);
  }

  /**
   * Get authority
   * @param {string} name - Authority name
   * @returns {Object} Authority instance
   */
  get(name) {
    // Check singleton cache
    if (this._singletons.has(name)) {
      return this._singletons.get(name);
    }

    // Check direct registration
    if (this._authorities.has(name)) {
      return this._authorities.get(name);
    }

    // Check factory
    if (this._factories.has(name)) {
      const factory = this._factories.get(name);
      const instance = factory(this);
      this._singletons.set(name, instance);
      return instance;
    }

    throw new Error(`Authority not found: ${name}`);
  }

  /**
   * Check if authority exists
   * @param {string} name - Authority name
   * @returns {boolean} True if exists
   */
  has(name) {
    return this._authorities.has(name) || this._factories.has(name) || this._singletons.has(name);
  }

  /**
   * Get all registered authority names
   * @returns {Array} Authority names
   */
  getRegisteredNames() {
    const names = new Set([
      ...this._authorities.keys(),
      ...this._factories.keys(),
      ...this._singletons.keys()
    ]);
    return Array.from(names);
  }

  /**
   * Clear all authorities (for testing)
   */
  clear() {
    this._authorities.clear();
    this._singletons.clear();
    this._factories.clear();
  }
}

module.exports = { AuthorityContainer };
