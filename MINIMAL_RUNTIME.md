# MINIMAL RUNTIME

**Repository**: CRX (Constitutional Runtime eXtension)
**Date**: 2026-06-13
**Authority**: EXECUTION TRUTH ONLY

---

## WHAT ACTUALLY RUNS

### Service 1: Gateway
**File**: `gateway/server.js`
**Port**: 8080 (configurable via PORT env var)
**Purpose**: HTTP proxy to Ollama inference service
**Dependencies**: express@^4.18.2

**Environment Variables**:
- `OLLAMA_URL` (default: `http://crx-ollama:11434`)
- `OLLAMA_MODEL` (default: `qwen2.5-coder:14b`)
- `PORT` (default: 8080)

**Endpoints**:
- `GET /health` - Health check
- `POST /api/v1/chat` - Chat proxy to Ollama
- `GET /api/v1/models` - Models list (hardcoded)

**Network Flow**:
- Receives: HTTP POST from Next.js UI
- Sends: HTTP POST to Ollama
- Timeout: 120 seconds (hardcoded)

**Startup**: `node server.js`

---

### Service 2: Commit Service
**File**: `runtime/kernel/commit-service/src/server.ts`
**Port**: 8080 (hardcoded)
**Purpose**: Artifact commit with PostgreSQL persistence
**Dependencies**: express@^5.2.1, pg@^8.20.0, pino@^9.5.0, @crx/replay

**Environment Variables**:
- `DATABASE_URL` (default: empty string - RISK)

**Endpoints**:
- `POST /kernel/commit` - Commit artifact with lineage
- `GET /kernel/audit` - Audit artifacts

**Database**: PostgreSQL (via pg)
- Tables: artifacts, lineage_edges, execution_events
- Schema: `runtime/kernel/commit-service/src/persistence/ledger_schema.sql`

**Library Usage**: Imports @crx/replay for canonicalization

**Startup**: `ts-node src/server.ts`

**Status**: STANDALONE (not integrated with chat flow)

---

### Service 3: Runtime/Replay
**File**: `runtime/replay/index.ts`
**Type**: Pure TypeScript library (no server)
**Purpose**: Canonicalization and replay primitives
**Dependencies**: NONE (pure TypeScript)

**Exports**:
- CanonicalJson
- CanonicalEventEnvelope
- CanonicalHashAuthority
- DeterministicReplayEngine
- ReplayVerification
- WitnessAuthority
- MerkleTree
- (and 18 other modules)

**Usage**: Imported by Commit Service only

**Status**: LIBRARY (not a service)

---

### Service 4: Next.js UI
**File**: `CascadeProjects/infra/ui-next/src/app/chat/page.tsx`
**Port**: 3000 (Next.js default)
**Purpose**: React frontend for chat interface
**Dependencies**: next@^14.1.0, react@^18.2.0, lucide-react@^0.344.0

**Environment Variables**: NONE (hardcoded localhost:8080)

**Endpoints**:
- `GET /` - Home page
- `GET /chat` - Chat interface
- `GET /api/health` - Health check

**Network Flow**:
- Sends: HTTP POST to `http://localhost:8080/api/v1/chat` (HARDCODED)

**Startup**: `next dev -H 0.0.0.0`

---

## ACTUAL EXECUTION FLOW

### Chat Request Path
```
Browser
  ↓ HTTP GET
Next.js UI (port 3000)
  ↓ User types message, clicks Send
HTTP POST to http://localhost:8080/api/v1/chat
  ↓
Gateway (port 8080)
  ↓ HTTP POST to http://crx-ollama:11434/api/chat
Ollama (port 11434, external)
  ↓ Response
Gateway
  ↓ Response
Next.js UI
  ↓ Render
Browser
```

### Commit Service Path
```
(NOT INTEGRATED WITH CHAT FLOW)

Direct HTTP calls to:
  POST http://localhost:8080/kernel/commit
  GET http://localhost:8080/kernel/audit
  ↓
Commit Service (port 8080)
  ↓
PostgreSQL (DATABASE_URL)
```

---

## ACTUAL PORTS

| Service | Port | Configurable | Conflict |
|---------|------|--------------|----------|
| Next.js UI | 3000 | No (Next.js default) | None |
| Gateway | 8080 | Yes (PORT env var) | YES with Commit Service |
| Commit Service | 8080 | No (hardcoded) | YES with Gateway |
| Ollama | 11434 | Yes (OLLAMA_URL env var) | None |

