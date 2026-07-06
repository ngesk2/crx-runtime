# CONNECTOR ISOLATION REPORT

## Objective
Determine whether connectors are isolated behind adapters and whether connector-specific types leak above the adapter boundary.

## Connector inventory
| Connector | Adapter present | Evidence | Isolation status |
|---|---|---|---|
| GitHub | Partial | [gateway/github_adapter.js](gateway/github_adapter.js), [gateway/github_ingestion.js](gateway/github_ingestion.js) | PARTIAL |
| Google Drive | Partial | [runtime/adapters/google_drive/google_drive_ingestion_adapter.py](runtime/adapters/google_drive/google_drive_ingestion_adapter.py) | PARTIAL |
| Slack | No active adapter observed | None found in the audited runtime path | NO |
| Discord | No active adapter observed | None found in the audited runtime path | NO |
| Email | No active adapter observed | None found in the audited runtime path | NO |
| Filesystem | Partial | [gateway/filesystem_authority.js](gateway/filesystem_authority.js) | PARTIAL |
| RSS | No active adapter observed | None found in the audited runtime path | NO |
| OpenAI | Partial | [gateway/openai_provider_adapter.js](gateway/openai_provider_adapter.js) | PARTIAL |
| Ollama | Partial | [gateway/adapters/ollama_adapter.js](gateway/adapters/ollama_adapter.js), [gateway/routes/ollama.js](gateway/routes/ollama.js) | PARTIAL |
| LiteLLM | No active adapter observed | None found in the audited runtime path | NO |
| PostgreSQL | Partial | [gateway/event_repository.js](gateway/event_repository.js), [gateway/bootstrap/main.js](gateway/bootstrap/main.js) | PARTIAL |
| Qdrant | Partial | [gateway/qdrant_client.js](gateway/qdrant_client.js), [gateway/mcp_registry.js](gateway/mcp_registry.js) | PARTIAL |

## Isolation findings
- The repository already contains adapter-style abstractions for several connectors, especially for Ollama, OpenAI, GitHub, and Google Drive.
- The active runtime path still contains direct persistence and routing code that speaks to concrete services before a capability boundary fully resolves.
- Connector-specific details are not fully hidden from the orchestration layer; the gateway runtime and registry still expose concrete connector names and direct infrastructure concepts.

## Conclusion
Connector isolation is partially mature. It is sufficient for incremental evolution, but not yet robust enough to allow every connector to evolve independently without changing higher layers.
