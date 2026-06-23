# RECOMMENDED STRUCTURE

**Repository**: CRX (Constitutional Runtime eXtension)
**Date**: 2026-06-13
**Authority**: EXECUTION TRUTH ONLY

---

## DESIGN PRINCIPLES

**Target**:
- Understandable in 2 minutes
- Obvious runtime boundaries
- No fake infrastructure
- No museum directories
- No abandoned abstractions
- No architecture cosplay

**Prefer**:
- Fewer directories
- Flatter structure
- Explicit naming
- Runtime-first organization

---

## CURRENT STRUCTURE (PROBLEMATIC)

```
CRX/
├── gateway/                          # ACTUAL: Gateway service
├── runtime/
│   ├── kernel/commit-service/        # ACTUAL: Commit service
│   ├── replay/                       # ACTUAL: Replay library
│   └── adapters/                     # DEAD: Never used
├── CascadeProjects/                  # CONFUSING: Separate project?
│   └── infra/
│       └── ui-next/                  # ACTUAL: Next.js UI
├── workers/                          # DEAD: Configuration only
├── knowledge/                       # DEAD: Documentation only
├── constitution/                     # DEAD: Reference only
├── vos/                              # DEAD: Empty
├── constitutional-integration-lab/   # DEAD: Empty
├── infra/                            # DEAD: Empty subdirs
├── [45 audit reports]               # DEAD: Documentation
└── [config files]                    # DEAD: Not used
```

**Problems**:
- CascadeProjects/ suggests separate project but is part of monorepo
- runtime/ suggests kernel vs non-kernel distinction (not real)
- workers/ suggests distributed system (not real)
- knowledge/, constitution/, vos/ suggest complex architecture (not real)
- infra/ suggests infrastructure layer (empty)
- 85% of directories are non-executing

---

## RECOMMENDED STRUCTURE (MINIMAL)

```
CRX/
├── services/
│   ├── gateway/
│   │   ├── server.js
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── .env.example
│   ├── commit-service/
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── api/
│   │   │   ├── engines/
│   │   │   ├── persistence/
│   │   │   ├── validation/
│   │   │   ├── events/
│   │   │   ├── utils/
│   │   │   └── models/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── Dockerfile
│   │   └── .env.example
│   └── ui/
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx
│       │   │   ├── chat/
│       │   │   ├── layout.tsx
│       │   │   ├── globals.css
│       │   │   └── api/
│       │   └── components/
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.js
│       ├── tailwind.config.js
│       ├── Dockerfile
│       └── .env.example
├── libraries/
│   └── replay/
│       ├── *.ts (25 files)
│       ├── package.json
│       └── tsconfig.json
├── archive/
│   ├── constitution/
│   ├── knowledge/
│   ├── audits/
│   ├── vos/
│   └── config/
├── package.json
├── pnpm-workspace.yaml
├── README.md
├── .env.example
└── docker-compose.yml
```

---

## STRUCTURE RATIONALE

### services/ Directory
**Purpose**: All executing services
**Explicit**: Clear that these are runtime services
**Flat**: No nested "kernel" or "infra" distinctions
**Obvious**: Anyone can see what runs in 2 minutes

**Contents**:
- `gateway/` - HTTP proxy to Ollama
- `commit-service/` - Artifact commit with Postgres
- `ui/` - Next.js frontend

---

### libraries/ Directory
**Purpose**: Pure libraries (no servers)
**Explicit**: Clear that these are libraries, not services
**Separation**: Distinguishes services from libraries

**Contents**:
- `replay/` - Canonicalization library

---

### archive/ Directory
**Purpose**: Non-runtime content (documentation, configs)
**Explicit**: Clear that this is archived content
**Accessible**: Still available if needed, but separated from runtime

**Contents**:
- `constitution/` - Constitutional documents
- `knowledge/` - Knowledge base
- `audits/` - Audit reports
- `vos/` - VOS documentation
- `config/` - Configuration files

---

### Root Files
**Purpose**: Repository-level configuration
**Minimal**: Only essential files in root

**Contents**:
- `package.json` - Workspace configuration
- `pnpm-workspace.yaml` - Workspace definition
- `README.md` - Runtime documentation
- `.env.example` - Environment variable template
- `docker-compose.yml` - Container orchestration (NEW)

