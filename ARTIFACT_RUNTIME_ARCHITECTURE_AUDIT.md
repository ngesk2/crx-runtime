# Artifact Runtime Architecture Audit

**Audit Date:** 2026-06-25
**Audit Type:** PHASE E.7B — Constitutional Artifact Runtime Migration
**Previous Audits:** ARTIFACT_INVENTORY.md, CANONICAL_ARTIFACT_SCHEMA.md, POSTGRES_CONSTITUTIONAL_OWNERSHIP.md, QDRANT_ARTIFACT_READINESS.md, OLLAMA_ARTIFACT_REASONING.md, ARTIFACT_RUNTIME_MIGRATION_PLAN.md, CONSTITUTIONAL_ARTIFACT_IMPACT_REPORT.md

---

# 1. Executive Summary

## The Problem

The current PING runtime is document-centric but the reasoning pipeline is broken:

- **Qdrant has data** (5 vectors in constitutional_documents) **but the reasoning pipeline never queries it** — authority_search.py queries Postgres tables that don't exist, then falls back to empty local JSON files
- **PostgreSQL has 1,044 events** but the authority tables (authority_objects, authority_lineage, authority_witness, authority_supersession) were never created — schema definition exists in code but not in the database
- **The supervisor synthesizes answers from empty evidence** — when we queried "What is the constitutional basis for event verification?" the search worker returned empty authority_chain, empty supporting_documents, and the supervisor answered with "no explicit constitutional basis"

## The Diagnosis

The system is structurally sound in design but has a gap between:

```
Documented architecture       Actual runtime
───────────────────────       ──────────────
Postgres authority tables     Tables don't exist → queries fail → empty results
Qdrant search pipeline        Workers never call Qdrant → no evidence retrieved
Pre-retrieval authority       authority_search.py runs but finds nothing → no authority resolution
```

## The Solution

**Hybrid document/artifact architecture (Recommendation B).**

Not a full rewrite — surgical changes to the retrieval path so the existing authority resolution code actually finds what it's looking for. Artifact wrappers around existing tables. No schema migrations. No new infrastructure.

---

# 2. Current State

## Storage Systems

| System | Contents | Status |
|--------|----------|--------|
| PostgreSQL events | 1,044 events (EVENT_CREATED, DOCUMENT_IMPORTED, etc.) | HEALTHY |
| PostgreSQL projections | Projection metadata | PARTIAL (schema mismatch) |
| PostgreSQL authority_objects | Authority class declarations | ❌ TABLE MISSING |
| PostgreSQL authority_lineage | Lineage relationships | ❌ TABLE MISSING |
| PostgreSQL authority_witness | Witness records | ❌ TABLE MISSING |
| PostgreSQL authority_supersession | Supersession records | ❌ TABLE MISSING |
| Qdrant constitutional_documents | 5 vectors (768-dim Cosine) | HEALTHY (0 indexed, brute-force) |
| Qdrant constitutional_memory | 0 vectors | EMPTY |
| Qdrant memory | Google Drive document embeddings | NOT ACCESSIBLE (API key mismatch) |

## Pipeline

```
/reasoning/query
  ↓
Supervisor.plan()
  ↓
SearchWorker.execute()
  ↓ authority_search(query)  ← queries Postgres authority_objects → TABLE MISSING → empty
  ↓ lineage_search(artifact_id) ← empty, no artifact_id to search
  ↓ graph_expand(node, depth) ← empty, no node to expand
  ↓
ContradictionWorker.execute() ← empty, no evidence to check
  ↓
ArchitectureWorker.execute() ← repository symbols only
  ↓
MemoryWorker.execute() ← empty, no findings to pack
  ↓
Supervisor.synthesize_answer() ← synthesizes from empty context
```

## What Works Correctly

- `/constitution/search` endpoint: queries Qdrant → verifies against Postgres → returns verified results
- `/constitutional/documents` endpoint: returns 5 constitutional documents
- Constitutional document ingestion: writes to Postgres events + Qdrant in correct CQRS schema
- Qdrant health check: 2 collections, 5 points, operational

## What's Broken

- **Primary reasoning pipeline returns empty results for every query**
- **Authority tables were specified in the architecture but never created**
- **Legacy tools (lineage_search.py, contradiction_search.py) use wrong column names** (stream vs event_type, payload vs event_data, id vs event_id)
- **Qdrant API key auth blocks external curl/Open WebUI queries**

---

# 3. Artifact Model

## Canonical Schema

```json
{
  "artifact_id": "UUID (mandatory)",
  "artifact_type": "enum (mandatory)",
  "authority_class": "enum (mandatory)",
  "verification_status": "enum (optional)",
  "lineage_root": "artifact_id (optional)",
  "witness_root": "SHA256 (optional)",
  "content_hash": "SHA256 (mandatory)",
  "event_hash": "SHA256 (optional)",
  "content": "object (variable)",
  "metadata": "object (variable)"
}
```

## Type Mapping

