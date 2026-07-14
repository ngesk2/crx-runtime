# Constitutional Runtime 2.1 - Constitutional Law Audit

## Overview

This report identifies procedural invariants that should be elevated to constitutional laws. Constitutional laws are immutable architectural invariants that cannot be violated. Procedural invariants are currently implemented as code patterns but not explicitly enforced as laws.

**Principle:** Elevate procedural invariants to constitutional laws for explicit enforcement and documentation.

---

## Current Constitutional Laws

**Location:** `constitution/laws.py`

**Existing Laws:**
- Law 0: Planning never executes
- Law 1: Execution never replans
- Law 2: No subsystem grants itself authority
- Law 3: Capabilities always expire
- Law 4: Artifacts are immutable
- Law 5: Events are append-only
- Law 6: Oracle never executes candidate code
- Law 7: Planner cannot observe secrets unless granted capability
- Law 8: Every external side effect must have evidence
- Law 9: Every action must be replayable
- Law 10: Rollback always exists

---

## Procedural Invariant Audit

### 1. Scheduler Fairness

**Location:** `runtime/scheduler/constitutional_scheduler.py` (lines 396-413)

**Invariant:** Scheduler applies fairness policy to prevent starvation

**Current Implementation:**
```python
def apply_fairness_policy(self) -> None:
    """Apply fairness policy to prevent starvation."""
    for task in self._tasks.values():
        if task.status == SchedulingStatus.PENDING:
            if task.scheduled_at:
                scheduled = datetime.fromisoformat(task.scheduled_at)
                age = (datetime.now(timezone.utc) - scheduled).total_seconds()
                
                if age > 3600:  # 1 hour
                    if task.priority == SchedulingPriority.LOW:
                        task.priority = SchedulingPriority.MEDIUM
                    elif task.priority == SchedulingPriority.MEDIUM:
                        task.priority = SchedulingPriority.HIGH
```

**Classification:** **PROCEDURAL INVARIANT**

**Analysis:**
- Fairness is a procedural invariant
- Currently implemented as method
- Not explicitly enforced as constitutional law
- Should be elevated to constitutional law

**Recommendation:** **ELEVATE TO CONSTITUTIONAL LAW**

**Action:**
- Add Law 11: Scheduler must prevent task starvation
- Implement ConstitutionalGuard check for starvation prevention
- Enforce fairness policy as constitutional requirement

---

### 2. Capability Broker Ownership Chain

**Location:** `runtime/security/semantic_capabilities.py` (lines 237-245)

**Invariant:** Capability broker checks ownership chain for permission

**Current Implementation:**
```python
def _has_ownership_chain(self, requester_id: str, resource_path: str) -> bool:
    """Check if there's an ownership chain from requester to resource."""
    for cap_id, capability in self._capabilities.items():
        if capability.ownership.owner_id == requester_id:
            cap_path = capability.path.to_string()
            if resource_path.startswith(cap_path):
                return True
    return False
```

**Classification:** **PROCEDURAL INVARIANT**

**Analysis:**
- Ownership chain verification is a procedural invariant
- Currently implemented as method
- Not explicitly enforced as constitutional law
- Should be elevated to constitutional law

**Recommendation:** **ELEVATE TO CONSTITUTIONAL LAW**

**Action:**
- Add Law 12: Capability permission requires ownership chain verification
- Implement ConstitutionalGuard check for ownership chain
- Enforce ownership chain verification as constitutional requirement

---

### 3. Verifier Independence

**Location:** `runtime/verification/verifier.py` (lines 106-114)

**Invariant:** Verifier should not trust executor

**Current Implementation:**
```python
class IndependentVerifier:
    """
    Independent Verifier - Separate from Executor and Oracle.
    
    Verifier should not trust executor.
    Oracle should not trust verifier.
    
    Exactly like compiler passes.
    """
```

**Classification:** **PROCEDURAL INVARIANT**

**Analysis:**
- Verifier independence is a procedural invariant
- Currently documented as docstring
- Not explicitly enforced as constitutional law
- Should be elevated to constitutional law

**Recommendation:** **ELEVATE TO CONSTITUTIONAL LAW**

**Action:**
- Add Law 13: Verifier must not trust executor
- Implement ConstitutionalGuard check for verifier independence
- Enforce verifier independence as constitutional requirement

