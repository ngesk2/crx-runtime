# OMNIROUTE ARCHITECTURE AUDIT

## Scope
This audit is read-only and assumes the Continuity Kernel is frozen. It evaluates whether the orchestration layers above the kernel depend only on stable constitutional contracts and whether those higher layers remain replaceable.

## Evidence Base
The assessment is based on the current repository structure and live runtime files, including:
- [gateway/bootstrap/main.js](gateway/bootstrap/main.js)
- [gateway/bootstrap/gateway_runtime.js](gateway/bootstrap/gateway_runtime.js)
- [gateway/runtime/constitutional_execution_pipeline.js](gateway/runtime/constitutional_execution_pipeline.js)
- [gateway/temporal_runtime.js](gateway/temporal_runtime.js)
- [gateway/temporal_scheduler_provider.js](gateway/temporal_scheduler_provider.js)
- [gateway/background_workers.js](gateway/background_workers.js)
- [gateway/mcp_registry.js](gateway/mcp_registry.js)
- [runtime/execution_runtime.js](runtime/execution_runtime.js)
- [gateway/technology_authority.js](gateway/technology_authority.js)

## Phase A — Orchestration Inventory

| Component | Purpose | Current owner | Entry points | Exit points | Dependencies | Runtime layer | Constitutional layer | Status |
|---|---|---|---|---|---|---|---|---|
| Worker Runtime | Polls and dispatches events | Gateway runtime and Python workers | [gateway/bootstrap/gateway_runtime.js](gateway/bootstrap/gateway_runtime.js), [runtime/workers/worker_base.py](runtime/workers/worker_base.py) | [gateway/routes/events.js](gateway/routes/events.js) | Event repository, worker registry, event routes | Platform | Platform-facing | ACTIVE |
| Dispatcher | Resolves reducers for events | [gateway/runtime/dispatcher.js](gateway/runtime/dispatcher.js) | [gateway/runtime/constitutional_execution_pipeline.js](gateway/runtime/constitutional_execution_pipeline.js) | Reducer registry | Event schema, reducer registry | Platform | Capability-facing | ACTIVE |
| Scheduler | Schedules work and routes by capability/queue | [gateway/temporal_scheduler_provider.js](gateway/temporal_scheduler_provider.js), [gateway/capability_scheduler.js](gateway/capability_scheduler.js) | Temporal provider and capability scheduler | Worker/mission execution | Temporal client/workflow, capability registry | Platform | Capability-facing | ACTIVE |
| Replay Engine | Replays state and verifies execution | [gateway/replay_authority.js](gateway/replay_authority.js), [runtime/kernel/replay](runtime/kernel/replay) | Event pipeline, replay authority | Verification/projection | Event history, witness data | Kernel | Kernel | DORMANT |
| Queue Manager | Manages dispatch queues and pending work | [gateway/persistent_queue_authority.js](gateway/persistent_queue_authority.js), [gateway/event_outbox.js](gateway/event_outbox.js) | Event/outbox and mission execution paths | Workers and consumers | Persistence, event store | Platform | Capability-facing | ACTIVE |
| Temporal integrations | Durable workflow orchestration primitives | [gateway/temporal_runtime.js](gateway/temporal_runtime.js), [gateway/temporal_scheduler_provider.js](gateway/temporal_scheduler_provider.js) | Bootstrap wiring and scheduler | Workflow activities | Temporal SDK, workflow definitions | Platform | Platform-facing | DORMANT |
| Docker Compose orchestration | Container lifecycle and service composition | [compose.yaml](compose.yaml) and related compose files | Service startup | Gateway, Postgres, Qdrant, workers | Docker engine, service networks | Platform | Platform-facing | ACTIVE |
| Background workers | Long-lived worker processes | [gateway/background_workers.js](gateway/background_workers.js) | Worker registry and bootstrap | Event dispatch | Event repository, registry | Platform | Platform-facing | ACTIVE |
| Cron jobs | Not present as a first-class orchestration runtime | None found in the active gateway path | None | None | None | N/A | N/A | REMOVE |
| Queue polling | Present in worker runtime and routing loops | [gateway/runtime/constitutional_execution_pipeline.js](gateway/runtime/constitutional_execution_pipeline.js), [runtime/workers/worker_base.py](runtime/workers/worker_base.py) | Polling entry | Event/mission processing | Event repository and queue state | Platform | Platform-facing | ACTIVE |
| Event subscriptions | Present in gateway event pipeline and MCP event stream | [gateway/mcp_registry.js](gateway/mcp_registry.js), [gateway/routes/events.js](gateway/routes/events.js) | Event routes, MCP registry | Consumers and projections | Event bus / repository | Platform | Platform-facing | ACTIVE |
| Runtime coordinators | Execution runtime and gateway runtime | [runtime/execution_runtime.js](runtime/execution_runtime.js), [gateway/bootstrap/gateway_runtime.js](gateway/bootstrap/gateway_runtime.js) | Request and execution boot | Authority/adapter execution | Container and adapter registry | Platform | Capability-facing | ACTIVE |
| Gateway routing | HTTP ingress and route dispatch | [gateway/bootstrap/gateway_runtime.js](gateway/bootstrap/gateway_runtime.js) | HTTP routes | Event/repository/system/ollama handlers | Event and repository services | Platform | Platform-facing | ACTIVE |

