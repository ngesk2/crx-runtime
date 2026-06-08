# Replay Criticality Report

**Generated:** 2026-06-06
**Primary Authority:** AGENT.md
**Lab Workspace:** `C:\Users\nolan\constitutional-integration-lab\`
**CRX Status:** READ-ONLY (untouched)

---

## CRX Runtime Authorities

### canonical_engine.ts

| Field | Value |
|-------|-------|
| **REPLAY_CRITICAL** | YES |
| **WHY** | Canonicalization is the foundation of deterministic hashing - without domain separation, hash collisions occur across contexts |
| **STATE_IMPACT** | CRITICAL - canonical form determines hash, hash determines state identity |
| **LINEAGE_IMPACT** | CRITICAL - lineage fingerprints depend on canonical form |
| **DETERMINISM_IMPACT** | CRITICAL - without domain separation, same content produces same hash in different contexts (collision risk) |

---

### identity_engine.ts

| Field | Value |
|-------|-------|
| **REPLAY_CRITICAL** | YES |
| **WHY** | Identity computation is the foundation of artifact identification - without domain separation, hash collisions occur across contexts |
| **STATE_IMPACT** | CRITICAL - artifact_id determines state identity |
| **LINEAGE_IMPACT** | CRITICAL - lineage edges depend on artifact_id |
| **DETERMINISM_IMPACT** | CRITICAL - without domain separation, same content produces same hash in different contexts (collision risk) |

---

### dag_validator.ts

| Field | Value |
|-------|-------|
| **REPLAY_CRITICAL** | YES |
| **WHY** | Lineage validation is the foundation of acyclic graph enforcement - without indirect cycle detection, lineage corruption occurs through indirect cycles (A→B→C→A) |
| **STATE_IMPACT** | CRITICAL - lineage determines state reconstruction |
| **LINEAGE_IMPACT** | CRITICAL - lineage validation prevents lineage corruption |
| **DETERMINISM_IMPACT** | HIGH - without indirect cycle detection, lineage validation is incomplete |

---

### event_log.ts

| Field | Value |
|-------|-------|
| **REPLAY_CRITICAL** | YES |
| **WHY** | Event logging is the foundation of replay substrate - without event envelope structure, events cannot be deterministically reconstructed |
| **STATE_IMPACT** | CRITICAL - events determine state reconstruction |
| **LINEAGE_IMPACT** | CRITICAL - events determine lineage causality |
| **DETERMINISM_IMPACT** | CRITICAL - without event envelope structure, events cannot be deterministically reconstructed |

---

### commit_controller.ts

| Field | Value |
|-------|-------|
| **REPLAY_CRITICAL** | YES |
| **WHY** | Commit controller is the foundation of artifact persistence - without replay verification, stored state cannot be verified |
| **STATE_IMPACT** | CRITICAL - commit determines state persistence |
| **LINEAGE_IMPACT** | CRITICAL - commit determines lineage persistence |
| **DETERMINISM_IMPACT** | HIGH - without replay verification, commit determinism cannot be verified |

---

## JS.txt Archive Authorities (Top Replay-Critical)

### canonical_fingerprint_service.js

| Field | Value |
|-------|-------|
| **REPLAY_CRITICAL** | YES |
| **WHY** | Domain-separated fingerprinting is the foundation of context-aware hashing - without domain separation, hash collisions occur across contexts |
| **STATE_IMPACT** | CRITICAL - fingerprints determine state identity |
| **LINEAGE_IMPACT** | CRITICAL - lineage fingerprints depend on domain separation |
| **DETERMINISM_IMPACT** | CRITICAL - domain separation ensures deterministic hashing across contexts |

---

### deterministic_replay_harness.js

| Field | Value |
|-------|-------|
| **REPLAY_CRITICAL** | YES |
| **WHY** | Deterministic replay is the foundation of state reconstruction - without replay system, state cannot be verified |
| **STATE_IMPACT** | CRITICAL - replay determines state reconstruction |
| **LINEAGE_IMPACT** | CRITICAL - replay determines lineage causality |
| **DETERMINISM_IMPACT** | CRITICAL - replay ensures deterministic state reconstruction |

---

### formal_invariant_graph_verifier.js

| Field | Value |
|-------|-------|
| **REPLAY_CRITICAL** | YES |
| **WHY** | Invariant graph verification is the foundation of constitutional compliance - without full cycle detection, lineage corruption occurs through indirect cycles |
| **STATE_IMPACT** | CRITICAL - invariant graph determines state constraints |
| **LINEAGE_IMPACT** | CRITICAL - invariant graph determines lineage constraints |
| **DETERMINISM_IMPACT** | HIGH - without full cycle detection, invariant validation is incomplete |

---

### execution_integrity_auditor.js

| Field | Value |
|-------|-------|
| **REPLAY_CRITICAL** | YES |
| **WHY** | Execution integrity auditing is the foundation of replay verification - without audit system, replay correctness cannot be verified |
| **STATE_IMPACT** | CRITICAL - audit determines state verification |
| **LINEAGE_IMPACT** | CRITICAL - audit determines lineage verification |
| **DETERMINISM_IMPACT** | CRITICAL - audit ensures deterministic execution verification |

---

### merkle_anchor_replay_verifier.js

| Field | Value |
|-------|-------|
| **REPLAY_CRITICAL** | YES |
| **WHY** | Merkle anchor replay verification is the foundation of anchor chain integrity - without verification, anchor chain corruption cannot be detected |
| **STATE_IMPACT** | CRITICAL - anchor verification determines anchor chain state |
| **LINEAGE_IMPACT** | CRITICAL - anchor verification determines anchor chain lineage |
| **DETERMINISM_IMPACT** | CRITICAL - anchor verification ensures deterministic anchor chain replay |

---

### merkle_anchor_chain_drift_detector.js

| Field | Value |
|-------|-------|
| **REPLAY_CRITICAL** | YES |
| **WHY** | Merkle anchor chain drift detection is the foundation of anchor chain integrity - without detection, anchor chain drift cannot be detected |
| **STATE_IMPACT** | CRITICAL - drift detection determines anchor chain state |
| **LINEAGE_IMPACT** | CRITICAL - drift detection determines anchor chain lineage |
| **DETERMINISM_IMPACT** | HIGH - drift detection ensures anchor chain determinism |

---

### cross_anchor_drift_detector.js

| Field | Value |
|-------|-------|
| **REPLAY_CRITICAL** | YES |
| **WHY** | Cross anchor drift detection is the foundation of multi-anchor integrity - without detection, cross-anchor drift cannot be detected |
| **STATE_IMPACT** | CRITICAL - drift detection determines multi-anchor state |
| **LINEAGE_IMPACT** | CRITICAL - drift detection determines multi-anchor lineage |
| **DETERMINISM_IMPACT** | HIGH - drift detection ensures multi-anchor determinism |

---

### structural_graph_builder.js

| Field | Value |
|-------|-------|
| **REPLAY_CRITICAL** | YES |
| **WHY** | Structural graph building is the foundation of structural identity - without deterministic node generation, structural identity cannot be verified |
| **STATE_IMPACT** | CRITICAL - structural graph determines structural state |
| **LINEAGE_IMPACT** | CRITICAL - structural graph determines structural lineage |
| **DETERMINISM_IMPACT** | CRITICAL - structural graph building ensures deterministic structural identity |

---

### structural_drift_guard.js

| Field | Value |
|-------|-------|
| **REPLAY_CRITICAL** | YES |
| **WHY** | Structural drift guarding is the foundation of structural integrity - without detection, structural drift cannot be detected |
| **STATE_IMPACT** | CRITICAL - drift detection determines structural state |
| **LINEAGE_IMPACT** | CRITICAL - drift detection determines structural lineage |
| **DETERMINISM_IMPACT** | HIGH - drift detection ensures structural determinism |

---

### snapshot_lineage_integrity_guard.js

| Field | Value |
|-------|-------|
| **REPLAY_CRITICAL** | YES |
| **WHY** | Snapshot lineage integrity guarding is the foundation of snapshot integrity - without guarding, snapshot lineage corruption cannot be detected |
| **STATE_IMPACT** | CRITICAL - snapshot guarding determines snapshot state |
| **LINEAGE_IMPACT** | CRITICAL - snapshot guarding determines snapshot lineage |
| **DETERMINISM_IMPACT** | HIGH - snapshot guarding ensures snapshot determinism |

---

## Summary

**TOTAL AUTHORITIES ANALYZED:** 14

**BY REPLAY_CRITICAL:**
- YES: 14 (all authorities analyzed are replay-critical)
- NO: 0

**BY STATE_IMPACT:**
- CRITICAL: 14 (all authorities analyzed have critical state impact)
- HIGH: 0
- MEDIUM: 0
- LOW: 0

**BY LINEAGE_IMPACT:**
- CRITICAL: 14 (all authorities analyzed have critical lineage impact)
- HIGH: 0
- MEDIUM: 0
- LOW: 0

**BY DETERMINISM_IMPACT:**
- CRITICAL: 12 (canonical_fingerprint_service.js, deterministic_replay_harness.js, execution_integrity_auditor.js, merkle_anchor_replay_verifier.js, structural_graph_builder.js, canonical_engine.ts, identity_engine.ts, event_log.ts)
- HIGH: 2 (formal_invariant_graph_verifier.js, dag_validator.ts, merkle_anchor_chain_drift_detector.js, cross_anchor_drift_detector.js, structural_drift_guard.js, snapshot_lineage_integrity_guard.js, commit_controller.ts)
- MEDIUM: 0
- LOW: 0

**CRITICAL REPLAY GAPS:**
- CRX canonical_engine.ts: No domain separation (CRITICAL)
- CRX identity_engine.ts: No domain separation (CRITICAL)
- CRX dag_validator.ts: No indirect cycle detection (CRITICAL)
- CRX event_log.ts: No event envelope structure (CRITICAL)
- CRX commit_controller.ts: No replay verification (CRITICAL)
- CRX runtime: No replay system (CRITICAL)
- CRX runtime: No execution integrity auditor (CRITICAL)
- CRX runtime: No structural graph builder (CRITICAL)
- CRX runtime: No snapshot lineage integrity guard (CRITICAL)

**REUSE BEFORE CREATE OPPORTUNITIES:**
- canonical_fingerprint_service.js: Reuse for domain separation in canonical_engine.ts and identity_engine.ts
- deterministic_replay_harness.js: Reuse for replay system in CRX runtime
- formal_invariant_graph_verifier.js: Reuse for indirect cycle detection in dag_validator.ts
- execution_integrity_auditor.js: Reuse for execution integrity auditing in CRX runtime
- structural_graph_builder.js: Reuse for structural graph building in CRX runtime
- snapshot_lineage_integrity_guard.js: Reuse for snapshot lineage integrity guarding in CRX runtime
