# CRX Local Execution Substrate Proposal

**Date**: 2026-06-08  
**Location**: C:\Users\nolan\CRX\CascadeProjects\infra  
**Phase**: FINAL DELIVERABLE — Consolidation Proposal  
**Mission**: Consolidate CRX infrastructure into single canonical local execution substrate

---

## Executive Summary

**Proposal**: Consolidate all CRX infrastructure into a single Docker Compose stack at `CRX/CascadeProjects/infra/`, eliminating duplicate orchestration layers while preserving constitutional authority boundaries.

**Current State**: Infrastructure fragmented across multiple docker-compose files, Replay Kernel isolated in separate compose, Gateway and UI not implemented, no workers, no job queues, no continuous execution.

**Target State**: Single docker-compose.yml containing all services with three-layer architecture:
- **Infrastructure Layer** (Persistent): Redis, Neo4j, Ollama, Gateway
- **Cognition Layer** (Replaceable): Research Worker, Graph Worker, Artifact Worker, ADR Worker, Embedding Worker
- **Sovereign Layer** (Persistent + Authoritative): Replay Kernel, Witness Authority, Canonicalization, Artifacts, Knowledge Vault

**Compliance**: ✅ Fully compliant with CRX_CONSTITUTION.md and AGENT.md constitutional requirements.

**Effort**: 
- **Phase 1 (Base Consolidation)**: 30-42 hours (Gateway, UI, Replay Kernel migration)
- **Phase 2 (Cognition Stack Expansion)**: 83-105 hours (Neo4j, workers, job queues, continuous execution)
- **Total**: 113-147 hours

**Risk**: Low-Medium - well-understood components, clear architecture, constitutional boundaries preserved.

**Note**: This proposal has been expanded to include the full cognition stack. See `COGNITION_STACK_EXPANSION.md` for detailed design of workers, job queues, and continuous execution loops.

---

## 1. Current State

### 1.1 Infrastructure Fragmentation

**Current Docker Compose Files**:
```
C:\Users\nolan\CRX\docker-compose.yml
  └── Services: replay-kernel, postgres

C:\Users\nolan\CRX\CascadeProjects\infra\docker-compose.yml
  └── Services: postgres, redis, ollama, prometheus, grafana, loki, tempo

C:\Users\nolan\CRX\agents\docker-compose.yml
  └── Services: planner-agent, refactor-agent, documentation-agent, governance-agent
```

**Issues**:
- Three separate docker-compose roots
- Duplicate postgres service
- Replay Kernel isolated from main infrastructure
- Gateway and UI not implemented
- No single source of truth for local execution

### 1.2 Service Inventory

| Service | Location | Status | Notes |
|---------|----------|--------|-------|
| postgres | CRX/docker-compose.yml, infra/docker-compose.yml | DUPLICATE | Two instances defined |
| redis | infra/docker-compose.yml | CONFIGURED | Not running |
| neo4j | NOT IMPLEMENTED | MISSING | Must be added for knowledge graph |
| ollama | infra/docker-compose.yml | CONFIGURED | Not running, no models |
| prometheus | infra/docker-compose.yml | CONFIGURED | Not running |
| grafana | infra/docker-compose.yml | CONFIGURED | Not running, port conflict with UI |
| loki | infra/docker-compose.yml | CONFIGURED | Not running |
| tempo | infra/docker-compose.yml | CONFIGURED | Not running |
| replay-kernel | CRX/docker-compose.yml | CONFIGURED | Isolated from infra |
| gateway | NOT IMPLEMENTED | MISSING | Must be created |
| ui-next | NOT IMPLEMENTED | MISSING | Must be created |
| research-worker | NOT IMPLEMENTED | MISSING | Must be created |
| graph-worker | NOT IMPLEMENTED | MISSING | Must be created |
| artifact-worker | NOT IMPLEMENTED | MISSING | Must be created |
| adr-worker | NOT IMPLEMENTED | MISSING | Must be created |
| embedding-worker | NOT IMPLEMENTED | MISSING | Must be created |
| agents | agents/docker-compose.yml | BROKEN | Missing code/dirs |

