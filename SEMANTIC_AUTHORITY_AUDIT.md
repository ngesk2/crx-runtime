# Semantic Authority Audit

**Date:** 2026-06-24
**Scope:** Full codebase — workers, runtime, orchestration, retrieval, newsletter
**Method:** Source code inspection + endpoint behaviour analysis

---

## Audit 1: Observation Leakage

**Verdict: FAIL**

### Finding
Observations are emitted into the authoritative event stream without verification gates.

| Source | File | Line | Issue |
|--------|------|------|-------|
| `summary_worker.py` | `workers/summary_worker.py` | 42 | Naive `.split('.')[:3]` summarization emitted as `OBSERVATION_CREATED` — zero verification |
| `drive_ingestor.py` | `runtime/ingestion/drive_ingestor.py` | 136-159 | Self-documents as "NOT authoritative truth" but emits `DOCUMENT_IMPORTED` into same event stream |
| `google_drive_ingestion.py` | `brainos/orchestration/src/google_drive_ingestion.py` | 244 | Still emits deprecated `DOCUMENT_OBSERVED` (conflates artifact entry + observation) |
| `web_retrieval.py` | `brainos/orchestration/src/web_retrieval.py` | 179, 225 | LLM summaries emitted as `CONTENT_SUMMARIZED` / `RETRIEVAL_PIPELINE_COMPLETE` — reasoning output stored as observation |
| `qdrant_projection_worker.py` | `runtime/workers/qdrant_projection_worker.py` | 206-241 | Projects ALL event types to Qdrant with no filtering — unverified observations become Qdrant points |

### Failure path
```
PDF/Web
  ↓
OBSERVATION_CREATED (no verification)
  ↓
Postgres events
  ↓
Qdrant (projected by qdrant_projection_worker)
  ↓
Retrieved as-if-authoritative
```

---

## Audit 2: Claim Contamination

**Verdict: FAIL**

### Finding
Claims are injected into the authoritative event stream with zero verification.

| Source | File | Line | Issue |
|--------|------|------|-------|
| `claim_worker.py` | `workers/claim_worker.py` | 27-29 | Naive claim extraction: sentences containing `' should '`, `' must '`, `' is '` — no verification |
| `claim_worker.py` | `workers/claim_worker.py` | 42 | Emits `CLAIM_CREATED` into Postgres event stream |
| `qdrant_projection_worker.py` | `runtime/workers/qdrant_projection_worker.py` | 213 | Projects `CLAIM_CREATED` events to Qdrant (matches `DOCUMENT_IMPORTED`/`DOCUMENT_UPDATED` filter) |

### Failure path
```
Raw text
  ↓
Heuristic keyword match
  ↓
CLAIM_CREATED (no review, no verification)
  ↓
Postgres → Qdrant
  ↓
Treated as knowledge
```

---

## Audit 3: Evidence Contamination

**Verdict: FAIL**

### Finding
Projection evidence (Qdrant verification status) directly inflates authority scores.

| Source | File | Line | Issue |
|--------|------|------|-------|
| `authority_search.py` | `runtime/tools/authority_search.py` | 78 | Scoring formula: `(level * 0.4) + (verification * 0.25) + (depth * 0.15) + (witness * 0.15)` — **projection verification gets 25% weight in authority score** |
| `authority_search.py` | `runtime/tools/authority_search.py` | 44, 55 | Verification reads from `projection_verification.csv` — a flat file mapping artifacts to projection validity |
| `authority_search.py` | `runtime/tools/authority_search.py` | 16-18 | **Mitigation**: `CONSTITUTIONAL_FREEZE` env var makes tool exit with error unless explicitly disabled. Code is frozen but present. |

### Failure path
```
Qdrant projection verification
  ↓
authority_search.py:25% weight
  ↓
_authority_score
  ↓
Presented as constitutional authority
```

---

## Audit 4: Semantic Retrieval Distribution

**Verdict: FAIL**

### Classification of `/constitution/search` results

Based on actual API response (2026-06-24, query="governance"):

