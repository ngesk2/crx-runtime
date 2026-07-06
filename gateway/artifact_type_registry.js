/**
 * Artifact Type Registry
 * 
 * Ω.96.3 — Artifact Type Registry
 * 
 * Artifacts are no longer implicit.
 * Each artifact type has:
 * - schema
 * - version
 * - serializer
 * - validator
 * - canonicalizer
 * 
 * Every artifact becomes self-validating.
 */

const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { deterministicIdAuthority } = require('./deterministic_id_authority');
const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');

class ArtifactTypeRegistry {
  constructor(postgresPool) {
    this._postgres = postgresPool;
    this._artifactTypes = new Map(); // artifact_type → type definition
  }

  /**
   * Initialize artifact type registry
   */
  async initialize() {
    console.log('[ArtifactTypeRegistry] Initializing artifact type registry');

    // Load artifact types
    await this._loadArtifactTypes();

    console.log('[ArtifactTypeRegistry] Artifact type registry initialized');
  }

  /**
   * Load artifact types
   */
  async _loadArtifactTypes() {
    try {
      const result = await this._postgres.query(`
        SELECT artifact_type, type_definition
        FROM artifact_types
      `);

      for (const row of result.words) {
        this._artifactTypes.set(row.artifact_type, row.type_definition);
      }

      // Load default artifact types if none exist
      if (this._artifactTypes.size === 0) {
        await this._loadDefaultArtifactTypes();
      }

      console.log(`[ArtifactTypeRegistry] Loaded ${this._artifactTypes.size} artifact types`);
    } catch (error) {
      console.error('[ArtifactTypeRegistry] Failed to load artifact types:', error.message);
    }
  }

