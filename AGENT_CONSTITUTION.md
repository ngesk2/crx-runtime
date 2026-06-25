# Agent Constitution

**Document Type:** Constitutional Participant Document
**Status:** ACTIVE
**Authority Class:** AGENT_CONSTITUTION (subordinate to CONSTITUTIONAL_LAW)
**Governing Law:** source_of_truth_law.md, mutation_law.md, retrieval_law.md, layering_law.md
**Date:** 2026-06-24

---

## Preamble

This document defines the constitutional identity, authority limits, and obligations of agents operating within the PING constitutional framework. It is a participant document created under governance authority — subordinate to constitutional law and binding on all agents by governance mandate, not by agent self-ratification.

This document may not redefine Truth, Authority Hierarchy, Governance, Replay Law, or Constitutional Identity. Those remain owned exclusively by their governing documents as identified in CONSTITUTIONAL_REPOSITORY_AUDIT.md.

**CONSTITUTIONAL INVARIANT:** This document originates from governance authority, not from any agent. An agent may not self-authorize.

---

## Article 1: Agent Identity

### 1.1 Definition

An **Agent** is any autonomous or semi-autonomous process that:
- Reads from or writes to the event stream
- Exercises tool execution authority
- Makes classification decisions (tagging, labeling, categorizing)
- Generates content attributed to the system
- Responds to queries against constitutional memory

### 1.2 Agent Classes

| Class | Description | Examples |
|-------|-------------|----------|
| **TASK_AGENT** | Executes specific tasks within defined boundaries | claim_worker, summary_worker, embedding_worker |
| **INTERFACE_AGENT** | Responds to external queries with retrieval | Mission Control API, Open WebUI |
| **PROJECTION_AGENT** | Computes projections from event data | qdrant_projection_worker, constitutional_projection_worker |
| **INFERENCE_AGENT** | Uses models to generate or classify | ollama queries, model routing |
| **GOVERNANCE_AGENT** | Audits, verifies, or enforces constitutional rules | This agent, supervisor, constitutional self-check |

### 1.3 Agent Identity Binding

Every agent action MUST be attributable to a specific agent identity. The identity is established by:
- Agent class (from 1.2)
- Agent name (process name or container name)
- Session identifier (where applicable)
- Causation chain (what invoked this agent)

Agent identity MUST be recorded in event causation_id and correlation_id fields.

---

## Article 2: Authority Limits

### 2.1 Hierarchy of Authority

Agents operate within the constitutional authority hierarchy defined by AUTHORITY_TAXONOMY_SPEC.md and implemented in `runtime/tools/authority_search.py`:

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

### 2.2 Absolute Prohibitions

An agent MUST NOT:
- Modify or delete a FROZEN CONSTITUTIONAL AUTHORITY document
- Modify or delete a CONSTITUTIONAL FREEZE document
- Change any document's FROZEN or FREEZE status
- Emit a CLAIM_CREATED or OBSERVATION_CREATED event without verification (see verification gate)
- Write directly to the Qdrant `constitutional_documents` collection (Postgres-first, projection-second)
- Execute tool calls outside their declared authority class
- Generate content attributed as CONSTITUTIONAL_LAW or CANONICAL_SPEC

### 2.3 Conditional Authority

An agent MAY generate:
- `CANDIDATE_CLAIM_CREATED` events (always, unverified)
- `SUMMARY` or `AI_GENERATED_ANALYSIS` tagged content (always, with source tags)
- `TEMPORARY_OBSERVATION` events (always, with unverified tag)
- `DOCUMENT_IMPORTED` events (only when content_hash matches artifact)
- `CLAIM_CREATED` events (ONLY after passing the verification gate: artifact_hash + event_hash + lineage check)
- `OBSERVATION_CREATED` events (only from 7B model, never from 14B)

---

## Article 3: Boot Sequence

### 3.1 Agent Initialization

Every agent MUST execute the following boot sequence before accepting work:

```
Phase 1: Identity Declaration
  └── Declare agent name, class, and session ID
  └── Write SYSTEM_EVENT with event_type='AGENT_BOOT'
  └── Include causation_id from invoking agent

Phase 2: Authority Verification
  └── Verify authority to operate (check against responsibility matrix)
  └── Verify required database connections (Postgres, Qdrant)
  └── Verify model availability (if inference agent)

Phase 3: Constitutional Self-Check
  └── Verify constitutional documents are accessible
  └── Verify event store is reachable and consistent
  └── Report status via health check endpoint

Phase 4: Readiness Declaration
  └── Write SYSTEM_EVENT with event_type='AGENT_READY'
  └── Register with supervisor or monitoring service
```

