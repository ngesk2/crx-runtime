# Ω.97.7 — PolicyAuthority: Open-Source Comparison Matrix

**Objective:** Mine policy compilation, policy evaluation, authorization model, and deterministic decision production from mature open-source policy engines.

**Projects Analyzed:**
- Open Policy Agent (OPA)
- Cedar
- Casbin

---

## Comparison Matrix

| Project | Strengths | Weaknesses | License | Determinism | Constitutional Value | What Will Be Mined | What Will NOT Be Imported |
|---------|-----------|-----------|---------|-------------|---------------------|-------------------|-------------------------|
| **OPA** | - Policy compilation to IR (Intermediate Representation)<br>- WebAssembly compilation support<br>- Deterministic policy evaluation<br>- Mature and widely used<br>- Strong policy language (Rego)<br>- Partial evaluation support<br>- Policy versioning | - Complex Rego language<br>- Steep learning curve<br>- OPA server infrastructure (optional)<br>- Vendor-specific APIs (if using server)<br>- Not designed for artifact-centric policies | Apache License 2.0 | **Very High** - Policy compilation is deterministic; evaluation is deterministic; IR is well-defined | **Very High** - Policy compilation to IR, deterministic evaluation, partial evaluation exactly match constitutional policy compilation requirements | - Policy compilation to IR<br>- Deterministic policy evaluation<br>- Partial evaluation<br>- Policy versioning<br>- WebAssembly compilation patterns<br>- Rego language concepts (adapted) | - OPA server infrastructure<br>- Vendor-specific client APIs<br>- Rego language (too complex)<br>- OPA-specific tooling<br>- UI/observability stack |
| **Cedar** | - Simple policy syntax<br>- Supports RBAC and ABAC<br>- Default deny semantics<br>- Policy slicing for scalability<br>- AWS-backed but open-source<br>- Schema validation<br>- Policy analyzability | - AWS-centric (though open-source)<br>- Less mature than OPA<br>- Rust-specific (though has SDKs)<br>- Focused on authorization only (not general policy)<br>- Less flexible than Rego | Apache License 2.0 | **High** - Policy evaluation is deterministic; default deny semantics are well-defined | **High** - Simple policy syntax, default deny semantics, policy slicing align with constitutional policy evaluation | - Simple policy syntax<br>- Default deny semantics<br>- Policy slicing for scalability<br>- Schema validation<br>- Authorization model (principal, action, resource) | - AWS-centric patterns<br>- Rust-specific runtime<br>- Authorization-only focus (too narrow)<br>- Vendor-specific SDKs |
| **Casbin** | - Multiple access control models (ACL, RBAC, ABAC)<br>- PERM metamodel (Policy, Effect, Request, Matchers)<br>- Simple configuration<br>- Multi-language support<br>- Apache project<br>- Built-in operators for pattern matching | - Less sophisticated than OPA<br>- No policy compilation to IR<br>- No partial evaluation<br>- Policy evaluation is less optimized<br>- Less mature than OPA | Apache License 2.0 | **Medium** - Policy evaluation is deterministic but less sophisticated than OPA | **Medium** - PERM metamodel, multiple access control models align with constitutional policy evaluation | - PERM metamodel (Policy, Effect, Request, Matchers)<br>- Multiple access control models<br>- Simple configuration<br>- Built-in operators for pattern matching | - No policy compilation to IR<br>- No partial evaluation<br>- Less sophisticated evaluation<br>- Policy storage management (we have artifact storage) |

---

## Detailed Analysis

### Open Policy Agent (OPA)

**Determinism Model:**
- Policy compilation to IR is deterministic
- IR evaluation is deterministic
- Partial evaluation is deterministic
- WebAssembly compilation is deterministic
- Rego evaluation is deterministic

**Constitutional Alignment:**
- **Policy Compilation:** Exactly matches constitutional policy compilation requirements
- **Deterministic Evaluation:** Matches constitutional determinism requirements
- **Partial Evaluation:** Matches constitutional policy optimization requirements
- **IR Representation:** Matches constitutional compiled policy artifact requirements

