# Constitutional Runtime 2.1 - Runtime Boundary Report

## Overview

This report verifies runtime subsystem boundaries. Each subsystem must have a single responsibility and must not cross-execution.

**Principles:**
- Executor never replans
- Planner never executes
- Verifier never executes
- Scheduler never plans
- Oracle never executes candidate code

---

## Runtime Subsystem Boundary Audit

### 1. Planner

**Location:** Not explicitly defined (implicit in PlanningIR generation)

**Responsibility:** Generate PlanningIR from objectives

**Boundary Violations:**
- **Planner executes:** UNKNOWN - Planner not explicitly defined
- **Planner replans:** UNKNOWN - Planner not explicitly defined

**Issues:**
- Planner not explicitly defined as subsystem
- Cannot verify boundary violations
- Constitutional Law 0 (Planning never executes) cannot be enforced

**Recommendation:** **CREATE**

**Action:**
- Create explicit Planner class
- Enforce Constitutional Law 0
- Planner only generates PlanningIR
- Planner never executes
- Planner never replans

---

### 2. Scheduler

**Location:** `runtime/scheduler/constitutional_scheduler.py`

**Responsibility:** Decide execution order, priority, deadlines, preemption

**Boundary Violations:**
- **Scheduler plans:** NONE - Scheduler only schedules execution
- **Scheduler executes:** NONE - Scheduler only decides when to execute

**Issues:** None

**Recommendation:** **KEEP**

**Analysis:**
- Scheduler only schedules execution (when to execute)
- Scheduler does not plan (what to execute)
- Scheduler does not execute (how to execute)
- Clear separation of concerns

**Constitutional Law Compliance:**
- Law 0 (Planning never executes): N/A - Scheduler does not plan
- Law 1 (Execution never replans): N/A - Scheduler does not execute

---

### 3. Executor

**Location:** Not explicitly defined

**Responsibility:** Execute nodes from execution graph

**Boundary Violations:**
- **Executor replans:** UNKNOWN - Executor not defined
- **Executor plans:** UNKNOWN - Executor not defined

**Issues:**
- Executor not explicitly defined as subsystem
- Cannot verify boundary violations
- Constitutional Law 1 (Execution never replans) cannot be enforced

**Recommendation:** **CREATE**

**Action:**
- Create explicit Executor class
- Enforce Constitutional Law 1
- Executor only executes nodes
- Executor never replans
- Executor never plans

---

### 4. Verifier

**Location:** `runtime/verification/verifier.py`

**Responsibility:** Independent verification of executor output

**Boundary Violations:**
- **Verifier executes:** NONE - Verifier only verifies
- **Verifier trusts executor:** NONE - Verifier is independent

**Issues:** None

**Recommendation:** **KEEP**

**Analysis:**
- Verifier only verifies executor output
- Verifier does not execute
- Verifier does not trust executor
- Clear separation of concerns

**Constitutional Law Compliance:**
- Law 0 (Planning never executes): N/A - Verifier does not plan
- Law 1 (Execution never replans): N/A - Verifier does not execute

---

### 5. Oracle

**Location:** Not explicitly defined

**Responsibility:** Review and approve candidate code

**Boundary Violations:**
- **Oracle executes:** UNKNOWN - Oracle not defined
- **Oracle trusts verifier:** UNKNOWN - Oracle not defined

**Issues:**
- Oracle not explicitly defined as subsystem
- Cannot verify boundary violations
- Constitutional Law 6 (Oracle never executes candidate code) cannot be enforced

**Recommendation:** **CREATE**

**Action:**
- Create explicit Oracle class
- Enforce Constitutional Law 6
- Oracle only reviews candidate code
- Oracle never executes candidate code
- Oracle does not trust verifier

---

### 6. Evidence Engine

**Location:** `runtime/evidence/evidence_compiler.py`

**Responsibility:** Generate evidence collection plans

**Boundary Violations:**
- **Evidence Engine executes:** NONE - Evidence Engine only generates plans
- **Evidence Engine collects evidence:** PARTIAL - EvidenceExecutor executes requirements

