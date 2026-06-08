# Replay-Critical Authority Map Report
**Version:** Pre-Replay Execution  
**Context:** C:\Users\nolan\CRX  
**Classification:** Forensics (Read-Only)

---

## 1. Replay-Critical Authority Classifications

The table below classifies every discovered P0 authority:

| Authority Name | Source Location | Coupling Type | Replay Safety Status |
|---|---|---|---|
| **Canonicalization** | `engines/canonical_engine.ts` | **PURE** | **REPLAY-SAFE** (Deterministic, no dependencies) |
| **Fingerprint (CRX)** | `engines/identity_engine.ts` | **IMPURE** (Tightly coupled to `canonicalize`) | **REPLAY-DANGEROUS** (Lacks domain separation) |
| **Fingerprint (JS.txt)** | `JS.txt#canonical_fingerprint_service.js` | **PURE** | **REPLAY-SAFE** (Domain-separated, WeakSet checks) |
| **Lineage Validation (CRX)**| `validation/dag_validator.ts` | **PURE** | **REPLAY-DANGEROUS** (Only checks immediate parent cyclic link) |
| **Lineage Validation (JS.txt)**| `JS.txt#formal_invariant_graph_verifier.js` | **PURE** | **REPLAY-SAFE** (Global DFS cycle check, edge constraints) |
| **Replay Reconstruction**| `JS.txt#deterministic_replay_harness.js` | **INFRA-COUPLED** (Virtual machine adapter dependecy) | **REPLAY-SAFE** (Enforces double-run matching) |
| **Witness Determinism** | `JS.txt#merkle_anchor_replay_verifier.js` | **PURE** | **REPLAY-SAFE** (Opaque verification, no side effects) |
| **Event Log Persistence** | `events/event_log.ts` | **INFRA-COUPLED** (Tightly bound to Postgres `pg` pool) | **REPLAY-DANGEROUS** (Relies on external db timing) |
| **Commit Controller** | `api/commit_controller.ts` | **TRANSPORT-COUPLED** (Bound to Express `Request`/`Response`) | **REPLAY-DANGEROUS** (Cannot run offline or in CI tests) |

---

## 2. Forensic Analysis of Coupling

1. **Purity Separation Gaps:**
   - Active database calls (`db.ts`, `event_log.ts`) are mixed directly into execution paths, preventing them from running in offline or local tests.
   - Controllers (`commit_controller.ts`) directly process request streams, calculate object hashes, and trigger validation checks, which prevents the logical kernel from being imported independently of the Express web server.
2. **Replay Safety Analysis:**
   - The lack of domain-separated fingerprinting in `identity_engine.ts` allows hash collisions if identical structures are used for different purposes (e.g. an artifact body vs. a lineage validation record).
   - The naive check in `dag_validator.ts` fails to verify the entire DAG structure for deep loops (e.g., A -> B -> C -> A), allowing corrupt cycles to be committed.
