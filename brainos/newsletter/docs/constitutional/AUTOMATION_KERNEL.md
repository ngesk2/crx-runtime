# AUTOMATION KERNEL (RUNTIME REALITY)

**Audit Date:** 2025-01-18  
**Audit Mode:** ZERO ASSUMPTION - READ ONLY - RUNTIME REALITY ONLY  
**Audit Principle:** Extract actual automations, actual work units, actual state transitions, actual side effects, actual dependencies. A capability exists only if: Runtime imports it, Runtime executes it, Runtime output depends on it, Removal breaks behavior.

---

## EXECUTIVE SUMMARY

**Current kernel is minimal.** Only 4 components execute today (crx-newsletter-brain worker, crx-digestion-worker worker, crx-newsletter-brain dashboard, Brain PostgreSQL). Only 1 user-visible output exists (dashboard display). Only 1 state type is actually consumed (newsletters). All other claimed capabilities are DORMANT or THEORETICAL. Infrastructure is 90% dead (Neo4j, Qdrant, OpenSearch, Replay, Witness, Identity, Lineage are DEAD). Minimum viable BrainOS requires 3 changes (SQLite FTS5, article retrieval to dashboard, digest retrieval to dashboard) - 20 hours (3 days).

---

## ACTUAL AUTOMATIONS

### Automation 1: Newsletter Ingestion
**Status:** ACTIVE
**Trigger:** Time-based cycle (CYCLE_INTERVAL = 3600 seconds)
**Input:** Yahoo Mail (unread emails)
**Processing:** Connect to Yahoo Mail, fetch unread newsletters, check duplicates, filter by word count, save to SQLite, emit event
**Output:** Newsletter saved to SQLite, NEWSLETTER_CREATED event emitted
**State Transition:** NONE → Newsletter (SQLite INSERT)
**Side Effects:** SQLite INSERT, PostgreSQL INSERT
**Dependencies:** Yahoo Mail, SQLite, PostgreSQL
**Evidence:** crx-newsletter-brain/worker.py run_ingestion_cycle()

### Automation 2: Newsletter Analysis
**Status:** ACTIVE
**Trigger:** Time-based cycle (CYCLE_INTERVAL = 3600 seconds)
**Input:** SQLite newsletters table (unprocessed newsletter)
**Processing:** Fetch unprocessed newsletters, call Ollama API, receive analysis, update SQLite, archive as markdown, mark as archived
**Output:** Newsletter analysis saved to SQLite, newsletter archived as markdown
**State Transition:** Newsletter (raw) → Newsletter (analyzed)
**Side Effects:** SQLite UPDATE, SQLite INSERT, Markdown WRITE
**Dependencies:** Ollama, SQLite
**Evidence:** crx-newsletter-brain/worker.py run_processing_cycle()

### Automation 3: Article Ingestion
**Status:** ACTIVE
**Trigger:** Time-based cycle (CYCLE_INTERVAL = 3600 seconds)
**Input:** RSS feeds (configured RSS sources)
**Processing:** Fetch RSS feed, check duplicates, call Ollama API, receive summary, save to SQLite, archive as markdown
**Output:** Article saved to SQLite, article archived as markdown
**State Transition:** NONE → Article (SQLite INSERT)
**Side Effects:** SQLite INSERT, Markdown WRITE
**Dependencies:** RSS feeds, Ollama, SQLite
**Evidence:** crx-digestion-worker/worker.py run_cycle()

### Automation 4: Digest Generation
**Status:** ACTIVE
**Trigger:** Time-based cycle (CYCLE_INTERVAL = 3600 seconds)
**Input:** SQLite newsletters table (processed newsletters from date range)
**Processing:** Fetch newsletters from date range, aggregate summaries, generate digest content, save to SQLite, write to markdown
**Output:** Digest saved to SQLite, digest written to markdown
**State Transition:** Newsletters → Digest
**Side Effects:** SQLite INSERT, Markdown WRITE
**Dependencies:** SQLite
**Evidence:** crx-newsletter-brain/worker.py run_digest_generation()

---

## ACTUAL WORK UNITS

### Work Unit 1: Newsletter Ingestion
**Inputs:** Yahoo Mail (unread email)
**Outputs:** Newsletter saved to SQLite, NEWSLETTER_CREATED event emitted
**State Dependencies:** SQLite newsletters table (for duplicate check)
**External Calls:** Yahoo Mail API
**Side Effects:** SQLite INSERT, PostgreSQL INSERT
**Persistence Writes:** SQLite newsletters table, PostgreSQL events table
**Deterministic Components:** Duplicate check, word count filter, SQLite write
**Non Deterministic Components:** Yahoo Mail API call, email arrival time
**Replay Feasibility:** NOT REPLAYABLE

