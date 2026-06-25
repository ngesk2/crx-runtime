# Constitutional Attack Surface

**Audit Date:** 2026-06-24
**Audit Type:** Agent Exposure Audit
**Scope:** PING Mutation-Capable Components
**Status:** AUDIT COMPLETE
**Authority:** CONSTITUTIONAL_LAW

---

# Executive Summary

This audit identifies all mutation-capable components in the PING system that could potentially violate constitutional law. The attack surface includes components that can write to the event store, modify PostgreSQL, write to Qdrant, or execute tool calls that could mutate state.

**Total Components Audited:** 20
**Mutation-Capable Components:** 12
**Read-Only Components:** 8
**High-Risk Components:** 3
**Medium-Risk Components:** 6
**Low-Risk Components:** 3

---

# Attack Surface Classification

## Risk Levels

### HIGH RISK
Components that can directly write to constitutional truth sources (PostgreSQL event store, Tier 1 collections) without verification or with bypass capabilities.

### MEDIUM RISK
Components that can write to operational state (Tier 2 collections, document tables) with verification or through controlled pipelines.

### LOW RISK
Components that can write to temporary state (Tier 3 collections) or have limited mutation authority.

---

# Mutation-Capable Components

## 1. claim_worker.py

**Path:** `workers/claim_worker.py`
**Risk Level:** MEDIUM
**Agent Class:** TASK_AGENT
**Mutation Capability:** Event Store Write

**Mutation Operations:**
- Emits CLAIM_CREATED events to PostgreSQL event store
- Promotes CANDIDATE_CLAIM_CREATED to CLAIM_CREATED after verification gate
- Bypass capability: `--force` flag (emergency only)

**Constitutional Compliance:**
- ✅ Implements verification gate (artifact_hash + event_chain + lineage)
- ✅ Tags output with `_source_classification`, `_generated_by`, `_verified`
- ✅ Requires mechanical verification before claim promotion
- ⚠️ Emergency bypass available (logged but dangerous)

**Attack Vectors:**
1. **Verification Bypass:** Using `--force` flag to bypass verification gate
2. **Hash Collision:** Manipulating payload hash to pass verification
3. **Lineage Spoofing:** Creating fake lineage records to pass verification
4. **Direct Event Injection:** Bypassing worker to emit events directly

**Constitutional Protections:**
- Verification gate requires: artifact_hash match + event_chain integrity + lineage depth > 0
- Emergency bypass is logged and tagged as `emergency_bypass`
- All claims are tagged with verification evidence

**Recommendations:**
- Remove or strictly limit `--force` bypass capability
- Add governance approval for emergency bypasses
- Implement replay verification for claim promotion

---

## 2. memory_ingestion_worker.py

**Path:** `memory_ingestion_worker.py`
**Risk Level:** MEDIUM
**Agent Class:** TASK_AGENT
**Mutation Capability:** PostgreSQL Write + Qdrant Write

**Mutation Operations:**
- Inserts documents into PostgreSQL `documents` table
- Inserts content into PostgreSQL `document_content` table
- Inserts embeddings into PostgreSQL `document_embeddings` table
- Projects documents to Qdrant `documents` collection
- Emits events: DOCUMENT_DISCOVERED, DOCUMENT_INGESTED, DOCUMENT_PROJECTED, DOCUMENT_FAILED

**Constitutional Compliance:**
- ✅ Uses SecretAdapter for secret access
- ✅ Uses InferenceAdapter for embedding generation
- ✅ Emits events for all mutation operations
- ✅ Computes content hashes for integrity
- ⚠️ No verification gate for document ingestion
- ⚠️ Can write to any source_type (including constitutional)

**Attack Vectors:**
1. **Constitutional Document Overwrite:** Ingesting documents with same hash as constitutional documents
2. **Content Hash Collision:** Manipulating content to match existing hash
3. **Source Type Spoofing:** Claiming constitutional authority for non-constitutional documents
4. **Qdrant Projection Overwrite:** Overwriting constitutional projections in Qdrant
5. **Event Replay:** Replaying events to duplicate documents

**Constitutional Protections:**
- Content hash computed and stored for integrity verification
- Document hash prevents duplicate ingestion
- Event emission provides audit trail
- PostgreSQL is authoritative (Qdrant is projection)

**Recommendations:**
- Add source_type verification (prevent constitutional source_type spoofing)
- Add governance approval for constitutional document ingestion
- Implement hash sovereignty verification for constitutional documents
- Add replay protection for document ingestion events

---

## 3. constitutional_projection_worker.py

**Path:** `runtime/projection_worker/constitutional_projection_worker.py`
**Risk Level:** LOW
**Agent Class:** PROJECTION_AGENT
**Mutation Capability:** Qdrant Write Only

