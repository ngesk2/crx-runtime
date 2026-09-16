# EXTERNAL AGENT EXECUTION BOUNDARY LEDGER 2026-09-16

**STATUS:** CLASSIFIED
**DATE:** 2026-09-16
**PHASE:** I - EXTERNAL AGENT EXECUTION BOUNDARY

---

## EVIDENCE

### External Executor Candidates

#### 1. Python Worker Runtime
- **File:** /home/nolan/ping/workers/worker_runtime.py
- **Status:** PRESERVED_INACTIVE
- **Evidence:**
  - [STAT] Python worker runtime exists
  - [STAT] Not integrated with canonical PING runtime
  - [STAT] Not registered with WorkerRuntime
  - [INFR] Preserved as execution boundary, not canonical authority

#### 2. witness_worker.py
- **File:** /home/nolan/ping/witness_worker.py
- **Status:** PRESERVED_INACTIVE
- **Evidence:**
  - [STAT] Python witness worker exists
  - [STAT] Not integrated with canonical PING runtime
  - [INFR] Preserved as execution boundary, not canonical authority

#### 3. codex (external agent)
- **Status:** EXTERNAL EXECUTOR
- **Evidence:**
  - [INFR] External code generation/execution agent
  - [INFR] Not part of PING runtime
  - [INFR] Execution boundary, not canonical authority

#### 4. hermes (external agent)
- **Status:** EXTERNAL EXECUTOR
- **Evidence:**
  - [INFR] External execution agent
  - [INFR] Not part of PING runtime
  - [INFR] Execution boundary, not canonical authority

#### 5. opencode (external agent)
- **Status:** EXTERNAL EXECUTOR
- **Evidence:**
  - [INFR] External code execution agent
  - [INFR] Not part of PING runtime
  - [INFR] Execution boundary, not canonical authority

---

## CLASSIFICATION

**DECISION:** What is the external agent execution boundary decision?

**ANSWER:** External agents should:
- Receive missions through adapters
- Receive capability grants through adapters
- Execute through adapters
- Return structured results through adapters
- Emit events/evidence through PING's constitutional runtime
- Avoid becoming canonical state authorities

**CURRENT STATE:**
- **Python worker runtime:** PRESERVED_INACTIVE
- **witness_worker.py:** PRESERVED_INACTIVE
- **codex:** EXTERNAL EXECUTOR (not integrated)
- **hermes:** EXTERNAL EXECUTOR (not integrated)
- **opencode:** EXTERNAL EXECUTOR (not integrated)

**FINDING:** External agents are already execution boundaries, not canonical authorities

**CONCLUSION:** NO CODE CHANGE REQUIRED - external agents are properly bounded

---

## ANALYSIS

**Do external agents need tighter integration?**

**Arguments FOR tighter integration:**
- [INFR] Could enable Python workers to participate in canonical execution
- [INFR] Could provide redundancy for JS workers
- [INFR] Could enable multi-language worker support

**Arguments AGAINST tighter integration:**
- [STAT] Current canonical JS workers are fully functional
- [STAT] External agents are properly bounded as execution boundaries
- [STAT] No constitutional requirement for multi-language workers
- [STAT] Adding external integration would increase complexity
- [STAT] Could create competing state authorities if not carefully bounded

**REQUIREMENT CLARIFICATION:**
Before integrating, need to determine:
- Is Python worker integration constitutionally required?
- Does codex/hermes/opencode need deeper PING integration?
- Is multi-language worker support a constitutional requirement?
- Can external agents remain bounded through adapters only?

---

## CURRENT EXECUTION BOUNDARY

**1. Mission Dispatch:**
- [STAT] MissionRuntime assigns missions to canonical JS workers
- [STAT] External agents do not receive missions directly
- [STAT] External agents are execution boundaries, not canonical executors

**2. Capability Grants:**
- [STAT] CapabilityAuthority manages capability grants
- [STAT] External agents do not bypass capability checks
- [STAT] External agents are execution boundaries, not capability authorities

**3. Result Propagation:**
- [STAT] Worker results propagate through BaseWorker._emit()
- [STAT] Results become canonical events via UnifiedEventRuntime
- [STAT] External agents do not bypass canonical event path

**4. Evidence/Lineage:**
- [STAT] EvidenceAuthority verifies all evidence from canonical events
- [STAT] LineageWorker builds causation chains from canonical events
- [STAT] External agents do not bypass evidence/lineage authorities

---

## CONVERGENCE DECISION

**STATUS:** NO CODE CHANGE REQUIRED

**RATIONALE:**
1. External agents are already execution boundaries, not canonical authorities
2. Python worker runtime is preserved as inactive
3. codex/hermes/opencode are external executors, not integrated
4. Current canonical JS workers are fully functional
5. No constitutional requirement for external agent integration

**CURRENT BOUNDARY:**
- **Mission dispatch:** MissionRuntime → canonical JS workers only
- **Capability grants:** CapabilityAuthority → canonical execution only
- **Result propagation:** BaseWorker._emit() → UnifiedEventRuntime (canonical)
- **Evidence/lineage:** EvidenceAuthority/LineageWorker (canonical)
- **External agents:** Execution boundaries, not canonical authorities

---

## FINAL STATUS

**EXTERNAL_AGENT_EXECUTION_BOUNDARY = PROPERLY BOUNDED**

**EVIDENCE:**
- [STAT] External agents are execution boundaries, not canonical authorities
- [STAT] Python worker runtime is preserved as inactive
- [STAT] codex/hermes/opencode are external executors, not integrated
- [STAT] Current canonical JS workers are fully functional
- [STAT] No external agent bypasses canonical event/evidence/lineage paths

**NO CODE CHANGE REQUIRED**

**DECISIONS:**
- **Mission dispatch:** MissionRuntime → canonical JS workers only
- **Capability grants:** CapabilityAuthority → canonical execution only
- **Result propagation:** BaseWorker._emit() → UnifiedEventRuntime (canonical)
- **Evidence/lineage:** EvidenceAuthority/LineageWorker (canonical)
- **External agents:** Execution boundaries, not canonical authorities

**CLASSIFICATION:**
- **Python worker runtime:** PRESERVED_INACTIVE (execution boundary)
- **witness_worker.py:** PRESERVED_INACTIVE (execution boundary)
- **codex:** EXTERNAL EXECUTOR (execution boundary)
- **hermes:** EXTERNAL EXECUTOR (execution boundary)
- **opencode:** EXTERNAL EXECUTOR (execution boundary)

**FUTURE INTEGRATION (IF REQUIRED):**
- Python adapter for WorkerRuntime
- Capability grant adapter for external agents
- Structured result adapter for external agents
- Event emission adapter for external agents
- Preserve external agents as execution boundaries (not canonical authorities)
