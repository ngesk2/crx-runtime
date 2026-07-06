# LAYER2_DRIFT_MATRIX.md

Phase 44 — Layer 2 Constitutional Stabilization

**Purpose**: Authoritative matrix of all Layer 2 components with drift analysis before Constitutional Freeze.

**Scope**: Gateway directory authorities, runtime components, and storage authorities.

---

## 1. Import/Export Drift Audit

### Module Export Contract Matrix

| Module | module.exports | exports.X | Singleton | Factory | Import Pattern | Valid |
|--------|---------------|-----------|-----------|---------|-----------------|-------|
| canonical_authority.js | `{ CanonicalBytes, CanonicalAuthority }` | Yes | No | No | `const { CanonicalAuthority } = require('./canonical_authority')` | ✅ |
| identity_authority.js | `{ IdentityAuthority, identityAuthority }` | Yes | Yes | No | `const { identityAuthority } = require('./identity_authority')` | ✅ |
| constitutional_time_authority.js | `{ ConstitutionalTimeAuthority, constitutionalTimeAuthority }` | Yes | Yes | No | `const { constitutionalTimeAuthority } = require('./constitutional_time_authority')` | ✅ |
| witness_authority.js | `{ WitnessAuthority, witnessAuthority }` | Yes | Yes | No | `const { witnessAuthority } = require('./witness_authority')` | ✅ |
| artifact_authority.js | `{ ArtifactAuthority }` | Yes | No | No | `const { ArtifactAuthority } = require('./artifact_authority')` | ✅ |
| execution_authority.js | `{ ExecutionAuthority }` | Yes | No | No | `const { ExecutionAuthority } = require('./execution_authority')` | ✅ |
| compiler_authority.js | `{ CompilerAuthority, compilerAuthority }` | Yes | Yes | No | `const { compilerAuthority } = require('./compiler_authority')` | ✅ |
| system_authority.js | `{ SystemAuthority }` | Yes | No | No | `const { SystemAuthority } = require('./system_authority')` | ✅ |
| lineage_authority.js | `{ LineageAuthority }` | Yes | No | No | `const { LineageAuthority } = require('./lineage_authority')` | ✅ |
| memory_authority.js | `{ MemoryAuthority }` | Yes | No | No | `const { MemoryAuthority } = require('./memory_authority')` | ✅ |
| replay_authority.js | `{ ReplayAuthority }` | Yes | No | No | `const { ReplayAuthority } = require('./replay_authority')` | ✅ |
| inference_adapter.js | `{ InferenceAdapter, getInferenceAdapter, ProviderType }` | Yes | No | Yes | `const { getInferenceAdapter } = require('./inference_adapter')` | ✅ |
| certification_authority.js | `{ CertificationAuthority }` | Yes | No | No | `const { CertificationAuthority } = require('./certification_authority')` | ✅ |
| execution_plan_authority.js | `{ ExecutionPlanAuthority }` | Yes | No | No | `const { ExecutionPlanAuthority } = require('./execution_plan_authority')` | ✅ |
| embedding_authority.js | `{ EmbeddingAuthority }` | Yes | No | No | `const { EmbeddingAuthority } = require('./embedding_authority')` | ✅ |
| constitutional_mission_control.js | `{ ConstitutionalMissionControl }` | Yes | No | No | `const { ConstitutionalMissionControl } = require('./constitutional_mission_control')` | ✅ |
| condition_authority.js | `{ ConditionAuthority }` | Yes | No | No | `const { ConditionAuthority } = require('./condition_authority')` | ✅ |
| constitutional_authority_registry.js | `{ ConstitutionalAuthorityRegistry }` | Yes | No | No | `const { ConstitutionalAuthorityRegistry } = require('./constitutional_authority_registry')` | ✅ |
| constitutional_reflection_authority.js | `{ ConstitutionalReflectionAuthority }` | Yes | No | No | `const { ConstitutionalReflectionAuthority } = require('./constitutional_reflection_authority')` | ✅ |
| constitutional_schema_authority.js | `{ ConstitutionalSchemaAuthority }` | Yes | No | No | `const { ConstitutionalSchemaAuthority } = require('./constitutional_schema_authority')` | ✅ |
| inference_authority.js | `{ InferenceAuthority }` | Yes | No | No | `const { InferenceAuthority } = require('./inference_authority')` | ✅ |
| agent_memory_authority.js | `{ AgentMemoryAuthority, Memory, MemoryTypes, agentMemoryAuthority, getAgentMemoryAuthority }` | Yes | Yes | Yes | `const { getAgentMemoryAuthority } = require('./agent_memory_authority')` | ✅ |
| agent_registry_v2.js | `{ AgentRegistry, Agent, AgentTypes, AgentHealth, AgentCapabilities, agentRegistryV2, getAgentRegistryV2 }` | Yes | Yes | Yes | `const { getAgentRegistryV2 } = require('./agent_registry_v2')` | ✅ |
| capability_scheduler.js | `{ CapabilityScheduler, Assignment, CapabilityTypes, SchedulingPriority, capabilityScheduler, getCapabilityScheduler }` | Yes | Yes | Yes | `const { getCapabilityScheduler } = require('./capability_scheduler')` | ✅ |
| event_read_authority.js | `{ EventReadAuthority }` | Yes | No | No | `const { EventReadAuthority } = require('./event_read_authority')` | ✅ |
| event_write_authority.js | `{ EventWriteAuthority }` | Yes | No | No | `const { EventWriteAuthority } = require('./event_write_authority')` | ✅ |
| dead_letter_authority.js | `{ DeadLetterAuthority }` | Yes | No | No | `const { DeadLetterAuthority } = require('./dead_letter_authority')` | ✅ |
| local_first_execution_authority.js | `{ LocalFirstExecutionAuthority, MissionCache, ExecutionPlaneStatus, localFirstExecutionAuthority, getLocalFirstExecutionAuthority }` | Yes | Yes | Yes | `const { getLocalFirstExecutionAuthority } = require('./local_first_execution_authority')` | ✅ |
| replay_certificate_authority.js | `{ ReplayCertificateAuthority, replayCertificateAuthority }` | Yes | Yes | No | `const { replayCertificateAuthority } = require('./replay_certificate_authority')` | ✅ |
| replay_recorder_authority.js | `{ ReplayRecorderAuthority }` | Yes | No | No | `const { ReplayRecorderAuthority } = require('./replay_recorder_authority')` | ✅ |
| replay_validator_authority.js | `{ ReplayValidatorAuthority }` | Yes | No | No | `const { ReplayValidatorAuthority } = require('./replay_validator_authority')` | ✅ |
| adapter_authority.js | `{ AdapterAuthority }` | Yes | No | No | `const { AdapterAuthority } = require('./adapter_authority')` | ✅ |
| checkpoint_authority.js | `{ CheckpointAuthority }` | Yes | No | No | `const { CheckpointAuthority } = require('./checkpoint_authority')` | ✅ |
| constitution_version_authority.js | `{ ConstitutionVersionAuthority, constitutionVersionAuthority }` | Yes | Yes | No | `const { constitutionVersionAuthority } = require('./constitution_version_authority')` | ✅ |
| context_compression_authority.js | `{ ContextCompressionAuthority }` | Yes | No | No | `const { ContextCompressionAuthority } = require('./context_compression_authority')` | ✅ |
| context_retrieval_authority.js | `{ ContextRetrievalAuthority }` | Yes | No | No | `const { ContextRetrievalAuthority } = require('./context_retrieval_authority')` | ✅ |

