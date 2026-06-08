# Constitutional Priority Queue
**Version:** Pre-Replay Execution  
**Classification:** Forensics (Read-Only)

This document ranks all future work based strictly on repository risk, replay impact, determinism impact, and authority correctness.

---

## Priority Queue

### P0: Blockers (Archaeological Stabilization)
1. **Quarantine Strata:** Move `C:\Users\nolan\CascadeProjects` to `C:\Users
olan\CRX\archive\quarantined\` and compile `LINEAGE.md`.
2. **Authority Separation Setup:** Extract `canonical_fingerprint_service.js` and `formal_invariant_graph_verifier.js` from `JS.txt` directly to `constitutional-integration-lab/extracted/` as raw baselines.

### P1: Required Stabilization
3. **Decouple Hashing from Sorter:** Rewrite `identity_engine.ts` and `canonical_engine.ts` to run as separate, isolated modules.
4. **Implement Global DAG validation:** Adapt the DFS cycle and edge checker to run out-of-band for lineage commits.

### P2: Safe Extractions
5. **Extract Replay and Witness Primitives:** Port `deterministic_replay_harness.js` and `execution_integrity_auditor.js` into a test environment for offline validation.

### P3: Optional Infrastructure
6. **Local PostgreSQL Database:** Run Postgres locally to replace the unmanaged external database connection.

### P4: Future Authorities
7. **Event Schema Stabilization:** Formulate the event envelope structure after offline replay is verified.
8. **Observability Stack:** Deploy Prometheus/Grafana/Loki/Tempo only after the event model is stable.\n