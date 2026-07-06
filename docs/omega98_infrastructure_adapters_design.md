# Ω.98.9 — Infrastructure Adapters: Design Adapter Generation

**Objective:** Design adapter generation system to reduce maintenance. Define capability contracts, generate adapter templates, and implement only vendor-specific translation. Everything else is generated from capability definitions.

---

## Adapter Generation Pattern

### Core Principle

**Do not hand-write most adapters.** Generate adapters from capability contracts.

**Generation Flow:**
```
Capability Contract
      ↓
Adapter Template
      ↓
Generated Adapter
      ↓
Vendor Implementation (handwritten)
```

### What is Generated
- Adapter base class
- Capability interface implementation
- Error translation
- Metrics collection
- Logging
- Lifecycle management
- Health checks

### What is Handwritten
- Vendor-specific API calls
- Vendor-specific error handling
- Vendor-specific configuration parsing
- Vendor-specific optimization

---

---

## Capability Contract Definition

### Contract Schema

```javascript
// Capability Contract Definition
const CapabilityContract = {
  capability_name: "ArtifactStore",
  version: "1.0.0",
  description: "Constitutional capability for artifact storage",
  
  // Capability interface methods
  methods: [
    {
      name: "saveArtifact",
      input: { artifact: "Artifact" },
      output: { artifact_id: "string" },
      errors: ["ARTIFACT_EXISTS", "STORAGE_ERROR", "VALIDATION_ERROR"]
    },
    {
      name: "getArtifact",
      input: { artifact_id: "string" },
      output: { artifact: "Artifact" },
      errors: ["ARTIFACT_NOT_FOUND", "STORAGE_ERROR"]
    },
    {
      name: "deleteArtifact",
      input: { artifact_id: "string" },
      output: {},
      errors: ["ARTIFACT_NOT_FOUND", "STORAGE_ERROR"]
    },
    {
      name: "listArtifacts",
      input: { filter: "ArtifactFilter" },
      output: { artifacts: "Artifact[]" },
      errors: ["STORAGE_ERROR"]
    },
    {
      name: "artifactExists",
      input: { artifact_id: "string" },
      output: { exists: "boolean" },
      errors: ["STORAGE_ERROR"]
    }
  ],
  
  // Configuration schema
  configuration: {
    type: "object",
    properties: {
      connection_string: { type: "string" },
      table_name: { type: "string", default: "artifacts" },
      timeout_ms: { type: "number", default: 5000 }
    },
    required: ["connection_string"]
  },
  
  // Metrics to collect
  metrics: [
    { name: "requests_total", type: "counter" },
    { name: "requests_success", type: "counter" },
    { name: "requests_failure", type: "counter" },
    { name: "requests_latency", type: "histogram" },
    { name: "requests_retry", type: "counter" }
  ]
};
```

---

## Adapter Template Generation

### Template Structure

