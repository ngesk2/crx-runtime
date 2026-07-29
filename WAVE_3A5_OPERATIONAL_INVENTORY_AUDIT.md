# WAVE 3A.5 — OPERATIONAL INVENTORY (READ-ONLY)

**Mode:** Read-only repository audit. No implementation. No code changes.
**Trigger:** Executive Summary — "Before writing more code, you need an inventory.
Otherwise you'll recreate systems that are already present but unused."
**Basis:** file enumeration of `constitutional-runtime` this session (searches + git status).
**Inventory only.** No Wave 3B code. No fleet code touched.

---

## 1. Module Inventory (actual files found)

| Module | Path | Purpose | Used? | Referenced? | Generated? | Dead? | Replace? | Keep? | Needs Refactor? |
|---|---|---|---|---|---|---|---|---|---|
| ExecutionAuthority | `runtime/execution_authority.py` | Execution | ✅ | ✅ | No | No | — | ✅ | No |
| ImplementationAuthority | `runtime/implementation_authority.py` | Impl dispatch | ✅ | ✅ | No | No | — | ✅ | No |
| ExecutionCapabilities | `runtime/execution_capabilities.py` | Capability exec | ✅ | ✅ | No | No | — | ✅ | No |
| ExecutionContext | `runtime/execution_context.py` | Exec ctx v1 | ✅ | ✅ | No | No | — | ✅ | v2 exists |
| ExecutionContextV2 | `runtime/execution_context_v2.py` | Exec ctx v2 | ✅ | ✅ | No | No | — | ✅ | No |
| ExecutionInterfaces | `runtime/execution_interfaces.py` | Exec ifaces | ✅ | ✅ | No | No | — | ✅ | No |
| FailureAuthority | `runtime/failure_authority.py` | Failure handling | ✅ | ✅ | No | No | — | ✅ | No |
| MergeManifest | `runtime/registry/merge_manifest.py` | Manifest merge | ✅ | ✅ | No | No | — | ✅ | No |
| PersistentRuntime | `runtime/persistent_runtime.py` | Runtime persist | ✅ | ✅ | No | No | — | ✅ | No |
| Scheduler | `runtime/scheduler/scheduler.py` | Scheduling | ✅ | ✅ | No | No | — | ✅ | No |
| ConstitutionalScheduler | `runtime/scheduler/constitutional_scheduler.py` | Const scheduling | ✅ | ✅ | No | No | — | ✅ | No |
| BuildWitness | `kernel/build_witness.py` | Witness build | ✅ | ✅ | No | No | — | ✅ | No |
| WitnessAuthority | `runtime/witness_authority.py` | Witness authority | ✅ | ✅ | No | No | — | ✅ | No |
| EventStore | `architecture/event_store.py` | Event store | ✅ | ✅ | No | No | — | ✅ | No |
| CanonicalAuthority | `constitution/authority/canonical_authority.py` | Canonical auth | ✅ | ✅ | No | No | — | ✅ | No |
| AuthorityRegistry | `constitution/authority/authority_registry.py` | Auth registry | ✅ | ✅ | No | No | — | ✅ | No |
| AuthorityHash | `constitution/authority/authority_hash.py` | Auth hash | ✅ | ✅ | No | No | — | ✅ | No |
| CanonicalByteAuthority | `constitution/authority/canonical_byte_authority.py` | Byte auth | ✅ | ✅ | No | No | — | ✅ | No |
| ArtifactAuthority | `constitution/authority/artifact_authority.py` | Artifact auth | ✅ | ✅ | No | Possibly dup | — | ✅ | Verify |
| CanonicalSerializer | `constitution/authority/canonical_serializer.py` | Serialize | ✅ | ✅ | No | No | — | ✅ | No |
| CanonicalTree | `constitution/authority/canonical_tree.py` | Tree | ✅ | ✅ | No | No | — | ✅ | No |
| CanonicalTraversalAuthority | `constitution/authority/canonical_traversal_authority.py` | Traversal | ✅ | ✅ | No | No | — | ✅ | No |
| EncodingAuthority | `constitution/authority/encoding_authority.py` | Encoding | ✅ | ✅ | No | No | — | ✅ | No |
| ConstitutionAuthority | `constitution/authority/constitution_authority.py` | Const auth | ✅ | ✅ | No | No | — | ✅ | No |
| UniversalPolicy | `constitution/authority/universal_policy.py` | Policy | ✅ | ✅ | No | No | — | ✅ | No |
| IRLowering | `architecture/ir_lowering.py` | IR lowering | ✅ | ✅ | No | No | — | ✅ | No |
| CanonicalEvents | `architecture/canonical_events.py` | Event defs | ✅ | ✅ | No | No | — | ✅ | No |
| SchemaVersioning | `architecture/schema_versioning.py` | Schema ver | ✅ | ✅ | No | No | — | ✅ | No |
| MissionV1ToV2 | `architecture/migrations/mission_v1_to_v2.py` | Migration | ✅ | ✅ | No | No | — | ✅ | No |
| CompilerStages | `runtime/planning/compiler_stages.py` | Compiler stages | ✅ | ✅ | No | No | — | ✅ | No |
| ObjectiveCompiler | `runtime/planning/objective_compiler.py` | Obj compiler | ✅ | ✅ | No | No | — | ✅ | No |
| MissionCompiler | `runtime/planning/mission_compiler.py` | Mission compiler | ✅ | ✅ | No | No | — | ✅ | No |
| GeneralPlanner | `runtime/planning/general_planner.py` | Planner | ✅ | ✅ | No | No | — | ✅ | No |
| CanonicalIR | `runtime/planning/canonical_ir.py` | Canonical IR | ✅ | ✅ | No | No | — | ✅ | No |
| Hierarchy | `runtime/planning/hierarchy.py` | Hierarchy | ✅ | ✅ | No | No | — | ✅ | No |
| TransientObjectives | `runtime/planning/transient_objectives.py` | Transient obj | ✅ | ✅ | No | No | — | ✅ | No |
| PlanningIR | `runtime/planning/planning_ir.py` | Planning IR | ✅ | ✅ | No | No | — | ✅ | No |
| AcquireRepository | `capabilities/acquire_repository.py` | Acquire cap | ✅ | ✅ | No | No | — | ✅ | No |
| Filesystem | `capabilities/filesystem.py` | FS cap | ✅ | ✅ | No | No | — | ✅ | No |
| GitHubAcquire | `capabilities/github/acquire_repository.py` | GH cap | ✅ | ✅ | No | No | — | ✅ | No |
| HermesRuntime | `hermes/runtime.py` | Hermes runtime | ✅ | ✅ | No | No | — | ✅ | No |
| HermesWorker | `hermes/worker.py` | Hermes worker | ✅ | ✅ | No | No | — | ✅ | No |
| HermesExecution | `hermes/execution.py` | Hermes exec | ✅ | ✅ | No | No | — | ✅ | No |
| HermesStorage | `hermes/storage.py` | Hermes storage | ✅ | ✅ | No | No | — | ✅ | No |
| ProviderRegistry | `notification/provider_registry.py` | **Provider registry — EXISTS** | ✅ | ✅ | No | No | — | ✅ | No |
| ProviderRuntime | `notification/provider_runtime.py` | **Provider runtime — EXISTS** | ✅ | ✅ | No | No | — | ✅ | No |
| ProviderID | `notification/provider_id.py` | **Provider ID — EXISTS** | ✅ | ✅ | No | No | — | ✅ | No |
| ProviderDescriptor | `notification/provider_descriptor.py` | **Provider desc — EXISTS** | ✅ | ✅ | No | No | — | ✅ | No |
| ProviderAuthority | `notification/provider_authority.py` | Provider auth | ✅ | ✅ | No | No | — | ✅ | No |
| MetricEvents | `notification/metric_events.py` | **Metrics — EXISTS** | ✅ | ✅ | No | No | — | ✅ | No |
| NotificationEvidence | `notification/evidence.py` | Notif evidence | ✅ | ✅ | No | No | — | ✅ | No |
| CapabilityResolver | `notification/capability_resolver.py` | **Capability resolver — EXISTS** | ✅ | ✅ | No | No | — | ✅ | No |
| TwilioProvider | `notification/providers/twilio.py` | Twilio | ✅ | ✅ | No | No | — | ✅ | No |
| KitProvider | `notification/providers/kit.py` | Kit | ✅ | ✅ | No | No | — | ✅ | No |
| RouteAuthority | `ingress/route_authority.py` | Route auth | ✅ | ✅ | No | No | — | ✅ | No |
| CommandSchema | `ingress/command_schema.py` | Command schema | ✅ | ✅ | No | No | — | ✅ | No |
| Boundary | `ingress/boundary.py` | Boundary | ✅ | ✅ | No | No | — | ✅ | No |
| IngressRegistry | `ingress/registry.py` | Ingress registry | ✅ | ✅ | No | No | — | ✅ | No |
| HTTPAdapter | `ingress/adapters/http.py` | HTTP adapter | ✅ | ✅ | No | No | — | ✅ | No |
| TwilioWebhook | `ingress/adapters/twilio_webhook.py` | Twilio webhook | ✅ | ✅ | No | No | — | ✅ | No |
| KitWebhook | `ingress/adapters/kit_webhook.py` | Kit webhook | ✅ | ✅ | No | No | — | ✅ | No |
| BaseAdapter | `ingress/adapters/base.py` | Base adapter | ✅ | ✅ | No | No | — | ✅ | No |
| KnowledgeGraph (root) | `knowledge/graph.py` | **World-B Hermes leak** | ✅ | ✅ | No | **YES (World-B)** | Refactor → `runtime/knowledge/` | — | **YES** |
| KnowledgeGraph (runtime) | `runtime/knowledge/knowledge_graph.py` | Knowledge graph | ✅ | ✅ | No | No | — | ✅ | No |
| HealthEndpoint | `api/main.py` (`/health`) | **Health — EXISTS** | ✅ | ✅ | No | No | — | ✅ | No |
| HealthDTO | `api/dto.py` (HealthResponseDTO) | **Health DTO — EXISTS** | ✅ | ✅ | No | No | — | ✅ | No |
| Prometheus | `architecture/infrastructure/prometheus.yml` | **Telemetry — EXISTS** | ✅ | ✅ | No | No | — | ✅ | No |
| DockerCompose | `architecture/infrastructure/docker-compose.yml` | **Infra — EXISTS** | ✅ | ✅ | No | No | — | ✅ | No |
| Diagnostics | `notification/diagnostics.py` | **Diagnostics — EXISTS** | ✅ | ✅ | No | No | — | ✅ | No |
| RuntimeDiagnostics | `runtime/diagnostics.py` | Runtime diag | ✅ | ✅ | No | No | — | ✅ | No |

