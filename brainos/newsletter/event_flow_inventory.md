# PHASE 3: EVENT FLOW DISCOVERY

**Audit Type:** OWNERSHIP PROOF + EXECUTION REALITY  
**Scope:** Trace actual event behavior (emit, record, append, commit, save, persist, publish, enqueue, replay, project, materialize)  
**Evidence Only:** Running code only, not documentation  

---

## EVENT FLOW 1: crx-digestion-worker → Brain event_emitter.py → PostgreSQL

### ENTRYPOINT

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\worker.py  
**Function:** main() → run_cycle()  
**Line 112:** run_cycle() called on startup  
**Line 68-97:** run_cycle() function

### TRANSFORMATION

**Step 1:** Emit CYCLE_STARTED event
- **File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\worker.py
- **Line 73-75:** `emit_event('rss', 'CYCLE_STARTED', {'timestamp': datetime.utcnow().isoformat()})`
- **Function:** Brain's emit_event (imported from src.constitutional)
- **Stream:** rss
- **Event Type:** CYCLE_STARTED
- **Payload:** timestamp

**Step 2:** Emit WORKER_HEARTBEAT event
- **File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\worker.py
- **Line 78-81:** `emit_event('rss', 'WORKER_HEARTBEAT', {'worker': 'rss', 'cycle': datetime.utcnow().isoformat()})`
- **Function:** Brain's emit_event (imported from src.constitutional)
- **Stream:** rss
- **Event Type:** WORKER_HEARTBEAT
- **Payload:** worker, cycle timestamp

**Step 3:** Process RSS sources
- **File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\worker.py
- **Line 32-66:** process_source(source) function
- **Transformation:** Fetch RSS → Summarize articles → Save to database → Archive as markdown

**Step 4:** Emit ARTICLE_CREATED event
- **File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\database.py
- **Line 78:** `emit_article_created(article)`
- **Function:** Brain's emit_article_created (imported from src.constitutional)
- **Stream:** rss
- **Event Type:** ARTICLE_CREATED
- **Payload:** article dictionary

**Step 5:** Emit DATABASE_WRITE_FAILED event (on error)
- **File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\database.py
- **Line 89:** `emit_database_write_failed('articles', str(e), 'rss_worker')`
- **Function:** Brain's emit_database_write_failed (imported from src.constitutional)
- **Stream:** storage
- **Event Type:** DATABASE_WRITE_FAILED
- **Payload:** table, error, source

### STORAGE

**File:** C:\Users\nolan\CascadeProjects\brain\src\constitutional\event_emitter.py  
**Function:** emit_event(stream, event_type, payload)  
**Lines 52-127:** PostgreSQL insertion  
**Database:** PostgreSQL (POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD)  
**Table:** events (id, stream, event_type, payload, created_at)  
**Query:** `INSERT INTO events (stream, event_type, payload, created_at) VALUES (%s, %s, %s, %s)`

### READERS

**File:** C:\Users\nolan\PING\gateway\server.js  
**Function:** GET /events endpoint  
**Lines 264-290:** Query events from PostgreSQL  
**Query:** `SELECT id, stream, event_type, payload, created_at FROM events ORDER BY created_at DESC LIMIT $1 OFFSET $2`

**File:** C:\Users\nolan\PING\gateway\server.js  
**Function:** GET /events/:stream endpoint  
**Lines 293-322:** Query events by stream from PostgreSQL  
**Query:** `SELECT id, stream, event_type, payload, created_at FROM events WHERE stream = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`

**File:** C:\Users\nolan\PING\database\operational_intelligence.sql  
**Function:** get_event_activity_24h()  
**Lines 9-26:** Query event activity from PostgreSQL  
**Query:** `SELECT stream, event_type, COUNT(*) as event_count FROM events WHERE created_at > NOW() - INTERVAL '24 hours' GROUP BY stream, event_type`

### DERIVED STATE

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\database.py  
**Table:** articles (SQLite)  
**Columns:** id, url, title, summary, source, published_at, processed_at, tags  
**Derivation:** Articles are saved to SQLite after event emission  
**Replayable:** NO (SQLite is not replayable from events)

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\archive.py  
**Storage:** knowledge/ directory (markdown files)  
**Derivation:** Articles are archived as markdown after database save  
**Replayable:** NO (markdown files are not replayable from events)

### EVENT PRESERVED?

**YES.** Events are inserted into PostgreSQL events table with append-only guarantees (triggers prevent updates and deletes).

### CAN REPLAY RECONSTRUCT?

