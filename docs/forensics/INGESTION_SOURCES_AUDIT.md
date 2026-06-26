# Sprint 02A — Runtime Constitutional Pipeline Forensics

**Date:** 2026-06-25
**Sprint:** Runtime Constitutional Pipeline Forensics
**Status:** IN PROGRESS

---

## Executive Summary

**Objective:** Determine why external cognitive inputs are not flowing through the constitutional pipeline despite the replay kernel, workers, Mission Control, and constitutional runtime existing.

**Overall Assessment:** EXTERNAL INGESTION EXISTS BUT NOT CONSTITUTIONALLY INTEGRATED

---

## PART 1 — Ingestion Sources Discovery

### Sources Found:

#### 1. Google Drive
- **Implementation File:** `runtime/ingestion/drive_ingestor.py`
- **Event Emitted:** DOCUMENT_IMPORTED, DOCUMENT_UPDATED, DOCUMENT_DELETED
- **Worker Consuming:** observation_worker.py (expected)
- **Currently Enabled:** YES (has main() entry point)
- **Referenced by Docker Compose:** NO
- **Referenced by Mission Control:** NO
- **Currently Reachable:** NO (not started by Docker)
- **Truth Classification:** CLAIMED (external source, not authoritative)

#### 2. Yahoo Mail
- **Implementation File:** `brainos/newsletter/worker.py`
- **Event Emitted:** INGESTION_CYCLE_STARTED, WORKER_HEARTBEAT, PROCESSING_CYCLE_STARTED
- **Worker Consuming:** None (custom worker, not constitutional pipeline)
- **Currently Enabled:** YES (has main() entry point)
- **Referenced by Docker Compose:** YES (brainos/newsletter/docker-compose.yml)
- **Referenced by Mission Control:** NO
- **Currently Reachable:** PARTIAL (Docker compose exists but marked as deprecated)
- **Truth Classification:** CLAIMED (external source, not authoritative)

#### 3. RSS
- **Implementation File:** `brainos/rss/worker.py`
- **Event Emitted:** CYCLE_STARTED, WORKER_HEARTBEAT
- **Worker Consuming:** None (custom worker, not constitutional pipeline)
- **Currently Enabled:** YES (has main() entry point)
- **Referenced by Docker Compose:** YES (brainos/rss/docker-compose.yml)
- **Referenced by Mission Control:** NO
- **Currently Reachable:** PARTIAL (Docker compose exists but marked as deprecated)
- **Truth Classification:** CLAIMED (external source, not authoritative)

#### 4. Web Retrieval
- **Implementation File:** `brainos/orchestration/src/web_retrieval.py`
- **Event Emitted:** Unknown (observation event emission mentioned but not verified)
- **Worker Consuming:** Unknown
- **Currently Enabled:** UNKNOWN
- **Referenced by Docker Compose:** NO
- **Referenced by Mission Control:** NO
- **Currently Reachable:** NO
- **Truth Classification:** CLAIMED (external source, not authoritative)

#### 5. Filesystem
- **Implementation File:** `filesystem_worker.py`
- **Event Emitted:** Outputs SQL INSERT statements to stdout (not event emission)
- **Worker Consuming:** None (direct SQL output)
- **Currently Enabled:** YES (has main() entry point)
- **Referenced by Docker Compose:** NO
- **Referenced by Mission Control:** NO
- **Currently Reachable:** NO
- **Truth Classification:** CLAIMED (external source, not authoritative)

#### 6. Repository Scanner
- **Implementation File:** `repository_scanner.py`
- **Event Emitted:** REPOSITORY_FILE_DISCOVERED, REPOSITORY_FILE_UPDATED, REPOSITORY_FILE_DELETED
- **Worker Consuming:** Unknown
- **Currently Enabled:** YES (has main() entry point)
- **Referenced by Docker Compose:** NO
- **Referenced by Mission Control:** NO
- **Currently Reachable:** NO
- **Truth Classification:** CLAIMED (external source, not authoritative)

