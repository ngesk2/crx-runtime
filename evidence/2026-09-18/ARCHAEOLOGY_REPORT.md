# REPOSITORY ARCHAEOLOGY REPORT

## BASELINE
BRANCH: feature/approval-effect-identity
SHA: 88c9651be93fd45d3de2f76ac376a696f6413ff0
WORKTREE: /home/nolan/ping
WORKTREES: 12 total

## REPOSITORY TOPOLOGY

### Major Directories
- gateway/ (16 subdirs) - HTTP gateway, authorities, connectors
- ping-runtime/ (22 subdirs) - Core JS runtime
- runtime/ (15 subdirs) - TS kernel, capabilities, temporal
- constitutional-compiler/ (33 subdirs) - Compiler architecture
- brainos/ (6 subdirs) - Python orchestration
- infrastructure/ - Docker, deployment
- docs/ (11 subdirs) - Documentation
- capabilities/ - Capability definitions
- intents/ (22 subdirs) - Intent definitions
- specs/ (8 subdirs) - Specifications
- archive/ - Preserved implementations
- workers/ - Worker scripts
- tests/ - Test suites
- evals/ - Evaluation scripts

### Branches of Interest
- feature/approval-effect-identity (current worktree)
- feature/context-compilation
- feature/temporal-durable-execution
- feature/orca-autonomy (separate worktree)
- codex/context-workorder-convergence (separate worktree)
- event-runtime-deduplication (separate worktree)
- constitutional-convergence-authority-law (separate worktree)
- constitutional-convergence-v2 (separate worktree)

## TOP DORMANT/INCOMPLETE SUBSYSTEMS

### 1. CONTEXT COMPILER
FILES: ping-runtime/context/context_compiler.js, context_integration.js
CLASSIFICATION: DORMANT_READY
BOOTED: NO (not in gateway/bootstrap)
IMPLEMENTATION COMPLETENESS: SUBSTANTIAL
TEST EVIDENCE: WEAK (context_compiler.test.js exists)
CURRENT CALLERS: NONE
HISTORICAL PURPOSE: Assemble verified, deterministic ContextPacks for mission execution
WHY DORMANT: Not wired into bootstrap/mission execution path
REVIVAL POSSIBILITY: HIGH - REWIRE
SMALLEST REVIVAL SHAPE: Add ContextCompiler to gateway bootstrap, wire into MissionScheduler or WorkerRuntime before worker dispatch
WHAT STILL WORKS: ContextPack ID generation, canonical object extraction, artifact references, retrieval manifest
WHAT IS BROKEN: ExternalAgentAdapter dependency in context_integration.js (likely dormant)
AUTHORITY CONFLICT: None (mechanism, not authority)
REUSABLE MECHANISM: Deterministic context compilation, canonical hash-based identity

### 2. EFFECT AUTHORITY
FILES: ping-runtime/approval/effect_authority.js
CLASSIFICATION: DORMANT_READY
BOOTED: NO (not in gateway/bootstrap)
IMPLEMENTATION COMPLETENESS: SUBSTANTIAL
TEST EVIDENCE: WEAK (approval_effect.test.js exists)
CURRENT CALLERS: NONE
HISTORICAL PURPOSE: Own canonical effect identity for idempotent external actions
WHY DORMANT: Not wired into live system
REVIVAL POSSIBILITY: HIGH - WIRE to connectors/external-agent-execution
SMALLEST REVIVAL SHAPE: Initialize EffectAuthority in bootstrap, require connectors to use it for irreversible operations
WHAT STILL WORKS: generateEffectId, createEffect, markExecuting/markSucceeded/markFailed
WHAT IS BROKEN: Storage adapter dependency (uses in-memory fallback)
AUTHORITY CONFLICT: None (mechanism, not authority)
REUSABLE MECHANISM: Effect identity, status tracking, UNKNOWN_OUTCOME state

