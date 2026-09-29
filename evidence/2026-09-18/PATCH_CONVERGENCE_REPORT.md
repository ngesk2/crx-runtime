# VERIFIABLE PATCH CONVERGENCE REPORT

## MODE
READ-ONLY SPECIFICATION / ADVERSARIAL CERTIFICATION
DO NOT IMPLEMENT

## CRITICAL FINDINGS

### WORKORDER/ATTEMPT/RESULT DISCOVERY
FOUND IN BRANCH: codex/context-workorder-convergence (worktree ping-codex-convergence)
FILE: ping-runtime/external-agent/external_agent_adapter.js

**WorkOrder Implementation EXISTS:**
- work_order_id: deterministic (SHA-256(taskId))
- agent_id, mission_id, task_id, correlation_id, context_pack_id
- capability, namespace, constraints
- attempt (positive integer)
- deadline (ISO timestamp)
- result_path
- authorizeWorkOrder() fail-closed decision
- verifyResultEnvelope() validation
- resultIdentity() deterministic result binding
- recordVerifiedResult() emits WORKER_COMPLETED/WORKER_FAILED

**ResultEnvelope Implementation EXISTS:**
- work_order_id, context_pack_id, agent_id, capability
- status (completed/failed)
- output, evidence, error
- verifyResultEnvelope() validates against RESULT_SCHEMA.json
- resultIdentity() binds to work_order identity

**CURRENT BASELINE STATUS:**
- WorkOrder EXISTS in codex branch (STRONGER_BRANCH / HARVEST_CANDIDATE)
- WorkOrder PHANTOM in current feature/approval-effect-identity baseline
- This is a substantial implementation, not a blank-slate problem

### ROUTING VERSION FINDING
SEARCH RESULT: ZERO MATCHES for routing_version/routingVersion in current source
FINDING: Current EVENT_MISSION_MAP has NO versioning
CONSEQUENCE: Reconciliation from ping_events would reinterpret old events through today's policy
STATUS: ROUTING_VERSION is MISSING, not dormant

### EFFECT AUTHORITY DETAILED INSPECTION
FILE: ping-runtime/approval/effect_authority.js

**Effect ID Preimage:**
- event_type (capability.toUpperCase())
- aggregate_id (target_identity)
- action_type (capability.split('.')[1] || 'execute')
- Hash: CanonicalAuthority.hash(identity)
- Display: effect_<16hex> (64 bits)

**Namespace Binding:**
- target_identity carries customer/project ID
- No explicit namespace field in effect_id preimage
- RISK: cross-namespace collision possible

**Mission Binding:**
- mission_id field present in effect record
- NOT part of effect_id preimage
- Same mission + same effect type could create multiple effects with different IDs

**Attempt Binding:**
- attempt field present in effect record
- NOT part of effect_id preimage
- Same effect retried increments attempt but preserves effect_id
- GOOD: attempt separation exists

**Provider Idempotency Key:**
- provider_request_id field present
- Stored after markExecuting()
- Good: can support provider-level idempotency

**UNKNOWN_OUTCOME Semantics:**
- Status values: PROPOSED, PENDING_HUMAN, AUTHORIZED, EXECUTING, SUCCEEDED, FAILED, REJECTED, EXPIRED
- EXECUTING state can represent UNKNOWN_OUTCOME
- GOOD: state machine supports UNKNOWN_OUTCOME

**Crash Semantics (NOT YET PROVEN):**
- Crash before provider: effect never marked EXECUTING
- Crash after provider/before local persistence: provider_request_id may be lost
- Crash after local persistence: effect_id persists, can reconcile

**OPEN QUESTIONS:**
1. Should effect_id include namespace?
2. Should effect_id include mission_id to prevent multiple effects per mission?
3. Should effect_id include attempt to detect same-effect-different-attempt?
4. Is 64-bit collision risk acceptable for effects?

### CONTEXT COMPILER DETAILED INSPECTION
FILE: ping-runtime/context/context_compiler.js

**ContextPack Schema:**
- context_pack_id: ctx_<16hex> (SHA-256 of mission_id + query + correlationId + retrieval_hash)
- mission_id, query
- canonical_object_refs (customer/project/lead IDs)
- artifact_refs
- evidence_refs (provenance)
- relationship_refs (customer/project links)
- source_metadata (lineage, authority)
- retrieval_manifest (hash of retrieval inputs)
- compiled_at