| Current Type | Artifact Type | Migration |
|-------------|--------------|-----------|
| vault/constitution documents | CONSTITUTIONAL_DOCUMENT | Artifact wrapper |
| vault/laws documents | CONSTITUTIONAL_LAW | Artifact wrapper |
| vault/audits documents | AUDIT_REPORT | Artifact wrapper |
| Event store events | EVENT | Native (already artifact-like) |
| Claims | CLAIM | Artifact wrapper over event | 
| Observations | OBSERVATION | Artifact wrapper over event |
| Qdrant points | PROJECTION | Payload enhancement |
| Repository symbols | CODE_SYMBOL | Artifact wrapper |
| authority_objects | AUTHORITY_OBJECT | Native (already artifact schema) |

## Key Insight

The artifact model does not require a new table. It requires a **unified view** over existing tables + **payload field additions** to Qdrant. PostgreSQL already stores artifact-like data — it just needs a consistent schema projection.

---

# 4. PostgreSQL Ownership

## Constitutional Properties

| Property | Table | Must Stay in Postgres? | Qdrant Can Store? |
|----------|-------|----------------------|-------------------|
| authority_class | authority_objects | ✅ YES — declared hierarchy | PAYLOAD ONLY — cannot order by it |
| verification_status | authority_objects | ✅ YES — mechanical 5-check | PAYLOAD ONLY — cannot verify |
| lineage | authority_lineage | ✅ YES — ancestor/descendant | PAYLOAD ONLY — cannot traverse |
| witness | authority_witness | ✅ YES — cryptographic | PAYLOAD ONLY — cannot verify |
| supersession | authority_supersession | ✅ YES — chain | PAYLOAD ONLY — cannot resolve |
| event_hash | events | ✅ YES — replay source | PAYLOAD ONLY — cannot verify |
| content | events / vault | YES | ✅ YES — vector embeddable |

## Critical Finding

**PostgreSQL owns ALL constitutional properties.** Qdrant is a retrieval acceleration layer, not a constitutional authority source. Every Qdrant result must be verified against PostgreSQL before use.

## Missing Tables

The following tables are defined in `authority_search.py` queries but DO NOT exist in the database:

| Table | Queried By | Impact |
|-------|-----------|--------|
| authority_objects | authority_search.py | Primary authority resolution fails |
| authority_lineage | authority_search.py, lineage_search.py | Lineage depth fails |
| authority_witness | authority_search.py | Witness count fails |
| authority_supersession | authority_search.py | Supersession exclusion fails |

**These tables must be created** for the constitutional pipeline to function. The schema is already defined in the code — only the `CREATE TABLE` statements were never executed.

---

# 5. Qdrant Ownership

## Current State

| Collection | Points | Indexed | Purpose |
|-----------|--------|---------|---------|
| constitutional_documents | 5 | 0 (brute force) | Constitutional law embedding + payload |
| constitutional_memory | 0 | 0 | Reserved — empty |

## What Qdrant Owns

- **Vector embeddings** — 768-dimensional Cosine vectors for semantic search
- **Projection payload** — document metadata (content_hash, event_id, authority_level)
- **Search acceleration** — brute-force search over 5 points (indexing not needed until >10K points)

## What Qdrant Does Not Own

- Authority class (declared hierarchy)
- Verification (mechanical 5-check)
- Lineage (ancestor/descendant)
- Witness (cryptographic)
- Supersession (chain)

## Readiness

Qdrant CAN store all artifact fields as JSON payload. Adding artifact metadata fields to existing payloads requires no schema migration — payloads are schemaless. The constraint is that Qdrant cannot perform authority-class ordering or verification — those must remain PostgreSQL responsibilities.

---

# 6. Ollama Ownership

## Current State

Ollama receives **no artifact properties** in any code path. The supervisor receives a plain text context string. Direct chat receives the user message only.

## What Ollama Should Receive

Artifact properties as READ-ONLY reasoning context:

- `authority_class` — governing authority (declared, not scored)
- `verification_status` — mechanical verification result
- `lineage_depth` — proximity to root truth
- `witness_present` — cryptographic witness status
- `superseded_by` — supersession status

## What Ollama Must NEVER Derive

- `authority_class` assignment (would break AUTHORITY_LAW)
- `verification` status (would break VERIFICATION)
- `witness` validity (would break WITNESS_LAW)
- `supersession` (would break AUTHORITY_LAW)
- `event_hash` (would break REPLAY_LAW)

## Current Compliance

**FULLY COMPLIANT.** No artifact properties are exposed to any LLM today. Adding structured artifact properties as context (READ-ONLY) would improve reasoning quality without constitutional risk.

---

# 7. Migration Path

## Phase 1 (IMMEDIATE — fix broken pipeline)

**Add Qdrant fallback to authority_search.py** when Postgres returns empty:

