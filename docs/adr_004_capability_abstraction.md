# ADR-004: Capability Abstraction

**Status:** Proposed
**Date:** 2026-06-29
**Phase:** Ω.98 — Constitutional Implementation Directive — Adopt Before Build

---

## Problem

**Current State:**
Authorities and Runtime currently request concrete infrastructure technologies directly:
- ArtifactAuthority requests `postgres` (concrete adapter)
- InferenceAuthority requests `ollama` (concrete adapter)
- EmbeddingAuthority requests `ollama` (concrete adapter)
- CertificationAuthority requests `postgres` (concrete adapter)
- PublicationAuthority requests `postgres` (concrete adapter)
- ExecutionRuntime requests `nats` (concrete adapter)

There is no capability abstraction layer. This violates constitutional principles:

1. **Technology coupling:** Authorities are coupled to concrete infrastructure technologies
2. **No infrastructure independence:** Cannot replace infrastructure without changing authorities
3. **Runtime knows infrastructure:** Runtime requests concrete technologies
4. **No capability registry:** No centralized capability discovery and resolution
5. **No pluggable implementations:** Cannot swap implementations without code changes

**Constitutional Requirement:**
Capability abstraction must replace every technology reference (postgres, ollama, qdrant, nats, redis) with constitutional capabilities (ArtifactStore, InferenceEngine, EmbeddingEngine, VectorStore, EventStore, WitnessStore, PolicyStore, PublicationStore, CertificationStore). Only infrastructure adapters know concrete implementations. Authorities request capabilities only. Runtime knows neither.

---

## Alternatives Considered

### Alternative 1: Build Custom Capability Abstraction

**Description:**
Design and implement capability abstraction from scratch without reference to existing open-source capability abstraction systems.

**Pros:**
- Complete control over design
- No external dependencies
- Tailored to constitutional requirements

**Cons:**
- Re-inventing well-solved problems
- High risk of subtle bugs in capability resolution logic
- No proven track record
- Misses opportunity to leverage mature battle-tested code
- Violates Ω.97 directive to mine proven open-source systems

**Constitutional Justification:**
**REJECTED** - Violates Ω.97 directive. Capability abstraction is a well-solved problem; re-inventing it is unnecessary risk.

---

### Alternative 2: Use Dapr as Infrastructure

**Description:**
Deploy Dapr sidecar and use Dapr as the capability abstraction infrastructure. Authorities become Dapr clients.

**Pros:**
- Leverages proven Dapr building blocks
- Battle-tested capability abstraction
- Mature component ecosystem
- Language-agnostic sidecar architecture

**Cons:**
- Introduces operational dependency (Dapr sidecar)
- Authorities become coupled to Dapr-specific APIs
- Violates capability abstraction (authorities know about Dapr)
- Vendor lock-in to Dapr ecosystem
- Sidecar architecture adds operational complexity
- Constitutional authorities should not depend on external infrastructure

**Constitutional Justification:**
**REJECTED** - Violates constitutional principle that authorities must be infrastructure-agnostic. Authorities should not know about Dapr or any specific infrastructure.

---

### Alternative 3: Mine Dapr Concepts, Build Constitutional Capability Abstraction

**Description:**
Study Dapr's building block and component model, extract the core concepts (building block APIs, component abstraction, capability registry), and implement a constitutional CapabilityRegistry that uses these concepts without importing Dapr infrastructure.

**Pros:**
- Leverages proven capability abstraction concepts
- No external infrastructure dependency
- Constitutional authorities remain pure
- CapabilityRegistry remains infrastructure-agnostic
- Aligns with Ω.97 directive to mine proven open-source systems

**Cons:**
- Requires careful extraction of concepts (risk of missing edge cases)
- Implementation effort to adapt concepts to constitutional model
- Need to validate capability resolution guarantees

**Constitutional Justification:**
**ACCEPTED** - Aligns with Ω.97 directive. Mines proven capability abstraction concepts while maintaining constitutional purity. CapabilityRegistry remains infrastructure-agnostic.

---

### Alternative 4: Use Service Binding Specification as Infrastructure

**Description:**
Same as Alternative 2 but using Service Binding Specification instead of Dapr.

**Pros:**
- Kubernetes-wide specification
- Consistent secret communication
- Portable binding mechanism

**Cons:**
- Kubernetes-specific
- Focused on secret binding (too narrow)
- Not designed for general capability abstraction
- Same constitutional violations as Alternative 2

**Constitutional Justification:**
**REJECTED** - Same constitutional violations as Alternative 2. Also Kubernetes-specific and too narrow.

