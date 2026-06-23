# ACTUAL AUTHORITY GRAPH

**Audit Date:** 2025-01-18  
**Audit Mode:** ZERO ASSUMPTION - READ ONLY  
**Audit Principle:** Ownership is proven through imports, runtime execution, writes, reads, reconstructability, and actual dependencies.

---

## EXECUTIVE SUMMARY

**Brain does NOT depend on PING.** Applications import from Brain's event_emitter.py, not from PING. PING primitives are dormant code with no runtime consumers. Actual authority flows from applications → Brain → PostgreSQL. PING is a disconnected code library.

---

## ACTUAL DEPENDENCY GRAPH

### SOURCE: crx-newsletter-brain/worker.py

**TARGET:**
- database.py (LOCAL IMPORT)
- yahoo_client.py (LOCAL IMPORT)
- summarizer.py (LOCAL IMPORT)
- archive.py (LOCAL IMPORT)
- digest_generator.py (LOCAL IMPORT)
- Brain/src/constitutional/event_emitter.py (REMOTE IMPORT via sys.path.append)

**TYPE:** IMPORT
**CRITICAL:** YES
**DIRECTION:** crx-newsletter-brain → Brain

**Evidence:**
```python
# worker.py line 10-11
sys.path.append('C:/Users/nolan/CascadeProjects/brain')
from src.constitutional import emit_event
```

---

### SOURCE: crx-newsletter-brain/database.py

**TARGET:**
- sqlite3 (STANDARD LIBRARY)
- Brain/src/constitutional/event_emitter.py (REMOTE IMPORT via sys.path.append)

**TYPE:** IMPORT
**CRITICAL:** YES
**DIRECTION:** crx-newsletter-brain → Brain

**Evidence:**
```python
# database.py line 6-7
sys.path.append('C:/Users/nolan/CascadeProjects/brain')
from src.constitutional import emit_newsletter_created, emit_digest_generated, emit_newsletter_processing_failed, emit_database_write_failed
```

---

### SOURCE: crx-digestion-worker/worker.py

**TARGET:**
- database.py (LOCAL IMPORT)
- tools.py (LOCAL IMPORT)
- summarizer.py (LOCAL IMPORT)
- archive.py (LOCAL IMPORT)
- Brain/src/constitutional/event_emitter.py (REMOTE IMPORT via sys.path.append)

**TYPE:** IMPORT
**CRITICAL:** YES
**DIRECTION:** crx-digestion-worker → Brain

**Evidence:**
```python
# worker.py line 10-11
sys.path.append('C:/Users/nolan/CascadeProjects/brain')
from src.constitutional import emit_event
```

---

### SOURCE: crx-digestion-worker/database.py

**TARGET:**
- sqlite3 (STANDARD LIBRARY)
- Brain/src/constitutional/event_emitter.py (REMOTE IMPORT via sys.path.append)

**TYPE:** IMPORT
**CRITICAL:** YES
**DIRECTION:** crx-digestion-worker → Brain

**Evidence:**
```python
# database.py line 6-7
sys.path.append('C:/Users/nolan/CascadeProjects/brain')
from src.constitutional import emit_article_created, emit_article_processing_failed, emit_database_write_failed
```

---

### SOURCE: Brain/src/constitutional/event_emitter.py

**TARGET:**
- psycopg2 (EXTERNAL LIBRARY)
- PostgreSQL (DATABASE)

**TYPE:** IMPORT + DATABASE CONNECTION
**CRITICAL:** YES
**DIRECTION:** Brain → PostgreSQL

**Evidence:**
```python
# event_emitter.py line 15-16
import psycopg2
from psycopg2 import sql
from psycopg2.extras import Json
```

---

### SOURCE: PING/gateway/server.js

**TARGET:**
- PING/gateway/event_emitter.js (LOCAL IMPORT)
- pg (EXTERNAL LIBRARY)
- PostgreSQL (DATABASE)
- Ollama (EXTERNAL SERVICE)

**TYPE:** IMPORT + DATABASE CONNECTION + HTTP CALL
**CRITICAL:** NO (not used by applications)
**DIRECTION:** PING gateway → PostgreSQL, PING gateway → Ollama

