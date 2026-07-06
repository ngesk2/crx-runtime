const crypto = require('crypto');

/**
 * CodeGenerator
 * 
 * Constitutional code generator for vendor-specific adapter generation.
 * Takes IR as input and generates vendor-specific adapter source code.
 * Supports multiple vendors (PostgreSQL, EventStoreDB, Ollama, Qdrant, etc.).
 * Deterministic and reproducible generation.
 */
class CodeGenerator {
  constructor(ir, adapterContract) {
    this._ir = ir;
    this._adapterContract = adapterContract;
    this._vendor = adapterContract.vendor || 'Generic';
  }

  /**
   * Generate adapter source
   * @returns {Object} Adapter source with hash
   */
  generateAdapterSource() {
    const adapterSource = this._generateFromIR(this._ir);
    
    return {
      adapter_source: adapterSource,
      adapter_source_hash: this._computeHash(adapterSource)
    };
  }

  /**
   * Generate adapter source from IR
   * @param {Object} ir - Adapter IR
   * @returns {string} Adapter source code
   */
  _generateFromIR(ir) {
    const generator = this._getVendorGenerator(this._vendor);
    return generator.generate(ir, this._adapterContract);
  }

  /**
   * Get vendor-specific generator
   * @param {string} vendor - Vendor name
   * @returns {Object} Vendor generator
   */
  _getVendorGenerator(vendor) {
    const generators = {
      'PostgreSQL': new PostgreSQLGenerator(),
      'EventStoreDB': new EventStoreDBGenerator(),
      'Ollama': new OllamaGenerator(),
      'Qdrant': new QdrantGenerator(),
      'Generic': new GenericGenerator()
    };
    
    return generators[vendor] || generators['Generic'];
  }

  /**
   * Compute hash
   * @param {string} source - Source code
   * @returns {string} SHA256 hash
   */
  _computeHash(source) {
    const { CanonicalAuthority } = require('./canonical_authority');
    return CanonicalAuthority.hash(source);
  }
}

/**
 * Base Generator
 */
class BaseGenerator {
  generate(ir, adapterContract) {
    let source = this._generateClassHeader(ir, adapterContract);
    
    for (const method of ir.methods) {
      source += this._generateMethod(method, adapterContract);
    }
    
    source += this._generateClassFooter(adapterContract);
    
    return source;
  }

  _generateClassHeader(ir, adapterContract) {
    return `
class ${adapterContract.adapter_name} extends GeneratedAdapter {
  constructor(configuration) {
    super(configuration);
    this._validateConfiguration();
  }
`;
  }

  _generateMethod(method, adapterContract) {
    return `
  async ${method.name}() {
    const startTime = await this._timePort.nowMillis();
    this._metrics.recordRequest();
    
    try {
      const result = await this._${method.name}Impl();
      this._metrics.recordSuccess(await this._timePort.nowMillis() - startTime);
      this._logger.info('${method.name} succeeded');
      return result;
    } catch (error) {
      this._metrics.recordFailure(await this._timePort.nowMillis() - startTime);
      const translatedError = this._translateError(error, '${method.name}');
      this._logger.error('${method.name} failed', { error: translatedError.message });
      throw translatedError;
    }
  }
`;
  }

  _generateClassFooter(adapterContract) {
    return `
  _translateError(error, method) {
    // Vendor-specific error translation
    return error;
  }

  _validateConfiguration() {
    // Vendor-specific configuration validation
  }

  async shutdown() {
    // Vendor-specific shutdown logic
  }
}
`;
  }
}

/**
 * PostgreSQL Generator
 */
class PostgreSQLGenerator extends BaseGenerator {
  _generateClassHeader(ir, adapterContract) {
    return `
class ${adapterContract.adapter_name} extends GeneratedAdapter {
  constructor(configuration) {
    super(configuration);
    this._client = null;
  }

  async initialize() {
    const { Pool } = require('pg');
    this._client = new Pool({ connectionString: this._configuration.connection_string });
    await this._client.query(\`CREATE TABLE IF NOT EXISTS \${this._configuration.table_name} (id VARCHAR(255) PRIMARY KEY, data JSONB)\`);
  }
`;
  }

