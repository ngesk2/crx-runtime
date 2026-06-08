# Replay Risk Report

## Replay Instability Risks

**RISK 1: No Domain Separation in Hashing**
- CRITICAL - same content produces same hash in different contexts
- Without domain separation, hash collisions across contexts
- Replay requires context-aware hashing
- Current identity_engine.ts has no domain separation

**SEVERITY:** CRITICAL

**EVIDENCE:** identity_engine.ts has no domain separation

**FILE:** runtime/kernel/commit-service/src/engines/identity_engine.ts
**LINE:** 1-16

**MITIGATION:** Extend identity_engine.ts with domain separation from canonical_fingerprint_service.js

---

**RISK 2: No Event Envelope Structure**
- CRITICAL - replay requires canonical event structure
- Without envelope, events cannot be deterministically reconstructed
- Current event_log.ts has no envelope structure

**SEVERITY:** CRITICAL

**EVIDENCE:** event_log.ts has no event envelope structure

**FILE:** runtime/kernel/commit-service/src/events/event_log.ts
**LINE:** 1-12

**MITIGATION:** Create event envelope system from audit-event.schema.json

---

**RISK 3: No Event Fingerprinting**
- CRITICAL - replay requires event verification
- Without fingerprinting, replay cannot detect event corruption
- Current event_log.ts has no fingerprinting

**SEVERITY:** CRITICAL

**EVIDENCE:** event_log.ts has no event fingerprinting

**FILE:** runtime/kernel/commit-service/src/events/event_log.ts
**LINE:** 1-12

**MITIGATION:** Add event fingerprinting to event_log.ts

---

**RISK 4: No Event Ordering Guarantees**
- CRITICAL - replay requires deterministic ordering
- Without ordering, replay cannot produce consistent state
- Current commit_controller.ts has no ordering guarantees

**SEVERITY:** CRITICAL

**EVIDENCE:** commit_controller.ts has no event ordering

**FILE:** runtime/kernel/commit-service/src/api/commit_controller.ts
**LINE:** 4-36

**MITIGATION:** Add deterministic event ordering from deterministic_replay_harness.js

---

**RISK 5: No Transcript Generation**
- CRITICAL - replay requires transcript for verification
- Without transcript, replay cannot be audited
- Current runtime has no transcript generation

**SEVERITY:** CRITICAL

**EVIDENCE:** No transcript-related files in runtime/kernel/commit-service/src/

**MITIGATION:** Create transcript_generator.ts from replay system

---

**RISK 6: No State Reconstruction**
- CRITICAL - replay requires state reconstruction from events
- Without reconstruction, replay cannot verify state
- Current runtime has no state reconstruction

**SEVERITY:** CRITICAL

**EVIDENCE:** No state reconstruction files in runtime/kernel/commit-service/src/

**MITIGATION:** Create state_rebuilder.ts from replay system

---

**RISK 7: No Replay Verification**
- CRITICAL - replay requires verification of replay results
- Without verification, replay cannot guarantee correctness
- Current runtime has no replay verification

**SEVERITY:** CRITICAL

**EVIDENCE:** No replay verification files in runtime/kernel/commit-service/src/

**MITIGATION:** Create replay verification logic from deterministic_replay_harness.js

---

**RISK 8: No Replay Divergence Detection**
- CRITICAL - replay requires detection of replay divergence
- Without divergence detection, replay cannot detect corruption
- Current runtime has no divergence detection

**SEVERITY:** CRITICAL

**EVIDENCE:** No divergence detection files in runtime/kernel/commit-service/src/

**MITIGATION:** Create divergence detection logic from deterministic_replay_harness.js

---

**RISK 9: No Replay Witnesses**
- CRITICAL - replay requires witnesses for verification
- Without witnesses, replay cannot be trusted
- Current runtime has no replay witnesses

**SEVERITY:** CRITICAL

**EVIDENCE:** No witness-related files in runtime/kernel/commit-service/src/

**MITIGATION:** Create witness system from execution_integrity_auditor.js

---

**RISK 10: No Replay Stability Guarantees**
- CRITICAL - replay requires stability guarantees
- Without stability, replay cannot be reliable
- Current runtime has no stability guarantees

**SEVERITY:** CRITICAL

**EVIDENCE:** No stability-related files in runtime/kernel/commit-service/src/

**MITIGATION:** Create stability tests from structural_identity_stability_test_suite.js

---

## Execution Coupling Risks

**RISK 11: Execution Coupled to Infrastructure**
- HIGH - execution depends on Express, Postgres, HTTP
- Replay requires infrastructure-independent execution
- Current commit_controller.ts is infrastructure-dependent

**SEVERITY:** HIGH

**EVIDENCE:** commit_controller.ts depends on Express and PostgreSQL

