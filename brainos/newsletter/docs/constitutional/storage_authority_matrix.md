# STORAGE AUTHORITY MATRIX

**Audit Date:** 2025-01-18  
**Audit Mode:** ZERO ASSUMPTION - READ ONLY  
**Audit Principle:** Enumerate all storage systems and determine writes, reads, active consumers, and authoritative status.

---

## EXECUTIVE SUMMARY

**SQLite is the system of record.** SQLite (newsletters.db, knowledge.db) is authoritative for newsletters, articles, sources, and digests. PostgreSQL events table is derived (events are emitted after SQLite writes). Markdown archives are archives (written but never read). Qdrant, Neo4j, OpenSearch, DuckDB are unused.

---

## STORAGE SYSTEM: SQLite (newsletters.db)

**Location:** c:\Users\nolan\CascadeProjects\crx-newsletter-brain\newsletters.db

**Tables:**
- newsletters (message_id, subject, sender, body, word_count, received_at, processed_at, summary, tags, key_ideas, actionable_insights, archived)
- digests (type, date, content, generated_at, newsletter_count)
- newsletter_topics (article_id, topic, confidence, created_at)

**Writes:**
- crx-newsletter-brain/database.py save_raw_newsletter() writes to newsletters table
- crx-newsletter-brain/database.py update_newsletter_analysis() writes to newsletters table
- crx-newsletter-brain/database.py mark_newsletter_archived() writes to newsletters table
- crx-newsletter-brain/database.py save_digest() writes to digests table
- crx-newsletter-brain/database.py update_newsletter_analysis() writes to newsletter_topics table

**Reads:**
- crx-newsletter-brain/database.py newsletter_exists() reads from newsletters table
- crx-newsletter-brain/database.py get_unprocessed_newsletters() reads from newsletters table
- crx-newsletter-brain/database.py get_newsletters_by_date_range() reads from newsletters table
- crx-newsletter-brain/database.py get_stats() reads from newsletters table
- crx-newsletter-brain/database.py get_stats() reads from digests table
- crx-newsletter-brain/database.py get_stats() reads from newsletter_topics table
- crx-newsletter-brain/dashboard.py reads from newsletters table

**Active Consumers:**
- crx-newsletter-brain/worker.py (ACTIVE)
- crx-newsletter-brain/dashboard.py (ACTIVE)

**Authoritative Status:** SYSTEM OF RECORD
- SQLite is the authoritative storage for newsletters, digests, and topics
- Events are emitted AFTER SQLite writes
- SQLite is the source of truth

**Classification:** SYSTEM OF RECORD

**Evidence:**
- database.py writes to SQLite first, then emits events
- database.py reads from SQLite for all queries
- dashboard.py reads from SQLite for display
- SQLite is the primary storage for application data

---

## STORAGE SYSTEM: SQLite (knowledge.db)

**Location:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\knowledge.db

**Tables:**
- articles (url, title, summary, source, published_at, processed_at, tags)
- sources (name, url, type, active)

**Writes:**
- crx-digestion-worker/database.py save_article() writes to articles table
- crx-digestion-worker/database.py register_source() writes to sources table

**Reads:**
- crx-digestion-worker/database.py article_exists() reads from articles table
- crx-digestion-worker/database.py search_articles() reads from articles table
- crx-digestion-worker/database.py get_stats() reads from articles table
- crx-digestion-worker/database.py get_stats() reads from sources table
- crx-digestion-worker/database.py get_sources() reads from sources table

**Active Consumers:**
- crx-digestion-worker/worker.py (ACTIVE)

**Authoritative Status:** SYSTEM OF RECORD
- SQLite is the authoritative storage for articles and sources
- Events are emitted AFTER SQLite writes
- SQLite is the source of truth

**Classification:** SYSTEM OF RECORD

**Evidence:**
- database.py writes to SQLite first, then emits events
- database.py reads from SQLite for all queries
- SQLite is the primary storage for application data