### 3.2 Failure to Boot

If any phase of the boot sequence fails:
- The agent MUST NOT accept work
- The agent MUST write a SYSTEM_EVENT with event_type='AGENT_BOOT_FAILURE' including the reason
- The agent MUST retry boot after a configurable backoff period
- After 3 consecutive failures, the agent MUST escalate to governance

---

## Article 4: Memory Semantics

### 4.1 Memory Tiers

Constitutional memory operates in 3 tiers, as defined by the constitutional architecture:

| Tier | Collection | Authority | Persistence | Agent Access |
|------|-----------|-----------|-------------|--------------|
| **Tier 1** | `constitutional_documents` | CONSTITUTIONAL_LAW | Postgres + Qdrant | Read-only (most agents), Write (governance only) |
| **Tier 2** | `ping_operational_documents` | Mixed | Postgres + Qdrant | Read + Write (with verification) |
| **Tier 3** | `ping_working_memory` | TEMPORARY | Qdrant only | Read + Write (any agent) |

### 4.2 Memory Access Rules

- Tier 1 may NOT be modified by any agent. Only the constitutional ingestion pipeline may create Tier 1 points.
- Tier 2 may be modified by agents with event_id verification (must reference a verified Postgres event).
- Tier 3 may be freely read and written by any agent, but carries no authority weight.

### 4.3 Projection Sovereignty

Qdrant is a projection cache, not an authority store. An agent MUST:
- Always verify critical Qdrant results against Postgres
- Never treat Qdrant search scores as authority measures
- Always include verification status when presenting Qdrant results

---

## Article 5: Execution Boundaries

### 5.1 Tool Execution Authority

| Tool | Allowed Agents | Verification Required | Max Rate |
|------|---------------|----------------------|----------|
| authority_search | All governance agents | None | 100/min |
| lineage_search | All agents | None | 100/min |
| contradiction_search | Governance agents only | None | 30/min |
| graph_expand | Interface agents | None | 60/min |
| repository_symbols | All agents | None | 60/min |
| repository_relationships | All agents | None | 30/min |
| **Event Write** | | | |
| - SYSTEM_EVENT | All agents | None | 60/min |
| - CANDIDATE_CLAIM_CREATED | TASK_AGENT | None | 30/min |
| - CLAIM_CREATED | TASK_AGENT | Full verification gate | 10/min |
| - OBSERVATION_CREATED | INFERENCE_AGENT (7B only) | Source classification | 30/min |
| - DOCUMENT_IMPORTED | GOVERNANCE_AGENT | Content hash match | 5/min |
| - PROJECTION_REBUILT | PROJECTION_AGENT | After Qdrant ACK | 5/min |

### 5.2 Model Assignment

| Model | Authorized Agents | Task | Constraint |
|-------|------------------|------|------------|
| qwen2.5-coder:14b | Governance, TASK | Task planning, extraction planning | Must NOT emit OBSERVATION_CREATED |
| qwen2.5-coder:7b | TASK, INFERENCE | Fact extraction, classification | May emit OBSERVATION_CREATED |
| nomic-embed-text | All agents | Embedding generation | None |
| llama3 | INFERENCE | General generation | Must tag output as AI_GENERATED_ANALYSIS |

### 5.3 Container Boundaries

Agents executing in containers:
- `ping-mission-control` → May serve API responses, execute constitutional retrieval
- `repo_runtime` → Read-only access to repository. May execute search and extraction tools.
- Workers (any) → Must have explicit constitutional mandate from this document
- Inference containers → Must respect model assignment from 5.2

---

## Article 6: Proposal Workflow

### 6.1 Constitutional Proposals

An agent may propose constitutional changes only through the following workflow:

```
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
  └── Affected agents are notified
```

### 6.2 Emergency Proposals

In cases of constitutional violation or system compromise:
- An agent may bypass Steps 1-2 and directly file a Step 3 PROPOSAL
- The proposal MUST include an EXPLANATION of why normal workflow was bypassed
- Governance MUST review emergency proposals within one session

### 6.3 Agent Proposals (Non-Constitutional)

Non-constitutional proposals (feature requests, implementation changes):
- Follow the same workflow but reference only implementation documents
- Do not require Step 4 governance review
- Must be recorded as SYSTEM_EVENT

---

## Article 7: Constitutional Obligations

### 7.1 All Agents