**NO.** Articles are saved to SQLite and archived as markdown. There is no replay mechanism to reconstruct articles from events. SQLite and markdown are the authoritative sources, not the event log.

---

## EVENT FLOW 2: crx-newsletter-brain → Brain event_emitter.py → PostgreSQL

### ENTRYPOINT

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\worker.py  
**Function:** main() → run_ingestion_cycle()  
**Line 151:** run_ingestion_cycle() called on startup  
**Line 16-65:** run_ingestion_cycle() function

### TRANSFORMATION

**Step 1:** Emit INGESTION_CYCLE_STARTED event
- **File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\worker.py
- **Line 21-23:** `emit_event('yahoo', 'INGESTION_CYCLE_STARTED', {'timestamp': datetime.utcnow().isoformat()})`
- **Function:** Brain's emit_event (imported from src.constitutional)
- **Stream:** yahoo
- **Event Type:** INGESTION_CYCLE_STARTED
- **Payload:** timestamp

**Step 2:** Emit WORKER_HEARTBEAT event
- **File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\worker.py
- **Line 26-29:** `emit_event('yahoo', 'WORKER_HEARTBEAT', {'worker': 'yahoo', 'cycle': datetime.utcnow().isoformat()})`
- **Function:** Brain's emit_event (imported from src.constitutional)
- **Stream:** yahoo
- **Event Type:** WORKER_HEARTBEAT
- **Payload:** worker, cycle timestamp

**Step 3:** Fetch newsletters from Yahoo Mail
- **File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\worker.py
- **Line 32-60:** Yahoo Mail API calls
- **Transformation:** Fetch unread emails → Filter by word count → Save to database

**Step 4:** Emit NEWSLETTER_CREATED event
- **File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py
- **Line 107:** `emit_newsletter_created(newsletter)`
- **Function:** Brain's emit_newsletter_created (imported from src.constitutional)
- **Stream:** yahoo
- **Event Type:** NEWSLETTER_CREATED
- **Payload:** newsletter dictionary

**Step 5:** Emit DATABASE_WRITE_FAILED event (on error)
- **File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py
- **Line 118:** `emit_database_write_failed('newsletters', str(e), 'yahoo_worker')`
- **Function:** Brain's emit_database_write_failed (imported from src.constitutional)
- **Stream:** storage
- **Event Type:** DATABASE_WRITE_FAILED
- **Payload:** table, error, source

**Step 6:** Emit PROCESSING_CYCLE_STARTED event
- **File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\worker.py
- **Line 72-74:** `emit_event('yahoo', 'PROCESSING_CYCLE_STARTED', {'timestamp': datetime.utcnow().isoformat()})`
- **Function:** Brain's emit_event (imported from src.constitutional)
- **Stream:** yahoo
- **Event Type:** PROCESSING_CYCLE_STARTED
- **Payload:** timestamp

**Step 7:** Emit WORKER_HEARTBEAT event
- **File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\worker.py
- **Line 77-80:** `emit_event('yahoo', 'WORKER_HEARTBEAT', {'worker': 'yahoo', 'cycle': datetime.utcnow().isoformat()})`
- **Function:** Brain's emit_event (imported from src.constitutional)
- **Stream:** yahoo
- **Event Type:** WORKER_HEARTBEAT
- **Payload:** worker, cycle timestamp

**Step 8:** Process newsletters with Ollama
- **File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\worker.py
- **Line 88-113:** analyze_newsletter() calls
- **Transformation:** Analyze with Ollama → Update database with analysis → Archive as markdown

**Step 9:** Emit NEWSLETTER_PROCESSING_FAILED event (on error)
- **File:** C:\Users\nolan\CascadeProjects\brain\src\constitutional\event_emitter.py
- **Line 371-388:** emit_newsletter_processing_failed(message_id, error, source)
- **Function:** Brain's emit_newsletter_processing_failed (imported from src.constitutional)
- **Stream:** yahoo
- **Event Type:** NEWSLETTER_PROCESSING_FAILED
- **Payload:** message_id, error, source

**Step 10:** Emit DIGEST_GENERATED event
- **File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py
- **Line 271:** `emit_digest_generated({'type': digest_type, 'date': date, 'newsletter_count': newsletter_count, 'content_length': len(content)})`
- **Function:** Brain's emit_digest_generated (imported from src.constitutional)
- **Stream:** yahoo
- **Event Type:** DIGEST_GENERATED
- **Payload:** digest dictionary

### STORAGE