---

## STORAGE SYSTEM: PostgreSQL (events table)

**Location:** Brain PostgreSQL (events table)

**Schema:** C:\Users\nolan\PING\database\events.sql

**Tables:**
- events (id, stream, event_type, payload, created_at)

**Writes:**
- Brain/src/constitutional/event_emitter.py emit_event() writes to events table
- crx-newsletter-brain/database.py emits NEWSLETTER_CREATED event
- crx-newsletter-brain/database.py emits DIGEST_GENERATED event
- crx-newsletter-brain/database.py emits NEWSLETTER_PROCESSING_FAILED event
- crx-newsletter-brain/database.py emits DATABASE_WRITE_FAILED event
- crx-digestion-worker/database.py emits ARTICLE_CREATED event
- crx-digestion-worker/database.py emits ARTICLE_PROCESSING_FAILED event
- crx-digestion-worker/database.py emits DATABASE_WRITE_FAILED event
- crx-newsletter-brain/worker.py emits INGESTION_CYCLE_STARTED event
- crx-newsletter-brain/worker.py emits PROCESSING_CYCLE_STARTED event
- crx-newsletter-brain/worker.py emits WORKER_HEARTBEAT event
- crx-digestion-worker/worker.py emits CYCLE_STARTED event
- crx-digestion-worker/worker.py emits WORKER_HEARTBEAT event

**Reads:**
- NONE (events are never read by applications)
- PING/gateway/server.js reads from events table (but gateway is not executed)

**Active Consumers:**
- crx-newsletter-brain/worker.py (ACTIVE - writes only)
- crx-newsletter-brain/database.py (ACTIVE - writes only)
- crx-digestion-worker/worker.py (ACTIVE - writes only)
- crx-digestion-worker/database.py (ACTIVE - writes only)

**Authoritative Status:** DERIVED
- Events are derived from SQLite writes
- Events are emitted AFTER SQLite writes
- Events are not used for state reconstruction
- Events are not replayed

**Classification:** DERIVED

**Evidence:**
- database.py writes to SQLite first, then emits events
- Events are never read by applications
- No replay from events occurs
- SQLite is the source of truth

---

## STORAGE SYSTEM: Markdown Archives (knowledge/YYYY/MM/*.md)

**Location:** c:\Users\nolan\CascadeProjects\crx-newsletter-brain\knowledge\YYYY\MM\*.md

**Content:** Newsletter markdown archives

**Writes:**
- crx-newsletter-brain/archive.py archive_newsletter() writes to markdown files
- crx-newsletter-brain/archive.py emits ARCHIVE_WRITTEN event

**Reads:**
- NONE (markdown archives are never read)

**Active Consumers:**
- crx-newsletter-brain/worker.py (ACTIVE - writes only)

**Authoritative Status:** ARCHIVE
- Markdown archives are written for archival purposes
- Markdown archives are never read
- Markdown archives are not used for retrieval
- Markdown archives are not used for reconstruction

**Classification:** ARCHIVE

**Evidence:**
- archive.py writes to markdown files
- markdown files are never read
- markdown files are not used for retrieval
- markdown files are not used for reconstruction

---

## STORAGE SYSTEM: Markdown Archives (knowledge/YYYY/MM/*.md)

**Location:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\knowledge\YYYY\MM\*.md

**Content:** Article markdown archives

**Writes:**
- crx-digestion-worker/archive.py archive_article() writes to markdown files
- crx-digestion-worker/archive.py emits MARKDOWN_WRITTEN event

**Reads:**
- NONE (markdown archives are never read)

**Active Consumers:**
- crx-digestion-worker/worker.py (ACTIVE - writes only)

**Authoritative Status:** ARCHIVE
- Markdown archives are written for archival purposes
- Markdown archives are never read
- Markdown archives are not used for retrieval
- Markdown archives are not used for reconstruction

**Classification:** ARCHIVE

