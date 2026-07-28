#!/bin/bash

# CRX CONVERGENCE CLEANUP SCRIPT
# Date: 2026-06-13
# Purpose: Restructure repository to align with runtime truth
# WARNING: This script makes destructive changes. Review before executing.

set -e  # Exit on error

echo "========================================="
echo "CRX CONVERGENCE CLEANUP"
echo "========================================="
echo ""
echo "This script will:"
echo "1. Create git tag snapshot"
echo "2. Archive non-runtime content"
echo "3. Delete dead code"
echo "4. Restructure directories"
echo "5. Update configuration files"
echo ""
echo "Press Ctrl+C to cancel, or press Enter to continue..."
read

# ============================================================================
# STEP 1: CREATE GIT TAG SNAPSHOT
# ============================================================================
echo "Step 1: Creating git tag snapshot..."

# Check if we're in a git repository
if git rev-parse --git-dir > /dev/null 2>&1; then
    # Create tag if it doesn't exist
    if git rev-parse archive-2026-06-13 > /dev/null 2>&1; then
        echo "Tag archive-2026-06-13 already exists, skipping..."
    else
        git tag -a archive-2026-06-13 -m "Archive snapshot before convergence"
        echo "Created git tag: archive-2026-06-13"
    fi
else
    echo "Not in a git repository, skipping tag creation..."
fi

echo "✓ Step 1 complete"
echo ""

# ============================================================================
# STEP 2: CREATE NEW DIRECTORY STRUCTURE
# ============================================================================
echo "Step 2: Creating new directory structure..."

# Create new directories
mkdir -p services
mkdir -p libraries
mkdir -p archive/constitution
mkdir -p archive/knowledge
mkdir -p archive/audits/root
mkdir -p archive/audits/replay
mkdir -p archive/audits/infra
mkdir -p archive/audits/forensic-2026-06-13
mkdir -p archive/vos
mkdir -p archive/labs/constitutional-integration
mkdir -p archive/labs/constitutional-extraction
mkdir -p archive/config

echo "✓ Step 2 complete"
echo ""

# ============================================================================
# STEP 3: ARCHIVE NON-RUNTIME CONTENT
# ============================================================================
echo "Step 3: Archiving non-runtime content..."

