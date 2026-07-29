# WAVE 4B — Runtime Reconciliation Audit

**Mode:** STRICTLY READ ONLY. No code changes. No deletions. No replacements. No new architecture.
**Philosophy (per brief):** Treat the repo as an OS. Every subsystem was built for a legitimate reason.
Find **missing connections**, not "duplicate boxes." Everything is assumed valuable.
**Verdict vocabulary:** `KEEP` (correct role) · `REPURPOSE` (shift role) · `CONNECT` (wire missing edge) · **never `DELETE`**.

---

## 1. Runtime Families → Constitutional Role + Missing Connections

### `runtime/` (kernel-facing runtime)
| Module | Current Role | Constitutional Role | Verdict / Missing Connection |
|---|---|---|---|
| `persistent_runtime.py` | PostgreSQL event store | **Operational Witness** (owns canonical event persistence) | KEEP. CONNECT → should publish "event persisted" → Business Facts (already read by `/business`,`/ceo`) |
| `scheduler/scheduler.py`, `constitutional_scheduler.py`, `vps_scheduler.py` | Task scheduling | **Runtime (scheduling)** | KEEP. CONNECT → queue depth / worker saturation → `CapacityHealth` signal |
| `authority_graph.py` | Authority relationship graph | **Canonical Authority** | KEEP |
| `configuration_authority.py`, `witness_authority.py`, `implementation_authority.py`, `execution_authority.py` | Constitutional authorities | **Canonical Authority** | KEEP (Law 0–10) |
| `failure_authority.py` | CI rejection / severity | **Canonical Authority** | KEEP. CONNECT → failure severity → `OperationsHealth` driver (explainability "Why?") |
| `execution_capabilities.py`, `execution_context*.py`, `execution_interfaces.py` | Execution plumbing | **Runtime (execution)** | KEEP |
| `implementation_hash.py` | Canonical hashing | **Canonical Authority (integrity)** | KEEP |
| `registry/merge_manifest.py`, `work_claim_manager.py`, `promotion_pipeline.py`, `oracle_sandbox.py` | Registries | **Authority / Runtime** | KEEP |
| `security/capability_broker.py`, `semantic_capabilities.py`, `signed_policy.py`, `capability_tokens.py` | Capability security | **Authority (security)** | KEEP. CONNECT → token expiry/failure → `OperationsHealth` driver |
| `evidence/evidence_compiler.py` | Evidence compilation | **Operational Witness** | KEEP |
| `planning/*` (general_planner, planning_ir, compiler_stages, objective_compiler, transient_objectives, optimization_passes, strategy, hierarchy, mission_compiler) | PING planning | **Runtime (planning)** | KEEP (distinct from HPP compiler — constitutional boundary) |
| `executor/executor.py`, `executor_pool.py`, `planner/planner.py` | Execution | **Runtime (execution)** | KEEP |
| `oracle/oracle.py` | AI reasoning | **Intelligence (AI)** | KEEP. CONNECT → Oracle findings → Health Model *drivers* (explainability); Oracle must **never** define business KPIs/thresholds (HPP owns) |
| `skills/*` | Skill registry/classification | **Runtime (skills)** | KEEP |
| `verification/verifier.py` | Replay verification | **Replay Layer: Verification** | KEEP |
| `artifacts/artifact_ontology.py` | Artifact model | **Artifact Authority** | KEEP |
| `knowledge/knowledge_graph.py` | Entity graph | **Knowledge (Intelligence)** | KEEP. CONNECT → customer/project nodes → Business Facts |
| `execution/workflow_compiler.py` | Workflow compilation | **Runtime (compiler)** | KEEP |
| `event_sourcing/projections.py` | Projection engine | **Projection** | KEEP. CONNECT → should consume BI Health Models (not just raw events) |
| `state/state_machine.py` | State | **Runtime (state)** | KEEP |
| `messaging/outbox.py` | CDC outbox | **Integration Adapter** | KEEP. CONNECT → outbox → PostHog mirror (BI facts/health) |
| `kernel/capabilities.py` | Kernel capabilities | **Runtime (kernel)** | KEEP |
| `hermes/constitutional_citizen.py` | Citizen authority | **Authority (citizen)** | KEEP |

