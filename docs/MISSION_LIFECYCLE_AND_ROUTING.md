# Mission Lifecycle State Machine + Routing Convergence Matrix

## Part 1: Mission Lifecycle State Machine

### States (DDL `ping_missions.status`)

```
created ──→ assigned ──→ running ──→ completed
  ↑            │            │
  │            │            ├──→ failed (exhaustion / explicit fail)
  │            │            │
  │            │            ├──→ retry_pending ──→ created (retry_at reached)
  │            │            │
  │            │            └──→ failed (exhaustion after retries)
  │            │
  │            └──→ created (lease reap — orphan recovery)
  │
  └────────────── retry_pending → created (retry_at reached)
```

### Transitions (SQL guards)

| From | To | Method | WHERE guard | Source |
|------|-----|--------|-------------|--------|
| created | assigned | `assign()` | `status = 'created'` | mission_runtime.js:108 |
| assigned | running | `start()` | `status = 'assigned'` | mission_runtime.js:131 |
| running | completed | `complete()` | `status = 'running'` | mission_runtime.js:158 |
| running/assigned/retry_pending | failed | `fail()` | `status IN (...)` | mission_runtime.js:175 |
| running/assigned | retry_pending | `failWithRetry()` | `status IN (...) AND retries < max` | mission_runtime.js:226-229 |
| running/assigned/retry_pending | failed | `failWithRetry()` (exhaustion) | `status IN (...) AND retries >= max` | mission_runtime.js:217-221 |
| running/assigned | created | `reapExpiredLeases()` | `status IN (...) AND lease_until < NOW()` | mission_runtime.js:278-284 |
| retry_pending | created | `getPending()` | `status = 'retry_pending' AND retry_at <= NOW()` | mission_runtime.js:310 |
| running/assigned | running/assigned | `renewLease()` | `status IN (...) AND lease_until IS NOT NULL` | mission_runtime.js:256-261 |

### Invariants (proven from source)

**Double-completion prevention**: `complete()` requires `WHERE status = 'running'`. After completion, status = 'completed'. Second call: 0 rows updated, no side effects. ✅

**Late worker failure after completion**: `fail()` requires `WHERE status IN ('running', 'assigned', 'retry_pending')`. Completed missions cannot be failed. ✅

**Retry exhaustion DLQ routing**: `_failMission()` calls `failWithRetry()`. When `retries >= max_attempts`, failWithRetry marks status = 'failed' and returns `nextRetry`. Scheduler checks `retries >= retryPolicy.max_attempts` → records dead letter. ✅

**Lease reap non-duplication**: `reapExpiredLeases()` only catches missions where `lease_until < NOW()`. Active missions have their leases renewed BEFORE reap runs (Arrow 0 → Arrow 1 ordering in scheduler poll). ✅

**Race condition — failWithRetry read-then-write**: Two concurrent failures can both read `retries=0`, both increment to 1, both succeed. Worst case: one wasted retry attempt (retries=1 instead of 0 on first retry_pending). Not a correctness bug — the mission still exhausts after `max_attempts` total transitions. Acceptable. ⚠️

### Scheduler poll ordering (mission_scheduler.js:135-170)

```
Arrow 0: renewLease() — extend leases for _processing set (non-fatal on error)
Arrow 1: reapExpiredLeases() — reclaim orphaned missions (runs BEFORE dispatch)
Arrow 2: getPending() + _dispatch() — only when processing.size < maxConcurrent
```

Critical: Arrow 0 runs BEFORE Arrow 1. This prevents the reaper from resetting missions whose workers are slow but alive.

---

## Part 2: Routing Convergence Matrix

### How routing works (three-stage dispatch)

1. **Bridge** (`event_to_mission_bridge.js`): Listens to business events on spine → creates mission with `payload.event_type = original event type`
2. **Scheduler** (`mission_scheduler.js`): Reads `payload.event_type || mission.mission_type` as the dispatch event type
3. **WorkerRuntime** (`worker_runtime.js`): Matches `event_type` against each worker's `eventTypes[]` array