# Archive constitutional documents
if [ -d "constitution" ]; then
    mv constitution/* archive/constitution/ 2>/dev/null || true
    rmdir constitution 2>/dev/null || true
    echo "  Archived constitution/"
fi

# Archive knowledge base
if [ -d "knowledge" ]; then
    mv knowledge/* archive/knowledge/ 2>/dev/null || true
    rmdir knowledge 2>/dev/null || true
    echo "  Archived knowledge/"
fi

# Archive root audit reports (keep README.md)
for file in *.md; do
    if [ "$file" != "README.md" ] && [ "$file" != "MINIMAL_RUNTIME.md" ] && [ "$file" != "SAFE_TO_DELETE.md" ] && [ "$file" != "ARCHIVE_INSTEAD_OF_DELETE.md" ] && [ "$file" != "RUNTIME_HARDENING.md" ] && [ "$file" != "RECOMMENDED_STRUCTURE.md" ] && [ "$file" != "CLEANUP_COMMANDS.sh" ] && [ "$file" != "CONVERGENCE_FINAL.md" ]; then
        mv "$file" archive/audits/root/ 2>/dev/null || true
    fi
done
echo "  Archived root audit reports"

# Archive VOS documentation
if [ -d "vos" ]; then
    mv vos/* archive/vos/ 2>/dev/null || true
    rmdir vos 2>/dev/null || true
    echo "  Archived vos/"
fi

# Archive runtime/replay audit reports
if [ -d "runtime/replay" ]; then
    for file in runtime/replay/*.md; do
        if [ -f "$file" ]; then
            mv "$file" archive/audits/replay/ 2>/dev/null || true
        fi
    done
    echo "  Archived runtime/replay audit reports"
fi

# Archive CascadeProjects/infra documentation
if [ -d "CascadeProjects/infra" ]; then
    for file in CascadeProjects/infra/*.md; do
        if [ -f "$file" ]; then
            mv "$file" archive/audits/infra/ 2>/dev/null || true
        fi
    done
    echo "  Archived CascadeProjects/infra documentation"
fi

# Archive constitutional integration lab
if [ -d "constitutional-integration-lab" ]; then
    mv constitutional-integration-lab/* archive/labs/constitutional-integration/ 2>/dev/null || true
    rmdir constitutional-integration-lab 2>/dev/null || true
    echo "  Archived constitutional-integration-lab/"
fi

# Archive constitutional extraction lab
if [ -d "CascadeProjects/constitutional-extraction-lab" ]; then
    mv CascadeProjects/constitutional-extraction-lab/* archive/labs/constitutional-extraction/ 2>/dev/null || true
    rmdir CascadeProjects/constitutional-extraction-lab 2>/dev/null || true
    echo "  Archived constitutional-extraction-lab/"
fi

# Archive config files
if [ -f "config.yaml" ]; then
    mv config.yaml archive/config/ 2>/dev/null || true
    echo "  Archived config.yaml"
fi

if [ -f "workspace/cache/config.yaml" ]; then
    mv workspace/cache/config.yaml archive/config/ 2>/dev/null || true
    echo "  Archived workspace/cache/config.yaml"
fi

# Archive forensic audit reports
for file in EXECUTION_GRAPH.md DEAD_CODE_REPORT.md PACKAGE_BLOAT_REPORT.md TOPOLOGY_DRIFT_REPORT.md ENV_DRIFT_MATRIX.md IMPORT_AUTHORITY_REPORT.md FRONTEND_BACKEND_DRIFT.md INFRASTRUCTURE_THEATER_REPORT.md RUNTIME_TRUTH_REPORT.md CONVERGENCE_REPORT.md; do
    if [ -f "$file" ]; then
        mv "$file" archive/audits/forensic-2026-06-13/ 2>/dev/null || true
    fi
done
echo "  Archived forensic audit reports"

echo "✓ Step 3 complete"
echo ""

# ============================================================================
# STEP 4: DELETE DEAD CODE
# ============================================================================
echo "Step 4: Deleting dead code..."

# Delete empty directories
echo "  Deleting empty directories..."
[ -d "kernel" ] && rm -rf kernel/ && echo "    Deleted kernel/"
[ -d "infra/api" ] && rm -rf infra/api/ && echo "    Deleted infra/api/"
[ -d "infra/ollama" ] && rm -rf infra/ollama/ && echo "    Deleted infra/ollama/"
[ -d "infra/redis" ] && rm -rf infra/redis/ && echo "    Deleted infra/redis/"
[ -d "infra/worker" ] && rm -rf infra/worker/ && echo "    Deleted infra/worker/"
[ -d "infra/postgres/init" ] && rm -rf infra/postgres/init/ && echo "    Deleted infra/postgres/init/"
[ -d "constitutional-integration-lab" ] && rm -rf constitutional-integration-lab/ && echo "    Deleted constitutional-integration-lab/"
[ -d "vos/viz" ] && rm -rf vos/viz/ 2>/dev/null || true
[ -d "vos/archive" ] && rm -rf vos/archive/ 2>/dev/null || true
[ -d "vos/proposals" ] && rm -rf vos/proposals/ 2>/dev/null || true
[ -d "runtime/replay/utils" ] && rm -rf runtime/replay/utils/ && echo "    Deleted runtime/replay/utils/"
[ -d "runtime/replay/forensics" ] && rm -rf runtime/replay/forensics/ && echo "    Deleted runtime/replay/forensics/"
[ -d "runtime/replay/corpus" ] && rm -rf runtime/replay/corpus/ && echo "    Deleted runtime/replay/corpus/"
[ -d "runtime/replay/__tests__" ] && rm -rf runtime/replay/__tests__/ && echo "    Deleted runtime/replay/__tests__/"
[ -d "CascadeProjects/constitutional-extraction-lab" ] && rm -rf CascadeProjects/constitutional-extraction-lab/ 2>/dev/null || true

# Delete unimported adapters
echo "  Deleting unimported adapters..."
[ -f "runtime/adapters/config_adapter.ts" ] && rm runtime/adapters/config_adapter.ts && echo "    Deleted runtime/adapters/config_adapter.ts"
[ -f "runtime/adapters/express_commit_adapter.ts" ] && rm runtime/adapters/express_commit_adapter.ts && echo "    Deleted runtime/adapters/express_commit_adapter.ts"
[ -f "runtime/adapters/postgres_event_store.ts" ] && rm runtime/adapters/postgres_event_store.ts && echo "    Deleted runtime/adapters/postgres_event_store.ts"
[ -d "runtime/adapters" ] && rm -rf runtime/adapters/ && echo "    Deleted runtime/adapters/"

# Delete worker YAML files
echo "  Deleting worker YAML files..."
[ -f "workers/gateway-worker.yaml" ] && rm workers/gateway-worker.yaml && echo "    Deleted workers/gateway-worker.yaml"
[ -f "workers/ollama-worker.yaml" ] && rm workers/ollama-worker.yaml && echo "    Deleted workers/ollama-worker.yaml"
[ -f "workers/research-worker.yaml" ] && rm workers/research-worker.yaml && echo "    Deleted workers/research-worker.yaml"
[ -f "workers/graph-worker.yaml" ] && rm workers/graph-worker.yaml && echo "    Deleted workers/graph-worker.yaml"
[ -f "workers/artifact-worker.yaml" ] && rm workers/artifact-worker.yaml && echo "    Deleted workers/artifact-worker.yaml"
[ -d "workers" ] && rm -rf workers/ && echo "    Deleted workers/"

# Delete abandoned scripts
echo "  Deleting abandoned scripts..."
[ -f "analyze.py" ] && rm analyze.py && echo "    Deleted analyze.py"
[ -f "analyze_imports.py" ] && rm analyze_imports.py && echo "    Deleted analyze_imports.py"
[ -f "compare_stacks.py" ] && rm compare_stacks.py && echo "    Deleted compare_stacks.py"

# Delete dead React components
echo "  Deleting dead React components..."
[ -f "CascadeProjects/infra/ui-next/src/components/ArchitectureView.tsx" ] && rm CascadeProjects/infra/ui-next/src/components/ArchitectureView.tsx && echo "    Deleted ArchitectureView.tsx"
[ -f "CascadeProjects/infra/ui-next/src/components/EmptyStateRedesign.tsx" ] && rm CascadeProjects/infra/ui-next/src/components/EmptyStateRedesign.tsx && echo "    Deleted EmptyStateRedesign.tsx"
[ -f "CascadeProjects/infra/ui-next/src/components/MissionControlHeader.tsx" ] && rm CascadeProjects/infra/ui-next/src/components/MissionControlHeader.tsx && echo "    Deleted MissionControlHeader.tsx"
[ -f "CascadeProjects/infra/ui-next/src/components/ObservatoryMode.tsx" ] && rm CascadeProjects/infra/ui-next/src/components/ObservatoryMode.tsx && echo "    Deleted ObservatoryMode.tsx"
[ -f "CascadeProjects/infra/ui-next/src/components/PremiumChatBubble.tsx" ] && rm CascadeProjects/infra/ui-next/src/components/PremiumChatBubble.tsx && echo "    Deleted PremiumChatBubble.tsx"
[ -f "CascadeProjects/infra/ui-next/src/components/PromptLibrary.tsx" ] && rm CascadeProjects/infra/ui-next/src/components/PromptLibrary.tsx && echo "    Deleted PromptLibrary.tsx"
[ -f "CascadeProjects/infra/ui-next/src/components/MarkdownRenderer.tsx" ] && rm CascadeProjects/infra/ui-next/src/components/MarkdownRenderer.tsx && echo "    Deleted MarkdownRenderer.tsx"
[ -f "CascadeProjects/infra/ui-next/src/components/MessageInput.tsx" ] && rm CascadeProjects/infra/ui-next/src/components/MessageInput.tsx && echo "    Deleted MessageInput.tsx"

# Delete unknown files
echo "  Deleting unknown files..."
[ -f "token.json" ] && rm token.json && echo "    Deleted token.json"

echo "✓ Step 4 complete"
echo ""

# ============================================================================
# STEP 5: RESTRUCTURE DIRECTORIES
# ============================================================================
echo "Step 5: Restructuring directories..."

# Move gateway to services/
if [ -d "gateway" ]; then
    mv gateway services/gateway
    echo "  Moved gateway/ to services/gateway/"
fi

# Move commit-service to services/
if [ -d "runtime/kernel/commit-service" ]; then
    mv runtime/kernel/commit-service services/commit-service
    echo "  Moved runtime/kernel/commit-service/ to services/commit-service/"
fi

# Move ui to services/
if [ -d "CascadeProjects/infra/ui-next" ]; then
    mv CascadeProjects/infra/ui-next services/ui
    echo "  Moved CascadeProjects/infra/ui-next/ to services/ui/"
fi

# Move replay to libraries/
if [ -d "runtime/replay" ]; then
    mv runtime/replay libraries/replay
    echo "  Moved runtime/replay/ to libraries/replay/"
fi

# Clean up empty parent directories
[ -d "runtime/kernel" ] && rmdir runtime/kernel 2>/dev/null || true
[ -d "runtime" ] && rmdir runtime 2>/dev/null || true
[ -d "CascadeProjects/infra" ] && rmdir CascadeProjects/infra 2>/dev/null || true
[ -d "CascadeProjects" ] && rmdir CascadeProjects 2>/dev/null || true
[ -d "infra" ] && rmdir infra 2>/dev/null || true
[ -d "workspace/cache" ] && rmdir workspace/cache 2>/dev/null || true
[ -d "workspace" ] && rmdir workspace 2>/dev/null || true

echo "✓ Step 5 complete"
echo ""

# ============================================================================
# STEP 6: UPDATE CONFIGURATION FILES
# ============================================================================
echo "Step 6: Updating configuration files..."

# Update pnpm-workspace.yaml
echo "  Updating pnpm-workspace.yaml..."
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'services/*'
  - 'libraries/*'
EOF

# Update root package.json
echo "  Updating root package.json..."
cat > package.json << 'EOF'
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
EOF

# Create docker-compose.yml
echo "  Creating docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
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
EOF

# Create .env.example
echo "  Creating .env.example..."
cat > .env.example << 'EOF'
# Gateway Service
GATEWAY_OLLAMA_URL=http://localhost:11434
GATEWAY_OLLAMA_MODEL=qwen2.5-coder:14b
GATEWAY_PORT=8080

# Commit Service
COMMIT_DATABASE_URL=postgresql://crx:crx@localhost:5432/crx
COMMIT_PORT=8081

# UI Service
UI_GATEWAY_URL=http://localhost:8080
EOF

# Create service-specific .env.example files
echo "  Creating service .env.example files..."

# Gateway .env.example
cat > services/gateway/.env.example << 'EOF'
# Ollama Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:14b

# Server Configuration
PORT=8080
EOF

# Commit Service .env.example
cat > services/commit-service/.env.example << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://crx:crx@localhost:5432/crx

# Server Configuration
PORT=8081
EOF

# UI .env.example
cat > services/ui/.env.example << 'EOF'
# Gateway Configuration
NEXT_PUBLIC_GATEWAY_URL=http://localhost:8080
EOF

echo "✓ Step 6 complete"
echo ""

# ============================================================================
# STEP 7: UPDATE README
# ============================================================================
echo "Step 7: Updating README.md..."

cat > README.md << 'EOF'
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

### Docker Compose (Recommended)

```bash
docker-compose up
```

### Manual Start

```bash
# Terminal 1: Gateway
cd services/gateway
npm install
npm start

# Terminal 2: Commit Service
cd services/commit-service
npm install
npm run dev

# Terminal 3: UI
cd services/ui
npm install
npm run dev
```

## Environment Variables

See `.env.example` for required environment variables.

## Documentation

- `MINIMAL_RUNTIME.md` - Runtime architecture
- `RUNTIME_HARDENING.md` - Hardening plan
- `archive/` - Archived documentation

## Services Documentation

- `services/gateway/README.md` - Gateway service
- `services/commit-service/README.md` - Commit service
- `services/ui/README.md` - UI service
- `libraries/replay/README.md` - Replay library
EOF

echo "✓ Step 7 complete"
echo ""

# ============================================================================
# STEP 8: CREATE SERVICE README FILES
# ============================================================================
echo "Step 8: Creating service README files..."

# Gateway README
cat > services/gateway/README.md << 'EOF'
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
EOF

# Commit Service README
cat > services/commit-service/README.md << 'EOF'
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
EOF

# UI README
cat > services/ui/README.md << 'EOF'
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
EOF

# Replay README
cat > libraries/replay/README.md << 'EOF'
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
EOF

echo "✓ Step 8 complete"
echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo "========================================="
echo "CLEANUP COMPLETE"
echo "========================================="
echo ""
echo "Summary of changes:"
echo "  - Created git tag: archive-2026-06-13"
echo "  - Archived non-runtime content to archive/"
echo "  - Deleted dead code (empty dirs, adapters, workers, etc.)"
echo "  - Restructured directories (services/, libraries/)"
echo "  - Updated configuration files"
echo "  - Created docker-compose.yml"
echo "  - Created .env.example files"
echo "  - Updated README.md"
echo ""
echo "Next steps:"
echo "  1. Review changes with: git status"
echo "  2. Test services individually"
echo "  3. Test docker-compose up"
echo "  4. Commit changes"
echo ""
echo "To revert changes:"
echo "  git checkout archive-2026-06-13"
echo ""