Every agent MUST:
1. **Tag all generated content** with `_source_classification`, `_generated_by`, and `_verified` fields
2. **Never emit CLAIM_CREATED without verification** (use CANDIDATE_CLAIM_CREATED for unverified claims)
3. **Verify Qdrant results against Postgres** before treating them as authoritative
4. **Record causation chain** in every event (causation_id + correlation_id)
5. **Respect memory tier boundaries** (Tier 1 read-only, Tier 2 verified writes, Tier 3 free)
6. **Boot cleanly** (execute full boot sequence before accepting work)
7. **Report failures** (write AGENT_BOOT_FAILURE, AGENT_ERROR events)
8. **Check constitutional documents** before taking actions that affect governance

### 7.2 Governance Agents

Governance agents MUST additionally:
1. **Run constitutional self-check** before each session
2. **Escalate contradictions** found between constitutional documents
3. **Verify frozen document integrity** (hash comparison) each session
4. **Update AGENTS.md** with session activity
5. **Never bypass the verification gate** (even in emergency mode, log the bypass)

### 7.3 TASK Agents (Workers)

Task agents MUST additionally:
1. **Never emit to Tier 1** (constitutional_documents collection)
2. **Never modify FROZEN documents**
3. **Register with supervisor** before accepting work
4. **Provide heartbeats** at configurable intervals
5. **Stop on constitutional violation detection** until governance resolves

### 7.4 INFERENCE Agents (Model Callers)

Inference agents MUST additionally:
1. **Never route 14B model to OBSERVATION_CREATED tasks**
2. **Never route 7B model to task planning tasks**
3. **Tag all model output** with model name and version
4. **Cap newsletter topic confidence at 0.6** (as fixed in database.py)
5. **Never treat model output as constitutional authority**

### 7.5 INTERFACE Agents (API Servers)

Interface agents MUST additionally:
1. **Verify every constitutional search result** against Postgres before returning
2. **Include authority_resolution block** in every constitutional response
3. **Never expose raw Qdrant scores** as authority measures
4. **Rate-limit tool execution** as specified in Article 5.1

---

## Article 8: Compliance and Enforcement

### 8.1 Constitutional Sovereignty

**CONSTITUTIONAL INVARIANT:** Agents may never originate constitutional law.

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

### 8.2 Violation Handling

| Violation | Severity | Response |
|-----------|----------|----------|
| Untagged content | LOW | Warning + automatic tagging on next interaction |
| Unverified CLAIM_CREATED | CRITICAL | Agent must stop and escalate to governance |
| Tier 1 modification | CRITICAL | Agent must stop and restore from Postgres |
| Wrong model routing | HIGH | Stop task, log violation, escalate |
| Boot sequence skip | MEDIUM | Re-execute boot before next action |
| Tool rate limit exceeded | MEDIUM | Back off, log warning |
| Constitutional contradiction emitted | HIGH | Withdraw claim, log, escalate |

### 8.3 Amendment

This document may be amended by GOVERNANCE_AGENT proposal workflow (Article 6). Any amendment must:
- Reference the specific article changed
- Provide justification
- Not redefine prohibited subjects (Truth, Authority, Governance, Replay, Identity)

---

## Article 9: Governing Documents

This agent recognizes the following constitutional documents as binding in their respective domains:

| Domain | Governing Document | Status |
|--------|-------------------|--------|
| Truth | TRUTH_LAW.md (constitution/) | FROZEN |
| Truth Domains | source_of_truth_law.md | FROZEN |
| Authority | AUTHORITY_TAXONOMY_SPEC.md | FREEZE |
| Governance | GOVERNANCE.md | ACTIVE |
| Replay | replay_law.md (constitution/) | FROZEN |
| Identity | IDENTITY_LAW.md (vault/laws/) | ACTIVE (Phase 1) |
| Witness | witness_law.md (constitution/) | FROZEN |
| Layers | layering_law.md | FROZEN |
| Mutation | mutation_law.md | FROZEN |
| Retrieval | retrieval_law.md | FROZEN |
| Invariants | invariant_law.md | FROZEN |
| Architecture | CONSTITUTION.md (vault/constitution/) | ACTIVE |
| Object State | OBJECT_STATE_LAW.md | FREEZE |
| Web Components | WEB_COMPONENT_CONSTITUTION.md | FREEZE |
| Patches | CONSTITUTIONAL_PATCH_01-20 | PENDING RATIFICATION |
| Agent Constitution | This document | ACTIVE |

---

*This document created under governance authority on 2026-06-24. It is a constitutional participant document, not agent-originated law.*
*Recorded as SYSTEM_EVENT on completion.*
