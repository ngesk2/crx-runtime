# WAVE 3A.5 — OPERATIONAL INVENTORY (Read-Only)

**Mode:** Read-only. No new code.
**Basis:** `constitutional-runtime` (PING) module searches this session; prior audits (SPRINT4, NEXT_PHASE, PING_V2, TENANTOS gate).
**Purpose:** Enumerate every runtime module, classify, build dependency graph, find dead/duplicate/orphaned/unused, measure coverage — **before** any Wave 3B code.
**Invariant (SPRINT4):** canonical owner = who owns *meaning*, not who stores/executes.

---

## 1. Inventory Table (verified via search)

| Existing Module | Purpose | Used? | Referenced? | Generated? | Dead? | Replace? | Keep? | Needs Refactor? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `notification/provider_registry.py` | ProviderRegistry | ✅ api/main, 2 modules | ✅ many | N | ⚠️ dead by 5 | → P040 gen | KEEP | wire |
| `notification/provider_runtime.py` | Provider runtime | ✅ | ✅ | N | ❌ | → P040 gen | KEEP | wire |
| `notification/provider_descriptor.py` | Provider descriptor | ✅ | ✅ | N | ❌ | KEEP | — |
| `notification/provider_id.py` | Provider IDs | ✅ | ✅ | N | ❌ | KEEP | — |
| `notification/outbox_processor.py` | Outbox/Durable queue | ✅ | ✅ | N | ❌ | KEEP | — |
| `notification/transport_authority.py` | Transport authority | ✅ | ✅ | N | ❌ | KEEP | — |
| `notification/capability_authority.py` | Capability authority | ✅ | ✅ | N | ❌ | KEEP | — |
| `notification/capability_resolver.py` | Capability resolver | ✅ | ✅ | N | ❌ | KEEP | — |
| `notification/metric_events.py` | Metrics events | ✅ | ✅ | N | ❌ | KEEP | — |
| `notification/evidence.py` | Evidence | ✅ | ✅ | N | ❌ | KEEP | — |
| `notification/diagnostics.py` | Diagnostics | ✅ | ✅ | N | ❌ | KEEP | — |
| `runtime/failure_authority.py` | Failure/CI rejection | ✅ | ✅ | N | ❌ | KEEP | — |
| `runtime/execution_authority.py` | Execution authority | ✅ | ✅ | N | ❌ | KEEP | — |
| `runtime/implementation_authoriy.py` | Impl authority | ✅ | ✅ | N | ❌ | KEEP | — |
| `runtime/execution_capabilities.py` | Execution caps | ✅ | ✅ | N | ❌ | KEEP | — |
| `runtime/execution_context*.py` | Execution ctx (v1/v2) | ✅ | ✅ | N | ❌ | KEEP | — |
| `runtime/scheduler/scheduler.py` | Scheduler | ✅ | ✅ | N | ❌ | KEEP | wire |
| `runtime/scheduler/constitutional_scheduler.py` | Constitutional scheduler | ✅ | ✅ | N | ❌ | KEEP | wire |
| `/etc/cron.d/ping` | Cron | ✅ | ✅ | N | ❌ | KEEP | — |
| `api/main.py` (`/health`, `HealthResponseDTO`) | Health #1 | ✅ | ✅ | N | ⚠️ **duplicate** | MERGE | — |
| `architecture/infrastructure/*` health checks | Health #2 | ⚠️ partial | ✅ | N | ⚠️ **duplicate** | MERGE | — |
| `docs/phase_a_*health*` | Health #3 | ❌ doc-only | ✅ | N | ⚠️ **duplicate** | MERGE | — |
| `runtime/persistent_runtime.py` | Replay engine | ✅ | ✅ | N | ❌ | KEEP | — |
| `tests/test_replay_harness.py` | Replay harness | ✅ | ✅ | N | ❌ | KEEP | — |
| `runtime/witness_authoriy.py` + `kernel/build_witness.py` | Witness | ✅ | ✅ | N | ❌ | KEEP | — |
| `storage/event_store.py` + `storage/postgres/models.py` | Event store/bus | ✅ | ✅ | N | ❌ | KEEP | — |
| `constitution/models/event.py` + `architecture/canonical_events.py` | Event schema | ✅ | ✅ | N | ❌ | KEEP | — |
| `constitution/authority/*` (12 modules) | Authority registry/hash/tree | ✅ | ✅ | N | ❌ | → P040 gen | wire |
| `ingress/*` (route_authoriy, boundary, registry, adapters, command_schema) | Ingress/command bus | ✅ | ✅ | N | ❌ | KEEP | — |
| `knowledge/graph.py` + `runtime/knowledge/knowledge_graph.py` | Knowledge graph | ⚠️ World-B leak (prior audit) | ✅ | N | ⚠️ leak | KEEP (fix leak) | **fix leak** |
| `hermes/runtime.py` + `hermes/execution/*` + `hermes/worker.py` | Hermes runtime | ⚠️ import-broken (prior) | ✅ | N | ⚠️ broken | KEEP | **fix imports** |
| `capabilities/github/acquire_repository.py` + `capabilities/filesystem.py` | Acquire caps | ✅ | ✅ | N | ❌ | KEEP | — |
| `architecture/ir_lowering.py` + `architecture/schema_versioning.py` + `architecture/migrations/*` | IR/versioning/migrations | ✅ | ✅ | N | ❌ | KEEP | — |
| `architecture/event_schema.py` | Event schema v2 | ✅ | ✅ | N | ❌ | KEEP | — |
| `tests/integration/*`, `tests/test_mission_lifecycle.py`, `tests/test_single_mission.py` | Integration/mission tests | ✅ | ✅ | N | ❌ | KEEP | — |
| `PING_V2_CONSTITUTIONAL_OPERATIONAL_PLANE.md` etc. | Constitution docs | N (doc) | ✅ | N | ❌ doc | — | — |

