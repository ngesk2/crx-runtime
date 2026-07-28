# Environment Reference

This document provides a comprehensive reference for all environment variables in the PING Cognitive Operating System.

**Version:** v1
**Last Updated:** 2026-06-25

---

## PostgreSQL Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_HOST` | localhost | PostgreSQL server hostname |
| `POSTGRES_PORT` | 5432 | PostgreSQL server port |
| `POSTGRES_DB` | crx_runtime | PostgreSQL database name |
| `POSTGRES_USER` | postgres | PostgreSQL username |
| `POSTGRES_PASSWORD` | postgres | PostgreSQL password |

---

## Qdrant Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `QDRANT_URL` | http://localhost:6333 | Qdrant server URL |
| `QDRANT_API_KEY` | (empty) | Qdrant API key (if required) |
| `QDRANT_COLLECTION` | constitutional_memory | Default Qdrant collection |

---

## Qdrant Collections

| Variable | Default | Description |
|----------|---------|-------------|
| `QDRANT_COLLECTION_CONSTITUTION` | constitutional_memory | Constitutional memory collection |
| `QDRANT_COLLECTION_ARTIFACTS` | constitutional_artifacts | Artifacts collection |
| `QDRANT_COLLECTION_CODE` | repository_symbols | Code symbols collection |
| `QDRANT_COLLECTION_EVENTS` | event_memory | Event memory collection |
| `QDRANT_COLLECTION_OBSERVATIONS` | observations | Observations collection |
| `QDRANT_DISTANCE` | Cosine | Vector distance metric |
| `QDRANT_EMBEDDING_DIMENSIONS` | 1024 | Embedding vector dimensions |
| `QDRANT_SNAPSHOT_INTERVAL` | 24h | Snapshot creation interval |
| `QDRANT_PAYLOAD_INDEXING` | true | Enable payload indexing |

---

## Ollama Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | http://localhost:11434 | Ollama server URL |
| `OLLAMA_CHAT_MODEL` | qwen3:latest | Default chat model |
| `OLLAMA_REASONING_MODEL` | qwen3:latest | Default reasoning model |
| `OLLAMA_EMBED_MODEL` | nomic-embed-text | Default embedding model |
| `OLLAMA_CONTEXT_LENGTH` | 32768 | Model context window size |
| `OLLAMA_PARALLEL_REQUESTS` | 4 | Maximum parallel requests |
| `OLLAMA_GPU_LAYERS` | -1 | GPU layers (-1 = all) |
| `OLLAMA_KEEP_ALIVE` | 10m | Model keep-alive duration |
| `OLLAMA_ENABLE_TOOLS` | true | Enable tool calling |
| `OLLAMA_ENABLE_STRUCTURED_OUTPUT` | true | Enable structured output |

---

## Runtime Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `POLL_INTERVAL_SECONDS` | 5 | Event polling interval |
| `LOG_LEVEL` | INFO | Logging level |

---

## Artifact Runtime

| Variable | Default | Description |
|----------|---------|-------------|
| `ARTIFACT_SCHEMA_VERSION` | v1 | Artifact schema version |
| `ARTIFACT_COLLECTION` | constitutional_artifacts | Artifacts collection name |
| `ARTIFACT_NAMESPACE` | constitutional | Artifact namespace |
| `ARTIFACT_CACHE_TTL` | 3600 | Cache time-to-live (seconds) |
| `ARTIFACT_MAX_SIZE_MB` | 64 | Maximum artifact size (MB) |
| `ARTIFACT_COMPRESSION` | zstd | Compression algorithm |
| `ARTIFACT_STORAGE_BACKEND` | postgres | Storage backend |

---

## Constitutional Runtime

| Variable | Default | Description |
|----------|---------|-------------|
| `CONSTITUTION_VERSION` | v1 | Constitution version |
| `CONSTITUTION_NAMESPACE` | constitutional | Constitution namespace |
| `CONSTITUTION_SERVICE_URL` | http://constitution:8082 | Constitution service URL |
| `AUTHORITY_ENGINE` | postgres | Authority engine backend |
| `AUTHORITY_CACHE_TTL` | 300 | Authority cache TTL (seconds) |
| `AUTHORITY_MAX_DEPTH` | 64 | Maximum authority depth |
| `WITNESS_SERVICE_URL` | http://witness:8090 | Witness service URL |
| `WITNESS_HASH_ALGORITHM` | sha256 | Witness hash algorithm |
| `REPLAY_SERVICE_URL` | http://replay:8091 | Replay service URL |
| `REPLAY_MAX_DEPTH` | 1024 | Maximum replay depth |
| `REPLAY_BATCH_SIZE` | 100 | Replay batch size |
| `PROJECTION_SERVICE_URL` | http://projection:8084 | Projection service URL |
| `PROJECTION_BATCH_SIZE` | 100 | Projection batch size |

