# PHASE 1: RUNTIME DEPENDENCY GRAPH

**Audit Type:** OWNERSHIP PROOF + EXECUTION REALITY  
**Scope:** Build actual dependency graph (imports, requires, docker mounts, env refs, compose refs, startup refs, CLI refs, HTTP refs)  
**Evidence Only:** Running code only, not documentation  

---

## CRITICAL FINDING

**Applications import from Brain, NOT from PING.**

This contradicts the previous constitutional ownership claim that PING owns constitutional authority.

---

## IMPORT DEPENDENCIES

### crx-digestion-worker → Brain

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\worker.py  
**Line 10-11:** `sys.path.append('C:/Users/nolan/CascadeProjects/brain')`  
**Line 11:** `from src.constitutional import emit_event`  
**TYPE:** IMPORT  
**CLASSIFICATION:** HARD  
**FROM:** crx-digestion-worker  
**TO:** Brain (src.constitutional.event_emitter)  

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\database.py  
**Line 6:** `sys.path.append('C:/Users/nolan/CascadeProjects/brain')`  
**Line 7:** `from src.constitutional import emit_article_created, emit_article_processing_failed, emit_database_write_failed`  
**TYPE:** IMPORT  
**CLASSIFICATION:** HARD  
**FROM:** crx-digestion-worker  
**TO:** Brain (src.constitutional.event_emitter)  

### crx-newsletter-brain → Brain

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\worker.py  
**Line 10-11:** `sys.path.append('C:/Users/nolan/CascadeProjects/brain')`  
**Line 11:** `from src.constitutional import emit_event`  
**TYPE:** IMPORT  
**CLASSIFICATION:** HARD  
**FROM:** crx-newsletter-brain  
**TO:** Brain (src.constitutional.event_emitter)  

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py  
**Line 6:** `sys.path.append('C:/Users/nolan/CascadeProjects/brain')`  
**Line 7:** `from src.constitutional import emit_newsletter_created, emit_digest_generated, emit_newsletter_processing_failed, emit_database_write_failed`  
**TYPE:** IMPORT  
**CLASSIFICATION:** HARD  
**FROM:** crx-newsletter-brain  
**TO:** Brain (src.constitutional.event_emitter)  

### PING Gateway → PING Event Emitter

**File:** C:\Users\nolan\PING\gateway\server.js  
**Line 3:** `const { emitInferenceRequest, emitInferenceResponse, emitInferenceFailed } = require('./event_emitter');`  
**TYPE:** IMPORT  
**CLASSIFICATION:** HARD  
**FROM:** PING Gateway  
**TO:** PING (gateway/event_emitter.js)  

---

## DOCKER COMPOSE DEPENDENCIES

### crx-digestion-worker docker-compose.yml

**Services:**
1. **open-webui** (port 3001)
   - Depends on: OLLAMA_BASE_URL=http://host.docker.internal:11434
   - Type: HTTP REF
   - Classification: OPTIONAL (not used by worker)