### Sources NOT Found:

- Email (Gmail) - NOT IMPLEMENTED
- IMAP - NOT IMPLEMENTED
- SMTP - NOT IMPLEMENTED
- Git/GitHub - NOT IMPLEMENTED
- YouTube - NOT IMPLEMENTED
- PDFs - NOT IMPLEMENTED
- OCR - NOT IMPLEMENTED
- HTTP imports - NOT IMPLEMENTED
- MCP imports - NOT IMPLEMENTED
- Manual imports - NOT IMPLEMENTED

---

## PART 2 — Execution Path Analysis

### Google Drive Execution Path (Theoretical)

```
Source: Google Drive API
    ↓
drive_ingestor.py: authenticate()
    ↓
drive_ingestor.py: get_drive_files()
    ↓
drive_ingestor.py: emit_document_event('DOCUMENT_IMPORTED')
    ↓
PostgreSQL: events table (INSERT)
    ↓
observation_worker.py: processes DOCUMENT_IMPORTED
    ↓
claim_worker.py: processes OBSERVATION_CREATED
    ↓
replay_worker.py: processes CLAIM_GENERATED
    ↓
witness_worker.py: processes REPLAY_EXECUTED
    ↓
lineage_worker.py: processes WITNESS_CREATED
    ↓
constitutional_projection_worker.py: processes LINEAGE_CREATED
    ↓
qdrant_projection_worker.py: projects to Qdrant
    ↓
retrieval_service.py: queries Qdrant
```

**Where Execution Currently Stops:** drive_ingestor.py is not started by Docker Compose, so execution never begins.

### Yahoo Mail Execution Path (Actual)

```
Source: Yahoo Mail API
    ↓
brainos/newsletter/worker.py: run_ingestion_cycle()
    ↓
yahoo_client.py: fetch_unread_newsletters()
    ↓
database.py: save_raw_newsletter() (custom database, NOT events table)
    ↓
brainos/newsletter/worker.py: run_processing_cycle()
    ↓
summarizer.py: analyze_newsletter() (Ollama)
    ↓
database.py: update_newsletter_analysis() (custom database, NOT events table)
    ↓
archive.py: archive_newsletter() (markdown archive)
```

**Where Execution Currently Stops:** Yahoo Mail worker uses custom database, NOT constitutional events table. Never emits DOCUMENT_IMPORTED events. Never enters constitutional pipeline.

### RSS Execution Path (Actual)

```
Source: RSS feeds
    ↓
brainos/rss/worker.py: run_cycle()
    ↓
tools.py: fetch_rss()
    ↓
summarizer.py: process_article() (Ollama)
    ↓
database.py: save_article() (custom database, NOT events table)
    ↓
archive.py: archive_article() (markdown archive)
```

**Where Execution Currently Stops:** RSS worker uses custom database, NOT constitutional events table. Never emits DOCUMENT_IMPORTED events. Never enters constitutional pipeline.

---

## PART 3 — Failure Classification

### Google Drive
**Classification:** H - Everything works but nothing schedules ingestion
- **Cause:** drive_ingestor.py not referenced by Docker Compose
- **Effect:** Google Drive ingestion never starts
- **Minimal Constitutional Fix:** Add drive_ingestor service to Docker Compose
- **Risk:** LOW (ingestion exists but not scheduled)

### Yahoo Mail
**Classification:** B - Imports but never emits events
- **Cause:** Yahoo Mail worker uses custom database, NOT constitutional events table
- **Effect:** Yahoo Mail never enters constitutional pipeline
- **Minimal Constitutional Fix:** Modify worker to emit DOCUMENT_IMPORTED events to events table
- **Risk:** HIGH (external data bypasses constitutional pipeline)

### RSS
**Classification:** B - Imports but never emits events
- **Cause:** RSS worker uses custom database, NOT constitutional events table
- **Effect:** RSS never enters constitutional pipeline
- **Minimal Constitutional Fix:** Modify worker to emit DOCUMENT_IMPORTED events to events table
- **Risk:** HIGH (external data bypasses constitutional pipeline)