```python
def try_qdrant_search(query):
    client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    embedding = inference_adapter.embed(query)
    results = client.search(
        collection_name="constitutional_documents",
        query_vector=embedding,
        limit=5
    )
    return [q_result_to_candidate(r) for r in results]
```

Tag Qdrant-only results as `TEMPORARY_OBSERVATION` (lowest authority rank) until declared class is recorded in Postgres.

**Benefits:** Immediate pipeline fix — workers return evidence.  
**Risk:** LOW — additive change, no existing behavior modified.  
**Effort:** 2-3 files, 1 day.

## Phase 2 (SHORT-TERM — unified retrieval)

Single retrieval path returning artifacts from all sources.

**Benefits:** One format for all consumers.  
**Risk:** LOW — additive with legacy fallback.  
**Effort:** 3-4 files, 2 days.

## Phase 3 (MEDIUM-TERM — artifact Context Pack)

Context Pack stores artifacts as typed objects.

**Benefits:** Better supervisor reasoning from structured evidence.  
**Risk:** MEDIUM — serialization format changes.  
**Effort:** 3 files, 3 days.

## Phase 4 (MEDIUM-TERM — artifact workers)

Workers operate on artifacts natively.

**Benefits:** Type-safe throughout the pipeline.  
**Risk:** MEDIUM — regression risk.  
**Effort:** 4 files, 5 days.

## Phase 5 (LONG-TERM — full artifact runtime)

Single artifacts table replacing fragmented structure.

**Benefits:** Single storage model.  
**Risk:** HIGH — schema migration required.  
**Effort:** 2 weeks.

---

# 8. Constitutional Impact

| Law | Current State | Artifact Impact | Direction |
|-----|--------------|----------------|-----------|
| TRUTH_LAW | Truth = event, recomputed per query | Truth = artifact with VERIFIED status, stored | STRENGTHENED |
| EVENT_LAW | 6 event classes, 1,044 events | Events are artifacts — schema unchanged | UNAFFECTED |
| IDENTITY_LAW | Fragmented identity across systems | Single artifact_id across all systems | STRENGTHENED |
| REPLAY_LAW | Trust-based, no hash chain | event_hash + lineage_root enable verification | STRENGTHENED |
| WITNESS_LAW | Witness requires JOIN query | witness_root is first-class field | STRENGTHENED |
| MUTATION_LAW | Events only (append-onwrite) | content_hash mandatory on all types | STRENGTHENED |

**5 of 6 laws strengthened. 0 laws weakened.**

---

# 9. Recommendation

## Recommendation B: Hybrid Document/Artifact Architecture

Not full artifact runtime. Not purely document-centric. A **hybrid** that:

1. **Keeps PostgreSQL as constitutional authority** (ownership of all 5 constitutional properties)
2. **Enhances Qdrant payloads** with artifact metadata fields (schemaless, no migration)
3. **Adds Qdrant fallback** to authority_search.py so the reasoning pipeline returns results
4. **Creates artifact views** over existing tables (no data duplication, no migration)
5. **Exposes artifact properties** to Ollama as structured READ-ONLY context

## Why Not A or C

| Option | Verdict | Reason |
|--------|---------|--------|
| A) Remain document-centric | ❌ REJECTED | Pipeline is functionally broken — workers return empty results for every query |
| B) Hybrid document/artifact | ✅ RECOMMENDED | Fixes the pipeline immediately with surgical changes. Preserves all constitutional guarantees. Enables artifact migration at each system's pace |
| C) Full artifact runtime | ❌ REJECTED | Premature. Schema migration of 1,044 events is high-risk. Better to wrap existing tables and migrate incrementally |

## Immediate Action Items

1. **Add Qdrant fallback to authority_search.py** (Phase 1) — the pipeline must return evidence
2. **Create missing authority tables** (authority_objects, authority_lineage, authority_witness, authority_supersession) — the constitutional pipeline requires them
3. **Fix column names in legacy tools** (lineage_search.py, contradiction_search.py) — use CQRS schema columns

## Evidence Supporting This Recommendation

1. **Diagnostic query test:** `/reasoning/query` returned empty authority_chain, empty supporting_documents, null authority_resolution. The broken pipeline is not theoretical — it was observed.
2. **Qdrant logs:** Last search at 21:40:53. Reasoning query at 02:17:53 produced zero Qdrant activity. The pipeline does not query Qdrant.
3. **Postgres errors:** `relation "authority_objects" does not exist` — authority_search.py fails on every query.
4. **5 verified documents in Qdrant:** Valid evidence exists but is inaccessible to the pipeline.
5. **Constitutional ownership audit:** All 5 constitutional properties are PostgreSQL-exclusive. Qdrant cannot replace any of them.

The hybrid architecture is not a compromise. It is the minimum viable change that fixes the pipeline, preserves constitutional guarantees, and enables incremental artifact migration without rebuilding the system.

---

**Audit Status:** COMPLETED
**Recommendation:** B — Hybrid Document/Artifact Architecture
**Next Action:** Phase 1 — Add Qdrant fallback to authority_search.py
