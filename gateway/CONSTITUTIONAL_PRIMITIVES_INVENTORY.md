# Constitutional Primitives Inventory

## Six Canonical Primitives (Layer 0)

### 1. SerializerAuthority
**Role:** Deterministic canonical serialization and hashing
**Properties:**
- No domain semantics
- Deterministic
- Universally reusable
- Replay-critical
- Versioned (getVersion, getSerializerId)
- Prevents drift

**Dependencies:** None (wraps CanonicalSerializer kernel)

**Used by:** WitnessAuthority, FailureAuthority, LineageAuthority, RetryAuthority, IdentityAuthority

**Constitutional Primitive:** YES - serialization is independent of witness generation

---

### 2. DeterministicIdAuthority
**Role:** Deterministic ID generation from canonical bytes
**Properties:**
- No domain semantics
- Deterministic (SHA256-based)
- Universally reusable
- Replay-critical
- No randomness
- No UUID generation

**Dependencies:** None (crypto only)

**Used by:** ArtifactAuthority, VerificationAuthority, ReplayCanonicalizerAuthority, ReplayRecorderAuthority

**Constitutional Primitive:** YES - ID generation is independent of artifact type

---

### 3. ConstitutionalTimeAuthority
**Role:** Deterministic time for replay
**Properties:**
- No domain semantics
- Deterministic (replay mode uses supplied timestamps)
- Universally reusable
- Replay-critical
- Runtime mode generates timestamps
- Replay mode consumes supplied timestamps

**Dependencies:** None

**Used by:** ArtifactAuthority, VerificationAuthority, ReplayCanonicalizerAuthority, ReplayRecorderAuthority

**Constitutional Primitive:** YES - time is independent of execution context

---

### 4. IdentityAuthority
**Role:** Centralized constitutional identity generation
**Properties:**
- No domain semantics (generates IDs for any type)
- Deterministic (via SerializerAuthority)
- Universally reusable
- Replay-critical
- Prevents ID drift across authorities
- Single constitutional identity law

**Dependencies:** SerializerAuthority

**Used by:** (intended for) FailureAuthority, ToolGateway, StreamingAuthority, InferenceWitness, RuntimeAuthority

**Constitutional Primitive:** YES - identity is independent of entity type

---

### 5. HashAuthority (proposed - currently merged into SerializerAuthority)
**Role:** Domain-separated hash functions
**Properties:**
- No domain semantics (hashing is mathematical operation)
- Deterministic
- Universally reusable
- Replay-critical
- Domain-separated: hashFile, hashAST, hashSymbol, hashImportGraph, hashCallGraph, hashTypeGraph, hashMission, hashReflection, hashRepository

**Dependencies:** None (crypto only)

**Used by:** (would be used by) CanonicalAuthority, various domain-specific authorities

**Constitutional Primitive:** YES - hashing is independent of data type

**Note:** Currently merged into CanonicalAuthority/SerializerAuthority. Could be extracted as separate primitive.

---

### 6. ArtifactResolver (proposed - currently merged into ArtifactAuthority)
**Role:** Artifact resolution and lookup
**Properties:**
- No domain semantics (resolves artifacts by ID)
- Deterministic (same ID → same artifact)
- Universally reusable
- Replay-critical
- Artifact storage abstraction

**Dependencies:** ArtifactStore (infrastructure)

**Used by:** (would be used by) all authorities that need artifact data

**Constitutional Primitive:** YES - artifact resolution is independent of artifact type

**Note:** Currently merged into ArtifactAuthority. Could be extracted as separate primitive.

---

## Alternative: ContextPackBuilder (proposed)

**Role:** Build constitutional context packs for replay
**Properties:**
- No domain semantics (packs constitutional data)
- Deterministic (same inputs → same pack)
- Universally reusable
- Replay-critical
- Context pack serialization

**Dependencies:** SerializerAuthority, DeterministicIdAuthority

**Used by:** (would be used by) ReplayEngine, ReplayValidator

**Constitutional Primitive:** YES - context packing is independent of execution context

**Note:** Does not currently exist. Would need to be created.

---

## Authority Classification (Full Inventory)

### Constitutional Primitives (Layer 0)
- SerializerAuthority ✅
- DeterministicIdAuthority ✅
- ConstitutionalTimeAuthority ✅
- IdentityAuthority ✅
- HashAuthority (proposed, currently in CanonicalAuthority)
- ArtifactResolver (proposed, currently in ArtifactAuthority)

### Semantic Authorities (Layer 1)
- WitnessAuthority (witness semantics)
- FailureAuthority (failure semantics)
- LineageAuthority (lineage semantics)
- RetryAuthority (retry semantics)
- VerificationAuthority (verification semantics)
- ExecutionAuthority (execution coordination)
- ArtifactAuthority (artifact creation)
- PromptAuthority (prompt semantics)
- ModelAuthority (model semantics)
- InferenceAuthority (inference semantics)
- EmbeddingAuthority (embedding semantics)
- EventAuthority (event semantics)