**Evidence:**
- archive.py writes to markdown files
- markdown files are never read
- markdown files are not used for retrieval
- markdown files are not used for reconstruction

---

## STORAGE SYSTEM: Markdown Archives (digests/daily-{date}.md)

**Location:** c:\Users\nolan\CascadeProjects\crx-newsletter-brain\digests\daily-{date}.md

**Content:** Daily digest markdown

**Writes:**
- crx-newsletter-brain/digest_generator.py generate_daily_digest() writes to markdown files

**Reads:**
- NONE (markdown digests are never read)

**Active Consumers:**
- crx-newsletter-brain/worker.py (ACTIVE - writes only)

**Authoritative Status:** ARCHIVE
- Markdown digests are written for archival purposes
- Markdown digests are never read
- Markdown digests are not used for retrieval
- Markdown digests are not used for reconstruction

**Classification:** ARCHIVE

**Evidence:**
- digest_generator.py writes to markdown files
- markdown files are never read
- markdown files are not used for retrieval
- markdown files are not used for reconstruction

---

## STORAGE SYSTEM: Markdown Archives (digests/weekly-{date}.md)

**Location:** c:\Users\nolan\CascadeProjects\crx-newsletter-brain\digests\weekly-{date}.md

**Content:** Weekly report markdown

**Writes:**
- crx-newsletter-brain/digest_generator.py generate_weekly_report() writes to markdown files

**Reads:**
- NONE (markdown digests are never read)

**Active Consumers:**
- crx-newsletter-brain/worker.py (ACTIVE - writes only)

**Authoritative Status:** ARCHIVE
- Markdown digests are written for archival purposes
- Markdown digests are never read
- Markdown digests are not used for retrieval
- Markdown digests are not used for reconstruction

**Classification:** ARCHIVE

**Evidence:**
- digest_generator.py writes to markdown files
- markdown files are never read
- markdown files are not used for retrieval
- markdown files are not used for reconstruction

---

## STORAGE SYSTEM: Qdrant

**Location:** Brain Qdrant (docker-compose.yml)

**Content:** Vector database

**Writes:**
- NONE

**Reads:**
- NONE

**Active Consumers:**
- NONE

**Authoritative Status:** UNUSED

**Classification:** UNUSED

**Evidence:**
- No applications import Qdrant
- No applications write to Qdrant
- No applications read from Qdrant
- Qdrant is started but not used

---

## STORAGE SYSTEM: Neo4j

**Location:** Brain Neo4j (docker-compose.yml)

**Content:** Graph database

**Writes:**
- NONE

**Reads:**
- NONE

**Active Consumers:**
- NONE

**Authoritative Status:** UNUSED

**Classification:** UNUSED

**Evidence:**
- No applications import Neo4j
- No applications write to Neo4j
- No applications read from Neo4j
- Neo4j is started but not used

---

## STORAGE SYSTEM: OpenSearch

**Location:** Brain OpenSearch (docker-compose.yml)

**Content:** Search engine

**Writes:**
- NONE

**Reads:**
- NONE

**Active Consumers:**
- NONE

**Authoritative Status:** UNUSED

**Classification:** UNUSED

**Evidence:**
- No applications import OpenSearch
- No applications write to OpenSearch
- No applications read from OpenSearch
- OpenSearch is started but not used

---

## STORAGE SYSTEM: DuckDB

**Location:** Brain DuckDB (docker-compose.yml)

**Content:** Analytics database

**Writes:**
- NONE

**Reads:**
- NONE

**Active Consumers:**
- NONE

**Authoritative Status:** UNUSED

**Classification:** UNUSED

**Evidence:**
- No applications import DuckDB
- No applications write to DuckDB
- No applications read from DuckDB
- DuckDB is started but not used

---

## STORAGE SYSTEM: PostgreSQL (ledger tables)

**Location:** PING commit-service PostgreSQL (artifacts, lineage_edges, execution_events tables)

**Content:** Ledger tables

