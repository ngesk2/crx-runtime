# Brain Constitutional Infrastructure

**Version:** 1.0
**Status:** FOUNDATIONAL
**Purpose:** Sovereign personal intelligence operating system

---

## Overview

Brain is a constitutional infrastructure for a lifelong intelligence substrate capable of accumulating, preserving, organizing, and reasoning over personal knowledge for decades. The architecture is designed to survive model replacements, vector database replacements, framework replacements, infrastructure migrations, operating system migrations, and hardware refresh cycles while preserving data integrity and reconstructability above all else.

---

## Architecture

### Constitutional Layers

The system is divided into six permanent layers:

#### Layer 0 — Immutable Object Storage (Constitutional Truth)
- Content-addressable storage
- SHA256 hash identification
- Git-style directory structure
- Never modified, never deleted

#### Layer 1 — Event Log (Constitutional Truth)
- Append-only event log
- Immutable events
- State reconstructable from history
- Temporal queries supported

#### Layer 2 — Canonical State (Constitutional Truth)
- PostgreSQL as canonical database
- State derived from event log
- Rebuildable from event history
- ACID transactions

#### Layer 3 — Knowledge Graph Projection (Disposable)
- Neo4j graph database
- Rebuildable from canonical state
- Not source of truth

#### Layer 4 — Vector Projection (Disposable)
- Qdrant vector database
- Rebuildable from canonical state
- Not source of truth

#### Layer 5 — Interfaces and Agents (Disposable)
- Web interfaces
- CLI interfaces
- Agent frameworks
- Rebuildable from canonical state

**Constitutional Truth:** Layers 0-2 only
**Disposable Projections:** Layers 3-5

---

## Core Principles

- **Local First:** All data resides on local infrastructure
- **Self Hosted:** Complete control over infrastructure
- **Privacy Preserving:** Zero data leakage by design
- **Deterministic:** Same inputs produce same outputs
- **Event Sourced:** All state changes recorded as immutable events
- **Content Addressable:** Objects identified by cryptographic hash
- **Reproducible:** Infrastructure as code
- **Scalable:** Laptop to distributed deployment

---

## Directory Structure

```
brain/
├── constitutional/
│   ├── object_store/          # Layer 0: Immutable object storage
│   ├── event_log/             # Layer 1: Event log
│   └── canonical_state/       # Layer 2: PostgreSQL schema
├── infrastructure/
│   ├── docker/                # Docker configurations
│   ├── terraform/             # Terraform configurations
│   ├── compose/               # Docker Compose files
│   └── scripts/               # Bootstrap and utility scripts
├── services/                  # Service configurations
│   ├── postgres/              # PostgreSQL
│   ├── qdrant/                # Qdrant
│   ├── neo4j/                 # Neo4j
│   ├── temporal/              # Temporal
│   ├── kafka/                 # Kafka
│   ├── duckdb/                # DuckDB
│   ├── opensearch/            # OpenSearch
│   ├── tika/                  # Apache Tika
│   └── ollama/                # Ollama
├── config/
│   ├── environments/          # Environment configurations
│   ├── credentials/           # Cryptographic credentials
│   └── secrets/               # Encrypted secrets
├── storage/
│   ├── hot/                   # Hot storage (immediate recovery)
│   ├── warm/                  # Warm storage (daily snapshots)
│   ├── cold/                  # Cold storage (long-term archive)
│   ├── objects/               # Object store data
│   ├── events/                # Event log data
│   ├── snapshots/             # Backup snapshots
│   └── backups/               # Backup archives
├── data/
│   ├── raw/                   # Raw data
│   ├── processed/             # Processed data
│   ├── normalized/            # Normalized data
│   ├── vectors/               # Vector data
│   ├── graph/                 # Graph data
│   ├── memory/                # Memory data
│   └── analytics/             # Analytics data
├── logs/
│   ├── system/                # System logs
│   ├── security/              # Security logs
│   └── audit/                 # Audit logs
└── docs/
    ├── architecture/          # Architecture documentation
    ├── operations/            # Operations documentation
    ├── recovery/              # Recovery documentation
    └── security/              # Security documentation
```

---

## Quick Start

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Python 3.8+
- 16GB RAM minimum
- 100GB storage minimum

### Installation

#### 1. Clone Repository
```bash
git clone <repository-url>
cd brain
```

#### 2. Run Bootstrap Script
```bash
./infrastructure/docker/scripts/bootstrap.sh
```

This script will:
- Create directory structure
- Generate secure secrets
- Generate cryptographic keys
- Initialize database schema
- Start all services
- Create initial backup

#### 3. Verify Services
```bash
cd infrastructure/docker/compose
docker-compose ps
```

All services should show as "Up" or "healthy".

#### 4. Access Services

- **PostgreSQL:** localhost:5432
- **Qdrant:** http://localhost:6333
- **Neo4j:** http://localhost:7474
- **Temporal:** http://localhost:7233
- **OpenSearch:** http://localhost:9200
- **Tika:** http://localhost:9998
- **Ollama:** http://localhost:11434
- **Open WebUI:** http://localhost:3000

---

## Configuration

### Environment Variables

All configuration is through environment variables. Copy the example file:

```bash
cp config/environments/.env.example config/environments/.env
```

Edit `.env` with your values. Required variables:

```bash
# PostgreSQL
POSTGRES_USER=brain_user
POSTGRES_PASSWORD=CHANGE_ME_SECURE_PASSWORD
POSTGRES_DB=brain_db

# Qdrant
QDRANT_API_KEY=CHANGE_ME_SECURE_API_KEY

# Neo4j
NEO4J_PASSWORD=CHANGE_ME_SECURE_PASSWORD

# Security
JWT_SECRET=CHANGE_ME_SECURE_JWT_SECRET
ENCRYPTION_MASTER_KEY=CHANGE_ME_SECURE_ENCRYPTION_KEY
BACKUP_ENCRYPTION_KEY=CHANGE_ME_SECURE_BACKUP_KEY
```

