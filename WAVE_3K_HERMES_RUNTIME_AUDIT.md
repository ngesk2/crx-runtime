# WAVE 3K — HERMES RUNTIME AUDIT (Read-Only)

**Mode:** Read-only audit. No code changes.
**Basis:** `hermes/runtime.py` (telemetry), `hermes/worker.py`, `hermes/execution.py`, `hermes/storage.py`, `hermes/runtime/bootstrap_loader.py` (stub), PING_V2_CONSTITUTIONAL_OPERATIONAL_PLANE.md (Hermes = platform service; PING starts, HPP never starts), WAVE_3G_AI_OPERATIONS_DIAGNOSTICS_AUDIT.md (AI telemetry), WAVE_3A5_RUNTIME_AUTHORITY_AUDIT.md §8 (stub connector loader).
**Role:** Hermes is the **long-running agent platform service** — Oracle-hosted, PING-managed, shared by all tenants. It is operational infrastructure, not a business authority.

---

## 1. Hermes Definition (platform service)

Per PING v2 + user's "Hermes Integration":
- Hermes is a **platform service**, not an app feature.
- **Oracle hosts**, **PING manages**, **shared by all tenants** (no per-tenant Hermes).
- **HPP never starts Hermes; PING does.**
- One Hermes + one Ollama = one AI platform (no duplicated models/embeddings).

```
Oracle (host)
   ↓
Hermes Runtime (PING-managed, shared)
   ↓ consumes
runtime/execution_* + notification/provider_*
   ↓ references (never redefines)
constitution/authority/*
```

---

## 2. Module Inventory

| Module | Role (evidence) | Status |
|---|---|---|
| `hermes/runtime.py` | Hermes runtime + telemetry (ModelVersion, GPUUtil, QueueDepth, InferenceLatency, WarmCacheStatus, MemoryUsage, ModelDownloads, HealthCheck) | present |
| `hermes/worker.py` | Agent worker (process) | present |
| `hermes/execution.py` | Agent execution | present |
| `hermes/storage.py` | Agent storage (isolated import) | present |
| `hermes/runtime/bootstrap_loader.py` | Loads capabilities/authorities/connectors from manifest | present; **`_load_connector` is STUB** [WAVE_3A5 §8] |

**Finding:** Hermes modules are **present and used**. The only defect is the **stub connector loader** (`_load_connector` = "Future: implement connector loading logic") — finish it, don't rebuild (WAVE_3A7 R7).

---

## 3. Wiring (who starts Hermes)

Per PING v2: "HPP should never start Hermes. PING does."
- PING (operational control plane) starts the shared Hermes service on Oracle.
- Hermes consumes `runtime/execution_*` (capability invocation) + `notification/provider_*` (delivery).
- Hermes **references** `constitution/authority/*` (meaning) but **never redefines** it (HPP owns meaning).

This matches SPRINT4: PING owns execution; HPP owns meaning. Hermes is PING's execution agent.

---

## 4. Shared Platform (no duplication)

| Concern | Model | Evidence |
|---|---|---|
| Hermes instances | **ONE shared** (all tenants) | PING v2 (no per-tenant Hermes) |
| Ollama instances | **ONE shared** (all tenants) | PING v2 (no per-tenant Ollama) |
| Models | **ONE set** (no duplicate models/embeddings) | PING v2 (one AI platform) |

**Finding:** the shared-platform model is correct. Building a per-tenant Hermes/Ollama would violate PING v2 ("no duplicated models/embeddings"). The existing single-instance design is right.

---

## 5. Observability (PING monitors)

Per user's "Hermes Integration," PING monitors:
| Signal | Source (evidence) |
|---|---|
| model availability | hermes/runtime (ModelVersion) |
| agent status | hermes/worker (process state) |
| tool executions | hermes/execution (ToolCall event) |
| queued tasks | hermes/runtime (QueueDepth) |
| failures | hermes/runtime + failure_authority |
| memory usage | hermes/runtime (MemoryUsage) |
| response latency | hermes/runtime (InferenceLatency) |

All observable today via hermes telemetry + PING's metric_events + /metrics. No new monitoring infra needed.

---

## 6. Event Inventory (Hermes)

| Event | Class | Owner |
|---|---|---|
| AgentExecution | Operational | PING |
| ToolCall | Operational | PING |
| AIInference | Telemetry | PING |
| InferenceLatency | Telemetry | PING |
| ModelVersion | Telemetry | PING |
| WarmCacheStatus | Diagnostic | PING |
| QueueDepth | Operational | PING |
| HealthCheck | Diagnostic | PING |

All Hermes events are **PING-owned telemetry/operational** — none carry business meaning. They flow to the operational dashboard (WAVE_3C AI page), not PostHog business panels.

---

## 7. Boundary Verification

| Check | Result | Evidence |
|---|---|---|
| Hermes is operational (PING-managed) | ✅ | PING v2 |
| HPP never starts Hermes | ✅ | PING v2 |
| Hermes references, never redefines authority | ✅ | SPRINT4 (HPP owns meaning) |
| One shared instance (no per-tenant) | ✅ | PING v2 |
| Hermes events are telemetry (not business) | ✅ | §6 |
| No Oracle publication | ✅ | BI Boundary §9 |
| PING observes, HPP decides why | ✅ | user thesis; 3G |

---

## 8. What Exists vs Missing

**Exists:** hermes/runtime.py + worker + execution + storage; telemetry; shared-platform model; PING-started wiring.

**Missing (informational, do NOT build):**
- Finish stub connector loader (`_load_connector`) — WAVE_3A7 R7.
- Dedicated Hermes observability dashboard view — build as *view* over existing telemetry (WAVE_3A5 §9), not new infra.

**Duplicate (retire):** none Hermes-specific; general dupes (WAVE_3A7) apply if hermes/runtime overlaps persistent_runtime.

---

## 9. What NOT to Build (preserve freeze)

| Tempting Hermes feature | Verdict | Reason |
|---|---|---|
| Per-tenant Hermes | ❌ DON'T | shared platform (PING v2) |
| New agent runtime | ❌ DON'T | hermes/* exists |
| Business agent logic in PING | ❌ DON'T | HPP owns prompts/strategy |
| Hermes-owned authority | ❌ DON'T | references only (SPRINT4) |
| New monitoring infra | ❌ DON'T | telemetry + metric_events exist |

---

## 10. Build Prerequisites (read-only dependency)

Hermes is **operational today**. Remaining work (informational):
1. Finish stub connector loader (WAVE_3A7 R7) — don't recreate.
2. Surface Hermes telemetry as dashboard *view* (WAVE_3C AI page) over existing signals.
3. Event Generator (WAVE_3B P003) emits AgentExecution/ToolCall/AIInference with correct `producer_id`.

No architectural change.

---

## 11. Success Criteria (answered)

| Question | Answer |
|---|---|
| Who manages Hermes? | **PING** (operational) |
| Who hosts Hermes? | **Oracle** |
| Who starts Hermes? | **PING** (HPP never starts) |
| Is Hermes shared? | **YES** (one instance, all tenants) |
| Does Hermes own meaning? | **NO** (references authority only) |
| Are Hermes events telemetry? | **YES** (no business meaning) |
| Any boundary violation? | **NO** — all checks PASS |

*Read-only audit. No code changed. Committed as WAVE_3K_HERMES_RUNTIME_AUDIT.md.*
