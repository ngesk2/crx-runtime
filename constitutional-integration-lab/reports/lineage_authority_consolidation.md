# PHASE D — LINEAGE AUTHORITY CONSOLIDATION
## Lineage Authority Consolidation Report

**Audit Date:** 2025-01-08
**Target:** Lineage systems and DAG validation
**Repository:** CRX Constitutional Specification Repository

---

## EXECUTIVE SUMMARY

**FINDING: COMPETING LINEAGE SYSTEMS EXIST**

Multiple lineage systems exist:
1. **CRX Runtime:** `dag_validator.ts` (minimal, shallow validation)
2. **JS.txt Archive:** `formal_invariant_graph_verifier.js` (complete, full cycle detection, graph fingerprinting)
3. **JS.txt Archive:** `structural_graph_builder.js` (deterministic structural identity)
4. **JS.txt Archive:** `snapshot_lineage_integrity_guard.js` (snapshot lineage validation)

**RECOMMENDATION:** Consolidate into ONE canonical lineage authority using `formal_invariant_graph_verifier.js` as the foundation.

---

## AUDIT SCOPE

### Target Lineage Components
- DAG validation
- Cycle detection
- Lineage verification
- Structural graph building
- Snapshot lineage integrity
- Graph fingerprinting
- Invariant verification

### Search Locations
- CRX runtime: `dag_validator.ts`
- JS.txt archive: `formal_invariant_graph_verifier.js`, `structural_graph_builder.js`, `snapshot_lineage_integrity_guard.js`

---

## AUDIT FINDINGS

### Lineage Authorities Found

| Authority | Location | Primary Authority | Replay Sensitivity | Status |
|-----------|----------|-------------------|-------------------|--------|
| `dag_validator.ts` | CRX runtime | lineage | MEDIUM | MINIMAL |
| `formal_invariant_graph_verifier.js` | JS.txt archive | invariant + lineage | HIGH | COMPLETE |
| `structural_graph_builder.js` | JS.txt archive | lineage + canonicalization | HIGH | COMPLETE |
| `snapshot_lineage_integrity_guard.js` | JS.txt archive | lineage + verification | HIGH | COMPLETE |

### CRX Runtime Lineage Authority: `dag_validator.ts`

**MODULE:** `runtime/kernel/commit-service/src/validation/dag_validator.ts`

**PRIMARY_AUTHORITY:** lineage

**SECONDARY_AUTHORITIES:** invariant (partial)

**RESPONSIBILITY:** Direct self-loop and duplicate parent detection

**INPUTS:** `parentIds: string[]`, `childId: string`

**OUTPUTS:** `true` or throws

**DEPENDENCIES:** None

**SIDE_EFFECTS:** Throws on violation

**REPLAY_SENSITIVITY:** MEDIUM

**DETERMINISM_SENSITIVITY:** HIGH

**CAPABILITIES:**
- Direct self-loop detection
- Duplicate parent detection
- Simple validation logic

**GAPS:**
- No indirect cycle detection
- No graph fingerprinting
- No required edge verification
- No forbidden edge detection
- No invariant topology binding
- No domain separation
- No structural graph building
- No snapshot lineage validation

### JS.txt Archive Lineage Authority: `formal_invariant_graph_verifier.js`

**MODULE:** `JS.txt#formal_invariant_graph_verifier.js`

**PRIMARY_AUTHORITY:** invariant

**SECONDARY_AUTHORITIES:** lineage, witness (graph fingerprint)

**RESPONSIBILITY:** Constitutional topology DAG verification

**INPUTS:** `declaredNodes`, `declaredEdges`

**OUTPUTS:** Verification result + graph fingerprint

**DEPENDENCIES:** `canonical_fingerprint_service`

**SIDE_EFFECTS:** None

**REPLAY_SENSITIVITY:** HIGH

**DETERMINISM_SENSITIVITY:** HIGH

**EXPORTS:**
- `INVARIANT_NODES`
- `verifyInvariantGraph`

**CAPABILITIES:**
- Full cycle detection (DFS-based)
- Required edge verification
- Forbidden edge detection
- Graph fingerprinting
- Invariant node presence check
- Domain transition enforcement
- Deterministic graph fingerprint

