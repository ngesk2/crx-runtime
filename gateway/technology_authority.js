const crypto = require('crypto');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');

/**
 * TechnologyAuthority
 * 
 * Phase 9.5 — Technology Authority Infrastructure Selection
 * 
 * Constitutional authority for managing immutable Technology Manifests.
 * Owns TechnologyManifest (constitutional identity, versions, checksums, compatibility, capabilities).
 * Does NOT contain endpoints, ports, namespaces, credentials (those belong to PlatformAuthority).
 * 
 * Constitutional authorities request only canonical capabilities:
 * - ArtifactStore
 * - InferenceEngine
 * - EmbeddingEngine
 * - VectorStore
 * 
 * Technology Authority selects concrete implementations:
 * - Ollama, OpenAI, Claude, vLLM (for InferenceEngine)
 * - PostgreSQL, filesystem (for ArtifactStore)
 * - Qdrant, alternatives (for VectorStore)
 * - Various providers (for EmbeddingEngine)
 */
class TechnologyAuthority {
  constructor() {
    this._technologyManifests = new Map(); // hash -> manifest
    this._currentManifestHash = null;
    this._approvedVersions = new Map(); // component -> versions
    this._compatibilityMatrix = new Map(); // component -> compatibility
    this._adapterWitnesses = new Map(); // adapter_id -> witness_hash
    this._replayWitnesses = new Map(); // replay_id -> witness_hash
    
    // Capability to implementation mappings
    this._capabilityImplementations = new Map();
    this._initializeCapabilityMappings();
    
    // Capability permissions
    this._capabilityPermissions = new Map();
    this._initializeCapabilityPermissions();
    
    // Capability resolution history (for witnesses)
    this._resolutionHistory = [];
  }

  /**
   * Initialize capability mappings
   */
  _initializeCapabilityMappings() {
    // InferenceEngine implementations
    this._capabilityImplementations.set('InferenceEngine', {
      implementations: ['ollama', 'openai', 'claude', 'vllm'],
      default: 'ollama',
      adapters: {
        ollama: './adapters/ollama_adapter',
        openai: './adapters/openai_adapter',
        claude: './adapters/claude_adapter',
        vllm: './adapters/vllm_adapter'
      }
    });

    // ArtifactStore implementations
    this._capabilityImplementations.set('ArtifactStore', {
      implementations: ['postgresql', 'filesystem', 'mongodb'],
      default: 'postgresql',
      adapters: {
        postgresql: './adapters/postgresql_adapter',
        filesystem: './adapters/filesystem_adapter',
        mongodb: './adapters/mongodb_adapter'
      }
    });

    // VectorStore implementations
    this._capabilityImplementations.set('VectorStore', {
      implementations: ['qdrant', 'pinecone', 'milvus', 'weaviate'],
      default: 'qdrant',
      adapters: {
        qdrant: './adapters/qdrant_adapter',
        pinecone: './adapters/pinecone_adapter',
        milvus: './adapters/milvus_adapter',
        weaviate: './adapters/weaviate_adapter'
      }
    });

    // EmbeddingEngine implementations
    this._capabilityImplementations.set('EmbeddingEngine', {
      implementations: ['ollama', 'openai', 'huggingface', 'cohere'],
      default: 'ollama',
      adapters: {
        ollama: './adapters/ollama_embedding_adapter',
        openai: './adapters/openai_embedding_adapter',
        huggingface: './adapters/huggingface_adapter',
        cohere: './adapters/cohere_adapter'
      }
    });
  }

  /**
   * Initialize capability permissions
   */
  _initializeCapabilityPermissions() {
    // Default permissions: all capabilities allowed
    this._capabilityPermissions.set('InferenceEngine', {
      allowed: true,
      required_authorization: false,
      max_concurrent: 10
    });
    
    this._capabilityPermissions.set('ArtifactStore', {
      allowed: true,
      required_authorization: false,
      max_concurrent: 50
    });
    
    this._capabilityPermissions.set('VectorStore', {
      allowed: true,
      required_authorization: false,
      max_concurrent: 20
    });
    
    this._capabilityPermissions.set('EmbeddingEngine', {
      allowed: true,
      required_authorization: false,
      max_concurrent: 15
    });
  }