### `hermes/` (execution engine)
| Module | Current Role | Constitutional Role | Verdict / Missing Connection |
|---|---|---|---|
| `runtime/bootstrap_loader.py` | Loads capabilities/authorities/connectors | **Runtime (loader)** | KEEP (stub finished this session). CONNECT → registered connectors → IntegrationHealth signal |
| `worker.py`, `execution/queue*.py`, `execution/lease.py`, `execution/state_store.py`, `execution/context.py`, `execution/lifecycle.py` | Worker runtime | **Worker Runtime** | KEEP. CONNECT → worker utilization → `CapacityHealth` signal (via observability `events_per_second`) |
| `runtime/engine.py`, `pipeline.py`, `pipeline_stages.py`, `event_bus.py`, `artifact_repository.py`, `artifact_backend.py`, `mission_store.py`, `mission_factory.py`, `router.py`, `resolver.py`, `serializer.py` | Hermes execution runtime | **Hermes Runtime (execution engine)** | KEEP. CONNECT → pipeline stage latency → `OperationsHealth` driver |
| `storage/engine.py` | Storage | **Runtime (storage)** | KEEP |
| `infrastructure/logger.py` | Logging | **Runtime Observer** | KEEP |
| `hermes_runtime.py` | AI-platform telemetry (GPUUtil, QueueDepth, InferenceLatency, WarmCacheStatus, MemoryUsage, HealthCheck) | **Runtime Observer (AI telemetry)** | KEEP. CONNECT → QueueDepth/InferenceLatency → `CapacityHealth`/`AIHealth` signal |

### `kernel/` (event-sourcing primitives)
| Module | Current Role | Constitutional Role | Verdict |
|---|---|---|---|
| `build_witness.py` | Witness builder | **Replay Layer: Witness** | KEEP |
| `replay/replay_kernel.py` | Replay core | **Replay Layer: Recovery + Simulation** | KEEP |
| `replay/replay_verifier.py` | Replay verification | **Replay Layer: Verification** | KEEP |
| `replay/replay_executor.py` | Replay execution | **Replay Layer: Recovery** | KEEP |
| `replay/replay_planner.py` | Replay planning | **Replay Layer: Simulation/Planning** | KEEP |
| `replay/event_stream.py` | Event stream | **Replay Layer: Historical Projection** | KEEP |
| `projection.py`, `aggregate.py`, `state_machine.py`, `invariant_engine.py`, `event_dag.py`, `command_bus.py`, `snapshot.py`, `execution_pipeline.py` | Kernel primitives | **Kernel (Runtime)** | KEEP |
| `scheduler.py` | Kernel scheduler | **Runtime (scheduling)** | KEEP |

---

## 2. Observability → Business Signals

`runtime/observability.py` (Prometheus `Counter`/`Histogram`/`Gauge`: events_total, http_requests, replay_latency, api_latency, **events_per_second**, active_replays, database_connections) is **Operational Witness (telemetry)** — KEEP.

**Missing connections (signals it should feed):**
- `events_per_second` gauge → **`worker_utilization` signal** (currently BI re-derives event arrival rate from the store; should consume observability instead).
- `replay_latency` / `api_latency` histograms → **`OperationsHealth` driver** (explainability "Queue latency: +14%").
- `database_connections` gauge → **`OperationsHealth` driver**.

Verdict: **KEEP + CONNECT.** Do not merge observability into BI; let BI *consume* it as a signal source.

---

## 3. Connectors / Providers → Capability Registry / Health Driver / Facts

