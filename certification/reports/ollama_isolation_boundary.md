# Ollama Isolation Boundary

**Phase 10:** Ollama Isolation Boundary  
**Date:** 2026-06-07

## Constitutional Rule

**Ollama outputs are NEVER replay authorities.**

LLM outputs:
- ✓ May create events
- ✓ May create artifacts
- ✓ May propose lineage

LLM outputs MUST enter replay pipeline as untrusted inputs.

Replay kernel remains sole constitutional authority.

## Architecture

### Ollama → Replay Pipeline

```
Ollama LLM
  ↓ (untrusted input)
Event/Artifact/Lineage Proposal
  ↓ (validation)
Constitutional Replay Kernel
  ↓ (canonicalization + witness generation)
ReplayResult (truth)
  ↓ (storage)
PostgreSQL
```

## Input Boundary

### Untrusted Inputs from Ollama

The following Ollama outputs are treated as untrusted inputs:

1. **Event Proposals**
   - event_id (generated or suggested by LLM)
   - event_type (suggested by LLM)
   - payload (suggested by LLM)
   - lineage (suggested by LLM)

2. **Artifact Proposals**
   - artifact_id (generated or suggested by LLM)
   - artifact_content (suggested by LLM)
   - artifact_lineage (suggested by LLM)

3. **Lineage Proposals**
   - parent_event_ids (suggested by LLM)
   - edge_type (suggested by LLM)

### Validation Before Replay

All Ollama inputs MUST pass validation before entering replay:

1. **Schema Validation**
   - Required fields present
   - Field types correct
   - Field values within bounds

2. **Business Logic Validation**
   - Event types valid
   - Lineage references valid
   - Artifact references valid

3. **Constitutional Validation**
   - No circular references
   - No duplicate event_ids
   - No invalid lineage edges

## Replay Authority

### Sole Constitutional Authority

The constitutional replay kernel (runtime/replay/) is the SOLE authority for:

- ✓ Canonicalization (CanonicalJson)
- ✓ Witness generation (WitnessAuthority)
- ✓ Fingerprint generation (CanonicalHashAuthority)
- ✓ Merkle construction (MerkleTree)
- ✓ Invariant verification (InvariantRunner)
- ✓ Replay verification (ReplayVerification)

### Ollama Non-Authority

Ollama is NOT an authority for:

- ✗ Canonicalization
- ✗ Witness generation
- ✗ Fingerprint generation
- ✗ Merkle construction
- ✗ Invariant verification
- ✗ Replay verification

## Data Flow

### Ollama Input → Constitutional Kernel

1. **Ollama generates proposal**
   - LLM proposes event/artifact/lineage
   - Proposal is untrusted

2. **Validation layer**
   - Schema validation
   - Business logic validation
   - Constitutional validation

3. **Canonicalization**
   - CanonicalJson canonicalizes validated input
   - Deterministic ordering applied
   - UTF-8 normalization applied

4. **Witness generation**
   - WitnessAuthority generates witness root
   - Merkle tree constructed
   - Lineage graph built

5. **Replay verification**
   - ReplayVerification verifies determinism
   - Invariants checked
   - Violations detected

6. **Storage**
   - PostgreSQL stores verified replay result
   - Witness root stored
   - Fingerprint stored

## Constitutional Compliance

**Status:** COMPLIANT

- ✓ Ollama outputs are untrusted inputs
- ✓ Ollama never performs canonicalization
- ✓ Ollama never generates witnesses
- ✓ Ollama never generates fingerprints
- ✓ Ollama never constructs Merkle trees
- ✓ Replay kernel is sole constitutional authority
- ✓ All replay computation performed by kernel
- ✓ Ollama inputs validated before replay

## Security Considerations

### Input Sanitization

- All Ollama inputs must be sanitized
- No code execution from LLM outputs
- No SQL injection from LLM outputs
- No path traversal from LLM outputs

### Rate Limiting

- Ollama requests should be rate-limited
- Prevent LLM from flooding replay pipeline
- Prevent resource exhaustion

### Audit Trail

- All Ollama inputs logged
- All validation failures logged
- All replay results logged
- Traceability from LLM output to replay result

## Conclusion

Phase 10 Ollama isolation boundary audit PASSED. Ollama outputs are treated as untrusted inputs, validated before entering replay pipeline, and never perform replay computation. The constitutional replay kernel remains the sole authority for all replay operations.
