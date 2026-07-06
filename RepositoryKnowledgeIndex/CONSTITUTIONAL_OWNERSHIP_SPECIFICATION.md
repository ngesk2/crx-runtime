# CONSTITUTIONAL OWNERSHIP SPECIFICATION

**Generated**: 2026-07-05T00:00:00.000Z  
**Phase**: Phase Ω — Constitutional Ownership Specification  
**Purpose**: Single constitutional source of truth for all repository architectural decisions

---

## SECTION A — CONSTITUTIONAL AUTHORITIES

### Identity Authority

**Purpose**: Defines deterministic identity generation policy for all constitutional objects  
**Constitutional Boundary**: Layer 1 (Authorities)  
**Exclusive Responsibilities**:
- Generate deterministic object identities from canonical hashes
- Ensure identity uniqueness across all constitutional objects
- Provide identity verification and validation

**Permitted Dependencies**:
- CanonicalAuthority (for canonical hash generation)

**Forbidden Dependencies**:
- No runtime dependencies
- No persistence dependencies
- No gateway dependencies

**Current Owner**: Gateway (gateway/identity_authority.js)  
**Candidate Owners**: Kernel  
**Final Constitutional Owner**: **KERNEL**  
**Confidence**: High  
**Evidence**: Repository evidence graph classifies as true policy authority that must be kernel-owned. Used by 15 modules across gateway and kernel, creating cross-runtime coupling.

---

### Canonical Authority

**Purpose**: Defines canonical serialization and hashing policy used by all constitutional objects  
**Constitutional Boundary**: Layer 1 (Authorities)  
**Exclusive Responsibilities**:
- Define canonical byte serialization format
- Provide deterministic hash computation
- Ensure serialization consistency across all constitutional objects

**Permitted Dependencies**:
- None (pure function module)

**Forbidden Dependencies**:
- No runtime dependencies
- No persistence dependencies
- No external dependencies

**Current Owner**: Gateway (gateway/canonical_authority.js)  
**Candidate Owners**: Kernel  
**Final Constitutional Owner**: **KERNEL**  
**Confidence**: High  
**Evidence**: Repository evidence graph classifies as true policy authority. Highest coupling false seam (used by 15 modules). Creates cross-runtime dependency between gateway and kernel.

---

### Event Creation Authority

**Purpose**: Defines event creation, validation, and persistence policy  
**Constitutional Boundary**: Layer 1 (Authorities)  
**Exclusive Responsibilities**:
- Define event schema and validation rules
- Ensure event append ordering and consistency
- Provide event replay chain management

**Permitted Dependencies**:
- IdentityAuthority
- CanonicalAuthority
- ConstitutionalTimeAuthority

**Forbidden Dependencies**:
- No gateway route dependencies
- No direct persistence dependencies (must go through adapter)

**Current Owner**: Gateway (gateway/event_repository.js)  
**Candidate Owners**: Kernel  
**Final Constitutional Owner**: **KERNEL**  
**Evidence**: Misplaced runtime logic classification. Shares Postgres database with legacy commit-service (constitutional violation - duplicate writers). Should be kernel-owned to consolidate event write authority.

---

### Replay Authority

**Purpose**: Defines replay execution and determinism verification policy  
**Constitutional Boundary**: Layer 1 (Authorities)  
**Exclusive Responsibilities**:
- Define replay execution semantics
- Provide determinism verification
- Ensure replay correctness and consistency

**Permitted Dependencies**:
- IdentityAuthority
- CanonicalAuthority
- ConstitutionalTimeAuthority
- VerificationAuthority

**Forbidden Dependencies**:
- No gateway dependencies
- No direct persistence dependencies

**Current Owner**: Gateway (gateway/replay_authority.js)  
**Candidate Owners**: Kernel  
**Final Constitutional Owner**: **KERNEL**  
**Evidence**: Repository evidence graph classifies kernel as owner but status is "implemented_not_wired". Replay is a constitutional kernel capability.

---

### Verification Authority

**Purpose**: Defines constitutional object verification policy  
**Constitutional Boundary**: Layer 1 (Authorities)  
**Exclusive Responsibilities**:
- Define constitutional object verification rules
- Provide required field validation
- Ensure constitutional object correctness

