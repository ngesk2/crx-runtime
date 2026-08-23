/**
 * Quicktype Type Generator Authority
 * 
 * Ω.93.6 — Quicktype Integration
 * 
 * Remove manual schema maintenance, generate canonical types from constitutional schemas.
 * 
 * Goals:
 * - Remove manual schema maintenance
 * - Generate canonical types from constitutional schemas
 * - Auto-generate TypeScript/JavaScript types from constitutional object schemas
 */

const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { deterministicIdAuthority } = require('../ping-runtime/authorities/deterministic_id_authority');
const { CanonicalAuthority, CanonicalBytes } = require('../ping-runtime/authorities/canonical_authority.js');

class QuicktypeTypeGenerator {
  constructor(postgresPool) {
    this._postgres = postgresPool;
    this._schemas = new Map(); // schema_id → schema
    this._generatedTypes = new Map(); // schema_id → generated types
  }

  /**
   * Initialize quicktype type generator
   */
  async initialize() {
    console.log('[QuicktypeTypeGenerator] Initializing quicktype type generator');

    // Load schemas
    await this._loadSchemas();

    console.log('[QuicktypeTypeGenerator] Quicktype type generator initialized');
  }

  /**
   * Load schemas
   */
  async _loadSchemas() {
    try {
      const result = await this._postgres.query(`
        SELECT schema_id, schema_data
        FROM constitutional_schemas
      `);

      for (const row of result.rows) {
        this._schemas.set(row.schema_id, row.schema_data);
      }

      console.log(`[QuicktypeTypeGenerator] Loaded ${this._schemas.size} schemas`);
    } catch (error) {
      console.error('[QuicktypeTypeGenerator] Failed to load schemas:', error.message);
    }
  }

  /**
   * Generate types from constitutional schema
   * 
   * @param {string} schemaId - Schema identifier
   * @param {string} targetLanguage - Target language (typescript, javascript, etc.)
   * @returns {Object} Generated types
   */
  async generateTypesFromSchema(schemaId, targetLanguage = 'typescript') {
    console.log(`[QuicktypeTypeGenerator] Generating types from schema ${schemaId} (${targetLanguage})`);

    const schema = this._schemas.get(schemaId);
    if (!schema) {
      throw new Error(`Schema not found: ${schemaId}`);
    }

    // Generate types from schema
    const generatedTypes = this._generateTypes(schema, targetLanguage);

    // Store generated types
    this._generatedTypes.set(schemaId, generatedTypes);
    await this._persistGeneratedTypes(schemaId, generatedTypes);

    console.log(`[QuicktypeTypeGenerator] Generated types for schema ${schemaId}`);
    return generatedTypes;
  }

  /**
   * Generate types from schema
   */
  _generateTypes(schema, targetLanguage) {
    const types = {
      schema_id: schema.schema_id,
      target_language: targetLanguage,
      types: this._extractTypesFromSchema(schema),
      interfaces: this._generateInterfaces(schema, targetLanguage),
      enums: this._generateEnums(schema, targetLanguage),
      type_aliases: this._generateTypeAliases(schema, targetLanguage),
      canonical_hash: CanonicalAuthority.hash({ schema_id: schema.schema_id, target_language: targetLanguage }),
      generated_at: constitutionalTimeAuthority.now(),
    };

    return types;
  }

  /**
   * Extract types from schema
   */
  _extractTypesFromSchema(schema) {
    const types = [];

    for (const property of schema.properties) {
      const type = {
        name: property.name,
        type: this._mapSchemaTypeToTargetType(property.type, schema.target_language),
        required: property.required,
        description: property.description,
      };
      types.push(type);
    }

    return types;
  }

  /**
   * Map schema type to target type
   */
  _mapSchemaTypeToTargetType(schemaType, targetLanguage) {
    const typeMapping = {
      typescript: {
        string: 'string',
        number: 'number',
        boolean: 'boolean',
        integer: 'number',
        array: 'Array<any>',
        object: 'Record<string, any>',
        date: 'Date',
        uuid: 'string',
        hash: 'string',
      },
      javascript: {
        string: 'string',
        number: 'number',
        boolean: 'boolean',
        integer: 'number',
        array: 'Array',
        object: 'Object',
        date: 'Date',
        uuid: 'string',
        hash: 'string',
      },
    };

    return typeMapping[targetLanguage]?.[schemaType] || 'any';
  }

  /**
   * Generate interfaces
   */
  _generateInterfaces(schema, targetLanguage) {
    const interfaces = [];

    if (targetLanguage === 'typescript') {
      const interfaceCode = this._generateTypeScriptInterface(schema);
      interfaces.push({
        name: schema.name,
        code: interfaceCode,
        language: 'typescript',
      });
    }

    return interfaces;
  }

  /**
   * Generate TypeScript interface
   */
  _generateTypeScriptInterface(schema) {
    let interfaceCode = `export interface ${schema.name} {\n`;

    for (const property of schema.properties) {
      const optional = property.required ? '' : '?';
      const type = this._mapSchemaTypeToTargetType(property.type, 'typescript');
      interfaceCode += `  ${property.name}${optional}: ${type};\n`;
    }

    interfaceCode += `}`;

    return interfaceCode;
  }

  /**
   * Generate enums
   */
  _generateEnums(schema, targetLanguage) {
    const enums = [];

    for (const property of schema.properties) {
      if (property.enum) {
        const enumCode = this._generateEnumCode(property.name, property.enum, targetLanguage);
        enums.push({
          name: property.name,
          code: enumCode,
          language: targetLanguage,
        });
      }
    }

    return enums;
  }

