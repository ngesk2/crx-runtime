---
title: Decision Rules
type: rule
updated: 2026-07-29
tags: [decision, rule, automation, deterministic]
links:
  - INDEX.md
  - ../research/07-decision-systems.md
  - ../research/08-workflow-systems.md
  - ../../orchestration/execution/consensus_engine.js
---

# Decision Rules

## Rule 1: Capability Dispatch — SHA-256 Consistent Hashing

**Source:** Scheduler._selectWorker(), CapabilityRegistry.selectWorker()
**Status:** Implemented
**Rule:** `selectedIndex = SHA-256(capability + missionId + round) % availableWorkers.length`
**Purpose:** Deterministic worker selection — same (capability, mission) always maps to same worker

**When to use:** Any mission that requires worker assignment and does not require consensus.
**When NOT to use:** Consensus missions (use Rule 5 instead), load-critical missions (use capacity-aware selection).
**PING component:** `orchestration/execution/scheduler.js:132-138`

---

## Rule 2: Idempotency Key Derivation

**Source:** Research areas 1, 8, 9
**Status:** Not implemented in PING
**Rule:** `idempotencyKey = SHA-256(eventType + aggregateId + actionType)`
**Purpose:** Same event → same key → same external action skipped on retry

**When to use:** Any external action (send email, create invoice, post to webhook, update CRM).
**When NOT to use:** Read-only queries, internal state transitions.
**Derivation:** Key = hash of triggering event type + entity ID + action name. Does NOT include timestamp.

---

## Rule 3: Confidence Threshold for Automated Decisions

**Source:** ConsensusEngine._singleWorkerDecision(), research area 7
**Status:** Implemented (threshold = 0.7)
**Rule:** `if (confidence >= 0.7) { accept } else { flag_for_human }`
**Purpose:** Prevent low-confidence automated actions

**When to use:** All automated decisions that have business impact.
**When NOT to use:** Irreversible actions (always flag for human), system-only decisions (no business risk).
**Tuning:** Threshold should be configurable per action type. Invoicing = 0.95. Reminder = 0.5. Escalation path if repeatedly borderline.

---

## Rule 4: Decision Provenance Chain

**Source:** ConsensusEngine._findingKey(), research area 4
**Status:** Implemented (findingKey = `${file}:${line}:${type}`)
**Rule:** Every decision must reference source events by event_id
**Purpose:** Every recommendation is traceable to evidence

**When to use:** All recommendations and automated decisions.
**Chain:**
```
decision_id → consensus_artifact_id → worker_output_id → mission_id → event_id
```

---

## Rule 5: Consensus Threshold for Critical Decisions

**Source:** Scheduler.scheduleForConsensus(), ConsensusEngine._multiWorkerConsensus()
**Status:** Implemented
**Rule:** `if (workerCount >= 2 AND variance < 0.1 AND avgConfidence > 0.7) { strongConsensus = true }`
**Purpose:** Critical decisions require multiple independent analyses

**When to use:** Pricing decisions, customer-facing communication, irreversible actions.
**When NOT to use:** Routine decisions, time-sensitive actions (strong consensus takes longer).
**Guard:** Scheduler returns `[]` if `workerCount < 2` (Phase 40B hung-mission fix).

---

## Rule 6: Priority ≥ 8 Requires Consensus

**Source:** Engine._executeMission()
**Status:** Implemented
**Rule:** `if (mission.priority >= 8) { scheduleForConsensus(3) } else { schedule() }`
**Purpose:** High-priority missions get multi-worker validation

**Tuning:** Priority scale 1-10. Values:
- 1-3: Routine (single worker)
- 4-7: Standard (single worker, may escalate)
- 8-9: Critical (consensus with 3 workers)
- 10: Emergency (immediate escalation to human)

---

## Rule 7: Cynefin Classification for Decision Type

**Source:** Research area 7
**Status:** Not implemented
**Rule:** Decision framework is selected by problem classification

| Cynefin Domain | Decision Strategy | Automation Level |
|---------------|-------------------|------------------|
| Clear | Automate (if X then Y) | Full |
| Complicated | Analyze (recommend options to human) | Recommend |
| Complex | Probe (run experiment, observe outcome) | Experiment |
| Chaotic | Act (escalate, stabilize first) | Escalate |
| Disorder | Classify first (gather more information) | Pause |

**When to use:** Any decision recommendation. Classification determines confidence threshold and escalation path.

---

## Rule 8: Entity State Transition Validation

**Source:** Research areas 6, 12
**Status:** Not implemented
**Rule:** State transitions are validated against entity lifecycle matrix

```
valid = lifecycle.states[current].transitions.includes(target)
if (!valid) { reject_with_reason("Cannot transition from ${current} to ${target}") }
```

**Example:** A Project cannot transition from "estimated" to "completed" without passing through "approved" → "scheduled" → "in_progress".

**When to use:** All entity state changes (CREATE, UPDATE, DELETE, status change).
**When NOT to use:** Read operations, computed projections.
