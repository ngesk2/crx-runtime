# ConstitutionalResult Migration

## Objective

Document the migration plan for authorities to return ConstitutionalResult, including files modified, authorities migrated, replay equivalence proof, and witness equivalence proof.

---

## Migration Status

### Completed
- ✅ AUTHORITY_PROTOCOL_AUDIT.md - Authority audit complete
- ✅ LAYER_0_USAGE_REPORT.md - Layer 0 usage audit complete
- ✅ constitutional_result.js - ConstitutionalResult contract defined

### Pending
- ⏳ Authority migrations (10 authorities)
- ⏳ Layer 0 primitive migrations (30+ violations)
- ⏳ Replay equivalence verification
- ⏳ Witness equivalence verification

---

## Migration Plan

### Phase 1: Foundational Authorities (Priority 1)

#### 1.1 PromptAuthority Migration

**File:** `prompt_authority.js`

**Current Return Type:**
```javascript
{
  prompt_id: string,
  canonical_prompt: Object,
  canonical_bytes: Buffer,
  prompt_hash: string,
  authority_id: string,
  prompt_metadata: {...}
}
```

**Target Return Type:**
```javascript
ConstitutionalResult {
  authority_id: 'prompt-authority',
  execution_id: string,
  constitutional_version: '11.0.0',
  authority_version: '11.0.0',
  inputs: {
    prompt_data: {...}
  },
  outputs: {
    prompt_id: string,
    canonical_prompt: Object
  },
  replay_inputs: {
    prompt_data: {...}
  },
  artifact_ids: [prompt_id],
  metadata: {
    canonical_bytes: Buffer
  },
  status: 'success'
}
```

**Changes Required:**
1. Import ConstitutionalResult
2. Import IdentityAuthority (for ID generation)
3. Remove WitnessAuthority dependency
4. Remove SerializerAuthority dependency
5. Remove _generatePromptId method
6. Remove witness hash computation
7. Return ConstitutionalResult from canonicalizePrompt
8. Use IdentityAuthority for prompt_id generation

**Replay Equivalence:**
- Prompt data unchanged
- Canonical prompt structure unchanged
- Prompt ID generation becomes deterministic via IdentityAuthority
- Replay transcript before migration == replay transcript after migration

**Witness Equivalence:**
- Witness creation moved to WitnessAuthority
- Witness hash computed from same canonical prompt data
- Witness before migration == witness after migration

---

#### 1.2 ModelAuthority Migration

**File:** `model_authority.js`

**Current Return Type:**
```javascript
{
  model: {...},
  runtime_metadata: {...}
}
```

**Target Return Type:**
```javascript
ConstitutionalResult {
  authority_id: 'model-authority',
  execution_id: string,
  constitutional_version: '11.0.0',
  authority_version: '11.0.0',
  inputs: {
    model_data: {...}
  },
  outputs: {
    constitutional_model_id: string,
    model: {...}
  },
  replay_inputs: {
    model_data: {...}
  },
  artifact_ids: [constitutional_model_id],
  metadata: {
    runtime_metadata: {...}
  },
  status: 'success'
}
```

**Changes Required:**
1. Import ConstitutionalResult
2. Import IdentityAuthority (for ID generation)
3. Import ConstitutionalTimeAuthority (for timestamps)
4. Remove WitnessAuthority dependency
5. Remove SerializerAuthority dependency
6. Remove _generateConstitutionalModelId method
7. Remove witness hash computation
8. Replace Date.now() with ConstitutionalTimeAuthority.now()
9. Return ConstitutionalResult from registerModel
10. Use IdentityAuthority for constitutional_model_id generation

**Replay Equivalence:**
- Model data unchanged
- Model digest unchanged
- Model ID generation becomes deterministic via IdentityAuthority
- Runtime metadata separated from constitutional result
- Replay transcript before migration == replay transcript after migration

**Witness Equivalence:**
- Witness creation moved to WitnessAuthority
- Witness hash computed from same model data
- Witness before migration == witness after migration

---

#### 1.3 ArtifactAuthority Migration

**File:** `artifact_authority.js`

**Current Return Type:**
```javascript
{
  artifacts: [...],
  lineage: [...],
  witnesses: [...],
  certifications: [...],
  publications: [...],
  events: [...],
  infrastructure: [...]
}
```

