/**
 * Constitutional Authority Registry
 * 
 * Phase 45 Patch 45.1 — Pure Metadata Registry
 * 
 * Constitutional Constraint: Registry provides only metadata, not runtime.
 * 
 * Removed (moved to ExecutionRuntime):
 * - Runtime instance cache
 * - Dynamic require()
 * - Module loading
 * - Object construction
 * - initialize() orchestration
 * 
 * Registry provides only:
 * - descriptor lookup
 * - dependency graph
 * - capability lookup
 * - descriptor integrity verification
 * - constitutional hashes
 * 
 * ExecutionRuntime is responsible for:
 * - authority instantiation
 * - dependency injection
 * - lifecycle
 * - execution
 */

const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { identityAuthority } = require('./identity_authority');
const { CanonicalAuthority } = require('./canonical_authority');

class ConstitutionalAuthorityRegistry {
  constructor(postgresPool) {
    this._postgres = postgresPool;
    this._authorityDescriptors = new Map(); // authority_id → descriptor
  }

  /**
   * Initialize authority registry (metadata only)
   */
  async initialize() {
    console.log('[AuthorityRegistry] Initializing constitutional authority registry (metadata only)');

    // Load authority descriptors
    await this._loadAuthorityDescriptors();

    console.log('[AuthorityRegistry] Constitutional authority registry initialized');
  }

  /**
   * Load authority descriptors
   */
  async _loadAuthorityDescriptors() {
    try {
      const result = await this._postgres.query(`
        SELECT authority_id, descriptor_data
        FROM authority_descriptors
      `);

      for (const row of result.rows) {
        this._authorityDescriptors.set(row.authority_id, row.descriptor_data);
      }

      // Load default descriptors if none exist
      if (this._authorityDescriptors.size === 0) {
        await this._loadDefaultDescriptors();
      }

      console.log(`[AuthorityRegistry] Loaded ${this._authorityDescriptors.size} authority descriptors`);
    } catch (error) {
      console.error('[AuthorityRegistry] Failed to load authority descriptors:', error.message);
    }
  }

