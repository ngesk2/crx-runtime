# AUTHORITY GRAPH

**Report Date:** 2026-06-19  
**Report Name:** AUTHORITY_GRAPH  
**Purpose:** Show every authority relationship in PING Runtime

---

# CONSTITUTIONAL AUTHORITY HIERARCHY

## PING Kernel (Constitutional Runtime)

```
PING Kernel
│
├── Identity Authority
│   ├── CertificateAuthority (SHA-256)
│   └── CanonicalHashAuthority
│       └── CanonicalJson (canonicalization)
│
├── Canonical Authority
│   └── CanonicalJson (canonicalization)
│
├── Lineage Authority
│   └── WitnessAuthority (lineage graph construction)
│
├── Replay Authority
│   ├── DeterministicReplayEngine
│   ├── ReplayStateMachine
│   └── ReplayEventStream
│
├── Witness Authority
│   ├── WitnessAuthority
│   ├── MerkleTree
│   └── CertificateAuthority (SHA-256)
│
└── Capability Authority
    ├── Budget Authority (NOT IMPLEMENTED)
    ├── Rate Limiting (NOT IMPLEMENTED)
    └── Capability Checks (NOT IMPLEMENTED)
```

---

# CURRENT AUTHORITY IMPLEMENTATION

## Constitutional Authorities (Implemented)

### 1. Identity Authority

**Status:** PARTIAL - Constitutional runtime implements, commit-service bypasses

**Constitutional Implementation:**
- File: `runtime/replay/certificate_authority.ts`
- Authority: CertificateAuthority
- Function: SHA-256 hash generation
- Constitutional Rule: Sole SHA-256 authority

**Non-Constitutional Implementation:**
- File: `runtime/kernel/commit-service/src/engines/identity_engine.ts`
- Authority: Node.js crypto
- Function: SHA-256 hash generation
- Violation: Bypasses constitutional CertificateAuthority

**Authority Relationship:**
```
CertificateAuthority (constitutional)
    ↓ (delegates to)
CanonicalHashAuthority
    ↓ (delegates to)
CanonicalJson
```

**Bypass Relationship:**
```
Node.js crypto (non-constitutional)
    ↓ (bypasses)
CertificateAuthority (constitutional)
```

---

### 2. Canonical Authority

**Status:** CONSTITUTIONAL

**Implementation:**
- File: `runtime/replay/canonical_json.ts`
- Authority: CanonicalJson
- Function: Object canonicalization
- Constitutional Rule: Sole canonicalization authority

**Authority Relationship:**
```
CanonicalJson (constitutional)
    ↓ (used by)
CanonicalHashAuthority
    ↓ (used by)
WitnessAuthority
```

---

### 3. Lineage Authority

**Status:** CONSTITUTIONAL

**Implementation:**
- File: `runtime/replay/witness_authority.ts`
- Authority: WitnessAuthority
- Function: Lineage graph construction
- Constitutional Rule: Deterministic lineage derivation

**Non-Constitutional Implementation:**
- File: `runtime/kernel/commit-service/src/persistence/lineage_store.ts`
- Authority: PostgreSQL
- Function: Lineage storage
- Violation: Direct PostgreSQL access bypasses constitutional authority

**Authority Relationship:**
```
WitnessAuthority (constitutional)
    ↓ (builds)
LineageGraph
    ↓ (stored in)
PostgreSQL (non-constitutional storage)
```

**Bypass Relationship:**
```
PostgreSQL (non-constitutional)
    ↓ (bypasses)
WitnessAuthority (constitutional)
```

---

### 4. Replay Authority

**Status:** CONSTITUTIONAL

**Implementation:**
- File: `runtime/replay/deterministic_replay_engine.ts`
- Authority: DeterministicReplayEngine
- Function: Deterministic replay execution
- Constitutional Rule: Sole replay authority

**Components:**
- ReplayStateMachine (state transitions)
- ReplayEventStream (event streaming)
- InvariantRunner (invariant verification)

**Authority Relationship:**
```
DeterministicReplayEngine (constitutional)
    ├── uses → ReplayStateMachine
    ├── uses → ReplayEventStream
    ├── uses → CanonicalHashAuthority
    └── uses → WitnessAuthority
```

---

### 5. Witness Authority

**Status:** CONSTITUTIONAL

**Implementation:**
- File: `runtime/replay/witness_authority.ts`
- Authority: WitnessAuthority
- Function: Witness root generation
- Constitutional Rule: Sole witness authority

**Components:**
- MerkleTree (Merkle tree construction)
- CertificateAuthority (SHA-256)
- CanonicalJson (canonicalization)

**Authority Relationship:**
```
WitnessAuthority (constitutional)
    ├── uses → MerkleTree
    ├── uses → CertificateAuthority
    └── uses → CanonicalJson
```

---

### 6. Event Authority