**Target Return Type:**
```javascript
ConstitutionalResult {
  authority_id: 'artifact-authority',
  execution_id: string,
  constitutional_version: '11.0.0',
  authority_version: '11.0.0',
  inputs: {
    artifact_type: string,
    data: {...},
    parents: [...]
  },
  outputs: {
    artifact_id: string,
    artifact: {...}
  },
  replay_inputs: {
    artifact_type: string,
    data: {...},
    parents: [...]
  },
  artifact_ids: [artifact_id],
  canonical_artifacts: [artifact],
  events: [...],
  lineage: [...],
  metadata: {
    canonical_bytes: Buffer,
    canonical_hash: string
  },
  status: 'success'
}
```

**Changes Required:**
1. Import ConstitutionalResult
2. Remove witnesses array (witness creation moved to WitnessAuthority)
3. Remove certifications array (moved to separate phase)
4. Remove publications array (moved to separate phase)
5. Remove infrastructure array (moved to ExecutionAuthority)
6. Return ConstitutionalResult from createArtifact
7. Preserve artifact IDs in outputs
8. Preserve lineage in lineage
9. Preserve events in events
10. Preserve canonical artifacts in canonical_artifacts

**Replay Equivalence:**
- Artifact data unchanged
- Artifact ID generation unchanged (already uses DeterministicIdAuthority)
- Lineage data unchanged
- Events unchanged
- Replay transcript before migration == replay transcript after migration

**Witness Equivalence:**
- Witness creation moved to WitnessAuthority
- Witness hash computed from same artifact data
- Witness before migration == witness after migration

---

### Phase 2: Core Execution Authorities (Priority 2)

#### 2.1 InferenceAuthority Migration

**File:** `inference_authority.js`

**Current Return Type:**
```javascript
{
  artifacts: [...],
  lineage: [...],
  witnesses: [...],
  certifications: [...],
  publications: [...],
  events: [...],
  infrastructure: [...]
}
```

**Target Return Type:**
```javascript
ConstitutionalResult {
  authority_id: 'inference-authority',
  execution_id: string,
  constitutional_version: '11.0.0',
  authority_version: '11.0.0',
  inputs: {
    node: {...},
    input_artifacts: {...}
  },
  outputs: {
    artifact_id: string,
    artifact: {...}
  },
  replay_inputs: {
    node: {...},
    input_artifacts: {...}
  },
  artifact_ids: [artifact_id],
  canonical_artifacts: [artifact],
  events: [...],
  lineage: [...],
  metadata: {
    prompt_ir: {...},
    context: {...},
    tool_manifest: {...}
  },
  status: 'success'
}
```

**Changes Required:**
1. Import ConstitutionalResult
2. Remove witnesses array (witness creation moved to WitnessAuthority)
3. Remove certifications array (moved to separate phase)
4. Remove publications array (moved to separate phase)
5. Remove infrastructure array (moved to ExecutionAuthority)
6. Return ConstitutionalResult from execute
7. Preserve artifact IDs in outputs
8. Preserve lineage in lineage
9. Preserve events in events
10. Preserve canonical artifacts in canonical_artifacts

**Replay Equivalence:**
- Inference data unchanged
- Artifact ID generation unchanged (already uses DeterministicIdAuthority)
- Lineage data unchanged
- Events unchanged
- Replay transcript before migration == replay transcript after migration

**Witness Equivalence:**
- Witness creation moved to WitnessAuthority
- Witness hash computed from same inference data
- Witness before migration == witness after migration

---

#### 2.2 EmbeddingAuthority Migration

**File:** `embedding_authority.js`

**Current Return Type:**
```javascript
{
  artifacts: [...],
  lineage: [...],
  witnesses: [...],
  certifications: [...],
  publications: [...],
  events: [...],
  infrastructure: [...]
}
```

**Target Return Type:**
```javascript
ConstitutionalResult {
  authority_id: 'embedding-authority',
  execution_id: string,
  constitutional_version: '11.0.0',
  authority_version: '11.0.0',
  inputs: {
    node: {...},
    input_artifacts: {...}
  },
  outputs: {
    artifact_id: string,
    artifact: {...}
  },
  replay_inputs: {
    node: {...},
    input_artifacts: {...}
  },
  artifact_ids: [artifact_id],
  canonical_artifacts: [artifact],
  events: [...],
  lineage: [...],
  metadata: {
    chunks: [...]
  },
  status: 'success'
}
```

**Changes Required:**
1. Import ConstitutionalResult
2. Remove witnesses array (witness creation moved to WitnessAuthority)
3. Remove certifications array (moved to separate phase)
4. Remove publications array (moved to separate phase)
5. Remove infrastructure array (moved to ExecutionAuthority)
6. Return ConstitutionalResult from execute
7. Preserve artifact IDs in outputs
8. Preserve lineage in lineage
9. Preserve events in events
10. Preserve canonical artifacts in canonical_artifacts

