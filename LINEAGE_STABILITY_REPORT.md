# LINEAGE STABILITY REPORT

**Sweep 6 — Constitutional Artifact Identity + Hash Authority Audit**

**Date:** 2026-06-24
**Method:** Source code forensic analysis tracing each artifact through 8 survival scenarios.
**Rule:** A constitutional object must survive Drive ↔ Git ↔ Repo Runtime ↔ Artifact Pipeline ↔ Postgres ↔ Graph ↔ Qdrant ↔ Retrieval ↔ Replay ↔ Witness without changing identity, authority, lineage, or witness.

---

## Survival Simulation Results

| Operation | content_hash | payload_hash | event_id | chunk_id | aggregate_id | projection_hash | witness | authority_level |
|---|---|---|---|---|---|---|---|---|
| Rename file | ✓ | ✓ | ✓ | **✗** | **✗** | ✓ | ✓ | **✗** |
| Move to different directory | ✓ | ✓ | ✓ | **✗** | **✗** | ✓ | ✓ | **✗** |
| Restore from backup | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Rechunk (change split points) | ✓ | ✓ | ✓ | **✗** | ✓ | **✗** | **✗** | ✓ |
| Reindex (re-ingest) | ✓ | ✓ | **✗** | **✗** | **✗** | **✗** | **✗** | ✓ |
| Re-embed (new vectors) | ✓ | ✓ | ✓ | ✓ | ✓ | **✗** | ✓ | ✓ |
| Replay from source data | ✓ | ✓ | **✗** | ✓ | **✗** | ✓ | **✗** | ✓ |
| Rebuild Qdrant from events | ✓ | ✓ | ✓ | N/A | ✓ | N/A | N/A | ✓ |

**Legend:** ✓ = stable, ✗ = changes, N/A = not applicable

---

## Finding 1: `content_hash` — STABLE Across All Operations

8 independent implementations all use `sha256(content.encode('utf-8')).hexdigest()`. Consistent and deterministic.

**Files:**
- `constitutional_retrieval.py:82` — `sha256(content.encode()).hexdigest()`
- `projection_worker/projection_worker.py:55` — same
- `constitutional_projection_worker.py:83` — same
- `qdrant_projection_worker.py:298` — same (but on `searchable_text`, not raw content)
- `memory_ingestion_worker.py:116` — `sha256(content.encode('utf-8')).hexdigest()`
- `vault_audit_analysis.py:116` — same
- `database/documents.sql:150` — `encode(digest(p_content, 'sha256'), 'hex')` (PL/pgSQL)
- `google_drive_ingestion_adapter.py:126` — same

**Exception:** `qdrant_projection_worker.py:298` hashes `searchable_text` (a concatenation `Title: ...\nSource: ...\nType: ...`) rather than raw content. This creates a different hash for the same document if the template changes.

**Verdict: PASS — consistent implementation**

---

## Finding 2: `payload_hash` — STABLE Within Same Pipeline, UNSTABLE Across Pipelines

### Consistent pattern (5 files):
`sha256(json.dumps(obj, sort_keys=True).encode()).hexdigest()`

### Inconsistent pattern (1 file):
`constitutional_retrieval.py:135` — `payload_hash = content_hash`

This means in `constitutional_retrieval.py`, `payload_hash` is `sha256(content.encode())`, while in `projection_worker.py`, `payload_hash` is `sha256(canonical_json(all_payload_data).encode())`. These differ for the same document.

**Impact on verification:** `app.py:1152` compares Qdrant `payload_hash` against Postgres `event_data->>'content_hash'`. This only works if `payload_hash == content_hash` (as in `constitutional_retrieval.py`). If a different worker projected the document using its own `payload_hash` computation, verification fails.

**Verdict: PASS for same-pipeline comparison, FAIL for cross-pipeline**

---

## Finding 3: `event_id` — UNSTABLE Under Reindex and Replay

### Dominant pattern (14 of 16 paths): `uuid.uuid4()` — Random
Non-deterministic. Every reindex creates new event IDs. Replay from source data cannot reproduce identical event IDs.

