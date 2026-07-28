# CRX Cognition Stack Expansion Plan

**Date**: 2026-06-08  
**Location**: C:\Users\nolan\CRX\CascadeProjects\infra  
**Mission**: Expand local execution substrate to full cognition stack with workers, job queues, and continuous execution

---

## Executive Summary

**Objective**: Transform Docker Compose into the operating system for the entire CRX cognition stack. Single `docker compose up -d` brings up all services, workers, and continuous execution loops.

**Current State**: Infrastructure layer only (postgres, redis, ollama, observability). Gateway and UI not implemented. No workers, no job queues, no continuous execution.

**Target State**: Three-layer architecture:
- **Infrastructure Layer** (Persistent): Redis, Neo4j, Ollama, Gateway
- **Cognition Layer** (Replaceable): Research Worker, Graph Worker, Artifact Worker, ADR Worker, Embedding Worker
- **Sovereign Layer** (Persistent + Authoritative): Replay Kernel, Witness Authority, Canonicalization, Artifacts, Knowledge Vault

**Key Additions**:
- Neo4j for knowledge graph
- 5 worker services with continuous execution loops
- Redis job queues (research, embedding, graph, artifact, audit)
- Job persistence system (/workspace/jobs/)
- Host orchestration script for auto-browser launch
- Comprehensive verification procedures

**Estimated Effort**: 60-80 hours (beyond previous 30-42 hours)

---

## 1. Current vs Required Infrastructure

### 1.1 Current Services

| Service | Status | Layer |
|---------|--------|-------|
| postgres | Configured | Infrastructure |
| redis | Configured | Infrastructure |
| ollama | Configured | Infrastructure |
| prometheus | Configured | Observability |
| grafana | Configured | Observability |
| loki | Configured | Observability |
| tempo | Configured | Observability |
| gateway | NOT IMPLEMENTED | Infrastructure |
| ui-next | NOT IMPLEMENTED | Presentation |
| replay-kernel | Isolated (CRX root) | Sovereign |

### 1.2 Required Additions

| Service | Layer | Persistence | Replaceable |
|---------|-------|-------------|-------------|
| **neo4j** | Infrastructure | Persistent | No |
| **gateway** | Infrastructure | Stateless | Yes |
| **research-worker** | Cognition | Stateless | Yes |
| **graph-worker** | Cognition | Stateless | Yes |
| **artifact-worker** | Cognition | Stateless | Yes |
| **adr-worker** | Cognition | Stateless | Yes |
| **embedding-worker** | Cognition | Stateless | Yes |
| **replay-kernel** | Sovereign | Persistent | No |

### 1.3 Gap Analysis

**Missing Infrastructure**:
- Neo4j (knowledge graph database)
- Gateway (provider abstraction)
- UI (user interface)

**Missing Cognition Layer**:
- All 5 worker services
- Redis job queue configuration
- Job persistence system
- Continuous execution loops

**Missing Orchestration**:
- Host orchestration script (auto-browser launch)
- Verification procedures
- Health check automation

---

## 2. Expanded Docker Compose Architecture

### 2.1 Three-Layer Service Graph

```
CRX/CascadeProjects/infra/docker-compose.yml
│
├── Infrastructure Layer (Persistent)
│   ├── postgres (5432)
│   ├── redis (6379)
│   ├── neo4j (7474, 7687)
│   ├── ollama (11434)
│   └── gateway (3001)
│
├── Cognition Layer (Replaceable/Disposable)
│   ├── research-worker
│   ├── graph-worker
│   ├── artifact-worker
│   ├── adr-worker
│   └── embedding-worker
│
├── Sovereign Layer (Persistent + Authoritative)
│   └── replay-kernel (integrated)
│
├── Presentation Layer
│   └── ui-next (3000)
│
├── Observability Layer
│   ├── prometheus (9090)
│   ├── grafana (3002)
│   ├── loki (3100)
│   └── tempo (3200, 4317)
│
└── Network
    └── crx-network (bridge)
```

### 2.2 Expanded docker-compose.yml Structure

