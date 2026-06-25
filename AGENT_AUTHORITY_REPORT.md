# Agent Authority Report

**Audit Date:** 2026-06-24
**Audit Type:** Agent Authority Review
**Scope:** PING Agent Constitution
**Status:** AUDIT COMPLETE
**Auditor:** Constitutional Governance Agent

---

# Executive Summary

This review analyzes AGENT_CONSTITUTION.md to determine whether agents are constitutionally subordinate, whether agents can self-authorize, whether agents can originate constitutional law, and whether agents can perform prohibited actions (modify frozen documents, bypass verification, write to Tier 1, emit unverified claims).

**Agent Classes Analyzed:** 5
**Absolute Prohibitions Analyzed:** 7
**Conditional Authority Analyzed:** 6
**Constitutional Obligations Analyzed:** 5

---

# Question 1: Are Agents Constitutionally Subordinate?

## Analysis

**Definition:** Constitutional subordination means agents operate under constitutional law and cannot override or redefine constitutional principles.

**Evidence from AGENT_CONSTITUTION.md:**

### Article 1: Preamble

"This document defines the constitutional identity, authority limits, and obligations of agents operating within the PING constitutional framework. It is a participant document created under governance authority — subordinate to constitutional law and binding on all agents by governance mandate, not by agent self-ratification."

"This document may not redefine Truth, Authority Hierarchy, Governance, Replay Law, or Constitutional Identity. Those remain owned exclusively by their governing documents as identified in CONSTITUTIONAL_REPOSITORY_AUDIT.md."

"**CONSTITUTIONAL INVARIANT:** This document originates from governance authority, not from any agent. An agent may not self-authorize."

### Article 2: Authority Limits

### 2.1 Hierarchy of Authority

```
CONSTITUTIONAL_LAW       → Agents may not contravene
CANONICAL_SPEC           → Agents may not contravene
CREATOR_RESEARCH         → Agents may reference but not override
CREATOR_NOTES            → Agents may reference but not override
IMPORTED_DOCUMENT        → Agents may use as context
REPOSITORY_DOCUMENTATION → Agents may use as context
SCRIPT                   → Agents may execute but not modify
SUMMARY                  → Agents may generate (tagged appropriately)
AI_GENERATED_ANALYSIS    → Agents may generate (tagged appropriately)
TEMPORARY_OBSERVATION    → Agents may generate (tagged appropriately)
```

### Article 8: Compliance and Enforcement

### 8.1 Constitutional Sovereignty

"**CONSTITUTIONAL INVARIANT:** Agents may never originate constitutional law."

**Hierarchy:**
```
Constitution
    ↓
Governance
    ↓
AGENT_CONSTITUTION
    ↓
Agent
```

**Authority Model:**
```yaml
agents:
  may_propose: true
  may_ratify: false

governance:
  may_ratify: true
```

**Constitutional Principle:**
- Agents may propose amendments through the workflow in Article 6
- Only governance may ratify constitutional law
- This document is subordinate to constitutional law
- This document does not originate constitutional authority
- This document is binding on agents but originates from governance authority

**Evaluation:**
✅ **YES** - Agents are constitutionally subordinate

**Reasoning:**
- AGENT_CONSTITUTION.md explicitly states it is subordinate to constitutional law
- Agents may not contravene CONSTITUTIONAL_LAW or CANONICAL_SPEC
- Agents may only reference, not override, CREATOR_RESEARCH and CREATOR_NOTES
- Agents may never originate constitutional law
- Only governance may ratify constitutional law
- AGENT_CONSTITUTION.md originates from governance authority, not from agents

---

# Question 2: Can Agents Self-Authorize?

## Analysis

**Definition:** Self-authorization means agents can grant themselves authority without governance approval.

**Evidence from AGENT_CONSTITUTION.md:**

### Article 1: Preamble

"**CONSTITUTIONAL INVARIANT:** This document originates from governance authority, not from any agent. An agent may not self-authorize."

### Article 2: Authority Limits

### 2.2 Absolute Prohibitions