---

### 4. Oracle Independence

**Location:** `runtime/verification/verifier.py` (lines 106-114)

**Invariant:** Oracle should not trust verifier

**Current Implementation:**
```python
class IndependentVerifier:
    """
    Independent Verifier - Separate from Executor and Oracle.
    
    Verifier should not trust executor.
    Oracle should not trust verifier.
    
    Exactly like compiler passes.
    """
```

**Classification:** **PROCEDURAL INVARIANT**

**Analysis:**
- Oracle independence is a procedural invariant
- Currently documented as docstring
- Not explicitly enforced as constitutional law
- Should be elevated to constitutional law

**Recommendation:** **ELEVATE TO CONSTITUTIONAL LAW**

**Action:**
- Add Law 14: Oracle must not trust verifier
- Implement ConstitutionalGuard check for oracle independence
- Enforce oracle independence as constitutional requirement

---

### 5. Compiler Stage Purity

**Location:** `runtime/planning/compiler_stages.py` (lines 85-128)

**Invariant:** Compiler stages are pure transformations

**Current Implementation:**
```python
class CompilerStage:
    """
    Base class for compiler stages.
    
    Each stage represents a high-level phase in the compilation pipeline.
    """
    
    def execute(self, input_ir: Any, context: Dict[str, Any]) -> tuple[StageResult, Any]:
        """Execute the compiler stage."""
        start_time = datetime.now(timezone.utc)
        
        success, errors, warnings, output_ir = self._execute_stage(input_ir, context)
        
        duration = (datetime.now(timezone.utc) - start_time).total_seconds()
        
        result = StageResult(...)
        return result, output_ir
```

**Classification:** **PROCEDURAL INVARIANT**

**Analysis:**
- Compiler stage purity is a procedural invariant
- Currently implemented as design pattern
- Not explicitly enforced as constitutional law
- Should be elevated to constitutional law

**Recommendation:** **ELEVATE TO CONSTITUTIONAL LAW**

**Action:**
- Add Law 15: Compiler stages must be pure transformations
- Implement ConstitutionalGuard check for compiler stage purity
- Enforce compiler stage purity as constitutional requirement

---

### 6. Capability Hierarchical Structure

**Location:** `runtime/security/semantic_capabilities.py` (lines 54-98)

**Invariant:** Capabilities use hierarchical structure for mathematical negotiation

**Current Implementation:**
```python
@dataclass
class CapabilityPath:
    """
    Hierarchical capability path.
    
    Example: filesystem.directory.workspace.artifact.write
    """
    domain: CapabilityDomain
    path_components: List[str]
    operation: Operation
    
    def is_ancestor_of(self, other: 'CapabilityPath') -> bool:
        """Check if this path is an ancestor of another."""
        ...
    
    def is_descendant_of(self, other: 'CapabilityPath') -> bool:
        """Check if this path is a descendant of another."""
        ...
```

**Classification:** **PROCEDURAL INVARIANT**

**Analysis:**
- Hierarchical capability structure is a procedural invariant
- Currently implemented as data structure
- Not explicitly enforced as constitutional law
- Should be elevated to constitutional law

**Recommendation:** **ELEVATE TO CONSTITUTIONAL LAW**

**Action:**
- Add Law 16: Capabilities must use hierarchical structure
- Implement ConstitutionalGuard check for hierarchical capability structure
- Enforce hierarchical capability structure as constitutional requirement

---

### 7. Evidence Generation

**Location:** `runtime/evidence/evidence_compiler.py` (lines 127-136)

**Invariant:** Hermes never invents verification

**Current Implementation:**
```python
class EvidenceCompiler:
    """
    Evidence Compiler - Generates evidence plans from missions.
    
    Input: Mission
    Output: Evidence Plan
    
    Automatically generates verification steps based on mission characteristics.
    Hermes never invents verification.
    """
```

**Classification:** **PROCEDURAL INVARIANT**

**Analysis:**
- Evidence generation is a procedural invariant
- Currently documented as docstring
- Not explicitly enforced as constitutional law
- Should be elevated to constitutional law

**Recommendation:** **ELEVATE TO CONSTITUTIONAL LAW**

**Action:**
- Add Law 17: Evidence generation must be automatic, not invented
- Implement ConstitutionalGuard check for evidence generation
- Enforce automatic evidence generation as constitutional requirement

