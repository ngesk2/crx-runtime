# MINIMUM REPLAYABLE KERNEL

**Audit Date:** 2025-01-18  
**Audit Mode:** ZERO ASSUMPTION - READ ONLY - RUNTIME REALITY ONLY  
**Audit Principle:** Recompute minimum replayable kernel. DO NOT include dashboard, retrieval, tasks, decisions, recommendations, witnesses, verification unless they are required for replay. Determine minimum required layers: Canonical Serializer, Canonical Comparator, Canonical Hash Authority, Identity Authority, Lineage Authority, Event Completeness, Replay Engine.

---

## EXECUTIVE SUMMARY

**Minimum replayable kernel requires 7 layers.** Canonical Serializer (required, ABSENT, 20 hours), Canonical Comparator (required, ABSENT, 10 hours), Canonical Hash Authority (required, ABSENT, 20 hours), Identity Authority (required, ABSENT, 20 hours), Lineage Authority (required, ABSENT, 30 hours), Event Completeness (required, ABSENT, 20 hours), Replay Engine (required, ABSENT, 40 hours). Total effort: 160 hours (4 weeks). Dependency graph: Canonicalization → Identity → Lineage → Event Completeness → Replay. Dashboard, retrieval, tasks, decisions, recommendations, witnesses, verification are NOT required for replay.

---

## LAYER 1: Canonical Serializer

**Required:** YES

**Current State:** ABSENT

**Why Required:** Replay requires deterministic serialization (same input → same bytes). Current serialization is non-deterministic (Python json.dumps() with no key sorting, no whitespace control). Multiple code paths can produce different bytes for the same logical state.

**Implementation Effort:** 20 hours
- Implement canonical serialization (key sorting, whitespace control)
- Implement canonical UTF-8 bytes
- Replace Python json.dumps() with canonical serialization
- Test canonical serialization

**Migration Risk:** MEDIUM
- Requires replacing Python json.dumps() with canonical serialization
- Requires testing all serialization code paths
- May break existing code that depends on non-canonical serialization

**Rollback Risk:** LOW
- Can rollback by reverting to Python json.dumps()
- Can rollback by disabling canonical serialization feature flag

**Dependencies:** NONE

---

## LAYER 2: Canonical Comparator

**Required:** YES

**Current State:** ABSENT

**Why Required:** Replay requires deterministic comparison (same input → same comparison result). Current comparison is non-deterministic (Python == does not guarantee byte-level equality).

**Implementation Effort:** 10 hours
- Implement canonical comparator (byte-level equality)
- Replace Python == with canonical comparator
- Test canonical comparator

**Migration Risk:** LOW
- Requires replacing Python == with canonical comparator
- Requires testing all comparison code paths
- May break existing code that depends on Python ==

**Rollback Risk:** LOW
- Can rollback by reverting to Python ==
- Can rollback by disabling canonical comparator feature flag

**Dependencies:** Canonical Serializer

---

## LAYER 3: Canonical Hash Authority

**Required:** YES

**Current State:** ABSENT

**Why Required:** Replay requires canonical hash for all artifacts (same input → same hash). Current hash computation does not exist. PING canonical hash authority exists but is NOT imported by runtime.

**Implementation Effort:** 20 hours
- Implement canonical hash computation (SHA-256)
- Implement canonical hash authority (single authority for all artifacts)
- Integrate PING/runtime/replay/canonical_hash_authority.ts
- Integrate PING/runtime/replay/canonical_json.ts
- Test canonical hash computation

**Migration Risk:** MEDIUM
- Requires adding canonical hash computation to all artifacts
- Requires replacing auto-increment IDs with canonical hashes
- Requires testing all artifact creation code paths
- May break existing code that depends on auto-increment IDs

**Rollback Risk:** MEDIUM
- Can rollback by removing canonical hash computation
- Can rollback by reverting to auto-increment IDs
- Can rollback by disabling canonical hash feature flag

**Dependencies:** Canonical Serializer, Canonical Comparator

---

## LAYER 4: Identity Authority

**Required:** YES

**Current State:** ABSENT

**Why Required:** Replay requires artifact identity (canonical hash). Current identity is based on auto-increment IDs (non-replayable) and external IDs (non-replayable). Identity cannot be reconstructed solely from replay.

