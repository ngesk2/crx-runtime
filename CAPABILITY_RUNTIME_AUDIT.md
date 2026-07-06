# CAPABILITY RUNTIME AUDIT

## Objective
Verify that orchestration targets capabilities rather than implementation-specific services such as repositories, connectors, databases, LLMs, gateways, and workers.

## Current state
The current orchestration layer is partly capability-oriented but still contains direct invocation paths that reach infrastructure and implementation services.

## Direct invocation violations
| Invocation target | Evidence | Why it violates the target model | Classification |
|---|---|---|---|
| PostgreSQL pool | [gateway/bootstrap/main.js](gateway/bootstrap/main.js) | The runtime creates a concrete database pool directly instead of resolving a capability-backed persistence contract first. | HIGH |
| Repository and event services | [gateway/bootstrap/gateway_runtime.js](gateway/bootstrap/gateway_runtime.js) | The gateway instantiates concrete services directly rather than resolving them through an execution contract. | HIGH |
| Event execution route | [gateway/routes/events.js](gateway/routes/events.js) | The route calls an execution function directly instead of routing via a capability-driven policy boundary. | MEDIUM |
| Ollama inference route | [gateway/routes/ollama.js](gateway/routes/ollama.js) | The transport enters inference logic directly rather than passing through an execution/capability layer. | MEDIUM |
| MCP provider mapping | [gateway/mcp_registry.js](gateway/mcp_registry.js) | The registry describes capabilities but the active execution path still relies on direct provider and connector implementations. | MEDIUM |

## Capability-oriented parts already present
| Capability-oriented component | Evidence |
|---|---|
| Execution runtime | [runtime/execution_runtime.js](runtime/execution_runtime.js) |
| Technology authority capability selection | [gateway/technology_authority.js](gateway/technology_authority.js) |
| MCP capability registry | [gateway/mcp_registry.js](gateway/mcp_registry.js) |
| Execution pipeline | [gateway/runtime/constitutional_execution_pipeline.js](gateway/runtime/constitutional_execution_pipeline.js) |

## Desired execution path
Capability → Execution → Authority → Replay → Projection

## Conclusion
The system already contains capability-oriented abstractions, but the active orchestration path does not consistently resolve through them. The platform is capable of becoming capability-driven, but it is not yet there end-to-end.
