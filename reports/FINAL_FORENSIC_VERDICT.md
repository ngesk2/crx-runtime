# Final Forensic Verdict
**Version:** Pre-Replay Execution  
**Classification:** Forensics (Read-Only)

---

## 1. Forensic Verdict

1. **Which authorities are truly reusable?**
   - `JS.txt#canonical_fingerprint_service.js` and `JS.txt#formal_invariant_graph_verifier.js` are fully reusable. They are pure, self-contained, and lack external dependencies.
2. **Which authorities are merely inspirational?**
   - `JS.txt#deterministic_replay_harness.js` and `JS.txt#execution_integrity_auditor.js` are inspirational. They require a virtual machine execution adapter and a stable event schema to run.
3. **Which authorities are dangerous to import?**
   - `merkle_anchor_replay_verifier.js` and other `merkle_anchor_*` modules. They assume blockchain transactions or external anchoring inputs which are not part of the active workspace runtime.
4. **Which authorities already exist in CRX?**
   - A naive object key sorter (`canonical_engine.ts`), a simple hash engine (`identity_engine.ts`), and a simple loop verifier (`dag_validator.ts`).
5. **Which authorities are genuinely missing?**
   - Replay execution verification and offline validation harnesses.
6. **What is the minimum replay-safe kernel?**
   - A zero-dependency TypeScript package containing `/canonical`, `/fingerprint`, and `/lineage` verifiers.

---

## 2. Verified Constitutional Authorities
- **Canonicalization:** Recursive sorter (`canonical_engine.ts`).
- **Lineage Verification:** Immediate parent link checker (`dag_validator.ts`).

---

## 3. Speculative Authorities
- **Identity Semantics:** Dynamic domain mapping.
- **Replay State Reconstruction:** VM sandboxed plugin double-execution.
- **Witness Proof Verification:** Merkle tree verification.\n