**INPUT AUTHORITY:**
- Uses _eventRuntime.getCorrelationGroup()
- Pulls events from canonical event authority
- GOOD: derives from authoritative source

**SOURCE VERSIONING:**
- source_metadata includes sources and authorities
- No explicit source version field
- MISSING: staleness detection, invalidation signal

**NAMESPACE:**
- correlation_id passed through
- No explicit namespace in ContextPack ID preimage
- RISK: cross-namespace collision possible

**COMPLETENESS:**
- No completeness field in current ContextPack schema
- MISSING: does not distinguish complete vs incomplete input sets

**WORKORDER BINDING:**
- ContextIntegration expects ExternalAgentAdapter
- ContextIntegration.issueWorkOrderWithContext() exists
- GOOD: integration layer exists

**OPEN QUESTIONS:**
1. Should ContextPack include namespace in ID preimage?
2. Should ContextPack include completeness field?
3. Should ContextPack include source_version for staleness detection?
4. Should ContextPack include invalidation_version for recompilation triggers?

### PATCH FAMILY CONVERGENCE: EVENT→MISSION

#### FAMILY A: RECONCILIATION FROM ping_events
AUTHORITY CLEAN: YES (MissionRuntime owns mission creation)
CRASH SAFE: PARTIAL (depends on routing version resolution)
RESTART SAFE: YES (idempotent ON CONFLICT DO NOTHING)
CONCURRENCY SAFE: YES (idempotent mission creation)
HISTORY SAFE: NO (routing version missing - old events reinterpreted)
REUSES EXISTING MECHANISM: YES (MissionRuntime idempotency)
NEW DURABLE STATE: None (startup-only scan)
OPERATIONAL COMPLEXITY: Low (startup scan)
FAILURE MODES: None on read-only scan
ROLLBACK: Revert scan

**ELIMINATION REASON:** HISTORY UNSAFE without routing version. Cannot mark EXECUTION_READY.

#### FAMILY B: DURABLE PER-EVENT CONSUMPTION
AUTHORITY CLEAN: YES (consumer cursor owned by EventToMissionBridge)
CRASH SAFE: YES (cursor advancement after mission creation)
RESTART SAFE: YES (resume from cursor)
CONCURRENCY SAFE: UNCERTAIN (multiple bridge instances need coordination)
HISTORY SAFE: YES (cursor captured at event acceptance time)
REUSES EXISTING MECHANISM: NO (new event_consumers table)
NEW DURABLE STATE: event_consumers table
OPERATIONAL COMPLEXITY: Medium (cursor management)
FAILURE MODES: Cursor corruption, out-of-order processing
ROLLBACK: Delete table

**ELIMINATION REASON:** CONCURRENCY UNCERTAIN. Requires additional investigation.

#### FAMILY C: TRANSACTIONAL OUTBOX / DELIVERY OBLIGATION
AUTHORITY CLEAN: YES (UER emits event + obligation in same transaction)
CRASH SAFE: YES (atomic write)
RESTART SAFE: YES (dispatcher replays pending obligations)
CONCURRENCY SAFE: YES (idempotent obligation fulfillment)
HISTORY SAFE: YES (obligation created at event acceptance time)
REUSES EXISTING MECHANISM: NO (new event_delivery_obligations table)
NEW DURABLE STATE: event_delivery_obligations table
OPERATIONAL COMPLEXITY: Medium (dispatcher coordination)
FAILURE MODES: Orphaned obligations, duplicate emission
ROLLBACK: Delete table

**ELIMINATION REASON:** AUTHORITY BORDERLINE (UER becomes aware of mission routing). Requires UER extension investigation.

#### FAMILY D: STARTUP RECONCILIATION
AUTHORITY CLEAN: YES (MissionRuntime owns mission creation)
CRASH SAFE: YES (idempotent mission creation)
RESTART SAFE: YES (idempotent mission creation)
CONCURRENCY SAFE: YES (idempotent mission creation)
HISTORY SAFE: NO (routing version missing - old events reinterpreted)
REUSES EXISTING MECHANISM: YES (MissionRuntime idempotency)
NEW DURABLE STATE: None (startup-only scan)
OPERATIONAL COMPLEXITY: Low (startup scan)
FAILURE MODES: None on read-only scan
ROLLBACK: Revert scan