---

### 8. Artifact Lineage

**Location:** `runtime/artifacts/artifact_ontology.py` (lines 66-72)

**Invariant:** Artifacts have lineage tracking

**Current Implementation:**
```python
@dataclass
class ArtifactLineage:
    """Lineage information for an artifact."""
    parent_artifact_ids: List[str]
    derivation_type: str  # created_from, transformed_from, derived_from
    transformation_description: str
    provenance: Dict[str, Any]
```

**Classification:** **PROCEDURAL INVARIANT**

**Analysis:**
- Artifact lineage tracking is a procedural invariant
- Currently implemented as data structure
- Not explicitly enforced as constitutional law
- Should be elevated to constitutional law

**Recommendation:** **ELEVATE TO CONSTITUTIONAL LAW**

**Action:**
- Add Law 18: Artifacts must have lineage tracking
- Implement ConstitutionalGuard check for artifact lineage
- Enforce artifact lineage tracking as constitutional requirement

---

### 9. Artifact Immutability

**Location:** `runtime/artifacts/artifact_ontology.py` (lines 155-157)

**Invariant:** Artifacts are immutable

**Current Implementation:**
```python
def is_immutable(self) -> bool:
    """Check if artifact is immutable."""
    return self.immutable
```

**Classification:** **ALREADY CONSTITUTIONAL LAW**

**Analysis:**
- Artifact immutability is already Law 4
- Currently implemented as method
- Enforced as constitutional law

**Recommendation:** **KEEP**

**Action:** None (already constitutional law)

---

### 10. Event Append-Only

**Location:** `architecture/canonical_events.py` (referenced)

**Invariant:** Events are append-only

**Classification:** **ALREADY CONSTITUTIONAL LAW**

**Analysis:**
- Event append-only is already Law 5
- Enforced as constitutional law

**Recommendation:** **KEEP**

**Action:** None (already constitutional law)

---

## Procedural Invariant Summary

| Invariant | Classification | Status | Recommendation |
|-----------|----------------|--------|----------------|
| Scheduler Fairness | PROCEDURAL INVARIANT | Not constitutional | Elevate to Law 11 |
| Capability Broker Ownership Chain | PROCEDURAL INVARIANT | Not constitutional | Elevate to Law 12 |
| Verifier Independence | PROCEDURAL INVARIANT | Not constitutional | Elevate to Law 13 |
| Oracle Independence | PROCEDURAL INVARIANT | Not constitutional | Elevate to Law 14 |
| Compiler Stage Purity | PROCEDURAL INVARIANT | Not constitutional | Elevate to Law 15 |
| Capability Hierarchical Structure | PROCEDURAL INVARIANT | Not constitutional | Elevate to Law 16 |
| Evidence Generation | PROCEDURAL INVARIANT | Not constitutional | Elevate to Law 17 |
| Artifact Lineage | PROCEDURAL INVARIANT | Not constitutional | Elevate to Law 18 |
| Artifact Immutability | CONSTITUTIONAL LAW | Already Law 4 | Keep |
| Event Append-Only | CONSTITUTIONAL LAW | Already Law 5 | Keep |

---

## Proposed New Constitutional Laws

### Law 11: Scheduler must prevent task starvation
**Invariant:** Scheduler applies fairness policy to prevent task starvation
**Enforcement:** ConstitutionalGuard checks for starvation prevention
**Implementation:** Fairness policy must be applied to pending tasks

### Law 12: Capability permission requires ownership chain verification
**Invariant:** Capability broker checks ownership chain for permission
**Enforcement:** ConstitutionalGuard checks for ownership chain verification
**Implementation:** Permission requires ownership chain verification

### Law 13: Verifier must not trust executor
**Invariant:** Verifier is independent from executor
**Enforcement:** ConstitutionalGuard checks for verifier independence
**Implementation:** Verifier must not trust executor output

### Law 14: Oracle must not trust verifier
**Invariant:** Oracle is independent from verifier
**Enforcement:** ConstitutionalGuard checks for oracle independence
**Implementation:** Oracle must not trust verifier output

### Law 15: Compiler stages must be pure transformations
**Invariant:** Compiler stages have no side effects
**Enforcement:** ConstitutionalGuard checks for compiler stage purity
**Implementation:** Compiler stages must not perform IO, execution, or state mutation

