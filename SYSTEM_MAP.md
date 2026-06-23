# PHASE 2: SYSTEM MAP

**Audit Type:** BRAINOS + PING CONSTITUTIONAL CONSOLIDATION AUDIT  
**Repository Root:** C:\Users\nolan\PING  
**Mode:** READ ONLY, NO REFACTORING, NO PATCHES, NO IMPLEMENTATION, NO CODE CHANGES, NO ARCHITECTURE PROPOSALS YET  

---

## MAJOR SYSTEMS

### 1. PING Runtime

**Location:** runtime/  
**Subsystems:**
- runtime/adapters/ (config_adapter.ts, express_commit_adapter.ts, postgres_event_store.ts)
- runtime/kernel/commit-service/ (commit-service)
- runtime/replay/ (replay engine, witness authority, canonical state)

**Purpose:** Constitutional runtime for PING  
**Status:** HIGH (active)  
**Dependencies:**
- Depends on: database/ (PostgreSQL events table)
- Depends on: constitution/ (constitutional laws)
- Depends on: workers/ (worker definitions)

---

### 2. PING Gateway

**Location:** gateway/  
**Subsystems:**
- gateway/server.js (Express server)
- gateway/event_emitter.js (Event emission to PostgreSQL)

**Purpose:** Gateway server for PING  
**Status:** HIGH (active)  
**Dependencies:**
- Depends on: database/ (PostgreSQL events table)
- Depends on: runtime/adapters/ (postgres_event_store.ts)
- Depends on: infra/ollama/ (Ollama inference service - currently empty)

---

### 3. PING Kernel

**Location:** runtime/kernel/commit-service/  
**Subsystems:**
- runtime/kernel/commit-service/src/api/ (API endpoints)
- runtime/kernel/commit-service/src/engines/ (engines)
- runtime/kernel/commit-service/src/events/ (events)
- runtime/kernel/commit-service/src/models/ (models)
- runtime/kernel/commit-service/src/persistence/ (persistence)
- runtime/kernel/commit-service/src/server.ts (server)
- runtime/kernel/commit-service/src/validation/ (validation)

**Purpose:** PING Kernel commit service  
**Status:** LOW (not actively used)  
**Dependencies:**
- Depends on: database/ (PostgreSQL)
- Depends on: runtime/replay/ (replay engine)

---

### 4. PING Database

**Location:** database/  
**Subsystems:**
- database/events.sql (Events table schema)
- database/events_backup.sql (Events backup)
- database/events_retention.sql (Events retention)
- database/operational_intelligence.sql (Operational intelligence functions)

**Purpose:** PostgreSQL database schema and SQL scripts  
**Status:** HIGH (active)  
**Dependencies:**
- No dependencies (foundational)

---

### 5. PING Workers

**Location:** workers/  
**Subsystems:**
- workers/artifact-worker.yaml (Artifact worker)
- workers/gateway-worker.yaml (Gateway worker)
- workers/graph-worker.yaml (Graph worker)
- workers/ollama-worker.yaml (Ollama worker)
- workers/research-worker.yaml (Research worker)

**Purpose:** Worker definitions for PING  
**Status:** LOW (definitions only, not actively used)  
**Dependencies:**
- Depends on: runtime/ (PING Runtime)
- Depends on: gateway/ (PING Gateway)

---

### 6. PING Constitutional

**Location:** constitution/  
**Subsystems:**
- constitution/authority_model.md (Authority model)
- constitution/invariant_law.md (Invariant law)
- constitution/layer0_kernel.md (Layer 0 kernel)
- constitution/layering_law.md (Layering law)
- constitution/mutation_law.md (Mutation law)
- constitution/replay_law.md (Replay law)
- constitution/retrieval_law.md (Retrieval law)
- constitution/source_of_truth_law.md (Source of truth law)
- constitution/terminology.md (Terminology)
- constitution/witness_law.md (Witness law)

