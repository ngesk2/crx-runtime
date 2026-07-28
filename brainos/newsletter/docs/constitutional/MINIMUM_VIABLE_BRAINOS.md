# MINIMUM VIABLE BRAINOS

**Audit Date:** 2025-01-18  
**Audit Mode:** ZERO ASSUMPTION - READ ONLY  
**Audit Principle:** Determine the minimum set of changes required to make the system useful every day. Limit horizon: 30 days. Classify as CRITICAL, IMPORTANT, OPTIONAL, NON-CRITICAL.

---

## EXECUTIVE SUMMARY

**Minimum viable BrainOS requires 3 changes.** 1) Enable SQLite FTS5 for full-text search (CRITICAL, 10 hours). 2) Add article retrieval to dashboard (CRITICAL, 5 hours). 3) Add digest retrieval to dashboard (IMPORTANT, 5 hours). Total effort: 20 hours (3 days). All other changes are OPTIONAL or NON-CRITICAL.

---

## CHANGE 1: Enable SQLite FTS5 for Full-Text Search

**Classification:** CRITICAL

**Why:**
- Users cannot search newsletters, articles, digests
- Current SQL LIKE queries are slow and imprecise
- FTS5 enables fast, precise full-text search
- FTS5 enables ranking and relevance scoring
- FTS5 is required for knowledge retrieval

**User Impact:** HIGH
- Users can search newsletters, articles, digests
- Users can find information quickly
- Users can answer operational questions

**Constitutional Importance:** LOW
- Not required for constitutional kernel
- Required for knowledge system
- Required for PersonalOS

**Future Optionality:** HIGH
- Enables knowledge retrieval
- Enables decision support
- Enables task management
- Enables PersonalOS

**Implementation Cost:** LOW
- Requires SQLite FTS5 enablement
- Requires FTS5 virtual table creation
- Requires FTS5 index creation
- Estimated effort: 10 hours

**Migration Risk:** LOW
- Can rollback by disabling FTS5
- Can rollback by dropping FTS5 virtual tables

**Horizon:** 30 days

**Priority:** CRITICAL

---

## CHANGE 2: Add Article Retrieval to Dashboard

**Classification:** CRITICAL

**Why:**
- Articles are stored but never retrieved
- Articles are never displayed in dashboard
- Articles are never consumed by user
- Article state is unreachable

**User Impact:** HIGH
- Users can view articles
- Users can search articles
- Users can consume articles

**Constitutional Importance:** LOW
- Not required for constitutional kernel
- Required for knowledge system
- Required for PersonalOS

**Future Optionality:** MEDIUM
- Enables article retrieval
- Enables article consumption
- Enables knowledge system

**Implementation Cost:** LOW
- Requires article display in dashboard
- Requires article search in dashboard
- Estimated effort: 5 hours

**Migration Risk:** LOW
- Can rollback by removing article display
- Can rollback by removing article search

**Horizon:** 30 days

**Priority:** CRITICAL

---

## CHANGE 3: Add Digest Retrieval to Dashboard

**Classification:** IMPORTANT

**Why:**
- Digests are stored but never retrieved
- Digests are never displayed in dashboard
- Digests are never consumed by user
- Digest state is unreachable

**User Impact:** MEDIUM
- Users can view digests
- Users can search digests
- Users can consume digests

**Constitutional Importance:** LOW
- Not required for constitutional kernel
- Optional for knowledge system
- Optional for PersonalOS

**Future Optionality:** MEDIUM
- Enables digest retrieval
- Enables digest consumption
- Enables knowledge system

**Implementation Cost:** LOW
- Requires digest display in dashboard
- Requires digest search in dashboard
- Estimated effort: 5 hours

**Migration Risk:** LOW
- Can rollback by removing digest display
- Can rollback by removing digest search

**Horizon:** 30 days

**Priority:** IMPORTANT

---

## CHANGE 4: Add Task Tracking

**Classification:** OPTIONAL

**Why:**
- No task tracking exists
- Tasks are not tracked
- Tasks are not prioritized
- Tasks are not scheduled

**User Impact:** MEDIUM
- Users can track tasks
- Users can prioritize tasks
- Users can schedule tasks

**Constitutional Importance:** LOW
- Not required for constitutional kernel
- Optional for knowledge system
- Optional for PersonalOS

**Future Optionality:** MEDIUM
- Enables task tracking
- Enables task prioritization
- Enables task scheduling
- Enables PersonalOS

**Implementation Cost:** MEDIUM
- Requires task tracking (tasks table)
- Requires task prioritization
- Requires task scheduling
- Estimated effort: 20 hours