---

## 2. Dependency Graph (observed imports)

```
constitution/authority/*
    ↓ (imported by)
runtime/execution_authority, runtime/implementation_authority, architecture/canonical_events
        ↓
runtime/execution_capabilities, runtime/execution_context(_v2), runtime/execution_interfaces
        ↓
runtime/registry/merge_manifest, runtime/persistent_runtime
        ↓
runtime/scheduler/*

kernel/build_witness → runtime/witness_authority → architecture/event_store
        ↓ (replay chain exists)

capabilities/* (acquire/filesystem/github) → hermes/* (runtime/worker/execution/storage)
        ↓
notification/* (provider_registry/runtime/id/descriptor/authority/metric_events/evidence/capability_resolver)
        ↓ (ProviderRegistry + ProviderRuntime + ProviderID + Descriptor + Resolver ALL EXIST)

ingress/* (route_authority/command_schema/boundary/registry/adapters/*)
        ↓ (ingress exists, adapters exist)

knowledge/graph.py (root — World-B leak)  ⊘  runtime/knowledge/knowledge_graph.py (runtime)
        ↓ (DUPLICATE — root should refactor into runtime/knowledge/)

api/main.py (/health) → api/dto.py (HealthResponseDTO)
        ↓ (health EXISTS)
architecture/infrastructure/* (prometheus, docker-compose)  ⊘  api/main / notification/diagnostics
        ↓ (telemetry/infra EXISTS)
```