**File:** C:\Users\nolan\CascadeProjects\brain\src\constitutional\event_emitter.py  
**Function:** emit_event(stream, event_type, payload)  
**Lines 52-127:** PostgreSQL insertion  
**Database:** PostgreSQL (POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD)  
**Table:** events (id, stream, event_type, payload, created_at)  
**Query:** `INSERT INTO events (stream, event_type, payload, created_at) VALUES (%s, %s, %s, %s)`

### READERS

**File:** C:\Users\nolan\PING\gateway\server.js  
**Function:** GET /events endpoint  
**Lines 264-290:** Query events from PostgreSQL  
**Query:** `SELECT id, stream, event_type, payload, created_at FROM events ORDER BY created_at DESC LIMIT $1 OFFSET $2`

**File:** C:\Users\nolan\PING\gateway\server.js  
**Function:** GET /events/:stream endpoint  
**Lines 293-322:** Query events by stream from PostgreSQL  
**Query:** `SELECT id, stream, event_type, payload, created_at FROM events WHERE stream = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`

**File:** C:\Users\nolan\PING\database\operational_intelligence.sql  
**Function:** get_event_activity_24h()  
**Lines 9-26:** Query event activity from PostgreSQL  
**Query:** `SELECT stream, event_type, COUNT(*) as event_count FROM events WHERE created_at > NOW() - INTERVAL '24 hours' GROUP BY stream, event_type`

### DERIVED STATE

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py  
**Table:** newsletters (SQLite)  
**Columns:** id, message_id, subject, sender, body, word_count, received_at, processed_at, summary, tags, key_ideas, actionable_insights, archived  
**Derivation:** Newsletters are saved to SQLite after event emission  
**Replayable:** NO (SQLite is not replayable from events)

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py  
**Table:** digests (SQLite)  
**Columns:** id, type, date, content, generated_at, newsletter_count  
**Derivation:** Digests are saved to SQLite after event emission  
**Replayable:** NO (SQLite is not replayable from events)

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\archive.py  
**Storage:** knowledge/ directory (markdown files)  
**Derivation:** Newsletters are archived as markdown after database save  
**Replayable:** NO (markdown files are not replayable from events)

### EVENT PRESERVED?

**YES.** Events are inserted into PostgreSQL events table with append-only guarantees (triggers prevent updates and deletes).

### CAN REPLAY RECONSTRUCT?

**NO.** Newsletters are saved to SQLite and archived as markdown. There is no replay mechanism to reconstruct newsletters from events. SQLite and markdown are the authoritative sources, not the event log.

---

## EVENT FLOW 3: PING Gateway → PING event_emitter.js → PostgreSQL

### ENTRYPOINT

