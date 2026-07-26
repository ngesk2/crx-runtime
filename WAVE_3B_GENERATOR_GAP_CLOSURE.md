# WAVE 3B — GENERATOR GAP CLOSURE PLAN (Read-Only)

**Mode:** Read-only planning. No code changes. No implementation. No architectural drift.
**Basis:** `GENERATION_MANIFEST.yaml` (HPP, built 3da1eaf), `NEXT_PHASE_PLANNING_REVIEW.md` (5 missing generators), `WAVE_3A5_OPERATIONAL_INVENTORY.md` + `WAVE_3A5_RUNTIME_AUTHORITY_AUDIT.md` (infra already present), `BUSINESS_INTELLIGENCE_BOUNDARY.md` (Event Generator gap), `snapshot-v1.json` (13 aggregates).
**Core finding (all prior audits agree):** ~85–90% of Wave 3B targets **already exist as runtime infra**. The missing 15% is the **compiler→runtime bridge** (generators), NOT new infrastructure.
**Invariant (SPRINT4):** canonical owner = who owns *meaning* (HPP/compiler), not who executes (PING).

---

## 1. The Bridge Problem

```
HPP Constitution
    ↓ (compiler)
GENERATION_MANIFEST.yaml  ✅ EXISTS  [E:website/src/constitution/GENERATION_MANIFEST.yaml, 3da1eaf]
    ↓
IR snapshot (13 aggregates)  ✅ EXISTS  [E:website/src/constitution/ir/snapshot-v1.json]
    ↓
??  GENERATORS  ??   ← THE GAP (5 missing)
    ↓
Generated Runtime Artifacts  ← what PING consumes
    ↓
PING Runtime  ✅ EXISTS (execution/notification/storage/observability)
```

The compiler front-end is built. The runtime consumers exist. The **generators that connect them are missing**. This is the only true gap.

---

## 2. Generator Inventory (what exists vs missing)

| Generator | Exists? | Evidence | Produces | Consumed by |
|---|---|---|---|---|
| **Generation Manifest** | ✅ BUILT | `GENERATION_MANIFEST.yaml` (3da1eaf) | 13-aggregate IR spec | all downstream generators |
| **Workflow Generator** | ❌ MISSING | NEXT_PHASE §"5 missing" | Workflow graph from IR | PING runtime executor |
| **Event Generator** | ❌ MISSING | NEXT_PHASE; BI Boundary §5 (4 events unmapped) | Canonical→analytics event projection | PING delivery → PostHog |
| **Capability Registry Generator** | ❌ MISSING | NEXT_PHASE; WAVE_3A5 §2 (handwritten registries exist) | `capability.v1` registry artifact | PING capability_resolver |
| **State Machine Generator** | ❌ MISSING | NEXT_PHASE; WAVE_3A5 §7 (StateMachineExecutor absent) | State machine per aggregate | PING execution_authority |
| **Deployment Artifact Generator** | ❌ MISSING | NEXT_PHASE; WAVE_3A5 §2 (DeploymentRegistry partial) | Terraform/OCI/Docker/Helm/Flyway | PING deployment registry |

**Note:** handwritten equivalents of the *registries* already exist (`notification/provider_registry.py`, `constitution/authority/authority_registry.py`). The generators should **replace** these, not add parallel ones.

---

## 3. What NOT to Build (preserve frozen architecture)

From WAVE_3A5 ×2 + BUSINESS_INTELLIGENCE_BOUNDARY, these **already exist** — do NOT recreate:

| Tempting Wave 3B build | Already exists | Action |
|---|---|---|
| IntegrationManager | `capabilities/connector.py` + `notification/provider_registry.py` | **PROMOTE, don't build** |
| HealthService (4th) | `api/main.py` `/health` + `architecture/infrastructure/*` | **MERGE, don't build** |
| New runtime | `runtime/persistent_runtime.py` + `hermes/runtime.py` | **WIRE, don't build** |
| Replay engine | `kernel/build_witness.py` + `runtime/witness_authority.py` | **RETIRE duplicate, don't build** |
| Analytics engine | PostHog (mirror) + `notification/metric_events.py` | **DELIVER, don't build** |
| PostHog event defs | HPP owns (BI Boundary §2) | **NEVER build in PING** |

Building any of these would **violate the freeze** (SPRINT4 single-owner + TENANTOS gate "Architecture FROZEN").

---

## 4. Deterministic Build Order (read-only sequence)

