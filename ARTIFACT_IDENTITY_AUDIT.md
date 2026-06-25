# ARTIFACT IDENTITY AUDIT

**Sweep 6 — Constitutional Artifact Identity + Hash Authority Audit**

**Date:** 2026-06-24
**Method:** Source code forensic analysis — every ID generator across all `.ts`, `.py`, and `.sql` files traced.
**Rule:** Constitutional Law 2 — "Identity MUST survive rename, move, mirror, sync, restore, reindex, projection rebuild."

---

## Summary

| Artifact Type | ID Generators (count) | Dominant Classification | Replay-Safe? |
|---|---|---|---|
| document_id | 4 | HYBRID | **NO** (3 of 4 break under replay) |
| chunk_id | 2 | PATH_DERIVED | **NO** (breaks under rename) |
| event_id / observation_id | 16 code paths | UUID_BASED (14/16) | **NO** (14 of 16 use `uuid4()`) |
| claim_id | 2 | UUID_BASED | **NO** |
| projection_id / point_id | 4 | HYBRID | **NO** (3 of 4 break) |
| witness_id | 0 runtime code | NOT IMPLEMENTED | N/A |
| lineage_id | 4 | UUID_BASED | **NO** |
| authority_object_id | 0 runtime code | DB_AUTO / UNKNOWN | Unknown |

**Verdict: Constitutional Law 2 VIOLATED.** No single artifact type has content-addressed identity. The entire event log cannot be deterministically replayed.

---

## 1. DOCUMENT ID — 4 Incompatible Generators

### Generator A: SQL AUTO-INCREMENT
**File:** `database/documents.sql:9,156`

```sql
CREATE TABLE documents (
    id BIGSERIAL PRIMARY KEY,
    document_hash TEXT UNIQUE GENERATED ALWAYS AS (
        encode(digest(source_type || source_path || content_hash, 'sha256'), 'hex')
    ) STORED,
    ...
)
```

- **id:** `BIGSERIAL` — database sequence, non-deterministic
- **document_hash:** `sha256(source_type + source_path + content_hash)` — **contains path**, breaks under rename
- **Classification: MIXED — path-derived embedded hash + DB sequence**

### Generator B: UUID5 of path
**File:** `filesystem_worker.py:31-32`

```python
def make_aggregate_id():
    return uuid.uuid5(uuid.NAMESPACE_URL, "file:///" + path)
```

- **Input:** File path only
- **Stable under rename?** NO — path is the sole input
- **Classification: PATH_DERIVED (UUID5)**

### Generator C: UUID from content hash
**File:** `brainos/orchestration/src/constitutional_retrieval.py:83`

```python
doc_id = uuid.UUID(hex=content_hash[:32])
```

- **Input:** First 32 hex chars of SHA256(content)
- **Stable under rename?** YES — pure content-addressed
- **Stable under replay?** YES
- **Classification: CONTENT_ADDRESSED** — the ONLY content-addressed document ID in the codebase

### Generator D: DB auto-increment
**File:** `memory_ingestion_worker.py:257`

```python
cursor.execute("INSERT INTO documents (...) VALUES (...) RETURNING id")
document_id = cursor.fetchone()[0]
```

- **Input:** DB sequence
- **Stable under rename?** NO — sequence depends on insertion order
- **Classification: DB_AUTO**

---

## 2. CHUNK ID — Path-Derived Only

### Generator A: Path + Index
**File:** `runtime/projection_worker/constitutional_projection_worker.py:151`

```python
projection_id = f"{file_path}_{i}"
```

- **Input:** Full absolute path + chunk index
- **Stable under rename?** NO — path is embedded in ID
- **Stable under rechunk?** NO — different chunk count changes indexes
- **Classification: PATH_DERIVED** — no content contribution

### Generator B: Hash of Path
**File:** `brainos/orchestration/src/projection_worker/projection_worker.py:150`

```python
point_id = int(hashlib.sha256(file_path.encode()).hexdigest()[:16], 16)
```

