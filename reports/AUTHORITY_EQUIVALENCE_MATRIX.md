# Authority Equivalence Matrix
**Version:** Pre-Replay Execution  
**Classification:** Forensics (Read-Only)

This matrix documents the pairings and behavioral overlap between CRX runtime and JS.txt archived modules.

---

## Pairings Matrix

| CRX Authority | JS.txt Authority | Overlap Classification | Missing in CRX | Additional in CRX |
|---|---|---|---|---|
| `canonical_engine.ts` | `canonical_fingerprint_service.js` (canonicalize) | **PARTIAL OVERLAP** | WeakSet checks, strict type rejection (BigInt, Symbol, Function), scientific notation guards, NFC normalization. | None (both sort objects). |
| `identity_engine.ts` | `canonical_fingerprint_service.js` (fingerprint) | **PARTIAL OVERLAP** | Cryptographic domain separation, verify options, preimage construction. | Direct Node `crypto` import (JS.txt uses environment fallback). |
| `dag_validator.ts` | `formal_invariant_graph_verifier.js` | **PARTIAL OVERLAP** | Global cycle detection (DFS), edge constraints, graph fingerprinting. | Direct inline execution in Express routes. |
| `artifact.ts` (deleted) | `canonical-event-envelope.json` | **NO OVERLAP** | The entire event envelope model. | N/A |
| `commit_controller.ts` | `deterministic_replay_harness.js` | **NO OVERLAP** | Double-execution, VM sandbox run, drift detection, registry validation. | Express routing and DB write calls. |
| `execution path` | `execution_integrity_auditor.js` | **NO OVERLAP** | Passive verification, log integrity checks. | Live mutative state writing. |\n