# Artifact Runtime Migration Plan

**Audit Date:** 2026-06-25
**Audit Type:** PHASE E.7B - Investigation 6
**Objective:** Design migration phases from document-centric to constitutional artifact runtime.

---

# Executive Summary

**Migration:** 6 phases, document-centric → artifact-centric runtime.

**Governing Constraint:** Constitutional properties (authority_class, verification, lineage, witness, supersession) are PostgreSQL-exclusive. Qdrant cannot replace them. Migration must preserve PostgreSQL constitutional ownership.

**Diagnostic Evidence (2026-06-25):**
- Qdrant has 5 vectors (constitutional_documents), 0 in constitutional_memory
- Postgres tables authority_objects, authority_lineage, authority_witness, authority_supersession do not exist (queried by authority_search.py but schema was never created)
- Reasoning pipeline (authority_search → lineage_search → graph_expand) never queries Qdrant
- Workers return empty results → supervisor synthesizes with zero evidence

**Migration is not optional — it is required to fix the broken reasoning pipeline.**

---

# Phase 0: Current Architecture

## State

```
User Query
  ↓
[Ollama direct answer] → ❌ NO RETRIEVAL
  or
[/constitution/search] → Qdrant → results returned to caller (no LLM)
  or
[/reasoning/query] → Supervisor → Workers → Postgres queries → empty results → synthesis
```

## What Works
- Qdrant ingestion of constitutional_documents (5 vectors)
- `/constitution/search` endpoint (verified by Postgres content_hash match)
- Direct Ollama chat (no retrieval)
- Supervisor protocol framework

## What's Broken
- Reasoning pipeline never queries Qdrant
- Postgres authority tables don't exist → authority_search.py returns empty
- lineage_search.py queries wrong column names (`stream` instead of `event_type`, `payload` instead of `event_data`)
- Projections table uses wrong schema (no `event_id` column)
- Search worker returns empty findings for every query

## Key Metrics
- Qdrant constitutional_documents: 5 points, 0 indexed
- Qdrant constitutional_memory: 0 points
- PostgreSQL events: 1,044 events
- PostgreSQL projections: partially populated
- Postgres authority tables: DO NOT EXIST

---

# Phase 1: Artifact Wrappers Around Existing Tables

## Goal
Add artifact-compatible views/fields to existing tables without schema migrations.

## Changes

### PostgreSQL Views

```sql
-- Artifact view over events table
CREATE VIEW artifact_events AS
SELECT
  event_id AS artifact_id,
  'EVENT' AS artifact_type,
  event_type AS content->>'event_type',
  event_data->>'content_hash' AS content_hash,
  timestamp AS created_at
FROM events;

-- Artifact view over projections table  
CREATE VIEW artifact_projections AS
SELECT
  id AS artifact_id,
  'PROJECTION' AS artifact_type,
  payload_hash AS content_hash,
  created_at
FROM projections;
```

### Authority Properties
- authority_class: currently in-memory only (authority_search.py hardcodes AUTHORITY_CLASSES list)
- verification: computed in authority_search.py mechanical_verification()
- lineage: queried via authority_lineage table (attempted, fails if table missing)
- witness: queried via authority_witness table (attempted, fails if table missing)
- supersession: queried via authority_supersession table (attempted, fails if table missing)

**Authority tables must exist.** Phase 1 creates schema only, no data migration.

### Search Worker Rewire
- Insert `try_qdrant_search()` fallback in authority_search.py when Postgres returns empty
- Query Qdrant `constitutional_documents` collection with `query` matched against payload content
- Return results in artifact-compatible format (artifact_id, authority_class, content_hash, ...)

## Benefits
- Immediate pipeline fix — workers return evidence instead of empty
- No schema migrations — views are zero-risk
- Qdrant constitutional_documents (5 docs) become immediately accessible to reasoning pipeline
- No data duplication

## Risks
- Qdrant fallback in authority_search bypasses declared authority resolution
- Solution: Tag Qdrant-only results as `authority_class: TEMPORARY_OBSERVATION` (lowest rank) until declared class is recorded

## Rollback Strategy
- Remove try_qdrant_search() fallback
- Views are SELECT-only, no data modified

