# Authority Reuse Matrix
**Version:** Pre-Replay Execution  
**Classification:** Forensics (Read-Only)

This matrix compares the proposed extractions from `JS.txt` against existing CRX implementations to prevent duplicate creation.

---

## Reuse Matrix

| Proposed JS.txt Module | Equivalent in CRX | Extraction Relationship | Justification |
|---|---|---|---|
| `canonical_fingerprint_service.js` | `canonical_engine.ts` | **SUPERSEDED** | The JS.txt module provides WeakSet circular checks and strict type rejection lacking in CRX. |
| `canonical_fingerprint_service.js` | `identity_engine.ts` | **REPLACEMENT** | The JS.txt module provides cryptographic domain separation lacking in CRX. |
| `formal_invariant_graph_verifier.js` | `dag_validator.ts` | **REPLACEMENT** | The JS.txt module implements global DFS cycle detection and required/forbidden constraints, whereas CRX only checks immediate parents. |
| `deterministic_replay_harness.js` | None | **NEW** (Genuinely Missing) | No replay capability exists in CRX. |
| `execution_integrity_auditor.js` | None | **NEW** (Genuinely Missing) | No validation audit capability exists in CRX. |
| `merkle_anchor_replay_verifier.js` | None | **NEW** (Genuinely Missing) | No witness verification exists in CRX. |\n