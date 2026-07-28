# CONSTITUTIONAL STORAGE MODEL

**Sweep 6 — Constitutional Artifact Identity + Hash Authority Audit**

**Date:** 2026-06-24
**Method:** Forensic audit of all storage layers — Postgres tables, Qdrant collections, JSON file fallbacks, graph/relationship tables. Every CREATE TABLE, every collection creation, every insert path traced.
**Rule:** Authority storage ≠ Retrieval storage ≠ Relationship storage. Qdrant MUST NOT become authority.

---

## Storage Layer Classification

| Layer | Type | Rebuildable From | Authority Classification |
|---|---|---|---|
| Postgres `events` (CQRS) | **Authority storage** | Self (append-only) | **TRUTH** |
| Postgres `authority_objects` | **Authority storage** | From events | **DECLARED AUTHORITY** |
| Postgres `authority_lineage` | **Relationship storage** | From authority_objects | **CONSTITUTIONAL** |
| Postgres `authority_supersession` | **Relationship storage** | Manual | **CONSTITUTIONAL** |
| Postgres `authority_witness` | **Authority storage** | From events | **CONSTITUTIONAL** |
| Postgres `artifact_registry` | **Authority storage** | From authority_objects | **TRUTH** |
| Postgres `projection_status` | **Relationship storage** | From Qdrant ACK | **OPERATIONAL** |
| Postgres `documents` + `document_content` | **Authority storage** | Self | **TRUTH** |
| Postgres `object_relationships` | **Relationship storage** | From events | **CONSTITUTIONAL** |
| Qdrant `constitutional_documents` | **Retrieval storage** | From Postgres events | **PROJECTION** |
| Qdrant `constitutional_memory` | **Retrieval storage** | From Postgres events | **PROJECTION** |
| Qdrant `memory` | **Retrieval storage** | From Postgres events | **PROJECTION** |
| JSON `runtime/data/*` | **Fallback — non-functional** | Manually generated | **FALLBACK** |

---

## 1. Authority Storage — Postgres

### 1.1 Events Table (CQRS Schema)

| Column | Type | Source | Constitutional |
|---|---|---|---|
| `event_id` | UUID (PK) | Various — uuid4 (14/16 paths) or uuid5 (2/16) | **FAIL** — non-deterministic |
| `event_type` | VARCHAR(255) | Enum: DOCUMENT_IMPORTED, OBSERVATION_CREATED, etc. | PASS |
| `timestamp` | TIMESTAMPTZ | Current time | PASS |
| `aggregate_id` | UUID | 3 incompatible generators | **FAIL** — not aggregate-scoped |
| `aggregate_type` | VARCHAR(255) | String: 'constitutional_document', 'file', etc. | PASS |
| `event_data` | JSONB | Worker-specific payload | PASS |
| `payload_hash` | VARCHAR(64) (optional) | Added by `migration_add_projection_columns.sql` | PASS |
| `projected_to_qdrant` | BOOLEAN (optional) | Added by migration | PASS |

**Schema sources — 4 competing definitions exist:**
| File | Columns | Currently Active? |
|---|---|---|
| `database/events.sql` | `id BIGSERIAL, stream, event_type, payload, created_at` | LEGACY |
| `schema.sql` | `id UUID, event_id UUID, event_type, timestamp, aggregate_id, aggregate_type, event_data, causation_id, correlation_id, metadata, processed_at` | CQRS |
| `schema_expanded.sql` | Extended CQRS + CHECK constraints + deleted_at | CANONICAL |
| Migration files | Adds payload_hash, projected_to_qdrant, projected_at | APPLIED |

**Actual schema (from `\d events`):**
```
event_id UUID NOT NULL
event_type VARCHAR(255) NOT NULL
timestamp TIMESTAMPTZ NOT NULL
aggregate_id UUID
aggregate_type VARCHAR(255)
event_data JSONB
projected_to_qdrant BOOLEAN
payload_hash VARCHAR(64)
```

### 1.2 Authority Objects Table

**Created by:** `migration_002_authority_tables.sql`  
**Rows:** 15 (5 constitutional + 10 test documents)