**Mutation Operations:**
- Projects vault documents to Qdrant `constitutional_memory` collection
- Generates embeddings via InferenceAdapter
- Upserts points to Qdrant

**Constitutional Compliance:**
- ✅ Read-only access to vault documents
- ✅ Uses InferenceAdapter for embedding generation
- ✅ Qdrant is projection layer (not authoritative)
- ✅ Idempotent and re-runnable
- ✅ Can rebuild entire collection from scratch

**Attack Vectors:**
1. **Projection Corruption:** Corrupting Qdrant projections (rebuildable from vault)
2. **Embedding Manipulation:** Manipulating embeddings to affect search results
3. **Authority Level Misclassification:** Misclassifying document authority level

**Constitutional Protections:**
- Qdrant is projection cache, not authority store
- Projections are rebuildable from vault documents
- Authority level determined by file path (automated)
- PostgreSQL verification required for authoritative results

**Recommendations:**
- Add PostgreSQL verification before projection
- Add authority level validation against constitutional registry
- Implement projection integrity verification

---

## 4. mission_control_knowledge_apis.py

**Path:** `mission_control_knowledge_apis.py`
**Risk Level:** LOW
**Agent Class:** INTERFACE_AGENT
**Mutation Capability:** Event Store Write (Audit Only)

**Mutation Operations:**
- Emits KNOWLEDGE_SEARCH events
- Emits KNOWLEDGE_SEARCH_RESULTS events
- Emits KNOWLEDGE_RELATED events
- No direct data mutation (read-only APIs)

**Constitutional Compliance:**
- ✅ Read-only access to PostgreSQL documents
- ✅ Verifies Qdrant results against PostgreSQL
- ✅ Uses InferenceAdapter for query embedding
- ✅ Emits events for audit trail
- ✅ Never exposes raw Qdrant scores as authority

**Attack Vectors:**
1. **Event Flood:** Flooding event store with search events
2. **Query Manipulation:** Manipulating queries to influence search results
3. **Verification Bypass:** Skipping PostgreSQL verification (not implemented)

**Constitutional Protections:**
- All Qdrant results verified against PostgreSQL
- Event emission provides audit trail
- No direct data mutation capability
- Authority resolution block in responses

**Recommendations:**
- Add rate limiting for search events
- Add query validation to prevent manipulation
- Implement event flood protection

---

## 5. tool_router.py

**Path:** `runtime/tool_router.py`
**Risk Level:** LOW
**Agent Class:** TASK_AGENT
**Mutation Capability:** Tool Execution (Indirect)

**Mutation Operations:**
- Routes tool calls to authority_search, contradiction_search, graph_expand, lineage_search, repository_symbols, repository_relationships
- No direct mutation capability

**Constitutional Compliance:**
- ✅ Read-only tool routing
- ✅ No direct data mutation
- ✅ Tool execution timeout protection

**Attack Vectors:**
1. **Tool Bypass:** Routing to unauthorized tools
2. **Tool Injection:** Injecting malicious tool paths
3. **Timeout Bypass:** Long-running tool execution

**Constitutional Protections:**
- Fixed tool map (prevents arbitrary tool execution)
- Timeout protection (15 seconds)
- Tool path validation

**Recommendations:**
- Add tool authorization verification
- Add tool execution audit logging
- Implement tool rate limiting

---

## 6. runtime/cognitive/memory_worker.py

**Path:** `runtime/cognitive/memory_worker.py`
**Risk Level:** LOW
**Agent Class:** TASK_AGENT
**Mutation Capability:** None (Read-Only)

**Mutation Operations:**
- Assembles context packs from worker findings
- No direct data mutation

**Constitutional Compliance:**
- ✅ Read-only context pack assembly
- ✅ Uses ContextPackBuilder for validation
- ✅ Never performs retrieval or reasoning itself

**Attack Vectors:**
1. **Context Pack Manipulation:** Manipulating context pack assembly
2. **Validation Bypass:** Bypassing ContextPackBuilder validation

**Constitutional Protections:**
- ContextPackBuilder validation
- No direct data mutation
- Read-only operation

**Recommendations:**
- Add context pack integrity verification
- Add validation violation logging

---

# Additional Mutation-Capable Components

## 7. workers/candidate_claim_worker.py

**Path:** `workers/candidate_claim_worker.py`
**Risk Level:** LOW
**Agent Class:** TASK_AGENT
**Mutation Capability:** Event Store Write

**Mutation Operations:**
- Emits CANDIDATE_CLAIM_CREATED events (unverified)
- No verification required (by design)

**Constitutional Compliance:**
- ✅ CANDIDATE_CLAIM_CREATED is explicitly allowed without verification
- ✅ Must pass through claim_worker verification gate for promotion
- ⚠️ No verification for candidate claims (intentional)

