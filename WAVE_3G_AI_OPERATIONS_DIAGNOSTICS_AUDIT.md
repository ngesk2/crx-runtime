# WAVE 3G — AI OPERATIONS & DIAGNOSTICS AUDIT (Read-Only)

**Mode:** Read-only audit. No code changes.
**Basis:** PING_V2_CONSTITUTIONAL_OPERATIONAL_PLANE.md (AI Runtime / AI Control), WAVE_3A5_RUNTIME_AUTHORITY_AUDIT.md §9 (AI in operational intelligence), `hermes/runtime.py` (telemetry), PING_OS_TRANSITION_ANALYSIS.md §claims (AIInference/ModelVersion/QueueDepth etc.), WAVE_3E_ORACLE_HOSTING_ARCHITECTURE.md (Ollama/Hermes shared, Oracle-hosted).
**User thesis:** "I'd make AI a first-class operational domain. Track: model, version, latency, tokens, cache hit ratio, embedding count, queue depth, inference failures, hallucination rate (if measured), cost per tenant, cost per workflow, cost per authority. Again: PING observes. HPP decides why."

---

## 1. AI Operations Domain (PING-owned, observational)

Per PING v2 + SPRINT4, PING owns **AI Control** (operational): models/providers/costs/inference/embedding jobs/prompt versions/caches/failures — as *operational metadata*. PING does **NOT** own model weights (Oracle/Ollama) or AI business content (HPP).

```
HPP decides WHY (business AI content, prompt strategy)
   ↓ (HPP defines; PING delivers/observes)
PING observes HOW (model/version/latency/tokens/cost/queue/failures)
   ↓ (PING monitors; Oracle hosts)
Oracle/Ollama owns WEIGHTS (model binaries, GPU)
```

---

## 2. Shared Platform Services (AI)

Per PING v2 + WAVE_3E:
| Service | Hosted by | Managed by | Owned by | Per-tenant? |
|---|---|---|---|---|
| **Hermes Runtime** (agent service) | Oracle | PING | PING (execution only) | NO (shared) |
| **Ollama Runtime** (model server) | Oracle | PING | Oracle/Ollama (weights) | NO (shared, no duplicate models/embeddings) |

**Key:** no tenant runs its own Ollama/Hermes (PING v2). One AI platform, shared. PING monitors; Oracle hosts.

---

## 3. AI Control — What PING Owns (operational metadata)

| Concern | Operational metadata PING owns | NOT owned by PING |
|---|---|---|
| Models | which model loaded, version, availability | model weights (Ollama/Oracle) |
| Providers | provider health/status | provider business relationship (HPP) |
| Costs | inference cost per tenant/workflow/authority | pricing strategy (HPP) |
| Inference | latency, token count, queue depth | inference *result meaning* (HPP) |
| Embedding Jobs | job count, status | embedding *content* (HPP knowledge) |
| Prompt Versions | which prompt version used | prompt *content* (HPP) |
| Caches | warm/cold status, hit ratio | cached *data* (HPP) |
| Failures | inference failures, queue overflow | failure *business impact* (HPP) |

**Boundary:** PING sees the *telemetry* of AI; HPP owns the *meaning* (prompts, model choice rationale, business outcomes).

---

## 4. AI Diagnostics — Observables (PING)

From PING_OS_TRANSITION_ANALYSIS §claims + hermes/runtime telemetry:

| Observable | Source (evidence) | Class |
|---|---|---|
| model | hermes/runtime (ModelVersion) | telemetry |
| version | hermes/runtime (ModelVersion) | telemetry |
| latency | hermes/runtime (InferenceLatency) | telemetry |
| tokens | hermes/runtime (token count) | telemetry |
| cache hit ratio | hermes/runtime (WarmCacheStatus) | diagnostic |
| embedding count | hermes/runtime (embedding jobs) | telemetry |
| queue depth | hermes/runtime (QueueDepth) | operational |
| inference failures | hermes/runtime + failure_authority | diagnostic |
| hallucination rate | (if measured — not present) | diagnostic (aspirational) |
| cost per tenant | PING aggregates (operational) | operational |
| cost per workflow | PING aggregates (operational) | operational |
| cost per authority | PING aggregates (operational) | operational |
| GPU/CPU usage | Oracle monitoring agents → PING | operational |
| memory | hermes/runtime (MemoryUsage) | operational |
| model downloads | hermes/runtime (ModelDownloads) | operational |
| health check | hermes/runtime (HealthCheck) | operational |

**Finding:** most AI diagnostics are **observable today** via hermes/runtime telemetry + PING's metric_events + /metrics. `hallucination rate` is **aspirational** (not measured) — do NOT build a measurement system; surface it only if HPP defines a metric.

