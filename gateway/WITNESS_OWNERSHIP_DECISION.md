# Witness Ownership Decision

## Executive Summary

**WitnessAuthority owns witness semantics. SerializerAuthority owns serialization primitive.**

This separation is architecturally sound and should be maintained.

---

## Repository Evidence

### WitnessAuthority Current Implementation

**File:** `witness_authority.js`

**Constructor:**
```javascript
constructor() {
  this._serializer = serializerAuthority.getSerializer();
  this._authorityId = this._generateAuthorityId();
  this._constitutionalVersion = '11.0.0';
  this._witnessHistory = new Map(); // witness_id → witness
}
```

**Key Methods:**
```javascript
createWitness(witnessData, options = {}) {
  // Creates witness without hash field
  // Computes hash via serializer
  // Generates witness ID via serializer
  // Stores witness in history
  // Returns witness with hash attached
}

createWitnessFromConstitutionalResult(conststitutionalResult) {
  // Extracts fields from ConstitutionalResult
  // Delegates to createWitness()
}

_generateWitnessId(witness) {
  // Generates ID via serializer
}

verifyWitness(witness) {
  // Verifies witness hash
}
```

---

## Responsibility Analysis

### Responsibility 1: Witness Schema

**Current Owner:** WitnessAuthority

**Evidence:**
```javascript
createWitness(witnessData, options = {}) {
  const witness = {
    ...witnessData,
    authority: options.authority || 'unknown',
    authority_version: options.authority_version || '11.0.0',
    witness_metadata: {
      created_by: options.authority || 'WitnessAuthority',
      frozen: true,
      hash: null,
      constitutional_version: this._constitutionalVersion
    }
  };
}
```

**Decision:** WitnessAuthority

**Reasoning:**
- WitnessAuthority defines witness structure
- WitnessAuthority owns witness metadata schema
- WitnessAuthority owns constitutional versioning
- WitnessAuthority owns frozen/immutable semantics

---

### Responsibility 2: Canonical Witness Creation

**Current Owner:** WitnessAuthority

**Evidence:**
```javascript
createWitness(witnessData, options = {}) {
  // Creates witness without hash field
  // Attaches hash afterwards
  // Stores witness in history
  return witness;
}
```

**Decision:** WitnessAuthority

**Reasoning:**
- WitnessAuthority owns witness creation logic
- WitnessAuthority enforces witness creation rules (hash computed without hash field)
- WitnessAuthority owns witness history management
- WitnessAuthority owns witness lifecycle

---

### Responsibility 3: Witness Versioning

**Current Owner:** WitnessAuthority

**Evidence:**
```javascript
constructor() {
  this._constitutionalVersion = '11.0.0';
}

createWitness(witnessData, options = {}) {
  witness_metadata: {
    constitutional_version: this._constitutionalVersion
  }
}
```

**Decision:** WitnessAuthority

**Reasoning:**
- WitnessAuthority owns constitutional version
- WitnessAuthority owns authority version
- WitnessAuthority owns witness versioning strategy
- WitnessAuthority owns version compatibility

---

### Responsibility 4: Witness Hashing

**Current Owner:** WitnessAuthority (delegates to SerializerAuthority)

**Evidence:**
```javascript
createWitness(witnessData, options = {}) {
  // Compute hash WITHOUT the hash field
  const witnessForHash = { ...witness };
  delete witnessForHash.witness_metadata.hash;
  
  // Attach hash afterwards
  witness.witness_metadata.hash = this._serializer.serializeAndHash(witnessForHash);
}
```

**Decision:** WitnessAuthority (delegates to SerializerAuthority)

**Reasoning:**
- WitnessAuthority owns witness hashing logic (hash computed without hash field)
- WitnessAuthority delegates serialization/hashing to SerializerAuthority (constitutional primitive)
- This separation is valid: semantic ownership vs primitive ownership
- WitnessAuthority owns WHEN to hash, SerializerAuthority owns HOW to hash

---

### Responsibility 5: Canonical Serialization

**Current Owner:** SerializerAuthority

**Evidence:**
```javascript
// WitnessAuthority:
this._serializer = serializerAuthority.getSerializer();
witness.witness_metadata.hash = this._serializer.serializeAndHash(witnessForHash);

// SerializerAuthority:
serializeAndHash(obj) {
  return this._serializer.serializeAndHash(obj);
}
```

**Decision:** SerializerAuthority

**Reasoning:**
- SerializerAuthority owns CanonicalSerializer
- SerializerAuthority owns serialization algorithm
- SerializerAuthority provides versioning (getVersion, getSerializerId)
- SerializerAuthority prevents drift (design intent)
- Multiple authorities depend on SerializerAuthority (Witness, Failure, Lineage)
- SerializerAuthority is Layer 0 constitutional primitive

---

### Responsibility 6: Canonical IDs

**Current Owner:** WitnessAuthority (delegates to SerializerAuthority)

**Evidence:**
```javascript
_generateWitnessId(witness) {
  const witnessData = {
    authority: witness.authority,
    execution_id: witness.execution_id,
    input_hash: witness.input_hash,
    output_hash: witness.output_hash
  };
  const hash = this._serializer.serializeAndHash(witnessData);
  return `witness_${hash.substring(0, 16)}`;
}
```

**Decision:** WitnessAuthority (delegates to SerializerAuthority)

**Reasoning:**
- WitnessAuthority owns witness ID generation logic (what data to include)
- WitnessAuthority delegates serialization/hashing to SerializerAuthority (constitutional primitive)
- This separation is valid: semantic ownership vs primitive ownership
- WitnessAuthority owns ID format, SerializerAuthority owns hash computation