### 1.3 Port Conflicts

**Current Port Allocation**:
- 3000: Grafana (conflicts with standard UI port)
- 3001: Not allocated
- 5432: PostgreSQL
- 6379: Redis
- 11434: Ollama
- 9090: Prometheus
- 3100: Loki
- 3200: Tempo
- 4317: Tempo OTLP

**Issue**: Grafana on port 3000 conflicts with Next.js UI standard port.

---

## 2. Recommended Architecture

### 2.1 Consolidated Service Graph

```
CRX/CascadeProjects/infra/docker-compose.yml
│
├── Infrastructure Services
│   ├── postgres (5432)
│   ├── redis (6379)
│   └── ollama (11434)
│
├── Application Services
│   ├── gateway (3001)
│   ├── ui-next (3000)
│   └── replay-kernel (integrated)
│
├── Observability Services
│   ├── prometheus (9090)
│   ├── grafana (3002) ← MOVED from 3000
│   ├── loki (3100)
│   └── tempo (3200, 4317)
│
└── Network
    └── crx-network (bridge)
```

### 2.2 Data Flow Architecture

```
User
  ↓ HTTP (3000)
UI (Next.js)
  ↓ HTTP (3001)
Gateway
  ↓ HTTP (11434)
Ollama (Primary Provider)
  ↓ LLM Response
Gateway
  ↓ Certification Request (optional)
Replay Kernel (Constitutional Authority)
  ↓ Certification Decision
Gateway
  ↓ HTTP (3001)
UI
  ↓ Display
User
```

### 2.3 Authority Boundaries

**Constitutional Authorities**:
- Replay Kernel: Replay Authority, Witness Authority, Certification Authority

**Infrastructure Services** (No Authority):
- Gateway: Provider abstraction, routing
- UI: Presentation layer
- Ollama: External LLM provider
- PostgreSQL: Persistent storage
- Redis: Cache/message broker
- Observability Stack: Metrics, logs, traces

**Key Principle**: Infrastructure services are replaceable without constitutional impact. Only Replay Kernel owns constitutional authority.

---

## 3. Required Compose Changes

### 3.1 Target docker-compose.yml Structure