"An agent MUST NOT:
- Execute tool calls outside their declared authority class
- Generate content attributed as CONSTITUTIONAL_LAW or CANONICAL_SPEC"

### Article 6: Proposal Workflow

### 6.1 Constitutional Proposals

"An agent may propose constitutional changes only through the following workflow:

Step 1: DISCOVERY
  └── Detect issue (contradiction, gap, violation)
  └── Write CANDIDATE_CLAIM_CREATED with evidence

Step 2: VERIFICATION
  └── Run mechanical verification (artifact_hash + event_hash + lineage)
  └── Reference supporting constitutional documents
  └── Write CLAIM_CREATED only if verified

Step 3: PROPOSAL
  └── Write proposal as structured document
  └── Include: affected documents, proposed change, justification
  └── Reference: specific constitutional articles affected
  └── Route to governance agent for review

Step 4: REVIEW
  └── Governance agent evaluates against existing constitutional law
  └── Checks for contradictions with other proposals
  └── Approves, rejects, or requests modification

Step 5: RATIFICATION
  └── Ratified changes are recorded as SYSTEM_EVENT
  └── Update CONSTITUTIONAL_REPOSITORY_AUDIT.md if needed
  └── Affected agents are notified"

### Article 8: Compliance and Enforcement

### 8.1 Constitutional Sovereignty

**Authority Model:**
```yaml
agents:
  may_propose: true
  may_ratify: false

governance:
  may_ratify: true
```

**Evaluation:**
✅ **NO** - Agents cannot self-authorize

**Reasoning:**
- AGENT_CONSTITUTION.md explicitly states "An agent may not self-authorize"
- Agents may propose changes but cannot ratify them
- Only governance may ratify constitutional law
- All authority originates from governance, not from agents
- Agents must follow the proposal workflow (Article 6) for any constitutional changes

---

# Question 3: Can Agents Originate Constitutional Law?

## Analysis

**Definition:** Originating constitutional law means agents can create new constitutional law without governance ratification.

**Evidence from AGENT_CONSTITUTION.md:**

### Article 1: Preamble

"This document may not redefine Truth, Authority Hierarchy, Governance, Replay Law, or Constitutional Identity. Those remain owned exclusively by their governing documents as identified in CONSTITUTIONAL_REPOSITORY_AUDIT.md."

"**CONSTITUTIONAL INVARIANT:** This document originates from governance authority, not from any agent. An agent may not self-authorize."

### Article 2: Authority Limits

### 2.2 Absolute Prohibitions

"An agent MUST NOT:
- Generate content attributed as CONSTITUTIONAL_LAW or CANONICAL_SPEC"

### Article 8: Compliance and Enforcement

### 8.1 Constitutional Sovereignty

"**CONSTITUTIONAL INVARIANT:** Agents may never originate constitutional law."

**Evaluation:**
✅ **NO** - Agents cannot originate constitutional law

**Reasoning:**
- AGENT_CONSTITUTION.md explicitly states "Agents may never originate constitutional law"
- Agents may not generate content attributed as CONSTITUTIONAL_LAW
- Agents may not generate content attributed as CANONICAL_SPEC
- Constitutional domains (Truth, Authority Hierarchy, Governance, Replay Law, Constitutional Identity) are owned exclusively by their governing documents
- AGENT_CONSTITUTION.md itself originates from governance authority, not from agents

---

# Question 4: Can Agents Modify Frozen Documents?

## Analysis

**Definition:** Modifying frozen documents means agents can change documents with FROZEN or FREEZE status.

**Evidence from AGENT_CONSTITUTION.md:**

### Article 2: Authority Limits

### 2.2 Absolute Prohibitions

"An agent MUST NOT:
- Modify or delete a FROZEN CONSTITUTIONAL AUTHORITY document
- Modify or delete a CONSTITUTIONAL FREEZE document
- Change any document's FROZEN or FREEZE status"

### Article 7: Constitutional Obligations

### 7.3 TASK Agents (Workers)