---

### Alternative 5: Use Crossplane as Infrastructure

**Description:**
Same as Alternative 2 but using Crossplane instead of Dapr.

**Pros:**
- Infrastructure abstraction
- API-first infrastructure
- Multi-cloud support

**Cons:**
- Kubernetes-specific
- Focused on infrastructure provisioning (too narrow)
- Complex control plane
- Same constitutional violations as Alternative 2

**Constitutional Justification:**
**REJECTED** - Same constitutional violations as Alternative 2. Also infrastructure provisioning focus is too narrow.

---

## Selected Approach

**Alternative 3: Mine Dapr Concepts, Build Constitutional Capability Abstraction**

Primary source: Dapr (for building block API model, component abstraction, capability registry)
Secondary source: Service Binding Specification (for service binding patterns, workload-to-service linkage)
Tertiary source: Crossplane (for infrastructure abstraction patterns, API-first infrastructure)

**Critical Separation:**
CapabilityRegistry is NOT Dapr. CapabilityRegistry owns constitutional capability semantics. Dapr is an implementation detail underneath.

**CapabilityRegistry exposes ONLY constitutional capabilities:**
- ArtifactStore
- ReplayStore
- WitnessStore
- InferenceEngine
- EmbeddingEngine
- PolicyStore
- ExecutionEngine
- PublicationStore
- CertificationStore

**CapabilityRegistry NEVER exposes Dapr concepts:**
- State Store (Dapr concept)
- Pub/Sub (Dapr concept)
- Binding (Dapr concept)
- Secret Store (Dapr concept)
- Building blocks (Dapr concept)
- Components (Dapr concept)

**Architecture:**
```
CapabilityRegistry
      ↓
Constitutional Capability Request (e.g., ArtifactStore)
      ↓
CapabilityAdapter
      ↓
DaprAdapter (maps ArtifactStore → StateStore or EventStore)
      ↓
Dapr
```

**NOT:**
```
CapabilityRegistry
      ↓
Dapr Building Blocks (State Store, Pub/Sub, etc.)
```

---

## Extracted Concepts

### From Dapr

1. **Building Block API Model**
   - Portable APIs (state, pubsub, invoke, etc.)
   - HTTP/gRPC interface
   - Standardized API contracts
   - Capability discovery

2. **Component Abstraction Pattern**
   - Pluggable implementations
   - Component YAML configuration
   - Component registry
   - Component lifecycle management

3. **Capability Registry Pattern**
   - Component discovery
   - Capability resolution
   - Component selection
   - Component validation

### From Service Binding Specification

1. **Service Binding Patterns**
   - Service binding specification
   - Workload-to-service linkage
   - Secret projection
   - Binding lifecycle

2. **Workload-to-Service Linkage**
   - Service discovery
   - Service resolution
   - Service binding
   - Service unbinding

3. **Portable Binding Mechanism**
   - Portable binding
   - Consistent binding
   - Binding validation

4. **Decoupling Patterns**
   - Workload decoupling from service
   - Service implementation hiding
   - Service abstraction
   - Service portability

### From Crossplane

1. **Infrastructure Abstraction Patterns**
   - Workload abstraction
   - Resource abstraction
   - Managed service abstraction
   - Multi-cloud patterns

2. **API-First Infrastructure Model**
   - API-driven infrastructure
   - Declarative infrastructure
   - Infrastructure as code patterns

---

## Rejected Concepts

### From Dapr

1. **Dapr Sidecar Infrastructure**
   - We don't need sidecars
   - We have constitutional authorities

2. **Vendor-Specific Client APIs**
   - We need constitutional interfaces
   - We don't need Dapr SDKs

3. **Dapr-Specific Tooling**
   - We need simple constitutional authority
   - We don't need Dapr tooling

4. **Kubernetes-Specific Patterns**
   - We need infrastructure-agnostic
   - We don't need Kubernetes

5. **UI/Observability Stack**
   - We have separate observability
   - We don't need Dapr UI

### From Service Binding Specification

1. **Kubernetes-Specific CRDs**
   - We need infrastructure-agnostic
   - We don't need Kubernetes

2. **Secret Binding Focus**
   - Too narrow for constitutional capability abstraction
   - We need broader capability model

3. **Not General Capability Abstraction**
   - We need general capability abstraction
   - Service binding is too narrow

4. **Kubernetes Resource Dependencies**
   - We need infrastructure-agnostic
   - We don't need Kubernetes resources

### From Crossplane