```yaml
version: '3.8'

services:
  # Infrastructure Services
  postgres:
    image: postgres:16-alpine
    container_name: crx-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-crx}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-crx_dev_password}
      POSTGRES_DB: ${POSTGRES_DB:-crx_kernel}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - ./volumes/postgres:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-crx}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - crx-network

  redis:
    image: redis:7-alpine
    container_name: crx-redis
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - ./volumes/redis:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - crx-network

  ollama:
    image: ollama/ollama:latest
    container_name: crx-ollama
    ports:
      - "${OLLAMA_PORT:-11434}:11434"
    volumes:
      - ./volumes/ollama:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - crx-network

  # Application Services
  gateway:
    build:
      context: ./gateway
      dockerfile: Dockerfile
    container_name: crx-gateway
    ports:
      - "${GATEWAY_PORT:-3001}:3001"
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
      - DEFAULT_PROVIDER=ollama
      - OLLAMA_BASE_URL=http://crx-ollama:11434
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY:-}
      - REDIS_URL=redis://crx-redis:6379
      - POSTGRES_URL=postgres://crx:crx_dev_password@crx-postgres:5432/crx_kernel
    depends_on:
      ollama:
        condition: service_healthy
      redis:
        condition: service_healthy
      postgres:
        condition: service_healthy
    networks:
      - crx-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

  ui-next:
    build:
      context: ./ui-next
      dockerfile: Dockerfile
    container_name: crx-ui-next
    ports:
      - "${UI_PORT:-3000}:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_GATEWAY_URL=http://crx-gateway:3001
      - NEXT_PUBLIC_API_KEY=${NEXT_PUBLIC_API_KEY:-}
    depends_on:
      gateway:
        condition: service_healthy
    networks:
      - crx-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

  replay-kernel:
    build:
      context: ../..
      dockerfile: Dockerfile
    image: crx-replay-kernel:1.0.0
    container_name: crx-replay-kernel
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - CONSTITUTIONAL_MODE=strict
      - DATABASE_URL=postgres://crx:crx_dev_password@crx-postgres:5432/crx_kernel
    volumes:
      - ../../certification:/app/certification:ro
      - ../../tests/corpus:/app/tests/corpus:ro
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "npx", "ts-node", "runtime/replay/constitutional_self_check.ts"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s
    networks:
      - crx-network

  # Observability Services
  prometheus:
    image: prom/prometheus:latest
    container_name: crx-prometheus
    ports:
      - "${PROMETHEUS_PORT:-9090}:9090"
    volumes:
      - ./observability/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./volumes/prometheus:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    networks:
      - crx-network

  grafana:
    image: grafana/grafana:latest
    container_name: crx-grafana
    ports:
      - "${GRAFANA_PORT:-3002}:3000"  # MOVED from 3000 to 3002
    volumes:
      - ./volumes/grafana:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_USER=${GRAFANA_USER:-admin}
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD:-admin}
    depends_on:
      - prometheus
    networks:
      - crx-network

  loki:
    image: grafana/loki:latest
    container_name: crx-loki
    ports:
      - "${LOKI_PORT:-3100}:3100"
    volumes:
      - ./observability/loki-config.yml:/etc/loki/local-config.yaml
      - ./volumes/loki:/loki
    command: -config.file=/etc/loki/local-config.yaml
    networks:
      - crx-network

  tempo:
    image: grafana/tempo:latest
    container_name: crx-tempo
    ports:
      - "${TEMPO_PORT:-3200}:3200"
      - "${TEMPO_OTLP_PORT:-4317}:4317"
    volumes:
      - ./observability/tempo-config.yml:/etc/tempo-config.yaml
      - ./volumes/tempo:/tmp/tempo
    command: -config.file=/etc/tempo-config.yaml
    networks:
      - crx-network

networks:
  crx-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
  ollama-data:
  prometheus-data:
  grafana-data:
  loki-data:
  tempo-data:
```

### 3.2 Updated .env File

```env
# PostgreSQL Configuration
POSTGRES_USER=crx
POSTGRES_PASSWORD=crx_dev_password
POSTGRES_DB=crx_kernel
POSTGRES_PORT=5432

# Redis Configuration
REDIS_PORT=6379

# Ollama Configuration
OLLAMA_PORT=11434
OLLAMA_MODEL=qwen2.5-coder:7b

# Gateway Configuration
GATEWAY_PORT=3001
DEFAULT_PROVIDER=ollama
OLLAMA_BASE_URL=http://crx-ollama:11434
OPENROUTER_API_KEY=

# UI Configuration
UI_PORT=3000
NEXT_PUBLIC_GATEWAY_URL=http://localhost:3001
NEXT_PUBLIC_API_KEY=

# Observability Configuration
PROMETHEUS_PORT=9090
GRAFANA_PORT=3002  # CHANGED from 3000 to 3002
GRAFANA_USER=admin
GRAFANA_PASSWORD=admin
LOKI_PORT=3100
TEMPO_PORT=3200
TEMPO_OTLP_PORT=4317

# Runtime Configuration
LOG_LEVEL=info
ENVIRONMENT=development
```

### 3.3 Port Allocation Summary

| Service | Port | Change |
|---------|------|--------|
| UI (Next.js) | 3000 | No change |
| Gateway | 3001 | New allocation |
| Grafana | 3002 | Changed from 3000 |
| PostgreSQL | 5432 | No change |
| Redis | 6379 | No change |
| Ollama | 11434 | No change |
| Prometheus | 9090 | No change |
| Loki | 3100 | No change |
| Tempo | 3200, 4317 | No change |

---

## 4. Required Code Changes

### 4.1 Gateway Implementation

**New Directory Structure**:
```
CRX/CascadeProjects/infra/gateway/
├── Dockerfile
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── server.ts
    ├── routes/
    │   ├── chat.ts
    │   ├── models.ts
    │   └── health.ts
    ├── providers/
    │   ├── base.ts
    │   ├── ollama.ts
    │   └── openrouter.ts
    ├── registry.ts
    └── middleware/
        ├── logging.ts
        └── metrics.ts
```

