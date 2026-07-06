/**
 * Constitutional Schema Authority
 * 
 * Phase 45 Patch 45.2 — Pure Validation Authority
 * 
 * Constitutional Constraint: SchemaAuthority provides only validation, not persistence.
 * 
 * Moved to ConstitutionalSchemaRepository:
 * - PostgreSQL reads
 * - PostgreSQL writes
 * - initialization
 * - default schema installation
 * 
 * SchemaAuthority keeps only:
 * - validate()
 * - verifySchemaIntegrity()
 * - getSchema()
 * - getSchemaByName()
 * 
 * ConstitutionalSchemaRepository handles persistence.
 */

const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { identityAuthority } = require('./identity_authority');
const { CanonicalAuthority } = require('./canonical_authority');

class ConstitutionalSchemaAuthority {
  constructor(schemaRepository) {
    this._schemaRepository = schemaRepository;
    this._schemas = new Map(); // schema_id → schema
  }

  /**
   * Initialize schema authority (load schemas from repository)
   */
  async initialize() {
    console.log('[SchemaAuthority] Initializing constitutional schema authority (validation only)');

    // Load schemas from repository
    this._schemas = await this._schemaRepository.loadAllSchemas();

    // Load default schemas if none exist
    if (this._schemas.size === 0) {
      await this._schemaRepository.loadDefaultSchemas();
      this._schemas = await this._schemaRepository.loadAllSchemas();
    }

    console.log('[SchemaAuthority] Constitutional schema authority initialized');
  }


  /**
   * Register schema (delegates to repository)
   * 
   * @param {Object} schema - Schema definition
   * @returns {Object} Registered schema
   */
  async registerSchema(schema) {
    console.log(`[SchemaAuthority] Registering schema ${schema.schema_id}`);

    // Compute constitutional hash
    schema.constitutional_hash = CanonicalAuthority.hash({
      schema_id: schema.schema_id,
      name: schema.name,
      version: schema.version,
      schema: schema.schema,
    });

    // Store schema in memory
    this._schemas.set(schema.schema_id, schema);
    
    // Persist via repository
    await this._schemaRepository.persistSchema(schema.schema_id, schema);

    console.log(`[SchemaAuthority] Registered schema ${schema.schema_id}`);
    return schema;
  }

  /**
   * Get schema
   * 
   * @param {string} schemaId - Schema identifier
   * @returns {Object} Schema
   */
  getSchema(schemaId) {
    return this._schemas.get(schemaId);
  }

  /**
   * Get schema by name
   * 
   * @param {string} name - Schema name
   * @returns {Object} Schema
   */
  getSchemaByName(name) {
    return Array.from(this._schemas.values())
      .find(schema => schema.name === name);
  }

  /**
   * Get all schemas
   * 
   * @returns {Array} Schemas
   */
  getAllSchemas() {
    return Array.from(this._schemas.values());
  }

  /**
   * Validate object against schema
   * 
   * @param {string} schemaId - Schema identifier
   * @param {Object} object - Object to validate
   * @returns {Object} Validation result
   */
  validateObject(schemaId, object) {
    const schema = this._schemas.get(schemaId);
    if (!schema) {
      return {
        valid: false,
        errors: [`Schema not found: ${schemaId}`],
      };
    }

    return this._validateAgainstSchema(object, schema.schema);
  }

  /**
   * Validate object against schema by name
   * 
   * @param {string} schemaName - Schema name
   * @param {Object} object - Object to validate
   * @returns {Object} Validation result
   */
  validateObjectByName(schemaName, object) {
    const schema = this.getSchemaByName(schemaName);
    if (!schema) {
      return {
        valid: false,
        errors: [`Schema not found: ${schemaName}`],
      };
    }

    return this._validateAgainstSchema(object, schema.schema);
  }

  /**
   * Validate against JSON schema
   */
  _validateAgainstSchema(object, schema) {
    const errors = [];

    // Check type
    if (schema.type === 'object' && typeof object !== 'object') {
      errors.push('Object should be of type object');
      return { valid: false, errors };
    }

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
          const typeError = this._checkPropertyType(propName, value, propSchema);
          if (typeError) {
            errors.push(typeError);
          }

          // Validate array items
          if (propSchema.type === 'array' && Array.isArray(value) && propSchema.items) {
            for (let i = 0; i < value.length; i++) {
              const itemValidation = this._validateAgainstSchema(value[i], propSchema.items);
              if (!itemValidation.valid) {
                errors.push(`Array item ${i} validation failed: ${itemValidation.errors.join(', ')}`);
              }
            }
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
   * Check property type
   */
  _checkPropertyType(propName, value, propSchema) {
    if (propSchema.type === 'string' && typeof value !== 'string') {
      return `Property ${propName} should be string, got ${typeof value}`;
    }
    if (propSchema.type === 'number' && typeof value !== 'number') {
      return `Property ${propName} should be number, got ${typeof value}`;
    }
    if (propSchema.type === 'boolean' && typeof value !== 'boolean') {
      return `Property ${propName} should be boolean, got ${typeof value}`;
    }
    if (propSchema.type === 'array' && !Array.isArray(value)) {
      return `Property ${propName} should be array, got ${typeof value}`;
    }
    if (propSchema.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
      return `Property ${propName} should be object, got ${typeof value}`;
    }
    return null;
  }

  /**
   * Verify schema integrity
   * 
   * @param {string} schemaId - Schema identifier
   * @returns {Object} Verification result
   */
  verifySchemaIntegrity(schemaId) {
    const schema = this._schemas.get(schemaId);
    if (!schema) {
      return {
        valid: false,
        errors: ['Schema not found'],
      };
    }

    const errors = [];

    // Verify constitutional hash
    const computedHash = CanonicalAuthority.hash({
      schema_id: schema.schema_id,
      name: schema.name,
      version: schema.version,
      schema: schema.schema,
    });

    if (computedHash !== schema.constitutional_hash) {
      errors.push('Constitutional hash mismatch');
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }


  /**
   * Get statistics
   */
  getStatistics() {
    const byName = {};
    for (const schema of this._schemas.values()) {
      byName[schema.name] = (byName[schema.name] || 0) + 1;
    }

    return {
      total_schemas: this._schemas.size,
      by_name: byName,
    };
  }
}

module.exports = { ConstitutionalSchemaAuthority };