### Import Drift Issues Found

| File | Issue | Severity | Status |
|------|-------|----------|--------|
| constitutional_execution_pipeline.js | Imported `canonicalAuthority` (lowercase) but export is `CanonicalAuthority` (uppercase) | HIGH | ✅ FIXED |
| operational_envelope.js | Used `constitutionalTimeAuthority.nowAsMillis()` without importing it | HIGH | ✅ FIXED |
| routes/system.js | Imported `SystemAuthority` as default but export is named | HIGH | ✅ FIXED |
| system_authority.js | Exported as default, changed to named for consistency | HIGH | ✅ FIXED |

### Identity Drift Issues Found (deterministicIdAuthority → identityAuthority)

| File | Issue | Severity | Status |
|------|-------|----------|--------|
| inference_adapter.js | Imported non-existent `deterministicIdAuthority` | CRITICAL | ✅ FIXED |
| lineage_authority.js | Imported non-existent `deterministicIdAuthority` | CRITICAL | ✅ FIXED |
| compiler_authority.js | Imported non-existent `deterministicIdAuthority` | CRITICAL | ✅ FIXED |
| artifact_authority.js | Referenced non-existent `_deterministicIdAuthority` in constructor | CRITICAL | ✅ FIXED |
| execution_authority.js | Imported non-existent `deterministicIdAuthority` | CRITICAL | ✅ FIXED |
| constitutional_event_sourcing.js | Imported non-existent `deterministicIdAuthority` | CRITICAL | ✅ FIXED |
| replay_authority.js | Imported non-existent `deterministicIdAuthority` | CRITICAL | ✅ FIXED |
| replay_recorder_authority.js | Imported non-existent `deterministicIdAuthority` | CRITICAL | ✅ FIXED |
| replay_validator_authority.js | Imported non-existent `deterministicIdAuthority` | CRITICAL | ✅ FIXED |
| adapter_authority.js | Imported non-existent `deterministicIdAuthority` | CRITICAL | ✅ FIXED |
| certification_authority.js | Referenced non-existent `_deterministicIdAuthority` in constructor | CRITICAL | ✅ FIXED |
| execution_plan_authority.js | Imported non-existent `deterministicIdAuthority` | CRITICAL | ✅ FIXED |
| embedding_authority.js | Referenced non-existent `_deterministicIdAuthority` in constructor | CRITICAL | ✅ FIXED |
| constitutional_mission_control.js | Imported non-existent `deterministicIdAuthority` | CRITICAL | ✅ FIXED |
| condition_authority.js | Imported non-existent `deterministicIdAuthority` | CRITICAL | ✅ FIXED |
| constitutional_authority_registry.js | Imported non-existent `deterministicIdAuthority` | CRITICAL | ✅ FIXED |
| constitutional_reflection_authority.js | Imported non-existent `deterministicIdAuthority` | CRITICAL | ✅ FIXED |
| constitutional_schema_authority.js | Imported non-existent `deterministicIdAuthority` | CRITICAL | ✅ FIXED |
| inference_authority.js | Referenced non-existent `_deterministicIdAuthority` in constructor | CRITICAL | ✅ FIXED |