**Permitted Dependencies**:
- CanonicalAuthority
- IdentityAuthority

**Forbidden Dependencies**:
- No runtime dependencies
- No persistence dependencies

**Current Owner**: Gateway (gateway/constitutional_verification_authority.js)  
**Candidate Owners**: Kernel  
**Final Constitutional Owner**: **KERNEL**  
**Evidence**: Verification is a constitutional kernel capability. Must be kernel-owned to ensure verification correctness.

---

### Witness Authority

**Purpose**: Defines Merkle-style certification and witness generation policy  
**Constitutional Boundary**: Layer 1 (Authorities)  
**Exclusive Responsibilities**:
- Define witness generation rules
- Provide Merkle tree construction
- Ensure witness correctness and consistency

**Permitted Dependencies**:
- CanonicalAuthority
- IdentityAuthority
- ConstitutionalTimeAuthority

**Forbidden Dependencies**:
- No runtime dependencies
- No direct persistence dependencies

**Current Owner**: Gateway (gateway/witness_authority.js)  
**Candidate Owners**: Kernel  
**Final Constitutional Owner**: **KERNEL**  
**Evidence**: Witness is a constitutional kernel capability. Must be kernel-owned to ensure witness correctness.

---

### Lineage Authority

**Purpose**: Defines object lineage tracking and ancestry policy  
**Constitutional Boundary**: Layer 1 (Authorities)  
**Exclusive Responsibilities**:
- Define lineage tracking rules
- Provide ancestry verification
- Ensure lineage correctness and consistency

**Permitted Dependencies**:
- IdentityAuthority
- CanonicalAuthority

**Forbidden Dependencies**:
- No runtime dependencies
- No direct persistence dependencies

**Current Owner**: Gateway (gateway/lineage_authority.js) and Legacy Commit Service (runtime/kernel/commit-service/src/persistence/lineage_store.ts)  
**Candidate Owners**: Kernel  
**Final Constitutional Owner**: **KERNEL**  
**Evidence**: **CONSTITUTIONAL VIOLATION** - Duplicate writers (gateway and legacy commit-service). Must be consolidated under single kernel authority.

---

### Knowledge Authority

**Purpose**: Defines knowledge graph construction and semantic analysis policy  
**Constitutional Boundary**: Layer 1 (Authorities)  
**Exclusive Responsibilities**:
- Define knowledge extraction rules
- Provide semantic analysis
- Ensure knowledge graph correctness

**Permitted Dependencies**:
- CanonicalAuthority
- IdentityAuthority
- Parser Authority

**Forbidden Dependencies**:
- No runtime dependencies
- No direct persistence dependencies

**Current Owner**: Gateway (gateway/knowledge_runtime.js)  
**Candidate Owners**: Kernel  
**Final Constitutional Owner**: **KERNEL**  
**Evidence**: Knowledge is a constitutional kernel capability. Must be kernel-owned to ensure knowledge correctness.

---

### Observation Authority

**Purpose**: Defines observability and health check policy  
**Constitutional Boundary**: Layer 3 (Applications) or Layer 4 (Infrastructure)  
**Exclusive Responsibilities**:
- Define health check rules
- Provide observability metrics
- Ensure system monitoring

**Permitted Dependencies**:
- All layers (observability is cross-cutting)

**Forbidden Dependencies**:
- No constitutional authority dependencies

**Current Owner**: Gateway (gateway/health_authority.js)  
**Candidate Owners**: Gateway  
**Final Constitutional Owner**: **GATEWAY**  
**Evidence**: Repository evidence graph classifies as gateway-owned guard or observability. Observability is a gateway-facing concern.

---

### Execution Authority

**Purpose**: Defines execution engine and runtime composition policy  
**Constitutional Boundary**: Layer 2 (Runtime)  
**Exclusive Responsibilities**:
- Define execution semantics
- Provide runtime composition
- Ensure execution correctness and determinism

**Permitted Dependencies**:
- All Layer 1 authorities
- DIContainer

**Forbidden Dependencies**:
- No gateway route dependencies
- No direct persistence dependencies

**Current Owner**: Gateway (runtime/execution_runtime.js)  
**Candidate Owners**: Kernel  
**Final Constitutional Owner**: **KERNEL**  
**Evidence**: Repository evidence graph classifies as misplaced runtime logic that must be kernel-owned. This is the execution engine itself and must be the exclusive runtime owner.

