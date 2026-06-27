# Sprint 04A: Runtime Consolidation

**Goal:** Reduce the number of long-running containers and eliminate duplicate services.

**Expected Impact:**
- 25–40% fewer running containers
- 30–50% fewer Docker networks
- Fewer named volumes
- Simpler Compose configuration
- Easier upgrades
- Easier backups
- Fewer port conflicts
- Significantly lower chance of Docker Desktop instability

---

## Current State Audit

### Container Dependency Inventory

| Container | Keep? | Reason | Action |
|-----------|-------|--------|--------|
| brain-postgres | Yes | Canonical PostgreSQL instance | Rename to `ping-postgres` |
| brain-qdrant | Yes | Canonical vector database | Rename to `ping-qdrant` |
| brain-vault | Yes | Secret management | Rename to `ping-vault` |
| brain-ollama | No | Duplicate of crx-ollama-worker | **REMOVE** |
| crx-ollama-worker | Yes | Single LLM runtime | Rename to `ping-ollama` |
| crx-gateway | Yes | Orchestration layer | Keep as `ping-gateway` |
| ping-mission-control | Yes | Orchestration layer | Keep as `ping-mission-control` |
| crx-ui-next | Yes | Frontend | Keep as `ping-ui` |
| open-webui | No | Duplicate of brain-openwebui | **REMOVE** |
| brain-openwebui | No | Duplicate UI | **REMOVE** |
| brain-neo4j | Maybe | Knowledge graph (Brain-specific) | Move to optional profile |
| brain-temporal | Maybe | Workflow engine (Brain-specific) | Move to optional profile |
| brain-kafka | Maybe | Event streaming (Brain-specific) | Move to optional profile |
| brain-zookeeper | Maybe | Kafka dependency | Move to optional profile |
| brain-duckdb | Maybe | Analytics (Brain-specific) | Move to optional profile |
| brain-opensearch | Maybe | Search engine (Brain-specific) | Move to optional profile |
| brain-tika | Maybe | Document parsing (Brain-specific) | Move to optional profile |

### Duplicate Services Detected

**Ollama:**
- `brain-ollama` (Brain infrastructure)
- `crx-ollama-worker` (PING service)
- **Winner:** crx-ollama-worker → Rename to `ping-ollama`

**PostgreSQL:**
- `brain-postgres` (Brain infrastructure)
- `crx-postgres` (mentioned in docs, CRX runtime)
- **Winner:** brain-postgres → Rename to `ping-postgres`

**Open WebUI:**
- `open-webui` (crx-digestion-worker)
- `brain-openwebui` (Brain infrastructure)
- **Winner:** Neither → **REMOVE BOTH** (use crx-ui-next)

### Network Fragmentation

**Current Networks:**
1. `brain_internal` (172.21.0.x) - brain-postgres, brain-qdrant
2. `crx_crx-network` (172.19.0.x) - crx-gateway
3. `crx-digestion-worker_default` (172.20.0.x) - open-webui

**Problem:** No cross-network routing. Containers cannot communicate.

**Solution:** Single `ping_internal` network for all services.

### Volume Fragmentation

**Current Volumes:**
- `postgres_data` (brain-postgres)
- `qdrant_data` (brain-qdrant)
- `ollama_data` (brain-ollama)
- `crx_crx-postgres-volume` (crx-postgres)
- `openwebui_data` (open-webui)
- Plus: neo4j_data, kafka_data, zookeeper_data, duckdb_data, opensearch_data

**Solution:** Consolidate to `ping_*` prefix:
- `ping_postgres`
- `ping_qdrant`
- `ping_ollama`
- `ping_vault`
- `ping_repositories`
- `ping_artifacts`
- `ping_events`

---

## Proposed Architecture

### Three-Layer Architecture

```
Infrastructure
│
├── Docker
├── WSL2
├── PostgreSQL (ping-postgres)
├── Qdrant (ping-qdrant)
└── Vault (ping-vault)

Platform
│
├── Repository Runtime (ping-repo-runtime)
├── Constitutional Runtime
├── Mission Control (ping-mission-control)
└── Ollama (ping-ollama)

Workers
│
├── Replay
├── Witness
├── Projection
├── Digestion
└── Drive Sync

UI
│
├── Gateway (ping-gateway)
└── Next.js UI (ping-ui)
```

