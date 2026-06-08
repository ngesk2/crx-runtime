# Authority Boundary Violations Report
**Version:** Pre-Replay Execution  
**Context:** C:\Users\nolan\CRX  
**Classification:** Forensics (Read-Only)

---

## 1. Boundary Separation Verification

This phase verifies the operational boundaries between the following core layers:
- **Canonicalization:** Sorting and serialization normalization.
- **Fingerprinting:** Cryptographic byte hashing.
- **Identity Semantics:** Structural and contextual interpretation of hashes.
- **Lineage:** Graph verifications (DAG cycle and bypass detection).
- **Replay:** Double-execution state reconstruction.
- **Witness:** Proof generation and verification evidence.
- **Execution:** Running plugins or execution tasks.
- **Persistence:** Saving states or transaction logs.
- **Transport:** HTTP, RPC, CLI handlers.

---

## 2. Identified Violations

### VIOLATION-001: Transport Layer Gains Hashing & Lineage Authority
- **Location:** [commit_controller.ts](file:///C:/Users/nolan/CRX/runtime/kernel/commit-service/src/api/commit_controller.ts)
- **Description:** The HTTP controller directly imports and executes `computeCanonicalHash()` and `validateLineage()`.
- **Leakage:** The transport layer (Express route handler) is acting as the mediator of canonical identity and lineage logic, rather than acting as a pure, decoupled I/O adapter.
- **Risk:** High. Changes to transport frameworks or request models require rewriting code that coordinates identity verification.

### VIOLATION-002: Persistence Layer Gains Truth Authority
- **Location:** [ledger_schema.sql](file:///C:/Users/nolan/CRX/runtime/kernel/commit-service/src/persistence/ledger_schema.sql)
- **Description:** The database schema defines specific relational rules and types for execution tracking.
- **Leakage:** True database constraints dictate state validity rather than events acting as the sole, immutable truth.
- **Risk:** Medium. If the database schema shifts or tables are migrated, event truth becomes coupled to database migrations.

### VIOLATION-003: Identity collapses into Hashing
- **Location:** [identity_engine.ts](file:///C:/Users/nolan/CRX/runtime/kernel/commit-service/src/engines/identity_engine.ts)
- **Description:** The identity engine simply runs SHA-256 over a sorted string representation of the object.
- **Leakage:** The system treats "identity" as equivalent to "byte fingerprinting." It lacks domain separation. An artifact hash and a metadata snapshot of identical structure would yield the same identifier, causing semantic confusion.
- **Risk:** High. Allows cross-domain collision of semantic meanings during replay reconstruction.

### VIOLATION-004: Hashing collapses into Canonicalization
- **Location:** [identity_engine.ts](file:///C:/Users/nolan/CRX/runtime/kernel/commit-service/src/engines/identity_engine.ts)
- **Description:** The identity engine imports `canonicalize` and runs it inline before hashing.
- **Leakage:** Hashing logic is tightly coupled to a specific canonicalization parser. 
- **Risk:** Medium. If a different normalization schema is introduced (e.g. for plugins or schemas), the hashing engine must be duplicated or refactored.

---

## 3. Boundary Stability Assessment

| Boundary Pair | Status | Leakage Level | Stability |
|---|---|---|---|
| Canonicalization ↔ Fingerprinting | Conflated | High | Unstable |
| Fingerprinting ↔ Identity | Conflated | High | Unstable |
| Lineage ↔ Transport | Leaked | Medium | Unstable |
| Replay ↔ Execution | Absent | N/A | Not Implemented |
| Witness ↔ Persistence | Absent | N/A | Not Implemented |