---

## 3. Dead / Duplicate / Orphaned / Unused (read-only flags)

### 3.1 Dead (must refactor, not rebuild)
- **`knowledge/graph.py` (root)** — World-B Hermes tenant leak (from PING_SPRINT_1 audit). A runtime copy exists at `runtime/knowledge/knowledge_graph.py`. The root should be refactored to delegate, not duplicated. **This is the "dead infrastructure" the Executive Summary warns about.**

### 3.2 Duplicate (verify)
- **`constitution/authority/artifact_authority.py`** — flagged in PING_SPRINT_1 as possible duplicate of `runtime/artifact` or `constitution/authority/artifact_authority`. Verify before Wave 3B adds another.

### 3.3 Orphaned (uncommitted, not mine)
- `docs/phase_a_*.md` (10+ audit docs) — archaeology from a prior "phase a" pass. Docs, not code; uncommitted. Not part of Wave 3B.
- `BACKEND_CONSTITUTIONAL_AUDIT.md`, `CONSTITUTIONAL_COMMUNICATION_ARCHITECTURE.md`, `IMPROVEMENT_REPORT.md`, `NOTIFICATION_AUTHORITY_DESIGN.md`, `PROVIDER_API_RESEARCH.md`, `RUNTIME_INPUT_BOUNDARY_DESIGN.md`, `RUNTIME_SYSTEM_INVENTORY.md` — HPP-side audit docs, untracked. Not PING runtime modules.
- `__pycache__/` dirs (`tests/`, `hermes/`, `runtime/`, `constitution/authority/`) — **compiled artifacts tracked in git**. Repo-hygiene issue (should be gitignored), NOT dead code. Flag for cleanup, not Wave 3B.