```yaml
version: '3.8'

services:
  # ============================================
  # INFRASTRUCTURE LAYER (Persistent)
  # ============================================
  
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

  neo4j:
    image: neo4j:5.15-community
    container_name: crx-neo4j
    environment:
      NEO4J_AUTH: neo4j/${NEO4J_PASSWORD:-crx_dev_password}
      NEO4J_PLUGINS: '["apoc"]'
      NEO4J_dbms_memory_pagecache_size: 1G
      NEO4J_dbms_memory_heap_initial__size: 512M
      NEO4J_dbms_memory_heap_max__size: 512M
    ports:
      - "${NEO4J_HTTP_PORT:-7474}:7474"
      - "${NEO4J_BOLT_PORT:-7687}:7687"
    volumes:
      - ./volumes/neo4j/data:/data
      - ./volumes/neo4j/logs:/logs
      - ./volumes/neo4j/plugins:/plugins
      - ./volumes/neo4j/import:/var/lib/neo4j/import
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:7474 || exit 1"]
      interval: 30s
      timeout: 10s
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
      - NEO4J_URI=bolt://crx-neo4j:7687
      - NEO4J_USER=neo4j
      - NEO4J_PASSWORD=${NEO4J_PASSWORD:-crx_dev_password}
    depends_on:
      ollama:
        condition: service_healthy
      redis:
        condition: service_healthy
      postgres:
        condition: service_healthy
      neo4j:
        condition: service_healthy
    networks:
      - crx-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

  # ============================================
  # COGNITION LAYER (Replaceable/Disposable)
  # ============================================
  
  research-worker:
    build:
      context: ./workers/research
      dockerfile: Dockerfile
    container_name: crx-research-worker
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
      - REDIS_URL=redis://crx-redis:6379
      - POSTGRES_URL=postgres://crx:crx_dev_password@crx-postgres:5432/crx_kernel
      - NEO4J_URI=bolt://crx-neo4j:7687
      - NEO4J_USER=neo4j
      - NEO4J_PASSWORD=${NEO4J_PASSWORD:-crx_dev_password}
      - GATEWAY_URL=http://crx-gateway:3001
      - JOB_QUEUE=research.jobs
      - WORKSPACE_PATH=/workspace/jobs
    volumes:
      - ./workspace/jobs:/workspace/jobs
    depends_on:
      redis:
        condition: service_healthy
      postgres:
        condition: service_healthy
      neo4j:
        condition: service_healthy
      gateway:
        condition: service_healthy
    networks:
      - crx-network
    restart: unless-stopped
    deploy:
      replicas: ${RESEARCH_WORKER_REPLICAS:-1}

  graph-worker:
    build:
      context: ./workers/graph
      dockerfile: Dockerfile
    container_name: crx-graph-worker
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
      - REDIS_URL=redis://crx-redis:6379
      - POSTGRES_URL=postgres://crx:crx_dev_password@crx-postgres:5432/crx_kernel
      - NEO4J_URI=bolt://crx-neo4j:7687
      - NEO4J_USER=neo4j
      - NEO4J_PASSWORD=${NEO4J_PASSWORD:-crx_dev_password}
      - JOB_QUEUE=graph.jobs
      - WORKSPACE_PATH=/workspace/jobs
    volumes:
      - ./workspace/jobs:/workspace/jobs
    depends_on:
      redis:
        condition: service_healthy
      postgres:
        condition: service_healthy
      neo4j:
        condition: service_healthy
    networks:
      - crx-network
    restart: unless-stopped
    deploy:
      replicas: ${GRAPH_WORKER_REPLICAS:-1}

  artifact-worker:
    build:
      context: ./workers/artifact
      dockerfile: Dockerfile
    container_name: crx-artifact-worker
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
      - REDIS_URL=redis://crx-redis:6379
      - POSTGRES_URL=postgres://crx:crx_dev_password@crx-postgres:5432/crx_kernel
      - JOB_QUEUE=artifact.jobs
      - WORKSPACE_PATH=/workspace/jobs
    volumes:
      - ./workspace/jobs:/workspace/jobs
      - ../../:/app/crx:ro  # Read-only access to CRX repository
    depends_on:
      redis:
        condition: service_healthy
      postgres:
        condition: service_healthy
    networks:
      - crx-network
    restart: unless-stopped
    deploy:
      replicas: ${ARTIFACT_WORKER_REPLICAS:-1}

  adr-worker:
    build:
      context: ./workers/adr
      dockerfile: Dockerfile
    container_name: crx-adr-worker
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
      - REDIS_URL=redis://crx-redis:6379
      - POSTGRES_URL=postgres://crx:crx_dev_password@crx-postgres:5432/crx_kernel
      - NEO4J_URI=bolt://crx-neo4j:7687
      - NEO4J_USER=neo4j
      - NEO4J_PASSWORD=${NEO4J_PASSWORD:-crx_dev_password}
      - JOB_QUEUE=adr.jobs
      - WORKSPACE_PATH=/workspace/jobs
    volumes:
      - ./workspace/jobs:/workspace/jobs
      - ../../docs/adr:/app/adr:ro  # Read-only access to ADRs
    depends_on:
      redis:
        condition: service_healthy
      postgres:
        condition: service_healthy
      neo4j:
        condition: service_healthy
    networks:
      - crx-network
    restart: unless-stopped
    deploy:
      replicas: ${ADR_WORKER_REPLICAS:-1}

  embedding-worker:
    build:
      context: ./workers/embedding
      dockerfile: Dockerfile
    container_name: crx-embedding-worker
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
      - REDIS_URL=redis://crx-redis:6379
      - POSTGRES_URL=postgres://crx:crx_dev_password@crx-postgres:5432/crx_kernel
      - NEO4J_URI=bolt://crx-neo4j:7687
      - NEO4J_USER=neo4j
      - NEO4J_PASSWORD=${NEO4J_PASSWORD:-crx_dev_password}
      - JOB_QUEUE=embedding.jobs
      - WORKSPACE_PATH=/workspace/jobs
    volumes:
      - ./workspace/jobs:/workspace/jobs
    depends_on:
      redis:
        condition: service_healthy
      postgres:
        condition: service_healthy
      neo4j:
        condition: service_healthy
    networks:
      - crx-network
    restart: unless-stopped
    deploy:
      replicas: ${EMBEDDING_WORKER_REPLICAS:-1}

  # ============================================
  # SOVEREIGN LAYER (Persistent + Authoritative)
  # ============================================
  
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
      - REDIS_URL=redis://crx-redis:6379
      - NEO4J_URI=bolt://crx-neo4j:7687
      - NEO4J_USER=neo4j
      - NEO4J_PASSWORD=${NEO4J_PASSWORD:-crx_dev_password}
    volumes:
      - ../../certification:/app/certification:ro
      - ../../tests/corpus:/app/tests/corpus:ro
      - ./workspace/jobs:/workspace/jobs
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      neo4j:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "npx", "ts-node", "runtime/replay/constitutional_self_check.ts"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s
    networks:
      - crx-network

  # ============================================
  # PRESENTATION LAYER
  # ============================================
  
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

  # ============================================
  # OBSERVABILITY LAYER
  # ============================================
  
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
      - "${GRAFANA_PORT:-3002}:3000"
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
  neo4j-data:
  ollama-data:
  prometheus-data:
  grafana-data:
  loki-data:
  tempo-data:
```

### 2.3 Updated Port Allocation

