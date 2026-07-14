# Constitutional Runtime 2.1 - CIR Dependency Report

## Overview

This report treats Canonical IR as the constitutional source of execution truth and ensures every downstream subsystem consumes CIR. Nothing should bypass CIR. No subsystem should invent additional execution semantics.

**Principle:** Canonical IR is the single source of truth for execution. All downstream subsystems must consume CIR.

---

## CIR Definition

**Location:** `architecture/canonical_ir.py`

**Canonical IR Structure:**
- CanonicalIR dataclass
- CIRNode types: TRANSFORM, EFFECT, VALIDATION, AGGREGATION, BRANCH, MERGE
- Capability requirements
- Resource requirements
- Artifacts
- Constraints
- Versioned schema (v1)

---

## Subsystem CIR Consumption Audit

### 1. Scheduler

**Location:** `runtime/scheduler/constitutional_scheduler.py`

**CIR Consumption:** **NO**

**Current Implementation:**
- Scheduler operates on ScheduledTask
- ScheduledTask contains workflow_id, task_name, constraints
- No direct CIR consumption
- No CIRNode reference

**Issue:** Scheduler does not consume CIR

**Impact:**
- Scheduler bypasses CIR
- Scheduler invents its own execution semantics
- Not aligned with constitutional source of truth

**Recommendation:** **ADAPTER**

**Action:**
- Create adapter to convert CIR to ScheduledTask
- Scheduler should consume CIR
- CIRNode → ScheduledTask conversion
- Scheduler operates on CIR-derived tasks

---

### 2. Verifier

**Location:** `runtime/verification/verifier.py`

**CIR Consumption:** **NO**

**Current Implementation:**
- Verifier operates on VerificationTask
- VerificationTask contains mission_id, executor_id, verification_type, target_artifact_id
- No direct CIR consumption
- No CIRNode reference

**Issue:** Verifier does not consume CIR

**Impact:**
- Verifier bypasses CIR
- Verifier invents its own verification semantics
- Not aligned with constitutional source of truth

**Recommendation:** **ADAPTER**

**Action:**
- Create adapter to convert CIR to VerificationTask
- Verifier should consume CIR
- CIRNode → VerificationTask conversion
- Verifier operates on CIR-derived verification tasks

---

### 3. Evidence Engine

**Location:** `runtime/evidence/evidence_compiler.py`

**CIR Consumption:** **NO**

**Current Implementation:**
- EvidenceCompiler operates on mission_id, mission_type, artifacts_produced, capabilities_used
- No direct CIR consumption
- No CIRNode reference

**Issue:** Evidence Engine does not consume CIR

**Impact:**
- Evidence Engine bypasses CIR
- Evidence Engine invents its own evidence semantics
- Not aligned with constitutional source of truth

**Recommendation:** **ADAPTER**

**Action:**
- Create adapter to convert CIR to EvidencePlan
- Evidence Engine should consume CIR
- CIRNode → EvidencePlan conversion
- Evidence Engine operates on CIR-derived evidence plans

---

### 4. Executor

**Location:** Not explicitly defined

**CIR Consumption:** **UNKNOWN**

**Current Implementation:**
- Executor not explicitly defined
- Cannot verify CIR consumption

**Issue:** Executor not defined

**Impact:**
- Cannot verify CIR consumption
- Executor may bypass CIR

**Recommendation:** **CREATE**

**Action:**
- Create explicit Executor class
- Executor must consume CIR
- CIRNode → execution conversion
- Executor operates on CIR-derived execution

---

### 5. State Machine

**Location:** `kernel/state_machine.py` (referenced)

**CIR Consumption:** **UNKNOWN**

**Current Implementation:**
- State Machine not reviewed
- Cannot verify CIR consumption

**Issue:** State Machine not reviewed

**Impact:**
- Cannot verify CIR consumption
- State Machine may bypass CIR

**Recommendation:** **AUDIT**

**Action:**
- Audit State Machine for CIR consumption
- State Machine should consume CIR
- CIRNode → state transition conversion

---

### 6. Security Manager

**Location:** Not explicitly reviewed

**CIR Consumption:** **UNKNOWN**

**Current Implementation:**
- Security Manager not reviewed
- Cannot verify CIR consumption

**Issue:** Security Manager not reviewed

**Impact:**
- Cannot verify CIR consumption
- Security Manager may bypass CIR

**Recommendation:** **AUDIT**

**Action:**
- Audit Security Manager for CIR consumption
- Security Manager should consume CIR
- CIRNode → security constraint conversion

---

### 7. Artifact Registry

**Location:** `runtime/artifacts/artifact_ontology.py`

**CIR Consumption:** **NO**

**Current Implementation:**
- ArtifactRegistry operates on ConstitutionalArtifact
- No direct CIR consumption
- No CIRNode reference

**Issue:** Artifact Registry does not consume CIR

**Impact:**
- Artifact Registry bypasses CIR
- Artifacts not linked to CIR nodes
- Not aligned with constitutional source of truth

**Recommendation:** **ADAPTER**

**Action:**
- Create adapter to link CIR to Artifacts
- Artifact Registry should consume CIR
- CIRNode → Artifact conversion
- Artifacts linked to CIR nodes

---

### 8. Capability Broker

**Location:** `runtime/security/semantic_capabilities.py`

**CIR Consumption:** **NO**

**Current Implementation:**
- SemanticCapabilityBroker operates on SemanticCapability
- No direct CIR consumption
- No CIRNode reference

**Issue:** Capability Broker does not consume CIR