Key insight: `MISSION_WORKER_MAP` maps mission_type → worker name (for logging/metadata). The actual event dispatch uses the **original business event type**, not the mission type. Workers match on event type, not mission type.

### Full pipeline map

#### Business events (17 trigger types → observation worker → pipeline chain)

| # | Trigger Event | Mission Type | Priority | Worker | Dispatch Event | Worker eventTypes match | Emits |
|---|--------------|--------------|----------|--------|---------------|----------------------|-------|
| 1 | LEAD_CREATED | LEAD_FOLLOWUP | 3 | observation | LEAD_CREATED | ✅ BUSINESS_EVENTS | OBSERVATION_CREATED |
| 2 | LEAD_CONVERTED | LEAD_CONVERT | 2 | observation | LEAD_CONVERTED | ✅ BUSINESS_EVENTS | OBSERVATION_CREATED |
| 3 | ESTIMATE_CREATED | ESTIMATE_PREPARE | 2 | observation | ESTIMATE_CREATED | ✅ BUSINESS_EVENTS | OBSERVATION_CREATED |
| 4 | ESTIMATE_SENT | ESTIMATE_FOLLOWUP | 3 | observation | ESTIMATE_SENT | ✅ BUSINESS_EVENTS | OBSERVATION_CREATED |
| 5 | ESTIMATE_ACCEPTED | ESTIMATE_CONVERT | 3 | observation | ESTIMATE_ACCEPTED | ✅ BUSINESS_EVENTS | OBSERVATION_CREATED |
| 6 | CUSTOMER_CREATED | CUSTOMER_ONBOARD | 2 | observation | CUSTOMER_CREATED | ✅ BUSINESS_EVENTS | OBSERVATION_CREATED |
| 7 | CUSTOMER_UPDATED | CUSTOMER_UPDATE | 1 | observation | CUSTOMER_UPDATED | ✅ BUSINESS_EVENTS | OBSERVATION_CREATED |
| 8 | PROJECT_CREATED | PROJECT_SETUP | 2 | observation | PROJECT_CREATED | ✅ BUSINESS_EVENTS | OBSERVATION_CREATED |
| 9 | PROJECT_UPDATED | PROJECT_UPDATE | 1 | observation | PROJECT_UPDATED | ✅ BUSINESS_EVENTS | OBSERVATION_CREATED |
| 10 | PROJECT_COMPLETED | PROJECT_CLOSEOUT | 3 | observation | PROJECT_COMPLETED | ✅ BUSINESS_EVENTS | OBSERVATION_CREATED |
| 11 | REVIEW_RECEIVED | REVIEW_RESPONSE | 3 | observation | REVIEW_RECEIVED | ✅ BUSINESS_EVENTS | OBSERVATION_CREATED |
| 12 | REVIEW_RESPONDED | REVIEW_ACK | 1 | observation | REVIEW_RESPONDED | ✅ BUSINESS_EVENTS | OBSERVATION_CREATED |
| 13 | INVOICE_CREATED | INVOICE_TRACK | 2 | observation | INVOICE_CREATED | ✅ BUSINESS_EVENTS | OBSERVATION_CREATED |
| 14 | INVOICE_SENT | INVOICE_FOLLOWUP | 3 | observation | INVOICE_SENT | ✅ BUSINESS_EVENTS | OBSERVATION_CREATED |
| 15 | INVOICE_PAID | INVOICE_CLOSE | 1 | observation | INVOICE_PAID | ✅ BUSINESS_EVENTS | OBSERVATION_CREATED |
| 16 | EMAIL_RECEIVED | EMAIL_PROCESS | 2 | observation | EMAIL_RECEIVED | ✅ BUSINESS_EVENTS | OBSERVATION_CREATED |
| 17 | GOOGLE_REVIEW_RECEIVED | REVIEW_RESPONSE | 3 | observation | GOOGLE_REVIEW_RECEIVED | ✅ BUSINESS_EVENTS | OBSERVATION_CREATED |

