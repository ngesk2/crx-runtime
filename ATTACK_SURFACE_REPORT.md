# Attack Surface Report

**Audit Date:** 2026-06-24
**Audit Type:** Runtime Attack Surface Review
**Scope:** PING Mutation-Capable Components
**Status:** AUDIT COMPLETE
**Auditor:** Constitutional Governance Agent

---

# Executive Summary

This review analyzes the constitutional_attack_surface.md to determine which components can mutate constitutional truth, bypass authority checks, bypass verification, poison lineage, and poison witnesses. The review focuses on high-risk components: claim_worker.py, memory_ingestion_worker.py, projection workers, repository cognition, context pack builder, reasoning gateway, and projection sovereignty verifier.

**Components Analyzed:** 12 mutation-capable components
**High-Risk Components:** 3
**Medium-Risk Components:** 6
**Low-Risk Components:** 3

---

# Question 1: Which Components Can Mutate Constitutional Truth?

## Analysis

**Definition:** Constitutional truth is immutable verified events in PostgreSQL event store (TRUTH_LAW.md)

**Components That Can Mutate Constitutional Truth:**

### 1. claim_worker.py (HIGH RISK)

**Mutation Capability:** Event Store Write

**Can Mutate Constitutional Truth:** YES

**Mechanism:**
- Emits CLAIM_CREATED events to PostgreSQL event store
- CLAIM_CREATED events are constitutional events (EVENT_LAW.md)
- Verification gate can be bypassed with `--force` flag
- Unverified claims can become constitutional truth

**Attack Vector:**
- Using `--force` flag to bypass verification gate
- Unverified CLAIM_CREATED events become constitutional truth
- Violates TRUTH_LAW.md (unverified event treated as truth)
- Violates MUTATION_LAW.md (bypass_verification is prohibited)

**Risk Level:** HIGH

---

### 2. memory_ingestion_worker.py (HIGH RISK)

**Mutation Capability:** PostgreSQL Write + Qdrant Write

**Can Mutate Constitutional Truth:** YES (indirect)

**Mechanism:**
- Inserts documents into PostgreSQL `documents` table
- Can ingest documents with constitutional source_type
- Can overwrite constitutional documents with non-constitutional content
- No source_type verification before ingestion

**Attack Vector:**
- Ingesting non-constitutional document with constitutional source_type
- Overwriting constitutional truth in PostgreSQL
- Violates TRUTH_LAW.md (non-constitutional content treated as truth)
- Violates IDENTITY_LAW.md (identity spoofing)

**Risk Level:** HIGH

---

### 3. Any Direct PostgreSQL UPDATE (HIGH RISK)

**Mutation Capability:** Direct Database Modification

**Can Mutate Constitutional Truth:** YES

**Mechanism:**
- Direct UPDATE on events table
- Direct UPDATE on documents table
- Direct UPDATE on constitutional_freeze_registry table
- No triggers to prevent silent mutation (FREEZE_REGISTRY_REVIEW.md)

**Attack Vector:**
- Direct database modification bypasses event recording
- Direct database modification bypasses policy evaluation
- Direct database modification bypasses replay verification
- Direct database modification bypasses witness generation
- Violates MUTATION_LAW.md (direct_state_edit is prohibited)
- Violates MUTATION_LAW.md (shadow_governance)

**Risk Level:** HIGH

---

**Summary:**
- **3 components** can mutate constitutional truth
- **claim_worker.py** (verification bypass)
- **memory_ingestion_worker.py** (source_type spoofing)
- **Direct PostgreSQL UPDATE** (silent mutation)

---

# Question 2: Which Components Can Bypass Authority Checks?

## Analysis

**Definition:** Authority checks verify that actors have constitutional authority for their actions (AUTHORITY_TAXONOMY_SPEC.md)

**Components That Can Bypass Authority Checks:**

### 1. claim_worker.py (HIGH RISK)

**Can Bypass Authority Checks:** YES

**Mechanism:**
- `--force` flag bypasses verification gate
- Verification gate includes authority verification
- Bypass allows unverified actors to emit constitutional events

**Attack Vector:**
- Using `--force` flag to bypass authority verification
- Unverified actors can emit CLAIM_CREATED events
- Violates AUTHORITY_TAXONOMY_SPEC.md (authority bypass)
- Violates MUTATION_LAW.md (bypass_verification)

**Risk Level:** HIGH

---

### 2. memory_ingestion_worker.py (MEDIUM RISK)

**Can Bypass Authority Checks:** PARTIAL

**Mechanism:**
- No authority verification before document ingestion
- No governance approval for constitutional document ingestion
- Can ingest constitutional documents without authority