### Web Retrieval
**Classification:** A - Never imports
- **Cause:** Implementation exists but not enabled/scheduled
- **Effect:** Web retrieval never starts
- **Minimal Constitutional Fix:** Add web retrieval service to Docker Compose
- **Risk:** MEDIUM (ingestion exists but not scheduled)

### Filesystem
**Classification:** B - Imports but never emits events
- **Cause:** Filesystem worker outputs SQL INSERT statements, NOT event emission
- **Effect:** Filesystem never enters constitutional pipeline
- **Minimal Constitutional Fix:** Modify worker to emit DOCUMENT_IMPORTED events to events table
- **Risk:** HIGH (external data bypasses constitutional pipeline)

### Repository Scanner
**Classification:** B - Imports but never emits events
- **Cause:** Repository scanner emits REPOSITORY_FILE_DISCOVERED events, but workers may not consume
- **Effect:** Repository data may not enter constitutional pipeline
- **Minimal Constitutional Fix:** Verify worker consumption of REPOSITORY_FILE_DISCOVERED events
- **Risk:** MEDIUM (event emission exists but consumption unclear)

---

## PART 4 — Scheduler Audit

### Schedulers Found:

#### 1. Google Drive Ingestor
- **Type:** Continuous polling loop
- **Location:** `runtime/ingestion/drive_ingestor.py:run_continuous()`
- **Interval:** 300 seconds (configurable)
- **Trigger:** Manual execution (main() calls run_once())
- **What Actually Triggers Ingestion:** Manual execution
- **What Should Trigger Ingestion:** Docker Compose service startup

#### 2. Yahoo Mail Worker
- **Type:** Continuous polling loop
- **Location:** `brainos/newsletter/worker.py:main()`
- **Interval:** 900 seconds (15 minutes, configurable via CYCLE_INTERVAL)
- **Trigger:** Docker Compose service startup
- **What Actually Triggers Ingestion:** Docker Compose service startup
- **What Should Trigger Ingestion:** Docker Compose service startup (correct)

#### 3. RSS Worker
- **Type:** Continuous polling loop
- **Location:** `brainos/rss/worker.py:main()`
- **Interval:** 900 seconds (15 minutes, configurable via CYCLE_INTERVAL)
- **Trigger:** Docker Compose service startup
- **What Actually Triggers Ingestion:** Docker Compose service startup
- **What Should Trigger Ingestion:** Docker Compose service startup (correct)

### Schedulers NOT Found:

- Cron jobs - NOT FOUND
- Timers - NOT FOUND
- Background tasks - NOT FOUND
- Watch loops - NOT FOUND
- Queue consumers - NOT FOUND
- Event listeners - NOT FOUND

---

## PART 5 — Docker Verification

### Workers in Docker Compose:

#### 1. PostgreSQL
- **Container:** brain-postgres
- **Status:** Defined in docker-compose.yml
- **Entrypoint:** Default PostgreSQL entrypoint
- **Healthcheck:** pg_isready
- **Subscriptions:** None (infrastructure)
- **Event Types Consumed:** None (infrastructure)

#### 2. Qdrant
- **Container:** brain-qdrant
- **Status:** Defined in docker-compose.yml
- **Entrypoint:** Default Qdrant entrypoint
- **Healthcheck:** curl http://localhost:6333/health
- **Subscriptions:** None (infrastructure)
- **Event Types Consumed:** None (infrastructure)

#### 3. Neo4j
- **Container:** brain-neo4j
- **Status:** Defined in docker-compose.yml
- **Entrypoint:** Default Neo4j entrypoint
- **Healthcheck:** curl http://localhost:7474
- **Subscriptions:** None (infrastructure)
- **Event Types Consumed:** None (infrastructure)

