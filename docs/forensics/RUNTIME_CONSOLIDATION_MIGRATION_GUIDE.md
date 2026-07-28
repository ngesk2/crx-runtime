# Runtime Consolidation Migration Guide

**Purpose:** Step-by-step guide to migrate from fragmented Docker setup to consolidated compose.yaml

**Prerequisites:**
- Docker Desktop running
- All containers stopped
- Backup of current volumes
- Git commit with current state

---

## Pre-Migration Checklist

### 1. Backup Current State

```bash
# Backup all volumes
docker volume ls

# Backup postgres data
docker run --rm -v postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data

# Backup qdrant data
docker run --rm -v qdrant_data:/data -v $(pwd):/backup alpine tar czf /backup/qdrant_backup.tar.gz /data

# Backup ollama data
docker run --rm -v ollama_data:/data -v $(pwd):/backup alpine tar czf /backup/ollama_backup.tar.gz /data

# Create git commit
git add .
git commit -m "Pre-consolidation backup"
```

### 2. Stop All Containers

```bash
# Stop all running containers
docker stop $(docker ps -q)

# Navigate to each compose directory and stop
cd brainos/orchestration/infrastructure/docker/compose
docker compose down

cd ../../../../../brainos/newsletter
docker compose down

cd ../rss
docker compose down

cd ../../../gateway
docker compose down
```

### 3. Document Current State

```bash
# List all containers
docker ps -a > container_inventory.txt

# List all volumes
docker volume ls > volume_inventory.txt

# List all networks
docker network ls > network_inventory.txt
```

---

## Phase 1: Remove Obsolete Containers

### 1.1 Remove Duplicate Ollama Instances

```bash
# Remove brain-ollama (duplicate)
docker rm -f brain-ollama

# Verify crx-ollama-worker exists
docker ps -a | grep ollama
```

### 1.2 Remove Duplicate Open WebUI Instances

```bash
# Remove open-webui
docker rm -f open-webui

# Remove brain-openwebui
docker rm -f brain-openwebui

# Remove open-webui volume
docker volume rm crx-digestion-worker_open-webui-data
```

### 1.3 Remove Obsolete Networks

```bash
# Remove old networks
docker network rm crx_crx-network
docker network rm crx-digestion-worker_default
docker network rm compose_brain_internal
```

---

## Phase 2: Rename Canonical Containers

### 2.1 Rename PostgreSQL

```bash
# Rename brain-postgres to ping-postgres
docker rename brain-postgres ping-postgres

# Verify
docker ps -a | grep postgres
```

### 2.2 Rename Qdrant

```bash
# Rename brain-qdrant to ping-qdrant
docker rename brain-qdrant ping-qdrant

# Verify
docker ps -a | grep qdrant
```

### 2.3 Rename Ollama

```bash
# Rename crx-ollama-worker to ping-ollama
docker rename crx-ollama-worker ping-ollama

# Verify
docker ps -a | grep ollama
```

### 2.4 Rename Gateway

```bash
# Rename crx-gateway to ping-gateway
docker rename crx-gateway ping-gateway

# Verify
docker ps -a | grep gateway
```

### 2.5 Rename Mission Control

```bash
# Verify ping-mission-control exists
docker ps -a | grep mission-control
```

### 2.6 Rename UI

```bash
# Rename crx-ui-next to ping-ui
docker rename crx-ui-next ping-ui

# Verify
docker ps -a | grep ui
```

---

## Phase 3: Consolidate Volumes

### 3.1 Rename PostgreSQL Volume

```bash
# Rename postgres_data to ping_postgres
docker volume rename postgres_data ping_postgres

# Verify
docker volume ls | grep postgres
```

### 3.2 Rename Qdrant Volume

```bash
# Rename qdrant_data to ping_qdrant
docker volume rename qdrant_data ping_qdrant

# Verify
docker volume ls | grep qdrant
```

### 3.3 Rename Ollama Volume

```bash
# Rename ollama_data to ping_ollama
docker volume rename ollama_data ping_ollama

# Verify
docker volume ls | grep ollama
```

### 3.4 Create Vault Volume