| Module | Current Role | Constitutional Role | Verdict / Missing Connection |
|---|---|---|---|
| `notification/provider_descriptor.py` | Immutable provider descriptor (capabilities, priority, availability) | **Adapter Descriptor** | KEEP |
| `notification/provider_registry.py` | Registry of providers | **Authority (provider registry)** | KEEP. CONNECT → registered providers → `IntegrationHealth` signal |
| `notification/provider_runtime.py` | Mutable runtime state + metrics (success_rate, latency, availability) | **Integration Adapter (runtime state)** | KEEP. CONNECT → `ProviderAvailability` + `success_rate` → `OperationsHealth`/`CapacityHealth` driver |
| `notification/capability_resolver.py`, `capability_authority.py`, `transport_authority.py`, `authority.py` | Notification authorities | **Authority (notification)** | KEEP |
| `notification/providers/base.py` | Provider base | **Integration Adapter** | KEEP |
| `notification/providers/kit.py` | Email (Kit) | **Integration Adapter (email)** | KEEP. Feeds: Producer (emits EmailSent/EmailOpened). CONNECT → open/click events → `email_engagement` signal → `MarketingHealth` |
| `notification/providers/twilio.py` | SMS | **Integration Adapter (SMS)** | KEEP. CONNECT → SMS delivery success → `OperationsHealth` driver |
| `notification/outbox_processor.py` | Outbox processor | **Integration Adapter (CDC)** | KEEP. CONNECT → outbox → PostHog mirror |
| `notification/metric_events.py` | Metric events | **Operational Witness** | KEEP |
| `notification/evidence.py` | Evidence | **Operational Witness** | KEEP |

**Capability Registry ownership:** providers are already registered via `provider_registry` + `capability_resolver`. KEEP. The *missing edge* is provider health → BI signals, not a registry gap.

---

## 4. Notifications → Producer / Projection / Automation / Integration

| Channel | Module | Role | Verdict |
|---|---|---|---|
| Email | `providers/kit.py` | **Producer** (emits EmailSent/Opened/Clicked) → Business Facts → `email_engagement` signal → `MarketingHealth` | KEEP + CONNECT (events already feed BI via store) |
| SMS | `providers/twilio.py` | **Producer / Integration** (SMS delivery) | KEEP |
| Webhook | `RUNTIME_INPUT_BOUNDARY_DESIGN.md` `@app.post("/webhooks/kit")` | **Integration Adapter (inbound)** | KEEP (design doc; implement as adapter) |
| PostHog | `integrations/posthog.py` | **Projection (Integration)** — currently delivers RAW events | **REPURPOSE**: deliver BI Business Facts + Health Models, not raw repository state (close the one projection-boundary violation from WAVE 4A) |
| Slack / Discord | (not yet present) | **Future Integration** | When added: Producer/Integration only; never business-meaning owner |
| Notifications API | `RUNTIME_INPUT_BOUNDARY_DESIGN.md` `@app.post("/notifications")` | **Integration Adapter (inbound)** | KEEP (design) |

---

## 5. AI — What It Should Publish / Never Own

| Module | Current Role | Constitutional Role | Publish | NEVER Own |
|---|---|---|---|---|
| `hermes/` (worker, pipeline, runtime) | Execution engine | **Worker Runtime** | Operational telemetry (queue depth, stage latency) → `CapacityHealth`/`OperationsHealth` signals | Business meaning, KPIs, health thresholds |
| `runtime/oracle/oracle.py` | AI reasoning / planning | **Intelligence (AI)** | Operational intelligence: anomaly detection, pipeline-risk flags, worker-saturation warnings → Health Model *drivers* (explainability "Why?") | Business definitions: what "healthy"/"good campaign" means, revenue thresholds, marketing semantics (HPP owns) |
| LLM / Ollama / Prompt / Inference | (reside in `hermes_runtime` / `oracle`) | **Intelligence (inference)** | Inference latency, success rate, model warm-cache status → `CapacityHealth`/`AIHealth` signal | Any business KPI or health-model *threshold* |

