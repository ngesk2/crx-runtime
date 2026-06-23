# RUNTIME DEPENDENCY GRAPH

**Audit Date:** 2025-01-18  
**Audit Mode:** ZERO ASSUMPTION - READ ONLY  
**Audit Principle:** Trace actual runtime dependencies from docker compose services, worker entrypoints, and application startup files.

---

## EXECUTIVE SUMMARY

**Runtime dependency graph is fragmented.** crx-newsletter-brain and crx-digestion-worker are independent applications with no shared dependencies except Brain/event_emitter.py and Brain infrastructure (PostgreSQL, Ollama). PING primitives are not in the runtime dependency graph. Brain infrastructure services (Qdrant, Neo4j, Temporal, Kafka, Zookeeper, DuckDB, OpenSearch, Tika, OpenWebUI) are disconnected from applications.

---

## APPLICATION: crx-newsletter-brain

### Startup Path
**docker-compose.yml → worker service → worker.py**

**Entry Point:** worker.py → main()

**Executed By:** docker-compose up worker

---

### Dependency Graph

```
crx-newsletter-brain/worker.py
├── crx-newsletter-brain/database.py (LOCAL IMPORT)
│   ├── sqlite3 (STANDARD LIBRARY)
│   └── Brain/src/constitutional/event_emitter.py (REMOTE IMPORT)
│       └── PostgreSQL (DATABASE)
├── crx-newsletter-brain/yahoo_client.py (LOCAL IMPORT)
│   └── Yahoo Mail (EXTERNAL SERVICE)
├── crx-newsletter-brain/summarizer.py (LOCAL IMPORT)
│   └── Ollama (EXTERNAL SERVICE - via Brain infrastructure)
├── crx-newsletter-brain/archive.py (LOCAL IMPORT)
│   └── Markdown files (FILE SYSTEM)
└── crx-newsletter-brain/digest_generator.py (LOCAL IMPORT)
    └── Markdown files (FILE SYSTEM)
```

---

### Imported By

- docker-compose.yml (worker service)
- docker-compose.yml (dashboard service - imports database.py)

---

### Executed By

- docker-compose up worker (ACTIVE)
- docker-compose up dashboard (ACTIVE)

---

### Startup Path

1. docker-compose.yml starts worker container
2. worker.py main() is executed
3. init_database() is called
4. YahooMailClient.test_connection() is called
5. run_ingestion_cycle() is called
6. run_processing_cycle() is called
7. run_digest_generation() is called
8. Perpetual loop begins

---

### Consumer Count

- worker.py (1 consumer)
- dashboard.py (1 consumer)

---

### Storage Dependencies