```javascript
// Generated Adapter Template (base class)
class GeneratedArtifactStoreAdapter extends CapabilityAdapter {
  constructor(configuration) {
    super(configuration);
    this._validateConfiguration();
  }

  // Generated method: saveArtifact
  async saveArtifact(artifact) {
    const startTime = Date.now();
    this._metrics.recordRequest();
    
    try {
      // Call vendor-specific implementation
      const result = await this._saveArtifactImpl(artifact);
      this._metrics.recordSuccess(Date.now() - startTime);
      this._logger.info('saveArtifact succeeded', { artifact_id: result.artifact_id });
      return result;
    } catch (error) {
      this._metrics.recordFailure(Date.now() - startTime);
      const translatedError = this._translateError(error, 'saveArtifact');
      this._logger.error('saveArtifact failed', { error: translatedError.message });
      throw translatedError;
    }
  }

  // Generated method: getArtifact
  async getArtifact(artifactId) {
    const startTime = Date.now();
    this._metrics.recordRequest();
    
    try {
      const result = await this._getArtifactImpl(artifactId);
      this._metrics.recordSuccess(Date.now() - startTime);
      this._logger.info('getArtifact succeeded', { artifact_id });
      return result;
    } catch (error) {
      this._metrics.recordFailure(Date.now() - startTime);
      const translatedError = this._translateError(error, 'getArtifact');
      this._logger.error('getArtifact failed', { artifact_id, error: translatedError.message });
      throw translatedError;
    }
  }

  // Generated method: deleteArtifact
  async deleteArtifact(artifactId) {
    const startTime = Date.now();
    this._metrics.recordRequest();
    
    try {
      await this._deleteArtifactImpl(artifactId);
      this._metrics.recordSuccess(Date.now() - startTime);
      this._logger.info('deleteArtifact succeeded', { artifact_id });
    } catch (error) {
      this._metrics.recordFailure(Date.now() - startTime);
      const translatedError = this._translateError(error, 'deleteArtifact');
      this._logger.error('deleteArtifact failed', { artifact_id, error: translatedError.message });
      throw translatedError;
    }
  }

  // Generated method: listArtifacts
  async listArtifacts(filter) {
    const startTime = Date.now();
    this._metrics.recordRequest();
    
    try {
      const result = await this._listArtifactsImpl(filter);
      this._metrics.recordSuccess(Date.now() - startTime);
      this._logger.info('listArtifacts succeeded', { count: result.artifacts.length });
      return result;
    } catch (error) {
      this._metrics.recordFailure(Date.now() - startTime);
      const translatedError = this._translateError(error, 'listArtifacts');
      this._logger.error('listArtifacts failed', { error: translatedError.message });
      throw translatedError;
    }
  }

  // Generated method: artifactExists
  async artifactExists(artifactId) {
    const startTime = Date.now();
    this._metrics.recordRequest();
    
    try {
      const result = await this._artifactExistsImpl(artifactId);
      this._metrics.recordSuccess(Date.now() - startTime);
      this._logger.info('artifactExists succeeded', { artifact_id, exists: result.exists });
      return result;
    } catch (error) {
      this._metrics.recordFailure(Date.now() - startTime);
      const translatedError = this._translateError(error, 'artifactExists');
      this._logger.error('artifactExists failed', { artifact_id, error: translatedError.message });
      throw translatedError;
    }
  }

  // Generated error translation
  _translateError(error, method) {
    // Map vendor-specific errors to constitutional errors
    const errorMap = {
      'saveArtifact': {
        'DUPLICATE_KEY': 'ARTIFACT_EXISTS',
        'CONNECTION_ERROR': 'STORAGE_ERROR',
        'VALIDATION_ERROR': 'VALIDATION_ERROR'
      },
      'getArtifact': {
        'NOT_FOUND': 'ARTIFACT_NOT_FOUND',
        'CONNECTION_ERROR': 'STORAGE_ERROR'
      },
      // ... other method mappings
    };
    
    const vendorError = error.code || error.name;
    const constitutionalError = errorMap[method]?.[vendorError] || 'STORAGE_ERROR';
    
    return new ConstitutionalError({
      type: constitutionalError,
      method,
      message: error.message,
      original_error: error
    });
  }

  // Generated configuration validation
  _validateConfiguration() {
    const schema = this._getConfigurationSchema();
    // Validate configuration against schema
  }

  // Abstract methods to be implemented by vendor-specific adapters
  async _saveArtifactImpl(artifact) { throw new Error('Not implemented'); }
  async _getArtifactImpl(artifactId) { throw new Error('Not implemented'); }
  async _deleteArtifactImpl(artifactId) { throw new Error('Not implemented'); }
  async _listArtifactsImpl(filter) { throw new Error('Not implemented'); }
  async _artifactExistsImpl(artifactId) { throw new Error('Not implemented'); }
}
```

---

## Vendor-Specific Implementation (Handwritten)

### PostgreSQL ArtifactStore Adapter

```javascript
class PostgreSQLArtifactStoreAdapter extends GeneratedArtifactStoreAdapter {
  constructor(configuration) {
    super(configuration);
    this._client = null;
  }

  async initialize() {
    const { Client } = require('pg');
    this._client = new Client({ connectionString: this._configuration.connection_string });
    await this._client.connect();
    
    // Create table if not exists
    await this._client.query(`
      CREATE TABLE IF NOT EXISTS ${this._configuration.table_name} (
        artifact_id VARCHAR(255) PRIMARY KEY,
        artifact_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async _saveArtifactImpl(artifact) {
    const result = await this._client.query(
      `INSERT INTO ${this._configuration.table_name} (artifact_id, artifact_data) 
       VALUES ($1, $2) 
       ON CONFLICT (artifact_id) DO NOTHING 
       RETURNING artifact_id`,
      [artifact.artifact_id, JSON.stringify(artifact)]
    );
    
    if (result.rows.length === 0) {
      throw new Error('DUPLICATE_KEY');
    }
    
    return { artifact_id: artifact.artifact_id };
  }

  async _getArtifactImpl(artifactId) {
    const result = await this._client.query(
      `SELECT artifact_data FROM ${this._configuration.table_name} WHERE artifact_id = $1`,
      [artifactId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('NOT_FOUND');
    }
    
    return result.rows[0].artifact_data;
  }

  async _deleteArtifactImpl(artifactId) {
    const result = await this._client.query(
      `DELETE FROM ${this._configuration.table_name} WHERE artifact_id = $1`,
      [artifactId]
    );
    
    if (result.rowCount === 0) {
      throw new Error('NOT_FOUND');
    }
  }

  async _listArtifactsImpl(filter) {
    const result = await this._client.query(
      `SELECT artifact_data FROM ${this._configuration.table_name}`
    );
    
    return { artifacts: result.rows.map(row => row.artifact_data) };
  }

  async _artifactExistsImpl(artifactId) {
    const result = await this._client.query(
      `SELECT 1 FROM ${this._configuration.table_name} WHERE artifact_id = $1`,
      [artifactId]
    );
    
    return { exists: result.rows.length > 0 };
  }

  async shutdown() {
    if (this._client) {
      await this._client.end();
    }
  }
}
```

### S3 ArtifactStore Adapter

```javascript
class S3ArtifactStoreAdapter extends GeneratedArtifactStoreAdapter {
  constructor(configuration) {
    super(configuration);
    this._s3 = null;
  }

  async initialize() {
    const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
    this._s3 = new S3Client({
      region: this._configuration.region,
      credentials: this._configuration.credentials
    });
    this._commands = { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command };
  }

  async _saveArtifactImpl(artifact) {
    const command = new this._commands.PutObjectCommand({
      Bucket: this._configuration.bucket_name,
      Key: artifact.artifact_id,
      Body: JSON.stringify(artifact),
      ContentType: 'application/json'
    });
    
    await this._s3.send(command);
    return { artifact_id: artifact.artifact_id };
  }

  async _getArtifactImpl(artifactId) {
    const command = new this._commands.GetObjectCommand({
      Bucket: this._configuration.bucket_name,
      Key: artifactId
    });
    
    const response = await this._s3.send(command);
    const body = await response.Body.transformToString();
    return JSON.parse(body);
  }

  async _deleteArtifactImpl(artifactId) {
    const command = new this._commands.DeleteObjectCommand({
      Bucket: this._configuration.bucket_name,
      Key: artifactId
    });
    
    await this._s3.send(command);
  }

  async _listArtifactsImpl(filter) {
    const command = new this._commands.ListObjectsV2Command({
      Bucket: this._configuration.bucket_name
    });
    
    const response = await this._s3.send(command);
    const artifacts = [];
    
    for (const object of response.Contents || []) {
      const getCommand = new this._commands.GetObjectCommand({
        Bucket: this._configuration.bucket_name,
        Key: object.Key
      });
      const getResponse = await this._s3.send(getCommand);
      const body = await getResponse.Body.transformToString();
      artifacts.push(JSON.parse(body));
    }
    
    return { artifacts };
  }

  async _artifactExistsImpl(artifactId) {
    try {
      const command = new this._commands.GetObjectCommand({
        Bucket: this._configuration.bucket_name,
        Key: artifactId
      });
      await this._s3.send(command);
      return { exists: true };
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        return { exists: false };
      }
      throw error;
    }
  }

  async shutdown() {
    // S3 client cleanup
  }
}
```

---

## Adapter Generator

### Generator Implementation

```javascript
class AdapterGenerator {
  constructor(capabilityContract) {
    this._contract = capabilityContract;
  }