**Status:** PARTIAL - Constitutional runtime implements, commit-service bypasses

**Constitutional Implementation:**
- File: `runtime/replay/replay_event_stream.ts`
- Authority: ReplayEventStream
- Function: Event stream management
- Constitutional Rule: Event-first ordering

**Non-Constitutional Implementation:**
- File: `runtime/kernel/commit-service/src/events/event_log.ts`
- Authority: PostgreSQL
- Function: Event storage
- Violation: Direct PostgreSQL access bypasses constitutional authority

**Authority Relationship:**
```
ReplayEventStream (constitutional)
    ↓ (manages)
CanonicalEventEnvelope
    ↓ (stored in)
PostgreSQL (non-constitutional storage)
```

**Bypass Relationship:**
```
PostgreSQL (non-constitutional)
    ↓ (bypasses)
ReplayEventStream (constitutional)
```

---

### 7. Persistence Authority

**Status:** NON-CONSTITUTIONAL

**Implementation:**
- File: `runtime/kernel/commit-service/src/persistence/db.ts`
- Authority: PostgreSQL
- Function: Direct database access
- Violation: No constitutional persistence authority

**Bypass Relationship:**
```
PostgreSQL (non-constitutional)
    ↓ (bypasses all constitutional authorities)
Identity Authority
Canonical Authority
Lineage Authority
Replay Authority
Witness Authority
Event Authority
```

---

# NON-IMPLEMENTED AUTHORITIES

## 1. Capability Authority

**Status:** NOT IMPLEMENTED

**Required Components:**
- Budget Authority
- Rate Limiting
- Capability Checks

**Missing Authority Relationships:**
```
Capability Authority (NOT IMPLEMENTED)
    ├── Budget Authority (NOT IMPLEMENTED)
    ├── Rate Limiting (NOT IMPLEMENTED)
    └── Capability Checks (NOT IMPLEMENTED)
```

---

## 2. Knowledge Authority

**Status:** NOT IMPLEMENTED

**Required Components:**
- Signal Authority
- Observation Authority
- Claim Authority
- Evidence Authority
- Knowledge Authority
- Recommendation Authority
- Action Authority

**Missing Authority Relationships:**
```
Knowledge Authority (NOT IMPLEMENTED)
    ├── Signal Authority (NOT IMPLEMENTED)
    ├── Observation Authority (NOT IMPLEMENTED)
    ├── Claim Authority (NOT IMPLEMENTED)
    ├── Evidence Authority (NOT IMPLEMENTED)
    ├── Knowledge Authority (NOT IMPLEMENTED)
    ├── Recommendation Authority (NOT IMPLEMENTED)
    └── Action Authority (NOT IMPLEMENTED)
```

---

## 3. Retrieval Authority

**Status:** NOT IMPLEMENTED

**Required Components:**
- Vector Authority
- Embedding Authority
- Search Authority

**Missing Authority Relationships:**
```
Retrieval Authority (NOT IMPLEMENTED)
    ├── Vector Authority (NOT IMPLEMENTED)
    ├── Embedding Authority (NOT IMPLEMENTED)
    └── Search Authority (NOT IMPLEMENTED)
```

---

## 4. Economic Authority

**Status:** NOT IMPLEMENTED

**Required Components:**
- Cost Authority
- Budget Authority
- ROI Authority

**Missing Authority Relationships:**
```
Economic Authority (NOT IMPLEMENTED)
    ├── Cost Authority (NOT IMPLEMENTED)
    ├── Budget Authority (NOT IMPLEMENTED)
    └── ROI Authority (NOT IMPLEMENTED)
```

---

## 5. Decision Authority

**Status:** NOT IMPLEMENTED

**Required Components:**
- Recommendation Authority
- Decision Authority
- Outcome Authority
- Improvement Authority

**Missing Authority Relationships:**
```
Decision Authority (NOT IMPLEMENTED)
    ├── Recommendation Authority (NOT IMPLEMENTED)
    ├── Decision Authority (NOT IMPLEMENTED)
    ├── Outcome Authority (NOT IMPLEMENTED)
    └── Improvement Authority (NOT IMPLEMENTED)
```

---

# AUTHORITY VIOLATIONS

## Direct Bypasses

### 1. Identity Authority Bypass

**Bypass:** Node.js crypto bypasses CertificateAuthority

**File:** `runtime/kernel/commit-service/src/engines/identity_engine.ts`

**Violation:**
```
Node.js crypto
    ↓ (bypasses)
CertificateAuthority (constitutional)
```

---

### 2. Persistence Authority Bypass

**Bypass:** Direct PostgreSQL access bypasses all constitutional authorities

**File:** `runtime/kernel/commit-service/src/persistence/db.ts`

**Violation:**
```
PostgreSQL
    ↓ (bypasses)
All Constitutional Authorities
```

