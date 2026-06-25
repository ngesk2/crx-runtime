# CONSTITUTIONAL_EXECUTION_PATH_AUDIT

**Date:** 2026-06-25  
**Auditor:** Cascade Security Agent  
**Objective:** Trace real DOCUMENT_IMPORTED event from creation to termination

---

# 1. Event Producer

**Exact Code Path Creating DOCUMENT_IMPORTED:**

**Path A (Test Ingestion):**
- File: `test_event_ingestion.py`
- Line: 19
- Function: Main script execution
- Code: `event_type: 'DOCUMENT_IMPORTED'`
- Storage: Direct SQL INSERT via docker exec

**Path B (Google Drive Ingestion):**
- File: `runtime/ingestion/drive_ingestor.py`
- Line: 202
- Class: `DriveIngestor`
- Function: `emit_document_event()`
- Code: `self.emit_document_event('DOCUMENT_IMPORTED', file_data)`
- Storage: PostgreSQL INSERT via psycopg2

**Evidence:**
- test_event_ingestion.py generates 10 DOCUMENT_IMPORTED events
- drive_ingestor.py emits DOCUMENT_IMPORTED for new Google Drive files
- Both write directly to PostgreSQL events table
- No event bus, no pub/sub, direct database writes

---

# 2. Event Consumers

**Runtime Subscribers to DOCUMENT_IMPORTED:**

**Subscriber 1: qdrant_projection_worker.py**
- File: `runtime/workers/qdrant_projection_worker.py`
- Class: `QdrantProjectionWorker`
- Function: `_get_unprojected_events()` (line 172)
- Polling mechanism: Queries PostgreSQL for unprojected events
- Status: NOT RUNNING (not executed in current runtime)

**Subscriber 2: None**
- No other runtime subscribers found
- No event bus implementation
- No pub/sub mechanism
- No trigger-based consumers

**Evidence:**
- Search for "event bus": 0 results
- Search for "subscriber": 0 results
- Search for "event listener": 0 results
- Search for "event processor": 0 results
- Only qdrant_projection_worker.py polls events table

---

# 3. Stop Point

**Exact Location Where Execution Terminates:**

```
DOCUMENT_IMPORTED
↓
test_event_ingestion.py:19 (or drive_ingestor.py:202)
↓
PostgreSQL INSERT via docker exec (or psycopg2)
↓
events table row created
↓
NO SUBSCRIBERS
↓
STOP
```

**Evidence:**
- Events successfully inserted into PostgreSQL (15 rows)
- No event bus to publish events
- No subscribers listening for events
- qdrant_projection_worker.py exists but not running
- Execution terminates at database insertion

---

# 4. Missing Constitutional Links

**OBSERVATION_CREATED**
- Status: MISSING ENTIRELY
- Evidence: No OBSERVATION_CREATED events in database
- Search: 0 results for OBSERVATION_CREATED in runtime

**CLAIM_GENERATED**
- Status: MISSING ENTIRELY
- Evidence: No CLAIM_GENERATED events in database
- Search: 0 results for CLAIM_GENERATED in runtime

**DECISION_CREATED**
- Status: MISSING ENTIRELY
- Evidence: No DECISION_CREATED events in database
- Search: 0 results for DECISION_CREATED in runtime

**REPLAY_EXECUTED**
- Status: IMPLEMENTED BUT DISCONNECTED
- Evidence: DeterministicReplayEngine exists (90 lines) but never called
- Runtime callers: 0

**WITNESS_CREATED**
- Status: IMPLEMENTED BUT DISCONNECTED
- Evidence: WitnessAuthority exists (248 lines) but never called
- Runtime callers: 0
- Database: authority_witness table has 0 rows

**LINEAGE_CREATED**
- Status: IMPLEMENTED BUT DISCONNECTED
- Evidence: lineage_store.ts exists (14 lines) but never called
- Runtime callers: 0
- Database: lineage table has 0 rows

**PROJECTION_CREATED**
- Status: IMPLEMENTED BUT NOT RUNNING
- Evidence: qdrant_projection_worker.py exists (449 lines) but not executed
- Database: projections table has 0 rows
- Qdrant: Authentication blocked

---

# 5. Runtime Caller Audit

**WitnessAuthority**
- Runtime callers: 0
- Search results: 0 files import or call WitnessAuthority
- Evidence: Fully implemented but disconnected

**DeterministicReplayEngine**
- Runtime callers: 0
- Search results: 0 files import or call DeterministicReplayEngine
- Evidence: Fully implemented but disconnected

**storeLineage**
- Runtime callers: 0
- Search results: 0 files import or call storeLineage
- Evidence: Function exists but unused

**Total Runtime Callers:** 0

---

# 6. Final Answer

The constitutional system fails because events are written directly to PostgreSQL without an event bus or subscriber mechanism, causing execution to terminate immediately after database insertion with no replay, witness, lineage, or projection processing.