**Migration Risk:** MEDIUM
- Can rollback by removing task tracking
- Can rollback by removing task prioritization
- Can rollback by removing task scheduling

**Horizon:** 30 days

**Priority:** OPTIONAL

---

## CHANGE 5: Add Decision Tracking

**Classification:** OPTIONAL

**Why:**
- No decision tracking exists
- Decisions are not tracked
- Decisions are not retrieved
- Decisions are not applied

**User Impact:** MEDIUM
- Users can track decisions
- Users can retrieve decisions
- Users can apply decisions

**Constitutional Importance:** LOW
- Not required for constitutional kernel
- Optional for knowledge system
- Optional for PersonalOS

**Future Optionality:** MEDIUM
- Enables decision tracking
- Enables decision retrieval
- Enables decision application
- Enables PersonalOS

**Implementation Cost:** MEDIUM
- Requires decision tracking (decisions table)
- Requires decision retrieval
- Requires decision application
- Estimated effort: 20 hours

**Migration Risk:** MEDIUM
- Can rollback by removing decision tracking
- Can rollback by removing decision retrieval
- Can rollback by removing decision application

**Horizon:** 30 days

**Priority:** OPTIONAL

---

## CHANGE 6: Add Entity Extraction

**Classification:** OPTIONAL

**Why:**
- No entity extraction exists
- No NER for people, organizations, locations
- No entity search exists
- No relationship extraction exists

**User Impact:** MEDIUM
- Users can search for entities
- Users can search for relationships
- Users can find people, organizations, locations

**Constitutional Importance:** LOW
- Not required for constitutional kernel
- Optional for knowledge system
- Optional for PersonalOS

**Future Optionality:** HIGH
- Enables entity search
- Enables relationship search
- Enables knowledge graph
- Enables PersonalOS

**Implementation Cost:** HIGH
- Requires entity extraction (NER)
- Requires relationship extraction
- Requires entity search
- Estimated effort: 40 hours

**Migration Risk:** MEDIUM
- Can rollback by removing entity extraction
- Can rollback by removing relationship extraction
- Can rollback by removing entity search

**Horizon:** 30 days

**Priority:** OPTIONAL

---

## CHANGE 7: Add Timeline Visualization

**Classification:** OPTIONAL

**Why:**
- No timeline visualization exists
- No event timeline exists
- No state timeline exists
- No decision timeline exists

**User Impact:** MEDIUM
- Users can view timeline of events
- Users can view timeline of state changes
- Users can view timeline of decisions

**Constitutional Importance:** LOW
- Not required for constitutional kernel
- Optional for knowledge system
- Optional for PersonalOS

**Future Optionality:** MEDIUM
- Enables timeline visualization
- Enables event timeline
- Enables state timeline
- Enables decision timeline

**Implementation Cost:** MEDIUM
- Requires timeline visualization component
- Requires event timeline
- Requires state timeline
- Estimated effort: 20 hours

**Migration Risk:** MEDIUM
- Can rollback by removing timeline visualization
- Can rollback by removing event timeline
- Can rollback by removing state timeline

**Horizon:** 30 days

**Priority:** OPTIONAL

---

## CHANGE 8: Add Event-First Architecture

**Classification:** NON-CRITICAL

**Why:**
- Events are POST-WRITE (derived from SQLite)
- Events are incomplete (10 missing event types)
- Events cannot be used for replay
- Events cannot be used for state reconstruction

**User Impact:** LOW
- Replay is invisible to users
- State reconstruction is invisible to users
- Constitutional kernel is internal capability

**Constitutional Importance:** HIGH
- Required for constitutional kernel
- Required for replay capability
- Required for state reconstruction

**Future Optionality:** HIGH
- Enables replay capability
- Enables state reconstruction
- Enables deterministic execution
- Enables constitutional kernel

**Implementation Cost:** HIGH
- Requires event-first architecture
- Requires 10 missing event types
- Requires deterministic Ollama API calls
- Estimated effort: 40 hours

**Migration Risk:** HIGH
- Cannot rollback event emission timing without data loss
- Cannot rollback deterministic Ollama API calls without data loss

**Horizon:** 30 days

**Priority:** NON-CRITICAL

---

## CHANGE 9: Add Identity Computation

**Classification:** NON-CRITICAL

**Why:**
- No identity computation exists
- No artifact IDs exist
- No canonical hashes exist
- No deduplication exists

**User Impact:** LOW
- Identity is invisible to users
- Deduplication is invisible to users
- Constitutional kernel is internal capability

**Constitutional Importance:** HIGH
- Required for constitutional kernel
- Required for artifact identification
- Required for deduplication