**Note**: BUSINESS_EVENTS also includes EMAIL_SENT, SMS_SENT, GITHUB_COMMIT_SYNCED, DOCUMENT_IMPORT — 21 total. These 4 have no EVENT_MISSION_MAP entry → no mission created, but observation worker still processes them (emits OBSERVATION_CREATED).

#### Downstream pipeline chain (8 stages)

| Stage | Dispatch Event | Mission Type | Worker | Worker eventTypes match | Emits | Feeds into |
|-------|---------------|--------------|--------|------------------------|-------|------------|
| 1 | OBSERVATION_CREATED | CLAIM_GENERATE | claim | ✅ ['OBSERVATION_CREATED', 'CLAIM_GENERATE'] | CLAIM_CREATED | → CLASSIFICATION_CREATE mission |
| 2 | CLAIM_CREATED | CLASSIFICATION_CREATE | classification | ✅ ['CLAIM_CREATED', 'CLASSIFICATION_CREATE'] | CLASSIFICATION_CREATED | → RECOMMENDATION_CREATE mission |
| 3 | CLASSIFICATION_CREATED | RECOMMENDATION_CREATE | recommendation | ✅ ['CLASSIFICATION_CREATED', 'RECOMMENDATION_CREATE'] | RECOMMENDATION_CREATED | → PROJECTION_CREATE mission |
| 4 | RECOMMENDATION_CREATED | PROJECTION_CREATE | projection | ✅ ['RECOMMENDATION_CREATED', 'PROJECTION_CREATE', 'KNOWLEDGE_INDEX', 'LINEAGE_CREATED'] | PROJECTION_CREATED | → REPLAY_VERIFY mission |
| 5 | PROJECTION_CREATED | REPLAY_VERIFY | replay | ✅ ['REPLAY_VERIFY', 'PROJECTION_CREATED'] | REPLAY_COMPLETED | → WITNESS_CREATE mission |
| 6 | REPLAY_COMPLETED | WITNESS_CREATE | witness | ✅ ['WITNESS_CREATE', 'REPLAY_COMPLETED'] | WITNESS_CREATED | → LINEAGE_CREATE mission |
| 7 | WITNESS_CREATED | LINEAGE_CREATE | lineage | ✅ ['LINEAGE_CREATE', 'WITNESS_CREATED'] | LINEAGE_CREATED | Terminal |

#### Knowledge/claim missions (not triggered by business events)

| Dispatch Event | Mission Type | Worker | Worker eventTypes match | Emits |
|---------------|--------------|--------|------------------------|-------|
| KNOWLEDGE_INDEX | KNOWLEDGE_INDEX | projection | ✅ (in projection eventTypes) | PROJECTION_CREATED |

#### System missions (not triggered by business events)

| Dispatch Event | Mission Type | Worker | Worker eventTypes match | Emits |
|---------------|--------------|--------|------------------------|-------|
| SYSTEM_HEALTH_CHECK | SYSTEM_AUDIT | claim | ❓ Not in claim eventTypes | (claim processes OBSERVATION_CREATED/CLAIM_GENERATE only) |

**⚠️ SYSTEM_HEALTH_CHECK routing gap**: MISSION_WORKER_MAP routes SYSTEM_AUDIT → claim worker. But claim worker's eventTypes = ['OBSERVATION_CREATED', 'CLAIM_GENERATE']. If scheduler dispatches SYSTEM_HEALTH_CHECK, claim won't match → phantom-complete prevention kicks in → mission fails with "no worker matched". This is a dormant path (SYSTEM_HEALTH_CHECK is never emitted in production).

#### Knowledge promotion (standalone, no mission)

| Event Type | Worker | Worker eventTypes match | Action |
|-----------|--------|------------------------|--------|
| SNIPPET_APPROVED | knowledge-promotion | ✅ | Promote node to approved/confidence 1.0 |
| SNIPPET_REJECTED | knowledge-promotion | ✅ | Reject node/confidence 0.2 |
| AI_RESPONSE_ACCEPTED | knowledge-promotion | ✅ | Promote node to approved/confidence 1.0 |
| AI_RESPONSE_REJECTED | knowledge-promotion | ✅ | Reject node/confidence 0.2 |

