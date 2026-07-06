# Ω.97.3 — ExecutionPlan Authority: Integration Boundary

**Objective:** Define the integration boundary for ExecutionPlan Authority, including inputs, outputs, artifact types, capability interfaces, replay guarantees, and determinism guarantees.

---

## Authority Contract

### Authority Name
ExecutionPlanAuthority

### Authority Purpose
Generate immutable ExecutionPlanArtifacts from MissionArtifacts and WorkflowArtifacts. ExecutionPlan Authority is the single constitutional authority for execution graph construction, dependency DAG construction, deterministic scheduling, retry semantics, and durable execution metadata.

### Authority Purity
**Pure Function** — No infrastructure calls, no side effects, no mutable state.

---

## Inputs

### Primary Inputs

1. **MissionArtifact**
   - Type: Artifact
   - Purpose: High-level mission definition
   - Structure:
     ```javascript
     {
       artifact_id: string,
       artifact_type: "MissionArtifact",
       data: {
         mission_id: string,
         mission_name: string,
         mission_description: string,
         mission_parameters: object,
         mission_constraints: object,
       },
       canonical_hash: string,
       created_at: timestamp,
     }
     ```

2. **WorkflowArtifact**
   - Type: Artifact
   - Purpose: Workflow definition with steps and dependencies
   - Structure:
     ```javascript
     {
       artifact_id: string,
       artifact_type: "WorkflowArtifact",
       data: {
         workflow_id: string,
         workflow_name: string,
         workflow_steps: [
           {
             step_id: string,
             step_name: string,
             step_type: string, // "activity", "timer", "child_workflow", "signal"
             step_parameters: object,
             step_dependencies: [string], // step_ids
             retry_policy: object,
           },
         ],
         workflow_metadata: object,
       },
       canonical_hash: string,
       created_at: timestamp,
     }
     ```

3. **Capability Contracts** (Optional)
   - Type: Array of Contract
   - Purpose: Available capability contracts for execution
   - Structure:
     ```javascript
     [
       {
         capability_type: string, // "ArtifactStore", "InferenceEngine", etc.
         capability_id: string,
         capability_constraints: object,
       },
     ]
     ```

### Secondary Inputs

1. **ExecutionContextArtifact** (Optional)
   - Type: Artifact
   - Purpose: Previous execution context for replay
   - Structure:
     ```javascript
     {
       artifact_id: string,
       artifact_type: "ExecutionContextArtifact",
       data: {
         execution_id: string,
         previous_execution_plan_id: string,
         execution_state: object,
       },
       canonical_hash: string,
       created_at: timestamp,
     }
     ```

---

## Outputs

### Primary Output

1. **ExecutionPlanArtifact**
   - Type: Artifact
   - Purpose: Immutable execution plan with command sequence, dependency DAG, retry policies, and version metadata
   - Structure:
     ```javascript
     {
       artifact_id: string,
       artifact_type: "ExecutionPlanArtifact",
       data: {
         execution_plan_id: string,
         mission_id: string,
         workflow_id: string,
         command_sequence: [
           {
             command_id: string,
             command_type: string, // "ScheduleActivityTask", "StartTimer", "CompleteWorkflowExecution", etc.
             command_parameters: object,
             command_dependencies: [string], // command_ids
             retry_policy: object,
           },
         ],
         dependency_dag: {
           nodes: [string], // command_ids
           edges: [
             {
               from: string, // command_id
               to: string, // command_id
               edge_type: string, // "data_dependency", "control_flow", "retry"
             },
           ],
         },
         retry_policies: {
           activity_retry_policy: object,
           workflow_retry_policy: object,
         },
         version_metadata: {
           plan_version: string,
           binary_checksum: string,
           git_ref: string,
           created_at: timestamp,
         },
         execution_metadata: {
           estimated_duration: number,
           resource_requirements: object,
           isolation_level: string,
         },
       },
       canonical_hash: string,
       created_at: timestamp,
     }
     ```

### Secondary Outputs

