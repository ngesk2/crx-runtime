# Ω.98.24 — Route All Execution Through ExecutionRuntime

**Objective:** Design architecture where server.js routes all execution through ExecutionRuntime instead of directly constructing infrastructure. The application bootstrap should know nothing about PostgreSQL, Ollama, Temporal, Dapr, or Qdrant. It should only construct ExecutionRuntime.

---

## Current State

**Current Architecture:**
```
server.js
   ↓
construct Postgres
construct Ollama
construct Qdrant
construct Temporal
```

**Problem:**
- server.js directly constructs infrastructure
- Application bootstrap knows about vendor technologies
- No constitutional resolution
- No capability abstraction
- No deployment flexibility

---

## Target Architecture

**Target Architecture:**
```
server.js
     ↓
ExecutionRuntime
     ↓
PlatformAuthority
     ↓
DeploymentManifest
     ↓
CapabilityAuthority
     ↓
Capability Contracts
     ↓
Generated Adapters
```

**Benefits:**
- Application bootstrap knows only ExecutionRuntime
- All infrastructure resolved constitutionally
- Vendor technologies hidden behind capabilities
- Deployment flexibility through PlatformAuthority
- Constitutional sovereignty maintained

---

## Server.js Bootstrap

**Current Implementation:**
```javascript
// server.js (current)
const { Pool } = require('pg');
const { Ollama } = require('ollama');
const { QdrantClient } = require('@qdrant/js-client-rest');
const { Connection } = require('@temporalio/client');

const postgres = new Pool({ connectionString: 'postgresql://localhost:5432/ping' });
const ollama = new Ollama({ host: 'http://localhost:11434' });
const qdrant = new QdrantClient({ url: 'http://localhost:6333' });
const temporal = await Connection.connect({ address: 'localhost:7233' });

// ... use infrastructure directly
```

**Target Implementation:**
```javascript
// server.js (target)
const { ExecutionRuntime } = require('./runtime/execution_runtime');

const executionRuntime = new ExecutionRuntime({
  environment: process.env.ENVIRONMENT || 'development'
});

await executionRuntime.initialize();

// ... all execution through ExecutionRuntime
```

---

## ExecutionRuntime Initialization

**Initialization Flow:**
```javascript
class ExecutionRuntime {
  constructor(configuration) {
    this._environment = configuration.environment;
    this._platformAuthority = null;
    this._capabilityAuthority = null;
    this._technologyAuthority = null;
    this._deploymentManifest = null;
    this._technologyManifest = null;
    this._adapters = new Map();
  }
  
  async initialize() {
    // 1. Load Deployment Manifest from PlatformAuthority
    this._platformAuthority = new PlatformAuthority();
    this._deploymentManifest = await this._platformAuthority.getDeploymentManifest(this._environment);
    
    // 2. Load Technology Manifest from TechnologyAuthority
    this._technologyAuthority = new TechnologyAuthority();
    this._technologyManifest = await this._technologyAuthority.getCurrentTechnologyManifest();
    
    // 3. Initialize Capability Authority
    this._capabilityAuthority = new CapabilityAuthority();
    
    // 4. Resolve and initialize adapters
    await this._initializeAdapters();
    
    // 5. Validate constitutional integrity
    await this._validateConstitutionalIntegrity();
  }
  
  async _initializeAdapters() {
    // Resolve capabilities from Deployment Manifest
    const capabilities = this._deploymentManifest.deployment_configuration;
    
    // For each capability, resolve adapter
    for (const [capabilityName, configuration] of Object.entries(capabilities)) {
      const adapter = await this._resolveAdapter(capabilityName, configuration);
      this._adapters.set(capabilityName, adapter);
    }
  }
  
  async _resolveAdapter(capabilityName, configuration) {
    // Get capability contract
    const capabilityContract = await this._capabilityAuthority.getCapabilityContract(capabilityName);
    
    // Get adapter contract from Technology Manifest
    const adapterContract = await this._technologyAuthority.getAdapterContract(capabilityName);
    
    // Generate adapter from contracts
    const adapter = await AdapterAuthority.generateAdapter(
      capabilityName,
      adapterContract.adapter_name,
      adapterContract.vendor
    );
    
    // Initialize adapter with deployment configuration
    await adapter.initialize(configuration);
    
    return adapter;
  }
  
  async _validateConstitutionalIntegrity() {
    // Verify deployment manifest references technology manifest
    if (this._deploymentManifest.technology_manifest_hash !== this._technologyManifest.manifest_metadata.hash) {
      throw new Error('Deployment manifest does not reference current technology manifest');
    }
    
    // Verify all adapters match technology manifest
    for (const [capabilityName, adapter] of this._adapters) {
      const adapterManifest = await this._technologyAuthority.getAdapterManifest(adapter.adapter_id);
      if (adapterManifest.technology_manifest_hash !== this._technologyManifest.manifest_metadata.hash) {
        throw new Error(`Adapter ${capabilityName} does not match technology manifest`);
      }
    }
  }
}
```