**Evidence:**
```javascript
// server.js line 3-4
const { emitInferenceRequest, emitInferenceResponse, emitInferenceFailed } = require('./event_emitter');
const { Pool } = require('pg');
```

---

### SOURCE: PING/gateway/event_emitter.js

**TARGET:**
- pg (EXTERNAL LIBRARY)
- PostgreSQL (DATABASE)

**TYPE:** IMPORT + DATABASE CONNECTION
**CRITICAL:** NO (not used by applications)
**DIRECTION:** PING gateway → PostgreSQL

**Evidence:**
```javascript
// event_emitter.js line 10
const { Pool } = require('pg');
```

---

### SOURCE: PING/runtime/kernel/commit-service/src/server.ts

**TARGET:**
- PING/runtime/kernel/commit-service/src/api/commit_controller.ts (LOCAL IMPORT)
- PING/runtime/kernel/commit-service/src/api/audit_controller.ts (LOCAL IMPORT)
- express (EXTERNAL LIBRARY)

**TYPE:** IMPORT
**CRITICAL:** NO (not used by applications)
**DIRECTION:** PING commit-service → express

**Evidence:**
```typescript
// server.ts line 1-2
import express from "express"
import { commitArtifact } from "./api/commit_controller"
```

---

### SOURCE: PING/runtime/kernel/commit-service/src/api/commit_controller.ts

**TARGET:**
- PING/runtime/kernel/commit-service/src/engines/identity_engine.ts (LOCAL IMPORT)
- PING/runtime/kernel/commit-service/src/validation/dag_validator.ts (LOCAL IMPORT)
- PING/runtime/kernel/commit-service/src/persistence/artifact_store.ts (LOCAL IMPORT)
- PING/runtime/kernel/commit-service/src/persistence/lineage_store.ts (LOCAL IMPORT)
- PING/runtime/kernel/commit-service/src/events/event_log.ts (LOCAL IMPORT)
- PostgreSQL (DATABASE)

**TYPE:** IMPORT + DATABASE CONNECTION
**CRITICAL:** NO (not used by applications)
**DIRECTION:** PING commit-service → PostgreSQL

**Evidence:**
```typescript
// commit_controller.ts line 2-6
import { computeCanonicalHash } from "../engines/identity_engine"
import { validateLineage } from "../validation/dag_validator"
import { storeArtifact } from "../persistence/artifact_store"
import { storeLineage } from "../persistence/lineage_store"
import { logEvent } from "../events/event_log"
```

---

### SOURCE: PING/runtime/kernel/commit-service/src/engines/canonical_engine.ts

**TARGET:**
- @crx/replay (EXTERNAL PACKAGE - PING replay)

**TYPE:** IMPORT
**CRITICAL:** NO (not used by applications)
**DIRECTION:** PING commit-service → PING replay

**Evidence:**
```typescript
// canonical_engine.ts line 1
import { CanonicalJson } from "@crx/replay";
```

---

### SOURCE: PING/runtime/adapters/express_commit_adapter.ts

**TARGET:**
- PING/runtime/replay/canonical_event_envelope.ts (LOCAL IMPORT)
- PING/runtime/replay/replay_verification.ts (LOCAL IMPORT)
- PING/runtime/replay/replay_event_stream.ts (LOCAL IMPORT)

**TYPE:** IMPORT
**CRITICAL:** NO (not used by applications)
**DIRECTION:** PING adapters → PING replay

**Evidence:**
```typescript
// express_commit_adapter.ts line 9-11
import { CanonicalEventEnvelope } from '../replay/canonical_event_envelope';
import { ReplayVerification } from '../replay/replay_verification';
import { ReplayEventStream } from '../replay/replay_event_stream';
```

---

### SOURCE: PING/runtime/adapters/postgres_event_store.ts

**TARGET:**
- PING/runtime/replay/canonical_event_envelope.ts (LOCAL IMPORT)
- PING/runtime/replay/replay_event_stream.ts (LOCAL IMPORT)

**TYPE:** IMPORT
**CRITICAL:** NO (not used by applications, stub implementation)
**DIRECTION:** PING adapters → PING replay

**Evidence:**
```typescript
// postgres_event_store.ts line 9-10
import { CanonicalEventEnvelope } from '../replay/canonical_event_envelope';
import { ReplayEventStream } from '../replay/replay_event_stream';
```