---

## ACTUAL ENVIRONMENT VARIABLES

| Variable | Service | Default | Consumed | Risk |
|----------|---------|---------|----------|------|
| OLLAMA_URL | Gateway | http://crx-ollama:11434 | YES | HIGH (DNS assumption) |
| OLLAMA_MODEL | Gateway | qwen2.5-coder:14b | YES | LOW |
| PORT | Gateway | 8080 | YES | LOW |
| DATABASE_URL | Commit Service | (empty) | YES | HIGH (empty default) |
| NEXT_PUBLIC_GATEWAY_URL | Next.js UI | (not defined) | NO | HIGH (hardcoded localhost) |

---

## ACTUAL DEPENDENCIES

### Gateway
- express@^4.18.2

### Commit Service
- express@^5.2.1
- pg@^8.20.0
- pino@^9.5.0
- @crx/replay (workspace)

### Runtime/Replay
- NONE (pure TypeScript)

### Next.js UI
- next@^14.1.0
- react@^18.2.0
- react-dom@^18.2.0
- lucide-react@^0.344.0

---

## ACTUAL RUNTIME RELATIONSHIPS

```
Next.js UI
  ↓ HTTP POST (localhost:8080)
Gateway
  ↓ HTTP POST (crx-ollama:11434)
Ollama (external)

Commit Service
  ↓ pg
PostgreSQL (external)

Commit Service
  ↓ import
Runtime/Replay (library)
```

---

## WHAT DOES NOT RUN

### Never Implemented
- Redis (referenced in worker YAMLs only)
- Neo4j (referenced in worker YAMLs only)
- Vector storage (referenced in worker YAMLs only)
- Distributed workers (worker YAMLs only)
- Multi-agent system (documentation only)
- Research ingestion (worker YAMLs only)
- Graph database (worker YAMLs only)
- ADR generation (worker YAMLs only)

### Designed But Never Used
- runtime/adapters/config_adapter.ts
- runtime/adapters/express_commit_adapter.ts
- runtime/adapters/postgres_event_store.ts

### Standalone (Not in Chat Flow)
- Commit Service (has separate endpoints, not called by UI)

---

## SMALLEST TRUTHFUL EXPLANATION

**CRX is a simple HTTP proxy chain:**

1. **Next.js UI** (React frontend on port 3000) displays a chat interface
2. **Gateway** (Express on port 8080) proxies chat requests to Ollama
3. **Ollama** (external service on port 11434) provides LLM inference
4. **Commit Service** (Express on port 8080) provides artifact storage with PostgreSQL (standalone, not integrated with chat)
5. **Runtime/Replay** (TypeScript library) provides canonicalization functions used by Commit Service

**That's it.**

No Redis. No Neo4j. No vector storage. No distributed workers. No multi-agent system. No message queues. No orchestration.

The repository contains extensive documentation and configuration describing systems that were never implemented. The actual runtime is minimal and functional.

---

## CRITICAL RISKS

1. **Hardcoded localhost**: Next.js UI hardcodes `http://localhost:8080` (will fail in containerized deployment)
2. **Docker DNS assumption**: Gateway defaults to `http://crx-ollama:11434` (will fail without Docker network)
3. **Empty DATABASE_URL**: Commit Service defaults to empty string (will fail if not set)
4. **Port conflict**: Gateway and Commit Service both use port 8080 (cannot run simultaneously)

---

## MINIMAL VIABLE ARCHITECTURE

```
┌─────────────┐
│ Next.js UI  │
│   :3000     │
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────┐
│  Gateway    │
│   :8080     │
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────┐
│   Ollama    │
│  :11434     │
└─────────────┘

┌─────────────┐
│ Commit Svc  │
│   :8080     │
└──────┬──────┘
       │ pg
       ▼
┌─────────────┐
│ PostgreSQL  │
└─────────────┘
```

**Total Services**: 4 (Gateway, Commit Service, Next.js UI, Ollama)
**Total Libraries**: 1 (Runtime/Replay)
**Total Dependencies**: 8 direct dependencies
**Total Environment Variables**: 4 (with 1 critical missing)
