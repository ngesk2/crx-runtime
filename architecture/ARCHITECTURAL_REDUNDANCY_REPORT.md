# Constitutional Runtime 2.1 - Architectural Redundancy Report

## Overview

This report identifies duplicate abstractions across the Constitutional Runtime 2.1 codebase and provides recommendations for consolidation.

**Principle:** Reduce long-term complexity by eliminating redundancy. Prefer deletion over addition. Prefer adapters over breaking changes.

---

## Duplicate Abstractions

### 1. Intent

**Locations:**
- `runtime/planning/hierarchy.py` - Intent class (lines 56-81)
- `runtime/planning/strategy.py` - Intent class (lines 42-67)

**Analysis:**
- Both define identical Intent dataclass
- Both have identical fields: intent_id, intent_name, description, status, created_at, updated_at, metadata
- Both have identical to_dict() method
- Both have identical IntentStatus enum

**Recommendation:** **MERGE**

**Action:**
- Keep Intent in `strategy.py` (Strategy hierarchy)
- Remove Intent from `hierarchy.py` (legacy hierarchy)
- Update HierarchyStore to reference Intent from strategy module
- Intent is stable, belongs in Strategy hierarchy (Intent → Strategy → Objective)

**Rationale:**
- Intent is the stable foundation
- Strategy hierarchy is the canonical location
- Hierarchy.py is legacy, should delegate to canonical

---

### 2. Objective

**Locations:**
- `runtime/planning/hierarchy.py` - Objective class (lines 118-150), ObjectiveRevision (lines 84-115)
- `runtime/planning/transient_objectives.py` - TransientObjective class (lines 1-267)

**Analysis:**
- Legacy Objective: Versioned, persistent, architectural entity
- TransientObjective: Planning construct, compiles to Mission IR, optional persistence
- Adapter exists: ObjectiveAdapter converts between them

**Recommendation:** **ADAPTER**

**Action:**
- Keep TransientObjective as canonical (planning construct)
- Keep legacy Objective in hierarchy.py for backwards compatibility
- Adapter already implemented
- Deprecate legacy Objective with warnings
- Remove legacy Objective after validation period

**Rationale:**
- TransientObjective is the architectural future
- Legacy Objective must remain for backwards compatibility
- Adapter provides migration path
- No breaking changes

---

### 3. Mission

**Locations:**
- `runtime/planning/hierarchy.py` - Mission class (lines 193-228)
- `runtime/planning/transient_objectives.py` - MissionIR (referenced as compilation target)
- `architecture/canonical_ir.py` - Canonical IR (execution representation)

**Analysis:**
- Legacy Mission: Contains tasks, instantiated from ObjectiveRevision
- MissionIR: Compiled from TransientObjective, executable representation
- Canonical IR: Single source of truth for execution

**Recommendation:** **MERGE**

**Action:**
- Keep Canonical IR as canonical execution representation
- MissionIR becomes internal compilation detail
- Legacy Mission in hierarchy.py deprecated
- Adapter converts legacy Mission to Canonical IR
- Remove legacy Mission after validation

**Rationale:**
- Canonical IR is the single source of truth
- MissionIR is internal to compilation
- Legacy Mission is backwards compatibility only
- Reduces to one execution representation

---

### 4. Capability vs Permission vs Lease

**Locations:**
- `runtime/security/semantic_capabilities.py` - SemanticCapability, CapabilityPath
- `runtime/hermes/constitutional_citizen.py` - EphemeralLease
- No explicit Permission class found

**Analysis:**
- SemanticCapability: Hierarchical capability path, ownership, operations
- EphemeralLease: Time-bounded capability grant for Hermes
- Permission: Not explicitly defined (implicit in capability checks)

**Recommendation:** **KEEP**

**Action:**
- Keep SemanticCapability (canonical capability representation)
- Keep EphemeralLease (ephemeral grants for execution)
- Permission remains implicit (no action needed)
- Lease is a time-bounded capability grant (correct separation)

**Rationale:**
- Capability = what can be done (static definition)
- Lease = temporary grant of capability (dynamic authorization)
- Permission = implicit capability check (no separate abstraction needed)
- Clear separation of concerns

---

### 5. Evidence vs Artifact Metadata

**Locations:**
- `runtime/evidence/evidence_compiler.py` - EvidenceRequirement, EvidencePlan
- `runtime/artifacts/artifact_ontology.py` - ConstitutionalArtifact, ArtifactVerification

**Analysis:**
- Evidence: Verification results, test results, proof of correctness
- Artifact Verification: Verification attached to specific artifact
- Overlap: Both represent verification information

**Recommendation:** **MERGE**

