# PHASE 7: DEAD CONSTITUTION DETECTION

**Audit Type:** OWNERSHIP PROOF + EXECUTION REALITY  
**Scope:** Find unused primitives (unused event emitters, unused replay, unused canonical schemas, unused registries, unused services)  
**Evidence Only:** Running code only, not documentation  

---

## CRITICAL FINDING

**Most constitutional primitives are dead.** PING's replay engine, witness authority, canonical state, and artifact store are not used by any application. Brain's canonical state schemas, registries, and services are not used at runtime.

---

## DEAD PRIMITIVE 1: PING Replay Engine

### Item

**PING Replay Engine**  
**Location:** C:\Users\nolan\PING\runtime\replay\*.ts (30 TypeScript files)  
**Files:** deterministic_replay_engine.ts, replay_state_machine.ts, replay_verification.ts, invariant_runner.ts, replay_invariants.ts, replay_event_stream.ts, witness_authority.ts, merkle_tree.ts, canonical_json.ts, canonical_event_envelope.ts, canonical_hash_authority.ts, etc.

### Defined

**YES.** 30 TypeScript files define replay engine, witness authority, canonical state, and invariants.

### Referenced

**NO.** No applications import from PING's replay engine. No applications use PING's replay functions.

### Executed

**NO.** No applications execute PING's replay functions. No replay engine is running at runtime.

### Tested

**UNKNOWN.** No test evidence found.

### Classification

**CONSTITUTIONAL THEATER.** PING's replay engine is defined but not used by any application. It's documentation only.

---

## DEAD PRIMITIVE 2: PING Artifact Store

### Item

**PING Artifact Store**  
**Location:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\artifact_store.ts  
**Schema:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\ledger_schema.sql (artifacts table)

### Defined

**YES.** artifact_store.ts defines artifact storage. ledger_schema.sql defines artifacts table.

### Referenced

**NO.** No applications use PING's artifact store. No applications import from artifact_store.ts.

### Executed

**NO.** No applications execute PING's artifact store functions. No artifact store is running at runtime.

### Tested

**UNKNOWN.** No test evidence found.

### Classification

**CONSTITUTIONAL THEATER.** PING's artifact store is defined but not used by any application. It's documentation only.

---

## DEAD PRIMITIVE 3: PING Commit Service

### Item

**PING Commit Service**  
**Location:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\*.ts  
**Files:** server.ts, commit_controller.ts, audit_controller.ts, canonical_engine.ts, identity_engine.ts, dag_validator.ts, etc.

### Defined

**YES.** Commit service is defined with commit and audit endpoints.

### Referenced

**NO.** No applications use PING's commit service. No applications call commit or audit endpoints.

### Executed

**NO.** No applications execute PING's commit service functions. No commit service is running at runtime.

### Tested

**UNKNOWN.** No test evidence found.

### Classification

**CONSTITUTIONAL THEATER.** PING's commit service is defined but not used by any application. It's documentation only.

---

## DEAD PRIMITIVE 4: Brain Canonical State Schema

### Item

**Brain Canonical State Schema**  
**Location:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema.sql  
**Tables:** objects, events, lineage, projections, system_metadata, audit_log

### Defined

**YES.** Schema is defined with 6 tables.

### Referenced

**NO.** No applications use Brain's canonical state schema. No applications import from schema.sql.

### Executed

**NO.** No applications execute Brain's canonical state schema. No schema is used at runtime.

### Tested

**UNKNOWN.** No test evidence found.

### Classification

**CONSTITUTIONAL THEATER.** Brain's canonical state schema is defined but not used at runtime. It's documentation only.

---

## DEAD PRIMITIVE 5: Brain Expanded Canonical State Schema

### Item

**Brain Expanded Canonical State Schema**  
**Location:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Tables:** artifact_lineage, documents, canonical_documents, chunks, entities, relationships, processors, processing_runs, replay_runs, projection_registry, schema_versions