```bash
# Create ping_vault volume
docker volume create ping_vault

# Verify
docker volume ls | grep vault
```

### 3.5 Clean Up Obsolete Volumes

```bash
# Remove openwebui_data if exists
docker volume rm openwebui_data 2>/dev/null || true

# Remove any other obsolete volumes
docker volume prune
```

---

## Phase 4: Deploy Consolidated Compose

### 4.1 Verify Compose Files

```bash
# Navigate to PING root
cd C:\Users\nolan\PING

# Verify compose files exist
ls compose.yaml
ls compose.dev.yaml
ls compose.prod.yaml
ls compose.gpu.yaml
ls compose.cpu.yaml
ls compose.debug.yaml
ls compose.minimal.yaml
ls compose.brain.yaml
```

### 4.2 Validate Compose Configuration

```bash
# Validate compose.yaml
docker compose config

# Validate with dev profile
docker compose --profile dev config

# Validate with prod profile
docker compose --profile prod config
```

### 4.3 Start Infrastructure Services

```bash
# Start with minimal profile (infrastructure only)
docker compose --profile minimal up -d

# Verify services are running
docker ps

# Check logs
docker compose logs postgres
docker compose logs qdrant
docker compose logs vault
docker compose logs ollama
```

### 4.4 Test Infrastructure Connectivity

```bash
# Test PostgreSQL
docker compose exec postgres pg_isready -U postgres

# Test Qdrant
docker compose exec qdrant curl -f http://localhost:6333/health

# Test Ollama
docker compose exec ollama curl -f http://localhost:11434/api/tags

# Test Vault
docker compose exec vault vault status
```

### 4.5 Start Platform Services

```bash
# Stop minimal profile
docker compose down

# Start with dev profile
docker compose --profile dev up -d

# Verify services are running
docker ps

# Check logs
docker compose logs mission-control
docker compose logs gateway
docker compose logs ui
```

### 4.6 Test Platform Services

```bash
# Test Mission Control
curl http://localhost:8000/health

# Test Gateway
curl http://localhost:8080/health

# Test UI
curl http://localhost:3000/api/health
```

### 4.7 Start Workers

```bash
# Workers should already be running with dev profile
docker ps

# Check worker logs
docker compose logs digestion-worker
docker compose logs newsletter-worker
```

---

## Phase 5: Update Service Configurations

### 5.1 Update Environment Variables

Update `.env.base` to use new service names:

```bash
# PostgreSQL
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Qdrant
QDRANT_URL=http://qdrant:6333

# Ollama
OLLAMA_BASE_URL=http://ollama:11434

# Vault
VAULT_ADDR=http://vault:8200
```

### 5.2 Update Worker Configurations

Update worker environment variables to point to consolidated services:

```bash
# Digestion worker
cd brainos/rss
# Update .env to use http://ollama:11434 instead of http://crx-ollama-worker:11434

# Newsletter worker
cd ../newsletter
# Update .env to use http://ollama:11434 instead of http://crx-ollama-worker:11434
```

### 5.3 Update Gateway Configuration

Update `gateway/server.js` to use new service names:

```javascript
// Update Ollama URL
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://ollama:11434';

// Update PostgreSQL connection
const POSTGRES_HOST = process.env.POSTGRES_HOST || 'postgres';
```

---

## Phase 6: Clean Up Old Compose Files

### 6.1 Archive Old Compose Files

```bash
# Create archive directory
mkdir -p archive/old_compose

# Move old compose files to archive
mv brainos/orchestration/infrastructure/docker/compose/docker-compose.yml archive/old_compose/
mv brainos/orchestration/infrastructure/docker/compose/docker-compose-mission-control.yml archive/old_compose/
mv brainos/newsletter/docker-compose.yml archive/old_compose/
mv brainos/rss/docker-compose.yml archive/old_compose/
```

### 6.2 Update Documentation

Update any documentation that references old compose files or container names.

---

## Phase 7: Verification

### 7.1 Verify Container Count

```bash
# Count running containers
docker ps | wc -l

# Expected: ~10 containers (4 infrastructure + 3 platform + 3 workers)
```