**Issues:**
- EvidenceExecutor executes evidence requirements
- This is execution, not planning
- Should be separate subsystem

**Recommendation:** **SEPARATE**

**Action:**
- Keep EvidenceCompiler (generates plans)
- Move EvidenceExecutor to separate subsystem
- EvidenceExecutor should be part of execution layer
- Clear separation between planning and execution

---

### 7. Capability Broker

**Location:** `runtime/security/semantic_capabilities.py`

**Responsibility:** Grant and revoke capabilities

**Boundary Violations:**
- **Capability Broker executes:** NONE - Capability Broker only grants capabilities
- **Capability Broker plans:** NONE - Capability Broker only authorizes

**Issues:** None

**Recommendation:** **KEEP**

**Analysis:**
- Capability Broker only grants capabilities
- Capability Broker does not execute
- Capability Broker does not plan
- Clear separation of concerns

**Constitutional Law Compliance:**
- Law 0 (Planning never executes): N/A - Capability Broker does not plan
- Law 1 (Execution never replans): N/A - Capability Broker does not execute
- Law 2 (No subsystem grants itself authority): NEEDS AUDIT - Verify self-grant prevention
- Law 3 (Capabilities always expire): PARTIAL - Expiration checked but not enforced

---

### 8. Artifact Registry

**Location:** `runtime/artifacts/artifact_ontology.py`

**Responsibility:** Register and verify artifacts

**Boundary Violations:**
- **Artifact Registry executes:** NONE - Artifact Registry only manages artifacts
- **Artifact Registry plans:** NONE - Artifact Registry only stores artifacts

**Issues:** None

**Recommendation:** **KEEP**

**Analysis:**
- Artifact Registry only manages artifacts
- Artifact Registry does not execute
- Artifact Registry does not plan
- Clear separation of concerns

**Constitutional Law Compliance:**
- Law 4 (Artifacts are immutable): ENFORCED - Artifacts are immutable
- Law 0 (Planning never executes): N/A - Artifact Registry does not plan
- Law 1 (Execution never replans): N/A - Artifact Registry does not execute

---

## Boundary Violations Summary

### Critical Violations

1. **Planner not defined**
   - Cannot enforce Constitutional Law 0
   - Cannot verify boundary violations

2. **Executor not defined**
   - Cannot enforce Constitutional Law 1
   - Cannot verify boundary violations

3. **Oracle not defined**
   - Cannot enforce Constitutional Law 6
   - Cannot verify boundary violations

### Medium Priority Issues

4. **EvidenceExecutor executes evidence requirements**
   - EvidenceExecutor should be separate subsystem
   - Should be part of execution layer

5. **Capability Broker self-grant prevention not verified**
   - Need to audit for Law 2 compliance

6. **Capability Broker expiration not enforced**
   - Need to audit for Law 3 compliance

---

## Constitutional Law Compliance

### Law 0: Planning never executes

**Status:** ⏳ CANNOT VERIFY

**Reason:** Planner not explicitly defined

**Recommendation:** Create explicit Planner class

---

### Law 1: Execution never replans

**Status:** ⏳ CANNOT VERIFY

**Reason:** Executor not explicitly defined

**Recommendation:** Create explicit Executor class

---

### Law 2: No subsystem grants itself authority

**Status:** ⏳ NEEDS AUDIT

**Reason:** Capability Broker not audited for self-grant prevention

**Recommendation:** Audit Capability Broker for self-grant prevention

---

### Law 3: Capabilities always expire

**Status:** ⚠️ PARTIAL

**Reason:** Expiration checked but not enforced

**Recommendation:** Enforce capability expiration

---

### Law 4: Artifacts are immutable

**Status:** ✅ ENFORCED

**Reason:** Artifacts are immutable by design

**Recommendation:** Keep

---

### Law 5: Events are append-only

**Status:** ⏳ NOT REVIEWED

**Reason:** Event store not reviewed

**Recommendation:** Audit event store for append-only enforcement

---

### Law 6: Oracle never executes candidate code

**Status:** ⏳ CANNOT VERIFY

**Reason:** Oracle not explicitly defined

**Recommendation:** Create explicit Oracle class

---