### Defined

**YES.** Schema is defined with 11 tables.

### Referenced

**NO.** No applications use Brain's expanded canonical state schema. No applications import from schema_expanded.sql.

### Executed

**NO.** No applications execute Brain's expanded canonical state schema. No schema is used at runtime.

### Tested

**UNKNOWN.** No test evidence found.

### Classification

**CONSTITUTIONAL THEATER.** Brain's expanded canonical state schema is defined but not used at runtime. It's documentation only.

---

## DEAD PRIMITIVE 6: Brain Projection Registry

### Item

**Brain Projection Registry**  
**Location:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Table:** projection_registry

### Defined

**YES.** projection_registry table is defined.

### Referenced

**NO.** No applications use Brain's projection registry. No applications query projection_registry table.

### Executed

**NO.** No applications execute Brain's projection registry functions. No projection registry is used at runtime.

### Tested

**UNKNOWN.** No test evidence found.

### Classification

**CONSTITUTIONAL THEATER.** Brain's projection registry is defined but not used at runtime. It's documentation only.

---

## DEAD PRIMITIVE 7: Brain Artifact Registry

### Item

**Brain Artifact Registry**  
**Location:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Table:** artifact_registry

### Defined

**YES.** artifact_registry table is defined.

### Referenced

**NO.** No applications use Brain's artifact registry. No applications query artifact_registry table.

### Executed

**NO.** No applications execute Brain's artifact registry functions. No artifact registry is used at runtime.

### Tested

**UNKNOWN.** No test evidence found.

### Classification

**CONSTITUTIONAL THEATER.** Brain's artifact registry is defined but not used at runtime. It's documentation only.

---

## DEAD PRIMITIVE 8: Brain Entities Table

### Item

**Brain Entities Table**  
**Location:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Table:** entities

### Defined

**YES.** entities table is defined.

### Referenced

**NO.** No applications use Brain's entities table. No applications query entities table.

### Executed

**NO.** No applications execute Brain's entities functions. No entities table is used at runtime.

### Tested

**UNKNOWN.** No test evidence found.

### Classification

**CONSTITUTIONAL THEATER.** Brain's entities table is defined but not used at runtime. It's documentation only.

---

## DEAD PRIMITIVE 9: Brain Relationships Table

### Item

**Brain Relationships Table**  
**Location:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Table:** relationships

### Defined

**YES.** relationships table is defined.

### Referenced

**NO.** No applications use Brain's relationships table. No applications query relationships table.

### Executed

**NO.** No applications execute Brain's relationships functions. No relationships table is used at runtime.

### Tested

**UNKNOWN.** No test evidence found.

### Classification

**CONSTITUTIONAL THEATER.** Brain's relationships table is defined but not used at runtime. It's documentation only.

---

## DEAD PRIMITIVE 10: Brain Qdrant Service

### Item

**Brain Qdrant Service**  
**Location:** C:\Users\nolan\CascadeProjects\brain\infrastructure\docker\compose\docker-compose.yml  
**Container:** brain-qdrant  
**Port:** 6333:6333

### Defined

**YES.** Qdrant service is defined in docker-compose.yml.

### Referenced

**NO.** No applications use Brain's Qdrant service. No applications connect to Qdrant.

### Executed

**NO.** No applications execute Brain's Qdrant service. No Qdrant service is used at runtime.

### Tested

**UNKNOWN.** No test evidence found.

### Classification

**CONSTITUTIONAL THEATER.** Brain's Qdrant service is defined but not used by any application. It's infrastructure only.

---

## DEAD PRIMITIVE 11: Brain Neo4j Service

### Item

**Brain Neo4j Service**  
**Location:** C:\Users\nolan\CascadeProjects\brain\infrastructure\docker\compose\docker-compose.yml  
**Container:** brain-neo4j  
**Ports:** 7474:7474, 7687:7687

