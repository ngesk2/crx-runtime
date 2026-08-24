# WAVE 3A.7 — DEAD / DUPLICATE / ORPHAN CONSOLIDATION & REFACTOR RECOMMENDATIONS (Read-Only)

**Mode:** Read-only consolidation. **Refactor recommendations are INFORMATIONAL ONLY — no changes made.**
**Basis:** RUNTIME_SYSTEM_INVENTORY.md §2, WAVE_3A5_OPERATIONAL_INVENTORY_AUDIT.md §3, WAVE_3A5_RUNTIME_AUTHORITY_AUDIT.md §2/§3/§8/§9, CONSTITUTIONAL_FREEZE_VERIFICATION.md §4.
**Purpose:** satisfy WAVE_3A.5 Expected Outcome (dead code inventory, duplicate authority inventory, refactor recommendations) in one consolidated, per-file list.

---

## 1. Duplicate Authority Inventory (consolidated)

| Concern | Duplicates (evidence) | Canonical (keep) | Retire / merge |
|---|---|---|---|
| **Hashing** | `constitution/authority/canonical_authority.py` (hash_dict/hash_string) + `authority_hash.py` + `hash_authority.py` + `runtime/implementation_hash.py` + `canonical_byte_authority.py` (×4–5) | `canonical_authority.py` hash funcs | merge others into canonical; delete standalone hash modules |
| **Witness/Replay** | `kernel/build_witness.py` + `runtime/witness_authority.py` (×2) | `kernel/build_witness.py` | retire `runtime/witness_authority.py` |
| **Persistence Runtime** | `runtime/persistent_runtime.py` + `hermes/runtime.py` (×2) | `runtime/persistent_runtime.py` | keep `hermes/runtime.py` ONLY if agent-specific need is documented; else merge |
| **Authority Registry** | `constitution/authority/authority_registry.py` + `canonical_authority.py` (registry role) | `authority_registry.py` | `canonical_authority.py` should *reference*, not redefine |
| **Integration-manager** | `capabilities/connector.py` (contract) + `notification/provider_registry.py` (registry) | both (different layers) | promote both; **do NOT build IntegrationManager** |
| **Artifact authority** | `constitution/authority/artifact_authority.py` + `runtime/artifact` (verify) | TBD after verify | retire duplicate after check |

---

## 2. Dead / Stub Inventory (consolidated)

| Module | Evidence | Status | Recommendation (info only) |
|---|---|---|---|
| `hermes/runtime/bootstrap_loader._load_connector` | stub: "Future: implement connector loading logic" [WAVE_3A5 §8] | **DEAD/STUB** | finish the loader (implement connector loading from manifest); do NOT create new loader |
| `__pycache__/*.pyc` (committed) | git status shows tracked .pyc | not source | gitignore; not a code change, just repo hygiene |

**No truly 0-consumer (orphaned) modules confirmed.** The only "dead" code is the stub connector loader. The "dead infrastructure" the user sensed = duplicates + 1 stub + 1 static response, not unused services.

---

## 3. Orphan Inventory (consolidated)

| Module | Consumers? | Verdict |
|---|---|---|
| `knowledge/graph.py` (root) | referenced (World-B Hermes leak) | NOT orphan — **mis-owned** (refactor, don't remove) |
| `runtime/witness_authority.py` | referenced (2nd witness) | NOT orphan — **duplicate** (retire) |
| `hermes/storage` | consumed by hermes/runtime | NOT orphan |
| `ingress/adapters/base` | consumed by http/twilio/kit | NOT orphan |

**Result: 0 orphaned (0-consumer) modules.** All modules are reachable from startup or a known consumer.

---

## 4. Per-File Refactor Recommendations (INFORMATIONAL ONLY — no changes)

| # | File(s) | Recommendation | Type |
|---|---|---|---|
| R1 | `constitution/authority/authority_hash.py`, `hash_authority.py`, `canonical_byte_authority.py`, `runtime/implementation_hash.py` | Merge hash logic into `canonical_authority.py`; delete standalones | Dedupe |
| R2 | `runtime/witness_authority.py` | Retire; `kernel/build_witness.py` is canonical witness | Dedupe |
| R3 | `hermes/runtime.py` | Document why agent-specific runtime is needed; else merge into `persistent_runtime` | Dedupe/keep |
| R4 | `constitution/authority/canonical_authority.py` | Make it *reference* `authority_registry.py` instead of redefining registry role | Dedupe |
| R5 | `capabilities/connector.py` + `notification/provider_registry.py` | Promote as canonical integration surface; **no IntegrationManager** | Promote |
| R6 | `api/main.py` `/health` | Delegate to live runtime (persistent_runtime + provider_registry health) instead of static `HealthResponseDTO` | Quality |
| R7 | `hermes/runtime/bootstrap_loader.py` `_load_connector` | Implement connector loading from manifest (finish stub) | Finish stub |
| R8 | `knowledge/graph.py` (root) | Refactor World-B leak: move logic to `runtime/knowledge/knowledge_graph.py`; root becomes thin re-export or removed | Fix leak |
| R9 | `constitution/authority/artifact_authority.py` | Verify vs `runtime/artifact`; retire duplicate | Dedupe (after verify) |
| R10 | `notification/metric_events.py` + `api/main.py` `/metrics` + `provider_registry.py` | Build DriftDetector / RuntimeFingerprint / ExecutiveDashboard as *views* over these (no new infra) | View (not infra) |

---

## 5. What These Recommendations Are NOT

- ❌ Not implementation tasks (read-only audit).
- ❌ Not architectural changes (freeze preserved; all are dedupe/finish/stub/quality).
- ❌ Not new authorities (R10 builds *views*, not infra).
- ❌ Not boundary violations (every recommendation keeps single-owner invariant).

---

## 6. Success Criteria (answered)

| Question | Answer |
|---|---|
| Dead code inventory produced? | **YES** — §2 (stub connector loader is the only true dead code) |
| Duplicate authority inventory produced? | **YES** — §1 (hash×4, witness×2, runtime×2, authority×2, integration split) |
| Orphan inventory produced? | **YES** — §3 (0 orphaned modules) |
| Refactor recommendations produced? | **YES** — §4 (R1–R10, informational only) |
| Any recommendation violates freeze? | **NO** — all are dedupe/finish/stub/quality; no new architecture |
| Can these be executed without drift? | **YES** — they retire/merge, never add; single-owner preserved |

*Read-only consolidation. No code changed. Committed as WAVE_3A7_DEAD_DUPLICATE_ORPHAN_CONSOLIDATION.md.*