### Law 7: Planner cannot observe secrets unless granted capability

**Status:** ⏳ CANNOT VERIFY

**Reason:** Planner not explicitly defined

**Recommendation:** Create explicit Planner class

---

### Law 8: Every external side effect must have evidence

**Status:** ⏳ NOT REVIEWED

**Reason:** Evidence collection not reviewed

**Recommendation:** Audit evidence collection for side effect tracking

---

### Law 9: Every action must be replayable

**Status:** ⏳ NOT REVIEWED

**Reason:** Replay mechanism not reviewed

**Recommendation:** Audit replay mechanism

---

### Law 10: Rollback always exists

**Status:** ⏳ NOT REVIEWED

**Reason:** Rollback mechanism not reviewed

**Recommendation:** Audit rollback mechanism

---

## Recommendations

### Critical Actions

1. **Create explicit Planner class**
   - Enforce Constitutional Law 0
   - Planner only generates PlanningIR
   - Planner never executes
   - Planner never replans

2. **Create explicit Executor class**
   - Enforce Constitutional Law 1
   - Executor only executes nodes
   - Executor never replans
   - Executor never plans

3. **Create explicit Oracle class**
   - Enforce Constitutional Law 6
   - Oracle only reviews candidate code
   - Oracle never executes candidate code
   - Oracle does not trust verifier

### High Priority Actions

4. **Separate EvidenceExecutor from EvidenceCompiler**
   - EvidenceCompiler generates plans (planning layer)
   - EvidenceExecutor executes requirements (execution layer)
   - Clear separation of concerns

5. **Audit Capability Broker for self-grant prevention**
   - Verify Law 2 compliance
   - Ensure no subsystem grants itself authority

6. **Enforce capability expiration**
   - Verify Law 3 compliance
   - Ensure capabilities always expire

### Medium Priority Actions

7. **Audit event store for append-only enforcement**
   - Verify Law 5 compliance
   - Ensure events are append-only

8. **Audit evidence collection for side effect tracking**
   - Verify Law 8 compliance
   - Ensure external side effects have evidence

9. **Audit replay mechanism**
   - Verify Law 9 compliance
   - Ensure every action is replayable

10. **Audit rollback mechanism**
    - Verify Law 10 compliance
    - Ensure rollback always exists

---

## Boundary Summary

| Subsystem | Status | Boundary Violations | Recommendation |
|----------|--------|---------------------|----------------|
| Planner | NOT DEFINED | Cannot verify | Create |
| Scheduler | ✅ OK | None | Keep |
| Executor | NOT DEFINED | Cannot verify | Create |
| Verifier | ✅ OK | None | Keep |
| Oracle | NOT DEFINED | Cannot verify | Create |
| Evidence Engine | ⚠️ PARTIAL | EvidenceExecutor executes | Separate |
| Capability Broker | ⚠️ PARTIAL | Self-grant, expiration | Audit |
| Artifact Registry | ✅ OK | None | Keep |

---

## Conclusion

The runtime has clear boundary separation for defined subsystems (Scheduler, Verifier, Artifact Registry) but lacks explicit definition for critical subsystems (Planner, Executor, Oracle).

**Key Issues:**
- 3 critical subsystems not defined (Planner, Executor, Oracle)
- 1 subsystem has boundary leakage (Evidence Engine)
- 1 subsystem needs audit (Capability Broker)
- 5 laws not reviewed (Laws 5, 7, 8, 9, 10)

**Impact:**
- Cannot enforce Constitutional Laws 0, 1, 6
- Cannot verify boundary violations
- Hard to maintain separation of concerns
- Architectural entropy increases

**Recommendations:**
1. Create explicit Planner class
2. Create explicit Executor class
3. Create explicit Oracle class
4. Separate EvidenceExecutor from EvidenceCompiler
5. Audit Capability Broker
6. Audit remaining Constitutional Laws

**Next Steps:**
1. Create Planner with Law 0 enforcement
2. Create Executor with Law 1 enforcement
3. Create Oracle with Law 6 enforcement
4. Separate EvidenceExecutor
5. Audit Capability Broker
6. Audit event store, evidence collection, replay, rollback