1. **ExecutionVersionArtifact**
   - Type: Artifact
   - Purpose: Version metadata for execution plan
   - Structure:
     ```javascript
     {
       artifact_id: string,
       artifact_type: "ExecutionVersionArtifact",
       data: {
         version_id: string,
         execution_plan_id: string,
         version_number: number,
         binary_checksum: string,
         git_ref: string,
         version_changes: [string],
         compatibility_breaking: boolean,
       },
       canonical_hash: string,
       created_at: timestamp,
     }
     ```

2. **ExecutionGraphArtifact**
   - Type: Artifact
   - Purpose: Dependency DAG as separate artifact for lineage
   - Structure:
     ```javascript
     {
       artifact_id: string,
       artifact_type: "ExecutionGraphArtifact",
       data: {
         graph_id: string,
         execution_plan_id: string,
         graph_type: "dependency_dag",
         nodes: [
           {
             node_id: string,
             node_type: string,
             node_metadata: object,
           },
         ],
         edges: [
           {
             edge_id: string,
             from_node: string,
             to_node: string,
             edge_type: string,
             edge_metadata: object,
           },
         ],
       },
       canonical_hash: string,
       created_at: timestamp,
     }
     ```

---

## Artifact Types

### Core Artifacts

1. **ExecutionPlanArtifact**
   - Immutable execution plan
   - Contains command sequence, dependency DAG, retry policies, version metadata
   - Single source of truth for execution graph

2. **ExecutionVersionArtifact**
   - Version metadata for execution plan
   - Enables workflow versioning
   - Enables GetVersion branching logic

3. **ExecutionGraphArtifact**
   - Dependency DAG as separate artifact
   - Enables lineage tracking
   - Enables graph analysis

### Input Artifacts

1. **MissionArtifact**
   - High-level mission definition
   - Provided by Mission Authority

2. **WorkflowArtifact**
   - Workflow definition with steps and dependencies
   - Provided by Workflow Authority

3. **ExecutionContextArtifact**
   - Previous execution context for replay
   - Provided by Replay Authority

### Output Artifacts

1. **ExecutionPlanArtifact**
   - Immutable execution plan
   - Consumed by ExecutionRuntime

2. **ExecutionVersionArtifact**
   - Version metadata
   - Consumed by Replay Authority

3. **ExecutionGraphArtifact**
   - Dependency DAG
   - Consumed by Lineage Authority

---

## Capability Interfaces

### No Capability Interfaces

**ExecutionPlan Authority is a pure function.**
- No infrastructure calls
- No capability requests
- No side effects
- No mutable state

**Rationale:**
- ExecutionPlan Authority only transforms inputs (MissionArtifact, WorkflowArtifact) into outputs (ExecutionPlanArtifact)
- ExecutionPlan Authority does not execute anything
- ExecutionPlan Authority does not need infrastructure
- ExecutionRuntime is responsible for capability requests during execution

---

## Replay Guarantees

### Deterministic Replay

**Guarantee:** Same ExecutionPlanArtifact → Same Command Sequence → Same Execution

**Mechanism:**
1. ExecutionPlanArtifact is immutable
2. Command sequence is deterministic
3. Dependency DAG is deterministic
4. Retry policies are deterministic
5. Version metadata is deterministic

**Replay Process:**
1. Replay Authority retrieves ExecutionPlanArtifact
2. ExecutionRuntime interprets ExecutionPlanArtifact
3. ExecutionRuntime executes command sequence
4. ExecutionRuntime generates Events
5. Replay Authority compares Events to recorded history
6. Mismatch → Non-deterministic error

**Replay Validation:**
- Shadow/replay testing (from Cadence)
- Production history replay
- Non-deterministic error detection

### Version Compatibility

**Guarantee:** GetVersion enables branching logic without breaking replay

**Mechanism:**
1. ExecutionVersionArtifact contains version metadata
2. GetVersion returns version number
3. Branching logic based on version number
4. Old workflows use old code path
5. New workflows use new code path

**SideEffect:**
- SideEffect captures non-deterministic values
- SideEffect records result in execution history
- Replay uses recorded result instead of re-executing

---

## Determinism Guarantees

### Plan Generation Determinism

**Guarantee:** Same Inputs → Same ExecutionPlanArtifact

**Mechanism:**
1. MissionArtifact is immutable
2. WorkflowArtifact is immutable
3. Capability contracts are immutable
4. ExecutionPlan Authority is pure function
5. No external dependencies
6. No non-deterministic operations