---

### 3. Event Authority Bypass

**Bypass:** Direct PostgreSQL INSERT bypasses ReplayEventStream

**File:** `runtime/kernel/commit-service/src/events/event_log.ts`

**Violation:**
```
PostgreSQL
    ↓ (bypasses)
ReplayEventStream (constitutional)
```

---

### 4. Lineage Authority Bypass

**Bypass:** Direct PostgreSQL INSERT bypasses WitnessAuthority

**File:** `runtime/kernel/commit-service/src/persistence/lineage_store.ts`

**Violation:**
```
PostgreSQL
    ↓ (bypasses)
WitnessAuthority (constitutional)
```

---

### 5. Artifact Authority Bypass

**Bypass:** Direct PostgreSQL INSERT bypasses constitutional artifact authority

**File:** `runtime/kernel/commit-service/src/persistence/artifact_store.ts`

**Violation:**
```
PostgreSQL
    ↓ (bypasses)
Constitutional Artifact Authority (not implemented)
```

---

# AUTHORITY DEPENDENCY GRAPH

## Constitutional Dependencies

```
CertificateAuthority (constitutional)
    ↓ (provides SHA-256 to)
CanonicalHashAuthority
    ↓ (provides fingerprint to)
WitnessAuthority
    ↓ (provides witness root to)
DeterministicReplayEngine
    ↓ (provides replay result to)
ReplayCertificate
```

```
CanonicalJson (constitutional)
    ↓ (provides canonicalization to)
CanonicalHashAuthority
    ↓ (provides canonical bytes to)
WitnessAuthority
    ↓ (provides canonical bytes to)
DeterministicReplayEngine
```

```
ReplayEventStream (constitutional)
    ↓ (provides events to)
DeterministicReplayEngine
    ↓ (provides events to)
ReplayStateMachine
    ↓ (provides state to)
WitnessAuthority
```

---

## Non-Constitutional Dependencies

```
PostgreSQL (non-constitutional)
    ↓ (stores)
Event Log
    ↓ (stores)
Artifacts
    ↓ (stores)
Lineage
```

```
Node.js crypto (non-constitutional)
    ↓ (provides SHA-256 to)
identity_engine
    ↓ (provides artifact ID to)
commit_controller
    ↓ (stores in)
PostgreSQL
```

---

# AUTHORITY FLOW DIAGRAMS

## Constitutional Flow (Correct)

```
Event Creation
    ↓
ReplayEventStream (constitutional)
    ↓
DeterministicReplayEngine (constitutional)
    ↓
ReplayStateMachine (constitutional)
    ↓
WitnessAuthority (constitutional)
    ↓
CertificateAuthority (constitutional)
    ↓
ReplayCertificate
```

## Non-Constitutional Flow (Incorrect)

```
State Mutation
    ↓
PostgreSQL (non-constitutional)
    ↓
Event Creation (after mutation)
    ↓
PostgreSQL (non-constitutional)
```

---

# AUTHORITY SUMMARY

## Constitutional Authorities (7)

1. **Identity Authority** - CertificateAuthority (PARTIAL - bypassed by commit-service)
2. **Canonical Authority** - CanonicalJson (CONSTITUTIONAL)
3. **Lineage Authority** - WitnessAuthority (PARTIAL - storage bypassed)
4. **Replay Authority** - DeterministicReplayEngine (CONSTITUTIONAL)
5. **Witness Authority** - WitnessAuthority (CONSTITUTIONAL)
6. **Event Authority** - ReplayEventStream (PARTIAL - storage bypassed)
7. **Persistence Authority** - NOT IMPLEMENTED

## Non-Implemented Authorities (5)

1. **Capability Authority** - NOT IMPLEMENTED
2. **Knowledge Authority** - NOT IMPLEMENTED
3. **Retrieval Authority** - NOT IMPLEMENTED
4. **Economic Authority** - NOT IMPLEMENTED
5. **Decision Authority** - NOT IMPLEMENTED

## Authority Bypasses (5)

1. **Identity Authority Bypass** - Node.js crypto
2. **Persistence Authority Bypass** - Direct PostgreSQL
3. **Event Authority Bypass** - Direct PostgreSQL
4. **Lineage Authority Bypass** - Direct PostgreSQL
5. **Artifact Authority Bypass** - Direct PostgreSQL

---

# CONCLUSION

**Constitutional Authorities:** 7 (5 constitutional, 2 partial)
**Non-Implemented Authorities:** 5
**Authority Bypasses:** 5

**Overall Authority Status:** FAIL - Multiple authority bypasses and missing authorities

**Critical Issue:** PostgreSQL is non-constitutional authority that bypasses all constitutional authorities

**Remediation Priority:** CRITICAL - Remove all authority bypasses

---

# Next Step

**Deliverable 3: Migration Roadmap**