---

### Responsibility 7: Replay Metadata

**Current Owner:** WitnessAuthority

**Evidence:**
```javascript
constructor() {
  this._witnessHistory = new Map(); // witness_id → witness
}

createWitness(witnessData, options = {}) {
  const witnessId = this._generateWitnessId(witness);
  this._witnessHistory.set(witnessId, witness);
  witness.witness_id = witnessId;
  return witness;
}

getWitness(witnessId) {
  return this._witnessHistory.get(witnessId);
}
```

**Decision:** WitnessAuthority

**Reasoning:**
- WitnessAuthority owns witness history (runtime cache)
- WitnessAuthority owns witness lookup
- WitnessAuthority owns witness lifecycle management
- Witness history is runtime cache, not constitutional storage

---

## Ownership Decision Matrix

| Responsibility | Owner | Evidence |
|----------------|-------|----------|
| Witness schema | WitnessAuthority | WitnessAuthority defines witness structure |
| Canonical witness creation | WitnessAuthority | WitnessAuthority owns createWitness() method |
| Witness versioning | WitnessAuthority | WitnessAuthority has _constitutionalVersion |
| Witness hashing | WitnessAuthority (delegates to SerializerAuthority) | WitnessAuthority owns hashing logic, delegates to SerializerAuthority |
| Canonical serialization | SerializerAuthority | SerializerAuthority owns CanonicalSerializer |
| Canonical IDs | WitnessAuthority (delegates to SerializerAuthority) | WitnessAuthority owns ID logic, delegates to SerializerAuthority |
| Replay metadata | WitnessAuthority | WitnessAuthority owns _witnessHistory map |

---

## Architectural Rationale

### Separation of Concerns

**Layer 0: Constitutional Primitives**
- SerializerAuthority: Deterministic serialization
- CanonicalTimeAuthority: Deterministic time
- DeterministicIdAuthority: Deterministic IDs

**Layer 1: Semantic Authorities**
- WitnessAuthority: Witness semantics
- FailureAuthority: Failure semantics
- LineageAuthority: Lineage semantics
- RetryAuthority: Retry semantics

**Layer 2: Execution Coordination**
- ExecutionAuthority: Execution coordination
- VerificationAuthority: Verification coordination

### Dependency Flow
```
Layer 2 (Execution)
    ↓
Layer 1 (Semantic)
    ↓
Layer 0 (Primitives)
```

### Why This Separation is Valid

1. **Semantic vs Primitive Ownership**
   - WitnessAuthority owns witness semantics (schema, creation, versioning)
   - SerializerAuthority owns serialization primitive (algorithm, versioning, drift prevention)

2. **Delegation is Not Violation**
   - WitnessAuthority delegates serialization to SerializerAuthority
   - This is valid: semantic authority uses primitive authority
   - Similar to: RetryAuthority uses ConstitutionalTimeAuthority for timestamps

3. **Multiple Dependencies**
   - Multiple semantic authorities depend on SerializerAuthority
   - This is valid: primitive is shared resource
   - Similar to: Multiple authorities use DeterministicIdAuthority

4. **Versioning Support**
   - SerializerAuthority provides versioning (getVersion, getSerializerId)
   - WitnessAuthority provides versioning (_constitutionalVersion)
   - This is valid: both layers have versioning for different purposes

5. **Drift Prevention**
   - SerializerAuthority prevents serializer drift (design intent)
   - WitnessAuthority prevents witness drift (via schema enforcement)
   - This is valid: both layers prevent drift in their domains

---

## Alternative Architectures Considered

### Alternative 1: WitnessAuthority Absorbs Serialization

**Description:** WitnessAuthority absorbs all serialization logic from SerializerAuthority

**Pros:**
- Single authority for witness generation
- Fewer dependencies

**Cons:**
- Violates separation of concerns
- SerializerAuthority becomes obsolete
- Other authorities (Failure, Lineage) lose serialization primitive
- Monolithic authority

**Decision:** REJECTED

---

### Alternative 2: Each Authority Owns Serialization

**Description:** Each authority implements its own serialization

**Pros:**
- No dependencies between authorities

**Cons:**
- Serializer drift (each authority may implement differently)
- No versioning coordination
- Violates single authority principle
- Code duplication

**Decision:** REJECTED

---

### Alternative 3: Current Architecture (Recommended)

**Description:** SerializerAuthority as Layer 0 primitive, WitnessAuthority as Layer 1 semantic authority

**Pros:**
- Clear separation of concerns
- SerializerAuthority prevents drift
- WitnessAuthority owns witness semantics
- Multiple authorities can use SerializerAuthority
- Versioning support at both layers

**Cons:**
- Additional dependency layer

**Decision:** ACCEPTED

---

## Conclusion

**WitnessAuthority owns witness semantics. SerializerAuthority owns serialization primitive.**

**This separation is architecturally sound and should be maintained.**

**Key Principles:**
1. WitnessAuthority owns: witness schema, creation, versioning, history
2. SerializerAuthority owns: serialization algorithm, versioning, drift prevention
3. WitnessAuthority delegates serialization/hashing to SerializerAuthority (valid delegation)
4. This separation is semantic vs primitive ownership (valid architectural pattern)
5. Multiple authorities depend on SerializerAuthority (valid shared primitive)

**Recommendation:**
- Maintain current architecture
- WitnessAuthority continues to delegate serialization to SerializerAuthority
- This separation is valid and should not be changed