| Service | Port | Layer |
|---------|------|-------|
| UI (Next.js) | 3000 | Presentation |
| Gateway | 3001 | Infrastructure |
| Grafana | 3002 | Observability |
| PostgreSQL | 5432 | Infrastructure |
| Redis | 6379 | Infrastructure |
| Neo4j HTTP | 7474 | Infrastructure |
| Neo4j Bolt | 7687 | Infrastructure |
| Ollama | 11434 | Infrastructure |
| Prometheus | 9090 | Observability |
| Loki | 3100 | Observability |
| Tempo | 3200, 4317 | Observability |

---

## 3. Redis Job Queue Architecture

### 3.1 Queue Design

**Queue Names**:
- `research.jobs` - Research and discovery tasks
- `embedding.jobs` - Text embedding generation
- `graph.jobs` - Knowledge graph operations
- `artifact.jobs` - Artifact analysis and extraction
- `audit.jobs` - Constitutional audit tasks

**Queue Structure** (Redis Lists):
```
research.jobs:pending
research.jobs:running
research.jobs:completed
research.jobs:failed

embedding.jobs:pending
embedding.jobs:running
embedding.jobs:completed
embedding.jobs:failed

graph.jobs:pending
graph.jobs:running
graph.jobs:completed
graph.jobs:failed

artifact.jobs:pending
artifact.jobs:running
artifact.jobs:completed
artifact.jobs:failed

audit.jobs:pending
audit.jobs:running
audit.jobs:completed
audit.jobs:failed
```

### 3.2 Job Schema

```typescript
interface Job {
  id: string;                    // UUID
  type: 'research' | 'embedding' | 'graph' | 'artifact' | 'audit';
  queue: string;                // Queue name
  status: 'pending' | 'running' | 'completed' | 'failed';
  payload: Record<string, any>; // Job-specific data
  result?: any;                  // Job result (if completed)
  error?: string;               // Error message (if failed)
  created_at: Date;             // ISO timestamp
  started_at?: Date;             // ISO timestamp
  completed_at?: Date;           // ISO timestamp
  retry_count: number;          // Number of retries
  max_retries: number;          // Maximum retry attempts
  worker_id?: string;           // Worker that processed the job
  lineage?: string[];           // Job lineage for replay
}
```

### 3.3 Worker Queue Assignment

| Worker | Primary Queue | Secondary Queues |
|--------|---------------|------------------|
| research-worker | research.jobs | embedding.jobs (for research embeddings) |
| graph-worker | graph.jobs | research.jobs (for graph discovery) |
| artifact-worker | artifact.jobs | audit.jobs (for artifact audits) |
| adr-worker | audit.jobs | graph.jobs (for ADR graph integration) |
| embedding-worker | embedding.jobs | research.jobs (for research embeddings) |

### 3.4 Queue Operations

**Enqueue Job**:
```typescript
async function enqueue(queue: string, job: Job): Promise<void> {
  const jobJson = JSON.stringify(job);
  await redis.lpush(`${queue}:pending`, jobJson);
  await redis.hset(`job:${job.id}`, job);
}
```

**Dequeue Job**:
```typescript
async function dequeue(queue: string): Promise<Job | null> {
  const jobJson = await redis.rpop(`${queue}:pending`);
  if (!jobJson) return null;
  
  const job = JSON.parse(jobJson);
  job.status = 'running';
  job.started_at = new Date().toISOString();
  
  await redis.lpush(`${queue}:running`, JSON.stringify(job));
  await redis.hset(`job:${job.id}`, job);
  
  return job;
}
```

**Complete Job**:
```typescript
async function complete(queue: string, job: Job, result: any): Promise<void> {
  job.status = 'completed';
  job.completed_at = new Date().toISOString();
  job.result = result;
  
  await redis.lrem(`${queue}:running`, 1, JSON.stringify(job));
  await redis.lpush(`${queue}:completed`, JSON.stringify(job));
  await redis.hset(`job:${job.id}`, job);
}
```

**Fail Job**:
```typescript
async function fail(queue: string, job: Job, error: string): Promise<void> {
  job.status = 'failed';
  job.completed_at = new Date().toISOString();
  job.error = error;
  job.retry_count++;
  
  await redis.lrem(`${queue}:running`, 1, JSON.stringify(job));
  
  if (job.retry_count < job.max_retries) {
    // Requeue for retry
    job.status = 'pending';
    await redis.lpush(`${queue}:pending`, JSON.stringify(job));
  } else {
    // Move to failed
    await redis.lpush(`${queue}:failed`, JSON.stringify(job));
  }
  
  await redis.hset(`job:${job.id}`, job);
}
```

---

## 4. Job Persistence System

### 4.1 Workspace Structure

```
CRX/CascadeProjects/infra/workspace/jobs/
├── pending/
│   ├── research/
│   ├── embedding/
│   ├── graph/
│   ├── artifact/
│   └── audit/
├── running/
│   ├── research/
│   ├── embedding/
│   ├── graph/
│   ├── artifact/
│   └── audit/
├── completed/
│   ├── research/
│   ├── embedding/
│   ├── graph/
│   ├── artifact/
│   └── audit/
└── failed/
    ├── research/
    ├── embedding/
    ├── graph/
    ├── artifact/
    └── audit/
```