  /**
   * Resolve capability to implementation
   * @param {string} capability - Canonical capability name
   * @param {Object} preferences - Implementation preferences
   * @returns {Object} Implementation resolution
   */
  resolveCapability(capability, preferences = {}) {
    const capabilityConfig = this._capabilityImplementations.get(capability);
    
    if (!capabilityConfig) {
      throw new Error(`Unknown capability: ${capability}`);
    }

    // Check capability permissions
    const permissionCheck = this._checkCapabilityPermission(capability, preferences);
    if (!permissionCheck.allowed) {
      throw new Error(`Capability ${capability} not allowed: ${permissionCheck.reason}`);
    }

    // Select implementation based on preferences
    let implementation = preferences.implementation || capabilityConfig.default;
    
    // Validate implementation exists
    if (!capabilityConfig.implementations.includes(implementation)) {
      throw new Error(`Implementation ${implementation} not available for capability ${capability}`);
    }

    // Check compatibility
    const compatibilityCheck = this._checkCompatibility(capability, implementation, preferences);
    if (!compatibilityCheck.compatible) {
      throw new Error(`Implementation ${implementation} incompatible: ${compatibilityCheck.reason}`);
    }

    const resolution = {
      capability: capability,
      implementation: implementation,
      adapter_path: capabilityConfig.adapters[implementation],
      compatible: true,
      metadata: {
        version: this._getImplementationVersion(capability, implementation),
        capabilities: this._getImplementationCapabilities(capability, implementation)
      }
    };

    // Record resolution for witness
    this._recordResolution(resolution, preferences);

    return resolution;
  }

  /**
   * Check capability permission
   * @param {string} capability - Capability name
   * @param {Object} preferences - Preferences
   * @returns {Object} Permission check result
   */
  _checkCapabilityPermission(capability, preferences) {
    const permissions = this._capabilityPermissions.get(capability);
    
    if (!permissions) {
      return { allowed: false, reason: 'No permission configuration for capability' };
    }

    if (!permissions.allowed) {
      return { allowed: false, reason: 'Capability not allowed' };
    }

    if (permissions.required_authorization && !preferences.authorized) {
      return { allowed: false, reason: 'Authorization required' };
    }

    return { allowed: true };
  }

  /**
   * Record capability resolution for witness
   * @param {Object} resolution - Resolution result
   * @param {Object} preferences - Original preferences
   */
  _recordResolution(resolution, preferences) {
    const record = {
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      capability: resolution.capability,
      implementation: resolution.implementation,
      version: resolution.metadata.version,
      requested_by: preferences.requester || 'unknown'
    };

    this._resolutionHistory.push(record);

    // Limit history size
    if (this._resolutionHistory.length > 1000) {
      this._resolutionHistory.shift();
    }
  }

  /**
   * Get capability resolution witness
   * @returns {Object} Resolution witness
   */
  getCapabilityResolutionWitness() {
    return {
      total_resolutions: this._resolutionHistory.length,
      resolutions: this._resolutionHistory,
      capabilities_configured: Array.from(this._capabilityImplementations.keys())
    };
  }

  /**
   * Check implementation compatibility
   * @param {string} capability - Capability name
   * @param {string} implementation - Implementation name
   * @param {Object} preferences - Preferences
   * @returns {Object} Compatibility check result
   */
  _checkCompatibility(capability, implementation, preferences) {
    // Check if implementation is approved
    const approvedVersions = this._approvedVersions.get(capability);
    if (approvedVersions && !approvedVersions.includes(implementation)) {
      return {
        compatible: false,
        reason: `Implementation ${implementation} not approved for ${capability}`
      };
    }

    // Check compatibility matrix
    const compatibilityMatrix = this._compatibilityMatrix.get(capability);
    if (compatibilityMatrix) {
      const compatibleWith = compatibilityMatrix.get(implementation);
      if (compatibleWith && preferences.required_capabilities) {
        const missingCapabilities = preferences.required_capabilities.filter(
          cap => !compatibleWith.includes(cap)
        );
        if (missingCapabilities.length > 0) {
          return {
            compatible: false,
            reason: `Missing required capabilities: ${missingCapabilities.join(', ')}`
          };
        }
      }
    }

    return { compatible: true };
  }