---

## MAPPING FROM CURRENT TO RECOMMENDED

### Current → Recommended

| Current Path | Recommended Path | Reason |
|--------------|------------------|--------|
| gateway/ | services/gateway/ | Explicit service location |
| runtime/kernel/commit-service/ | services/commit-service/ | Remove "kernel" distinction |
| runtime/replay/ | libraries/replay/ | Explicit library location |
| CascadeProjects/infra/ui-next/ | services/ui/ | Remove confusing CascadeProjects path |
| [archived content] | archive/ | Centralized archive location |

---

## WORKSPACE CONFIGURATION

### Updated pnpm-workspace.yaml
```yaml
packages:
  - 'services/*'
  - 'libraries/*'
```

### Updated package.json (root)
```json
{
  "name": "crx-monorepo",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev:gateway": "cd services/gateway && npm start",
    "dev:commit": "cd services/commit-service && npm run dev",
    "dev:ui": "cd services/ui && npm run dev",
    "build:commit": "cd services/commit-service && npm run build",
    "build:ui": "cd services/ui && npm run build",
    "start:gateway": "cd services/gateway && npm start",
    "start:commit": "cd services/commit-service && npm start",
    "start:ui": "cd services/ui && npm start"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

---

## DOCKER COMPOSE (NEW)

### docker-compose.yml
```yaml
version: '3.8'

services:
  gateway:
    build: ./services/gateway
    ports:
      - "8080:8080"
    environment:
      - OLLAMA_URL=http://ollama:11434
      - OLLAMA_MODEL=qwen2.5-coder:14b
      - PORT=8080
    depends_on:
      - ollama
    networks:
      - crx-network

  commit-service:
    build: ./services/commit-service
    ports:
      - "8081:8081"
    environment:
      - DATABASE_URL=postgresql://crx:crx@postgres:5432/crx
      - PORT=8081
    depends_on:
      - postgres
    networks:
      - crx-network

  ui:
    build: ./services/ui
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_GATEWAY_URL=http://gateway:8080
    depends_on:
      - gateway
    networks:
      - crx-network

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama
    networks:
      - crx-network

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=crx
      - POSTGRES_PASSWORD=crx
      - POSTGRES_DB=crx
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - crx-network

networks:
  crx-network:
    driver: bridge

volumes:
  ollama-data:
  postgres-data:
```

**Rationale**: Provides actual container orchestration (currently missing). Resolves Docker DNS assumptions. Resolves port conflicts.

---

## ENVIRONMENT VARIABLE TEMPLATES

### services/gateway/.env.example
```bash
# Ollama Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:14b

# Server Configuration
PORT=8080
```

### services/commit-service/.env.example
```bash
# Database Configuration
DATABASE_URL=postgresql://crx:crx@localhost:5432/crx

# Server Configuration
PORT=8081
```

### services/ui/.env.example
```bash
# Gateway Configuration
NEXT_PUBLIC_GATEWAY_URL=http://localhost:8080
```

### .env.example (root)
```bash
# Gateway Service
GATEWAY_OLLAMA_URL=http://localhost:11434
GATEWAY_OLLAMA_MODEL=qwen2.5-coder:14b
GATEWAY_PORT=8080

# Commit Service
COMMIT_DATABASE_URL=postgresql://crx:crx@localhost:5432/crx
COMMIT_PORT=8081

# UI Service
UI_GATEWAY_URL=http://localhost:8080
```

---

## README.md (UPDATED)

### services/gateway/README.md
```markdown
# Gateway Service

HTTP proxy to Ollama inference service.

