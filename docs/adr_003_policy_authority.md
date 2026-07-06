# ADR-003: PolicyAuthority

**Status:** Proposed
**Date:** 2026-06-29
**Phase:** Ω.98 — Constitutional Implementation Directive — Adopt Before Build

---

## Problem

**Current State:**
Policy logic is currently distributed across multiple authorities:
- Runtime implements lineage cycle detection (policy logic)
- CertificationAuthority implements certification checks (policy logic)
- VerificationAuthority implements verification checks (policy logic)
- PublicationAuthority implements publication checks (policy logic)
- ConstitutionalPolicyEngine exists but is not the sole policy authority

There is no single constitutional authority for:
- Policy compilation
- Policy evaluation
- Authorization model
- Deterministic decision production
- Policy versioning
- Policy validation

This violates constitutional principles:

1. **Policy logic is fragmented:** Policy logic is distributed across Runtime and multiple authorities
2. **No single policy owner:** No single constitutional authority for policy evaluation
3. **Runtime understands policy:** Runtime implements lineage cycle detection (policy logic)
4. **No policy compilation:** Policies are procedural code, not compiled artifacts
5. **No policy versioning:** No constitutional version handling for policies

**Constitutional Requirement:**
PolicyAuthority must become the single constitutional authority for policy compilation, policy evaluation, authorization model, deterministic decision production, policy versioning, and policy validation. Policies must become immutable artifacts compiled into CompiledPolicyArtifacts. Runtime must never understand policy.

---

## Alternatives Considered

### Alternative 1: Build Custom PolicyAuthority

**Description:**
Design and implement PolicyAuthority from scratch without reference to existing open-source policy engines.

**Pros:**
- Complete control over design
- No external dependencies
- Tailored to constitutional requirements

**Cons:**
- Re-inventing well-solved problems
- High risk of subtle bugs in policy evaluation logic
- No proven track record
- Misses opportunity to leverage mature battle-tested code
- Violates Ω.97 directive to mine proven open-source systems

**Constitutional Justification:**
**REJECTED** - Violates Ω.97 directive. Policy compilation and evaluation are well-solved problems; re-inventing them is unnecessary risk.

---

### Alternative 2: Use OPA as Infrastructure

**Description:**
Deploy OPA server and use OPA as the policy infrastructure. PolicyAuthority becomes an OPA client.

**Pros:**
- Leverages proven OPA infrastructure
- Battle-tested policy compilation and evaluation
- Mature Rego language
- Strong tooling and observability

**Cons:**
- Introduces operational dependency (OPA server)
- PolicyAuthority becomes coupled to OPA-specific APIs
- Violates capability abstraction (PolicyAuthority knows about OPA)
- Vendor lock-in to OPA ecosystem
- Rego language is complex (not suitable for constitutional simplicity)
- Constitutional authorities should not depend on external infrastructure

**Constitutional Justification:**
**REJECTED** - Violates constitutional principle that authorities must be infrastructure-agnostic. PolicyAuthority should not know about OPA or any specific infrastructure.

---

### Alternative 3: Mine OPA Concepts, Build Constitutional Authority

**Description:**
Study OPA's policy compilation model, extract the core concepts (policy compilation to IR, deterministic evaluation, partial evaluation, policy versioning), and implement a constitutional PolicyAuthority that uses these concepts without importing OPA infrastructure.

**Pros:**
- Leverages proven policy compilation concepts
- No external infrastructure dependency
- Constitutional authority remains pure
- PolicyAuthority remains infrastructure-agnostic
- Aligns with Ω.97 directive to mine proven open-source systems

**Cons:**
- Requires careful extraction of concepts (risk of missing edge cases)
- Implementation effort to adapt concepts to constitutional model
- Need to validate determinism guarantees
- Need to simplify policy language (Rego is too complex)

**Constitutional Justification:**
**ACCEPTED** - Aligns with Ω.97 directive. Mines proven policy compilation concepts while maintaining constitutional purity. PolicyAuthority remains infrastructure-agnostic.

---

### Alternative 4: Use Cedar as Infrastructure

**Description:**
Same as Alternative 2 but using Cedar instead of OPA.

**Pros:**
- Simple policy syntax
- AWS-backed but open-source
- Default deny semantics
- Policy slicing for scalability

**Cons:**
- AWS-centric (though open-source)
- Less mature than OPA
- Rust-specific (though has SDKs)
- Focused on authorization only (not general policy)
- Same constitutional violations as Alternative 2