**ELIMINATION REASON:** HISTORY UNSAFE without routing version. Cannot mark EXECUTION_READY.

#### FAMILY E: CALLBACK + RECONCILIATION HYBRID
AUTHORITY CLEAN: YES (MissionRuntime owns mission creation)
CRASH SAFE: PARTIAL (handler crash loses event, reconciliation recovers)
RESTART SAFE: YES (reconciliation recovers)
CONCURRENCY SAFE: YES (idempotent mission creation)
HISTORY SAFE: NO (routing version missing - old events reinterpreted)
REUSES EXISTING MECHANISM: YES (MissionRuntime idempotency)
NEW DURABLE STATE: None (startup-only scan)
OPERATIONAL COMPLEXITY: Medium (callback + scan)
FAILURE MODES: Handler crash requires reconciliation
ROLLBACK: Remove reconciliation

**ELIMINATION REASON:** HISTORY UNSAFE without routing version. Cannot mark EXECUTION_READY.

### PATCH DEPENDENCY GRAPH (DRAFT)

EVENT COLLISION LAW
    ↓
EFFECT_ID PREIMAGE (namespace inclusion)
    ↓
ROUTING VERSION (capture at event acceptance)
    ↓
DETERMINISTIC MISSION ID (already proven)
    ↓
DURABLE EVENT→MISSION HANDOFF (family selected after routing version)
    ↓
ATTEMPT IDENTITY (new implementation)
    ↓
WORKORDER (harvest from codex branch)
    ↓
RESULT ENVELOPE (harvest from codex branch)
    ↓
EFFECT IDENTITY (wire existing EffectAuthority)
    ↓
MISSION COMPLETION SEMANTICS (state machine)

INDEPENDENT:
CONTEXT COMPILER (wire existing)
APPROVAL AUTHORITY (wire existing)
LINEAGE AUTHORITY (wire existing)

### FALSIFICATION QUEUE

#### RECONCILIATION FAMILIES (A, D, E)
MOST LIKELY WRONG: Change EVENT_MISSION_MAP, replay historical events
EXPECTED: Events from 6 months ago create missions they never required under original policy
FALSIFICATION TEST: Add event to map, run reconciliation, verify no new mission created for old event

#### EFFECT AUTHORITY
MOST LIKELY WRONG: Same mission + same effect type = different effect_id (collision risk)
EXPECTED: Two identical operations on same mission create different effect_ids due to preimage omission
FALSIFICATION TEST: Call createEffect twice with same mission/capability, verify same effect_id

#### CONTEXT COMPILER
MOST LIKELY WRONG: Namespace collision across tenants
EXPECTED: ctx_<16hex> collisions between tenant::A and tenant::B with same mission_id/query
FALSIFICATION TEST: Compile ContextPacks for same mission_id/query in different namespaces, verify different context_pack_id

#### WORKORDER (codex branch)
MOST LIKELY WRONG: ContextPack substitution attack
EXPECTED: Result with different context_pack_id passes verification (substituted context)
FALSIFICATION TEST: Create result with different context_pack_id, verify verification rejects

### OPEN QUESTIONS SUMMARY

**ROUTING VERSION:**
- Should routing version be captured in ping_events metadata or separate table?
- Should routing version be part of mission obligation or consumer policy?
- What is the default historical behavior for unmapped events?

**EFFECT IDENTITY:**
- Should effect_id include namespace?
- Should effect_id include mission_id?
- Should effect_id include attempt?
- Is 64-bit collision risk acceptable?

**CONTEXT COMPILER:**
- Should ContextPack include namespace in ID preimage?
- Should ContextPack include completeness field?
- Should ContextPack include source_version?
- Should ContextPack include invalidation_version?

**MISSION COMPLETION:**
- What are the exact state transitions?
- Which transition owns completion?
- Can this be solved without Attempt/ResultEnvelope?

**WORKORDER/ATTEMPT/RESULT:**
- Should WorkOrder from codex branch be harvested as-is?
- Should attempt be separate WorkOrder field or separate table?
- Should ResultEnvelope be codex branch or new implementation?

NO PATCH CAN BE MARKED EXECUTION_READY UNTIL THESE QUESTIONS ARE RESOLVED.

PLANE: SOURCE_CURRENT @ feature/approval-effect-identity
