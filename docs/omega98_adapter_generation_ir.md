# Ω.98.20 — Adapter Generation: IR-Based Compilation

**Objective:** Refine adapter generation to use Capability Contract → IR → Code Generator → Vendor Adapter. Adapters become compilable artifacts with adapter source, generated adapter, adapter manifest, and adapter witness. This is much stronger than simply generating classes.

---

## Problem

**Current Issue:**
Adapter generation directly generates classes from capability contracts. This is not strong enough for constitutional replay safety. Adapters should be compilable artifacts with full constitutional traceability.

---

## IR-Based Adapter Generation

**Architecture:**
```
Capability Contract
        ↓
IR (Intermediate Representation)
        ↓
Code Generator
        ↓
Vendor Adapter
```

---

## Adapter Artifacts

**Adapter Artifacts:**
1. **Adapter Source:** Source code for adapter
2. **Generated Adapter:** Compiled adapter code
3. **Adapter Manifest:** Metadata about adapter
4. **Adapter Witness:** Constitutional witness for adapter

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

## Step 2: IR (Intermediate Representation)

**Purpose:** Capability contract is compiled to IR for code generation.

**IR Structure:**
```javascript
const AdapterIR = {
  ir_id: "ir_2026_07_01_001",
  ir_version: "1.0.0",
  
  capability_contract_hash: "sha256:abc123...",
  
  // IR Methods
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
  
  // IR Metadata
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
    // Generate adapter source from IR
    const adapterSource = this._generateFromIR(this._ir);
    
    return {
      adapter_source: adapterSource,
      adapter_source_hash: this._computeHash(adapterSource)
    };
  }
  
  _generateFromIR(ir) {
    // Generate JavaScript adapter from IR
    let source = `
class Generated${ir.capability_name}Adapter extends CapabilityAdapter {
  constructor(configuration) {
    super(configuration);
    this._validateConfiguration();
  }
`;
    
    // Generate methods from IR
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
    
    // Generate abstract methods
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
  
  _generateParameters(method) {
    // Generate parameter list from IR
    return Object.keys(method.input).join(', ');
  }
  
  _generateParameterNames(method) {
    // Generate parameter names from IR
    return Object.keys(method.input).join(', ');
  }
  
  _generateLogContext(method) {
    // Generate log context from IR
    return Object.keys(method.output).map(key => `${key}: result.${key}`).join(', ');
  }
  
  _computeHash(source) {
    return crypto.createHash('sha256').update(source).digest('hex');
  }
}
```

---

## Step 4: Vendor Adapter

**Purpose:** Generated adapter source is compiled to vendor-specific adapter.

**Vendor Adapter:**
```javascript
const PostgreSQLArtifactStoreAdapter = {
  adapter_id: "adapter_2026_07_01_001",
  adapter_name: "PostgreSQLArtifactStoreAdapter",
  adapter_version: "1.0.0",
  
  // Adapter Source
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
  
  // Generated Adapter
  generated_adapter: "PostgreSQLArtifactStoreAdapter",
  generated_adapter_hash: "sha256:jkl012...",
  
  // Adapter Metadata
  adapter_metadata: {
    created_at: "2026-07-01T00:00:00Z",
    created_by: "AdapterAuthority",
    frozen: true,
    hash: "sha256:mno345..."
  }
};
```

---

## Adapter Manifest

**Purpose:** Metadata about adapter for constitutional traceability.

```javascript
const AdapterManifest = {
  manifest_id: "am_2026_07_01_001",
  adapter_id: "adapter_2026_07_01_001",
  
  // Capability Contract Reference
  capability_contract_hash: "sha256:abc123...",
  capability_contract_id: "cc_2026_07_01_001",
  
  // IR Reference
  ir_hash: "sha256:def456...",
  ir_id: "ir_2026_07_01_001",
  
  // Adapter Contract Reference
  adapter_contract_hash: "sha256:pqr678...",
  adapter_contract_id: "ac_2026_07_01_001",
  
  // Adapter Source Reference
  adapter_source_hash: "sha256:ghi789...",
  
  // Generated Adapter Reference
  generated_adapter_hash: "sha256:jkl012...",
  
  // Vendor Reference
  vendor: "PostgreSQL",
  vendor_version: "17",
  
  // Manifest Metadata
  manifest_metadata: {
    created_at: "2026-07-01T00:00:00Z",
    created_by: "AdapterAuthority",
    frozen: true,
    hash: "sha256:mno345..."
  }
};
```

---

## Adapter Witness

**Purpose:** Constitutional witness for adapter for replay safety.

```javascript
const AdapterWitness = {
  witness_id: "aw_2026_07_01_001",
  adapter_id: "adapter_2026_07_01_001",
  
  // Adapter Manifest Reference
  adapter_manifest_hash: "sha256:mno345...",
  
  // Compilation Witness
  compilation_witness: {
    compilation_timestamp: "2026-07-01T00:00:00Z",
    compilation_duration_ms: 1000,
    compilation_success: true,
    compilation_errors: []
  },
  
  // Validation Witness
  validation_witness: {
    validation_timestamp: "2026-07-01T00:00:00Z",
    validation_success: true,
    validation_errors: []
  },
  
  // Test Witness
  test_witness: {
    test_timestamp: "2026-07-01T00:00:00Z",
    test_success: true,
    test_errors: [],
    test_results: {
      unit_tests: { passed: 10, failed: 0 },
      integration_tests: { passed: 5, failed: 0 }
    }
  },
  
  // Witness Metadata
  witness_metadata: {
    created_at: "2026-07-01T00:00:00Z",
    created_by: "AdapterAuthority",
    frozen: true,
    hash: "sha256:pqr678..."
  }
};
```

---

## Adapter Authority Interface (Refined)

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
  