**INVARIANT_NODES:**
- `SNAPSHOT_VERIFIED`
- `SCHEDULER_BOUND`
- `RUNTIME_ISOLATED`
- `ENTROPY_ENFORCED`
- `CONTRACT_VALIDATED`
- `ARTIFACT_BOUND`
- `FINGERPRINT_BOUND`
- `AUTHORITY_BOUNDARY_ENCLOSED`
- `CI_DOMAIN_LOCK_ENFORCED`

**REQUIRED_EDGES:**
- SNAPSHOT_VERIFIED → SCHEDULER_BOUND
- SCHEDULER_BOUND → RUNTIME_ISOLATED
- RUNTIME_ISOLATED → ENTROPY_ENFORCED
- ENTROPY_ENFORCED → CONTRACT_VALIDATED
- CONTRACT_VALIDATED → ARTIFACT_BOUND
- ARTIFACT_BOUND → FINGERPRINT_BOUND
- FINGERPRINT_BOUND → AUTHORITY_BOUNDARY_ENCLOSED
- AUTHORITY_BOUNDARY_ENCLOSED → CI_DOMAIN_LOCK_ENFORCED

**FORBIDDEN_EDGES:**
- SNAPSHOT_VERIFIED → ARTIFACT_BOUND (bypass)
- SCHEDULER_BOUND → ARTIFACT_BOUND (bypass)
- RUNTIME_ISOLATED → FINGERPRINT_BOUND (bypass)
- CONTRACT_VALIDATED → CI_DOMAIN_LOCK_ENFORCED (bypass)
- SNAPSHOT_VERIFIED → RUNTIME_ISOLATED (must pass scheduler)

### JS.txt Archive Lineage Authority: `structural_graph_builder.js`

**MODULE:** `JS.txt#structural_graph_builder.js`

**PRIMARY_AUTHORITY:** lineage

**SECONDARY_AUTHORITIES:** canonicalization

**RESPONSIBILITY:** Deterministic structural identity compilation

**CAPABILITIES:**
- Deterministic node generation
- Domain-separated node identity
- Stable replay
- Span validation
- Acyclic structure enforcement
- Deep immutability

**REPLAY_SENSITIVITY:** HIGH

**DETERMINISM_SENSITIVITY:** HIGH

### JS.txt Archive Lineage Authority: `snapshot_lineage_integrity_guard.js`

**MODULE:** `JS.txt#snapshot_lineage_integrity_guard.js`

**PRIMARY_AUTHORITY:** lineage

**SECONDARY_AUTHORITIES:** verification

**RESPONSIBILITY:** Snapshot lineage integrity validation

**CAPABILITIES:**
- Snapshot lineage verification
- Lineage integrity validation
- Replay-safe lineage tracking

**REPLAY_SENSITIVITY:** HIGH

**DETERMINISM_SENSITIVITY:** HIGH

---

## LINEAGE AUTHORITY CONSOLIDATION ANALYSIS

### Competing Lineage Systems

| CANONICAL_AUTHORITY | DUPLICATE_AUTHORITY | STRONGER_IMPLEMENTATION | REUSE_TARGET | MERGE_TARGET | QUARANTINE_TARGET | RISK |
|---------------------|---------------------|------------------------|-------------|-------------|------------------|------|
| formal_invariant_graph_verifier.js (JS.txt) | dag_validator.ts (CRX) | formal_invariant_graph_verifier.js (has full cycle detection, graph fingerprinting) | formal_invariant_graph_verifier.js | dag_validator.ts | None | CRITICAL |
| structural_graph_builder.js (JS.txt) | None (CRX has no structural graph builder) | structural_graph_builder.js (only implementation) | structural_graph_builder.js | None | None | MEDIUM |
| snapshot_lineage_integrity_guard.js (JS.txt) | None (CRX has no snapshot lineage guard) | snapshot_lineage_integrity_guard.js (only implementation) | snapshot_lineage_integrity_guard.js | None | None | MEDIUM |

**CONFLICT:** CRITICAL - dag_validator.ts lacks full cycle detection and graph fingerprinting

### Gap Analysis

