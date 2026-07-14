# Constitutional Runtime 2.1 - Event Sourcing Audit

## Overview

This report audits mutable state objects across the codebase and classifies them as events, projections, or mutable. Event sourcing requires that all state changes be represented as immutable events, with current state derived from event replay.

**Principle:** Events are immutable facts. Projections are derived state. Mutable state should be minimized.

---

## Event Sourcing Classification

### Event
- Immutable fact that occurred
- Append-only, never modified
- Source of truth for state changes

### Projection
- Derived state from events
- Can be rebuilt by replaying events
- May be mutable (cached state)

### Mutable State
- State that is not event-sourced
- Should be minimized
- Candidates for event sourcing migration

---

## Mutable State Object Audit

### 1. Intent

**Location:** `runtime/planning/strategy.py` (lines 42-67)

**Fields:**
- intent_id: str (immutable)
- intent_name: str (mutable)
- description: str (mutable)
- status: IntentStatus (mutable)
- created_at: str (immutable)
- updated_at: str (mutable)
- metadata: Dict[str, Any] (mutable)

**Classification:** **MUTABLE STATE**

**Issues:**
- Intent is mutable (intent_name, description, status, metadata)
- Should be event-sourced
- IntentCreated, IntentUpdated, IntentStatusChanged events

**Recommendation:** **MIGRATE TO EVENT SOURCING**

**Action:**
- Create IntentCreated event
- Create IntentUpdated event
- Create IntentStatusChanged event
- Intent becomes projection from events
- StrategyHierarchy becomes event store

---

### 2. Strategy

**Location:** `runtime/planning/strategy.py` (lines 70-98)

**Fields:**
- strategy_id: str (immutable)
- intent_id: str (immutable)
- strategy_name: str (mutable)
- description: str (mutable)
- status: StrategyStatus (mutable)
- created_at: str (immutable)
- updated_at: str (mutable)
- metadata: Dict[str, Any] (mutable)

**Classification:** **MUTABLE STATE**

**Issues:**
- Strategy is mutable (strategy_name, description, status, metadata)
- Should be event-sourced
- StrategyCreated, StrategyUpdated, StrategyStatusChanged events

**Recommendation:** **MIGRATE TO EVENT SOURCING**

**Action:**
- Create StrategyCreated event
- Create StrategyUpdated event
- Create StrategyStatusChanged event
- Strategy becomes projection from events
- StrategyHierarchy becomes event store

---

### 3. Objective

**Location:** `runtime/planning/hierarchy.py` (lines 118-150)

**Fields:**
- objective_id: str (immutable)
- intent_id: str (immutable)
- objective_name: str (mutable)
- current_revision: int (mutable)
- revisions: List[ObjectiveRevision] (mutable)
- created_at: str (immutable)
- updated_at: str (mutable)

**Classification:** **MUTABLE STATE**

**Issues:**
- Objective is mutable (objective_name, current_revision, revisions)
- Should be event-sourced
- ObjectiveCreated, ObjectiveUpdated, ObjectiveRevisionCreated events

**Recommendation:** **MIGRATE TO EVENT SOURCING**

**Action:**
- Create ObjectiveCreated event
- Create ObjectiveUpdated event
- Create ObjectiveRevisionCreated event
- Objective becomes projection from events
- HierarchyStore becomes event store

---

### 4. ObjectiveRevision

**Location:** `runtime/planning/hierarchy.py` (lines 84-115)

**Fields:**
- revision_id: str (immutable)
- objective_id: str (immutable)
- revision_number: int (immutable)
- description: str (immutable)
- success_criteria: List[str] (immutable)
- constraints: Dict[str, Any] (immutable)
- created_at: str (immutable)
- created_by: str (immutable)
- change_summary: str (immutable)
- status: ObjectiveStatus (mutable)

**Classification:** **MUTABLE STATE**

**Issues:**
- ObjectiveRevision is mutable (status)
- Should be event-sourced
- ObjectiveRevisionCreated, ObjectiveRevisionStatusChanged events

**Recommendation:** **MIGRATE TO EVENT SOURCING**

**Action:**
- Create ObjectiveRevisionCreated event
- Create ObjectiveRevisionStatusChanged event
- ObjectiveRevision becomes projection from events

