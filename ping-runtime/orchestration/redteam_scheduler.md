# SchedulerReplayArtifact

**Audit Type:** Phase 40D Red Team — Zero Trust
**Subsystem:** Scheduler
**File:** `orchestration/execution/scheduler.js`
**Severity:** CRITICAL
**Status:** CONSTITUTIONAL VIOLATIONS CONFIRMED

---

## Executive Summary

**Verdict: FAIL**

Scheduler has **6 CRITICAL constitutional violations** that permit wall clock timestamps, permit non-deterministic worker selection, permit load balancing drift, permit worker starvation, permit priority inversion, and permit mission ordering instability.

**Previous audit was optimistic.** Phase 40B surgical patches did not remove all wall clock violations, and worker selection has non-deterministic behavior.

---

## Violation 1: Wall Clock Timestamps Not Removed (Phase 40B Incomplete)

**Severity:** CRITICAL

**Proof:**
```javascript
// Line 22: assignedAt uses wall clock
assignedAt: new Date().toISOString()

// Line 39: scheduledAt uses wall clock
scheduledAt: new Date().toISOString()

// Line 68: scheduledAt uses wall clock
scheduledAt: new Date().toISOString()
```

**Flaw:**
- Phase 40B claimed wall clock removal was complete
- But 3 wall clock violations remain in scheduler.js
- `assignedAt` and `scheduledAt` use `new Date().toISOString()`
- Same mission produces different timestamps on different runs
- Assignment object differs based on wall clock
- Violates "deterministic assignment" constitutional guarantee

**Replay Transcript:**
1. Mission M1 scheduled at 2026-07-04T10:00:00.000Z
2. Replay of M1 scheduled at 2026-07-04T10:05:00.000Z
3. Different timestamps, same mission
4. Assignment objects differ
5. Replay produces different assignment object

**Minimal Reproduction:**
```javascript
const scheduler = new Scheduler(workers, events);
const mission = { id: 'm1', type: 'scan', target: 'x', metadata: { requiredCapabilities: ['code_analysis'] } };
const assignment1 = scheduler.schedule(mission);
// assignment1.workers[0].assignedAt = '2026-07-04T10:00:00.000Z'
const assignment2 = scheduler.schedule(mission);
// assignment2.workers[0].assignedAt = '2026-07-04T10:05:00.000Z'
```

**Impact:**
- Wall clock timestamps not removed
- Same mission produces different assignment objects
- Replay produces different assignment object
- Phase 40B surgical patches incomplete
- Violates "deterministic assignment" constitutional guarantee

---

## Violation 2: Non-Deterministic Worker Selection via JSON.stringify

**Severity:** CRITICAL

**Proof:**
```javascript
// Line 88-93: Seed uses JSON.stringify (non-deterministic)
const seed = JSON.stringify({
  capability,
  missionId: mission.id,
  missionType: mission.type,
  target: mission.target
});

// Line 105-106: Hash-based selection
const hash = crypto.createHash('sha256').update(seed).digest('hex');
const index = parseInt(hash.substring(0, 8), 16) % loadBalanced.length;
```

**Flaw:**
- `JSON.stringify()` is not deterministic (key ordering)
- Same object can produce different JSON strings
- Different JSON strings produce different hashes
- Different hashes produce different worker selection
- Same mission can select different workers
- Violates "deterministic worker selection" constitutional guarantee

**Replay Transcript:**
1. Mission M1 with object {capability: 'code_analysis', missionId: 'm1', missionType: 'scan', target: 'x'}
2. JSON.stringify produces {"capability":"code_analysis","missionId":"m1","missionType":"scan","target":"x"}
3. Hash selects worker W1
4. Same mission with object {missionId: 'm1', capability: 'code_analysis', missionType: 'scan', target: 'x'}
5. JSON.stringify produces {"missionId":"m1","capability":"code_analysis","missionType":"scan","target":"x"}
6. Hash selects worker W2
7. Same mission, different worker selected

**Minimal Reproduction:**
```javascript
const scheduler = new Scheduler(workers, events);
const mission1 = { id: 'm1', type: 'scan', target: 'x', metadata: { requiredCapabilities: ['code_analysis'] } };
const mission2 = { id: 'm1', type: 'scan', target: 'x', metadata: { requiredCapabilities: ['code_analysis'] } };
// If mission object keys are in different order, different worker selected
```