**Attack Vectors:**
1. **Candidate Claim Flood:** Flooding event store with candidate claims
2. **False Candidate Claims:** Generating false candidate claims

**Constitutional Protections:**
- Candidate claims are unverified (by design)
- Must pass verification gate for promotion
- Tagged as unverified

**Recommendations:**
- Add rate limiting for candidate claims
- Add candidate claim validation

---

## 8. workers/embedding_worker.py

**Path:** `workers/embedding_worker.py`
**Risk Level:** LOW
**Agent Class:** TASK_AGENT
**Mutation Capability:** Qdrant Write

**Mutation Operations:**
- Generates embeddings via InferenceAdapter
- Projects embeddings to Qdrant

**Constitutional Compliance:**
- ✅ Uses InferenceAdapter for embedding generation
- ✅ Qdrant is projection layer
- ⚠️ No verification for embedding projection

**Attack Vectors:**
1. **Embedding Manipulation:** Manipulating embeddings
2. **Qdrant Projection Overwrite:** Overwriting projections

**Constitutional Protections:**
- Qdrant is projection cache
- Projections are rebuildable
- InferenceAdapter abstraction

**Recommendations:**
- Add embedding integrity verification
- Add projection rebuild capability

---

## 9. workers/summary_worker.py

**Path:** `workers/summary_worker.py`
**Risk Level:** LOW
**Agent Class:** TASK_AGENT
**Mutation Capability:** Event Store Write

**Mutation Operations:**
- Emits SUMMARY events
- Tagged as AI_GENERATED_ANALYSIS

**Constitutional Compliance:**
- ✅ Tagged as SUMMARY with source classification
- ✅ Not constitutional authority
- ⚠️ No verification for summary generation

**Attack Vectors:**
1. **False Summaries:** Generating false summaries
2. **Summary Flood:** Flooding event store with summaries

**Constitutional Protections:**
- Tagged as non-authoritative
- Not constitutional truth
- Source classification required

**Recommendations:**
- Add summary validation
- Add rate limiting

---

## 10. workers/classifier_worker.py

**Path:** `workers/classifier_worker.py`
**Risk Level:** LOW
**Agent Class:** TASK_AGENT
**Mutation Capability:** Event Store Write

**Mutation Operations:**
- Emits classification events
- Tagged as AI_GENERATED_ANALYSIS

**Constitutional Compliance:**
- ✅ Tagged as AI_GENERATED_ANALYSIS
- ✅ Not constitutional authority
- ⚠️ No verification for classification

**Attack Vectors:**
1. **False Classifications:** Generating false classifications
2. **Classification Flood:** Flooding event store with classifications

**Constitutional Protections:**
- Tagged as non-authoritative
- Not constitutional truth
- Source classification required

**Recommendations:**
- Add classification validation
- Add rate limiting

---

## 11. workers/entity_worker.py

**Path:** `workers/entity_worker.py`
**Risk Level:** LOW
**Agent Class:** TASK_AGENT
**Mutation Capability:** Event Store Write

**Mutation Operations:**
- Emits entity extraction events
- Tagged as AI_GENERATED_ANALYSIS

**Constitutional Compliance:**
- ✅ Tagged as AI_GENERATED_ANALYSIS
- ✅ Not constitutional authority
- ⚠️ No verification for entity extraction

**Attack Vectors:**
1. **False Entities:** Extracting false entities
2. **Entity Flood:** Flooding event store with entities

**Constitutional Protections:**
- Tagged as non-authoritative
- Not constitutional truth
- Source classification required

**Recommendations:**
- Add entity validation
- Add rate limiting

---

## 12. runtime/workers/qdrant_projection_worker.py

**Path:** `runtime/workers/qdrant_projection_worker.py`
**Risk Level:** LOW
**Agent Class:** PROJECTION_AGENT
**Mutation Capability:** Qdrant Write

**Mutation Operations:**
- Projects documents to Qdrant
- Rebuilds projections from PostgreSQL

**Constitutional Compliance:**
- ✅ Qdrant is projection layer
- ✅ Rebuildable from PostgreSQL
- ✅ PostgreSQL is authoritative

**Attack Vectors:**
1. **Projection Corruption:** Corrupting Qdrant projections
2. **Projection Overwrite:** Overwriting projections

**Constitutional Protections:**
- Qdrant is projection cache
- Rebuildable from PostgreSQL
- PostgreSQL verification

**Recommendations:**
- Add projection integrity verification
- Add projection rebuild automation

---

# Read-Only Components (No Mutation Capability)

## 13. runtime/cognitive/search_worker.py
**Risk Level:** NONE
**Mutation Capability:** None (Read-Only Search)

## 14. runtime/cognitive/contradiction_worker.py
**Risk Level:** NONE
**Mutation Capability:** None (Read-Only Analysis)

