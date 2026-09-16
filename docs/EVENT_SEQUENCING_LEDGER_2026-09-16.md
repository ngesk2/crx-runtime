# EVENT SEQUENCING LEDGER 2026-09-16

**STATUS:** CLASSIFIED
**DATE:** 2026-09-16
**PHASE:** G - EVENT SEQUENCING

---

## EVIDENCE

### Current Sequencing Mechanism

#### 1. PostgreSQL Implicit Ordering
- **File:** /home/nolan/ping/ping-runtime/events/unified_event_runtime.js
- **Status:** IMPLICIT SEQUENCING
- **Evidence:**
  - [STAT] No explicit sequence field in ping_events table
  - [STAT] No sequence authority implementation
  - [STAT] Ordering via ORDER BY timestamp ASC or created_at ASC
  - [STAT] PostgreSQL insertion order provides implicit sequence
  - [EMPR] All queries use timestamp-based ordering
  - [INFR] Implicit database-level ordering

#### 2. Mission Identity Sequence
- **File:** /home/nolan/ping/ping-runtime/orchestration/mission_runtime.js
- **Status:** MISSION-LEVEL SEQUENCING
- **Evidence:**
  - [STAT] MissionRuntime uses SHA-256 content-derived mission_id
  - [STAT] No mission sequence field
  - [STAT] Ordering via ORDER BY priority DESC, created_at ASC
  - [INFR] Mission ordering, not event ordering

---

## CLASSIFICATION

**DECISION:** What is the event sequencing decision?

**ANSWER:** Event sequencing should establish:
- Total global ordering (if required for deterministic replay)
- Per-stream ordering (if required for consistency)
- Causation-based partial ordering (if sufficient for correctness)

**CURRENT STATE:**
- **Event ordering:** PostgreSQL implicit (timestamp-based)
- **Sequence field:** MISSING
- **Sequence authority:** MISSING
- **Causation ordering:** EXISTS (causation_id + correlation_id)

**FINDING:** Causation-based partial ordering exists; total ordering is implicit

**CONCLUSION:** DEFER DECISION - require replay determinism evidence before implementing

---

## ANALYSIS

**Do we need explicit event sequencing?**

**Arguments FOR explicit sequencing:**
- [INFR] Deterministic replay may require strict ordering
- [INFR] PostgreSQL timestamp ordering could have ambiguous ties
- [INFR] Explicit sequence provides stronger ordering guarantees

**Arguments AGAINST explicit sequencing:**
- [STAT] Causation_id provides causal ordering (parent-child links)
- [STAT] Correlation_id groups events by trace
- [STAT] Timestamp ordering is sufficient for most use cases
- [STAT] PostgreSQL transaction guarantees commit order
- [STAT] No evidence of timestamp collision issues in current usage
- [STAT] Adding sequence requires schema migration (82+ events)

**REQUIREMENT CLARIFICATION:**
Before implementing, need to determine:
- Does deterministic replay require strict total ordering?
- Is causation-based partial ordering sufficient for correctness?
- Are there actual timestamp collision issues in production?
- Does PostgreSQL commit order already provide needed guarantees?

---

## CURRENT ORDERING MECHANISMS

**1. Implicit Database Ordering:**
- [STAT] PostgreSQL maintains insertion order within transactions
- [STAT] ORDER BY timestamp ASC provides chronological ordering
- [STAT] No explicit sequence numbers needed

**2. Causation-Based Ordering:**
- [STAT] causation_id creates parent-child links
- [STAT] UnifiedEventRuntime.getChildren() uses causation_id
- [STAT] UnifiedEventRuntime.getAncestors() walks causation chain
- [STAT] This provides causal partial ordering

**3. Correlation Group Ordering:**
- [STAT] correlation_id groups events by trace
- [STAT] UnifiedEventRuntime.getCorrelationGroup() orders by created_at ASC
- [STAT] This provides within-trace ordering

---

## CONVERGENCE DECISION

**STATUS:** DEFERRED - EVIDENCE REQUIRED

**RATIONALE:**
1. Causation-based partial ordering exists (causation_id + correlation_id)
2. PostgreSQL implicit ordering provides chronological ordering
3. No evidence of timestamp collision issues
4. Schema migration required for 82+ existing events
5. Need replay determinism evidence before implementing explicit sequence

**IF REQUIRED (FUTURE PATH):**
- Add sequence field to ping_events table
- Use PostgreSQL SERIAL or BIGSERIAL for auto-increment
- Backward-compatible schema migration
- Ensure sequence assignment is transactional
- Test concurrency for sequence contention

---

## FINAL STATUS

**EVENT_SEQUENCING = DEFERRED**

**EVIDENCE:**
- [STAT] Causation-based partial ordering exists (causation_id + correlation_id)
- [STAT] PostgreSQL implicit ordering provides chronological ordering
- [STAT] No explicit sequence field exists
- [STAT] No sequence authority implementation
- [INFR] No evidence of timestamp collision issues

**NO CODE CHANGE REQUIRED**

**DEFERRED REASON:**
- Causation-based ordering may be sufficient for correctness
- PostgreSQL commit order provides implicit guarantees
- Need replay determinism evidence before implementing explicit sequence
- Schema migration complexity for 82+ existing events

**CURRENT ORDERING:**
- **Total ordering:** PostgreSQL implicit (timestamp + commit order)
- **Causal ordering:** causation_id (parent-child links)
- **Trace ordering:** correlation_id (within correlation groups)
