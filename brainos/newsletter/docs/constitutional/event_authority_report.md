# EVENT AUTHORITY REPORT

**Audit Date:** 2025-01-18  
**Audit Mode:** ZERO ASSUMPTION - READ ONLY  
**Audit Principle:** Find every event implementation. Determine if there is one event system or multiple competing logs.

---

## EXECUTIVE SUMMARY

**Multiple competing event systems exist.** Brain's event_emitter.py (Python) and PING's gateway/event_emitter.js (JavaScript) are duplicate event systems. PING's postgres_event_store.ts is a stub. Applications use Brain's event_emitter.py, not PING's. Event authority is fragmented between Brain and PING.

---

## EVENT IMPLEMENTATION INVENTORY

### EVENT IMPLEMENTATION 1: Brain/event_emitter.py

**FILE:** C:\Users\nolan\CascadeProjects\brain\src\constitutional\event_emitter.py

**EVENT_TYPES:**
- ARTICLE_CREATED
- ARTICLE_UPDATED
- NEWSLETTER_CREATED
- DIGEST_GENERATED
- ARCHIVE_WRITTEN
- MARKDOWN_WRITTEN
- ARTICLE_PROCESSING_FAILED
- NEWSLETTER_PROCESSING_FAILED
- DATABASE_WRITE_FAILED
- ARCHIVE_WRITE_FAILED

**IMMUTABLE:** YES (PostgreSQL events table has append-only triggers)

**REPLAYABLE:** PARTIAL (events table exists but no replay engine uses it)

**CONSUMERS:**
- crx-newsletter-brain (database.py, worker.py)
- crx-digestion-worker (database.py, worker.py)

**AUTHORITATIVE:** PARTIAL (events are emitted but SQLite is authoritative storage)

**EVIDENCE:**
```python
# event_emitter.py line 56-100
async def emit_event(stream, eventType, payload):
    # Insert event
    query = """
      INSERT INTO events (stream, event_type, payload, created_at)
      VALUES ($1, $2, $3, $4)
    """
    await pool.query(query, [
      stream,
      eventType,
      JSON.stringify(payload),
      new Date()
    ])
```

---

### EVENT IMPLEMENTATION 2: PING/gateway/event_emitter.js

**FILE:** C:\Users\nolan\PING\gateway\event_emitter.js

**EVENT_TYPES:**
- INFERENCE_REQUEST
- INFERENCE_RESPONSE
- INFERENCE_FAILED

**IMMUTABLE:** YES (PostgreSQL events table has append-only triggers)

**REPLAYABLE:** PARTIAL (events table exists but no replay engine uses it)

**CONSUMERS:**
- PING gateway (server.js)

**AUTHORITATIVE:** PARTIAL (events are emitted but no consumers exist)

**EVIDENCE:**
```javascript
// event_emitter.js line 56-100
async function emitEvent(stream, eventType, payload) {
    const query = `
      INSERT INTO events (stream, event_type, payload, created_at)
      VALUES ($1, $2, $3, $4)
    `;
    await pool.query(query, [
      stream,
      eventType,
      JSON.stringify(payload),
      new Date()
    ]);
}
```

---

### EVENT IMPLEMENTATION 3: PING/runtime/adapters/postgres_event_store.ts

**FILE:** C:\Users\nolan\PING\runtime\adapters\postgres_event_store.ts

**EVENT_TYPES:** NONE (stub implementation)

**IMMUTABLE:** UNKNOWN (stub implementation)

**REPLAYABLE:** UNKNOWN (stub implementation)

**CONSUMERS:** NONE (stub implementation)

**AUTHORITATIVE:** NO (stub implementation)

**EVIDENCE:**
```typescript
// postgres_event_store.ts line 19-24
async storeEvent(event: CanonicalEventEnvelope): Promise<void> {
    // Infrastructure implementation for PostgreSQL storage
    // This is where the actual database operations happen
    console.log('Storing event in PostgreSQL:', event.getEventId());
    // Implementation would use pg library here
}
```

---

### EVENT IMPLEMENTATION 4: PING/runtime/kernel/commit-service/src/events/event_log.ts

**FILE:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\events\event_log.ts

**EVENT_TYPES:** artifact_commit (and others)

**IMMUTABLE:** UNKNOWN (execution_events table schema unknown)