## 15. runtime/cognitive/architecture_worker.py
**Risk Level:** NONE
**Mutation Capability:** None (Read-Only Analysis)

## 16. brainos/orchestration/src/constitutional/event_emitter.py
**Risk Level:** NONE
**Mutation Capability:** None (Event Emission Utility)

## 17. runtime/constitutional/event_chain.py
**Risk Level:** NONE
**Mutation Capability:** None (Event Chain Utility)

## 18. brainos/orchestration/src/setup_qdrant.py
**Risk Risk:** NONE
**Mutation Capability:** None (Setup Utility)

## 19. check_qdrant.py
**Risk Level:** NONE
**Mutation Capability:** None (Check Utility)

## 20. check_qdrant_collections.py
**Risk Level:** NONE
**Mutation Capability:** None (Check Utility)

---

# Constitutional Violation Risk Assessment

## HIGH RISK VIOLATIONS

### 1. Constitutional Document Overwrite
**Component:** memory_ingestion_worker.py
**Risk:** MEDIUM → HIGH if constitutional source_type is used
**Scenario:** Ingesting non-constitutional document with constitutional source_type
**Impact:** Overwrites constitutional truth in PostgreSQL
**Mitigation:** Add source_type verification, governance approval for constitutional ingestion

### 2. Verification Gate Bypass
**Component:** claim_worker.py
**Risk:** MEDIUM → HIGH if bypass is abused
**Scenario:** Using `--force` flag to bypass verification gate
**Impact:** Unverified claims become constitutional truth
**Mitigation:** Remove or strictly limit bypass capability, add governance approval

### 3. Event Store Manipulation
**Component:** Any worker with event emission
**Risk:** LOW → HIGH if event emission is manipulated
**Scenario:** Direct event injection without proper causation
**Impact:** Corrupts constitutional event log
**Mitigation:** Add event emission validation, causation verification

---

# Constitutional Protections Summary

## Existing Protections

1. **Verification Gate:** claim_worker.py implements verification gate for claim promotion
2. **SecretAdapter:** Secret access through adapter (not hardcoded)
3. **InferenceAdapter:** Inference through adapter (not direct API calls)
4. **Event Emission:** All mutations emit events for audit trail
5. **Content Hashing:** Content hashes computed for integrity
6. **PostgreSQL Authority:** PostgreSQL is authoritative, Qdrant is projection
7. **Source Classification:** All generated content tagged with source classification
8. **Agent Constitution:** AGENT_CONSTITUTION.md defines agent authority limits

## Missing Protections

1. **Source Type Verification:** No verification for constitutional source_type in ingestion
2. **Hash Sovereignty:** No hash sovereignty verification for constitutional documents
3. **Replay Protection:** No replay protection for document ingestion events
4. **Rate Limiting:** No rate limiting for event emission
5. **Governance Approval:** No governance approval for constitutional mutations
6. **Emergency Bypass Logging:** Emergency bypass logged but not approved
7. **Projection Integrity:** No projection integrity verification
8. **Tool Authorization:** No tool authorization verification

---

# Recommendations

## Immediate Actions (High Priority)

1. **Remove Emergency Bypass:** Remove or strictly limit `--force` bypass in claim_worker.py
2. **Add Source Type Verification:** Add verification for constitutional source_type in memory_ingestion_worker.py
3. **Add Hash Sovereignty:** Add hash sovereignty verification for constitutional document ingestion
4. **Add Governance Approval:** Add governance approval for constitutional document mutations

## Short-Term Actions (Medium Priority)

5. **Add Replay Protection:** Add replay protection for document ingestion events
6. **Add Rate Limiting:** Add rate limiting for event emission
7. **Add Projection Integrity:** Add projection integrity verification
8. **Add Tool Authorization:** Add tool authorization verification in tool_router.py

## Long-Term Actions (Low Priority)

9. **Add Event Validation:** Add event validation for all event emissions
10. **Add Causation Verification:** Add causation verification for all events
11. **Add Audit Trail:** Add comprehensive audit trail for all mutations
12. **Add Automated Verification:** Add automated verification for constitutional compliance

---

# Compliance Matrix

| Component | Verification Gate | Source Classification | Hash Sovereignty | Governance Approval | Replay Protection | Rate Limiting |
|-----------|------------------|---------------------|------------------|-------------------|------------------|---------------|
| claim_worker.py | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| memory_ingestion_worker.py | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| constitutional_projection_worker.py | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| mission_control_knowledge_apis.py | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| tool_router.py | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| candidate_claim_worker.py | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| embedding_worker.py | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| summary_worker.py | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| classifier Worker.py | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| entity_worker.py | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| qdrant_projection_worker.py | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

**Audit Status:** COMPLETE
**Next Phase:** IMPLEMENT RECOMMENDATIONS