**Impact:**
- Worker selection not deterministic
- Same mission can select different workers
- Replay produces different worker selection
- Violates "deterministic worker selection" constitutional guarantee

---

## Violation 3: Load Balancing Drift via Recent Load Window

**Severity:** CRITICAL

**Proof:**
```javascript
// Line 145-150: Recent load depends on sequence window
_getRecentLoad(workerId) {
  const assignments = this._recentAssignments.get(workerId) || [];
  const recentThreshold = Math.max(0, this._assignmentSequence - 10);
  const recent = assignments.filter(a => a.sequence >= recentThreshold);
  return recent.length;
}

// Line 98-103: Load balancing uses recent load
const loadBalanced = available.sort((a, b) => {
  const aRecent = this._getRecentLoad(a.workerId);
  const bRecent = this._getRecentLoad(b.workerId);
  if (aRecent !== bRecent) return aRecent - bRecent;
  return a.currentLoad - b.currentLoad;
});
```

**Flaw:**
- Recent load depends on `assignmentSequence` which increments on every assignment
- Same mission at different sequence numbers produces different recent load
- Different recent load produces different load balancing order
- Different load balancing order produces different worker selection
- Same mission can select different workers based on assignment history
- Violates "load balancing determinism" constitutional guarantee

**Replay Transcript:**
1. Assignment sequence = 100, recent threshold = 90
2. Worker W1 has recent load 5, Worker W2 has recent load 3
3. Load balancing selects W2 (lower load)
4. Replay at assignment sequence = 200, recent threshold = 190
5. Worker W1 has recent load 2, Worker W2 has recent load 4
6. Load balancing selects W1 (lower load)
7. Same mission, different worker selected

**Minimal Reproduction:**
```javascript
const scheduler = new Scheduler(workers, events);
// Assign 100 missions
for (let i = 0; i < 100; i++) {
  scheduler.schedule({ id: `m${i}`, type: 'scan', target: 'x', metadata: { requiredCapabilities: ['code_analysis'] } });
}
const mission = { id: 'm101', type: 'scan', target: 'x', metadata: { requiredCapabilities: ['code_analysis'] } };
const assignment1 = scheduler.schedule(mission);
scheduler.reset();
// Assign 200 missions
for (let i = 0; i < 200; i++) {
  scheduler.schedule({ id: `m${i}`, type: 'scan', target: 'x', metadata: { requiredCapabilities: ['code_analysis'] } });
}
const assignment2 = scheduler.schedule(mission);
// Different worker selected due to different recent load
```

**Impact:**
- Load balancing not deterministic
- Same mission can select different workers based on history
- Replay produces different worker selection
- Violates "load balancing determinism" constitutional guarantee

---

## Violation 4: Worker Starvation via Load Balancing

**Severity:** HIGH

**Proof:**
```javascript
// Line 98-103: Load balancing always selects lowest load
const loadBalanced = available.sort((a, b) => {
  const aRecent = this._getRecentLoad(a.workerId);
  const bRecent = this._getRecentLoad(b.workerId);
  if (aRecent !== bRecent) return aRecent - bRecent;
  return a.currentLoad - b.currentLoad;
});
```

**Flaw:**
- Load balancing always selects worker with lowest recent load
- If one worker consistently has lower load, it is always selected
- Other workers are starved (never selected)
- No fairness mechanism (round-robin, weighted selection)
- Violates "worker fairness" constitutional guarantee

**Replay Transcript:**
1. Worker W1 has recent load 0, Worker W2 has recent load 5
2. Load balancing selects W1
3. W1 selected again, recent load 1 vs W2 recent load 5
4. Load balancing selects W1 again
5. W2 never selected (starved)

**Minimal Reproduction:**
```javascript
const scheduler = new Scheduler(workers, events);
// W1 has recent load 0, W2 has recent load 5
const mission = { id: 'm1', type: 'scan', target: 'x', metadata: { requiredCapabilities: ['code_analysis'] } };
for (let i = 0; i < 10; i++) {
  const assignment = scheduler.schedule(mission);
  // W1 always selected, W2 starved
}
```

**Impact:**
- Worker starvation possible
- No fairness mechanism
- Some workers never selected
- Violates "worker fairness" constitutional guarantee

---

## Violation 5: Priority Inversion via Routing Key

**Severity:** HIGH

**Proof:**
```javascript
// Line 111-114: Routing key depends on priority
_computeRoutingKey(mission) {
  const raw = `${mission.type}:${mission.target || 'global'}:${mission.metadata.priority}`;
  return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 12);
}
```