| Type | Count | % | Notes |
|------|-------|---|-------|
| **DOCUMENT** | 3 | 100% | `CONSTITUTION.md`, `INFRASTRUCTURE_LAW.md`, `REPLAY_LAW.md` — constitutional law docs ingested via `/constitutional/ingest` |
| OBSERVATION | 0 | 0% | Not currently in Qdrant (`constitutional_documents` collection is manually curated law docs) |
| CLAIM | 0 | 0% | None present |
| EVIDENCE | 0 | 0% | None present |
| DECISION | 0 | 0% | None present |

### Current distribution: 100% DOCUMENTS (safe)

### Risk
The `qdrant_projection_worker` projects ALL event types. If unverified observations, claims, summaries, or LLM output enter the event stream, they will be projected to the `constitutional_memory` collection alongside constitutional documents. The `/constitution/search` endpoint (app.py:1059-1097):

- **Returns Qdrant data directly** — no PostgreSQL verification
- **Returns `hit.score` (cosine similarity) as `score`** — no authority context
- **Does NOT call `constitutional_search.py`** (which has proper hash-based verification against Postgres)

---

## Audit 5: Authority Inversion

**Verdict: FAIL**

### Finding
Confidence is derived from, and presented as, authority score — creating a circular dependency.

| Source | File | Line | Issue |
|--------|------|------|-------|
| `authority_search.py` | `runtime/tools/authority_search.py` | 200-201 | `confidence = highest.get('_authority_score')` — **confidence IS the authority score** |
| `authority_search.py` | `runtime/tools/authority_search.py` | 187 | `c['_authority_score'] = round(s, 4)` — score includes `verification * 0.25` from projection evidence |
| `context_pack_builder.py` | `context_pack_builder.py` | 57 | Blind passthrough: `pack['highest_authority'] = a_res.get('highest_authority', {})` |
| `context_pack_builder.py` | `context_pack_builder.py` | 64 | Blind passthrough: `confidence: c_res.get('confidence', 0)` from heuristic contradiction search |
| `runtime/supervisor.py` | `runtime/supervisor.py` | 68 | Blind passthrough: `highest_authority: tool_outputs...` |
| `mission_control_authority_endpoint.py` | `mission_control_authority_endpoint.py` | 56, 61 | `confidence: 1.0 if authorities else 0.0` — binary, conflates existence with authority |

### Constitutional violation
```
Confidence = 0.99
  ↓
Authority increased
```

Confidence is NOT authority. Authority comes from: Artifact → Event → Lineage → Verification.

---

## Audit 6: Semantic Drift

**Verdict: WARNING**

### Canonical ontology (from `OBJECT_LANGUAGE_AUDIT.md`)

| Term | Definition |
|------|-----------|
| DOCUMENT | Artifacts |
| OBSERVATION | Facts extracted from artifacts by agents/workers |
| CLAIM | Assertions, analyses, interpretations |
| EVIDENCE | Derived representations (embeddings, projections, indexes) |
| DECISION | Explicit decisions / control actions |

### Drift 1: `DOCUMENT_OBSERVED` still in use
- `OBJECT_LANGUAGE_AUDIT.md:25` — explicitly marks as deprecated, recommends split into `DOCUMENT_IMPORTED` + `OBSERVATION_CREATED`
- `google_drive_ingestion.py:244` — **still emits `DOCUMENT_OBSERVED`**, conflating two distinct facts

### Drift 2: Summaries classified inconsistently
- `workers/summary_worker.py:42` — emits `OBSERVATION_CREATED` for summaries
- `OBJECT_LANGUAGE_AUDIT.md:55` — says `SUMMARY_*` should be classified as `CLAIM`
- **Drift**: Same thing classified as OBSERVATION in code, CLAIM in ontology

### Drift 3: Web retrieval events misclassified
- `web_retrieval.py:179,225` — `CONTENT_SUMMARIZED`, `RETRIEVAL_PIPELINE_COMPLETE` emitted as observation events
- External web content is not a system artifact — these should be `DOCUMENT` or `CLAIM`