---

## 5. Event Inventory (AI)

| Event | Class | Owner |
|---|---|---|
| AIInference | Telemetry | PING |
| AgentExecution | Operational | PING |
| ToolCall | Operational | PING |
| InferenceLatency | Telemetry | PING |
| ModelVersion | Telemetry | PING |
| WarmCacheStatus | Diagnostic | PING |
| GPUUtilization | Operational | PING (from Oracle agents) |
| MemoryUsage | Operational | PING |
| QueueDepth | Operational | PING |
| ModelDownloads | Operational | PING |
| HealthCheck | Diagnostic | PING |

All AI events are **PING-owned telemetry/diagnostic** — none carry business meaning. They flow through the canonical event bus (storage/postgres/models.py) and are projected to operational dashboards (WAVE_3C AI page), NOT to PostHog business panels.

---

## 6. Integration Authority (AI services)

Per PING v2 "Oracle Runtime," PING monitors Ollama via an Integration Authority model:
| Signal | PING observes |
|---|---|
| loaded models | PING monitors (Ollama exposes) |
| GPU/CPU usage | Oracle agents → PING |
| memory | Oracle agents → PING |
| inference latency | hermes/runtime |
| queue | hermes/runtime (QueueDepth) |
| model versions | hermes/runtime (ModelVersion) |

This fits the Integration Authority pattern (WAVE_3A5 §6): every integration exposes health/latency/auth/rate-limits/webhook/retry/volume. Ollama is just another integration PING observes.

---

## 7. Boundary Verification

| Check | Result | Evidence |
|---|---|---|
| PING owns AI ops (observational) | ✅ | PING v2 (AI Control) |
| PING does NOT own model weights | ✅ | Oracle/Ollama owns (WAVE_3E) |
| PING does NOT own AI business content | ✅ | HPP owns prompts/strategy (BI Boundary) |
| Hermes/Ollama shared (no per-tenant) | ✅ | PING v2 (one AI platform) |
| AI events are telemetry (not business) | ✅ | §5 |
| No Oracle publication in AI | ✅ | BI Boundary §9 |
| PING observes, HPP decides why | ✅ | user thesis; SPRINT4 |

---

## 8. What Exists vs Missing

**Exists:** hermes/runtime telemetry (model/version/latency/tokens/queue/memory/downloads/health), metric_events + /metrics, prometheus, Ollama monitoring via Integration Authority, AI page on operational dashboard (WAVE_3C).

**Missing (aspirational, do NOT build):**
- `hallucination rate` measurement — only if HPP defines the metric.
- Dedicated AI-ops dashboard view — build as *view* over existing telemetry (WAVE_3A5 §9), not new infra.

**Duplicate (retire):** none specific to AI; the general witness/runtime/hash dupes (WAVE_3A7) apply.

---

## 9. What NOT to Build (preserve freeze)

| Tempting AI feature | Verdict | Reason |
|---|---|---|
| New AI runtime | ❌ DON'T | Hermes/Ollama exist, shared |
| Model-weight ownership in PING | ❌ DON'T | Oracle/Ollama owns |
| AI business content (prompts/strategy) | ❌ DON'T | HPP owns |
| Hallucination-rate engine | ❌ DON'T (unless HPP defines) | measure only if HPP specifies |
| Per-tenant Ollama | ❌ DON'T | shared platform (PING v2) |

---

## 10. Build Prerequisites (read-only dependency)

AI ops is **already observable**. Remaining work (informational):
1. Surface AI telemetry as a **dashboard view** (WAVE_3C AI page) over existing hermes/runtime + metric_events — not new infra.
2. Ensure Event Generator (WAVE_3B P003) emits AIInference/AgentExecution/ToolCall with correct `producer_id` so they flow to the operational dashboard.
3. Retire general dupes (WAVE_3A7) — no AI-specific rebuild.

No architectural change.

---

## 11. Success Criteria (answered)

| Question | Answer |
|---|---|
| Who owns AI ops? | **PING** (observational) |
| Who owns model weights? | **Oracle/Ollama** |
| Who owns AI business content? | **HPP** (prompts/strategy) |
| Is Hermes/Ollama shared? | **YES** (no per-tenant AI) |
| Are AI events telemetry-only? | **YES** (no business meaning) |
| Is PING read-only on AI business? | **YES** (observes, HPP decides why) |
| Any boundary violation? | **NO** — all checks PASS |

*Read-only audit. No code changed. Committed as WAVE_3G_AI_OPERATIONS_DIAGNOSTICS_AUDIT.md.*
