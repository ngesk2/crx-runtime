# LINEAGE AUTHORITY LEDGER 2026-09-16

**STATUS:** CLASSIFIED
**DATE:** 2026-09-16
**PHASE:** D - LINEAGE AUTHORITY

---

## EVIDENCE

### Lineage Authority Candidates

#### 1. LineageWorker (JavaScript)
- **File:** /home/nolan/ping/ping-runtime/workers/canonical_workers.js
- **Status:** ACTIVE LINEAGE WORKER
- **Evidence:**
  - [STAT] Handles LINEAGE_CREATE and WITNESS_CREATED events
  - [STAT] Builds causation chain from event.metadata.causation_id
  - [STAT] Emits LINEAGE_CREATED events
  - [EMPR] Registered with WorkerRuntime in registerCanonicalWorkers()
  - [EMPR] eventTypes: ['LINEAGE_CREATE', 'WITNESS_CREATED']
  - [INFR] Active in canonical worker chain

#### 2. correlation_id (Event Metadata)
- **File:** /home/nolan/ping/ping-runtime/events/unified_event_runtime.js
- **Status:** EVENT-DRIVEN LINEAGE
- **Evidence:**
  - [STAT] UnifiedEventRuntime sets correlation_id to eventId when not provided
  - [STAT] BaseWorker._emit() preserves correlation_id from triggering event
  - [STAT] All events from one observation share correlation_id
  - [EMPR] Used by MissionRuntime.getTrace() for correlation groups

#### 3. causation_id (Event Metadata)
- **File:** /home/nolan/ping/ping-runtime/events/unified_event_runtime.js
- **Status:** EVENT-DRIVEN CAUSATION
- **Evidence:**
  - [STAT] BaseWorker._emit() sets causation_id to triggering event's event_id
  - [STAT] Creates direct parent-child links in event chain
  - [EMPR] Used by UnifiedEventRuntime.getChildren/getAncestors

---

## CLASSIFICATION

**DECISION:** What is the lineage decision?

**ANSWER:** Lineage should establish:
- What is the parent event?
- What is the causal predecessor?
- What belongs to the same trace?
- How is lineage reconstructed?

**CURRENT STATE:**
- **Lineage materialization:** LineageWorker builds causation chains
- **Lineage persistence:** LINEAGE_CREATED events persist to ping_events
- **Lineage reconstruction:** correlation_id groups events by trace
- **Lineage storage:** Derived from canonical events, not separate database

**FINDING:** Lineage authority is EVENT-DRIVEN and ALREADY IMPLEMENTED

**CONCLUSION:** NO CODE CHANGE REQUIRED

---

## VERIFICATION

**Evidence for Lineage Authority:**

1. **Causation Chain:**
   - [STAT] BaseWorker._emit() sets causation_id to triggering event's event_id
   - [STAT] This creates direct parent-child links
   - [STAT] UnifiedEventRuntime.getChildren() queries by causation_id
   - [STAT] UnifiedEventRuntime.getAncestors() walks up causation chain

2. **Correlation Groups:**
   - [STAT] UnifiedEventRuntime sets correlation_id to eventId when not provided
   - [STAT] BaseWorker._emit() preserves correlation_id from triggering event
   - [STAT] UnifiedEventRuntime.getCorrelationGroup() queries by correlation_id
   - [STAT] MissionRuntime.getTrace() uses correlation_id for full trace

3. **Lineage Materialization:**
   - [STAT] LineageWorker builds causationChain from event.metadata.causation_id
   - [STAT] LineageWorker emits LINEAGE_CREATED events
   - [STAT] LINEAGE_CREATED events persist to ping_events

4. **Lineage Storage:**
   - [STAT] Lineage is derived from canonical events
   - [STAT] No separate lineage database exists
   - [STAT] Lineage is a projection, not a separate authority

---

## CONVERGENCE DECISION

**STATUS:** NO CODE CHANGE REQUIRED

**RATIONALE:**
1. Lineage is event-driven via correlation_id and causation_id
2. Lineage materialization exists (LineageWorker)
3. Lineage persistence exists (LINEAGE_CREATED events to ping_events)
4. Lineage reconstruction exists (correlation groups)
5. Lineage is a projection of canonical events, not a separate authority

**PATH ALREADY IMPLEMENTED:**
Event emission → correlation_id (trace identity) → causation_id (parent link) → LineageWorker (materialization) → LINEAGE_CREATED event → ping_events → MissionRuntime.getTrace() (reconstruction)

---

## FINAL STATUS

**LINEAGE_AUTHORITY = PROVEN**

**EVIDENCE:**
- [STAT] Lineage is event-driven via correlation_id and causation_id
- [STAT] Lineage materialization exists (LineageWorker)
- [STAT] Lineage persistence exists (LINEAGE_CREATED events)
- [STAT] Lineage reconstruction exists (correlation groups)
- [INFR] Lineage is a projection of canonical events

**NO CODE CHANGE REQUIRED**

**DECISIONS:**
- **Trace identity:** correlation_id (managed by UnifiedEventRuntime)
- **Parent link:** causation_id (managed by BaseWorker._emit())
- **Lineage materialization:** LineageWorker
- **Lineage storage:** ping_events (derived from canonical events)
- **Lineage reconstruction:** correlation group queries

**CLASSIFICATION:**
- **LINEAGE STORAGE:** Projection of canonical events
- **TRACE QUERY:** Read authority (UnifiedEventRuntime.getCorrelationGroup)
- **LINEAGE WORKER:** Materialization authority
