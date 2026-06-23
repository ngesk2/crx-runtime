# EXECUTION GRAPH REPORT

**Repository**: CRX (Constitutional Runtime eXtension)
**Analysis Date**: 2026-06-13
**Phase**: PHASE 1 — EXECUTION GRAPH RECONSTRUCTION

---

## EXECUTIVE SUMMARY

The CRX codebase is a monorepo with **3 active packages** in the pnpm workspace, plus **1 isolated Next.js project**. The actual runtime graph is significantly smaller than the file tree suggests.

**Actual Executing Services**: 2
- Gateway (Express proxy to Ollama)
- Commit Service (TypeScript Express with Postgres)

**Pure Libraries**: 1
- Runtime/Replay (TypeScript canonicalization kernel)

**Isolated Projects**: 1
- CascadeProjects/infra/ui-next (Next.js UI, not in workspace)

**Configuration-Only Artifacts**: 5
- Worker YAML files (no implementation)

---

## ACTUAL ENTRYPANTS

### 1. Gateway Service
**Location**: `gateway/server.js`
**Package**: `crx-gateway`
**Entrypoint**: `node server.js`
**Port**: 8080 (configurable via PORT env var)

**Execution Path**:
```
gateway/server.js
├── express (HTTP framework)
├── OLLAMA_URL env var → http://crx-ollama:11434
├── OLLAMA_MODEL env var → qwen2.5-coder:14b
└── fetch() → External Ollama service
```

**Endpoints**:
- `GET /health` - Health check
- `POST /api/v1/chat` - Chat proxy to Ollama
- `GET /api/v1/models` - Models list (hardcoded)

**Network Calls**:
- `POST ${OLLAMA_URL}/api/chat` → Ollama inference

**Persistence**: NONE (stateless proxy)

**Dependencies**:
- express@^4.18.2

**Dead Branches**: NONE (minimal implementation)

---

### 2. Commit Service
**Location**: `runtime/kernel/commit-service/src/server.ts`
**Package**: `commit-service`
**Entrypoint**: `ts-node src/server.ts`
**Port**: 8080 (hardcoded)

**Execution Path**:
```
runtime/kernel/commit-service/src/server.ts
├── express (HTTP framework)
├── ./api/commit_controller
│   ├── ./engines/identity_engine
│   │   ├── ./engines/canonical_engine
│   │   │   └── @crx/replay (CanonicalJson)
│   ├── ./validation/dag_validator
│   ├── ./persistence/artifact_store
│   ├── ./persistence/lineage_store
│   ├── ./events/event_log
│   └── ./utils/logger (pino)
└── ./api/audit_controller
    └── ./persistence/db (pg)
```

**Endpoints**:
- `POST /kernel/commit` - Commit artifact with lineage
- `GET /kernel/audit` - Audit artifacts (Postgres query)

**Network Calls**: NONE (local only)

**Persistence**:
- PostgreSQL via pg@^8.20.0
- Tables: artifacts, lineage_edges, execution_events
- Connection: DATABASE_URL env var

**Dependencies**:
- express@^5.2.1
- pg@^8.20.0
- pino@^9.5.0
- @crx/replay (workspace dependency)

**Dead Branches**: NONE (minimal implementation)

---

### 3. Runtime/Replay (Pure Library)
**Location**: `runtime/replay/index.ts`
**Package**: @crx/replay
**Type**: Pure TypeScript library (no infrastructure)

**Exports**:
- CanonicalJson
- CanonicalEventEnvelope
- CanonicalHashAuthority
- InvariantRunner
- ReplayInvariants
- ReplayEventStream
- ReplayStateMachine
- DeterministicReplayEngine
- ReplayVerification
- WitnessAuthority
- MerkleTree

**Dependencies**: NONE (pure TypeScript)

**Environment Variables**: NONE (by design)

**Network Calls**: NONE

**Persistence**: NONE

**Usage**: Imported by commit-service via canonical_engine.ts

---

### 4. Next.js UI (Isolated)
**Location**: `CascadeProjects/infra/ui-next/src/app/page.tsx`
**Package**: crx-ui-next
**Entrypoint**: `next dev -H 0.0.0.0`
**Port**: 3000 (default Next.js)

**Execution Path**:
```
CascadeProjects/infra/ui-next/src/app/
├── page.tsx (home)
├── chat/page.tsx (chat interface)
│   └── fetch('http://localhost:8080/api/v1/chat') → Gateway
└── api/health/route.ts (health check)
```

**Network Calls**:
- `POST http://localhost:8080/api/v1/chat` → Gateway

**Persistence**: NONE

**Dependencies**:
- next@^14.1.0
- react@^18.2.0
- react-dom@^18.2.0
- lucide-react@^0.344.0

**Dead Branches**: 
- ObservatoryMode component (not implemented)
- ArchitectureView component (not implemented)
- PromptLibrary component (not implemented)

---

## CONFIGURATION-ONLY ARTIFACTS (NOT EXECUTING)

### Worker YAML Files
**Location**: `workers/*.yaml`
**Files**:
- gateway-worker.yaml
- ollama-worker.yaml
- graph-worker.yaml
- artifact-worker.yaml
- research-worker.yaml