**Attack Vector:**
- Ingesting constitutional documents without governance approval
- Ingesting constitutional documents without authority verification
- Violates AUTHORITY_TAXONOMY_SPEC.md (governance bypass)
- Violates MUTATION_LAW.md (shadow_governance)

**Risk Level:** MEDIUM

---

### 3. Direct PostgreSQL UPDATE (HIGH RISK)

**Can Bypass Authority Checks:** YES

**Mechanism:**
- Direct UPDATE bypasses all authority checks
- No triggers to enforce authority checks
- No governance approval required

**Attack Vector:**
- Direct database modification bypasses authority checks
- Direct database modification bypasses governance approval
- Violates AUTHORITY_TAXONOMY_SPEC.md (authority bypass)
- Violates MUTATION_LAW.md (shadow_governance)

**Risk Level:** HIGH

---

**Summary:**
- **3 components** can bypass authority checks
- **claim_worker.py** (verification bypass)
- **memory_ingestion_worker.py** (no authority verification)
- **Direct PostgreSQL UPDATE** (silent bypass)

---

# Question 3: Which Components Can Bypass Verification?

## Analysis

**Definition:** Verification gates ensure constitutional compliance before mutations take effect (MUTATION_LAW.md)

**Components That Can Bypass Verification:**

### 1. claim_worker.py (HIGH RISK)

**Can Bypass Verification:** YES

**Mechanism:**
- `--force` flag bypasses verification gate
- Verification gate includes: artifact_hash + event_chain + lineage
- Bypass allows unverified claims to become constitutional truth

**Attack Vector:**
- Using `--force` flag to bypass verification gate
- Unverified claims become constitutional truth
- Violates TRUTH_LAW.md (unverified event treated as truth)
- Violates MUTATION_LAW.md (bypass_verification is prohibited)

**Risk Level:** HIGH

---

### 2. memory_ingestion_worker.py (MEDIUM RISK)

**Can Bypass Verification:** YES (by design)

**Mechanism:**
- No verification gate for document ingestion
- No hash sovereignty verification for constitutional documents
- No dependency verification for document ingestion

**Attack Vector:**
- Ingesting documents without verification
- Ingesting constitutional documents without hash sovereignty verification
- Violates TRUTH_LAW.md (unverified content treated as truth)
- Violates MUTATION_LAW.md (bypass_verification is prohibited)

**Risk Level:** MEDIUM

---

### 3. projection workers (LOW RISK)

**Can Bypass Verification:** YES (by design)

**Mechanism:**
- No verification gate for projection
- Projections are rebuildable from PostgreSQL
- PostgreSQL verification is optional

**Attack Vector:**
- Projecting documents without verification
- Corrupting projections (rebuildable but not verified)
- Violates TRUTH_LAW.md (projection treated as truth)

**Risk Level:** LOW

---

### 4. Direct PostgreSQL UPDATE (HIGH RISK)

**Can Bypass Verification:** YES

**Mechanism:**
- Direct UPDATE bypasses all verification gates
- No triggers to enforce verification
- No verification required

**Attack Vector:**
- Direct database modification bypasses verification
- Direct database modification bypasses all constitutional checks
- Violates MUTATION_LAW.md (bypass_verification is prohibited)
- Violates MUTATION_LAW.md (direct_state_edit is prohibited)

**Risk Level:** HIGH

---

**Summary:**
- **4 components** can bypass verification
- **claim_worker.py** (verification bypass)
- **memory_ingestion_worker.py** (no verification gate)
- **projection workers** (no verification gate by design)
- **Direct PostgreSQL UPDATE** (silent bypass)

---

# Question 4: Which Components Can Poison Lineage?

## Analysis

**Definition:** Lineage is the DAG of parent-child relationships between artifacts (IDENTITY_LAW.md)

**Components That Can Poison Lineage:**

### 1. memory_ingestion_worker.py (MEDIUM RISK)

**Can Poison Lineage:** YES

**Mechanism:**
- Can ingest documents with fake lineage metadata
- No lineage verification before ingestion
- Can create circular lineage references

**Attack Vector:**
- Ingesting documents with fake lineage
- Creating circular lineage references
- Violates IDENTITY_LAW.md (lineage determinism)
- Violates MUTATION_LAW.md (lineage_cycle_mutation is prohibited)

**Risk Level:** MEDIUM

---

### 2. Direct PostgreSQL UPDATE (HIGH RISK)

**Can Poison Lineage:** YES

**Mechanism:**
- Direct UPDATE on lineage table
- Can modify parent-child relationships
- Can create circular lineage references
- No triggers to prevent lineage poisoning

**Attack Vector:**
- Direct lineage modification bypasses lineage verification
- Creating circular lineage references
- Violates IDENTITY_LAW.md (lineage determinism)
- Violates MUTATION_LAW.md (lineage_cycle_mutation is prohibited)