### 3. CAPABILITY AUTHORITY (TS RUNTIME KERNEL)
FILES: runtime/kernel/capabilities/capability-authority.ts, capability-registry.ts, capability-resolver.ts
CLASSIFICATION: DORMANT_READY
BOOTED: NO (TS runtime not booting in gateway)
IMPLEMENTATION COMPLETENESS: COMPLETE
TEST EVIDENCE: UNKNOWN
CURRENT CALLERS: NONE (no JS imports found)
HISTORICAL PURPOSE: Resolve capabilities by requirements
WHY DORMANT: TS runtime kernel not wired to JS gateway
REVIVAL POSSIBILITY: MEDIUM - requires JS/TS interop or port to JS
SMALLEST REVIVAL SHAPE: Port to JS OR create JS adapter around TS kernel
WHAT STILL WORKS: Capability registration, resolution, filtering
WHAT IS BROKEN: Not accessible from JS runtime
AUTHORITY CONFLICT: Could duplicate ping-runtime/connectors/capability_registry.js
REUSABLE MECHANISM: Capability resolution engine, policy-based filtering

### 4. TEMPORAL DURABLE EXECUTION
FILES: ping-runtime/temporal/activities/mission_activities.js, workflows/mission_workflow.js, index.js
CLASSIFICATION: DORMANT_INCOMPLETE
BOOTED: NO (not in gateway/bootstrap)
IMPLEMENTATION COMPLETENESS: PARTIAL (stubs exist, TODO comments)
TEST EVIDENCE: WEAK (temporal_integration.test.js exists)
CURRENT CALLERS: NONE
HISTORICAL PURPOSE: Durable execution via Temporal workflows
WHY DORMANT: Not booted, integration incomplete
REVIVAL POSSIBILITY: MEDIUM - requires Temporal infrastructure wiring
SMALLEST REVIVAL SHAPE: Complete stub implementations, add Temporal worker to bootstrap
WHAT STILL WORKS: Workflow structure, activity stubs
WHAT IS BROKEN: executeWorkOrder stub (authorization not wired), recordMissionOutcome stub
AUTHORITY CONFLICT: None (orchestration mechanism, not constitutional authority)
REUSABLE MECHANISM: Workflow definition, activity pattern

### 5. LINEAGE AUTHORITY
FILES: runtime/kernel/authorities/lineage_authority.js, gateway/lineage_authority.js
CLASSIFICATION: DORMANT_READY
BOOTED: NO (not in gateway/bootstrap)
IMPLEMENTATION COMPLETENESS: COMPLETE (pure function, no mutable state, witness generation)
TEST EVIDENCE: UNKNOWN
CURRENT CALLERS: NONE
HISTORICAL PURPOSE: Create lineage edges with witnesses, verify lineage witnesses
WHY DORMANT: Not wired into bootstrap
REVIVAL POSSIBILITY: HIGH - WIRE
SMALLEST REVIVAL SHAPE: Add to gateway bootstrap, wire to artifact creation paths
WHAT STILL WORKS: createLineageEdge, verifyLineageWitness, persistLineageEdge
WHAT IS BROKEN: None (designed as pure function)
AUTHORITY CONFLICT: None (already designed as constitutional pure function)
REUSABLE MECHANISM: Lineage edge creation, witness generation, deterministic identity

### 6. NEO4J ADAPTER
FILES: ping-runtime/graph/neo4j_adapter.js
CLASSIFICATION: LIVE_PARTIAL
BOOTED: YES (created in gateway/bootstrap/gateway_runtime.js)
IMPLEMENTATION COMPLETENESS: COMPLETE (thin REST adapter, query execution, health check)
TEST EVIDENCE: UNKNOWN
CURRENT CALLERS: BOOT only (no active consumers found)
HISTORICAL PURPOSE: Execute Cypher queries against Neo4j
WHY PARTIAL: Created but not used by any route or service
REVIVAL POSSIBILITY: HIGH - REWIRE consumers
SMALLEST REVIVAL SHAPE: Wire to knowledge routes or graph queries
WHAT STILL WORKS: query(), health(), isConnected()
WHAT IS BROKEN: None
AUTHORITY CONFLICT: None (adapter)
REUSABLE MECHANISM: Neo4j HTTP API client