---

## Event Runtime

| Variable | Default | Description |
|----------|---------|-------------|
| `EVENT_SCHEMA_VERSION` | v1 | Event schema version |
| `EVENT_RETENTION_DAYS` | 3650 | Event retention period (days) |
| `EVENT_BATCH_SIZE` | 100 | Event batch size |
| `EVENT_MAX_PAYLOAD_MB` | 16 | Maximum event payload (MB) |
| `EVENT_COMPRESSION` | zstd | Event compression algorithm |
| `EVENT_SIGNATURES` | true | Enable event signatures |

---

## Ledger Runtime

| Variable | Default | Description |
|----------|---------|-------------|
| `LEDGER_SERVICE_URL` | http://ledger:8083 | Ledger service URL |
| `LEDGER_HASH_ALGORITHM` | sha256 | Ledger hash algorithm |
| `LEDGER_APPEND_ONLY` | true | Append-only ledger |
| `LEDGER_VERIFY_ON_STARTUP` | true | Verify ledger on startup |

---

## Retrieval Runtime

| Variable | Default | Description |
|----------|---------|-------------|
| `RETRIEVAL_SERVICE_URL` | http://retrieval:8086 | Retrieval service URL |
| `RETRIEVAL_TOP_K` | 20 | Top-K retrieval results |
| `RETRIEVAL_MAX_RESULTS` | 100 | Maximum retrieval results |
| `CONTEXT_PACK_MAX_TOKENS` | 24000 | Context pack max tokens |
| `CONTEXT_PACK_MAX_CITATIONS` | 25 | Context pack max citations |
| `LINEAGE_MAX_DEPTH` | 32 | Maximum lineage depth |
| `AUTHORITY_MAX_DEPTH` | 32 | Maximum authority depth |
| `GRAPH_MAX_DEPTH` | 6 | Maximum graph depth |

---

## Repository Intelligence

| Variable | Default | Description |
|----------|---------|-------------|
| `REPOSITORY_SYMBOL_COLLECTION` | repository_symbols | Symbol collection name |
| `REPOSITORY_RELATIONSHIP_COLLECTION` | repository_relationships | Relationship collection name |
| `REPOSITORY_INCREMENTAL_INDEX` | true | Enable incremental indexing |
| `REPOSITORY_MAX_FILE_MB` | 20 | Maximum file size (MB) |
| `REPOSITORY_GRAPH_DEPTH` | 12 | Repository graph depth |
| `REPOSITORY_RUNTIME_URL` | http://repo_runtime:8085 | Repository runtime URL |

---

## Graph Runtime

| Variable | Default | Description |
|----------|---------|-------------|
| `GRAPH_SERVICE_URL` | http://graph:8092 | Graph service URL |
| `GRAPH_MAX_NEIGHBORS` | 100 | Maximum graph neighbors |
| `GRAPH_TRAVERSAL_DEPTH` | 8 | Graph traversal depth |
| `GRAPH_CACHE_TTL` | 600 | Graph cache TTL (seconds) |

---

## Agent Runtime

| Variable | Default | Description |
|----------|---------|-------------|
| `AGENT_RUNTIME_URL` | http://agents:8087 | Agent runtime URL |
| `AGENT_MAX_CONCURRENT` | 32 | Maximum concurrent agents |
| `AGENT_DEFAULT_TIMEOUT` | 300 | Default agent timeout (seconds) |
| `AGENT_MEMORY_LIMIT_MB` | 4096 | Agent memory limit (MB) |
| `AGENT_AUTHORITY_ENFORCEMENT` | true | Enable authority enforcement |
| `AGENT_REQUIRE_WITNESS` | true | Require witness for actions |

---

## Skills Runtime

| Variable | Default | Description |
|----------|---------|-------------|
| `SKILL_SERVICE_URL` | http://skills:8088 | Skills service URL |
| `SKILL_REGISTRY_VERSION` | v1 | Skill registry version |
| `SKILL_CACHE_TTL` | 600 | Skill cache TTL (seconds) |

---

## Filesystem Runtime