| Column | Type | Populated? | Constitutional |
|---|---|---|---|
| `authority_id` | UUID (PK) | Yes (uuid_generate_v4) | **FAIL** — non-deterministic |
| `artifact_id` | UUID | Yes (from seed data) | PASS |
| `authority_type` | TEXT | Yes | PASS |
| `authority_level` | INTEGER | Yes (100-10) | PASS |
| `title` | TEXT | Yes | PASS |
| `description` | TEXT | Yes | PASS |
| `category` | TEXT | Yes (CONSTITUTIONAL_LAW, etc.) | PASS |
| `sha256` | TEXT | **NULL** | **FAIL** — needed for hash verification |
| `payload_hash` | TEXT | Yes | PASS |
| `created_at` | TIMESTAMPTZ | Yes | PASS |
| `supersedes_authority` | UUID | **NULL** | **UNUSED** |
| `source_system` | TEXT | Yes | PASS |
| `canonical_path` | TEXT | **NULL** | **UNUSED** |
| `status` | TEXT | Yes ('active') | PASS |

**Critical issue:** `sha256` is NULL for all 15 rows. This means `mechanical_verification()` in `authority_search.py:84-87` falls through to the `elif payload_hash: True` branch, bypassing the content integrity check.

### 1.3 Authority Lineage Table

**Rows:** 4 (all laws derived from PING CONSTITUTION)

| Column | Type | Constitutional |
|---|---|---|
| `id` | UUID (PK, uuid_generate_v4) | **FAIL** — non-deterministic |
| `ancestor` | UUID (FK → authority_objects.artifact_id) | PASS |
| `descendant` | UUID (FK → authority_objects.artifact_id) | PASS |
| `relation` | VARCHAR(50) — 'derived_from' | PASS |
| `metadata` | JSONB — `{"authority": "constitutional_hierarchy", "description": "..."}` | PASS |
| `created_at` | TIMESTAMPTZ | PASS |

### 1.4 Authority Supersession Table

**Rows:** 0 (empty)

| Column | Type | Constitutional |
|---|---|---|
| `id` | UUID (PK) | PASS (unused) |
| `superseded` | UUID | PASS (unused) |
| `superseded_by` | UUID | PASS (unused) |
| `reason` | TEXT | PASS (unused) |
| `created_at` | TIMESTAMPTZ | PASS (unused) |

**Schema conflict:** `migration_002_authority_tables.sql` uses `superseded`/`superseded_by` columns. `authority_supersession.sql` (standalone) uses `old_authority`/`new_authority`. The active table uses the migration_002 schema.

### 1.5 Authority Witness Table

**Rows:** 0 (empty)

| Column | Type | Constitutional |
|---|---|---|
| `id` | UUID (PK) | PASS (unused) |
| `artifact_id` | UUID (FK → authority_objects.artifact_id) | PASS (unused) |
| `witness_root` | TEXT | PASS (unused) |
| `witness_signature` | TEXT | PASS (unused) |
| `witness_timestamp` | TIMESTAMPTZ | PASS (unused) |
| `created_at` | TIMESTAMPTZ | PASS (unused) |

**No worker inserts into this table.** Witness data exists only in specifications.

### 1.6 Artifact Registry Table

**Rows:** 15

| Column | Type | Constitutional |
|---|---|---|
| `artifact_id` | UUID (PK) | PASS |
| `artifact_type` | TEXT | PASS |
| `canonical_path` | TEXT | **NULL for all rows** |
| `sha256` | TEXT | **NULL for all rows** |
| `payload_hash` | TEXT | PASS |
| `source_system` | TEXT | PASS |
| `created_at` | TIMESTAMPTZ | PASS |
| `modified_at` | TIMESTAMPTZ | PASS |
| `lineage_root` | UUID | **NULL for all rows** |
| `witness_root` | TEXT | **NULL for all rows** |
| `status` | TEXT | PASS ('active') |

**Critical:** `sha256`, `canonical_path`, `lineage_root`, `witness_root` are all NULL. The artifact registry has no content integrity anchors.

### 1.7 Projection Status Table

**Created by:** `qdrant_projection_worker.py:193-203` (CREATE TABLE IF NOT EXISTS)

| Column | Type | Constitutional |
|---|---|---|
| `event_id` | INTEGER (PK) | **FAIL** — INTEGER despite CQRS having UUID event_ids |
| `projected_qdrant` | BOOLEAN DEFAULT FALSE | PASS |
| `projection_hash` | VARCHAR(64) | PASS |
| `projected_at` | TIMESTAMP | PASS |

**Schema mismatch:** This table uses `event_id INTEGER` while the CQRS events table uses `event_id UUID`. The worker reads `e.event_id` from events (line 177) but stores it in an INTEGER column. PostgreSQL will attempt implicit cast — UUID → INTEGER fails if the UUID is not a valid integer.