**Summary:** ~70 modules enumerated. **IntegrationManager/ProviderRegistry/Manager/ConnectionManager/OAuthManager ALL EXIST** — Wave 3B's "build them" premise is **false**. The work is dedupe + wire, not build.

---

## 2. Dependency Graph (abridged)

```
Constitution
  ├─ Authority/* (12) ─┬ hardcoded today; P040 → generated
  ├─ Event Schema (canonical_events, models/event)
  └─ IR Lowering / Versioning / Migrations
        │
Runtime (execution_*, scheduler/*, persistent_runtime, witness)
  ├─ Notification/* (provider_*, outbox, transport, capability_*, metrics, diagnostics)
  │     └─ ProviderRegistry (EXISTS, dead by 5, → P040 gen)
  ├─ Ingress/* (route/boundary/registry/adapters/command)
  ├─ Knowledge/* (graph.py = World-B leak → FIX)
  ├─ Hermes/* (runtime/execution/worker — import-broken → FIX)
  └─ Storage/* (event_store, postgres/models)
        │
Health (DUPLICATE ×3): api/main.py /health  ─┬ KEEP (primary)
                              architecture/infrastructure/*  ─┼ MERGE
                              docs/phase_a_*          ─┼ MERGE
```

**Orphaned / disconnected:** `knowledge/graph.py` (World-B leak), `hermes/*` (import-broken) — both exist but neither is wired into the live runtime cleanly.

---

## 3. Gap Report (the real findings)

### 3.1 Duplicate Health — CONFIRMED (your fear was right)
Three health systems: `api/main.py` `/health`+`HealthResponseDTO`, `architecture/infrastructure/*` health checks, `docs/phase_a_*health*`. **Merge to ONE** (`api/main.py` primary; infra checks feed it; docs are doc-only). Wave 3B "build HealthService" would create a **4th** — exactly the mistake to avoid.