  _generateClassFooter(adapterContract) {
    return `
  _translateError(error, method) {
    if (error.code === '23505') {
      return new Error('DUPLICATE_KEY');
    }
    if (error.code === '23503') {
      return new Error('FOREIGN_KEY_VIOLATION');
    }
    return error;
  }

  _validateConfiguration() {
    if (!this._configuration.connection_string) {
      throw new Error('connection_string is required');
    }
    if (!this._configuration.table_name) {
      throw new Error('table_name is required');
    }
  }

  async shutdown() {
    if (this._client) {
      await this._client.end();
    }
  }
}
`;
  }
}

/**
 * EventStoreDB Generator
 */
class EventStoreDBGenerator extends BaseGenerator {
  _generateClassHeader(ir, adapterContract) {
    return `
class ${adapterContract.adapter_name} extends GeneratedAdapter {
  constructor(configuration) {
    super(configuration);
    this._client = null;
  }

  async initialize() {
    const { EventStoreDBClient } = require('@eventstore/db-client');
    this._client = new EventStoreDBClient({ connectionString: this._configuration.endpoint });
  }
`;
  }

  _generateClassFooter(adapterContract) {
    return `
  _translateError(error, method) {
    if (error.type === 'STREAM_NOT_FOUND') {
      return new Error('NOT_FOUND');
    }
    return error;
  }

  _validateConfiguration() {
    if (!this._configuration.endpoint) {
      throw new Error('endpoint is required');
    }
  }

  async shutdown() {
    if (this._client) {
      await this._client.dispose();
    }
  }
}
`;
  }
}

/**
 * Ollama Generator
 */
class OllamaGenerator extends BaseGenerator {
  _generateClassHeader(ir, adapterContract) {
    return `
class ${adapterContract.adapter_name} extends GeneratedAdapter {
  constructor(configuration) {
    super(configuration);
    this._client = null;
  }

  async initialize() {
    const { Ollama } = require('ollama');
    this._client = new Ollama({ host: this._configuration.endpoint });
  }
`;
  }

  _generateClassFooter(adapterContract) {
    return `
  _translateError(error, method) {
    return error;
  }

  _validateConfiguration() {
    if (!this._configuration.endpoint) {
      throw new Error('endpoint is required');
    }
  }

  async shutdown() {
    // Ollama client does not require explicit shutdown
  }
}
`;
  }
}

/**
 * Qdrant Generator
 */
class QdrantGenerator extends BaseGenerator {
  _generateClassHeader(ir, adapterContract) {
    return `
class ${adapterContract.adapter_name} extends GeneratedAdapter {
  constructor(configuration) {
    super(configuration);
    this._client = null;
  }

  async initialize() {
    const { QdrantClient } = require('@qdrant/js-client-rest');
    this._client = new QdrantClient({ url: this._configuration.endpoint });
  }
`;
  }

  _generateClassFooter(adapterContract) {
    return `
  _translateError(error, method) {
    if (error.status === 404) {
      return new Error('NOT_FOUND');
    }
    return error;
  }

  _validateConfiguration() {
    if (!this._configuration.endpoint) {
      throw new Error('endpoint is required');
    }
  }

  async shutdown() {
    // Qdrant client does not require explicit shutdown
  }
}
`;
  }
}

/**
 * Generic Generator
 */
class GenericGenerator extends BaseGenerator {
  _generateClassHeader(ir, adapterContract) {
    return `
class ${adapterContract.adapter_name} extends GeneratedAdapter {
  constructor(configuration) {
    super(configuration);
  }

  async initialize() {
    // Generic initialization
  }
`;
  }

  _generateClassFooter(adapterContract) {
    return `
  _translateError(error, method) {
    return error;
  }

  _validateConfiguration() {
    // Generic configuration validation
  }

  async shutdown() {
    // Generic shutdown logic
  }
}
`;
  }
}

module.exports = { CodeGenerator };