**Action:**
- Keep ConstitutionalArtifact as canonical (first-class citizen)
- EvidenceRequirement becomes ArtifactVerification
- EvidencePlan becomes verification plan for artifacts
- Evidence compiler generates ArtifactVerifications
- Remove separate evidence abstractions

**Rationale:**
- Artifacts are first-class constitutional citizens
- Evidence is verification of artifacts
- Evidence should be artifact metadata, not separate entity
- Reduces to one verification abstraction

---

### 6. Verification vs Validation

**Locations:**
- `runtime/verification/verifier.py` - IndependentVerifier, VerificationResult
- No explicit Validation class found

**Analysis:**
- Verification: Independent verification of executor output
- Validation: Schema validation, data validation (implicit)

**Recommendation:** **KEEP**

**Action:**
- Keep Verification (independent verification of execution)
- Validation remains implicit (schema validation, data validation)
- No separate Validation abstraction needed

**Rationale:**
- Verification = independent verification of execution (constitutional requirement)
- Validation = data/schema validation (implementation detail)
- Clear separation: Verification is constitutional, validation is technical

---

### 7. Policy vs Constitutional Law vs Strategy

**Locations:**
- `constitution/laws.py` - Constitutional Laws (immutable invariants)
- `runtime/planning/strategy.py` - Strategy (approach to achieving intent)
- No explicit Policy class found

**Analysis:**
- Constitutional Law: Immutable architectural invariants (Law 0-10)
- Strategy: High-level approach to achieving intent (zero trust, offline first, etc.)
- Policy: Configurable rules (not explicitly defined)

**Recommendation:** **EVALUATE**

**Action:**
- Keep Constitutional Laws (immutable invariants)
- Keep Strategy (stable architectural behavior)
- Evaluate whether Strategy should become Constitutional Law
- If Strategy represents stable architectural behavior → elevate to Constitutional Law
- If Strategy represents configurable approach → keep as Strategy
- Policy remains undefined (evaluate if needed)

**Rationale:**
- Constitutional Laws are immutable invariants (cannot be violated)
- Strategies may represent stable architectural behavior
- Need to evaluate if Strategies are truly immutable or configurable
- Policy may be needed for configurable rules

**Evaluation Required:**
- Are Strategies (zero trust, offline first, local models) immutable or configurable?
- If immutable → elevate to Constitutional Law
- If configurable → keep as Strategy
- Policy abstraction may be needed for configurable rules

---

### 8. Scheduler vs Planner

**Locations:**
- `runtime/scheduler/constitutional_scheduler.py` - ConstitutionalScheduler
- `runtime/planning/planning_ir.py` - PlanningIR (planning output)
- No explicit Planner class found

**Analysis:**
- Scheduler: Decides execution order, priority, deadlines, preemption
- Planner: Generates PlanningIR (planning output)
- Clear separation: Planning never executes, Execution never replans

**Recommendation:** **KEEP**

**Action:**
- Keep Scheduler (execution scheduling)
- Keep PlanningIR (planning output)
- Planner remains implicit (generates PlanningIR)
- No Planner abstraction needed

**Rationale:**
- Scheduler = when to execute (execution concern)
- Planner = what to execute (planning concern)
- Clear separation enforced by Constitutional Law
- No duplication

---

### 9. Workflow vs Mission

**Locations:**
- `runtime/planning/hierarchy.py` - Mission class
- `runtime/scheduler/constitutional_scheduler.py` - workflow_id in ScheduledTask
- No explicit Workflow class found

**Analysis:**
- Mission: Concrete execution plan from objective revision
- Workflow: Referenced in scheduler but not defined

**Recommendation:** **MERGE**

**Action:**
- Keep Mission as canonical execution plan
- Remove workflow_id from ScheduledTask
- Use mission_id instead
- Workflow abstraction not needed

**Rationale:**
- Mission is the canonical execution plan
- Workflow is redundant concept
- Scheduler should reference mission_id, not workflow_id
- Reduces to one execution plan abstraction

---

### 10. Execution Graph vs DAG

**Locations:**
- No explicit ExecutionGraph class found
- No explicit DAG class found
- Referenced in architecture but not implemented

**Analysis:**
- Execution Graph: Conceptual representation of execution dependencies
- DAG: Directed acyclic graph (implementation detail)
- Both referenced but not explicitly defined

**Recommendation:** **INTERNAL ONLY**

**Action:**
- Execution Graph becomes internal implementation detail
- DAG becomes internal implementation detail
- Canonical IR is the public representation
- No public ExecutionGraph or DAG abstractions

**Rationale:**
- Canonical IR is the public representation
- Execution graph is internal transformation of CIR
- DAG is implementation detail for scheduling
- Hide implementation details

---

### 11. Planning IR vs Mission IR

