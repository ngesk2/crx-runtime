# SERVICE UTILIZATION REPORT

**Audit Date:** 2025-01-18  
**Audit Mode:** ZERO ASSUMPTION - READ ONLY  
**Audit Principle:** For every docker compose service determine started, connected, queried, written to, read from.

---

## EXECUTIVE SUMMARY

**Most Brain infrastructure services are dormant.** Only PostgreSQL and Ollama are actively used by applications. Qdrant, Neo4j, Temporal, Kafka, Zookeeper, DuckDB, OpenSearch, Tika, and OpenWebUI are started but not used. crx-newsletter-brain and crx-digestion-worker are actively used.

---

## SERVICE: crx-newsletter-brain worker

**Docker Compose:** crx-newsletter-brain/docker-compose.yml (worker service)

**Started:** YES (docker-compose up worker)

**Connected:** YES (connects to SQLite, PostgreSQL, Yahoo Mail, Ollama)

**Queried:** YES (queries SQLite for newsletters, digests, topics)

**Written To:** YES (writes to SQLite, PostgreSQL events table, markdown files)

**Read From:** YES (reads from SQLite, Yahoo Mail, Ollama)

**Classification:** ACTIVE

**Evidence:**
- docker-compose.yml defines worker service
- worker.py main() is executed on startup
- worker.py connects to SQLite via database.py
- worker.py connects to PostgreSQL via Brain/event_emitter.py
- worker.py connects to Yahoo Mail via yahoo_client.py
- worker.py connects to Ollama via summarizer.py
- worker.py queries SQLite for newsletters, digests, topics
- worker.py writes to SQLite for newsletters, digests, topics
- worker.py writes to PostgreSQL events table via Brain/event_emitter.py
- worker.py writes to markdown files via archive.py
- worker.py reads from SQLite, Yahoo Mail, Ollama

---

## SERVICE: crx-newsletter-brain dashboard

**Docker Compose:** crx-newsletter-brain/docker-compose.yml (dashboard service)

**Started:** YES (docker-compose up dashboard)

**Connected:** YES (connects to SQLite)

**Queried:** YES (queries SQLite for newsletters, digests, topics)

**Written To:** NO (dashboard is read-only)

**Read From:** YES (reads from SQLite)

**Classification:** ACTIVE

**Evidence:**
- docker-compose.yml defines dashboard service
- dashboard.py is executed on startup
- dashboard.py connects to SQLite via database.py
- dashboard.py queries SQLite for newsletters, digests, topics
- dashboard.py does not write to SQLite
- dashboard.py reads from SQLite

---

## SERVICE: crx-digestion-worker worker

**Docker Compose:** crx-digestion-worker/docker-compose.yml (worker service)

**Started:** YES (docker-compose up worker)

**Connected:** YES (connects to SQLite, PostgreSQL, RSS feeds, Ollama)

**Queried:** YES (queries SQLite for articles, sources)

**Written To:** YES (writes to SQLite, PostgreSQL events table, markdown files)

**Read From:** YES (reads from SQLite, RSS feeds, Ollama)

**Classification:** ACTIVE

**Evidence:**
- docker-compose.yml defines worker service
- worker.py main() is executed on startup
- worker.py connects to SQLite via database.py
- worker.py connects to PostgreSQL via Brain/event_emitter.py
- worker.py connects to RSS feeds via tools.py
- worker.py connects to Ollama via summarizer.py
- worker.py queries SQLite for articles, sources
- worker.py writes to SQLite for articles, sources
- worker.py writes to PostgreSQL events table via Brain/event_emitter.py
- worker.py writes to markdown files via archive.py
- worker.py reads from SQLite, RSS feeds, Ollama

---

## SERVICE: crx-digestion-worker open-webui

**Docker Compose:** crx-digestion-worker/docker-compose.yml (open-webui service)

**Started:** YES (docker-compose up open-webui)

**Connected:** YES (connects to Ollama via environment variable OLLAMA_BASE_URL)

**Queried:** NO (open-webui is a UI, not queried by applications)

**Written To:** NO (open-webui is a UI, not written to by applications)

**Read From:** NO (open-webui is a UI, not read from by applications)

**Classification:** DORMANT

**Evidence:**
- docker-compose.yml defines open-webui service
- open-webui is started but not used by applications
- open-webui connects to Ollama via environment variable
- open-webui is not queried by applications
- open-webui is not written to by applications
- open-webui is not read from by applications

---

## SERVICE: Brain PostgreSQL

**Docker Compose:** Brain/docker-compose.yml (postgres service)

**Started:** YES (docker-compose up postgres)

**Connected:** YES (connected by Brain/event_emitter.py)

**Queried:** YES (queried by Brain/event_emitter.py for event insertion)

**Written To:** YES (written to by Brain/event_emitter.py for event insertion)

**Read From:** NO (not read by applications)

**Classification:** ACTIVE