- **Input:** File path only (as bytes)
- **Stable under rename?** NO — path is sole input
- **Stable under restore (same path)?** YES
- **Classification: PATH_DERIVED**

---

## 3. EVENT ID / OBSERVATION ID — Overwhelmingly Random UUID4

14 of 16 code paths use `uuid.uuid4()`. Only 2 use deterministic methods.

### All Workers (6 files) — Random
**Files:** `workers/{summary,claim,candidate_claim,embedding,entity,classifier}_worker.py`

```python
event_id = uuid.uuid4()  # or str(uuid.uuid4())
```

6 files, lines 23-30. All use `uuid.uuid4()`.

### Ingestion Sources (4 files) — Random
- `filesystem_worker.py:93` — `str(uuid.uuid4())`
- `memory_ingestion_worker.py:93` — `uuid.uuid4()`
- `web_retrieval.py:82` — `uuid.uuid4()`
- `google_drive_ingestion.py:126` — `uuid.uuid4()`

### Event Emitter (1 file) — Random
- `event_emitter.py:101` — `uuid.uuid4()`

### Constitutional Runtime (2 files) — Random
- `drive_ingestor.py:141` — `str(uuid.uuid4())`
- `event_chain.py:188,222` — `str(uuid.uuid4())`

### Google Drive Adapter (1 file) — Both random and deterministic
- Primary: `str(uuid.uuid4())` (line 261) — Random
- Fallback (connection failure): `hashlib.sha256(str(event).encode()).hexdigest()[:16]` (lines 255, 284) — Deterministic but truncated to 64 bits

### The ONLY Deterministic Generators

**File:** `brainos/orchestration/src/constitutional_retrieval.py:87`

```python
event_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, doc_name + content))
```

- UUIDv5 (SHA1-based, deterministic) from `doc_name + content`
- **Stable under replay?** YES — given same doc_name and content
- **Stable under rename?** Depends on doc_name

---

## 4. CLAIM ID — Random

- `candidate_claim_worker.py:25` — `uuid.uuid4()`
- `claim_worker.py:30` — `uuid.uuid4()`

Both non-deterministic. No content-addressed claim identity.

---

## 5. PROJECTION ID / POINT ID — 4 Incompatible Strategies

| Strategy | File | ID Value | Stability |
|---|---|---|---|
| DB sequence | `projection_worker.py:197` | `str(event['id'])` (SERIAL) | UNSTABLE under replay |
| Path hash | `projection_worker/projection_worker.py:150` | `int(sha256(path)[:16], 16)` | UNSTABLE under rename |
| Postgres event_id | `qdrant_projection_worker.py:261` | `event['event_id']` | UNKNOWN — depends on upstream |
| Random UUID | `qdrant_projection_worker.py:302` | `str(uuid.uuid4())` | **UNSTABLE** — creates duplicates every cycle |
| Content-addressed | `constitutional_retrieval.py:127` | `UUID(content_hash[:32])` | **STABLE** — only one |

**Critical:** `qdrant_projection_worker.py:302` uses `str(uuid.uuid4())` for document event points. Running projection twice creates duplicate Qdrant points with different IDs for identical content. This guarantees Qdrant bloat.

---

## 6. WITNESS ID — No Runtime Implementation

Witness ID generation exists only in specification documents:
- `CONSTITUTIONAL_PATCH_11_WITNESS_IDENTITY.md:79` — `witness_id = hash(public_key)`
- `WITNESS_IDENTITY_SPEC.md:65,89` — `witness_id = hash(public_key)`

**No executable code generates witness IDs.** The `authority_witness` table exists (created by `migration_002_authority_tables.sql`) but contains 0 rows. No worker or ingestion path inserts into it.

---

## 7. LINEAGE ID — Random UUID (Schema Default)

- `schema.sql:72` — `uuid_generate_v4()` DEFAULT on `lineage.id`
- `schema_expanded.sql:39,57` — `uuid_generate_v4()` DEFAULT on `lineage_id` and `artifact_lineage.id`
- `LINEAGE_ENGINE.md:162-164,251-253` — `uuid4()` in spec pseudocode