**Key Files to Create**:
- `gateway/Dockerfile` - Container build
- `gateway/package.json` - Dependencies
- `gateway/src/index.ts` - Entry point
- `gateway/src/providers/ollama.ts` - Ollama provider
- `gateway/src/providers/openrouter.ts` - OpenRouter provider
- `gateway/src/registry.ts` - Provider registry

**Dependencies**: Fastify, TypeScript, Pino, prom-client (no LangChain, no Vercel AI SDK)

### 4.2 UI Implementation

**New Directory Structure**:
```
CRX/CascadeProjects/infra/ui-next/
├── Dockerfile
├── package.json
├── tsconfig.json
├── next.config.js
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── chat/
    │       └── page.tsx
    ├── components/
    │   ├── ChatInterface.tsx
    │   ├── MessageList.tsx
    │   └── ModelSelector.tsx
    ├── lib/
    │   ├── gateway-client.ts
    │   └── types.ts
    └── styles/
        └── globals.css
```

**Key Files to Create**:
- `ui-next/Dockerfile` - Container build
- `ui-next/package.json` - Dependencies
- `ui-next/src/app/chat/page.tsx` - Chat interface
- `ui-next/src/lib/gateway-client.ts` - Gateway client
- `ui-next/src/components/ChatInterface.tsx` - Main chat component

**Dependencies**: Next.js, React, Tailwind CSS, Lucide React

### 4.3 Replay Kernel Integration

**Changes Required**:
- Move Replay Kernel service from `CRX/docker-compose.yml` to `CRX/CascadeProjects/infra/docker-compose.yml`
- Update Replay Kernel environment variables to use consolidated postgres
- Update Replay Kernel volume mounts to use relative paths from infra/
- No code changes to Replay Kernel itself

### 4.4 Observability Configuration Updates

**prometheus.yml** - Add scrape targets:
```yaml
scrape_configs:
  - job_name: 'gateway'
    static_configs:
      - targets: ['crx-gateway:3001']
  - job_name: 'ui-next'
    static_configs:
      - targets: ['crx-ui-next:3000']
  - job_name: 'replay-kernel'
    static_configs:
      - targets: ['crx-replay-kernel:8080']
```

**No changes required** for loki-config.yml or tempo-config.yml.

### 4.5 Database Schema Updates

**New Schemas Required**:
- `scripts/init-gateway-db.sql` - Gateway metadata tables
- `scripts/init-ui-db.sql` - UI session tables (optional)

**Existing Schema**:
- `scripts/init-db.sql` - Already exists for postgres initialization

---

## 5. Migration Sequence

### 5.1 Phase 1: Infrastructure Preparation (2 hours)

**Tasks**:
1. Resolve port conflict: Update .env to move Grafana to 3002
2. Add health checks to all observability services
3. Update docker-compose.yml with health checks
4. Test infrastructure services startup

**Verification**:
```bash
cd CRX/CascadeProjects/infra
docker compose up -d postgres redis ollama prometheus grafana loki tempo
docker compose ps
docker compose logs
```

### 5.2 Phase 2: Replay Kernel Migration (1 hour)

**Tasks**:
1. Add replay-kernel service to infra/docker-compose.yml
2. Update Replay Kernel environment variables
3. Update Replay Kernel volume mounts
4. Remove replay-kernel from CRX/docker-compose.yml
5. Test Replay Kernel startup

**Verification**:
```bash
docker compose up -d replay-kernel
docker compose logs replay-kernel
docker exec crx-replay-kernel npx ts-node runtime/replay/constitutional_self_check.ts
```

### 5.3 Phase 3: Gateway Implementation (8-12 hours)

**Tasks**:
1. Create gateway directory structure
2. Implement Gateway Dockerfile and package.json
3. Implement Ollama provider
4. Implement provider registry
5. Implement REST API endpoints
6. Add health check endpoint
7. Build and test Gateway container
8. Add Gateway to docker-compose.yml
9. Test Gateway → Ollama communication

