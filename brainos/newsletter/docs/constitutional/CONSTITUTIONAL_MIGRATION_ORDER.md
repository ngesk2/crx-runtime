# CONSTITUTIONAL MIGRATION ORDER

**Audit Date:** 2025-01-18  
**Audit Mode:** ZERO ASSUMPTION - READ ONLY - RUNTIME REALITY ONLY  
**Audit Principle:** Recompute migration order. Use two tracks. Track A — User Value (FTS5, article retrieval, digest retrieval). Track B — Constitutional Sovereignty (canonical authority, identity authority, lineage authority, event completeness, replay). Verification and witness must appear AFTER replay. Produce week-by-week sequence. Provide rationale.

---

## EXECUTIVE SUMMARY

**Migration order is 8 weeks.** Track A (User Value) - 3 weeks (SQLite FTS5, article retrieval, digest retrieval). Track B (Constitutional Sovereignty) - 5 weeks (canonical authority, identity authority, lineage authority, event completeness, replay). Total: 8 weeks. Verification and witness appear AFTER replay (weeks 6-8). Rationale: User value first (immediate impact), constitutional sovereignty second (long-term foundation), verification and witness third (higher-order capabilities).

---

## TRACK A — USER VALUE (3 weeks)

### Week 1: SQLite FTS5
**Priority:** HIGHEST
**Why:** Users cannot search newsletters, articles, digests. Current SQL LIKE queries are slow and imprecise. FTS5 enables fast, precise full-text search. Immediate user impact.

**Changes:**
- Enable SQLite FTS5 for newsletters table
- Enable SQLite FTS5 for articles table
- Enable SQLite FTS5 for digests table
- Implement FTS5 virtual table creation
- Implement FTS5 index creation
- Replace SQL LIKE queries with FTS5 queries

**Effort:** 10 hours

**Risk:** LOW
- Can rollback by disabling FTS5
- Can rollback by dropping FTS5 virtual tables

**Dependencies:** NONE

---

### Week 2: Article Retrieval to Dashboard
**Priority:** HIGH
**Why:** Articles are stored but never retrieved. Articles are never displayed in dashboard. Article state is unreachable. Immediate user impact.

**Changes:**
- Add article display to dashboard
- Add article search to dashboard
- Implement article retrieval functions
- Implement article search functions

**Effort:** 5 hours

**Risk:** LOW
- Can rollback by removing article display
- Can rollback by removing article search

**Dependencies:** Week 1 (SQLite FTS5)

---

### Week 3: Digest Retrieval to Dashboard
**Priority:** HIGH
**Why:** Digests are stored but never retrieved. Digests are never displayed in dashboard. Digest state is unreachable. Immediate user impact.

**Changes:**
- Add digest display to dashboard
- Add digest search to dashboard
- Implement digest retrieval functions
- Implement digest search functions

**Effort:** 5 hours

**Risk:** LOW
- Can rollback by removing digest display
- Can rollback by removing digest search

**Dependencies:** Week 1 (SQLite FTS5)

---

## TRACK B — CONSTITUTIONAL SOVEREIGNTY (5 weeks)

### Week 4: Canonical Authority
**Priority:** CRITICAL
**Why:** Replay requires canonical serialization, canonical comparator, canonical hash authority. Current serialization is non-deterministic. Current comparator is non-deterministic. Current hash authority does not exist. Constitutional foundation.

**Changes:**
- Implement canonical serialization (key sorting, whitespace control)
- Implement canonical UTF-8 bytes
- Implement canonical comparator (byte-level equality)
- Implement canonical hash authority (SHA-256)
- Replace Python json.dumps() with canonical serialization
- Replace Python == with canonical comparator
- Integrate PING/runtime/replay/canonical_hash_authority.ts
- Integrate PING/runtime/replay/canonical_json.ts

**Effort:** 50 hours (Canonical Serializer: 20 hours, Canonical Comparator: 10 hours, Canonical Hash Authority: 20 hours)

**Risk:** MEDIUM
- Can rollback by reverting to Python json.dumps()
- Can rollback by reverting to Python ==
- Can rollback by removing canonical hash computation

**Dependencies:** NONE

---

### Week 5: Identity Authority
**Priority:** CRITICAL
**Why:** Replay requires artifact identity (canonical hash). Current identity is based on auto-increment IDs (non-replayable) and external IDs (non-replayable). Identity cannot be reconstructed solely from replay. Constitutional foundation.

**Changes:**
- Implement identity authority (single authority for all artifacts)
- Replace auto-increment IDs with canonical hashes
- Replace external IDs with canonical hashes
- Implement duplicate detection using canonical hashes
- Implement collision handling for canonical hashes
- Database migration (add hash columns, migrate existing data)

**Effort:** 20 hours

**Risk:** HIGH
- Cannot rollback identity migration without data loss
- Cannot revert to auto-increment IDs without data loss

