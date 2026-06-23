# PHASE 2: DOCKER RUNTIME INVENTORY

**Audit Scope:** All Docker containers and their constitutional ownership  
**Classification Categories:** PING KERNEL, PING SERVICE, BRAIN SERVICE, APPLICATION, OBSOLETE  

---

## CURRENTLY RUNNING CONTAINERS

### crx-gateway

**Container Name:** crx-gateway  
**Image:** crx-gateway:1.0.0  
**Status:** Exited (exit code 1) - 47 hours ago  
**Purpose:** PING Gateway API server with model routing, constitutional event emission, and operational intelligence context services  
**Ports:** 8080:8080  
**Networks:** crx_crx-network  
**Volumes:** None  
**Environment Variables:** OLLAMA_URL=http://crx-ollama-worker:11434, OLLAMA_MODEL=qwen2.5-coder:14b, NODE_ENV=production  
**Health Checks:** None configured  
**Restart Policy:** no  
**Runtime Ownership:** PING  
**Classification:** PING KERNEL  
**Justification:** This is the PING gateway (C:\Users\nolan\PING\gateway\server.js) that implements constitutional event recording (INFERENCE_REQUEST, INFERENCE_RESPONSE, INFERENCE_FAILED events), model routing, and operational intelligence context services. It is the orchestration layer for PING.  

---

### open-webui

**Container Name:** open-webui  
**Image:** ghcr.io/open-webui/open-webui:main  
**Status:** Exited (exit code 137) - 47 hours ago  
**Purpose:** Open WebUI AI interface for Ollama models  
**Ports:** 8080:8080  
**Networks:** crx-digestion-worker_default  
**Volumes:** crx-digestion-worker_open-webui-data:/app/backend/data  
**Environment Variables:** OLLAMA_BASE_URL=http://host.docker.internal:11434, USE_OLLAMA_DOCKER=false, USE_CUDA_DOCKER=false, RAG_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2, AUXILIARY_EMBEDDING_MODEL=TaylorAI/bge-micro-v2  
**Health Checks:** curl --silent --fail http://localhost:${PORT:-8080}/health | jq -ne 'input.status == true' || exit 1  
**Restart Policy:** no  
**Runtime Ownership:** crx-digestion-worker  
**Classification:** APPLICATION  
**Justification:** This is an external AI interface application (Open WebUI) used by the crx-digestion-worker project. It is not a constitutional primitive. It provides a UI for interacting with Ollama models but duplicates functionality that should be provided by the PING gateway and crx-ui-next.  

---

### crx-ollama-worker

**Container Name:** crx-ollama-worker  
**Image:** ollama/ollama:latest  
**Status:** Exited (exit code 0) - 47 hours ago  
**Purpose:** Ollama model inference server  
**Ports:** 11434:11434  
**Networks:** crx_crx-network  
**Volumes:** None  
**Environment Variables:** OLLAMA_HOST=0.0.0.0:11434, NVIDIA_VISIBLE_DEVICES=all  
**Health Checks:** None configured  
**Restart Policy:** no  
**Runtime Ownership:** PING  
**Classification:** PING SERVICE  
**Justification:** This is the Ollama inference server that provides model execution capabilities for the PING gateway. It is a service built on top of PING kernel (the gateway routes to it). It is not constitutional infrastructure but a service that PING uses.  

---

### crx-ui-next

**Container Name:** crx-ui-next  
**Image:** crx-ui-next:1.0.0  
**Status:** Exited (exit code 0) - 47 hours ago  
**Purpose:** Next.js UI frontend for CRX system  
**Ports:** 3000:3000  
**Networks:** crx_crx-network  
**Volumes:** None  
**Environment Variables:** NEXT_PUBLIC_GATEWAY_URL=http://gateway-worker:8080, NODE_ENV=production  
**Health Checks:** curl -f http://localhost:3000/api/health || exit 1 (interval: 30s, timeout: 10s, start_period: 10s, retries: 3)  
**Restart Policy:** no  
**Runtime Ownership:** PING  
**Classification:** APPLICATION  
**Justification:** This is a Next.js frontend application that provides a UI for the CRX system. It is an application layer built on top of PING (connects to gateway-worker:8080). It is not a constitutional primitive.  

---

## CONFIGURED BUT NOT RUNNING CONTAINERS

### newsletter-brain-worker

**Container Name:** newsletter-brain-worker  
**Image:** Built from crx-newsletter-brain  
**Status:** Not currently running (defined in docker-compose.yml)  
**Purpose:** Newsletter processing worker  
**Ports:** None  
**Networks:** Default  
**Volumes:** ./newsletters.db:/app/newsletters.db, ./knowledge:/app/knowledge, ./digests:/app/digests  
**Environment Variables:** From .env file  
**Health Checks:** None configured  
**Restart Policy:** unless-stopped  
**Runtime Ownership:** crx-newsletter-brain  
**Classification:** APPLICATION  
**Justification:** This is a newsletter processing application worker. It is an application that uses knowledge storage but is not a constitutional primitive.  

