# WAVE 4A — Read-Only Business Intelligence Refactor Audit

**Mode:** STRICTLY READ ONLY. No code changes. No new architecture. No implementation.
**Scope:** `constitutional-runtime` (PING) — the home of the BI layer.
**Assumption:** The frozen pipeline (Events → Facts → Signals → Health → Prioritization → CEO Dashboard → Projections) is authoritative.

**Strategic question answered:** *Did the BI layer become the center of gravity, or are there islands of business logic scattered through the codebase?*

**Answer:** The BI layer **is** the center of gravity for *business* logic. There are **no scattered business-logic islands** — no module independently computes revenue/pipeline/marketing/lead health. The only remaining islands are **operational** telemetry (provider health, infra metrics, AI telemetry) that legitimately belong to runtime operations but should *feed* BI signals rather than be replaced. Two concrete refactor opportunities exist (§3, §8). Purity is high (≈95%).

---

## 1. Duplicate Health Logic

| Location | Purpose | Overlap with Health Models | Recommendation |
|---|---|---|---|
| `api/main.py:91` `/health` | Liveness probe (postgres + nats) | Re-derives `OperationsHealth` deps independently | **CONSUME BI** — surface `OperationsHealth` instead of re-checking postgres/nats inline |
| `api/main.py:114` `/ready` | Readiness probe (postgres + nats) | Same independent dep check | **KEEP** (k8s probe needs to be fast/standalone) but mirror `OperationsHealth` deps |
| `api/main.py:376` `/ops` | Operational state (event count, last seq, deps) | Partially duplicates `OperationsHealth` | **CONSUME BI** — call `compute_health_models` + `OperationsHealth`, don't re-derive counts/deps |
| `notification/provider_runtime.py:24` `ProviderMetrics` + `availability` | Provider success-rate / availability | Conceptual overlap with `OperationsHealth`/`CapacityHealth` | **KEEP** (operational provider telemetry) but **EXPOSE as signal source** (success_rate → OperationsHealth driver) |
| `hermes/hermes_runtime.py` AI telemetry (GPUUtil, QueueDepth, InferenceLatency, HealthCheck) | AI-platform health | Conceptual overlap with future `CapacityHealth`/`AIHealth` | **KEEP** (operational AI telemetry) but **EXPOSE as signal source** |
| `analytics/business_projections.py` `OperationsHealth`/`CapacityHealth` | The actual business health models | — | **SINGLE SOURCE — KEEP** |

**Conclusion:** One genuine duplication (`/health` + `/ops` re-derive operational health). The provider/hermes telemetry is operational, not business — it should feed signals, not be deleted.

---

## 2. Duplicate Metrics

| Location | Maintains | Should consume |
|---|---|---|
| `runtime/observability.py` (Prometheus `Counter`/`Histogram`/`Gauge`: events_total, http_requests, replay_latency, api_latency, **events_per_second**, active_replays, db_connections) | Raw infra counters/latencies | **KEEP** (Prometheus scraping needs raw infra metrics) BUT BI `worker_utilization` signal currently *proxies* event arrival rate by re-scanning events — it should **CONSUME** `observability.events_per_second` instead |
| `notification/provider_runtime.py:30` `ProviderMetrics` (total/success/failed, avg latency) | Provider counters | **KEEP** operational; expose success_rate as a `CapacityHealth`/`OperationsHealth` signal |
| `analytics/business_projections.py` `compute_business_facts` | **Business** facts (lead_count, pipeline_value, cash, ratings, delivery_rate) | **SINGLE SOURCE — KEEP** |

**Conclusion:** No duplicate *business* metrics. Infra counters are legitimate and should act as signal sources for BI, not be merged into BI.

---

## 3. Duplicate Dashboards

| Endpoint | Computes | Verdict |
|---|---|---|
| `/health` (`api/main.py:91`) | Static-ish liveness | **KEEP** (probe) — should mirror `OperationsHealth` |
| `/ready` (`api/main.py:114`) | Readiness | **KEEP** (probe) |
| `/ops` (`api/main.py:376`) | event count, last seq, deps, metrics sample | **CONSUME BI** — should be a projection of `OperationsHealth`, not an independent summary |
| `/metrics` (`api/main.py:367`) | Prometheus exposition of `observability` | **KEEP** — operational telemetry scrape endpoint, not a BI dashboard |
| `/business` (`api/main.py:418`) | facts + signals + **health_models** | ✅ **Already a projection of Health Models** |
| `/ceo` (`api/main.py:475`) | health + **priority** (ranked problems) | ✅ **Already a projection of Health Models + Prioritization** |
| `/replay`, `/events` | Event store read/replay | **KEEP** — operational, not BI |

**Conclusion:** `/business` and `/ceo` are already correct BI projections. `/ops` is the one dashboard that should become a projection of `OperationsHealth`.

---

## 4. Duplicate Prioritization

- **Executive prioritization:** `analytics/business_projections.py` `prioritize_health` — ranks non-healthy models by `HEALTH_PRIORITY` (Revenue → Pipeline → Cash → Capacity → Customer → Reputation → Marketing). **SINGLE SOURCE.**
- **Other "priority" hits** (`provider_registry.py` provider-selection priority, `scheduler.py`/`constitutional_scheduler.py` task-priority, `work_claim_manager.py`) are **runtime task/provider selection**, NOT executive/business prioritization. No overlap with `prioritize_health`.
- **No** separate alert-ranker / incident-trier / retry-ranker exists.

**Conclusion:** No duplicate executive prioritization. ✅

---

## 5. Duplicate Forecasting

- **Only** `analytics/business_projections.py` contains trend/forecast logic: `_windowed_rate` (moving 7-day window), `_direction` (trend), `_simple_forecast` (linear projection), `_confidence` (sample-size-based). 26 in-code hits; zero elsewhere in application code.
- No other module computes rolling averages, moving windows, growth estimates, or predictions.