**Status**: CONFIGURATION ONLY
- No implementation code exists
- Reference Redis message queue (not running)
- Reference Neo4j (not running)
- Reference external services (not running)

**Classification**: THEATER / ABANDONED

---

## IMPORT GRAPH SUMMARY

### Gateway Imports
```
gateway/server.js
└── express (external)
```

### Commit Service Imports
```
runtime/kernel/commit-service/src/server.ts
├── express (external)
├── ./api/commit_controller
│   ├── express (external)
│   ├── ./engines/identity_engine
│   │   ├── crypto (node)
│   │   └── ./engines/canonical_engine
│   │       └── @crx/replay (workspace)
│   ├── ./validation/dag_validator
│   ├── ./persistence/artifact_store
│   │   └── ./persistence/db
│   │       └── pg (external)
│   ├── ./persistence/lineage_store
│   │   └── ./persistence/db
│   ├── ./events/event_log
│   │   └── ./persistence/db
│   └── ./utils/logger
│       └── pino (external)
└── ./api/audit_controller
    ├── express (external)
    └── ./persistence/db
        └── pg (external)
```

### Runtime/Replay Imports
```
runtime/replay/index.ts
└── (pure TypeScript, no external dependencies)
```

### Next.js UI Imports
```
CascadeProjects/infra/ui-next/src/app/
├── page.tsx
├── chat/page.tsx
│   ├── react (external)
│   ├── lucide-react (external)
│   └── (component imports - not implemented)
└── api/health/route.ts
    └── next/server (external)
```

---

## RUNTIME DEPENDENCIES

### External Dependencies (Runtime)
- express@^4.18.2 (gateway)
- express@^5.2.1 (commit-service)
- pg@^8.20.0 (commit-service)
- pino@^9.5.0 (commit-service)
- next@^14.1.0 (ui-next)
- react@^18.2.0 (ui-next)
- react-dom@^18.2.0 (ui-next)
- lucide-react@^0.344.0 (ui-next)

### Workspace Dependencies
- @crx/replay (imported by commit-service)

### Node Built-ins
- crypto (commit-service)
- fetch (gateway)

---

## NETWORK TOPOLOGY

### Actual Network Calls
1. **Next.js UI (port 3000)** → **Gateway (port 8080)**
   - `POST http://localhost:8080/api/v1/chat`

2. **Gateway (port 8080)** → **Ollama (port 11434)**
   - `POST http://crx-ollama:11434/api/chat`
   - Note: Uses Docker network name `crx-ollama`

### Declared But Not Running
- Redis (localhost:6379) - referenced in worker YAMLs
- Neo4j (localhost:7687) - referenced in graph-worker.yaml
- Research worker (port 8081) - not implemented
- Graph worker (port 8082) - not implemented
- Artifact worker (port 8083) - not implemented

---

## PERSISTENCE LAYER

### Active Persistence
- **PostgreSQL** (commit-service only)
  - Connection: DATABASE_URL env var
  - Tables: artifacts, lineage_edges, execution_events
  - Schema: `runtime/kernel/commit-service/src/persistence/ledger_schema.sql`

### Declared But Not Used
- Redis (message queue in worker YAMLs)
- Neo4j (graph database in graph-worker.yaml)
- Vector storage (referenced in artifact-worker.yaml)

---

## EXECUTED CODEPATHS

### Gateway: 100% Active
- All code in server.js is executed
- No dead branches

### Commit Service: 100% Active
- All code in src/ is executed
- No dead branches
- Minimal implementation

### Runtime/Replay: 100% Active (as library)
- All exports are used by commit-service
- No dead branches

### Next.js UI: ~60% Active
- page.tsx: Active
- chat/page.tsx: Active
- api/health/route.ts: Active
- Components: Referenced but not implemented (ObservatoryMode, ArchitectureView, PromptLibrary)

---

## UNUSED MODULES

### In Gateway
- NONE

### In Commit Service
- NONE

### In Runtime/Replay
- NONE

### In Next.js UI
- ObservatoryMode component (referenced, not implemented)
- ArchitectureView component (referenced, not implemented)
- PromptLibrary component (referenced, not implemented)
- EmptyStateRedesign component (referenced, not implemented)
- PremiumChatBubble component (referenced, not implemented)
- MissionControlHeader component (referenced, not implemented)
- MarkdownRenderer component (referenced, not implemented)
- MessageInput component (referenced, not implemented)

---

## SUMMARY

**Actual Runtime Graph Size**: Minimal
- 2 executing services (Gateway, Commit Service)
- 1 pure library (Runtime/Replay)
- 1 isolated UI (Next.js)

**Declared vs Actual Gap**: Significant
- 5 worker configurations with no implementation
- 3 infrastructure services declared but not running (Redis, Neo4j, vector storage)
- 8 React components referenced but not implemented

**Complexity Source**: Documentation and configuration, not code
- 45 audit reports in root
- 96% documentation, 4% runtime code (per knowledge/README.md)
- Architecture outrunning implementation

**Runtime Truth**: The system is a simple Ollama proxy with a Postgres-backed artifact commit service, wrapped in a Next.js UI. All other complexity is configuration-only or documentation.