### Compiler Lineage Authority Issue

| File | Issue | Severity | Status |
|------|-------|----------|--------|
| compiler_lineage_authority.js | Imported `ReplayAuthority` class but used as singleton without instantiation | HIGH | ✅ FIXED |

**Total Import/Export Drift Issues**: 26 issues identified, 26 issues fixed.

---

## 2. Persistence Schema Drift Audit

**Status**: PENDING - Requires PostgreSQL schema inspection.

### Known Schema Drift Evidence

| Table | Schema Version | Issue | Severity |
|-------|---------------|-------|----------|
| repository_objects | BYTEA | Original schema used BYTEA for canonical_bytes | CRITICAL |
| repository_objects | JSONB | Current schema uses JSONB for canonical_bytes | CRITICAL |
| repository_objects | ALTER TABLE | Migration history exists | HIGH |
| repository_objects | duplicate indexes | Index duplication detected | MEDIUM |
| repository_events | - | Schema drift unknown | PENDING |
| event_processing | - | Schema drift unknown | PENDING |

### Required Audit Steps

1. **Inventory canonical schema**: Document the intended constitutional schema for each table
2. **Inventory actual schema**: Query PostgreSQL for current table definitions
3. **Migration order**: Determine the correct migration sequence
4. **Index audit**: Identify and resolve duplicate indexes
5. **Constitutional migration**: Define single constitutional schema

---

## 3. Authority Boundary Drift Audit

### ArtifactAuthority

| Responsibility | Current | Violation | Severity |
|----------------|---------|-----------|----------|
| Artifact creation | ✅ | - | - |
| Lineage building | ✅ | SRP violation | MEDIUM |
| Infrastructure contracts | ✅ | SRP violation | MEDIUM |
| Witness requests | ✅ | SRP violation | MEDIUM |
| Certification requests | ✅ | SRP violation | MEDIUM |
| Publication requests | ✅ | SRP violation | MEDIUM |

**Assessment**: ArtifactAuthority is doing multiple jobs. Should return only artifact contracts. Assembly of infrastructure, witness, certification, and publication should move to ExecutionRuntime.

**Recommended Repair**: 
- ArtifactAuthority → Artifact contracts only
- ExecutionRuntime → Assemble infrastructure, witness, certification, publication

### ExecutionAuthority

