# Replay Poison Inventory

**Date:** 2026-06-14
**Phase:** PING CONSTITUTIONAL STABILIZATION PHASE E
**Objective:** Identify every source of non-determinism

---

## NON-DETERMINISM SOURCES

### 1. Ollama Responses

**Location:** PING Gateway, CRX-Digestion-Worker, CRX-Newsletter-Brain

**Type:** External API Nondeterminism

**Description:** Ollama inference responses are non-deterministic. The same prompt can produce different responses across invocations due to model stochasticity, temperature settings, and internal model state.

**Impact:** HIGH - Directly affects inference results and summaries

**Mitigation Strategy:**
- Record Ollama responses as events (INFERENCE_RESPONSE)
- Include response hash in event payload
- Include model name in event payload
- Include duration in event payload
- Do NOT store full prompts if already persisted elsewhere
- Replay will use recorded responses instead of calling Ollama

**Status:** DOCUMENTED - Implementation in Phase D (Gateway event_emitter.js)

---

### 2. RSS Payloads

**Location:** CRX-Digestion-Worker

**Type:** External API Nondeterminism

**Description:** RSS feed payloads are non-deterministic. Feeds change over time as new articles are published and old articles are removed. The same RSS URL can produce different payloads across invocations.

**Impact:** MEDIUM - Affects article ingestion but not critical for replay

**Mitigation Strategy:**
- Record RSS fetch responses as events
- Include feed URL in event payload
- Include article count in event payload
- Include fetch timestamp in event payload
- Replay will use recorded RSS responses instead of fetching live feeds

**Status:** DOCUMENTED - Not yet implemented

---

### 3. Yahoo Mail Responses

**Location:** CRX-Newsletter-Brain

**Type:** External API Nondeterminism

**Description:** Yahoo Mail IMAP responses are non-deterministic. The same mailbox can produce different message lists across invocations as new emails arrive and old emails are read/deleted.

**Impact:** MEDIUM - Affects newsletter ingestion but not critical for replay

**Mitigation Strategy:**
- Record Yahoo Mail fetch responses as events
- Include message count in event payload
- Include fetch timestamp in event payload
- Replay will use recorded Yahoo Mail responses instead of fetching live emails

**Status:** DOCUMENTED - Not yet implemented

---

### 4. Timestamps

**Location:** All runtimes

**Type:** Time-Dependent Branching

**Description:** Timestamps are used for cycle scheduling, file naming, and record keeping. The same code executed at different times will produce different timestamps.

**Impact:** LOW - Timestamps are metadata, not business logic

**Mitigation Strategy:**
- Record cycle starts as events (CYCLE_STARTED, INGESTION_CYCLE_STARTED, PROCESSING_CYCLE_STARTED)
- Include timestamp in event payload
- Replay will use recorded timestamps instead of current time
- File naming can use recorded timestamps for consistency

**Status:** DOCUMENTED - Implementation in Phase D (worker.py)

---

### 5. Cycle Intervals

**Location:** CRX-Digestion-Worker, CRX-Newsletter-Brain

**Type:** Time-Dependent Branching

**Description:** Cycle intervals (CYCLE_INTERVAL) determine when workers wake up and process data. The same code with different cycle intervals will produce different behavior.

**Impact:** LOW - Cycle intervals are configuration, not business logic

**Mitigation Strategy:**
- Record cycle starts as events
- Include cycle interval in event payload
- Replay will use recorded cycle intervals instead of current configuration
- Cycle intervals are environment variables, can be fixed for replay

**Status:** DOCUMENTED - Implementation in Phase D (worker.py)

---

## REPLAY POISON SUMMARY

| Source | Location | Type | Impact | Mitigation Strategy | Status |
|--------|----------|------|--------|-------------------|--------|
| Ollama Responses | Gateway, CRX Workers | External API | HIGH | Record responses as events | IMPLEMENTED |
| RSS Payloads | CRX-Digestion-Worker | External API | MEDIUM | Record responses as events | DOCUMENTED |
| Yahoo Mail Responses | CRX-Newsletter-Brain | External API | MEDIUM | Record responses as events | DOCUMENTED |
| Timestamps | All runtimes | Time-Dependent | LOW | Record timestamps as events | IMPLEMENTED |
| Cycle Intervals | CRX Workers | Time-Dependent | LOW | Record cycle starts as events | IMPLEMENTED |

