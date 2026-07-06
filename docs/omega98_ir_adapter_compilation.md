# Ω.98.27 — Adopt IR-Based Adapter Compilation

**Objective:** Design adoption of IR-based adapter compilation. Instead of hand-written adapters, the flow becomes Capability Contract → Capability IR → Code Generator → Generated Adapter → Adapter Witness → Technology Manifest. Adapters become constitutional artifacts with provenance, reproducibility, replay identity, and witness verification. This is how the runtime eventually becomes self-hosting.

---

## Problem

**Current Issue:**
Adapters are hand-written. This lacks constitutional traceability, reproducibility, and replay identity. Adapters should be compilable artifacts with full constitutional provenance.

**Current Flow:**
```
Capability
    ↓
hand-written adapter
```

**Target Flow:**
```
Capability Contract
        ↓
Capability IR
        ↓
Code Generator
        ↓
Generated Adapter
        ↓
Adapter Witness
        ↓
Technology Manifest
```

---

## IR-Based Adapter Compilation

**Architecture:**
```
Capability Contract
        ↓
Capability IR (Intermediate Representation)
        ↓
Code Generator
        ↓
Generated Adapter
        ↓
Adapter Manifest
        ↓
Adapter Witness
        ↓
Technology Manifest
```

---

## Step 1: Capability Contract

**Input:** Capability contract defined by Capability Authority.

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

## Step 2: Capability IR

**Purpose:** Capability contract is compiled to IR for code generation.

**IR Structure:**
```javascript
const AdapterIR = {
  ir_id: "ir_2026_07_01_001",
  ir_version: "1.0.0",
  
  capability_contract_hash: "sha256:abc123...",
  
  methods: [
    {
      name: "saveArtifact",
      ir_code: `
        METHOD saveArtifact(artifact)
          INPUT artifact: Artifact
          OUTPUT artifact_id: string
          
          BEGIN
            VALIDATE artifact.immutability == true
            VALIDATE artifact.determinism == true
            
            CALL _saveArtifactImpl(artifact)
            
            RETURN artifact_id
          END
        END METHOD
      `,
      constraints: {
        immutability: true,
        determinism: true
      }
    },
    {
      name: "getArtifact",
      ir_code: `
        METHOD getArtifact(artifact_id)
          INPUT artifact_id: string
          OUTPUT artifact: Artifact
          
          BEGIN
            CALL _getArtifactImpl(artifact_id)
            
            RETURN artifact
          END
        END METHOD
      `,
      constraints: {
        determinism: true
      }
    }
  ],
  
  ir_metadata: {
    created_at: "2026-07-01T00:00:00Z",
    created_by: "AdapterAuthority",
    frozen: true,
    hash: "sha256:def456..."
  }
};
```

---

## Step 3: Code Generator

**Purpose:** IR is compiled to vendor-specific adapter code.

**Generator Interface:**
```javascript
class AdapterCodeGenerator {
  constructor(ir, adapterContract) {
    this._ir = ir;
    this._adapterContract = adapterContract;
  }
  
  generateAdapterSource() {
    const adapterSource = this._generateFromIR(this._ir);
    
    return {
      adapter_source: adapterSource,
      adapter_source_hash: this._computeHash(adapterSource)
    };
  }
  
  _generateFromIR(ir) {
    let source = `
class Generated${ir.capability_name}Adapter extends CapabilityAdapter {
  constructor(configuration) {
    super(configuration);
    this._validateConfiguration();
  }
`;
    
    for (const method of ir.methods) {
      source += this._generateMethodFromIR(method);
    }
    
    source += `
  _translateError(error, method) {
    // Error translation logic
  }