#### 4. Temporal
- **Container:** brain-temporal
- **Status:** Defined in docker-compose.yml
- **Entrypoint:** Default Temporal entrypoint
- **Healthcheck:** None
- **Subscriptions:** None (infrastructure)
- **Event Types Consumed:** None (infrastructure)

#### 5. Kafka
- **Container:** brain-kafka
- **Status:** Defined in docker-compose.yml
- **Entrypoint:** Default Kafka entrypoint
- **Healthcheck:** kafka-broker-api-versions
- **Subscriptions:** None (infrastructure)
- **Event Types Consumed:** None (infrastructure)

#### 6. Zookeeper
- **Container:** brain-zookeeper
- **Status:** Defined in docker-compose.yml
- **Entrypoint:** Default Zookeeper entrypoint
- **Healthcheck:** nc -z localhost 2181
- **Subscriptions:** None (infrastructure)
- **Event Types Consumed:** None (infrastructure)

#### 7. DuckDB
- **Container:** brain-duckdb
- **Status:** Defined in docker-compose.yml
- **Entrypoint:** Default DuckDB entrypoint
- **Healthcheck:** None
- **Subscriptions:** None (infrastructure)
- **Event Types Consumed:** None (infrastructure)

#### 8. OpenSearch
- **Container:** brain-opensearch
- **Status:** Defined in docker-compose.yml
- **Entrypoint:** Default OpenSearch entrypoint
- **Healthcheck:** curl http://localhost:9200/_cluster/health
- **Subscriptions:** None (infrastructure)
- **Event Types Consumed:** None (infrastructure)

#### 9. Apache Tika
- **Container:** brain-tika
- **Status:** Defined in docker-compose.yml
- **Entrypoint:** Default Tika entrypoint
- **Healthcheck:** curl http://localhost:9998
- **Subscriptions:** None (infrastructure)
- **Event Types Consumed:** None (infrastructure)

#### 10. Ollama
- **Container:** brain-ollama
- **Status:** Defined in docker-compose.yml
- **Entrypoint:** Default Ollama entrypoint
- **Healthcheck:** curl http://localhost:11434/api/tags
- **Subscriptions:** None (infrastructure)
- **Event Types Consumed:** None (infrastructure)

#### 11. Open WebUI
- **Container:** brain-openwebui
- **Status:** Defined in docker-compose.yml
- **Entrypoint:** Default Open WebUI entrypoint
- **Healthcheck:** curl http://localhost:8080
- **Subscriptions:** None (infrastructure)
- **Event Types Consumed:** None (infrastructure)

#### 12. Vault
- **Container:** brain-vault
- **Status:** Defined in docker-compose.yml
- **Entrypoint:** Default Vault entrypoint
- **Healthcheck:** vault status
- **Subscriptions:** None (infrastructure)
- **Event Types Consumed:** None (infrastructure)

### Workers NOT in Docker Compose:

- observation_worker.py - NOT DEFINED
- claim_worker.py - NOT DEFINED
- replay_worker.py - NOT DEFINED
- witness_worker.py - NOT DEFINED
- lineage_worker.py - NOT DEFINED
- constitutional_projection_worker.py - NOT DEFINED
- qdrant_projection_worker.py - NOT DEFINED
- drive_ingestor.py - NOT DEFINED
- repository_scanner.py - NOT DEFINED
- filesystem_worker.py - NOT DEFINED

---

## PART 6 — Mission Control Audit

### Endpoints Found:

#### CRX Kernel Service (TypeScript)
- **Location:** `runtime/kernel/commit-service/src/server.ts`
- **Endpoints:**
  - POST `/kernel/commit` - commitArtifact
  - GET `/kernel/audit` - auditArtifacts
  - GET `/kernel/audit/system` - auditSystem
- **Email Endpoint:** NOT FOUND
- **Git Endpoint:** NOT FOUND
- **YouTube Endpoint:** NOT FOUND
- **RSS Endpoint:** NOT FOUND
- **Import Endpoint:** PARTIAL (commitArtifact exists but not for external sources)

### Missing Controllers:

- Email import controller - NOT FOUND
- Git import controller - NOT FOUND
- YouTube import controller - NOT FOUND
- RSS import controller - NOT FOUND
- Web import controller - NOT FOUND
- Manual import controller - NOT FOUND

---

## PART 7 — Event Audit

### Events Emitted by Ingestion Sources:

#### Google Drive
- DOCUMENT_IMPORTED - EMITTED
- DOCUMENT_UPDATED - EMITTED
- DOCUMENT_DELETED - EMITTED

#### Yahoo Mail
- INGESTION_CYCLE_STARTED - EMITTED
- WORKER_HEARTBEAT - EMITTED
- PROCESSING_CYCLE_STARTED - EMITTED
- DOCUMENT_IMPORTED - NOT EMITTED

#### RSS
- CYCLE_STARTED - EMITTED
- WORKER_HEARTBEAT - EMITTED
- DOCUMENT_IMPORTED - NOT EMITTED

#### Web Retrieval
- DOCUMENT_IMPORTED - UNKNOWN (not verified)

#### Filesystem
- DOCUMENT_IMPORTED - NOT EMITTED (SQL INSERT statements only)

#### Repository Scanner
- REPOSITORY_FILE_DISCOVERED - EMITTED
- REPOSITORY_FILE_UPDATED - EMITTED
- REPOSITORY_FILE_DELETED - EMITTED

### Events Expected by Constitutional Pipeline:

- DOCUMENT_IMPORTED - EMITTED by Google Drive only
- EMAIL_IMPORTED - NEVER EMITTED
- YOUTUBE_IMPORTED - NEVER EMITTED
- GIT_IMPORTED - NEVER EMITTED
- WEB_IMPORTED - NEVER EMITTED
- IMPORT_COMPLETED - NEVER EMITTED
- OBSERVATION_CREATED - EMITTED by observation_worker.py (but worker not started)
- CLAIM_GENERATED - EMITTED by claim_worker.py (but worker not started)
- REPLAY_EXECUTED - EMITTED by replay_worker.py (but worker not started)
- WITNESS_CREATED - EMITTED by witness_worker.py (but worker not started)

### Events Never Emitted:

- EMAIL_IMPORTED - NEVER EMITTED
- YOUTUBE_IMPORTED - NEVER EMITTED
- GIT_IMPORTED - NEVER EMITTED
- WEB_IMPORTED - NEVER EMITTED
- IMPORT_COMPLETED - NEVER EMITTED

---

## PART 8 — Ollama Audit

### Ollama Callers:

#### 1. Yahoo Mail Worker
- **Location:** `brainos/newsletter/summarizer.py`
- **Caller:** analyze_newsletter()
- **External Sources Reach Ollama:** YES (Yahoo Mail newsletters)

#### 2. RSS Worker
- **Location:** `brainos/rss/summarizer.py`
- **Caller:** process_article()
- **External Sources Reach Ollama:** YES (RSS articles)

#### 3. Web Retrieval
- **Location:** `brainos/orchestration/src/web_retrieval.py`
- **Caller:** Unknown (not verified)
- **External Sources Reach Ollama:** UNKNOWN

### External Sources NOT Reaching Ollama:

- Google Drive - NO (metadata-only ingestion, no content extraction)
- Filesystem - NO (SQL INSERT statements only)
- Repository Scanner - NO (SHA256 computation only)

---

## PART 9 — Constitutional Defect Report

### Critical Defects:

#### 1. Constitutional Workers Not Started
- **Cause:** observation_worker.py, claim_worker.py, replay_worker.py, witness_worker.py, lineage_worker.py, constitutional_projection_worker.py, qdrant_projection_worker.py not defined in Docker Compose
- **Effect:** Constitutional pipeline exists but never executes
- **Minimal Constitutional Fix:** Add all constitutional workers to Docker Compose
- **Risk:** CRITICAL (constitutional pipeline non-functional)