**Replay Equivalence:**
- Embedding data unchanged
- Artifact ID generation unchanged (already uses DeterministicIdAuthority)
- Lineage data unchanged
- Events unchanged
- Replay transcript before migration == replay transcript after migration

**Witness Equivalence:**
- Witness creation moved to WitnessAuthority
- Witness hash computed from same embedding data
- Witness before migration == witness after migration

---

### Phase 3: Error Handling Authorities (Priority 3)

#### 3.1 FailureAuthority Migration

**File:** `runtime_failure_authority.js`

**Current Return Type:**
```javascript
{
  failure_record: {...},
  runtime_error: Error
}
```

**Target Return Type:**
```javascript
ConstitutionalResult {
  authority_id: 'runtime-failure-authority',
  execution_id: string,
  constitutional_version: '11.0.0',
  authority_version: '11.0.0',
  inputs: {
    failure_code: string,
    replay_phase: string,
    context: {...}
  },
  outputs: {
    failure_id: string,
    failure_record: {...}
  },
  replay_inputs: {
    failure_code: string,
    replay_phase: string,
    context: {...}
  },
  artifact_ids: [failure_id],
  metadata: {
    category: string,
    severity: string,
    recoverable: boolean
  },
  status: 'failure'
}
```

**Changes Required:**
1. Import ConstitutionalResult
2. Import IdentityAuthority (for ID generation)
3. Remove WitnessAuthority dependency
4. Remove SerializerAuthority dependency
5. Remove _generateFailureId method
6. Remove witness hash computation
7. Return ConstitutionalResult from recordFailure
8. Use IdentityAuthority for failure_id generation
9. Separate runtime Error from constitutional result

**Replay Equivalence:**
- Failure data unchanged
- Failure ID generation becomes deterministic via IdentityAuthority
- Failure classification unchanged
- Replay transcript before migration == replay transcript after migration

**Witness Equivalence:**
- Witness creation moved to WitnessAuthority
- Witness hash computed from same failure data
- Witness before migration == witness after migration

---

#### 3.2 RetryAuthority Migration

**File:** `retry_authority.js`

**Current Return Type:**
```javascript
// shouldRetry returns:
{
  should_retry: boolean,
  reason: string,
  attempts: number,
  next_attempt: number,
  backoff_delay: number
}

// recordRetryAttempt returns:
{
  retry_attempt: {...},
  witness: Object
}
```

**Target Return Type:**
```javascript
ConstitutionalResult {
  authority_id: 'retry-authority',
  execution_id: string,
  constitutional_version: '11.0.0',
  authority_version: '11.0.0',
  inputs: {
    execution_id: string,
    failure_classification: {...},
    policy_id: string
  },
  outputs: {
    should_retry: boolean,
    retry_decision: {...}
  },
  replay_inputs: {
    execution_id: string,
    failure_classification: {...},
    policy_id: string
  },
  artifact_ids: [],
  metadata: {
    attempts: number,
    backoff_delay: number
  },
  status: 'success'
}
```

**Changes Required:**
1. Import ConstitutionalResult
2. Import IdentityAuthority (for ID generation)
3. Remove WitnessAuthority dependency
4. Remove SerializerAuthority dependency
5. Remove _generatePolicyId method
6. Remove witness hash computation
7. Return ConstitutionalResult from shouldRetry
8. Return ConstitutionalResult from recordRetryAttempt
9. Use IdentityAuthority for policy_id generation

**Replay Equivalence:**
- Retry decision logic unchanged
- Retry policy data unchanged
- Policy ID generation becomes deterministic via IdentityAuthority
- Replay transcript before migration == replay transcript after migration

**Witness Equivalence:**
- Witness creation moved to WitnessAuthority
- Witness hash computed from same retry data
- Witness before migration == witness after migration

---

### Phase 4: Provenance Authorities (Priority 4)

#### 4.1 LineageAuthority Migration

**File:** `lineage_authority.js`

**Current Return Type:**
```javascript
{
  lineage_edge: {...},
  witness: Object
}
```

**Target Return Type:**
```javascript
ConstitutionalResult {
  authority_id: 'lineage-authority',
  execution_id: string,
  constitutional_version: '11.0.0',
  authority_version: '11.0.0',
  inputs: {
    parent_artifact_id: string,
    child_artifact_id: string,
    authority: string,
    execution_id: string
  },
  outputs: {
    edge_id: string,
    lineage_edge: {...}
  },
  replay_inputs: {
    parent_artifact_id: string,
    child_artifact_id: string,
    authority: string,
    execution_id: string
  },
  artifact_ids: [edge_id],
  lineage: {
    parent_artifact_id: string,
    child_artifact_id: string
  },
  metadata: {
    created_at: string
  },
  status: 'success'
}
```