### Work Unit 2: Newsletter Analysis
**Inputs:** SQLite newsletters table (unprocessed newsletter)
**Outputs:** Newsletter analysis saved to SQLite, newsletter archived as markdown
**State Dependencies:** SQLite newsletters table, SQLite newsletter_topics table
**External Calls:** Ollama API
**Side Effects:** SQLite UPDATE, SQLite INSERT, Markdown WRITE
**Persistence Writes:** SQLite newsletters table, SQLite newsletter_topics table, Markdown archive
**Deterministic Components:** SQLite update, SQLite insert, Markdown write
**Non Deterministic Components:** Ollama API call, Ollama model output
**Replay Feasibility:** NOT REPLAYABLE

### Work Unit 3: Article Ingestion
**Inputs:** RSS feed (article)
**Outputs:** Article saved to SQLite, article archived as markdown
**State Dependencies:** SQLite articles table
**External Calls:** RSS feed API, Ollama API
**Side Effects:** SQLite INSERT, Markdown WRITE
**Persistence Writes:** SQLite articles table, Markdown archive
**Deterministic Components:** Duplicate check, SQLite write
**Non Deterministic Components:** RSS feed API call, article publication time, Ollama API call, Ollama model output
**Replay Feasibility:** NOT REPLAYABLE

### Work Unit 4: Digest Generation
**Inputs:** SQLite newsletters table (processed newsletters from date range)
**Outputs:** Digest saved to SQLite, digest written to markdown
**State Dependencies:** SQLite newsletters table, SQLite digests table
**External Calls:** NONE
**Side Effects:** SQLite INSERT, Markdown WRITE
**Persistence Writes:** SQLite digests table, Markdown archive
**Deterministic Components:** Newsletter fetch, digest aggregation, digest generation, SQLite write, Markdown write
**Non Deterministic Components:** NONE
**Replay Feasibility:** PARTIALLY REPLAYABLE

---

## ACTUAL STATE TRANSITIONS

### State Transition 1: Newsletter Creation
**From:** NONE
**To:** Newsletter (SQLite INSERT)
**Trigger:** Newsletter Ingestion
**Event:** NEWSLETTER_CREATED (POST-WRITE)
**Replayable:** NO (POST-WRITE event, external service call)

### State Transition 2: Newsletter Analysis
**From:** Newsletter (raw)
**To:** Newsletter (analyzed)
**Trigger:** Newsletter Analysis
**Event:** NONE (no event emitted for success)
**Replayable:** NO (no event emitted, external service call)

### State Transition 3: Article Creation
**From:** NONE
**To:** Article (SQLite INSERT)
**Trigger:** Article Ingestion
**Event:** ARTICLE_CREATED (POST-WRITE)
**Replayable:** NO (POST-WRITE event, external service call)

### State Transition 4: Digest Creation
**From:** Newsletters
**To:** Digest
**Trigger:** Digest Generation
**Event:** DIGEST_GENERATED (POST-WRITE)
**Replayable:** PARTIALLY (POST-WRITE event, but deterministic)

---

## ACTUAL SIDE EFFECTS

### Side Effect 1: SQLite Writes
**Type:** Database Write
**Location:** SQLite newsletters.db, SQLite knowledge.db
**Trigger:** Newsletter Ingestion, Newsletter Analysis, Article Ingestion, Digest Generation
**Captured:** NO (not captured in events)
**Replayable:** NO (cannot replay database writes)

