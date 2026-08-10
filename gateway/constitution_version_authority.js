const { CanonicalAuthority, CanonicalBytes } = require('../ping-runtime/authorities/canonical_authority.js');
const { runtimeFailureAuthority } = require('./runtime_failure_authority');

/**
 * Constitution Version Authority
 * 
 * Architectural Enhancement 9 — Constitution Version Authority
 * 
 * Every transcript, witness, replay, certificate, and hash should explicitly record:
 * 
 * - constitutional schema version
 * - hashing algorithm version
 * - canonical serialization version
 * - replay engine version
 * 
 * This defines a strict deterministic boundary and enables evolution of constitutional rules.
 */

class ConstitutionVersionAuthority {
  constructor() {
    // Removed serializer reference - use CanonicalAuthority directly
    this._failureAuthority = runtimeFailureAuthority;
    this._authorityId = this._generateAuthorityId();
    this._authorityVersion = '5.0.0';
    
    // Current constitutional versions
    this._currentVersions = {
      constitutional_schema: '5.0.0',
      hashing_algorithm: '1.0.0',
      canonical_serialization: '1.0.0',
      replay_engine: '5.0.0',
      witness_authority: '4.0.0',
      transcript_authority: '5.0.0',
      identity_authority: '1.0.0'
    };
    
    // Supported version combinations
    this._supportedVersions = new Map();
    this._initializeSupportedVersions();
    
    // Determinism boundary definition
    this._determinismBoundary = this._defineDeterminismBoundary();
  }

  /**
   * Get current constitutional versions
   * @returns {Object} Current versions
   */
  getCurrentVersions() {
    return { ...this._currentVersions };
  }

  /**
   * Get constitutional version for a component
   * @param {string} component - Component name
   * @returns {string} Version
   */
  getVersion(component) {
    return this._currentVersions[component] || null;
  }

  /**
   * Set constitutional version for a component
   * @param {string} component - Component name
   * @param {string} version - Version
   */
  setVersion(component, version) {
    this._currentVersions[component] = version;
  }

  /**
   * Check if version combination is supported
   * @param {Object} versions - Version object
   * @returns {boolean} Is supported
   */
  isVersionCombinationSupported(versions) {
    const versionKey = this._generateVersionKey(versions);
    return this._supportedVersions.has(versionKey);
  }

  /**
   * Get determinism boundary definition
   * @returns {Object} Determinism boundary
   */
  getDeterminismBoundary() {
    return { ...this._determinismBoundary };
  }

  /**
   * Check if field is within determinism boundary
   * @param {string} field - Field name
   * @returns {boolean} Is within boundary
   */
  isWithinDeterminismBoundary(field) {
    return this._determinismBoundary.included.includes(field);
  }

  /**
   * Check if field is excluded from determinism boundary
   * @param {string} field - Field name
   * @returns {boolean} Is excluded
   */
  isExcludedFromDeterminismBoundary(field) {
    return this._determinismBoundary.excluded.includes(field);
  }

  /**
   * Create version manifest
   * @param {Object} additionalVersions - Additional versions to include
   * @returns {Object} Version manifest
   * 
   * Note: Contains only constitutional versions, no runtime timestamps.
   * Runtime creation timestamps belong in observational metadata, not constitutional state.
   */
  createVersionManifest(additionalVersions = {}) {
    return {
      ...this._currentVersions,
      ...additionalVersions,
      manifest_id: this._generateManifestId()
    };
  }

