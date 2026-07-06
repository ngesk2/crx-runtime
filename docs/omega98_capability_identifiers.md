# Ω.98.25 — Replace Technology Literals with Capability Identifiers

**Objective:** Replace technology literals (postgres, ollama, qdrant, temporal, dapr) with capability identifiers (ArtifactStore, ReplayStore, InferenceEngine, EmbeddingEngine, ExecutionRuntime, CapabilityBus, WitnessStore, PolicyStore, PublicationStore, CertificationStore). No authority should know vendor names. Only adapters know vendors.

---

## Problem

**Current Issue:**
Runtime contains technology literals like postgres, ollama, qdrant, temporal, dapr. Authorities know vendor names, which violates constitutional abstraction. Only adapters should know vendors.

**Example of Violation:**
```javascript
// Current: Authority knows vendor
class ArtifactAuthority {
  constructor() {
    this._adapter = 'postgres'; // Vendor literal
  }
}
```

---

## Technology Literals to Capability Identifiers

**Mapping:**
```
postgres → ArtifactStore, ReplayStore, WitnessStore, PolicyStore, PublicationStore, CertificationStore
ollama → InferenceEngine
qdrant → VectorStore
temporal → ExecutionRuntime
dapr → CapabilityBus
```

**Capability Identifiers:**
- ArtifactStore
- ReplayStore
- WitnessStore
- InferenceEngine
- EmbeddingEngine
- ExecutionRuntime
- CapabilityBus
- PolicyStore
- PublicationStore
- CertificationStore
- VectorStore

---

## Authority Refactoring

**Current Implementation:**
```javascript
// Current: Authority knows vendor
class ArtifactAuthority {
  constructor() {
    this._adapter = 'postgres';
    this._connectionString = 'postgresql://localhost:5432/artifacts';
  }
  
  async saveArtifact(artifact) {
    // Direct PostgreSQL usage
    const result = await this._postgres.query(
      'INSERT INTO artifacts (artifact_id, artifact_data) VALUES ($1, $2)',
      [artifact.artifact_id, JSON.stringify(artifact)]
    );
    return result;
  }
}
```

**Target Implementation:**
```javascript
// Target: Authority knows capability
class ArtifactAuthority {
  constructor(capabilityAuthority) {
    this._capabilityAuthority = capabilityAuthority;
    this._capabilityName = 'ArtifactStore';
  }
  
  async saveArtifact(artifact) {
    // Capability resolution
    const adapter = await this._capabilityAuthority.resolveCapability(this._capabilityName);
    return await adapter.saveArtifact(artifact);
  }
}
```

---

## Adapter Refactoring

**Adapter Knows Vendor:**
```javascript
// Adapter knows vendor
class PostgreSQLArtifactStoreAdapter {
  constructor(configuration) {
    this._connectionString = configuration.connection_string;
    this._client = new Pool({ connectionString: this._connectionString });
  }
  
  async saveArtifact(artifact) {
    const result = await this._client.query(
      'INSERT INTO artifacts (artifact_id, artifact_data) VALUES ($1, $2)',
      [artifact.artifact_id, JSON.stringify(artifact)]
    );
    return { artifact_id: artifact.artifact_id };
  }
}
```

**Adapter Contract:**
```javascript
const PostgreSQLAdapterContract = {
  adapter_name: "PostgreSQLAdapter",
  vendor: "PostgreSQL",
  supported_capabilities: ["ArtifactStore", "ReplayStore", "WitnessStore", "PolicyStore", "PublicationStore", "CertificationStore"],
  methods: [
    {
      name: "saveArtifact",
      implementation: "INSERT INTO artifacts (artifact_id, artifact_data) VALUES ($1, $2)",
      constraints: {
        connection_string: "required",
        table_name: "required"
      }
    }
  ]
};
```

---

## Capability Authority

**Capability Authority Interface:**
```javascript
class CapabilityAuthority {
  constructor() {
    this._capabilityContracts = new Map();
    this._adapterBindings = new Map();
  }
  
  defineCapabilityContract(capabilityName, contract) {
    this._capabilityContracts.set(capabilityName, contract);
  }
  
  bindAdapter(capabilityName, adapter) {
    this._adapterBindings.set(capabilityName, adapter);
  }
  
  async resolveCapability(capabilityName) {
    const adapter = this._adapterBindings.get(capabilityName);
    if (!adapter) {
      throw new Error(`Capability ${capabilityName} not bound`);
    }
    return adapter;
  }
  
  getCapabilityContract(capabilityName) {
    return this._capabilityContracts.get(capabilityName);
  }
}
```