**Constitutional Justification:**
**REJECTED** - Same constitutional violations as Alternative 2. Also authorization-only focus is too narrow for constitutional policy.

---

### Alternative 5: Use Casbin as Infrastructure

**Description:**
Same as Alternative 2 but using Casbin instead of OPA.

**Pros:**
- Multiple access control models
- PERM metamodel
- Simple configuration
- Multi-language support

**Cons:**
- No policy compilation to IR
- No partial evaluation
- Less sophisticated than OPA
- Same constitutional violations as Alternative 2

**Constitutional Justification:**
**REJECTED** - Same constitutional violations as Alternative 2. Also lacks policy compilation which is required for constitutional policy artifacts.

---

## Selected Approach

**Alternative 3: Mine OPA Concepts, Build Constitutional Authority**

Primary source: OPA (for policy compilation to IR, deterministic evaluation, partial evaluation)
Secondary source: Cedar (for simple policy syntax, default deny semantics, policy slicing)
Tertiary source: Casbin (for PERM metamodel, multiple access control models)

**Critical Separation:**
PolicyAuthority is NOT OPA runtime. PolicyAuthority owns constitutional policy semantics. OPA is a compiler underneath.

**PolicyAuthority owns:**
- Policy compilation (using OPA as compiler)
- CompiledPolicyArtifact creation
- Policy freezing
- Policy hashing
- Policy versioning
- Policy validation

**OPA owns:**
- Policy compilation to IR
- IR representation
- Deterministic compilation

**Architecture:**
```
PolicyAuthority
      ↓
Policy
      ↓
OPACompiler (compile once)
      ↓
CompiledPolicyArtifact
      ↓
Freeze
      ↓
Hash
      ↓
Replay
```

**NOT:**
```
PolicyAuthority
      ↓
OPA Runtime (evaluate raw Rego)
```

**Critical:** PolicyAuthority never evaluates raw Rego. PolicyAuthority executes immutable compiled policy artifacts.

---

## Extracted Concepts

### From OPA

1. **Policy Compilation to IR**
   - Policy → IR compilation
   - IR structure (plans, functions, blocks, statements)
   - Deterministic compilation
   - Compilation validation

2. **Deterministic Policy Evaluation**
   - IR evaluation
   - PreparedEvalQuery
   - Evaluation context management
   - Deterministic evaluation guarantees

3. **Partial Evaluation**
   - Partial evaluation for optimization
   - PartialResult
   - Query planning
   - Evaluation optimization

4. **Policy Versioning**
   - Policy version management
   - Policy migration
   - Policy compatibility

5. **WebAssembly Compilation Patterns**
   - Portable compiled policies
   - Wasm module structure
   - Wasm evaluation

### From Cedar

1. **Simple Policy Syntax**
   - Effect (permit/forbid)
   - Scope (principal, action, resource)
   - Conditions (when/unless)
   - Simple expression language

2. **Default Deny Semantics**
   - Default deny behavior
   - Permit/forbid evaluation
   - Policy combination rules

3. **Policy Slicing**
   - Policy slicing for scalability
   - Scope-based policy selection
   - Real-time decision support

4. **Schema Validation**
   - Policy schema validation
   - Entity schema validation
   - Authorization model validation

### From Casbin

1. **PERM Metamodel**
   - Policy (subject, object, action)
   - Effect (allow/deny)
   - Request (subject, object, action)
   - Matchers (policy evaluation logic)

2. **Multiple Access Control Models**
   - ACL (Access Control List)
   - RBAC (Role-Based Access Control)
   - ABAC (Attribute-Based Access Control)
   - Model composition

3. **Simple Configuration**
   - Model configuration
   - Policy configuration
   - Model switching

---

## Rejected Concepts

### From OPA

1. **OPA Server Infrastructure**
   - We don't need the server
   - We have capability abstraction

2. **Vendor-Specific Client APIs**
   - We need constitutional interfaces
   - We don't need OPA SDKs

3. **Rego Language**
   - Too complex for constitutional use
   - We need simple policy syntax (from Cedar)

4. **OPA-Specific Tooling**
   - We need simple constitutional authority
   - We don't need OPA tooling

5. **UI/Observability Stack**
   - We have separate observability
   - We don't need OPA UI

### From Cedar

1. **AWS-Centric Patterns**
   - We need vendor-neutral
   - We don't need AWS patterns

2. **Rust-Specific Runtime**
   - We need language-agnostic constitutional authority
   - We don't need Rust

3. **Authorization-Only Focus**
   - Too narrow for constitutional policy
   - We need general policy evaluation

