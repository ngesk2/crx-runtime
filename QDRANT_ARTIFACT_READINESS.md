# Qdrant Artifact Readiness

**Audit Date:** 2026-06-25
**Audit Type:** PHASE E.7B - Investigation 4
**Objective:** Determine whether Qdrant can index artifacts rather than document chunks.

---

# Executive Summary

**Current State:** Qdrant stores vector embeddings with JSON payloads. No artifact-aware indexing exists.

**Diagnostic Evidence (2026-06-25):**
- `constitutional_documents`: 5 points, 768-dim Cosine, 0 indexed vectors
- `constitutional_memory`: 0 points
- Pipeline test: reasoning query returned empty highest_authority, empty authority_chain — Qdrant was never queried
- Qdrant logs: last search at 21:40:53, reasoning query at 02:17:53 produced no Qdrant activity

**Key Finding:** Qdrant CAN store all artifact fields as payload. It CANNOT perform authority-class ordering, witness verification, or supersession filtering natively. Those must remain PostgreSQL responsibilities.

---

# Artifact Type Evaluation

## Document Types

### CONSTITUTIONAL_DOCUMENT

| Property | Can Qdrant Store? | Current State |
|----------|-------------------|---------------|
| artifact_id | YES — payload field | Stored as `event_id` or `document_name` |
| authority_class | YES — payload field | Stored as `authority_level` |
| verification_status | YES — payload field | Inferred from projection integrity |
| lineage_root | YES — payload field | Partially stored as `source_event_id` |
| witness_root | YES — payload field | NOT stored |
| content | YES — payload field | Stored as `content` |
| vector | YES — native | 768-dim embedding stored |

**Verdict:** READY — Qdrant can store all fields. Witness and lineage require PostgreSQL for source of truth.

### CONSTITUTIONAL_LAW
Same as CONSTITUTIONAL_DOCUMENT. Identical evaluation.

**Verdict:** READY

### AUDIT_REPORT, CERTIFICATION, CAPABILITY_SPEC, INTEGRATION_SPEC, RUNBOOK
All document subtypes. Same payload structure.

**Verdict:** READY

---

## Event Types

### EVENT

| Property | Can Qdrant Store? | Current State |
|----------|-------------------|---------------|
| artifact_id | YES | Stored as `event_id` |
| authority_class | YES | Derived from event_type, NOT stored |
| verification_status | YES | NOT stored — inferred post-query |
| lineage_root | YES | NOT stored |
| witness_root | YES | NOT stored |
| payload | YES | NOT stored — Qdrant stores projection, not raw event |

**Verdict:** PARTIAL — Qdrant stores projections (derived vectors), not raw events. Raw events belong in PostgreSQL. Qdrant can store artifact metadata fields for projected events.

### CLAIM

| Property | Can Qdrant Store? | Current State |
|----------|-------------------|---------------|
| artifact_id | YES | Stored if projected |
| authority_class | YES | NOT stored |
| verification_status | YES | NOT stored |
| lineage_root | YES | Partially stored |
| witness_root | YES | NOT stored |
| claim_text | YES | Stored as `content` if projected |

**Verdict:** PARTIAL — Claims projected to Qdrant can carry artifact metadata. Unprojected claims exist only in PostgreSQL.

### OBSERVATION
Same as CLAIM. Identical evaluation.

**Verdict:** PARTIAL

### PROJECTION

| Property | Can Qdrant Store? | Current State |
|----------|-------------------|---------------|
| artifact_id | YES | Stored as point ID |
| authority_class | YES | NOT stored |
| verification_status | YES | Stored as `projection_verified` |
| lineage_root | YES | Stored as `source_event_id` |
| witness_root | YES | NOT stored |
| vector | YES | Native |

**Verdict:** READY — Projections are Qdrant-native. Artifact metadata can be added to existing payload schema.

---

## Repository Types

### REPOSITORY, REPOSITORY_FILE, CODE_SYMBOL, REPOSITORY_RELATIONSHIP

| Property | Can Qdrant Store? | Current State |
|----------|-------------------|---------------|
| artifact_id | YES | NOT stored — no Qdrant indexing exists |
| authority_class | YES | NOT stored |
| verification_status | YES | NOT stored |
| lineage_root | YES | NOT stored |
| witness_root | YES | NOT stored |
| content | YES | NOT stored |

**Verdict:** UNREADY — No Qdrant indexing exists for repository types. Adding payload is trivial (JSONB). Value depends on whether vector search over symbols/relationships is useful.

