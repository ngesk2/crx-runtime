# PHASE2_SYSTEM_DEPENDENCY_GRAPH.md

**Audit Type:** SYSTEM DEPENDENCY GRAPH  
**Audit Date:** 2025-01-18  
**Repository Root:** C:\Users\nolan\PING  
**Status:** PHASE 2 COMPLETE  

---

## EXECUTIVE SUMMARY

**Total Major Systems:** 7  
**Constitutional Systems:** 3 (PING Runtime, PING Gateway, PING Database)  
**Separate Systems:** 2 (KnowledgeOS, VOS)  
**Infrastructure Systems:** 2 (Workers, Infrastructure)  

**Dependency Direction:**
- Applications depend on PING Runtime
- PING Runtime depends on nothing (pure TypeScript)
- PING Gateway depends on PING Runtime (for canonicalization)
- Workers depend on PING Gateway
- KnowledgeOS and VOS are independent systems

**Critical Finding:** PING Runtime (replay/) is designed to be infrastructure-independent. Adapters layer provides infrastructure connectivity.

---

## SYSTEM DEPENDENCY GRAPH

```
┌─────────────────────────────────────────────────────────────────┐
│                         APPLICATIONS                              │
│  (External: crx-newsletter-brain, crx-digestion-worker, etc.)    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ depends on
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      PING GATEWAY                                 │
│  gateway/server.js, gateway/event_emitter.js                      │
│  - Express server                                                 │
│  - Ollama routing                                                 │
│  - Event emission to PostgreSQL                                   │
└─────────┬───────────────────────┬────────────────────────────────┘
          │                       │
          │ depends on            │ depends on
          ↓                       ↓
┌──────────────────────┐  ┌──────────────────────────────────────┐
│  PING RUNTIME/REPLAY  │  │         POSTGRESQL DATABASE          │
│  runtime/replay/      │  │  database/events.sql                 │
│  - Pure TypeScript    │  │  - Events table                      │
│  - No dependencies    │  │  - Operational intelligence          │
│  - Canonicalization   │  │  - Raw payloads                      │
│  - Replay engine      │  │  - Dead letters                      │
└──────────┬───────────┘  └──────────────────────────────────────┘
           │
           │ depends on (via adapters)
           ↓
┌─────────────────────────────────────────────────────────────────┐
│                  RUNTIME ADAPTERS                                  │
│  runtime/adapters/                                                │
│  - postgres_event_store.ts                                       │
│  - express_commit_adapter.ts                                     │
│  - config_adapter.ts                                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    PING KERNEL/COMMIT-SERVICE                     │
│  runtime/kernel/commit-service/                                   │
│  - Express server (port 8080)                                    │
│  - Commit API                                                    │
│  - Artifact storage                                              │
│  - Lineage validation                                            │
└─────────┬────────────────────────────────────────────────────────┘
          │
          │ depends on
          ↓
┌─────────────────────────────────────────────────────────────────┐
│                  POSTGRESQL DATABASE                              │
│  (shared with Gateway)                                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      WORKERS                                      │
│  workers/*.yaml                                                   │
│  - ollama-worker.yaml                                            │
│  - gateway-worker.yaml                                           │
│  - research-worker.yaml                                          │
│  - graph-worker.yaml                                             │
│  - artifact-worker.yaml                                          │
└─────────┬────────────────────────────────────────────────────────┘
          │
          │ depends on
          ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PING GATEWAY                                   │
│  (for orchestration)                                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    KNOWLEDGEOS                                    │
│  knowledge/                                                       │
│  - Independent system                                             │
│  - Own governance model                                           │
│  - No dependencies on PING                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      VOS                                           │
│  vos/                                                             │
│  - Independent system                                             │
│  - Own governance model (COS)                                    │
│  - No dependencies on PING                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## SYSTEM DEFINITIONS

### System 1: PING Runtime/Replay

**Purpose:** Constitutional replay kernel - pure TypeScript implementation of canonicalization, deterministic replay, witness authority  
**Location:** `runtime/replay/`  
**Primary Language:** TypeScript  
**Dependencies:** NONE (pure TypeScript, no infrastructure dependencies)  
**Dependents:** PING Gateway (via adapters), PING Kernel/Commit-Service (via adapters)  
**Status:** ACTIVE (Layer 0 - Constitutional Runtime)  

**Key Components:**
- `canonical_json.ts` - JSON canonicalization
- `canonical_event_envelope.ts` - Event envelope
- `canonical_hash_authority.ts` - Hash authority (SHA256)
- `deterministic_replay_engine.ts` - Deterministic replay
- `witness_authority.ts` - Witness authority (Merkle tree)
- `merkle_tree.ts` - Merkle tree implementation
- `replay_types.ts` - Type definitions
- `replay_verification.ts` - Replay verification
- `invariant_runner.ts` - Invariant checking

**Evidence:**
- `runtime/replay/index.ts` exports pure TypeScript modules
- `runtime/replay/index.ts` comment: "No infrastructure dependencies. No environment variable access. No process/global mutation."

### System 2: PING Gateway

**Purpose:** Gateway service for inference routing and event recording  
**Location:** `gateway/`  
**Primary Language:** JavaScript  
**Dependencies:** PostgreSQL (for event storage), Ollama (for inference)  
**Dependents:** External applications, Workers  
**Status:** ACTIVE (Layer 0 - Gateway)  

**Key Components:**
- `server.js` - Express server with Ollama routing (517 lines)
- `event_emitter.js` - Constitutional event emitter (171 lines)

**Evidence:**
- `gateway/server.js` line 3: imports from `event_emitter.js`
- `gateway/server.js` line 4: imports `pg` (PostgreSQL)
- `gateway/event_emitter.js` line 10: imports `pg` (PostgreSQL)
- `gateway/server.js` line 39-43: Ollama URL and model configuration

### System 3: PING Kernel/Commit-Service

**Purpose:** Commit service for artifact storage and lineage validation  
**Location:** `runtime/kernel/commit-service/`  
**Primary Language:** TypeScript  
**Dependencies:** PostgreSQL (for storage), Express (for API)  
**Dependents:** None (standalone service)  
**Status:** ACTIVE (Layer 0 - Kernel)  

**Key Components:**
- `src/server.ts` - Express server (port 8080)
- `src/api/commit_controller.ts` - Commit API
- `src/api/audit_controller.ts` - Audit API
- `src/engines/identity_engine.ts` - Identity engine
- `src/engines/canonical_engine.ts` - Canonical engine
- `src/persistence/artifact_store.ts` - Artifact storage
- `src/persistence/lineage_store.ts` - Lineage storage
- `src/persistence/db.ts` - PostgreSQL connection
- `src/persistence/ledger_schema.sql` - Ledger schema
- `src/validation/dag_validator.ts` - DAG validation

**Evidence:**
- `runtime/kernel/commit-service/src/server.ts` line 2: imports from `commit_controller`
- `runtime/kernel/commit-service/src/api/commit_controller.ts` line 2: imports from `identity_engine`
- `runtime/kernel/commit-service/src/persistence/db.ts` line 1: imports `pg` (PostgreSQL)

### System 4: PING Database

**Purpose:** Constitutional event storage and operational intelligence  
**Location:** `database/`  
**Primary Language:** SQL  
**Dependencies:** PostgreSQL (database engine)  
**Dependents:** PING Gateway, PING Kernel/Commit-Service  
**Status:** ACTIVE (Layer 0 - Database)  

**Key Components:**
- `events.sql` - Events table schema (append-only)
- `events_backup.sql` - Events backup schema
- `events_retention.sql` - Retention policy
- `operational_intelligence.sql` - Operational intelligence functions

**Evidence:**
- `database/events.sql` line 6: CREATE TABLE events
- `database/operational_intelligence.sql` line 58: CREATE TABLE raw_payloads
- `database/operational_intelligence.sql` line 232: CREATE TABLE dead_letters
- `database/operational_intelligence.sql` line 261: CREATE TABLE knowledge_metrics

### System 5: Workers

**Purpose:** Kubernetes worker configurations for distributed processing  
**Location:** `workers/`  
**Primary Language:** YAML  
**Dependencies:** PING Gateway (for orchestration), Redis (for message queue)  
**Dependents:** None (infrastructure)  
**Status:** ACTIVE (Infrastructure)  

**Key Components:**
- `ollama-worker.yaml` - Ollama inference worker
- `gateway-worker.yaml` - Gateway orchestration worker
- `research-worker.yaml` - Research worker
- `graph-worker.yaml` - Graph worker
- `artifact-worker.yaml` - Artifact worker

**Evidence:**
- `workers/ollama-worker.yaml` line 21-24: Redis message queue configuration
- `workers/gateway-worker.yaml` line 22-25: Redis message queue configuration
- `workers/gateway-worker.yaml` line 27-35: Worker endpoint configuration

### System 6: KnowledgeOS

**Purpose:** Knowledge system with authoritative/derived/experimental structure  
**Location:** `knowledge/`  
**Primary Language:** Markdown, JSON  
**Dependencies:** NONE (independent system)  
**Dependents:** None (independent system)  
**Status:** ACTIVE (Separate System)  

**Key Components:**
- `authoritative/` - 36 authoritative documents
- `derived/` - 67 derived documents
- `experimental/` - 3 experimental documents
- `inventory.json` - Workspace inventory

**Evidence:**
- `knowledge/README.md` line 5: "CRX KnowledgeOS - Workspace Architecture"
- `knowledge/README.md` line 16-18: Three-tier authority structure
- No imports from PING runtime or gateway

### System 7: VOS (Visual/Cognitive OS)

**Purpose:** Cognitive Operating System (COS) and Visual OS (VOS) for governance  
**Location:** `vos/`  
**Primary Language:** Markdown, JSON  
**Dependencies:** NONE (independent system)  
**Dependents:** None (independent system)  
**Status:** ACTIVE (Separate System)  

**Key Components:**
- `vos/cos/` - Cognitive OS (ACTIVE, 50 files)
- `vos/viz/` - Visual OS (FROZEN, diagrams)
- `vos/proposals/` - Proposals

**Evidence:**
- `vos/README.md` line 3: "Constitutional stack for the CRX technical channel"
- `vos/README.md` line 6-8: COS governs thinking, VOS governs diagrams
- No imports from PING runtime or gateway

---

## DEPENDENCY MATRIX

| System | Depends On | Dependents | Constitutional Status |
|--------|------------|------------|---------------------|
| PING Runtime/Replay | NONE | PING Gateway (via adapters), PING Kernel/Commit-Service (via adapters) | YES (Layer 0) |
| PING Gateway | PING Runtime (via adapters), PostgreSQL, Ollama | External Applications, Workers | YES (Layer 0) |
| PING Kernel/Commit-Service | PostgreSQL, Express | None | YES (Layer 0) |
| PING Database | PostgreSQL (engine) | PING Gateway, PING Kernel/Commit-Service | YES (Layer 0) |
| Workers | PING Gateway, Redis | None | NO (Infrastructure) |
| KnowledgeOS | NONE | None | NO (Separate System) |
| VOS | NONE | None | NO (Separate System) |

---

## ADAPTER LAYER

### Purpose

The adapter layer provides infrastructure connectivity to the pure PING Runtime. This allows PING Runtime to remain infrastructure-independent while still being usable in production.

### Components

**runtime/adapters/postgres_event_store.ts**
- Purpose: PostgreSQL event storage adapter
- Depends on: PING Runtime (replay/), PostgreSQL
- Evidence: Line 9-10 imports from `../replay/canonical_event_envelope` and `../replay/replay_event_stream`

**runtime/adapters/express_commit_adapter.ts**
- Purpose: Express commit API adapter
- Depends on: PING Runtime (replay/), Express
- Evidence: File exists (not read yet)

**runtime/adapters/config_adapter.ts**
- Purpose: Configuration adapter
- Depends on: PING Runtime (replay/)
- Evidence: File exists (not read yet)

### Dependency Direction

```
PING Runtime (pure TypeScript)
  ↓