**Dependencies:** Week 4 (Canonical Authority)

---

### Week 6: Lineage Authority
**Priority:** CRITICAL
**Why:** Replay requires lineage tracking for derived artifacts. Current lineage is absent for most artifacts. Derivation history cannot be reconstructed. Constitutional foundation.

**Changes:**
- Implement lineage authority (single authority for all artifacts)
- Implement parent tracking for derived artifacts
- Implement ancestor tracking for derived artifacts
- Implement derivation edge tracking for derived artifacts
- Implement lineage persistence (lineage table)
- Database migration (add lineage table, migrate existing data)
- Integrate PING/runtime/kernel/commit-service/src/persistence/lineage_store.ts

**Effort:** 30 hours

**Risk:** HIGH
- Cannot rollback lineage migration without data loss
- Cannot remove lineage tracking without data loss

**Dependencies:** Week 5 (Identity Authority)

---

### Week 7: Event Completeness
**Priority:** CRITICAL
**Why:** Replay requires PRE-WRITE events for all state transitions. Current events are POST-WRITE (derived from SQLite, not source of truth). Current events are incomplete (10 missing event types). State cannot be reconstructed from events. Constitutional foundation.

**Changes:**
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

**Effort:** 20 hours

**Risk:** HIGH
- Cannot rollback event emission timing without data loss
- Cannot revert to POST-WRITE events without data loss

**Dependencies:** Week 6 (Lineage Authority)

---

### Week 8: Replay Engine
**Priority:** CRITICAL
**Why:** Replay requires replay engine (replay events to reconstruct state). Current replay engine does not exist. Replay cannot exist without replay engine. Constitutional foundation.

**Changes:**
- Implement replay engine (replay events to reconstruct state)
- Implement deterministic event ordering
- Implement deterministic execution order
- Implement deterministic Ollama API calls (capture Ollama output in events, replay Ollama output from events)
- Implement side effect capture (capture SQLite writes, Markdown writes)
- Integrate PING/replay/deterministic_replay_engine.ts
- Integrate PING/replay/replay_state_machine.ts
- Integrate PING/replay/replay_event_stream.ts

**Effort:** 40 hours

**Risk:** HIGH
- Cannot rollback replay engine without data loss
- Cannot revert to non-deterministic Ollama API calls without data loss

**Dependencies:** Week 7 (Event Completeness)

---

## HIGHER-ORDER CAPABILITIES (AFTER REPLAY)

### Week 9: Self-Verification
**Priority:** MEDIUM
**Why:** Verification cannot exist without replay. Replay must exist first. Self-verification is higher-order capability. Not required for minimum replayable kernel.

**Changes:**
- Implement self-verification (agent verifies own state)
- Implement self-consistency (agent verifies own consistency)
- Implement self-integrity (agent verifies own integrity)
- Integrate PING/replay/replay_verification.ts
- Integrate PING/runtime/replay/graph_validator.ts
- Integrate PING/runtime/kernel/commit-service/src/validation/dag_validator.ts

**Effort:** 40 hours

**Risk:** HIGH
- Can rollback by removing self-verification

**Dependencies:** Week 8 (Replay Engine)

---

### Week 10: Witness Computation
**Priority:** MEDIUM
**Why:** Witness cannot exist without replay. Replay must exist first. Witness is higher-order capability. Not required for minimum replayable kernel.

**Changes:**
- Implement witness computation (compute witness roots for all event streams)
- Implement Merkle trees (compute Merkle trees for all event streams)
- Implement witness roots (store witness roots in database)
- Implement Merkle proofs (generate Merkle proofs for all artifacts)
- Implement attestation structure (attestation structure for all artifacts)
- Implement verification protocol (verification protocol for all artifacts)
- Integrate PING/runtime/replay/witness_authority.ts
- Integrate PING/runtime/replay/merkle_tree.ts
- Integrate PING/runtime/replay/canonical_certificate.ts

**Effort:** 20 hours

**Risk:** HIGH
- Can rollback by removing witness computation

**Dependencies:** Week 8 (Replay Engine)

---

## WEEK-BY-WEEK SEQUENCE

### Week 1: SQLite FTS5 (Track A)
- Priority: HIGHEST
- Effort: 10 hours
- Risk: LOW
- Dependencies: NONE
- Rationale: Users cannot search newsletters, articles, digests. Immediate user impact.

### Week 2: Article Retrieval to Dashboard (Track A)
- Priority: HIGH
- Effort: 5 hours
- Risk: LOW
- Dependencies: Week 1
- Rationale: Articles are stored but never retrieved. Immediate user impact.

### Week 3: Digest Retrieval to Dashboard (Track A)
- Priority: HIGH
- Effort: 5 hours
- Risk: LOW
- Dependencies: Week 1
- Rationale: Digests are stored but never retrieved. Immediate user impact.

