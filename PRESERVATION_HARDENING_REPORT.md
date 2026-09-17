# Preservation and Hardening Report

## Status: Branch Classification Complete

All four prototype branches have been honestly classified with experimental notices in their code headers and test files.

---

## Branch Classifications

### feature/context-compilation
**Status: BUILT_NOT_LIVE / PARTIAL**

**Experimental Notice Added:**
- context_compiler.js
- context_compiler.test.js
- context_integration.js

**Notice Text:**
\NOTE: This branch is marked BUILT_NOT_LIVE / PARTIAL due to:
- Deterministic proof needed: same canonical inputs must produce same identity
- Evidence/lineage proof needed: actual authority verification not correlation grouping
- WorkOrder binding proof needed: ContextPack must pass as WorkOrder.input
- No duplicate extraction logic remaining
- Do not create another memory system; reuse existing PING context/authority mechanisms
\
**Hardening Required Before Merge:**
- Deterministic identity proof passes
- Evidence/lineage verification is real, not correlation grouping
- WorkOrder binding is proven
- Duplicate extraction logic is removed

---

### feature/temporal-durable-execution
**Status: EXPERIMENTAL**

**Experimental Notice Added:**
- mission_workflow.js
- mission_activities.js
- index.js
- temporal_integration.test.js

**Notice Text:**
\NOTE: This branch is marked EXPERIMENTAL due to:
- Workflow uses new Date() (violates deterministic replay requirement)
- Activities are stubs (TODO: wire to ExternalAgentAdapter/MissionRuntime)
- No real Temporal service proof yet
- Should use Temporal-safe time APIs or ConstitutionalTimeAuthority
\
**Hardening Required Before Merge:**
- Activities wired to real ExternalAgentAdapter and MissionRuntime
- Real Temporal service proof with replay testing
- Temporal-safe time mechanisms used instead of new Date()
- Full chain runtime proof: Mission → Context → Temporal → WorkOrder → Result → Event

---

### feature/approval-effect-identity
**Status: BUILT_NOT_LIVE until durable persistence/restart proof**

**Experimental Notice Added:**
- business_action_authority.js
- effect_authority.js
- approval_effect.test.js

**Notice Text:**
\NOTE: This branch is marked EXPERIMENTAL due to:
- Currently uses in-memory storage (storage: false in health check)
- No durable persistence proof across process restart
- Should wire to existing Postgres authority/storage patterns
- Approval and effect identity must survive restart to be effective
\
**Hardening Required Before Merge:**
- Storage wired to durable Postgres authority
- Restart safety proven across process boundaries
- Approval binds to exact action hash
- Duplicate prevention across retries and restarts

---

### feature/mission-decomposition
**Status: EXPERIMENTAL**

**Experimental Notice Added:**
- mission_decomposition.js
- mission_decomposition.test.js

**Notice Text:**
\NOTE: This branch is marked EXPERIMENTAL due to:
- Runtime schema mutation (ALTER TABLE in initialize())
- SQL NOW() usage (non-deterministic)
- Redundant relationship authorities (parent_mission_id + child_mission_ids + dependency table)
- Need single source of truth for parent/child relationships
- Temporal dependency mechanics not yet proven
- Should use existing migration mechanism instead
\
**Hardening Required Before Merge:**
- Schema moved to migration-owned mechanism
- Single authoritative relationship representation chosen
- SQL NOW() replaced with constitutional time authority
- Temporal dependency mechanics proven

---

## Hardened Branches (Previously Completed)

### feature/external-agent-hardening
**Status: PRODUCTION-READY (pending integration review)**
- Commit: 57fed650b
- 33 passing tests
- Hardened WorkOrder boundary with constitutional invariants
- Authority leaks closed

### feature/namespace-entitlements
**Status: PRODUCTION-READY (pending integration review)**
- Commit: 49d25df31
- Fail-closed namespace entitlements
- Gateway does not trust body.source
- Bearer principals cannot claim internal sources

### feature/knowledge-replay-routing
**Status: PRODUCTION-READY (pending integration review)**
- Commit: 9a03833df
- Knowledge-promotion events reach existing KnowledgePromoter
- REPLAY_VERIFY reaches existing replay path
- Event-to-mission routing uses deterministic mission IDs

---

## Next Steps

1. **Do not merge** the four prototype branches until their hardening requirements are met
2. **Create integration branch** after conflict and authority review from:
   - feature/external-agent-hardening (57fed650b)
   - feature/namespace-entitlements (49d25df31)
   - feature/knowledge-replay-routing (9a03833df)
3. **Verify authority consistency, tests, runtime wiring, namespace behavior, and stale assumptions** before integration
4. **Slice 5 (outcome-driven learning) is deferred** until execution semantics are stable

---

## Status Law Reminder

\UNIT TESTED != LIVE
CREATED != WIRED
WIRED != DURABLE
DURABLE != SAFE
SAFE != BUSINESS-PROVEN
\
All four prototype branches are currently at the **UNIT TESTED** or **CREATED** stage, not yet **WIRED**, **DURABLE**, **SAFE**, or **BUSINESS-PROVEN**.

---

## Preservation Pass Complete

- Repos inspected: /home/nolan/ping
- Worktrees inspected: preserved external-agent worktree
- Commits created: experimental notices added to all prototype branches
- Experimental branches preserved: all feature branches remain intact
- Valuable incomplete work preserved: external-agent worktree, namespace entitlements, knowledge/replay routing
