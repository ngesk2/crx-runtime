# PLATFORM REPLACEABILITY REPORT

## Objective
Evaluate whether each platform dependency can be replaced without modifying the frozen Continuity Kernel.

## Assessment
| Platform | Replaceable | Evidence | Verdict |
|---|---|---|---|
| Temporal | PARTIAL | [gateway/temporal_runtime.js](gateway/temporal_runtime.js), [gateway/temporal_scheduler_provider.js](gateway/temporal_scheduler_provider.js) | The kernel can remain stable while the platform changes, but the production route is not yet fully temporalized. |
| Docker | PARTIAL | [compose.yaml](compose.yaml), [gateway/bootstrap/gateway_runtime.js](gateway/bootstrap/gateway_runtime.js) | The platform uses Docker composition, but runtime orchestration is not fully container-agnostic. |
| PostgreSQL | PARTIAL | [gateway/bootstrap/main.js](gateway/bootstrap/main.js), [gateway/event_repository.js](gateway/event_repository.js) | Persistence is abstracted partially, but the active path still uses concrete SQL and pool wiring. |
| Qdrant | PARTIAL | [gateway/qdrant_client.js](gateway/qdrant_client.js), [gateway/mcp_registry.js](gateway/mcp_registry.js) | Projection and vector storage are abstracted partially, but not as the only projection destination. |
| LiteLLM | NO | No active adapter observed in the audited path | The higher layers would need explicit adaptation to replace it. |
| Ollama | PARTIAL | [gateway/adapters/ollama_adapter.js](gateway/adapters/ollama_adapter.js), [gateway/routes/ollama.js](gateway/routes/ollama.js) | The inference route is adapter-based, but still lives in the active platform path. |
| GitHub | PARTIAL | [gateway/github_adapter.js](gateway/github_adapter.js) | The connector exists but is still coupled to the repository and mission flow. |
| Slack | NO | No active adapter observed in the audited path | Connector-specific integration would need to be added. |
| Discord | NO | No active adapter observed in the audited path | Connector-specific integration would need to be added. |
| Google Drive | PARTIAL | [runtime/adapters/google_drive/google_drive_ingestion_adapter.py](runtime/adapters/google_drive/google_drive_ingestion_adapter.py) | An adapter exists, but the orchestration path still treats it as a concrete source. |
| Filesystem | PARTIAL | [gateway/filesystem_authority.js](gateway/filesystem_authority.js) | It is partially isolated but is still present as a concrete authority path. |

## Conclusion
The platform is partially replaceable. The kernel remains structurally insulated, but the orchestration layer still has too much implementation coupling to be confidently replaced in a decade without some adapter and routing changes.