### Drift 4: Newsletter analysis stored without classification
- `brainos/newsletter/database.py` — LLM analysis (summary, tags, key_ideas, actionable_insights) stored in same table as raw source content
- `brainos/newsletter/worker.py:98` — `update_newsletter_analysis()` makes no distinction between source and LLM output

---

## Audit 7: Retrieval-to-Reasoning Boundary

**Verdict: FAIL**

### Finding
LLM reasoning outputs re-enter the system as authoritative data in three independent paths.

### Path 1: Web Retrieval (`web_retrieval.py`)
```
External URL
  ↓
LLM summarization (web_retrieval.py:152-192)
  ↓
CONTENT_SUMMARIZED event (web_retrieval.py:179)
  ↓
RETRIEVAL_PIPELINE_COMPLETE event (web_retrieval.py:225)
  ↓
Postgres event stream
  ↓
Qdrant projection
  ↓
Available for retrieval-as-truth
```

### Path 2: Summary Worker (`workers/summary_worker.py`)
```
Raw text
  ↓
.split('.')[:3] "summarization" (summary_worker.py:28-30)
  ↓
OBSERVATION_CREATED (summary_worker.py:42)
  ↓
Postgres → Qdrant
```

### Path 3: Newsletter Pipeline (`brainos/newsletter/worker.py + database.py`)
```
Email
  ↓
LLM analysis (summarizer.py:14-82)
  ↓
update_newsletter_analysis() (worker.py:98)
  ↓
Same table as source (database.py)
  ↓
confidence=1.0 hardcoded (database.py:157,163)
  ↓
Archived as markdown artifact (worker.py:107)
```

### Recursive contamination risk
```
Reasoning (LLM)
  ↓
Stored as event / database row
  ↓
Embedded
  ↓
Retrieved
  ↓
Input to next reasoning cycle
```

---

## Summary

| # | Audit | Verdict | Key Issue |
|---|-------|---------|-----------|
| 1 | Observation Leakage | **FAIL** | Unverified observations enter event stream; no verification gate before Qdrant projection |
| 2 | Claim Contamination | **FAIL** | Heuristic claim extraction emits `CLAIM_CREATED` with zero verification |
| 3 | Evidence Contamination | **FAIL** | Projection verification weights authority scores at 25% (frozen but code present) |
| 4 | Semantic Retrieval Distribution | **FAIL** | `/constitution/search` returns unverified Qdrant data; proper verification exists but is unused |
| 5 | Authority Inversion | **FAIL** | Confidence IS authority score; projection evidence inflates authority; circular dependency |
| 6 | Semantic Drift | **WARNING** | Ontology documented but consistently violated in 4 places; `DOCUMENT_OBSERVED` still used despite deprecation |
| 7 | Retrieval-to-Reasoning Boundary | **FAIL** | 3 paths where LLM reasoning output re-enters the system without classification or verification |

**Overall: 1 WARNING, 6 FAIL — critical contamination across the entire pipeline.**

## Recommended Actions (ordered by severity)

1. **WIRE `constitutional_search.py` to the `/constitution/search` endpoint** — current endpoint skips all PostgreSQL verification
2. **Add event-type filter to `qdrant_projection_worker.py`** — block `OBSERVATION_CREATED`, `CLAIM_CREATED`, `CONTENT_SUMMARIZED` from projection without explicit verification
3. **Tag all LLM-generated data** in event payloads with `_source: "llm"` and `_verified: false`
4. **Remove `DOCUMENT_OBSERVED` emitter** in `google_drive_ingestion.py` — replace with `DOCUMENT_IMPORTED` + `OBSERVATION_CREATED`
5. **Remove `verification * 0.25` weight from `authority_search.py`** — projection status must never influence authority
6. **Add reasoning boundary check** to newsletter pipeline — separate LLM output from source data in schema or classification
7. **Add verification gate** to `claim_worker.py` and `summary_worker.py` — events should not enter stream without human or deterministic verification
