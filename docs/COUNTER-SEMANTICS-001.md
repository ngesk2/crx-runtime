# COUNTER-SEMANTICS-001: Operator Counter Convergence

Status: SPEC (P1-A)
Date: 2026-08-21
Scope: Every numeric counter exposed to operators via HTTP

---

## 1. Problem Statement

Three problems across ~32 operator-facing counters:

1. Three scope classes coexist unlabeled - persistent SQL, session in-memory, and static artifact sizes presented identically
2. Four fabricated values presented as measurements
3. Two dead counters initialized but never incremented

## 2. Scope Classes

- persistent: No restart, Postgres table, survives restarts
- session: Resets on restart, in-memory JS, per-process
- static: Never changes, loaded from disk, registry/manifest size
- fabricated: N/A, hardcoded literal, not a measurement

## 3. Complete Counter Inventory

### 3.1 /ops/status (gateway/routes/ops.js)

- uptime: session - process.uptime()
- events.totalEventTypes: static - EventValidator._eventsByType.size (232)
- capabilities.totalCapabilities: static - CapabilityResolver._capabilities.size (45)
- capabilities.authorities: static - CapabilityResolver._byAuthority.size
- workflows.totalWorkflows: static - WorkflowExecutor._workflows.size (20)
- workflows.graphNodes: static - WorkflowExecutor._executionGraph.size
- services.totalServices: static - DeploymentLoader._services.size (37)
- machines.totalMachines: static - StateMachineExecutor._machines.size (21)
- machines.activeInstances: session - StateMachineExecutor._instances.size (always ~0)

FIX: Rename to *Registered, add scope labels.

### 3.2 /ops/health (health_authority.js aggregation)

- gateway.uptime: session
- gateway.memory: session
- generated_artifacts.artifacts: static - file count on disk
- integrations.total/healthy/error: session - IntegrationManager
- integrations.stats.{emitted,policyBlocked,sent,errors}: session
- event_governance.{total,passed,rejected,violations}: session
- event_runtime.{emitted,persisted,deduplicated,dispatched,failed}: session

### 3.3 /mc/scheduler (mission_scheduler.js:getStats())

- dispatched: session - missions dispatched (NOT unique - phantom-complete inflates)
- completed: session - missions marked complete after dispatch
- failed: session - missions that failed
- skipped: session - no worker matched
- renewals: session - lease renewals

FIX: Rename to dispatchedSinceBoot etc.

### 3.4 /mc/workers (worker_runtime.js:getStats())

- dispatched: session - per-worker executions (fan-out: 1 event x N workers = N)
- completed: session - successful executions
- failed: session - failed executions
- Per-worker totalProcessed: session
- Per-worker totalFailed: session

KNOWN BUG: _poll() would double-increment dispatched if activated (dead code)

### 3.5 /mc/bridge (event_bridge.js:getStats())

- repositoryBridged: session - events from repository_events -> ping_events
- canonicalBridged: session - events from canonical_events -> ping_events
- errors: session
- skipped: DEAD - initialized, NO increment site, always 0

FIX: Delete skipped field or wire counter.

### 3.6 /mc/event-mission-bridge (event_to_mission_bridge.js:getStats())

- listened: session - events received
- skipped: session - events not matching any mission mapping
- missionsCreated: session
- failed: session

All accurate.

### 3.7 /mc/missions/stats (mission_runtime.js:getStats())

- {status: count}: PERSISTENT - SELECT status, COUNT(*) FROM ping_missions

ONLY persistent mission counter. Authoritative for mission state.

### 3.8 /mc/dead-letters/stats (dead_letter_authority.js:getStats())

- byJobType: PERSISTENT - SQL GROUP BY
- byFailureReason: PERSISTENT
- total: PERSISTENT
- replayable/nonReplayable: PERSISTENT

### 3.9 /mc/dashboard (mission_control.js)

- business.needsFollowup: windowed 24h, max 500 events
- business.pendingReviews: windowed 24h, max 500
- business.activeProjects: windowed 24h, max 500
- business.unpaidInvoices: windowed 24h, max 500
- business.aiRecommendations: windowed 24h, max 500
- business.workerActivity: windowed 24h, max 500
- eventSummary.total: windowed, capped at 500

FIX: Add window_size and cap to response.

### 3.10 /ops/system (system_authority.js)

- metrics.uptime_seconds: session
- metrics.total_requests: session - counts getSystemState() calls only
- metrics.total_errors: FABRICATED - hardcoded 0, no increment site
- replay.success_rate: FABRICATED - hardcoded 100
- replay.failures: FABRICATED - hardcoded 0
- replay.witness_coverage: FABRICATED - formula min(total*6.25, 100)
- organizational_health.*: FABRICATED - all literal 0

FIX: Remove fabricated blocks or implement real measurements.

### 3.11 Inline response-body counters

- POST /knowledge/search stats: HybridSearch {semanticHits,kgHits,verified,rejected} - session
- EvidenceAuthority stats: {accumulated,tampered,verified,ranked} - session
- EmbeddingService stats: {embedded,fallback,projected,failed,indexableTypes} - session
- KnowledgePromoter stats: {handled,approved,rejected,notFound} - session

## 4. Cross-Cutting Findings

1. An operator comparing /missions/stats (persistent, all-time) against /scheduler (session, since-boot) sees irreconcilable numbers. Add scope labels.
2. Four fabricated values: system_authority.js total_errors, success_rate, failures, witness_coverage, organizational_health block.
3. Dead counter: EventBridge._stats.skipped - always 0.
4. Fan-out: WorkerRuntime.dispatched counts per-matching-worker.
5. Windowing: /mc/dashboard silently truncates at 500 events / 24h.

## 5. Required Fixes (Patches)

PATCH-01: Add scope:session|persistent|static to every stats response object
PATCH-02: Rename /mc/scheduler counters to *SinceBoot
PATCH-03: Delete dead EventBridge.skipped field
PATCH-04: Remove or implement fabricated system_authority blocks
PATCH-05: Add window_size to /mc/dashboard response