1. **Kubernetes-Specific Control Plane**
   - We need infrastructure-agnostic
   - We don't need control plane

2. **Infrastructure Provisioning Focus**
   - Too narrow for constitutional capability abstraction
   - We need general capability model

3. **Complex Control Plane Infrastructure**
   - We don't need control plane
   - We have constitutional authorities

4. **Vendor-Specific CRDs**
   - We need constitutional interfaces
   - We don't need Crossplane CRDs

---

## Constitutional Justification

### Alignment with Constitutional Principles

1. **Infrastructure Independence**
   - Authorities request capabilities, not technologies
   - Runtime requests capabilities, not technologies
   - Infrastructure can be replaced without changing authorities

2. **Capability Abstraction**
   - Concrete technologies are hidden behind capabilities
   - Only infrastructure adapters know concrete implementations
   - Authorities and Runtime are infrastructure-agnostic

3. **Pluggable Implementations**
   - Capability implementations can be swapped without code changes
   - Component configuration drives implementation selection
   - Capability registry enables dynamic resolution

4. **Centralized Capability Discovery**
   - CapabilityRegistry is the single constitutional capability authority
   - Capability discovery and resolution is centralized
   - No scattered capability logic

5. **No Vendor Lock-In**
   - No dependency on Dapr sidecar
   - No dependency on Dapr SDKs
   - Only concepts are mined, not implementation

### Alignment with Ω.97 Directive

1. **Mine Proven Open-Source Systems**
   - Dapr is proven at scale
   - Capability abstraction is battle-tested
   - Building block model is well-understood

2. **Extract Only Deterministic Core**
   - Building block API model
   - Component abstraction pattern
   - Capability registry pattern

3. **Wrap Behind Constitutional Authority**
   - CapabilityRegistry is constitutional authority
   - No vendor-specific APIs exposed to authorities
   - Authorities know nothing about Dapr

4. **Never Expose Vendor-Specific APIs**
   - Dapr APIs are not exposed
   - Only constitutional interfaces are exposed
   - Authorities know nothing about Dapr

---

## Open Source Adoption Justification

### Existing Project Surveyed
- **Dapr:** ~22,800 GitHub stars, 286+ contributors, Apache 2.0 license, CNCF graduated project
- **Service Binding Specification:** ~109 GitHub stars, ~10 contributors, Apache 2.0 license
- **Crossplane:** ~3,600 GitHub stars, 184+ contributors, Apache 2.0 license, CNCF graduated (October 2025)
- **SPIFFE:** ~1,800 GitHub stars, 60 contributors, Apache 2.0 license, CNCF project

### Why Adopted
**Dapr** was adopted because it meets the 80% threshold with 8/10 constitutional requirements satisfied:
- Core capability abstraction requirements are perfectly matched
- CNCF graduated project with proven track record at scale
- Active community (286+ contributors) and regular releases
- Gaps (constitutional capability types, witnesses) can be addressed by wrapper
- Wrapper size is manageable (~500-1000 lines)
- Building from scratch would require re-inventing proven capability abstraction logic

### Why Rejected
- **Service Binding Specification:** 20% threshold not met; Kubernetes-specific (not infrastructure-independent); no capability registry (constitutional requirement); too narrow (only service binding)
- **Crossplane:** 30% threshold not met; Kubernetes-specific (not infrastructure-independent); infrastructure provisioning focus (too narrow)
- **SPIFFE:** 20% threshold not met; identity-only focus (too narrow for constitutional capability abstraction); no capability registry (constitutional requirement)

### Wrapper Responsibilities
- Hide Dapr sidecar dependency (use embedded mode)
- Expose constitutional interfaces only
- Map constitutional capabilities to Dapr building blocks internally
- Add constitutional capability types (ArtifactStore, InferenceEngine, etc.)
- Add capability validation
- Add constitutional witnesses
- Add artifact lineage
- **Critical:** CapabilityRegistry never exposes Dapr terminology
- **Critical:** DaprAdapter is the only component that knows Dapr
- **Critical:** Authorities request constitutional capabilities only, never Dapr building blocks

### Constitutional Responsibilities
- CapabilityRegistry owns capability abstraction
- CapabilityRegistry owns capability discovery
- CapabilityRegistry owns capability resolution
- CapabilityRegistry owns constitutional capability types only
- CapabilityRegistry owns capability binding
- CapabilityRegistry owns capability validation
- Authorities request constitutional capabilities only
- Runtime requests constitutional capabilities only
- DaprAdapter maps constitutional capabilities to Dapr building blocks
- Dapr owns building block implementation

