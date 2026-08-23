/**
 * Constitutional Schema Repository
 * 
 * Phase 45 Patch 45.2 — Schema Persistence Separation
 * 
 * Handles PostgreSQL persistence for constitutional schemas.
 * 
 * Responsibilities:
 * - PostgreSQL reads
 * - PostgreSQL writes
 * - initialization
 * - default schema installation
 * 
 * ConstitutionalSchemaAuthority uses this repository for persistence
 * and focuses only on validation.
 */

const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { identityAuthority } = require('../ping-runtime/authorities/identity_authority.js');
const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');

class ConstitutionalSchemaRepository {
  constructor(postgresPool) {
    this._postgres = postgresPool;
  }

  /**
   * Initialize schema repository
   */
  async initialize() {
    console.log('[SchemaRepository] Initializing constitutional schema repository');

    // Create table if not exists
    await this._createTable();

    console.log('[SchemaRepository] Constitutional schema repository initialized');
  }

  /**
   * Create constitutional_schemas table
   */
  async _createTable() {
    try {
      await this._postgres.query(`
        CREATE TABLE IF NOT EXISTS constitutional_schemas (
          schema_id VARCHAR(255) PRIMARY KEY,
          schema_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create index on schema_id
      await this._postgres.query(`
        CREATE INDEX IF NOT EXISTS idx_constitutional_schemas_schema_id 
        ON constitutional_schemas(schema_id)
      `);

      console.log('[SchemaRepository] Created constitutional_schemas table');
    } catch (error) {
      console.error('[SchemaRepository] Failed to create table:', error.message);
    }
  }

  /**
   * Load all schemas from PostgreSQL
   * 
   * @returns {Map} schema_id → schema
   */
  async loadAllSchemas() {
    try {
      const result = await this._postgres.query(`
        SELECT schema_id, schema_data
        FROM constitutional_schemas
      `);

      const schemas = new Map();
      for (const row of result.rows) {
        schemas.set(row.schema_id, row.schema_data);
      }

      console.log(`[SchemaRepository] Loaded ${schemas.size} schemas from PostgreSQL`);
      return schemas;
    } catch (error) {
      console.error('[SchemaRepository] Failed to load schemas:', error.message);
      return new Map();
    }
  }

  /**
   * Load default schemas if none exist
   */
  async loadDefaultSchemas() {
    const defaultSchemas = [
      {
        schema_id: 'execution-plan-schema',
        name: 'ExecutionPlan',
        version: '1.0.0',
        description: 'Schema for execution plans',
        schema: {
          type: 'object',
          properties: {
            plan_id: { type: 'string' },
            mission_id: { type: 'string' },
            version: { type: 'string' },
            created_at: { type: 'string' },
            inputs: { type: 'array' },
            nodes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  node_id: { type: 'string' },
                  node_type: { type: 'string' },
                  authority: { type: 'string' },
                  input_artifacts: { type: 'array' },
                  output_artifacts: { type: 'array' },
                  dependencies: { type: 'array' },
                },
                required: ['node_id', 'node_type', 'authority'],
              },
            },
            edges: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  from: { type: 'string' },
                  to: { type: 'string' },
                },
                required: ['from', 'to'],
              },
            },
            rollback_nodes: { type: 'array' },
            expected_artifacts: { type: 'array' },
            policies: { type: 'array' },
            canonical_hash: { type: 'string' },
            witness_hash: { type: 'string' },
          },
          required: ['plan_id', 'mission_id', 'nodes', 'edges'],
        },
      },
      {
        schema_id: 'artifact-schema',
        name: 'Artifact',
        version: '1.0.0',
        description: 'Schema for constitutional artifacts',
        schema: {
          type: 'object',
          properties: {
            artifact_id: { type: 'string' },
            artifact_type: { type: 'string' },
            data: { type: 'object' },
            canonical_bytes: { type: 'string' },
            canonical_hash: { type: 'string' },
            witness_hash: { type: 'string' },
            parents: { type: 'array' },
            children: { type: 'array' },
            created_at: { type: 'string' },
          },
          required: ['artifact_id', 'artifact_type', 'data', 'canonical_hash', 'witness_hash'],
        },
      },
      {
        schema_id: 'mission-schema',
        name: 'Mission',
        version: '1.0.0',
        description: 'Schema for constitutional missions',
        schema: {
          type: 'object',
          properties: {
            mission_id: { type: 'string' },
            rfc_id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            objectives: { type: 'array' },
            constraints: { type: 'array' },
            status: { type: 'string' },
            created_at: { type: 'string' },
          },
          required: ['mission_id', 'rfc_id', 'title', 'objectives'],
        },
      },
      {
        schema_id: 'policy-schema',
        name: 'Policy',
        version: '1.0.0',
        description: 'Schema for constitutional policies',
        schema: {
          type: 'object',
          properties: {
            policy_id: { type: 'string' },
            policy_type: { type: 'string' },
            version: { type: 'string' },
            description: { type: 'string' },
            rules: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  rule_id: { type: 'string' },
                  condition: { type: 'string' },
                  action: { type: 'string' },
                  priority: { type: 'number' },
                },
                required: ['rule_id', 'condition', 'action'],
              },
            },
          },
          required: ['policy_id', 'policy_type', 'version', 'rules'],
        },
      },
      {
        schema_id: 'authority-schema',
        name: 'AuthorityDescriptor',
        version: '1.0.0',
        description: 'Schema for authority descriptors',
        schema: {
          type: 'object',
          properties: {
            authority_id: { type: 'string' },
            name: { type: 'string' },
            version: { type: 'string' },
            description: { type: 'string' },
            capabilities: { type: 'array' },
            required_inputs: { type: 'array' },
            produced_artifacts: { type: 'array' },
            dependencies: { type: 'array' },
            implementation_module: { type: 'string' },
            constitutional_hash: { type: 'string' },
            witness_hash: { type: 'string' },
          },
          required: ['authority_id', 'name', 'version', 'capabilities'],
        },
      },
      {
        schema_id: 'rfc-schema',
        name: 'RFC',
        version: '1.0.0',
        description: 'Schema for RFCs',
        schema: {
          type: 'object',
          properties: {
            rfc_id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string' },
            metadata: { type: 'object' },
            created_at: { type: 'string' },
          },
          required: ['rfc_id', 'title', 'description', 'status'],
        },
      },
      {
        schema_id: 'event-schema',
        name: 'Event',
        version: '1.0.0',
        description: 'Schema for constitutional events',
        schema: {
          type: 'object',
          properties: {
            event_id: { type: 'string' },
            event_type: { type: 'string' },
            aggregate_id: { type: 'string' },
            sequence_number: { type: 'number' },
            data: { type: 'object' },
            canonical_hash: { type: 'string' },
            witness_hash: { type: 'string' },
            occurred_at: { type: 'string' },
          },
          required: ['event_id', 'event_type', 'aggregate_id', 'sequence_number', 'data'],
        },
      },
    ];

    for (const schema of defaultSchemas) {
      // Compute constitutional hash
      schema.constitutional_hash = CanonicalAuthority.hash({
        schema_id: schema.schema_id,
        name: schema.name,
        version: schema.version,
        schema: schema.schema,
      });

      await this.persistSchema(schema.schema_id, schema);
    }

    console.log('[SchemaRepository] Loaded default schemas');
  }

  /**
   * Persist schema to PostgreSQL
   * 
   * @param {string} schemaId - Schema identifier
   * @param {Object} schema - Schema definition
   */
  async persistSchema(schemaId, schema) {
    try {
      await this._postgres.query(`
        INSERT INTO constitutional_schemas (schema_id, schema_data, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (schema_id) DO UPDATE SET
          schema_data = $2,
          updated_at = NOW()
      `, [schemaId, JSON.stringify(schema)]);
    } catch (error) {
      console.error(`[SchemaRepository] Failed to persist schema ${schemaId}:`, error.message);
    }
  }

  /**
   * Get schema by ID from PostgreSQL
   * 
   * @param {string} schemaId - Schema identifier
   * @returns {Object|null} Schema or null if not found
   */
  async getSchema(schemaId) {
    try {
      const result = await this._postgres.query(`
        SELECT schema_data
        FROM constitutional_schemas
        WHERE schema_id = $1
      `, [schemaId]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0].schema_data;
    } catch (error) {
      console.error(`[SchemaRepository] Failed to get schema ${schemaId}:`, error.message);
      return null;
    }
  }

  /**
   * Delete schema from PostgreSQL
   * 
   * @param {string} schemaId - Schema identifier
   */
  async deleteSchema(schemaId) {
    try {
      await this._postgres.query(`
        DELETE FROM constitutional_schemas
        WHERE schema_id = $1
      `, [schemaId]);
    } catch (error) {
      console.error(`[SchemaRepository] Failed to delete schema ${schemaId}:`, error.message);
    }
  }

  /**
   * Get statistics
   */
  async getStatistics() {
    try {
      const result = await this._postgres.query(`
        SELECT COUNT(*) as total_schemas
        FROM constitutional_schemas
      `);

      return {
        total_schemas: parseInt(result.rows[0].total_schemas),
      };
    } catch (error) {
      console.error('[SchemaRepository] Failed to get statistics:', error.message);
      return { total_schemas: 0 };
    }
  }
}

module.exports = { ConstitutionalSchemaRepository };
