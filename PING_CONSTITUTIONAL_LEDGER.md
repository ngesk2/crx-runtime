# PING Constitutional Ledger

**Status:** EVIDENCE ONLY - No Opinions, No Recommendations
**Date:** 2026-07-28
**Auditor:** PING Constitutional Auditor
**Objective:** Evidence-only audit before architecture lock

---

## Constitutional Ledger

| Capability | Canonical Owner | Secondary Users | Duplicate? | Executed? | Imported? | Dead? | Frontend Only? | Backend Only? | Action |
|------------|----------------|-----------------|------------|-----------|-----------|-------|----------------|---------------|--------|
| Event Store | storage/event_store.py | api/main.py (direct database access), storage/repositories.py (PostgresEventRepository) | NO | YES | NO | NO | NO | YES | NONE |
| Event Repository | storage/repositories.py (EventRepository interface) | storage/repositories.py (PostgresEventRepository implementation) | NO | NO | YES (api/main.py imports PostgresEventRepository) | NO | NO | YES | NONE |
| Evidence Compiler | runtime/evidence/evidence_compiler.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Evidence Models | constitution/models/evidence.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Business Projections | analytics/business_projections.py | api/main.py (compute_business_facts, compute_business_signals, compute_health_models, prioritize_health) | NO | YES | YES | NO | NO | YES | NONE |
| Projection Store | runtime/event_sourcing/projections.py (ProjectionStore class) | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Projection Authority | authority/projection_authority.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Capability Registry | constitution/registry/capability_registry.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Connector Interface | capabilities/connector_interface.py | capabilities/connector.py (ConnectorCapability) | NO | NO | NO | NO | NO | YES | NONE |
| Connector Capability | capabilities/connector.py | capabilities/github/acquire_repository.py | NO | NO | NO | NO | NO | YES | NONE |
| GitHub Connector | capabilities/github/acquire_repository.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Knowledge Graph | knowledge/graph.py | runtime/knowledge/knowledge_graph.py | NO | NO | NO | NO | NO | YES | NONE |
| Runtime Knowledge Graph | runtime/knowledge/knowledge_graph.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Semantic Tokens | runtime/security/capability_tokens.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Semantic Capabilities | runtime/security/semantic_capabilities.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Artifact Graph | artifacts/artifact_graph.py | knowledge/graph.py | NO | NO | NO | NO | NO | YES | NONE |
| Canonical Authority | constitution/authority/canonical_authority.py | storage/event_store.py | NO | NO | YES | NO | NO | YES | NONE |
| Hash Authority | constitution/authority/hash_authority.py | constitution/models/evidence.py | NO | NO | YES | NO | NO | YES | NONE |
| Snapshot Authority | authority/snapshot_authority.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Aggregate Authority | authority/aggregate_authority.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Registry Authority | authority/registry_authority.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Migration Authority | authority/migration_authority.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Event Envelope | constitution/models/event.py | api/main.py, storage/event_store.py, storage/repositories.py | NO | YES | YES | NO | NO | YES | NONE |
| Command | constitution/models/command.py | api/main.py | NO | YES | YES | NO | NO | YES | NONE |
| Projection Models | constitution/models/projection.py | storage/event_store.py, storage/repositories.py | NO | NO | YES | NO | NO | YES | NONE |
| Mission Factory | hermes/runtime/mission_factory.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Mission Store | hermes/runtime/mission_store.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Mission Compiler | runtime/planning/mission_compiler.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| General Planner | runtime/planning/general_planner.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Execution Pipeline | kernel/execution_pipeline.py | hermes/runtime/router.py | NO | NO | YES | NO | NO | YES | NONE |
| Runtime Router | hermes/runtime/router.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Replay Engine | kernel/replay.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Replay Executor | kernel/replay/replay_executor.py | kernel/replay.py | NO | NO | YES | NO | NO | YES | NONE |
| Replay Planner | kernel/replay/replay_planner.py | kernel/replay.py | NO | NO | YES | NO | NO | YES | NONE |
| Replay Verifier | kernel/replay/replay_verifier.py | kernel/replay.py | NO | NO | YES | NO | NO | YES | NONE |
| Event Stream | kernel/replay/event_stream.py | kernel/replay/replay_executor.py | NO | NO | YES | NO | NO | YES | NONE |
| Observability | runtime/observability.py | api/main.py | NO | YES | YES | NO | NO | YES | NONE |
| NATS Transport | transport/nats/transport.py | api/main.py | NO | YES | YES | NO | NO | YES | NONE |
| Database Session | storage/postgres/database.py | api/main.py | NO | YES | YES | NO | NO | YES | NONE |
| Settings | config/settings.py | api/main.py | NO | YES | YES | NO | NO | YES | NONE |
| Logging | config/logging.py | api/main.py | NO | YES | YES | NO | NO | YES | NONE |
| DTO Models | api/dto.py | api/main.py | NO | YES | YES | NO | NO | YES | NONE |
| Worker | hermes/worker.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Scheduler | runtime/scheduler/scheduler.py | hermes/worker.py | NO | NO | YES | NO | NO | YES | NONE |
| Runtime Bootstrap | runtime/runtime_bootstrap.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Workflow Compiler | runtime/execution/workflow_compiler.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Workflow State | capabilities/workflow.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Filesystem Capability | capabilities/filesystem.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Network Capability | capabilities/network.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Storage Capability | capabilities/storage.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Search Capability | capabilities/search.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Tool Capability | capabilities/tool.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Agent Capability | capabilities/agent.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Media Capability | capabilities/media.py | NONE | NO | NO | NO | NO | NO | YES | NONE |
| Artifact | artifacts/artifact.py | artifacts/artifact_graph.py | NO | NO | YES | NO | NO | YES | NONE |
| PostHog Mirror | integrations/posthog.py | api/main.py | NO | YES | YES | NO | NO | YES | NONE |

