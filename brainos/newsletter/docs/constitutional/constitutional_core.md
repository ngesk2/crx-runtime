# CONSTITUTIONAL CORE EXTRACTION

**Audit Date:** 2025-01-18  
**Audit Mode:** ZERO ASSUMPTION - READ ONLY  
**Audit Principle:** Determine the minimum set of components required to preserve current behavior.

---

## EXECUTIVE SUMMARY

**Constitutional core is minimal.** Only Events (Brain/event_emitter.py), Storage (SQLite, PostgreSQL events table), Summarization (Ollama), Digest Generation, and Archival are REQUIRED. Retrieval, Recommendations, Replay, Witness, Lineage, and Identity are ABSENT. PING primitives are ABSENT.

---

## CATEGORY: Events

**Components:**
- Brain/src/constitutional/event_emitter.py
- PostgreSQL events table

**Classification:** REQUIRED

**Evidence:**
- crx-newsletter-brain/database.py imports emit_newsletter_created, emit_digest_generated, emit_newsletter_processing_failed, emit_database_write_failed
- crx-newsletter-brain/worker.py imports emit_event
- crx-digestion-worker/database.py imports emit_article_created, emit_article_processing_failed, emit_database_write_failed
- crx-digestion-worker/worker.py imports emit_event
- Events are emitted on every database mutation
- Events are emitted on every worker cycle

**Status:** ACTIVE
- Implementation exists
- Runtime execution exists
- Application consumers exist
- Code is used

---

## CATEGORY: Storage