### 7.2 Verify Network Count

```bash
# List networks
docker network ls

# Expected: 1 network (ping_internal)
```

### 7.3 Verify Volume Naming

```bash
# List volumes
docker volume ls

# Expected: All volumes have ping_ prefix
```

### 7.4 Verify Service Connectivity

```bash
# Test all services can communicate
docker compose exec ping-postgres ping ping-qdrant
docker compose exec ping-qdrant ping ping-ollama
docker compose exec ping-ollama ping ping-gateway
```

### 7.5 Verify No Port Conflicts

```bash
# Check port usage
netstat -an | grep LISTEN

# Expected: No conflicts on ports 3000, 5432, 6333, 8000, 8080, 8200, 11434
```

---

## Phase 8: Production Deployment

### 8.1 Switch to Production Profile

```bash
# Stop dev profile
docker compose down

# Start prod profile
docker compose --profile prod up -d

# Verify
docker ps
```

### 8.2 Monitor Production

```bash
# Monitor logs
docker compose logs -f

# Check resource usage
docker stats
```

---

## Rollback Plan

If migration fails:

### 1. Stop Consolidated Stack

```bash
docker compose down
```

### 2. Restore Old Compose Files

```bash
# Restore from archive
cp archive/old_compose/docker-compose.yml brainos/orchestration/infrastructure/docker/compose/
cp archive/old_compose/docker-compose-mission-control.yml brainos/orchestration/infrastructure/docker/compose/
cp archive/old_compose/docker-compose.yml brainos/newsletter/
cp archive/old_compose/docker-compose.yml brainos/rss/
```

### 3. Rename Containers Back

```bash
docker rename ping-postgres brain-postgres
docker rename ping-qdrant brain-qdrant
docker rename ping-ollama crx-ollama-worker
docker rename ping-gateway crx-gateway
docker rename ping-ui crx-ui-next
```

### 4. Rename Volumes Back

```bash
docker volume rename ping_postgres postgres_data
docker volume rename ping_qdrant qdrant_data
docker volume rename ping_ollama ollama_data
```

### 5. Start Old Stack

```bash
cd brainos/orchestration/infrastructure/docker/compose
docker compose up -d

cd ../../../../../brainos/newsletter
docker compose up -d

cd ../rss
docker compose up -d
```

---

## Success Criteria

- [ ] All obsolete containers removed
- [ ] All containers renamed to ping-* convention
- [ ] All volumes renamed to ping_* convention
- [ ] Single network (ping_internal) active
- [ ] Consolidated compose.yaml deployed
- [ ] All infrastructure services healthy
- [ ] All platform services healthy
- [ ] All workers healthy
- [ ] UI accessible
- [ ] No port conflicts
- [ ] Service connectivity verified
- [ ] Old compose files archived
- [ ] Documentation updated

---

## Post-Migration Tasks

### 1. Update CI/CD Pipelines

Update any CI/CD pipelines to use new compose files and profiles.

### 2. Update Monitoring

Update monitoring dashboards to use new container names.

### 3. Update Backup Scripts

Update backup scripts to use new volume names.

### 4. Update Documentation

Update all documentation to reflect new architecture.

### 5. Team Training

Train team on new compose structure and profile usage.

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs <service-name>

# Check configuration
docker compose config

# Validate environment variables
docker compose config | grep -i env
```

### Network Connectivity Issues

```bash
# Check network
docker network inspect ping_internal

# Test connectivity
docker compose exec <service> ping <other-service>
```

### Volume Issues

```bash
# Check volume exists
docker volume ls | grep ping_

# Check volume contents
docker run --rm -v ping_postgres:/data alpine ls -la /data
```

### Port Conflicts

```bash
# Check what's using the port
netstat -an | grep <port>

# Change port in compose.yaml if needed
```

---

## Support

For issues during migration:

1. Check logs: `docker compose logs -f`
2. Validate config: `docker compose config`
3. Check documentation: `docs/forensics/RUNTIME_CONSOLIDATION_PLAN.md`
4. Rollback if necessary (see Rollback Plan above)