**Changes Required:**
1. Import ConstitutionalResult
2. Import IdentityAuthority (for ID generation)
3. Remove WitnessAuthority dependency
4. Remove SerializerAuthority dependency
5. Remove DeterministicIdAuthority dependency (use IdentityAuthority instead)
6. Preserve ConstitutionalTimeAuthority usage (allowed)
7. Return ConstitutionalResult from registerLineage
8. Use IdentityAuthority for edge_id generation

**Replay Equivalence:**
- Lineage data unchanged
- Edge ID generation becomes deterministic via IdentityAuthority
- Timestamps unchanged (already uses ConstitutionalTimeAuthority)
- Replay transcript before migration == replay transcript after migration

**Witness Equivalence:**
- Witness creation moved to WitnessAuthority
- Witness hash computed from same lineage data
- Witness before migration == witness after migration

---

### Phase 5: Coordination Authorities (Priority 5)

#### 5.1 ExecutionAuthority Review

**File:** `execution_authority.js`

**Current Return Type:**
```javascript
{
  success: boolean,
  execution_id: string,
  result: ConstitutionalResult,
  witness: Object
}
```

**Analysis:**
- ExecutionAuthority is a coordinator, not a semantic authority
- It should not return ConstitutionalResult
- It should forward ConstitutionalResult
- Witness creation should be separate from return value

**Recommendation:**
- No migration required
- ExecutionAuthority should remain as coordinator
- Witness creation should be separate step after ConstitutionalResult return

---

#### 5.2 EventAuthority Review

**File:** `event_authority.js`

**Current Return Type:**
```javascript
// Event emission methods return void or event_id
```

**Analysis:**
- EventAuthority is infrastructure, not a semantic authority
- It handles event streaming (NATS/JetStream)
- It may not need ConstitutionalResult

**Recommendation:**
- No migration required
- EventAuthority should remain as infrastructure
- May need ConstitutionalResult for event creation (deferred)

---

## Files Modified Summary

### Authority Files (10)
1. prompt_authority.js
2. model_authority.js
3. artifact_authority.js
4. inference_authority.js
5. embedding_authority.js
6. runtime_failure_authority.js
7. retry_authority.js
8. lineage_authority.js
9. execution_authority.js (review only)
10. event_authority.js (review only)

### Contract Files (1)
11. constitutional_result.js (already created)

---

## Replay Equivalence Proof

### Principle
Replay equivalence is guaranteed if:
1. Constitutional data inputs are unchanged
2. Constitutional data outputs are unchanged
3. ID generation remains deterministic
4. Timestamps remain deterministic

### Proof
- All authorities preserve constitutional data in inputs/outputs
- ID generation migrates to IdentityAuthority (deterministic)
- Timestamps already use ConstitutionalTimeAuthority (deterministic)
- Witness creation moved to WitnessAuthority (same data, same hash)
- Therefore: replay transcript before migration == replay transcript after migration

---

## Witness Equivalence Proof

### Principle
Witness equivalence is guaranteed if:
1. Witness data is unchanged
2. Witness schema is unchanged
3. Hash computation is unchanged

### Proof
- Witness data preserved in ConstitutionalResult.outputs
- Witness schema owned by WitnessAuthority (unchanged)
- Hash computation owned by SerializerAuthority (unchanged)
- Therefore: witness before migration == witness after migration

---

## Success Criteria

✓ Every authority returns ConstitutionalResult
✓ No authority builds witnesses
✓ No authority hashes (except Layer 0 primitives)
✓ No authority serializes (except Layer 0 primitives)
✓ No authority creates IDs (uses IdentityAuthority)
✓ WitnessAuthority is the only witness creator
✓ VerificationAuthority only consumes witnesses
✓ Replay transcript before migration equals replay transcript after migration
✓ Witness before migration equals witness after migration

---

## Next Steps

1. Migrate PromptAuthority (Phase 1.1)
2. Migrate ModelAuthority (Phase 1.2)
3. Migrate ArtifactAuthority (Phase 1.3)
4. Migrate InferenceAuthority (Phase 2.1)
5. Migrate EmbeddingAuthority (Phase 2.2)
6. Migrate FailureAuthority (Phase 3.1)
7. Migrate RetryAuthority (Phase 3.2)
8. Migrate LineageAuthority (Phase 4.1)
9. Review ExecutionAuthority (Phase 5.1)
10. Review EventAuthority (Phase 5.2)
11. Verify replay equivalence
12. Verify witness equivalence
13. Update Layer 0 usage violations
