# Qdrant Execution Reality — Phase 6

## Evidence Sources
- Qdrant REST API responses (with API key authentication)
- Qdrant container logs (`docker logs brain-qdrant --tail 100`)
- Container network inspection (`docker inspect`)
- Python code analysis of every Qdrant client instantiation

## Active Collections

| Collection | Points | Vector Size | Distance | Created By | Last Write | Last Query |
|---|---|---|---|---|---|---|
| `constitutional_documents` | **5** | 768 | Cosine | `constitutional_retrieval.py` (172.21.0.5) | 2026-06-24 21:40:44 UTC (from Qdrant logs) | 2026-06-25 04:21:30 UTC (from Qdrant logs) |
| `constitutional_memory` | **0** | 768 | Cosine | Collection created but never written to | N/A | 2026-06-25 04:30:19 UTC (from Qdrant logs) |

## Collections that DO NOT EXIST (verified by API)

| Collection | Status | Evidence |
|---|---|---|
| `memory` | **DOES NOT EXIST** | `GET /collections` returns only 2 collections |
| `tier2_operational` | **DOES NOT EXIST** | Not in collection list |
| `tier3_working` | **DOES NOT EXIST** | Not in collection list |
| `constitutional` | **DOES NOT EXIST** | Not in collection list |

## Who Writes Qdrant?

### ALL writes come from: **172.21.0.5 (ping-mission-control)**

Qdrant log evidence:
```
172.21.0.5 "PUT /collections/constitutional_documents/points?wait=true HTTP/1.1" 200 91 "-" "python-httpx/0.28.1" 0.023296
```

The User-Agent `python-httpx/0.28.1` confirms the `qdrant-client` library is the HTTP client.

### Code paths that write to Qdrant:

| Function | File | Collection | Evidence |
|---|---|---|---|
| `ConstitutionalRetrieval.ingest_document()` | `constitutional_retrieval.py:141` | `constitutional_documents` | `self.qdrant_client.upsert(collection_name=QDRANT_COLLECTION, points=[point])` where QDRANT_COLLECTION = 'constitutional_documents' |
| No other writer | — | `constitutional_memory` | Collection has 0 points — nothing has ever written to it |

### Code paths that CAN write but DON'T (dead code):

| Function | File | Collection | Why not executed |
|---|---|---|---|
| `ensure_memory_tiers()` | `projection_worker/projection_worker.py:57` | tier2_operational, tier3_working | File not executed |
| `project_event_to_qdrant()` | `projection_worker.py:156` | constitutional_memory | File not executed |
| `index_vault()` | `projection_worker/projection_worker.py:174` | constitutional_documents | File not executed |

## Who Reads Qdrant?

### ALL reads come from: **172.21.0.5 (ping-mission-control)**

Qdrant log evidence:
```
172.21.0.5 "POST /collections/constitutional_documents/points/search HTTP/1.1" 200 578 "-" "python-httpx/0.28.1" 0.021193
172.21.0.5 "GET /collections HTTP/1.1" 200 112 "-" "python-httpx/0.28.1" 0.000793
```

### Read paths:

| Endpoint | File | Collection | Frequency |
|---|---|---|---|
| `/constitutional/query` | app.py:870 | constitutional_documents | Active (many hits in logs) |
| `/constitution/search` | app.py:1101 | constitutional_documents | Active |
| `/constitution/doc/{doc_id}` | app.py:1253 | constitutional_documents | Active |
| `/constitutional/retrieve` | constitutional_integration.py | constitutional_documents | Active |
| `/qdrant/health` | app.py:495 | ALL (get_collections) | Active |
| `/memory/search` | app.py:413 | **memory** (non-existent) | Returns error — collection doesn't exist |
| `/constitution/authority` | app.py:1308 | ALL | Active |

### Read attempts from other IPs:
```
172.21.0.1 "GET /collections/constitutional_memory HTTP/1.1" 401 56 "-" "curl/8.19.0" 0.000597
```
These are 401 Unauthorized — from my own curl probes (172.21.0.1 is the Docker gateway/host).

## Qdrant Configuration

| Setting | constitutional_documents | constitutional_memory |
|---|---|---|
| Points | 5 | 0 |
| Vector Size | 768 | 768 |
| Distance | Cosine | Cosine |
| Shard Number | 1 | 1 |
| Replication Factor | 1 | 1 |
| On Disk Payload | true | true |
| HNSW M | 16 | 16 |
| HNSW ef_construct | 100 | 100 |
| Optimizer Status | ok | ok |

## Conclusion

**Single writer, single reader, all from ping-mission-control (172.21.0.5).** No projection worker, no separate process, no external service writes to or reads from Qdrant. The only active writer is `constitutional_retrieval.py:141` called from the `/constitutional/ingest` endpoint. The `constitutional_memory` collection has 0 points and has never received a write.