---

## Capability Resolution

**Capability Resolution Flow:**
```javascript
class ExecutionRuntime {
  async executeCapability(capabilityName, method, ...args) {
    // Resolve adapter
    const adapter = this._adapters.get(capabilityName);
    
    if (!adapter) {
      throw new Error(`Capability ${capabilityName} not resolved`);
    }
    
    // Execute method on adapter
    return await adapter[method](...args);
  }
  
  // Convenience methods for common capabilities
  async saveArtifact(artifact) {
    return await this.executeCapability('artifact_store', 'saveArtifact', artifact);
  }
  
  async getArtifact(artifactId) {
    return await this.executeCapability('artifact_store', 'getArtifact', artifactId);
  }
  
  async executeInference(prompt) {
    return await this.executeCapability('inference_engine', 'executeInference', prompt);
  }
  
  async generateEmbedding(text) {
    return await this.executeCapability('embedding_engine', 'generateEmbedding', text);
  }
  
  async appendEvent(event) {
    return await this.executeCapability('replay_store', 'appendEvent', event);
  }
  
  async replayEvents(fromPosition, toPosition) {
    return await this.executeCapability('replay_store', 'replayEvents', fromPosition, toPosition);
  }
}
```

---

## Example Usage

**Current Usage:**
```javascript
// Current: Direct infrastructure usage
const result = await postgres.query('SELECT * FROM artifacts WHERE artifact_id = $1', [artifactId]);
const inference = await ollama.generate({ model: 'llama2', prompt: '...' });
const vectors = await qdrant.search({ collection_name: 'vectors', vector: embedding });
```

**Target Usage:**
```javascript
// Target: Constitutional capability usage
const artifact = await executionRuntime.getArtifact(artifactId);
const inference = await executionRuntime.executeInference('...');
const vectors = await executionRuntime.searchVectors(embedding);
```

---

## Deployment Configuration

**Environment Variables:**
```bash
# Development
ENVIRONMENT=development

# Staging
ENVIRONMENT=staging

# Production
ENVIRONMENT=production
```

**Deployment Manifest Resolution:**
```javascript
class PlatformAuthority {
  async getDeploymentManifest(environment) {
    // Load deployment manifest from configuration store
    // Could be from file, database, or configuration service
    const manifest = await this._loadDeploymentManifest(environment);
    
    // Validate manifest
    await this._validateDeploymentManifest(manifest);
    
    return manifest;
  }
  
  async _loadDeploymentManifest(environment) {
    // Load from file system
    const manifestPath = path.join(__dirname, '..', 'config', `deployment-${environment}.json`);
    const manifestData = await fs.readFile(manifestPath, 'utf-8');
    return JSON.parse(manifestData);
  }
  
  async _validateDeploymentManifest(manifest) {
    // Validate manifest structure
    // Validate manifest references technology manifest
    // Validate configuration is valid
  }
}
```

---

## Benefits

**Constitutional Sovereignty:**
- Application bootstrap knows only ExecutionRuntime
- Vendor technologies hidden behind capabilities
- Constitutional resolution enforced

**Deployment Flexibility:**
- Same ExecutionRuntime across environments
- Different deployment manifests per environment
- No code changes for deployment configuration

**Vendor Independence:**
- No vendor-specific code in application
- Vendor changes require only adapter updates
- Capability contracts provide stability

**Replay Safety:**
- All execution through constitutional adapters
- Technology manifest provides replay identity
- Deployment manifest provides deployment traceability

---

## Migration Path

**Phase 1: Introduce ExecutionRuntime Wrapper**
- Create ExecutionRuntime wrapper around existing infrastructure
- Update server.js to use ExecutionRuntime
- Maintain backward compatibility

**Phase 2: Introduce Capability Authority**
- Define capability contracts
- Implement Capability Authority
- Update ExecutionRuntime to use Capability Authority

**Phase 3: Introduce Platform Authority**
- Define deployment manifests
- Implement Platform Authority
- Update ExecutionRuntime to use Platform Authority

**Phase 4: Introduce Technology Authority**
- Define technology manifests
- Implement Technology Authority
- Update ExecutionRuntime to use Technology Authority

**Phase 5: Remove Direct Infrastructure**
- Remove direct infrastructure construction from server.js
- Remove vendor-specific code
- Complete constitutional resolution

---

## Summary

**Target Architecture:**
```
server.js → ExecutionRuntime → PlatformAuthority → DeploymentManifest → CapabilityAuthority → Capability Contracts → Generated Adapters
```

**Benefits:**
- Application bootstrap knows only ExecutionRuntime
- Vendor technologies hidden behind capabilities
- Deployment flexibility through PlatformAuthority
- Constitutional sovereignty maintained
- Replay safety through technology manifests