## Phase B — OmniRoute Flow Graph

Ingress → Mission → Capability → Execution → Authority → Replay → Projection → Delivery

### Flow summary
1. Ingress enters through HTTP routes in [gateway/bootstrap/gateway_runtime.js](gateway/bootstrap/gateway_runtime.js).
2. Mission payloads reach the execution pipeline via [gateway/runtime/constitutional_execution_pipeline.js](gateway/runtime/constitutional_execution_pipeline.js).
3. Capabilities are represented by the capability and authority registry layer in [gateway/technology_authority.js](gateway/technology_authority.js) and [gateway/mcp_registry.js](gateway/mcp_registry.js).
4. Execution is delegated by [runtime/execution_runtime.js](runtime/execution_runtime.js) to adapters and infrastructure.
5. Replay and witness logic are present but largely dormant on the active path.
6. Projection remains partially implemented and is not consistently coupled to replay verification.

### Edge inventory
| Producer | Consumer | Transport | Authority boundary | Persistence boundary | Replay boundary | Projection boundary |
|---|---|---|---|---|---|---|
| HTTP gateway | Execution pipeline | REST | Present in pipeline stage validation | Event repository | Partial | Partial |
| Execution pipeline | Reducer registry | In-process | Present | None | Partial | None |
| Execution pipeline | Event repository | Transactional SQL | Present | Present | Partial | None |
| Event routes | Worker runtime | HTTP polling | Partial | Present | Partial | Partial |
| Runtime execution | Adapters | In-process call | Present | Adapter boundary | Partial | Partial |
| Capability registry | Provider/adapter selection | In-process mapping | Present | None | Partial | None |
| Temporal scheduler provider | Workflow execution | Temporal client | Partial | Present | Present | None |

### Routing anomalies
- Circular routing: not evident in the current active path; the architecture is a star-like composition around the gateway and runtime layers.
- Duplicate routing: multiple orchestration mechanisms exist (Temporal, worker runtime, capability scheduler, direct event routes), but they are not unified.
- Hidden routing: the MCP registry and technology authority expose capability mapping, but the active runtime path still reaches infrastructure directly in several bootstrap and route files.
- Implicit routing: event persistence and projection are partially coupled through side channels rather than a single deterministic execution contract.
- Runtime shortcuts: direct PostgreSQL and adapter invocation remain reachable from the active gateway path.
- Kernel bypasses: the frozen kernel is conceptually present, but the gateway path still bypasses it in several places by directly invoking persistence and provider logic.

## Phase C — Transport Abstraction Audit

| Transport | Type | Replaceable | Hardcoded | Vendor-specific | Kernel dependency | Status |
|---|---|---|---|---|---|---|
| REST | HTTP | Yes | Partial | No | No | ACTIVE |
| WebSocket | Not active in the audited path | Partial | No | No | No | DORMANT |
| MCP | Capability registry and provider mapping | Yes | Partial | Partial | No | ACTIVE |
| CLI | Not observed as a primary orchestration transport | Partial | No | No | No | DORMANT |
| Temporal | Workflow client | Yes | Partial | Yes | No | DORMANT |
| Queue | Event/outbox/persistent queue | Yes | Partial | Partial | No | ACTIVE |
| Cron | Not present | N/A | N/A | N/A | N/A | REMOVE |
| Internal dispatcher | In-process | Yes | No | No | No | ACTIVE |