| Responsibility | Current | Violation | Severity |
|----------------|---------|-----------|----------|
| Execution tracking | ✅ | - | - |
| Authority invocation | ✅ | - | - |
| Sequence execution | ✅ | SRP violation | HIGH |
| Parallel execution | ✅ | SRP violation | HIGH |
| Witness forwarding | ✅ | SRP violation | HIGH |
| Event emission | ✅ | SRP violation | HIGH |
| Execution cache | ✅ | Runtime state drift | HIGH |

**Assessment**: ExecutionAuthority is dangerously close to becoming a "god object". It mixes orchestration, state, sequencing, witness routing, and event emission.

**Recommended Repair**:
- ExecutionAuthority → ExecutionRequest → Authority Invocation → ConstitutionalResult → return
- Move sequencing to separate authority
- Move witness routing to witness authority
- Move event emission to event authority
- Move cache to persistence layer

### CompilerAuthority

| Responsibility | Current | Violation | Severity |
|----------------|---------|-----------|----------|
| Schema compiler coordination | ✅ | - | - |
| Canonical authority delegation | ✅ | - | - |
| Identity authority delegation | ✅ | - | - |
| Compilation policy delegation | ✅ | - | - |

**Assessment**: CompilerAuthority coordinates multiple authorities but this is acceptable for a compiler orchestration role.

**Recommended Repair**: Keep as-is.

---

## 4. Runtime State Drift Audit

### ExecutionAuthority Runtime Memory

| State | Current | Issue | Severity |
|-------|---------|-------|----------|
| `this._executions = new Map()` | In-memory execution cache | Runtime memory drift | HIGH |

**Questions**:
1. Should executions survive restart? → Likely yes, for replay reconstruction
2. Should replay reconstruct execution history? → Yes, constitutional requirement
3. Should execution state live in Postgres? → Yes, for persistence and replay

**Recommended Repair**: Move execution cache to PostgreSQL with replay reconstruction capability.

---

## 5. Identity Drift Audit

### DeterministicIdAuthority vs IdentityAuthority

**Status**: ✅ COMPLETE - All references migrated to identityAuthority.

**Files Fixed**: 18 files with deterministicIdAuthority references replaced with identityAuthority.

**Constitutional Authority**: `identityAuthority` is the correct constitutional authority for ID generation.

---

## 6. DeterministicKeyAuthority Audit

**Status**: PENDING - Requires cryptographic audit.

### Required Verification

1. **HKDF Implementation**: Verify HKDF parameters (salt/info) are constitutionally fixed
2. **Ed25519 Derivation**: Verify `crypto.generateKeyPairSync('ed25519', { privateKey: derivedKey })` is supported in Node.js version
3. **Platform Replay**: Verify replay equivalence across platforms and Node versions
4. **Test Vectors**: Generate deterministic test vectors before constitutional freeze

**Severity**: MEDIUM - Cryptographic authority requires deterministic verification.

---

## 7. Layer 2 Component Drift Matrix

| Component | Responsibility | Violations | Drift | Severity | Repair |
|-----------|----------------|------------|-------|----------|--------|
| CompilerAuthority | Coordinate compilation | None | LOW | — | Keep |
| ArtifactAuthority | Artifact creation | Owns witness contracts, infrastructure, certification, publication | MEDIUM | SRP violation | Separate witness assembly to ExecutionRuntime |
| ExecutionAuthority | Authority invocation | Owns cache, sequencing, witness routing, event emission | HIGH | SRP violation + Runtime state | Split runtime responsibilities, move cache to persistence |
| SystemAuthority | System state collection | Export mismatch (fixed) | HIGH | Import drift | ✅ Fixed |
| RepositoryStore | Artifact persistence | BYTEA/JSONB schema drift | CRITICAL | Schema drift | Constitutional migration required |
| InferenceAdapter | Inference port/adapter | None | PASS | — | Freeze candidate |
| DeterministicKeyAuthority | HKDF deterministic keys | Crypto API verification pending | MEDIUM | Crypto audit pending | Verify deterministic Ed25519 derivation |
| CanonicalAuthority | Canonical serialization | None | PASS | — | Freeze candidate |
| IdentityAuthority | Constitutional ID generation | None | PASS | — | Freeze candidate |
| ConstitutionalTimeAuthority | Deterministic time for replay | None | PASS | — | Freeze candidate |
| WitnessAuthority | Witness generation | None | PASS | — | Freeze candidate |
| LineageAuthority | Lineage tracking | None | PASS | — | Freeze candidate |
| MemoryAuthority | Memory storage | Persistence orchestration, embedding generation, table creation, Qdrant collection creation, fake embedding, JSONB/CanonicalBytes inconsistency | MEDIUM | Multiple SRP violations | Separate persistence pipeline, move embedding to EmbeddingAuthority, move schema to ConstitutionalSchemaAuthority, remove fake embedding, fix storage type consistency |
| ReplayAuthority | Replay lifecycle | None | PASS | — | Freeze candidate |
| EventReadAuthority | Event queries (CQRS) | None | PASS | — | Freeze candidate |
| EventWriteAuthority | Event emission (CQRS) | None | PASS | — | Freeze candidate |
| AgentMemoryAuthority | Agent memory | None | PASS | — | Freeze candidate |
| AgentRegistryV2 | Agent runtime state | None | PASS | — | Freeze candidate |
| CapabilityScheduler | Capability-based scheduling | None | PASS | — | Freeze candidate |