---

### 5. Mission

**Location:** `runtime/planning/hierarchy.py` (lines 193-228)

**Fields:**
- mission_id: str (immutable)
- objective_id: str (immutable)
- objective_revision_id: str (immutable)
- mission_name: str (mutable)
- description: str (mutable)
- status: MissionStatus (mutable)
- tasks: List[Task] (mutable)
- created_at: str (immutable)
- updated_at: str (mutable)
- started_at: Optional[str] (mutable)
- completed_at: Optional[str] (mutable)
- metadata: Dict[str, Any] (mutable)

**Classification:** **MUTABLE STATE**

**Issues:**
- Mission is mutable (mission_name, description, status, tasks, timestamps, metadata)
- Should be event-sourced
- MissionCreated, MissionUpdated, MissionStatusChanged, MissionTaskAdded events

**Recommendation:** **MIGRATE TO EVENT SOURCING**

**Action:**
- Create MissionCreated event
- Create MissionUpdated event
- Create MissionStatusChanged event
- Create MissionTaskAdded event
- Mission becomes projection from events
- HierarchyStore becomes event store

---

### 6. Task

**Location:** `runtime/planning/hierarchy.py` (lines 153-190)

**Fields:**
- task_id: str (immutable)
- mission_id: str (immutable)
- task_name: str (mutable)
- description: str (mutable)
- skill_id: str (immutable)
- inputs: Dict[str, Any] (mutable)
- expected_outputs: Dict[str, Any] (mutable)
- status: TaskStatus (mutable)
- started_at: Optional[str] (mutable)
- completed_at: Optional[str] (mutable)
- error_message: Optional[str] (mutable)
- retry_count: int (mutable)
- metadata: Dict[str, Any] (mutable)

**Classification:** **MUTABLE STATE**

**Issues:**
- Task is mutable (task_name, description, inputs, outputs, status, timestamps, error, retry, metadata)
- Should be event-sourced
- TaskCreated, TaskUpdated, TaskStatusChanged, TaskStarted, TaskCompleted, TaskFailed events

**Recommendation:** **MIGRATE TO EVENT SOURCING**

**Action:**
- Create TaskCreated event
- Create TaskUpdated event
- Create TaskStatusChanged event
- Create TaskStarted event
- Create TaskCompleted event
- Create TaskFailed event
- Task becomes projection from events

---

### 7. ScheduledTask

**Location:** `runtime/scheduler/constitutional_scheduler.py` (lines 69-117)

**Fields:**
- task_id: str (immutable)
- mission_id: str (immutable)
- workflow_id: str (immutable)
- task_name: str (immutable)
- priority: SchedulingPriority (mutable)
- status: SchedulingStatus (mutable)
- constraints: SchedulingConstraints (immutable)
- scheduled_at: Optional[str] (mutable)
- started_at: Optional[str] (mutable)
- completed_at: Optional[str] (mutable)
- preempted_at: Optional[str] (mutable)
- preempted_by: Optional[str] (mutable)
- execution_node_id: Optional[str] (mutable)
- metadata: Dict[str, Any] (mutable)

**Classification:** **MUTABLE STATE**

**Issues:**
- ScheduledTask is mutable (priority, status, timestamps, execution_node_id, metadata)
- Should be event-sourced
- TaskScheduled, TaskPriorityChanged, TaskStatusChanged, TaskStarted, TaskCompleted, TaskPreempted events

**Recommendation:** **MIGRATE TO EVENT SOURCING**

**Action:**
- Create TaskScheduled event
- Create TaskPriorityChanged event
- Create TaskStatusChanged event
- Create TaskStarted event
- Create TaskCompleted event
- Create TaskPreempted event
- ScheduledTask becomes projection from events
- ConstitutionalScheduler becomes event store

---

### 8. EphemeralLease

**Location:** `runtime/hermes/constitutional_citizen.py` (lines 42-162)