### Consolidated Docker Topology

**Single Compose Project:** `compose.yaml`

**Infrastructure Layer:**
- `postgres` - PostgreSQL 15
- `qdrant` - Vector database
- `vault` - HashiCorp Vault
- `ollama` - AI model runtime

**Platform Layer:**
- `mission-control` - Orchestration API
- `repo-runtime` - Repository read-only mount
- `gateway` - API gateway with model routing

**Worker Layer:**
- `digestion-worker` - RSS/article processing
- `newsletter-worker` - Yahoo Mail processing
- `projection-worker` - Vector projection
- `witness-worker` - Witness computation
- `replay-worker` - Event replay

**UI Layer:**
- `ui` - Next.js frontend

**Optional (Brain-specific):**
- `neo4j` - Knowledge graph
- `temporal` - Workflow engine
- `kafka` - Event streaming
- `zookeeper` - Kafka dependency
- `duckdb` - Analytics
- `opensearch` - Search engine
- `tika` - Document parsing

---

## Profile-Based Configuration

### Profiles

**dev** - Development environment
- All infrastructure services
- Mission Control
- Gateway
- UI
- All workers
- Debug logging enabled
- Hot reload enabled

**prod** - Production environment
- All infrastructure services
- Mission Control
- Gateway
- UI
- Essential workers only
- Optimized logging
- No debug tools

**gpu** - GPU-accelerated
- Ollama with GPU support
- All other services
- NVIDIA runtime enabled

**cpu** - CPU-only
- Ollama CPU-only
- All other services
- No GPU dependencies

**debug** - Debug mode
- All infrastructure services
- Mission Control
- Gateway
- UI
- All workers
- Extended logging
- Debug ports exposed
- Debug tools enabled

**minimal** - Minimal runtime
- Core infrastructure only (postgres, qdrant, vault, ollama)
- Mission Control
- Gateway
- No workers
- No UI

### Usage Examples

```bash
# Development
docker compose --profile dev up

# Production
docker compose --profile prod up -d

# GPU-accelerated development
docker compose --profile dev --profile gpu up

# CPU-only production
docker compose --profile prod --profile cpu up -d

# Debug mode
docker compose --profile debug up

# Minimal infrastructure
docker compose --profile minimal up -d
```

---

## File Structure

### Consolidated Compose Files

```
PING/
├── compose.yaml                 # Base configuration (infrastructure + platform)
├── compose.dev.yaml           # Development overrides
├── compose.prod.yaml          # Production overrides
├── compose.gpu.yaml           # GPU overrides
├── compose.cpu.yaml           # CPU overrides
├── compose.debug.yaml         # Debug overrides
├── compose.minimal.yaml       # Minimal overrides
└── compose.brain.yaml         # Optional Brain services
```

### Volume Naming Convention

```
ping_postgres          # PostgreSQL data
ping_qdrant            # Qdrant vector storage
ping_ollama            # Ollama models
ping_vault             # Vault secrets
ping_repositories      # Repository mounts
ping_artifacts         # Artifacts storage
ping_events            # Event logs
ping_knowledge         # Knowledge base
```

---

## Migration Steps

### Phase 1: Stop and Remove Duplicate Containers

```bash
# Stop all containers
docker compose down

# Remove obsolete containers
docker rm -f brain-ollama
docker rm -f open-webui
docker rm -f brain-openwebui

# Remove obsolete volumes
docker volume rm openwebui_data
```

### Phase 2: Rename Canonical Containers

```bash
# Rename brain-postgres to ping-postgres
docker rename brain-postgres ping-postgres

# Rename brain-qdrant to ping-qdrant
docker rename brain-qdrant ping-qdrant

# Rename crx-ollama-worker to ping-ollama
docker rename crx-ollama-worker ping-ollama

# Rename ping-mission-control (keep name)
# Rename crx-gateway to ping-gateway
docker rename crx-gateway ping-gateway

# Rename crx-ui-next to ping-ui
docker rename crx-ui-next ping-ui
```