---

### newsletter-brain-dashboard

**Container Name:** newsletter-brain-dashboard  
**Image:** Built from crx-newsletter-brain  
**Status:** Not currently running (defined in docker-compose.yml)  
**Purpose:** Dashboard for newsletter worker  
**Ports:** 5001:5001  
**Networks:** Default  
**Volumes:** ./newsletters.db:/app/newsletters.db  
**Environment Variables:** From .env file  
**Health Checks:** None configured  
**Restart Policy:** unless-stopped  
**Runtime Ownership:** crx-newsletter-brain  
**Classification:** APPLICATION  
**Justification:** This is a dashboard application for the newsletter worker. It is an application UI, not a constitutional primitive.  

---

### digestion-worker

**Container Name:** digestion-worker  
**Image:** Built from crx-digestion-worker  
**Status:** Not currently running (defined in docker-compose.yml)  
**Purpose:** Digestion/processing worker  
**Ports:** None  
**Networks:** Default  
**Volumes:** ./knowledge:/app/knowledge, ./knowledge.db:/app/knowledge.db  
**Environment Variables:** From .env file  
**Health Checks:** None configured  
**Restart Policy:** unless-stopped  
**Runtime Ownership:** crx-digestion-worker  
**Classification:** APPLICATION  
**Justification:** This is a digestion/processing application worker. It is an application that uses knowledge storage but is not a constitutional primitive.  

---

## BRAIN INFRASTRUCTURE CONTAINERS (Not Running)

### brain-postgres

**Container Name:** brain-postgres  
**Image:** postgres:15-alpine  
**Status:** Not currently running (defined in brain infrastructure)  
**Purpose:** PostgreSQL database for Brain  
**Ports:** 5432:5432  
**Networks:** brain_internal  
**Volumes:** postgres_data:/var/lib/postgresql/data, ../canonical_state/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql  
**Environment Variables:** POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB  
**Health Checks:** pg_isready -U ${POSTGRES_USER} (interval: 10s, timeout: 5s, retries: 5)  
**Restart Policy:** unless-stopped  
**Runtime Ownership:** brain  
**Classification:** BRAIN SERVICE  
**Justification:** This is PostgreSQL infrastructure for the Brain project. It is Brain-specific infrastructure, not PING constitutional infrastructure. PING has its own PostgreSQL schema (events.sql).  

---

### brain-qdrant

**Container Name:** brain-qdrant  
**Image:** qdrant/qdrant:latest  
**Status:** Not currently running (defined in brain infrastructure)  
**Purpose:** Vector database for Brain  
**Ports:** 6333:6333  
**Networks:** brain_internal  
**Volumes:** qdrant_data:/qdrant/storage  
**Environment Variables:** QDRANT__SERVICE__API_KEY  
**Health Checks:** curl -f http://localhost:6333/health (interval: 10s, timeout: 5s, retries: 5)  
**Restart Policy:** unless-stopped  
**Runtime Ownership:** brain  
**Classification:** BRAIN SERVICE  
**Justification:** This is a vector database for the Brain project. Vector databases are not constitutional primitives in PING (PING uses event-based replay, not vector search). This is Brain-specific infrastructure.  

---

### brain-neo4j

**Container Name:** brain-neo4j  
**Image:** neo4j:5.15-community  
**Status:** Not currently running (defined in brain infrastructure)  
**Purpose:** Knowledge graph database for Brain  
**Ports:** 7474:7474, 7687:7687  
**Networks:** brain_internal  
**Volumes:** neo4j_data:/data, neo4j_logs:/logs  
**Environment Variables:** NEO4J_AUTH, NEO4J_dbms_memory_pagecache_size, NEO4J_dbms_memory_heap_initial__size, NEO4J_dbms_memory_heap_max__size  
**Health Checks:** curl -f http://localhost:7474 (interval: 10s, timeout: 5s, retries: 5)  
**Restart Policy:** unless-stopped  
**Runtime Ownership:** brain  
**Classification:** BRAIN SERVICE  
**Justification:** This is a graph database for the Brain project. Graph databases are not constitutional primitives in PING (PING uses lineage DAGs stored in PostgreSQL). This is Brain-specific infrastructure.  

---

### brain-temporal