**Capability Contract:**
```javascript
const ArtifactStoreCapabilityContract = {
  capability_name: "ArtifactStore",
  version: "1.0.0",
  
  methods: [
    {
      name: "saveArtifact",
      input: { artifact: "Artifact" },
      output: { artifact_id: "string" },
      constraints: {
        immutability: true,
        determinism: true
      }
    },
    {
      name: "getArtifact",
      input: { artifact_id: "string" },
      output: { artifact: "Artifact" },
      constraints: {
        determinism: true
      }
    }
  ],
  
  requirements: {
    immutability: true,
    determinism: true,
    replay_safety: true
  }
};
```

---

## Authority Examples

### ArtifactAuthority

**Current:**
```javascript
class ArtifactAuthority {
  constructor() {
    this._adapter = 'postgres';
    this._connectionString = 'postgresql://localhost:5432/artifacts';
  }
}
```

**Target:**
```javascript
class ArtifactAuthority {
  constructor(capabilityAuthority) {
    this._capabilityAuthority = capabilityAuthority;
    this._capabilityName = 'ArtifactStore';
  }
}
```

### InferenceAuthority

**Current:**
```javascript
class InferenceAuthority {
  constructor() {
    this._adapter = 'ollama';
    this._endpoint = 'http://localhost:11434';
  }
}
```

**Target:**
```javascript
class InferenceAuthority {
  constructor(capabilityAuthority) {
    this._capabilityAuthority = capabilityAuthority;
    this._capabilityName = 'InferenceEngine';
  }
}
```

### EmbeddingAuthority

**Current:**
```javascript
class EmbeddingAuthority {
  constructor() {
    this._adapter = 'ollama';
    this._endpoint = 'http://localhost:11434';
  }
}
```

**Target:**
```javascript
class EmbeddingAuthority {
  constructor(capabilityAuthority) {
    this._capabilityAuthority = capabilityAuthority;
    this._capabilityName = 'EmbeddingEngine';
  }
}
```

### VectorStore Authority

**Current:**
```javascript
class VectorStoreAuthority {
  constructor() {
    this._adapter = 'qdrant';
    this._endpoint = 'http://localhost:6333';
  }
}
```

**Target:**
```javascript
class VectorStoreAuthority {
  constructor(capabilityAuthority) {
    this._capabilityAuthority = capabilityAuthority;
    this._capabilityName = 'VectorStore';
  }
}
```

---

## Configuration Refactoring

**Current Configuration:**
```javascript
// Current: Vendor-specific configuration
const configuration = {
  postgres: {
    host: 'localhost',
    port: 5432,
    database: 'artifacts'
  },
  ollama: {
    host: 'localhost',
    port: 11434
  },
  qdrant: {
    host: 'localhost',
    port: 6333
  }
};
```

**Target Configuration:**
```javascript
// Target: Capability-specific configuration
const configuration = {
  ArtifactStore: {
    adapter: 'PostgreSQLAdapter',
    configuration: {
      connection_string: 'postgresql://localhost:5432/artifacts',
      table_name: 'artifacts'
    }
  },
  InferenceEngine: {
    adapter: 'OllamaAdapter',
    configuration: {
      endpoint: 'http://localhost:11434',
      model: 'llama2'
    }
  },
  VectorStore: {
    adapter: 'QdrantAdapter',
    configuration: {
      endpoint: 'http://localhost:6333',
      collection_name: 'vectors'
    }
  }
};
```

---

## Benefits

**Constitutional Abstraction:**
- Authorities know capabilities, not vendors
- Vendor changes require only adapter updates
- Capability contracts provide stability

**Vendor Independence:**
- No vendor-specific code in authorities
- Vendor isolation enforced
- Adapter layer provides translation

**Replay Safety:**
- Capability contracts are constitutional
- Adapter witnesses provide traceability
- Technology manifest provides replay identity

**Deployment Flexibility:**
- Same capability contracts across environments
- Different adapters per environment
- No code changes for vendor changes

---

## Migration Path

**Phase 1: Introduce Capability Authority**
- Create Capability Authority
- Define capability contracts
- Maintain backward compatibility

**Phase 2: Refactor Authorities**
- Replace vendor literals with capability identifiers
- Update authorities to use Capability Authority
- Test capability resolution

**Phase 3: Refactor Configuration**
- Replace vendor-specific configuration with capability-specific configuration
- Update deployment manifests
- Test configuration resolution

**Phase 4: Remove Vendor Literals**
- Remove all vendor literals from authorities
- Remove vendor-specific configuration
- Complete capability abstraction

---

## Summary

**Technology Literals → Capability Identifiers:**
- postgres → ArtifactStore, ReplayStore, WitnessStore, PolicyStore, PublicationStore, CertificationStore
- ollama → InferenceEngine, EmbeddingEngine
- qdrant → VectorStore
- temporal → ExecutionRuntime
- dapr → CapabilityBus

**Benefits:**
- Constitutional abstraction
- Vendor independence
- Replay safety
- Deployment flexibility