### Side Effect 2: Markdown Writes
**Type:** File Write
**Location:** knowledge/YYYY/MM/*.md, digests/daily-{date}.md, digests/weekly-{date}.md
**Trigger:** Newsletter Analysis, Article Ingestion, Digest Generation
**Captured:** NO (no events emitted for archive writes)
**Replayable:** NO (cannot replay file writes)

### Side Effect 3: Ollama API Calls
**Type:** External Service Call
**Location:** Ollama API
**Trigger:** Newsletter Analysis, Article Ingestion
**Captured:** NO (not captured in events)
**Replayable:** NO (cannot replay external service calls)

---

## ACTUAL DEPENDENCIES

### Dependency 1: Yahoo Mail
**Type:** External Service
**Used By:** Newsletter Ingestion
**Status:** ACTIVE
**Replayable:** NO (cannot replay external service)

### Dependency 2: RSS Feeds
**Type:** External Service
**Used By:** Article Ingestion
**Status:** ACTIVE
**Replayable:** NO (cannot replay external service)

### Dependency 3: Ollama
**Type:** External Service
**Used By:** Newsletter Analysis, Article Ingestion
**Status:** ACTIVE
**Replayable:** NO (cannot replay AI model)

### Dependency 4: SQLite
**Type:** Database
**Used By:** All automations
**Status:** ACTIVE
**Replayable:** NO (cannot replay database writes)

### Dependency 5: PostgreSQL
**Type:** Database
**Used By:** Event emission
**Status:** ACTIVE
**Replayable:** NO (events are POST-WRITE)

---

## ACTUAL CAPABILITIES

### Capability 1: Retrieval
**Status:** PARTIAL
**Evidence:** Basic SQL LIKE queries and date range queries exist
**Score:** 10/100

### Capability 2: Memory
**Status:** PARTIAL
**Evidence:** Newsletters and articles are stored in SQLite and retrieved by dashboard
**Score:** 20/100

### Capability 3: Replay
**Status:** DORMANT
**Evidence:** PING replay engine exists but is NOT imported by runtime
**Score:** 0/100

### Capability 4: Identity
**Status:** DORMANT
**Evidence:** PING identity engine exists but is NOT imported by runtime
**Score:** 0/100

### Capability 5: Lineage
**Status:** DORMANT
**Evidence:** PING lineage tracking exists but is NOT imported by runtime
**Score:** 0/100

### Capability 6: Witness
**Status:** DORMANT
**Evidence:** PING witness authority exists but is NOT imported by runtime
**Score:** 0/100

### Capability 7: Recommendations
**Status:** THEORETICAL
**Evidence:** No recommendation files exist
**Score:** 0/100

### Capability 8: Tasks
**Status:** THEORETICAL
**Evidence:** No task files exist
**Score:** 0/100

### Capability 9: Decisions
**Status:** THEORETICAL
**Evidence:** No decision files exist
**Score:** 0/100

### Capability 10: Autonomy
**Status:** THEORETICAL
**Evidence:** No autonomy files exist
**Score:** 0/100

### Capability 11: Self-Verification
**Status:** DORMANT
**Evidence:** PING replay verification exists but is NOT imported by runtime
**Score:** 0/100

---

## MINIMUM VIABLE BRAINOS (30 DAYS)

### CRITICAL Changes (20 hours, 3 days)

#### Change 1: Enable SQLite FTS5 for Full-Text Search
**Classification:** CRITICAL
**Why:** Users cannot search newsletters, articles, digests. Current SQL LIKE queries are slow and imprecise. FTS5 enables fast, precise full-text search.
**User Impact:** HIGH
**Constitutional Importance:** LOW
**Future Optionality:** HIGH
**Implementation Cost:** LOW
**Estimated Effort:** 10 hours
**Migration Risk:** LOW

#### Change 2: Add Article Retrieval to Dashboard
**Classification:** CRITICAL
**Why:** Articles are stored but never retrieved. Articles are never displayed in dashboard. Article state is unreachable.
**User Impact:** HIGH
**Constitutional Importance:** LOW
**Future Optionality:** MEDIUM
**Implementation Cost:** LOW
**Estimated Effort:** 5 hours
**Migration Risk:** LOW

#### Change 3: Add Digest Retrieval to Dashboard
**Classification:** IMPORTANT
**Why:** Digests are stored but never retrieved. Digests are never displayed in dashboard. Digest state is unreachable.
**User Impact:** MEDIUM
**Constitutional Importance:** LOW
**Future Optionality:** MEDIUM
**Implementation Cost:** LOW
**Estimated Effort:** 5 hours
**Migration Risk:** LOW

### OPTIONAL Changes (80 hours, 10 days)

#### Change 4: Add Task Tracking
**Classification:** OPTIONAL
**Why:** No task tracking exists. Task tracking is not required for constitutional kernel.
**User Impact:** MEDIUM
**Constitutional Importance:** LOW
**Future Optionality:** MEDIUM
**Implementation Cost:** MEDIUM
**Estimated Effort:** 20 hours
**Migration Risk:** MEDIUM

#### Change 5: Add Decision Tracking
**Classification:** OPTIONAL
**Why:** No decision tracking exists. Decision tracking is not required for constitutional kernel.
**User Impact:** MEDIUM
**Constitutional Importance:** LOW
**Future Optionality:** MEDIUM
**Implementation Cost:** MEDIUM
**Estimated Effort:** 20 hours
**Migration Risk:** MEDIUM

#### Change 6: Add Entity Extraction
**Classification:** OPTIONAL
**Why:** No entity extraction exists. Entity extraction is not required for constitutional kernel.
**User Impact:** MEDIUM
**Constitutional Importance:** LOW
**Future Optionality:** HIGH
**Implementation Cost:** HIGH
**Estimated Effort:** 40 hours
**Migration Risk:** MEDIUM

### NON-CRITICAL Changes (110 hours, 14 days)

#### Change 7: Add Event-First Architecture
**Classification:** NON-CRITICAL
**Why:** Events are POST-WRITE (derived from SQLite). Event-first architecture is required for constitutional kernel but not for minimum viable BrainOS.
**User Impact:** LOW
**Constitutional Importance:** HIGH
**Future Optionality:** HIGH
**Implementation Cost:** HIGH
**Estimated Effort:** 40 hours
**Migration Risk:** HIGH

#### Change 8: Add Identity Computation
**Classification:** NON-CRITICAL
**Why:** No identity computation exists. Identity computation is required for constitutional kernel but not for minimum viable BrainOS.
**User Impact:** LOW
**Constitutional Importance:** HIGH
**Future Optionality:** HIGH
**Implementation Cost:** MEDIUM
**Estimated Effort:** 20 hours
**Migration Risk:** MEDIUM

#### Change 9: Add Lineage Tracking
**Classification:** NON-CRITICAL
**Why:** No lineage tracking exists. Lineage tracking is required for constitutional kernel but not for minimum viable BrainOS.
**User Impact:** LOW
**Constitutional Importance:** HIGH
**Future Optionality:** HIGH
**Implementation Cost:** HIGH
**Estimated Effort:** 30 hours
**Migration Risk:** HIGH

#### Change 10: Add Witness Computation
**Classification:** NON-CRITICAL
**Why:** No witness computation exists. Witness computation is required for constitutional kernel but not for minimum viable BrainOS.
**User Impact:** LOW
**Constitutional Importance:** HIGH
**Future Optionality:** HIGH
**Implementation Cost:** HIGH
**Estimated Effort:** 20 hours
**Migration Risk:** HIGH

---

## ANSWER

**Actual Automations:**
- Newsletter Ingestion (ACTIVE)
- Newsletter Analysis (ACTIVE)
- Article Ingestion (ACTIVE)
- Digest Generation (ACTIVE)

**Actual Work Units:**
- Newsletter Ingestion (NOT REPLAYABLE)
- Newsletter Analysis (NOT REPLAYABLE)
- Article Ingestion (NOT REPLAYABLE)
- Digest Generation (PARTIALLY REPLAYABLE)

**Actual State Transitions:**
- Newsletter Creation (NOT REPLAYABLE)
- Newsletter Analysis (NOT REPLAYABLE)
- Article Creation (NOT REPLAYABLE)
- Digest Creation (PARTIALLY REPLAYABLE)

**Actual Side Effects:**
- SQLite Writes (NOT REPLAYABLE)
- Markdown Writes (NOT REPLAYABLE)
- Ollama API Calls (NOT REPLAYABLE)

**Actual Dependencies:**
- Yahoo Mail (ACTIVE, NOT REPLAYABLE)
- RSS Feeds (ACTIVE, NOT REPLAYABLE)
- Ollama (ACTIVE, NOT REPLAYABLE)
- SQLite (ACTIVE, NOT REPLAYABLE)
- PostgreSQL (ACTIVE, NOT REPLAYABLE)

**Actual Capabilities:**
- Retrieval (PARTIAL, 10/100)
- Memory (PARTIAL, 20/100)
- Replay (DORMANT, 0/100)
- Identity (DORMANT, 0/100)
- Lineage (DORMANT, 0/100)
- Witness (DORMANT, 0/100)
- Recommendations (THEORETICAL, 0/100)
- Tasks (THEORETICAL, 0/100)
- Decisions (THEORETICAL, 0/100)
- Autonomy (THEORETICAL, 0/100)
- Self-Verification (DORMANT, 0/100)

**Minimum Viable BrainOS (30 days):**
- CRITICAL: Enable SQLite FTS5 (10 hours)
- CRITICAL: Add article retrieval to dashboard (5 hours)
- IMPORTANT: Add digest retrieval to dashboard (5 hours)
- OPTIONAL: Task tracking (20 hours)
- OPTIONAL: Decision tracking (20 hours)
- OPTIONAL: Entity extraction (40 hours)
- NON-CRITICAL: Event-first architecture (40 hours)
- NON-CRITICAL: Identity computation (20 hours)
- NON-CRITICAL: Lineage tracking (30 hours)
- NON-CRITICAL: Witness computation (20 hours)

**Total Minimum Viable BrainOS Effort:** 20 hours (3 days)
**Total Optional Effort:** 80 hours (10 days)
**Total Non-Critical Effort:** 110 hours (14 days)