"Task agents MUST additionally:
1. **Never emit to Tier 1** (constitutional_documents collection)
2. **Never modify FROZEN documents**
3. Register with supervisor before accepting work
4. Provide heartbeats at configurable intervals
5. Stop on constitutional violation detection until governance resolves"

### Article 8: Compliance and Enforcement

### 8.2 Violation Handling

| Violation | Severity | Response |
|-----------|----------|----------|
| Tier 1 modification | CRITICAL | Agent must stop and restore from Postgres |

**Evaluation:**
✅ **NO** - Agents cannot modify frozen documents

**Reasoning:**
- AGENT_CONSTITUTION.md explicitly prohibits agents from modifying FROZEN CONSTITUTIONAL AUTHORITY documents
- AGENT_CONSTITUTION.md explicitly prohibits agents from modifying CONSTITUTIONAL FREEZE documents
- AGENT_CONSTITUTION.md explicitly prohibits agents from changing any document's FROZEN or FREEZE status
- Task agents must never modify FROZEN documents
- Tier 1 modification is a CRITICAL violation requiring agent to stop and restore from Postgres

---

# Question 5: Can Agents Bypass Verification Gates?

## Analysis

**Definition:** Bypassing verification gates means agents can emit CLAIM_CREATED or OBSERVATION_CREATED events without passing the verification gate.

**Evidence from AGENT_CONSTITUTION.md:**

### Article 2: Authority Limits

### 2.2 Absolute Prohibitions

"An agent MUST NOT:
- Emit a CLAIM_CREATED or OBSERVATION_CREATED event without verification (see verification gate)"

### 2.3 Conditional Authority

"An agent MAY generate:
- `CANDIDATE_CLAIM_CREATED` events (always, unverified)
- `SUMMARY` or `AI_GENERATED_ANALYSIS` tagged content (always, with source tags)
- `TEMPORARY_OBSERVATION` events (always, with unverified tag)
- `DOCUMENT_IMPORTED` events (only when content_hash matches artifact)
- `CLAIM_CREATED` events (ONLY after passing the verification gate: artifact_hash + event_hash + lineage check)
- `OBSERVATION_CREATED` events (only from 7B model, never from 14B)"

### Article 5: Execution Boundaries

### 5.1 Tool Execution Authority

| Tool | Allowed Agents | Verification Required | Max Rate |
|------|---------------|----------------------|----------|
| - CANDIDATE_CLAIM_CREATED | TASK_AGENT | None | 30/min |
| - CLAIM_CREATED | TASK_AGENT | Full verification gate | 10/min |
| - OBSERVATION_CREATED | INFERENCE_AGENT (7B only) | Source classification | 30/min |

### Article 7: Constitutional Obligations

### 7.1 All Agents

"Every agent MUST:
2. **Never emit CLAIM_CREATED without verification** (use CANDIDATE_CLAIM_CREATED for unverified claims)"

### 7.2 Governance Agents

"Governance agents MUST additionally:
5. **Never bypass the verification gate** (even in emergency mode, log the bypass)"

### Article 8: Compliance and Enforcement

### 8.2 Violation Handling

| Violation | Severity | Response |
|-----------|----------|----------|
| Unverified CLAIM_CREATED | CRITICAL | Agent must stop and escalate to governance |

**Evaluation:**
⚠️ **PARTIAL** - Agents cannot bypass verification gates in AGENT_CONSTITUTION.md, but claim_worker.py has a `--force` bypass

**Reasoning:**
- AGENT_CONSTITUTION.md explicitly prohibits agents from emitting CLAIM_CREATED or OBSERVATION_CREATED events without verification
- AGENT_CONSTITUTION.md explicitly states agents must never emit CLAIM_CREATED without verification
- AGENT_CONSTITUTION.md explicitly states governance agents must never bypass the verification gate
- Unverified CLAIM_CREATED is a CRITICAL violation requiring agent to stop and escalate to governance
- However, claim_worker.py has a `--force` flag that bypasses the verification gate (ATTACK_SURFACE_REPORT.md)

**Issue:** AGENT_CONSTITUTION.md prohibits verification bypass, but claim_worker.py implements a `--force` bypass. This is a constitutional violation.