### Defined

**YES.** Neo4j service is defined in docker-compose.yml.

### Referenced

**NO.** No applications use Brain's Neo4j service. No applications connect to Neo4j.

### Executed

**NO.** No applications execute Brain's Neo4j service. No Neo4j service is used at runtime.

### Tested

**UNKNOWN.** No test evidence found.

### Classification

**CONSTITUTIONAL THEATER.** Brain's Neo4j service is defined but not used by any application. It's infrastructure only.

---

## DEAD PRIMITIVE 12: Brain Temporal Service

### Item

**Brain Temporal Service**  
**Location:** C:\Users\nolan\CascadeProjects\brain\infrastructure\docker\compose\docker-compose.yml  
**Container:** brain-temporal  
**Port:** 7233:7233

### Defined

**YES.** Temporal service is defined in docker-compose.yml.

### Referenced

**NO.** No applications use Brain's Temporal service. No applications connect to Temporal.

### Executed

**NO.** No applications execute Brain's Temporal service. No Temporal service is used at runtime.

### Tested

**UNKNOWN.** No test evidence found.

### Classification

**CONSTITUTIONAL THEATER.** Brain's Temporal service is defined but not used by any application. It's infrastructure only.

---

## DEAD PRIMITIVE 13: Brain Kafka Service

### Item

**Brain Kafka Service**  
**Location:** C:\Users\nolan\CascadeProjects\brain\infrastructure\docker\compose\docker-compose.yml  
**Container:** brain-kafka

### Defined

**YES.** Kafka service is defined in docker-compose.yml.

### Referenced

**NO.** No applications use Brain's Kafka service. No applications connect to Kafka.

### Executed

**NO.** No applications execute Brain's Kafka service. No Kafka service is used at runtime.

### Tested

**UNKNOWN.** No test evidence found.

### Classification

**CONSTITUTIONAL THEATER.** Brain's Kafka service is defined but not used by any application. It's infrastructure only.

---

## DEAD PRIMITIVE 14: Brain Zookeeper Service

### Item

**Brain Zookeeper Service**  
**Location:** C:\Users\nolan\CascadeProjects\brain\infrastructure\docker\compose\docker-compose.yml  
**Container:** brain-zookeeper

### Defined

**YES.** Zookeeper service is defined in docker-compose.yml.

### Referenced

**NO.** No applications use Brain's Zookeeper service. No applications connect to Zookeeper.

### Executed

**NO.** No applications execute Brain's Zookeeper service. No Zookeeper service is used at runtime.

### Tested

**UNKNOWN.** No test evidence found.

### Classification

**CONSTITUTIONAL THEATER.** Brain's Zookeeper service is defined but not used by any application. It's infrastructure only.

---

## DEAD PRIMITIVE 15: Brain DuckDB Service

### Item

**Brain DuckDB Service**  
**Location:** C:\Users\nolan\CascadeProjects\brain\infrastructure\docker\compose\docker-compose.yml  
**Container:** brain-duckdb

### Defined

**YES.** DuckDB service is defined in docker-compose.yml.

### Referenced

**NO.** No applications use Brain's DuckDB service. No applications connect to DuckDB.

### Executed

**NO.** No applications execute Brain's DuckDB service. No DuckDB service is used at runtime.

### Tested

**UNKNOWN.** No test evidence found.

### Classification

**CONSTITUTIONAL THEATER.** Brain's DuckDB service is defined but not used by any application. It's infrastructure only.

---

## DEAD PRIMITIVE 16: Brain OpenSearch Service

### Item

**Brain OpenSearch Service**  
**Location:** C:\Users\nolan\CascadeProjects\brain\infrastructure\docker\compose\docker-compose.yml  
**Container:** brain-opensearch  
**Port:** 9200:9200

### Defined

**YES.** OpenSearch service is defined in docker-compose.yml.

### Referenced