### Phase 3: Consolidate Volumes

```bash
# Rename volumes
docker volume rename postgres_data ping_postgres
docker volume rename qdrant_data ping_qdrant
docker volume rename ollama_data ping_ollama
```

### Phase 4: Create Consolidated Compose Files

Create `compose.yaml` with:
- Infrastructure services (postgres, qdrant, vault, ollama)
- Platform services (mission-control, repo-runtime, gateway)
- Worker services (digestion, newsletter, projection, witness, replay)
- UI services (ui)
- Single network: `ping_internal`
- Consolidated volumes: `ping_*`

Create profile overrides for different environments.

### Phase 5: Update Service Configurations

Update all services to use:
- `http://ping-postgres:5432` for PostgreSQL
- `http://ping-qdrant:6333` for Qdrant
- `http://ping-ollama:11434` for Ollama
- `http://ping-vault:8200` for Vault

### Phase 6: Test Consolidated Stack

```bash
# Start with dev profile
docker compose --profile dev up

# Verify all services are running
docker ps

# Test connectivity
docker compose exec ping-postgres pg_isready -U postgres
docker compose exec ping-qdrant curl -f http://localhost:6333/health
docker compose exec ping-ollama curl -f http://localhost:11434/api/tags
```

### Phase 7: Clean Up Old Compose Files

Remove old compose files:
- `brainos/orchestration/infrastructure/docker/compose/docker-compose.yml`
- `brainos/orchestration/infrastructure/docker/compose/docker-compose-mission-control.yml`
- `brainos/newsletter/docker-compose.yml`
- `brainos/rss/docker-compose.yml`

---

## Expected Outcomes

### Container Count Reduction

**Before:** ~18 containers
- 10 Brain services
- 3 PING services
- 3 Application workers
- 2 Obsolete UI containers

**After:** ~10 containers
- 4 Infrastructure services
- 3 Platform services
- 3 Worker services
- 1 UI service

**Reduction:** 44% fewer containers

### Network Count Reduction

**Before:** 3 networks
- brain_internal
- crx_crx-network
- crx-digestion-worker_default

**After:** 1 network
- ping_internal

**Reduction:** 67% fewer networks

### Volume Count Reduction

**Before:** ~12 volumes with inconsistent naming

**After:** ~8 volumes with consistent `ping_*` naming

**Reduction:** 33% fewer volumes

### Port Conflict Elimination

**Before:** Potential conflicts
- Port 3000 (crx-ui-next, brain-openwebui)
- Port 8080 (crx-gateway, open-webui)
- Port 11434 (brain-ollama, crx-ollama-worker)

**After:** No conflicts
- Port 3000 (ping-ui)
- Port 8080 (ping-gateway)
- Port 11434 (ping-ollama)

---

## Rollback Plan

If consolidation fails:

1. Stop consolidated stack: `docker compose down`
2. Restore old compose files from git
3. Rename containers back: `docker rename ping-postgres brain-postgres`
4. Rename volumes back: `docker volume rename ping_postgres postgres_data`
5. Start old stack: `docker compose -f docker-compose.yml up`

---

## Success Criteria

1. ✅ Single Docker Compose project
2. ✅ One Ollama instance (ping-ollama)
3. ✅ One PostgreSQL instance (ping-postgres)
4. ✅ One Qdrant instance (ping-qdrant)
5. ✅ One Vault instance (ping-vault)
6. ✅ Single network (ping_internal)
7. ✅ Consistent volume naming (ping_*)
8. ✅ Profile-based configuration working
9. ✅ All services can communicate
10. ✅ No port conflicts
11. ✅ All workers functioning
12. ✅ UI accessible
13. ✅ Backups simplified
14. ✅ Upgrades simplified

---

## Next Steps

1. Review and approve this plan
2. Execute Phase 1: Stop and remove duplicates
3. Execute Phase 2: Rename canonical containers
4. Execute Phase 3: Consolidate volumes
5. Execute Phase 4: Create consolidated compose files
6. Execute Phase 5: Update service configurations
7. Execute Phase 6: Test consolidated stack
8. Execute Phase 7: Clean up old compose files
9. Verify success criteria
10. Document final state