### Secret Management

Generate secure secrets:

```bash
python3 infrastructure/docker/scripts/generate_secrets.py
```

Generate cryptographic keys:

```bash
python3 infrastructure/docker/scripts/generate_keys.py
```

---

## Services

### PostgreSQL (Canonical State)
- **Port:** 5432
- **Purpose:** Layer 2 canonical state
- **Persistence:** postgres_data volume
- **Backup:** Daily snapshots

### Qdrant (Vector Projection)
- **Port:** 6333
- **Purpose:** Layer 4 vector projection
- **Persistence:** qdrant_data volume
- **API Key:** Required

### Neo4j (Knowledge Graph Projection)
- **Ports:** 7474 (HTTP), 7687 (Bolt)
- **Purpose:** Layer 3 graph projection
- **Persistence:** neo4j_data volume
- **Password:** Required

### Temporal (Workflow Engine)
- **Port:** 7233
- **Purpose:** Layer 5 workflow orchestration
- **Namespace:** default (configurable)

### Kafka (Event Streaming)
- **Port:** 9092
- **Purpose:** Event streaming
- **Persistence:** kafka_data volume
- **Zookeeper:** Required

### OpenSearch (Search Engine)
- **Port:** 9200
- **Purpose:** Full-text search
- **Persistence:** opensearch_data volume
- **Password:** Required

### Apache Tika (Document Parsing)
- **Port:** 9998
- **Purpose:** Document parsing
- **Stateless:** No persistence

### Ollama (AI Model Server)
- **Port:** 11434
- **Purpose:** AI model serving
- **Persistence:** ollama_data volume

### Open WebUI (AI Interface)
- **Port:** 3000
- **Purpose:** AI user interface
- **Depends on:** Ollama

---

## Operations

### Starting Services
```bash
cd infrastructure/docker/compose
docker-compose up -d
```

### Stopping Services
```bash
cd infrastructure/docker/compose
docker-compose down
```

### Viewing Logs
```bash
cd infrastructure/docker/compose
docker-compose logs -f
```

### Restarting Services
```bash
cd infrastructure/docker/compose
docker-compose restart
```

### Updating Services
```bash
cd infrastructure/docker/compose
docker-compose pull
docker-compose up -d
```

---

## Backup

### Manual Backup
```bash
./infrastructure/docker/scripts/daily_snapshot.sh
```

### Restore from Backup
```bash
./infrastructure/docker/scripts/restore_backup.sh /storage/warm/snapshots/2026-06-14
```

### Backup Verification
```bash
./infrastructure/docker/scripts/verify_backup.sh /storage/warm/snapshots/2026-06-14
```

---

## Monitoring

### Service Health
```bash
cd infrastructure/docker/compose
docker-compose ps
```

### Resource Usage
```bash
docker stats
```

### Logs
```bash
cd infrastructure/docker/compose
docker-compose logs -f <service>
```

---

## Security

### Secret Rotation
```bash
# Generate new secrets
python3 infrastructure/docker/scripts/generate_secrets.py

# Restart services
cd infrastructure/docker/compose
docker-compose restart
```

### Key Rotation
```bash
# Generate new keys
python3 infrastructure/docker/scripts/generate_keys.py

# Re-encrypt data
./infrastructure/docker/scripts/reencrypt_data.sh

# Restart services
cd infrastructure/docker/compose
docker-compose restart
```

### Audit Logs
```bash
# View audit logs
tail -f logs/security/audit.log
```

---

## Documentation

### Architecture
- [Constitution](docs/architecture/CONSTITUTION.md)
- [Object Store](docs/architecture/OBJECT_STORE.md)
- [Event Sourcing](docs/architecture/EVENT_SOURCING.md)
- [Secret Management](docs/architecture/SECRET_MANAGEMENT.md)
- [Backup Architecture](docs/architecture/BACKUP_ARCHITECTURE.md)

### Operations
- Service management
- Monitoring
- Troubleshooting

### Recovery
- [Disaster Recovery](docs/recovery/DISASTER_RECOVERY.md)
- Backup procedures
- Restore procedures

### Security
- Security policies
- Incident response
- Compliance

---

## Development

### Local Development
```bash
# Use local environment
cp config/environments/.env.example config/environments/.env.local
cp config/environments/.env.local config/environments/.env

# Start services
cd infrastructure/docker/compose
docker-compose up -d
```

### Testing
```bash
# Run integration tests
python3 tests/integration/test_all.py

# Run backup tests
./infrastructure/docker/scripts/test_backup.sh
```

---

## Troubleshooting

### Services Not Starting
```bash
# Check logs
cd infrastructure/docker/compose
docker-compose logs

# Check disk space
df -h

# Check memory
free -h
```

### Database Connection Issues
```bash
# Check PostgreSQL is ready
docker-compose exec postgres pg_isready -U brain_user

# Check database exists
docker-compose exec postgres psql -U brain_user -d brain_db -c "\l"
```

### Permission Issues
```bash
# Fix permissions
chmod 700 config/credentials
chmod 700 config/secrets
chmod 700 storage/
```

---

## Support

### Documentation
- Architecture: docs/architecture/
- Operations: docs/operations/
- Recovery: docs/recovery/
- Security: docs/security/

### Issues
Report issues through the project issue tracker.

---

## License

This infrastructure is provided as-is for personal intelligence systems.

---

## Version History

- v1.0 (2026-06-14): Initial constitutional infrastructure