**Principle:** AI publishes *operational intelligence* (observations, anomalies, risks). AI never owns *business intelligence* (meaning, KPIs, recommendations' business semantics). HPP defines; PING computes; AI may *explain* but not *redefine*.

---

## 6. Replay → Replay Layer Classification

| Module | Replay Layer | Verdict |
|---|---|---|
| `kernel/build_witness.py` | **Witness** | KEEP |
| `kernel/replay/replay_kernel.py` | **Recovery + Simulation** | KEEP |
| `kernel/replay/replay_executor.py` | **Recovery (execution)** | KEEP |
| `kernel/replay/replay_planner.py` | **Simulation / Planning** | KEEP |
| `kernel/replay/replay_verifier.py` | **Verification** | KEEP |
| `kernel/replay/event_stream.py` | **Historical Projection** | KEEP |
| `runtime/verification/verifier.py` | **Certification / Verification** | KEEP |

No duplicates — these are distinct replay-layer responsibilities. **KEEP all.** Missing connection: replay success/failure rate → `OperationsHealth` driver (replay reliability is an operational health signal).

---

## 7. Dashboards → Which Health Models Feed Them

| Dashboard | Current | Fed By | Verdict |
|---|---|---|---|
| `/ceo` (`api/main.py:475`) | Exec view | **Health Models + Prioritization** | ✅ Correct projection — KEEP |
| `/business` (`api/main.py:418`) | BI facts/signals/health | **Health Models** | ✅ Correct projection — KEEP |
| `/ops` (`api/main.py:376`) | Operational state | re-derives counts/deps | **REPURPOSE → CONNECT**: consume `OperationsHealth` instead of re-deriving |
| `/health` (`api/main.py:91`) | Liveness probe | inline postgres+nats | **KEEP (probe) + CONNECT**: mirror `OperationsHealth` deps |
| `/ready` (`api/main.py:114`) | Readiness probe | inline postgres+nats | **KEEP (probe)** |
| `/metrics` (`api/main.py:367`) | Prometheus exposition | `observability` | **KEEP** (operational telemetry, not BI) |
| `/replay`, `/events` | Event store | store | **KEEP** (operational) |

Never the reverse: dashboards consume Health Models; Health Models never consume dashboards.

---

## 8. Event Flow Graph — Missing Edges

```
Producer                  Canonical Event        Business Fact      Signal            Health           Projection        Automation
─────────────────────────────────────────────────────────────────────────────────────────────────────
providers/kit.py        EmailSent/Opened →   email_sent/opened → email_engagement → MarketingHealth  → /ceo            → (future: send)
providers/twilio.py     SmsSent           → (fact)          → (signal)         → OperationsHealth → /ops            → (future)
persistent_runtime.py     *any event*        → ALL Business Facts → ALL Signals      → ALL Health     → /business//ceo  → PostHog*
oracle/oracle.py         (finding)          → (none)           → (driver only)    → Health driver   → explainability   → (never biz def)
observability.py         (metric)           → (signal src)      → worker_utilization→ CapacityHealth  → /ops            → (telemetry)
provider_runtime.py      (availability)      → (signal src)      → IntegrationHealth→ OperationsHealth → /ops            → (telemetry)
hermes_runtime.py       (AI telemetry)      → (signal src)      → CapacityHealth   → /ops            → (telemetry)
integrations/posthog.py  *raw event*        ✗ MISSING EDGE: should consume Business Facts + Health Models, not raw events
/ops endpoint            (reads store)       ✗ MISSING EDGE: should consume OperationsHealth, not re-derive
```

**Missing edges (the audit's core finding):**
1. `integrations/posthog.py` → should consume **BI Health Models/Facts** (not raw events).
2. `/ops` → should consume **`OperationsHealth`** (not re-derive).
3. `observability.events_per_second` → `worker_utilization` signal.
4. `provider_runtime` availability/success → `OperationsHealth`/`CapacityHealth` driver.
5. `hermes_runtime` AI telemetry → `CapacityHealth`/`AIHealth` signal.
6. `oracle` findings → Health Model *drivers* (explainability), never thresholds.
7. `replay` success rate → `OperationsHealth` driver.

None of these are "duplicates" — they are **unwired valuable capabilities**.

---

## 9. Integration Matrix

| Module | Current Purpose | Future Constitutional Role | Keep | Repurpose Into |
|---|---|---|---|---|
| `persistent_runtime.py` | Event store | Operational Witness | ✅ | (consume by BI) |
| `scheduler/*` | Scheduling | Runtime (scheduling) | ✅ | feed CapacityHealth |
| `authority_*` | Constitutional authorities | Canonical Authority | ✅ | — |
| `failure_authority.py` | CI severity | Canonical Authority | ✅ | → OperationsHealth driver |
| `security/*` | Capability security | Authority (security) | ✅ | → OperationsHealth driver |
| `planning/*` | PING planning | Runtime (planning) | ✅ | — |
| `executor/*` | Execution | Runtime (execution) | ✅ | — |
| `oracle/oracle.py` | AI reasoning | Intelligence (AI) | ✅ | → Health drivers (explain) |
| `skills/*` | Skills | Runtime (skills) | ✅ | — |
| `verifier.py` | Verification | Replay: Verification | ✅ | — |
| `knowledge_graph.py` | Entity graph | Knowledge | ✅ | → Business Facts |
| `event_sourcing/projections.py` | Projection | Projection | ✅ | consume BI Health |
| `messaging/outbox.py` | CDC | Integration Adapter | ✅ | → PostHog (BI) |
| `hermes/runtime/*` | Execution engine | Hermes Runtime | ✅ | → CapacityHealth signal |
| `hermes/worker.py`,`execution/*` | Worker | Worker Runtime | ✅ | → CapacityHealth signal |
| `hermes_runtime.py` | AI telemetry | Runtime Observer | ✅ | → CapacityHealth/AIHealth signal |
| `kernel/build_witness.py` | Witness | Replay: Witness | ✅ | — |
| `kernel/replay/*` | Replay | Replay Layer | ✅ | → OperationsHealth driver |
| `observability.py` | Telemetry | Operational Witness | ✅ | → worker_utilization signal |
| `provider_registry.py` | Provider registry | Authority | ✅ | → IntegrationHealth signal |
| `provider_runtime.py` | Provider state | Integration Adapter | ✅ | → OperationsHealth driver |
| `providers/kit.py` | Email | Integration Adapter (Producer) | ✅ | → email_engagement signal |
| `providers/twilio.py` | SMS | Integration Adapter | ✅ | → OperationsHealth driver |
| `outbox_processor.py` | Outbox | Integration Adapter (CDC) | ✅ | → PostHog (BI) |
| `integrations/posthog.py` | Raw-event delivery | Projection (Integration) | ✅ | **REPURPOSE**: deliver BI Facts/Health |
| `/ceo`, `/business` | BI dashboards | Projection (BI) | ✅ | — |
| `/ops` | Operational state | Projection | ✅ | **REPURPOSE**: consume OperationsHealth |
| `/health`,`/ready` | Probes | Runtime Observer | ✅ | mirror OperationsHealth |
| `/metrics` | Prometheus | Operational Witness | ✅ | — |

**Zero `DELETE` rows.** Every subsystem is valuable and repurposable.

---

## Final Deliverable — How Existing Subsystems Evolve (no new infra)

If **no new infrastructure** is built from this point forward, the existing ecosystem evolves by **wiring missing edges**, not by adding services:

- **KEEP** — all authorities, kernel primitives, replay layer, schedulers, skills, verifier, knowledge graph, observability, providers, probes. They are correctly role-bound.
- **REPURPOSE** — `integrations/posthog.py` (raw events → BI Facts/Health); `/ops` (re-derive → consume `OperationsHealth`). Two surgical shifts; no new modules.
- **CONNECT** — the 7 missing edges in §8: observability→`worker_utilization`, provider_runtime→`OperationsHealth`, hermes_runtime→`CapacityHealth`, oracle→Health *drivers*, replay→`OperationsHealth`, `/ops`→`OperationsHealth`, PostHog→BI Facts/Health.

**Net result:** the accumulated infrastructure becomes a coherent OS where every subsystem feeds the BI layer (Facts → Signals → Health → Dashboard → Projections) via connections that already *exist as data* but were never *wired*. No deletions. No new architecture. The platform's value was always in the ecosystem — it just needed its edges connected.

**Verdict stamp:** `KEEP` · `REPURPOSE` (2) · `CONNECT` (7) · **never `DELETE`**.