**Implementation Effort:** 20 hours
- Implement identity authority (single authority for all artifacts)
- Replace auto-increment IDs with canonical hashes
- Replace external IDs with canonical hashes
- Implement duplicate detection using canonical hashes
- Implement collision handling for canonical hashes
- Test identity authority

**Migration Risk:** HIGH
- Requires replacing auto-increment IDs with canonical hashes
- Requires replacing external IDs with canonical hashes
- Requires database migration (add hash columns, migrate existing data)
- Requires testing all artifact creation and retrieval code paths
- May break existing code that depends on auto-increment IDs

**Rollback Risk:** HIGH
- Cannot rollback identity migration without data loss
- Cannot revert to auto-increment IDs without data loss
- Can rollback by disabling identity authority feature flag (but data loss may occur)

**Dependencies:** Canonical Hash Authority

---

## LAYER 5: Lineage Authority

**Required:** YES

**Current State:** ABSENT

**Why Required:** Replay requires lineage tracking for derived artifacts (parent, ancestor, derivation edge). Current lineage is absent for most artifacts. Derivation history cannot be reconstructed.

**Implementation Effort:** 30 hours
- Implement lineage authority (single authority for all artifacts)
- Implement parent tracking for derived artifacts
- Implement ancestor tracking for derived artifacts
- Implement derivation edge tracking for derived artifacts
- Implement lineage persistence (lineage table)
- Integrate PING/runtime/kernel/commit-service/src/persistence/lineage_store.ts
- Test lineage authority

**Migration Risk:** HIGH
- Requires adding lineage tracking to all derived artifacts
- Requires database migration (add lineage table, migrate existing data)
- Requires testing all artifact creation and retrieval code paths
- May break existing code that does not expect lineage tracking

**Rollback Risk:** HIGH
- Cannot rollback lineage migration without data loss
- Cannot remove lineage tracking without data loss
- Can rollback by disabling lineage authority feature flag (but data loss may occur)

**Dependencies:** Identity Authority

---

## LAYER 6: Event Completeness

**Required:** YES

**Current State:** ABSENT

**Why Required:** Replay requires PRE-WRITE events for all state transitions. Current events are POST-WRITE (derived from SQLite, not source of truth). Current events are incomplete (10 missing event types). State cannot be reconstructed from events.

**Implementation Effort:** 20 hours
- Implement NEWSLETTER_RECEIVED event (PRE-WRITE)
- Implement OLLAMA_ANALYSIS_COMPLETED event (PRE-WRITE)
- Implement NEWSLETTER_CLASSIFIED event (PRE-WRITE)
- Implement TOPICS_EXTRACTED event (PRE-WRITE)
- Implement INSIGHTS_EXTRACTED event (PRE-WRITE)
- Implement ARCHIVE_WRITTEN event (POST-WRITE)
- Implement MARKDOWN_WRITTEN event (POST-WRITE)
- Implement NEWSLETTER_ARCHIVED event (POST-WRITE)
- Implement ARTICLE_RECEIVED event (PRE-WRITE)
- Implement OLLAMA_SUMMARIZATION_COMPLETED event (PRE-WRITE)
- Change event emission timing from POST-WRITE to PRE-WRITE
- Test event completeness

**Migration Risk:** HIGH
- Requires changing event emission timing (POST-WRITE to PRE-WRITE)
- Requires adding 10 missing event types
- Requires testing all mutation code paths
- May break existing code that depends on POST-WRITE events

**Rollback Risk:** HIGH
- Cannot rollback event emission timing without data loss
- Cannot revert to POST-WRITE events without data loss
- Can rollback by disabling event completeness feature flag (but data loss may occur)

**Dependencies:** Identity Authority, Lineage Authority

---

## LAYER 7: Replay Engine

**Required:** YES

**Current State:** ABSENT

**Why Required:** Replay requires replay engine (replay events to reconstruct state). Current replay engine does not exist. PING replay engine exists but is NOT imported by runtime.

**Implementation Effort:** 40 hours
- Implement replay engine (replay events to reconstruct state)
- Implement deterministic event ordering
- Implement deterministic execution order
- Implement deterministic Ollama API calls (capture Ollama output in events, replay Ollama output from events)
- Implement side effect capture (capture SQLite writes, Markdown writes)
- Integrate PING/replay/deterministic_replay_engine.ts
- Integrate PING/replay/replay_state_machine.ts
- Integrate PING/replay/replay_event_stream.ts
- Test replay engine