**Impact:**
- Capability Broker bypasses CIR
- Capabilities not linked to CIR nodes
- Not aligned with constitutional source of truth

**Recommendation:** **ADAPTER**

**Action:**
- Create adapter to link CIR to Capabilities
- Capability Broker should consume CIR
- CIRNode → Capability conversion
- Capabilities linked to CIR nodes

---

## CIR Dependency Graph

### Current State (Fragmented)
```
Canonical IR
  ↓
Compiler Stages
  ↓
[Multiple independent subsystems]
  ├─ Scheduler (bypasses CIR)
  ├─ Verifier (bypasses CIR)
  ├─ Evidence Engine (bypasses CIR)
  ├─ Executor (not defined)
  ├─ State Machine (unknown)
  ├─ Security Manager (unknown)
  ├─ Artifact Registry (bypasses CIR)
  └─ Capability Broker (bypasses CIR)
```

### Target State (Unified)
```
Canonical IR
  ↓
Compiler Stages
  ↓
Execution Graph (internal)
  ↓
[All subsystems consume CIR]
  ├─ Scheduler (consumes CIR)
  ├─ Verifier (consumes CIR)
  ├─ Evidence Engine (consumes CIR)
  ├─ Executor (consumes CIR)
  ├─ State Machine (consumes CIR)
  ├─ Security Manager (consumes CIR)
  ├─ Artifact Registry (consumes CIR)
  └─ Capability Broker (consumes CIR)
```

---

## Issues Summary

### Critical Issues

1. **Scheduler bypasses CIR**
   - Scheduler operates on ScheduledTask, not CIR
   - Invent its own execution semantics
   - Not aligned with constitutional source of truth

2. **Verifier bypasses CIR**
   - Verifier operates on VerificationTask, not CIR
   - Invent its own verification semantics
   - Not aligned with constitutional source of truth

3. **Evidence Engine bypasses CIR**
   - Evidence Engine operates on mission metadata, not CIR
   - Invent its own evidence semantics
   - Not aligned with constitutional source of truth

4. **Executor not defined**
   - Cannot verify CIR consumption
   - May bypass CIR

### High Priority Issues

5. **Artifact Registry bypasses CIR**
   - Artifacts not linked to CIR nodes
   - Not aligned with constitutional source of truth

6. **Capability Broker bypasses CIR**
   - Capabilities not linked to CIR nodes
   - Not aligned with constitutional source of truth

### Medium Priority Issues

7. **State Machine CIR consumption unknown**
   - Cannot verify CIR consumption
   - May bypass CIR

8. **Security Manager CIR consumption unknown**
   - Cannot verify CIR consumption
   - May bypass CIR

---

## Recommendations

### Critical Actions

1. **Create CIR → ScheduledTask Adapter**
   - Convert CIR to ScheduledTask
   - Scheduler consumes CIR
   - Remove bypass

2. **Create CIR → VerificationTask Adapter**
   - Convert CIR to VerificationTask
   - Verifier consumes CIR
   - Remove bypass

3. **Create CIR → EvidencePlan Adapter**
   - Convert CIR to EvidencePlan
   - Evidence Engine consumes CIR
   - Remove bypass

4. **Create Executor with CIR Consumption**
   - Define Executor class
   - Executor consumes CIR
   - Enforce CIR consumption

### High Priority Actions

5. **Create CIR → Artifact Adapter**
   - Link CIR to Artifacts
   - Artifact Registry consumes CIR
   - Remove bypass

6. **Create CIR → Capability Adapter**
   - Link CIR to Capabilities
   - Capability Broker consumes CIR
   - Remove bypass

### Medium Priority Actions

7. **Audit State Machine for CIR Consumption**
   - Verify State Machine consumes CIR
   - Create adapter if needed

8. **Audit Security Manager for CIR Consumption**
   - Verify Security Manager consumes CIR
   - Create adapter if needed

---

## CIR Consumption Summary

| Subsystem | CIR Consumption | Status | Recommendation |
|-----------|-----------------|--------|----------------|
| Scheduler | NO | Bypasses CIR | Create adapter |
| Verifier | NO | Bypasses CIR | Create adapter |
| Evidence Engine | NO | Bypasses CIR | Create adapter |
| Executor | UNKNOWN | Not defined | Create with CIR |
| State Machine | UNKNOWN | Not reviewed | Audit |
| Security Manager | UNKNOWN | Not reviewed | Audit |
| Artifact Registry | NO | Bypasses CIR | Create adapter |
| Capability Broker | NO | Bypasses CIR | Create adapter |

---

## Conclusion

The Constitutional Runtime 2.1 has a critical issue: most downstream subsystems bypass Canonical IR. This violates the principle that CIR is the single source of truth for execution.

**Key Issues:**
- 6 subsystems bypass CIR
- 2 subsystems not reviewed
- 1 subsystem not defined

**Impact:**
- Subsystems invent their own execution semantics
- Not aligned with constitutional source of truth
- Hard to maintain consistency
- Architectural entropy increases

**Recommendations:**
1. Create adapters for all subsystems to consume CIR
2. Define Executor with CIR consumption
3. Audit remaining subsystems
4. Enforce CIR consumption as constitutional requirement

**Next Steps:**
1. Create CIR → ScheduledTask adapter
2. Create CIR → VerificationTask adapter
3. Create CIR → EvidencePlan adapter
4. Create Executor with CIR consumption
5. Create CIR → Artifact adapter
6. Create CIR → Capability adapter
7. Audit State Machine
8. Audit Security Manager
