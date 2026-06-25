# Worker Gap Report

**Audit Date:** 2026-06-25
**Audit Type:** PHASE F.1 — Worker Gap Analysis
**Objective:** For every constitutional artifact, identify whether a worker produces or consumes it, and whether that worker's operations actually succeed.

---

# Producer Worker Status

## Events Table Producers

| Worker | Event Type | Schema Used | Status | Evidence |
|--------|-----------|------------|--------|----------|
| constitutional_retrieval.py | DOCUMENT_IMPORTED | CQRS (event_id, event_data) | ✅ WORKS | 5 DOCUMENT_IMPORTED events verified in events table |
| drive_ingestor.py | DOCUMENT_IMPORTED/UPDATED/DELETED | CQRS (event_id, event_data) | ✅ WORKS | CQRS schema, capability-enforced |
| filesystem_worker.py | FILE_DISCOVERED/CREATED/MODIFIED/DELETED | CQRS (event_id, causation_id, correlation_id) | ✅ WORKS | Full CQRS with causality |
| qdrant_projection_worker.py | PROJECTION_REBUILT (via projection_status) | CQRS (event_id, projection_hash) | ✅ WORKS | Creates its own table, verified working |
| destructive_recovery_certification.py | Various (test only) | CQRS | ✅ WORKS | Test-only, correct schema |
| summary_worker.py | OBSERVATION_CREATED | OLD (stream, payload) | ❌ FAILS | Missing columns: stream, payload |
| entity_worker.py | ENTITIES_EXTRACTED | OLD (stream, payload) | ❌ FAILS | Missing columns: stream, payload |
| embedding_worker.py | DOCUMENT_EMBEDDED | OLD (stream, payload) | ❌ FAILS | Missing columns: stream, payload |
| classifier_worker.py | ARTIFACT_CLASSIFIED | OLD (stream, payload) | ❌ FAILS | Missing columns: stream, payload |
| claim_worker.py | CLAIM_CREATED | OLD (stream, payload) | ❌ FAILS | Missing columns: stream, payload |
| candidate_claim_worker.py | CANDIDATE_CLAIM_CREATED | OLD (stream, payload) | ❌ FAILS | Missing columns: stream, payload |
| memory_ingestion_worker.py | DOCUMENT_DISCOVERED/INGESTED/PROJECTED/FAILED | OLD (stream, payload) | ❌ FAILS | Missing columns: stream, payload |
| google_drive_ingestion.py | DOCUMENT_OBSERVED | OLD (stream, payload) | ❌ FAILS | Missing columns: stream, payload |
| web_retrieval.py | SEARCH_PERFORMED/PAGE_FETCHED/CONTENT_SUMMARIZED | OLD (stream, payload) | ❌ FAILS | Missing columns: stream, payload |
| event_emitter.py | ARTICLE_CREATED/NEWSLETTER_CREATED/INFERENCE_REQUEST/INFERENCE_RESPONSE | OLD (stream, payload) | ❌ FAILS | Missing columns: stream, payload |
| google_drive_ingestion_adapter.py | Various | HYBRID (id, event_id, event_data) | ⚠️ PARTIAL | Extra `id` column may cause ambiguity |

## Non-Events Table Producers

| Worker | Table | Status | Evidence |
|--------|-------|--------|----------|
| memory_ingestion_worker.py | documents | ❌ FAILS | Table does not exist |
| memory_ingestion_worker.py | document_content | ❌ FAILS | Table does not exist |
| memory_ingestion_worker.py | document_embeddings | ❌ FAILS | Table does not exist |
| qdrant_projection_worker.py | projection_status | ✅ WORKS | Creates its own table, verified |
| event_chain.py | event_chain | ✅ WORKS | Creates its own table, verified |
| google_drive_ingestion.py | google_drive_observations | ✅ WORKS | Creates its own table, verified |
| brainos/rss/database.py | articles (SQLite) | ✅ WORKS | Creates own SQLite database |
| brainos/newsletter/database.py | newsletters/topics/digests (SQLite) | ✅ WORKS | Creates own SQLite database |

## Qdrant Upsert Producers