**Writes:**
- NONE (commit-service is not executed)

**Reads:**
- NONE (commit-service is not executed)

**Active Consumers:**
- NONE (commit-service is not executed)

**Authoritative Status:** UNUSED

**Classification:** UNUSED

**Evidence:**
- commit-service is not executed (no docker-compose.yml)
- No applications import commit-service
- No applications write to ledger tables
- No applications read from ledger tables

---

## CRITICAL FINDINGS

1. **SQLite is the system of record.** SQLite (newsletters.db, knowledge.db) is authoritative for newsletters, articles, sources, and digests. All writes go to SQLite first, then events are emitted.

2. **PostgreSQL events table is derived.** Events are derived from SQLite writes. Events are emitted AFTER SQLite writes. Events are not used for state reconstruction. Events are not replayed.

3. **Markdown archives are archives.** Markdown archives are written for archival purposes but are never read. They are not used for retrieval or reconstruction.

4. **Qdrant is unused.** Qdrant is started but not used by any application. No vector storage occurs.

5. **Neo4j is unused.** Neo4j is started but not used by any application. No graph storage occurs.

6. **OpenSearch is unused.** OpenSearch is started but not used by any application. No search indexing occurs.

7. **DuckDB is unused.** DuckDB is started but not used by any application. No analytics occur.

8. **PostgreSQL ledger tables are unused.** PING commit-service is not executed. No ledger storage occurs.

9. **No cache exists.** No cache layer exists between SQLite and applications.

10. **No projection exists.** No projection layer exists between SQLite and applications. SQLite is the only storage.

---

## ANSWER

**SQLite (newsletters.db):** SYSTEM OF RECORD
- Writes: ACTIVE
- Reads: ACTIVE
- Active Consumers: crx-newsletter-brain/worker.py, crx-newsletter-brain/dashboard.py
- Authoritative Status: SYSTEM OF RECORD

**SQLite (knowledge.db):** SYSTEM OF RECORD
- Writes: ACTIVE
- Reads: ACTIVE
- Active Consumers: crx-digestion-worker/worker.py
- Authoritative Status: SYSTEM OF RECORD

**PostgreSQL (events table):** DERIVED
- Writes: ACTIVE
- Reads: NONE
- Active Consumers: crx-newsletter-brain/worker.py, crx-newsletter-brain/database.py, crx-digestion-worker/worker.py, crx-digestion-worker/database.py
- Authoritative Status: DERIVED

**Markdown Archives (knowledge/YYYY/MM/*.md):** ARCHIVE
- Writes: ACTIVE
- Reads: NONE
- Active Consumers: crx-newsletter-brain/worker.py, crx-digestion-worker/worker.py
- Authoritative Status: ARCHIVE

**Markdown Archives (digests/daily-{date}.md):** ARCHIVE
- Writes: ACTIVE
- Reads: NONE
- Active Consumers: crx-newsletter-brain/worker.py
- Authoritative Status: ARCHIVE

**Markdown Archives (digests/weekly-{date}.md):** ARCHIVE
- Writes: ACTIVE
- Reads: NONE
- Active Consumers: crx-newsletter-brain/worker.py
- Authoritative Status: ARCHIVE

**Qdrant:** UNUSED
- Writes: NONE
- Reads: NONE
- Active Consumers: NONE
- Authoritative Status: UNUSED

**Neo4j:** UNUSED
- Writes: NONE
- Reads: NONE
- Active Consumers: NONE
- Authoritative Status: UNUSED

**OpenSearch:** UNUSED
- Writes: NONE
- Reads: NONE
- Active Consumers: NONE
- Authoritative Status: UNUSED

**DuckDB:** UNUSED
- Writes: NONE
- Reads: NONE
- Active Consumers: NONE
- Authoritative Status: UNUSED

**PostgreSQL (ledger tables):** UNUSED
- Writes: NONE
- Reads: NONE
- Active Consumers: NONE
- Authoritative Status: UNUSED