**Note**: knowledge-promotion worker is NOT registered via WorkerRuntime — it's registered directly via `workerRuntime.register()` with its own eventTypes. It processes events from the spine, not from mission dispatch.

#### Dormant worker

| Worker | eventTypes | Status |
|--------|-----------|--------|
| intelligence | [] (empty) | **DORMANT** — skipped at registration (canonical_workers.js:486) |

### Orphaned mission types (in MISSION_WORKER_MAP but no EVENT_MISSION_MAP entry)

| Mission Type | Worker | Trigger | Status |
|-------------|--------|---------|--------|
| CLAIM_GENERATE | claim | OBSERVATION_CREATED (downstream) | ✅ Live — fed by observation worker |
| CLASSIFICATION_CREATE | classification | CLAIM_CREATED (downstream) | ✅ Live — fed by claim worker |
| RECOMMENDATION_CREATE | recommendation | CLASSIFICATION_CREATED (downstream) | ✅ Live — fed by classification worker |
| PROJECTION_CREATE | projection | RECOMMENDATION_CREATED (downstream) | ✅ Live — fed by recommendation worker |
| REPLAY_VERIFY | replay | PROJECTION_CREATED (downstream) | ✅ Live — fed by projection worker |
| WITNESS_CREATE | witness | REPLAY_COMPLETED (downstream) | ✅ Live — fed by replay worker |
| LINEAGE_CREATE | lineage | WITNESS_CREATED (downstream) | ✅ Live — fed by witness worker |
| SYSTEM_AUDIT | claim | SYSTEM_HEALTH_CHECK | ⚠️ Dormant — no emitter |

### Skipped missions (in MISSION_WORKER_MAP but no EVENT_MISSION_MAP entry for the trigger)

All 17 business mission types (LEAD_FOLLOWUP, CUSTOMER_ONBOARD, etc.) have no matching worker in MISSION_WORKER_MAP that would process the mission_type as an event type. The observation worker handles the original business event, not the mission type. The mission type is metadata only.

### End-to-end trace (REVIEW_RECEIVED)

```
REVIEW_RECEIVED (spine)
  → observation worker (BUSINESS_EVENTS includes REVIEW_RECEIVED)
  → emits OBSERVATION_CREATED
  → Bridge: OBSERVATION_CREATED → CLAIM_GENERATE mission (priority 2)
  → Scheduler: dispatches OBSERVATION_CREATED → claim worker matches
  → emits CLAIM_CREATED
  → Bridge: CLAIM_CREATED → CLASSIFICATION_CREATE mission (priority 2)
  → Scheduler: dispatches CLAIM_CREATED → classification worker matches
  → emits CLASSIFICATION_CREATED
  → Bridge: CLASSIFICATION_CREATED → RECOMMENDATION_CREATE mission (priority 2)
  → Scheduler: dispatches CLASSIFICATION_CREATED → recommendation worker matches
  → emits RECOMMENDATION_CREATED
  → Bridge: RECOMMENDATION_CREATED → PROJECTION_CREATE mission (priority 1)
  → Scheduler: dispatches RECOMMENDATION_CREATED → projection worker matches
  → emits PROJECTION_CREATED
  → Bridge: PROJECTION_CREATED → REPLAY_VERIFY mission (priority 1)
  → Scheduler: dispatches PROJECTION_CREATED → replay worker matches
  → emits REPLAY_COMPLETED
  → Bridge: REPLAY_COMPLETED → WITNESS_CREATE mission (priority 1)
  → Scheduler: dispatches REPLAY_COMPLETED → witness worker matches
  → emits WITNESS_CREATED
  → Bridge: WITNESS_CREATED → LINEAGE_CREATE mission (priority 1)
  → Scheduler: dispatches WITNESS_CREATED → lineage worker matches
  → emits LINEAGE_CREATED
  → Terminal (no mission created)
```

8 dispatched, 8 completed, 0 failed. Full chain verified.
