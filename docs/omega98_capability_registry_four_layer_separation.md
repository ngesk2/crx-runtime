# Ω.98.18 — CapabilityRegistry Four-Layer Separation

**Objective:** Refine CapabilityRegistry to use four-layer separation: Constitution → Capability Authority → Capability Contract → Adapter Contract → Infrastructure Binding. This separates constitutional requirements, capability contracts, adapter contracts, and infrastructure deployment as distinct constitutional responsibilities.

---

## Problem

**Current Issue:**
CapabilityRegistry is still selecting infrastructure. Even though it now exposes constitutional capabilities, its adapter bindings still look like:

```
Capability
    ↓
Dapr Adapter
    ↓
Temporal
```

or

```
Capability
    ↓
EventStore Adapter
```

This makes TechnologyAuthority own bindings that are really deployment concerns.

---

## Four-Layer Separation

**Architecture:**
```
Constitution
      ↓
Capability Authority
      ↓
Capability Contract
      ↓
Adapter Contract
      ↓
Infrastructure Binding
```

---

## Layer 1: Constitution

**Responsibility:** Define constitutional requirements for capabilities.

**What it owns:**
- Constitutional capability definitions
- Capability requirements
- Capability semantics
- Capability constraints

**Example:**
```javascript
const Constitution = {
  capabilities: {
    ArtifactStore: {
      description: "Constitutional capability for artifact storage",
      requirements: {
        immutability: true,
        determinism: true,
        replay_safety: true
      },
      semantics: {
        save: "Artifact must be immutable once saved",
        retrieve: "Artifact retrieval must be deterministic",
        delete: "Artifact deletion must be replay-safe"
      }
    },
    ReplayStore: {
      description: "Constitutional capability for replay storage",
      requirements: {
        immutability: true,
        determinism: true,
        replay_safety: true,
        ordering: "strict"
      },
      semantics: {
        append: "Events must be append-only",
        replay: "Replay must be deterministic",
        ordering: "Event ordering must be strict"
      }
    }
  }
};
```

---

## Layer 2: Capability Authority

**Responsibility:** Own what is required for each capability.

**What it owns:**
- Capability contracts
- Capability validation
- Capability resolution
- Capability binding rules

**Example:**
```javascript
class CapabilityAuthority {
  constructor(constitution) {
    this._constitution = constitution;
    this._capabilityContracts = new Map();
  }
  
  defineCapabilityContract(capabilityName, contract) {
    this._capabilityContracts.set(capabilityName, contract);
  }
  
  getCapabilityContract(capabilityName) {
    return this._capabilityContracts.get(capabilityName);
  }
  
  validateCapability(capabilityName, implementation) {
    const contract = this.getCapabilityContract(capabilityName);
    const requirements = this._constitution.capabilities[capabilityName].requirements;
    
    // Validate implementation against contract and requirements
    return {
      valid: true,
      violations: []
    };
  }
  
  resolveCapability(capabilityName, context) {
    // Resolve capability based on context
    // Returns capability contract, not implementation
    return this.getCapabilityContract(capabilityName);
  }
}
```

**Capability Contract:**
```javascript
const ArtifactStoreCapabilityContract = {
  capability_name: "ArtifactStore",
  version: "1.0.0",
  
  // Capability interface
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
  
  // Capability requirements
  requirements: {
    immutability: true,
    determinism: true,
    replay_safety: true
  },
  
  // Capability semantics
  semantics: {
    save: "Artifact must be immutable once saved",
    retrieve: "Artifact retrieval must be deterministic",
    delete: "Artifact deletion must be replay-safe"
  }
};
```

---

## Layer 3: Adapter Contract

**Responsibility:** Own how the capability is translated to vendor-specific implementations.

**What it owns:**
- Adapter contracts
- Adapter translation rules
- Adapter validation
- Adapter generation

**Example:**
```javascript
class AdapterAuthority {
  constructor() {
    this._adapterContracts = new Map();
  }
  
  defineAdapterContract(adapterName, contract) {
    this._adapterContracts.set(adapterName, contract);
  }
  
  getAdapterContract(adapterName) {
    return this._adapterContracts.get(adapterName);
  }
  
  validateAdapter(adapterName, implementation) {
    const contract = this.getAdapterContract(adapterName);
    
    // Validate implementation against contract
    return {
      valid: true,
      violations: []
    };
  }
  
  generateAdapter(capabilityContract, adapterContract) {
    // Generate adapter from contracts
    return {
      adapter_source: "...",
      generated_adapter: "...",
      adapter_manifest: "...",
      adapter_witness: "..."
    };
  }
}
```

**Adapter Contract:**
```javascript
const PostgreSQLAdapterContract = {
  adapter_name: "PostgreSQLAdapter",
  version: "1.0.0",
  
  // Supported capabilities
  supported_capabilities: ["ArtifactStore", "ReplayStore", "WitnessStore", "PolicyStore", "PublicationStore", "CertificationStore"],
  
  // Adapter interface
  methods: [
    {
      name: "saveArtifact",
      implementation: "INSERT INTO artifacts (artifact_id, artifact_data) VALUES ($1, $2)",
      constraints: {
        connection_string: "required",
        table_name: "required"
      }
    },
    {
      name: "getArtifact",
      implementation: "SELECT artifact_data FROM artifacts WHERE artifact_id = $1",
      constraints: {
        connection_string: "required",
        table_name: "required"
      }
    }
  ],
  
  // Adapter requirements
  requirements: {
    connection_string: "required",
    table_name: "required",
    timeout_ms: "optional"
  },
  
  // Adapter semantics
  semantics: {
    save: "PostgreSQL INSERT with ON CONFLICT DO NOTHING",
    retrieve: "PostgreSQL SELECT with artifact_id",
    delete: "PostgreSQL DELETE with artifact_id"
  }
};
```