---

# Qdrant Capability Assessment

## What Qdrant CAN Do

| Capability | Supported | Notes |
|------------|-----------|-------|
| Store JSON payload | ✅ YES | Key-value fields up to payload size limit |
| Filter by payload field | ✅ YES | Filter by artifact_id, authority_class, etc. |
| Hybrid search (vector + filter) | ✅ YES | Filter by authority_class before vector search |
| Scroll all points | ✅ YES | Currently used for get_all_documents() |
| Point update/delete | ✅ YES | Update artifact metadata in place |
| Batch upsert | ✅ YES | Currently used for constitutional_documents ingestion |

## What Qdrant CANNOT Do

| Capability | Not Supported | Impact |
|------------|---------------|--------|
| Declared authority class ordering | ❌ NO | Cannot sort by AUTHORITY_CLASSES list order |
| Mechanical 5-check verification | ❌ NO | Cannot verify artifact_hash + event_hash + lineage + witness + projection |
| Ancestor/descendant lineage traversal | ❌ NO | Cannot trace lineage graph (needs recursive SQL) |
| Witness cryptographic verification | ❌ NO | Cannot validate witness signatures |
| Supersession chain resolution | ❌ NO | Cannot identify superseded artifacts |
| Event replay verification | ❌ NO | Cannot verify event_hash consistency |
| Transactional cross-collection consistency | ❌ NO | Each collection is independent |

---

# Payload Schema for Artifact-Aware Qdrant

## Current Payload (constitutional_documents)

```json
{
  "document_name": "string",
  "document_type": "string",
  "content": "string",
  "content_hash": "string",
  "event_id": "string",
  "payload_hash": "string",
  "tier": 1
}
```

## Proposed Payload (artifact-aware)

```json
{
  "artifact_id": "string (UUID)",
  "artifact_type": "string (enum)",
  "authority_class": "string (enum)",
  "verification_status": "string (enum)",
  "lineage_root": "string (artifact_id or null)",
  "witness_root": "string (SHA256 or null)",
  "created_from": "string (artifact_id or null)",
  "superseded_by": "string (artifact_id or null)",
  "content_hash": "string (SHA256)",
  "event_hash": "string (SHA256)",
  "created_at": "ISO8601",
  "content": "object",
  "metadata": "object",
  "vector": "array (float)"
}
```

**Payload size increase:** ~200 bytes per point (negligible vs. content + vector).

## Filter Indexing

Qdrant supports payload field indexing for filtering:

```json
{
  "indexed_fields": [
    "artifact_id",
    "artifact_type",
    "authority_class",
    "verification_status",
    "lineage_root"
  ]
}
```

**Feasibility:** HIGH — Qdrant payload filtering is production-ready.

---

# Scenarios Evaluated

## Scenario A: Qdrant as Primary Artifact Store

**Proposal:** Move all artifact data to Qdrant payloads, use PostgreSQL for authority metadata only.

**Verdict:** ❌ NOT SAFE — PostgreSQL owns 5 constitutional properties Qdrant cannot provide. Qdrant payloads would be read-only clones of PostgreSQL authority data.

## Scenario B: Qdrant as Artifact Search Index

**Proposal:** Qdrant indexes artifacts with authority_class + verification_status fields in payload. PostgreSQL remains authority source of truth.

**Verdict:** ✅ SAFE — Qdrant filters can pre-filter by authority_class before vector search. PostgreSQL verifies after retrieval.

## Scenario C: Hybrid — Qdrant for Projections, PostgreSQL for Everything Else

**Proposal:** Qdrant continues indexing projections (current architecture). Artifact metadata stored as payload enhancements.

**Verdict:** ✅ RECOMMENDED — Minimum change, maximum compatibility. Current architecture already approximates this.

---

# Conclusion

**Qdrant artifact readiness: READY with constraints.**

- Qdrant CAN store all artifact fields as JSON payload
- Qdrant CAN filter by artifact_id, authority_class, verification_status
- Qdrant CANNOT perform authority resolution, witness verification, or supersession handling
- PostgreSQL MUST remain authority source of truth
- Adding artifact fields to Qdrant payloads requires NO schema migration — payloads are schemaless

**Recommendation:** Add artifact metadata fields to Qdrant payloads for filter-enabled search. Keep all constitutional property ownership in PostgreSQL.

---

**Investigation Status:** COMPLETED