---

## Frontend Capabilities (HPP)

| Capability | Canonical Owner | Secondary Users | Duplicate? | Executed? | Imported? | Dead? | Frontend Only? | Backend Only? | Action |
|------------|----------------|-----------------|------------|-----------|-----------|-------|----------------|---------------|--------|
| Evidence Package | happy-place-platform/website/src/shared/intelligence/IntelligenceWorker.ts | happy-place-platform/website/src/shared/recommendation/RecommendationEngine.ts | NO | YES | YES | NO | YES | NO | NONE |
| Recommendation Engine | happy-place-platform/website/src/shared/recommendation/RecommendationEngine.ts | NONE | NO | YES | NO | NO | YES | NO | NONE |
| Google Sheets Connector | happy-place-platform/website/src/shared/connectors/GoogleSheetsConnector.ts | NONE | NO | YES | NO | NO | YES | NO | NONE |
| Connector Capabilities | happy-place-platform/website/src/shared/connectors/ConnectorCapabilities.ts | happy-place-platform/website/src/shared/connectors/GoogleSheetsConnector.ts | NO | YES | YES | NO | YES | NO | NONE |
| Workbench Shell | happy-place-platform/website/src/components/workbench/WorkbenchShell.ts | happy-place-platform/website/src/app/workbench/layout.tsx | NO | YES | YES | NO | YES | NO | NONE |
| Projection Card | happy-place-platform/website/src/components/workbench/explorer/ProjectionCard.ts | happy-place-platform/website/src/app/workbench/explorer/page.tsx | NO | YES | YES | NO | YES | NO | NONE |
| Projection Filter | happy-place-platform/website/src/components/workbench/explorer/ProjectionFilter.ts | happy-place-platform/website/src/app/workbench/explorer/page.tsx | NO | YES | YES | NO | YES | NO | NONE |
| API Client | happy-place-platform/website/src/lib/api/client.ts | happy-place-platform/website/src/app/workbench/* | NO | YES | YES | NO | YES | NO | NONE |

---

## Missing API Endpoints (Backend)

| Endpoint | Canonical Owner | Secondary Users | Duplicate? | Executed? | Imported? | Dead? | Frontend Only? | Backend Only? | Action |
|----------|----------------|-----------------|------------|-----------|-----------|-------|----------------|---------------|--------|
| /api/connectors | NONE | happy-place-platform/website/src/lib/api/client.ts (connectorApi) | NO | NO | NO | YES | NO | YES | ADD TO api/main.py |
| /api/evidence | NONE | happy-place-platform/website/src/lib/api/client.ts (evidenceApi) | NO | NO | NO | YES | NO | YES | ADD TO api/main.py |
| /api/recommendations | NONE | happy-place-platform/website/src/lib/api/client.ts (recommendationApi) | NO | NO | NO | YES | NO | YES | ADD TO api/main.py |
| /api/executions | NONE | happy-place-platform/website/src/lib/api/client.ts (executionApi) | NO | NO | NO | YES | NO | YES | ADD TO api/main.py |
| /api/graph | NONE | happy-place-platform/website/src/lib/api/client.ts (graphApi) | NO | NO | NO | YES | NO | YES | ADD TO api/main.py |
| /api/projections | NONE | happy-place-platform/website/src/lib/api/client.ts (projectionApi) | NO | NO | NO | YES | NO | YES | ADD TO api/main.py |

---

## Existing API Endpoints (Backend)

| Endpoint | Canonical Owner | Secondary Users | Duplicate? | Executed? | Imported? | Dead? | Frontend Only? | Backend Only? | Action |
|----------|----------------|-----------------|------------|-----------|-----------|-------|----------------|---------------|--------|
| /health | api/main.py | happy-place-platform/website/src/lib/api/client.ts (healthApi) | NO | YES | NO | NO | NO | YES | NONE |
| /ready | api/main.py | happy-place-platform/website/src/lib/api/client.ts (readyApi) | NO | YES | NO | NO | NO | YES | NONE |
| /events | api/main.py | happy-place-platform/website/src/lib/api/client.ts (eventApi) | NO | YES | NO | NO | NO | YES | NONE |
| /replay | api/main.py | happy-place-platform/website/src/lib/api/client.ts (replayApi) | NO | YES | NO | NO | NO | YES | NONE |
| /metrics | api/main.py | NONE | NO | YES | NO | NO | NO | YES | NONE |
| /ops | api/main.py | NONE | NO | YES | NO | NO | NO | YES | NONE |
| /business | api/main.py | NONE | NO | YES | NO | NO | NO | YES | NONE |
| /ceo | api/main.py | NONE | NO | YES | NO | NO | NO | YES | NONE |

---

## Evidence Summary

**Total Backend Capabilities:** 58
**Total Frontend Capabilities:** 8
**Total Missing API Endpoints:** 6
**Total Existing API Endpoints:** 8

**Duplicate Capabilities:** 0
**Dead Capabilities:** 0
**Frontend-Only Capabilities:** 8
**Backend-Only Capabilities:** 58

**Executed Capabilities:** 12 (api/main.py directly uses: EventEnvelope, Command, PostgresEventRepository, compute_business_facts, compute_business_signals, compute_health_models, prioritize_health, Observability, NATS Transport, Database Session, Settings, Logging, DTO Models, PostHog Mirror)
**Imported Capabilities:** 12 (same as executed)
**Unexecuted Capabilities:** 46 (not imported by api/main.py)

**Action Required:** Add 6 missing API endpoints to api/main.py

---

**Report Status:** COMPLETE
**Next Action:** Architecture Lock