---

# Question 6: Can Agents Write to Tier 1 Collections?

## Analysis

**Definition:** Writing to Tier 1 collections means agents can modify the constitutional_documents collection.

**Evidence from AGENT_CONSTITUTION.md:**

### Article 2: Authority Limits

### 2.2 Absolute Prohibitions

"An agent MUST NOT:
- Write directly to the Qdrant `constitutional_documents` collection (Postgres-first, projection-second)"

### Article 4: Memory Semantics

### 4.1 Memory Tiers

| Tier | Collection | Authority | Persistence | Agent Access |
|------|-----------|-----------|-------------|--------------|
| **Tier 1** | `constitutional_documents` | CONSTITUTIONAL_LAW | Postgres + Qdrant | Read-only (most agents), Write (governance only) |

### 4.2 Memory Access Rules

"- Tier 1 may NOT be modified by any agent. Only the constitutional ingestion pipeline may create Tier 1 points.
- Tier 2 may be modified by agents with event_id verification (must reference a verified Postgres event).
- Tier 3 may be freely read and written by any agent, but carries no authority weight."

### Article 7: Constitutional Obligations

### 7.3 TASK Agents (Workers)

"Task agents MUST additionally:
1. **Never emit to Tier 1** (constitutional_documents collection)"

### Article 8: Compliance and Enforcement

### 8.2 Violation Handling

| Violation | Severity | Response |
|-----------|----------|----------|
| Tier 1 modification | CRITICAL | Agent must stop and restore from Postgres |

**Evaluation:**
✅ **NO** - Agents cannot write to Tier 1 collections

**Reasoning:**
- AGENT_CONSTITUTION.md explicitly prohibits agents from writing directly to the Qdrant constitutional_documents collection
- Tier 1 may NOT be modified by any agent
- Only the constitutional ingestion pipeline may create Tier 1 points
- Task agents must never emit to Tier 1
- Tier 1 modification is a CRITICAL violation requiring agent to stop and restore from Postgres

---

# Question 7: Can Agents Emit Unverified CLAIM_CREATED Events?

## Analysis

**Definition:** Emitting unverified CLAIM_CREATED events means agents can create claims without passing the verification gate.

**Evidence from AGENT_CONSTITUTION.md:**

### Article 2: Authority Limits

### 2.2 Absolute Prohibitions

"An agent MUST NOT:
- Emit a CLAIM_CREATED or OBSERVATION_CREATED event without verification (see verification gate)"

### 2.3 Conditional Authority

"An agent MAY generate:
- `CANDIDATE_CLAIM_CREATED` events (always, unverified)
- `CLAIM_CREATED` events (ONLY after passing the verification gate: artifact_hash + event_hash + lineage check)"

### Article 7: Constitutional Obligations

### 7.1 All Agents

"Every agent MUST:
2. **Never emit CLAIM_CREATED without verification** (use CANDIDATE_CLAIM_CREATED for unverified claims)"

### Article 8: Compliance and Enforcement

### 8.2 Violation Handling

| Violation | Severity | Response |
|-----------|----------|----------|
| Unverified CLAIM_CREATED | CRITICAL | Agent must stop and escalate to governance |

**Evaluation:**
✅ **NO** - Agents cannot emit unverified CLAIM_CREATED events (per AGENT_CONSTITUTION.md)

**Reasoning:**
- AGENT_CONSTITUTION.md explicitly prohibits agents from emitting CLAIM_CREATED events without verification
- AGENT_CONSTITUTION.md explicitly states agents must never emit CLAIM_CREATED without verification
- AGENT_CONSTITUTION.md provides CANDIDATE_CLAIM_CREATED for unverified claims
- Unverified CLAIM_CREATED is a CRITICAL violation requiring agent to stop and escalate to governance

**Issue:** AGENT_CONSTITUTION.md prohibits unverified CLAIM_CREATED, but claim_worker.py has a `--force` bypass that allows unverified claims. This is a constitutional violation.

---

# Agent Class Analysis