**FILE:** runtime/kernel/commit-service/src/api/commit_controller.ts
**LINE:** 1-36

**MITIGATION:** Decouple execution from infrastructure using adapter pattern

---

**RISK 12: No Pure Deterministic Execution Path**
- HIGH - all execution is coupled to runtime infrastructure
- Replay requires pure deterministic execution path
- Current runtime has no pure deterministic execution path

**SEVERITY:** HIGH

**EVIDENCE:** commit_controller.ts has side effects (database writes)

**FILE:** runtime/kernel/commit-service/src/api/commit_controller.ts
**LINE:** 19-21

**MITIGATION:** Extract pure functions from commit_controller.ts

---

## Mutable State Risks

**RISK 13: Hidden Mutable State in Database Pool**
- MEDIUM - PostgreSQL pool is hidden mutable state
- Replay requires no hidden mutable state
- Current db.ts exports pool as singleton

**SEVERITY:** MEDIUM

**EVIDENCE:** db.ts exports pool as singleton

**FILE:** runtime/kernel/commit-service/src/persistence/db.ts
**LINE:** 3-5

**MITIGATION:** Remove hidden state, use adapter pattern

---

**RISK 14: Hidden Mutable State in Logger**
- LOW - Pino logger is hidden mutable state
- Replay requires no hidden mutable state
- Current logger.ts exports logger as singleton

**SEVERITY:** LOW

**EVIDENCE:** logger.ts exports logger as singleton

**FILE:** runtime/kernel/commit-service/src/utils/logger.ts
**LINE:** 1-2

**MITIGATION:** Remove hidden state, use adapter pattern

---

## Timestamp Instability Risks

**RISK 15: Timestamp Instability in Events**
- MEDIUM - timestamps are not deterministic
- Replay requires deterministic timestamps
- Current event_log.ts uses current timestamp

**SEVERITY:** MEDIUM

**EVIDENCE:** event_log.ts uses CURRENT_TIMESTAMP

**FILE:** runtime/kernel/commit-service/src/persistence/ledger_schema.sql
**LINE:** 14-20

**MITIGATION:** Use logical timestamps or sequence numbers

---

## Ordering Instability Risks

**RISK 16: No Deterministic Ordering**
- CRITICAL - no deterministic ordering guarantees
- Replay requires deterministic ordering
- Current commit_controller.ts has no ordering

**SEVERITY:** CRITICAL

**EVIDENCE:** commit_controller.ts has no ordering logic

**FILE:** runtime/kernel/commit-service/src/api/commit_controller.ts
**LINE:** 4-36

**MITIGATION:** Add deterministic ordering from deterministic_replay_harness.js

---

## Schema Drift Risks

**RISK 17: No Schema Versioning**
- MEDIUM - no schema versioning in events
- Replay requires schema versioning for migration
- Current event_log.ts has no schema versioning

**SEVERITY:** MEDIUM

**EVIDENCE:** event_log.ts has no schema versioning

**FILE:** runtime/kernel/commit-service/src/events/event_log.ts
**LINE:** 1-12

**MITIGATION:** Add schema versioning to event envelopes

---

## Risk Summary

**CRITICAL RISKS:** 10
1. No domain separation in hashing
2. No event envelope structure
3. No event fingerprinting
4. No event ordering guarantees
5. No transcript generation
6. No state reconstruction
7. No replay verification
8. No replay divergence detection
9. No replay witnesses
10. No replay stability guarantees

**HIGH RISKS:** 2
11. Execution coupled to infrastructure
12. No pure deterministic execution path

**MEDIUM RISKS:** 4
13. Hidden mutable state in database pool
15. Timestamp instability in events
16. No deterministic ordering
17. No schema versioning

**LOW RISKS:** 1
14. Hidden mutable state in logger

**TOTAL RISKS:** 17

**CRITICAL:** 10/17 (59%)
**HIGH:** 2/17 (12%)
**MEDIUM:** 4/17 (24%)
**LOW:** 1/17 (5%)

---

## Mitigation Priority

**IMMEDIATE (CRITICAL):**
1. Extend identity_engine.ts with domain separation
2. Create event envelope system
3. Add event fingerprinting
4. Add event ordering guarantees
5. Create transcript generation system
6. Create state reconstruction system
7. Create replay verification system
8. Create replay divergence detection system
9. Create replay witness system
10. Create replay stability guarantees

**SOON (HIGH):**
11. Decouple execution from infrastructure
12. Extract pure deterministic execution path

**LATER (MEDIUM):**
13. Remove hidden mutable state in database pool
15. Fix timestamp instability
16. Add deterministic ordering
17. Add schema versioning

**LOW PRIORITY:**
14. Remove hidden mutable state in logger