### Transport conclusion
All transports are conceptually replaceable, but several of them still terminate in implementation-specific adapters rather than at a pure capability boundary. The platform is not yet fully transport-isolated.

## Phase D — Temporal Readiness

Overall readiness: PARTIAL.

### Current Temporal evidence
- [gateway/temporal_runtime.js](gateway/temporal_runtime.js) exists and owns lifecycle.
- [gateway/temporal_scheduler_provider.js](gateway/temporal_scheduler_provider.js) exists and schedules workflows.
- [gateway/temporal_workflows.js](gateway/temporal_workflows.js) and [gateway/activities/index.js](gateway/activities/index.js) exist.

### Readiness by capability
| Capability | Status | Notes |
|---|---|---|
| Mission execution | PARTIAL | Workflow stubs exist but the production gateway path does not use them as the primary execution engine. |
| Worker execution | PARTIAL | Worker abstractions exist, but the active path still relies on direct gateway and worker runtime flow. |
| Retry behavior | PARTIAL | Retry logic exists conceptually in queueing and outbox patterns but is not the single durable execution path. |
| Replay compatibility | PARTIAL | Replay primitives exist, but the active runtime path is not routed through Temporal replay semantics. |
| Checkpoint compatibility | PARTIAL | The architecture has checkpoint-like concerns but no single durable workflow checkpoint contract. |
| Idempotency | PARTIAL | Event IDs and repository persistence suggest idempotency; the workflow path is not yet the authoritative path. |
| Long-running execution | PARTIAL | The runtime design supports it conceptually but it is not yet the dominant execution path. |
| Human approval pauses | BLOCKED | No evidence of a production pause/approval contract in the active workflow path. |
| Signal support | PARTIAL | Temporal concepts are present, but no production signal-based coordination is observed. |
| Timer support | PARTIAL | Timer concepts exist structurally but are not the primary orchestration mechanism. |

## Phase E — Capability Runtime Audit

### Direct invocation violations
The orchestration layer still directly invokes implementation-specific services rather than targeting capabilities first.

| Violation | Evidence | Classification |
|---|---|---|
| Direct PostgreSQL usage in bootstrap | [gateway/bootstrap/main.js](gateway/bootstrap/main.js) | HIGH |
| Direct repository and event service construction inside gateway runtime | [gateway/bootstrap/gateway_runtime.js](gateway/bootstrap/gateway_runtime.js) | HIGH |
| Direct execution of event pipeline from route layer | [gateway/routes/events.js](gateway/routes/events.js) | MEDIUM |
| Direct provider-style inference path | [gateway/routes/ollama.js](gateway/routes/ollama.js) | MEDIUM |
| Direct connector and capability mapping in MCP registry | [gateway/mcp_registry.js](gateway/mcp_registry.js) | MEDIUM |

### Desired target state
The orchestration runtime should resolve a capability first, then execute via the authority layer, then replay and project. That model is partially present in [runtime/execution_runtime.js](runtime/execution_runtime.js), but the active gateway path still uses implementation classes directly.

## Phase F — Connector Isolation