- SQLite (newsletters.db) - AUTHORITY
- PostgreSQL (events table) - EVENT LOG
- Markdown files (knowledge/YYYY/MM/*.md) - ARCHIVE
- Markdown files (digests/daily-{date}.md, digests/weekly-{date}.md) - ARCHIVE

---

### External Service Dependencies

- Yahoo Mail (EXTERNAL SERVICE) - DATA SOURCE
- Ollama (EXTERNAL SERVICE) - AI MODEL SERVER

---

### Disconnected Subsystems

- PING replay engine (NOT IMPORTED)
- PING witness system (NOT IMPORTED)
- PING canonical state (NOT IMPORTED)
- PING identity engine (NOT IMPORTED)
- PING commit-service (NOT IMPORTED)
- PING gateway (NOT IMPORTED)
- Brain Qdrant (NOT IMPORTED)
- Brain Neo4j (NOT IMPORTED)
- Brain Temporal (NOT IMPORTED)
- Brain Kafka (NOT IMPORTED)
- Brain Zookeeper (NOT IMPORTED)
- Brain DuckDB (NOT IMPORTED)
- Brain OpenSearch (NOT IMPORTED)
- Brain Tika (NOT IMPORTED)
- Brain OpenWebUI (NOT IMPORTED)

---

## APPLICATION: crx-digestion-worker

### Startup Path
**docker-compose.yml → worker service → worker.py**

**Entry Point:** worker.py → main()

**Executed By:** docker-compose up worker

---

### Dependency Graph

```
crx-digestion-worker/worker.py
├── crx-digestion-worker/database.py (LOCAL IMPORT)
│   ├── sqlite3 (STANDARD LIBRARY)
│   └── Brain/src/constitutional/event_emitter.py (REMOTE IMPORT)
│       └── PostgreSQL (DATABASE)
├── crx-digestion-worker/tools.py (LOCAL IMPORT)
│   └── RSS feeds (EXTERNAL SERVICE)
├── crx-digestion-worker/summarizer.py (LOCAL IMPORT)
│   └── Ollama (EXTERNAL SERVICE - via Brain infrastructure)
└── crx-digestion-worker/archive.py (LOCAL IMPORT)
    └── Markdown files (FILE SYSTEM)
```

---

### Imported By

- docker-compose.yml (worker service)

---

### Executed By

- docker-compose up worker (ACTIVE)

---

### Startup Path

1. docker-compose.yml starts worker container
2. worker.py main() is executed
3. init_database() is called
4. initialize_sources() is called
5. run_cycle() is called
6. Perpetual loop begins

---

### Consumer Count

- worker.py (1 consumer)

---

### Storage Dependencies

- SQLite (knowledge.db) - AUTHORITY
- PostgreSQL (events table) - EVENT LOG
- Markdown files (knowledge/YYYY/MM/*.md) - ARCHIVE

---

### External Service Dependencies

- RSS feeds (EXTERNAL SERVICE) - DATA SOURCE
- Ollama (EXTERNAL SERVICE) - AI MODEL SERVER

---

### Disconnected Subsystems

- PING replay engine (NOT IMPORTED)
- PING witness system (NOT IMPORTED)
- PING canonical state (NOT IMPORTED)
- PING identity engine (NOT IMPORTED)
- PING commit-service (NOT IMPORTED)
- PING gateway (NOT IMPORTED)
- Brain Qdrant (NOT IMPORTED)
- Brain Neo4j (NOT IMPORTED)
- Brain Temporal (NOT IMPORTED)
- Brain Kafka (NOT IMPORTED)
- Brain Zookeeper (NOT IMPORTED)
- Brain DuckDB (NOT IMPORTED)
- Brain OpenSearch (NOT IMPORTED)
- Brain Tika (NOT IMPORTED)
- Brain OpenWebUI (NOT IMPORTED)

---

## MODULE: Brain/event_emitter.py

### Startup Path
**Brain/src/constitutional/event_emitter.py**

**Entry Point:** emit_event() function

**Executed By:** crx-newsletter-brain/worker.py, crx-newsletter-brain/database.py, crx-digestion-worker/worker.py, crx-digestion-worker/database.py

---

### Dependency Graph

```
Brain/src/constitutional/event_emitter.py
├── psycopg2 (EXTERNAL LIBRARY)
└── PostgreSQL (DATABASE)
```

---

### Imported By

- crx-newsletter-brain/database.py (LOCAL IMPORT via sys.path.append)
- crx-newsletter-brain/worker.py (LOCAL IMPORT via sys.path.append)
- crx-digestion-worker/database.py (LOCAL IMPORT via sys.path.append)
- crx-digestion-worker/worker.py (LOCAL IMPORT via sys.path.append)

---

### Executed By

- crx-newsletter-brain worker (ACTIVE)
- crx-digestion-worker worker (ACTIVE)

---

### Startup Path

1. Application imports Brain/src/constitutional/event_emitter.py
2. Application calls emit_event() or emit_*() functions
3. event_emitter.py connects to PostgreSQL
4. event_emitter.py inserts event into events table

---

### Consumer Count

- crx-newsletter-brain/database.py (1 consumer)
- crx-newsletter-brain/worker.py (1 consumer)
- crx-digestion-worker/database.py (1 consumer)
- crx-digestion-worker/worker.py (1 consumer)
- Total: 4 consumers

---

### Storage Dependencies

- PostgreSQL (events table) - EVENT LOG

---

### External Service Dependencies

- NONE

---

### Disconnected Subsystems

- PING replay engine (NOT IMPORTED)
- PING witness system (NOT IMPORTED)
- PING canonical state (NOT IMPORTED)
- PING identity engine (NOT IMPORTED)
- PING commit-service (NOT IMPORTED)
- PING gateway (NOT IMPORTED)

---

## STORAGE: SQLite (newsletters.db)

### Startup Path
**crx-newsletter-brain/database.py → init_database()**

**Entry Point:** init_database() function

**Executed By:** crx-newsletter-brain/worker.py, crx-newsletter-brain/dashboard.py

---

### Dependency Graph

```
SQLite (newsletters.db)
└── crx-newsletter-brain/database.py (LOCAL MODULE)
    ├── crx-newsletter-brain/worker.py (LOCAL IMPORT)
    └── crx-newsletter-brain/dashboard.py (LOCAL IMPORT)
```

---

### Imported By

- crx-newsletter-brain/database.py (sqlite3 import)
- crx-newsletter-brain/worker.py (imports database.py)
- crx-newsletter-brain/dashboard.py (imports database.py)

---

### Executed By

- crx-newsletter-brain worker (ACTIVE)
- crx-newsletter-brain dashboard (ACTIVE)

---

### Startup Path

1. worker.py main() calls init_database()
2. init_database() connects to SQLite
3. init_database() creates tables if they don't exist
4. init_database() creates indexes if they don't exist

---

### Consumer Count

- crx-newsletter-brain/database.py (1 consumer)
- crx-newsletter-brain/worker.py (1 consumer)
- crx-newsletter-brain/dashboard.py (1 consumer)
- Total: 3 consumers

---

### Storage Dependencies

- NONE (SQLite is a file-based database)

---

### External Service Dependencies

- NONE

---

### Disconnected Subsystems

- PING replay engine (NOT IMPORTED)
- PING witness system (NOT IMPORTED)
- PING canonical state (NOT IMPORTED)
- PING identity engine (NOT IMPORTED)
- PING commit-service (NOT IMPORTED)
- PING gateway (NOT IMPORTED)
- Brain infrastructure (NOT IMPORTED)

---

## STORAGE: SQLite (knowledge.db)

### Startup Path
**crx-digestion-worker/database.py → init_database()**

**Entry Point:** init_database() function

**Executed By:** crx-digestion-worker/worker.py

---

### Dependency Graph

```
SQLite (knowledge.db)
└── crx-digestion-worker/database.py (LOCAL MODULE)
    └── crx-digestion-worker/worker.py (LOCAL IMPORT)
```

---

### Imported By

- crx-digestion-worker/database.py (sqlite3 import)
- crx-digestion-worker/worker.py (imports database.py)

---

### Executed By

- crx-digestion-worker worker (ACTIVE)

---

### Startup Path

1. worker.py main() calls init_database()
2. init_database() connects to SQLite
3. init_database() creates tables if they don't exist
4. init_database() creates indexes if they don't exist

---

### Consumer Count

- crx-digestion-worker/database.py (1 consumer)
- crx-digestion-worker/worker.py (1 consumer)
- Total: 2 consumers

---

### Storage Dependencies

- NONE (SQLite is a file-based database)

---

### External Service Dependencies

- NONE

---

### Disconnected Subsystems

- PING replay engine (NOT IMPORTED)
- PING witness system (NOT IMPORTED)
- PING canonical state (NOT IMPORTED)
- PING identity engine (NOT IMPORTED)
- PING commit-service (NOT IMPORTED)
- PING gateway (NOT IMPORTED)
- Brain infrastructure (NOT IMPORTED)

---

## STORAGE: PostgreSQL (events table)

### Startup Path
**Brain/src/constitutional/event_emitter.py → emit_event()**

**Entry Point:** emit_event() function

**Executed By:** crx-newsletter-brain/worker.py, crx-newsletter-brain/database.py, crx-digestion-worker/worker.py, crx-digestion-worker/database.py

---

### Dependency Graph

```
PostgreSQL (events table)
└── Brain/src/constitutional/event_emitter.py (REMOTE MODULE)
    ├── crx-newsletter-brain/database.py (REMOTE IMPORT)
    ├── crx-newsletter-brain/worker.py (REMOTE IMPORT)
    ├── crx-digestion-worker/database.py (REMOTE IMPORT)
    └── crx-digestion-worker/worker.py (REMOTE IMPORT)
```

---

### Imported By

- Brain/src/constitutional/event_emitter.py (psycopg2 import)
- crx-newsletter-brain/database.py (imports event_emitter.py)
- crx-newsletter-brain/worker.py (imports event_emitter.py)
- crx-digestion-worker/database.py (imports event_emitter.py)
- crx-digestion-worker/worker.py (imports event_emitter.py)

---

### Executed By

- crx-newsletter-brain worker (ACTIVE)
- crx-digestion-worker worker (ACTIVE)

---

### Startup Path

1. Application calls emit_event() or emit_*() function
2. event_emitter.py connects to PostgreSQL
3. event_emitter.py inserts event into events table

---

### Consumer Count

- Brain/src/constitutional/event_emitter.py (1 consumer)
- crx-newsletter-brain/database.py (1 consumer)
- crx-newsletter-brain/worker.py (1 consumer)
- crx-digestion-worker/database.py (1 consumer)
- crx-digestion-worker/worker.py (1 consumer)
- Total: 5 consumers

---

### Storage Dependencies

- NONE (PostgreSQL is a database server)

---

### External Service Dependencies

- NONE

---

### Disconnected Subsystems

- PING replay engine (NOT IMPORTED)
- PING witness system (NOT IMPORTED)
- PING canonical state (NOT IMPORTED)
- PING identity engine (NOT IMPORTED)
- PING commit-service (NOT IMPORTED)
- PING gateway (NOT IMPORTED)

---

## EXTERNAL SERVICE: Yahoo Mail

### Startup Path
**crx-newsletter-brain/yahoo_client.py → YahooMailClient.connect()**

**Entry Point:** YahooMailClient class

**Executed By:** crx-newsletter-brain/worker.py

---

### Dependency Graph

```
Yahoo Mail (EXTERNAL SERVICE)
└── crx-newsletter-brain/yahoo_client.py (LOCAL MODULE)
    └── crx-newsletter-brain/worker.py (LOCAL IMPORT)
```

---

### Imported By

- crx-newsletter-brain/yahoo_client.py (external API calls)
- crx-newsletter-brain/worker.py (imports yahoo_client.py)

---

### Executed By

- crx-newsletter-brain worker (ACTIVE)

---

### Startup Path

1. worker.py run_ingestion_cycle() creates YahooMailClient
2. YahooMailClient.connect() connects to Yahoo Mail
3. YahooMailClient.fetch_unread_newsletters() fetches newsletters

---

### Consumer Count

- crx-newsletter-brain/yahoo_client.py (1 consumer)
- crx-newsletter-brain/worker.py (1 consumer)
- Total: 2 consumers

---

### Storage Dependencies

- NONE (Yahoo Mail is an external service)

---

### External Service Dependencies

- NONE (Yahoo Mail is an external service)

---

### Disconnected Subsystems

- PING replay engine (NOT IMPORTED)
- PING witness system (NOT IMPORTED)
- PING canonical state (NOT IMPORTED)
- PING identity engine (NOT IMPORTED)
- PING commit-service (NOT IMPORTED)
- PING gateway (NOT IMPORTED)
- Brain infrastructure (NOT IMPORTED)

---

## EXTERNAL SERVICE: RSS Feeds

### Startup Path
**crx-digestion-worker/tools.py → fetch_rss()**

**Entry Point:** fetch_rss() function

**Executed By:** crx-digestion-worker/worker.py

---

### Dependency Graph

```
RSS Feeds (EXTERNAL SERVICE)
└── crx-digestion-worker/tools.py (LOCAL MODULE)
    └── crx-digestion-worker/worker.py (LOCAL IMPORT)
```

---

### Imported By

- crx-digestion-worker/tools.py (HTTP requests)
- crx-digestion-worker/worker.py (imports tools.py)

---

### Executed By

- crx-digestion-worker worker (ACTIVE)

---

### Startup Path

1. worker.py run_cycle() calls process_source()
2. process_source() calls fetch_rss()
3. fetch_rss() fetches RSS feed

---

### Consumer Count

- crx-digestion-worker/tools.py (1 consumer)
- crx-digestion-worker/worker.py (1 consumer)
- Total: 2 consumers

---

### Storage Dependencies

- NONE (RSS feeds are external services)

---

### External Service Dependencies

- NONE (RSS feeds are external services)

---

### Disconnected Subsystems

- PING replay engine (NOT IMPORTED)
- PING witness system (NOT IMPORTED)
- PING canonical state (NOT IMPORTED)
- PING identity engine (NOT IMPORTED)
- PING commit-service (NOT IMPORTED)
- PING gateway (NOT IMPORTED)
- Brain infrastructure (NOT IMPORTED)

---

## EXTERNAL SERVICE: Ollama

### Startup Path
**crx-newsletter-brain/summarizer.py → analyze_newsletter()**

**Entry Point:** analyze_newsletter() function

**Executed By:** crx-newsletter-brain/worker.py, crx-digestion-worker/worker.py

---

### Dependency Graph

```
Ollama (EXTERNAL SERVICE)
├── crx-newsletter-brain/summarizer.py (LOCAL MODULE)
│   └── crx-newsletter-brain/worker.py (LOCAL IMPORT)
└── crx-digestion-worker/summarizer.py (LOCAL MODULE)
    └── crx-digestion-worker/worker.py (LOCAL IMPORT)
```

---

### Imported By

- crx-newsletter-brain/summarizer.py (HTTP requests)
- crx-newsletter-brain/worker.py (imports summarizer.py)
- crx-digestion-worker/summarizer.py (HTTP requests)
- crx-digestion-worker/worker.py (imports summarizer.py)

---

### Executed By

- crx-newsletter-brain worker (ACTIVE)
- crx-digestion-worker worker (ACTIVE)

---

### Startup Path

1. worker.py calls summarizer function
2. summarizer calls Ollama API
3. Ollama processes request and returns response

---

### Consumer Count

- crx-newsletter-brain/summarizer.py (1 consumer)
- crx-newsletter-brain/worker.py (1 consumer)
- crx-digestion-worker/summarizer.py (1 consumer)
- crx-digestion-worker/worker.py (1 consumer)
- Total: 4 consumers

---

### Storage Dependencies

- NONE (Ollama is an external service)

---

### External Service Dependencies

- NONE (Ollama is an external service)

---

### Disconnected Subsystems

- PING replay engine (NOT IMPORTED)
- PING witness system (NOT IMPORTED)
- PING canonical state (NOT IMPORTED)
- PING identity engine (NOT IMPORTED)
- PING commit-service (NOT IMPORTED)
- PING gateway (NOT IMPORTED)
- Brain infrastructure (NOT IMPORTED)

---

## CRITICAL FINDINGS

1. **Runtime dependency graph is fragmented.** crx-newsletter-brain and crx-digestion-worker are independent applications with no shared dependencies except Brain/event_emitter.py and Brain infrastructure (PostgreSQL, Ollama).

2. **PING primitives are not in the runtime dependency graph.** PING replay engine, witness system, canonical state, identity engine, commit-service, and gateway are not imported by any application.

3. **Brain infrastructure services are disconnected.** Brain Qdrant, Neo4j, Temporal, Kafka, Zookeeper, DuckDB, OpenSearch, Tika, and OpenWebUI are not imported by any application. Only PostgreSQL and Ollama are used.

4. **SQLite is authoritative storage.** Applications use SQLite (newsletters.db, knowledge.db) as authoritative storage. PostgreSQL events table is used for event logging only.

5. **Brain/event_emitter.py is the only shared dependency.** Both applications import Brain/event_emitter.py for event emission. This is the only shared dependency between applications.

6. **No service coordination exists.** Services are started independently with no coordination. No service mesh exists. No service discovery exists.

7. **Dead imports exist.** PING primitives exist but are not imported. Brain infrastructure services exist but are not imported.

---

## ANSWER

**Disconnected Subsystems:**
- PING replay engine (NOT IMPORTED)
- PING witness system (NOT IMPORTED)
- PING canonical state (NOT IMPORTED)
- PING identity engine (NOT IMPORTED)
- PING commit-service (NOT IMPORTED)
- PING gateway (NOT IMPORTED)
- Brain Qdrant (NOT IMPORTED)
- Brain Neo4j (NOT IMPORTED)
- Brain Temporal (NOT IMPORTED)
- Brain Kafka (NOT IMPORTED)
- Brain Zookeeper (NOT IMPORTED)
- Brain DuckDB (NOT IMPORTED)
- Brain OpenSearch (NOT IMPORTED)
- Brain Tika (NOT IMPORTED)
- Brain OpenWebUI (NOT IMPORTED)

**Dead Imports:**
- PING replay engine (NO CONSUMERS)
- PING witness system (NO CONSUMERS)
- PING canonical state (NO CONSUMERS)
- PING identity engine (NO CONSUMERS)
- PING commit-service (NO CONSUMERS)
- PING gateway (NO CONSUMERS)
- Brain Qdrant (NO CONSUMERS)
- Brain Neo4j (NO CONSUMERS)
- Brain Temporal (NO CONSUMERS)
- Brain Kafka (NO CONSUMERS)
- Brain Zookeeper (NO CONSUMERS)
- Brain DuckDB (NO CONSUMERS)
- Brain OpenSearch (NO CONSUMERS)
- Brain Tika (NO CONSUMERS)
- Brain OpenWebUI (NO CONSUMERS)

**Unused Services:**
- Brain Qdrant (UNUSED)
- Brain Neo4j (UNUSED)
- Brain Temporal (UNUSED)
- Brain Kafka (UNUSED)
- Brain Zookeeper (UNUSED)
- Brain DuckDB (UNUSED)
- Brain OpenSearch (UNUSED)
- Brain Tika (UNUSED)
- Brain OpenWebUI (UNUSED)

**Orphaned Infrastructure:**
- Brain Qdrant (ORPHANED)
- Brain Neo4j (ORPHANED)
- Brain Temporal (ORPHANED)
- Brain Kafka (ORPHANED)
- Brain Zookeeper (ORPHANED)
- Brain DuckDB (ORPHANED)
- Brain OpenSearch (ORPHANED)
- Brain Tika (ORPHANED)
- Brain OpenWebUI (ORPHANED)