---

## Layer 4: Infrastructure Binding

**Responsibility:** Own where the adapter executes (deployment concern).

**What it owns:**
- Infrastructure bindings
- Deployment configuration
- Infrastructure selection
- Infrastructure health

**Example:**
```javascript
class InfrastructureAuthority {
  constructor() {
    this._infrastructureBindings = new Map();
  }
  
  defineInfrastructureBinding(bindingName, binding) {
    this._infrastructureBindings.set(bindingName, binding);
  }
  
  getInfrastructureBinding(bindingName) {
    return this._infrastructureBindings.get(bindingName);
  }
  
  bindAdapterToInfrastructure(adapterName, infrastructure) {
    // Bind adapter to infrastructure
    return {
      adapter: adapterName,
      infrastructure: infrastructure,
      binding_date: new Date().toISOString()
    };
  }
  
  validateInfrastructure(infrastructure) {
    // Validate infrastructure health
    return {
      healthy: true,
      issues: []
    };
  }
}
```

**Infrastructure Binding:**
```javascript
const ProductionInfrastructureBinding = {
  environment: "production",
  
  bindings: {
    ArtifactStore: {
      adapter: "PostgreSQLAdapter",
      infrastructure: {
        type: "PostgreSQL",
        cluster: "postgresql-cluster-prod",
        database: "artifacts",
        connection_string: "postgresql://prod-cluster:5432/artifacts"
      }
    },
    ReplayStore: {
      adapter: "EventStoreAdapter",
      infrastructure: {
        type: "EventStoreDB",
        cluster: "eventstore-cluster-prod",
        connection_string: "esdb://prod-cluster:2113"
      }
    }
  },
  
  binding_date: "2026-07-01",
  bound_by: "InfrastructureAuthority"
};
```

---

## Separation of Responsibilities

### Capability Authority (What is required)
- Defines capability contracts
- Validates capability requirements
- Resolves capabilities based on context
- **Does NOT know about adapters or infrastructure**

### Adapter Authority (How capability is translated)
- Defines adapter contracts
- Generates adapters from contracts
- Validates adapter implementations
- **Does NOT know about infrastructure or deployment**

### Infrastructure Authority (Where adapter executes)
- Defines infrastructure bindings
- Binds adapters to infrastructure
- Validates infrastructure health
- **Does NOT know about capability contracts or adapter generation**

### Technology Authority (Which technologies are approved)
- Approves OSS versions
- Maintains compatibility matrix
- **Does NOT know about deployment or infrastructure bindings**

### Platform Authority (Which approved technologies are deployed)
- Deploys approved technologies to environments
- Manages environment-specific infrastructure
- **Does NOT approve technologies (that's Technology Authority)**

---

## Example Flow

**Request:** Save artifact to ArtifactStore

```
1. Constitution (Layer 1)
   - Defines ArtifactStore capability requirements
   - Defines ArtifactStore semantics

2. Capability Authority (Layer 2)
   - Resolves ArtifactStore capability contract
   - Validates capability requirements
   - Returns capability contract

3. Adapter Authority (Layer 3)
   - Receives capability contract
   - Selects adapter contract (e.g., PostgreSQLAdapter)
   - Generates adapter from contracts
   - Returns adapter

4. Infrastructure Authority (Layer 4)
   - Receives adapter
   - Binds adapter to infrastructure (e.g., PostgreSQL cluster)
   - Returns infrastructure binding

5. Execution
   - Adapter executes on infrastructure
   - Artifact saved to PostgreSQL cluster
```

---

## Benefits

**Separation of Concerns:**
- Constitutional requirements (Constitution)
- Capability contracts (Capability Authority)
- Adapter contracts (Adapter Authority)
- Infrastructure bindings (Infrastructure Authority)

**Deployment Independence:**
- Capability Authority does not know about infrastructure
- Adapter Authority does not know about deployment
- Infrastructure Authority does not know about capabilities

**Constitutional Sovereignty:**
- Technology Authority approves technologies
- Platform Authority deploys technologies
- No authority owns both approval and deployment

**Replay Safety:**
- Capability contracts are immutable
- Adapter contracts are immutable
- Infrastructure bindings are environment-specific
- Replay witnesses reference capability and adapter contracts, not infrastructure

---

## Summary

**Four-Layer Separation:**
1. **Constitution:** Define constitutional requirements
2. **Capability Authority:** Own what is required
3. **Adapter Authority:** Own how capability is translated
4. **Infrastructure Authority:** Own where adapter executes

**Benefits:**
- Clear separation of concerns
- Deployment independence
- Constitutional sovereignty
- Replay safety