---

### Capability Authority

**Purpose**: Defines capability and permission policy  
**Constitutional Boundary**: Layer 1 (Authorities)  
**Exclusive Responsibilities**:
- Define capability rules
- Provide permission verification
- Ensure capability correctness

**Permitted Dependencies**:
- IdentityAuthority
- CanonicalAuthority

**Forbidden Dependencies**:
- No runtime dependencies
- No persistence dependencies

**Current Owner**: Gateway (gateway/capability_authority.js)  
**Candidate Owners**: Kernel  
**Final Constitutional Owner**: **KERNEL**  
**Evidence**: Capability is a constitutional kernel authority. Must be kernel-owned to ensure capability correctness.

---

### Time Authority

**Purpose**: Defines deterministic temporal semantics for replay and execution consistency  
**Constitutional Boundary**: Layer 1 (Authorities)  
**Exclusive Responsibilities**:
- Define deterministic time semantics
- Provide temporal ordering
- Ensure time consistency across replay

**Permitted Dependencies**:
- None (pure function module)

**Forbidden Dependencies**:
- No runtime dependencies
- No external time sources

**Current Owner**: Gateway (gateway/constitutional_time_authority.js)  
**Candidate Owners**: Kernel  
**Final Constitutional Owner**: **KERNEL**  
**Confidence**: High  
**Evidence**: Repository evidence graph classifies as true policy authority that must be kernel-owned. Provides deterministic temporal semantics for replay and execution consistency.

---

### Repository Persistence Authority

**Purpose**: Defines repository object storage and retrieval policy  
**Constitutional Boundary**: Layer 4 (Infrastructure / Projection)  
**Exclusive Responsibilities**:
- Define repository storage rules
- Provide object persistence
- Ensure storage correctness

**Permitted Dependencies**:
- CanonicalAuthority
- IdentityAuthority

**Forbidden Dependencies**:
- No gateway route dependencies
- No execution dependencies

**Current Owner**: Gateway (gateway/repository_store.js) and Legacy Commit Service (runtime/kernel/commit-service/src/persistence/artifact_store.ts)  
**Candidate Owners**: Kernel (as adapter)  
**Final Constitutional Owner**: **KERNEL (as adapter)**  
**Evidence**: **CONSTITUTIONAL VIOLATION** - Duplicate writers (gateway and legacy commit-service). Should be kernel-owned as adapter-level gateway interface.

---

### Projection Authority

**Purpose**: Defines projection and materialized view policy  
**Constitutional Boundary**: Layer 4 (Infrastructure / Projection)  
**Exclusive Responsibilities**:
- Define projection rules
- Provide materialized view management
- Ensure projection correctness

**Permitted Dependencies**:
- All authorities
- Event Authority

**Forbidden Dependencies**:
- No gateway route dependencies
- No execution dependencies

**Current Owner**: Gateway (gateway/runtime/projection_registry.js) and Worker (runtime/kernel/workers/qdrant_projection_worker.py)  
**Candidate Owners**: Kernel  
**Final Constitutional Owner**: **KERNEL**  
**Evidence**: Repository evidence graph classifies as misplaced runtime logic. Worker projection creates duplicate write paths. Must be kernel-owned with dedicated projection authority.

---

### Recommendation Authority

**Purpose**: Defines recommendation and inference policy  
**Constitutional Boundary**: Layer 3 (Applications)  
**Exclusive Responsibilities**:
- Define recommendation rules
- Provide inference capabilities
- Ensure recommendation correctness

**Permitted Dependencies**:
- Knowledge Authority
- All Layer 1 authorities

**Forbidden Dependencies**:
- No direct persistence dependencies

**Current Owner**: Gateway (gateway/inference_adapter.js)  
**Candidate Owners**: Gateway  
**Final Constitutional Owner**: **GATEWAY**  
**Evidence**: Recommendation is an application capability, not a constitutional authority. Gateway-owned is appropriate.

---

## SECTION B — MUTATION OWNERSHIP

### Events