**Risk Level:** HIGH

---

### 3. claim_worker.py (LOW RISK)

**Can Poison Lineage:** PARTIAL

**Mechanism:**
- Verification gate includes lineage verification
- Lineage verification checks lineage depth > 0
- Bypass with `--force` flag allows lineage poisoning

**Attack Vector:**
- Using `--force` flag to bypass lineage verification
- Creating claims with fake lineage
- Violates IDENTITY_LAW.md (lineage determinism)

**Risk Level:** LOW

---

**Summary:**
- **3 components** can poison lineage
- **memory_ingestion_worker.py** (no lineage verification)
- **Direct PostgreSQL UPDATE** (silent lineage poisoning)
- **claim_worker.py** (verification bypass)

---

# Question 5: Which Components Can Poison Witnesses?

## Analysis

**Definition:** Witness is a deterministic evidence artifact attesting to bindings between content, identity, lineage, or constitutional context (WITNESS_LAW.md)

**Components That Can Poison Witnesses:**

### 1. Direct PostgreSQL UPDATE (HIGH RISK)

**Can Poison Witnesses:** YES

**Mechanism:**
- Direct UPDATE on witness tables
- Can modify witness hashes
- Can modify witness metadata
- No triggers to prevent witness poisoning

**Attack Vector:**
- Direct witness modification bypasses witness verification
- Corrupting witness hashes
- Violates WITNESS_LAW.md (witness determinism)
- Violates MUTATION_LAW.md (unverifiable_mutation is prohibited)

**Risk Level:** HIGH

---

### 2. memory_ingestion_worker.py (LOW RISK)

**Can Poison Witnesses:** PARTIAL

**Mechanism:**
- Can ingest documents that affect witness generation
- No witness verification after ingestion
- Witness may be generated from corrupted documents

**Attack Vector:**
- Ingesting corrupted documents affects witness generation
- Witness generated from corrupted documents
- Violates WITNESS_LAW.md (witness determinism)

**Risk Level:** LOW

---

### 3. claim_worker.py (LOW RISK)

**Can Poison Witnesses:** PARTIAL

**Mechanism:**
- Can emit claims that affect witness generation
- Bypass with `--force` flag allows unverified claims
- Witness may be generated from unverified claims

**Attack Vector:**
- Emitting unverified claims affects witness generation
- Witness generated from unverified claims
- Violates WITNESS_LAW.md (witness determinism)

**Risk Level:** LOW

---

**Summary:**
- **3 components** can poison witnesses
- **Direct PostgreSQL UPDATE** (silent witness poisoning)
- **memory_ingestion_worker.py** (corrupted document ingestion)
- **claim_worker.py** (unverified claim emission)

---

# Component-Specific Analysis

## claim_worker.py

**Risk Level:** HIGH (due to verification bypass)

**Attack Capabilities:**
- ✅ Can mutate constitutional truth (CLAIM_CREATED events)
- ✅ Can bypass authority checks (--force flag)
- ✅ Can bypass verification (--force flag)
- ⚠️ Can poison lineage (--force flag)
- ⚠️ Can poison witnesses (--force flag)

**Constitutional Protections:**
- Verification gate (artifact_hash + event_chain + lineage)
- Source classification tagging
- Verification evidence logging

**Missing Protections:**
- No governance approval for emergency bypass
- No automatic verification enforcement
- No bypass logging to governance

**Recommendation:**
- Remove or strictly limit `--force` bypass
- Add governance approval for emergency bypass
- Add automatic verification enforcement

---

## memory_ingestion_worker.py

**Risk Level:** HIGH (due to constitutional source_type spoofing)

**Attack Capabilities:**
- ✅ Can mutate constitutional truth (document ingestion)
- ⚠️ Can bypass authority checks (no authority verification)
- ✅ Can bypass verification (no verification gate)
- ✅ Can poison lineage (no lineage verification)
- ⚠️ Can poison witnesses (corrupted document ingestion)

**Constitutional Protections:**
- Content hashing for integrity
- Document hash prevents duplicate ingestion
- Event emission for audit trail

**Missing Protections:**
- No source_type verification
- No hash sovereignty verification
- No governance approval for constitutional ingestion
- No lineage verification

**Recommendation:**
- Add source_type verification
- Add hash sovereignty verification
- Add governance approval for constitutional ingestion
- Add lineage verification

---

## constitutional_projection_worker.py

**Risk Level:** LOW (Qdrant is projection, not authoritative)

**Attack Capabilities:**
- ❌ Cannot mutate constitutional truth (Qdrant is projection)
- ❌ Cannot bypass authority checks (read-only)
- ⚠️ Can bypass verification (no verification gate by design)
- ❌ Cannot poison lineage (read-only)
- ❌ Cannot poison witnesses (read-only)

