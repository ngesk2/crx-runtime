/**
 * DTO Registry Authority
 *
 * Phase 2.7.4 — Constitutional Boundary Collapse
 *
 * Owns DTO registration and lookup.
 *
 * Constitutional Constraint:
 * - Compiler asks registry, owns zero mappings
 * - Adapters register their DTOs
 * - Compiler knows nothing about source systems
 */

class DTORegistryAuthority {
  constructor() {
    this._dtoFactories = new Map();
    this._authorityId = this._generateAuthorityId();
    this._authorityVersion = '2.7.4';
  }

  /**
   * Register a DTO factory
   * @param {string} sourceType - Source type (e.g., 'github', 'gitlab')
   * @param {Function} dtoClass - DTO class constructor
   */
  register(sourceType, dtoClass) {
    this._dtoFactories.set(sourceType, dtoClass);
  }

  /**
   * Lookup a DTO factory
   * @param {string} sourceType - Source type
   * @returns {Function} DTO class constructor
   */
  lookup(sourceType) {
    const dtoClass = this._dtoFactories.get(sourceType);
    if (!dtoClass) {
      throw new Error(`No DTO registered for source type: ${sourceType}`);
    }
    return dtoClass;
  }

  /**
   * Check if source type is supported
   * @param {string} sourceType - Source type
   * @returns {boolean}
   */
  isSupported(sourceType) {
    return this._dtoFactories.has(sourceType);
  }

  /**
   * Get all supported source types
   * @returns {Array<string>} Supported source types
   */
  supportedSources() {
    return Array.from(this._dtoFactories.keys());
  }

  /**
   * Validate DTO registration
   * @param {string} sourceType - Source type
   * @returns {boolean}
   */
  validate(sourceType) {
    return this.isSupported(sourceType);
  }

  /**
   * Generate authority ID
   * @returns {string} Authority ID
   */
  _generateAuthorityId() {
    return `dto_registry_authority_v${this._authorityVersion}`;
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
   * Clear all registrations (for testing)
   */
  clear() {
    this._dtoFactories.clear();
  }
}

// Singleton instance
const dtoRegistryAuthority = new DTORegistryAuthority();

module.exports = { DTORegistryAuthority, dtoRegistryAuthority };