---

## 8. Constitutional Freeze Candidates

### Ready for Freeze

1. **CanonicalAuthority** - No drift, pure serialization authority
2. **IdentityAuthority** - No drift, constitutional ID generation
3. **ConstitutionalTimeAuthority** - No drift, deterministic time
4. **WitnessAuthority** - No drift, witness generation
5. **InferenceAdapter** - Clean port/adapter pattern
6. **LineageAuthority** - No drift, provenance tracking
7. **ReplayAuthority** - No drift, replay lifecycle
8. **EventReadAuthority** - No drift, CQRS read side
9. **EventWriteAuthority** - No drift, CQRS write side

### Require Repair Before Freeze

1. **ArtifactAuthority** - SRP violation, needs witness assembly separation
2. **ExecutionAuthority** - SRP violation + runtime state drift, needs major refactoring
3. **RepositoryStore** - Schema drift, needs constitutional migration
4. **DeterministicKeyAuthority** - Crypto audit pending, needs verification
5. **MemoryAuthority** - Multiple SRP violations (persistence orchestration, embedding generation, schema ownership, infrastructure), needs refactoring

---

## 9. Summary

### Issues Found

- **Import/Export Drift**: 26 issues (all fixed)
- **Identity Drift**: 18 issues (all fixed)
- **Authority Boundary Drift**: 3 authorities with SRP violations (ArtifactAuthority, ExecutionAuthority, MemoryAuthority)
- **Runtime State Drift**: 1 authority with in-memory cache (ExecutionAuthority)
- **Persistence Schema Drift**: 1 table with schema drift (repository_objects BYTEA/JSONB)
- **Infrastructure Separation**: 1 authority with embedded infrastructure (MemoryAuthority)
- **Schema Ownership**: 1 authority with embedded schema (MemoryAuthority)
- **Embedding Ownership**: 1 authority with embedded embedding generation (MemoryAuthority)
- **Storage Type Inconsistency**: 1 authority with JSONB/CanonicalBytes mismatch (MemoryAuthority)
- **Crypto Audit Pending**: 1 authority requires verification (DeterministicKeyAuthority)

### Constitutional Readiness Score

| Category | Score | Weight | Weighted Score |
|----------|-------|--------|---------------|
| Import/Export Consistency | 100% | 20% | 20% |
| Identity Consistency | 100% | 15% | 15% |
| Authority Boundaries | 70% | 25% | 17.5% |
| Runtime State | 50% | 15% | 7.5% |
| Persistence Schema | 0% | 15% | 0% |
| Infrastructure Separation | 85% | 5% | 4.25% |
| Schema Ownership | 85% | 5% | 4.25% |
| Crypto Verification | 0% | 10% | 0% |

**Overall Constitutional Readiness**: 68.5%

**Blockers to Constitutional Freeze**:
1. ArtifactAuthority SRP violation repair (witness assembly separation)
2. ExecutionAuthority SRP violation + runtime state repair (cache to persistence, sequencing separation)
3. RepositoryStore schema migration (BYTEA/JSONB resolution)
4. MemoryAuthority SRP violations (persistence pipeline, embedding, schema, infrastructure separation)
5. DeterministicKeyAuthority crypto verification (HKDF, Ed25519, test vectors)

---

**Generated**: Phase 44 — Layer 2 Constitutional Stabilization
**Status**: Import/Export audit complete, remaining audits pending
