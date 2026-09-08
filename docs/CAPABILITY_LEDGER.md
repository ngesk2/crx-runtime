# Capability & Integration Ledger

> Branch: `constitutional-convergence-v2` @ `828520ea` (post security remediation)
> Audit date: 2026-08-27 | READ-ONLY | Docker DOWN (visual worktree verification)
> Method: static require-graph BFS from the live production entrypoint `gateway/server.js -> gateway/bootstrap/gateway_runtime.js` (NOT the non-production `bootstrap/index.js`/`wiring.js` DI path). 570 scanned `.js` files -> 182 LIVE / 388 STRANDED.

## Summary

The **PING Core v1 spine is fully wired and live**: UnifiedEventRuntime, KnowledgeGraph, MissionRuntime/Scheduler, WorkerRuntime + 8 canonical workers (incl. ReplayWorker -> KernelReplayExecutionProvider, knowledge-promotion), EmbeddingService -> QdrantAdapter, HybridSearch, EvidenceAuthority, CanonicalizationService, connectors (CapabilityRegistry / OAuth / ConnectorRegistry), and the 5 business authorities (customer/project/review/ai_workspace/huggingface). Zero static broken `require()`s on the live path (no missing-module wires).

**The ledger's job is not to build new subsystems — it is to (a) wire the few genuinely stranded capabilities that add value, and (b) consolidate duplicate families onto their live winner, without deleting anything (dormant = unfinished, per CEO direction), and only with a wired-replacement gate.**

## LIVE capability surface (ground truth)

| Capability | Path | LIVE evidence |
|---|---|---|
| UnifiedEventRuntime | `ping-runtime/events/unified_event_runtime.js` | @ gateway_runtime.js:422/428/648; `/events`+`/ingest` |
| CanonicalizationService | `ping-runtime/canonicalization/canonicalization_service.js` | :436, 5 business emitters, `/ingest` |
| CanonicalObject / verify | `ping-runtime/canonicalization/canonical_object.js` | :101 into EvidenceAuthority |
| KnowledgeGraph | `ping-runtime/knowledge/knowledge_graph.js` | :461, `/knowledge`, graph-projection subscriber |
| MissionRuntime / Scheduler | `ping-runtime/orchestration/mission_{runtime,scheduler}.js` | :465/542, scheduler `.start()` |
| WorkerRuntime | `ping-runtime/workers/worker_runtime.js` | :469, populated :503 |
| Canonical workers (8) | `ping-runtime/workers/canonical_workers.js` | :703-738 (intelligence SKIPPED) |
| ReplayWorker + KernelReplayExecutionProvider | `canonical_workers.js` + `gateway/kernel_replay_execution_provider.js` | :713 |
| EmbeddingService + QdrantAdapter | `ping-runtime/embeddings/embedding_service.js`, `search/qdrant_adapter.js` | :483-491, :474 |
| EvidenceAuthority + HybridSearch | `ping-runtime/evidence/evidence_authority.js`, `search/hybrid_search.js` | :517/:522, POST /knowledge/search |
| KnowledgePromoter | `ping-runtime/knowledge/knowledge_promoter.js` | :678-687 |
| EventBridge + EventToMissionBridge | `ping-runtime/events/event_bridge.js`, `orchestration/event_to_mission_bridge.js` | :451/565 both `.start()` |
| AIRuntime + OllamaProvider | `ping-runtime/ai/{ai_runtime,ollama_provider}.js` | :228-230, `/ai`, `/api/v1/ollama` |
| CapabilityRegistry + OAuth + ConnectorRegistry | `ping-runtime/connectors/*` | :253-308, `/connectors` |
| DeadLetterAuthority | `gateway/dead_letter_authority.js` | :90/534, `/mc/dead-letters` (mission_control.js:490-522) |
| Business authorities | `ping-runtime/business/{review,customer,project,ai_workspace}_authority.js` | :401-419 routes |
| Runtime registries (tenant/deploy/runtime) + governance | `ping-runtime/{runtime,events}/*` | :372-390 |