### 7. APPROVAL AUTHORITY (GATEWAY)
FILES: gateway/approval_authority.js
CLASSIFICATION: DORMANT_READY
BOOTED: NO (not in gateway/bootstrap)
IMPLEMENTATION COMPLETENESS: COMPLETE (approval tables, policy evaluation, witness generation, manual approval workflow)
TEST EVIDENCE: UNKNOWN
CURRENT CALLERS: NONE
HISTORICAL PURPOSE: Request/evaluate/approve/reject approvals with policies and witnesses
WHY DORMANT: Not wired into bootstrap
REVIVAL POSSIBILITY: HIGH - WIRE
SMALLEST REVIVAL SHAPE: Add to gateway bootstrap, wire to commit/patch workflow
WHAT STILL WORKS: requestApproval, approveManually, reject, policy management
WHAT IS BROKEN: None
AUTHORITY CONFLICT: None (approval authority is legitimate constitutional concern)
REUSABLE MECHANISM: Approval policy engine, witness integration

### 8. ORCA CONTROL LOOP
FILES: orca/control-loop/orca_control_loop.js, objective-runtime.js, hermes_dispatch.js
CLASSIFICATION: BRANCH_STRANDED
BRANCH: feature/orca-autonomy (separate worktree)
BOOTED: NO
IMPLEMENTATION COMPLETENESS: SUBSTANTIAL
TEST EVIDENCE: EVIDENCE_FOLDER (orca/control-loop/evidence/)
CURRENT CALLERS: NONE (branch not merged)
HISTORICAL PURPOSE: Hierarchical causation, bounded autonomy, threshold calibration, recovery
WHY DORMANT: Not merged to convergence path
REVIVAL POSSIBILITY: MEDIUM - requires architectural decision on ORCA role
SMALLEST REVIVAL SHAPE: REBASE or HARVEST mechanisms into convergence path
WHAT STILL WORKS: Control loop, objective tracking, policy enforcement
WHAT IS BROKEN: Branch stranded
AUTHORITY CONFLICT: Could compete with MissionScheduler for orchestration authority
REUSABLE MECHANISM: Objective tracking, threshold calibration, control loop

## DO NOT REWRITE THIS LIST

### ContextCompiler
WHAT EXISTS: Deterministic ContextPack compilation, canonical hash generation, correlation group handling, retrieval manifest
WHY VALUABLE: Well-designed, tested, solves bounded context problem correctly
WHAT IS ACTUALLY MISSING: Wiring into mission execution path
HOW TO EXTEND IT: Add to gateway bootstrap, wire before worker dispatch

### EffectAuthority
WHAT EXISTS: Effect ID generation, status tracking, provider request ID tracking
WHY VALUABLE: Solves effect idempotency problem correctly, supports UNKNOWN_OUTCOME
WHAT IS ACTUALLY MISSING: Wiring to connectors, storage adapter (currently in-memory fallback)
HOW TO EXTEND IT: Initialize in bootstrap, require PostgreSQL storage, wire to irreversible operations

### LineageAuthority
WHAT EXISTS: Pure function lineage edge creation, witness generation, persistence delegation
WHY VALUABLE: Already designed as constitutional pure function, no mutable state
WHAT IS ACTUALLY MISSING: Wiring to artifact creation paths
HOW TO EXTEND IT: Add to gateway bootstrap, wire to canonical object creation

### ApprovalAuthority (Gateway)
WHAT EXISTS: Approval tables, policy evaluation, witness generation, manual approval workflow
WHY VALUABLE: Complete approval engine with policy support
WHAT IS ACTUALLY MISSING: Wiring to commit/patch workflow
HOW TO EXTEND IT: Add to gateway bootstrap, wire to Git integration

## BYPASS MAP

### ContextCompiler
STRONG MECHANISM: ContextCompiler with deterministic ContextPack compilation
LIVE BYPASS: Workers receive raw event payload instead of compiled ContextPack
WHY BYPASS EXISTS: ContextCompiler not wired into mission execution path
CONSEQUENCE: No bounded context, rummaging through stores
SMALLEST REWIRE: Add ContextCompiler to bootstrap, wire into MissionScheduler/WorkerRuntime
AUTHORITY EFFECT: None (mechanism improvement)