  _validateConfiguration() {
    // Configuration validation logic
  }
`;
    
    for (const method of ir.methods) {
      source += `  async _${method.name}Impl(${this._generateParameters(method)}) { throw new Error('Not implemented'); }\n`;
    }
    
    source += "}\n";
    
    return source;
  }
  
  _generateMethodFromIR(method) {
    return `
  async ${method.name}(${this._generateParameters(method)}) {
    const startTime = Date.now();
    this._metrics.recordRequest();
    
    try {
      const result = await this._${method.name}Impl(${this._generateParameterNames(method)});
      this._metrics.recordSuccess(Date.now() - startTime);
      this._logger.info('${method.name} succeeded', ${this._generateLogContext(method)});
      return result;
    } catch (error) {
      this._metrics.recordFailure(Date.now() - startTime);
      const translatedError = this._translateError(error, '${method.name}');
      this._logger.error('${method.name} failed', { error: translatedError.message });
      throw translatedError;
    }
  }
`;
  }
  
  _computeHash(source) {
    return crypto.createHash('sha256').update(source).digest('hex');
  }
}
```

---

## Step 4: Generated Adapter

**Purpose:** Generated adapter source is compiled to vendor-specific adapter.

**Vendor Adapter:**
```javascript
const PostgreSQLArtifactStoreAdapter = {
  adapter_id: "adapter_2026_07_01_001",
  adapter_name: "PostgreSQLArtifactStoreAdapter",
  adapter_version: "1.0.0",
  
  adapter_source: `
class PostgreSQLArtifactStoreAdapter extends GeneratedArtifactStoreAdapter {
  constructor(configuration) {
    super(configuration);
    this._client = null;
  }