**Verification**:
```bash
cd gateway
docker build -t crx-gateway:1.0.0 .
cd ..
docker compose up -d gateway
curl http://localhost:3001/api/v1/health
curl http://localhost:3001/api/v1/models
```

### 5.4 Phase 4: UI Implementation (13-19 hours)

**Tasks**:
1. Create ui-next directory structure
2. Initialize Next.js project with TypeScript and Tailwind
3. Implement Gateway client
4. Implement chat interface components
5. Implement model selector
6. Add provider status indicator
7. Build and test UI container
8. Add UI to docker-compose.yml
9. Test UI → Gateway communication

**Verification**:
```bash
cd ui-next
docker build -t crx-ui-next:1.0.0 .
cd ..
docker compose up -d ui-next
curl http://localhost:3000
# Test chat interface in browser
```

### 5.5 Phase 5: Ollama Model Setup (1 hour)

**Tasks**:
1. Start Ollama service
2. Pull initial models (qwen2.5-coder:7b, llama3.2:3b)
3. Verify model availability
4. Test inference

**Verification**:
```bash
docker exec crx-ollama ollama pull qwen2.5-coder:7b
docker exec crx-ollama ollama pull llama3.2:3b
docker exec crx-ollama ollama list
docker exec crx-ollama ollama run qwen2.5-coder:7b "Hello"
```

### 5.6 Phase 6: Observability Integration (2-3 hours)

**Tasks**:
1. Update prometheus.yml with Gateway and UI scrape targets
2. Add logging to Gateway (Pino)
3. Add metrics to Gateway (prom-client)
4. Add logging to UI
5. Configure Loki log shipping
6. Configure Tempo tracing
7. Test observability stack