**Constitutional Owner**: **KERNEL**  
**Current Implementation**: Gateway (gateway/event_repository.js) and Legacy Commit Service (runtime/kernel/commit-service/src/events/event_log.ts)  
**Illegal Duplicate Writers**: Gateway and Legacy Commit Service both write to events table  
**Required Single Writer**: Kernel Event Authority  
**Evidence**: Mutation domain conflict "postgres_event_overlap". Gateway and legacy commit-service both write to event persistence. Constitutional violation requiring consolidation.

---

### Artifacts

**Constitutional Owner**: **KERNEL**  
**Current Implementation**: Gateway (gateway/repository_store.js) and Legacy Commit Service (runtime/kernel/commit-service/src/persistence/artifact_store.ts)  
**Illegal Duplicate Writers**: Gateway and Legacy Commit Service both write to repository_objects/artifacts tables  
**Required Single Writer**: Kernel Artifact Authority  
**Evidence**: Mutation domain conflict "postgres_artifact_overlap". Gateway and legacy commit-service both write to artifact persistence. Constitutional violation requiring consolidation.

---

### Repository Objects

**Constitutional Owner**: **KERNEL (as adapter)**  
**Current Implementation**: Gateway (gateway/repository_store.js)  
**Illegal Duplicate Writers**: None (single writer but wrong owner)  
**Required Single Writer**: Kernel Repository Persistence Authority (as adapter)  
**Evidence**: Repository store should be kernel-owned as adapter-level gateway interface. Currently gateway-owned is constitutional violation.

---

### Identity

**Constitutional Owner**: **KERNEL**  
**Current Implementation**: Gateway (gateway/identity_authority.js)  
**Illegal Duplicate Writers**: None (single writer but wrong owner)  
**Required Single Writer**: Kernel Identity Authority  
**Evidence**: Identity authority should be kernel-owned. Currently gateway-owned is constitutional violation.

---

### Lineage

**Constitutional Owner**: **KERNEL**  
**Current Implementation**: Gateway (gateway/lineage_authority.js) and Legacy Commit Service (runtime/kernel/commit-service/src/persistence/lineage_store.ts)  
**Illegal Duplicate Writers**: Gateway and Legacy Commit Service both write to lineage table  
**Required Single Writer**: Kernel Lineage Authority  
**Evidence**: Lineage persistence has duplicate writers. Constitutional violation requiring consolidation.

---

### Witnesses

**Constitutional Owner**: **KERNEL**  
**Current Implementation**: Gateway (gateway/witness_authority.js)  
**Illegal Duplicate Writers**: None (single writer but wrong owner)  
**Required Single Writer**: Kernel Witness Authority  
**Evidence**: Witness authority should be kernel-owned. Currently gateway-owned is constitutional violation.

---

### Checkpoints

**Constitutional Owner**: **KERNEL (as infrastructure adapter)**  
**Current Implementation**: Gateway (gateway/checkpoint_authority.js)  
**Illegal Duplicate Writers**: None (single writer but wrong layer)  
**Required Single Writer**: Kernel Infrastructure Adapter  
**Evidence**: Checkpoint authority should be infrastructure adapter, not gateway-owned. Currently gateway-owned is constitutional violation.

---

### Qdrant Projections

**Constitutional Owner**: **KERNEL (as projection authority)**  
**Current Implementation**: Gateway (gateway/memory_authority.js, gateway/checkpoint_authority.js, gateway/context_compression_authority.js) and Worker (runtime/kernel/workers/qdrant_projection_worker.py)  
**Illegal Duplicate Writers**: Gateway and Worker both write to Qdrant memory collections  
**Required Single Writer**: Kernel Projection Authority  
**Evidence**: Mutation domain conflict "qdrant_memory_overlap". Gateway and worker both write to Qdrant memory collections. Constitutional violation requiring consolidation.

---

### PostgreSQL Persistence

**Constitutional Owner**: **KERNEL (as infrastructure adapter)**  
**Current Implementation**: Gateway (9 mutation owners), Legacy Commit Service (4 mutation owners), Worker (1 mutation owner)  
**Illegal Duplicate Writers**: Gateway, Legacy Commit Service, and Worker all write to Postgres  
**Required Single Writer**: Kernel Infrastructure Adapter  
**Evidence**: 3 Postgres write domains with 14 total mutation owners. Constitutional violation requiring consolidation.

---