**Future Optionality:** HIGH
- Enables artifact identification
- Enables canonical hashing
- Enables deduplication
- Enables lineage tracking

**Implementation Cost:** MEDIUM
- Requires identity computation
- Requires canonical serialization
- Requires canonical hashing
- Estimated effort: 20 hours

**Migration Risk:** MEDIUM
- Can rollback by removing identity computation
- Can rollback by removing canonical serialization
- Can rollback by removing canonical hashing

**Horizon:** 30 days

**Priority:** NON-CRITICAL

---

## CHANGE 10: Add Lineage Tracking

**Classification:** NON-CRITICAL

**Why:**
- No lineage tracking exists
- No DAG validation exists
- No ancestry proofs exist
- No derivation tracking exists

**User Impact:** LOW
- Lineage is invisible to users
- DAG validation is invisible to users
- Constitutional kernel is internal capability

**Constitutional Importance:** HIGH
- Required for constitutional kernel
- Required for DAG validation
- Required for ancestry proofs

**Future Optionality:** HIGH
- Enables lineage tracking
- Enables DAG validation
- Enables ancestry proofs
- Enables derivation tracking

**Implementation Cost:** HIGH
- Requires lineage tracking
- Requires DAG validation
- Requires ancestry proofs
- Estimated effort: 30 hours

**Migration Risk:** HIGH
- Cannot rollback lineage tracking without data loss
- Cannot rollback DAG validation without data loss

**Horizon:** 30 days

**Priority:** NON-CRITICAL

---

## CRITICAL FINDINGS

1. **Minimum viable BrainOS requires 3 changes.** 1) Enable SQLite FTS5 for full-text search (CRITICAL, 10 hours). 2) Add article retrieval to dashboard (CRITICAL, 5 hours). 3) Add digest retrieval to dashboard (IMPORTANT, 5 hours). Total effort: 20 hours (3 days).

2. **SQLite FTS5 is CRITICAL.** Users cannot search newsletters, articles, digests. Current SQL LIKE queries are slow and imprecise. FTS5 enables fast, precise full-text search. FTS5 is required for knowledge retrieval.

3. **Article retrieval to dashboard is CRITICAL.** Articles are stored but never retrieved. Articles are never displayed in dashboard. Articles are never consumed by user. Article state is unreachable.

4. **Digest retrieval to dashboard is IMPORTANT.** Digests are stored but never retrieved. Digests are never displayed in dashboard. Digests are never consumed by user. Digest state is unreachable.

5. **Task tracking is OPTIONAL.** No task tracking exists. Task tracking is not required for constitutional kernel. Task tracking is optional for PersonalOS.

6. **Decision tracking is OPTIONAL.** No decision tracking exists. Decision tracking is not required for constitutional kernel. Decision tracking is optional for PersonalOS.

7. **Entity extraction is OPTIONAL.** No entity extraction exists. Entity extraction is not required for constitutional kernel. Entity extraction is optional for knowledge system.

8. **Timeline visualization is OPTIONAL.** No timeline visualization exists. Timeline visualization is not required for constitutional kernel. Timeline visualization is optional for knowledge system.

9. **Event-first architecture is NON-CRITICAL.** Events are POST-WRITE (derived from SQLite). Event-first architecture is required for constitutional kernel but not for minimum viable BrainOS.

10. **Identity computation is NON-CRITICAL.** No identity computation exists. Identity computation is required for constitutional kernel but not for minimum viable BrainOS.

---

## ANSWER

**CRITICAL Changes (20 hours, 3 days):**
- Enable SQLite FTS5 for full-text search (10 hours)
- Add article retrieval to dashboard (5 hours)
- Add digest retrieval to dashboard (5 hours)

**IMPORTANT Changes (5 hours, 1 day):**
- NONE (digest retrieval is classified as IMPORTANT but included in CRITICAL changes)

**OPTIONAL Changes (80 hours, 10 days):**
- Add task tracking (20 hours)
- Add decision tracking (20 hours)
- Add entity extraction (40 hours)
- Add timeline visualization (20 hours)

**NON-CRITICAL Changes (110 hours, 14 days):**
- Add event-first architecture (40 hours)
- Add identity computation (20 hours)
- Add lineage tracking (30 hours)
- Add witness computation (20 hours)

**Total Minimum Viable BrainOS Effort:** 20 hours (3 days)

**Total Optional Effort:** 80 hours (10 days)

**Total Non-Critical Effort:** 110 hours (14 days)

**Overall Minimum Viable BrainOS:** 3 changes (CRITICAL), 20 hours (3 days)