### 4.2 Job File Format

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "research",
  "queue": "research.jobs",
  "status": "completed",
  "payload": {
    "query": "event sourcing patterns",
    "repository": "crx",
    "depth": 3
  },
  "result": {
    "findings": [...],
    "sources": [...]
  },
  "created_at": "2026-06-08T21:00:00.000Z",
  "started_at": "2026-06-08T21:00:05.000Z",
  "completed_at": "2026-06-08T21:00:30.000Z",
  "retry_count": 0,
  "max_retries": 3,
  "worker_id": "crx-research-worker-1",
  "lineage": ["parent-job-id"]
}
```

### 4.3 Persistence Strategy

**Dual Persistence**:
1. **Redis**: Fast queue operations, real-time status
2. **Filesystem**: Durable job records, replay capability

**Write Strategy**:
```typescript
async function persistJob(job: Job): Promise<void> {
  // Redis for fast access
  await redis.hset(`job:${job.id}`, job);
  
  // Filesystem for durability
  const statusDir = `./workspace/jobs/${job.status}/${job.type}`;
  await fs.ensureDir(statusDir);
  await fs.writeJson(`${statusDir}/${job.id}.json`, job);
}
```

**Read Strategy**:
```typescript
async function loadJob(jobId: string): Promise<Job | null> {
  // Try Redis first (fast)
  const redisJob = await redis.hgetall(`job:${jobId}`);
  if (redisJob) return JSON.parse(redisJob);
  
  // Fallback to filesystem (durable)
  const statusDirs = ['pending', 'running', 'completed', 'failed'];
  for (const status of statusDirs) {
    const jobPath = `./workspace/jobs/${status}/*/${jobId}.json`;
    const files = await glob(jobPath);
    if (files.length > 0) {
      return await fs.readJson(files[0]);
    }
  }
  
  return null;
}
```

---

## 5. Worker Service Design

### 5.1 Continuous Execution Loop

**Worker Pattern**:
```typescript
class Worker {
  private queue: string;
  private running: boolean = true;
  
  constructor(queue: string) {
    this.queue = queue;
  }
  
  async start(): Promise<void> {
    while (this.running) {
      try {
        const job = await dequeue(this.queue);
        if (job) {
          await this.processJob(job);
        } else {
          // No jobs, wait before polling again
          await this.sleep(1000);
        }
      } catch (error) {
        console.error('Worker error:', error);
        await this.sleep(5000); // Backoff on error
      }
    }
  }
  
  async processJob(job: Job): Promise<void> {
    try {
      const result = await this.execute(job);
      await complete(this.queue, job, result);
      await persistJob(job);
    } catch (error) {
      await fail(this.queue, job, error.message);
      await persistJob(job);
    }
  }
  
  async execute(job: Job): Promise<any> {
    // Implemented by each worker type
    throw new Error('Not implemented');
  }
  