## SECTION C — LAYER CONSTITUTION

### Layer 0: Constitutional Kernel

**Definition**: The immutable core of constitutional truth. Contains the fundamental authorities that define the system's constitutional guarantees.

**Components**:
- Identity Authority
- Canonical Authority
- Time Authority
- Verification Authority
- Witness Authority
- Lineage Authority
- Knowledge Authority
- Capability Authority

**Constitutional Guarantee**: These authorities must never leave Layer 0. They are the source of all constitutional truth.

---

### Layer 1: Authorities

**Definition**: Domain-specific authorities that implement constitutional policies defined in Layer 0.

**Components**:
- Event Creation Authority
- Replay Authority
- Execution Authority
- Projection Authority

**Constitutional Guarantee**: Authorities must depend only on Layer 0 and must never depend on Layer 2, 3, or 4.

---

### Layer 2: Runtime

**Definition**: Execution engine and runtime composition that uses authorities to execute operations.

**Components**:
- Execution Runtime
- DI Container
- Constitutional Execution Pipeline
- Dispatcher
- Reducer Registry
- Projection Registry
- Replay Decision Authority

**Constitutional Guarantee**: Runtime must depend only on Layer 0 and Layer 1. Must never depend on Layer 3 or Layer 4.

---

### Layer 3: Applications

**Definition**: Application-level logic that uses runtime and authorities to provide user-facing capabilities.

**Components**:
- Gateway Runtime (route wiring only)
- API Controller
- Routes (ingress only)
- Recommendation Authority
- Health Authority
- System Authority

**Constitutional Guarantee**: Applications must depend only on Layer 0, Layer 1, and Layer 2. Must never directly depend on Layer 4.

---

### Layer 4: Infrastructure / Projection

**Definition**: Infrastructure adapters and projection systems that provide persistence and materialized views.

**Components**:
- Repository Store (as adapter)
- Qdrant Bootstrap (as adapter)
- Projection Worker (as kernel-managed)
- All persistence adapters (Postgres, Qdrant, etc.)

**Constitutional Guarantee**: Infrastructure must depend only on Layer 0 and Layer 1. Must never depend on Layer 2 or Layer 3.

---

### Current Repository Layer Classification

| Component | Current Location | Constitutional Layer | Reason |
|-----------|------------------|---------------------|---------|
| Identity Authority | Gateway | Layer 0 | True policy authority, must be kernel-owned |
| Canonical Authority | Gateway | Layer 0 | True policy authority, must be kernel-owned |
| Time Authority | Gateway | Layer 0 | True policy authority, must be kernel-owned |
| Event Repository | Gateway | Layer 1 | Misplaced runtime logic, should be kernel-owned |
| Execution Runtime | Gateway | Layer 2 | Misplaced runtime logic, should be kernel-owned |
| DI Container | Gateway | Layer 2 | Misplaced runtime logic, should be kernel-owned |
| Gateway Runtime | Gateway | Layer 3 | Ingress service, correct layer |
| Repository Store | Gateway | Layer 4 | Should be adapter, currently gateway-owned |
| Legacy Commit Service | Legacy | Layer 4 | Should be retired or integrated into kernel |
| Worker | Worker | Layer 4 | Should be kernel-managed projection authority |

---

## SECTION D — GATEWAY CONSTITUTION

### What Gateway is Constitutionally Allowed to Own

**Layer 3 (Applications) Responsibilities**:
- Route wiring and HTTP ingress
- Protocol translation
- Request validation
- Response formatting
- Health checks and observability
- System operational guards

**Forbidden Gateway Responsibilities**:
- No constitutional authorities (Layer 0)
- No domain authorities (Layer 1)
- No execution logic (Layer 2)
- No direct persistence (Layer 4)
- No mutation ownership

---

### Current Gateway Responsibility Classification