**Evidence:**
- docker-compose.yml defines postgres service
- postgres is started
- Brain/event_emitter.py connects to PostgreSQL
- Brain/event_emitter.py queries PostgreSQL for event insertion
- Brain/event_emitter.py writes to PostgreSQL for event insertion
- Applications do not read from PostgreSQL events table

---

## SERVICE: Brain Ollama

**Docker Compose:** Brain/docker-compose.yml (ollama service)

**Started:** YES (docker-compose up ollama)

**Connected:** YES (connected by crx-newsletter-brain/summarizer.py, crx-digestion-worker/summarizer.py)

**Queried:** YES (queried by summarizer.py for newsletter analysis and article summarization)

**Written To:** NO (Ollama is an AI model server, not written to)

**Read From:** YES (read from by summarizer.py for newsletter analysis and article summarization)

**Classification:** ACTIVE

**Evidence:**
- docker-compose.yml defines ollama service
- ollama is started
- crx-newsletter-brain/summarizer.py connects to Ollama
- crx-digestion-worker/summarizer.py connects to Ollama
- summarizer.py queries Ollama for newsletter analysis and article summarization
- summarizer.py reads from Ollama for newsletter analysis and article summarization

---

## SERVICE: Brain Qdrant

**Docker Compose:** Brain/docker-compose.yml (qdrant service)

**Started:** YES (docker-compose up qdrant)

**Connected:** NO (not connected by any application)

**Queried:** NO (not queried by any application)

**Written To:** NO (not written to by any application)

**Read From:** NO (not read from by any application)

**Classification:** DORMANT

**Evidence:**
- docker-compose.yml defines qdrant service
- qdrant is started
- No applications connect to Qdrant
- No applications query Qdrant
- No applications write to Qdrant
- No applications read from Qdrant

---

## SERVICE: Brain Neo4j

**Docker Compose:** Brain/docker-compose.yml (neo4j service)

**Started:** YES (docker-compose up neo4j)

**Connected:** NO (not connected by any application)

**Queried:** NO (not queried by any application)

**Written To:** NO (not written to by any application)

**Read From:** NO (not read from by any application)

**Classification:** DORMANT

**Evidence:**
- docker-compose.yml defines neo4j service
- neo4j is started
- No applications connect to Neo4j
- No applications query Neo4j
- No applications write to Neo4j
- No applications read from Neo4j

---

## SERVICE: Brain Temporal

**Docker Compose:** Brain/docker-compose.yml (temporal service)

**Started:** YES (docker-compose up temporal)

**Connected:** NO (not connected by any application)

**Queried:** NO (not queried by any application)

**Written To:** NO (not written to by any application)

**Read From:** NO (not read from by any application)

**Classification:** DORMANT

**Evidence:**
- docker-compose.yml defines temporal service
- temporal is started
- No applications connect to Temporal
- No applications query Temporal
- No applications write to Temporal
- No applications read from Temporal

---

## SERVICE: Brain Kafka

**Docker Compose:** Brain/docker-compose.yml (kafka service)

**Started:** YES (docker-compose up kafka)

**Connected:** NO (not connected by any application)

**Queried:** NO (not queried by any application)

**Written To:** NO (not written to by any application)

**Read From:** NO (not read from by any application)

**Classification:** DORMANT

**Evidence:**
- docker-compose.yml defines kafka service
- kafka is started
- No applications connect to Kafka
- No applications query Kafka
- No applications write to Kafka
- No applications read from Kafka

---

## SERVICE: Brain Zookeeper

**Docker Compose:** Brain/docker-compose.yml (zookeeper service)

**Started:** YES (docker-compose up zookeeper)

**Connected:** NO (not connected by any application)

**Queried:** NO (not queried by any application)

**Written To:** NO (not written to by any application)

**Read From:** NO (not read from by any application)

**Classification:** DORMANT

**Evidence:**
- docker-compose.yml defines zookeeper service
- zookeeper is started
- No applications connect to Zookeeper
- No applications query Zookeeper
- No applications write to Zookeeper
- No applications read from Zookeeper

---

## SERVICE: Brain DuckDB

**Docker Compose:** Brain/docker-compose.yml (duckdb service)

**Started:** YES (docker-compose up duckdb)

**Connected:** NO (not connected by any application)

**Queried:** NO (not queried by any application)

**Written To:** NO (not written to by any application)

**Read From:** NO (not read from by any application)

**Classification:** DORMANT

**Evidence:**
- docker-compose.yml defines duckdb service
- duckdb is started
- No applications connect to DuckDB
- No applications query DuckDB
- No applications write to DuckDB
- No applications read from DuckDB

---

## SERVICE: Brain OpenSearch

**Docker Compose:** Brain/docker-compose.yml (opensearch service)

**Started:** YES (docker-compose up opensearch)

**Connected:** NO (not connected by any application)