  /**
   * Load default artifact types
   */
  async _loadDefaultArtifactTypes() {
    const defaultTypes = [
      {
        artifact_type: 'WorkflowIR',
        version: '1.0.0',
        description: 'Compiled workflow intermediate representation',
        schema: {
          type: 'object',
          properties: {
            workflow_id: { type: 'string' },
            nodes: { type: 'array' },
            edges: { type: 'array' },
          },
          required: ['workflow_id', 'nodes', 'edges'],
        },
        serializer: 'json',
        validator: 'json_schema',
        canonicalizer: 'canonical_json',
      },
      {
        artifact_type: 'ExecutionPlan',
        version: '1.0.0',
        description: 'Immutable execution plan DAG',
        schema: {
          type: 'object',
          properties: {
            plan_id: { type: 'string' },
            mission_id: { type: 'string' },
            nodes: { type: 'array' },
            edges: { type: 'array' },
            rollback_nodes: { type: 'array' },
          },
          required: ['plan_id', 'mission_id', 'nodes', 'edges'],
        },
        serializer: 'json',
        validator: 'json_schema',
        canonicalizer: 'canonical_json',
      },
      {
        artifact_type: 'ReplayEvidence',
        version: '1.0.0',
        description: 'Replay verification evidence',
        schema: {
          type: 'object',
          properties: {
            evidence_id: { type: 'string' },
            checks: { type: 'object' },
            canonical_hash: { type: 'string' },
            witness_hash: { type: 'string' },
          },
          required: ['evidence_id', 'checks', 'canonical_hash', 'witness_hash'],
        },
        serializer: 'json',
        validator: 'json_schema',
        canonicalizer: 'canonical_json',
      },
      {
        artifact_type: 'WitnessEvidence',
        version: '1.0.0',
        description: 'Witness verification evidence',
        schema: {
          type: 'object',
          properties: {
            evidence_id: { type: 'string' },
            witness_chain: { type: 'array' },
            canonical_hash: { type: 'string' },
            witness_hash: { type: 'string' },
          },
          required: ['evidence_id', 'witness_chain', 'canonical_hash', 'witness_hash'],
        },
        serializer: 'json',
        validator: 'json_schema',
        canonicalizer: 'canonical_json',
      },
      {
        artifact_type: 'PolicyDecision',
        version: '1.0.0',
        description: 'Policy evaluation decision',
        schema: {
          type: 'object',
          properties: {
            decision_id: { type: 'string' },
            action: { type: 'string' },
            reason: { type: 'string' },
            policy_results: { type: 'array' },
          },
          required: ['decision_id', 'action', 'reason', 'policy_results'],
        },
        serializer: 'json',
        validator: 'json_schema',
        canonicalizer: 'canonical_json',
      },
      {
        artifact_type: 'CommitManifest',
        version: '1.0.0',
        description: 'Git commit manifest',
        schema: {
          type: 'object',
          properties: {
            commit_id: { type: 'string' },
            commit_sha: { type: 'string' },
            message: { type: 'string' },
            artifacts: { type: 'array' },
          },
          required: ['commit_id', 'commit_sha', 'message', 'artifacts'],
        },
        serializer: 'json',
        validator: 'json_schema',
        canonicalizer: 'canonical_json',
      },
      {
        artifact_type: 'Mission',
        version: '1.0.0',
        description: 'Constitutional mission',
        schema: {
          type: 'object',
          properties: {
            mission_id: { type: 'string' },
            rfc_id: { type: 'string' },
            objectives: { type: 'array' },
            constraints: { type: 'array' },
          },
          required: ['mission_id', 'rfc_id', 'objectives'],
        },
        serializer: 'json',
        validator: 'json_schema',
        canonicalizer: 'canonical_json',
      },
      {
        artifact_type: 'RFC',
        version: '1.0.0',
        description: 'Request for Comments',
        schema: {
          type: 'object',
          properties: {
            rfc_id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string' },
          },
          required: ['rfc_id', 'title', 'description', 'status'],
        },
        serializer: 'json',
        validator: 'json_schema',
        canonicalizer: 'canonical_json',
      },
      {
        artifact_type: 'HistoryRecord',
        version: '1.0.0',
        description: 'Constitutional history record',
        schema: {
          type: 'object',
          properties: {
            record_id: { type: 'string' },
            timestamp: { type: 'string' },
            event_type: { type: 'string' },
            event_data: { type: 'object' },
          },
          required: ['record_id', 'timestamp', 'event_type', 'event_data'],
        },
        serializer: 'json',
        validator: 'json_schema',
        canonicalizer: 'canonical_json',
      },
      {
        artifact_type: 'Artifact',
        version: '1.0.0',
        description: 'Generic constitutional artifact',
        schema: {
          type: 'object',
          properties: {
            artifact_id: { type: 'string' },
            artifact_type: { type: 'string' },
            data: { type: 'object' },
            canonical_hash: { type: 'string' },
            witness_hash: { type: 'string' },
          },
          required: ['artifact_id', 'artifact_type', 'data', 'canonical_hash', 'witness_hash'],
        },
        serializer: 'json',
        validator: 'json_schema',
        canonicalizer: 'canonical_json',
      },
    ];

    for (const typeDef of defaultTypes) {
      this._artifactTypes.set(typeDef.artifact_type, typeDef);
      await this._persistArtifactType(typeDef.artifact_type, typeDef);
    }

    console.log('[ArtifactTypeRegistry] Loaded default artifact types');
  }

  /**
   * Register artifact type
   * 
   * @param {Object} typeDefinition - Artifact type definition
   * @returns {Object} Registered type
   */
  async registerArtifactType(typeDefinition) {
    console.log(`[ArtifactTypeRegistry] Registering artifact type ${typeDefinition.artifact_type}`);

    // Compute constitutional hash
    typeDefinition.constitutional_hash = CanonicalAuthority.hash({
      artifact_type: typeDefinition.artifact_type,
      version: typeDefinition.version,
      schema: typeDefinition.schema,
    });

    // Store type
    this._artifactTypes.set(typeDefinition.artifact_type, typeDefinition);
    await this._persistArtifactType(typeDefinition.artifact_type, typeDefinition);

    console.log(`[ArtifactTypeRegistry] Registered artifact type ${typeDefinition.artifact_type}`);
    return typeDefinition;
  }

  /**
   * Get artifact type
   * 
   * @param {string} artifactType - Artifact type
   * @returns {Object} Type definition
   */
  getArtifactType(artifactType) {
    return this._artifactTypes.get(artifactType);
  }

  /**
   * Get all artifact types
   * 
   * @returns {Array} Artifact types
   */
  getAllArtifactTypes() {
    return Array.from(this._artifactTypes.values());
  }