| Requirement | dag_validator.ts | formal_invariant_graph_verifier.js | structural_graph_builder.js | snapshot_lineage_integrity_guard.js |
|-------------|------------------|-------------------------------------|----------------------------|-----------------------------------|
| Direct self-loop detection | ✅ YES | ✅ YES | ✅ YES | ✅ YES |
| Duplicate parent detection | ✅ YES | ✅ YES | ✅ YES | ✅ YES |
| Indirect cycle detection | ❌ NO | ✅ YES | ✅ YES | ✅ YES |
| Graph fingerprinting | ❌ NO | ✅ YES | ✅ YES | ✅ YES |
| Required edge verification | ❌ NO | ✅ YES | ❌ NO | ❌ NO |
| Forbidden edge detection | ❌ NO | ✅ YES | ❌ NO | ❌ NO |
| Invariant topology binding | ❌ NO | ✅ YES | ❌ NO | ❌ NO |
| Domain separation | ❌ NO | ✅ YES | ✅ YES | ✅ YES |
| Structural graph building | ❌ NO | ❌ NO | ✅ YES | ❌ NO |
| Snapshot lineage validation | ❌ NO | ❌ NO | ❌ NO | ✅ YES |

---

## CONSOLIDATION PLAN

### STEP 1: Establish Canonical Lineage Authority

**CANONICAL AUTHORITY:** `formal_invariant_graph_verifier.js` (JS.txt)

**RATIONALE:**
- Most complete lineage validation implementation
- Full cycle detection (DFS-based)
- Graph fingerprinting capability
- Required edge verification
- Forbidden edge detection
- Invariant topology binding
- Domain separation
- Deterministic graph fingerprint

### STEP 2: Consolidate Lineage Systems

**ACTION:**
1. Extract `formal_invariant_graph_verifier.js` from JS.txt archive
2. Adapt to CRX runtime (TypeScript conversion if needed)
3. Replace `dag_validator.ts` with consolidated lineage authority
4. Extract `structural_graph_builder.js` for structural identity
5. Extract `snapshot_lineage_integrity_guard.js` for snapshot lineage
6. Deprecate CRX runtime lineage implementations
7. Maintain backward compatibility for existing lineage validation

### STEP 3: Implement Full Cycle Detection

**ACTION:**
1. Implement DFS-based cycle detection
2. Implement indirect cycle detection
3. Implement cycle path reporting
4. Add cycle detection to lineage validation
5. Add cycle detection to replay verification

### STEP 4: Implement Graph Fingerprinting

**ACTION:**
1. Implement deterministic graph fingerprinting
2. Add graph fingerprint to lineage validation
3. Add graph fingerprint to replay verification
4. Add graph fingerprint to invariant verification
5. Use domain-separated fingerprinting for graph fingerprints

### STEP 5: Implement Invariant Topology Binding

**ACTION:**
1. Adopt `INVARIANT_NODES` from `formal_invariant_graph_verifier.js`
2. Adopt `REQUIRED_EDGES` from `formal_invariant_graph_verifier.js`
3. Adopt `FORBIDDEN_EDGES` from `formal_invariant_graph_verifier.js`
4. Implement invariant node presence check
5. Implement required edge verification
6. Implement forbidden edge detection
7. Bind invariant topology to replay verification

---

## REQUIRED LINEAGE AUTHORITY SPECIFICATION

Based on PHASE D specification and consolidation analysis:

### Lineage Authority Interface

```typescript
interface LineageAuthority {
  // DAG Validation
  validateDAG(parentIds: string[], childId: string): boolean;
  
  // Cycle Detection
  detectCycle(nodes: string[], edges: [string, string][]): boolean;
  detectCyclePath(nodes: string[], edges: [string, string][]): string[] | null;
  
  // Graph Fingerprinting
  fingerprintGraph(nodes: string[], edges: [string, string][]): string;
  
  // Invariant Verification
  verifyInvariantGraph(declaredNodes: string[], declaredEdges: [string, string][]): {
    valid: boolean;
    invariant_graph_fingerprint: string;
  };
  
  // Required Edges
  REQUIRED_EDGES: [string, string][];
  
  // Forbidden Edges
  FORBIDDEN_EDGES: [string, string][];
  
  // Invariant Nodes
  INVARIANT_NODES: Record<string, string>;
}
```

### Invariant Topology