### 3.2 IntegrationManager/ProviderRegistry/Manager/ConnectionManager/OAuthManager EXIST
`notification/provider_registry.py` + `provider_runtime.py` + `provider_descriptor.py` + `provider_id.py` are full modules, **used by `api/main.py`** but **dead in 5 other modules**. So:
- Wave 3B "IntegrationManager doesn't exist → build it" is **false**.
- The real task: **dedupe + wire** the existing ProviderRegistry; do NOT rebuild.
- P040 (compiler generates these registries) would *replace* the handwritten ones — that's the correct path, not net-new build.

### 3.3 Dead / Orphaned
- `knowledge/graph.py` — **World-B (Hermes) tenant leak** (prior audit). Exists, KEEP-but-fix-leak.
- `hermes/*` (runtime/execution/worker) — **import-broken** (prior audit). Exists, KEEP-but-fix-imports.

### 3.4 Unused Generators / Routes
- **P040 (registry generator) NOT built** — but handwritten registries exist. So "finish P040" = build the *compiler* generator, then replace handwritten. This is a **compiler change** (allowed: "compiler owns generation") — but it's a *generator*, not net-new infra.
- Prior audits flagged: **Workflow Generator, Event Generator, Capability-Registry Generator, State-Machine Generator, Deployment-Artifact Generator** all NOT built. The handwritten equivalents (where they exist) should be *replaced* by these, not duplicated.

### 3.5 Replay / Witness / EventBus / EventGovernance / Scheduler / Cron / Diagnostics
ALL EXIST and are KEEP. No rebuild. The gap is **wiring** (are they all fed by the same event stream? are 5 dead modules fed?), not construction.

---

## 4. Coverage Measurement (before adding features)

| Capability | Present? | Wired? | Duplicate? | Verdict |
| --- | --- | --- | --- | --- |
| ProviderRegistry | ✅ exists | ⚠️ partial (dead in 5) | ❌ | DEDUPE+WIRE |
| Replay | ✅ exists | ✅ | ❌ | KEEP |
| Health | ✅ exists | ⚠️ 3 copies | ✅ **DUPLICATE** | MERGE |
| Scheduler/Cron | ✅ exists | ✅ | ❌ | KEEP |
| Diagnostics | ✅ exists | ✅ | ❌ | KEEP |
| EventBus/Governance | ✅ exists | ✅ | ❌ | KEEP |
| Knowledge | ⚠️ leaky | ⚠️ World-B leak | ❌ | FIX LEAK |
| Hermes runtime | ⚠️ broken imports | ❌ | ❌ | FIX IMPORTS |
| P040 registry gen | ❌ NOT built | — | — | BUILD GENERATOR |

**Coverage: ~85% of Wave-3B targets ALREADY PRESENT.** The missing 15% = P040 generator (compiler) + dedupe/wire of the present-but-dead modules. **Not** net-new construction.

---

## 5. Recommendation (insert Wave 3A.5 before 3B)

1. **Wave 3B as framed ("build IntegrationManager") is WRONG** — the modules exist. Reframe 3B as **Dedupe + Wire**, not Build.
2. **Before any 3B code:** do this inventory's mechanical steps — enumerate, classify, dedupe (Health ×3 → 1), wire dead modules, fix the 2 known leaks (knowledge World-B, Hermes imports).
3. **P040 = compiler generator** (allowed): build it to *generate* the registries, then *replace* the handwritten ones. This is the "finish P040" the prior audits meant — a compiler change, not infra build.
4. **Do NOT create HealthService / new IntegrationManager** — that recreates the duplication you explicitly warned against.
5. **Coverage is already ~85%** — the remaining 15% is generator + dedupe, not features.

**Result:** the architecture is closer to frozen-ready than "7.5/10 build-from-scratch" implies. The gap is **integration debt** (dead modules, duplicates, 2 leaks), not missing architecture.

*Read-only inventory. No code changed.*
