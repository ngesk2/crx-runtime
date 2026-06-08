# JS.txt to Kernel Mapping

## Repository File Inventory

**CRX Source Files (excluding node_modules):**
- 11 .ts files (runtime/kernel/commit-service/src/)
- 1 .py file (agents/crx_workspace_indexer.py)
- 1 .sql file (runtime/kernel/commit-service/src/persistence/ledger_schema.sql)
- 1 .yml file (agents/docker-compose.yml)
- 1 .txt file (agents/requirements.txt)
- 62 .md files (constitutional documents)

**JS.txt Contents:**
- 59 concatenated JavaScript files (18,410 lines, 411KB)
- Constitutional verification, fingerprinting, plugin execution, determinism testing

**MCP0.txt Contents:**
- Architectural specification (22,538 lines, 532KB)
- Directory structure for constitutional machine
- Kernel modules, runtime modules, protocols, tooling, tests

---

## CRX Foundational Kernel Seeds

**Treat as FOUNDATIONAL KERNEL SEEDS (NOT temporary utilities):**

1. **canonical_engine.ts**
   - Purpose: Input canonicalization for hashing
   - Authority: Canonicalization
   - Status: VERIFIED_RUNTIME_TRUTH
   - REUSE: YES - extend with domain separation from canonical_fingerprint_service.js

2. **identity_engine.ts**
   - Purpose: Artifact identity computation (SHA-256 hash)
   - Authority: Identity
   - Status: VERIFIED_RUNTIME_TRUTH
   - REUSE: YES - extend with domain separation from canonical_fingerprint_service.js

3. **dag_validator.ts**
   - Purpose: Lineage DAG validation
   - Authority: Lineage
   - Status: VERIFIED_RUNTIME_TRUTH
   - REUSE: YES - extend with full cycle detection from formal_invariant_graph_verifier.js

---

## High-Priority Extraction Targets Comparison

### 1. formal_invariant_graph_verifier.js

**FILE:** JS.txt (lines 1-263)
**PURPOSE:** Formal DAG verification for constitutional invariants
**CURRENT CRX EQUIVALENT:** dag_validator.ts
**OVERLAP:** Both perform DAG validation
**MISSING CAPABILITIES:**
- Required edge verification
- Forbidden edge detection
- Graph fingerprinting
- Domain transition enforcement
- Deterministic graph fingerprint
**REPLAY RELEVANCE:** HIGH - graph fingerprinting enables replay verification
**LINEAGE RELEVANCE:** HIGH - full cycle detection prevents lineage corruption
**KEEP:** YES
**MERGE:** YES - extend dag_validator.ts with missing capabilities
**DELETE:** NO
**EXTRACT:** YES - extract from JS.txt
**RISK:** LOW - pure function, no side effects

---

### 2. deterministic_replay_harness.js

**FILE:** JS.txt (lines ~5000-5200)
**PURPOSE:** Deterministic replay testing
**CURRENT CRX EQUIVALENT:** None
**OVERLAP:** None
**MISSING CAPABILITIES:** Entire replay system
**REPLAY RELEVANCE:** CRITICAL - foundational replay capability
**LINEAGE RELEVANCE:** HIGH - replay requires lineage
**KEEP:** YES
**MERGE:** NO - new authority
**DELETE:** NO
**EXTRACT:** YES - extract as replay_engine.ts
**RISK:** MEDIUM - requires careful integration with execution

---

### 3. canonical_fingerprint_service.js

**FILE:** JS.txt (lines ~300-800)
**PURPOSE:** SHA-256 fingerprinting with domain separation
**CURRENT CRX EQUIVALENT:** identity_engine.ts
**OVERLAP:** Both perform SHA-256 hashing
**MISSING CAPABILITIES:**
- Domain separation (FINGERPRINT_DOMAINS)
- Fingerprint verification
- Canonicalization options
- Error handling (CanonicalizationError)
**REPLAY RELEVANCE:** CRITICAL - domain separation enables replay stability
**LINEAGE RELEVANCE:** MEDIUM - fingerprinting supports lineage verification
**KEEP:** YES
**MERGE:** YES - extend identity_engine.ts with domain separation
**DELETE:** NO
**EXTRACT:** YES - extract domain separation logic
**RISK:** LOW - pure function, no side effects

---

### 4. execution_integrity_auditor.js

**FILE:** JS.txt (lines ~800-1200)
**PURPOSE:** Execution integrity auditing
**CURRENT CRX EQUIVALENT:** None
**OVERLAP:** None
**MISSING CAPABILITIES:** Entire integrity auditing system
**REPLAY RELEVANCE:** HIGH - integrity checks enable replay verification
**LINEAGE RELEVANCE:** MEDIUM - integrity checks support lineage verification
**KEEP:** YES
**MERGE:** NO - new authority
**DELETE:** NO
**EXTRACT:** YES - extract as execution_auditor.ts
**RISK:** MEDIUM - requires integration with commit flow