## Duplicate families (all present; single LIVE winner)

| Concern | Implementations present (live winner in **bold**) |
|---|---|
| Event persistence / store / bus | **`ping-runtime/events/unified_event_runtime.js`**; `gateway/event_bus.js` (stranded); `gateway/event_repository.js` (stranded, kernel-adjacent); `gateway/event_outbox.js` (stranded producer); `gateway/mission_event_bus.js`; `runtime/kernel/event_repository.js` (kernel twin, dormant) |
| Worker abstraction / runtime | **`ping-runtime/workers/worker_runtime.js` + `canonical_workers.js`**; `gateway/worker_registry.js` (stranded); `ping-runtime/agents/base_worker.js` + `worker_port.js` + `replay_worker.js` (staged B7 moves, stranded); `ping-runtime/orchestration/execution/worker_port.js` + `worker_state_machine.js` (Orca, dormant); `gateway/background_workers.js` (dormant) |
| Scheduler | **`ping-runtime/orchestration/mission_scheduler.js`**; `gateway/replay_scheduler.js`, `gateway/scheduler_port.js`, `gateway/temporal_scheduler_provider.js`, `gateway/dependency_scheduler.js` (stranded); `runtime/kernel/scheduler/*` + `capability_scheduler.js` (kernel, dormant) |
| Replay engine | **`ping-runtime/workers/canonical_workers.js` ReplayWorker + `gateway/kernel_replay_execution_provider.js` + kernel engine** (live); `ping-runtime/agents/replay_worker.js` (staged B7, stranded); `gateway/replay_scheduler.js` (stranded); TS kernel replay (test-only) |
| Repository / knowledge store | **`ping-runtime/knowledge/knowledge_graph.js`**; `gateway/event_repository.js`, `gateway/repository_store.js` (moved `ping-runtime/events/repository_store.js`, used by kernel adapter), `runtime/kernel/event_repository.js` |
| Connector / adapter framework | **`ping-runtime/connectors/connector_registry.js` + `capability_registry.js` + `oauth_provider.js`**; `ping-runtime/runtime/integration_manager.js` (wired at boot, 0 production emissions); `gateway/google/*` adapters (live via GoogleConnector) |

## STRANDED capabilities (real value candidates to wire) — P0

| # | Capability | Path | Evidence | Value / why |
|---|---|---|---|---|
| S1 | **event_outbox publish path** | `gateway/event_outbox.js` | only `migration_engine.js` creates the table (migration 002); no runtime publisher on live graph; `migration_engine.js` not invoked at boot | DB-atomic outbox pattern exists but the spine writes straight to `ping_events`; wire-outbox = fetch-relay to guarantee delivery for `/ingest`+`/events`. MED |
| S2 | **Orca /orchestration execution** | `ping-runtime/orchestration/execution/engine.js` | LIVE constructed+route, but `initialize({discoverOllama:false})` -> zero models register -> no business traffic; business path never calls engine | Orca is the only consensus/capability-based engine; wiring it to MissionRuntime pending missions = real scheduling capability. MED |
| S3 | **Replay observability endpoints** | ReplayWorker + kernel provider (live) | REPLAY_COMPLETED carries authority evidence; **zero HTTP endpoint exposes replay trace** | `GET /replay/:eventId` + `/replay/stats` to surface the (now real) replay/witness evidence. LOW-EFFORT, HIGH-VALUE |
| S4 | **IntelligenceWorker** | `ping-runtime/workers/intelligence_worker.js` | registered with empty `eventTypes` (skipped at boot, gateway_runtime:721) | Known duplicate of observation->classification path (prior audits: 25 vs 14 fan-out). Do NOT wire as-is; either merge into claim/classification chain or keep dormant. See consolidation. |
| S5 | **knowledge_retrieval / conversation_memory / document_ingestion** | (M3-C candidates, left in gateway) | not on live graph | retrieval/memory/ingestion are partially covered by HybridSearch + KnowledgeGraph; assess overlap before wiring. LOW |