  /**
   * Get implementation version
   * @param {string} capability - Capability name
   * @param {string} implementation - Implementation name
   * @returns {string} Version
   */
  _getImplementationVersion(capability, implementation) {
    const versionKey = `${capability}_${implementation}`;
    return this._approvedVersions.get(versionKey) || '1.0.0';
  }

  /**
   * Get implementation capabilities
   * @param {string} capability - Capability name
   * @param {string} implementation - Implementation name
   * @returns {Array} Capabilities
   */
  _getImplementationCapabilities(capability, implementation) {
    const compatibilityMatrix = this._compatibilityMatrix.get(capability);
    if (compatibilityMatrix) {
      return compatibilityMatrix.get(implementation) || [];
    }
    return [];
  }

  /**
   * Register capability implementation
   * @param {string} capability - Capability name
   * @param {string} implementation - Implementation name
   * @param {string} adapterPath - Adapter path
   * @param {Object} metadata - Implementation metadata
   */
  registerCapabilityImplementation(capability, implementation, adapterPath, metadata = {}) {
    if (!this._capabilityImplementations.has(capability)) {
      this._capabilityImplementations.set(capability, {
        implementations: [],
        default: implementation,
        adapters: {}
      });
    }

    const capabilityConfig = this._capabilityImplementations.get(capability);
    
    if (!capabilityConfig.implementations.includes(implementation)) {
      capabilityConfig.implementations.push(implementation);
    }
    
    capabilityConfig.adapters[implementation] = adapterPath;
    
    // Track version
    if (metadata.version) {
      const versionKey = `${capability}_${implementation}`;
      this._approvedVersions.set(versionKey, metadata.version);
    }

    // Track compatibility
    if (metadata.compatible_with) {
      if (!this._compatibilityMatrix.has(capability)) {
        this._compatibilityMatrix.set(capability, new Map());
      }
      this._compatibilityMatrix.get(capability).set(implementation, metadata.compatible_with);
    }
  }

  /**
   * Get available implementations for capability
   * @param {string} capability - Capability name
   * @returns {Array} Available implementations
   */
  getAvailableImplementations(capability) {
    const capabilityConfig = this._capabilityImplementations.get(capability);
    if (!capabilityConfig) {
      return [];
    }
    return capabilityConfig.implementations;
  }

  /**
   * Get all available capabilities
   * @returns {Array} Available capabilities
   */
  getAvailableCapabilities() {
    return Array.from(this._capabilityImplementations.keys());
  }

  /**
   * Create a new Technology Manifest
   * @param {Object} technologyStack - Technology stack definition
   * @returns {Object} Frozen Technology Manifest
   */
  async createTechnologyManifest(technologyStack) {
    const manifest = {
      manifest_id: this._generateManifestId(),
      version: this._getNextVersion(),
      ...technologyStack,
      manifest_metadata: {
        created_by: "TechnologyAuthority",
        frozen: true,
        hash: null,
        previous_manifest_hash: this._currentManifestHash,
        approval_reference: null
      }
    };

    manifest.manifest_metadata.hash = this._computeManifestHash(manifest);
    const frozenManifest = this._freezeManifest(manifest);

    await this._storeManifest(frozenManifest);
    this._currentManifestHash = frozenManifest.manifest_metadata.hash;

    return frozenManifest;
  }