All deterministic-style inputs (ancestor, descendant, relation) wrapped in a non-deterministic UUID4 primary key.

---

## 8. AGGREGATE ID — 3 Incompatible Generators

| File | Generator | Stability |
|---|---|---|
| `filesystem_worker.py:32` | `uuid5(NAMESPACE_URL, "file:///" + path)` | PATH_DERIVED (breaks under rename) |
| `event_emitter.py:101` | `uuid5(NAMESPACE_DNS, f"stream.{stream}")` | **STABLE** — per stream name |
| `drive_ingestor.py` | Raw file ID from Drive | UNKNOWN (external) |

**Inconsistency:** `filesystem_worker.py` and `event_emitter.py` use different UUID namespaces (URL vs DNS) and different inputs (path vs stream name). Same event type gets different aggregate_id depending on which worker processes it.

---

## 9. Deterministic vs Non-Deterministic — Full Matrix

| Artifact | Deterministic Generators | Non-Deterministic Generators | Constitutional |
|---|---|---|---|
| document_id | `constitutional_retrieval.py:83` (content-addressed UUID) | 3 of 4 generators | **FAIL** |
| chunk_id | None | 2 of 2 (path-based) | **FAIL** |
| event_id | `constitutional_retrieval.py:87` (uuid5), `drive_adapter.py:255` (sha256 fallback) | 14 of 16 (uuid4) | **FAIL** |
| claim_id | None | 2 of 2 (uuid4) | **FAIL** |
| projection_id | `constitutional_retrieval.py:127` (content UUID), `projection_worker/projection_worker.py:150` (path hash — partial) | 3 of 5 (sequence, uuid4, unknown) | **FAIL** |
| witness_id | No runtime implementation | — | **NOT IMPLEMENTED** |
| lineage_id | None | 4 of 4 (uuid_generate_v4) | **FAIL** |
| authority_object_id | Partial from content hash | DB_AUTO | **UNKNOWN** |
| aggregate_id | `event_emitter.py:101` (uuid5 per stream) | `filesystem_worker.py:32` (path-uuid5 — path changes) | **PARTIAL** |

---

## 10. Preferred Identity Model Compliance

| Constitutional Requirement | Status | Evidence |
|---|---|---|
| "Identity MUST survive rename" | **VIOLATED** — chunk_id is path-based, document_hash includes path | 6 occurrences |
| "Identity MUST survive move" | **VIOLATED** — same as rename | 6 occurrences |
| "Identity MUST survive mirror" | **VIOLATED** — path-based IDs break on mirror | 6 occurrences |
| "Identity MUST survive restore" | **PASS** — restore preserves paths | — |
| "Identity MUST survive reindex" | **VIOLATED** — uuid4 reindex creates new IDs | 14+ occurrences |
| "Identity MUST survive projection rebuild" | **VIOLATED** — uuid4 projection creates duplicate points | `qdrant_projection_worker.py:302` |
| "Identity MUST NOT depend on path" | **VIOLATED** — chunk_id, document_hash, filesystem aggregate_id all embed path | 4 occurrences |
| "Identity MUST NOT depend on filename" | **VIOLATED** — same as path dependency | 4 occurrences |
| "Identity MUST NOT depend on timestamp" | **PASS** — no timestamp-based identity found | — |
| "Identity MUST NOT depend on UUID" | **VIOLATED** — 14/16 event_id paths use uuid4 | 14 occurrences |
| "Identity MUST NOT depend on database id" | **VIOLATED** — BIGSERIAL auto-increment used throughout | `documents.sql:9`, `memory_ingestion_worker.py:257` |
| "Identity MUST NOT depend on vector id" | **PASS** — vector ID is derived from point ID, not vice versa | — |
| "Identity MUST NOT depend on offset alone" | **FAIL** — chunk index (offset) without content hash is the sole non-path component | `constitutional_projection_worker.py:151` |

---