4. **Vendor-Specific SDKs**
   - Same as OPA

### From Casbin

1. **No Policy Compilation to IR**
   - We need compilation
   - We need IR representation

2. **No Partial Evaluation**
   - We need optimization
   - We need partial evaluation

3. **Less Sophisticated Evaluation**
   - We need advanced features
   - We need deterministic guarantees

4. **Policy Storage Management**
   - We have artifact storage
   - We don't need Casbin storage

---

## Constitutional Justification

### Alignment with Constitutional Principles

1. **Policy as First-Class Authority**
   - PolicyAuthority is the single constitutional policy authority
   - Policy logic is centralized
   - Policy is no longer distributed

2. **Runtime Never Understands Policy**
   - Runtime no longer implements lineage cycle detection
   - Runtime no longer implements policy logic
   - Runtime only requests policy evaluation

3. **Immutable Policy Artifacts**
   - Policies are immutable artifacts
   - Policies are compiled into CompiledPolicyArtifacts
   - Policy versioning is constitutional

4. **Deterministic Policy Evaluation**
   - Policy compilation is deterministic
   - Policy evaluation is deterministic
   - Same policy → same compiled policy
   - Same context → same evaluation result

5. **Capability Abstraction**
   - PolicyAuthority has no infrastructure dependencies
   - PolicyAuthority is infrastructure-agnostic
   - No vendor lock-in

6. **No Vendor Lock-In**
   - No dependency on OPA server
   - No dependency on OPA SDKs
   - Only concepts are mined, not implementation

### Alignment with Ω.97 Directive

1. **Mine Proven Open-Source Systems**
   - OPA is proven at scale
   - Policy compilation is battle-tested
   - Deterministic evaluation is well-understood

2. **Extract Only Deterministic Core**
   - Policy compilation to IR
   - Deterministic evaluation
   - Partial evaluation
   - Policy versioning

3. **Wrap Behind Constitutional Authority**
   - PolicyAuthority is constitutional authority
   - No vendor-specific APIs exposed to Runtime
   - Runtime knows nothing about OPA

4. **Never Expose Vendor-Specific APIs**
   - OPA APIs are not exposed
   - Only constitutional interfaces are exposed
   - Runtime knows nothing about OPA

---

## Open Source Adoption Justification

### Existing Project Surveyed
- **OPA:** ~11,800 GitHub stars, 200+ contributors, Apache 2.0 license, CNCF graduated project
- **Cedar:** 1,568 GitHub stars, 52 contributors, Apache 2.0 license, AWS-backed (created 2023)
- **Casbin:** ~19,900 GitHub stars, 200+ contributors, Apache 2.0 license, Apache incubating

### Why Adopted
**OPA** was adopted because it meets the 80% threshold with 8/10 constitutional requirements satisfied:
- Core policy compilation and evaluation requirements are perfectly matched
- CNCF graduated project with proven track record at scale
- Active community (200+ contributors) and regular releases
- Gaps (default deny semantics, capability abstraction) can be addressed by wrapper
- Wrapper size is manageable (~500-1000 lines)
- Building from scratch would require re-inventing proven policy compilation logic

### Why Rejected
- **Cedar:** 60% threshold not met; no explicit policy compilation (constitutional requirement); AWS-backed (vendor influence); authorization-only focus (too narrow)
- **Casbin:** 60% threshold not met; no explicit policy compilation (constitutional requirement); database dependency (not infrastructure-independent); less sophisticated than OPA