| Worker | Collection | Status | Evidence |
|--------|-----------|--------|----------|
| constitutional_retrieval.py | constitutional_documents | ✅ WORKS | 5 points in collection |
| qdrant_projection_worker.py | constitutional_memory | ✅ WORKS (blocks unverified) | 0 points — correct (blocks REASONING_ARTIFACT) |
| qdrant_projection_worker.py | memory | ✅ WORKS | Projected 1,044 events earlier |

---

# Consumer Worker Status

## Events Table Consumers

| Worker | Schema Used | Status | Evidence |
|--------|------------|--------|----------|
| app.py | CQRS (event_id, event_data, event_type) | ✅ WORKS | Queries verified working |
| qdrant_projection_worker.py | CQRS (event_id, timestamp) | ✅ WORKS | JOIN with projection_status verified |
| projection_worker.py | CQRS | ✅ WORKS | SELECT MAX(id) works |
| claim_worker.py | OLD (id, payload) | ❌ FAILS | Column 'id' is UUID not BIGSERIAL, 'payload' doesn't exist |
| authority_search.py | authority_objects, authority_lineage, authority_witness, authority_supersession | ❌ FAILS | Tables authority_objects, authority_witness, authority_supersession don't exist |
| lineage_search.py | artifact_registry, events, projections, authority_lineage | ❌ FAILS | Tables artifact_registry, projections don't exist |
| contradiction_search.py | events, projections | ❌ FAILS | projections table doesn't exist |
| graph_expand.py | object_relationships, authority_lineage | ❌ FAILS | object_relationships table likely doesn't exist |

## Tool Consumer Status

| Tool | Fallback | Status | Evidence |
|------|----------|--------|----------|
| authority_search.py | runtime/data/authority_objects.json | ⚠️ DEGRADED | Falls back to empty JSON → returns empty highest_authority |
| lineage_search.py | runtime/data/events.json, projections.json | ⚠️ DEGRADED | Falls back to empty JSON files |
| contradiction_search.py | runtime/data/events.json, projections.json | ⚠️ DEGRADED | Falls back to empty JSON files |
| graph_expand.py | runtime/data/relationships.json | ⚠️ DEGRADED | Falls back to empty JSON files |

---

# Missing Producers by Artifact

| Artifact | Required Producer | Current State |
|----------|-----------------|---------------|
| witness | Worker to create authority_witness records | ❌ NO PRODUCER |
| supersession | Worker to create authority_supersession records | ❌ NO PRODUCER |
| policy_decision | Worker to record governance decisions | ❌ NO PRODUCER |
| evidence | Worker to persist supporting/contradicting evidence | ❌ NO PRODUCER |
| capability | Worker to grant/revoke capabilities | ❌ NO PRODUCER |
| observation | Worker producing observations as constitutional artifacts (not just events) | ⚠️ PARTIAL (events only) |

---

# Worker Count Summary

| Category | Count |
|----------|-------|
| Workers with correct CQRS schema | 7 |
| Workers with old/broken schema | 8 |
| Total workers producing events | 15 |
| Workers producing to non-events tables | 7 |
| Workers consuming DB data | 9 |
| Workers with correct schema + operational | 4 |
| Workers with broken schema (silently failing) | 8 |
| Workers with degraded fallback | 4 |
| Missing producers (constitutional gap) | 6 |

---

# Root Cause

The worker ecosystem has a **two-schema split**. The CQRS migration happened in the database but not all producers and consumers were updated:

```
Database: CQRS schema (event_id, event_data, aggregate_id...)
            ↑                        ↑
   7 producers (CQRS)       8 producers (OLD)
     constitutional_retrieval   summary_worker
     drive_ingestor             entity_worker
     filesystem_worker          embedding_worker
     qdrant_projection_worker   classifier_worker
     projection_worker          claim_worker
     destructive_recovery       candidate_claim_worker
     google_drive_adapter       memory_ingestion_worker
                                google_drive_ingestion
                                web_retrieval
                                event_emitter
```

The 6 core workers in `workers/` (claim_worker, candidate_claim_worker, summary_worker, entity_worker, embedding_worker, classifier_worker) all use the OLD schema and their inserts silently fail. The 2 ingestion workers (memory_ingestion_worker, google_drive_ingestion) also use OLD schema.

The 13 cognitive workers in `runtime/cognitive/` never touch the DB directly — they operate through tools that degrade gracefully when tables are missing. This means the reasoning pipeline silently returns empty results rather than crashing.

---

**Report Status:** COMPLETED
