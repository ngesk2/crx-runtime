# WorkerPort Compliance Audit

**File:** `orchestration/execution/worker_port.js` (345 lines)
**Audit Date:** 2026-07-04
**Auditor:** OpenCode Constitutional Orchestration Fabric
**Scope:** 5 invariants covering identical interface, state transitions, illegal transition rejection, replay compatibility, and provider independence.

---

## 1. Identical Interface

**Verdict: PASS**

All WorkerPort implementations expose the same interface:

| Method/Property | WorkerPort (base) | OpenCodeWorkerPort | OllamaWorkerPort | DevinWorkerPort |
|----------------|------------------|-------------------|-----------------|----------------|
| `workerId` | ✅ | ✅ | ✅ | ✅ |
| `model` | ✅ | ✅ | ✅ | ✅ |
| `capabilities` | ✅ | ✅ | ✅ | ✅ |
| `state` | ✅ | ✅ | ✅ | ✅ |
| `currentLoad` | ✅ | ✅ | ✅ | ✅ |
| `maxLoad` | ✅ | ✅ | ✅ | ✅ |
| `canTransition()` | ✅ | ✅ | ✅ | ✅ |
| `transition()` | ✅ | ✅ | ✅ | ✅ |
| `execute()` | ✅ | ✅ | ✅ | ✅ |
| `health()` | ✅ | ✅ | ✅ | ✅ |
| `getCapabilities()` | ✅ | ✅ | ✅ | ✅ |

All implementations inherit from `WorkerPort` base class, ensuring interface consistency.

---

## 2. Complete State Transitions

**Verdict: PASS**

**State Transition Matrix:**
```
idle → assigned
assigned → running, idle
running → waiting, failed, idle
waiting → consensus, completed, failed, running
consensus → completed, failed
completed → idle, assigned
failed → idle
archived → idle
```

**Evidence:**
- Line 4-13: `VALID_TRANSITIONS` defines all allowed transitions
- Line 56-59: `canTransition()` validates against `VALID_TRANSITIONS`
- Line 61-90: `transition()` enforces validation and updates state
- Line 68-79: Load tracking integrated with state transitions
- Line 80-88: Event emission on state change

All transitions are defined and validated. No undefined states reachable.

---

## 3. Illegal Transition Rejection

**Verdict: PASS**

**Evidence:**
- Line 62-65: Illegal transition check with console warning
```js
if (!this.canTransition(targetState)) {
  console.warn(`[WorkerPort ${this._workerId}] Invalid transition: ${this._state} → ${targetState}`);
  return false;
}
```

**Test Cases:**
- `idle → running` → REJECTED (not in VALID_TRANSITIONS)
- `assigned → consensus` → REJECTED (not in VALID_TRANSITIONS)
- `failed → assigned` → REJECTED (not in VALID_TRANSITIONS)
- `archived → running` → REJECTED (not in VALID_TRANSITIONS)

All illegal transitions are rejected with warning.

---

## 4. Replay Compatibility

**Verdict: FAIL — 3 violations**

| Violation | Location | Severity | Detail |
|-----------|----------|----------|--------|
| Non-deterministic worker ID | L17 | **CRITICAL** | `crypto.randomUUID().substring(0, 8)` — every WorkerPort instance gets a unique ID, even for identical configuration. Replay requires same worker ID for state reconstruction. |
| Wall clock in execute() | L93, L108 | HIGH | `Date.now()` used for latency measurement. While latency is not part of replay state, it's recorded in `_latency` array which affects `averageLatency` used in scheduling. |
| Wall clock in failure patterns | L151 | HIGH | `timestamp: Date.now()` in `_recordFailure`. Failure patterns are part of worker state and affect scheduling decisions. |

**Evidence:**
- Line 17: `this._workerId = config.workerId || \`worker_${crypto.randomUUID().substring(0, 8)}\``
- Line 93: `const start = Date.now();`
- Line 108: `const elapsed = Date.now() - start;`
- Line 151: `this._failurePatterns.push({ missionId, reason, timestamp: Date.now() });`

**Impact:**
- Worker ID non-determinism breaks replay state reconstruction
- Latency measurement affects `averageLatency` which impacts `findAvailable()` sorting
- Failure pattern timestamps affect historical analysis but not immediate scheduling

**Remediation:**
1. Replace `crypto.randomUUID()` with deterministic ID generation (e.g., hash of config)
2. Use deterministic time source for latency (e.g., mission timestamp)
3. Remove or make deterministic failure pattern timestamps

---

## 5. Provider Independence

**Verdict: PASS with 1 WARN**

