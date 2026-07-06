/**
 * Runtime Identity Authority
 *
 * Priority 3: Runtime Identity Separation
 *
 * Constitutional Constraint:
 * RuntimeIdentity is provenance only.
 * It does NOT influence replay hashes.
 *
 * RuntimeIdentity contains:
 * - Machine (platform, architecture, hostname)
 * - Runtime (node version, uptime)
 * - CPU (model, count)
 * - Memory (total, free)
 * 
 * ReplayIdentity (separate authority) contains:
 * - Canonical bytes
 * - Canonical reducer graph
 * - Canonical authority graph
 * - Canonical replay transcript
 * 
 * Only ReplayIdentity may influence:
 * - ReplayHash
 * - CanonicalHash
 * - WitnessHash
 * - CanonicalEventHash
 */

const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
const os = require('os');

class RuntimeIdentityAuthority {
  constructor() {
    this._runtimeId = null;
    this._fingerprint = null;
    this._identityVersion = '2.0.0'; // Updated for separation
    this._initialized = false;
  }

  /**
   * Initialize runtime identity
   * 
   * @param {Object} config - Runtime configuration
   * @returns {string} Runtime ID
   */
  initialize(config = {}) {
    if (this._initialized) {
      return this._runtimeId;
    }

    const fingerprint = this._generateFingerprint(config);
    this._fingerprint = fingerprint;
    this._runtimeId = this._generateRuntimeId(fingerprint);
    this._initialized = true;

    return this._runtimeId;
  }

  /**
   * Get runtime ID
   * 
   * @returns {string} Runtime ID
   */
  getRuntimeId() {
    if (!this._initialized) {
      throw new Error('RuntimeIdentityAuthority not initialized. Call initialize() first.');
    }
    return this._runtimeId;
  }

  /**
   * Get runtime fingerprint
   * 
   * @returns {Object} Runtime fingerprint
   */
  getFingerprint() {
    if (!this._initialized) {
      throw new Error('RuntimeIdentityAuthority not initialized. Call initialize() first.');
    }
    return this._fingerprint;
  }

  /**
   * Verify runtime identity
   * 
   * @param {string} runtimeId - Runtime ID to verify
   * @param {Object} expectedFingerprint - Expected fingerprint
   * @returns {boolean} True if identity matches
   */
  verifyIdentity(runtimeId, expectedFingerprint) {
    const computedId = this._generateRuntimeId(expectedFingerprint);
    return computedId === runtimeId;
  }

  /**
   * Generate canonical runtime fingerprint (provenance only)
   * 
   * @param {Object} config - Runtime configuration
   * @returns {Object} Canonical fingerprint
   */
  _generateFingerprint(config = {}) {
    const fingerprint = {
      // Core runtime identity (provenance only)
      node_version: process.version,
      platform: os.platform(),
      architecture: os.arch(),
      hostname: os.hostname(),
      cpu_count: os.cpus().length,
      total_memory: os.totalmem(),
      
      // Platform profile (provenance only)
      PlatformProfile: {
        platform: os.platform(),
        architecture: os.arch(),
        cpu_model: os.cpus()[0]?.model || 'unknown',
        cpu_count: os.cpus().length,
        total_memory: os.totalmem(),
        free_memory: os.freemem(),
        uptime: os.uptime()
      },
      
      // Engine profile (provenance only)
      EngineProfile: {
        node_version: process.version,
        v8_version: process.versions.v8,
        openssl_version: process.versions.openssl,
        uv_version: process.versions.uv,
        zlib_version: process.versions.zlib,
        ares_version: process.versions.ares,
        modules: process.versions.modules,
        http_parser: process.versions.http_parser
      },
      
      // Removed: startup_timestamp (moved to ReplayIdentity)
      // Removed: authority_versions (moved to ReplayIdentity)
      // Removed: ConstitutionVersion, CanonicalVersion (moved to ReplayIdentity)
      
      identity_version: this._identityVersion,
      purpose: 'provenance' // Explicitly mark as provenance only
    };

    // Add canonical hash of fingerprint
    fingerprint.fingerprint_hash = CanonicalAuthority.hash(fingerprint);

    return fingerprint;
  }

  /**
   * Generate runtime ID from fingerprint
   * 
   * @param {Object} fingerprint - Runtime fingerprint
   * @returns {string} Runtime ID
   */
  _generateRuntimeId(fingerprint) {
    const canonicalData = {
      fingerprint_hash: fingerprint.fingerprint_hash,
      identity_version: this._identityVersion,
      purpose: 'provenance'
    };
    const hash = CanonicalAuthority.hash(canonicalData);
    return `runtime_${hash.substring(0, 16)}`;
  }

  /**
   * Get identity version
   * 
   * @returns {string} Identity version
   */
  getIdentityVersion() {
    return this._identityVersion;
  }

  /**
   * Check if initialized
   * 
   * @returns {boolean} Initialization status
   */
  isInitialized() {
    return this._initialized;
  }

  /**
   * Reset runtime identity (for testing only)
   */
  _reset() {
    this._runtimeId = null;
    this._fingerprint = null;
    this._initialized = false;
  }
}

// Singleton instance
const runtimeIdentityAuthority = new RuntimeIdentityAuthority();

module.exports = {
  RuntimeIdentityAuthority,
  runtimeIdentityAuthority
};