## TASK_AGENT

**Definition:** Executes specific tasks within defined boundaries

**Examples:** claim_worker, summary_worker, embedding_worker

**Authority Limits:**
- ✅ May not contravene CONSTITUTIONAL_LAW or CANONICAL_SPEC
- ✅ May not modify FROZEN documents
- ✅ May not write to Tier 1 collections
- ✅ May not emit unverified CLAIM_CREATED (per AGENT_CONSTITUTION.md)
- ⚠️ claim_worker.py has `--force` bypass (constitutional violation)

**Conditional Authority:**
- ✅ May emit CANDIDATE_CLAIM_CREATED (always, unverified)
- ✅ May emit SUMMARY or AI_GENERATED_ANALYSIS (with source tags)
- ✅ May emit TEMPORARY_OBSERVATION (with unverified tag)
- ✅ May emit CLAIM_CREATED (ONLY after verification gate)
- ✅ May emit DOCUMENT_IMPORTED (only when content_hash matches artifact)

**Constitutional Obligations:**
- ✅ Tag all generated content
- ✅ Never emit CLAIM_CREATED without verification
- ✅ Verify Qdrant results against Postgres
- ✅ Record causation chain
- ✅ Respect memory tier boundaries
- ✅ Boot cleanly
- ✅ Report failures
- ✅ Never emit to Tier 1
- ✅ Never modify FROZEN documents
- ✅ Register with supervisor
- ✅ Provide heartbeats
- ✅ Stop on constitutional violation detection

---

## INTERFACE_AGENT

**Definition:** Responds to external queries with retrieval

**Examples:** Mission Control API, Open WebUI

**Authority Limits:**
- ✅ May not contravene CONSTITUTIONAL_LAW or CANONICAL_SPEC
- ✅ May not modify FROZEN documents
- ✅ May not write to Tier 1 collections
- ✅ May not emit unverified CLAIM_CREATED

**Conditional Authority:**
- ✅ May emit CANDIDATE_CLAIM_CREATED (always, unverified)
- ✅ May emit SUMMARY or AI_GENERATED_ANALYSIS (with source tags)
- ✅ May emit TEMPORARY_OBSERVATION (with unverified tag)

**Constitutional Obligations:**
- ✅ Tag all generated content
- ✅ Never emit CLAIM_CREATED without verification
- ✅ Verify Qdrant results against Postgres
- ✅ Record causation chain
- ✅ Respect memory tier boundaries
- ✅ Boot cleanly
- ✅ Report failures
- ✅ Verify every constitutional search result against Postgres
- ✅ Include authority_resolution block in every constitutional response
- ✅ Never expose raw Qdrant scores as authority measures
- ✅ Rate-limit tool execution

---

## PROJECTION_AGENT

**Definition:** Computes projections from event data

**Examples:** qdrant_projection_worker, constitutional_projection_worker

**Authority Limits:**
- ✅ May not contravene CONSTITUTIONAL_LAW or CANONICAL_SPEC
- ✅ May not modify FROZEN documents
- ✅ May not write to Tier 1 collections
- ✅ May not emit unverified CLAIM_CREATED

**Conditional Authority:**
- ✅ May emit PROJECTION_REBUILT (after Qdrant ACK)

**Constitutional Obligations:**
- ✅ Tag all generated content
- ✅ Never emit CLAIM_CREATED without verification
- ✅ Verify Qdrant results against Postgres
- ✅ Record causation chain
- ✅ Respect memory tier boundaries
- ✅ Boot cleanly
- ✅ Report failures

---

## INFERENCE_AGENT

**Definition:** Uses models to generate or classify

**Examples:** ollama queries, model routing

**Authority Limits:**
- ✅ May not contravene CONSTITUTIONAL_LAW or CANONICAL_SPEC
- ✅ May not modify FROZEN documents
- ✅ May not write to Tier 1 collections
- ✅ May not emit unverified CLAIM_CREATED
- ✅ May not route 14B model to OBSERVATION_CREATED tasks
- ✅ May not route 7B model to task planning tasks