**Provider Implementations:**
- `OpenCodeWorkerPort` (L162-190): Local OpenCode execution
- `OllamaWorkerPort` (L192-217): Ollama model execution
- `DevinWorkerPort` (L219-239): Devin execution

**Independence Verification:**

| Aspect | OpenCodeWorkerPort | OllamaWorkerPort | DevinWorkerPort |
|--------|-------------------|-----------------|----------------|
| Constructor config | ✅ | ✅ | ✅ |
| Capability definition | ✅ | ✅ | ✅ |
| Specialization logic | ✅ | ✅ | ✅ |
| Context window | ✅ | ✅ | ✅ |
| Replay compatibility flag | ✅ | ✅ | ✅ |
| Max load | ✅ | ✅ | ✅ |
| Executor injection | ✅ | ✅ | ✅ |
| Event queue injection | ✅ | ✅ | ✅ |

**WARN: Hardcoded specialization logic in OllamaWorkerPort**
- Line 195-198: Specialization inferred from model name string matching
```js
const specialization = model.includes('coder') ? 'code_audit'
  : model.includes('deepseek') ? 'analysis'
  : model.includes('qa') ? 'verification'
  : 'general_purpose';
```
This couples provider implementation to model naming convention. If model names change, specialization breaks.

**Remediation:**
- Allow explicit specialization override in config
- Remove string matching inference or make it fallback-only

---

## 6. Additional Constitutional Violations

### 6a. Event Emission Side Effects

**Verdict: WARN**

**Evidence:**
- Line 81-88: `transition()` emits `worker_state_changed` event
- Line 94: `execute()` emits `worker_execution_started` event
- Line 115-121: `execute()` emits `worker_execution_completed` event
- Line 155-159: `_emit()` helper for event emission

**Concern:** WorkerPort directly emits events, creating side effects. In a pure constitutional system, event emission should be owned by the orchestration engine, not individual workers.

**Impact:** Replay must replay event emissions, making WorkerPort state-dependent on event queue state.

---

### 6b. Mutable State Exposure

**Verdict: PASS**

**Evidence:**
- Line 36: `get capabilities() { return [...this._capabilities]; }` — returns copy
- Line 50: `get failurePatterns() { return [...this._failurePatterns]; }` — returns copy
- Line 140-148: `getCapabilities()` returns mapped copies

All getter methods return copies, preventing external mutation of internal state.

---

### 6c. Load Tracking Determinism

**Verdict: WARN**

**Evidence:**
- Line 68-79: Load tracking integrated with state transitions
- Line 69: `this._load = Math.min(this._load + 1, this._maxLoad)` — on assigned/running
- Line 73: `this._load = 0` — on idle
- Line 77: `this._load = Math.max(this._load - 1, 0)` — on completed/failed/archived

**Concern:** Load tracking is deterministic relative to state transitions, but state transitions themselves depend on external calls to `transition()`. If the orchestration engine calls `transition()` in different orders across replays, load values diverge.

**Impact:** Load values affect `findAvailable()` sorting, which affects worker selection determinism.

---

## Summary

| Invariant | Verdict | Criticality | Key Failure |
|-----------|---------|-------------|-------------|
| 1. Identical interface | **PASS** | — | All implementations inherit from base class |
| 2. Complete state transitions | **PASS** | — | All transitions defined and validated |
| 3. Illegal transition rejection | **PASS** | — | All illegal transitions rejected with warning |
| 4. Replay compatibility | **FAIL** | CRITICAL | `crypto.randomUUID()` in worker ID; `Date.now()` in latency/failure patterns |
| 5. Provider independence | **PASS** (WARN) | LOW | Hardcoded specialization inference in OllamaWorkerPort |

**Overall: FAIL** — 1 CRITICAL violation prevents constitutional replay guarantees.

## Immediate Remediation Required

1. **Replace `crypto.randomUUID()` with deterministic ID generation** (L17)
   - Use hash of config: `crypto.createHash('sha256').update(JSON.stringify(config)).digest('hex').substring(0, 8)`
   - Or accept explicit `workerId` in config (already supported via `config.workerId`)

2. **Remove `Date.now()` from latency measurement** (L93, L108)
   - Use mission timestamp or deterministic epoch
   - Or exclude latency from replay state (mark as non-deterministic metric)

3. **Remove or make deterministic failure pattern timestamps** (L151)
   - Use mission timestamp
   - Or remove timestamp field (not used in scheduling logic)

4. **Make OllamaWorkerPort specialization configurable** (L195-198)
   - Accept explicit `specialization` in config
   - Use string matching only as fallback
