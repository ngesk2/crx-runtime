# Ollama Artifact Reasoning Audit

**Audit Date:** 2026-06-25
**Audit Type:** PHASE E.7B - Investigation 5
**Objective:** Determine which constitutional properties should be exposed to LLM models and which must never be model-derived.

---

# Executive Summary

**Current State:** Ollama receives raw text. No artifact properties are exposed. The Supervisor (14B) receives a Context Pack context string that may contain document content but no structured authority metadata.

**Diagnostic Evidence (2026-06-25):**
- Supervisor synthesis call receives context = `json.dumps(pack.to_dict())` — includes whatever the workers provided
- Search worker returned empty authority_chain → supervisor answered with "no explicit constitutional basis"
- No structured artifact properties are passed to Ollama in any code path

**Key Finding:** Zero artifact properties are currently exposed to any LLM. The system leaks no constitutional metadata but also gains no reasoning benefit from artifact structure.

---

# Current State: What Ollama Receives

## Reasoning Pipeline (Supervisor)

```python
synthesis_input = {
    "role": "system",
    "content": "You are a constitutional reasoning supervisor..."
}
user_input = {
    "role": "user",
    "content": f"Question: {plan.question}\n\nContext Pack:\n{context_str}\n\nProduce..."
}
```

Context pack `to_dict()` includes:
- `question`: string
- `highest_authority`: dict (empty when missing)
- `authority_chain`: list (empty when missing)
- `supporting_documents`: list (empty when missing)
- `contradictions`: list (empty when missing)
- `confidence`: float

**No structured artifact properties are included.**

## Direct API Endpoints

- `/constitution/search`: Returns Qdrant results with verification + authority blocks
- `/constitutional/query`: Returns snippets + citations + authority_chain
- `/memory/search`: Returns document results with projection verification

**Artifact properties returned but not fed to any LLM — caller must use them.**

---

# Should-Expose Analysis

## Properties That SHOULD Be Exposed to Models

### authority_class

| Aspect | Assessment |
|--------|------------|
| **Current exposure** | None — resolved in authority_search.py but not passed to LLM |
| **Should expose?** | YES — model needs to know governing authority to produce correct answer |
| **Exposure form** | `authority_class: CONSTITUTIONAL_LAW` in context pack |
| **Constitutional risk** | LOW — authority_class is declared (not scored), model cannot change it |
| **Reasoning benefit** | HIGH — model can weigh evidence by governing authority |

### verification_status

| Aspect | Assessment |
|--------|------------|
| **Current exposure** | None |
| **Should expose?** | YES — model needs to know if evidence is verified |
| **Exposure form** | `verification_status: VERIFIED` per artifact in context pack |
| **Constitutional risk** | LOW — verification is mechanical (5-check), model cannot change it |
| **Reasoning benefit** | HIGH — model can deprioritize unverified evidence |

### lineage_depth

| Aspect | Assessment |
|--------|------------|
| **Current exposure** | None |
| **Should expose?** | YES — model needs to know artifact proximity to root truth |
| **Exposure form** | `lineage_depth: 3` per artifact in context pack |
| **Constitutional risk** | LOW — lineage depth is computed from authority_lineage table |
| **Reasoning benefit** | MEDIUM — useful for understanding derivation chain |

### witness_present

| Aspect | Assessment |
|--------|------------|
| **Current exposure** | None |
| **Should expose?** | YES — model needs to know if artifact has witness proof |
| **Exposure form** | `witness_present: true` per artifact in context pack |
| **Constitutional risk** | LOW — witness_present is binary, model cannot forge witness |
| **Reasoning benefit** | MEDIUM — adds credibility signal |

### superseded

| Aspect | Assessment |
|--------|------------|
| **Current exposure** | None |
| **Should expose?** | YES — model must know if artifact is superseded |
| **Exposure form** | `superseded_by: artifact_789` or `superseded: false` per artifact |
| **Constitutional risk** | LOW — supersession is recorded in authority_supersession table |
| **Reasoning benefit** | HIGH — prevents reasoning from obsolete authority |

### content_hash

| Aspect | Assessment |
|--------|------------|
| **Current exposure** | None |
| **Should expose?** | YES — model can reference content hash in citations |
| **Exposure form** | `content_hash: abc123...` per artifact in context pack |
| **Constitutional risk** | NONE — content hash is opaque to reasoning, only useful for citation |
| **Reasoning benefit** | LOW — mostly for audit trail |

---

## Properties That MUST NEVER Be Model-Derived

### authority_class (assignment)

| Aspect | Assessment |
|--------|------------|
| **Why never model-derived?** | Authority class is DECLARED by the system **before** model sees it. Allowing a model to assign authority_class would let it self-authorize. |
| **Constitutional law** | AUTHORITY_LAW — authority must be declared, not scored |
| **Enforcement** | Hard-code in authority_search.py. Model can only READ authority_class, never WRITE. |
| **Current compliance** | ✅ COMPLIANT — model never sees or assigns authority_class |

### verification (5-check result)