---

## 2. Retrieval Storage — Qdrant

### 2.1 Collection: `constitutional_documents`

| Property | Value |
|---|---|
| Vector size | 768 |
| Distance | Cosine |
| Created by | `create_qdrant_collections.py:22`, `constitutional_retrieval.py:47` |
| Populated by | `constitutional_retrieval.py:140-144` (ingest_document) |

**Payload fields:**
| Field | Type | Stable? |
|---|---|---|
| `document_name` | str | **FAIL** — may include path |
| `document_type` | str | PASS |
| `content` | str | PASS |
| `content_hash` | str (sha256) | PASS |
| `event_id` | str (uuid5 deterministic) | PASS |
| `payload_hash` | str (= content_hash) | PASS |
| `tier` | int | PASS |

**Authority boundary:** Populated by ingestion pipeline only. Never written by projection workers. Retrieval endpoint reads directly without Postgres verification (except `/constitution/search`).

### 2.2 Collection: `constitutional_memory`

| Property | Value |
|---|---|
| Vector size | 768 |
| Distance | Cosine |
| Created by | `create_qdrant_collections.py:13` |
| Populated by | `simple_projection_worker.py:87-99`, `constitutional_projection_worker.py:153-169` |

**Inconsistent payload fields between writers:**

| Field | `simple_projection_worker.py` | `constitutional_projection_worker.py` |
|---|---|---|
| `id` | PASS | PASS |
| `source` | `'constitutional'` (static) | File path |
| `title` | From event payload | From document |
| `content` | From event payload | From chunk |
| `event_id` | From event | NOT PRESENT |
| `canonical_hash` | sha256 of canonical json | NOT PRESENT |
| `embedding_hash` | sha256 of vector JSON | NOT PRESENT |
| `projection_signature` | Ed25519/sha256 | NOT PRESENT |
| `source_type` | NOT PRESENT | 'constitutional_legal_authority' |
| `authority_level` | NOT PRESENT | From path (96-111) |
| `vault_hash` | NOT PRESENT | sha256(content) |
| `document_path` | NOT PRESENT | Full file path |
| `chunk_index` | NOT PRESENT | Integer |
| `total_chunks` | NOT PRESENT | Integer |
| `timestamp` | NOT PRESENT | ISO timestamp |

**Two different payload schemas for the same collection.** Points written by different workers have non-overlapping fields.

### 2.3 Collection: `memory`

| Property | Value |
|---|---|
| Vector size | 768 |
| Distance | Cosine |
| Created by | `qdrant_projection_worker.py:154` |
| Populated by | `qdrant_projection_worker.py:302-315` |

**Payload fields:**
| Field | Type | Stable? |
|---|---|---|
| `document_id` | str | Depends on source |
| `source` | str | PASS |
| `title` | str | PASS |
| `mime_type` | str | PASS |
| `content_hash` | str | PASS |
| `event_id` | str (from Postgres) | Depends on source |
| `event_type` | str | PASS |

**Point ID:** `str(uuid.uuid4())` — **random, non-deduplicatable**

---

## 3. Relationship Storage — Postgres + Graph Tables

### 3.1 Object Relationships

**Table:** `object_relationships`  
**Columns:** `id UUID`, `source_object_id UUID`, `target_object_id UUID`, `relationship_type VARCHAR`, `metadata JSONB`, `created_at TIMESTAMPTZ`  
**Queried by:** `graph_expand.py:37`  
**Schema source:** `object_relationships.sql`

**Column name conflict:** Python reads `source`, `target`, `relation_type` but the SQL table has `source_object_id`, `target_object_id`, `relationship_type`. Python code is querying non-existent columns.

### 3.2 Authority Lineage (also relationship storage)

Stored in `authority_lineage` table (see 1.3). Queried by both `lineage_search.py` and `graph_expand.py`.

### 3.3 Other Relationship Tables

| Table | File | Edge Type |
|---|---|---|
| `document_lineage` | `database/documents.sql` | Parent/child document |
| `lineage` (canonical) | `schema_expanded.sql` | Root/version |
| `artifact_lineage` | `schema_expanded.sql` | Processor chain |
| `citations` | `migration_001_bidirectional_memory.sql` | Source/target citation |
| `relationships` | `migration_001_bidirectional_memory.sql` | Entity-to-entity |