```
P001  Generation Manifest          ✅ DONE (3da1eaf)   → unblocks all
   ↓
P002  Capability Registry Generator  (replaces handwritten authority_registry/provider_registry)
   ↓  consumed by: PING capability_resolver, IntegrationAuthority
P003  Event Generator               (closes 4 business-event projections: EstimateSent/ProjectBooked/WarrantyCreated/InspectionScheduled)
   ↓  consumed by: PING delivery → PostHog
P004  State Machine Generator       (produces per-aggregate state machines)
   ↓  consumed by: PING execution_authority (StateMachineExecutor)
P005  Workflow Generator            (produces workflow graph from IR)
   ↓  consumed by: PING runtime executor
P006  Deployment Artifact Generator (Terraform/OCI/Docker/Helm/Flyway)
   ↓  consumed by: PING deployment registry
```

**Order rationale:** Capability Registry + Event first (they close the duplicate-registry + analytics-projection gaps with least risk). State Machine + Workflow next (they produce the missing runtime consumers). Deployment Artifact last (it's infra-delivery, not runtime-critical). This matches NEXT_PHASE's stated priority order.

---

## 5. Boundary Preservation (per generator)

| Generator | Respects single-owner? | Notes |
|---|---|---|
| Capability Registry | ✅ | Generates *registry artifact* from HPP IR; PING reads, never defines |
| Event | ✅ | Generates *projection* of HPP-defined events; PING delivers, HPP owns meaning |
| State Machine | ✅ | Generates *execution graph* from HPP IR; PING executes, HPP defines |
| Workflow | ✅ | Generates *workflow DAG* from HPP IR; PING runs, HPP owns |
| Deployment Artifact | ✅ | Generates *infra descriptor*; Oracle hosts, PING registers |

**No generator creates business meaning in PING.** Every generator consumes HPP IR and emits PING-consumable artifacts. This is the SPRINT4 boundary, preserved.

---

## 6. What Closes vs What Does NOT

**Closes (generators):**
- Handwritten registry duplication (P002 generates canonical registry; retire handwritten).
- 4 unmapped business events (P003 generates projections).
- Missing StateMachineExecutor / WorkflowExecutor consumers (P004/P005 generate them).
- Partial DeploymentRegistry (P006 generates artifacts).

**Does NOT close (separate, non-generator work — informational only):**
- `/health` static JSON → should delegate (WAVE_3A5 §3). Operational quality, not generator.
- Stub connector loader (`hermes/runtime/bootstrap_loader._load_connector`) → finish stub, don't rebuild (WAVE_3A5 §8).
- DriftDetector / RuntimeFingerprint / ExecutiveDashboard → *views* over existing telemetry, not generators (WAVE_3A5 §9).
- `runtime/witness_authority.py` duplicate → retire in favor of `kernel/build_witness.py` (WAVE_3A5 §2).

---

## 7. Verification (read-only criteria)

| Criterion | How verified (no code) |
|---|---|
| No new business authority in PING | Generators emit PING-consumable artifacts only; meaning stays in HPP IR |
| No duplicate registries after P002 | Handwritten `authority_registry`/`provider_registry` retired; single generated source |
| Canonical events authoritative | Event generator emits *projections* (BI Boundary §2), not new sources |
| Freeze preserved | TENANTOS gate "Architecture FROZEN" remains valid; generators are compiler-owned (HPP), not PING infra |
| No architectural drift | Build order is deterministic (P001→P006); each consumes prior output |

---

## 8. Recommendations (documentation only — NO implementation)

1. **Treat the 5 generators as the sole Wave 3B scope.** Everything else (integration/health/replay/analytics) already exists — wire, don't build.
2. **P002 (Capability Registry) first** — it retires the most duplication (handwritten authority + provider registries).
3. **P003 (Event) second** — it closes the BI Boundary's 4 missing projections and is low-risk.
4. **Do NOT create IntegrationManager / HealthService / new runtimes** — they exist; promote/wire/merge.
5. **Keep Oracle as host only** — Deployment Artifact Generator emits descriptors; Oracle never publishes business state.
6. **Generators live in HPP compiler** (Constitutional OS owns generation); PING only consumes generated artifacts. This is the SPRINT4 split, unchanged.

---

## Success Criteria (answered)

| Question | Answer |
|---|---|
| What is the real Wave 3B gap? | **The 5 generators** (compiler→runtime bridge), not infrastructure |
| Does infra already exist? | **YES** (~85–90%); WAVE_3A5 proved it |
| What must be built? | Generation Manifest (done) + 5 generators (P002–P006) |
| What must NOT be built? | IntegrationManager, HealthService, new runtimes, replay engine, analytics engine, PostHog defs |
| Is the freeze preserved? | **YES** — generators are HPP compiler-owned; PING consumes |
| Build order? | P001(done) → P002 → P003 → P004 → P005 → P006 (deterministic) |

*Read-only plan. No code changed. Committed as WAVE_3B_GENERATOR_GAP_CLOSURE.md.*
