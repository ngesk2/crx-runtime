# Projection Authority Report — Phase 42 Tier 2E

## Qdrant Configuration

| Property | Value |
|----------|-------|
| Vector dimensions | 768 |
| Distance metric | Cosine |
| Default collection | `constitutional_memory` |
| Other collections | `constitutional_documents`, `memory`, `conversations`, `documents`, `checkpoints`, `tier2_operational`, `tier3_working`, `test_vectors` |

## Write Paths

### Paths Where Qdrant IS Authoritative (NO Postgres Source)

| # | File | Path | Data Loss if Qdrant Wiped |
|---|------|------|--------------------------|
| 1 | `gateway/document_ingestion.js:299` | Filesystem chunks → Qdrant directly | **TOTAL** — no Postgres event trail |
| 2 | `gateway/conversation_memory.js:229` | Conversations → Qdrant directly | **TOTAL** — conversations exist only in Qdrant |
| 3 | `brainos/.../projection_worker/projection_worker.py:164` | Vault .md files → Qdrant directly | **PARTIAL** — files on disk, no Postgres event trail |
| 4 | `runtime/projection_worker/constitutional_projection_worker.py:222` | Vault files → Qdrant directly | **PARTIAL** — files on disk, no Postgres event trail |

**4 paths where Qdrant is the only storage.** 2 of these have no filesystem recovery either (conversations, ephemeral).

### Paths Where Qdrant Is DERIVED (Postgres Source Before Qdrant Write)

| # | File | Postgres Source | Recoverable |
|---|------|----------------|-------------|
| 1 | `runtime/kernel/workers/qdrant_projection_worker.py:448` | YES — reads `events` table | YES — full event data + deterministic or model-based embedding |
| 2 | `runtime/workers/projection_worker.py:101` | YES — reads `events` table | YES — SHA-256 deterministic embeddings |
| 3 | `brainos/.../projection_worker.py:203` | YES — writes event before Qdrant | YES |
| 4 | `brainos/.../constitutional_retrieval.py:141` | YES — INSERT INTO events at line 107 | YES |
| 5 | `gateway/stage_registry.js` (EmbeddingStage) | YES — LifecycleContext PERSIST stage | YES |
| 6 | `gateway/constitutional_runtime.js` | YES — LifecycleStage pattern | YES |

**6 paths with proper Postgres source.** Qdrant is a derived cache. Recoverable.

## Read Paths

### Paths That Read Qdrant WITHOUT Postgres Verification (Qdrant IS authoritative at read time)

| # | File | Risk |
|---|------|------|
| 1 | `gateway/knowledge_retrieval.js:100` | **HIGH** — Qdrant results fed to Ollama without Postgres cross-check |
| 2 | `gateway/conversation_memory.js:96` | **HIGH** — Qdrant is only memory store |
| 3 | `gateway/constitutional_ollama_integration.js:72` | **HIGH** — context retrieval without verification |
| 4 | `gateway/memory_authority.js:649` | **HIGH** — memory search without verification |
| 5 | `gateway/persistent_ollama_analyst.js:122` | **HIGH** — Ollama context without verification |
| 6 | `runtime/retrieval/retrieval_service.py:83` | **HIGH** — semantic search returns Qdrant payload directly |
| 7 | `brainos/.../constitutional_retrieval.py:164` | **HIGH** — returns Qdrant results as constitutional documents |

**7 read paths that trust Qdrant as authority.** No Postgres verification.

### Paths That Verify Qdrant Results Against Postgres (Qdrant IS derived at read time)

| # | File | Verification Method |
|---|------|-------------------|
| 1 | `brainos/.../constitutional_search.py:207` | Compares payload hash from Qdrant vs Postgres event data |
| 2 | `brainos/.../mission_control/app.py:426` | ProjectionIntegrity verification with hash comparison |
| 3 | `brainos/.../mission_control/app.py:887` | Projection integrity (constitution search) |
| 4 | `mission_control_knowledge_apis.py:198` | Verifies each Qdrant result against Postgres documents table |

**4 read paths with proper verification.** These correctly treat Qdrant as derived.

## Critical Finding: `retrieval_service.py` Self-Attestation

**File**: `runtime/retrieval/retrieval_service.py:138`

The `authority_filter()` method checks a `_verified` field in the Qdrant payload:

```python
def authority_filter(self, results: List[dict]) -> List[dict]:
    verified = []
    for r in results:
        payload = r.payload or {}
        if payload.get('_verified', False) and payload.get('_source_classification') == 'CONSTITUTIONAL_LAW':
            verified.append(r)
    return verified
```

This is **circular authority** — the `_verified` field is self-attested by the projection worker that wrote the data. It is not cross-checked against Postgres. This provides no real authority guarantee.

## Collection Authority Classification

| Collection | Populated By | Postgres Source | Read Verification | Authority |
|-----------|-------------|----------------|-----------------|-----------|
| `constitutional_memory` | Event projection workers | YES | Some paths verify | DERIVED (mostly) |
| `constitutional_documents` | Retrieval + vault indexing | PARTIAL | Some paths verify | MIXED |
| `conversations` | conversation_memory.js | NO | NO | **AUTHORITATIVE** |
| `documents` | document_ingestion.js | NO | mission_control verifies | MIXED |
| `checkpoints` | checkpoint_authority.js | PARTIAL | NO | **AUTHORITATIVE** (for embeddings) |
| `tier2_operational` | never populated | N/A | N/A | EMPTY |
| `tier3_working` | never populated | N/A | N/A | EMPTY |
| `test_vectors` | qdrant_bootstrap.js | NO | test-only | TEST |

## Qdrant Authority Summary

- **Qdrant IS authoritative** for 2 collections: `conversations` and `checkpoints` (embedding-only)
- **Qdrant IS partially authoritative** for `documents` (document_ingestion.js writes without Postgres)
- **Qdrant is DERIVED** for `constitutional_memory` and `constitutional_documents` (when populated by event pipeline)
- **8 read paths** trust Qdrant without Postgres verification
- **4 read paths** properly verify against Postgres
- **retrieval_service.py authority_filter is circular** — checks a self-attested field in Qdrant payload, not Postgres
- **Embedding vectors are always Qdrant-only** — Postgres stores event payload but not vectors. On Qdrant loss, vectors must be regenerated (deterministic = identical; model-based = approximate)