---

## 4. Non-Functional Fallback — JSON Files

**Path:** `runtime/data/` — directory exists, **entirely empty**

**Expected files (none exist):**
- `authority_objects.json`
- `authority_supersession.json`
- `events.json`
- `projections.json`
- `artifact_registry.json`
- `object_relationships.json`
- `authority_lineage.json`

**Impact:** All 5 tools silently return empty results when Postgres is unavailable. No warning logged. Silent data loss.

---

## 5. Retrieval Flow — What Is Actually Consumed

### Flow: `/constitutional/query`
```
Query
  → embed (Ollama)
  → Qdrant scroll constitutional_documents  (RETRIEVAL — no Postgres verification)
  → Return content, citations, authority chain
  → Authority boundary: **NONE** — reads Qdrant directly
```

### Flow: `/constitution/search`
```
Query
  → embed (Ollama)
  → Qdrant search constitutional_documents   (RETRIEVAL)
  → Postgres events verification             (AUTHORITY — CROSS-CHECK)
  → Return verified results
  → Authority boundary: **PRESENT** — Postgres verifies Qdrant results
```

### Flow: `/memory/search`
```
Query
  → embed (Ollama)
  → Qdrant search memory                     (RETRIEVAL)
  → ProjectionIntegrity verification         (OPERATIONAL — hash check)
  → Return results
  → Authority boundary: **PARTIAL** — hash integrity but no Postgres cross-check
```

### Flow: `/reasoning/query`
```
Query
  → authority_search (Postgres → JSON → Qdrant fallback)
  → lineage_search (Postgres → JSON fallback)
  → graph_expand (Postgres → JSON fallback)
  → contradiction_search (Postgres → JSON fallback)
  → context_pack (assembles findings)
  → supervisor (orchestrates, returns pack)
  → Authority boundary: **PRESENT** — Postgres authority objects + lineage + witness + supersession
```

---

## 6. Storage Conflicts Summary

| Conflict | Description | Severity |
|---|---|---|
| **4 events table schemas** | LEGACY, CQRS, CANONICAL, MIGRATED — same table, different column sets | **CRITICAL** |
| **2 payload_hash definitions** | `constitutional_retrieval.py` uses `payload_hash = content_hash` vs other files compute it from all payload data | **HIGH** |
| **2 concurrent Qdrant collection payload schemas** | `constitutional_memory` has different fields depending on which worker wrote the point | **HIGH** |
| **Column name mismatch** | `graph_expand.py` reads `source`/`target`/`relation_type` but `object_relationships` table has `source_object_id`/`target_object_id`/`relationship_type` | **HIGH** |
| **Type mismatch** | `projection_status` stores `event_id INTEGER` but CQRS events table has `event_id UUID` | **HIGH** |
| **UUID vs BIGSERIAL** | `database/events.sql` uses BIGSERIAL for id, `schema.sql` uses UUID | **MEDIUM** |
| **Authority table column names** | Standalone SQL files use different column names than active `migration_002` tables | **MEDIUM** |
| **JSON fallback directory empty** | All 5 tools reference non-existent files | **MEDIUM** |

---

## 7. Object Flow Diagram

```
                    AUTHORITY BOUNDARY
                    =================

    ┌─ Drive ──────────────────────────────────────────────────┐
    │  file_content → sha256(file_content) → content_hash      │
    │  file_path → determine_authority_level(path) → level     │
    └────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
    ┌─ Postgres (TRUTH) ───────────────────────────────────────┐
    │  events table:                                           │
    │    event_id = uuid4()        ← NON-DETERMINISTIC         │
    │    event_data = { content, content_hash, ... }           │
    │    projected_to_qdrant = false                            │
    │                                                           │
    │  authority_objects table:                                 │
    │    artifact_id = deterministic(seed)                      │
    │    sha256 = NULL            ← MISSING CONTENT HASH       │
    │                                                           │
    │  authority_lineage table:                                 │
    │    ancestor → descendant, relation='derived_from'         │
    └────────────────────────┬──────────────────────────────────┘
                             │ projection
                             ▼
    ┌─ Qdrant (RETRIEVAL) ─────────────────────────────────────┐
    │  constitutional_documents:                                │
    │    point_id = UUID(content_hash[:32])   ← CONTENT-BASED  │
    │    payload = { content, content_hash, event_id, ... }     │
    │                                                           │
    │  memory (document events):                                │
    │    point_id = uuid4()    ← RANDOM, NO DEDUP              │
    │    payload = { content_hash, event_id, ... }              │
    └────────────────────────┬──────────────────────────────────┘
                             │ retrieval
                             ▼
    ┌─ Runtime Tools ──────────────────────────────────────────┐
    │  authority_search → Postgres (tier 1) or Qdrant (tier 3) │
    │  lineage_search → Postgres or JSON fallback (EMPTY)      │
    │  graph_expand → Postgres or JSON fallback (EMPTY)        │
    │  context_pack → assembles from tool outputs              │
    │  supervisor → returns pack                               │
    └───────────────────────────────────────────────────────────┘
```