**Fields:**
- lease_id: str (immutable)
- mission_id: str (immutable)
- hermes_id: str (immutable)
- granted_at: str (immutable)
- expires_at: str (immutable)
- status: LeaseStatus (mutable)
- read_capabilities: List[str] (immutable)
- write_capabilities: List[str] (immutable)
- execute_capabilities: List[str] (immutable)
- network_capabilities: List[str] (immutable)
- artifacts_readable: List[str] (immutable)
- artifacts_writable: List[str] (immutable)
- artifacts_creatable: List[str] (immutable)
- memory_readable: List[str] (immutable)
- memory_writable: List[str] (immutable)
- max_execution_time_seconds: int (immutable)
- max_token_budget: int (immutable)
- max_memory_mb: int (immutable)
- granted_by: str (immutable)
- revocation_reason: Optional[str] (mutable)
- metadata: Dict[str, Any] (mutable)

**Classification:** **MUTABLE STATE**

**Issues:**
- EphemeralLease is mutable (status, revocation_reason, metadata)
- Should be event-sourced
- LeaseGranted, LeaseRevoked, LeaseExpired events

**Recommendation:** **MIGRATE TO EVENT SOURCING**

**Action:**
- Create LeaseGranted event
- Create LeaseRevoked event
- Create LeaseExpired event
- EphemeralLease becomes projection from events
- LeaseManager becomes event store

---

### 9. ConstitutionalArtifact

**Location:** `runtime/artifacts/artifact_ontology.py` (lines 105-223)

**Fields:**
- artifact_id: str (immutable)
- artifact_type: ArtifactType (immutable)
- artifact_name: str (immutable)
- description: str (immutable)
- content_hash: str (immutable)
- content_uri: str (immutable)
- content_size_bytes: int (immutable)
- content_mime_type: str (immutable)
- owner_id: str (immutable)
- owner_type: str (immutable)
- created_by: str (immutable)
- created_at: str (immutable)
- immutable: bool (immutable)
- immutable_since: Optional[str] (immutable)
- lineage: ArtifactLineage (immutable)
- signature: Optional[ArtifactSignature] (mutable)
- schema: Optional[ArtifactSchema] (immutable)
- verifications: List[ArtifactVerification] (mutable)
- current_state: ArtifactState (mutable)
- metadata: Dict[str, Any] (mutable)

**Classification:** **MUTABLE STATE**

**Issues:**
- ConstitutionalArtifact is mutable (signature, verifications, current_state, metadata)
- Should be event-sourced
- ArtifactCreated, ArtifactSigned, ArtifactVerified, ArtifactStateChanged events

**Recommendation:** **MIGRATE TO EVENT SOURCING**

**Action:**
- Create ArtifactCreated event
- Create ArtifactSigned event
- Create ArtifactVerified event
- Create ArtifactStateChanged event
- ConstitutionalArtifact becomes projection from events
- ArtifactRegistry becomes event store

---

### 10. VerificationTask

**Location:** `runtime/verification/verifier.py` (lines 76-103)

**Fields:**
- task_id: str (immutable)
- mission_id: str (immutable)
- executor_id: str (immutable)
- verification_type: VerificationMethod (immutable)
- target_artifact_id: str (immutable)
- verification_criteria: Dict[str, Any] (immutable)
- priority: int (immutable)
- created_at: str (immutable)
- status: VerificationStatus (mutable)
- result: Optional[VerificationResult] (mutable)

**Classification:** **MUTABLE STATE**

**Issues:**
- VerificationTask is mutable (status, result)
- Should be event-sourced
- VerificationTaskCreated, VerificationTaskStarted, VerificationTaskCompleted, VerificationTaskFailed events

**Recommendation:** **MIGRATE TO EVENT SOURCING**

**Action:**
- Create VerificationTaskCreated event
- Create VerificationTaskStarted event
- Create VerificationTaskCompleted event
- Create VerificationTaskFailed event
- VerificationTask becomes projection from events
- IndependentVerifier becomes event store

---

### 11. EvidenceRequirement

**Location:** `runtime/evidence/evidence_compiler.py` (lines 56-69)

**Fields:**
- requirement_id: str (immutable)
- evidence_type: EvidenceType (immutable)
- description: str (immutable)
- source_artifact_id: Optional[str] (immutable)
- target_artifact_id: Optional[str] (immutable)
- verification_method: str (immutable)
- success_criteria: str (immutable)
- priority: EvidencePriority (immutable)
- estimated_duration_seconds: int (immutable)
- dependencies: List[str] (immutable)
- metadata: Dict[str, Any] (immutable)