  // Capability Contract Management
  async defineCapabilityContract(capabilityName, contract) {
    this._capabilityContracts.set(capabilityName, contract);
  }
  
  async getCapabilityContract(capabilityName) {
    return this._capabilityContracts.get(capabilityName);
  }
  
  // Adapter Contract Management
  async defineAdapterContract(adapterName, contract) {
    this._adapterContracts.set(adapterName, contract);
  }
  
  async getAdapterContract(adapterName) {
    return this._adapterContracts.get(adapterName);
  }
  
  // IR Generation
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
  
  // Code Generation
  async generateAdapterSource(ir, adapterContract) {
    const generator = new AdapterCodeGenerator(ir, adapterContract);
    const adapterSource = generator.generateAdapterSource();
    
    this._adapterSources.set(adapterSource.adapter_source_hash, adapterSource);
    
    return adapterSource;
  }
  
  // Adapter Compilation
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
  
  // Adapter Manifest Creation
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
  
  // Adapter Witness Creation
  async createAdapterWitness(adapter, manifest) {
    const witness = {
      witness_id: this._generateWitnessId(),
      adapter_id: adapter.adapter_id,
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
  
  // Full Adapter Generation Pipeline
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
}
```

---

## Benefits

**Constitutional Traceability:**
- Adapter source is traced to capability contract
- Adapter source is traced to IR
- Adapter source is traced to adapter contract
- Generated adapter is traced to adapter source
- Adapter manifest traces all relationships
- Adapter witness validates compilation, validation, and testing

**Replay Safety:**
- Adapters are compilable artifacts
- Adapter witnesses provide constitutional proof
- Adapter manifests provide traceability
- IR provides intermediate representation for verification

**Stronger than Class Generation:**
- Full artifact lifecycle (source → compile → manifest → witness)
- Constitutional validation at each step
- Traceability across all artifacts
- Replay safety through witnesses

---

## Summary

**IR-Based Adapter Generation:**
- Capability Contract → IR → Code Generator → Vendor Adapter
- Adapters become compilable artifacts
- Adapter artifacts: source, generated adapter, manifest, witness
- Constitutional traceability across all artifacts

**Benefits:**
- Constitutional traceability
- Replay safety
- Stronger than class generation