---

## 8. Authority Boundary Violations

| Boundary | Status | Evidence |
|---|---|---|
| "Qdrant MUST NOT become authority" | **PARTIALLY ENFORCED** — only `/constitution/search` verifies Qdrant against Postgres | `/constitutional/query` reads Qdrant directly |
| "Qdrant stores retrieval projections" | **VIOLATED** — point IDs are random (uuid4), preventing correlation back to authority | `qdrant_projection_worker.py:302` |
| "Postgres is truth" | **ENFORCED** for authority_search (tier 1), NOT enforced for memory/search and constitutional/query | `app.py:384-483`, `app.py:832-970` |
| "payload_hash enables verification" | **WEAKENED** — different workers compute payload_hash differently | cross-pipeline comparison fails |
| "witness is truth" | **NOT IMPLEMENTED** — authority_witness table has 0 rows | no insert path exists |

---

## Do Not Fix — Only Prove

This audit determines the current storage model only. No fixes have been applied.
All evidence is from source code reading at the file paths and line numbers cited.
No inference about intended behavior. Only actual runtime code behavior.

---

## SWEEP 6 ADDENDUM: Phase F.4 — Constitutional Failure Ranking

### Task 7 — Top 10 Constitutional Risks by Runtime Impact

Ranked by actual production execution impact, not theoretical architectural concerns.

#### Severity Scale

| Severity | Definition |
|---|---|
| **1 — Unreplayable state** | Produces state that cannot be deterministically reconstructed from source data |
| **2 — Authority divergence** | Two subsystems disagree on authority for the same artifact |
| **3 — Retrieval degradation** | Silent empty results, bypassed verification, missing fallbacks |
| **4 — Architectural debt** | Duplicate schemas, dead code, unused tables |

---

### Rank 1: `event_id` is Non-Deterministic (Severity 1)

**Risk:** The only active event identity generator (`event_emitter.py:101`) uses `uuid.uuid4()`. The `constitutional_retrieval.py` caller computes a deterministic `uuid5` event_id, but `emit_event()` overwrites it with a random uuid4 before insert.

**Runtime impact:** Every event in the events table has a random UUID event_id. Replaying the same source data produces entirely different event_ids. Cross-system verification is impossible.

**Evidence:**
- `/app/src/constitutional_retrieval.py:87` — computes `uuid5(doc_name + content)` (deterministic)
- `/app/src/constitutional/event_emitter.py:101` — `event_id = uuid.uuid4()` (overwrites)
- Postgres `SELECT event_id FROM events LIMIT 1` confirms uuid4 format
- Active runtime path: `/constitutional/ingest` → `constitutional_retrieval.ingest_document()` → `event_emitter.emit_event()`

---

### Rank 2: No Witness or Supersession Data (Severity 2)

**Risk:** `authority_witness` (0 rows) and `authority_supersession` (0 rows) tables exist but contain no data. No active worker writes to either table. `mechanical_verification()` checks for witness_count > 0 and status == 'projected' — both always fail for all 15 authority objects.

**Runtime impact:** Every authority object has `verification.overall = False` because `witness_present = False` and `projection_valid = False`. Authority resolution succeeds (class-based) but verification always fails.

**Evidence:**
- `docker exec brain-postgres psql -U postgres -d crx_runtime -c "SELECT count(*) FROM authority_witness"` → 0
- `docker exec brain-postgres psql -U postgres -d crx_runtime -c "SELECT count(*) FROM authority_supersession"` → 0
- `authority_search.py:99-103` — `verification["witness_present"] = witness_count > 0` → always False
- `authority_search.py:107-110` — `verification["projection_valid"] = status == 'projected'` → always False

---

### Rank 3: JSON Fallback Directory Empty (Severity 3)

