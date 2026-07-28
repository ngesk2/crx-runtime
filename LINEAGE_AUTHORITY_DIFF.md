# LINEAGE AUTHORITY DIFF

**Audit Date:** 20260621
**Scope:** PING repository
**Task:** Determine whether lineage is written by ReplayStateMachine or by any competing system

---

## LINEAGE WRITERS IDENTIFIED

### Authoritative Writer

**runtime/replay/replay_state_machine.ts**

**Classification:** AUTHORITATIVE

**Evidence:**
- Implements `ReplayStateMachine` class
- Handles lineage during event application (artifact_commit, artifact_update)
- Enforces constitutional rules:
  - Lineage depth limits (MAX_LINEAGE_DEPTH)
  - Lineage namespace consistency (event IDs vs artifact IDs)
  - Duplicate parent detection
  - Cycle detection
- Stores lineage in artifact state: `artifact_lineage: [...normalizedLineage]`
- Constitutional comment: "Constitutional rule: lineage must use only event IDs or only artifact IDs"

**Status:** CORRECT

---

### Non-Writers (Validation Only)

**runtime/kernel/commit-service/src/api/commit_controller.ts**

**Classification:** NON-WRITER (Validation Only)

**Evidence:**
```typescript
// CONSTITUTIONAL RULE: Lineage is established by replay, not direct database writes
// Lineage will be derived from event stream during replay
await logEvent("artifact_commit", { artifactId, parentIds })
```

**Status:** CORRECT

**Reason:** Controller validates lineage structure but does NOT write lineage directly. Lineage is passed as event payload for replay to derive.

---

**runtime/kernel/commit-service/src/validation/dag_validator.ts**

**Classification:** NON-WRITER (Validation Only)

**Evidence:**
```typescript
export function validateLineage(parentIds: string[], childId: string): void {
  if (parentIds.includes(childId)) {
    throw new Error("Lineage cycle detected")
  }
  const unique = new Set(parentIds)
  if (unique.size !== parentIds.length) {
    throw new Error("Duplicate parents detected")
  }
}
```

**Status:** CORRECT

**Reason:** Validator checks for cycles and duplicate parents but does NOT write lineage. Validation is pre-replay, not lineage establishment.

---

### Persistence Layer

**runtime/kernel/commit-service/src/persistence/**

**Classification:** NO LINEAGE WRITERS

**Evidence:**
- No lineage-related code found in persistence layer
- No direct database writes for lineage
- Lineage is not persisted separately from events

**Status:** CORRECT

**Reason:** Persistence layer does not write lineage. Lineage is derived from event stream during replay.

---

## COMPETING SYSTEMS

**None identified**

**Evidence:**
- No other lineage writers found in PING repository
- No direct database lineage writes found
- No competing lineage establishment mechanisms

---

## CONSTITUTIONAL ASSESSMENT

**Lineage Authority:** ✅ CORRECT

**Answer:** Is ReplayStateMachine currently the sole lineage writer?

**YES**

**Proof:**

1. **ReplayStateMachine is the only lineage writer:**
   - `runtime/replay/replay_state_machine.ts` is the only code that writes `artifact_lineage`
   - Lineage is stored in artifact state during replay
   - Lineage is derived from event stream, not written directly

2. **Commit-service does NOT write lineage:**
   - `commit_controller.ts` explicitly states: "Lineage is established by replay, not direct database writes"
   - `commit_controller.ts` passes lineage as event payload, not as direct database write
   - Lineage will be derived from event stream during replay

3. **Validation layer does NOT write lineage:**
   - `dag_validator.ts` only validates lineage structure
   - No lineage writing in validation layer

4. **Persistence layer does NOT write lineage:**
   - No lineage writers in persistence layer
   - No direct database lineage writes

---

## CONSTITUTIONAL RULE COMPLIANCE

**Constitutional Rule:** "Lineage must survive all transformations. Only replay may establish lineage."

**Status:** ✅ COMPLIANT

**Evidence:**
- Lineage is established ONLY by ReplayStateMachine during event application
- Lineage is derived from event stream, not written directly
- No competing lineage writers exist
- Commit-service delegates lineage establishment to replay

---

## REQUIRED ACTIONS

### P0 (None)

- No competing lineage writers found
- No action required

### P1 (None)

- Lineage authority is correctly centralized in ReplayStateMachine
- No action required

---

## CONSTITUTIONAL DIFF

**Authorities Added:** 0
**Authorities Removed:** 0
**Delegation Increased:** NO CHANGE
**Sovereignty Score:** NO CHANGE (already correct)