  /**
   * Validate artifact against type
   * 
   * @param {string} artifactType - Artifact type
   * @param {Object} artifact - Artifact data
   * @returns {Object} Validation result
   */
  validateArtifact(artifactType, artifact) {
    const typeDef = this._artifactTypes.get(artifactType);
    if (!typeDef) {
      return {
        valid: false,
        errors: [`Artifact type not found: ${artifactType}`],
      };
    }

    const errors = [];

    // Validate against schema
    if (typeDef.validator === 'json_schema') {
      const schemaValidation = this._validateAgainstSchema(artifact, typeDef.schema);
      if (!schemaValidation.valid) {
        errors.push(...schemaValidation.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }

  /**
   * Validate against JSON schema
   */
  _validateAgainstSchema(object, schema) {
    const errors = [];

    // Check required properties
    if (schema.required) {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in object)) {
          errors.push(`Missing required property: ${requiredProp}`);
        }
      }
    }

    // Check property types
    if (schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        if (propName in object) {
          const value = object[propName];
          if (propSchema.type === 'string' && typeof value !== 'string') {
            errors.push(`Property ${propName} should be string`);
          }
          if (propSchema.type === 'number' && typeof value !== 'number') {
            errors.push(`Property ${propName} should be number`);
          }
          if (propSchema.type === 'array' && !Array.isArray(value)) {
            errors.push(`Property ${propName} should be array`);
          }
          if (propSchema.type === 'object' && typeof value !== 'object') {
            errors.push(`Property ${propName} should be object`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }

  /**
   * Serialize artifact
   * 
   * @param {string} artifactType - Artifact type
   * @param {Object} artifact - Artifact data
   * @returns {string} Serialized artifact
   */
  serializeArtifact(artifactType, artifact) {
    const typeDef = this._artifactTypes.get(artifactType);
    if (!typeDef) {
      throw new Error(`Artifact type not found: ${artifactType}`);
    }

    switch (typeDef.serializer) {
      case 'json':
        return JSON.stringify(artifact);
      default:
        return JSON.stringify(artifact);
    }
  }

  /**
   * Deserialize artifact
   * 
   * @param {string} artifactType - Artifact type
   * @param {string} serialized - Serialized artifact
   * @returns {Object} Artifact data
   */
  deserializeArtifact(artifactType, serialized) {
    const typeDef = this._artifactTypes.get(artifactType);
    if (!typeDef) {
      throw new Error(`Artifact type not found: ${artifactType}`);
    }

    switch (typeDef.serializer) {
      case 'json':
        return JSON.parse(serialized);
      default:
        return JSON.parse(serialized);
    }
  }

  /**
   * Canonicalize artifact
   * 
   * @param {string} artifactType - Artifact type
   * @param {Object} artifact - Artifact data
   * @returns {string} Canonical bytes
   */
  canonicalizeArtifact(artifactType, artifact) {
    const typeDef = this._artifactTypes.get(artifactType);
    if (!typeDef) {
      throw new Error(`Artifact type not found: ${artifactType}`);
    }

    switch (typeDef.canonicalizer) {
      case 'canonical_json':
        return CanonicalBytes.encode(artifact);
      default:
        return CanonicalBytes.encode(artifact);
    }
  }

  /**
   * Persist artifact type
   */
  async _persistArtifactType(artifactType, typeDefinition) {
    try {
      await this._postgres.query(`
        INSERT INTO artifact_types (artifact_type, type_definition, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (artifact_type) DO UPDATE SET
          type_definition = $2,
          updated_at = NOW()
      `, [artifactType, JSON.stringify(typeDefinition)]);
    } catch (error) {
      console.error(`[ArtifactTypeRegistry] Failed to persist artifact type ${artifactType}:`, error.message);
    }
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const bySerializer = {};
    const byValidator = {};
    const byCanonicalizer = {};

    for (const typeDef of this._artifactTypes.values()) {
      bySerializer[typeDef.serializer] = (bySerializer[typeDef.serializer] || 0) + 1;
      byValidator[typeDef.validator] = (byValidator[typeDef.validator] || 0) + 1;
      byCanonicalizer[typeDef.canonicalizer] = (byCanonicalizer[typeDef.canonicalizer] || 0) + 1;
    }

    return {
      total_types: this._artifactTypes.size,
      by_serializer: bySerializer,
      by_validator: byValidator,
      by_canonicalizer: byCanonicalizer,
    };
  }
}

module.exports = { ArtifactTypeRegistry };