Adapters (infrastructure-specific)
  ↓
Infrastructure (PostgreSQL, Express, Redis, etc.)
```

**Critical Design:** PING Runtime NEVER depends on adapters. Adapters depend on PING Runtime. This ensures PING Runtime remains pure and testable.

---

## INFRASTRUCTURE DEPENDENCIES

### PostgreSQL

**Used By:**
- PING Gateway (event_emitter.js)
- PING Kernel/Commit-Service (db.ts)
- PING Database (schemas)

**Purpose:**
- Event storage (events table)
- Artifact storage (artifacts table)
- Lineage storage (lineage_edges table)
- Operational intelligence (raw_payloads, dead_letters, knowledge_metrics)

**Evidence:**
- `gateway/event_emitter.js` line 10: `const { Pool } = require('pg')`
- `runtime/kernel/commit-service/src/persistence/db.ts` line 1: `import { Pool } from 'pg'`

### Ollama

**Used By:**
- PING Gateway (server.js)

**Purpose:**
- Inference routing
- Model selection (7B vs 14B)

**Evidence:**
- `gateway/server.js` line 39-43: Ollama URL and model configuration

### Redis

**Used By:**
- Workers (YAML configs)

**Purpose:**
- Message queue for worker coordination

**Evidence:**
- `workers/ollama-worker.yaml` line 21-24: Redis configuration
- `workers/gateway-worker.yaml` line 22-25: Redis configuration

### Express

**Used By:**
- PING Gateway (server.js)
- PING Kernel/Commit-Service (server.ts)

**Purpose:**
- HTTP server for API endpoints

**Evidence:**
- `gateway/server.js` line 1: `const express = require('express')`
- `runtime/kernel/commit-service/src/server.ts` line 1: `import express from "express"`

---

## EXTERNAL DEPENDENCIES

### External Applications

**Evidence from Phase 1 Audit (crx-newsletter-brain):**
- `crx-newsletter-brain` imports from Brain's event_emitter.py (should use PING's event_emitter.js)
- `crx-digestion-worker` imports from Brain's event_emitter.py (should use PING's event_emitter.js)

**Current Dependency:**
- Applications → Brain's duplicate event_emitter.js (WRONG)

**Target Dependency:**
- Applications → PING's event_emitter.js (CORRECT)

---

## SUMMARY

### Constitutional Systems (Layer 0)

| System | Purpose | Dependencies | Status |
|--------|---------|--------------|--------|
| PING Runtime/Replay | Constitutional replay kernel | NONE | ACTIVE |
| PING Gateway | Gateway service | PING Runtime, PostgreSQL, Ollama | ACTIVE |
| PING Kernel/Commit-Service | Commit service | PostgreSQL, Express | ACTIVE |
| PING Database | Event storage | PostgreSQL (engine) | ACTIVE |

### Separate Systems

| System | Purpose | Dependencies | Status |
|--------|---------|--------------|--------|
| KnowledgeOS | Knowledge system | NONE | ACTIVE |
| VOS | Cognitive/Visual OS | NONE | ACTIVE |

### Infrastructure Systems

| System | Purpose | Dependencies | Status |
|--------|---------|--------------|--------|
| Workers | Worker configurations | PING Gateway, Redis | ACTIVE |

### Critical Design Pattern

**PING Runtime is infrastructure-independent:**
- Pure TypeScript
- No environment variables
- No process/global mutation
- Adapters provide infrastructure connectivity

**Dependency Direction:**
```
Applications → PING Gateway → PING Runtime (pure) → Adapters → Infrastructure
```

**PING Runtime NEVER depends on infrastructure.**
