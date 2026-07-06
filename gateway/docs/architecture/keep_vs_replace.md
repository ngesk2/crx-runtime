# KEEP vs REPLACE Matrix

| Subsystem | Keep | Replace | OSS Candidate | Migration Risk | Reason |
|-----------|------|---------|---------------|----------------|--------|
| **Knowledge Pipeline** |
| Repository Ingestion | PARTIAL | YES | LlamaIndex GitHub Reader | LOW | Much higher quality, actively maintained |
| Chunking | NO | YES | Unstructured + Tree-sitter | LOW | Handwritten chunking is error-prone |
| Markdown Parsing | YES | NO | markdown-it (already used) | N/A | Already mature and in use |
| Metadata Extraction | PARTIAL | YES | Unstructured | LOW | Higher quality metadata extraction |
| Document Loading | NO | YES | LlamaIndex Readers | LOW | 100+ loaders, actively maintained |
| Embedding Generation | PARTIAL | PARTIAL | llama.cpp server | LOW | Keep abstraction, replace provider logic |
| Embedding Batching | YES | NO | None | N/A | Simple batching is appropriate |
| Embedding Cache | YES | NO | SQLite | N/A | Appropriate for replay identity |
| Projection | YES | NO | None | N/A | Core constitutional IP |
| Qdrant | YES | NO | Official Qdrant client | N/A | Already using official client |
| Knowledge Graph | YES | NO | Tree-sitter (for parsing) | N/A | Core constitutional IP |
| Replay | PARTIAL | PARTIAL | Temporal (orchestration) | HIGH | Use Temporal for orchestration only |
| Timeline | YES | NO | None | N/A | Core constitutional IP |
| Mission Generation | YES | NO | None | N/A | Core constitutional IP |
| Reflection | YES | NO | None | N/A | Core constitutional IP |
| Recommendation Engine | YES | NO | None | N/A | Core constitutional IP |
| Command Center | YES | NO | None | N/A | Core constitutional IP |
| **Runtime** |
| Authority Router | YES | NO | None | N/A | Core constitutional IP |
| Authorities | YES | NO | None | N/A | Core constitutional IP |
| Adapters | PARTIAL | NO | None | LOW | Core constitutional IP, consolidate duplicates |
| Temporal | PARTIAL | NO | Temporal (service) | HIGH | Integrate Temporal service |
| NATS | YES | NO | NATS (service) | N/A | Adapter pattern is correct |
| Worker Queue | PARTIAL | PARTIAL | Temporal | MEDIUM | If Temporal adopted, reduce to Authority scheduling |
| Caching | YES | NO | SQLite | N/A | Appropriate for replay identity |
| Scheduler | PARTIAL | PARTIAL | Temporal | MEDIUM | If Temporal adopted, use Temporal |
| Identity | YES | NO | None | N/A | Core constitutional IP |
| Canonical Hash | YES | NO | None | N/A | Core constitutional IP |
| Witnesses | YES | NO | None | N/A | Core constitutional IP |
| Evidence | YES | NO | None | N/A | Core constitutional IP |
| Governance | YES | NO | None | N/A | Core constitutional IP |
| **Infrastructure** |
| Docker | YES | NO | Docker | N/A | Add Docker Compose |
| Compose | NO | YES | Docker Compose | LOW | Essential for local development |
| Secrets | NO | YES | Vault (production) | MEDIUM | Use env vars for dev, Vault for prod |
| Vault | NO | YES | HashiCorp Vault | MEDIUM | Enterprise secrets management |
| Postgres | YES | NO | PostgreSQL | N/A | Appropriate for event store |
| Qdrant | YES | NO | Qdrant | N/A | Appropriate for vector storage |
| OpenTelemetry | YES | NO | OpenTelemetry | N/A | Adapter pattern is correct |
| Grafana | NO | YES | Grafana | LOW | Essential for metrics visualization |
| Prometheus | NO | YES | Prometheus | LOW | Essential for metrics collection |
| OpenReplay | NO | CONSIDER | OpenReplay | MEDIUM | Useful for replay debugging |
| Tree-sitter | YES | NO | Tree-sitter | N/A | Appropriate for parsing |
| Semgrep | NO | CONSIDER | Semgrep | LOW | Useful for CI/CD static analysis |
| Joern | NO | CONSIDER | Joern | HIGH | Powerful but high migration cost |
| OpenRewrite | NO | CONSIDER | OpenRewrite | MEDIUM | Useful for automated refactoring |
| GitHub | YES | NO | GitHub API | N/A | Adapter pattern is correct |
| codebase-memory MCP | YES | NO | MCP | N/A | Adapter pattern is correct |

## Summary

### KEEP (Core Constitutional IP)
- All Authorities (40+ files)
- All Witnesses
- All Evidence
- All Governance
- Projection
- Knowledge Graph
- Timeline
- Mission Generation
- Reflection
- Recommendation Engine
- Command Center
- Identity
- Canonical Hash
- Embedding Batching
- Embedding Cache
- NATS
- Postgres
- Qdrant
- OpenTelemetry
- Tree-sitter
- GitHub
- MCP

### REPLACE (Use Mature OSS)
- Repository Ingestion → LlamaIndex GitHub Reader
- Chunking → Unstructured + Tree-sitter
- Metadata Extraction → Unstructured
- Document Loading → LlamaIndex Readers
- Embedding Generation → llama.cpp server (keep abstraction)
- Compose → Docker Compose
- Secrets → Vault (production)
- Grafana → Grafana
- Prometheus → Prometheus

### CONSOLIDATE (Remove Duplicates)
- Ollama adapters (delete 2, keep 1)
- Adapters (delete v2, complete v1)
- Chunking (delete 2, consolidate tree-sitter)
- Worker queues (consolidate 4 into 1)
- Replay (consolidate 2 engines)
- Mission (consolidate 2 authorities)
- Reflection (consolidate 2 authorities)
- Schedulers (consolidate 2)
- Graph compilers (create unified compiler)
- Metadata (consolidate 2)

### ADD (Missing Infrastructure)
- Docker Compose
- Grafana
- Prometheus
- Secrets management (Vault for production)

### Total Impact
- **Files to delete**: 5-7
- **Files to consolidate**: 15-20
- **Files to add**: 3-4
- **OSS integrations**: 9
- **Estimated net reduction**: 10-15 files