---

## MISSING DEPENDENCIES

### Applications do NOT import from PING

**Evidence:**
- No imports from PING found in crx-newsletter-brain
- No imports from PING found in crx-digestion-worker
- Applications import from Brain, not PING

**Conclusion:** Applications do NOT depend on PING

---

### PING replay engine has NO runtime consumers

**Evidence:**
- No imports from PING replay found in applications
- No imports from PING replay found in Brain
- PING replay is only imported by PING adapters and PING commit-service

**Conclusion:** PING replay engine has NO runtime consumers

---

### PING commit-service has NO runtime consumers

**Evidence:**
- No imports from PING commit-service found in applications
- No imports from PING commit-service found in Brain
- PING commit-service is only imported by itself

**Conclusion:** PING commit-service has NO runtime consumers

---

### PING gateway has NO runtime consumers

**Evidence:**
- No imports from PING gateway found in applications
- No imports from PING gateway found in Brain
- PING gateway is only used by itself

**Conclusion:** PING gateway has NO runtime consumers

---

## ACTUAL AUTHORITY FLOW

### Primary Authority Flow

**Applications → Brain → PostgreSQL**

1. crx-newsletter-brain imports from Brain/event_emitter.py
2. crx-digestion-worker imports from Brain/event_emitter.py
3. Brain/event_emitter.py writes to PostgreSQL events table
4. Applications write to SQLite databases (newsletters.db, knowledge.db)

**Evidence:**
- Applications import from Brain (proven by sys.path.append)
- Brain writes to PostgreSQL (proven by psycopg2 import)
- Applications write to SQLite (proven by sqlite3 import)

---

### Secondary Authority Flow (PING - DORMANT)

**PING commit-service → PostgreSQL**

1. PING commit-service imports from PING replay
2. PING commit-service writes to PostgreSQL artifacts table
3. PING commit-service writes to PostgreSQL lineage_edges table
4. PING commit-service writes to PostgreSQL execution_events table

**Evidence:**
- PING commit-service imports from PING replay (proven by import statements)
- PING commit-service writes to PostgreSQL (proven by pg import)
- PING commit-service has NO runtime consumers (proven by lack of imports)

---

### Tertiary Authority Flow (PING gateway - DORMANT)

**PING gateway → PostgreSQL → Ollama**

1. PING gateway writes to PostgreSQL events table
2. PING gateway calls Ollama for inference
3. PING gateway emits events to PostgreSQL

**Evidence:**
- PING gateway writes to PostgreSQL (proven by pg import)
- PING gateway calls Ollama (proven by HTTP calls)
- PING gateway has NO runtime consumers (proven by lack of imports)

---

## CRITICAL FINDINGS

1. **Brain does NOT depend on PING.** Applications import from Brain, not from PING. Brain does not import from PING.

2. **PING primitives are dormant.** PING replay engine, witness authority, canonical state, hash authority, and lineage tracking exist but have NO runtime consumers.

3. **PING commit-service is disconnected.** PING commit-service exists but has NO runtime consumers. It is not used by applications or Brain.

4. **PING gateway is disconnected.** PING gateway exists but has NO runtime consumers. It is not used by applications or Brain.

5. **Actual authority flows through Brain.** Applications → Brain → PostgreSQL is the actual authority flow. PING is not in the authority flow.

6. **PING is a disconnected code library.** PING has constitutional primitives but they are not connected to the actual authority flow.

---

## ANSWER

**Does Brain actually depend on PING?**

NO. Brain does NOT depend on PING. Applications import from Brain's event_emitter.py, not from PING. Brain does not import from PING. PING primitives are dormant code with no runtime consumers.

**Or do documents merely claim it?**

Documents claim PING is the constitutional kernel and that Brain depends on PING. Reality shows Brain does NOT depend on PING. PING is a disconnected code library with no runtime consumers. Documents are STALE or FICTION.

**Evidence:**
- Applications import from Brain (proven by sys.path.append)
- Brain does not import from PING (no imports found)
- PING primitives have NO runtime consumers (no imports found)
- PING commit-service has NO runtime consumers (no imports found)
- PING gateway has NO runtime consumers (no imports found)
- Actual authority flow: Applications → Brain → PostgreSQL
- PING is NOT in the actual authority flow