**Container Name:** brain-temporal  
**Image:** temporalio/auto-setup:latest  
**Status:** Not currently running (defined in brain infrastructure)  
**Purpose:** Workflow engine for Brain  
**Ports:** 7233:7233  
**Networks:** brain_internal  
**Volumes:** None  
**Environment Variables:** TEMPORAL_ADDRESS, TEMPORAL_NAMESPACE, DB, DB_PORT, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_SEEDS  
**Health Checks:** None configured  
**Restart Policy:** unless-stopped  
**Runtime Ownership:** brain  
**Classification:** BRAIN SERVICE  
**Justification:** This is a workflow engine for the Brain project. Workflow engines are not constitutional primitives in PING (PING uses event-driven replay). This is Brain-specific infrastructure.  

---

### brain-kafka

**Container Name:** brain-kafka  
**Image:** confluentinc/cp-kafka:latest  
**Status:** Not currently running (defined in brain infrastructure)  
**Purpose:** Event streaming for Brain  
**Ports:** 9092:9092  
**Networks:** brain_internal  
**Volumes:** kafka_data:/var/lib/kafka/data  
**Environment Variables:** KAFKA_BROKER_ID, KAFKA_ZOOKEEPER_CONNECT, KAFKA_ADVERTISED_LISTENERS, KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR, KAFKA_AUTO_CREATE_TOPICS_ENABLE  
**Health Checks:** kafka-broker-api-versions --bootstrap-server localhost:9092 (interval: 10s, timeout: 5s, retries: 5)  
**Restart Policy:** unless-stopped  
**Runtime Ownership:** brain  
**Classification:** BRAIN SERVICE  
**Justification:** This is Kafka event streaming for the Brain project. While PING uses events, PING uses PostgreSQL append-only events, not Kafka. This is Brain-specific infrastructure.  

---

### brain-zookeeper

**Container Name:** brain-zookeeper  
**Image:** confluentinc/cp-zookeeper:latest  
**Status:** Not currently running (defined in brain infrastructure)  
**Purpose:** Zookeeper for Kafka coordination  
**Ports:** 2181:2181  
**Networks:** brain_internal  
**Volumes:** zookeeper_data:/var/lib/zookeeper/data, zookeeper_logs:/var/lib/zookeeper/log  
**Environment Variables:** ZOOKEEPER_CLIENT_PORT, ZOOKEEPER_TICK_TIME  
**Health Checks:** nc -z localhost 2181 (interval: 10s, timeout: 5s, retries: 5)  
**Restart Policy:** unless-stopped  
**Runtime Ownership:** brain  
**Classification:** BRAIN SERVICE  
**Justification:** This is Zookeeper for Kafka coordination. It is infrastructure dependency for Kafka, not a constitutional primitive.  

---

### brain-duckdb

**Container Name:** brain-duckdb  
**Image:** ghcr.io/duckdb/duckdb:latest  
**Status:** Not currently running (defined in brain infrastructure)  
**Purpose:** Analytics database for Brain  
**Ports:** None  
**Networks:** brain_internal  
**Volumes:** duckdb_data:/data, ../../data/analytics:/analytics  
**Environment Variables:** None  
**Health Checks:** None configured  
**Restart Policy:** unless-stopped  
**Runtime Ownership:** brain  
**Classification:** BRAIN SERVICE  
**Justification:** This is an analytics database for the Brain project. Analytics databases are not constitutional primitives in PING. This is Brain-specific infrastructure.  

---

### brain-opensearch

**Container Name:** brain-opensearch  
**Image:** opensearchproject/opensearch:latest  
**Status:** Not currently running (defined in brain infrastructure)  
**Purpose:** Search engine for Brain  
**Ports:** 9200:9200  
**Networks:** brain_internal  
**Volumes:** opensearch_data:/usr/share/opensearch/data  
**Environment Variables:** OPENSEARCH_INITIAL_ADMIN_PASSWORD, DISABLE_SECURITY_PLUGIN, DISABLE_DETECTION_MODE  
**Health Checks:** curl -f http://localhost:9200/_cluster/health || exit 1 (interval: 10s, timeout: 5s, retries: 5)  
**Restart Policy:** unless-stopped  
**Runtime Ownership:** brain  
**Classification:** BRAIN SERVICE  
**Justification:** This is a search engine for the Brain project. Search engines are not constitutional primitives in PING (PING uses event-based retrieval). This is Brain-specific infrastructure.  

---

### brain-tika

**Container Name:** brain-tika  
**Image:** apache/tika:latest  
**Status:** Not currently running (defined in brain infrastructure)  
**Purpose:** Document parsing for Brain  
**Ports:** 9998:9998  
**Networks:** brain_internal  
**Volumes:** None  
**Environment Variables:** None  
**Health Checks:** curl -f http://localhost:9998 (interval: 10s, timeout: 5s, retries: 5)  
**Restart Policy:** unless-stopped  
**Runtime Ownership:** brain  
**Classification:** BRAIN SERVICE  
**Justification:** This is a document parsing service for the Brain project. Document parsing is not a constitutional primitive in PING. This is Brain-specific infrastructure.  