  /**
   * Get Technology Manifest by hash
   * @param {string} manifestHash - Manifest hash
   * @returns {Object} Technology Manifest
   */
  async getTechnologyManifest(manifestHash) {
    const manifest = this._technologyManifests.get(manifestHash);
    if (!manifest) {
      throw new Error(`Technology Manifest not found: ${manifestHash}`);
    }
    return manifest;
  }

  /**
   * Get current Technology Manifest
   * @returns {Object} Current Technology Manifest
   */
  async getCurrentTechnologyManifest() {
    if (!this._currentManifestHash) {
      throw new Error("No current technology manifest");
    }
    return await this.getTechnologyManifest(this._currentManifestHash);
  }

  /**
   * Track approved OSS version
   * @param {string} component - Component name
   * @param {string} version - Version
   * @param {Object} metadata - Version metadata
   */
  async trackOSSVersion(component, version, metadata) {
    if (!this._approvedVersions.has(component)) {
      this._approvedVersions.set(component, []);
    }
    
    const versions = this._approvedVersions.get(component);
    if (!versions.includes(version)) {
      versions.push(version);
    }
    
    // Track compatibility matrix
    if (metadata && metadata.compatible_with) {
      if (!this._compatibilityMatrix.has(component)) {
        this._compatibilityMatrix.set(component, new Map());
      }
      this._compatibilityMatrix.get(component).set(version, metadata.compatible_with);
    }
  }

  /**
   * Get approved versions for component
   * @param {string} component - Component name
   * @returns {Array} Approved versions
   */
  async getApprovedVersions(component) {
    return this._approvedVersions.get(component) || [];
  }

  /**
   * Get compatibility matrix for component
   * @param {string} component - Component name
   * @returns {Map} Compatibility matrix
   */
  async getCompatibilityMatrix(component) {
    return this._compatibilityMatrix.get(component) || new Map();
  }

  /**
   * Verify manifest integrity
   * @param {Object} manifest - Technology Manifest
   * @returns {boolean} Integrity verification result
   */
  async verifyManifestIntegrity(manifest) {
    // Verify manifest is frozen
    if (!manifest.manifest_metadata.frozen) {
      return false;
    }

    // Verify hash matches content
    const computedHash = this._computeManifestHash(manifest);
    if (computedHash !== manifest.manifest_metadata.hash) {
      return false;
    }

    // Verify previous manifest hash exists if not first manifest
    if (manifest.manifest_metadata.previous_manifest_hash === null && this._technologyManifests.size > 0) {
      return false;
    }

    return true;
  }

  /**
   * Compute manifest hash
   * @param {Object} manifest - Technology Manifest
   * @returns {string} SHA256 hash
   */
  _computeManifestHash(manifest) {
    return CanonicalAuthority.hash(manifest);
  }

  /**
   * Freeze manifest to prevent mutations
   * @param {Object} manifest - Technology Manifest
   * @returns {Object} Frozen manifest
   */
  _freezeManifest(manifest) {
    return JSON.parse(JSON.stringify(manifest));
  }

  /**
   * Store manifest
   * @param {Object} manifest - Technology Manifest
   */
  async _storeManifest(manifest) {
    this._technologyManifests.set(manifest.manifest_metadata.hash, manifest);
    // TODO: Persist to storage
  }

  /**
   * Generate manifest ID
   * @returns {string} Manifest ID
   * 
   * Note: Uses only version number, no timestamps for constitutional determinism
   */
  _generateManifestId() {
    return `tm_${this._getNextVersion()}`;
  }

  /**
   * Get next version number
   * @returns {string} Version number
   */
  _getNextVersion() {
    return (this._technologyManifests.size + 1).toString();
  }

  /**
   * Register adapter witness
   * @param {string} adapterId - Adapter ID
   * @param {string} witnessHash - Witness hash
   */
  async registerAdapterWitness(adapterId, witnessHash) {
    this._adapterWitnesses.set(adapterId, witnessHash);
  }

  /**
   * Get adapter witness hash
   * @param {string} adapterId - Adapter ID
   * @returns {string} Witness hash
   */
  async getAdapterWitnessHash(adapterId) {
    return this._adapterWitnesses.get(adapterId);
  }

