# Phase 11.1 Remaining Boundary Violations

## Issue 1: RetryAuthority owns failure semantics

**Status:** ⚠️ VIOLATION

**Location:** `retry_authority.js:132-138`

**Current Implementation:**
```javascript
// Check if failure is retryable based on FailureAuthority classification
if (!failureClassification.retryable) {
  return {
    should_retry: false,
    reason: 'failure_not_retryable',
    failure_category: failureClassification.category,
    severity: failureClassification.severity
  };
}
```

**Problem:** RetryAuthority interprets `failureClassification.retryable` to make retry decisions. This means RetryAuthority understands failure semantics.

**Expected Behavior:**
- RetryAuthority should only evaluate: attempt count, retry policy, backoff schedule
- RetryAuthority should never interpret failure meaning
- RetryAuthority becomes policy-only, not semantic-aware

**Pipeline Should Be:**
```
FailureAuthority
    ↓
FailureClassification (complete immutable)
    ↓
RetryAuthority (policy evaluation only)
    ↓
RetryDecision
```

**Severity:** HIGH

**Fix Required:**
- Remove `failureClassification.retryable` check from RetryAuthority
- RetryAuthority should accept a simple "allow retry" flag from caller
- Caller (ExecutionAuthority) should make semantic decisions based on FailureClassification

---

## Issue 2: FailureAuthority depends on WitnessAuthority

**Status:** ⚠️ VIOLATION

**Location:** `runtime_failure_authority.js:105-109`

**Current Implementation:**
```javascript
const { witnessAuthority } = require('./witness_authority');
failureRecord.witness_hash = witnessAuthority.createWitness(failureEnvelope, {
  authority: 'RuntimeFailureAuthority',
  authority_version: '11.0.0'
}).witness_metadata.hash;
```

**Problem:** FailureAuthority directly creates witnesses via WitnessAuthority. This introduces reverse authority coupling.

**Expected Behavior:**
- FailureAuthority produces constitutional FailureRecord only
- Witness creation belongs exclusively to WitnessAuthority
- ExecutionAuthority should coordinate witness creation

**Pipeline Should Be:**
```
FailureAuthority
    ↓
FailureRecord
    ↓
ExecutionAuthority
    ↓
WitnessAuthority
```

**Severity:** HIGH

**Fix Required:**
- Remove WitnessAuthority import from FailureAuthority
- Remove witness creation from FailureAuthority
- FailureRecord should not contain witness_hash
- ExecutionAuthority should request witness creation for FailureRecord

---

## Issue 3: FailureAuthority depends on SerializerAuthority

**Status:** ⚠️ VIOLATION

**Location:** `runtime_failure_authority.js:1,31,160-162`

**Current Implementation:**
```javascript
const { serializerAuthority } = require('./serializer_authority');
this._serializer = serializerAuthority.getSerializer();

// In _generateFailureId:
const hash = this._serializer.serializeAndHash(failureData);
```

**Problem:** FailureAuthority delegates hashing to SerializerAuthority. Phase 11.1 defines WitnessAuthority as the constitutional owner of canonical serialization and hashing.

**Expected Behavior:**
- FailureAuthority generates only constitutional FailureRecord objects
- Hash generation belongs to WitnessAuthority
- FailureRecord should not contain pre-computed hashes

**Severity:** HIGH

**Fix Required:**
- Remove SerializerAuthority import from FailureAuthority
- Remove serialization from FailureAuthority
- FailureRecord should be plain constitutional data
- WitnessAuthority computes hashes when creating witnesses

---

## Issue 4: ConstitutionalResult does not exist

**Status:** ⚠️ VIOLATION

**Location:** N/A (missing definition)

**Problem:** No formal immutable ConstitutionalResult definition exists. Authorities return ad-hoc structures.

**Expected ConstitutionalResult Schema:**
```javascript
{
  authority_id: string,
  execution_id: string,
  inputs: Object,
  outputs: Object,
  canonical_artifacts: Array,
  events: Array,
  metrics: Object,
  lineage: Object,
  replay_inputs: Object,
  constitutional_version: string,
  authority_metadata: Object
}
```

**Requirements:**
- Every authority must return exactly the same structure
- No authority-specific return objects
- No inline ad-hoc structures
- Only constitutional information (no runtime state, no provider-specific objects, no JavaScript Errors, no transport data, no HTTP data, no infrastructure handles)

**Severity:** HIGH

**Fix Required:**
- Create formal ConstitutionalResult definition
- Document schema for all authority migrations
- Create validation helper for ConstitutionalResult

---

## Issue 5: WitnessAuthority delegates constitutional ownership

**Status:** ⚠️ VIOLATION

**Location:** `witness_authority.js:1,32,68-73`

**Current Implementation:**
```javascript
const { serializerAuthority } = require('./serializer_authority');
this._serializer = serializerAuthority.getSerializer();

// In createWitness:
const serialized = this._serializer.serialize(witnessWithoutHash);
const hash = this._serializer.hash(serialized);
```

**Problem:** WitnessAuthority delegates serialization and hashing to SerializerAuthority. Phase 11.1 defines WitnessAuthority as the sole constitutional owner of canonical serialization and hashing.

**Expected Behavior:**
- WitnessAuthority absorbs serialization responsibility
- WitnessAuthority absorbs hashing responsibility
- WitnessAuthority becomes sole owner of witness IDs, witness schema, witness versions