**Constitutional Protections:**
- Qdrant is projection cache, not authority store
- Projections are rebuildable from vault
- PostgreSQL verification required for authoritative results

**Missing Protections:**
- No PostgreSQL verification before projection
- No authority level validation against constitutional registry

**Recommendation:**
- Add PostgreSQL verification before projection
- Add authority level validation

---

## mission_control_knowledge_apis.py

**Risk Level:** LOW (read-only APIs)

**Attack Capabilities:**
- ❌ Cannot mutate constitutional truth (read-only)
- ❌ Cannot bypass authority checks (read-only)
- ❌ Cannot bypass verification (read-only)
- ❌ Cannot poison lineage (read-only)
- ❌ Cannot poison witnesses (read-only)

**Constitutional Protections:**
- Read-only access to PostgreSQL
- Qdrant results verified against PostgreSQL
- No direct data mutation capability

**Missing Protections:**
- No rate limiting for search events
- No query validation

**Recommendation:**
- Add rate limiting for search events
- Add query validation

---

## tool_router.py

**Risk Level:** LOW (read-only tool routing)

**Attack Capabilities:**
- ❌ Cannot mutate constitutional truth (read-only)
- ❌ Cannot bypass authority checks (read-only)
- ❌ Cannot bypass verification (read-only)
- ❌ Cannot poison lineage (read-only)
- ❌ Cannot poison witnesses (read-only)

**Constitutional Protections:**
- Fixed tool map (prevents arbitrary tool execution)
- Timeout protection
- Tool path validation

**Missing Protections:**
- No tool authorization verification
- No tool execution audit logging

**Recommendation:**
- Add tool authorization verification
- Add tool execution audit logging

---

# Summary of Findings

## Critical Issues (Must Fix)

1. **claim_worker.py Verification Bypass** - `--force` flag allows bypass of verification gate, authority checks, and lineage verification
2. **memory_ingestion_worker.py Source Type Spoofing** - No source_type verification allows constitutional document overwrite
3. **Direct PostgreSQL UPDATE** - No triggers to prevent silent mutation, authority bypass, verification bypass, lineage poisoning, witness poisoning

## High Priority Issues (Should Fix)

4. **memory_ingestion_worker.py Hash Sovereignty** - No hash sovereignty verification for constitutional documents
5. **memory_ingestion_worker.py Governance Approval** - No governance approval for constitutional document ingestion
6. **memory_ingestion_worker.py Lineage Verification** - No lineage verification for document ingestion

## Medium Priority Issues (Should Review)

7. **Projection Workers Verification** - No PostgreSQL verification before projection
8. **Tool Router Authorization** - No tool authorization verification
9. **Rate Limiting** - No rate limiting for event emission

## Low Priority Issues (Nice to Have)

10. **Query Validation** - No query validation for search APIs
11. **Context Pack Validation** - No context pack integrity verification
12. **Projection Integrity Verification** - No projection integrity verification

---

# Recommendations

## Immediate Actions (Before Freeze)

1. **Remove Emergency Bypass** - Remove or strictly limit `--force` bypass in claim_worker.py
2. **Add Source Type Verification** - Add source_type verification in memory_ingestion_worker.py
3. **Add Database Triggers** - Add triggers to prevent silent PostgreSQL UPDATE/DELETE
4. **Add Hash Sovereignty Verification** - Add hash sovereignty verification for constitutional documents

## Short-Term Actions (After Freeze)

5. **Add Governance Approval** - Add governance approval for constitutional document ingestion
6. **Add Lineage Verification** - Add lineage verification for document ingestion
7. **Add PostgreSQL Verification** - Add PostgreSQL verification before projection
8. **Add Tool Authorization** - Add tool authorization verification in tool_router.py

## Long-Term Actions (Future)

9. **Add Rate Limiting** - Add rate limiting for event emission
10. **Add Query Validation** - Add query validation for search APIs
11. **Add Context Pack Validation** - Add context pack integrity verification
12. **Add Projection Integrity Verification** - Add projection integrity verification

---

# Blocking Issues

**3 BLOCKING ISSUES:**

1. **claim_worker.py Verification Bypass** - `--force` flag allows bypass of verification gate, authority checks, and lineage verification
2. **memory_ingestion_worker.py Source Type Spoofing** - No source_type verification allows constitutional document overwrite
3. **Direct PostgreSQL UPDATE** - No triggers to prevent silent mutation, authority bypass, verification bypass, lineage poisoning, witness poisoning

---

**Audit Status:** COMPLETE
**Next Review:** Agent Authority
