/**
 * Symbol Object Authority
 * 
 * Ω.49 — Symbol Object Authority
 * 
 * Constitutional authority for symbol object construction.
 * 
 * Separates symbol construction from persistence and querying.
 * This authority only creates symbol objects using ConstitutionalObjectFactory.
 */

const { constitutionalObjectFactory } = require('./constitutional_object_factory');

class SymbolObjectAuthority {
  constructor() {
    this._authorityId = this._generateAuthorityId();
    this._authorityVersion = '1.0.0';
  }

  /**
   * Create symbol object
   * @param {Object} symbolData - Symbol data
   * @returns {Object} Symbol constitutional object
   */
  createSymbol(symbolData) {
    return constitutionalObjectFactory.createSymbol({
      ...symbolData,
      authority: 'SymbolObjectAuthority',
    });
  }

  /**
   * Create multiple symbol objects
   * @param {Array} symbolDataArray - Array of symbol data
   * @returns {Array} Array of symbol constitutional objects
   */
  createSymbols(symbolDataArray) {
    return symbolDataArray.map(data => this.createSymbol(data));
  }

  /**
   * Validate symbol data
   * @param {Object} symbolData - Symbol data to validate
   * @returns {Object} Validation result
   */
  validateSymbolData(symbolData) {
    const errors = [];

    if (!symbolData.canonical_name) {
      errors.push('canonical_name is required');
    }

    if (!symbolData.language) {
      errors.push('language is required');
    }

    if (!symbolData.kind) {
      errors.push('kind is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
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
    return `symbol_object_authority_${this._authorityVersion}`;
  }
}

// Singleton instance
const symbolObjectAuthority = new SymbolObjectAuthority();

module.exports = { SymbolObjectAuthority, symbolObjectAuthority };