| Connector | Isolated behind adapter | Evidence | Status |
|---|---|---|---|
| GitHub | Partial | [gateway/github_adapter.js](gateway/github_adapter.js) and [gateway/github_ingestion.js](gateway/github_ingestion.js) | PARTIAL |
| Google Drive | Partial | [runtime/adapters/google_drive/google_drive_ingestion_adapter.py](runtime/adapters/google_drive/google_drive_ingestion_adapter.py) | PARTIAL |
| Slack | No evidence of active adapter | None observed in the active runtime path | NO |
| Discord | No evidence of active adapter | None observed in the active runtime path | NO |
| Email | No evidence of active adapter | None observed in the active runtime path | NO |
| Filesystem | Partial | [gateway/filesystem_authority.js](gateway/filesystem_authority.js) | PARTIAL |
| RSS | No evidence of active adapter | None observed in the active runtime path | NO |
| OpenAI | Partial | [gateway/openai_provider_adapter.js](gateway/openai_provider_adapter.js) | PARTIAL |
| Ollama | Partial | [gateway/adapters/ollama_adapter.js](gateway/adapters/ollama_adapter.js) and [gateway/routes/ollama.js](gateway/routes/ollama.js) | PARTIAL |
| LiteLLM | No evidence of active adapter | None observed in the active runtime path | NO |
| PostgreSQL | Partial | [gateway/event_repository.js](gateway/event_repository.js) and [gateway/bootstrap/main.js](gateway/bootstrap/main.js) | PARTIAL |
| Qdrant | Partial | [gateway/qdrant_client.js](gateway/qdrant_client.js) and [gateway/mcp_registry.js](gateway/mcp_registry.js) | PARTIAL |

## Phase G — Object Language Readiness

The repository contains many object-oriented concepts, but the canonical Continuity Object language is not yet the sole object contract above the kernel.

### Current readiness
| Object | Status | Notes |
|---|---|---|
| Repository | PARTIAL | Repository authority and repository store exist, but direct persistence paths still exist. |
| Document | PARTIAL | Document ingestion and repository concepts exist, but not as the universal object language. |
| Observation | PARTIAL | Observation/event concepts exist, but are mixed with transport and provider payloads. |
| Claim | PARTIAL | Claim and evidence concepts exist in the runtime and gateway layers but are not fully normalized. |
| Evidence | PARTIAL | Witness and evidence concepts exist but are not the only object contract. |
| Knowledge | PARTIAL | Knowledge objects exist but compete with event payload and projection payload models. |
| Mission | PARTIAL | Mission concepts exist but are still coupled to gateway-specific flows. |
| Execution | PARTIAL | Execution runtime is present, but the active flow still uses implementation-specific payloads. |
| Artifact | PARTIAL | Artifact concepts exist, but not as the single canonical contract layer. |
| Projection | PARTIAL | Projection exists conceptually, but is not the sole output contract. |
| Relationship | PARTIAL | Relationship and lineage concepts exist but do not govern the full runtime. |

## Phase H — Platform Replaceability

Overall replaceability: PARTIAL.

The platform can be evolved, but several layers still depend on specific runtime services and concrete implementations in the active path.

## Phase I — Scale Readiness

| Scale target | Assessment | Bottleneck |
|---|---|---|
| Single developer | PASS | The current structure is workable for a single developer. |
| Small team | WARN | Multiple parallel orchestrators and duplicated routing concepts increase coordination overhead. |
| Enterprise | FAIL | No single durable orchestration contract, no single replay execution path, and direct persistence coupling reduce operability. |
| Multi-region | FAIL | No evidence of region-aware deployment contracts or replicated workflow semantics. |
| Air-gapped deployment | WARN | Capability adapters exist, but connector isolation and vendor coupling are not fully abstracted. |
| Edge deployment | WARN | The runtime can be layered, but the active path still assumes a central gateway and database backbone. |
| Hybrid cloud | WARN | The architecture is modular enough to move, but not fully platform-agnostic. |
| Offline replay | WARN | Replay and witness primitives exist, but the production path is not yet fully replay-driven. |
| Massive repository indexing | WARN | The architecture is capable conceptually, but ingestion, storage, and projection are not yet fully unified. |
| Millions of continuity objects | FAIL | No single object and workflow contract is observable that would guarantee scale under long-lived replay. |

## Phase J — OmniRoute Readiness

### Verdict
The platform is not yet ready for a decade of independent OmniRoute evolution. The Continuity Kernel is conceptually insulated, but the orchestration layers above it still retain implementation coupling to gateways, persistence, connectors, and specific runtime services.

### Overall assessment
- Kernel isolation: WARN
- Platform replaceability: WARN
- Capability orientation: WARN
- Transport isolation: WARN
- Temporal readiness: FAIL
- Connector isolation: WARN
- Object readiness: WARN
- Replay integrity: WARN
- Projection integrity: WARN
- Mission execution: WARN
