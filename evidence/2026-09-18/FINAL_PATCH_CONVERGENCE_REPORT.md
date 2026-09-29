# VERIFIABLE PATCH CONVERGENCE — FINAL REPORT

## MODE
READ-ONLY SPECIFICATION / ADVERSARIAL CERTIFICATION
DO NOT IMPLEMENT

## EXECUTION READY STATUS
COUNT: 0 patches marked EXECUTION_READY

## BLOCKING QUESTIONS

### 1. ROUTING VERSION
**STATUS:** MISSING IMPLEMENTATION
**WHY BLOCKING:** All event→mission reconciliation families require routing version to prevent reinterpreting old events through today's policy
**FALSIFICATION TEST:** Change EVENT_MISSION_MAP, replay historical events, verify no new mission created for old event
**OPEN QUESTIONS:**
- Should routing version be captured in ping_events metadata or separate table?
- Should routing version be part of mission obligation or consumer policy?
- What is the default historical behavior for unmapped events?

### 2. EFFECT IDENTITY PREIMAGE
**STATUS:** NEEDS DESIGN DECISION
**WHY BLOCKING:** EffectAuthority exists but effect_id preimage may not include namespace/mission/attempt
**FALSIFICATION TEST:** Call createEffect twice with same mission/capability, verify same effect_id
**OPEN QUESTIONS:**
- Should effect_id include namespace?
- Should effect_id include mission_id?
- Should effect_id include attempt?
- Is 64-bit collision risk acceptable?

### 3. CONTEXT COMPILER
**STATUS:** NEEDS DESIGN DECISION
**WHY BLOCKING:** ContextCompiler exists but lacks namespace/completeness/source_version in ID preimage
**FALSIFICATION TEST:** Compile ContextPacks for same mission_id/query in different namespaces, verify different context_pack_id
**OPEN QUESTIONS:**
- Should ContextPack include namespace in ID preimage?
- Should ContextPack include completeness field?
- Should ContextPack include source_version?
- Should ContextPack include invalidation_version?

### 4. MISSION COMPLETION
**STATUS:** NEEDS STATE MACHINE DEFINITION
**WHY BLOCKING:** Cannot determine correct completion semantics without defining state transitions
**OPEN QUESTIONS:**
- What are the exact state transitions (WORKER RETURNED → RESULT PERSISTED → RESULT VERIFIED → EFFECT DISPATCHED → EFFECT CONFIRMED → MISSION OUTCOME VERIFIED → MISSION COMPLETED)?
- Which transition owns mission completion?
- Can this be solved without Attempt/ResultEnvelope?

### 5. WORKORDER/ATTEMPT/RESULT
**STATUS:** HARVEST DECISION REQUIRED
**WHY BLOCKING:** Substantial implementation exists in codex branch but decision needed on harvest vs new implementation
**OPEN QUESTIONS:**
- Should WorkOrder from codex branch be harvested as-is?
- Should attempt be separate WorkOrder field or separate table?
- Should ResultEnvelope be codex branch or new implementation?

## PATCH FAMILY CONVERGENCE: EVENT→MISSION

### FAMILY A: RECONCILIATION FROM ping_events
STATUS: BLOCKED BY ROUTING VERSION
AUTHORITY CLEAN: YES
CRASH SAFE: PARTIAL
RESTART SAFE: YES
CONCURRENCY SAFE: YES
HISTORY SAFE: NO (routing version missing)
REUSES EXISTING MECHANISM: YES
NEW DURABLE STATE: None
OPERATIONAL COMPLEXITY: Low
FAILURE MODES: None on read-only scan
ROLLBACK: Revert scan

### FAMILY B: DURABLE PER-EVENT CONSUMPTION
STATUS: BLOCKED BY CONCURRENCY UNCERTAINTY
AUTHORITY CLEAN: YES
CRASH SAFE: YES
RESTART SAFE: YES
CONCURRENCY SAFE: UNCERTAIN
HISTORY SAFE: YES
REUSES EXISTING MECHANISM: NO
NEW DURABLE STATE: event_consumers table
OPERATIONAL COMPLEXITY: Medium
FAILURE MODES: Cursor corruption, out-of-order processing
ROLLBACK: Delete table

### FAMILY C: TRANSACTIONAL OUTBOX / DELIVERY OBLIGATION
STATUS: BLOCKED BY AUTHORITY BORDERLINE
AUTHORITY CLEAN: BORDERLINE (UER becomes aware of mission routing)
CRASH SAFE: YES
RESTART SAFE: YES
CONCURRENCY SAFE: YES
HISTORY SAFE: YES
REUSES EXISTING MECHANISM: NO
NEW DURABLE STATE: event_delivery_obligations table
OPERATIONAL COMPLEXITY: Medium
FAILURE MODES: Orphaned obligations, duplicate emission
ROLLBACK: Delete table

### FAMILY D: STARTUP RECONCILIATION
STATUS: BLOCKED BY ROUTING VERSION
AUTHORITY CLEAN: YES
CRASH SAFE: YES
RESTART SAFE: YES
CONCURRENCY SAFE: YES
HISTORY SAFE: NO (routing version missing)
REUSES EXISTING MECHANISM: YES
NEW DURABLE STATE: None
OPERATIONAL COMPLEXITY: Low
FAILURE MODES: None on read-only scan
ROLLBACK: Revert scan

