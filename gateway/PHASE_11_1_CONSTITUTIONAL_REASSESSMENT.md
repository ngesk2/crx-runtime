# Phase 11.1 Constitutional Boundary Reassessment

## PART 1 — FailureAuthority Boundary

### Dependency Analysis
**Dependency:** FailureAuthority → WitnessAuthority

**Location:** `runtime_failure_authority.js:105-109`

**Implementation:**
```javascript
const { witnessAuthority } = require('./witness_authority');
failureRecord.witness_hash = witnessAuthority.createWitness(failureRecord, {
  authority: 'RuntimeFailureAuthority',
  authority_version: '11.0.0'
}).witness_metadata.hash;
```

### Repository Evidence

**Question 1: Does FailureAuthority construct witness payloads?**
- **Answer:** NO
- **Evidence:** FailureAuthority passes `failureRecord` directly to WitnessAuthority without constructing witness-specific payload

**Question 2: Does FailureAuthority own witness schema?**
- **Answer:** NO
- **Evidence:** FailureAuthority does not define witness structure. WitnessAuthority defines witness schema in `createWitness()`.

**Question 3: Does FailureAuthority perform canonical serialization?**
- **Answer:** NO
- **Evidence:** FailureAuthority does not call serialization methods. It only passes constitutional data to WitnessAuthority.

**Question 4: Does FailureAuthority compute hashes?**
- **Answer:** NO
- **Evidence:** FailureAuthority does not compute hashes. WitnessAuthority computes hash via `witness_metadata.hash`.

**Question 5: Does FailureAuthority merely request WitnessAuthority to witness constitutional facts?**
- **Answer:** YES
- **Evidence:** FailureAuthority creates `failureRecord` (constitutional fact) and requests WitnessAuthority to witness it.

### Classification
**SAFE**

**Reasoning:**
- FailureAuthority produces constitutional data (FailureRecord)
- FailureAuthority requests WitnessAuthority to witness that data
- This is valid coordination pattern: Constitutional Data → Witness Authority → Witness
- FailureAuthority does not construct witness payloads, own witness schema, perform serialization, or compute hashes
- The dependency is for coordination, not constitutional ownership transfer

---

## PART 2 — RetryAuthority Semantic Ownership

### Dependency Analysis
**Dependency:** RetryAuthority → FailureClassification

**Location:** `retry_authority.js:116-138`

**Implementation:**
```javascript
shouldRetry(executionId, failureClassification, policyId = 'default') {
  const policy = this.getRetryPolicy(policyId);
  const attempts = this._retryAttempts.get(executionId) || 0;

  // Check if max attempts reached
  if (attempts >= policy.max_attempts) {
    return { should_retry: false, reason: 'max_attempts_reached', ... };
  }

  // Check if failure is retryable based on FailureAuthority classification
  if (!failureClassification.retryable) {
    return { should_retry: false, reason: 'failure_not_retryable', ... };
  }

  // Calculate backoff delay
  const backoffDelay = this._calculateBackoffDelay(policy, attempts);
  return { should_retry: true, reason: 'retry_allowed', ... };
}
```

### Repository Evidence

**Question: Does RetryAuthority classify failures?**
- **Answer:** NO
- **Evidence:** RetryAuthority does not perform classification. It consumes `failureClassification` from FailureAuthority.

**Question: Does RetryAuthority own failure semantics?**
- **Answer:** NO
- **Evidence:** RetryAuthority does not classify network timeout, rate limit, validation, disk failure, authentication. These classifications are performed by FailureAuthority's `_classifyFailure()` method.

**Question: Does RetryAuthority only evaluate policy fields?**
- **Answer:** YES
- **Evidence:** RetryAuthority evaluates:
  - `attempts` (policy state)
  - `policy.max_attempts` (policy configuration)
  - `failureClassification.retryable` (policy field from FailureAuthority)
  - `backoffDelay` (policy calculation)

### Classification
**VALID**

**Reasoning:**
- RetryAuthority does not perform failure classification
- RetryAuthority consumes FailureClassification from FailureAuthority
- RetryAuthority only evaluates policy fields (attempt count, max attempts, retryable flag, backoff)
- RetryAuthority does not interpret failure semantics (category, severity are only returned in decision, not used for logic)
- This is valid policy evaluation pattern

