# Ω.97.9 — PolicyAuthority: Integration Boundary

**Objective:** Define the integration boundary for PolicyAuthority, including inputs, outputs, artifact types, capability interfaces, replay guarantees, and determinism guarantees.

---

## Authority Contract

### Authority Name
PolicyAuthority

### Authority Purpose
PolicyAuthority is the single constitutional authority for policy compilation, policy evaluation, authorization model, deterministic decision production, policy versioning, and policy validation. Policies become immutable artifacts compiled into CompiledPolicyArtifacts. Runtime never understands policy.

### Authority Purity
**Pure Function** — No infrastructure calls, no side effects, no mutable state.

---

## Inputs

### Primary Inputs

1. **PolicyArtifact**
   - Type: Artifact
   - Purpose: Source policy to compile
   - Structure:
     ```javascript
     {
       artifact_id: string,
       artifact_type: "PolicyArtifact",
       data: {
         policy_id: string,
         policy_name: string,
         policy_type: string, // "authorization", "certification", "publication", "verification", "lineage"
         policy_syntax: object, // Simple policy syntax (from Cedar)
         policy_effect: string, // "permit", "forbid"
         policy_scope: {
           principal: object,
           action: object,
           resource: object,
         },
         policy_conditions: [
           {
             type: string, // "when", "unless"
             expression: object,
           },
         ],
         policy_metadata: {
           policy_version: string,
           policy_created_at: timestamp,
           policy_author: string,
         },
       },
       canonical_hash: string,
       created_at: timestamp,
     }
     ```

2. **ContextArtifact**
   - Type: Artifact
   - Purpose: Evaluation context for policy evaluation
   - Structure:
     ```javascript
     {
       artifact_id: string,
       artifact_type: "ContextArtifact",
       data: {
         context_id: string,
         context_type: string, // "authorization", "certification", "publication", "verification", "lineage"
         context_data: {
           principal: object,
           action: object,
           resource: object,
           environment: object,
           timestamp: timestamp,
         },
         context_metadata: {
           context_version: string,
           context_created_at: timestamp,
         },
       },
       canonical_hash: string,
       created_at: timestamp,
     }
     ```

3. **SchemaArtifact** (Optional)
   - Type: Artifact
   - Purpose: Schema for policy validation
   - Structure:
     ```javascript
     {
       artifact_id: string,
       artifact_type: "SchemaArtifact",
       data: {
         schema_id: string,
         schema_type: string, // "policy", "entity", "authorization"
         schema_definition: object,
         schema_metadata: {
           schema_version: string,
           schema_created_at: timestamp,
         },
       },
       canonical_hash: string,
       created_at: timestamp,
     }
     ```

### Secondary Inputs

1. **PreviousCompiledPolicyArtifact** (Optional)
   - Type: Artifact
   - Purpose: Previous compiled policy for version comparison
   - Structure: Same as CompiledPolicyArtifact

2. **PolicyValidationArtifact** (Optional)
   - Type: Artifact
   - Purpose: Previous policy validation for comparison
   - Structure: Same as PolicyValidationArtifact

---

## Outputs

### Primary Output

1. **CompiledPolicyArtifact**
   - Type: Artifact
   - Purpose: Compiled policy artifact (IR representation)
   - Structure:
     ```javascript
     {
       artifact_id: string,
       artifact_type: "CompiledPolicyArtifact",
       data: {
         compiled_policy_id: string,
         source_policy_id: string,
         ir_representation: {
           static: object, // Static data used by compiled plans
           plans: [
             {
               plan_id: string,
               plan_name: string,
               blocks: [
                 {
                   block_id: string,
                   statements: [
                     {
                       statement_id: string,
                       statement_type: string,
                       statement_data: object,
                     },
                   ],
                 },
               ],
             },
           ],
           funcs: [
             {
               func_id: string,
               func_name: string,
               func_params: [string],
               func_body: object,
             },
           ],
         },
         compilation_metadata: {
           compilation_started_at: timestamp,
           compilation_completed_at: timestamp,
           compilation_duration: number,
           compilation_version: string,
           compilation_errors: [],
         },
       },
       canonical_hash: string,
       created_at: timestamp,
     }
     ```

### Secondary Outputs

1. **PolicyEvaluationArtifact**
   - Type: Artifact
   - Purpose: Result of policy evaluation
   - Structure:
     ```javascript
     {
       artifact_id: string,
       artifact_type: "PolicyEvaluationArtifact",
       data: {
         evaluation_id: string,
         policy_id: string,
         context_id: string,
         evaluation_result: {
           decision: string, // "permit", "forbid"
           confidence: number,
           reasoning: object,
         },
         evaluation_metadata: {
           evaluation_started_at: timestamp,
           evaluation_completed_at: timestamp,
           evaluation_duration: number,
           evaluation_version: string,
         },
       },
       canonical_hash: string,
       created_at: timestamp,
     }
     ```