**Mineable Concepts:**
1. **Policy Compilation to IR:**
   - Rego → IR compilation
   - IR structure (plans, functions, blocks, statements)
   - Deterministic compilation
   - Compilation validation

2. **Deterministic Policy Evaluation:**
   - IR evaluation
   - PreparedEvalQuery
   - Deterministic evaluation guarantees
   - Evaluation context management

3. **Partial Evaluation:**
   - Partial evaluation for optimization
   - PartialResult
   - Query planning
   - Evaluation optimization

4. **Policy Versioning:**
   - Policy version management
   - Policy migration
   - Policy compatibility

5. **WebAssembly Compilation:**
   - Rego → WebAssembly compilation
   - Wasm module structure
   - Wasm evaluation
   - Portable compiled policies

**Reject:**
- OPA server infrastructure (we don't need the server)
- Vendor-specific client APIs (we need constitutional interfaces)
- Rego language (too complex for constitutional use)
- OPA-specific tooling (we need simple constitutional authority)
- UI/observability stack (we have separate observability)

---

### Cedar

**Determinism Model:**
- Policy evaluation is deterministic
- Default deny semantics are well-defined
- Policy slicing is deterministic
- Schema validation is deterministic

**Constitutional Alignment:**
- **Simple Policy Syntax:** Aligns with constitutional policy simplicity
- **Default Deny Semantics:** Aligns with constitutional security
- **Policy Slicing:** Aligns with constitutional scalability
- **Authorization Model:** Aligns with constitutional authorization

**Mineable Concepts:**
1. **Simple Policy Syntax:**
   - Effect (permit/forbid)
   - Scope (principal, action, resource)
   - Conditions (when/unless)
   - Simple expression language

2. **Default Deny Semantics:**
   - Default deny behavior
   - Permit/forbid evaluation
   - Policy combination rules
   - Authorization decision model

3. **Policy Slicing:**
   - Policy slicing for scalability
   - Scope-based policy selection
   - Real-time decision support
   - Large policy store optimization

4. **Schema Validation:**
   - Policy schema validation
   - Entity schema validation
   - Authorization model validation
   - Consistency checking

5. **Authorization Model:**
   - Principal, action, resource model
   - Entity attributes
   - Context evaluation
   - Authorization decision

**Reject:**
- AWS-centric patterns (we need vendor-neutral)
- Rust-specific runtime (we need language-agnostic)
- Authorization-only focus (too narrow for constitutional policy)
- Vendor-specific SDKs (we need constitutional interfaces)

---

### Casbin

**Determinism Model:**
- Policy evaluation is deterministic
- PERM metamodel is deterministic
- Model configuration is deterministic
- Policy enforcement is deterministic

**Constitutional Alignment:**
- **PERM Metamodel:** Aligns with constitutional policy modeling
- **Multiple Access Control Models:** Aligns with constitutional flexibility
- **Simple Configuration:** Aligns with constitutional simplicity

**Mineable Concepts:**
1. **PERM Metamodel:**
   - Policy (subject, object, action)
   - Effect (allow/deny)
   - Request (subject, object, action)
   - Matchers (policy evaluation logic)

2. **Multiple Access Control Models:**
   - ACL (Access Control List)
   - RBAC (Role-Based Access Control)
   - ABAC (Attribute-Based Access Control)
   - Model composition

3. **Simple Configuration:**
   - Model configuration (CONF file)
   - Policy configuration (CSV file)
   - Model switching
   - Policy management

4. **Built-in Operators:**
   - Pattern matching operators (keyMatch)
   - Resource matching
   - Attribute matching
   - Custom operators

**Reject:**
- No policy compilation to IR (we need compilation)
- No partial evaluation (we need optimization)
- Less sophisticated evaluation (we need advanced features)
- Policy storage management (we have artifact storage)

---

## Recommendation

**Primary Source: OPA**

OPA is the best match for constitutional policy authority because:

1. **Policy Compilation to IR:** OPA compiles policies to IR, exactly matching constitutional policy compilation requirements
2. **Deterministic Evaluation:** OPA's evaluation is deterministic, matching constitutional determinism requirements
3. **Partial Evaluation:** OPA supports partial evaluation for optimization, matching constitutional policy optimization requirements
4. **Mature and Proven:** OPA is widely used and battle-tested
5. **Well-Documented:** Extensive documentation on policy compilation and evaluation
6. **WebAssembly Support:** OPA can compile to WebAssembly, enabling portable compiled policies

**Secondary Source: Cedar**

Cedar provides valuable additions:
- Simple policy syntax (for user-facing policy authoring)
- Default deny semantics (for constitutional security)
- Policy slicing (for constitutional scalability)
- Schema validation (for constitutional consistency)

**Tertiary Source: Casbin**

Casbin provides valuable additions:
- PERM metamodel (for constitutional policy modeling)
- Multiple access control models (for constitutional flexibility)
- Simple configuration (for constitutional simplicity)

**Reject: None**

All three projects have valuable concepts to mine. OPA is the primary source for policy compilation, Cedar for simple syntax and semantics, Casbin for metamodel and flexibility.

---

## Extracted Constitutional Concepts

From OPA:

1. **Policy Compilation to IR:**
   - Rego → IR compilation
   - IR structure (plans, functions, blocks, statements)
   - Deterministic compilation
   - Compilation validation

2. **Deterministic Policy Evaluation:**
   - IR evaluation
   - PreparedEvalQuery
   - Evaluation context management
   - Deterministic evaluation guarantees

3. **Partial Evaluation:**
   - Partial evaluation for optimization
   - PartialResult
   - Query planning
   - Evaluation optimization

4. **Policy Versioning:**
   - Policy version management
   - Policy migration
   - Policy compatibility

5. **WebAssembly Compilation Patterns:**
   - Portable compiled policies
   - Wasm module structure
   - Wasm evaluation

From Cedar:

1. **Simple Policy Syntax:**
   - Effect (permit/forbid)
   - Scope (principal, action, resource)
   - Conditions (when/unless)
   - Simple expression language

2. **Default Deny Semantics:**
   - Default deny behavior
   - Permit/forbid evaluation
   - Policy combination rules

3. **Policy Slicing:**
   - Policy slicing for scalability
   - Scope-based policy selection
   - Real-time decision support

4. **Schema Validation:**
   - Policy schema validation
   - Entity schema validation
   - Authorization model validation

From Casbin:

1. **PERM Metamodel:**
   - Policy (subject, object, action)
   - Effect (allow/deny)
   - Request (subject, object, action)
   - Matchers (policy evaluation logic)

2. **Multiple Access Control Models:**
   - ACL (Access Control List)
   - RBAC (Role-Based Access Control)
   - ABAC (Attribute-Based Access Control)
   - Model composition

3. **Simple Configuration:**
   - Model configuration
   - Policy configuration
   - Model switching

---

## Constitutional Integration Boundary

**Inputs to PolicyAuthority:**
- PolicyArtifact (source policy)
- ContextArtifact (evaluation context)
- SchemaArtifact (schema for validation)

**Outputs from PolicyAuthority:**
- CompiledPolicyArtifact (compiled policy)
- PolicyEvaluationArtifact (evaluation result)
- PolicyValidationArtifact (validation result)

**Artifact Types:**
- PolicyArtifact
- CompiledPolicyArtifact
- PolicyEvaluationArtifact
- PolicyValidationArtifact

**Capability Interfaces:**
- None (PolicyAuthority is pure, no infrastructure calls)

**Replay Guarantees:**
- Policy compilation is deterministic
- Policy evaluation is deterministic
- Same policy → same compiled policy
- Same context → same evaluation result

**Determinism Guarantees:**
- Policy compilation is deterministic
- Policy evaluation is deterministic
- Partial evaluation is deterministic
- Version handling is deterministic