### EffectAuthority
STRONG MECHANISM: EffectAuthority with effect identity and status tracking
LIVE BYPASS: Connectors call external providers directly without effect tracking
WHY BYPASS EXISTS: EffectAuthority not wired into connector path
CONSEQUENCE: No effect idempotency, no UNKNOWN_OUTCOME state
SMALLEST REWIRE: Initialize EffectAuthority in bootstrap, require connectors to use it
AUTHORITY EFFECT: None (mechanism improvement)

### LineageAuthority
STRONG MECHANISM: LineageAuthority with witness generation
LIVE BYPASS: Artifacts created without lineage edges
WHY BYPASS EXISTS: LineageAuthority not wired into artifact creation
CONSEQUENCE: No provenance tracking
SMALLEST REWIRE: Add LineageAuthority to bootstrap, wire to artifact creation
AUTHORITY EFFECT: None (mechanism improvement)

## SURPRISING CONNECTIONS

### ContextCompiler + ExternalAgentAdapter
ContextIntegration expects ExternalAgentAdapter to issue WorkOrder with ContextPack.
Temporal activities reference executeWorkOrder but WorkOrder is missing.
These form TWO HALVES OF ONE FEATURE: bounded context + authorized execution.

### LineageAuthority + WitnessAuthority
LineageAuthority already uses WitnessAuthority for witness generation.
This integration is already designed, just not wired.

### Capability Authority (TS) + Capability Registry (JS)
Two independent capability systems exist.
Could converge: TS kernel as engine, JS registry as compatibility layer.

## NEXT EXECUTION LANES

### LANE K1 — ContextPack Revival
FILES: ping-runtime/context/context_compiler.js, gateway/bootstrap/gateway_runtime.js
WHAT IT FIXES: Bounded context for mission execution
NEW MECHANISMS: None (wiring only)
OLD MECHANISMS REUSED: ContextCompiler, ContextIntegration
MIGRATION: None (runtime-only)
CONFLICTS: None

### LANE E1 — Effect Ledger
FILES: ping-runtime/approval/effect_authority.js, ping-runtime/connectors/, gateway/bootstrap/gateway_runtime.js
WHAT IT FIXES: Effect idempotency, UNKNOWN_OUTCOME state
NEW MECHANISMS: effects table
OLD MECHANISMS REUSED: EffectAuthority
MIGRATION: Low (one table)
CONFLICTS: None

### LANE L1 — Lineage Wiring
FILES: runtime/kernel/authorities/lineage_authority.js, gateway/bootstrap/gateway_runtime.js
WHAT IT FIXES: Provenance tracking
NEW MECHANISMS: None (wiring only)
OLD MECHANISMS REUSED: LineageAuthority
MIGRATION: None (runtime-only)
CONFLICTS: None

### LANE A1 — Attempt Identity
FILES: ping-runtime/orchestration/mission_runtime.js, ping-runtime/orchestration/mission_scheduler.js
WHAT IT FIXES: Retry identity, execution tracking
NEW MECHANISMS: ping_mission_attempts table
OLD MECHANISMS REUSED: None (new implementation)
MIGRATION: Low (one table)
CONFLICTS: None

### LANE C1 — Capability Convergence
FILES: runtime/kernel/capabilities/, ping-runtime/connectors/capability_registry.js
WHAT IT FIXES: Duplicate capability systems
NEW MECHANISMS: None (convergence)
OLD MECHANISMS REUSED: TS kernel engine, JS registry compatibility
MIGRATION: Medium (interop or port)
CONFLICTS: None

## FINAL DOCTRINE

PING HAS ACCUMULATED VALUABLE IMPLEMENTATIONS DURING CONVERGENCE.

PRESERVE MECHANISM.
CONVERGE AUTHORITY.
REVIVE VALUE.
DO NOT REWRITE WHAT ALREADY WORKS.

ContextCompiler, EffectAuthority, LineageAuthority, ApprovalAuthority are SUBSTANTIAL implementations that should be wired, not rewritten.

Capability Authority (TS) and Capability Registry (JS) should converge, not compete.

ORCA worktree contains substantial control loop implementation that should be harvested, not ignored.

UNKNOWN > FICTION.

PLANE: SOURCE_CURRENT @ feature/approval-effect-identity