### Compiler Pass Candidates (Transformations)
- ReplayCanonicalizerAuthority (canonicalizes replay events)
- ReplayValidatorAuthority (validates replay equivalence)
- ReplayDeterminismAuthority (ensures replay determinism)
- CanonicalGraphAuthority (canonical graph transformations)
- CanonicalSymbolAuthority (symbol table transformations)

### Projection Candidates (Views)
- ExecutionMetadataAuthority (operational metadata projection)
- ExecutionPlanAuthority (execution plan projection)
- ReplayPlanAuthority (replay plan projection)
- ConstitutionalReflectionAuthority (reflection projection)
- ConstitutionalSchemaAuthority (schema projection)

### Adapter Candidates (Infrastructure Bridges)
- AdapterAuthority (adapter management)
- TechnologyAuthority (technology selection)
- PlatformAuthority (platform abstraction)
- RuntimeEnvironmentAuthority (environment abstraction)
- RuntimeIOAuthority (IO abstraction)
- FilesystemAuthority (filesystem abstraction)

### Commodity Infrastructure (Generic Utilities)
- BootAuthority (boot coordination)
- ConstitutionVersionAuthority (version management)
- StepRegistry (step registration)
- WitnessRegistry (witness registration)
- RepositoryAuthority (repository management)
- CertificationAuthority (certification management)
- PublicationAuthority (publication management)
- ProvenanceAuthority (provenance tracking)
- ProofAuthority (proof generation)
- ReflectionAuthority (reflection utilities)
- ConditionAuthority (condition evaluation)
- ParserAuthority (parsing utilities)
- CompilerLineageAuthority (compiler lineage)
- ReproducibleBuildAuthority (build reproducibility)
- MissionAuthority (mission management)
- MissionRuleAuthority (rule management)
- RuntimeAuthority (runtime coordination)
- RuntimeFailureAuthority (failure handling)
- RuntimeRecoveryAuthority (recovery coordination)
- ConstitutionalAuthority (canonical authority - could be split)

---

## Improvement Ideas

### Differing Constitutional Document Types

**1. Witness Documents**
- PromptWitness
- ModelWitness
- StreamingWitness
- ToolWitness
- CompletionWitness
- StateWitness
- FailureWitness
- RetryWitness
- LineageWitness

**2. Artifact Documents**
- PromptArtifact
- ModelArtifact
- VectorArtifact
- EmbeddingArtifact
- CompletionArtifact
- StateArtifact
- TranscriptArtifact

**3. Plan Documents**
- ExecutionPlan
- ReplayPlan
- BootPlan
- DependencyPlan

**4. Graph Documents**
- ExecutionGraph
- DependencyGraph
- CallGraph
- TypeGraph
- ImportGraph

**5. Metadata Documents**
- ExecutionMetadata
- ArtifactMetadata
- WitnessMetadata
- AuthorityMetadata

**6. Version Documents**
- ConstitutionVersion
- AuthorityVersion
- SchemaVersion
- ProtocolVersion

---

## Recommended Architecture

### Layer 0: Constitutional Primitives (6)
1. SerializerAuthority (serialization, hashing)
2. DeterministicIdAuthority (ID generation)
3. ConstitutionalTimeAuthority (deterministic time)
4. IdentityAuthority (constitutional identity)
5. HashAuthority (domain-separated hashing) - extract from CanonicalAuthority
6. ArtifactResolver (artifact resolution) - extract from ArtifactAuthority

### Layer 1: Semantic Authorities (domain-specific)
- WitnessAuthority, FailureAuthority, LineageAuthority, RetryAuthority, VerificationAuthority, ExecutionAuthority, ArtifactAuthority, PromptAuthority, ModelAuthority, InferenceAuthority, EmbeddingAuthority, EventAuthority

### Layer 2: Compiler Passes (transformations)
- ReplayCanonicalizerAuthority, ReplayValidatorAuthority, ReplayDeterminismAuthority, CanonicalGraphAuthority, CanonicalSymbolAuthority

### Layer 3: Projections (views)
- ExecutionMetadataAuthority, ExecutionPlanAuthority, ReplayPlanAuthority, ConstitutionalReflectionAuthority, ConstitutionalSchemaAuthority

### Layer 4: Adapters (infrastructure bridges)
- AdapterAuthority, TechnologyAuthority, PlatformAuthority, RuntimeEnvironmentAuthority, RuntimeIOAuthority, FilesystemAuthority

### Layer 5: Commodity Infrastructure (generic utilities)
- BootAuthority, ConstitutionVersionAuthority, StepRegistry, WitnessRegistry, RepositoryAuthority, CertificationAuthority, PublicationAuthority, ProvenanceAuthority, ProofAuthority, ReflectionAuthority, ConditionAuthority, ParserAuthority, CompilerLineageAuthority, ReproducibleBuildAuthority, MissionAuthority, MissionRuleAuthority, RuntimeAuthority, RuntimeFailureAuthority, RuntimeRecoveryAuthority, ConstitutionalAuthority

---

## Next Steps

1. Extract HashAuthority from CanonicalAuthority
2. Extract ArtifactResolver from ArtifactAuthority
3. Consolidate IdentityAuthority usage across all authorities
4. Document constitutional document types
5. Define compiler pass interfaces
6. Define projection interfaces
7. Define adapter interfaces
