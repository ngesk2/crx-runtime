# AUTHORITY INVENTORY
**Audit Date:** 2026-06-21
**Audit Type:** Constitutional Authority Consolidation
**Purpose:** Identify all authority implementations to establish monoculture

---

## EXECUTIVE SUMMARY

**Current State:** Authority fragmentation exists across multiple implementations.

**Violations Found:**
- 1 duplicate canonicalization wrapper
- 1 duplicate hash authority (Node.js crypto)
- 1 duplicate lineage authority (direct database write)
- 2 application truth creation violations (Newsletter, RSS)
- 1 application serialization violation (Gateway)

**Total Violations:** 5

---

## AUTHORITY 1 — CANONICALIZATION

### Constitutional Authority (SOLE)

**File:** `runtime/replay/canonical_json.ts`
- **Implementation:** RFC-8785 JSON Canonicalization Scheme (JCS)
- **Status:** SOLE AUTHORITY
- **Constitutional Rule:** "This is the sole canonicalization authority. All other canonicalization must delegate to this implementation."
- **Dependencies:** None (pure TypeScript)

### Duplicate Wrapper

**File:** `runtime/kernel/commit-service/src/engines/canonical_engine.ts`
- **Implementation:** Wrapper that delegates to CanonicalJson
- **Status:** DUPLICATE (unnecessary indirection)
- **Code:**
  ```typescript
  import { CanonicalJson } from "@crx/replay";
  export function canonicalize(value: unknown): string {
    return CanonicalJson.canonicalize(value);
  }
  ```
- **Violation:** Creates duplicate canonicalization path
- **Action Required:** Remove wrapper, import CanonicalJson directly

### Application Violation

**File:** `gateway/server.js`
- **Implementation:** Uses JSON.stringify() (non-canonical)
- **Status:** VIOLATION
- **Code:** Line 151: `body: JSON.stringify(payload)`
- **Violation:** Non-canonical serialization
- **Action Required:** Replace with canonical serialization

---

## AUTHORITY 2 — HASH

### Constitutional Authority (SOLE)

**File:** `runtime/replay/certificate_authority.ts`
- **Implementation:** Pure TypeScript SHA-256 (NIST FIPS 180-4)
- **Status:** SOLE AUTHORITY
- **Constitutional Rule:** "This is the sole SHA-256 authority. All hash operations must route through this method."
- **Dependencies:** None (pure TypeScript)

### Derived Authority (CORRECT)

**File:** `runtime/replay/canonical_hash_authority.ts`
- **Implementation:** Delegates to CertificateAuthority.sha256
- **Status:** DERIVED (correctly delegates)
- **Code:**
  ```typescript
  private hashBytes(base64UrlBytes: string): string {
    const uint8Array = base64UrlDecode(base64UrlBytes);
    const string = utf8Decode(uint8Array);
    const hash = CertificateAuthority['sha256'](string);
    return `${this.hashAlgorithm}:${hash}`;
  }
  ```

### Derived Authority (CORRECT)

**File:** `runtime/replay/merkle_tree.ts`
- **Implementation:** Delegates to CertificateAuthority.sha256
- **Status:** DERIVED (correctly delegates)
- **Code:**
  ```typescript
  private hashBytes(bytes: Uint8Array, isLeaf: boolean = true): string {
    const prefix = isLeaf ? new Uint8Array([HASH_DOMAIN_LEAF]) : new Uint8Array([HASH_DOMAIN_PARENT]);
    const combined = concatBytes(prefix, bytes);
    const string = utf8Decode(combined);
    return CertificateAuthority.sha256(string);
  }
  ```

### Derived Authority (CORRECT)

**File:** `runtime/replay/witness_authority.ts`
- **Implementation:** Delegates to CertificateAuthority
- **Status:** DERIVED (correctly delegates)
- **Code:**
  ```typescript
  const constitutionalLawCommitment = CertificateAuthority.computeConstitutionalLawCommitment({...});
  ```

### Duplicate Authority (VIOLATION)

**File:** `runtime/kernel/commit-service/src/engines/identity_engine.ts`
- **Implementation:** Uses Node.js crypto.createHash directly
- **Status:** VIOLATION
- **Code:**
  ```typescript
  import crypto from "crypto"
  const hash = crypto
    .createHash("sha256")
    .update(serialized)
    .digest("hex")
  ```
- **Violations:**
  1. Duplicate hash authority
  2. Node.js dependency (not runtime-neutral)
  3. Bypasses constitutional authority
- **Action Required:** Remove file, use CertificateAuthority directly

---

## AUTHORITY 3 — REPLAY

### Constitutional Authority (SOLE)

**File:** `runtime/replay/deterministic_replay_engine.ts`
- **Implementation:** Deterministic replay engine
- **Status:** SOLE AUTHORITY
- **Dependencies:** CanonicalHashAuthority, ReplayStateMachine, WitnessAuthority

### Constitutional Authority (SOLE)

**File:** `runtime/replay/replay_state_machine.ts`
- **Implementation:** Replay state machine
- **Status:** SOLE AUTHORITY
- **Dependencies:** None (pure TypeScript)

### Constitutional Authority (SOLE)

**File:** `runtime/replay/replay_event_stream.ts`
- **Implementation:** Event stream for replay
- **Status:** SOLE AUTHORITY
- **Dependencies:** None

**Status:** Replay authority is sovereign. No violations found.

---

## AUTHORITY 4 — LINEAGE

### Constitutional Authority (SOLE)