**Severity:** HIGH

**Fix Required:**
- Move serialization logic from SerializerAuthority to WitnessAuthority
- Move hashing logic from SerializerAuthority to WitnessAuthority
- WitnessAuthority becomes self-contained for constitutional operations

---

## Issue 6: VerificationAuthority consumes authority outputs

**Status:** ⚠️ VIOLATION

**Location:** `verification_authority.js:40-94`

**Current Implementation:**
```javascript
async verify(artifact) {
  // Verify chunk hashes (for VectorArtifact)
  if (artifact.artifact_type === 'VectorArtifact') {
    const chunkHashCheck = this._verifyChunkHashes(artifact);
    const dimensionCheck = this._verifyVectorDimensions(artifact);
    const providerCheck = this._verifyProviderIdentity(artifact);
  }

  // Verify canonical hash
  const canonicalCheck = this._verifyCanonicalHash(artifact);

  // Verify lineage
  const lineageCheck = this._verifyLineage(artifact);
}
```

**Problem:** VerificationAuthority validates artifacts and authority outputs directly. It should only consume witnesses.

**Expected Behavior:**
- VerificationAuthority should only verify witnesses
- VerificationAuthority should never inspect authority outputs
- VerificationAuthority should never validate raw artifacts

**Pipeline Should Be:**
```
ConstitutionalResult
    ↓
WitnessAuthority
    ↓
Witness
    ↓
VerificationAuthority
    ↓
VerificationResult
```

**Severity:** HIGH

**Fix Required:**
- Refactor VerificationAuthority to accept witnesses only
- Remove artifact validation logic
- Add witness verification logic
- VerificationAuthority becomes witness-only consumer

---

## Issue 7: ExecutionAuthority dependency audit

**Status:** ✅ CLEAN (partially)

**Location:** `execution_authority.js:26-35`

**Current Implementation:**
```javascript
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { deterministicIdAuthority } = require('./deterministic_id_authority');
const { witnessAuthority } = require('./witness_authority');

constructor(postgresPool, authorityRegistry, eventAuthority) {
  this._witnessAuthority = witnessAuthority;
  // ...
}
```

**Analysis:**
- ✅ No serializerAuthority dependency (removed in Phase 11.6.1)
- ✅ No hashing logic (removed in Phase 11.6.1)
- ✅ No witness generation logic (removed in Phase 11.6.1)
- ✅ No canonical formatting logic (removed in Phase 11.6.1)
- ⚠️ Still depends on WitnessAuthority (acceptable for coordination)

**Remaining Concern:**
- ExecutionAuthority forwards ConstitutionalResult to WitnessAuthority
- This is acceptable coordination, not violation
- ExecutionAuthority does not construct constitutional data

**Severity:** LOW (acceptable coordination)

**Fix Required:**
- None (current implementation is correct)

---

## Issue 8: Reverse authority imports

**Status:** ⚠️ MULTIPLE VIOLATIONS

**Summary:**
- FailureAuthority → WitnessAuthority (reverse coupling)
- RetryAuthority → WitnessAuthority (reverse coupling)
- LineageAuthority → WitnessAuthority (reverse coupling)
- WitnessAuthority → SerializerAuthority (delegation)
- RetryAuthority → SerializerAuthority (dead import?)
- LineageAuthority → SerializerAuthority (delegation)

**Problem:** Foundational authorities import each other, creating coupling and circular dependencies.

**Expected Behavior:**
- Foundational authorities should not import each other
- Dependencies should flow through ExecutionAuthority
- WitnessAuthority should absorb all constitutional operations

**Severity:** HIGH

**Fix Required:**
- Remove all authority-to-authority imports
- WitnessAuthority absorbs serialization and hashing
- ExecutionAuthority coordinates all witness creation
- FailureAuthority, RetryAuthority, LineageAuthority produce constitutional data only

---

## Summary

### Critical Violations (Must Fix Before Phase 11.2)
1. FailureAuthority → WitnessAuthority (reverse coupling)
2. FailureAuthority → SerializerAuthority (delegation)
3. RetryAuthority → WitnessAuthority (reverse coupling)
4. RetryAuthority → SerializerAuthority (delegation)
5. LineageAuthority → SerializerAuthority (delegation)
6. WitnessAuthority → SerializerAuthority (delegation)
7. VerificationAuthority consumes artifacts instead of witnesses
8. ConstitutionalResult definition missing

### Acceptable Coordination
- ExecutionAuthority → WitnessAuthority (coordination, not violation)

### Dead Code
- RetryAuthority → SerializerAuthority (imported but not used)

---

## Fix Priority Order

1. **Create ConstitutionalResult definition** (foundational)
2. **WitnessAuthority absorbs serialization/hashing** (enables other fixes)
3. **Remove FailureAuthority witness creation** (reverse coupling)
4. **Remove FailureAuthority serialization** (delegation)
5. **Remove RetryAuthority witness creation** (reverse coupling)
6. **Remove RetryAuthority serialization** (delegation)
7. **Remove LineageAuthority serialization** (delegation)
8. **Refactor VerificationAuthority to witness-only** (consumer fix)
9. **Remove RetryAuthority failure semantics** (policy-only fix)