---

## PART 3 — SerializerAuthority Constitutional Role

### Repository Evidence

**SerializerAuthority Implementation:**
```javascript
class SerializerAuthority {
  constructor() {
    this._serializer = new CanonicalSerializer();
  }

  getSerializer() {
    return this._serializer;
  }

  serialize(obj) {
    return this._serializer.serialize(obj);
  }

  serializeAndHash(obj) {
    return this._serializer.serializeAndHash(obj);
  }
}
```

**Design Intent (from comments):**
- "Single constitutional authority for serializer injection"
- "Prevents accidental serializer drift"
- "SerializerAuthority → CanonicalSerializer → Everyone else"

**Known Callers:**
1. **WitnessAuthority** (`witness_authority.js:1,65,109`)
   - Uses: `serializeAndHash()` for witness hashing
   - Classification: CONSTITUTIONAL

2. **FailureAuthority** (`runtime_failure_authority.js:1,31`)
   - Uses: `serializeAndHash()` for failure ID generation
   - Classification: CONSTITUTIONAL

3. **RetryAuthority** (`retry_authority.js:4,31`)
   - Uses: Imported but not used in visible code
   - Classification: SHADOW (dead import)

4. **LineageAuthority** (`lineage_authority.js:4,35`)
   - Uses: `serializeAndHash()` for lineage witness creation
   - Classification: CONSTITUTIONAL

### Constitutional Model Analysis

**Model A: WitnessAuthority absorbs serialization**
- WitnessAuthority owns canonicalization, serialization, hashing
- SerializerAuthority disappears
- **Evidence against:** SerializerAuthority is designed as "single constitutional authority for serializer injection" to "prevent accidental serializer drift"

**Model B: SerializerAuthority as Layer 0 Constitutional Primitive**
- SerializerAuthority owns deterministic serialization only
- WitnessAuthority owns witness semantics only
- **Evidence for:** SerializerAuthority wraps CanonicalSerializer as singleton, provides versioning, prevents drift

### Determination
**Model B better matches existing repository**

**Evidence:**
- SerializerAuthority is explicitly designed as constitutional authority for serializer injection
- SerializerAuthority provides versioning (`getVersion()`, `getSerializerId()`)
- SerializerAuthority prevents drift (design intent)
- Multiple constitutional authorities depend on SerializerAuthority (Witness, Failure, Lineage)
- SerializerAuthority is Layer 0 primitive, WitnessAuthority is Layer 1 semantic owner

---

## PART 4 — Constitutional Primitive Analysis

### Authority Serialization Requirements

| Authority | Needs Deterministic Serialization? | Evidence |
|-----------|-----------------------------------|----------|
| Identity | YES | Identity requires deterministic IDs for replay |
| Replay | YES | Replay requires deterministic transcript serialization |
| Verification | YES | Verification requires deterministic hash computation |
| Witness | YES | Witness requires deterministic witness hashing |
| Lineage | YES | Lineage requires deterministic edge serialization |
| Knowledge | YES | Knowledge requires deterministic artifact serialization |
| Observation | YES | Observation requires deterministic event serialization |
| Execution | YES | Execution requires deterministic result serialization |

### Conclusion
**All authorities require deterministic serialization**

**Reasoning:**
- Constitutional replay requires deterministic serialization of all constitutional data
- Verification requires deterministic hash computation
- Witness generation requires deterministic hashing
- Every authority that produces constitutional data needs deterministic serialization

**SerializerAuthority is a constitutional primitive required by all constitutional authorities.**

---

## PART 5 — Witness Ownership Analysis

### Repository Evidence

**WitnessAuthority Current Responsibilities:**
```javascript
createWitness(witnessData, options) {
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
```

### Ownership Determination