## 11. Cross-System ID Comparison

Two systems must be able to agree on the identity of the same artifact independently:

| Artifact | Can System A and System B produce the same ID from the same source data? |
|---|---|
| document_id | **NO** — 4 incompatible generators produce different IDs for the same document |
| event_id | **NO** — 14 of 16 paths use random UUID4, guaranteeing different IDs on independent systems |
| chunk_id | **NO** — path-based IDs depend on absolute path, which differs across systems |
| witness | **N/A** — no runtime implementation |

This means two independent PING instances processing the same source data would produce entirely different artifact IDs, making cross-system lineage, witness, and replay verification impossible.

---

## Do Not Fix — Only Prove

This audit determines constitutional compliance only. No fixes have been applied.
All evidence is from source code reading at the file paths and line numbers cited.
No inference about intended behavior. Only actual runtime code behavior.

---

## SWEEP 6 ADDENDUM: Phase F.4 — Runtime Identity Trace

### Task 3 — Identity Authority Trace: What Actually Governs Runtime

The container (`ping-mission-control`) was inspected to determine which identity generators are actually on the active execution path.

#### Import Chain — Full Trace

```
app.py (/reasoning/query POST handler, line ~1010)
  → from cognitive.reasoning_gateway import ReasoningGateway
  → ReasoningGateway.reason()
  → Supervisor.reason()
  → execute_plan():
      → SearchWorker.execute()         [search_worker.py]
      → ContradictionWorker.execute()  [contradiction_worker.py]
      → ArchitectureWorker.execute()   [architecture_worker.py]
      → MemoryWorker.execute()         [memory_worker.py]
  → synthesize_answer():
      → inference_adapter.chat()       [inference_adapter.py]

SearchWorker.execute():
  → WorkerProtocol.call_tool('authority_search', {'query': ...})
      → subprocess([python, authority_search.py])
  → WorkerProtocol.call_tool('lineage_search', {'artifact_id': ...})
      → subprocess([python, lineage_search.py])
  → WorkerProtocol.call_tool('graph_expand', {'node': ..., 'depth': 2})
      → subprocess([python, graph_expand.py])
```

**Files NOT on active import path (DEAD CODE):**
- All worker files in `workers/` (`summary_worker.py`, `claim_worker.py`, `candidate_claim_worker.py`, `embedding_worker.py`, `entity_worker.py`, `classifier_worker.py`) — NOT imported by app.py or any cognitive module
- `filesystem_worker.py` — not imported
- `memory_ingestion_worker.py` — not imported
- `simple_projection_worker.py` — not imported
- `constitutional_projection_worker.py` — not imported
- `qdrant_projection_worker.py` — not imported
- `projection_worker/projection_worker.py` — not imported
- All `runtime/replay/` TypeScript files — not in container

#### Active Identity Generators — Only 3

| Artifact ID | Generator | File | Active? | Deterministic? |
|---|---|---|---|---|
| Event IDs from `constitutional_retrieval.py` | `uuid5(DNS, doc_name + content)` | `/app/src/constitutional_retrieval.py:87` | YES — called by `POST /constitutional/ingest` | YES — content-addressed |
| Qdrant point IDs from `constitutional_retrieval.py` | `uuid.UUID(hex=content_hash[:32])` | `/app/src/constitutional_retrieval.py:83` | YES — above path | YES — content-addressed |
| `aggregate_id` from `constitutional_retrieval.py` | Copy of `event_id` | `/app/src/constitutional_retrieval.py:110` | YES — above path | YES (copies deterministic event_id) |
| UUID5 aggregate_id in `event_emitter.py` | `uuid5(DNS, f"stream.{stream}")` | `/app/src/constitutional/event_emitter.py:101` | ACTIVE — imported by `constitutional_retrieval.py` | YES — per stream name |
| UUID4 event_id in `event_emitter.py` | `uuid.uuid4()` | `/app/src/constitutional/event_emitter.py:101` | ACTIVE — called by `constitutional_retrieval.py` | **NO** — random |
| Authorization headers from Drive | External Google Drive file IDs | `google_drive_ingestion.py` | ACTIVE (conditional) | UNKNOWN — external |
| All worker uuid4() generators | `uuid.uuid4()` | 14 worker files | **DEAD CODE** — none are imported | N/A |