2. **PolicyValidationArtifact**
   - Type: Artifact
   - Purpose: Validation of policy correctness
   - Structure:
     ```javascript
     {
       artifact_id: string,
       artifact_type: "PolicyValidationArtifact",
       data: {
         validation_id: string,
         policy_id: string,
         validation_result: {
           syntax_valid: boolean,
           schema_valid: boolean,
           compilation_valid: boolean,
           evaluation_valid: boolean,
         },
         validation_errors: [
           {
             error_type: string,
             error_message: string,
             error_location: string,
           },
         ],
         validation_metadata: {
           validation_started_at: timestamp,
           validation_completed_at: timestamp,
           validation_version: string,
         },
       },
       canonical_hash: string,
       created_at: timestamp,
     }
     ```

3. **PolicyVersionArtifact**
   - Type: Artifact
   - Purpose: Version metadata for policy
   - Structure:
     ```javascript
     {
       artifact_id: string,
       artifact_type: "PolicyVersionArtifact",
       data: {
         version_id: string,
         policy_id: string,
         version_number: number,
         version_changes: [string],
         compatibility_breaking: boolean,
         version_metadata: {
           version_created_at: timestamp,
           version_author: string,
         },
       },
       canonical_hash: string,
       created_at: timestamp,
     }
     ```

---

## Artifact Types

### Core Artifacts

1. **PolicyArtifact**
   - Immutable source policy
   - Simple policy syntax (from Cedar)
   - Policy scope and conditions
   - Policy metadata

2. **CompiledPolicyArtifact**
   - Immutable compiled policy
   - IR representation (from OPA)
   - Compilation metadata
   - Version metadata

3. **PolicyEvaluationArtifact**
   - Result of policy evaluation
   - Decision (permit/forbid)
   - Confidence and reasoning
   - Evaluation metadata

4. **PolicyValidationArtifact**
   - Validation of policy correctness
   - Syntax, schema, compilation, evaluation validation
   - Error reporting

5. **PolicyVersionArtifact**
   - Version metadata for policy
   - Version changes
   - Compatibility information

### Input Artifacts

1. **PolicyArtifact**
   - Source policy to compile
   - Provided by Policy Author

2. **ContextArtifact**
   - Evaluation context
   - Provided by Runtime

3. **SchemaArtifact**
   - Schema for validation
   - Provided by Schema Authority

### Output Artifacts

1. **CompiledPolicyArtifact**
   - Compiled policy
   - Consumed by Runtime

2. **PolicyEvaluationArtifact**
   - Evaluation result
   - Consumed by Runtime

3. **PolicyValidationArtifact**
   - Validation result
   - Consumed by Runtime

4. **PolicyVersionArtifact**
   - Version metadata
   - Consumed by Version Authority

---

## Capability Interfaces

### No Capability Interfaces

**PolicyAuthority is a pure function.**
- No infrastructure calls
- No capability requests
- No side effects
- No mutable state

**Rationale:**
- PolicyAuthority only transforms inputs (PolicyArtifact, ContextArtifact) into outputs (CompiledPolicyArtifact, PolicyEvaluationArtifact)
- PolicyAuthority does not execute anything
- PolicyAuthority does not need infrastructure
- Runtime is responsible for capability requests during execution

---

## Replay Guarantees

### Deterministic Policy Compilation

**Guarantee:** Same PolicyArtifact → Same CompiledPolicyArtifact

**Mechanism:**
1. PolicyArtifact is immutable
2. Policy compilation is deterministic
3. IR generation is deterministic
4. No external dependencies

**Compilation Process:**
1. Policy Authority retrieves PolicyArtifact
2. Policy Authority validates policy syntax
3. Policy Authority validates policy schema
4. Policy Authority compiles policy to IR
5. Policy Authority generates CompiledPolicyArtifact

### Deterministic Policy Evaluation

**Guarantee:** Same CompiledPolicyArtifact + Same ContextArtifact → Same PolicyEvaluationArtifact

**Mechanism:**
1. CompiledPolicyArtifact is immutable
2. ContextArtifact is immutable
3. Policy evaluation is deterministic
4. No external dependencies

**Evaluation Process:**
1. Policy Authority retrieves CompiledPolicyArtifact
2. Policy Authority retrieves ContextArtifact
3. Policy Authority evaluates policy against context
4. Policy Authority generates PolicyEvaluationArtifact

### Policy Version Handling

**Guarantee:** Same Version → Same Policy Behavior

**Mechanism:**
1. Policy version is immutable
2. Version handling is deterministic
3. Version migration is deterministic
4. No external dependencies

**Version Process:**
1. Policy Authority retrieves policy version
2. Policy Authority validates version
3. Policy Authority applies version migration (if needed)
4. Policy Authority evaluates policy with version context

---

## Determinism Guarantees

### Policy Compilation Determinism

**Guarantee:** Same Inputs → Same CompiledPolicyArtifact

**Mechanism:**
1. PolicyArtifact is immutable
2. SchemaArtifact is immutable (if used)
3. Policy Authority is pure function
4. No external dependencies
5. No non-deterministic operations

**Validation:**
- Canonical hash of CompiledPolicyArtifact is deterministic
- IR representation is deterministic
- Compilation metadata is deterministic