### Law 16: Capabilities must use hierarchical structure
**Invariant:** Capabilities use hierarchical structure for mathematical negotiation
**Enforcement:** ConstitutionalGuard checks for hierarchical capability structure
**Implementation:** Capabilities must use hierarchical CapabilityPath

### Law 17: Evidence generation must be automatic, not invented
**Invariant:** Evidence compiler generates evidence automatically
**Enforcement:** ConstitutionalGuard checks for automatic evidence generation
**Implementation:** Evidence must be generated by compiler, not invented by Hermes

### Law 18: Artifacts must have lineage tracking
**Invariant:** Artifacts have lineage tracking for provenance
**Enforcement:** ConstitutionalGuard checks for artifact lineage
**Implementation:** Artifacts must have ArtifactLineage with parent tracking

---

## Recommendations

### High Priority Actions

1. **Elevate Scheduler Fairness to Law 11**
   - Add Law 11 to constitution/laws.py
   - Implement ConstitutionalGuard check for starvation prevention
   - Enforce fairness policy as constitutional requirement

2. **Elevate Capability Ownership Chain to Law 12**
   - Add Law 12 to constitution/laws.py
   - Implement ConstitutionalGuard check for ownership chain verification
   - Enforce ownership chain verification as constitutional requirement

3. **Elevate Verifier Independence to Law 13**
   - Add Law 13 to constitution/laws.py
   - Implement ConstitutionalGuard check for verifier independence
   - Enforce verifier independence as constitutional requirement

4. **Elevate Oracle Independence to Law 14**
   - Add Law 14 to constitution/laws.py
   - Implement ConstitutionalGuard check for oracle independence
   - Enforce oracle independence as constitutional requirement

### Medium Priority Actions

5. **Elevate Compiler Stage Purity to Law 15**
   - Add Law 15 to constitution/laws.py
   - Implement ConstitutionalGuard check for compiler stage purity
   - Enforce compiler stage purity as constitutional requirement

6. **Elevate Capability Hierarchical Structure to Law 16**
   - Add Law 16 to constitution/laws.py
   - Implement ConstitutionalGuard check for hierarchical capability structure
   - Enforce hierarchical capability structure as constitutional requirement

7. **Elevate Evidence Generation to Law 17**
   - Add Law 17 to constitution/laws.py
   - Implement ConstitutionalGuard check for automatic evidence generation
   - Enforce automatic evidence generation as constitutional requirement

8. **Elevate Artifact Lineage to Law 18**
   - Add Law 18 to constitution/laws.py
   - Implement ConstitutionalGuard check for artifact lineage
   - Enforce artifact lineage tracking as constitutional requirement

---

## Conclusion

The Constitutional Runtime 2.1 has 8 procedural invariants that should be elevated to constitutional laws. These invariants are currently implemented as code patterns but not explicitly enforced as laws.

**Key Findings:**
- 8 procedural invariants identified
- 2 invariants already constitutional laws (Law 4, Law 5)
- 8 invariants should be elevated to constitutional laws (Laws 11-18)
- Total constitutional laws would increase from 10 to 18

**Impact:**
- Explicit enforcement of architectural invariants
- Better documentation of architectural requirements
- Easier to enforce constitutional requirements
- Reduced architectural entropy

**Recommendations:**
1. Elevate 8 procedural invariants to constitutional laws
2. Implement ConstitutionalGuard checks for each new law
3. Enforce constitutional requirements at runtime
4. Document constitutional laws in architecture

**Next Steps:**
1. Add Law 11 (Scheduler Fairness) to constitution/laws.py
2. Add Law 12 (Capability Ownership Chain) to constitution/laws.py
3. Add Law 13 (Verifier Independence) to constitution/laws.py
4. Add Law 14 (Oracle Independence) to constitution/laws.py
5. Add Law 15 (Compiler Stage Purity) to constitution/laws.py
6. Add Law 16 (Capability Hierarchical Structure) to constitution/laws.py
7. Add Law 17 (Evidence Generation) to constitution/laws.py
8. Add Law 18 (Artifact Lineage) to constitution/laws.py
9. Implement ConstitutionalGuard checks for each new law
10. Test constitutional law enforcement