### Wrapper Responsibilities
- Hide OPA server dependency (use embedded mode)
- Expose constitutional interfaces only
- Use OPA as compiler only (not runtime)
- Add default deny semantics (constitutional requirement)
- Add constitutional witnesses
- Add artifact lineage
- Simplify policy syntax (use Cedar's simple syntax concepts)
- **Critical:** PolicyAuthority never evaluates raw Rego
- **Critical:** OPACompiler is the only component that knows OPA
- **Critical:** Runtime executes immutable CompiledPolicyArtifacts only

### Constitutional Responsibilities
- PolicyAuthority owns policy compilation (using OPA as compiler)
- PolicyAuthority owns CompiledPolicyArtifact creation
- PolicyAuthority owns policy freezing
- PolicyAuthority owns policy hashing
- PolicyAuthority owns policy versioning
- PolicyAuthority owns policy validation
- Runtime never understands policy
- Runtime executes immutable CompiledPolicyArtifacts only
- OPACompiler owns OPA translation
- OPA owns compilation to IR

### Replay Guarantees
- Deterministic policy compilation via OPA's IR compilation
- CompiledPolicyArtifact is immutable
- Policy is compiled once, then frozen and hashed
- Replay uses frozen CompiledPolicyArtifact (not raw policy)
- Policy versioning handles policy changes without breaking evaluation
- Partial evaluation for optimization
- WebAssembly compilation for portable policies

### Vendor Isolation Guarantees
- No dependency on OPA server (use embedded mode)
- No dependency on OPA SDKs (constitutional interfaces only)
- Runtime knows nothing about OPA
- Only concepts are mined, not implementation
- Infrastructure adapters hide concrete implementations

### Lines Reused vs. Newly Written
- **Lines Reused from OSS:** ~100,000+ lines (OPA core)
- **Lines Newly Written:** ~500-1000 lines (wrapper)
- **Constitutional Wrapper Size:** Medium
- **Maintenance Reduction:** High (leverage OPA maintenance)
- **Replay Safety Impact:** Positive (OPA has proven policy evaluation safety)

---

## Implementation Plan

### Phase 1: Policy Artifact Design
- Define PolicyArtifact structure
- Define simple policy syntax (from Cedar)
- Define policy schema (from Cedar)
- Define policy versioning

### Phase 2: Compiled Policy Artifact Design
- Define CompiledPolicyArtifact structure
- Define IR structure (from OPA)
- Define compilation metadata
- Define version metadata

### Phase 3: Policy Authority Implementation
- Implement Policy Authority
- Implement policy compilation to IR
- Implement deterministic policy evaluation
- Implement partial evaluation
- Implement policy versioning

### Phase 4: Policy Evaluation Integration
- Move certification checks from CertificationAuthority to PolicyAuthority
- Move publication checks from PublicationAuthority to PolicyAuthority
- Move verification checks from VerificationAuthority to PolicyAuthority
- Move lineage cycle detection from Runtime to PolicyAuthority

### Phase 5: Runtime Integration
- Runtime only requests policy evaluation
- Runtime never implements policy logic
- Runtime becomes pure interpreter

### Phase 6: Testing
- Validate deterministic policy compilation
- Validate deterministic policy evaluation
- Validate partial evaluation
- Validate policy versioning

---

## Consequences

### Positive

1. **Policy as First-Class Authority**
   - PolicyAuthority is the single constitutional policy authority
   - Policy logic is centralized
   - Policy is no longer distributed

2. **Runtime Never Understands Policy**
   - Runtime no longer implements policy logic
   - Runtime only requests policy evaluation
   - Runtime is pure interpreter

3. **Immutable Policy Artifacts**
   - Policies are immutable artifacts
   - Policies are compiled into CompiledPolicyArtifacts
   - Policy versioning is constitutional

4. **Deterministic Policy Evaluation**
   - Policy compilation is deterministic
   - Policy evaluation is deterministic
   - Same policy → same compiled policy

5. **No Infrastructure Dependency**
   - PolicyAuthority has no infrastructure dependencies
   - PolicyAuthority is infrastructure-agnostic
   - No vendor lock-in

6. **Proven Policy Compilation**
   - Leverages OPA's battle-tested concepts
   - Deterministic compilation guarantees are proven
   - Partial evaluation is proven

### Negative

1. **Implementation Complexity**
   - Extracting concepts from OPA requires careful implementation
   - Risk of missing edge cases in policy evaluation logic
   - Need extensive testing

2. **Learning Curve**
   - Team needs to understand OPA's policy compilation model
   - Team needs to understand IR representation
   - Team needs to understand partial evaluation

3. **Migration Effort**
   - Existing policy logic needs to be refactored
   - Existing authority policy logic needs to be refactored
   - Existing tests need to be updated

### Tradeoffs

1. **Implementation Effort vs. Proven Concepts**
   - Accept implementation effort to leverage proven concepts
   - Better than re-inventing policy compilation from scratch

2. **Complexity vs. Constitutional Purity**
   - Accept complexity to achieve constitutional purity
   - Policy must be first-class authority

3. **Migration Effort vs. Architectural Correctness**
   - Accept migration effort to achieve architectural correctness
   - Policy sovereignty is required

---

## References

- OPA Documentation: https://www.openpolicyagent.org/
- Cedar Documentation: https://docs.cedarpolicy.com/
- Casbin Documentation: https://casbin.org/
- Ω.97 Constitutional Directive: Open Source First
- Ω.96 Constitutional Convergence Report