  async initialize() {
    const { Client } = require('pg');
    this._client = new Client({ connectionString: this._configuration.connection_string });
    await this._client.connect();
    
    await this._client.query(\`
      CREATE TABLE IF NOT EXISTS \${this._configuration.table_name} (
        artifact_id VARCHAR(255) PRIMARY KEY,
        artifact_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    \`);
  }

  async _saveArtifactImpl(artifact) {
    const result = await this._client.query(
      \`INSERT INTO \${this._configuration.table_name} (artifact_id, artifact_data) 
       VALUES ($1, $2) 
       ON CONFLICT (artifact_id) DO NOTHING 
       RETURNING artifact_id\`,
      [artifact.artifact_id, JSON.stringify(artifact)]
    );
    
    if (result.rows.length === 0) {
      throw new Error('DUPLICATE_KEY');
    }
    
    return { artifact_id: artifact.artifact_id };
  }

  async _getArtifactImpl(artifactId) {
    const result = await this._client.query(
      \`SELECT artifact_data FROM \${this._configuration.table_name} WHERE artifact_id = $1\`,
      [artifactId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('NOT_FOUND');
    }
    
    return result.rows[0].artifact_data;
  }

  async shutdown() {
    if (this._client) {
      await this._client.end();
    }
  }
}
`,
  
  adapter_source_hash: "sha256:ghi789...",
  generated_adapter_hash: "sha256:jkl012...",
  
  adapter_metadata: {
    created_at: "2026-07-01T00:00:00Z",
    created_by: "AdapterAuthority",
    frozen: true,
    hash: "sha256:mno345..."
  }
};
```

---

## Step 5: Adapter Manifest

**Purpose:** Metadata about adapter for constitutional traceability.

```javascript
const AdapterManifest = {
  manifest_id: "am_2026_07_01_001",
  adapter_id: "adapter_2026_07_01_001",
  
  capability_contract_hash: "sha256:abc123...",
  ir_hash: "sha256:def456...",
  adapter_contract_hash: "sha256:pqr678...",
  adapter_source_hash: "sha256:ghi789...",
  generated_adapter_hash: "sha256:jkl012...",
  
  vendor: "PostgreSQL",
  vendor_version: "17",
  
  manifest_metadata: {
    created_at: "2026-07-01T00:00:00Z",
    created_by: "AdapterAuthority",
    frozen: true,
    hash: "sha256:mno345..."
  }
};
```

---

## Step 6: Adapter Witness

**Purpose:** Constitutional witness for adapter for replay safety.

```javascript
const AdapterWitness = {
  witness_id: "aw_2026_07_01_001",
  adapter_id: "adapter_2026_07_01_001",
  
  adapter_manifest_hash: "sha256:mno345...",
  
  compilation_witness: {
    compilation_timestamp: "2026-07-01T00:00:00Z",
    compilation_duration_ms: 1000,
    compilation_success: true,
    compilation_errors: []
  },
  
  validation_witness: {
    validation_timestamp: "2026-07-01T00:00:00Z",
    validation_success: true,
    validation_errors: []
  },
  
  test_witness: {
    test_timestamp: "2026-07-01T00:00:00Z",
    test_success: true,
    test_errors: [],
    test_results: {
      unit_tests: { passed: 10, failed: 0 },
      integration_tests: { passed: 5, failed: 0 }
    }
  },
  
  witness_metadata: {
    created_at: "2026-07-01T00:00:00Z",
    created_by: "AdapterAuthority",
    frozen: true,
    hash: "sha256:pqr678..."
  }
};
```

---

## Step 7: Technology Manifest

**Purpose:** Technology Manifest references adapter witness.

```javascript
const TechnologyManifest = {
  manifest_id: "tm_2026_07_01_001",
  version: "1.0.0",
  
  artifact_store: {
    component: "PostgreSQL",
    version: "17",
    checksum: "sha256:mno345...",
    adapter_witness_hash: "sha256:pqr678...",
    capabilities: ["artifact_storage", "artifact_retrieval", "artifact_deletion", "artifact_listing"],
    compatibility_matrix: {
      postgresql_version: "17",
      compatible_with: ["16", "15"]
    }
  },
  
  // ... other components
  
  manifest_metadata: {
    created_at: "2026-07-01T00:00:00Z",
    created_by: "TechnologyAuthority",
    frozen: true,
    hash: "sha256:klm789...",
    previous_manifest_hash: null,
    approval_reference: "constitutional_approval_2026_07_01.json"
  }
};
```

---

## Adapter Authority Interface

```javascript
class AdapterAuthority {
  constructor() {
    this._capabilityContracts = new Map();
    this._adapterContracts = new Map();
    this._adapterIRs = new Map();
    this._adapterSources = new Map();
    this._generatedAdapters = new Map();
    this._adapterManifests = new Map();
    this._adapterWitnesses = new Map();
  }
  
  async generateAdapter(capabilityName, adapterName, vendor) {
    // 1. Get capability contract
    const capabilityContract = await this.getCapabilityContract(capabilityName);
    
    // 2. Get adapter contract
    const adapterContract = await this.getAdapterContract(adapterName);
    
    // 3. Generate IR
    const ir = await this.generateIR(capabilityContract);
    
    // 4. Generate adapter source
    const adapterSource = await this.generateAdapterSource(ir, adapterContract);
    
    // 5. Compile adapter
    const adapter = await this.compileAdapter(adapterSource, vendor);
    
    // 6. Create adapter manifest
    const manifest = await this.createAdapterManifest(adapter, capabilityContract, ir, adapterContract);
    
    // 7. Create adapter witness
    const witness = await this.createAdapterWitness(adapter, manifest);
    
    return {
      adapter,
      manifest,
      witness
    };
  }
  
  async generateIR(capabilityContract) {
    const ir = {
      ir_id: this._generateIRId(),
      ir_version: "1.0.0",
      capability_contract_hash: this._computeHash(capabilityContract),
      methods: this._compileToIR(capabilityContract),
      ir_metadata: {
        created_at: new Date().toISOString(),
        created_by: "AdapterAuthority",
        frozen: true,
        hash: null
      }
    };
    
    ir.ir_metadata.hash = this._computeHash(ir);
    this._adapterIRs.set(ir.ir_id, ir);
    
    return ir;
  }
  
  async generateAdapterSource(ir, adapterContract) {
    const generator = new AdapterCodeGenerator(ir, adapterContract);
    const adapterSource = generator.generateAdapterSource();
    
    this._adapterSources.set(adapterSource.adapter_source_hash, adapterSource);
    
    return adapterSource;
  }
  
  async compileAdapter(adapterSource, vendor) {
    const generatedAdapter = {
      adapter_id: this._generateAdapterId(),
      adapter_name: `${vendor}${adapterSource.capability_name}Adapter`,
      adapter_version: "1.0.0",
      adapter_source: adapterSource.adapter_source,
      adapter_source_hash: adapterSource.adapter_source_hash,
      generated_adapter: `${vendor}${adapterSource.capability_name}Adapter`,
      generated_adapter_hash: this._computeHash(adapterSource.adapter_source),
      vendor: vendor,
      adapter_metadata: {
        created_at: new Date().toISOString(),
        created_by: "AdapterAuthority",
        frozen: true,
        hash: null
      }
    };
    
    generatedAdapter.adapter_metadata.hash = this._computeHash(generatedAdapter);
    this._generatedAdapters.set(generatedAdapter.adapter_id, generatedAdapter);
    
    return generatedAdapter;
  }
  
  async createAdapterManifest(adapter, capabilityContract, ir, adapterContract) {
    const manifest = {
      manifest_id: this._generateManifestId(),
      adapter_id: adapter.adapter_id,
      capability_contract_hash: this._computeHash(capabilityContract),
      ir_hash: ir.ir_metadata.hash,
      adapter_contract_hash: this._computeHash(adapterContract),
      adapter_source_hash: adapter.adapter_source_hash,
      generated_adapter_hash: adapter.generated_adapter_hash,
      vendor: adapter.vendor,
      vendor_version: adapter.vendor_version,
      manifest_metadata: {
        created_at: new Date().toISOString(),
        created_by: "AdapterAuthority",
        frozen: true,
        hash: null
      }
    };
    
    manifest.manifest_metadata.hash = this._computeHash(manifest);
    this._adapterManifests.set(manifest.manifest_id, manifest);
    
    return manifest;
  }
  
  async createAdapterWitness(adapter, manifest) {
    const witness = {
      witness_id: this._generateWitnessId(),
      adapter_id: adapter_adapter_id,
      adapter_manifest_hash: manifest.manifest_metadata.hash,
      compilation_witness: await this._runCompilation(adapter),
      validation_witness: await this._runValidation(adapter),
      test_witness: await this._runTests(adapter),
      witness_metadata: {
        created_at: new Date().toISOString(),
        created_by: "AdapterAuthority",
        frozen: true,
        hash: null
      }
    };
    
    witness.witness_metadata.hash = this._computeHash(witness);
    this._adapterWitnesses.set(witness.witness_id, witness);
    
    return witness;
  }
}
```

---

## Benefits

**Constitutional Traceability:**
- Adapter source traced to capability contract
- Adapter source traced to IR
- Adapter source traced to adapter contract
- Generated adapter traced to adapter source
- Adapter manifest traces all relationships
- Adapter witness validates compilation, validation, and testing

**Replay Safety:**
- Adapters are compilable artifacts
- Adapter witnesses provide constitutional proof
- Adapter manifests provide traceability
- IR provides intermediate representation for verification

**Self-Hosting:**
- Adapters become constitutional artifacts
- Runtime can generate its own adapters
- Adapter generation is reproducible
- Adapter compilation is deterministic

**Provenance:**
- Every adapter has provenance
- Every adapter has reproducibility
- Every adapter has replay identity
- Every adapter has witness verification

---

## Migration Path

**Phase 1: Define IR Schema**
- Define IR structure
- Define IR compilation rules
- Define IR validation rules

**Phase 2: Implement Code Generator**
- Implement IR-to-code generator
- Implement vendor-specific generators
- Test code generation

**Phase 3: Implement Adapter Authority**
- Implement Adapter Authority
- Implement adapter generation pipeline
- Test adapter generation

**Phase 4: Integrate with Technology Manifest**
- Update Technology Manifest to reference adapter witnesses
- Update Technology Authority to manage adapter witnesses
- Test integration

**Phase 5: Replace Hand-Written Adapters**
- Replace hand-written adapters with generated adapters
- Remove hand-written adapter code
- Complete IR-based adapter compilation

---

## Summary

**IR-Based Adapter Compilation:**
- Capability Contract → Capability IR → Code Generator → Generated Adapter → Adapter Manifest → Adapter Witness → Technology Manifest
- Adapters become constitutional artifacts
- Every adapter has provenance, reproducibility, replay identity, witness verification

**Benefits:**
- Constitutional traceability
- Replay safety
- Self-hosting
- Provenance
