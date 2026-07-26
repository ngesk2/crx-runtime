# WAVE 3A.5 — READ-ONLY RUNTIME AUTHORITY AUDIT

**Mode:** Read-only. No code changes. Inventory + dependency graph + startup wiring + authority ownership only.
**Basis:** `constitutional-runtime` file evidence this session (api/main.py, bootstrap/, capabilities/connector*.py, hermes/runtime/bootstrap_loader.py, notification/*, constitution/authority/*, kernel/build_witness.py, runtime/persistent_runtime.py, runtime/witness_authority.py, runtime/failure_authority.py, runtime/execution_authority.py, storage/postgres/models.py, architecture/infrastructure/prometheus.yml).
**Invariant (SPRINT4):** canonical owner = who owns *meaning*, not who stores/executes.

---

## 1. Startup Graph (actual, not the user's Node framing)

> **Mismatch flag:** the user's template assumes `server.js → GatewayRuntime`. This repo is **Python/FastAPI** — there is **no `server.js`**. The real entry is `api/main.py` (uvicorn `api.main:app`, per deploy/Dockerfile). I map the *actual* boot, not the Node template.

```
api/main.py  (FastAPI app, uvicorn entry)         [E:deploy/Dockerfile CMD uvicorn api.main:app]
   │ instantiated: YES  singleton: YES  lazy: NO
   │ deps: settings, dto, constitution/authority, storage/postgres, bootstrap
   ▼
bootstrap/BootstrapLoader  (loads capabilities/authorities/connectors from manifest.yaml)   [E:bootstrap/__init__.py]
   │ instantiated: YES (called at startup)  singleton: YES  lazy: NO
   │ deps: manifest.yaml, constitution/authority/*, capabilities/*, notification/provider_*
   ▼
constitution/authority/*  (canonical/impl/registry/tree/traversal/encoding/hash/universal)   [E:constitution/authority/*]
   │ instantiated: YES (imported by bootstrap + runtime)  singleton: YES  lazy: import-time
   │ authority owner: ConstitutionAuthority (canonical)
   ▼
api/main.py routes: /health /ready /events /replay /metrics   [E:api/main.py]
   │ instantiated: YES  singleton: route table  lazy: NO
   │ authority owner per-route: see §3
   ▼
Workers:
   hermes/worker.py  (Hermes agent worker)   [E:hermes/worker.py]
      instantiated: YES (process)  singleton: per-process  lazy: process-start
      deps: hermes/runtime/*, runtime/execution_*, notification/provider_*
   runtime/scheduler/scheduler.py  (ConstitutionalScheduler)   [E:runtime/scheduler/scheduler.py]
      instantiated: YES  singleton: YES  lazy: NO
      deps: runtime/execution_*, constitution/authority
```

**Startup order:** api/main.py → bootstrap (load manifest: capabilities/authorities/connectors) → constitution/authority import → routes register → workers spawn (hermes/worker, scheduler).

---

## 2. Authority Inventory

| Conceptual Authority | Actual module (evidence) | Status | Startup | Consumers | Canonical? | Duplicate? |
|---|---|---|---|---|---|---|
| EventReadAuthority | `api/main.py` `/events` + `storage/postgres/models.py` Event | present | route | api, hermes | canonical (Event store) | — |
| EventWriteAuthority | `storage/event_store.py` append | present | runtime | runtime/execution_*, hermes | canonical | — |
| HealthAuthority | `api/main.py` `/health` (HealthResponseDTO) | present (static JSON) | route | api | NOT delegated (see §3) | — |
| ReplayAuthority | `kernel/build_witness.py` + `runtime/witness_authority.py` | present (×2) | runtime | runtime/persistent_runtime | kernel/witness canonical | **×2** (kernel + runtime) |
| ConnectorAuthority | `capabilities/connector.py` + `connector_interface.py` | present (contract) | bootstrap | hermes/runtime, capabilities/github | canonical (contract) | contract vs registry (see §6) |
| RuntimeRegistry | `runtime/persistent_runtime.py` | present | runtime | hermes, scheduler | canonical | — |
| TenantRegistry | `bootstrap/manifest.yaml` (connectors/capabilities) | partial (manifest only) | bootstrap | bootstrap | manifest-driven | — |
| DeploymentRegistry | `deploy/Dockerfile` + `architecture/infrastructure/*` (deploy blueprints) | partial (infra docs) | deploy | deploy | infra-defined | — |
| CapabilityResolver | `notification/capability_resolver.py` | present | runtime | notification/provider_*, ingress | canonical | — |
| FailureAuthority (EventValidator) | `runtime/failure_authority.py` | present | runtime | runtime/execution_* | canonical | — |
| ExecutionAuthority (WorkflowExecutor) | `runtime/execution_authority.py` | present | runtime | hermes, ingress | canonical | — |
| ProviderRegistry (IntegrationMgr) | `notification/provider_registry.py` + `provider_runtime.py` | present | runtime | notification/*, ingress | canonical (operational) | **vs ConnectorAuthority** (see §6) |

**Finding:** the user's feared "multiple modules solving the same problem" is **real** in two places:
1. **ReplayAuthority ×2** — `kernel/build_witness.py` (canonical) + `runtime/witness_authority.py` (second).
2. **Integration-manager split** — `capabilities/connector.py` (connector *contract*) + `notification/provider_registry.py` (provider *registry*). Both express "external integration" but at different layers. Not a hard duplicate, but a convergence risk.

---

## 3. Route Ownership

| Route | Actual owner (evidence) | Expected (user) | Gap |
|---|---|---|---|
| `/health` | `api/main.py` → `HealthResponseDTO` (static JSON) [E:api/main.py:90] | HealthAuthority (delegated) | **STATIC JSON** — should delegate to a live health authority |
| `/ready` | `api/main.py` → `ReadyResponseDTO` [E:api/main.py:100] | — | fine |
| `/events` | `api/main.py` → Event store read [E:api/main.py:261] | EventReadAuthority | ✅ delegated to store |
| `/replay` | `api/main.py` → replay [E:api/main.py:300] | ReplayAuthority | ✅ delegated |
| `/metrics` | `api/main.py` → Prometheus [E:api/main.py:338] | TelemetrySubsystem | ✅ delegated |

**Key gap (matches earlier WAVE_3A5 finding):** `/health` returns a **static JSON** DTO, not a delegated health authority. This is the exact "HealthService duplicate" risk — the route has a hardcoded health response while a real health authority (if it existed) would be bypassed. Recommendation (informational): `/health` should compute from live runtime state, not return a static object.

---

## 4. Replay Surface

| Module | Actual (evidence) | Instantiated? | Referenced? | Orphan? | Overlapping? |
|---|---|---|---|---|---|
| Kernel replay | `kernel/build_witness.py` [E:kernel/build_witness.py] | YES | YES | NO | canonical witness |
| ReplayRuntime | `runtime/persistent_runtime.py` [E:runtime/persistent_runtime.py] | YES | YES | NO | — |
| ReplayAuthority | `runtime/witness_authority.py` [E:runtime/witness_authority.py] | YES | YES | NO | **overlaps kernel/build_witness** |
| ReplayWorker | `tests/test_replay_harness.py` [E:tests/test_replay_harness.py] | test-only | YES | test | — |
| Replay port | `api/main.py` `/replay` [E:api/main.py:300] | YES | YES | NO | — |
| ContinuousReplayAuthority | — | NO | NO | — | not present |
| ReplayPlanAuthority | — | NO | NO | — | not present |
| Replay certification | `build_witness_hash` in Event model [E:storage/postgres/models.py] | YES (hash) | YES | NO | — |

**Finding:** replay infra is **present and used** (kernel witness + persistent runtime + /replay route + harness). `ContinuousReplayAuthority` / `ReplayPlanAuthority` are **aspirational, not present** — do NOT build them; the existing replay is sufficient for the frozen architecture.

---

## 5. Telemetry Surface

| Subsystem | Actual (evidence) | Emits? | Aggregates? | Exposes? | Duplicated? |
|---|---|---|---|---|---|
| TelemetrySubsystem | `notification/metric_events.py` [E:notification/metric_events.py] | YES (metric events) | partial | — | — |
| MetricsPort | `api/main.py` `/metrics` + `prometheus.yml` [E:api/main.py:338, architecture/infrastructure/prometheus.yml] | — | YES (Prometheus) | YES (/metrics) | — |
| OpenTelemetry | `opentelemetry-instrumentation-fastapi` [E:architecture/infrastructure docs] | YES (instrumentation) | — | — | — |
| Outbox | `notification/outbox_processor.py` [E:notification/outbox_processor.py] | YES (outbox) | — | — | — |
| Tracing | opentelemetry (referenced) | YES | — | — | — |
| Diagnostics | `notification/diagnostics.py` [E:notification/diagnostics.py] | YES | partial | — | — |
| Operational Intelligence | fusion of above (no single module) | — | manual | manual | — |

**Finding:** telemetry is **decentralized but present** (metric events + Prometheus + OTel + outbox + diagnostics). No single "Operational Intelligence" module — it's the fusion of these. That's fine for freeze; the user's "Operational Intelligence" is a *view*, not a module to build.

---

## 6. Connector Surface — does ConnectorAuthority function as the integration manager?

| Component | Actual (evidence) | Role |
|---|---|---|
| ConnectorAuthority (contract) | `capabilities/connector.py` + `connector_interface.py` [E:capabilities/connector*.py] | Abstract connector contract — ALL connectors implement this |
| GitHub connector | `capabilities/github/acquire_repository.py` (connector_type="github") [E:capabilities/github/acquire_repository.py] | Concrete connector |
| OAuth / Email / SMS / Webhook | `notification/providers/*` (twilio, kit) + `ingress/adapters/*` (twilio_webhook, kit_webhook, http) | Provider-level integrations |
| PostHog | referenced in architecture docs (HPP analytics mirror) | external, not a PING connector yet |
| Connector loader | `hermes/runtime/bootstrap_loader.py` `_load_connector` is a **STUB** ("Future: implement connector loading logic") [E:hermes/runtime/bootstrap_loader.py:190] | **DEAD/STUB** |

**Determination:** **YES — ConnectorAuthority already exists as the integration contract** (`capabilities/connector.py` + `connector_interface.py`). All connectors implement it. The *manager* function is **split**:
- `capabilities/connector.py` = the contract (what a connector IS).
- `notification/provider_registry.py` + `provider_runtime.py` = the operational registry (which providers are live, health, routing).

This split is **not a duplicate** (contract vs registry are different layers) but it IS the convergence the user warned about: building a new "IntegrationManager" would **triplicate** an already-present concern. **Do NOT build IntegrationManager** — promote `notification/provider_registry` + `capabilities/connector` as the canonical integration surface, and **finish the stub loader** (`hermes/runtime/bootstrap_loader._load_connector`) instead of creating new infra.

---

## 7. Runtime Consumers

| Consumer | Actual (evidence) | Loaded? | Used? | Dead? | Future? |
|---|---|---|---|---|---|
| CapabilityResolver | `notification/capability_resolver.py` | YES | YES | NO | — |
| EventValidator (FailureAuthority) | `runtime/failure_authority.py` | YES | YES | NO | — |
| WorkflowExecutor (ExecutionAuthority) | `runtime/execution_authority.py` | YES | YES | NO | — |
| DeploymentLoader | `deploy/Dockerfile` + `bootstrap/manifest.yaml` | partial | deploy | NO | — |
| StateMachineExecutor | — | NO | NO | — | **generator output (missing)** |

**Finding:** CapabilityResolver / EventValidator / WorkflowExecutor are **present and used**. `StateMachineExecutor` + `DeploymentLoader` (as runtime consumers) are **missing generator outputs** — consistent with `NEXT_PHASE_PLANNING_REVIEW` (State Machine Generator + Deployment Artifact Generator not built). Do NOT rebuild; build the generators.

---

## 8. Dead Runtime Modules (candidates for future removal)

Criteria: never instantiated + never imported + never reachable from startup.

| Module | Evidence | Verdict |
|---|---|---|
| `hermes/runtime/bootstrap_loader.py._load_connector` | stub ("Future: implement connector loading logic") [E:hermes/runtime/bootstrap_loader.py:190] | **DEAD/STUB** — referenced but never completes; connector loading is a no-op placeholder |
| `knowledge/graph.py` (root) | World-B Hermes leak (prior audit) | NOT dead (referenced) but **mis-owned** — refactor, don't remove |
| `runtime/witness_authority.py` | second witness impl | NOT dead (referenced) but **duplicate** of kernel/build_witness — retire, don't remove |

**No truly 0-consumer modules found.** The closest to "dead" is the **stub connector loader** — a placeholder that does nothing. That is the prime Wave 3B cleanup target (finish it, don't recreate).

---

## 9. Operational Intelligence Surface

| Component | Actual (evidence) | Class |
|---|---|---|
| HealthAuthority | `api/main.py` `/health` (static) | diagnostics → should be observability |
| DriftDetector | — | **not present** (aspirational) |
| RuntimeFingerprint | — | **not present** (aspirational) |
| ExecutiveDashboard | — | **not present** (HPP frontend Patch M is customer-side; PING operator dashboard not built) |
| SystemAuthority | `constitution/authority/constitution_authority.py` | governance |
| IntegrationIntelligence | `notification/provider_registry` + `capabilities/connector` | observability |
| EventOutbox | `notification/outbox_processor.py` | observability (delivery) |
| TelemetrySubsystem | `notification/metric_events` + `/metrics` + prometheus | observability |

**Finding:** operational intelligence is **partially present** (health, outbox, telemetry, integration registry) but **missing the fusion layer** (DriftDetector, RuntimeFingerprint, ExecutiveDashboard). These are *views*, not new infrastructure — they consume the already-present telemetry/health/outbox. Do NOT build new infra; build views over existing signals.

---

## 10. Business Intelligence Boundary (verification)

| Concern | Owner | Read-only for PING? |
|---|---|---|
| PostHog event definitions | **HPP** | PING monitors ingestion health only |
| Marketing funnels | **HPP** | PING does NOT define |
| CRM | **HPP** | PING does NOT own |
| Email automation | HPP defines / PING delivers | PING owns delivery + retry, not content |
| Influencer metrics | **HPP** | PING monitors connector uptime only |
| Campaign attribution | **HPP** | PING does NOT invent |
| Conversion analytics | **HPP** | PING exposes dashboards, doesn't compute |
| Event transport | **PING** | — |
| Queueing | **PING** | — |
| Health | **PING** | — |
| Retry | **PING** | — |
| Delivery | **PING** | — |
| Replay | **PING** | — |
| Diagnostics | **PING** | — |
| Integration lifecycle | **PING** | — |
| Operational dashboards | **PING** | — |

**Verification:** ✅ Consistent with SPRINT4 (HPP owns meaning, PING owns execution+observability) + PING v2 + PING OS Transition. PING may **manage analytics infrastructure** (PostHog ingestion monitoring, dashboards) but treats **business analytics as read-only** — it consumes HPP-defined canonical events, never redefines them. No contradiction with frozen architecture.

---

## Expected Outcome (read-only deliverables)

1. **Runtime dependency graph** — §1 (api/main → bootstrap → authorities → routes → workers).
2. **Authority ownership matrix** — §2 (each conceptual authority → actual module; 2 duplicates flagged).
3. **Route ownership matrix** — §3 (`/health` static JSON = the one real gap).
4. **Startup graph** — §1.
5. **Dead code inventory** — §8 (stub connector loader is the prime candidate).
6. **Duplicate authority inventory** — §2 (ReplayAuthority ×2; Integration-manager split connector-vs-provider).
7. **Operational intelligence inventory** — §9 (present: health/outbox/telemetry/integration; missing: drift/fingerprint/dashboard *views*).
8. **Business intelligence boundary verification** — §10 (✅ consistent, PING read-only on business analytics).
9. **Refactor recommendations (informational only, NO changes):**
   - `/health` should delegate to live runtime state, not return static JSON.
   - Retire `runtime/witness_authority.py`; keep `kernel/build_witness.py` as canonical witness.
   - Promote `notification/provider_registry` + `capabilities/connector` as the canonical integration surface; **finish the stub loader** (`hermes/runtime/bootstrap_loader._load_connector`) — do NOT create IntegrationManager.
   - Build the missing **generators** (StateMachine, DeploymentArtifact) — these produce the absent consumers, not new runtime infra.
   - Build **views** (DriftDetector, RuntimeFingerprint, ExecutiveDashboard) over existing telemetry — not new infrastructure.

**Conclusion:** the frozen architecture is **safe**. The "dead infrastructure" the user sensed is (a) one stub connector loader, (b) one duplicate witness, (c) a static /health response, (d) missing generator outputs (consumers not yet generated). None require new architectural primitives — only wiring, dedup, and the already-planned generators. Wave 3B should **connect + observe**, not **rebuild**.

*Read-only audit. No code changed. Committed as WAVE_3A5_RUNTIME_AUTHORITY_AUDIT.md.*