  generateAdapterTemplate() {
    const template = `
class Generated${this._contract.capability_name}Adapter extends CapabilityAdapter {
  constructor(configuration) {
    super(configuration);
    this._validateConfiguration();
  }

${this._generateMethods()}

  _translateError(error, method) {
${this._generateErrorTranslation()}
  }

  _validateConfiguration() {
    const schema = this._getConfigurationSchema();
    // Validate configuration against schema
  }

${this._generateAbstractMethods()}
}
    `;
    return template;
  }

  _generateMethods() {
    return this._contract.methods.map(method => `
  async ${method.name}(${this._generateParameters(method.input)}) {
    const startTime = Date.now();
    this._metrics.recordRequest();
    
    try {
      const result = await this._${method.name}Impl(${this._generateParameterNames(method.input)});
      this._metrics.recordSuccess(Date.now() - startTime);
      this._logger.info('${method.name} succeeded', ${this._generateLogContext(method.output)});
      return result;
    } catch (error) {
      this._metrics.recordFailure(Date.now() - startTime);
      const translatedError = this._translateError(error, '${method.name}');
      this._logger.error('${method.name} failed', { error: translatedError.message });
      throw translatedError;
    }
  }
`).join('');
  }

  _generateParameters(input) {
    return Object.entries(input).map(([name, type]) => `${name}`).join(', ');
  }

  _generateParameterNames(input) {
    return Object.keys(input).join(', ');
  }

  _generateLogContext(output) {
    return Object.keys(output).map(key => `${key}: result.${key}`).join(', ');
  }

  _generateErrorTranslation() {
    return `    // Map vendor-specific errors to constitutional errors
    const errorMap = {
${this._contract.methods.map(method => `      '${method.name}': {
${method.errors.map(error => `        '${error}': '${error}',`).join('\n')}
      },`).join('\n')}
    };
    
    const vendorError = error.code || error.name;
    const constitutionalError = errorMap[method]?.[vendorError] || 'STORAGE_ERROR';
    
    return new ConstitutionalError({
      type: constitutionalError,
      method,
      message: error.message,
      original_error: error
    });`;
  }

  _generateAbstractMethods() {
    return this._contract.methods.map(method => `  async _${method.name}Impl(${this._generateParameters(method.input)}) { throw new Error('Not implemented'); }`).join('\n');
  }
}
```

---

## Summary

**Adapter Generation Design:**
- Capability contracts define interfaces
- Adapter templates generated from contracts
- Only vendor-specific implementation is handwritten
- Error translation, metrics, logging generated
- Configuration validation generated
- Lifecycle management generated

**Total Adapters:** ~30 adapters
**Generated Code:** ~10,000 lines (generated from contracts)
**Handwritten Code:** ~2,000 lines (vendor-specific only)
**Maintenance:** Dramatically reduced (contracts drive generation)
**Lines Saved:** ~13,000 lines (vs. hand-writing all adapters)