**NO.** No applications use Brain's OpenSearch service. No applications connect to OpenSearch.

### Executed

**NO.** No applications execute Brain's OpenSearch service. No OpenSearch service is used at runtime.

### Tested

**UNKNOWN.** No test evidence found.

### Classification

**CONSTITUTIONAL THEATER.** Brain's OpenSearch service is defined but not used by any application. It's infrastructure only.

---

## DEAD PRIMITIVE 17: Brain Tika Service

### Item

**Brain Tika Service**  
**Location:** C:\Users\nolan\CascadeProjects\brain\infrastructure\docker\compose\docker-compose.yml  
**Container:** brain-tika  
**Port:** 9998:9998

### Defined

**YES.** Tika service is defined in docker-compose.yml.

### Referenced

**NO.** No applications use Brain's Tika service. No applications connect to Tika.

### Executed

**NO.** No applications execute Brain's Tika service. No Tika service is used at runtime.

### Tested

**UNKNOWN.** No test evidence found.

### Classification

**CONSTITUTIONAL THEATER.** Brain's Tika service is defined but not used by any application. It's infrastructure only.

---

## DEAD PRIMITIVE 18: Brain Ollama Service

### Item

**Brain Ollama Service**  
**Location:** C:\Users\nolan\CascadeProjects\brain\infrastructure\docker\compose\docker-compose.yml  
**Container:** brain-ollama  
**Port:** 11434:11434

### Defined

**YES.** Ollama service is defined in docker-compose.yml.

### Referenced

**NO.** No applications use Brain's Ollama service. No applications connect to Brain's Ollama. Applications connect to crx-ollama-worker instead.

### Executed

**NO.** No applications execute Brain's Ollama service. No Brain Ollama service is used at runtime.

### Tested

**UNKNOWN.** No test evidence found.

### Classification

**CONSTITUTIONAL THEATER.** Brain's Ollama service is defined but not used by any application. It's infrastructure only.

---

## DEAD PRIMITIVE 19: Brain Open WebUI Service

### Item

**Brain Open WebUI Service**  
**Location:** C:\Users\nolan\CascadeProjects\brain\infrastructure\docker\compose\docker-compose.yml  
**Container:** brain-openwebui  
**Port:** 3000:8080

### Defined

**YES.** Open WebUI service is defined in docker-compose.yml.

### Referenced

**NO.** No applications use Brain's Open WebUI service. crx-ui-next is the canonical UI.

### Executed

**NO.** No applications execute Brain's Open WebUI service. No Brain Open WebUI service is used at runtime.

### Tested

**UNKNOWN.** No test evidence found.

### Classification

**CONSTITUTIONAL THEATER.** Brain's Open WebUI service is defined but not used by any application. It's obsolete.

---

## DEAD PRIMITIVE 20: Open WebUI (crx-digestion-worker)

### Item

**Open WebUI (crx-digestion-worker)**  
**Location:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\docker-compose.yml  
**Container:** open-webui  
**Port:** 3001:8080

### Defined

**YES.** Open WebUI service is defined in docker-compose.yml.

### Referenced

**NO.** No applications use Open WebUI service. crx-ui-next is the canonical UI.

### Executed

**NO.** No applications execute Open WebUI service. No Open WebUI service is used at runtime.

### Tested

**UNKNOWN.** No test evidence found.

### Classification

**CONSTITUTIONAL THEATER.** Open WebUI service is defined but not used by any application. It's obsolete.

---

## SUMMARY

### Dead Constitution Inventory