  /**
   * Generate enum code
   */
  _generateEnumCode(name, enumValues, targetLanguage) {
    if (targetLanguage === 'typescript') {
      let enumCode = `export enum ${this._capitalize(name)} {\n`;
      for (const value of enumValues) {
        enumCode += `  ${this._toPascalCase(value)} = '${value}',\n`;
      }
      enumCode += `}`;
      return enumCode;
    }

    return '';
  }

  /**
   * Generate type aliases
   */
  _generateTypeAliases(schema, targetLanguage) {
    const aliases = [];

    for (const property of schema.properties) {
      if (property.type === 'object' && property.properties) {
        const aliasCode = this._generateTypeAliasCode(property.name, property, targetLanguage);
        aliases.push({
          name: property.name,
          code: aliasCode,
          language: targetLanguage,
        });
      }
    }

    return aliases;
  }

  /**
   * Generate type alias code
   */
  _generateTypeAliasCode(name, property, targetLanguage) {
    if (targetLanguage === 'typescript') {
      let aliasCode = `export type ${this._capitalize(name)} = {\n`;
      for (const subProperty of property.properties) {
        const optional = subProperty.required ? '' : '?';
        const type = this._mapSchemaTypeToTargetType(subProperty.type, 'typescript');
        aliasCode += `  ${subProperty.name}${optional}: ${type};\n`;
      }
      aliasCode += `}`;
      return aliasCode;
    }

    return '';
  }

  /**
   * Capitalize string
   */
  _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Convert to Pascal case
   */
  _toPascalCase(str) {
    return str.split(/[_\s-]/).map(word => this._capitalize(word)).join('');
  }

  /**
   * Infer schema from constitutional object
   * 
   * @param {Object} constitutionalObject - Constitutional object
   * @returns {Object} Inferred schema
   */
  async inferSchemaFromObject(constitutionalObject) {
    console.log(`[QuicktypeTypeGenerator] Inferring schema from object ${constitutionalObject.id}`);

    const schema = {
      schema_id: deterministicIdAuthority.generateIdFromObject({
        object_id: constitutionalObject.id,
        timestamp: constitutionalTimeAuthority.now(),
      }),
      name: this._inferSchemaName(constitutionalObject),
      kind: constitutionalObject.kind,
      properties: this._inferPropertiesFromObject(constitutionalObject),
      target_language: 'typescript',
      inferred_at: constitutionalTimeAuthority.now(),
    };

    // Store schema
    this._schemas.set(schema.schema_id, schema);
    await this._persistSchema(schema.schema_id, schema);

    console.log(`[QuicktypeTypeGenerator] Inferred schema ${schema.schema_id}`);
    return schema;
  }

  /**
   * Infer schema name from object
   */
  _inferSchemaName(conststitutionalObject) {
    return constitutionalObject.kind || 'ConstitutionalObject';
  }

  /**
   * Infer properties from object
   */
  _inferPropertiesFromObject(constitutionalObject) {
    const properties = [];

    // Infer from payload
    if (constitutionalObject.payload) {
      for (const [key, value] of Object.entries(constitutionalObject.payload)) {
        properties.push({
          name: key,
          type: this._inferTypeFromValue(value),
          required: true,
          description: '',
        });
      }
    }

    // Infer from metadata
    if (constitutionalObject.metadata) {
      for (const [key, value] of Object.entries(constitutionalObject.metadata)) {
        properties.push({
          name: key,
          type: this._inferTypeFromValue(value),
          required: false,
          description: '',
        });
      }
    }

    return properties;
  }

  /**
   * Infer type from value
   */
  _inferTypeFromValue(value) {
    if (value === null || value === undefined) {
      return 'any';
    } else if (typeof value === 'string') {
      return 'string';
    } else if (typeof value === 'number') {
      return Number.isInteger(value) ? 'integer' : 'number';
    } else if (typeof value === 'boolean') {
      return 'boolean';
    } else if (Array.isArray(value)) {
      return 'array';
    } else if (typeof value === 'object') {
      return 'object';
    }

    return 'any';
  }

  /**
   * Persist schema
   */
  async _persistSchema(schemaId, schema) {
    try {
      await this._postgres.query(`
        INSERT INTO constitutional_schemas (schema_id, schema_data, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (schema_id) DO UPDATE SET
          schema_data = $2,
          updated_at = NOW()
      `, [schemaId, JSON.stringify(schema)]);
    } catch (error) {
      console.error(`[QuicktypeTypeGenerator] Failed to persist schema ${schemaId}:`, error.message);
    }
  }

  /**
   * Persist generated types
   */
  async _persistGeneratedTypes(schemaId, generatedTypes) {
    try {
      await this._postgres.query(`
        INSERT INTO generated_types (schema_id, types_data, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (schema_id) DO UPDATE SET
          types_data = $2,
          updated_at = NOW()
      `, [schemaId, JSON.stringify(generatedTypes)]);
    } catch (error) {
      console.error(`[QuicktypeTypeGenerator] Failed to persist generated types for ${schemaId}:`, error.message);
    }
  }

  /**
   * Get schema
   */
  getSchema(schemaId) {
    return this._schemas.get(schemaId);
  }

  /**
   * Get generated types
   */
  getGeneratedTypes(schemaId) {
    return this._generatedTypes.get(schemaId);
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      total_schemas: this._schemas.size,
      total_generated_types: this._generatedTypes.size,
      by_language: this._getStatsByLanguage(),
    };
  }

  /**
   * Get statistics by language
   */
  _getStatsByLanguage() {
    const stats = {};

    for (const types of this._generatedTypes.values()) {
      stats[types.target_language] = (stats[types.target_language] || 0) + 1;
    }

    return stats;
  }
}

module.exports = { QuicktypeTypeGenerator };
