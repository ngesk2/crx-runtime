/**
 * Deterministic ID Authority (DEPRECATED)
 * 
 * Constitutional Violation: Multiple identity authorities.
 * 
 * This file is deprecated and will be removed.
 * All ID generation should use IdentityAuthority.generateFromCanonicalHash().
 * 
 * Migration Path:
 * - Replace deterministicIdAuthority.generateIdFromObject(obj) with:
 *   1. const canonicalBytes = CanonicalBytes.serialize(obj);
 *   2. const id = identityAuthority.generateFromCanonicalHash(canonicalBytes, 'type');
 * 
 * - Replace deterministicIdAuthority.generateIdFromHash(hash) with:
 *   1. const canonicalBytes = Buffer.from(hash, 'hex');
 *   2. const id = identityAuthority.generateFromCanonicalHash(canonicalBytes, 'type');
 */

const { CanonicalBytes } = require('./canonical_authority.js');
const { identityAuthority } = require('./identity_authority.js');

class DeterministicIdAuthority {
  /**
   * Generate ID from object (DEPRECATED)
   * 
   * @param {Object} obj - Object to generate ID from
   * @param {string} type - Object type
   * @returns {string} Deterministic ID
   */
  generateIdFromObject(obj, type = 'object') {
    console.warn('[DEPRECATED] deterministicIdAuthority.generateIdFromObject() is deprecated. Use IdentityAuthority.generateFromCanonicalHash() instead.');
    const canonicalBytes = CanonicalBytes.serialize(obj);
    return identityAuthority.generateFromCanonicalHash(canonicalBytes, type);
  }

  /**
   * Generate ID from hash (DEPRECATED)
   * 
   * @param {string} hash - Hash to generate ID from
   * @param {string} type - Object type
   * @returns {string} Deterministic ID
   */
  generateIdFromHash(hash, type = 'hash') {
    console.warn('[DEPRECATED] deterministicIdAuthority.generateIdFromHash() is deprecated. Use IdentityAuthority.generateFromCanonicalHash() instead.');
    const canonicalBytes = Buffer.from(hash, 'hex');
    return identityAuthority.generateFromCanonicalHash(canonicalBytes, type);
  }
}

// Singleton instance (for backward compatibility)
const deterministicIdAuthority = new DeterministicIdAuthority();

module.exports = { DeterministicIdAuthority, deterministicIdAuthority };
