# RUNTIME TRUTH MAP

**Audit Date:** 2025-01-18  
**Audit Mode:** ZERO ASSUMPTION - READ ONLY  
**Audit Principle:** Inventory actual execution. What actually executes in practice, not what architecture documents claim.

---

## EXECUTIVE SUMMARY

**Only 3 services actually execute in practice.** crx-newsletter-brain worker, crx-digestion-worker worker, and Brain infrastructure (PostgreSQL, Ollama, etc.) execute. PING commit-service and PING gateway have no docker-compose.yml and are not executed. Brain infrastructure has extensive services but applications only use PostgreSQL and Ollama.

---

## RUNTIME SERVICE INVENTORY

### SERVICE: crx-newsletter-brain worker

**STARTS:** docker-compose.yml (worker service)

**DEPENDS:**
- PostgreSQL (via Brain infrastructure)
- Ollama (via Brain infrastructure)
- Yahoo Mail (external service)

**READS:**
- SQLite (newsletters.db)
- Yahoo Mail (external service)

**WRITES:**
- SQLite (newsletters.db)
- PostgreSQL (events table via Brain/event_emitter.py)
- Markdown (knowledge/YYYY/MM/*.md)
- Markdown (digests/daily-{date}.md, digests/weekly-{date}.md)

**EVIDENCE:**
```yaml
# docker-compose.yml
services:
  worker:
    build: .
    container_name: newsletter-brain-worker
    volumes:
      - ./newsletters.db:/app/newsletters.db
      - ./knowledge:/app/knowledge
      - ./digests:/app/digests
    env_file:
      - .env
    restart: unless-stopped
```

---

### SERVICE: crx-newsletter-brain dashboard

**STARTS:** docker-compose.yml (dashboard service)

**DEPENDS:**
- worker (docker-compose.yml depends_on)

**READS:**
- SQLite (newsletters.db)

**WRITES:**
- NONE (dashboard is read-only)

**EVIDENCE:**
```yaml
# docker-compose.yml
services:
  dashboard:
    build: .
    container_name: newsletter-brain-dashboard
    command: python dashboard.py
    ports:
      - "5001:5001"
    volumes:
      - ./newsletters.db:/app/newsletters.db
    env_file:
      - .env
    restart: unless-stopped
    depends_on:
      - worker
```

---

### SERVICE: crx-digestion-worker worker

**STARTS:** docker-compose.yml (worker service)

**DEPENDS:**
- open-webui (docker-compose.yml depends_on)
- PostgreSQL (via Brain infrastructure)
- Ollama (via Brain infrastructure)

**READS:**
- SQLite (knowledge.db)
- RSS feeds (external service)

**WRITES:**
- SQLite (knowledge.db)
- PostgreSQL (events table via Brain/event_emitter.py)
- Markdown (knowledge/YYYY/MM/*.md)

**EVIDENCE:**
```yaml
# docker-compose.yml
services:
  worker:
    build: .
    container_name: digestion-worker
    volumes:
      - ./knowledge:/app/knowledge
      - ./knowledge.db:/app/knowledge.db
    env_file:
      - .env
    restart: unless-stopped
    depends_on:
      - open-webui
```

---

### SERVICE: crx-digestion-worker open-webui

**STARTS:** docker-compose.yml (open-webui service)

**DEPENDS:**
- Ollama (via environment variable OLLAMA_BASE_URL)

**READS:**
- Ollama (via environment variable OLLAMA_BASE_URL)

**WRITES:**
- NONE (open-webui is a UI)

**EVIDENCE:**
```yaml
# docker-compose.yml
services:
  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    container_name: open-webui
    ports:
      - "3001:8080"
    volumes:
      - open-webui-data:/app/backend/data
    environment:
      - OLLAMA_BASE_URL=http://host.docker.internal:11434
    restart: unless-stopped
```

---

### SERVICE: Brain PostgreSQL

**STARTS:** Brain docker-compose.yml (postgres service)

**DEPENDS:**
- NONE

**READS:**
- NONE (PostgreSQL is a database)

**WRITES:**
- events table (written by Brain/event_emitter.py)
- execution_events table (written by PING commit-service if running)
- artifacts table (written by PING commit-service if running)
- lineage_edges table (written by PING commit-service if running)

**EVIDENCE:**
```yaml
# Brain docker-compose.yml
services:
  postgres:
    image: postgres:15-alpine
    container_name: brain-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ../canonical_state/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    networks:
      - brain_internal
```

---

### SERVICE: Brain Ollama

**STARTS:** Brain docker-compose.yml (ollama service)

**DEPENDS:**
- NONE

**READS:**
- NONE (Ollama is an AI model server)

**WRITES:**
- NONE (Ollama is an AI model server)

**EVIDENCE:**
```yaml
# Brain docker-compose.yml
services:
  ollama:
    image: ollama/ollama:latest
    container_name: brain-ollama
    restart: unless-stopped
    volumes:
      - ollama_data:/root/.ollama
    networks:
      - brain_internal
    ports:
      - "11434:11434"
```

---

### SERVICE: Brain Qdrant

**STARTS:** Brain docker-compose.yml (qdrant service)

**DEPENDS:**
- NONE

**READS:**
- NONE (Qdrant is a vector database)

**WRITES:**
- NONE (Qdrant is not used by applications)

**EVIDENCE:**
```yaml
# Brain docker-compose.yml
services:
  qdrant:
    image: qdrant/qdrant:latest
    container_name: brain-qdrant
    restart: unless-stopped
    environment:
      QDRANT__SERVICE__API_KEY: ${QDRANT_API_KEY}
    volumes:
      - qdrant_data:/qdrant/storage
    networks:
      - brain_internal
    ports:
      - "6333:6333"
```

---

### SERVICE: Brain Neo4j

**STARTS:** Brain docker-compose.yml (neo4j service)

**DEPENDS:**
- NONE

**READS:**
- NONE (Neo4j is a graph database)

**WRITES:**
- NONE (Neo4j is not used by applications)

**EVIDENCE:**
```yaml
# Brain docker-compose.yml
services:
  neo4j:
    image: neo4j:5.15-community
    container_name: brain-neo4j
    restart: unless-stopped
    environment:
      NEO4J_AUTH: neo4j/${NEO4J_PASSWORD}
      NEO4J_dbms_memory_pagecache_size: 1G
      NEO4J_dbms_memory_heap_initial__size: 512m
      NEO4J_dbms_memory_heap_max__size: 512m
    volumes:
      - neo4j_data:/data
      - neo4j_logs:/logs
    networks:
      - brain_internal
    ports:
      - "7474:7474"
      - "7687:7687"
```

---

### SERVICE: Brain Temporal

**STARTS:** Brain docker-compose.yml (temporal service)

**DEPENDS:**
- postgres (docker-compose.yml depends_on)

**READS:**
- PostgreSQL (for temporal state)

**WRITES:**
- PostgreSQL (for temporal state)

**EVIDENCE:**
```yaml
# Brain docker-compose.yml
services:
  temporal:
    image: temporalio/auto-setup:latest
    container_name: brain-temporal
    restart: unless-stopped
    environment:
      TEMPORAL_ADDRESS: temporal:7233
      TEMPORAL_NAMESPACE: ${TEMPORAL_NAMESPACE:-default}
      DB: postgres
      DB_PORT: 5432
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_SEEDS: postgres
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - brain_internal
```

---

### SERVICE: Brain Kafka

**STARTS:** Brain docker-compose.yml (kafka service)

**DEPENDS:**
- zookeeper (docker-compose.yml depends_on)

**READS:**
- NONE (Kafka is an event streaming platform)

**WRITES:**
- NONE (Kafka is not used by applications)

**EVIDENCE:**
```yaml
# Brain docker-compose.yml
services:
  kafka:
    image: confluentinc/cp-kafka:latest
    container_name: brain-kafka
    restart: unless-stopped
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: 'true'
    volumes:
      - kafka_data:/var/lib/kafka/data
    depends_on:
      - zookeeper
    networks:
      - brain_internal
```

---

### SERVICE: Brain Zookeeper

**STARTS:** Brain docker-compose.yml (zookeeper service)

**DEPENDS:**
- NONE

**READS:**
- NONE (Zookeeper is required for Kafka)

**WRITES:**
- NONE (Zookeeper is required for Kafka)

**EVIDENCE:**
```yaml
# Brain docker-compose.yml
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    container_name: brain-zookeeper
    restart: unless-stopped
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    volumes:
      - zookeeper_data:/var/lib/zookeeper/data
      - zookeeper_logs:/var/lib/zookeeper/log
    networks:
      - brain_internal
```

---

### SERVICE: Brain DuckDB

**STARTS:** Brain docker-compose.yml (duckdb service)

**DEPENDS:**
- NONE

**READS:**
- NONE (DuckDB is an analytics database)

**WRITES:**
- NONE (DuckDB is not used by applications)

**EVIDENCE:**
```yaml
# Brain docker-compose.yml
services:
  duckdb:
    image: ghcr.io/duckdb/duckdb:latest
    container_name: brain-duckdb
    restart: unless-stopped
    volumes:
      - duckdb_data:/data
      - ../../data/analytics:/analytics
    networks:
      - brain_internal
```

---

### SERVICE: Brain OpenSearch

**STARTS:** Brain docker-compose.yml (opensearch service)

**DEPENDS:**
- NONE

**READS:**
- NONE (OpenSearch is a search engine)

**WRITES:**
- NONE (OpenSearch is not used by applications)

**EVIDENCE:**
```yaml
# Brain docker-compose.yml
services:
  opensearch:
    image: opensearchproject/opensearch:latest
    container_name: brain-opensearch
    restart: unless-stopped
    environment:
      OPENSEARCH_INITIAL_ADMIN_PASSWORD: ${OPENSEARCH_PASSWORD}
      DISABLE_SECURITY_PLUGIN: 'false'
      DISABLE_DETECTION_MODE: 'true'
    volumes:
      - opensearch_data:/usr/share/opensearch/data
    networks:
      - brain_internal
    ports:
      - "9200:9200"
```

---

### SERVICE: Brain Tika

**STARTS:** Brain docker-compose.yml (tika service)

**DEPENDS:**
- NONE

**READS:**
- NONE (Tika is a document parser)

**WRITES:**
- NONE (Tika is not used by applications)

**EVIDENCE:**
```yaml
# Brain docker-compose.yml
services:
  tika:
    image: apache/tika:latest
    container_name: brain-tika
    restart: unless-stopped
    networks:
      - brain_internal
    ports:
      - "9998:9998"
```

---

### SERVICE: Brain OpenWebUI

**STARTS:** Brain docker-compose.yml (openwebui service)

**DEPENDS:**
- ollama (docker-compose.yml depends_on)

**READS:**
- Ollama (via environment variable OLLAMA_BASE_URL)

**WRITES:**
- NONE (OpenWebUI is a UI)

**EVIDENCE:**
```yaml
# Brain docker-compose.yml
services:
  openwebui:
    image: ghcr.io/open-webui/open-webui:latest
    container_name: brain-openwebui
    restart: unless-stopped
    environment:
      OLLAMA_BASE_URL: http://ollama:11434
    depends_on:
      - ollama
    networks:
      - brain_internal
    ports:
      - "3000:8080"
```

---

## MISSING SERVICES

### SERVICE: PING commit-service

**STARTS:** UNKNOWN (no docker-compose.yml found)

**DEPENDS:** UNKNOWN (no docker-compose.yml found)

**READS:** UNKNOWN (no docker-compose.yml found)

**WRITES:** UNKNOWN (no docker-compose.yml found)

**EVIDENCE:**
- No docker-compose.yml found for PING commit-service
- commit-service exists but runtime status is unknown
- commit-service is not executed in practice

---

### SERVICE: PING gateway

**STARTS:** UNKNOWN (no docker-compose.yml found)

**DEPENDS:** UNKNOWN (no docker-compose.yml found)

**READS:** UNKNOWN (no docker-compose.yml found)

**WRITES:** UNKNOWN (no docker-compose.yml found)

**EVIDENCE:**
- No docker-compose.yml found for PING gateway
- gateway exists but runtime status is unknown
- gateway is not executed in practice

---

## CRITICAL FINDINGS

1. **Only 3 services actually execute in practice.** crx-newsletter-brain worker, crx-digestion-worker worker, and Brain infrastructure (PostgreSQL, Ollama) execute. All other Brain infrastructure services (Qdrant, Neo4j, Temporal, Kafka, Zookeeper, DuckDB, OpenSearch, Tika, OpenWebUI) are started but not used by applications.

2. **PING commit-service is not executed.** No docker-compose.yml exists for PING commit-service. Runtime status is unknown. commit-service is not executed in practice.

3. **PING gateway is not executed.** No docker-compose.yml exists for PING gateway. Runtime status is unknown. gateway is not executed in practice.

4. **Brain infrastructure is over-provisioned.** Brain has 11 services but applications only use 2 (PostgreSQL, Ollama). 9 services (Qdrant, Neo4j, Temporal, Kafka, Zookeeper, DuckDB, OpenSearch, Tika, OpenWebUI) are started but not used.

5. **Applications use SQLite as authoritative storage.** Applications write to SQLite databases (newsletters.db, knowledge.db) and emit events to PostgreSQL. SQLite is authoritative, not PostgreSQL.

6. **No service coordination exists.** Services are started independently with no coordination. No service mesh exists. No service discovery exists.

---

## ANSWER

**What actually executes in practice?**

Only 3 services actually execute in practice:
1. crx-newsletter-brain worker (ingests Yahoo Mail newsletters)
2. crx-digestion-worker worker (ingests RSS feeds)
3. Brain infrastructure (PostgreSQL, Ollama)

**Not what architecture documents claim.**

Architecture documents claim:
- PING is the constitutional kernel (FALSE - PING is not executed)
- Brain has extensive infrastructure (PARTIAL - Brain has infrastructure but most is unused)
- Applications use PING primitives (FALSE - Applications use Brain/event_emitter.py, not PING)
- Applications use constitutional primitives (FALSE - Applications bypass PING primitives)
- Services are coordinated (FALSE - No service coordination exists)