---

### 5. structural_graph_builder.js

**FILE:** JS.txt (lines ~3000-3300)
**PURPOSE:** Structural graph building
**CURRENT CRX EQUIVALENT:** None
**OVERLAP:** None
**MISSING CAPABILITIES:** Entire graph building system
**REPLAY RELEVANCE:** HIGH - graph building enables lineage reconstruction
**LINEAGE RELEVANCE:** CRITICAL - graph building enables lineage analysis
**KEEP:** YES
**MERGE:** NO - new authority
**DELETE:** NO
**EXTRACT:** YES - extract as graph_builder.ts
**RISK:** MEDIUM - requires integration with lineage system

---

### 6. authority_boundary_prover.js

**FILE:** JS.txt (lines ~4000-4300)
**PURPOSE:** Authority boundary proving
**CURRENT CRX EQUIVALENT:** None
**OVERLAP:** None
**MISSING CAPABILITIES:** Entire authority boundary system
**REPLAY RELEVANCE:** MEDIUM - authority boundaries support replay isolation
**LINEAGE RELEVANCE:** MEDIUM - authority boundaries support lineage verification
**KEEP:** YES
**MERGE:** NO - new authority
**DELETE:** NO
**EXTRACT:** YES - extract as authority_prover.ts
**RISK:** LOW - pure function, no side effects

---

### 7. snapshot_lineage_integrity_guard.js

**FILE:** JS.txt (lines ~3500-3800)
**PURPOSE:** Snapshot lineage integrity guarding
**CURRENT CRX EQUIVALENT:** None
**OVERLAP:** None
**MISSING CAPABILITIES:** Entire snapshot lineage system
**REPLAY RELEVANCE:** HIGH - snapshot lineage enables replay verification
**LINEAGE RELEVANCE:** CRITICAL - snapshot lineage enables lineage verification
**KEEP:** YES
**MERGE:** NO - new authority
**DELETE:** NO
**EXTRACT:** YES - extract as snapshot_guard.ts
**RISK:** MEDIUM - requires integration with persistence

---

### 8. structural_identity_stability_test_suite.js

**FILE:** JS.txt (lines ~4500-4800)
**PURPOSE:** Structural identity stability testing
**CURRENT CRX EQUIVALENT:** None
**OVERLAP:** None
**MISSING CAPABILITIES:** Entire stability testing system
**REPLAY RELEVANCE:** HIGH - stability testing enables replay verification
**LINEAGE RELEVANCE:** MEDIUM - stability testing supports lineage verification
**KEEP:** YES
**MERGE:** NO - new authority
**DELETE:** NO
**EXTRACT:** YES - extract as stability_test.ts
**RISK:** LOW - test suite, no runtime impact

---

## Extraction Priority

**CRITICAL (extract immediately):**
1. formal_invariant_graph_verifier.js → extend dag_validator.ts
2. canonical_fingerprint_service.js → extend identity_engine.ts
3. deterministic_replay_harness.js → create replay_engine.ts

**HIGH (extract soon):**
4. execution_integrity_auditor.js → create execution_auditor.ts
5. structural_graph_builder.js → create graph_builder.ts
6. snapshot_lineage_integrity_guard.js → create snapshot_guard.ts

**MEDIUM (extract later):**
7. authority_boundary_prover.js → create authority_prover.ts
8. structural_identity_stability_test_suite.js → create stability_test.ts

---

## Kernel Authority Mapping

**Based on REAL existing logic:**

```
kernel/
├── canonical/
│   └── canonical_engine.ts (existing - extend with domain separation)
├── identity/
│   └── identity_engine.ts (existing - extend with domain separation)
├── lineage/
│   ├── dag_validator.ts (existing - extend with full cycle detection)
│   └── graph_builder.ts (new - from structural_graph_builder.js)
├── replay/
│   └── replay_engine.ts (new - from deterministic_replay_harness.js)
├── witness/
│   ├── execution_auditor.ts (new - from execution_integrity_auditor.js)
│   └── snapshot_guard.ts (new - from snapshot_lineage_integrity_guard.js)
├── constitution/
│   └── formal_invariant_graph_verifier.ts (new - from formal_invariant_graph_verifier.js)
├── event/
│   └── (to be determined from event analysis)
└── authority/
    └── authority_prover.ts (new - from authority_boundary_prover.js)
```

---

## Next Steps

1. Extract high-priority files from JS.txt
2. Port to TypeScript
3. Extend existing kernel seeds
4. Create new kernel authorities
5. Integrate with existing runtime
6. Test constitutional compliance