### Week 4: Canonical Authority (Track B)
- Priority: CRITICAL
- Effort: 50 hours
- Risk: MEDIUM
- Dependencies: NONE
- Rationale: Replay requires canonical serialization, canonical comparator, canonical hash authority. Constitutional foundation.

### Week 5: Identity Authority (Track B)
- Priority: CRITICAL
- Effort: 20 hours
- Risk: HIGH
- Dependencies: Week 4
- Rationale: Replay requires artifact identity (canonical hash). Constitutional foundation.

### Week 6: Lineage Authority (Track B)
- Priority: CRITICAL
- Effort: 30 hours
- Risk: HIGH
- Dependencies: Week 5
- Rationale: Replay requires lineage tracking for derived artifacts. Constitutional foundation.

### Week 7: Event Completeness (Track B)
- Priority: CRITICAL
- Effort: 20 hours
- Risk: HIGH
- Dependencies: Week 6
- Rationale: Replay requires PRE-WRITE events for all state transitions. Constitutional foundation.

### Week 8: Replay Engine (Track B)
- Priority: CRITICAL
- Effort: 40 hours
- Risk: HIGH
- Dependencies: Week 7
- Rationale: Replay requires replay engine (replay events to reconstruct state). Constitutional foundation.

### Week 9: Self-Verification (Higher-Order)
- Priority: MEDIUM
- Effort: 40 hours
- Risk: HIGH
- Dependencies: Week 8
- Rationale: Verification cannot exist without replay. Higher-order capability.

### Week 10: Witness Computation (Higher-Order)
- Priority: MEDIUM
- Effort: 20 hours
- Risk: HIGH
- Dependencies: Week 8
- Rationale: Witness cannot exist without replay. Higher-order capability.

---

## CRITICAL FINDINGS

1. **Migration order is 8 weeks for minimum replayable kernel.** Track A (User Value) - 3 weeks. Track B (Constitutional Sovereignty) - 5 weeks. Total: 8 weeks.

2. **User value first (weeks 1-3).** SQLite FTS5, article retrieval, digest retrieval. Immediate user impact. Low risk. No dependencies.

3. **Constitutional sovereignty second (weeks 4-8).** Canonical authority, identity authority, lineage authority, event completeness, replay engine. Constitutional foundation. High risk. Dependencies exist.

4. **Verification and witness appear AFTER replay (weeks 9-10).** Verification cannot exist without replay. Witness cannot exist without replay. Higher-order capabilities.

5. **Canonical authority is week 4.** Canonical serialization, canonical comparator, canonical hash authority. 50 hours. MEDIUM risk. No dependencies.

6. **Identity authority is week 5.** Identity authority (canonical hash). 20 hours. HIGH risk. Depends on canonical authority.

7. **Lineage authority is week 6.** Lineage authority (parent, ancestor, derivation edge). 30 hours. HIGH risk. Depends on identity authority.

8. **Event completeness is week 7.** Event completeness (10 missing events, PRE-WRITE timing). 20 hours. HIGH risk. Depends on lineage authority.

9. **Replay engine is week 8.** Replay engine (deterministic ordering, deterministic reducers, deterministic serialization). 40 hours. HIGH risk. Depends on event completeness.

10. **Self-verification is week 9.** Self-verification (state verification, consistency verification, integrity verification). 40 hours. HIGH risk. Depends on replay engine.

11. **Witness computation is week 10.** Witness computation (witness roots, Merkle trees, Merkle proofs). 20 hours. HIGH risk. Depends on replay engine.

---

## ANSWER

**Track A — User Value (3 weeks):**
- Week 1: SQLite FTS5 (10 hours, LOW risk)
- Week 2: Article Retrieval to Dashboard (5 hours, LOW risk, depends on Week 1)
- Week 3: Digest Retrieval to Dashboard (5 hours, LOW risk, depends on Week 1)

**Track B — Constitutional Sovereignty (5 weeks):**
- Week 4: Canonical Authority (50 hours, MEDIUM risk, no dependencies)
- Week 5: Identity Authority (20 hours, HIGH risk, depends on Week 4)
- Week 6: Lineage Authority (30 hours, HIGH risk, depends on Week 5)
- Week 7: Event Completeness (20 hours, HIGH risk, depends on Week 6)
- Week 8: Replay Engine (40 hours, HIGH risk, depends on Week 7)

**Higher-Order Capabilities (AFTER Replay, 2 weeks):**
- Week 9: Self-Verification (40 hours, HIGH risk, depends on Week 8)
- Week 10: Witness Computation (20 hours, HIGH risk, depends on Week 8)

**Total Minimum Replayable Kernel Effort:** 8 weeks (Track A: 3 weeks, Track B: 5 weeks)
**Total Higher-Order Capabilities Effort:** 2 weeks (Week 9-10)
**Total Migration Effort:** 10 weeks
