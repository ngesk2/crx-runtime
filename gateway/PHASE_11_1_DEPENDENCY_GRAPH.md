# Phase 11.1 Authority Dependency Graph

## Current Authority Dependencies

### Foundational Authorities (Phase 11.x)

#### ExecutionAuthority
**Imports:**
- constitutionalTimeAuthority
- deterministicIdAuthority
- witnessAuthority

**Dependencies:**
- postgresPool (infrastructure)
- authorityRegistry (coordination)
- eventAuthority (events)

**Boundary Status:** ⚠️ DEPENDS ON WitnessAuthority (acceptable for coordination)

---

#### WitnessAuthority
**Imports:**
- serializerAuthority

**Dependencies:**
- None (singleton)

**Boundary Status:** ⚠️ DEPENDS ON SerializerAuthority (delegates serialization)

---

#### LineageAuthority
**Imports:**
- witnessAuthority
- serializerAuthority

**Dependencies:**
- postgresPool (infrastructure)
- eventAuthority (events)

**Boundary Status:** ⚠️ DEPENDS ON WitnessAuthority AND SerializerAuthority

---

#### RetryAuthority
**Imports:**
- constitutionalTimeAuthority
- deterministicIdAuthority
- witnessAuthority
- serializerAuthority

**Dependencies:**
- postgresPool (infrastructure)
- eventAuthority (events)

**Boundary Status:** ⚠️ DEPENDS ON WitnessAuthority AND SerializerAuthority

---

#### FailureAuthority (RuntimeFailureAuthority)
**Imports:**
- serializerAuthority

**Dependencies:**
- None (singleton)

**Boundary Status:** ⚠️ DEPENDS ON SerializerAuthority (delegates serialization)

---

#### VerificationAuthority
**Imports:**
- None (dependencies via constructor)

**Constructor Dependencies:**
- constitutionalTimeAuthority
- deterministicIdAuthority
- canonicalAuthority

**Boundary Status:** ✅ CLEAN (no direct imports, dependencies via constructor)

---

## Reverse Authority Coupling Issues

### Issue 1: FailureAuthority → WitnessAuthority
**Location:** `runtime_failure_authority.js:105-109`
```javascript
const { witnessAuthority } = require('./witness_authority');
failureRecord.witness_hash = witnessAuthority.createWitness(failureEnvelope, {
  authority: 'RuntimeFailureAuthority',
  authority_version: '11.0.0'
}).witness_metadata.hash;
```

**Violation:** FailureAuthority directly creates witnesses via WitnessAuthority
**Impact:** Reverse coupling between foundational authorities
**Severity:** HIGH

---

### Issue 2: FailureAuthority → SerializerAuthority
**Location:** `runtime_failure_authority.js:1,31`
```javascript
const { serializerAuthority } = require('./serializer_authority');
this._serializer = serializerAuthority.getSerializer();
```

**Usage:** Used for failure ID generation via serialization
**Violation:** FailureAuthority delegates hashing to SerializerAuthority
**Impact:** WitnessAuthority should own all constitutional hashing
**Severity:** HIGH

---

### Issue 3: RetryAuthority → SerializerAuthority
**Location:** `retry_authority.js:4,31`
```javascript
const { serializerAuthority } = require('./serializer_authority');
this._serializer = serializerAuthority.getSerializer();
```

**Usage:** Not currently used in visible code (dead import?)
**Violation:** RetryAuthority should not own serialization
**Impact:** Unclear dependency, potential future violation
**Severity:** MEDIUM

---

### Issue 4: RetryAuthority → WitnessAuthority
**Location:** `retry_authority.js:3,30`
```javascript
const { witnessAuthority } = require('./witness_authority');
this._witnessAuthority = witnessAuthority;
```

**Usage:** Creates retry witnesses
**Violation:** RetryAuthority directly creates witnesses
**Impact:** Witness creation should flow through ExecutionAuthority
**Severity:** HIGH

---

### Issue 5: LineageAuthority → SerializerAuthority
**Location:** `lineage_authority.js:4,35`
```javascript
const { serializerAuthority } = require('./serializer_authority');
this._serializer = serializerAuthority.getSerializer();
```

**Usage:** Used for lineage witness creation
**Violation:** LineageAuthority delegates serialization
**Impact:** WitnessAuthority should own all constitutional serialization
**Severity:** HIGH

---

### Issue 6: WitnessAuthority → SerializerAuthority
**Location:** `witness_authority.js:1,32`
```javascript
const { serializerAuthority } = require('./serializer_authority');
this._serializer = serializerAuthority.getSerializer();
```

**Usage:** Delegates serialization to SerializerAuthority
**Violation:** WitnessAuthority should absorb serialization responsibility
**Impact:** WitnessAuthority delegates constitutional ownership
**Severity:** HIGH

---

## Recommended Dependency Structure

### Clean Pipeline (Target State)

```
Authority (any)
    ↓
ConstitutionalResult
    ↓
ExecutionAuthority
    ↓
WitnessAuthority (sole owner of serialization, hashing, witness IDs)
    ↓
VerificationAuthority (consumes only witnesses)
```

### Authority Dependency Rules

1. **Foundational authorities should not import each other**
   - FailureAuthority should not import WitnessAuthority
   - RetryAuthority should not import WitnessAuthority
   - LineageAuthority should not import WitnessAuthority

2. **WitnessAuthority owns constitutional operations**
   - Serialization
   - Hashing
   - Witness IDs
   - Witness schema
   - Witness versions

3. **ExecutionAuthority coordinates only**
   - Invokes authorities
   - Forwards ConstitutionalResult
   - Delegates to WitnessAuthority
   - Never constructs constitutional data

4. **VerificationAuthority consumes only witnesses**
   - Never inspects authority outputs
   - Never validates raw artifacts
   - Only verifies witnesses

---

## Current vs Target Dependency Matrix

| Authority | Current Imports | Target Imports | Status |
|----------|----------------|----------------|--------|
| ExecutionAuthority | constitutionalTime, deterministicId, witness | constitutionalTime, deterministicId, witness | ✅ OK |
| WitnessAuthority | serializer | None (absorb) | ⚠️ VIOLATION |
| LineageAuthority | witness, serializer | witness | ⚠️ VIOLATION |
| RetryAuthority | constitutionalTime, deterministicId, witness, serializer | constitutionalTime, deterministicId | ⚠️ VIOLATION |
| FailureAuthority | serializer | None | ⚠️ VIOLATION |
| VerificationAuthority | None (constructor deps) | None (constructor deps) | ✅ OK |

---

## Cycles Detected

None detected in current foundational authority graph.

However, reverse coupling exists:
- FailureAuthority → WitnessAuthority (reverse)
- RetryAuthority → WitnessAuthority (reverse)
- LineageAuthority → WitnessAuthority (reverse)

All foundational authorities depend on WitnessAuthority, but WitnessAuthority depends on SerializerAuthority.

This creates indirect coupling through SerializerAuthority.