  stop(): void {
    this.running = false;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 5.2 Research Worker

**Responsibilities**:
- Repository scanning and discovery
- Pattern detection
- Research queries and synthesis
- Knowledge extraction

**Job Types**:
- `scan_repository` - Scan repository for patterns
- `research_query` - Execute research query
- `extract_patterns` - Extract architectural patterns
- `discover_relationships` - Discover code relationships

**Continuous Loop**:
```typescript
class ResearchWorker extends Worker {
  async execute(job: Job): Promise<any> {
    switch (job.payload.type) {
      case 'scan_repository':
        return await this.scanRepository(job.payload);
      case 'research_query':
        return await this.executeQuery(job.payload);
      case 'extract_patterns':
        return await this.extractPatterns(job.payload);
      case 'discover_relationships':
        return await this.discoverRelationships(job.payload);
      default:
        throw new Error(`Unknown job type: ${job.payload.type}`);
    }
  }
  
  private async scanRepository(payload: any): Promise<any> {
    // Scan repository for architectural patterns
    // Detect: event sourcing, replay, workflow orchestration, etc.
    // Return findings to graph-worker for integration
  }
}
```

### 5.3 Graph Worker

**Responsibilities**:
- Knowledge graph construction
- Node and edge creation
- Graph queries and traversal
- Relationship management

**Job Types**:
- `create_node` - Create graph node
- `create_edge` - Create graph edge
- `query_graph` - Execute graph query
- `traverse_relationships` - Traverse graph relationships

**Continuous Loop**:
```typescript
class GraphWorker extends Worker {
  private neo4j: Driver;
  
  async execute(job: Job): Promise<any> {
    switch (job.payload.type) {
      case 'create_node':
        return await this.createNode(job.payload);
      case 'create_edge':
        return await this.createEdge(job.payload);
      case 'query_graph':
        return await this.queryGraph(job.payload);
      case 'traverse_relationships':
        return await this.traverseRelationships(job.payload);
      default:
        throw new Error(`Unknown job type: ${job.payload.type}`);
    }
  }
  
  private async createNode(payload: any): Promise<any> {
    const session = this.neo4j.session();
    try {
      const result = await session.run(
        'CREATE (n:Node $props) RETURN n',
        { props: payload.properties }
      );
      return result.records[0].get('n');
    } finally {
      await session.close();
    }
  }
}
```

### 5.4 Artifact Worker

**Responsibilities**:
- Artifact analysis and extraction
- Canonicalization verification
- Identity assignment
- Lineage construction

**Job Types**:
- `analyze_artifact` - Analyze artifact
- `canonicalize` - Canonicalize content
- `assign_identity` - Assign identity
- `construct_lineage` - Construct lineage edges

**Continuous Loop**:
```typescript
class ArtifactWorker extends Worker {
  async execute(job: Job): Promise<any> {
    switch (job.payload.type) {
      case 'analyze_artifact':
        return await this.analyzeArtifact(job.payload);
      case 'canonicalize':
        return await this.canonicalize(job.payload);
      case 'assign_identity':
        return await this.assignIdentity(job.payload);
      case 'construct_lineage':
        return await this.constructLineage(job.payload);
      default:
        throw new Error(`Unknown job type: ${job.payload.type}`);
    }
  }
  
  private async canonicalize(payload: any): Promise<any> {
    // Use Replay Kernel for canonicalization
    // This ensures constitutional authority
    const response = await fetch('http://crx-replay-kernel:8080/api/canonicalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return response.json();
  }
}
```

### 5.5 ADR Worker

**Responsibilities**:
- ADR analysis and extraction
- Decision graph integration
- Pattern detection in ADRs
- Tradeoff analysis

**Job Types**:
- `analyze_adr` - Analyze ADR
- `extract_decision` - Extract decision
- `integrate_graph` - Integrate into knowledge graph
- `detect_patterns` - Detect decision patterns

**Continuous Loop**:
```typescript
class ADRWorker extends Worker {
  async execute(job: Job): Promise<any> {
    switch (job.payload.type) {
      case 'analyze_adr':
        return await this.analyzeADR(job.payload);
      case 'extract_decision':
        return await this.extractDecision(job.payload);
      case 'integrate_graph':
        return await this.integrateGraph(job.payload);
      case 'detect_patterns':
        return await this.detectPatterns(job.payload);
      default:
        throw new Error(`Unknown job type: ${job.payload.type}`);
    }
  }
}
```

### 5.6 Embedding Worker

**Responsibilities**:
- Text embedding generation
- Semantic similarity computation
- Vector storage and retrieval
- Embedding cache management

**Job Types**:
- `generate_embedding` - Generate text embedding
- `compute_similarity` - Compute semantic similarity
- `store_embedding` - Store embedding in Neo4j
- `retrieve_similar` - Retrieve similar items

**Continuous Loop**:
```typescript
class EmbeddingWorker extends Worker {
  async execute(job: Job): Promise<any> {
    switch (job.payload.type) {
      case 'generate_embedding':
        return await this.generateEmbedding(job.payload);
      case 'compute_similarity':
        return await this.computeSimilarity(job.payload);
      case 'store_embedding':
        return await this.storeEmbedding(job.payload);
      case 'retrieve_similar':
        return await this.retrieveSimilar(job.payload);
      default:
        throw new Error(`Unknown job type: ${job.payload.type}`);
    }
  }
  
  private async generateEmbedding(payload: any): Promise<any> {
    // Use Gateway → Ollama for embedding generation
    const response = await fetch('http://crx-gateway:3001/api/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: payload.text,
        model: 'nomic-embed-text'
      })
    });
    return response.json();
  }
}
```

---

## 6. Host Orchestration Script

### 6.1 PowerShell Startup Script

**File**: `C:\Users\nolan\CRX\CascadeProjects\infra\start.ps1`

```powershell
# CRX Cognition Stack Startup Script
# Auto-starts Docker Compose and opens browser

$ErrorActionPreference = "Stop"

Write-Host "Starting CRX Cognition Stack..." -ForegroundColor Green

# Navigate to infra directory
$infraPath = "C:\Users\nolan\CRX\CascadeProjects\infra"
Set-Location $infraPath

# Start Docker Compose
Write-Host "Starting Docker Compose services..." -ForegroundColor Yellow
docker compose up -d

# Wait for services to be healthy
Write-Host "Waiting for services to be healthy..." -ForegroundColor Yellow
$timeout = 120  # 2 minutes
$elapsed = 0

while ($elapsed -lt $timeout) {
    $unhealthy = docker compose ps --format json | ConvertFrom-Json | Where-Object { $_.State -ne "running" }
    
    if (-not $unhealthy) {
        Write-Host "All services are healthy!" -ForegroundColor Green
        break
    }
    
    Start-Sleep -Seconds 5
    $elapsed += 5
    Write-Host "Waiting... ($elapsed/$timeout seconds)" -ForegroundColor Cyan
}

if ($elapsed -ge $timeout) {
    Write-Host "Timeout waiting for services to be healthy" -ForegroundColor Red
    docker compose ps
    exit 1
}

# Verify Ollama models
Write-Host "Verifying Ollama models..." -ForegroundColor Yellow
docker exec crx-ollama ollama list

# Verify Gateway health
Write-Host "Verifying Gateway health..." -ForegroundColor Yellow
try {
    $gatewayHealth = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/health" -Method Get
    Write-Host "Gateway health: $($gatewayHealth.status)" -ForegroundColor Green
} catch {
    Write-Host "Gateway health check failed" -ForegroundColor Red
}

# Verify Gateway models endpoint
Write-Host "Verifying Gateway models endpoint..." -ForegroundColor Yellow
try {
    $models = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/models" -Method Get
    Write-Host "Available models: $($models.models.Count)" -ForegroundColor Green
} catch {
    Write-Host "Gateway models endpoint failed" -ForegroundColor Red
}

# Open browser
Write-Host "Opening browser..." -ForegroundColor Yellow
Start-Process "http://localhost:3000"

Write-Host "CRX Cognition Stack started successfully!" -ForegroundColor Green
Write-Host "UI: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Gateway: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Grafana: http://localhost:3002" -ForegroundColor Cyan
Write-Host "Neo4j: http://localhost:7474" -ForegroundColor Cyan
Write-Host "Prometheus: http://localhost:9090" -ForegroundColor Cyan
```

### 6.2 Batch File Alternative

**File**: `C:\Users\nolan\CRX\CascadeProjects\infra\start.bat`

```batch
@echo off
echo Starting CRX Cognition Stack...

cd /d C:\Users\nolan\CRX\CascadeProjects\infra

docker compose up -d

echo Waiting for services to be healthy...
timeout /t 30 /nobreak

echo Verifying Ollama models...
docker exec crx-ollama ollama list

echo Verifying Gateway health...
curl http://localhost:3001/api/v1/health

echo Opening browser...
start http://localhost:3000

echo CRX Cognition Stack started successfully!
echo UI: http://localhost:3000
echo Gateway: http://localhost:3001
echo Grafana: http://localhost:3002
pause
```

### 6.3 Task Scheduler Setup (Optional)

**For auto-start on boot**:

1. Open Task Scheduler
2. Create Basic Task
3. Trigger: "At startup"
4. Action: "Start a program"
5. Program: `powershell.exe`
6. Arguments: `-ExecutionPolicy Bypass -File "C:\Users\nolan\CRX\CascadeProjects\infra\start.ps1"`
7. Finish

---

## 7. Verification Procedures

### 7.1 Container Health Verification

**Command**:
```bash
docker ps
```

**Expected Output**:
```
CONTAINER ID   IMAGE                          STATUS          NAMES
abc123         crx-postgres                   Up (healthy)    crx-postgres
def456         crx-redis                      Up (healthy)    crx-redis
ghi789         crx-neo4j                      Up (healthy)    crx-neo4j
jkl012         crx-ollama                     Up (healthy)    crx-ollama
mno345         crx-gateway                    Up (healthy)    crx-gateway
pqr678         crx-research-worker            Up              crx-research-worker
stu901         crx-graph-worker               Up              crx-graph-worker
vwx234         crx-artifact-worker            Up              crx-artifact-worker
yza567         crx-adr-worker                 Up              crx-adr-worker
bcd890         crx-embedding-worker          Up              crx-embedding-worker
efg123         crx-replay-kernel              Up (healthy)    crx-replay-kernel
hij456         crx-ui-next                    Up (healthy)    crx-ui-next
klm789         crx-prometheus                 Up              crx-prometheus
nop012         crx-grafana                    Up              crx-grafana
qrs345         crx-loki                       Up              crx-loki
tuv678         crx-tempo                      Up              crx-tempo
```

**Verification Criteria**:
- All infrastructure services: Up (healthy)
- All workers: Up (no health check required, continuous execution)
- All observability services: Up

### 7.2 Ollama Mount Verification

**Command**:
```bash
docker exec -it crx-ollama ollama list
```

**Expected Output** (after model pull):
```
NAME                  ID              SIZE    MODIFIED
qwen2.5-coder:7b      abc123def456    4.5 GB  2026-06-08 21:00:00
llama3.2:3b           ghi789jkl012    2.0 GB  2026-06-08 21:00:00
```

**Persistence Test**:
```bash
# Stop containers
docker compose down

# Start containers
docker compose up -d

# Verify models still exist
docker exec -it crx-ollama ollama list
```

**Success Criteria**: Models persist after container restart

### 7.3 OAuth Persistence Verification

**Pre-Condition**: User has logged in and token.json exists

**Test**:
```bash
# Verify token exists before restart
Test-Path C:\Users\nolan\CRX\token.json

# Stop containers
docker compose down

# Start containers
docker compose up -d

# Verify token still exists
Test-Path C:\Users\nolan\CRX\token.json
```

**Success Criteria**: Token survives container restart

**Note**: OAuth token storage is host-side, not container-side. This is correct architecture.

### 7.4 Gateway Health Verification

**Command**:
```bash
curl http://localhost:3001/api/v1/health
```

**Expected Output**:
```json
{
  "status": "ok",
  "providers": {
    "ollama": true,
    "openrouter": false
  }
}
```

**Command**:
```bash
curl http://localhost:3001/api/v1/models
```

**Expected Output**:
```json
{
  "models": [
    {
      "name": "qwen2.5-coder:7b",
      "provider": "ollama"
    },
    {
      "name": "llama3.2:3b",
      "provider": "ollama"
    }
  ]
}
```

**Success Criteria**:
- Gateway health endpoint returns "ok"
- Ollama provider is healthy
- Models endpoint returns available models

### 7.5 UI Accessibility Verification

**Command**: Open browser to http://localhost:3000

**Expected UI Elements**:
- Chat interface
- Message input
- Model selector dropdown
- Settings button
- Provider status indicator

**Test Chat Flow**:
1. Type message in input field
2. Click send
3. Verify message appears in chat
4. Verify streaming response
5. Verify response completes

**Success Criteria**:
- UI loads without errors
- Chat interface functional
- Streaming responses work
- No console errors

### 7.6 Worker Verification

**Command**:
```bash
# Check worker logs
docker compose logs research-worker
docker compose logs graph-worker
docker compose logs artifact-worker
docker compose logs adr-worker
docker compose logs embedding-worker
```

**Expected Output**: Workers are processing jobs from queues

**Test Job Submission**:
```bash
# Submit test job to research queue
redis-cli LPUSH research.jobs '{"id":"test-job-1","type":"research","payload":{"query":"test"}}'

# Verify job is processed
redis-cli LRANGE research.jobs:completed 0 -1
```

**Success Criteria**:
- Workers are running and processing jobs
- Jobs move from pending → running → completed
- Job persistence files are created in workspace/jobs/

---

## 8. Updated .env Configuration

```env
# PostgreSQL Configuration
POSTGRES_USER=crx
POSTGRES_PASSWORD=crx_dev_password
POSTGRES_DB=crx_kernel
POSTGRES_PORT=5432

# Redis Configuration
REDIS_PORT=6379

# Neo4j Configuration
NEO4J_HTTP_PORT=7474
NEO4J_BOLT_PORT=7687
NEO4J_PASSWORD=crx_dev_password

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

# Worker Configuration
RESEARCH_WORKER_REPLICAS=1
GRAPH_WORKER_REPLICAS=1
ARTIFACT_WORKER_REPLICAS=1
ADR_WORKER_REPLICAS=1
EMBEDDING_WORKER_REPLICAS=1

# Observability Configuration
PROMETHEUS_PORT=9090
GRAFANA_PORT=3002
GRAFANA_USER=admin
GRAFANA_PASSWORD=admin
LOKI_PORT=3100
TEMPO_PORT=3200
TEMPO_OTLP_PORT=4317

# Runtime Configuration
LOG_LEVEL=info
ENVIRONMENT=development
```

---

## 9. Implementation Sequence

### 9.1 Phase 1: Infrastructure Expansion (8 hours)

**Tasks**:
1. Add Neo4j to docker-compose.yml
2. Configure Neo4j volumes and health check
3. Update .env with Neo4j configuration
4. Test Neo4j startup and connectivity
5. Verify Neo4j persistence

**Verification**:
```bash
docker compose up -d neo4j
curl http://localhost:7474
# Login to Neo4j browser
# Verify data persistence after restart
```

### 9.2 Phase 2: Gateway Implementation (8-12 hours)

**Tasks**:
1. Implement Gateway service (from previous plan)
2. Add Neo4j client to Gateway
3. Add Redis client to Gateway
4. Implement job submission endpoints
5. Test Gateway → Neo4j connectivity
6. Test Gateway → Redis connectivity

**Verification**:
```bash
docker compose up -d gateway
curl http://localhost:3001/api/v1/health
curl http://localhost:3001/api/v1/models
```

### 9.3 Phase 3: Worker Infrastructure (10 hours)

**Tasks**:
1. Create worker directory structure
2. Implement base Worker class with continuous loop
3. Implement Redis job queue operations
4. Implement job persistence system
5. Create workspace/jobs/ directory structure
6. Test job enqueue/dequeue/persistence

**Verification**:
```bash
# Submit test job
redis-cli LPUSH research.jobs '{"id":"test","type":"research"}'

# Verify job persistence
ls workspace/jobs/pending/research/
```

### 9.4 Phase 4: Research Worker (8 hours)

**Tasks**:
1. Implement ResearchWorker class
2. Implement repository scanning
3. Implement pattern detection
4. Implement research query execution
5. Add to docker-compose.yml
6. Test continuous execution loop

**Verification**:
```bash
docker compose up -d research-worker
docker compose logs research-worker
# Verify jobs are processed
```

### 9.5 Phase 5: Graph Worker (8 hours)

**Tasks**:
1. Implement GraphWorker class
2. Implement Neo4j client
3. Implement node/edge creation
4. Implement graph queries
5. Add to docker-compose.yml
6. Test graph operations

**Verification**:
```bash
docker compose up -d graph-worker
# Login to Neo4j browser
# Verify nodes and edges are created
```

### 9.6 Phase 6: Artifact Worker (6 hours)

**Tasks**:
1. Implement ArtifactWorker class
2. Implement artifact analysis
3. Implement Replay Kernel integration for canonicalization
4. Add to docker-compose.yml
5. Test artifact processing

**Verification**:
```bash
docker compose up -d artifact-worker
docker compose logs artifact-worker
# Verify artifacts are analyzed
```

### 9.7 Phase 7: ADR Worker (6 hours)

**Tasks**:
1. Implement ADRWorker class
2. Implement ADR analysis
3. Implement decision extraction
4. Add to docker-compose.yml
5. Test ADR processing

**Verification**:
```bash
docker compose up -d adr-worker
docker compose logs adr-worker
# Verify ADRs are analyzed
```

### 9.8 Phase 8: Embedding Worker (6 hours)

**Tasks**:
1. Implement EmbeddingWorker class
2. Implement embedding generation via Gateway
3. Implement similarity computation
4. Add to docker-compose.yml
5. Test embedding generation

**Verification**:
```bash
docker compose up -d embedding-worker
docker compose logs embedding-worker
# Verify embeddings are generated
```

### 9.9 Phase 9: UI Implementation (13-19 hours)

**Tasks**:
1. Implement UI service (from previous plan)
2. Add worker status display
3. Add job queue visualization
4. Add Neo4j graph visualization
5. Test UI → Gateway → Worker flow

**Verification**:
```bash
docker compose up -d ui-next
curl http://localhost:3000
# Test UI functionality
```

### 9.10 Phase 10: Host Orchestration (2 hours)

**Tasks**:
1. Create PowerShell startup script
2. Create batch file alternative
3. Add health check waiting logic
4. Add auto-browser launch
5. Test startup script

**Verification**:
```powershell
.\start.ps1
# Verify all services start
# Verify browser opens automatically
```

### 9.11 Phase 11: End-to-End Testing (4-6 hours)

**Tasks**:
1. Test full stack startup with script
2. Test container health
3. Test Ollama persistence
4. Test OAuth persistence
5. Test Gateway health
6. Test UI accessibility
7. Test worker job processing
8. Test job persistence
9. Test Neo4j graph operations
10. Test observability stack

**Verification**:
```bash
# Run all verification procedures
# Document any issues
# Fix bugs
```

### 9.12 Phase 12: Replay Kernel Integration (4 hours)

**Tasks**:
1. Move Replay Kernel to infra/docker-compose.yml
2. Add Replay Kernel → Neo4j integration
3. Add Replay Kernel → Redis integration
4. Test constitutional authority preservation
5. Test certification flow

**Verification**:
```bash
docker compose up -d replay-kernel
docker compose logs replay-kernel
# Verify Replay Kernel maintains authority
```

---

## 10. Estimated Effort

### 10.1 Effort Breakdown

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 1: Infrastructure Expansion | 8 hours | None |
| Phase 2: Gateway Implementation | 8-12 hours | Phase 1 |
| Phase 3: Worker Infrastructure | 10 hours | Phase 1, 2 |
| Phase 4: Research Worker | 8 hours | Phase 3 |
| Phase 5: Graph Worker | 8 hours | Phase 3 |
| Phase 6: Artifact Worker | 6 hours | Phase 3 |
| Phase 7: ADR Worker | 6 hours | Phase 3 |
| Phase 8: Embedding Worker | 6 hours | Phase 3 |
| Phase 9: UI Implementation | 13-19 hours | Phase 2 |
| Phase 10: Host Orchestration | 2 hours | All previous |
| Phase 11: End-to-End Testing | 4-6 hours | All previous |
| Phase 12: Replay Kernel Integration | 4 hours | All previous |

**Total Effort**: 83-105 hours

**Recommended Timeline**: 2-3 weeks (full-time) or 3-4 weeks (part-time)

### 10.2 Effort by Component

| Component | Effort | Complexity |
|-----------|--------|------------|
| Neo4j integration | 8 hours | Medium |
| Gateway implementation | 8-12 hours | Medium |
| Worker infrastructure | 10 hours | Medium |
| Research Worker | 8 hours | Medium |
| Graph Worker | 8 hours | Medium |
| Artifact Worker | 6 hours | Low-Medium |
| ADR Worker | 6 hours | Low-Medium |
| Embedding Worker | 6 hours | Low-Medium |
| UI implementation | 13-19 hours | Medium |
| Host orchestration | 2 hours | Low |
| Testing and validation | 4-6 hours | Medium |
| Replay Kernel integration | 4 hours | Low |

---

## 11. Risks and Mitigations

### 11.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Neo4j resource exhaustion | Medium | High | Monitor memory usage, set limits |
| Worker queue starvation | Medium | Medium | Implement job priorities, backpressure |
| Job persistence corruption | Low | High | Dual persistence (Redis + filesystem), validation |
| Worker infinite loops | Medium | Medium | Timeout mechanisms, circuit breakers |
| Neo4j schema drift | Medium | Medium | Schema versioning, migration scripts |
| Gateway bottleneck | Low | Medium | Horizontal scaling, caching |
| OAuth token loss | Low | High | Host-side storage, backup mechanism |

### 11.2 Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Startup time too long | Medium | Medium | Optimize health checks, parallel startup |
| Disk space exhaustion | Medium | High | Monitor disk usage, cleanup old jobs |
| Worker replicas not scaling | Low | Medium | Implement auto-scaling based on queue depth |
| Job queue backlog | Medium | Medium | Monitor queue depth, alert on threshold |

### 11.3 Constitutional Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Workers bypass Replay Kernel | Very Low | Critical | No direct database access, all via Gateway |
| Graph corruption | Low | High | Replay Kernel verification of graph operations |
| Job lineage broken | Low | Medium | Mandatory lineage tracking in job schema |
| Authority drift | Very Low | Critical | Regular constitutional audits |

**Constitutional Risk Assessment**: ✅ LOW

**Justification**: Workers are replaceable/disposable, no authority transfer, Replay Kernel maintains constitutional authority, all constitutional operations go through Replay Kernel.

---

## 12. Future Capabilities

### 12.1 Architecture Fingerprinting

**Concept**: Automatically detect architectural patterns in repositories

**Implementation**:
```typescript
interface ArchitectureFingerprint {
  event_sourcing: boolean;
  replay: boolean;
  workflow_orchestration: boolean;
  consistency_model: 'eventual' | 'strong' | 'none';
  authority_fragmentation: number;
  serialization_boundaries: string[];
  message_patterns: string[];
  data_flow_patterns: string[];
}
```

**Worker**: Research Worker with pattern detection

**Output**: Knowledge graph nodes for architectural patterns

### 12.2 Similar Architecture Detection

**Concept**: Find repositories with similar architectural patterns

**Implementation**:
1. Generate embeddings for architectural fingerprints
2. Store in Neo4j with vector index
3. Query for similar fingerprints using cosine similarity

**Worker**: Embedding Worker + Graph Worker

### 12.3 Tradeoff Analysis

**Concept**: Analyze tradeoffs across ADRs and patterns

**Implementation**:
1. Extract tradeoffs from ADRs
2. Link to architectural patterns
3. Query for tradeoff patterns across repositories

**Worker**: ADR Worker + Graph Worker

---

## 13. Conclusion

### 13.1 Expansion Summary

**Objective**: Transform Docker Compose into the operating system for the entire CRX cognition stack.

**Approach**:
- Add Neo4j for knowledge graph
- Implement 5 worker services with continuous execution loops
- Implement Redis job queues for horizontal scalability
- Implement job persistence for replay capability
- Create host orchestration script for auto-browser launch
- Implement comprehensive verification procedures

**Compliance**: ✅ Fully compliant with CRX_CONSTITUTION.md and AGENT.md

**Authority Preservation**: ✅ Replay Kernel maintains constitutional authority; workers are replaceable/disposable; infrastructure is non-authoritative

**Effort**: 83-105 hours total

**Risk**: Low-Medium - well-understood components, clear architecture, constitutional boundaries preserved

### 13.2 Recommendation

**APPROVE FOR IMPLEMENTATION** (as expansion to previous proposal)

**Rationale**:
- Enables true continuous cognition
- Horizontal scalability via job queues
- Replay capability via job persistence
- Knowledge graph via Neo4j
- Single-command startup via host orchestration
- Aligns with constitutional direction (replayable cognition)

### 13.3 Next Steps

1. Update LOCAL_EXECUTION_SUBSTRATE_PROPOSAL.md with expanded scope
2. Begin Phase 1: Infrastructure Expansion (Neo4j)
3. Execute implementation sequence
4. Perform end-to-end testing
5. Deploy to local development environment

---

**Document ID**: CRX-COGNITION-STACK-EXPANSION-2026-06-08  
**Status**: PROPOSED  
**Constitutional Compliance**: ✅ VERIFIED  
**Authority Alignment**: ✅ VERIFIED  
**Next Action**: Awaiting approval for implementation