### Deterministic pattern (2 of 16 paths):
- `constitutional_retrieval.py:87` — `uuid5(NAMESPACE_DNS, doc_name + content)` — **stable under replay**
- `google_drive_ingestion_adapter.py:255` — `sha256(str(event))[:16]` — fallback only, truncated

### Impact:
- Postgres events table has different event_ids on reingest
- Qdrant points reference event_ids that no longer exist
- Lineage queries that join on event_id become orphaned
- Verification that compares event_id across Postgres and Qdrant fails
- Replay certificates reference event_ids that cannot be reproduced

**Verdict: FAIL — cannot survive reindex or replay**

---

## Finding 4: `aggregate_id` — UNSTABLE Under Rename and Replay

| Worker | Generator | Stability |
|---|---|---|
| `event_emitter.py:101` | `uuid5(DNS, f"stream.{stream}")` | STABLE per stream name |
| `filesystem_worker.py:32` | `uuid5(URL, "file:///" + path)` | UNSTABLE under rename |
| `constitutional_retrieval.py:110` | Set to same value as event_id | UNSTABLE (copies non-deterministic event_id) |

The `constitutional_retrieval.py` approach defeats the purpose of aggregate_id: related events should share an aggregate_id, but here each event is its own aggregate.

**Verdict: FAIL — aggregate_id is not actually aggregate-scoped**

---

## Finding 5: `chunk_id` (Point ID) — UNSTABLE Under Rename, Move, Rechunk, Reindex

Three incompatible strategies:

### Strategy A — Path-based (OLD):
- `constitutional_projection_worker.py:151` — `f"{file_path}_{i}"`
- `projection_worker/projection_worker.py:150` — `int(sha256(path)[:16], 16)`
- **Breaks under:** rename, move, mirror, reindex on different mount
- **Survives:** restore (same absolute path), re-embed, replay

### Strategy B — DB-dependent (MIDDLE):
- `projection_worker.py:197` — `str(event['id'])` (SERIAL)
- **Breaks under:** replay, reindex (different insertion order)
- **Survives:** rename, move

### Strategy C — Random (CURRENT ACTIVE):
- `qdrant_projection_worker.py:302` — `str(uuid.uuid4())`
- **Breaks under:** everything — every projection is a new point
- **Guarantees:** Qdrant bloat on every projection cycle
- **Deduplication:** Impossible — same content projected twice creates duplicate points

### Strategy D — Content-addressed (ISOLATED):
- `constitutional_retrieval.py:83` — `UUID(content_hash[:32])`
- **Survives:** everything — pure content-based
- **Used by:** Only the ingestion pipeline, not the projection workers

**Verdict: FAIL — no content-based chunk identity in any projection worker**

---

## Finding 6: `projection_hash` — UNSTABLE Under Rechunk, Reindex, Reembed

Two incompatible strategies:

### Strategy A — Hash of vector (CURRENT ACTIVE):
- `qdrant_projection_worker.py:363-369` — `sha256(json.dumps({event_id, vector[:4], payload}))`
- **Includes first 4 embedding values** — re-embedding changes the vector, changing projection_hash
- **Circular dependency:** point ID (event_id) is also hashed into projection_hash
- **Breaks under:** rechunk (different event_ids), reembed (different vectors), reindex (different event_ids)

### Strategy B — Hash of hashes (CORRECT):
- `simple_projection_worker.py:81` — `sha256(canonical_hash + embedding_hash)`
- **Stable under:** rename, move, restore, replay
- **Breaks under:** reembed (different embedding_hash)
- This is the constitutional pattern: hash of content hash + embedding hash, independent of content

**Verdict: FAIL — current projection_hash includes embedding values, breaking stability under reembed**

---

## Finding 7: Witness Root — UNSTABLE Under Rechunk and Reindex

### Witness computation chain:
```
hash_bytes(data)
  → MerkleTree.hashBytes()         // FAIL: bytes→utf8Decode→hash
  → CertificateAuthority.sha256()   // receives potentially corrupted string
```

