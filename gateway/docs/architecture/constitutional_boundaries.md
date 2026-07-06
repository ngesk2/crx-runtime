# Constitutional Boundaries

## Dependency Direction

The architecture must follow this dependency direction:

```
External Ecosystem
    ↓
Runtime Platform
    ↓
Constitutional Core
```

## Constitutional Core

The Constitutional Core consists of:

### Authorities (Core IP)
- Authority Router
- All 40+ Authorities
- Witnesses
- Evidence
- Governance
- Identity
- Canonical Hash

### Knowledge Pipeline (Core IP)
- Projection
- Knowledge Graph
- Timeline
- Mission Generation
- Reflection
- Recommendation Engine
- Command Center

### Runtime (Core IP)
- Authority Router
- Authorities
- Adapters (constitutional wrappers only)
- Identity
- Canonical Hash
- Witnesses
- Evidence
- Governance

## External Ecosystem (Behind Adapters Only)

The following MUST NOT be imported directly in the Constitutional Core:

### Knowledge Pipeline External
- GitHub (github_ingestion.js, github_adapter.js, github_snapshot.js, github_release_watcher.js)
- LlamaIndex Readers (future)
- Unstructured (future)
- MarkItDown (future)
- Tree-sitter (treesitter_chunker.js, treesitter_parser_authority.js)
- Semgrep (future)
- Joern (future)
- OpenRewrite (future)

### Runtime External
- Ollama (ollama_adapter.js, ollama_provider.js, ollama_provider_adapter.js)
- OpenAI (openai_provider_adapter.js)
- llama.cpp (future)
- vLLM (future)
- Temporal (temporal_workflow_compiler.js)
- NATS (event_authority.js, event_bus.js)
- BullMQ (future)
- Redis (future)

### Infrastructure External
- Docker
- Compose
- Vault
- Postgres
- Qdrant
- OpenTelemetry
- Grafana
- Prometheus
- OpenReplay
- MCP (mcp_registry.js)

## Current Violations

### Direct Dependencies in Constitutional Core

#### Tree-sitter in Core
- **Files**: treesitter_chunker.js, treesitter_parser_authority.js
- **Violation**: Tree-sitter imported directly in core
- **Fix**: Move to adapter layer (TreeSitterAdapter)
- **Priority**: MEDIUM

#### Ollama in Core
- **Files**: ollama_adapter.js, ollama_provider.js, ollama_provider_adapter.js
- **Violation**: Ollama imported directly in core
- **Fix**: Already in adapter layer (ollama_provider_adapter.js is correct)
- **Priority**: LOW (already mostly correct)

#### GitHub in Core
- **Files**: github_ingestion.js, github_adapter.js, github_snapshot.js, github_release_watcher.js
- **Violation**: GitHub imported directly in core
- **Fix**: Move to adapter layer (GitHubAdapter)
- **Priority**: MEDIUM

#### Temporal in Core
- **Files**: temporal_workflow_compiler.js
- **Violation**: Temporal imported directly in core
- **Fix**: Move to adapter layer (TemporalAdapter)
- **Priority**: HIGH

#### NATS in Core
- **Files**: event_authority.js, event_bus.js
- **Violation**: NATS imported directly in core
- **Fix**: Move to adapter layer (NATSAdapter)
- **Priority**: MEDIUM

#### MCP in Core
- **Files**: mcp_registry.js
- **Violation**: MCP imported directly in core
- **Fix**: Move to adapter layer (MCPAdapter)
- **Priority**: LOW

#### Postgres in Core
- **Files**: eventstore_persistence.js
- **Violation**: Postgres imported directly in core
- **Fix**: Move to adapter layer (PostgresAdapter)
- **Priority**: MEDIUM

#### Qdrant in Core
- **Files**: qdrant_client.js, qdrant_bootstrap.js, qdrant_integration.js, qdrant_worker.js
- **Violation**: Qdrant imported directly in core
- **Fix**: Move to adapter layer (QdrantAdapter)
- **Priority**: MEDIUM

#### OpenTelemetry in Core
- **Files**: opentelemetry_witness_instrumentation.js, telemetry_subsystem.js
- **Violation**: OpenTelemetry imported directly in core
- **Fix**: Move to adapter layer (OpenTelemetryAdapter)
- **Priority**: LOW

## Required Adapter Layer

### Knowledge Pipeline Adapters
- **TreeSitterAdapter**: Wrap Tree-sitter
- **LlamaIndexAdapter**: Wrap LlamaIndex readers
- **UnstructuredAdapter**: Wrap Unstructured
- **GitHubAdapter**: Wrap GitHub API (already exists, consolidate)

### Runtime Adapters
- **OllamaAdapter**: Wrap Ollama API (already exists as ollama_provider_adapter.js)
- **TemporalAdapter**: Wrap Temporal
- **NATSAdapter**: Wrap NATS
- **PostgresAdapter**: Wrap Postgres
- **QdrantAdapter**: Wrap Qdrant (already exists as qdrant_client.js)
- **OpenTelemetryAdapter**: Wrap OpenTelemetry

### Infrastructure Adapters
- **VaultAdapter**: Wrap Vault
- **MCPAdapter**: Wrap MCP

## Constitutional Core After Refactoring

### Pure Constitutional Core (No External Dependencies)
- Authority Router
- All 40+ Authorities
- Witnesses
- Evidence
- Governance
- Identity
- Canonical Hash
- Projection
- Knowledge Graph
- Timeline
- Mission Generation
- Reflection
- Recommendation Engine
- Command Center

### Adapter Layer (External Dependencies)
- TreeSitterAdapter
- LlamaIndexAdapter
- UnstructuredAdapter
- GitHubAdapter
- OllamaAdapter
- TemporalAdapter
- NATSAdapter
- PostgresAdapter
- QdrantAdapter
- OpenTelemetryAdapter
- VaultAdapter
- MCPAdapter

## Migration Priority

### HIGH Priority (Constitutional Violations)
1. **Temporal**: Move temporal_workflow_compiler.js to TemporalAdapter
2. **Postgres**: Move eventstore_persistence.js to PostgresAdapter
3. **Qdrant**: Move qdrant_client.js to QdrantAdapter (already mostly correct)

### MEDIUM Priority (Constitutional Violations)
1. **Tree-sitter**: Move treesitter_chunker.js to TreeSitterAdapter
2. **GitHub**: Consolidate GitHub files into GitHubAdapter
3. **NATS**: Move event_authority.js to NATSAdapter
4. **OpenTelemetry**: Move telemetry_subsystem.js to OpenTelemetryAdapter

### LOW Priority (Minor Violations)
1. **MCP**: Move mcp_registry.js to MCPAdapter
2. **Ollama**: Already mostly correct (ollama_provider_adapter.js)

## Verification

### Test for Constitutional Purity
To verify a file is in the Constitutional Core:
1. Check imports - should only import from constitutional_core/
2. Check dependencies - should not depend on external services
3. Check functionality - should be pure constitutional logic

### Test for Adapter Layer
To verify a file is in the Adapter Layer:
1. Check imports - may import from external services
2. Check functionality - should wrap external service
3. Check interface - should implement constitutional interface

## Conclusion

The Constitutional Core must be free of external dependencies. All external service interactions must be behind adapters. This ensures:
- Testability (can mock adapters)
- Portability (can swap implementations)
- Constitutional purity (core logic is independent)
- Maintainability (clear separation of concerns)
