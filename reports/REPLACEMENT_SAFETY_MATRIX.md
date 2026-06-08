# Replacement Safety Matrix
**Version:** Pre-Replay Execution  
**Classification:** Forensics (Read-Only)

Evaluation of the safety of replacing or extending existing CRX logic with extracted archived modules.

---

## Safety Matrix

| Extracted Authority | Safety Classification | Justification |
|---|---|---|
| `canonical_fingerprint_service.js` (canonicalize) | **SAFE EXTENSION** | Can be imported to replace `canonicalize` as it passes all sorted object tests and adds safety guards. |
| `canonical_fingerprint_service.js` (fingerprint) | **SAFE REPLACEMENT** | Can replace `computeCanonicalHash` once existing database keys are mapped (needs domain parameters to be passed). |
| `formal_invariant_graph_verifier.js` | **SAFE REPLACEMENT** | Can replace `validateLineage` to provide global cycle checking. |
| `deterministic_replay_harness.js` | **REFERENCE ONLY** | Cannot be directly imported; it relies on VM libraries and schedulers that are not currently installed or configured. |
| `execution_integrity_auditor.js` | **REFERENCE ONLY** | Requires stabilized event structures to function. |
| `merkle_anchor_replay_verifier.js` | **DO NOT IMPORT** | Out of scope for current local runtime phase; requires blockchain/anchor data formats. |\n