---

### brain-ollama

**Container Name:** brain-ollama  
**Image:** ollama/ollama:latest  
**Status:** Not currently running (defined in brain infrastructure)  
**Purpose:** Ollama model server for Brain  
**Ports:** 11434:11434  
**Networks:** brain_internal  
**Volumes:** ollama_data:/root/.ollama  
**Environment Variables:** None  
**Health Checks:** curl -f http://localhost:11434/api/tags (interval: 10s, timeout: 5s, retries: 5)  
**Restart Policy:** unless-stopped  
**Runtime Ownership:** brain  
**Classification:** BRAIN SERVICE  
**Justification:** This is an Ollama model server for the Brain project. This duplicates crx-ollama-worker. This is Brain-specific infrastructure and may be OBSOLETE if crx-ollama-worker is the canonical Ollama instance.  

---

### brain-openwebui

**Container Name:** brain-openwebui  
**Image:** ghcr.io/open-webui/open-webui:latest  
**Status:** Not currently running (defined in brain infrastructure)  
**Purpose:** Open WebUI AI interface for Brain  
**Ports:** 3000:8080  
**Networks:** brain_internal  
**Volumes:** None  
**Environment Variables:** OLLAMA_BASE_URL=http://ollama:11434  
**Health Checks:** curl -f http://localhost:8080 (interval: 10s, timeout: 5s, retries: 5)  
**Restart Policy:** unless-stopped  
**Runtime Ownership:** brain  
**Classification:** OBSOLETE  
**Justification:** This is a duplicate of open-webui container. There are two Open WebUI instances (one in crx-digestion-worker, one in brain infrastructure). This is redundant and should be consolidated. Open WebUI is an external application that duplicates functionality that should be provided by crx-ui-next.  

---

## SUMMARY

### PING KERNEL (1 container)
- crx-gateway - Constitutional gateway with event recording and operational intelligence

### PING SERVICE (1 container)
- crx-ollama-worker - Ollama inference service used by PING gateway

### APPLICATION (4 containers)
- crx-ui-next - Next.js UI frontend for CRX system
- newsletter-brain-worker - Newsletter processing worker
- newsletter-brain-dashboard - Dashboard for newsletter worker
- digestion-worker - Digestion/processing worker

### BRAIN SERVICE (10 containers)
- brain-postgres - PostgreSQL for Brain
- brain-qdrant - Vector database for Brain
- brain-neo4j - Knowledge graph database for Brain
- brain-temporal - Workflow engine for Brain
- brain-kafka - Event streaming for Brain
- brain-zookeeper - Zookeeper for Kafka
- brain-duckdb - Analytics database for Brain
- brain-opensearch - Search engine for Brain
- brain-tika - Document parsing for Brain
- brain-ollama - Ollama model server for Brain (duplicate of crx-ollama-worker)

### OBSOLETE (2 containers)
- open-webui - External AI interface (duplicates crx-ui-next functionality)
- brain-openwebui - Duplicate Open WebUI instance

### DUPLICATION DETECTED
- **Ollama:** crx-ollama-worker (PING) vs brain-ollama (Brain) - Winner: crx-ollama-worker (PING owns model routing)
- **Open WebUI:** open-webui (crx-digestion-worker) vs brain-openwebui (Brain) - Winner: OBSOLETE (both should be replaced by crx-ui-next)

### CONSTITUTIONAL OWNERSHIP
- **PING owns:** crx-gateway (kernel), crx-ollama-worker (service), crx-ui-next (application interface)
- **Brain owns:** brain-postgres, brain-qdrant, brain-neo4j, brain-temporal, brain-kafka, brain-zookeeper, brain-duckdb, brain-opensearch, brain-tika, brain-ollama
- **Applications own:** newsletter-brain-worker, newsletter-brain-dashboard, digestion-worker
- **Obsolete:** open-webui, brain-openwebui (should be removed)

### ANSWER
**What infrastructure actually exists?**
- PING kernel: 1 container (crx-gateway)
- PING services: 1 container (crx-ollama-worker)
- Applications: 4 containers (crx-ui-next, newsletter-brain-worker, newsletter-brain-dashboard, digestion-worker)
- Brain services: 10 containers (PostgreSQL, Qdrant, Neo4j, Temporal, Kafka, Zookeeper, DuckDB, OpenSearch, Tika, Ollama)
- Obsolete: 2 containers (open-webui, brain-openwebui)

**What is the constitutional ownership?**
- PING owns the gateway (constitutional orchestration) and Ollama service (model routing)
- Brain owns its own infrastructure stack (vector DB, graph DB, workflow engine, event streaming, analytics, search, parsing)
- Applications own their specific workers and dashboards
- Open WebUI is obsolete and should be removed (duplicates crx-ui-next)