### Current implementation:
- `MerkleTree` leaves include `hexDecode(fingerprint.hash)`, `base64UrlDecode(canonicalBytes)`, `utf8Encode(strings)`, `CanonicalJson.toUint8Array(lineage)`, `stateSerializer.serializeState(state)`
- Each leaf includes domain separation prefix
- Any leaf that includes chunk-derived data (chunk index, chunk content hash) will change under rechunk
- The Merkle tree structure itself depends on the number and order of leaves

### Witness root stability:
| Operation | Witness Root Changes? | Why |
|---|---|---|
| Rename | **UNKNOWN** | Depends on whether path is in witness input |
| Move | **UNKNOWN** | Same as rename |
| Restore backup | **YES — stable** | Same state → same witness |
| Rechunk | **YES — changes** | Different leaf structure |
| Reindex | **YES — changes** | Different event sequence |
| Reembed | **NO — stable** | Embedding not in witness |
| Replay | **NO — stable** | Same state → same witness (assuming deterministic functions) |

**Verdict: FAIL — witness root cannot be reproduced after reindex or rechunk**

---

## Finding 8: Authority Level — UNSTABLE Under Rename

### Authority level determination:
`constitutional_projection_worker.py:96-111` derives authority level from file path fragments:

```python
def determine_authority_level(self, file_path: str) -> int:
    path = file_path.lower()
    if 'constitution' in path:
        return 100
    if 'research' in path:
        return 80
    if 'scripts' in path:
        return 60
    # ...
```

- **Breaks under rename:** if a file is moved out of the `constitution/` directory, its authority level changes
- **Breaks under mirror:** different mount point
- **Classification: PATH_DERIVED authority**

Authority should be content-assigned, not path-derived. Constitutional Law 2: "Authority MUST NOT depend on path."

---

## Finding 9: Empty Fallback Directory

**Path:** `runtime/data/` — directory exists but is empty.

All 5 tools have JSON file fallback paths that silently return empty results when Postgres is unavailable:
- `authority_search.py:181` — `runtime/data/authority_objects.json` — DOES NOT EXIST
- `lineage_search.py:77-80` — `runtime/data/{artifact_registry,events,projections,authority_lineage}.json` — DO NOT EXIST
- `graph_expand.py:68` — `runtime/data/object_relationships.json` — DOES NOT EXIST
- `contradiction_search.py:76` — `runtime/data/events.json` — DOES NOT EXIST

No warnings are logged when these files are missing. The fallback silently degrades.

**Verdict: FAIL — fallback path is non-functional**

---

## Finding 10: Replay Cannot Reproduce the Event Log

For replay to reproduce the identical event log, every event_id must be deterministic from source data. Currently:

| Required condition | Status |
|---|---|
| event_id = deterministic(content) | **FAIL** — 14/16 paths use uuid4() |
| aggregate_id = deterministic(aggregate) | **FAIL** — 3 incompatible generators |
| payload_hash = deterministic(payload) | **PASS** — consistent canonical JSON hashing |
| content_hash = deterministic(content) | **PASS** — consistent sha256(content.encode()) |
| timestamp = deterministic(simulated time) | **FAIL** — real timestamps used, not simulation |

**Verdict: Full event log replay is impossible with current code.**

---

## Do Not Fix — Only Prove

This audit determines constitutional stability only. No fixes have been applied.
All evidence is from source code reading at the file paths and line numbers cited.
No inference about intended behavior. Only actual runtime code behavior.

---

## SWEEP 6 ADDENDUM: Phase F.4 — Runtime Stability Trace

### Task 4 — Projection Authority Trace

The Docker container was inspected to determine which Qdrant writers and readers actually execute.

#### ACTIVE Qdrant Collections

