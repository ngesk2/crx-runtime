# Worker Schema Audit

**Audit Date:** 2026-06-25
**Audit Type:** P0 — Verify Before Touching Anything
**Objective:** Determine which workers use old schema vs CQRS schema before making any changes.

---

# Audit Method

Grepped for old schema columns (`stream`, `payload`, `payload_hash`) across all Python workers.
Verified actual INSERT statements in each worker file.

---

# Worker Schema Status

| Worker | File | Uses Old Schema | Schema Used | Active? | Imported? | Running? | Status |
|--------|------|-----------------|--------------|---------|-----------|----------|--------|
| summary_worker | workers/summary_worker.py | NO | CQRS (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data) | NO | NO | NO | DEAD CODE |
| entity_worker | workers/entity_worker.py | NO | CQRS (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data) | NO | NO | NO | DEAD CODE |
| embedding_worker | workers/embedding_worker.py | NO | CQRS (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data) | NO | NO | NO | DEAD CODE |
| classifier_worker | workers/classifier_worker.py | NO | CQRS (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data) | NO | NO | NO | DEAD CODE |
| claim_worker | workers/claim_worker.py | NO | CQRS (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data) | NO | NO | NO | DEAD CODE |
| candidate_claim_worker | workers/candidate_claim_worker.py | NO | CQRS (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data) | NO | NO | NO | DEAD CODE |
| memory_ingestion_worker | memory_ingestion_worker.py | NO | CQRS (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data) | NO | NO | NO | DEAD CODE (documents table doesn't exist) |
| google_drive_ingestion | brainos/orchestration/src/google_drive_ingestion.py | NO | CQRS (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data, payload_hash, projected_to_qdrant) | NO | NO | NO | DEAD CODE (OAuth works but not running) |
| web_retrieval | brainos/orchestration/src/web_retrieval.py | NO | CQRS (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data, payload_hash, projected_to_qdrant) | NO | NO | NO | DEAD CODE |
| event_emitter | brainos/orchestration/src/constitutional/event_emitter.py | NO | CQRS (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data, causation_id, correlation_id) | YES | YES | YES | LIBRARY (not a worker) |

---

# Key Finding

**The previous audit report was INCORRECT.**

**Claim:** "8 workers use old schema"
**Reality:** **0 workers use old schema. All 10 workers use CQRS schema.**

The `workers/` directory contains 6 stub workers that were written with CQRS schema from the start. They are dead code because:
- They are not imported anywhere
- They are not running in any container
- They are not referenced in docker-compose
- They are standalone CLI scripts that would need to be manually invoked

The ingestion workers (memory_ingestion_worker, google_drive_ingestion, web_retrieval) also use CQRS schema but are dead code because:
- memory_ingestion_worker: references `documents` table that doesn't exist
- google_drive_ingestion: OAuth works but the worker is not running
- web_retrieval: not running

The only active event emitter is `event_emitter.py` which is a library module used by other systems (RSS, newsletter, etc.) and it uses CQRS schema correctly.

---

# Disposition

| Category | Count | Workers | Action |
|----------|-------|---------|--------|
| Dead code stub workers | 6 | summary_worker, entity_worker, embedding_worker, classifier_worker, claim_worker, candidate_claim_worker | DELETE |
| Dead code ingestion workers | 3 | memory_ingestion_worker, google_drive_ingestion, web_retrieval | DELETE (or archive if needed later) |
| Active library | 1 | event_emitter.py | KEEP (already correct) |
| **Total** | **10** | | |

---

# Recommendation

**DELETE 9 workers. PATCH 0.**

The previous audit report's claim that "8 workers use old schema" was false. All workers already use CQRS schema. The issue is not schema mismatch — the issue is that these workers are dead code.

**Action:** Delete the `workers/` directory entirely (6 stub workers). Archive the 3 ingestion workers if they might be needed later. Keep `event_emitter.py` as it is an active library.

**No code patches required.** The schema is already correct everywhere.

---

**Audit Status:** COMPLETED