**Locations:**
- `runtime/planning/planning_ir.py` - PlanningIR (platform-independent, capability-agnostic)
- `runtime/planning/transient_objectives.py` - MissionIR (compiled from objectives)
- `architecture/canonical_ir.py` - CanonicalIR (single source of truth)

**Analysis:**
- PlanningIR: Platform-independent, capability-agnostic planning output
- MissionIR: Compiled from objectives, executable representation
- CanonicalIR: Single source of truth for execution

**Recommendation:** **MERGE**

**Action:**
- Keep PlanningIR (platform-independent planning output)
- MissionIR becomes internal compilation detail
- CanonicalIR is the canonical execution representation
- Pipeline: PlanningIR → MissionIR (internal) → CanonicalIR
- Remove MissionIR as public abstraction

**Rationale:**
- PlanningIR is platform-independent (needed for planning)
- CanonicalIR is execution representation (needed for execution)
- MissionIR is internal compilation step
- Reduces public abstractions

---

### 12. Task vs Node

**Locations:**
- `runtime/planning/hierarchy.py` - Task class (lines 153-190)
- `architecture/canonical_ir.py` - CIRNode (referenced)
- `runtime/scheduler/constitutional_scheduler.py` - ScheduledTask

**Analysis:**
- Task: Atomic unit of work in legacy hierarchy
- Node: Node in Canonical IR
- ScheduledTask: Task scheduled for execution

**Recommendation:** **MERGE**

**Action:**
- Keep CIRNode as canonical execution node
- ScheduledTask becomes internal scheduling detail
- Legacy Task deprecated
- Adapter converts legacy Task to CIRNode

**Rationale:**
- CIRNode is canonical execution representation
- ScheduledTask is internal scheduling detail
- Legacy Task is backwards compatibility only
- Reduces to one node abstraction

---

## Summary of Recommendations

| Abstraction | Recommendation | Action |
|-------------|----------------|--------|
| Intent | MERGE | Keep in strategy.py, remove from hierarchy.py |
| Objective | ADAPTER | Keep TransientObjective, deprecate legacy |
| Mission | MERGE | Keep Canonical IR, deprecate legacy Mission |
| Capability/Permission/Lease | KEEP | All three serve distinct purposes |
| Evidence/Artifact Metadata | MERGE | Evidence becomes ArtifactVerification |
| Verification/Validation | KEEP | Verification is constitutional, validation is technical |
| Policy/Law/Strategy | EVALUATE | Evaluate if Strategy should become Law |
| Scheduler/Planner | KEEP | Clear separation of concerns |
| Workflow/Mission | MERGE | Remove workflow, use mission_id |
| Execution Graph/DAG | INTERNAL ONLY | Hide implementation details |
| Planning IR/Mission IR | MERGE | MissionIR becomes internal |
| Task/Node | MERGE | Keep CIRNode, deprecate Task |

---

## Priority Actions

### High Priority (Architectural Clarity)

1. **Merge Intent** - Remove duplicate Intent definition
2. **Merge Mission** - Canonical IR as single execution representation
3. **Merge Evidence/Artifact** - Evidence as artifact metadata
4. **Merge Workflow/Mission** - Remove workflow abstraction
5. **Merge Planning IR/Mission IR** - MissionIR as internal detail
6. **Merge Task/Node** - CIRNode as canonical node

### Medium Priority (Evaluation Required)

1. **Evaluate Strategy vs Constitutional Law** - Determine if Strategy is immutable
2. **Deprecate legacy Objective** - After adapter validation
3. **Deprecate legacy Mission** - After adapter validation
4. **Deprecate legacy Task** - After adapter validation

### Low Priority (Internal Details)

1. **Hide Execution Graph/DAG** - Make internal implementation detail

---

## Impact Assessment

### Reduction in Public Abstractions

- **Before:** 15+ abstractions
- **After:** 8 abstractions
- **Reduction:** ~47%

### Backwards Compatibility

- All legacy abstractions remain via adapters
- No breaking changes
- Gradual deprecation path
- Validation period before removal

### Architectural Clarity

- Single source of truth for execution (Canonical IR)
- Clear separation of concerns (Scheduler vs Planner)
- Reduced cognitive load for contributors
- Easier to understand for new contributors

---

## Conclusion

The Constitutional Runtime 2.1 has significant architectural redundancy. By merging duplicate abstractions and hiding implementation details, we can reduce public abstractions by ~47% while maintaining backwards compatibility through adapters.

The key insight is that many abstractions exist at different layers (legacy vs canonical, public vs internal) and can be consolidated without losing functionality.

**Next Steps:**
1. Implement high-priority merges
2. Evaluate Strategy vs Constitutional Law
3. Validate adapters
4. Deprecate legacy abstractions
5. Hide internal implementation details