**Queried:** NO (not queried by any application)

**Written To:** NO (not written to by any application)

**Read From:** NO (not read from by any application)

**Classification:** DORMANT

**Evidence:**
- docker-compose.yml defines opensearch service
- opensearch is started
- No applications connect to OpenSearch
- No applications query OpenSearch
- No applications write to OpenSearch
- No applications read from OpenSearch

---

## SERVICE: Brain Tika

**Docker Compose:** Brain/docker-compose.yml (tika service)

**Started:** YES (docker-compose up tika)

**Connected:** NO (not connected by any application)

**Queried:** NO (not queried by any application)

**Written To:** NO (not written to by any application)

**Read From:** NO (not read from by any application)

**Classification:** DORMANT

**Evidence:**
- docker-compose.yml defines tika service
- tika is started
- No applications connect to Tika
- No applications query Tika
- No applications write to Tika
- No applications read from Tika

---

## SERVICE: Brain OpenWebUI

**Docker Compose:** Brain/docker-compose.yml (openwebui service)

**Started:** YES (docker-compose up openwebui)

**Connected:** NO (not connected by any application)

**Queried:** NO (not queried by any application)

**Written To:** NO (not written to by any application)

**Read From:** NO (not read from by application)

**Classification:** DORMANT

**Evidence:**
- docker-compose.yml defines openwebui service
- openwebui is started
- No applications connect to OpenWebUI
- No applications query OpenWebUI
- No applications write to OpenWebUI
- No applications read from OpenWebUI

---

## CRITICAL FINDINGS

1. **Only 4 services are actively used.** crx-newsletter-brain worker, crx-newsletter-brain dashboard, crx-digestion-worker worker, Brain PostgreSQL, and Brain Ollama are actively used. All other services are dormant.

2. **Brain infrastructure is over-provisioned.** Brain has 11 services but only 2 (PostgreSQL, Ollama) are actively used. 9 services (Qdrant, Neo4j, Temporal, Kafka, Zookeeper, DuckDB, OpenSearch, Tika, OpenWebUI) are dormant.

3. **crx-digestion-worker open-webui is dormant.** open-webui is started but not used by applications. It is a UI that is not connected to the worker.

4. **PostgreSQL is only used for event logging.** PostgreSQL is only used by Brain/event_emitter.py for event insertion. Applications do not read from PostgreSQL.

5. **Ollama is only used for summarization.** Ollama is only used by summarizer.py for newsletter analysis and article summarization.

6. **No service coordination exists.** Services are started independently with no coordination. No service mesh exists. No service discovery exists.

7. **No service dependencies exist.** Services do not depend on each other except for crx-digestion-worker open-webui depending on Ollama (via environment variable).

---

## ANSWER

**crx-newsletter-brain worker:** ACTIVE
- Started: YES
- Connected: YES
- Queried: YES
- Written To: YES
- Read From: YES

**crx-newsletter-brain dashboard:** ACTIVE
- Started: YES
- Connected: YES
- Queried: YES
- Written To: NO
- Read From: YES

**crx-digestion-worker worker:** ACTIVE
- Started: YES
- Connected: YES
- Queried: YES
- Written To: YES
- Read From: YES

**crx-digestion-worker open-webui:** DORMANT
- Started: YES
- Connected: YES
- Queried: NO
- Written To: NO
- Read From: NO

**Brain PostgreSQL:** ACTIVE
- Started: YES
- Connected: YES
- Queried: YES
- Written To: YES
- Read From: NO

**Brain Ollama:** ACTIVE
- Started: YES
- Connected: YES
- Queried: YES
- Written To: NO
- Read From: YES

**Brain Qdrant:** DORMANT
- Started: YES
- Connected: NO
- Queried: NO
- Written To: NO
- Read From: NO

**Brain Neo4j:** DORMANT
- Started: YES
- Connected: NO
- Queried: NO
- Written To: NO
- Read From: NO

**Brain Temporal:** DORMANT
- Started: YES
- Connected: NO
- Queried: NO
- Written To: NO
- Read From: NO

**Brain Kafka:** DORMANT
- Started: YES
- Connected: NO
- Queried: NO
- Written To: NO
- Read From: NO

**Brain Zookeeper:** DORMANT
- Started: YES
- Connected: NO
- Queried: NO
- Written To: NO
- Read From: NO

**Brain DuckDB:** DORMANT
- Started: YES
- Connected: NO
- Queried: NO
- Written To: NO
- Read From: NO

**Brain OpenSearch:** DORMANT
- Started: YES
- Connected: NO
- Queried: NO
- Written To: NO
- Read From: NO

**Brain Tika:** DORMANT
- Started: YES
- Connected: NO
- Queried: NO
- Written To: NO
- Read From: NO

**Brain OpenWebUI:** DORMANT
- Started: YES
- Connected: NO
- Queried: NO
- Written To: NO
- Read From: NO