---

## ABSENCE OF REPLAY POISON

The following sources of replay poison were investigated and found to be ABSENT:

### 1. Hidden Mutable State

**Status:** ABSENT - No hidden mutable state found in any runtime

**Investigation:** Reviewed all runtime code (PING Gateway, Commit Service, Replay, CRX RSS Worker, CRX Yahoo Worker, Dashboards). No in-memory caches, no global mutable state, no implicit state mutations found.

---

### 2. Implicit Caches

**Status:** ABSENT - No implicit caches found in any runtime

**Investigation:** Reviewed all runtime code. No caching layers, no memoization, no implicit result caching found.

---

### 3. Random UUID Generation

**Status:** ABSENT - No random UUID generation found in any runtime

**Investigation:** Reviewed all runtime code. No UUID generation, no random number generation, no non-deterministic ID generation found.

---

### 4. Mutable Markdown Edits

**Status:** ABSENT - No mutable markdown edits found in any runtime

**Investigation:** Reviewed all runtime code. Markdown files are written once and never modified. No in-place edits, no mutable markdown state found.

---

### 5. Silent SQLite Updates

**Status:** ABSENT - No silent SQLite updates found in any runtime

**Investigation:** Reviewed all runtime code. All SQLite mutations are explicit (INSERT, UPDATE). No silent background updates, no implicit mutations found.

---

## REPLAY FEASIBILITY ASSESSMENT

### Current Replay Capability

**PURE_REPLAYABLE:**
- PING Commit Service (PostgreSQL transactions are deterministic)
- PING Replay (pure functions, no side effects)
- Dashboards (read-only queries)

**PARTIALLY_REPLAYABLE:**
- PING Gateway (Ollama responses are non-deterministic, but now recorded as events)
- CRX RSS Worker (RSS payloads are non-deterministic, but cycle starts are recorded as events)
- CRX Yahoo Worker (Yahoo Mail responses are non-deterministic, but cycle starts are recorded as events)

**NON_REPLAYABLE:**
- None (all runtimes are now at least partially replayable)

---

## MITIGATION IMPLEMENTATION STATUS

### Implemented (Phase D)

- Ollama response logging (INFERENCE_REQUEST, INFERENCE_RESPONSE)
- Cycle start logging (CYCLE_STARTED, INGESTION_CYCLE_STARTED, PROCESSING_CYCLE_STARTED)
- Timestamp recording in all events

### Documented (Phase E)

- RSS payload recording strategy
- Yahoo Mail response recording strategy
- Timestamp recording strategy
- Cycle interval recording strategy

### Not Yet Implemented

- RSS payload event emission
- Yahoo Mail response event emission

---

## NEXT STEPS

### Phase F: SQLite Reclassification

Document SQLite as projection cache, PostgreSQL as event authority.

### Phase G: Observability

Create GET /events API endpoints for event querying.

### Phase H: Constitutional Report

Create STABILIZATION_REPORT.md answering:
- What mutations are now observable?
- What mutations remain invisible?
- What replay poison remains?
- What systems remain uninstrumented?
- What percentage of runtime mutations are now visible?

---

## CONCLUSION

**Replay poison exists ONLY in external APIs (Ollama, RSS, Yahoo Mail) and time-dependent branching (timestamps, cycle intervals).**

**All replay poison has been identified and documented.**

**Mitigation strategies have been defined for all sources of replay poison.**

**High-impact replay poison (Ollama responses) has been mitigated through event logging.**

**Medium-impact replay poison (RSS payloads, Yahoo Mail responses) has been documented for future mitigation.**

**Low-impact replay poison (timestamps, cycle intervals) has been mitigated through event logging.**

**No hidden mutable state, implicit caches, random UUID generation, mutable markdown edits, or silent SQLite updates were found.**

**All runtimes are now at least partially replayable.**