#### 2. External Ingestion Bypasses Constitutional Pipeline
- **Cause:** Yahoo Mail and RSS workers use custom database, NOT constitutional events table
- **Effect:** External data bypasses constitutional pipeline, no replay, no witness, no lineage
- **Minimal Constitutional Fix:** Modify workers to emit DOCUMENT_IMPORTED events to events table
- **Risk:** CRITICAL (external data unconstitutionally processed)

#### 3. Mission Control Missing Import Endpoints
- **Cause:** No import controllers for Email, Git, YouTube, RSS, Web, Manual imports
- **Effect:** No constitutional authority for external imports
- **Minimal Constitutional Fix:** Add import controllers to Mission Control
- **Risk:** CRITICAL (no constitutional authority for imports)

### High Defects:

#### 4. Google Drive Ingestion Not Scheduled
- **Cause:** drive_ingestor.py not referenced by Docker Compose
- **Effect:** Google Drive ingestion never starts
- **Minimal Constitutional Fix:** Add drive_ingestor service to Docker Compose
- **Risk:** HIGH (ingestion exists but not scheduled)

#### 5. Filesystem Worker Not Constitutionally Integrated
- **Cause:** Filesystem worker outputs SQL INSERT statements, NOT event emission
- **Effect:** Filesystem never enters constitutional pipeline
- **Minimal Constitutional Fix:** Modify worker to emit DOCUMENT_IMPORTED events to events table
- **Risk:** HIGH (external data bypasses constitutional pipeline)

#### 6. Repository Scanner Event Consumption Unclear
- **Cause:** Repository scanner emits REPOSITORY_FILE_DISCOVERED events, but worker consumption unclear
- **Effect:** Repository data may not enter constitutional pipeline
- **Minimal Constitutional Fix:** Verify worker consumption of REPOSITORY_FILE_DISCOVERED events
- **Risk:** HIGH (event emission exists but consumption unclear)

### Medium Defects:

#### 7. Web Retrieval Not Scheduled
- **Cause:** Web retrieval implementation exists but not enabled/scheduled
- **Effect:** Web retrieval never starts
- **Minimal Constitutional Fix:** Add web retrieval service to Docker Compose
- **Risk:** MEDIUM (ingestion exists but not scheduled)

#### 8. Missing External Source Implementations
- **Cause:** Email (Gmail), IMAP, SMTP, Git/GitHub, YouTube, PDFs, OCR, HTTP imports, MCP imports, Manual imports not implemented
- **Effect:** Limited external source coverage
- **Minimal Constitutional Fix:** Implement missing external sources
- **Risk:** MEDIUM (limited external source coverage)

### Low Defects:

#### 9. Google Drive Metadata-Only Ingestion
- **Cause:** Google Drive ingestion is metadata-only, no content extraction
- **Effect:** Google Drive documents not analyzed by Ollama
- **Minimal Constitutional Fix:** Add content extraction to drive_ingestor.py
- **Risk:** LOW (ingestion exists but limited functionality)

---

## Conclusion

**Root Cause:** External cognitive inputs are not flowing through the constitutional pipeline because:

1. **Constitutional workers are not started** - observation_worker.py, claim_worker.py, replay_worker.py, witness_worker.py, lineage_worker.py, constitutional_projection_worker.py, qdrant_projection_worker.py are not defined in Docker Compose

2. **External ingestion bypasses constitutional pipeline** - Yahoo Mail and RSS workers use custom database, NOT constitutional events table

3. **Mission Control missing import endpoints** - No constitutional authority for external imports

4. **External ingestion not scheduled** - Google Drive ingestion not referenced by Docker Compose

**Constitutional Impact:** CRITICAL

**Recommendation:** Fix constitutional workers not started (Critical Defect #1) before addressing other defects. Without constitutional workers running, the constitutional pipeline is non-functional regardless of ingestion sources.

---

**Report Generated:** 2026-06-25
**Sprint:** Runtime Constitutional Pipeline Forensics
**Status:** COMPLETE