  /**
   * Register replay witness
   * @param {string} replayId - Replay ID
   * @param {string} witnessHash - Witness hash
   */
  async registerReplayWitness(replayId, witnessHash) {
    this._replayWitnesses.set(replayId, witnessHash);
  }

  /**
   * Get replay witness hash
   * @param {string} replayId - Replay ID
   * @returns {string} Witness hash
   */
  async getReplayWitnessHash(replayId) {
    return this._replayWitnesses.get(replayId);
  }

  /**
   * Update technology manifest with adapter witness
   * @param {string} manifestHash - Technology Manifest hash
   * @param {string} component - Component name
   * @param {string} adapterWitnessHash - Adapter witness hash
   */
  async updateManifestWithAdapterWitness(manifestHash, component, adapterWitnessHash) {
    const manifest = await this.getTechnologyManifest(manifestHash);
    
    if (manifest[component]) {
      manifest[component].adapter_witness_hash = adapterWitnessHash;
      manifest.manifest_metadata.hash = this._computeManifestHash(manifest);
      await this._storeManifest(manifest);
    }
  }

  /**
   * Set capability permission
   * @param {string} capability - Capability name
   * @param {Object} permissions - Permission configuration
   */
  setCapabilityPermission(capability, permissions) {
    this._capabilityPermissions.set(capability, permissions);
  }

  /**
   * Get capability permission
   * @param {string} capability - Capability name
   * @returns {Object} Permission configuration
   */
  getCapabilityPermission(capability) {
    return this._capabilityPermissions.get(capability);
  }

  /**
   * Clear resolution history
   */
  clearResolutionHistory() {
    this._resolutionHistory = [];
  }

  /**
   * Validate capability request
   * @param {string} capability - Capability name
   * @param {Object} preferences - Preferences
   * @returns {Object} Validation result
   */
  validateCapabilityRequest(capability, preferences = {}) {
    const errors = [];
    const warnings = [];

    // Check capability exists
    const capabilityConfig = this._capabilityImplementations.get(capability);
    if (!capabilityConfig) {
      errors.push(`Unknown capability: ${capability}`);
      return { valid: false, errors, warnings };
    }

    // Check permissions
    const permissionCheck = this._checkCapabilityPermission(capability, preferences);
    if (!permissionCheck.allowed) {
      errors.push(`Permission denied: ${permissionCheck.reason}`);
    }

    // Check implementation preference
    if (preferences.implementation) {
      if (!capabilityConfig.implementations.includes(preferences.implementation)) {
        errors.push(`Invalid implementation: ${preferences.implementation}`);
      }
    } else {
      warnings.push(`No implementation specified, using default: ${capabilityConfig.default}`);
    }

    // Check compatibility
    if (preferences.implementation) {
      const compatibilityCheck = this._checkCompatibility(capability, preferences.implementation, preferences);
      if (!compatibilityCheck.compatible) {
        errors.push(`Compatibility check failed: ${compatibilityCheck.reason}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get capability statistics
   * @returns {Object} Capability statistics
   */
  getCapabilityStatistics() {
    const stats = {
      total_capabilities: this._capabilityImplementations.size,
      capabilities_configured: Array.from(this._capabilityImplementations.keys()),
      total_resolutions: this._resolutionHistory.length,
      resolutions_by_capability: {},
      resolutions_by_implementation: {}
    };

    // Count resolutions by capability
    for (const record of this._resolutionHistory) {
      if (!stats.resolutions_by_capability[record.capability]) {
        stats.resolutions_by_capability[record.capability] = 0;
      }
      stats.resolutions_by_capability[record.capability]++;

      if (!stats.resolutions_by_implementation[record.implementation]) {
        stats.resolutions_by_implementation[record.implementation] = 0;
      }
      stats.resolutions_by_implementation[record.implementation]++;
    }

    return stats;
  }
}

module.exports = { TechnologyAuthority };
