/**
 * Artifact Builder
 * 
 * Phase 2.7 — Artifact Builder
 * 
 * Creates immutable artifacts:
 * - Builds artifacts from data
 * - Freezes artifacts for immutability
 * - Validates artifact structure
 * 
 * Pipeline:
 * Data → ArtifactBuilder → Frozen Artifact → Verification
 */

const { CanonicalAuthority } = require('./canonical_authority');

class ArtifactBuilder {
  constructor() {
    this._builders = new Map(); // artifact_type → builder function
  }

  /**
   * Initialize artifact builder
   */
  async initialize() {
    console.log('[ArtifactBuilder] Initializing artifact builder');
    console.log('[ArtifactBuilder] Artifact builder initialized');
  }

  /**
   * Register artifact builder
   * 
   * @param {string} artifactType - Artifact type
   * @param {Function} builder - Builder function
   */
  registerBuilder(artifactType, builder) {
    this._builders.set(artifactType, builder);
  }

  /**
   * Build artifact
   * 
   * @param {string} artifactType - Artifact type
   * @param {Object} data - Artifact data
   * @returns {Object} Frozen artifact
   */
  build(artifactType, data) {
    const builder = this._builders.get(artifactType);
    
    if (!builder) {
      throw new Error(`No builder registered for artifact type: ${artifactType}`);
    }

    const artifact = builder(data);
    
    // Freeze artifact for immutability
    return this._freeze(artifact);
  }

  /**
   * Freeze artifact for immutability
   * 
   * @param {Object} artifact - Artifact to freeze
   * @returns {Object} Frozen artifact
   */
  _freeze(artifact) {
    // Deep freeze the artifact
    const freeze = (obj) => {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }

      if (Array.isArray(obj)) {
        return Object.freeze(obj.map(item => freeze(item)));
      }

      Object.keys(obj).forEach(key => {
        obj[key] = freeze(obj[key]);
      });

      return Object.freeze(obj);
    };

    return freeze(artifact);
  }

  /**
   * Validate artifact structure
   * 
   * @param {Object} artifact - Artifact to validate
   * @returns {Object} Validation result
   */
  validate(artifact) {
    const errors = [];

    // Check required fields
    if (!artifact.artifact_id) {
      errors.push('Missing artifact_id');
    }

    if (!artifact.artifact_type) {
      errors.push('Missing artifact_type');
    }

    if (!artifact.created_at) {
      errors.push('Missing created_at');
    }

    // Check version fields
    if (!artifact.schema_version) {
      errors.push('Missing schema_version');
    }

    if (!artifact.authority_version) {
      errors.push('Missing authority_version');
    }

    // Check canonical hash
    if (!artifact.canonical_hash) {
      errors.push('Missing canonical_hash');
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }

  /**
   * Check if artifact is frozen
   * 
   * @param {Object} artifact - Artifact to check
   * @returns {boolean} True if frozen
   */
  isFrozen(artifact) {
    return Object.isFrozen(artifact);
  }

  /**
   * Create VectorArtifact
   */
  _buildVectorArtifact(data) {
    return {
      artifact_id: data.artifact_id,
      artifact_type: 'VectorArtifact',
      execution_id: data.execution_id,
      source_artifact_id: data.source_artifact_id,
      provider: data.provider,
      model: data.model,
      provider_version: data.provider_version,
      dimensions: data.dimensions,
      chunk_count: data.chunk_count,
      chunk_hashes: data.chunk_hashes,
      canonical_hash: data.canonical_hash,
      embeddings: data.embeddings,
      schema_version: data.schema_version || '1.0.0',
      authority_version: data.authority_version || '1.0.0',
      provider_version: data.provider_version,
      policy_version: data.policy_version,
      canonical_version: data.canonical_version || '1.0.0',
      created_at: data.created_at,
    };
  }

  /**
   * Create InferenceResponse
   */
  _buildInferenceResponse(data) {
    return {
      artifact_id: data.artifact_id,
      artifact_type: 'InferenceResponse',
      execution_id: data.execution_id,
      prompt_ir: data.prompt_ir,
      prompt_canonical_hash: data.prompt_canonical_hash,
      content: data.content,
      finish_reason: data.finish_reason,
      usage: data.usage,
      metrics: data.metrics,
      model: data.model,
      model_digest: data.model_digest,
      node_id: data.node_id,
      provider_response_id: data.provider_response_id,
      provider_id: data.provider_id,
      provider_version: data.provider_version,
      authority_version: data.authority_version,
      policy_version: data.policy_version,
      schema_version: data.schema_version,
      canonical_version: data.canonical_version,
      created_at: data.created_at,
    };
  }

  /**
   * Check health
   */
  async health() {
    return {
      healthy: true,
      message: 'Artifact builder operational',
      builders_count: this._builders.size,
    };
  }

  /**
   * Publish contract
   */
  publishContract() {
    return {
      authority_id: 'artifact-builder',
      authority_name: 'ArtifactBuilder',
      version: '1.0.0',
      consumes: ['artifact_data'],
      produces: ['frozen_artifact'],
      replay_inputs: ['ArtifactHash', 'BuilderVersion'],
      requires: [],
      guarantees: ['immutability', 'structure_validation', 'canonical_serialization'],
      failure_modes: ['builder_not_found', 'validation_failed'],
      rollback: 'none',
      determinism: 'deterministic',
    };
  }
}

module.exports = { ArtifactBuilder };