| Responsibility | Classification | Reason |
|----------------|----------------|--------|
| Route wiring | **Constitutional** | Gateway is ingress service, correct layer |
| HTTP ingress | **Constitutional** | Gateway is ingress service, correct layer |
| Health Authority | **Constitutional** | Observability is gateway-facing concern |
| System Authority | **Constitutional** | Operational guards are gateway-facing concern |
| Identity Authority | **Constitutional Violation** | True policy authority, must be kernel-owned |
| Canonical Authority | **Constitutional Violation** | True policy authority, must be kernel-owned |
| Time Authority | **Constitutional Violation** | True policy authority, must be kernel-owned |
| Event Creation | **Constitutional Violation** | Domain authority, must be kernel-owned |
| Repository Persistence | **Constitutional Violation** | Should be adapter, not gateway-owned |
| Execution Logic | **Constitutional Violation** | Runtime logic, must be kernel-owned |

---

### Special Attention: Identity

**Current Status**: Gateway-owned (gateway/identity_authority.js)  
**Constitutional Violation**: True policy authority owned by gateway  
**Required Action**: Move to Layer 0 (Kernel)  
**Confidence**: High

---

### Special Attention: Canonicalization

**Current Status**: Gateway-owned (gateway/canonical_authority.js)  
**Constitutional Violation**: True policy authority owned by gateway  
**Required Action**: Move to Layer 0 (Kernel)  
**Confidence**: High

---

### Special Attention: Time

**Current Status**: Gateway-owned (gateway/constitutional_time_authority.js)  
**Constitutional Violation**: True policy authority owned by gateway  
**Required Action**: Move to Layer 0 (Kernel)  
**Confidence**: High

---

### Special Attention: Event Creation

**Current Status**: Gateway-owned (gateway/event_repository.js)  
**Constitutional Violation**: Domain authority owned by gateway  
**Required Action**: Move to Layer 1 (Kernel)  
**Confidence**: High

---

### Special Attention: Repository Persistence

**Current Status**: Gateway-owned (gateway/repository_store.js)  
**Constitutional Violation**: Should be adapter, not gateway-owned  
**Required Action**: Move to Layer 4 (Infrastructure Adapter)  
**Confidence**: High

---

## SECTION E — KERNEL CONSTITUTION

### What Kernel Must Exclusively Own

**Layer 0 (Constitutional Kernel) Components**:
- Identity Authority
- Canonical Authority
- Time Authority
- Verification Authority
- Witness Authority
- Lineage Authority
- Knowledge Authority
- Capability Authority

**Layer 1 (Authorities) Components**:
- Event Creation Authority
- Replay Authority
- Execution Authority
- Projection Authority

**Layer 2 (Runtime) Components**:
- Execution Runtime
- DI Container
- Constitutional Execution Pipeline
- Dispatcher
- Reducer Registry
- Projection Registry
- Replay Decision Authority

---

### Constitutional Evaluation

| Authority | Must Exist in Layer 0 | Must Exist in Layer 1 | Current Location | Constitutional Status |
|-----------|---------------------|---------------------|------------------|----------------------|
| Identity | **YES** | NO | Gateway | Violation |
| Replay | NO | **YES** | Gateway | Violation |
| Verification | **YES** | NO | Gateway | Violation |
| Canonicalization | **YES** | NO | Gateway | Violation |
| Lineage | **YES** | NO | Gateway + Legacy | Violation (duplicate) |
| Knowledge | **YES** | NO | Gateway | Violation |
| Observation | NO | NO | Gateway | Correct |
| Execution | NO | **YES** | Gateway | Violation |
| Time | **YES** | NO | Gateway | Violation |
| Capability | **YES** | NO | Gateway | Violation |

---

### Constitutional Conclusion

**Identity, Replay, Verification, Canonicalization, Lineage, Knowledge, Time, and Capability must exist entirely inside Layer 0 or Layer 1.**

**Current Status**: All are currently gateway-owned or have duplicate writers, representing constitutional violations.

---

## SECTION F — FALSE SEAMS

### False Seam Reinterpretation Using Constitutional Ownership