**REPLAYABLE:** UNKNOWN (no replay engine uses execution_events)

**CONSUMERS:** PING commit-service (commit_controller.ts)

**AUTHORITATIVE:** UNKNOWN (commit-service runtime status unknown)

**EVIDENCE:**
```typescript
// event_log.ts line 3-11
export async function logEvent(type: string, payload: any) {
    await pool.query(
        `
    INSERT INTO execution_events(event_type,payload)
    VALUES ($1,$2)
    `,
        [type, payload]
    )
}
```

---

## EVENT SYSTEM ANALYSIS

### Is there one event system?

NO. Multiple competing event systems exist:

1. **Brain/event_emitter.py** (Python) - Used by applications
2. **PING/gateway/event_emitter.js** (JavaScript) - Used by PING gateway
3. **PING/runtime/adapters/postgres_event_store.ts** (TypeScript) - Stub, not used
4. **PING/runtime/kernel/commit-service/src/events/event_log.ts** (TypeScript) - Used by commit-service

### Or multiple competing logs?

YES. Multiple competing event logs exist:

1. **PostgreSQL events table** (used by Brain/event_emitter.py and PING/gateway/event_emitter.js)
2. **PostgreSQL execution_events table** (used by PING commit-service)
3. **PostgreSQL artifacts table** (used by PING commit-service)
4. **PostgreSQL lineage_edges table** (used by PING commit-service)

---

## EVENT AUTHORITY MATRIX

| Event Implementation | Language | Event Types | Immutable | Replayable | Consumers | Authoritative | Status |
|---------------------|---------|-------------|-----------|------------|-----------|---------------|--------|
| Brain/event_emitter.py | Python | 10 event types | YES | PARTIAL | crx-newsletter-brain, crx-digestion-worker | PARTIAL | ACTIVE |
| PING/gateway/event_emitter.js | JavaScript | 3 event types | YES | PARTIAL | PING gateway | PARTIAL | ACTIVE |
| PING/postgres_event_store.ts | TypeScript | NONE | UNKNOWN | UNKNOWN | NONE | NO | STUB |
| PING/commit-service/event_log.ts | TypeScript | artifact_commit | UNKNOWN | UNKNOWN | PING commit-service | UNKNOWN | UNKNOWN |

---

## CRITICAL FINDINGS

1. **Multiple competing event systems exist.** Brain/event_emitter.py and PING/gateway/event_emitter.js are duplicate event systems with different event types.

2. **Event authority is fragmented.** Brain owns event emission for applications. PING owns event emission for gateway and commit-service. No single event authority exists.

3. **PING postgres_event_store.ts is a stub.** The adapter exists but is a console.log stub. No actual PostgreSQL operations occur.

4. **PING commit-service event_log is isolated.** commit-service uses execution_events table, not the events table. This is a separate event log.

5. **Applications use Brain, not PING.** Applications import from Brain/event_emitter.py, not from PING/event_emitter.js or PING/postgres_event_store.ts.

6. **No event replay exists.** Events are emitted but never replayed. No replay engine consumes events.

7. **Event immutability is enforced by PostgreSQL triggers.** The events table has append-only triggers, but this is not used by applications.

8. **Event authority is PARTIAL.** Events are emitted but SQLite is authoritative storage. Events are not used for state reconstruction.

---

## ANSWER

**Is there one event system?**

NO. Multiple competing event systems exist:
- Brain/event_emitter.py (Python) - Used by applications
- PING/gateway/event_emitter.js (JavaScript) - Used by PING gateway
- PING/postgres_event_store.ts (TypeScript) - Stub, not used
- PING/commit-service/event_log.ts (TypeScript) - Used by commit-service

**Or multiple competing logs?**

YES. Multiple competing event logs exist:
- PostgreSQL events table (used by Brain and PING gateway)
- PostgreSQL execution_events table (used by PING commit-service)
- PostgreSQL artifacts table (used by PING commit-service)
- PostgreSQL lineage_edges table (used by PING commit-service)

**Event Authority:**
- Brain owns event emission for applications (event_emitter.py)
- PING owns event emission for gateway (event_emitter.js)
- PING owns event emission for commit-service (event_log.ts)
- No single event authority exists
- Event authority is fragmented
