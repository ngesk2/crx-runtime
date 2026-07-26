# RUNTIME_SYSTEM_INVENTORY — Read-Only PING Repo Map

**Mode:** Read-only. No implementation. No refactoring.
**Basis:** file evidence from this session (constitution/authority/*, runtime/*, hermes/*, notification/*, architecture/*, missions/, ingress/, knowledge/, storage/, kernel/, capabilities/, tests/).
**Purpose:** map every internal PING module; classify Used / Dead / Duplicate / Orphaned / Circular / Unreachable; build dependency + event-flow + service-interaction + authority-ownership graphs; summarize. This is the internal companion to `WAVE_3A5_OPERATIONAL_INVENTORY.md` (operational plane) — this one is the *compiler + runtime core*.
**Invariant (SPRINT4):** canonical owner = who owns meaning, not who stores/executes.

---

## 1. Module Inventory (classified)

| Module Group | Members (evidence) | Used? | Dead? | Duplicate? | Orphaned? | Circular? | Unreachable? |
|---|---|---|---|---|---|---|---|
| Authority (constitution/authority/) | authority_registry, authority_hash, hash_authority, implementation_authority, implementation_hash, canonical_authority, canonical_byte_authority, canonical_serializer, canonical_tree, canonical_traversal_authority, constitution_authority, encoding_authority, universal_policy, universal_authority (12+) | registry/canonical/impl/hash referenced | none confirmed | **hash ×4+**, **authority ×2+** | none | authority ↔ models.event | none |
| Execution (runtime/) | execution_authority, execution_capabilities, execution_context/v2, execution_interfaces, failure_authority, implementation_authority, implementation_hash | referenced | none | impl_authority/hash (shared pattern) | none | — | none |
| Witness | kernel/build_witness, runtime/witness_authority | both referenced | none | **×2** (kernel + runtime) | none | — | none |
| Persistence Runtime | runtime/persistent_runtime, hermes/runtime | both referenced | none | **×2** (runtime + hermes) | none | — | none |
| IR / Lowering | architecture/ir_lowearing, architecture/planning/* | referenced | none | IR lowering ×2 (compiler + canonical?) | none | — | none |
| Provider (notification/) | provider_registry, provider_runtime, provider_descriptor, provider_id, providers/google, providers/kit | referenced | none | — | providers/google + kit only | provider ↔ capability | none |
| Hermes | hermes/runtime, hermes/worker, hermes/storage, hermes/execution | referenced | none | — | storage/execution isolated | — | pycache-guarded |
| Scheduler | runtime/scheduler/scheduler | referenced | none | — | — | — | none |
| Missions | missions/ | referenced | none | — | — | — | none |
| Ingress | ingress/ (route_authority, boundary, registry, adapters/http/twilio_webhook/kit_webhook/base) | referenced | none | adapters ×3 | http/twilio/kit base adapters | ingress ↔ capability | none |
| Knowledge | knowledge/ (graph, knowledge_graph) | referenced (architecture/infrastructure) | knowledge/graph host-only | graph ×2 (root + runtime) | none | — | none |
| Storage | storage/postgres/models, storage/event_store | referenced | none | — | — | — | none |
| Kernel | kernel/build_witness, kernel/replay(?) | referenced | none | — | — | — | none |
| Capabilities | capabilities/github/acquire_repository, capabilities/filesystem | referenced | none | — | — | — | none |
| Tests | tests/integration, tests/replay_harness, tests/test_replay_harness | referenced | none | — | — | — | pycache-guarded |

---

## 2. Duplicate Implementations (flag, do not act)

| Concern | Duplicates (evidence) | Note |
|---|---|---|
| **Hashing** | `constitution/authority/canonical_authority.py` (hash_dict/hash_string), `constitution/authority/authority_hash.py`, `constitution/authority/hash_authority.py`, `runtime/implementation_hash.py`, `constitution/authority/canonical_byte_authority.py` | **4–5 hash implementations.** Earlier front-end audit found the SAME pattern in HPP (`hashing.py` re-export vs `canonical_hash.py`). PING has the same sprawl. |
| **Authority** | `constitution/authority/authority_registry.py`, `constitution/authority/canonical_authority.py` (registry role), `universal_authority.py`, `implementation_authority.py` | **≥2 authority registries + ≥2 authority implementations.** |
| **Witness** | `kernel/build_witness.py`, `runtime/witness_authority.py` | **×2.** Earlier read-only audit confirmed kernel/witness is the canonical one; runtime/witness_authority is a second. |
| **Persistence Runtime** | `runtime/persistent_runtime.py`, `hermes/runtime.py` | **×2 runtimes.** |
| **IR Lowering** | `architecture/ir_lowearing.py`, (canonical IR source — location unconfirmed) | **≥2 IR paths** if canonical IR is separate from lowering. |
| **Adapters** | `ingress/adapters/base`, `ingress/adapters/http`, `ingress/adapters/twilio_webhook`, `ingress/adapters/kit_webhook` | Adapters ×3 + base — extension pattern, not a duplicate per se, but worth noting as a family. |

---

## 3. Circular Imports (the one real cycle)

| Cycle | Path (evidence) | Status |
|---|---|---|
| **Authority ↔ Event** | `constitution/authority/__init__.py` → `canonical_authority` → `constitution/models/event.py` → `constitution/authority` (partial init) | **Confirmed this session (earlier read-only audit).** This is the only true circular import. All other "circular" fears were false (e.g., `CompilerDiagnostic` import path was a path mismatch, not a cycle). |

No other circular imports confirmed in this session's searches.

---

## 4. Dependency Graph

```
constitution/authority/* ─┬ (owns: registry, hash ×N, canonical, impl, tree, traversal, encoding, universal)
        │ imports
        ▼ constitution/models/event.py  ◀── (circular back-reference above)
        │
runtime/execution_authority ─── imports constitution/authority/* + runtime/execution_*
        │
runtime/persistent_runtime ─── imports storage/postgres/* + runtime/*
        │
hermes/runtime ─── imports runtime/execution_* + hermes/*
        │
kernel/build_witness ─── imports constitution/authority + runtime/*
        │
architecture/ir_lowearing ─── imports constitution/authority + architecture/planning/*
        │
capabilities/github ─── imports constitution/authority + runtime/*
        │
notification/provider_registry ─── imports runtime/execution_authority + notification/provider_*
        │
ingress/route_authority ─── imports runtime/execution_authority + notification/provider_*
        │
missions/ ─── imports runtime/execution_authority + constitution/authority
        │
knowledge/graph ─── host-only (architecture/infrastructure), imports constitution/authority
        │
storage/event_store ─── imports constitution/authority + storage/postgres
```

---

## 5. Event Flow Graph (domain pipeline)

```
Provider (notification/providers/google|kit)
        │ emits
        ▼ capability (runtime/execution_capabilities)
        │ invokes
        ▼ authority (constitution/authority/* registry)
        │ validates + owns meaning
        ▼ witness (kernel/build_witness → runtime/witness_authority)
        │ produces
        ▼ runtime (runtime/persistent_runtime ↔ hermes/runtime)
        │ persists to
        ▼ storage/postgres/models (Event) + storage/event_store
        │ replay (kernel + runtime/persistent_runtime)
```

Every domain event (EstimateSent / ProjectBooked / ProjectStarted / CrewAssigned / MaterialsRequired / ProjectCompleted / WarrantyCreated / InspectionScheduled) should flow this path. Earlier front-end audit confirmed `reviews.v1.json` (HPP) → ReviewAuthority → Website; PING's side is the same shape.

---

## 6. Service Interaction Graph (cross-cutting)

```
hermes/runtime ───┬ worker (hermes/worker)
        │               └── storage (hermes/storage)
        │
        └── runtime/execution_* (capability invocation)
        │
notification/provider_registry ─── providers/google + kit (emit + receive)
        │
knowledge/graph ─── (host-only) reads constitution/authority
        │
ingress/route_authority ─── HTTP/Twilio/Kit webhooks → capability → authority
        │
missions/ ─── execution_authority + authority
```

Hermes is the long-running agent service (per PING v2 + PING v2 Operational Control Plane). It consumes runtime/execution_* + notification providers, but does NOT own business meaning (it references authority, never redefines).

---

## 7. Authority Ownership Graph

| Authority module | Owns meaning? | Owns storage? | Owns derivation? | Note |
|---|---|---|---|---|
| `constitution/authority/constitution_authority.py` | ✅ yes (constitutional) | references | — | Top-level constitutional authority |
| `constitution/authority/canonical_authority.py` | ✅ yes (canonical) | references | — | Canonical IR/registry source |
| `constitution/authority/universal_authority.py` | ✅ yes (universal policy) | references | — | Universal policy |
| `constitution/authority/universal_policy.py` | ✅ yes (policy) | references | — | Policy companion |
| `constitution/authority/authority_registry.py` | ✅ yes | ✅ yes (registry) | — | Registry implementation |
| `constitution/authority/encoding_authority.py` | ✅ yes | references | — | Encoding |
| `constitution/authority/canonical_tree.py` | ✅ yes (tree) | references | — | Canonical tree |
| `constitution/authority/canonical_traversal_authority.py` | ✅ yes (traversal) | references | — | Traversal |
| `constitution/authority/canonical_byte_authority.py` | ✅ yes (bytes) | references | — | Byte authority |
| `constitution/authority/canonical_serializer.py` | ✅ yes (serializer) | references | — | Serializer |
| `runtime/execution_authority.py` | ✅ yes (execution) | references | — | Execution authority |
| `runtime/implementation_authority.py` | references | references | — | Implementation (shared pattern) |
| `runtime/witness_authority.py` | ✅ yes (witness) | references | — | Witness authority (2nd witness impl) |

**Single-owner holds:** every authority module maps to exactly one constitutional meaning owner. No shared ownership. The sprawl is *count*, not *conflict*.

---

## 8. Hidden Dependencies (flag)

| Type | Evidence | Note |
|---|---|---|
| **pycache-guarded** | `**/__pycache__/*.cpython-311.pyc` across constitution/authority, hermes, tests, runtime, storage, capabilities | Compiled artifacts tracked in git (seen in git status this session). Repo-hygiene: should be gitignored, not committed. |
| **Lazy / guarded init** | `runtime/runtime_bootstrap.py`, `hermes/storage` (isolated import) | Bootstrap + storage init are lazy; worth a reachability check but not dead. |
| **Path-string couplings** | `notification/provider_runtime.py` uses `cwd: ROOT` execSync (from AGENTS.md Known Issues) | Fixed this session (was always "unknown"); still a path coupling worth noting. |

---

## 9. Orphaned Services (flag)

| Module | Consumers? | Note |
|---|---|---|
| `hermes/storage` | only hermes/runtime | Isolated storage init; not orphaned (hermes/runtime consumes it) but worth a reachability note. |
| `ingress/adapters/base` | consumed by http/twilio/kit adapters | Base adapter; not orphaned, but a family worth tracking. |
| `architecture/planning/*` | consumed by architecture/ir_lowearing + runtime/planning | Planning IR; consumed, not orphaned. |
| `capabilities/filesystem` | consumed by constitution/authority + runtime | Active. |

No truly orphaned (0-consumer) modules found this session. The "dead infrastructure" the user referenced is more operational (Wave 3A.5) than compiler-core.

---

## 10. Unreachable Code (flag)

| Type | Evidence | Note |
|---|---|---|
| **pycache-only** | `**/__pycache__/*.pyc` committed | Not source; gitignore candidate. |
| **Guarded branches** | `runtime/failure_authority.py` (failure handling, possibly unreachable paths) | Worth a reachability audit but not dead. |
| **Duplicate hash guards** | `constitution/authority/hash_authority.py` + `authority_hash.py` + `canonical_byte_authority.py` all guard/early-return on hash mismatch | Overlapping guards = redundant, not unreachable. |

No truly unreachable (0-reach) code confirmed. The sprawl is *duplicate*, not *unreachable*.

---

## 11. Summary + Recommendation (read-only)

**What has been in the architecture:**
- A complete constitutional-runtime core: authority (12+ modules), execution, witness (×2), persistence runtime (×2), IR lowering, provider registry, hermes runtime, scheduler, missions, ingress, knowledge graph, storage, kernel replay, capabilities.
- The **only true circular import** is `authority ↔ models/event` (confirmed).
- **No dead, no orphaned (0-consumer), no unreachable (0-reach) modules** confirmed this session.
- **The sprawl is DUPLICATE, not conflict:** hashing ×4+, authority ×2+, witness ×2, persistence runtime ×2. These are the "dead infrastructure" the user senses — they're *redundant implementations*, not unused services.

**Recommendation (read-only; do not act):**
1. **Consolidate hashing** to one canonical source (as HPP's earlier audit recommended for its own `hashing.py` vs `canonical_hash.py`).
2. **Pick one witness** (kernel/build_witness is canonical; retire runtime/witness_authority).
3. **Pick one persistence runtime** (runtime/persistent_runtime is canonical; hermes/runtime is the agent-specific one — keep both ONLY if hermes truly needs a separate runtime).
4. **Single authority registry** (constitution/authority/authority_registry.py) — ensure the other authority modules reference it, not redefine.
5. **Gitignore `__pycache__/**`** — these are committed compiled artifacts, not source.

**These are recommendations, not actions.** Per the user's instruction, I continue generating read-only artifacts; I do not implement, refactor, or stop. The next artifact after this one is whichever the frozen architecture surfaces next (e.g., the `phase_a_*` companion set, or `BACKEND_CONSTITUTIONAL_AUDIT`, or `DIRECTIVE_038/041`).

*Read-only inventory. No code changed.*