**File:** `runtime/replay/replay_state_machine.ts`
- **Implementation:** Internal lineage tracking in artifact_lineage
- **Status:** SOLE AUTHORITY (internal to replay)
- **Code:**
  ```typescript
  state.artifacts.set(artifactId, {
    artifact_id: artifactId,
    artifact_hash: artifactHash,
    artifact_lineage: [...normalizedLineage]
  });
  ```

### Constitutional Authority (SOLE)

**File:** `runtime/replay/witness_authority.ts`
- **Implementation:** Lineage graph construction from state
- **Status:** SOLE AUTHORITY (derived from replay state)
- **Code:**
  ```typescript
  public buildLineageGraph(state: ReplayState): LineageGraph {
    const edges: any[] = [];
    for (const artifactId of sortedArtifactIds) {
      const artifactState = state.artifacts.get(artifactId);
      if (artifactState) {
        for (const parentId of artifactState.artifact_lineage) {
          edges.push({
            parent_id: parentId,
            child_id: artifactId,
            edge_type: 'derivation'
          });
        }
      }
    }
    return { edges, graph_version: '1.0' };
  }
  ```

### Duplicate Authority (VIOLATION)

**File:** `runtime/kernel/commit-service/src/persistence/lineage_store.ts`
- **Implementation:** Direct PostgreSQL INSERT
- **Status:** VIOLATION
- **Code:**
  ```typescript
  export async function storeLineage(parentIds: string[], childId: string) {
    for (const parent of parentIds) {
      await pool.query(
        `INSERT INTO lineage_edges(parent_id, child_id) VALUES ($1,$2)`,
        [parent, childId]
      )
    }
  }
  ```
- **Violations:**
  1. Duplicate lineage authority
  2. Direct database write (bypasses constitutional authority)
  3. Not replay-derived
- **Action Required:** Remove file, use replay kernel lineage system

---

## APPLICATION TRUTH CREATION VIOLATIONS

### Newsletter Worker

**File:** `brainos/newsletter/worker.py`
- **Implementation:** Uses Yahoo Message IDs as identity
- **Status:** VIOLATION
- **Code:**
  ```python
  if newsletter_exists(newsletter['message_id']):
  ```
- **Violation:** Independent identity generation (Yahoo Message ID)
- **Action Required:** Delegate to PING identity authority

### RSS Worker

**File:** `brainos/rss/worker.py`
- **Implementation:** Uses URLs as identity
- **Status:** VIOLATION
- **Code:**
  ```python
  if article_exists(article['url']):
  ```
- **Violation:** Independent identity generation (URL)
- **Action Required:** Delegate to PING identity authority

### Gateway

**File:** `gateway/server.js`
- **Implementation:** Uses JSON.stringify() for serialization
- **Status:** VIOLATION
- **Code:**
  ```javascript
  body: JSON.stringify(payload)
  ```
- **Violation:** Non-canonical serialization
- **Action Required:** Use canonical serialization

---

## CONSOLIDATION PLAN

### Phase 1: Remove Duplicate Canonicalization

**Action:** Remove `runtime/kernel/commit-service/src/engines/canonical_engine.ts`
- Update imports to use CanonicalJson directly
- Estimated effort: 1 hour

### Phase 2: Remove Duplicate Hash Authority

**Action:** Remove `runtime/kernel/commit-service/src/engines/identity_engine.ts`
- Update imports to use CertificateAuthority directly
- Estimated effort: 1 hour

### Phase 3: Remove Duplicate Lineage Authority

**Action:** Remove `runtime/kernel/commit-service/src/persistence/lineage_store.ts`
- Use replay kernel lineage system
- Estimated effort: 2 hours

### Phase 4: Fix Gateway Serialization

**Action:** Replace JSON.stringify() with canonical serialization
- **Status:** BLOCKED (architectural dependency)
- **Blocker:** Gateway is Node.js service without access to PING runtime
- **Required:** Either (a) make canonicalization authority available to gateway, or (b) gateway delegates to PING service
- **Estimated effort:** 4-8 hours (requires architectural decision)

### Phase 5: Fix Application Identity

**Action:** Newsletter and RSS workers delegate to PING identity authority
- **Status:** BLOCKED (architectural dependency)
- **Blocker:** Applications are Python workers without access to PING runtime
- **Required:** Either (a) make PING identity authority available to Python workers, or (b) workers delegate to PING service
- **Estimated effort:** 8-16 hours (requires architectural decision)

**Total Estimated Effort (completed):** 4 hours
**Total Estimated Effort (blocked):** 12-24 hours

---

## FINAL AUTHORITY MAP

### Canonicalization Authority
- **SOLE:** `runtime/replay/canonical_json.ts`
- **DERIVED:** None (after consolidation)
- **VIOLATIONS:** 0 (after consolidation)

### Hash Authority
- **SOLE:** `runtime/replay/certificate_authority.ts`
- **DERIVED:** `canonical_hash_authority.ts`, `merkle_tree.ts`, `witness_authority.ts`
- **VIOLATIONS:** 0 (after consolidation)

### Replay Authority
- **SOLE:** `runtime/replay/deterministic_replay_engine.ts`
- **DERIVED:** `replay_state_machine.ts`, `replay_event_stream.ts`
- **VIOLATIONS:** 0

### Lineage Authority
- **SOLE:** `runtime/replay/replay_state_machine.ts` (internal)
- **DERIVED:** `witness_authority.ts` (lineage graph)
- **VIOLATIONS:** 0 (after consolidation)

---

## CONCLUSION

**Current State:** 5 violations
**Target State:** 0 violations
**Estimated Effort:** 14 hours

The repository requires authority monoculture enforcement before thesis freeze.