| Variable | Default | Description |
|----------|---------|-------------|
| `FILESYSTEM_SERVICE_URL` | http://filesystem:8089 | Filesystem service URL |
| `FILESYSTEM_INDEX_BATCH` | 100 | Filesystem index batch size |
| `FILESYSTEM_WATCH_DEBOUNCE_MS` | 500 | Filesystem watch debounce (ms) |
| `FILESYSTEM_HASH_ALGORITHM` | sha256 | Filesystem hash algorithm |

---

## Object Store

| Variable | Default | Description |
|----------|---------|-------------|
| `OBJECT_STORE_PROVIDER` | filesystem | Object store provider |
| `OBJECT_STORE_ROOT` | /storage/objects | Object store root path |
| `OBJECT_RETENTION_DAYS` | 3650 | Object retention (days) |
| `OBJECT_HASH_ALGORITHM` | sha256 | Object hash algorithm |
| `OBJECT_COMPRESSION` | zstd | Object compression algorithm |

---

## Memory Runtime

| Variable | Default | Description |
|----------|---------|-------------|
| `MEMORY_SERVICE_URL` | http://memory:8093 | Memory service URL |
| `MEMORY_CACHE_SIZE_MB` | 2048 | Memory cache size (MB) |
| `MEMORY_VECTOR_BACKEND` | qdrant | Vector memory backend |
| `MEMORY_GRAPH_BACKEND` | neo4j | Graph memory backend |
| `MEMORY_AUTHORITY_BACKEND` | postgres | Authority memory backend |

---

## Observability

| Variable | Default | Description |
|----------|---------|-------------|
| `OTEL_ENABLED` | true | Enable OpenTelemetry |
| `OTEL_EXPORTER_ENDPOINT` | http://otel:4317 | OTEL exporter endpoint |
| `JAEGER_URL` | http://jaeger:16686 | Jaeger tracing UI |
| `LOKI_URL` | http://loki:3100 | Loki log aggregation |

---

## Scheduler

| Variable | Default | Description |
|----------|---------|-------------|
| `SCHEDULER_SERVICE_URL` | http://scheduler:8094 | Scheduler service URL |
| `CRON_TIMEZONE` | UTC | Cron timezone |
| `WORKER_HEARTBEAT_SECONDS` | 15 | Worker heartbeat interval |

---

## API Contracts (Reserved Internal Endpoints)

| Service | Port | Description |
|---------|------|-------------|
| Constitution Service | 8082 | Constitutional runtime API |
| Ledger Service | 8083 | Immutable ledger API |
| Projection Service | 8084 | Projection rebuild API |
| Repository Runtime | 8085 | Repository intelligence API |
| Retrieval Service | 8086 | Semantic retrieval API |
| Agent Runtime | 8087 | Agent orchestration API |
| Skills Service | 8088 | Skill registry API |
| Filesystem Service | 8089 | Filesystem monitoring API |
| Witness Service | 8090 | Witness generation API |
| Replay Service | 8091 | Event replay API |
| Graph Service | 8092 | Graph operations API |
| Memory Service | 8093 | Memory management API |
| Scheduler Service | 8094 | Task scheduling API |

---

## Usage

### Local Development

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Adjust values for your environment:
```bash
# Edit .env
POSTGRES_PASSWORD=your_secure_password
QDRANT_API_KEY=your_api_key_if_required
```

3. Source the environment:
```bash
export $(cat .env | xargs)
```

### Docker Compose

Environment variables are automatically loaded by Docker Compose:
```bash
docker compose up -d
```

### Python Application

Load environment variables in Python:
```python
import os
from dotenv import load_dotenv

load_dotenv()

postgres_config = {
    "host": os.getenv("POSTGRES_HOST"),
    "port": int(os.getenv("POSTGRES_PORT", "5432")),
    "database": os.getenv("POSTGRES_DB"),
    "user": os.getenv("POSTGRES_USER"),
    "password": os.getenv("POSTGRES_PASSWORD")
}
```

---

## Security Notes

- Never commit `.env` files to version control
- Use strong passwords for production
- Rotate API keys regularly
- Use secrets management for production deployments
- Restrict environment variable access to authorized personnel

---

## Versioning

Environment variable names are part of the stable ABI. Breaking changes require:
1. Increment schema version (e.g., `CONSTITUTION_VERSION=v2`)
2. Maintain backward compatibility for at least one major version
3. Update this documentation
4. Announce changes in release notes

---

## Support

For questions or issues with environment configuration, see:
- `docs/environment/SERVICE_ABI.md` - Service contract definitions
- `docs/architecture/` - Architecture documentation
- `docs/CONSTITUTIONAL_FREEZE_READINESS.md` - Constitutional runtime status