**Components:**
- SQLite (newsletters.db)
- SQLite (knowledge.db)
- PostgreSQL events table
- Markdown files (knowledge/YYYY/MM/*.md)
- Markdown files (digests/daily-{date}.md, digests/weekly-{date}.md)

**Classification:** REQUIRED

**Evidence:**
- crx-newsletter-brain/database.py uses SQLite (newsletters.db) for newsletters and digests
- crx-digestion-worker/database.py uses SQLite (knowledge.db) for articles and sources
- Brain/event_emitter.py uses PostgreSQL events table for event logging
- crx-newsletter-brain/archive.py writes to markdown files
- crx-digestion-worker/archive.py writes to markdown files
- SQLite is authoritative storage
- PostgreSQL events table is event log

**Status:** ACTIVE
- Implementation exists
- Runtime execution exists
- Application consumers exist
- Code is used

---

## CATEGORY: Summarization

**Components:**
- crx-newsletter-brain/summarizer.py
- crx-digestion-worker/summarizer.py
- Ollama (external service)

**Classification:** REQUIRED

**Evidence:**
- crx-newsletter-brain/worker.py calls summarizer.analyze_newsletter()
- crx-digestion-worker/worker.py calls summarizer.process_article()
- Ollama is called for newsletter analysis
- Ollama is called for article summarization
- Summarization is a critical part of the processing pipeline

**Status:** ACTIVE
- Implementation exists
- Runtime execution exists
- Application consumers exist
- Code is used

---

## CATEGORY: Digest Generation

**Components:**
- crx-newsletter-brain/digest_generator.py

**Classification:** REQUIRED

**Evidence:**
- crx-newsletter-brain/worker.py calls digest_generator.generate_daily_digest()
- crx-newsletter-brain/worker.py calls digest_generator.generate_weekly_report()
- Digest generation is called after newsletter processing
- Digests are written to SQLite and markdown

**Status:** ACTIVE
- Implementation exists
- Runtime execution exists
- Application consumers exist
- Code is used

---

## CATEGORY: Archival

**Components:**
- crx-newsletter-brain/archive.py
- crx-digestion-worker/archive.py

**Classification:** REQUIRED

**Evidence:**
- crx-newsletter-brain/worker.py calls archive.archive_newsletter()
- crx-digestion-worker/worker.py calls archive.archive_article()
- Archives are written to markdown files
- Archives are emitted as events

**Status:** ACTIVE
- Implementation exists
- Runtime execution exists
- Application consumers exist
- Code is used

---

## CATEGORY: Retrieval

**Components:**
- NONE

**Classification:** ABSENT

**Evidence:**
- No FTS exists
- No entity search exists
- No relationship search exists
- No timeline search exists
- No PARA search exists
- No graph traversal exists
- Only basic SQL LIKE queries exist

**Status:** ABSENT
- Implementation does not exist
- Runtime execution does not exist
- Application consumers do not exist
- Code is not used

---

## CATEGORY: Recommendations

**Components:**
- NONE

**Classification:** ABSENT

**Evidence:**
- No recommendation engine exists
- No priority ranking exists
- No task tracking exists
- No decision tracking exists
- No pattern detection exists

**Status:** ABSENT
- Implementation does not exist
- Runtime execution does not exist
- Application consumers do not exist
- Code is not used

---

## CATEGORY: Replay

**Components:**
- PING/runtime/replay/deterministic_replay_engine.ts
- PING/runtime/replay/replay_state_machine.ts
- PING/runtime/replay/replay_event_stream.ts
- PING/runtime/replay/replay_verification.ts

**Classification:** ABSENT

**Evidence:**
- No applications import PING replay engine
- No replay occurs in applications
- PING replay engine is dormant code
- Events are not replayed
- State is not reconstructed from events

**Status:** ABSENT
- Implementation exists but is not used
- Runtime execution does not exist
- Application consumers do not exist
- Code is dormant

---

## CATEGORY: Witness

**Components:**
- PING/runtime/replay/witness_authority.ts
- PING/runtime/replay/merkle_tree.ts
- PING/runtime/replay/canonical_certificate.ts

**Classification:** ABSENT

**Evidence:**
- No applications import PING witness authority
- No witness computation occurs in applications
- PING witness authority is dormant code
- No witness roots are generated
- No Merkle trees are computed

**Status:** ABSENT
- Implementation exists but is not used
- Runtime execution does not exist
- Application consumers do not exist
- Code is dormant

---

## CATEGORY: Lineage

**Components:**
- PING/runtime/replay/graph_validator.ts
- PING/runtime/kernel/commit-service/src/validation/dag_validator.ts
- PING/runtime/kernel/commit-service/src/persistence/lineage_store.ts

**Classification:** ABSENT

**Evidence:**
- No applications import PING lineage tracking
- No lineage tracking occurs in applications
- PING lineage tracking is dormant code
- No lineage edges are stored
- No DAG validation occurs

**Status:** ABSENT
- Implementation exists but is not used
- Runtime execution does not exist
- Application consumers do not exist
- Code is dormant

---

## CATEGORY: Identity

**Components:**
- PING/runtime/kernel/commit-service/src/engines/identity_engine.ts
- PING/runtime/replay/replay_types.ts (branded types)

**Classification:** ABSENT

**Evidence:**
- No applications import PING identity engine
- No identity computation occurs in applications
- PING identity engine is dormant code
- No canonical hashes are computed
- No artifact IDs are generated

**Status:** ABSENT
- Implementation exists but is not used
- Runtime execution does not exist
- Application consumers do not exist
- Code is dormant

---

## CRITICAL FINDINGS

1. **Constitutional core is minimal.** Only Events, Storage, Summarization, Digest Generation, and Archival are REQUIRED. All other categories are ABSENT.

2. **PING primitives are ABSENT.** Replay, Witness, Lineage, and Identity exist in PING but are not used by applications. They are ABSENT from the actual runtime.

3. **Retrieval is ABSENT.** No FTS, no entity search, no relationship search, no timeline search, no PARA search, no graph traversal exists.

4. **Recommendations are ABSENT.** No recommendation engine, no priority ranking, no task tracking, no decision tracking, no pattern detection exists.

5. **Events are REQUIRED.** Brain/event_emitter.py is required for event emission. PostgreSQL events table is required for event logging.

6. **Storage is REQUIRED.** SQLite (newsletters.db, knowledge.db) is required for authoritative storage. PostgreSQL events table is required for event logging. Markdown files are required for archival.

7. **Summarization is REQUIRED.** Ollama is required for newsletter analysis and article summarization.

8. **Digest Generation is REQUIRED.** digest_generator.py is required for daily digest and weekly report generation.

9. **Archival is REQUIRED.** archive.py is required for markdown archival.

---

## ANSWER

**Required Components:**
- Events: Brain/event_emitter.py, PostgreSQL events table (REQUIRED)
- Storage: SQLite (newsletters.db), SQLite (knowledge.db), PostgreSQL events table, Markdown files (REQUIRED)
- Summarization: crx-newsletter-brain/summarizer.py, crx-digestion-worker/summarizer.py, Ollama (REQUIRED)
- Digest Generation: crx-newsletter-brain/digest_generator.py (REQUIRED)
- Archival: crx-newsletter-brain/archive.py, crx-digestion-worker/archive.py (REQUIRED)

**Optional Components:**
- NONE (all required components are required)

**Unused Components:**
- Retrieval: ABSENT
- Recommendations: ABSENT
- Replay: PING replay engine (DORMANT)
- Witness: PING witness authority (DORMANT)
- Lineage: PING lineage tracking (DORMANT)
- Identity: PING identity engine (DORMANT)

**Constitutional Core:**
- Events (Brain/event_emitter.py, PostgreSQL events table)
- Storage (SQLite, PostgreSQL events table, Markdown files)
- Summarization (Ollama)
- Digest Generation (digest_generator.py)
- Archival (archive.py)

**Constitutional Core Classification:**
- Events: ACTIVE
- Storage: ACTIVE
- Summarization: ACTIVE
- Digest Generation: ACTIVE
- Archival: ACTIVE
- Retrieval: ABSENT
- Recommendations: ABSENT
- Replay: ABSENT
- Witness: ABSENT
- Lineage: ABSENT
- Identity: ABSENT
