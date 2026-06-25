# Schema Gap Report

**Audit Date:** 2026-06-25
**Audit Type:** PHASE F.1 — Schema Gap Analysis
**Objective:** Identify every database schema gap between constitutional artifact requirements and actual PostgreSQL implementation.

---

# Key Finding

**11 existing tables, 28+ defined tables never created.** The database has approximately 25% of its designed schema materialized.

---

# Missing Tables by Artifact

## authority_object

| Required | Actual |
|----------|--------|
| `authority_objects` table with: artifact_id, title, description, category, authority_level, payload_hash, sha256, status | ❌ **TABLE DOES NOT EXIST** |
| `objects` table (exists) has: object_id, content_hash, lineage_id, content_type, content_size, title, source | ⚠️ Existing table lacks authority_class, category, authority_level, payload_hash |
| Fields needed on `objects` to serve as authority_object: authority_class VARCHAR(50), payload_hash VARCHAR(64), sha256 VARCHAR(64) | ❌ **MISSING FIELDS** |

## witness

| Required | Actual |
|----------|--------|
| `authority_witness` table with: artifact_id, witness_root, witness_signature, witness_timestamp | ❌ **TABLE DOES NOT EXIST** |
| `witness_root` field on any table | ❌ **NOT ON ANY TABLE** |
| Witness Merkle tree storage | ❌ **DOES NOT EXIST** |

## supersession

| Required | Actual |
|----------|--------|
| `authority_supersession` table with: superseded, superseded_by, supersession_timestamp, supersession_reason | ❌ **TABLE DOES NOT EXIST** |
| `superseded_by` field on any table | ❌ **NOT ON ANY TABLE** |

## policy_decision

| Required | Actual |
|----------|--------|
| `policy_decisions` table | ❌ **TABLE DOES NOT EXIST** |
| Any policy storage | ❌ **DOES NOT EXIST** |

## observation

| Required | Actual |
|----------|--------|
| `observations` table | ❌ **TABLE DOES NOT EXIST** |
| Observations stored only as `events` rows with event_type='OBSERVATION_CREATED' | ⚠️ Functional but not constitutionally addressable as observations |

## claim

| Required | Actual |
|----------|--------|
| `claims` table EXISTS | ✅ id UUID, claim_text TEXT, confidence NUMERIC, created_at TIMESTAMPTZ |
| verification_status field | ❌ **MISSING** — no way to distinguish verified vs candidate claims |
| claim_type field (candidate vs verified) | ❌ **MISSING** |
| source_event_id FK | ❌ **MISSING** — no link back to originating event |

## evidence

| Required | Actual |
|----------|--------|
| `evidence` table | ❌ **TABLE DOES NOT EXIST** |
| Supporting/contradicting stance storage | ❌ **DOES NOT EXIST** |

## capability

| Required | Actual |
|----------|--------|
| `capabilities` table | ❌ **TABLE DOES NOT EXIST** |
| Capability assignments per identity | ❌ **DOES NOT EXIST** |

## document

| Required | Actual |
|----------|--------|
| `documents` table defined in SQL | ❌ **TABLE DOES NOT EXIST** |
| Documents stored as `events` + file system | ⚠️ Functional, no single document registry |

## projection

| Required | Actual |
|----------|--------|
| `projections` table EXISTS | ✅ id UUID, projection_id UUID, projection_type VARCHAR, projection_name VARCHAR, source_aggregate_id UUID FK, projection_data JSONB, last_event_id UUID FK, status VARCHAR |
| `projection_status` table EXISTS | ✅ Created by qdrant_projection_worker.py (event_id, projection_hash, projected_at) |
| `projections` and `projection_status` should be unified | ❌ **DIVERGED** — two tables track different projection metadata |

## attestation

| Required | Actual |
|----------|--------|
| No constitutional requirement for separate attestation table | ✅ N/A |

---

# Existing Tables That Match Their Designed Schema

| Table | Schema Source | Status |
|-------|--------------|--------|
| events | schema.sql + migration_001_bidirectional_memory.sql | ✅ MATCHES |
| objects | schema.sql | ✅ MATCHES |
| lineage | schema.sql | ✅ MATCHES |
| projections | schema.sql | ✅ MATCHES |
| system_metadata | schema.sql | ✅ MATCHES |
| audit_log | schema.sql | ✅ MATCHES |
| entities | migration_001_bidirectional_memory.sql | ✅ MATCHES |
| relationships | migration_001_bidirectional_memory.sql | ✅ MATCHES |
| citations | migration_001_bidirectional_memory.sql | ✅ MATCHES |
| claims | migration_001_bidirectional_memory.sql | ✅ MATCHES (but minimal) |
| topics | migration_001_bidirectional_memory.sql | ✅ MATCHES |