## Environment Variables
- `OLLAMA_URL`: Ollama API endpoint (default: http://localhost:11434)
- `OLLAMA_MODEL`: Ollama model name (default: qwen2.5-coder:14b)
- `PORT`: Server port (default: 8080)

## Endpoints
- `GET /health` - Health check
- `POST /api/v1/chat` - Chat proxy to Ollama
- `GET /api/v1/models` - Models list

## Development
```bash
npm install
npm start
```

## Docker
```bash
docker build -t crx-gateway .
docker run -p 8080:8080 -e OLLAMA_URL=http://host.docker.internal:11434 crx-gateway
```
```

### services/commit-service/README.md
```markdown
# Commit Service

Artifact commit service with PostgreSQL persistence.

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (REQUIRED)
- `PORT`: Server port (default: 8081)

## Endpoints
- `GET /health` - Health check
- `POST /kernel/commit` - Commit artifact with lineage
- `GET /kernel/audit` - Audit artifacts

## Development
```bash
npm install
npm run dev
```

## Docker
```bash
docker build -t crx-commit-service .
docker run -p 8081:8081 -e DATABASE_URL=postgresql://... crx-commit-service
```
```

### services/ui/README.md
```markdown
# UI Service

Next.js frontend for CRX chat interface.

## Environment Variables
- `NEXT_PUBLIC_GATEWAY_URL`: Gateway URL (default: http://localhost:8080)

## Development
```bash
npm install
npm run dev
```

## Docker
```bash
docker build -t crx-ui .
docker run -p 3000:3000 -e NEXT_PUBLIC_GATEWAY_URL=http://gateway:8080 crx-ui
```
```

### libraries/replay/README.md
```markdown
# Replay Library

Pure TypeScript library for canonicalization and replay primitives.

## Usage
```typescript
import { CanonicalJson, DeterministicReplayEngine } from '@crx/replay';
```

## Development
```bash
npm install
npm run build
```
```

### README.md (root)
```markdown
# CRX

Simple HTTP proxy chain for LLM inference with artifact persistence.

## Architecture
```
UI (Next.js) → Gateway (Express) → Ollama
Commit Service (Express) → PostgreSQL
```

## Services
- **Gateway**: HTTP proxy to Ollama (port 8080)
- **Commit Service**: Artifact persistence (port 8081)
- **UI**: Next.js frontend (port 3000)
- **Replay**: Canonicalization library

## Quick Start
```bash
# Start all services
docker-compose up

# Or start individually
cd services/gateway && npm start
cd services/commit-service && npm run dev
cd services/ui && npm run dev
```

## Environment Variables
See `.env.example` for required environment variables.

## Documentation
- `MINIMAL_RUNTIME.md` - Runtime architecture
- `RUNTIME_HARDENING.md` - Hardening plan
- `archive/` - Archived documentation
```

---

## MIGRATION COMMANDS

### Step 1: Create new structure
```bash
mkdir -p services
mkdir -p libraries
mkdir -p archive
```

### Step 2: Move services
```bash
mv gateway services/gateway
mv runtime/kernel/commit-service services/commit-service
mv CascadeProjects/infra/ui-next services/ui
```

### Step 3: Move library
```bash
mv runtime/replay libraries/replay
```

### Step 4: Archive content
```bash
mv constitution archive/
mv knowledge archive/
mv vos archive/
mv *.md archive/audits/  # except README.md
```

### Step 5: Clean up
```bash
rm -rf runtime/
rm -rf CascadeProjects/
rm -rf workers/
rm -rf infra/
rm -rf constitutional-integration-lab/
```

### Step 6: Update workspace config
```bash
# Update pnpm-workspace.yaml
# Update package.json
```

---

## BENEFITS

### Understandability
- 2-minute understanding: services/ contains everything that runs
- No confusion about what is runtime vs documentation
- Explicit naming (services vs libraries vs archive)

### Maintainability
- Flat structure reduces cognitive load
- No nested "kernel" or "infra" abstractions
- Clear separation of concerns

### Onboarding
- New developers see actual structure immediately
- No need to sift through 85% non-executing content
- Clear entry points for each service

### Operational
- docker-compose.yml provides actual orchestration
- Environment variables centralized in .env.example
- Port conflicts resolved

---

## ESTIMATED EFFORT

- Directory restructuring: 1-2 hours
- Update workspace config: 30 minutes
- Update README files: 1 hour
- Create docker-compose.yml: 1 hour
- Test all services: 1-2 hours

**Total**: 4-6 hours

---

## WHAT THIS ACHIEVES

**Clarity**: Repository structure matches actual runtime
**Simplicity**: Removes fake infrastructure and abstractions
**Operability**: Provides actual container orchestration
**Onboarding**: New developers understand structure in 2 minutes
**Maintenance**: Clear boundaries between services, libraries, and archive

**Does NOT achieve**:
- Future scale (not needed)
- Theoretical architecture (not needed)
- Perfect abstractions (not needed)

**Goal**: Align repository with runtime truth.