### Policy Evaluation Determinism

**Guarantee:** Same Inputs → Same PolicyEvaluationArtifact

**Mechanism:**
1. CompiledPolicyArtifact is immutable
2. ContextArtifact is immutable
3. Policy Authority is pure function
4. No external dependencies
5. No non-deterministic operations

**Validation:**
- Canonical hash of PolicyEvaluationArtifact is deterministic
- Evaluation result is deterministic
- Evaluation metadata is deterministic

### Policy Validation Determinism

**Guarantee:** Same Inputs → Same PolicyValidationArtifact

**Mechanism:**
1. PolicyArtifact is immutable
2. SchemaArtifact is immutable (if used)
3. Validation algorithm is deterministic
4. No external dependencies

**Validation:**
- Canonical hash of PolicyValidationArtifact is deterministic
- Validation result is deterministic
- Validation errors are deterministic

---

## Error Handling

### Input Validation

**Invalid PolicyArtifact:**
- Reject with error
- Return error artifact
- Do not compile policy

**Invalid ContextArtifact:**
- Reject with error
- Return error artifact
- Do not evaluate policy

**Invalid SchemaArtifact:**
- Reject with error
- Return error artifact
- Do not validate policy

### Compilation Errors

**Non-Deterministic Compilation:**
- Should never happen (pure function)
- If detected, reject with error
- Return error artifact

**Syntax Errors:**
- Detect during syntax validation
- Reject with error
- Return error artifact with syntax errors

**Schema Validation Errors:**
- Detect during schema validation
- Reject with error
- Return error artifact with schema errors

### Evaluation Errors

**Non-Deterministic Evaluation:**
- Should never happen (pure function)
- If detected, reject with error
- Return error artifact

**Context Validation Errors:**
- Detect during context validation
- Reject with error
- Return error artifact

---

## Lineage

### Input Lineage

CompiledPolicyArtifact lineage:
- Parents: [PolicyArtifact, SchemaArtifact]
- Lineage type: "compilation"

PolicyEvaluationArtifact lineage:
- Parents: [CompiledPolicyArtifact, ContextArtifact]
- Lineage type: "evaluation"

PolicyValidationArtifact lineage:
- Parents: [PolicyArtifact, SchemaArtifact]
- Lineage type: "validation"

### Output Lineage

PolicyVersionArtifact lineage:
- Parents: [PolicyArtifact]
- Lineage type: "versioning"

---

## Testing

### Unit Tests

1. **Policy Compilation Determinism**
   - Same inputs → same CompiledPolicyArtifact
   - Validate canonical hash
   - Validate IR representation
   - Validate compilation metadata

2. **Policy Evaluation Determinism**
   - Same inputs → same PolicyEvaluationArtifact
   - Validate canonical hash
   - Validate evaluation result
   - Validate evaluation metadata

3. **Policy Validation**
   - Valid policy → valid compilation
   - Invalid syntax → error
   - Invalid schema → error

4. **Policy Versioning**
   - Valid version → valid policy behavior
   - Invalid version → error
   - Version migration validation

### Integration Tests

1. **Runtime Integration**
   - Runtime consumes CompiledPolicyArtifact
   - Runtime consumes PolicyEvaluationArtifact
   - Runtime requests policy evaluation

2. **Schema Integration**
   - Schema Authority provides SchemaArtifact
   - Policy Authority validates against schema

3. **Lineage Integration**
   - Lineage Authority tracks CompiledPolicyArtifact lineage
   - Lineage Authority tracks PolicyEvaluationArtifact lineage
   - Lineage Authority tracks PolicyValidationArtifact lineage

---

## Performance Considerations

### Policy Compilation Performance

- Policy compilation should be fast (< 100ms for typical policies)
- Policy compilation is pure function, can be cached
- Policy compilation can be parallelized for large policies

### Policy Evaluation Performance

- Policy evaluation should be fast (< 10ms for typical evaluations)
- Policy evaluation is pure function, can be cached
- Partial evaluation can optimize performance

### Compiled Policy Size

- CompiledPolicyArtifact should be compact
- IR representation should be efficient
- Compilation metadata should be minimal

---

## Security Considerations

### Input Validation

- Validate Policy structure
- Validate Context structure
- Validate Schema structure
- Reject malformed inputs

### Policy Validation

- Validate policy syntax
- Validate policy schema
- Validate policy compilation
- Validate policy evaluation

### Tampering Detection

- Detect tampering via canonical hash
- Detect tampering via IR validation
- Detect tampering via schema validation
- Reject tampered artifacts

---

## Observability

### Policy Compilation Metrics

- Policy compilation latency
- Policy compilation success rate
- Policy compilation error rate
- Policy compilation cache hit rate

### Policy Evaluation Metrics

- Policy evaluation latency
- Policy evaluation success rate
- Policy evaluation error rate
- Policy evaluation cache hit rate

### Policy Metrics

- Policy artifact size
- Compiled policy size
- IR representation complexity
- Policy version count