**File:** C:\Users\nolan\PING\gateway\server.js  
**Function:** POST /api/v1/chat endpoint  
**Line 212:** app.post('/api/v1/chat', async (req, res)  
**Line 214:** const { messages = [] } = req.body

### TRANSFORMATION

**Step 1:** Emit INFERENCE_REQUEST event
- **File:** C:\Users\nolan\PING\gateway\server.js
- **Line 140-142:** `emitInferenceRequest(model, messages).catch(err => { console.error('Failed to emit INFERENCE_REQUEST event:', err); })`
- **Function:** PING's emitInferenceRequest (imported from ./event_emitter)
- **Stream:** gateway
- **Event Type:** INFERENCE_REQUEST
- **Payload:** model, message_count, request_hash, prompt_preview, timestamp

**Step 2:** Call Ollama API
- **File:** C:\Users\nolan\PING\gateway\server.js
- **Line 145-152:** fetch(OLLAMA_URL + '/api/chat', ...)
- **Transformation:** Send request to Ollama → Receive response

**Step 3:** Emit INFERENCE_RESPONSE event
- **File:** C:\Users\nolan\PING\gateway\server.js
- **Line 173-175:** `emitInferenceResponse(result.model, result.content, latency_ms).catch(err => { console.error('Failed to emit INFERENCE_RESPONSE event:', err); })`
- **Function:** PING's emitInferenceResponse (imported from ./event_emitter)
- **Stream:** gateway
- **Event Type:** INFERENCE_RESPONSE
- **Payload:** model, response_length, response_hash, response_preview, duration_ms, tokens_estimate, task, timestamp

**Step 4:** Emit INFERENCE_FAILED event (on error)
- **File:** C:\Users\nolan\PING\gateway\server.js
- **Line 190-192:** `emitInferenceFailed(model, error.message, 'ollama').catch(err => { console.error('Failed to emit INFERENCE_FAILED event:', err); })`
- **Function:** PING's emitInferenceFailed (imported from ./event_emitter)
- **Stream:** gateway
- **Event Type:** INFERENCE_FAILED
- **Payload:** model, error, source, timestamp

### STORAGE

**File:** C:\Users\nolan\PING\gateway\event_emitter.js  
**Function:** emitEvent(stream, eventType, payload)  
**Lines 56-100:** PostgreSQL insertion  
**Database:** PostgreSQL (POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD)  
**Table:** events (id, stream, event_type, payload, created_at)  
**Query:** `INSERT INTO events (stream, event_type, payload, created_at) VALUES ($1, $2, $3, $4)`

### READERS

**File:** C:\Users\nolan\PING\gateway\server.js  
**Function:** GET /events endpoint  
**Lines 264-290:** Query events from PostgreSQL  
**Query:** `SELECT id, stream, event_type, payload, created_at FROM events ORDER BY created_at DESC LIMIT $1 OFFSET $2`

**File:** C:\Users\nolan\PING\gateway\server.js  
**Function:** GET /events/:stream endpoint  
**Lines 293-322:** Query events by stream from PostgreSQL  
**Query:** `SELECT id, stream, event_type, payload, created_at FROM events WHERE stream = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`

**File:** C:\Users\nolan\PING\database\operational_intelligence.sql  
**Function:** get_model_performance()  
**Lines 90-110:** Query model performance from PostgreSQL  
**Query:** `SELECT payload->>'model' as model, COUNT(*) as call_count, AVG((payload->>'duration_ms')::INTEGER) as avg_duration_ms FROM events WHERE event_type = 'INFERENCE_RESPONSE' GROUP BY payload->>'model'`

### DERIVED STATE

**None.** PING Gateway does not store derived state. It only emits events to PostgreSQL.

### EVENT PRESERVED?

**YES.** Events are inserted into PostgreSQL events table with append-only guarantees (triggers prevent updates and deletes).

### CAN REPLAY RECONSTRUCT?

**NO.** PING Gateway does not have a replay mechanism. Events are emitted but there is no replay engine to reconstruct state from events.

---

## SUMMARY

### Event Flow Inventory

| Flow | Entrypoint | Transformation | Storage | Readers | Derived State | Event Preserved? | Can Replay Reconstruct? |
|------|------------|----------------|---------|--------|---------------|------------------|------------------------|
| crx-digestion-worker | worker.py → run_cycle() | RSS fetch → Summarize → Save → Archive | PostgreSQL (events table via Brain event_emitter.py) | PING Gateway (GET /events) | SQLite (articles table), Markdown (knowledge/) | YES | NO |
| crx-newsletter-brain | worker.py → run_ingestion_cycle() | Yahoo fetch → Analyze → Save → Archive | PostgreSQL (events table via Brain event_emitter.py) | PING Gateway (GET /events) | SQLite (newsletters, digests tables), Markdown (knowledge/, digests/) | YES | NO |
| PING Gateway | server.js → POST /api/v1/chat | Ollama inference | PostgreSQL (events table via PING event_emitter.js) | PING Gateway (GET /events) | None | YES | NO |

### Critical Findings

1. **Events are preserved but not replayable.** All three event flows insert events into PostgreSQL with append-only guarantees, but there is no replay mechanism to reconstruct state from events.

2. **Applications use Brain's event_emitter.py, not PING's.** crx-digestion-worker and crx-newsletter-brain use Brain's event_emitter.py to emit events. PING Gateway uses PING's event_emitter.js.

3. **Derived state is authoritative, not events.** Applications save data to SQLite and markdown files. SQLite and markdown are the authoritative sources, not the event log. If the event log is lost, applications can still function from SQLite and markdown.

4. **No replay engine exists.** PING defines replay authority (deterministic_replay_engine.ts, replay_state_machine.ts, replay_verification.ts) but it is not used by any application. It's constitutional theater.

5. **Event log is append-only but not constitutional.** The events table has triggers to prevent updates and deletes, but it's not used for replay. It's used for operational intelligence (dashboard queries, worker monitoring, model performance, failure tracking).

### Answer

**Is event preserved?**
**YES.** Events are inserted into PostgreSQL events table with append-only guarantees (triggers prevent updates and deletes).

**Can replay reconstruct?**
**NO.** There is no replay mechanism to reconstruct state from events. Applications use SQLite and markdown as authoritative sources, not the event log. PING defines replay authority but it's not used by any application.