#### Critical Finding: `event_emitter.py` Produces Both Deterministic and Non-Deterministic IDs

In `constitutional_retrieval.py:101-111`:
```python
from constitutional.event_emitter import emit_event
# ...
event_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, doc_name + content))  # deterministic
# ...
emit_event({
    'event_id': event_id,       # deterministic (uuid5)
    'aggregate_id': event_id    # copy
})
```

But `event_emitter.py:101` generates its own `uuid.uuid4()` for `event_id` in `emit_event()`:
```python
def emit_event(event_data):
    event_id = uuid.uuid4()  # random — OVERWRITES the caller's event_id
    # ...
```

**The caller sets event_id deterministically, but `emit_event()` generates a new random one.** This means even the deterministic `uuid5` event_id from `constitutional_retrieval.py:87` is **overwritten with uuid4()** before insertion.

#### Evidence: Actual Event IDs in Postgres

```sql
SELECT event_id FROM events LIMIT 5;
```
Returns: UUIDv4-formatted IDs (random). Confirms the uuid4 overwrite.

#### Active Identity Generators Summary

| Artifact | Active Generator | Deterministic? | Storage Locations |
|---|---|---|---|
| `event_id` | `event_emitter.py:101` uuid4() | **NO** | Postgres `events.event_id`, Qdrant `payload.event_id` |
| `aggregate_id` | Copy of event_id (random) | **NO** | Postgres `events.aggregate_id` |
| Qdrant point ID (constitutional_documents) | `uuid.UUID(hex=content_hash[:32])` | **YES** | Qdrant point ID |
| Qdrant point ID (constitutional_memory) | `app.py` calls `constitutional_integration.ingest_constitutional_docs()` which delegates to `constitutional_retrieval.ingest_document()` | YES — content-addressed | Qdrant point ID |
| `artifact_id` in authority_search | From Postgres `authority_objects.artifact_id` (seed data UUID) | YES — static seed | Postgres `authority_objects`, `artifact_registry` |

#### Dead Worker Identity Generators (14 uuid4 sites — NOT EXECUTED)

The following files exist on disk but are NOT on any import chain from `app.py`:
- `workers/summary_worker.py:23` — uuid4()
- `workers/claim_worker.py:30` — uuid4()
- `workers/candidate_claim_worker.py:25` — uuid4()
- `workers/embedding_worker.py:25` — uuid4()
- `workers/entity_worker.py:23` — uuid4()
- `workers/classifier_worker.py:24` — uuid4()
- `filesystem_worker.py:93` — uuid4()
- `memory_ingestion_worker.py:93` — uuid4()
- `web_retrieval.py:82` — uuid4()
- `google_drive_ingestion.py:126` — uuid4()
- `runtime/constitutional/event_chain.py:188,222` — uuid4()
- `runtime/ingestion/drive_ingestor.py:141` — uuid4()
- `runtime/adapters/google_drive/google_drive_ingestion_adapter.py:261` — uuid4()

These do NOT execute in the current production runtime. However, if they were activated, they would all produce non-deterministic event IDs.

### Runtime Identity Stability

The only identity that is actively produced and consumed is `event_id` from `event_emitter.py` (uuid4, non-deterministic). This means:

1. **Replay cannot reproduce event_id** — different uuid4 every run
2. **Cross-system verification impossible** — different uuid4 on different instances
3. **Qdrant point IDs are content-addressed** but reference Postgres event_ids that are random — the content-addressing is independent of the event identity

**VERDICT: The active identity authority produces non-deterministic event IDs.** The 14 dead worker uuid4 sites would compound this further if activated. The only content-addressed identity (in `constitutional_retrieval.py`) is overridden by the uuid4 in `event_emitter.py`.