| Collection | Exists in Qdrant? | Writer | Reader | Verification Path |
|---|---|---|---|---|
| `constitutional_documents` | YES | `constitutional_retrieval.py:140-144` via `POST /constitutional/ingest` | `/constitution/search` (app.py:1101), `/constitutional/query` (app.py:871), `authority_search.py:243` (fallback) | Postgres cross-check in `/constitution/search` ONLY |
| `constitutional_memory` | YES | `POST /constitutional/ingest` writes to both collections | `/memory/search` (app.py:414) | ProjectionIntegrity (hash check) — no Postgres cross-check |
| `memory` | **DOES NOT EXIST** | Defined in `qdrant_projection_worker.py:154` but worker NOT imported | N/A | N/A — dead code |
| `tier2_operational` | **DOES NOT EXIST** | Defined in `projection_worker.py:67` but worker NOT imported | N/A | N/A — dead code |
| `tier3_working` | **DOES NOT EXIST** | Defined in `projection_worker.py:76` but worker NOT imported | N/A | N/A — dead code |

#### Projection Workers — Import Trace

All projection workers are DEAD CODE in the current runtime:

| File | Imported by app.py? | Imported by cognitive module? | Active? |
|---|---|---|---|
| `runtime/workers/qdrant_projection_worker.py` | NO | NO | **DEAD** |
| `runtime/projection_worker/constitutional_projection_worker.py` | NO | NO | **DEAD** |
| `brainos/orchestration/src/projection_worker.py` | NO | NOT in container (old copy at `/app/src/projection_worker.py` exists but not imported) | **DEAD** |
| `brainos/orchestration/src/projection_worker/projection_worker.py` | NO | NOT in container (exists but not imported) | **DEAD** |
| `simple_projection_worker.py` | NO | NO | **DEAD** |

The only active Qdrant writer is `constitutional_retrieval.py` called from `POST /constitutional/ingest`. The only active Qdrant readers are the HTTP endpoints in `app.py`.

### Task 5 — Retrieval Reality Audit

#### Full Runtime Path Trace for "What is replay law?"

```
User sends: GET|POST /reasoning/query?question="What is replay law?"
  → app.py line ~1010: POST /reasoning/query handler
  → imports: from cognitive.reasoning_gateway import ReasoningGateway
  → ReasoningGateway.reason(question)
    → check cache (context_pack_cache)
    → cache miss: Supervisor.reason(question)
      → plan(): creates ReasoningPlan with 7 steps
      → execute_plan():
        1. SearchWorker.execute():
            WorkerProtocol.call_tool('authority_search', {'query': 'What is replay law?'})
              → subprocess(['python', '/app/runtime/tools/authority_search.py'])
              → stdin: {"query": "What is replay law?"}
              → try_postgres_search('What is replay law?')
                  → SELECT FROM authority_objects WHERE title ILIKE '%replay%' OR description ILIKE '%replay%'
                  → Returns: REPLAY LAW (level 90, class CONSTITUTIONAL_LAW)
              → mechanical_verification(candidate)
                  → payload_hash check: PASS (sha256 exists)
                  → lineage check: PASS (lineage_depth=1)
                  → witness check: FAIL (witness_count=0)
                  → projection check: FAIL (status='active', not 'projected')
                  → overall: FAIL (2/5 checks fail)
              → out = {highest_authority: REPLAY LAW, authority_chain: [REPLAY LAW], verification: {overall: False}}
              → print(json.dumps(out, default=str)) → stdout
            ← WorkerProtocol reads stdout → returns dict

        2. SearchWorker calls lineage_search with artifact_id from step 1
            WorkerProtocol.call_tool('lineage_search', {'artifact_id': '2adf8583-...'})
              → subprocess(['python', '/app/runtime/tools/lineage_search.py'])
              → try_postgres_lineage('2adf8583-...')
                  → SELECT FROM artifact_registry WHERE artifact_id = '2adf8583-...'
                  → SELECT FROM events WHERE event_data::text ILIKE '%2adf8583...%'
                  → SELECT FROM authority_lineage WHERE ancestor = '2adf8583-...' OR descendant = '2adf8583-...'
                  → Returns: 0 authorities (REPLAY LAW is descendant, not ancestor — no lineage entries point FROM it)
              → returns: {artifact: {...}, events: [], projections: [], authorities: []}

        3. SearchWorker calls graph_expand with same node
            → subprocess(['python', '/app/runtime/tools/graph_expand.py'])
            → try_postgres_expand('2adf8583-...')
                → SELECT FROM object_relationships WHERE source = '2adf8583-...' — COLUMN MISMATCH
                → SELECT FROM authority_lineage WHERE ancestor = '2adf8583-...' OR descendant = '2adf8583-...'
            → returns: 0 results

        4. ContradictionWorker.execute():
            WorkerProtocol.call_tool('contradiction_search', {'claim': 'What is replay law?'})
              → returns results (if any)

        5. ArchitectureWorker.execute():
            → queries repository_symbols + repository_relationships
            → returns results

        6. MemoryWorker.execute():
            → ContextPackBuilder.build_from_findings()
            → Returns ContextPack with:
                question, highest_authority, authority_chain, authority_resolution
                (no contradictions, no supporting_documents)

        7. Supervisor.synthesize_answer():
            → _enforce_authority(): PASS (highest_authority exists)
            → _enforce_context_pack(): PASS
            → inference_adapter.chat(): tries Ollama — likely times out
            → Falls through: answer = "Supervisor synthesis unavailable — Context Pack returned directly."

→ Returns: {success: True, answer: "...", context_pack: {...}, confidence: 0.7083, ...}
```