  /**
   * Load default authority descriptors
   */
  async _loadDefaultDescriptors() {
    const defaultDescriptors = [
      {
        authority_id: 'replay-authority',
        name: 'ReplayAuthority',
        version: '1.0.0',
        description: 'Replay verification and evidence generation',
        capabilities: ['verify', 'produce_evidence', 'record_replay'],
        required_inputs: ['sandbox', 'mission'],
        produced_artifacts: ['ReplayEvidence'],
        dependencies: [],
        implementation_module: './replay_authority',
      },
      {
        authority_id: 'witness-authority',
        name: 'WitnessAuthority',
        version: '1.0.0',
        description: 'Witness verification and chain generation',
        capabilities: ['verify', 'produce_evidence', 'record_witness'],
        required_inputs: ['replay', 'sandbox'],
        produced_artifacts: ['WitnessEvidence'],
        dependencies: ['replay-authority'],
        implementation_module: './witness_recorder',
      },
      {
        authority_id: 'compiler-authority',
        name: 'CompilerAuthority',
        version: '1.0.0',
        description: 'Workflow compilation to IR',
        capabilities: ['compile', 'generate_ir'],
        required_inputs: ['mission'],
        produced_artifacts: ['WorkflowIR'],
        dependencies: [],
        implementation_module: './temporal_workflow_compiler',
      },
      {
        authority_id: 'parser-authority',
        name: 'ParserAuthority',
        version: '1.0.0',
        description: 'Grammar-based parsing',
        capabilities: ['parse', 'generate_ast'],
        required_inputs: ['source_code'],
        produced_artifacts: ['AST'],
        dependencies: [],
        implementation_module: './treesitter_parser_authority',
      },
      {
        authority_id: 'policy-engine',
        name: 'PolicyEngine',
        version: '1.0.0',
        description: 'Policy evaluation and decision making',
        capabilities: ['evaluate', 'decide', 'approve'],
        required_inputs: ['evidence'],
        produced_artifacts: ['PolicyDecision'],
        dependencies: [],
        implementation_module: './constitutional_policy_engine',
      },
      {
        authority_id: 'artifact-authority',
        name: 'ArtifactAuthority',
        version: '1.0.0',
        description: 'Artifact storage and graph management',
        capabilities: ['store', 'retrieve', 'verify'],
        required_inputs: ['artifact_data'],
        produced_artifacts: ['Artifact'],
        dependencies: [],
        implementation_module: './artifact_authority',
      },
      {
        authority_id: 'schema-authority',
        name: 'SchemaAuthority',
        version: '1.0.0',
        description: 'Schema validation and management',
        capabilities: ['validate', 'register', 'retrieve'],
        required_inputs: ['object', 'schema'],
        produced_artifacts: ['ValidationResult'],
        dependencies: [],
        implementation_module: './constitutional_schema_authority',
      },
      {
        authority_id: 'sandbox-authority',
        name: 'SandboxAuthority',
        version: '1.0.0',
        description: 'Sandbox creation and management',
        capabilities: ['create', 'apply', 'rollback', 'integrate'],
        required_inputs: ['mission'],
        produced_artifacts: ['Sandbox'],
        dependencies: [],
        implementation_module: './replay_sandbox',
      },
      {
        authority_id: 'commit-authority',
        name: 'CommitAuthority',
        version: '1.0.0',
        description: 'Git commit management',
        capabilities: ['commit', 'rollback'],
        required_inputs: ['manifest'],
        produced_artifacts: ['CommitManifest'],
        dependencies: [],
        implementation_module: './constitutional_git_commit_manager',
      },
      {
        authority_id: 'reflection-authority',
        name: 'ReflectionAuthority',
        version: '1.0.0',
        description: 'Runtime self-inspection',
        capabilities: ['list_authorities', 'list_policies', 'list_schemas'],
        required_inputs: [],
        produced_artifacts: ['ReflectionData'],
        dependencies: [],
        implementation_module: './constitutional_reflection_authority',
      },
    ];

    for (const descriptor of defaultDescriptors) {
      // Compute constitutional hash
      descriptor.constitutional_hash = CanonicalAuthority.hash({
        authority_id: descriptor.authority_id,
        name: descriptor.name,
        version: descriptor.version,
        capabilities: descriptor.capabilities,
        required_inputs: descriptor.required_inputs,
        produced_artifacts: descriptor.produced_artifacts,
        dependencies: descriptor.dependencies,
      });

      // Compute witness hash
      descriptor.witness_hash = CanonicalAuthority.hash({
        authority_id: descriptor.authority_id,
        constitutional_hash: descriptor.constitutional_hash,
        timestamp: constitutionalTimeAuthority.now(),
      });

      this._authorityDescriptors.set(descriptor.authority_id, descriptor);
      await this._persistDescriptor(descriptor.authority_id, descriptor);
    }

    console.log('[AuthorityRegistry] Loaded default authority descriptors');
  }

  /**
   * Register authority descriptor
   * 
   * @param {Object} descriptor - Authority descriptor
   * @returns {Object} Registered descriptor
   */
  async registerDescriptor(descriptor) {
    console.log(`[AuthorityRegistry] Registering authority descriptor ${descriptor.authority_id}`);

    // Compute constitutional hash
    descriptor.constitutional_hash = CanonicalAuthority.hash({
      authority_id: descriptor.authority_id,
      name: descriptor.name,
      version: descriptor.version,
      capabilities: descriptor.capabilities,
      required_inputs: descriptor.required_inputs,
      produced_artifacts: descriptor.produced_artifacts,
      dependencies: descriptor.dependencies,
    });

    // Compute witness hash
    descriptor.witness_hash = CanonicalAuthority.hash({
      authority_id: descriptor.authority_id,
      constitutional_hash: descriptor.constitutional_hash,
      timestamp: constitutionalTimeAuthority.now(),
    });

    // Store descriptor
    this._authorityDescriptors.set(descriptor.authority_id, descriptor);
    await this._persistDescriptor(descriptor.authority_id, descriptor);

    console.log(`[AuthorityRegistry] Registered authority descriptor ${descriptor.authority_id}`);
    return descriptor;
  }

  /**
   * Get authority descriptor
   * 
   * @param {string} authorityId - Authority identifier
   * @returns {Object} Authority descriptor
   */
  getDescriptor(authorityId) {
    return this._authorityDescriptors.get(authorityId);
  }

  /**
   * Get all authority descriptors
   * 
   * @returns {Array} Authority descriptors
   */
  getAllDescriptors() {
    return Array.from(this._authorityDescriptors.values());
  }