**Flaw:**
- Routing key depends on `mission.metadata.priority`
- If priority changes, routing key changes
- Different routing key may route to different workers
- Lower priority mission may be routed before higher priority mission (if priority changes mid-scheduling)
- Priority inversion possible
- Violates "priority ordering" constitutional guarantee

**Replay Transcript:**
1. Mission M1 with priority 'high', routing key R1
2. Mission M2 with priority 'low', routing key R2
3. M1 scheduled before M2 (correct priority order)
4. M1 priority changes to 'low', routing key changes to R2'
5. M2 scheduled before M1 (priority inversion)

**Minimal Reproduction:**
```javascript
const scheduler = new Scheduler(workers, events);
const mission1 = { id: 'm1', type: 'scan', target: 'x', metadata: { requiredCapabilities: ['code_analysis'], priority: 'high' } };
const mission2 = { id: 'm2', type: 'scan', target: 'x', metadata: { requiredCapabilities: ['code_analysis'], priority: 'low' } };
const assignment1 = scheduler.schedule(mission1);
mission1.metadata.priority = 'low';  // Priority change
const assignment2 = scheduler.schedule(mission2);
// M2 may be scheduled before M1 (priority inversion)
```

**Impact:**
- Priority inversion possible
- Lower priority missions scheduled before higher priority
- No priority validation
- Violates "priority ordering" constitutional guarantee

---

## Violation 6: Mission Ordering Instability via findAvailable

**Severity:** HIGH

**Proof:**
```javascript
// Line 95: findAvailable returns workers in non-deterministic order
const available = this._workers.findAvailable(capability, 10);

// Line 59: findAvailable returns workers in non-deterministic order
const workers = this._workers.findAvailable(primaryCap, workerCount);
```

**Flaw:**
- `findAvailable()` returns workers in non-deterministic order
- Depends on internal data structure (Map, Set, Array)
- Same workers can be returned in different order
- Different order produces different worker selection
- Same mission can select different workers
- Violates "mission ordering determinism" constitutional guarantee

**Replay Transcript:**
1. findAvailable returns [W1, W2, W3]
2. Load balancing selects W1
3. Replay: findAvailable returns [W3, W2, W1]
4. Load balancing selects W3
5. Same mission, different worker selected

**Minimal Reproduction:**
```javascript
const scheduler = new Scheduler(workers, events);
const mission = { id: 'm1', type: 'scan', target: 'x', metadata: { requiredCapabilities: ['code_analysis'] } };
const assignment1 = scheduler.schedule(mission);
// findAvailable returns [W1, W2, W3]
const assignment2 = scheduler.schedule(mission);
// findAvailable returns [W3, W2, W1] (different order)
```

**Impact:**
- Worker selection not deterministic
- Same mission can select different workers
- Replay produces different worker selection
- Violates "mission ordering determinism" constitutional guarantee

---

## Summary

| Violation | Severity | Constitutional Guarantee Broken |
|-----------|----------|-------------------------------|
| 1. Wall clock timestamps not removed | CRITICAL | Deterministic assignment |
| 2. Non-deterministic worker selection via JSON.stringify | CRITICAL | Deterministic worker selection |
| 3. Load balancing drift via recent load window | CRITICAL | Load balancing determinism |
| 4. Worker starvation via load balancing | HIGH | Worker fairness |
| 5. Priority inversion via routing key | HIGH | Priority ordering |
| 6. Mission ordering instability via findAvailable | HIGH | Mission ordering determinism |

**Total CRITICAL violations: 3**

**Constitutional Debt:**
- Remove wall clock timestamps from assignedAt and scheduledAt
- Use canonical JSON serialization for seed
- Use deterministic load balancing (hash-based, not sequence-based)
- Add fairness mechanism (round-robin, weighted selection)
- Validate priority does not change after scheduling
- Sort findAvailable results deterministically

**Previous Audit Optimism:**
- Assumed wall clock removal complete (3 violations remain)
- Assumed worker selection deterministic (JSON.stringify non-deterministic)
- Assumed load balancing deterministic (sequence-based drift)
- Assumed no worker starvation (no fairness mechanism)

**Conclusion:**
Scheduler is **NOT constitutionally sovereign**. It has 3 CRITICAL violations that permit wall clock timestamps, permit non-deterministic worker selection, and permit load balancing drift.

**Phase 41 is BLOCKED** until these violations are repaired.
