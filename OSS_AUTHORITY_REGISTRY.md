# OSS Authority Registry — Phase Ω

Every external integration mapped to a constitutional authority. Unowned integrations marked.

## Database & Storage

| OSS System | Usage | Constitutional Owner | Boundary | Status |
|---|---|---|---|---|
| PostgreSQL | Event store, entity storage, projections | RepositoryAuthority | All DB connections should route through RepositoryAdapter → RepositoryAuthority | **25 files bypass** — direct psycopg2.connect outside runtime/ |
| Qdrant | Vector storage, similarity search | ProjectionAuthority | All Qdrant calls should route through ProjectionAuthority | **15 files bypass** — direct QdrantClient outside runtime/ |

## Model Inference

| OSS System | Usage | Constitutional Owner | Boundary | Status |
|---|---|---|---|---|
| Ollama (qwen2.5-coder:7b, 14b) | Text generation, embeddings | EmbeddingAuthority | All model calls should route through EmbeddingAuthority | **Proven** (via provider adapter pattern) |
| HuggingFace Hub | Model access, embeddings | EmbeddingAuthority | HuggingFace auth behind EmbeddingAuthority | **Proven** (behind authority boundary) |
| sentence-transformers | Local embedding generation | EmbeddingAuthority | Wrapped by EmbeddingAuthority | **Proven** |
| OpenAI-compatible API | Alternative model provider | Provider-adapter boundary | Configurable via ConfigurationAuthority | **Planned** |

## Execution & Scheduling

| OSS System | Usage | Constitutional Owner | Boundary | Status |
|---|---|---|---|---|
| Python subprocess | Worker spawning, tool execution | ExecutionAuthority | All subprocess calls should route through ExecutionAuthority | **15 files bypass** — direct subprocess.run |
| Temporal (planned) | Workflow orchestration | ExecutionAuthority | Replace subprocess with Temporal workers | **Infrastructure gap** — not deployed |
| Windows Task Scheduler | 2:00 AM commit automation | (none — not automated) | N/A | **No automation found** (Session 8 confirmed) |

## Google Drive

| OSS System | Usage | Constitutional Owner | Boundary | Status |
|---|---|---|---|---|
| Google Drive API | Document ingestion, backup | DriveAdapter | All Drive API calls behind `runtime/adapters/google_drive/` | **Proven** (isolated behind adapter) |

## Parsing & Analysis

| OSS System | Usage | Constitutional Owner | Boundary | Status |
|---|---|---|---|---|
| tree-sitter (planned) | Source code parsing | ConstitutionalCompiler | Compiler consumes normalized syntax facts | **Planned** — not integrated |
| TypeScript Compiler API | TypeScript frontend AST walking | TS Frontend | Used by constitutional-compiler TS frontend | **Proven** — behind TS Frontend authority |
| ts-morph (planned) | Code rewriting | ConstitutionalCompiler | Repair engine delegates to ts-morph | **Planned** |

## Communication & External Services

| OSS System | Usage | Constitutional Owner | Boundary | Status |
|---|---|---|---|---|
| Yahoo Finance API | Newsletter market data | brainos/ (unowned) | No constitutional authority declared for newsletter pipeline | **Unowned** — `brainos/newsletter/` |
| Gmail SMTP | Newsletter delivery | brainos/ (unowned) | No constitutional authority | **Unowned** |
| MCP protocol | AI agent communication | `mcp/ping_mcp_server.py` (unowned) | No constitutional authority | **Unowned** |
| Discord webhook | Notification delivery | brainos/ (unowned) | No constitutional authority | **Unowned** |
| Slack integration | Notification delivery | brainos/ (unowned) | No constitutional authority | **Unowned** |

## Infrastructure

| OSS System | Usage | Constitutional Owner | Boundary | Status |
|---|---|---|---|---|
| Docker | Containerization | Deployment layer (not constitutional) | Dockerfiles are deployment, not runtime | **8+ Dockerfiles** — duplicate configurations |
| docker-compose | Multi-container orchestration | Deployment layer | Not constitutional | **2 compose files** — different network topologies |
| Git | Version control | Repository governance | Git history is constitutional record | Branch authority: constitutional-trunk |

## Competing Implementations (Same OSS, Different Configs)

| OSS | Implementations | Problem |
|---|---|---|
| Qdrant | runtime/ (via ProjectionAuthority), brainos/ (direct), root workers (direct) | 3 different connection patterns |
| PostgreSQL | runtime/ (via RepositoryAuthority), brainos/ (direct), root workers (direct) | 3 different connection patterns |
| Python runtime | .venv/ (primary), brainos/venv/ (legacy), Docker containers | 3 environments, different package sets |
| Ollama | crx-ollama-worker (Docker, no network), brain-ollama (stopped) | 2 deployments, both non-functional per Session 8 |

## OSS Integration Summary

| Category | Count | Unowned | Bypassed |
|---|---|---|---|
| Database & Storage | 2 | 0 | 25 (PG) + 15 (Qdrant) |
| Model Inference | 4 | 0 | 0 |
| Execution & Scheduling | 3 | 1 (subprocess bypasses) | 15 |
| Google Drive | 1 | 0 | 0 |
| Parsing & Analysis | 3 | 0 | 0 |
| Communication & External | 5 | 5 | 5 |
| Infrastructure | 3 | 0 | 0 |
| **Total** | **21** | **6 unowned** | **varied** |

**6 external integrations are completely unowned**: Yahoo Finance, Gmail SMTP, MCP protocol, Discord, Slack, newsletter pipeline. These are outside the constitutional authority model entirely.