## Estimated Effort
- 2-3 files modified (authority_search.py, search_worker.py)
- 0 new tables
- 0 schema migrations

---

# Phase 2: Unified Artifact Retrieval

## Goal
Create a single retrieval path that returns artifacts (not raw text) from all sources.

## Changes

### Retrieval Router
```
retrieve_artifacts(query, filters):
  1. authority_search → Postgres authority_objects (declared authority)
  2. IF empty: Qdrant search (constitutional_documents) 
  3. lineage_search → Postgres lineage + events
  4. RETURN unified artifact list
```

### Artifact Response Format
All retrieval endpoints return artifacts with canonical schema:
```json
{
  "artifacts": [
    {
      "artifact_id": "uuid",
      "artifact_type": "CONSTITUTIONAL_LAW",
      "authority_class": "CONSTITUTIONAL_LAW",
      "verification_status": "VERIFIED",
      "content": { ... }
    }
  ]
}
```

### Endpoint Updates
- `/constitution/search` → return artifacts with verification block
- `/constitutional/query` → return artifacts instead of snippets
- `/memory/search` → return artifacts instead of document results

## Benefits
- Single retrieval path for all consumers
- Unified artifact format across all endpoints
- Callers (Open WebUI, supervisor) parse one format

## Risks
- API contract changes for Open WebUI consumers
- Solution: Add artifact format as optional parameter (`format=artifact|legacy`)

## Rollback Strategy
- `format=legacy` parameter preserves current behavior
- Retrieval router is additive, not replacing existing paths

## Estimated Effort
- 3-4 files modified (app.py, constitutional_retrieval.py, constitutional_integration.py)
- 0 new tables

---

# Phase 3: Artifact-Native Context Pack

## Goal
Context Pack stores artifacts (not document text) as the atomic reasoning unit.

## Changes

### ContextPack Model
```python
@dataclass
class ContextPack:
    question: str
    artifacts: List[Artifact]       # NEW — replaces supporting_documents
    highest_authority: Optional[Artifact]  # Now typed as Artifact
    authority_chain: List[Artifact]        # Now typed as Artifact
    ...
```

### Context Pack Builder
- Accepts artifacts from Phase 2 retrieval router
 Groups artifacts by authority_class
- Renders structured context string for supervisor

### Supervisor Prompt
Before:
```
Context Pack:
{json.dumps(pack.to_dict())}
```

After:
```
## VERIFIED Artifacts (highest authority)
CONSTITUTIONAL_LAW: REPLAY_LAW.md — content_hash: abc123

## UNVERIFIED Artifacts (lower authority)
AI_GENERATED_ANALYSIS: claim_xyz — content_hash: def456

Question: What is replay?
```

## Benefits
- Supervisor sees authority + verification as structured metadata
- Better synthesis — can weigh artifacts by authority
- Enables authority-aware reasoning

## Risks
- Context Pack serialization format changes
- Supervisor prompt format changes may need tuning for different models
- Solution: Version context pack format, older supervisor can use legacy format

## Rollback Strategy
- Legacy Context Pack format preserved as fallback
- Supervisor supports both artifact and legacy input

## Estimated Effort
- 3 files (models.py, context_pack.py, supervisor.py)
- 0 new infrastructure

---

# Phase 4: Artifact-Native Reasoning Workers

## Goal
Workers operate on artifacts natively.

## Changes

### SearchWorker
- Receives artifacts from authority_search
- Passes artifact_id chain to lineage_search
- Returns artifact-enriched findings

### ContradictionWorker
- Contradiction detection over artifact content
- Stance annotated with authority_class of each artifact
- Confidence weighted by artifact verification_status

### MemoryWorker
- Builds Context Pack from artifacts directly
- No serialization/deserialization of dicts → objects

### ArchitectureWorker
- Repository symbols are artifacts
- Repository relationships are artifact relationships

## Benefits
- End-to-end artifact types — no dict serialization mismatches
- Workers access artifact properties directly (obj.authority_class vs dict.get('authority_class'))
- Static type checking catches schema errors