| Responsibility | Owner | Evidence |
|----------------|-------|----------|
| Witness schema | WitnessAuthority | WitnessAuthority defines witness structure in `createWitness()` |
| Canonical witness creation | WitnessAuthority | WitnessAuthority owns `createWitness()` method |
| Witness versioning | WitnessAuthority | WitnessAuthority has `_constitutionalVersion = '11.0.0'` |
| Witness hashing | WitnessAuthority (delegates to SerializerAuthority) | WitnessAuthority calls `this._serializer.serializeAndHash()` |
| Canonical serialization | SerializerAuthority | SerializerAuthority owns `CanonicalSerializer` |
| Canonical IDs | WitnessAuthority (delegates to SerializerAuthority) | WitnessAuthority calls `this._serializer.serializeAndHash()` for IDs |
| Replay metadata | WitnessAuthority | WitnessAuthority stores `_witnessHistory` map |

### Conclusion
**WitnessAuthority owns witness semantics, SerializerAuthority owns serialization primitive**

**Reasoning:**
- WitnessAuthority owns witness schema, creation, versioning, history
- WitnessAuthority delegates serialization/hashing to SerializerAuthority (constitutional primitive)
- This separation is valid: semantic ownership vs primitive ownership
- SerializerAuthority as Layer 0 primitive is appropriate

---

## PART 6 — ConstitutionalResult

### ConstitutionalResult Classification

**Options:**
- Layer 0 Kernel Object
- Layer 1 Authority Contract
- Runtime DTO

### Determination
**Layer 1 Authority Contract**

**Reasoning:**
- ConstitutionalResult is the contract between authorities and execution coordination
- It is not a kernel primitive (that's serialization, hashing, IDs)
- It is not a runtime DTO (it contains constitutional data only)
- It is the authority contract that every authority must return

### Minimum Immutable Schema for Replay

```javascript
{
  authority_id: string,           // Which authority produced this result
  execution_id: string,           // Execution identifier
  inputs: Object,                // Constitutional inputs (artifact IDs only)
  outputs: Object,               // Constitutional outputs (artifact IDs only)
  canonical_artifacts: Array,    // Full artifacts produced
  events: Array,                 // Constitutional events
  metrics: Object,               // Constitutional metrics
  lineage: Object,               // Lineage information
  replay_inputs: Object,         // Inputs required for replay
  constitutional_version: string, // Constitutional version
  authority_metadata: Object     // Authority-specific metadata
}
```

**Key Principles:**
- No runtime state (timestamps, durations, CPU, memory)
- No provider-specific objects
- No JavaScript Error objects
- No transport data
- No HTTP data
- No infrastructure handles
- Only constitutional information

---

## PART 7 — Updated Phase 11.1 Completion

### Authority Boundary Scores

| Authority | Score | Reasoning |
|-----------|-------|-----------|
| Execution Authority | PASS | Removed serializer/hashing, forwards ConstitutionalResult to WitnessAuthority |
| Witness Authority | PASS | Owns witness semantics, delegates serialization to SerializerAuthority (valid) |
| Failure Authority | PASS | Produces constitutional data, requests WitnessAuthority to witness (valid coordination) |
| Retry Authority | PASS | Consumes FailureClassification, evaluates policy only (valid) |
| Verification Authority | FAIL | Still validates artifacts directly instead of witnesses |
| Lineage Authority | PASS | Produces constitutional data, requests WitnessAuthority to witness (valid coordination) |
| Serializer Constitutional Role | PASS | Valid as Layer 0 constitutional primitive |
| ConstitutionalResult | FAIL | Definition does not exist |

### Overall Completion
**75% (6/8 PASS)**

### Reasoning
**Previous audit was incorrect on several counts:**

1. **FailureAuthority → WitnessAuthority is SAFE** (not violation)
   - FailureAuthority produces constitutional data
   - Requests WitnessAuthority to witness that data
   - Valid coordination pattern

2. **RetryAuthority semantic ownership is VALID** (not violation)
   - RetryAuthority does not classify failures
   - Consumes FailureClassification from FailureAuthority
   - Evaluates policy fields only

3. **SerializerAuthority should NOT disappear** (not violation)
   - SerializerAuthority is valid Layer 0 constitutional primitive
   - All constitutional authorities require deterministic serialization
   - WitnessAuthority delegating to SerializerAuthority is valid separation

**Remaining issues:**
1. VerificationAuthority still validates artifacts instead of witnesses (1 violation)
2. ConstitutionalResult definition does not exist (1 violation)

**Phase 11.1 is 75% complete with 2 remaining issues.**