| Aspect | Assessment |
|--------|------------|
| **Why never model-derived?** | Verification is MECHANICAL (5 deterministic checks). Model cannot validate hashes or check witness roots. Allowing model to override verification would break TRUTH_LAW. |
| **Constitutional law** | VERIFICATION — verification must be deterministic |
| **Enforcement** | verification computed in authority_search.py before context pack is built |
| **Current compliance** | ✅ COMPLIANT — verification is computed server-side |

### witness validity

| Aspect | Assessment |
|--------|------------|
| **Why never model-derived?** | Witness is CRYPTOGRAPHIC. Model cannot validate Ed25519 signatures or Merkle tree proofs. |
| **Constitutional law** | WITNESS_LAW — witness must be cryptographic, not heuristic |
| **Enforcement** | Witness check in authority_search.py mechanical_verification() |
| **Current compliance** | ✅ COMPLIANT — witness validity is computed server-side |

### supersession (assignment)

| Aspect | Assessment |
|--------|------------|
| **Why never model-derived?** | Supersession is RECORDED in authority_supersession table. Model cannot determine which artifact supersedes another. |
| **Constitutional law** | AUTHORITY_LAW — supersession must be recorded, not inferred |
| **Enforcement** | superseded set built from authority_supersession table before model sees artifacts |
| **Current compliance** | ✅ COMPLIANT — model cannot assign supersession |

### event_hash (verification)

| Aspect | Assessment |
|--------|------------|
| **Why never model-derived?** | Event hash is SHA256 of event content. Model cannot compute or verify hashes. |
| **Constitutional law** | REPLAY_LAW — replay verification must be deterministic |
| **Enforcement** | Hash comparison in verification pipeline |
| **Current compliance** | ✅ COMPLIANT — event hash is never exposed to model |

---

# Exposure Format

## Context Pack Artifact Block (proposed)

```json
{
  "artifacts": [
    {
      "artifact_id": "550e8400-e29b-41d4-a716-446655440000",
      "artifact_type": "CONSTITUTIONAL_LAW",
      "authority_class": "CONSTITUTIONAL_LAW",
      "verification_status": "VERIFIED",
      "lineage_depth": 0,
      "witness_present": true,
      "superseded": false,
      "content": { "title": "REPLAY_LAW.md", "text": "..." },
      "content_hash": "abc123..."
    },
    {
      "artifact_id": "550e8400-e29b-41d4-a716-446655440001",
      "artifact_type": "CLAIM",
      "authority_class": "AI_GENERATED_ANALYSIS",
      "verification_status": "UNVERIFIED",
      "lineage_depth": 3,
      "witness_present": false,
      "superseded": false,
      "content": { "claim_text": "...", "claim_type": "observation" },
      "content_hash": "def456..."
    }
  ]
}
```

## Supervisor Prompt (proposed)

```
You are a constitutional reasoning supervisor.

The following artifacts are VERIFIED and carry HIGHEST authority:
- CONSTITUTIONAL_LAW: REPLAY_LAW.md (artifact_id: ...)

The following artifacts are UNVERIFIED and carry LOWER authority:
- AI_GENERATED_ANALYSIS: claim_xyz (artifact_id: ...)

Question: What is replay?

Artifact #1 [CONSTITUTIONAL_LAW, VERIFIED, lineage_depth=0]
...
```

---

# Constitutional Compliance Summary

| Constitutional Law | Current Compliance | Risk if Exposed |
|-------------------|-------------------|-----------------|
| TRUTH_LAW | ✅ Compliant — truth not model-derived | LOW — model reads truth status, does not create it |
| EVENT_LAW | ✅ Compliant — events not model-derived | LOW — model reads event metadata |
| IDENTITY_LAW | ✅ Compliant — artifact_id not model-generated | LOW — model reads identity |
| REPLAY_LAW | ✅ Compliant — replay not model-derived | LOW — model reads replay status |
| WITNESS_LAW | ✅ Compliant — witness not model-derived | LOW — model reads witness presence |
| AUTHORITY_LAW | ✅ Compliant — authority_class not model-assigned | LOW — model reads authority class |
| VERIFICATION | ✅ Compliant — verification not model-derived | LOW — model reads verification status |

---

# Conclusion

**Ollama can safely receive artifact properties as READ-ONLY reasoning context.**

Properties that should be exposed:
- authority_class (declared, not scored)
- verification_status (mechanical, not derived)
- lineage_depth (computed from authority_lineage)
- witness_present (binary, not forgeable)
- superseded (recorded in authority_supersession)
- content_hash (opaque, audit trail only)

Properties that must NEVER be model-derived:
- authority_class assignment (would break AUTHORITY_LAW)
- verification status (would break VERIFICATION)
- witness validity (would break WITNESS_LAW)
- supersession (would break AUTHORITY_LAW)
- event_hash (would break REPLAY_LAW)

**Current compliance: FULLY COMPLIANT.** No artifact properties are exposed today. Adding structured artifact properties to Ollama context (as READ-ONLY metadata) would improve reasoning quality without constitutional risk.

---

**Investigation Status:** COMPLETED