## STRANDED / dormant (large, low value — archive candidates, NOT to wire)

| Item | Detail |
|---|---|
| `orchestration/dormant_classifications/` | 429 JSON blobs (~2.88M lines of Phase 38 classification metadata); zero live readers |
| `ping-runtime/orchestration/*.json` | 463 metadata JSON files (AuthorityResolver, RoutingCache, CapabilityRegistry, etc.); zero live readers |
| Kernel twin modules (`runtime/kernel/*`, `runtime/adapters/*.ts`, `runtime/authorities/*`) | dormant; `kernelAdapter` runs the "hollow" validation pipeline (POST /events now bypasses it via convergence commit 31620edc) |
| `runtime/kernel/replay*`, TS replay engine | test-only, zero production imports |

## Remaining (never batched) per prior M3

- **B7 agent moves** (5 files already staged as renames): `agent_memory_authority`, `base_worker`, `distributed_desktop_agents`, `replay_worker`, `worker_port` -> `ping-runtime/agents/`. DEFERRED until trace/correctness pass complete (recorded in prior session). 4 stale `../gateway/*` refs (witness_authority, constitution_version_authority) + 2 gateway/tests wrong-depth refs must be fixed when executed. Frozen authorities untouched.
- **canonical_event_envelope.js** BLOCKED (repoRoot-injection needed; schema-file `__dirname` coupling) + duplicate at `gateway/replay/canonical_event_envelope.js` (uninvestigated).

## BROKEN WIRES (none on live path)
Static require-scan found **zero** missing-module requires on the `server.js -> gateway_runtime.js` graph. Prior "broken" flags (github_ingestion -> ./event_emitter, etc.) are on dormant paths only.

## Verification limits
- Docker DOWN -> no live E2E, no `initialize()`/schema run, no real-PG migration check. All verdicts are static graph + source-inspection based. The S4 race proof and full 8-worker live chain remain un-validated until Docker returns.

## Prioritized recommendation (for approval, NOT yet executed)
1. **P0-1 (effort LOW, value HIGH, no new subsystem): add replay/witness observability endpoints** — `GET /replay/:eventId` + `GET /replay/stats` reading the already-emitted REPLAY_COMPLETED/WITNESS_* evidence + ping_events. Pure addition on existing live data. Implements the "observable output" tier for the replay arrow.
2. **P0-2 (effort LOW): wire the outbox publish path** — give `event_outbox.js` a live consumer OR document/deprecate it (it is the only stranded producer whose table is created but never written). Recommend a small fetch-relay subscriber on UnifiedEventRuntime for guaranteed delivery, gated by a `event_outbox` regression unit test.
3. **P0-3 (effort MED, gated on Docker): Orca execution** — wire `executionEngine` to `MissionRuntime.getPending()` so /orchestration schedules real pending missions; requires decision on discoverOllama:false and the deterministic-mission-id fix.
4. **Consolidation (effort MED): single worker-identity decider + one priority scale + confidence on spine** — the long-standing decision-graph items (multi-owner worker identity, 4 incompatible priority scales, 8+ confidence recompute sites). Highest leverage but requires careful regression; stage after P0-1/P0-2.
5. **Archive (no code impact): move `orchestration/dormant_classifications/` + `ping-runtime/orchestration/*.json` metadata blobs out of the production tree** (they are pure archive; no live reader). Requires delete/relocate approval.

## Exit criteria for this phase
- P0-1/P0-2 landed with unit tests + boot-load gate, zero regressions (gateway suite + eval harness).
- Consolidation items each carry a wiring-first gate (golden test before any removal), per CEO direction.
- No new subsystems. No deletions without a wired-and-tested replacement. No history rewrite.