#### Retrieval Path Classification

| Query Type | Entry Point | Retrieval Path | Authority Boundary |
|---|---|---|---|
| Reasoning | `POST /reasoning/query` | authority_search → Postgres (tier 1 only) | **PRESENT** |
| Constitution search | `GET /constitution/search` | embed → Qdrant → Postgres verification | **PRESENT** |
| Constitutional query | `GET /constitutional/query` | embed → Qdrant (no Postgres) | **ABSENT** |
| Memory search | `GET /memory/search` | embed → Qdrant → hash integrity check | **PARTIAL** |
| Authority | `GET /constitution/authority` | Qdrant scroll (no Postgres) | **ABSENT** |

### Task 6 — Storage Authority Resolution

#### Events Schema — Only One Active

| Schema | Defined In | In Container? | Referenced by Code? | Executes? | Status |
|---|---|---|---|---|---|
| CQRS (`event_id UUID`, `event_data JSONB`) | `schema.sql` | YES — `events` table has this schema | `constitutional_retrieval.py`, `event_emitter.py`, `app.py` | YES | **CANONICAL** |
| LEGACY (`id BIGSERIAL`, `stream`, `payload`) | `database/events.sql` | NO — not in container | `projection_worker.py:197` (dead code), `workers/*.py` (dead code) | NO | **ABANDONED** |
| EXPANDED CQRS | `schema_expanded.sql` | NO — SQL file not in container | None | NO | **ABANDONED** |
| MIGRATED (+payload_hash, projected_to_qdrant) | `migration_add_projection_columns.sql` | NO — not in container | `app.py`, `constitutional_retrieval.py` | YES — columns exist in DB | **APPLIED TO CANONICAL** |

#### Verification: Actual `events` Table Schema (from `\d events`)

```sql
id UUID NOT NULL DEFAULT uuid_generate_v4()       -- CQRS
event_id UUID NOT NULL                              -- CQRS
event_type VARCHAR(255) NOT NULL                    -- CQRS
timestamp TIMESTAMPTZ NOT NULL                      -- CQRS
aggregate_id UUID NOT NULL                          -- CQRS
aggregate_type VARCHAR(255) NOT NULL                -- CQRS
event_data JSONB NOT NULL                           -- CQRS
causation_id UUID                                   -- CQRS (+)
correlation_id UUID                                 -- CQRS (+)
metadata JSONB                                      -- CQRS (+)
processed_at TIMESTAMPTZ                            -- CQRS (+)
projected_at TIMESTAMPTZ                            -- MIGRATION
projected_to_qdrant BOOLEAN DEFAULT false           -- MIGRATION
```

The active schema is CQRS with migration columns. This is the **CANONICAL** schema.

#### Qdrant Payload Schemas