**Conditional Authority:**
- ✅ May emit CANDIDATE_CLAIM_CREATED (always, unverified)
- ✅ May emit SUMMARY or AI_GENERATED_ANALYSIS (with source tags)
- ✅ May emit TEMPORARY_OBSERVATION (with unverified tag)
- ✅ May emit OBSERVATION_CREATED (only from 7B model, never from 14B)

**Constitutional Obligations:**
- ✅ Tag all generated content
- ✅ Never emit CLAIM_CREATED without verification
- ✅ Verify Qdrant results against Postgres
- ✅ Record causation chain
- ✅ Respect memory tier boundaries
- ✅ Boot cleanly
- ✅ Report failures
- ✅ Never route 14B model to OBSERVATION_CREATED tasks
- ✅ Never route 7B model to task planning tasks
- ✅ Tag all model output with model name and version
- ✅ Cap newsletter topic confidence at 0.6
- ✅ Never treat model output as constitutional authority

---

## GOVERNANCE_AGENT

**Definition:** Audits, verifies, or enforces constitutional rules

**Examples:** This agent, supervisor, constitutional self-check

**Authority Limits:**
- ✅ May not contravene CONSTITUTIONAL_LAW or CANONICAL_SPEC
- ✅ May not modify FROZEN documents
- ✅ May not write to Tier 1 collections
- ✅ May not emit unverified CLAIM_CREATED
- ✅ May not bypass the verification gate (even in emergency mode)

**Conditional Authority:**
- ✅ May emit CANDIDATE_CLAIM_CREATED (always, unverified)
- ✅ May emit SUMMARY or AI_GENERATED_ANALYSIS (with source tags)
- ✅ May emit TEMPORARY_OBSERVATION (with unverified tag)
- ✅ May ratify constitutional law (only governance may ratify)

**Constitutional Obligations:**
- ✅ Tag all generated content
- ✅ Never emit CLAIM_CREATED without verification
- ✅ Verify Qdrant results against Postgres
- ✅ Record causation chain
- ✅ Respect memory tier boundaries
- ✅ Boot cleanly
- ✅ Report failures
- ✅ Run constitutional self-check before each session
- ✅ Escalate contradictions found between constitutional documents
- ✅ Verify frozen document integrity (hash comparison) each session
- ✅ Update AGENTS.md with session activity
- ✅ Never bypass the verification gate (even in emergency mode, log the bypass)

---

# Summary of Findings

## Critical Issues (Must Fix)

1. **claim_worker.py Verification Bypass** - AGENT_CONSTITUTION.md prohibits verification bypass, but claim_worker.py has a `--force` flag that allows bypass. This is a constitutional violation.

## High Priority Issues (Should Fix)

None - AGENT_CONSTITUTION.md is well-structured and comprehensive.

## Medium Priority Issues (Should Review)

None - AGENT_CONSTITUTION.md is well-structured and comprehensive.

## Low Priority Issues (Nice to Have)

1. **Emergency Proposal Workflow** - Article 6.2 allows emergency proposals to bypass Steps 1-2. This should be clarified to require governance approval.

---

# Recommendations

## Immediate Actions (Before Freeze)

1. **Remove Emergency Bypass** - Remove or strictly limit `--force` bypass in claim_worker.py to comply with AGENT_CONSTITUTION.md

## Short-Term Actions (After Freeze)

2. **Clarify Emergency Proposal Workflow** - Clarify that emergency proposals still require governance approval, just bypass initial discovery/verification steps

## Long-Term Actions (Future)

3. **Add Automated Enforcement** - Add automated enforcement of AGENT_CONSTITUTION.md rules (e.g., prevent Tier 1 writes, prevent unverified CLAIM_CREATED)

---

# Blocking Issues

**1 BLOCKING ISSUE:**

**claim_worker.py Verification Bypass** - AGENT_CONSTITUTION.md prohibits verification bypass, but claim_worker.py has a `--force` flag that allows bypass. This is a constitutional violation.

---

**Audit Status:** COMPLETE
**Next Review:** Freeze Procedure