**Classification:** **IMMUTABLE**

**Issues:** None

**Recommendation:** **KEEP**

**Analysis:**
- EvidenceRequirement is immutable
- No mutable fields
- No event sourcing needed

---

### 12. EvidencePlan

**Location:** `runtime/evidence/evidence_compiler.py` (lines 72-124)

**Fields:**
- plan_id: str (immutable)
- mission_id: str (immutable)
- generated_at: str (immutable)
- generated_by: str (immutable)
- requirements: List[EvidenceRequirement] (immutable)
- execution_order: List[str] (immutable)
- total_estimated_duration_seconds: int (immutable)
- critical_requirements: List[str] (immutable)
- metadata: Dict[str, Any] (immutable)

**Classification:** **IMMUTABLE**

**Issues:** None

**Recommendation:** **KEEP**

**Analysis:**
- EvidencePlan is immutable
- No mutable fields
- No event sourcing needed

---

### 13. PlanningIR

**Location:** `runtime/planning/planning_ir.py` (lines 95-329)

**Fields:**
- ir_id: str (immutable)
- ir_version: str (immutable)
- created_at: str (immutable)
- planner_id: str (immutable)
- intent: str (immutable)
- objective: str (immutable)
- objective_version: int (immutable)
- subgoals: List[Subgoal] (immutable)
- dependencies: List[Dependency] (immutable)
- capability_requests: List[CapabilityRequest] (immutable)
- risks: List[Risk] (immutable)
- safety_classification: SafetyClassification (immutable)
- evidence_requirements: List[EvidenceRequirement] (immutable)
- verification_steps: List[str] (immutable)
- failure_modes: List[FailureMode] (immutable)
- recovery_plan: str (immutable)
- rollback_available: bool (immutable)
- constraints: Dict[str, Any] (immutable)
- priority: int (immutable)
- estimated_total_tokens: int (immutable)
- estimated_total_time_seconds: int (immutable)
- expected_artifacts: List[str] (immutable)
- human_approval_required: bool (immutable)
- oracle_review_required: bool (immutable)
- compliance_requirements: List[str] (immutable)
- determinism: Determinism (immutable)

**Classification:** **IMMUTABLE**

**Issues:** None

**Recommendation:** **KEEP**

**Analysis:**
- PlanningIR is immutable
- No mutable fields
- No event sourcing needed

---

### 14. CanonicalIR

**Location:** `architecture/canonical_ir.py` (referenced)

**Fields:** Not reviewed

**Classification:** **UNKNOWN**

**Issues:** Need to review

**Recommendation:** **AUDIT**

**Action:** Review CanonicalIR for mutable fields

---

## Event Sourcing Summary

| Object | Classification | Mutable Fields | Recommendation |
|-------|----------------|----------------|----------------|
| Intent | MUTABLE STATE | intent_name, description, status, metadata | Migrate to event sourcing |
| Strategy | MUTABLE STATE | strategy_name, description, status, metadata | Migrate to event sourcing |
| Objective | MUTABLE STATE | objective_name, current_revision, revisions | Migrate to event sourcing |
| ObjectiveRevision | MUTABLE STATE | status | Migrate to event sourcing |
| Mission | MUTABLE STATE | mission_name, description, status, tasks, timestamps, metadata | Migrate to event sourcing |
| Task | MUTABLE STATE | task_name, description, inputs, outputs, status, timestamps, error, retry, metadata | Migrate to event sourcing |
| ScheduledTask | MUTABLE STATE | priority, status, timestamps, execution_node_id, metadata | Migrate to event sourcing |
| EphemeralLease | MUTABLE STATE | status, revocation_reason, metadata | Migrate to event sourcing |
| ConstitutionalArtifact | MUTABLE STATE | signature, verifications, current_state, metadata | Migrate to event sourcing |
| VerificationTask | MUTABLE STATE | status, result | Migrate to event sourcing |
| EvidenceRequirement | IMMUTABLE | None | Keep |
| EvidencePlan | IMMUTABLE | None | Keep |
| PlanningIR | IMMUTABLE | None | Keep |
| CanonicalIR | UNKNOWN | Need review | Audit |