  /**
   * Verify version compatibility
   * @param {Object} manifest1 - First version manifest
   * @param {Object} manifest2 - Second version manifest
   * @returns {Object} Compatibility result
   */
  verifyVersionCompatibility(manifest1, manifest2) {
    const incompatibilities = [];

    // Check constitutional schema version
    if (manifest1.constitutional_schema !== manifest2.constitutional_schema) {
      incompatibilities.push({
        component: 'constitutional_schema',
        version1: manifest1.constitutional_schema,
        version2: manifest2.constitutional_schema
      });
    }

    // Check hashing algorithm version
    if (manifest1.hashing_algorithm !== manifest2.hashing_algorithm) {
      incompatibilities.push({
        component: 'hashing_algorithm',
        version1: manifest1.hashing_algorithm,
        version2: manifest2.hashing_algorithm
      });
    }

    // Check canonical serialization version
    if (manifest1.canonical_serialization !== manifest2.canonical_serialization) {
      incompatibilities.push({
        component: 'canonical_serialization',
        version1: manifest1.canonical_serialization,
        version2: manifest2.canonical_serialization
      });
    }

    return {
      compatible: incompatibilities.length === 0,
      incompatibilities: incompatibilities
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
   * Initialize supported version combinations
   */
  _initializeSupportedVersions() {
    // Phase 4.0 compatibility
    this._supportedVersions.set('4.0.0-1.0.0-1.0.0-4.0.0', {
      constitutional_schema: '4.0.0',
      hashing_algorithm: '1.0.0',
      canonical_serialization: '1.0.0',
      replay_engine: '4.0.0'
    });

    // Phase 5.0 compatibility
    this._supportedVersions.set('5.0.0-1.0.0-1.0.0-5.0.0', {
      constitutional_schema: '5.0.0',
      hashing_algorithm: '1.0.0',
      canonical_serialization: '1.0.0',
      replay_engine: '5.0.0'
    });
  }

  /**
   * Define determinism boundary
   * @returns {Object} Determinism boundary definition
   */
  _defineDeterminismBoundary() {
    return {
      description: 'Explicit deterministic boundary for constitutional replay',
      
      // Fields included in deterministic hashing
      included: [
        'prompt_hash',
        'model_digest',
        'inference_id',
        'completion_hash',
        'state_hash',
        'tool_id',
        'parameters_hash',
        'output_hash',
        'chunk_id',
        'content_hash',
        'transcript_hash',
        'witness_hash'
      ],
      
      // Fields excluded from deterministic hashing (runtime-only)
      excluded: [
        'timestamp',
        'created_at',
        'registered_at',
        'executed_at',
        'started_at',
        'ended_at',
        'uuid',
        'uuidv4',
        'process_id',
        'pid',
        'thread_id',
        'os_scheduling',
        'filesystem_inode_order',
        'network_timing',
        'wall_clock_time',
        'execution_time_ms',
        'latency_ms',
        'runtime_metadata'
      ],
      
      // Canonical execution state only
      constitutional_state: [
        'canonical_prompt',
        'canonical_parameters',
        'canonical_completion',
        'canonical_chunks',
        'canonical_tools',
        'canonical_state'
      ]
    };
  }

  /**
   * Generate version key
   * @param {Object} versions - Version object
   * @returns {string} Version key
   */
  _generateVersionKey(versions) {
    return [
      versions.constitutional_schema,
      versions.hashing_algorithm,
      versions.canonical_serialization,
      versions.replay_engine
    ].join('-');
  }

  /**
   * Generate manifest ID
   * @returns {strong} Manifest ID
   * 
   * Note: Uses only constitutional versions, no runtime timestamps.
   * Runtime creation timestamps belong in observational metadata, not constitutional state.
   */
  _generateManifestId() {
    const manifestData = {
      versions: this._currentVersions
    };
    const hash = CanonicalAuthority.hash(manifestData);
    return `manifest_${hash.substring(0, 16)}`;
  }

  /**
   * Generate authority ID
   * @returns {string} Authority ID
   */
  _generateAuthorityId() {
    const authorityData = {
      authority_version: this._authorityVersion,
      constitutional_version: '5.0.0'
    };
    const hash = CanonicalAuthority.hash(authorityData);
    return `constitution_version_${hash.substring(0, 16)}`;
  }
}

// Singleton instance
const constitutionVersionAuthority = new ConstitutionVersionAuthority();

module.exports = { ConstitutionVersionAuthority, constitutionVersionAuthority };