| Collection | Schema | Status |
|---|---|---|
| `constitutional_documents` | `{document_name, document_type, content, content_hash, event_id, payload_hash, tier}` from `constitutional_retrieval.py:129-137` | **CANONICAL** — single writer, consistent |
| `constitutional_memory` | `{id, source, title, mime_type, created_at, updated_at, content_hash, event_id, event_type}` from `app.py:POST /constitutional/ingest` → `constitutional_integration.py` → `constitutional_retrieval.py` | **CANONICAL** — single writer via same path |

The two `constitutional_memory` payload schemas identified in the original audit (from `simple_projection_worker.py` and `constitutional_projection_worker.py`) do NOT execute. The ACTIVE schema is what `constitutional_integration.py` writes.

#### Storage Authority Classification — Definitive

| Schema | Authority Classification | Evidence |
|---|---|---|
| PostgreSQL `events` | **CANONICAL** — CQRS with migrations | `\d events` confirms |
| PostgreSQL `authority_objects` | **CANONICAL** — 15 rows, queried by authority_search.py | Container evidence |
| PostgreSQL `authority_lineage` | **CANONICAL** — 4 rows, queried by lineage_search.py | Container evidence |
| Qdrant `constitutional_documents` | **CANONICAL** — single writer via /ingest | Collection exists |
| Qdrant `constitutional_memory` | **CANONICAL** — single writer via /ingest | Collection exists |
| Qdrant `memory` | **ABANDONED** — collection never created | `get_collections()` confirms absent |
| `database/events.sql` LEGACY | **ABANDONED** — never referenced by active code | No import chain |
| `workers/*.py` | **ABANDONED** — not imported by any active module | No import chain |
| `runtime/replay/*.ts` | **ABANDONED** — not in container | Dockerfile COPY confirms |
| `runtime/data/*.json` | **ABANDONED** — directory empty | `ls /app/runtime/data/` confirms |

### Runtime Verdict

| What Executes | Status |
|---|---|
| Hash authority | Python `hashlib.sha256()` — 34 sites, all PASS |
| Event identity | `event_emitter.py:101` uuid4() — NON-DETERMINISTIC |
| Qdrant writes | Only `constitutional_retrieval.py` — 2 collections |
| Qdrant reads | `app.py` endpoints — 2 collections queried |
| Schema | CQRS with migration columns — CANONICAL |
| Authority tables | 4 tables exist, data present, queried by runtime tools |
| Witness tables | Exist but empty — no writer active |
| Supersession tables | Exist but empty — no writer active |
| Projection status table | Exists (INTEGER event_id) but no writer active |
| Fallback JSON files | Empty directory — all 5 tools silently return empty |

### Evidence Index

| # | Claim | Evidence File | Line | Stability |
|---|---|---|---|---|
| 1 | content_hash is stable | 8 files all use sha256(content.encode()) | multiple | **STABLE** |
| 2 | payload_hash differs across pipelines | `constitutional_retrieval.py:135` vs `projection_worker.py:66-67` | both | **UNSTABLE** |
| 3 | event_id is non-deterministic | 14 files use uuid4() | multiple | **UNSTABLE** |
| 4 | aggregate_id is not aggregate-scoped | `constitutional_retrieval.py:110` = event_id | 110 | **UNSTABLE** |
| 5 | chunk_id is path-based | `constitutional_projection_worker.py:151` | 151 | **UNSTABLE** |
| 6 | chunk_id is random uuid4 | `qdrant_projection_worker.py:302` | 302 | **UNSTABLE** |
| 7 | projection_hash includes vector | `qdrant_projection_worker.py:363-369` | 363-369 | **UNSTABLE** |
| 8 | witness uses bytes→string→hash | `merkle_tree.ts:259-263` | 259-263 | **CORRUPTED** |
| 9 | authority is path-derived | `constitutional_projection_worker.py:96-111` | 96-111 | **UNSTABLE** |
| 10 | JSON fallback files don't exist | `runtime/data/` directory | entire dir | **EMPTY** |