---

# Schema Files Never Applied

| File | Tables Defined | Applied? |
|------|---------------|----------|
| `database/documents.sql` | documents, document_content, document_embeddings, document_lineage, document_tags, document_citations | ❌ NOT APPLIED |
| `database/events_retention.sql` | events_archive | ❌ NOT APPLIED |
| `database/operational_intelligence.sql` | raw_payloads, dead_letters, knowledge_metrics | ❌ NOT APPLIED |
| `authority_objects.sql` | authority_objects | ❌ NOT APPLIED |
| `authority_lineage.sql` | authority_lineage | ❌ NOT APPLIED |
| `authority_supersession.sql` | authority_supersession | ❌ NOT APPLIED |
| `artifact_registry.sql` | artifact_registry | ❌ NOT APPLIED |
| `object_relationships.sql` | object_relationships | ❌ NOT APPLIED |
| `constitutional_freeze_registry.sql` | constitutional_freeze_registry, freeze_audit_log, amendment_history, verification_log | ❌ NOT APPLIED |
| `ledger_schema.sql` | artifacts, lineage_edges, execution_events | ❌ NOT APPLIED |
| `schema_expanded.sql` | expanded versions of 6+ tables | ❌ NOT APPLIED |
| `migration_add_projection_columns.sql` | payload_hash column on events | ❌ NOT APPLIED |

**Total: 28+ tables defined, 0 applied.**

---

# Incorrect Schema Usage

## Events Table: Two Incompatible Schemas

| Producer Group | Uses | Status |
|---------------|------|--------|
| CQRS group (constitutional_retrieval.py, drive_ingestor.py, filesystem_worker.py, qdrant_projection_worker.py) | `event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data, projected_to_qdrant` | ✅ WORKS |
| OLD group (workers/*.py, memory_ingestion_worker.py, google_drive_ingestion.py, web_retrieval.py, event_emitter.py) | `stream, event_type, payload, created_at, payload_hash, projected_to_qdrant` | ❌ **WILL FAIL** — columns don't exist |

## Legacy Columns Queried But Don't Exist

| Column | Queried By | Actual Column | Impact |
|--------|-----------|---------------|--------|
| `stream` | workers/*.py (6 files), google_drive_ingestion.py, web_retrieval.py | No such column | Insert/query fails |
| `payload` | workers/*.py (6 files), google_drive_ingestion.py, web_retrieval.py, lineage_search.py, contradiction_search.py | `event_data` | Insert/query fails |
| `payload_hash` | workers/*.py (6 files), google_drive_ingestion.py, web_retrieval.py, authority_search.py | No such column | Insert/query fails |
| `id` (BIGSERIAL) | claim_worker.py | `id` exists but is UUID | May work for SELECT, wrong type for insert |

---

# Column Gaps on Existing Tables

## events table

| Missing Column | Needed For | Defined In |
|---------------|-----------|------------|
| `payload_hash VARCHAR(64)` | Projection integrity verification | migration_add_projection_columns.sql |
| `deleted_at TIMESTAMPTZ` | Soft delete | schema_expanded.sql |

## claims table

| Missing Column | Needed For | Constitutional Requirement |
|---------------|-----------|---------------------------|
| `verification_status VARCHAR(50)` | Distinguished verified vs candidate claims | AGENT_CONSTITUTION.md |
| `source_event_id UUID` | Link back to originating event | EVENT_LAW.md |
| `content_hash VARCHAR(64)` | Claim content integrity | IDENTITY_LAW.md |

## objects table

| Missing Column | Needed For | Constitutional Requirement |
|---------------|-----------|---------------------------|
| `authority_class VARCHAR(50)` | Declared authority hierarchy | AUTHORITY_LAW |
| `payload_hash VARCHAR(64)` | Content integrity | VERIFICATION |

---

# Schema Gap Summary

| Gap Type | Count | Impact |
|----------|-------|--------|
| Tables defined but never created | 28+ | Constitutional artifacts missing from database |
| Tables existing but missing required columns | 3 (claims, objects, events) | Cannot store constitutional properties |
| Incompatible schema usage | 9+ producers | Events table inserts silently fail for legacy workers |
| Legacy columns referenced but missing | 3 (stream, payload, payload_hash) | Queries fail at runtime |

---

**Report Status:** COMPLETED