**Risk:** All 5 runtime tools have fallback paths to `runtime/data/*.json` files. None of these files exist. When Postgres is unavailable, all tools silently return empty results. No warning is logged.

**Runtime impact:** If Postgres connection fails, `authority_search.py` falls through to Tier 2 (local JSON — empty) then Tier 3 (Qdrant — may work but unverified). `lineage_search.py`, `graph_expand.py`, `contradiction_search.py` all return empty results with no indication of failure.

**Evidence:** Container inspection confirms `/app/runtime/data/` only contains `context_pack_cache/` subdirectory. No `*.json` files.

---

### Rank 4: `memory` Qdrant Collection Never Created (Severity 3)

**Risk:** The `memory` collection is referenced by `app.py` (line 65: `MEMORY_COLLECTION = 'memory'`) and the `/memory/search` endpoint queries it. But no active worker creates or writes to this collection. The collection does not exist in Qdrant.

**Runtime impact:** `/memory/search` returns an error or empty results because the collection doesn't exist.

**Evidence:** Qdrant `get_collections()` returns only `constitutional_documents` and `constitutional_memory`. No `memory` collection exists. The worker that creates it (`qdrant_projection_worker.py:154`) is dead code.

---

### Rank 5: `graph_expand.py` Column Name Mismatch (Severity 3)

**Risk:** `graph_expand.py:37` queries `SELECT source, target, relation_type FROM object_relationships` but the actual table has columns `source_object_id`, `target_object_id`, `relationship_type`. The query fails with a PostgreSQL error. The `except Exception` handler silently returns `[]`.

**Runtime impact:** Graph expansion always returns empty. The reasoning pipeline has no graph context. Silent failure.

**Evidence:**
- `graph_expand.py:36-42` — Python reads `source`, `target`, `relation_type`
- `object_relationships` table — columns are `source_object_id`, `target_object_id`, `relationship_type`
- `graph_expand.py:48-50` — `except Exception: relationships = []` — silent catch

---

### Rank 6: `projection_status` Type Mismatch (Severity 2)

**Risk:** `qdrant_projection_worker.py:177` reads `e.event_id` from events table (UUID type) and stores it in `projection_status.event_id` (INTEGER type). If this worker were activated, PostgreSQL would raise a type error on every insert. Currently this is dead code, but activation would break immediately.

**Runtime impact:** Current: none (dead code). Upon activation: all projection tracking fails.

**Evidence:**
- `qdrant_projection_worker.py:193-202` — `CREATE TABLE projection_status (event_id INTEGER PRIMARY KEY, ...)`
- `events.event_id` is `UUID NOT NULL` (from `\d events`)
- Cast from UUID to INTEGER fails for non-integer UUIDs

---

### Rank 7: TypeScript Replay Layer Not Deployed (Severity 4)

**Risk:** The entire `runtime/replay/` directory (merkle_tree.ts, certificate_authority.ts, witness_authority.ts, deterministic_replay_engine.ts, canonical_hash_authority.ts) is not copied by the Dockerfile. These files represent ~5,000 lines of constitutional replay/witness infrastructure that is completely non-functional in production.

**Runtime impact:** None currently. But if replay or witness functionality is expected to work in production, it does not — the code doesn't exist in the container.

**Evidence:** Dockerfile COPY directives confirmed. Container `find /app -name '*.ts'` returns only 3 files in `/app/runtime/adapters/`.

---

### Rank 8: `constitutional/query` Bypasses Postgres Verification (Severity 2)

**Risk:** `GET /constitutional/query` (app.py:832-970) reads directly from Qdrant `constitutional_documents` collection without cross-checking against Postgres. It performs ProjectionIntegrity verification (hash check) but does not verify that the Qdrant point corresponds to a known Postgres event with matching content_hash.

**Runtime impact:** If Qdrant and Postgres diverge (e.g., Qdrant restored from backup, Postgres not), `/constitutional/query` returns Qdrant results without detecting the divergence. Only `/constitution/search` performs the cross-check.

**Evidence:**
- `app.py:871` — Qdrant search, no Postgres query
- `app.py:1086-1090` — `/constitution/search` does `def query_constitution()` with Postgres verification at line 1141-1152

---

### Rank 9: 7 Worker Files Exist but Are Dead Code (Severity 4)