  /**
   * Get authorities by capability
   * 
   * @param {string} capability - Capability name
   * @returns {Array} Authorities with capability
   */
  getAuthoritiesByCapability(capability) {
    return Array.from(this._authorityDescriptors.values())
      .filter(descriptor => descriptor.capabilities.includes(capability));
  }

  /**
   * Get authorities that produce artifact
   * 
   * @param {string} artifactType - Artifact type
   * @returns {Array} Authorities that produce artifact
   */
  getAuthoritiesByProducedArtifact(artifactType) {
    return Array.from(this._authorityDescriptors.values())
      .filter(descriptor => descriptor.produced_artifacts.includes(artifactType));
  }

  /**
   * Get authority implementation module path
   * 
   * @param {string} authorityId - Authority identifier
   * @returns {string} Implementation module path
   */
  getImplementationModule(authorityId) {
    const descriptor = this._authorityDescriptors.get(authorityId);
    if (!descriptor) {
      throw new Error(`Authority descriptor not found: ${authorityId}`);
    }
    return descriptor.implementation_module;
  }


  /**
   * Resolve authority dependencies
   * 
   * @param {string} authorityId - Authority identifier
   * @returns {Array} Dependency chain
   */
  resolveDependencies(authorityId) {
    const resolved = [];
    const visited = new Set();

    const resolve = (id) => {
      if (visited.has(id)) {
        return;
      }
      visited.add(id);

      const descriptor = this._authorityDescriptors.get(id);
      if (!descriptor) {
        return;
      }

      for (const depId of descriptor.dependencies) {
        resolve(depId);
      }

      resolved.push(id);
    };

    resolve(authorityId);
    return resolved;
  }

  /**
   * Verify authority descriptor integrity
   * 
   * @param {string} authorityId - Authority identifier
   * @returns {Object} Verification result
   */
  verifyDescriptorIntegrity(authorityId) {
    const descriptor = this._authorityDescriptors.get(authorityId);
    if (!descriptor) {
      return {
        valid: false,
        errors: ['Authority descriptor not found'],
      };
    }

    const errors = [];

    // Verify constitutional hash
    const computedHash = CanonicalAuthority.hash({
      authority_id: descriptor.authority_id,
      name: descriptor.name,
      version: descriptor.version,
      capabilities: descriptor.capabilities,
      required_inputs: descriptor.required_inputs,
      produced_artifacts: descriptor.produced_artifacts,
      dependencies: descriptor.dependencies,
    });

    if (computedHash !== descriptor.constitutional_hash) {
      errors.push('Constitutional hash mismatch');
    }

    // Verify dependencies exist
    for (const depId of descriptor.dependencies) {
      if (!this._authorityDescriptors.has(depId)) {
        errors.push(`Dependency ${depId} not found`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }

  /**
   * Persist authority descriptor
   */
  async _persistDescriptor(authorityId, descriptor) {
    try {
      await this._postgres.query(`
        INSERT INTO authority_descriptors (authority_id, descriptor_data, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (authority_id) DO UPDATE SET
          descriptor_data = $2,
          updated_at = NOW()
      `, [authorityId, JSON.stringify(descriptor)]);
    } catch (error) {
      console.error(`[AuthorityRegistry] Failed to persist descriptor ${authorityId}:`, error.message);
    }
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const byCapability = {};
    for (const descriptor of this._authorityDescriptors.values()) {
      for (const capability of descriptor.capabilities) {
        byCapability[capability] = (byCapability[capability] || 0) + 1;
      }
    }

    return {
      total_descriptors: this._authorityDescriptors.size,
      by_capability: byCapability,
    };
  }

  /**
   * Publish contract
   * 
   * @returns {Object} Authority contract
   */
  publishContract() {
    return {
      authority_id: 'constitutional-authority-registry',
      authority_name: 'ConstitutionalAuthorityRegistry',
      version: '45.1.0',
      consumes: ['AuthorityDescriptor'],
      produces: ['descriptor_lookup', 'dependency_graph', 'capability_lookup', 'integrity_verification', 'constitutional_hashes'],
      requires: [],
      guarantees: ['pure_metadata', 'no_runtime_state', 'no_module_loading', 'no_instantiation'],
      failure_modes: ['descriptor_corruption'],
      rollback: 'none',
      determinism: 'deterministic',
    };
  }
}

module.exports = { ConstitutionalAuthorityRegistry };