| Item | Defined | Referenced | Executed | Tested | Classification |
|------|---------|-----------|----------|--------|----------------|
| PING Replay Engine (30 TypeScript files) | YES | NO | NO | UNKNOWN | CONSTITUTIONAL THEATER |
| PING Artifact Store | YES | NO | NO | UNKNOWN | CONSTITUTIONAL THEATER |
| PING Commit Service | YES | NO | NO | UNKNOWN | CONSTITUTIONAL THEATER |
| Brain Canonical State Schema | YES | NO | NO | UNKNOWN | CONSTITUTIONAL THEATER |
| Brain Expanded Canonical State Schema | YES | NO | NO | UNKNOWN | CONSTITUTIONAL THEATER |
| Brain Projection Registry | YES | NO | NO | UNKNOWN | CONSTITUTIONAL THEATER |
| Brain Artifact Registry | YES | NO | NO | UNKNOWN | CONSTITUTIONAL THEATER |
| Brain Entities Table | YES | NO | NO | UNKNOWN | CONSTITUTIONAL THEATER |
| Brain Relationships Table | YES | NO | NO | UNKNOWN | CONSTITUTIONAL THEATER |
| Brain Qdrant Service | YES | NO | NO | UNKNOWN | CONSTITUTIONAL THEATER |
| Brain Neo4j Service | YES | NO | NO | UNKNOWN | CONSTITUTIONAL THEATER |
| Brain Temporal Service | YES | NO | NO | UNKNOWN | CONSTITUTIONAL THEATER |
| Brain Kafka Service | YES | NO | NO | UNKNOWN | CONSTITUTIONAL THEATER |
| Brain Zookeeper Service | YES | NO | NO | UNKNOWN | CONSTITUTIONAL THEATER |
| Brain DuckDB Service | YES | NO | NO | UNKNOWN | CONSTITUTIONAL THEATER |
| Brain OpenSearch Service | YES | NO | NO | UNKNOWN | CONSTITUTIONAL THEATER |
| Brain Tika Service | YES | NO | NO | UNKNOWN | CONSTITUTIONAL THEATER |
| Brain Ollama Service | YES | NO | NO | UNKNOWN | CONSTITUTIONAL THEATER |
| Brain Open WebUI Service | YES | NO | NO | UNKNOWN | CONSTITUTIONAL THEATER |
| Open WebUI (crx-digestion-worker) | YES | NO | NO | UNKNOWN | CONSTITUTIONAL THEATER |

### Critical Findings

1. **PING's replay engine is dead.** 30 TypeScript files define replay engine, witness authority, canonical state, and invariants. No applications use them. It's constitutional theater.

2. **PING's artifact store is dead.** artifact_store.ts and artifacts table are defined but not used by any application. It's constitutional theater.

3. **PING's commit service is dead.** commit-service is defined with commit and audit endpoints but not used by any application. It's constitutional theater.

4. **Brain's canonical state schemas are dead.** schema.sql and schema_expanded.sql are defined but not used at runtime. They're constitutional theater.

5. **Brain's registries are dead.** projection_registry and artifact_registry tables are defined but not used at runtime. They're constitutional theater.

6. **Brain's entities and relationships tables are dead.** entities and relationships tables are defined but not used at runtime. They're constitutional theater.

7. **Brain's services are dead.** Qdrant, Neo4j, Temporal, Kafka, Zookeeper, DuckDB, OpenSearch, Tika, Ollama, Open WebUI are defined but not used by any application. They're infrastructure only.

8. **Open WebUI is dead.** open-webui in crx-digestion-worker is defined but not used by any application. crx-ui-next is the canonical UI.

### Answer

**What unused primitives exist?**
- **PING:** Replay engine (30 TypeScript files), Artifact store, Commit service
- **Brain:** Canonical state schemas (schema.sql, schema_expanded.sql), Projection registry, Artifact registry, Entities table, Relationships table
- **Brain Services:** Qdrant, Neo4j, Temporal, Kafka, Zookeeper, DuckDB, OpenSearch, Tika, Ollama, Open WebUI
- **Applications:** Open WebUI (crx-digestion-worker)

**Classification:**
- **CONSTITUTIONAL THEATER:** All unused primitives are constitutional theater. They're defined but not used at runtime. They're documentation or infrastructure only.