**Risk:** 7 worker files in `workers/` directory (`summary_worker.py`, `claim_worker.py`, `candidate_claim_worker.py`, `embedding_worker.py`, `entity_worker.py`, `classifier_worker.py` plus `memory_ingestion_worker.py`) are not on any import chain from `app.py` or any cognitive module. These represent the constitutional reasoning worker layer, but none execute.

**Runtime impact:** None currently. No claim, observation, embedding, entity, or summary events are being produced. The events table has only `DOCUMENT_IMPORTED` (15 rows) — no other event types exist.

**Evidence:**
- `SELECT DISTINCT event_type FROM events` returns only `DOCUMENT_IMPORTED`
- Import chain analysis confirms no path from `app.py` to any `workers/*.py` file
- No `claim_worker.py`, `candidate_claim_worker.py` path in TOOL_MAP (`worker_protocol.py:17-24`)

---

### Rank 10: `sha256` is NULL for All Authority Objects (Severity 2)

**Risk:** The `authority_objects` table has a `sha256` column that is NULL for all 15 rows. This means `mechanical_verification()` cannot verify `artifact_hash_verified` against the original content — it falls through to `elif payload_hash: True`, which is a weaker check that doesn't confirm content integrity.

**Runtime impact:** Authority objects are assigned "artifact hash verified = True" without actually verifying against the original content hash. Any modification to the payload_hash would go undetected.

**Evidence:**
- `docker exec brain-postgres psql -U postgres -d crx_runtime -c "SELECT count(*) FROM authority_objects WHERE sha256 IS NULL"` → 15
- `authority_search.py:84-87` — `if payload_hash and sha256: verification["artifact_hash_verified"] = (payload_hash == sha256)` → falls to `elif payload_hash: verification["artifact_hash_verified"] = True` (bypasses comparison)

---

### Summary — Top 10

| Rank | Finding | Severity | Runtime Impact | Evidence |
|---|---|---|---|---|
| 1 | event_id is uuid4 (non-deterministic) | **1** | Replay impossible, cross-system verification broken | `event_emitter.py:101` overwrites caller's uuid5 |
| 2 | authority_witness + authority_supersession empty | **2** | All verification.overall = False | Both tables have 0 rows |
| 3 | JSON fallback files don't exist | **3** | Silent empty results on Postgres failure | `/app/runtime/data/` is empty |
| 4 | `memory` collection never created | **3** | `/memory/search` always fails | Collection missing from Qdrant |
| 5 | graph_expand column name mismatch | **3** | Graph expansion silently returns empty | Python reads `source`/`target`, table has `source_object_id`/`target_object_id` |
| 6 | projection_status type mismatch | **2** | Would break on activation (dead code) | INTEGER event_id vs UUID events.event_id |
| 7 | TypeScript replay layer not deployed | **4** | Replay/witness non-functional in production | `runtime/replay/` not in Dockerfile |
| 8 | `/constitutional/query` bypasses Postgres | **2** | Qdrant/Postgres divergence undetected | No Postgres query in endpoint handler |
| 9 | 7 worker files are dead code | **4** | Only DOCUMENT_IMPORTED events exist | No import chain to any workers/ file |
| 10 | sha256 is NULL for all authority_objects | **2** | Content integrity cannot be verified | `SELECT count(*) FROM authority_objects WHERE sha256 IS NULL` → 15 |

### Runtime Compliance Summary

| Constitutional Feature | Defined? | Deployed? | Executed? | Authoritative? |
|---|---|---|---|---|
| Hash authority (sha256) | YES | YES | **YES** (Python) | **YES** |
| Identity (event_id) | YES | YES | **YES** (uuid4) | **YES** — but non-deterministic |
| Identity (content-addressed) | YES (constitutional_retrieval.py) | YES | **PARTIAL** — overwritten by uuid4 | NO |
| Replay (merkle_tree.ts) | YES | **NO** — not in container | **NO** | **NO** |
| Witness (witness_authority.ts) | YES | **NO** | **NO** | **NO** |
| Claims (claim_worker.py) | YES | YES (on disk) | **NO** — dead code | **NO** |
| Projections (Qdrant workers) | YES | YES (on disk) | **NO** — dead code | **NO** |
| Schema (CQRS events) | YES | YES | **YES** | **YES** |
| Schema (LEGACY events) | YES | **NO** — not in container | **NO** | **NO** |
| Authority tables (4 tables) | YES | YES | **YES** | **YES** — but missing data |
| JSON fallback files | YES | **NO** — directory empty | **NO** | **NO** |