**Verification**:
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets
# Check Grafana dashboards
curl http://localhost:3002
# Check Loki logs
curl http://localhost:3100/loki/api/v1/query
```

### 5.7 Phase 7: End-to-End Testing (2-3 hours)

**Tasks**:
1. Test full stack startup: `docker compose up -d`
2. Test UI → Gateway → Ollama flow
3. Test model switching
4. Test error handling
5. Test health checks
6. Test observability signals
7. Test Replay Kernel integration (certification flow)

**Verification**:
```bash
docker compose up -d
# Test in browser: http://localhost:3000
# Send chat message
# Verify response
# Check logs: docker compose logs
# Check metrics: http://localhost:9090
# Check traces: http://localhost:3200
```

### 5.8 Phase 8: Cleanup (1 hour)

**Tasks**:
1. Remove CRX/docker-compose.yml (deprecated)
2. Remove agents/docker-compose.yml (broken, not needed)
3. Update documentation
4. Create README for infra/
5. Archive old compose files

**Verification**:
```bash
# Ensure only one docker-compose.yml exists
ls CRX/docker-compose.yml  # Should not exist
ls CRX/CascadeProjects/infra/docker-compose.yml  # Should exist
```

---

## 6. Risks

### 6.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Port conflicts after Grafana move | Low | Medium | Test all port allocations before deployment |
| Replay Kernel volume mount path issues | Medium | Medium | Test volume mounts with relative paths |
| Gateway provider integration bugs | Medium | High | Thorough unit and integration testing |
| UI state management complexity | Medium | Medium | Keep state simple, use React hooks only |
| Ollama model pull failures | Low | Medium | Verify network connectivity, use fallback models |
| Observability integration complexity | Medium | Low | Implement incrementally, test each component |

### 6.2 Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Resource exhaustion (Ollama models) | Medium | High | Monitor disk usage, set limits |
| Container startup order issues | Low | Medium | Use health checks and depends_on conditions |
| Database migration failures | Low | High | Backup postgres data before migration |
| Configuration drift across .env files | Medium | Medium | Single source of truth in infra/.env |

### 6.3 Constitutional Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Gateway attempts to assert authority | Low | Critical | Code review, authority audit, no database access |
| UI bypasses Gateway to access providers | Low | Medium | Network segmentation, Gateway enforcement |
| Replay Kernel authority erosion | Very Low | Critical | Constitutional compliance audit, authority verification |

**Constitutional Risk Assessment**: ✅ LOW

**Justification**: Clear authority boundaries defined, no authority transfer to infrastructure services, Replay Kernel maintains constitutional authority.

---

## 7. Estimated Implementation Effort

### 7.1 Effort Breakdown

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 1: Infrastructure Preparation | 2 hours | None |
| Phase 2: Replay Kernel Migration | 1 hour | Phase 1 |
| Phase 3: Gateway Implementation | 8-12 hours | Phase 1, 2 |
| Phase 4: UI Implementation | 13-19 hours | Phase 3 |
| Phase 5: Ollama Model Setup | 1 hour | Phase 1 |
| Phase 6: Observability Integration | 2-3 hours | Phase 3, 4 |
| Phase 7: End-to-End Testing | 2-3 hours | All previous phases |
| Phase 8: Cleanup | 1 hour | Phase 7 |

**Total Effort**: 30-42 hours

**Recommended Timeline**: 1-2 weeks (part-time) or 1 week (full-time)

### 7.2 Effort by Component

| Component | Effort | Complexity |
|-----------|--------|------------|
| docker-compose.yml consolidation | 2 hours | Low |
| Gateway implementation | 8-12 hours | Medium |
| UI implementation | 13-19 hours | Medium |
| Replay Kernel migration | 1 hour | Low |
| Observability integration | 2-3 hours | Low |
| Testing and validation | 4-6 hours | Medium |

### 7.3 Skill Requirements

**Required Skills**:
- Docker and Docker Compose
- TypeScript
- Node.js
- Next.js (for UI)
- REST API design (for Gateway)
- PostgreSQL (basic)
- Redis (basic)

**Nice-to-Have Skills**:
- Prometheus/Grafana configuration
- Loki/Tempo configuration
- Ollama experience

---

## 8. Success Criteria

### 8.1 Functional Requirements

✅ Single docker-compose.yml at `CRX/CascadeProjects/infra/`  
✅ All services start with `docker compose up -d`  
✅ UI accessible at http://localhost:3000  
✅ Gateway accessible at http://localhost:3001  
✅ Ollama accessible at http://localhost:11434  
✅ UI → Gateway → Ollama flow works end-to-end  
✅ Model selection works in UI  
✅ Provider switching works (Ollama ↔ OpenRouter)  
✅ Replay Kernel integrated and functional  
✅ Health checks pass for all services  
✅ Observability stack collects metrics, logs, traces  

### 8.2 Non-Functional Requirements

✅ No duplicate docker-compose files  
✅ No port conflicts  
✅ All services have health checks  
✅ Single .env file for configuration  
✅ Gateway, UI, Ollama are NOT authorities  
✅ Replay Kernel maintains constitutional authority  
✅ Infrastructure services are replaceable  
✅ Startup time < 2 minutes for full stack  
✅ Memory usage < 16GB (with models)  

### 8.3 Compliance Requirements

✅ Compliant with CRX_CONSTITUTION.md  
✅ Compliant with AGENT.md  
✅ No new constitutional authorities created  
✅ No authority transfer to infrastructure  
✅ Replay Kernel preserves authority  
✅ REUSE BEFORE CREATE principle followed  
✅ ONE EXECUTION SUBSTRATE principle followed  

---

## 9. Rollback Plan

### 9.1 Rollback Triggers

- Critical bugs in Gateway or UI
- Replay Kernel integration failures
- Constitutional authority violations
- Performance issues (startup > 5 minutes)
- Resource exhaustion

### 9.2 Rollback Procedure

1. Stop all services: `docker compose down`
2. Restore CRX/docker-compose.yml from backup
3. Restore agents/docker-compose.yml from backup
4. Restart original infrastructure
5. Document rollback reason

### 9.3 Rollback Effort

**Time to Rollback**: 30 minutes

**Data Loss Risk**: Low (volumes persist)

---

## 10. Post-Implementation Tasks

### 10.1 Documentation

- Create README.md for infra/
- Document service endpoints
- Document environment variables
- Document troubleshooting steps
- Update AGENT.md with new infrastructure location

### 10.2 Monitoring

- Set up Grafana dashboards for Gateway and UI
- Configure alerts for service health
- Configure alerts for resource usage
- Configure alerts for error rates

### 10.3 Future Enhancements

- Add OpenRouter provider to Gateway
- Implement Replay Kernel certification flow
- Add authentication layer (if needed)
- Add rate limiting to Gateway
- Implement caching in Gateway
- Add more models to Ollama

---

## 11. Conclusion

### 11.1 Proposal Summary

**Objective**: Consolidate CRX infrastructure into single canonical local execution substrate at `CRX/CascadeProjects/infra/`.

**Approach**:
- Consolidate three docker-compose files into one
- Implement Gateway for provider abstraction
- Implement UI for user interaction
- Migrate Replay Kernel to consolidated stack
- Resolve port conflicts
- Add health checks
- Integrate observability

**Compliance**: ✅ Fully compliant with CRX_CONSTITUTION.md and AGENT.md

**Authority Preservation**: ✅ Replay Kernel maintains constitutional authority; Gateway, UI, Ollama are non-authoritative infrastructure/presentation/external components

**Effort**: 30-42 hours total

**Risk**: Low - well-understood components, clear migration path

### 11.2 Recommendation

**APPROVE FOR IMPLEMENTATION**

**Rationale**:
- Eliminates infrastructure fragmentation
- Follows REUSE BEFORE CREATE principle
- Follows ONE EXECUTION SUBSTRATE principle
- Preserves constitutional authority boundaries
- Enables local development and testing
- Provides foundation for future enhancements

### 11.3 Next Steps

1. Obtain approval for proposal
2. Begin Phase 1: Infrastructure Preparation
3. Execute migration sequence
4. Perform end-to-end testing
5. Deploy to local development environment
6. Document and handoff

---

## Appendix A: Reference Documents

- `INFRA_AUDIT.md` - Infrastructure archaeology audit
- `OLLAMA_READINESS.md` - Ollama deployment readiness
- `GATEWAY_INSERTION_PLAN.md` - Gateway service design
- `UI_INSERTION_PLAN.md` - UI integration design
- `AUTHORITY_ALIGNMENT_AUDIT.md` - Constitutional authority verification
- `CRX_CONSTITUTION.md` - Constitutional kernel specification
- `AGENT.md` - Agent execution directive

## Appendix B: Configuration Files

- `docker-compose.yml` - Consolidated service orchestration
- `.env` - Centralized environment configuration
- `observability/prometheus.yml` - Prometheus scrape configuration
- `observability/loki-config.yml` - Loki log aggregation
- `observability/tempo-config.yml` - Tempo tracing

## Appendix C: Service Endpoints

| Service | Internal Endpoint | External Endpoint | Purpose |
|---------|-------------------|-------------------|---------|
| UI | http://crx-ui-next:3000 | http://localhost:3000 | User interface |
| Gateway | http://crx-gateway:3001 | http://localhost:3001 | Provider abstraction |
| Ollama | http://crx-ollama:11434 | http://localhost:11434 | LLM inference |
| PostgreSQL | postgres://crx-postgres:5432 | localhost:5432 | Persistent storage |
| Redis | redis://crx-redis:6379 | localhost:6379 | Cache/message broker |
| Prometheus | http://crx-prometheus:9090 | http://localhost:9090 | Metrics collection |
| Grafana | http://crx-grafana:3000 | http://localhost:3002 | Metrics visualization |
| Loki | http://crx-loki:3100 | http://localhost:3100 | Log aggregation |
| Tempo | http://crx-tempo:3200 | http://localhost:3200 | Distributed tracing |

---

**Document ID**: CRX-LOCAL-SUBSTRATE-PROPOSAL-2026-06-08  
**Status**: PROPOSED  
**Constitutional Compliance**: ✅ VERIFIED  
**Authority Alignment**: ✅ VERIFIED  
**Next Action**: Awaiting approval for implementation