**Validation:**
- Canonical hash of ExecutionPlanArtifact is deterministic
- Command sequence is deterministic
- Dependency DAG is deterministic
- Version metadata is deterministic

### Execution Determinism

**Guarantee:** Same ExecutionPlanArtifact → Same Execution

**Mechanism:**
1. ExecutionPlanArtifact is immutable
2. Command sequence is deterministic
3. ExecutionRuntime is pure interpreter
4. Capability requests are deterministic
5. Event generation is deterministic

**Validation:**
- Event history is deterministic
- Replay is deterministic
- Non-deterministic error detection

---

## Error Handling

### Input Validation

**Invalid MissionArtifact:**
- Reject with error
- Return error artifact
- Do not generate ExecutionPlanArtifact

**Invalid WorkflowArtifact:**
- Reject with error
- Return error artifact
- Do not generate ExecutionPlanArtifact

**Circular Dependencies:**
- Detect during dependency DAG construction
- Reject with error
- Return error artifact
- Do not generate ExecutionPlanArtifact

### Plan Generation Errors

**Non-Deterministic Plan Generation:**
- Should never happen (pure function)
- If detected, reject with error
- Return error artifact

**Version Conflict:**
- Detect version conflict
- Reject with error
- Return error artifact

---

## Lineage

### Input Lineage

ExecutionPlanArtifact lineage:
- Parents: [MissionArtifact, WorkflowArtifact]
- Lineage type: "plan_generation"

### Output Lineage

ExecutionVersionArtifact lineage:
- Parents: [ExecutionPlanArtifact]
- Lineage type: "versioning"

ExecutionGraphArtifact lineage:
- Parents: [ExecutionPlanArtifact]
- Lineage type: "graph_extraction"

---

## Testing

### Unit Tests

1. **Plan Generation Determinism**
   - Same inputs → same ExecutionPlanArtifact
   - Validate canonical hash
   - Validate command sequence
   - Validate dependency DAG

2. **Dependency DAG Construction**
   - Valid dependencies → valid DAG
   - Circular dependencies → error
   - Missing dependencies → error

3. **Retry Policy Generation**
   - Valid retry policy → embedded in plan
   - Invalid retry policy → error

4. **Version Metadata Generation**
   - Same inputs → same version metadata
   - Validate binary checksum
   - Validate git_ref

### Integration Tests

1. **Runtime Integration**
   - ExecutionRuntime consumes ExecutionPlanArtifact
   - ExecutionRuntime interprets command sequence
   - ExecutionRuntime generates Events

2. **Replay Integration**
   - Replay Authority retrieves ExecutionPlanArtifact
   - Replay Authority validates replay
   - Non-deterministic error detection

3. **Lineage Integration**
   - Lineage Authority tracks ExecutionPlanArtifact lineage
   - Lineage Authority tracks ExecutionVersionArtifact lineage
   - Lineage Authority tracks ExecutionGraphArtifact lineage

---

## Performance Considerations

### Plan Generation Performance

- Plan generation should be fast (< 100ms for typical workflows)
- Plan generation is pure function, can be cached
- Plan generation can be parallelized for large workflows

### ExecutionPlanArtifact Size

- ExecutionPlanArtifact should be compact
- Command sequence should be efficient
- Dependency DAG should be efficient
- Version metadata should be minimal

---

## Security Considerations

### Input Validation

- Validate MissionArtifact structure
- Validate WorkflowArtifact structure
- Validate capability contracts
- Reject malformed inputs

### Plan Validation

- Validate command sequence
- Validate dependency DAG
- Validate retry policies
- Validate version metadata

### Replay Security

- Validate ExecutionPlanArtifact during replay
- Detect tampering via canonical hash
- Reject tampered plans

---

## Observability

### Plan Generation Metrics

- Plan generation latency
- Plan generation success rate
- Plan generation error rate
- Plan generation cache hit rate

### Plan Metrics

- ExecutionPlanArtifact size
- Command sequence length
- Dependency DAG complexity
- Retry policy complexity

### Replay Metrics

- Replay success rate
- Replay latency
- Non-deterministic error rate
- Version conflict rate