**Migration Risk:** HIGH
- Requires implementing replay engine
- Requires making Ollama API calls deterministic
- Requires capturing side effects
- Requires testing all replay code paths
- May break existing code that depends on non-deterministic Ollama API calls

**Rollback Risk:** HIGH
- Cannot rollback replay engine without data loss
- Cannot revert to non-deterministic Ollama API calls without data loss
- Can rollback by disabling replay engine feature flag (but data loss may occur)

**Dependencies:** Event Completeness

---

## EXCLUDED LAYERS (NOT REQUIRED FOR REPLAY)

### Dashboard
**Required:** NO
**Why:** Dashboard is UI layer. Replay does not require UI. Replay can exist without dashboard.

### Retrieval
**Required:** NO
**Why:** Retrieval is query layer. Replay does not require query. Replay can exist without retrieval.

### Tasks
**Required:** NO
**Why:** Tasks are application feature. Replay does not require task tracking. Replay can exist without tasks.

### Decisions
**Required:** NO
**Why:** Decisions are application feature. Replay does not require decision tracking. Replay can exist without decisions.

### Recommendations
**Required:** NO
**Why:** Recommendations are application feature. Replay does not require recommendation engine. Replay can exist without recommendations.

### Witnesses
**Required:** NO
**Why:** Witnesses are higher-order capability. Replay may exist without witnesses. Witnesses cannot exist without replay.

### Verification
**Required:** NO
**Why:** Verification is higher-order capability. Replay may exist without verification. Verification cannot exist without replay.

---

## DEPENDENCY GRAPH

```
Canonical Serializer
  ↓
Canonical Comparator
  ↓
Canonical Hash Authority
  ↓
Identity Authority
  ↓
Lineage Authority
  ↓
Event Completeness
  ↓
Replay Engine
```

---

## CRITICAL PATH

**Critical Path:** Canonical Serializer → Canonical Comparator → Canonical Hash Authority → Identity Authority → Lineage Authority → Event Completeness → Replay Engine

**Why:**
- Canonical Serializer is required for Canonical Comparator
- Canonical Comparator is required for Canonical Hash Authority
- Canonical Hash Authority is required for Identity Authority
- Identity Authority is required for Lineage Authority
- Lineage Authority is required for Event Completeness
- Event Completeness is required for Replay Engine

**Total Critical Path Effort:** 160 hours (4 weeks)

---

## ANSWER

**Canonical Serializer:**
- Required: YES
- Current State: ABSENT
- Implementation Effort: 20 hours
- Migration Risk: MEDIUM
- Rollback Risk: LOW
- Dependencies: NONE

**Canonical Comparator:**
- Required: YES
- Current State: ABSENT
- Implementation Effort: 10 hours
- Migration Risk: LOW
- Rollback Risk: LOW
- Dependencies: Canonical Serializer

**Canonical Hash Authority:**
- Required: YES
- Current State: ABSENT
- Implementation Effort: 20 hours
- Migration Risk: MEDIUM
- Rollback Risk: MEDIUM
- Dependencies: Canonical Serializer, Canonical Comparator

**Identity Authority:**
- Required: YES
- Current State: ABSENT
- Implementation Effort: 20 hours
- Migration Risk: HIGH
- Rollback Risk: HIGH
- Dependencies: Canonical Hash Authority

**Lineage Authority:**
- Required: YES
- Current State: ABSENT
- Implementation Effort: 30 hours
- Migration Risk: HIGH
- Rollback Risk: HIGH
- Dependencies: Identity Authority

**Event Completeness:**
- Required: YES
- Current State: ABSENT
- Implementation Effort: 20 hours
- Migration Risk: HIGH
- Rollback Risk: HIGH
- Dependencies: Identity Authority, Lineage Authority

**Replay Engine:**
- Required: YES
- Current State: ABSENT
- Implementation Effort: 40 hours
- Migration Risk: HIGH
- Rollback Risk: HIGH
- Dependencies: Event Completeness

**Total Minimum Replayable Kernel Effort:** 160 hours (4 weeks)