**Purpose:** Constitutional laws and authority models  
**Status:** HIGH (active)  
**Dependencies:**
- No dependencies (foundational)

---

### 7. PING Knowledge

**Location:** knowledge/  
**Subsystems:**
- knowledge/authoritative/ (39 files - authoritative knowledge)
- knowledge/derived/ (75 files - derived knowledge)
- knowledge/experimental/ (3 files - experimental knowledge)

**Purpose:** Knowledge base for PING  
**Status:** HIGH (active)  
**Dependencies:**
- Depends on: constitution/ (constitutional laws)
- Depends on: runtime/replay/ (replay engine)

---

### 8. PING Audit

**Location:** audit/  
**Subsystems:**
- audit/ (29 audit reports)

**Purpose:** Constitutional audit reports  
**Status:** HIGH (active)  
**Dependencies:**
- Depends on: constitution/ (constitutional laws)
- Depends on: runtime/ (PING Runtime)
- Depends on: database/ (PING Database)

---

### 9. PING VOS

**Location:** vos/  
**Subsystems:**
- vos/archive/ (archive manifest)
- vos/cos/ (VOS COS - architecture, constitution, structure, audit, checklists, engines, frameworks, governance, lifecycle, protocols, refactoring, schema, versioning)
- vos/proposals/ (proposals)
- vos/viz/ (visualization)

**Purpose:** Versioned Operating System (VOS)  
**Status:** LOW (not actively used, historical)  
**Dependencies:**
- Depends on: constitution/ (constitutional laws)
- Depends on: knowledge/ (knowledge base)

---

### 10. PING Infrastructure

**Location:** infra/  
**Subsystems:**
- infra/api/ (API infrastructure - empty)
- infra/observability/ (observability infrastructure - empty)
- infra/ollama/ (Ollama infrastructure - empty)
- infra/postgres/ (PostgreSQL infrastructure - empty)
- infra/redis/ (Redis infrastructure - empty)
- infra/scripts/ (scripts - empty)
- infra/volumes/ (volumes - empty)
- infra/worker/ (worker infrastructure - empty)

**Purpose:** Infrastructure definitions  
**Status:** LOW (empty, not used)  
**Dependencies:**
- No dependencies (empty)

---

### 11. PING Documentation

**Location:** docs/  
**Subsystems:**
- docs/adr/ (Architecture Decision Records)

**Purpose:** Documentation for PING  
**Status:** LOW (documentation)  
**Dependencies:**
- Depends on: constitution/ (constitutional laws)
- Depends on: runtime/replay/ (replay engine)

---

### 12. Cascade Projects

**Location:** CascadeProjects/  
**Subsystems:**
- CascadeProjects/constitutional-extraction-lab/ (constitutional extraction lab)
- CascadeProjects/infra/ (infrastructure projects)

**Purpose:** Cascade projects (not part of PING)  
**Status:** LOW (not part of PING)  
**Dependencies:**
- No dependencies (separate from PING)

---

## SYSTEM DEPENDENCY GRAPH

```
┌─────────────────────────────────────────────────────────────────┐
│                        FOUNDATIONAL LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  constitution/  │  database/  │  credentials/  │  .git/  │  .github/  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CONSTITUTIONAL LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│                 runtime/replay/  │  runtime/adapters/           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        KERNEL LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│              runtime/kernel/commit-service/                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│                    gateway/  │  workers/                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      KNOWLEDGE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│              knowledge/  │  audit/  │  docs/                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LEGACY LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│           vos/  │  artifacts/  │  infra/  │  workspace/          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│              CascadeProjects/  │  constitutional-integration-lab/ │
└─────────────────────────────────────────────────────────────────┘
```

---

## DEPENDENCY ANALYSIS

### Hard Dependencies (Cannot Function Without)

1. **gateway/ depends on:**
   - database/ (PostgreSQL events table)
   - runtime/adapters/ (postgres_event_store.ts)