### FAMILY E: CALLBACK + RECONCILIATION HYBRID
STATUS: BLOCKED BY ROUTING VERSION
AUTHORITY CLEAN: YES
CRASH SAFE: PARTIAL
RESTART SAFE: YES
CONCURRENCY SAFE: YES
HISTORY SAFE: NO (routing version missing)
REUSES EXISTING MECHANISM: YES
NEW DURABLE STATE: None
OPERATIONAL COMPLEXITY: Medium
FAILURE MODES: Handler crash requires reconciliation
ROLLBACK: Remove reconciliation

## DORMANT MECHANISMS TO HARVEST

### 1. WORKORDER (codex branch)
FILES: ping-runtime/external-agent/external_agent_adapter.js
IMPLEMENTATION: SUBSTANTIAL
STATUS: HARVEST_CANDIDATE
OPEN QUESTIONS: Harvest as-is vs adapt vs new implementation

### 2. RESULT ENVELOPE (codex branch)
FILES: ping-runtime/external-agent/external_agent_adapter.js
IMPLEMENTATION: SUBSTANTIAL
STATUS: HARVEST_CANDIDATE
OPEN QUESTIONS: Harvest as-is vs adapt vs new implementation

### 3. EFFECT AUTHORITY
FILES: ping-runtime/approval/effect_authority.js
IMPLEMENTATION: SUBSTANTIAL
STATUS: REVIVAL CANDIDATE
OPEN QUESTIONS: IDENTITY PREIMAGE, STORAGE ADAPTER WIRING

### 4. CONTEXT COMPILER
FILES: ping-runtime/context/context_compiler.js, context_integration.js
IMPLEMENTATION: SUBSTANTIAL
STATUS: REVIVAL CANDIDATE
OPEN QUESTIONS: NAMESPACE, COMPLETENESS, SOURCE_VERSION

### 5. LINEAGE AUTHORITY
FILES: runtime/kernel/authorities/lineage_authority.js, gateway/lineage_authority.js
IMPLEMENTATION: COMPLETE (pure function)
STATUS: REVIVAL CANDIDATE
OPEN QUESTIONS: Wiring only

### 6. APPROVAL AUTHORITY
FILES: gateway/approval_authority.js
IMPLEMENTATION: COMPLETE
STATUS: REVIVAL CANDIDATE
OPEN QUESTIONS: Wiring only

### 7. CAPABILITY AUTHORITY (TS RUNTIME KERNEL)
FILES: runtime/kernel/capabilities/capability-authority.ts, capability-registry.ts, capability-resolver.ts
IMPLEMENTATION: COMPLETE
STATUS: CONVERGENCE CANDIDATE
OPEN QUESTIONS: JS/TS interop vs port to JS

## PATCH DEPENDENCY GRAPH (DRAFT)

EVENT COLLISION LAW
    ↓
EFFECT_ID PREIMAGE (namespace inclusion decision)
    ↓
ROUTING VERSION (capture at event acceptance)
    ↓
DETERMINISTIC MISSION ID (already proven)
    ↓
DURABLE EVENT→MISSION HANDOFF (family selected after routing version)
    ↓
ATTEMPT IDENTITY (new implementation)
    ↓
WORKORDER (harvest vs new decision)
    ↓
RESULT ENVELOPE (harvest vs new decision)
    ↓
EFFECT IDENTITY (wire existing EffectAuthority)
    ↓
MISSION COMPLETION SEMANTICS (state machine definition)

INDEPENDENT LANES:
CONTEXT COMPILER (wire existing)
APPROVAL AUTHORITY (wire existing)
LINEAGE AUTHORITY (wire existing)

## FALSIFICATION QUEUE

### RECONCILIATION FAMILIES (A, D, E)
TEST: Change EVENT_MISSION_MAP, replay historical events
EXPECTED: Events from 6 months ago create missions they never required under original policy

### EFFECT AUTHORITY
TEST: Call createEffect twice with same mission/capability
EXPECTED: Two identical operations on same mission create different effect_ids (if preimage incomplete)

### CONTEXT COMPILER
TEST: Compile ContextPacks for same mission_id/query in different namespaces
EXPECTED: ctx_<16hex> collisions between tenant::A and tenant::B with same mission_id/query

### WORKORDER (codex branch)
TEST: Create result with different context_pack_id
EXPECTED: Verification rejects (prevents context substitution attack)

## NEXT STEPS

1. Resolve ROUTING VERSION design question
2. Resolve EFFECT IDENTITY preimage design question
3. Resolve CONTEXT COMPILER enhancement question
4. Define MISSION COMPLETION state machine
5. Decide WORKORDER/ATTEMPT/RESULT harvest vs new implementation
6. Re-evaluate event→mission patch families after routing version resolved
7. Mark EXECUTION_READY patches when all questions resolved
8. Generate patch handoff cards

## DO NOT IMPLEMENT YET

ZERO patches are marked EXECUTION_READY.

Continue zooming until all blocking questions are resolved.

PLANE: SOURCE_CURRENT @ feature/approval-effect-identity