2. **worker** (digestion-worker)
   - Depends on: open-webui (docker-compose dependency)
   - Type: STARTUP REF
   - Classification: SOFT (worker doesn't actually use open-webui)
   - Volumes: ./knowledge:/app/knowledge, ./knowledge.db:/app/knowledge.db
   - Type: STORAGE MOUNT
   - Classification: HARD (SQLite database)

### crx-newsletter-brain docker-compose.yml

**Services:**
1. **worker** (newsletter-brain-worker)
   - Depends on: None (no docker-compose dependencies)
   - Type: STARTUP REF
   - Classification: NONE
   - Volumes: ./newsletters.db:/app/newsletters.db, ./knowledge:/app/knowledge, ./digests:/app/digests
   - Type: STORAGE MOUNT
   - Classification: HARD (SQLite database)

2. **dashboard** (newsletter-brain-dashboard)
   - Depends on: worker (docker-compose dependency)
   - Type: STARTUP REF
   - Classification: SOFT (dashboard can run without worker)
   - Volumes: ./newsletters.db:/app/newsletters.db
   - Type: STORAGE MOUNT
   - Classification: HARD (SQLite database)

### Brain docker-compose.yml

**Services:**
1. **postgres** (brain-postgres)
   - Depends on: None
   - Type: STARTUP REF
   - Classification: NONE
   - Volumes: postgres_data:/var/lib/postgresql/data, ../canonical_state/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
   - Type: STORAGE MOUNT
   - Classification: HARD (PostgreSQL database)

2. **qdrant** (brain-qdrant)
   - Depends on: None
   - Type: STARTUP REF
   - Classification: NONE
   - Volumes: qdrant_data:/qdrant/storage
   - Type: STORAGE MOUNT
   - Classification: HARD (Vector database)

3. **neo4j** (brain-neo4j)
   - Depends on: None
   - Type: STARTUP REF
   - Classification: NONE
   - Volumes: neo4j_data:/data, neo4j_logs:/logs
   - Type: STORAGE MOUNT
   - Classification: HARD (Graph database)

4. **temporal** (brain-temporal)
   - Depends on: postgres (health check)
   - Type: STARTUP REF
   - Classification: HARD (requires postgres)
   - Environment: DB=postgres, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
   - Type: ENV REF
   - Classification: HARD

5. **kafka** (brain-kafka)
   - Depends on: zookeeper
   - Type: STARTUP REF
   - Classification: HARD (requires zookeeper)
   - Volumes: kafka_data:/var/lib/kafka/data
   - Type: STORAGE MOUNT
   - Classification: HARD

6. **zookeeper** (brain-zookeeper)
   - Depends on: None
   - Type: STARTUP REF
   - Classification: NONE
   - Volumes: zookeeper_data:/var/lib/zookeeper/data, zookeeper_logs:/var/lib/zookeeper/log
   - Type: STORAGE MOUNT
   - Classification: HARD

7. **duckdb** (brain-duckdb)
   - Depends on: None
   - Type: STARTUP REF
   - Classification: NONE
   - Volumes: duckdb_data:/data, ../../data/analytics:/analytics
   - Type: STORAGE MOUNT
   - Classification: HARD

8. **opensearch** (brain-opensearch)
   - Depends on: None
   - Type: STARTUP REF
   - Classification: NONE
   - Volumes: opensearch_data:/usr/share/opensearch/data
   - Type: STORAGE MOUNT
   - Classification: HARD

9. **tika** (brain-tika)
   - Depends on: None
   - Type: STARTUP REF
   - Classification: NONE
   - Volumes: None
   - Type: STORAGE MOUNT
   - Classification: NONE

10. **ollama** (brain-ollama)
    - Depends on: None
    - Type: STARTUP REF
    - Classification: NONE
    - Volumes: ollama_data:/root/.ollama
    - Type: STORAGE MOUNT
    - Classification: HARD

11. **openwebui** (brain-openwebui)
    - Depends on: ollama
    - Type: STARTUP REF
    - Classification: HARD (requires ollama)
    - Environment: OLLAMA_BASE_URL=http://ollama:11434
    - Type: ENV REF
    - Classification: HARD

---

## ENVIRONMENT VARIABLE DEPENDENCIES

### Brain event_emitter.py

**File:** C:\Users\nolan\CascadeProjects\brain\src\constitutional\event_emitter.py  
**Lines 24-28:** POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD  
**TYPE:** ENV REF  
**CLASSIFICATION:** HARD (required for PostgreSQL connection)  
**DEFAULT VALUES:** localhost, 5432, crx_runtime, postgres, ''  
**TARGET:** PostgreSQL database (events table)

### PING event_emitter.js

**File:** C:\Users\nolan\PING\gateway\event_emitter.js  
**Lines 13-17:** POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD  
**TYPE:** ENV REF  
**CLASSIFICATION:** HARD (required for PostgreSQL connection)  
**DEFAULT VALUES:** localhost, 5432, crx_runtime, postgres, ''  
**TARGET:** PostgreSQL database (events table)

### PING gateway server.js

**File:** C:\Users\nolan\PING\gateway\server.js  
**Lines 8-12:** POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD  
**TYPE:** ENV REF  
**CLASSIFICATION:** HARD (required for PostgreSQL connection)  
**DEFAULT VALUES:** localhost, 5432, crx_runtime, postgres, ''  
**TARGET:** PostgreSQL database (events table)

**Lines 40-43:** OLLAMA_URL, OLLAMA_MODEL  
**TYPE:** ENV REF  
**CLASSIFICATION:** HARD (required for Ollama inference)  
**DEFAULT VALUES:** http://crx-ollama:11434, qwen2.5-coder:14b  
**TARGET:** Ollama service

### crx-digestion-worker summarizer.py

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\summarizer.py  
**Lines 7-8:** OLLAMA_MODEL, OLLAMA_BASE_URL  
**TYPE:** ENV REF  
**CLASSIFICATION:** HARD (required for Ollama inference)  
**DEFAULT VALUES:** qwen2.5-coder:7b, http://localhost:11434  
**TARGET:** Ollama service

### crx-newsletter-brain summarizer.py

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\summarizer.py  
**Lines 8-9:** OLLAMA_MODEL, OLLAMA_BASE_URL  
**TYPE:** ENV REF  
**CLASSIFICATION:** HARD (required for Ollama inference)  
**DEFAULT VALUES:** qwen2.5-coder:7b, http://localhost:11434  
**TARGET:** Ollama service

---

## HTTP REF DEPENDENCIES

### crx-digestion-worker

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\docker-compose.yml  
**Line 12:** OLLAMA_BASE_URL=http://host.docker.internal:11434 (open-webui service)  
**TYPE:** HTTP REF  
**CLASSIFICATION:** OPTIONAL (not used by worker)

### PING Gateway

**File:** C:\Users\nolan\PING\gateway\server.js  
**Line 40:** OLLAMA_URL=http://crx-ollama:11434  
**TYPE:** HTTP REF  
**CLASSIFICATION:** HARD (required for inference)  
**TARGET:** crx-ollama-worker container

**Line 126:** endpoint = `${OLLAMA_URL}/api/chat`  
**TYPE:** HTTP REF  
**CLASSIFICATION:** HARD (required for inference)  
**TARGET:** Ollama API

---

## STORAGE MOUNT DEPENDENCIES

### crx-digestion-worker

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\docker-compose.yml  
**Lines 21-22:** ./knowledge:/app/knowledge, ./knowledge.db:/app/knowledge.db  
**TYPE:** STORAGE MOUNT  
**CLASSIFICATION:** HARD (SQLite database and markdown archives)  
**TARGET:** File system (application state)

### crx-newsletter-brain

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\docker-compose.yml  
**Lines 8-10:** ./newsletters.db:/app/newsletters.db, ./knowledge:/app/knowledge, ./digests:/app/digests  
**TYPE:** STORAGE MOUNT  
**CLASSIFICATION:** HARD (SQLite database and markdown archives)  
**TARGET:** File system (application state)

### Brain

**File:** C:\Users\nolan\CascadeProjects\brain\infrastructure\docker\compose\docker-compose.yml  
**Lines 14:** postgres_data:/var/lib/postgresql/data  
**TYPE:** STORAGE MOUNT  
**CLASSIFICATION:** HARD (PostgreSQL data)  
**TARGET:** PostgreSQL database

**Line 15:** ../canonical_state/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql  
**TYPE:** STORAGE MOUNT  
**CLASSIFICATION:** HARD (schema initialization)  
**TARGET:** PostgreSQL database

**Lines 32, 54, 101, 120, 136, 152, 184:** Various volume mounts for qdrant, neo4j, kafka, zookeeper, duckdb, opensearch, ollama  
**TYPE:** STORAGE MOUNT  
**CLASSIFICATION:** HARD (database data)  
**TARGET:** Various databases

---

## DEPENDENCY GRAPH SUMMARY

### HARD DEPENDENCIES (Required for runtime)

1. **crx-digestion-worker → Brain (event_emitter.py)** - IMPORT (HARD)
2. **crx-newsletter-brain → Brain (event_emitter.py)** - IMPORT (HARD)
3. **PING Gateway → PING (event_emitter.js)** - IMPORT (HARD)
4. **Brain event_emitter.py → PostgreSQL** - ENV REF (HARD)
5. **PING event_emitter.js → PostgreSQL** - ENV REF (HARD)
6. **PING Gateway → PostgreSQL** - ENV REF (HARD)
7. **PING Gateway → crx-ollama-worker** - HTTP REF (HARD)
8. **crx-digestion-worker → SQLite (knowledge.db)** - STORAGE MOUNT (HARD)
9. **crx-newsletter-brain → SQLite (newsletters.db)** - STORAGE MOUNT (HARD)
10. **Brain postgres → PostgreSQL data** - STORAGE MOUNT (HARD)
11. **Brain temporal → Brain postgres** - STARTUP REF (HARD)
12. **Brain kafka → Brain zookeeper** - STARTUP REF (HARD)
13. **Brain openwebui → Brain ollama** - STARTUP REF (HARD)

### SOFT DEPENDENCIES (Optional or not blocking)

1. **crx-digestion-worker → open-webui** - STARTUP REF (SOFT - worker doesn't use it)
2. **crx-newsletter-brain dashboard → crx-newsletter-brain worker** - STARTUP REF (SOFT - dashboard can run without worker)

### OPTIONAL DEPENDENCIES (Not used)

1. **crx-digestion-worker open-webui → OLLAMA_BASE_URL** - HTTP REF (OPTIONAL - not used by worker)

### DEAD DEPENDENCIES (Defined but not used)

1. **Brain qdrant** - No applications use it
2. **Brain neo4j** - No applications use it
3. **Brain temporal** - No applications use it
4. **Brain kafka** - No applications use it
5. **Brain zookeeper** - No applications use it (only kafka uses it)
6. **Brain duckdb** - No applications use it
7. **Brain opensearch** - No applications use it
8. **Brain tika** - No applications use it
9. **Brain ollama** - No applications use it (openwebui uses it, but openwebui is obsolete)
10. **Brain openwebui** - Obsolete, duplicates crx-ui-next

---

## ANSWERS TO CRITICAL QUESTIONS

### Can Brain run without PING?

**YES.** Brain has no dependencies on PING. Brain's event_emitter.py connects to PostgreSQL directly, not to PING.

### Can PING run without Brain?

**YES.** PING has no dependencies on Brain. PING's event_emitter.js connects to PostgreSQL directly, not to Brain.

### Can applications run without both?

**NO.** Applications (crx-digestion-worker, crx-newsletter-brain) import from Brain's event_emitter.py. Applications CANNOT run without Brain.

### Which repo actually owns execution?

**Brain owns application execution.** Applications import from Brain, not from PING. Brain's event_emitter.py is the actual runtime event authority for applications.

**PING owns gateway execution.** PING's event_emitter.js is the runtime event authority for the gateway only.

**CONSTITUTIONAL OWNERSHIP CLAIM IS FALSE.** PING does NOT own constitutional authority for applications. Brain owns constitutional authority for applications.