### Replay Guarantees
- Deterministic capability resolution via Dapr's component registry
- Deterministic component selection via Dapr's component configuration
- Capability binding is deterministic
- Capability validation is deterministic

### Vendor Isolation Guarantees
- No dependency on Dapr sidecar (use embedded mode)
- No dependency on Dapr SDKs (constitutional interfaces only)
- Authorities know nothing about Dapr
- Runtime knows nothing about Dapr
- Only concepts are mined, not implementation
- Infrastructure adapters hide concrete implementations

### Lines Reused vs. Newly Written
- **Lines Reused from OSS:** ~100,000+ lines (Dapr core)
- **Lines Newly Written:** ~500-1000 lines (wrapper)
- **Constitutional Wrapper Size:** Medium
- **Maintenance Reduction:** High (leverage Dapr maintenance)
- **Replay Safety Impact:** Positive (Dapr has proven capability abstraction safety)

---

## Implementation Plan

### Phase 1: Capability Registry Design
- Define CapabilityRegistry structure
- Define capability types (ArtifactStore, InferenceEngine, etc.)
- Define component abstraction pattern
- Define capability resolution algorithm

### Phase 2: Capability Interface Design
- Define capability interfaces for each capability type
- Define standard API contracts
- Define capability metadata
- Define capability validation

### Phase 3: Component Configuration Design
- Define component YAML configuration
- Define component registry
- Define component lifecycle management
- Define component selection algorithm

### Phase 4: Capability Registry Implementation
- Implement Capability Registry
- Implement capability resolution
- Implement component selection
- Implement capability validation

### Phase 5: Authority Integration
- Replace concrete technology references with capability requests
- Update ArtifactAuthority to request ArtifactStore
- Update InferenceAuthority to request InferenceEngine
- Update EmbeddingAuthority to request EmbeddingEngine
- Update CertificationAuthority to request CertificationStore
- Update PublicationAuthority to request PublicationStore
- Update ExecutionRuntime to request EventStore

### Phase 6: Runtime Integration
- Runtime requests capabilities via CapabilityRegistry
- Runtime never knows concrete technologies
- Runtime becomes infrastructure-agnostic

### Phase 7: Testing
- Validate capability resolution
- Validate component selection
- Validate capability binding
- Validate infrastructure independence

---

## Consequences

### Positive

1. **Infrastructure Independence**
   - Authorities request capabilities, not technologies
   - Infrastructure can be replaced without changing authorities
   - No vendor lock-in

2. **Capability Abstraction**
   - Concrete technologies are hidden behind capabilities
   - Only infrastructure adapters know concrete implementations
   - Authorities and Runtime are infrastructure-agnostic

3. **Pluggable Implementations**
   - Capability implementations can be swapped without code changes
   - Component configuration drives implementation selection
   - Dynamic capability resolution

4. **Centralized Capability Discovery**
   - CapabilityRegistry is the single constitutional capability authority
   - Capability discovery and resolution is centralized
   - No scattered capability logic

5. **No Infrastructure Dependency**
   - CapabilityRegistry has no infrastructure dependencies
   - CapabilityRegistry is infrastructure-agnostic
   - No vendor lock-in

6. **Proven Capability Abstraction**
   - Leverages Dapr's battle-tested concepts
   - Building block model is proven
   - Component abstraction is proven

### Negative

1. **Implementation Complexity**
   - Extracting concepts from Dapr requires careful implementation
   - Risk of missing edge cases in capability resolution logic
   - Need extensive testing

2. **Learning Curve**
   - Team needs to understand Dapr's building block model
   - Team needs to understand component abstraction
   - Team needs to understand capability registry

3. **Migration Effort**
   - Existing authority infrastructure references need to be refactored
   - Existing Runtime infrastructure references need to be refactored
   - Existing infrastructure contracts need to be updated
   - Existing tests need to be updated

### Tradeoffs

1. **Implementation Effort vs. Proven Concepts**
   - Accept implementation effort to leverage proven concepts
   - Better than re-inventing capability abstraction from scratch

2. **Complexity vs. Constitutional Purity**
   - Accept complexity to achieve constitutional purity
   - Infrastructure independence is required

3. **Migration Effort vs. Architectural Correctness**
   - Accept migration effort to achieve architectural correctness
   - Capability abstraction is required

---

## References

- Dapr Documentation: https://docs.dapr.io/
- Service Binding Specification: https://servicebinding.io/
- Crossplane Documentation: https://crossplane.io/
- Ω.97 Constitutional Directive: Open Source First
- Ω.96 Constitutional Convergence Report