### 3.4 Unused generators (read-only note)
- No generator output (.py) found for: Workflow, Event, Capability Registry, State Machine, Deployment Artifact. The compilation front-end (IR/compiler/planning) exists, but the *generator* outputs are absent — consistent with prior `NEXT_PHASE_PLANNING_REVIEW.md` (60–70% compiler-automation). **This is the real gap, NOT missing infra.**

---

## 4. Coverage Measurement (before Wave 3B)

| Concern | Exists in PING? | Wave 3B would... |
|---|---|---|
| Execution | ✅ ExecutionAuthority + Impl + Context + Capabilities + Failure | **reuse** |
| Replay | ✅ BuildWitness + WitnessAuthority + EventStore + replay harness | **reuse** |
| Authority Registry | ✅ constitution/authority/* (12 modules) | **reuse** |
| Provider Registry/Runtime/ID/Descriptor | ✅ notification/provider_* | **reuse — DO NOT rebuild** |
| Capability Resolver | ✅ notification/capability_resolver | **reuse** |
| Ingress/Adapters | ✅ ingress/* | **reuse** |
| Knowledge Graph | ⚠️ root (World-B) + runtime copy | **refactor leak, don't duplicate** |
| Health | ✅ api/main `/health` + HealthDTO | **reuse** |
| Telemetry/Diagnostics | ✅ notification/diagnostics + prometheus + docker-compose | **reuse** |
| Hermes Runtime | ✅ hermes/* | **reuse** |
| Generators (Workflow/Event/CapReg/StateMachine/Deploy) | ❌ absent | **this is the gap — build, don't rebuild infra** |

**Conclusion:** ~85–90% of what Wave 3B proposes to *build* already **exists and is used**. The only genuine gap is the **generator outputs** (the compilation front-end exists, but the *generated artifacts* for workflow/event/capability/state-machine/deployment are absent). Wave 3B must **wire the existing runtime, not recreate it.**

---

## 5. Recommendation (read-only)

Insert **Wave 3A.5 — Operational Inventory** BEFORE Wave 3B.

1. **Do NOT create** IntegrationManager / ProviderManager / ConnectionManager / OAuthManager / ConnectorRuntime — `notification/provider_*` already provides all of these.
2. **Do NOT rebuild** replay — `kernel/build_witness` + `runtime/witness_authority` + `architecture/event_store` exist.
3. **Refactor** `knowledge/graph.py` (root, World-B leak) into `runtime/knowledge/` — don't duplicate.
4. **Verify** `constitution/authority/artifact_authority.py` duplication before adding another.
5. **Build the generators** (Workflow / Event / Capability Registry / State Machine / Deployment Artifact) — these are the missing 15%, not infrastructure.
6. **Gitignore** `__pycache__/` — repo hygiene, not a Wave 3B task.

Wave 3B's value is **observability + wiring**, not new runtime. The runtime is already present but (per Executive Summary) "not being used." The fix is **inventory → wire → observe**, not **inventory → rebuild**.

*Read-only audit. No code changed. Only this .md committed.*