## Risks
- Refactoring existing workers carries regression risk
- Solution: worker-level tests before deployment

## Rollback Strategy
- Workers support both Artifact objects and legacy dicts
- Gradual migration per worker

## Estimated Effort
- 4 files (search_worker.py, contradiction_worker.py, architecture_worker.py, memory_worker.py)
- 0 new infrastructure

---

# Phase 5: Full Constitutional Artifact Runtime

## Goal
All runtime operations operate over artifacts.

## Changes

### Artifact Repository (PostgreSQL)
```sql
CREATE TABLE artifacts (
  artifact_id VARCHAR(255) PRIMARY KEY,
  artifact_type VARCHAR(50) NOT NULL,
  authority_class VARCHAR(50) NOT NULL,
  verification_status VARCHAR(50),
  lineage_root VARCHAR(255),
  witness_root VARCHAR(255),
  content_hash VARCHAR(64) NOT NULL,
  event_hash VARCHAR(64),
  created_at TIMESTAMP NOT NULL,
  content JSONB NOT NULL,
  metadata JSONB
);
```

**Only after all previous phases succeed.** This replaces the current fragmented table structure.

### Qdrant Collections
- Renamed to artifact-aware names
- Payload includes all artifact fields
- Filter queries by artifact_type + authority_class

### Ollama Integration
- Supervisor receives structured artifacts
- Workers pass artifacts via protocol (typed JSON)
- Synthesis references artifact_id in citations

### Witness Integration
- Artifact creation includes witness recording
- Witness root propagated through artifact chain
- Verification includes witness check

## Benefits
- Single storage model for all runtime objects
- Constitutional properties are first-class fields
- Type-safe throughout the stack

## Risks
- Schema migration required (events + projections + authority tables → artifacts)
- Existing 1,044 events must be migrated
- Open WebUI integration may need updates

## Rollback Strategy
- Views over artifacts table provide backward-compatible access
- Old tables preserved as read-only during transition period

## Estimated Effort
- 1 new table
- 5-8 file modifications
- 1 data migration script (1,044 events → artifacts)

---

# Migration Timeline

| Phase | Effort | Risk | Duration | Dependencies |
|-------|--------|------|----------|--------------|
| 0 (Current) | — | HIGH (pipeline broken) | — | — |
| 1 (Wrappers) | LOW | LOW | 1-2 days | None |
| 2 (Unified) | LOW | LOW | 1-2 days | Phase 1 |
| 3 (Context Pack) | MEDIUM | MEDIUM | 2-3 days | Phase 2 |
| 4 (Workers) | MEDIUM | MEDIUM | 3-5 days | Phase 3 |
| 5 (Full Runtime) | HIGH | HIGH | 1-2 weeks | Phases 1-4 |

**Recommended: Execute Phase 1 immediately** (fix broken pipeline). Proceed to Phases 2-5 only if search volume justifies migration cost.

---

# Rollback Strategy Summary

| Phase | Rollback |
|-------|----------|
| 1 | Remove Qdrant fallback from authority_search.py. Views are SELECT-only. |
| 2 | `format=legacy` parameter preserves current behavior. Remove router. |
| 3 | Legacy Context Pack format preserved. Supervisor supports both. |
| 4 | Workers support both Artifact objects and legacy dicts. |
| 5 | Old tables preserved as read-only. Views provide backward-compatible access. |

Every phase has a rollback path that restores Phase 0 behavior without data loss.

---

# Cost-Benefit Analysis

| Phase | Benefit | Cost | ROI |
|-------|---------|------|-----|
| 1 | Fixes broken pipeline immediately | 2-3 files, 1 day | HIGHEST |
| 2 | Single retrieval format | 3-4 files, 2 days | MEDIUM |
| 3 | Better supervisor reasoning | 3 files, 3 days | MEDIUM |
| 4 | Type-safe workers | 4 files, 5 days | LOW (ergonomic) |
| 5 | Full artifact runtime | 2 weeks | LOW (high risk, high reward) |

**Recommendation:** Execute Phase 1 immediately. Evaluate ROIs for Phases 2-5 against actual usage metrics.

---

**Investigation Status:** COMPLETED