---

## Event Sourcing Migration Priority

### High Priority (Core Runtime State)

1. **Intent, Strategy, Objective, Mission, Task**
   - Core runtime state
   - High mutation rate
   - Critical for replay

2. **ScheduledTask**
   - Scheduler state
   - High mutation rate
   - Critical for scheduling replay

### Medium Priority (Security and Artifacts)

3. **EphemeralLease**
   - Security state
   - Medium mutation rate
   - Important for security audit

4. **ConstitutionalArtifact**
   - Artifact state
   - Medium mutation rate
   - Important for artifact lineage

### Low Priority (Verification)

5. **VerificationTask**
   - Verification state
   - Low mutation rate
   - Important for verification audit

---

## Recommendations

### High Priority Actions

1. **Migrate Intent to event sourcing**
   - Create IntentCreated event
   - Create IntentUpdated event
   - Create IntentStatusChanged event
   - Intent becomes projection

2. **Migrate Strategy to event sourcing**
   - Create StrategyCreated event
   - Create StrategyUpdated event
   - Create StrategyStatusChanged event
   - Strategy becomes projection

3. **Migrate Objective to event sourcing**
   - Create ObjectiveCreated event
   - Create ObjectiveUpdated event
   - Create ObjectiveRevisionCreated event
   - Objective becomes projection

4. **Migrate Mission to event sourcing**
   - Create MissionCreated event
   - Create MissionUpdated event
   - Create MissionStatusChanged event
   - Create MissionTaskAdded event
   - Mission becomes projection

5. **Migrate Task to event sourcing**
   - Create TaskCreated event
   - Create TaskUpdated event
   - Create TaskStatusChanged event
   - Create TaskStarted event
   - Create TaskCompleted event
   - Create TaskFailed event
   - Task becomes projection

### Medium Priority Actions

6. **Migrate ScheduledTask to event sourcing**
   - Create TaskScheduled event
   - Create TaskPriorityChanged event
   - Create TaskStatusChanged event
   - Create TaskStarted event
   - Create TaskCompleted event
   - Create TaskPreempted event
   - ScheduledTask becomes projection

7. **Migrate EphemeralLease to event sourcing**
   - Create LeaseGranted event
   - Create LeaseRevoked event
   - Create LeaseExpired event
   - EphemeralLease becomes projection

8. **Migrate ConstitutionalArtifact to event sourcing**
   - Create ArtifactCreated event
   - Create ArtifactSigned event
   - Create ArtifactVerified event
   - Create ArtifactStateChanged event
   - ConstitutionalArtifact becomes projection

### Low Priority Actions

9. **Migrate VerificationTask to event sourcing**
   - Create VerificationTaskCreated event
   - Create VerificationTaskStarted event
   - Create VerificationTaskCompleted event
   - Create VerificationTaskFailed event
   - VerificationTask becomes projection

10. **Audit CanonicalIR for mutability**
    - Review CanonicalIR fields
    - Classify as event, projection, or mutable
    - Migrate if needed

---

## Conclusion

The Constitutional Runtime 2.1 has significant mutable state that should be event-sourced. Most core runtime objects (Intent, Strategy, Objective, Mission, Task) are mutable and should be migrated to event sourcing.

**Key Findings:**
- 10/13 objects are mutable state
- 3/13 objects are immutable
- 1/13 objects need audit
- High mutation rate in core runtime objects

**Impact:**
- Mutable state makes replay difficult
- Hard to audit state changes
- Hard to debug issues
- Architectural entropy increases

**Recommendations:**
1. Migrate core runtime state to event sourcing (Intent, Strategy, Objective, Mission, Task)
2. Migrate scheduler state to event sourcing (ScheduledTask)
3. Migrate security state to event sourcing (EphemeralLease)
4. Migrate artifact state to event sourcing (ConstitutionalArtifact)
5. Migrate verification state to event sourcing (VerificationTask)
6. Audit CanonicalIR for mutability

**Next Steps:**
1. Create event definitions for core runtime objects
2. Implement event stores for each subsystem
3. Implement projection builders for each object
4. Implement event replay for each subsystem
5. Test event replay correctness
6. Migrate subsystems to use projections