2. **runtime/replay/ depends on:**
   - constitution/ (constitutional laws)
   - database/ (PostgreSQL events table)

3. **runtime/kernel/commit-service/ depends on:**
   - database/ (PostgreSQL)
   - runtime/replay/ (replay engine)

4. **audit/ depends on:**
   - constitution/ (constitutional laws)
   - runtime/ (PING Runtime)
   - database/ (PING Database)

5. **knowledge/ depends on:**
   - constitution/ (constitutional laws)
   - runtime/replay/ (replay engine)

### Soft Dependencies (Can Function Without)

1. **workers/ depends on:**
   - runtime/ (PING Runtime) - soft (definitions only)
   - gateway/ (PING Gateway) - soft (definitions only)

2. **docs/ depends on:**
   - constitution/ (constitutional laws) - soft (documentation)
   - runtime/replay/ (replay engine) - soft (documentation)

3. **vos/ depends on:**
   - constitution/ (constitutional laws) - soft (historical)
   - knowledge/ (knowledge base) - soft (historical)

### No Dependencies (Independent)

1. **constitution/** (foundational)
2. **database/** (foundational)
3. **credentials/** (independent)
4. **.git/** (independent)
5. **.github/** (independent)
6. **.cursor/** (independent)
7. **.docker/** (independent)
8. **infra/** (empty, no dependencies)
9. **workspace/** (empty, no dependencies)
10. **CascadeProjects/** (separate from PING)
11. **constitutional-integration-lab/** (empty, no dependencies)
12. **artifacts/** (empty, no dependencies)

---

## SYSTEM CLASSIFICATION

### Core Systems (Required for PING)

1. **constitution/** - Constitutional laws and authority models (foundational)
2. **database/** - PostgreSQL database schema (foundational)
3. **runtime/replay/** - Replay engine (constitutional)
4. **runtime/adapters/** - Adapters (constitutional)
5. **gateway/** - Gateway server (application)
6. **knowledge/** - Knowledge base (knowledge)
7. **audit/** - Audit reports (documentation)

### Supporting Systems (Optional for PING)

1. **runtime/kernel/commit-service/** - Kernel commit service (not actively used)
2. **workers/** - Worker definitions (definitions only)
3. **docs/** - Documentation (documentation)
4. **credentials/** - Client credentials (security)

### Legacy Systems (Historical)

1. **vos/** - Versioned Operating System (historical)
2. **artifacts/** - Architecture intelligence artifacts (historical)

### Empty Systems (Not Used)

1. **infra/** - Infrastructure definitions (empty)
2. **workspace/** - Workspace cache (empty)
3. **constitutional-integration-lab/** - Integration lab (empty)

### External Systems (Not Part of PING)

1. **CascadeProjects/** - Cascade projects (separate from PING)

---

## SUMMARY

### Total Systems: 12

### Core Systems (Required for PING): 7
- constitution/
- database/
- runtime/replay/
- runtime/adapters/
- gateway/
- knowledge/
- audit/

### Supporting Systems (Optional for PING): 4
- runtime/kernel/commit-service/
- workers/
- docs/
- credentials/

### Legacy Systems (Historical): 2
- vos/
- artifacts/

### Empty Systems (Not Used): 3
- infra/
- workspace/
- constitutional-integration-lab/

### External Systems (Not Part of PING): 1
- CascadeProjects/

### Dependency Graph Summary

**Foundational Layer:** constitution/, database/, credentials/, .git/, .github/  
**Constitutional Layer:** runtime/replay/, runtime/adapters/  
**Kernel Layer:** runtime/kernel/commit-service/  
**Application Layer:** gateway/, workers/  
**Knowledge Layer:** knowledge/, audit/, docs/  
**Legacy Layer:** vos/, artifacts/, infra/, workspace/  
**External Layer:** CascadeProjects/, constitutional-integration-lab/