**Conclusion:** Forecasts are **SINGLE SOURCE** in the BI layer. ✅

---

## 6. Duplicate Recommendations

- **Only** Health Models emit recommendations (each model's `recommendation` field, e.g. *Marketing Health Yellow → increase email frequency; open rate stable, lead velocity falling*). 22 in-code hits; zero elsewhere in application code.
- No separate "remediation"/"suggested-action"/"optimization" generator exists. (Doc mentions of "recommendations" are design docs, not code.)

**Conclusion:** Recommendations are **SINGLE SOURCE** in Health Models. ✅

---

## 7. Event Consumers — Inventory

| Module | Consumes Event | Facts? | Signals? | Health? | Projection? | Notification? | Automation? |
|---|---|---|---|---|---|---|---|
| `api/main.py` `/events` (POST) | Ingests (writes store) | — | — | — | — | — | — |
| `analytics/business_projections.py` (`/business`, `/ceo`) | Reads store | ✅ `compute_business_facts` | ✅ `compute_business_signals` | ✅ `compute_health_models` | ✅ JSON projection | — | — |
| `integrations/posthog.py` | Delivers (raw event JSON) | ❌ delivers raw | ❌ | ❌ | ⚠️ raw (should be BI) | — | — |
| `notification/*` (Kit/Twilio providers) | Runtime delivery events | — | — | — | — | ✅ sends | — |
| `hermes/*` runtime | Execution events | — | — | — | — | — | ✅ executes |
| HPP `automation/event-consumer.ts` (separate repo) | Domain Events | — | — | — | — | — | ✅ workflow trigger |

**Goal check:** "No consumer should skip architectural layers without justification."
- BI consumer (`/business`, `/ceo`) traverses Facts → Signals → Health correctly. ✅
- PostHog mirror **skips** the layers (delivers raw events). Refactor target (§8).
- Notification/Hermes consume events for *runtime execution* — legitimate, not BI duplication.

---

## 8. Projection Audit

| Projection | Consumes | Verdict |
|---|---|---|
| PostHog (`integrations/posthog.py`) | **Raw canonical events** (`event_type`, `payload`) | ⚠️ **REFACTOR** — per BI Boundary, PostHog is a *projection of BI*, not raw repository state. Should deliver **Business Facts + Health Models** (HPP-owned definitions), not raw event JSON. Currently violates "never raw repository state." |
| `/business`, `/ceo` | Health Models + Facts | ✅ Correct projections |
| `/metrics` | `observability` (Prometheus) | ✅ Operational projection (not business) |
| Notifications | Provider adapters | ✅ Runtime execution, not BI |
| APIs (`/events`, `/replay`) | Event store | ✅ Operational |

**Conclusion:** One projection violation — PostHog should consume BI facts/health, not raw events.

---

## 9. Dead Operational Intelligence

- **No dead/unused BI modules.** The BI layer is newly built and is actively consumed by `/business`, `/ceo`, and `tests/test_business_intelligence.py` (9 passing).
- `DriftDetector` / `RuntimeFingerprint` / `ExecutiveDashboard` appear in docs as *planned, not built* — not dead, not orphaned.
- `/ops` vs `/ceo`: `/ops` (infra ops) and `/ceo` (business) serve different audiences; not redundant. Recommendation: keep `/ops` but have it **CONSUME** `OperationsHealth` (see §3) rather than re-derive.
- `observability.py` metrics are all wired to `/metrics` Prometheus scrape — **KEEP**, no orphans.

**Classification:** Nothing to DELETE. One MERGE candidate (`/ops` → consume OperationsHealth). One refactor (`/ops` + PostHog).

---

## 10. Architectural Purity Score

| Layer | Single Source? | Notes |
|---|---|---|
| **Business Facts** | ✅ YES (≈95%) | `compute_business_facts` is the only computer; minor overlap in operational counts (`provider_runtime` success_rate, `observability` event counts) |
| **Business Signals** | ✅ YES (100%) | `compute_business_signals` is the only signal computer |
| **Health Models** | ✅ YES (≈90%) | `compute_health_models` is the only health computer; `/health`+`/ops` re-derive operational health inline |
| **Recommendations** | ✅ YES (100%) | Only Health Models emit recommendations |
| **Forecasts** | ✅ YES (100%) | Only BI `_simple_forecast` |
| **Prioritization** | ✅ YES (100%) | Only `prioritize_health` |

**Overall BI Purity: ≈95%**

The 5% drift is entirely in **operational** modules (`/health`, `/ops`, `provider_runtime`, `observability`, `hermes_runtime`) that compute their own health/telemetry. These are *legitimate runtime concerns* and should **feed BI signals** (provider success_rate → OperationsHealth driver; observability `events_per_second` → `worker_utilization` signal; hermes telemetry → CapacityHealth signal) — not be deleted or merged into BI.

---

## Strategic Verdict

The BI layer **did** become the center of gravity. Business logic is centralized; there are **no scattered business-health islands**. The remaining work is small and surgical:

1. **`/ops` should CONSUME `OperationsHealth`** (stop re-deriving postgres/nats/counts).
2. **PostHog mirror should deliver BI Facts/Health Models, not raw events** (close the one projection-boundary violation).
3. **Operational telemetry modules should EXPOSE signals to BI** (provider success_rate, observability throughput, hermes AI metrics) — feed, don't duplicate.

Per the audit brief: *"If the answer comes back with very little duplication, you've reached the point where adding features will have a much higher ROI than further architectural cleanup."* That point has been reached. The platform layer is complete; further value lies in **features on top of the BI layer** (predictive health, decision support, business outcomes) — not architectural reorganization.
