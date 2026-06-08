# Pre-Infrastructure Constitutional Freeze Report
**Version:** Pre-Replay Execution  
**Context:** C:\Users\nolan\CRX  
**Classification:** Forensics (Read-Only)

---

## 1. Authority Stability Index

### 1. Authorities That Are Stable
- **Canonicalization:** The recursive object sorting model in `canonical_engine.ts` is simple but stable. The archived `JS.txt` canonicalization is robust and complete.

### 2. Authorities That Are Still Emergent
- **Identity Semantics:** The model for resolving semantic types and wrapping identifiers with domain namespaces is undefined.
- **Replay State Reconstruction:** VM sandboxing and double-execution logic remain in the specification/archive phase.
- **Witness Generation:** Proof verification boundaries are only present in documentation and JS.txt archive code.

### 3. Authorities That Must Never Merge
- **Canonicalization ↔ Hashing/Fingerprinting:** Normalization must remain a separate transform step from generating byte hashes.
- **Fingerprinting ↔ Identity Semantics:** Cryptographic byte hashing must remain independent of how semantic meaning is assigned to objects.
- **Lineage Verification ↔ Replay Execution:** DAG constraints and validation rules must be checked before execution is triggered.

### 4. Authorities That Must Remain Pure
- **Canonicalization (`kernel/canonical/`):** Pure normalization logic.
- **Fingerprinting (`kernel/fingerprint/`):** Pure hashing logic.
- **Identity Semantics (`kernel/identity/`):** Pure semantic assignment.
- **Lineage Validation (`kernel/lineage/`):** Pure DAG structure validation.

### 5. Authorities That Are Transport-Coupled
- **HTTP Routing & Request Orchestration:** [commit_controller.ts](file:///C:/Users/nolan/CRX/runtime/kernel/commit-service/src/api/commit_controller.ts) is coupled to Express.

### 6. Authorities That Are Infra-Coupled
- **Event Storage & Persistence:** [event_log.ts](file:///C:/Users/nolan/CRX/runtime/kernel/commit-service/src/events/event_log.ts) and the persistence layer are coupled to the PostgreSQL `pg` pool.

---

## 2. Extraction Safety Matrix

### 7. Authorities Safe for Extraction:
- **`canonical_fingerprint_service.js` (from JS.txt):** Safe to extract to `constitutional-integration-lab/extracted/` or `kernel/` as it is pure, isolated JavaScript.
- **`formal_invariant_graph_verifier.js` (from JS.txt):** Safe to extract as a pure DAG verifier.

### 8. Authorities NOT Safe for Extraction:
- **`deterministic_replay_harness.js`:** Not safe for immediate extraction because it depends on `plugin_execution_scheduler.js` and execution runtime adapters (`runtime_adapter.js`), which are still unmapped and coupled to external environments.
- **`execution_integrity_auditor.js`:** Not safe because it requires a finalized event schema and execution trace record definition, which are still emergent.

---

## 3. Replay Foundational Gaps & Order of Operations

### 9. Replay Foundational Gaps:
1. **Clock/Randomness Virtualization:** No sandbox for isolation exists in the runtime.
2. **Schema Invariance:** Replay does not track schema version drift or migration mismatches.
3. **No Monotonic Event Counter:** Event sequencing relies entirely on external database insertion timestamps.

### 10. Minimum Safe Order of Operations:
1. **Stabilize Observed Authorities:** Document and freeze the existing behavior of the 12 TypeScript files.
2. **Quarantine Strata:** Move `CascadeProjects/` to quarantine directories to freeze historical inputs.
3. **P0 Authority Extraction:** Copy `canonical_fingerprint_service.js` and `formal_invariant_graph_verifier.js` to a non-runtime extraction area (e.g. `constitutional-integration-lab/extracted/`).
4. **Adapter Boundary Decoupling:** Re-architect `commit-service` to separate SQL persistence and Express routes from identity calculations.
5. **Replay Engine Implementation:** Integrate the VM sandbox and deterministic scheduler.
