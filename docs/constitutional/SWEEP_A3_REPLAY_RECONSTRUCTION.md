# SWEEP A3 — PERSISTENCE & REPLAY AUDIT

**Audit Date:** 2026-06-18  
**Audit Mode:** ZERO ASSUMPTION — READ ONLY — RUNTIME REALITY ONLY  
**Audit Principle:** Determine whether application state is reconstructable exclusively from authoritative events.

---

## EXECUTIVE SUMMARY

**PRIMARY OBJECTIVE:** Determine whether application state can be rebuilt if all projections disappear and only the event log remains.

**FINAL DETERMINATION:** Application state CANNOT be reconstructed exclusively from authoritative events. Event log is descriptive, not authoritative. PING is not sovereign.

**KEY FINDINGS:**
- CRX Newsletter Brain: State stored in SQLite (newsletters.db) - NOT reconstructable from events
- CRX Newsletter Brain: State stored in Markdown files (knowledge/YYYY/MM/*.md) - NOT reconstructable from events
- CRX Newsletter Brain: State stored in digest files (digests/*.md) - NOT reconstructable from events
- CRX Digestion Worker: State stored in SQLite (knowledge.db) - NOT reconstructable from events
- CRX Digestion Worker: State stored in Markdown files (knowledge/YYYY/MM/*.md) - NOT reconstructable from events
- PING Gateway: State stored in PostgreSQL (crx_runtime events table) - Events are descriptive, not authoritative
- No application uses event-sourcing architecture
- No application derives state from events
- No application can reconstruct state from events alone

---

## STATE OWNERSHIP MATRIX

| System | State Type | Event Exists | Replay Possible | Missing Event Coverage | Status |
| ------ | ---------- | ------------ | --------------- | --------------------- | ------ |
| CRX Newsletter Brain | SQLite (newsletters.db) | YES (PostgreSQL events table) | NO | All state mutations are NOT in events | FAIL |
| CRX Newsletter Brain | Markdown (knowledge/YYYY/MM/*.md) | YES (PostgreSQL events table) | NO | File writes are NOT in events | FAIL |
| CRX Newsletter Brain | Digest files (digests/*.md) | YES (PostgreSQL events table) | NO | File writes are NOT in events | FAIL |
| CRX Digestion Worker | SQLite (knowledge.db) | YES (PostgreSQL events table) | NO | All state mutations are NOT in events | FAIL |
| CRX Digestion Worker | Markdown (knowledge/YYYY/MM/*.md) | YES (PostgreSQL events table) | NO | File writes are NOT in events | FAIL |
| PING Gateway | PostgreSQL (crx_runtime events table) | YES (events table) | NO | Events are descriptive, not authoritative | FAIL |

---

## DETAILED EVIDENCE

### CRX Newsletter Brain

#### State Type: SQLite (newsletters.db)

**File:** database.py  
**Database:** newsletters.db  
**Tables:** newsletters, newsletter_topics, digests

**Event Coverage:**
- Events exist in PostgreSQL (crx_runtime events table)
- Events emitted: NEWSLETTER_CREATED, DIGEST_GENERATED, NEWSLETTER_PROCESSING_FAILED, DATABASE_WRITE_FAILED
- Events are descriptive (logging), not authoritative (state derivation)

**Replay Test:**
**Question:** If newsletters.db disappears, can state be rebuilt from events?

**Answer:** NO

**Evidence:**
- Events contain partial state (newsletter object in NEWSLETTER_CREATED event)
- Events do NOT contain all state mutations (UPDATE operations are not fully captured)
- Events do NOT contain schema information
- Events do NOT contain index information
- Events do NOT contain constraint information
- Events do NOT contain trigger information
- Events do NOT contain view information
- Events do NOT contain materialized view information
- Events are NOT used for state reconstruction
- Events are NOT used for event-sourcing
- Events are NOT used for CQRS
- Events are NOT used for replay

**Missing Event Coverage:**
- SQLite INSERT operations are NOT fully captured in events
- SQLite UPDATE operations are NOT fully captured in events
- SQLite DELETE operations are NOT captured in events
- SQLite schema changes are NOT captured in events
- SQLite index changes are NOT captured in events
- SQLite constraint changes are NOT captured in events

**Status:** FAIL - State CANNOT be reconstructed from events

---

#### State Type: Markdown (knowledge/YYYY/MM/*.md)

**File:** archive.py  
**Directory:** knowledge/YYYY/MM/*.md  
**Function:** archive_newsletter

**Event Coverage:**
- Events exist in PostgreSQL (crx_runtime events table)
- Events emitted: NEWSLETTER_CREATED, ARCHIVE_WRITTEN
- Events are descriptive (logging), not authoritative (state derivation)

**Replay Test:**
**Question:** If knowledge/YYYY/MM/*.md files disappear, can state be rebuilt from events?

**Answer:** NO

**Evidence:**
- Events contain partial state (newsletter object in NEWSLETTER_CREATED event)
- Events do NOT contain file content
- Events do NOT contain file path
- Events do NOT contain file metadata
- Events do NOT contain file permissions
- Events do NOT contain file ownership
- Events do NOT contain file timestamps
- Events are NOT used for state reconstruction
- Events are NOT used for file reconstruction
- Events are NOT used for replay

**Missing Event Coverage:**
- File writes are NOT fully captured in events
- File content is NOT captured in events
- File path is NOT captured in events
- File metadata is NOT captured in events

**Status:** FAIL - State CANNOT be reconstructed from events

---

#### State Type: Digest files (digests/*.md)

**File:** digest_generator.py  
**Directory:** digests/*.md  
**Function:** generate_daily_digest, generate_weekly_report

**Event Coverage:**
- Events exist in PostgreSQL (crx_runtime events table)
- Events emitted: DIGEST_GENERATED
- Events are descriptive (logging), not authoritative (state derivation)

**Replay Test:**
**Question:** If digests/*.md files disappear, can state be rebuilt from events?

**Answer:** NO

**Evidence:**
- Events contain partial state (digest object in DIGEST_GENERATED event)
- Events do NOT contain digest content
- Events do NOT contain digest path
- Events do NOT contain digest metadata
- Events do NOT contain digest permissions
- Events do NOT contain digest ownership
- Events do NOT contain digest timestamps
- Events are NOT used for state reconstruction
- Events are NOT used for digest reconstruction
- Events are NOT used for replay

**Missing Event Coverage:**
- File writes are NOT fully captured in events
- File content is NOT captured in events
- File path is NOT captured in events
- File metadata is NOT captured in events

**Status:** FAIL - State CANNOT be reconstructed from events

---

### CRX Digestion Worker

#### State Type: SQLite (knowledge.db)

**File:** database.py  
**Database:** knowledge.db  
**Tables:** articles, sources

**Event Coverage:**
- Events exist in PostgreSQL (crx_runtime events table)
- Events emitted: ARTICLE_CREATED, ARTICLE_PROCESSING_FAILED, DATABASE_WRITE_FAILED
- Events are descriptive (logging), not authoritative (state derivation)

**Replay Test:**
**Question:** If knowledge.db disappears, can state be rebuilt from events?

**Answer:** NO

**Evidence:**
- Events contain partial state (article object in ARTICLE_CREATED event)
- Events do NOT contain all state mutations (UPDATE operations are not fully captured)
- Events do NOT contain schema information
- Events do NOT contain index information
- Events do NOT contain constraint information
- Events do NOT contain trigger information
- Events do NOT contain view information
- Events do NOT contain materialized view information
- Events are NOT used for state reconstruction
- Events are NOT used for event-sourcing
- Events are NOT used for CQRS
- Events are NOT used for replay

**Missing Event Coverage:**
- SQLite INSERT operations are NOT fully captured in events
- SQLite UPDATE operations are NOT fully captured in events
- SQLite DELETE operations are NOT captured in events
- SQLite schema changes are NOT captured in events
- SQLite index changes are NOT captured in events
- SQLite constraint changes are NOT captured in events

**Status:** FAIL - State CANNOT be reconstructed from events

---

#### State Type: Markdown (knowledge/YYYY/MM/*.md)

**File:** archive.py  
**Directory:** knowledge/YYYY/MM/*.md  
**Function:** archive_article

**Event Coverage:**
- Events exist in PostgreSQL (crx_runtime events table)
- Events emitted: ARTICLE_CREATED, ARCHIVE_WRITTEN
- Events are descriptive (logging), not authoritative (state derivation)

**Replay Test:**
**Question:** If knowledge/YYYY/MM/*.md files disappear, can state be rebuilt from events?

**Answer:** NO

**Evidence:**
- Events contain partial state (article object in ARTICLE_CREATED event)
- Events do NOT contain file content
- Events do NOT contain file path
- Events do NOT contain file metadata
- Events do NOT contain file permissions
- Events do NOT contain file ownership
- Events do NOT contain file timestamps
- Events are NOT used for state reconstruction
- Events are NOT used for file reconstruction
- Events are NOT used for replay

**Missing Event Coverage:**
- File writes are NOT fully captured in events
- File content is NOT captured in events
- File path is NOT captured in events
- File metadata is NOT captured in events

**Status:** FAIL - State CANNOT be reconstructed from events

---

### PING Gateway

#### State Type: PostgreSQL (crx_runtime events table)

**File:** event_emitter.js  
**Database:** crx_runtime  
**Table:** events

**Event Coverage:**
- Events exist in PostgreSQL (crx_runtime events table)
- Events emitted: INFERENCE_REQUEST, INFERENCE_RESPONSE, INFERENCE_FAILED
- Events are descriptive (logging), not authoritative (state derivation)

**Replay Test:**
**Question:** If crx_runtime events table disappears, can state be rebuilt from events?

**Answer:** N/A (events table IS the state)

**Evidence:**
- Events table IS the state
- Events are NOT used for state reconstruction
- Events are NOT used for event-sourcing
- Events are NOT used for CQRS
- Events are NOT used for replay
- Events are descriptive (logging), not authoritative (state derivation)

**Missing Event Coverage:**
- N/A (events table IS the state)

**Status:** FAIL - Events are descriptive, not authoritative

---

## DELETION THOUGHT EXPERIMENT

### Scenario: Remove all projections, retain only event log

**Remove:**
- SQLite (newsletters.db, knowledge.db)
- Markdown files (knowledge/YYYY/MM/*.md, digests/*.md)
- Caches
- Indexes
- Views
- Materialized views

**Retain:**
- PostgreSQL (crx_runtime events table)

**Question:** Can state be rebuilt from events?

**Answer:** NO

**Evidence:**
- Events contain partial state (newsletter object, article object, digest object)
- Events do NOT contain all state mutations (UPDATE operations are not fully captured)
- Events do NOT contain schema information
- Events do NOT contain index information
- Events do NOT contain constraint information
- Events do NOT contain file content
- Events do NOT contain file path
- Events do NOT contain file metadata
- Events are NOT used for state reconstruction
- Events are NOT used for event-sourcing
- Events are NOT used for CQRS
- Events are NOT used for replay

**Conclusion:** Event log = descriptive, NOT authoritative

---

## REPLAY GAPS

### CRX Newsletter Brain

**Replay Gaps:**
- SQLite INSERT operations are NOT fully captured in events
- SQLite UPDATE operations are NOT fully captured in events
- SQLite DELETE operations are NOT captured in events
- SQLite schema changes are NOT captured in events
- SQLite index changes are NOT captured in events
- SQLite constraint changes are NOT captured in events
- File writes are NOT fully captured in events
- File content is NOT captured in events
- File path is NOT captured in events
- File metadata is NOT captured in events

**Projection-Only State:**
- newsletters.db (SQLite database)
- knowledge/YYYY/MM/*.md (Markdown files)
- digests/*.md (Digest files)

**Authoritative State:**
- None (events are descriptive, not authoritative)

---

### CRX Digestion Worker

**Replay Gaps:**
- SQLite INSERT operations are NOT fully captured in events
- SQLite UPDATE operations are NOT fully captured in events
- SQLite DELETE operations are NOT captured in events
- SQLite schema changes are NOT captured in events
- SQLite index changes are NOT captured in events
- SQLite constraint changes are NOT captured in events
- File writes are NOT fully captured in events
- File content is NOT captured in events
- File path is NOT captured in events
- File metadata is NOT captured in events

**Projection-Only State:**
- knowledge.db (SQLite database)
- knowledge/YYYY/MM/*.md (Markdown files)

**Authoritative State:**
- None (events are descriptive, not authoritative)

---

### PING Gateway

**Replay Gaps:**
- Events are descriptive (logging), not authoritative (state derivation)
- Events are NOT used for state reconstruction
- Events are NOT used for event-sourcing
- Events are NOT used for CQRS
- Events are NOT used for replay

**Projection-Only State:**
- None (events table IS the state)

**Authoritative State:**
- None (events are descriptive, not authoritative)

---

## CONCLUSION

**Replay Completeness Status:**

- CRX Newsletter Brain: FAIL - State CANNOT be reconstructed from events
- CRX Digestion Worker: FAIL - State CANNOT be reconstructed from events
- PING Gateway: FAIL - Events are descriptive, not authoritative

**Final Determination:** Application state CANNOT be reconstructed exclusively from authoritative events. Event log is descriptive, not authoritative. PING is not sovereign.

**Constitutional Requirement:** For PING to be sovereign, applications MUST use event-sourcing architecture:
1. Events are authoritative (state derived from events)
2. Events contain all state mutations
3. Events contain all schema changes
4. Events contain all index changes
5. Events contain all constraint changes
6. Events contain all file writes
7. Events contain all file content
8. Events contain all file metadata
9. State is reconstructable from events alone
10. Projections are derived from events

**Current Reality:** Applications do NOT use event-sourcing architecture:
1. Events are descriptive (logging), not authoritative (state derivation)
2. Events do NOT contain all state mutations
3. Events do NOT contain schema information
4. Events do NOT contain index information
5. Events do NOT contain constraint information
6. Events do NOT contain file writes
7. Events do NOT contain file content
8. Events do NOT contain file metadata
9. State is NOT reconstructable from events alone
10. Projections are authoritative, events are descriptive

**Conclusion:** PING is not sovereign because applications do NOT use event-sourcing architecture. Event log is descriptive, not authoritative. State cannot be reconstructed from events alone.