**INVARIANT_NODES:**
```typescript
const INVARIANT_NODES = {
  SNAPSHOT_VERIFIED: "SNAPSHOT_VERIFIED",
  SCHEDULER_BOUND: "SCHEDULER_BOUND",
  RUNTIME_ISOLATED: "RUNTIME_ISOLATED",
  ENTROPY_ENFORCED: "ENTROPY_ENFORCED",
  CONTRACT_VALIDATED: "CONTRACT_VALIDATED",
  ARTIFACT_BOUND: "ARTIFACT_BOUND",
  FINGERPRINT_BOUND: "FINGERPRINT_BOUND",
  AUTHORITY_BOUNDARY_ENCLOSED: "AUTHORITY_BOUNDARY_ENCLOSED",
  CI_DOMAIN_LOCK_ENFORCED: "CI_DOMAIN_LOCK_ENFORCED"
};
```

**REQUIRED_EDGES:**
```typescript
const REQUIRED_EDGES = [
  ["SNAPSHOT_VERIFIED", "SCHEDULER_BOUND"],
  ["SCHEDULER_BOUND", "RUNTIME_ISOLATED"],
  ["RUNTIME_ISOLATED", "ENTROPY_ENFORCED"],
  ["ENTROPY_ENFORCED", "CONTRACT_VALIDATED"],
  ["CONTRACT_VALIDATED", "ARTIFACT_BOUND"],
  ["ARTIFACT_BOUND", "FINGERPRINT_BOUND"],
  ["FINGERPRINT_BOUND", "AUTHORITY_BOUNDARY_ENCLOSED"],
  ["AUTHORITY_BOUNDARY_ENCLOSED", "CI_DOMAIN_LOCK_ENFORCED"]
];
```

**FORBIDDEN_EDGES:**
```typescript
const FORBIDDEN_EDGES = [
  ["SNAPSHOT_VERIFIED", "ARTIFACT_BOUND"],
  ["SCHEDULER_BOUND", "ARTIFACT_BOUND"],
  ["RUNTIME_ISOLATED", "FINGERPRINT_BOUND"],
  ["CONTRACT_VALIDATED", "CI_DOMAIN_LOCK_ENFORCED"],
  ["SNAPSHOT_VERIFIED", "RUNTIME_ISOLATED"]
];
```

### Backward Compatibility

**TRANSITION STRATEGY:**
1. Maintain existing `dag_validator.ts` interface for backward compatibility
2. Add full cycle detection as enhancement
3. Add graph fingerprinting as enhancement
4. Add invariant verification as enhancement
5. Deprecate shallow validation over time

---

## CONCLUSION

### LINEAGE AUTHORITY CONSOLIDATION STATUS: **REQUIRED**

**Rationale:**
- Multiple lineage systems exist
- CRX runtime implementation lacks full cycle detection
- CRX runtime implementation lacks graph fingerprinting
- CRX runtime implementation lacks invariant topology binding
- JS.txt archive has complete lineage validation implementation
- No single canonical lineage authority

### IMPLICATIONS

1. **ONE lineage authority required** — formal_invariant_graph_verifier.js
2. **ONE cycle detection method required** — DFS-based full cycle detection
3. **ONE graph fingerprinting method required** — deterministic graph fingerprinting
4. **ONE invariant topology required** — INVARIANT_NODES, REQUIRED_EDGES, FORBIDDEN_EDGES
5. **NO duplicate lineage systems** — consolidate all implementations
6. **NO shallow DAG validation** — enforce full cycle detection

### RECOMMENDATION

**PROCEED WITH LINEAGE AUTHORITY CONSOLIDATION:**
1. Extract `formal_invariant_graph_verifier.js` from JS.txt archive
2. Adapt to CRX runtime (TypeScript conversion if needed)
3. Replace `dag_validator.ts` with consolidated lineage authority
4. Extract `structural_graph_builder.js` for structural identity
5. Extract `snapshot_lineage_integrity_guard.js` for snapshot lineage
6. Implement full cycle detection for all lineage validation
7. Implement graph fingerprinting for all lineage validation
8. Implement invariant topology binding for replay verification

---

## NEXT STEPS

Proceed to **PHASE E: Replay Kernel Stabilization**
- Establish replay as center of gravity
- Consolidate `deterministic_replay_harness.js` (JS.txt) as replay authority
- Establish ONE canonical replay authority
- Eliminate competing replay semantics

---

**Report Generated:** 2025-01-08
**Status:** LINEAGE AUTHORITY CONSOLIDATION COMPLETE — CONSOLIDATION REQUIRED