| False Seam | Why It Exists | Constitutional Owner | Should Disappear After Constitutional Closure |
|------------|--------------|---------------------|---------------------------------------------|
| legacy_commit_service | Independent HTTP server on port 3000 | Kernel (as adapter) | YES - should be retired or integrated into kernel |
| gateway/canonical_authority.js | Pure function module, appears isolated | Kernel (Layer 0) | YES - should move to kernel, eliminating cross-runtime coupling |
| gateway/event_repository.js | Encapsulated Postgres client | Kernel | YES - should move to kernel, consolidating event write authority |
| gateway/repository_store.js | Encapsulated Postgres client | Kernel (as adapter) | YES - should become adapter, eliminating gateway ownership |
| gateway/qdrant_bootstrap.js | Single module for Qdrant client initialization | Kernel (infrastructure adapter) | YES - should become adapter with namespace isolation |
| gateway/runtime/constitutional_execution_pipeline.js | Encapsulated pipeline execution | Kernel (Layer 2) | YES - should move to kernel, eliminating cross-runtime coupling |
| runtime/kernel/workers/qdrant_projection_worker.py | Separate Python process | Kernel (projection authority) | YES - should be kernel-managed, eliminating duplicate writes |
| gateway/event_read_authority.js | Read-only interface | Kernel (Layer 1) | YES - should move to kernel or become adapter |
| gateway/memory_authority.js | Encapsulated Qdrant client | Kernel (infrastructure adapter) | YES - should become adapter with namespace isolation |
| runtime/di_container.js | Generic dependency injection container | Kernel (Layer 2) | YES - should be kernel-owned with gateway adapter interface |

---

## SECTION G — LEGACY SERVICES

### Legacy Service Classification

| Legacy Service | Classification | Reason |
|----------------|----------------|--------|
| legacy_commit_service | **Duplicate Write Path** | Shares Postgres database with gateway, overlapping event and artifact persistence. Constitutional violation. |
| repository_store | **Adapter (misclassified)** | Should be infrastructure adapter consumed by kernel, not gateway-owned. |
| event_repository | **Duplicate Write Path** | Shares Postgres database with legacy commit-service, overlapping event persistence. Constitutional violation. |

---

### Special Evaluation: legacy_commit_service

**Current Status**: Independent HTTP server on port 3000  
**Classification**: **Duplicate Write Path**  
**Constitutional Owner**: Kernel (as adapter)  
**Reason**: Shares Postgres database with gateway, overlapping event and artifact persistence. No transaction isolation between gateway and legacy service writes.  
**Required Action**: Retire entirely or integrate into kernel as adapter.

---

### Special Evaluation: repository_store

**Current Status**: Gateway-owned persistence adapter  
**Classification**: **Adapter (misclassified)**  
**Constitutional Owner**: Kernel (as infrastructure adapter)  
**Reason**: Should be infrastructure adapter consumed by kernel, not gateway-owned. Currently gateway-owned is constitutional violation.  
**Required Action**: Move to kernel as adapter-level gateway interface.

---

### Special Evaluation: event_repository

**Current Status**: Gateway-owned event persistence  
**Classification**: **Duplicate Write Path**  
**Constitutional Owner**: Kernel  
**Reason**: Shares Postgres database with legacy commit-service, overlapping event persistence. Constitutional violation.  
**Required Action**: Move to kernel, consolidating event write authority.

---

## SECTION H — PATCH VALIDATION

### Patch Validation Against Constitutional Ownership

| Patch | Constitutional Status | Reason |
|-------|----------------------|--------|
| PATCH_001 (Introduce gateway-to-kernel adapter) | **Supports Constitution** | Introduces kernel adapter interface, moving gateway to ingress-only role. |
| PATCH_002 (Move EventRepository to kernel) | **Supports Constitution** | Consolidates event write authority under kernel. |
| PATCH_003 (Move EventReadAuthority to kernel) | **Supports Constitution** | Moves read authority to kernel or adapter. |
| PATCH_004 (Move policy authorities to kernel) | **Supports Constitution** | Moves Layer 0 authorities to kernel, eliminating cross-runtime coupling. |
| PATCH_005 (Retire legacy commit-service) | **Supports Constitution** | Eliminates duplicate write path. |
| PATCH_006 (Move RepositoryStore to adapter) | **Supports Constitution** | Reclassifies as infrastructure adapter. |
| PATCH_007 (Isolate Qdrant memory writes) | **Supports Constitution** | Isolates infrastructure adapters with namespace separation. |
| PATCH_008 (Move kernel runtime modules to execution boundary) | **Supports Constitution** | Moves Layer 2 runtime to kernel. |
| PATCH_009 (Consolidate Postgres write domains) | **Blocked by Missing Ownership** | Requires data migration and schema consolidation. High risk. |

---

## SECTION I — CONSTITUTIONAL MIGRATION ORDER

### Constitutional Ordering (Not Dependency-Based)

**Phase 0: Establish Constitutional Kernel**
- Move Layer 0 authorities to kernel (Identity, Canonical, Time, Verification, Witness, Lineage, Knowledge, Capability)
- This must happen first because all other layers depend on Layer 0

**Phase 1: Establish Authorities**
- Move Layer 1 authorities to kernel (Event Creation, Replay, Execution, Projection)
- This must happen after Phase 0 because authorities depend on Layer 0

**Phase 2: Establish Runtime**
- Move Layer 2 runtime to kernel (Execution Runtime, DI Container, Pipeline, Dispatcher, Reducers, Projections, Replay Decision)
- This must happen after Phase 1 because runtime depends on authorities

**Phase 3: Eliminate Duplicate Writers**
- Retire legacy commit-service
- Consolidate Postgres write domains
- Consolidate Qdrant write domains
- This must happen after Phase 2 because runtime must be established before consolidation

**Phase 4: Reclassify Infrastructure**
- Move Repository Store to adapter
- Isolate Qdrant memory writes
- Reclassify worker as kernel-managed projection authority
- This must happen after Phase 3 because duplicate writers must be eliminated first

**Phase 5: Demote Gateway**
- Introduce gateway-to-kernel adapter
- Demote gateway to ingress-only
- This must happen after Phase 4 because infrastructure must be classified first

---

## SECTION J — FINAL CONSTITUTION

### Definitive Answers

**Who owns Identity?**  
**KERNEL** (Layer 0)

**Who owns Replay?**  
**KERNEL** (Layer 1)

**Who owns Verification?**  
**KERNEL** (Layer 0)

**Who owns Canonicalization?**  
**KERNEL** (Layer 0)

**Who owns Lineage?**  
**KERNEL** (Layer 0)

**Who owns Knowledge?**  
**KERNEL** (Layer 0)

**Who owns Observation?**  
**GATEWAY** (Layer 3)

**Who owns Execution?**  
**KERNEL** (Layer 2)

**Who owns Time?**  
**KERNEL** (Layer 0)

**Who owns Capability?**  
**KERNEL** (Layer 0)

---

### What is Layer 0?

**Layer 0 is the Constitutional Kernel** - the immutable core of constitutional truth containing fundamental authorities (Identity, Canonical, Time, Verification, Witness, Lineage, Knowledge, Capability).

---

### What Must Never Leave Layer 0?

**Identity Authority, Canonical Authority, Time Authority, Verification Authority, Witness Authority, Lineage Authority, Knowledge Authority, and Capability Authority must never leave Layer 0.** These are the source of all constitutional truth.

---

### What Must Never Be Owned by Gateway?

**Gateway must never own:**
- Layer 0 authorities (Identity, Canonical, Time, Verification, Witness, Lineage, Knowledge, Capability)
- Layer 1 authorities (Event Creation, Replay, Execution, Projection)
- Layer 2 runtime (Execution Runtime, DI Container, Pipeline, Dispatcher, Reducers, Projections, Replay Decision)
- Direct persistence (must go through infrastructure adapters)
- Mutation ownership

---

### What Must Never Have Multiple Writers?

**The following must never have multiple writers:**
- Events
- Artifacts
- Repository Objects
- Identity
- Lineage
- Witnesses
- Checkpoints
- Qdrant Projections
- PostgreSQL Persistence

**Every constitutional responsibility must have one owner, one authority, one mutation source. Never multiple.**

---

## CONSTITUTIONAL COMPLETION

This specification is the constitutional source of truth for all future repository architectural decisions. Every future migration, deletion, refactor, and patch must be validated against this specification.

**Constitutional violations identified:**
- 10 false seams
- 3 mutation domain conflicts
- 8 Layer 0/1/2 authorities currently gateway-owned
- 2 duplicate write paths (legacy commit-service, worker projections)

**Constitutional closure required:**
- Move 8 authorities to kernel
- Retire legacy commit-service
- Consolidate 3 Postgres write domains
- Consolidate 2 Qdrant write domains
- Reclassify infrastructure adapters

**Status**: **CONSTITUTIONAL VIOLATIONS EXIST - CLOSURE REQUIRED**
