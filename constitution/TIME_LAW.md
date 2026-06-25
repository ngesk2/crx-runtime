# TIME LAW

**Status:** FROZEN CONSTITUTIONAL AUTHORITY
**Scope:** Constitutional time semantics only. No implementation details.
**Root Law:** TRUTH_LAW.md (truth = immutable verified event), EVENT_LAW.md (event ontology), REPLAY_LAW.md (replay determinism)
**Date:** 2026-06-24

---

# CONSTITUTIONAL TIME

## Axiom 1 — Constitutional Time is Event Order

**AXIOM:** Constitutional time is defined solely by event order in the append-only event sequence. Wall clock, system clock, and network time are prohibited for constitutional ordering.

**RATIONALE:** Without event-order-based time, replay determinism fails, event ordering becomes ambiguous, and constitutional truth cannot be reconstructed.

**VIOLATION CONSEQUENCE:** Replay divergence, event ordering ambiguity, constitutional truth corruption.

---

# CONSTITUTIONAL TIME DEFINITION

## Definition

Constitutional time is the ordering of events in the append-only event sequence. Event N precedes event N+1. Constitutional time is NOT wall clock time.

## Properties

- **Deterministic:** Same event sequence → same constitutional time
- **Append-only:** Events are never removed or reordered
- **Immutable:** Event order never changes
- **Replayable:** Constitutional time can be reconstructed from event sequence

---

# PROHIBITED TIME SOURCES

## wall_clock

**Type:** System wall clock time

**Status:** PROHIBITED for constitutional ordering

**Definition:** Time from system clock (e.g., `time.time()`, `Date.now()`)

**Reason:** Not deterministic across systems. Different systems have different clock times.

**Examples:**
- `time.time()` (Python)
- `Date.now()` (JavaScript)
- `System.currentTimeMillis()` (Java)
- `clock_gettime()` (C)

**Constitutional Consequence:** Replay divergence, event ordering ambiguity, verification failure

**Allowed Use:** Logging, debugging, non-constitutional operations

---

## system_clock

**Type:** Operating system clock time

**Status:** PROHIBITED for constitutional ordering

**Definition:** Time from operating system clock

**Reason:** Not deterministic across systems. Clock drift, timezone differences, NTP adjustments.

**Examples:**
- System uptime
- Boot time
- Process start time

**Constitutional Consequence:** Replay divergence, event ordering ambiguity

**Allowed Use:** System monitoring, non-constitutional operations

---

## network_time

**Type:** Network-synchronized time

**Status:** PROHIBITED for constitutional ordering

**Definition:** Time from NTP, NTS, or other network time sources

**Reason:** Not deterministic. Network latency, clock skew, network partitions.

**Examples:**
- NTP time
- NTS time
- Network timestamp

**Constitutional Consequence:** Replay divergence, network dependency, verification failure

**Allowed Use:** System synchronization, non-constitutional operations

---

## timestamp_field

**Type:** Event timestamp field

**Status:** PROHIBITED for constitutional ordering

**Definition:** Using event timestamp field for ordering

**Reason:** Timestamps are not constitutional time. They are metadata, not ordering.

**Examples:**
- `ORDER BY timestamp`
- `WHERE timestamp > X`

**Constitutional Consequence:** Event ordering ambiguity, replay divergence

**Allowed Use:** Metadata, debugging, non-constitutional ordering

---

# CANONICAL ORDERING

## Append-Only Event Sequence

**Definition:** Events are appended to the event sequence in the order they are recorded. Event order is constitutional time.

**Properties:**
- **Append-only:** Events are never removed
- **Immutable:** Event order never changes
- **Deterministic:** Same event sequence → same order
- **Replayable:** Event order can be reconstructed

**Algorithm:**
```
event_sequence = []
event_sequence.append(event_1)  # Constitutional time = 1
event_sequence.append(event_2)  # Constitutional time = 2
event_sequence.append(event_3)  # Constitutional time = 3
```

**Constitutional Time:**
- Event 1: Constitutional time = 1
- Event 2: Constitutional time = 2
- Event 3: Constitutional time = 3

---

## Event Order Index

**Definition:** Each event has an order index in the event sequence.

**Properties:**
- **Monotonic:** Order index always increases
- **Unique:** Each event has unique order index
- **Immutable:** Order index never changes

**Schema:**
```yaml
event:
  event_id: uuid
  event_order_index: integer  # Constitutional time
  event_data: jsonb
```

**Validation:**
- Verify event_order_index is monotonic
- Verify event_order_index is unique
- Verify event_order_index is immutable

**Failure:**
- Constitutional incident
- Event ordering corruption
- Replay divergence

---

# CONSTITUTIONAL TIME REQUIREMENTS

## Event Recording

**Requirement:** Events must be recorded in append-only order

**Validation:**
- Verify events are appended in order
- Verify events are never reordered
- Verify events are never removed

**Failure:**
- Constitutional incident
- Event ordering corruption

---

## Event Replay

**Requirement:** Replay must use event order, not timestamps

**Validation:**
- Verify replay uses event_order_index
- Verify replay does not use timestamps
- Verify replay produces identical order

**Failure:**
- Constitutional incident
- Replay divergence

---

## Event Querying

**Requirement:** Event queries must use event order, not timestamps

**Validation:**
- Verify queries use event_order_index
- Verify queries do not use timestamps for ordering
- Verify queries produce deterministic results

**Failure:**
- Constitutional incident
- Query divergence

---

# TIME VERIFICATION

## Verification Gate

**Purpose:** Verify time compliance before event recording

**Input:**
- event_proposal
- event_order_index
- timestamp_field (metadata only)

**Verification:**
1. Verify event_order_index is monotonic
2. Verify event_order_index is unique
3. Verify event_order_index is used for ordering
4. Verify timestamp_field is not used for ordering
5. Verify no wall clock used for ordering
6. Verify no system clock used for ordering
7. Verify no network time used for ordering

**Output:**
- verification_result: PASS | FAIL
- rejection_reason: string (if FAIL)

**Failure:**
- Reject event
- Open constitutional incident
- Record rejection reason

---

# CONSTITUTIONAL INVARIANTS

## Invariant 1 — Constitutional Time is Event Order

**Statement:** Constitutional time is defined solely by event order

**Violation:** Using wall clock, system clock, or network time for ordering

**Consequence:** Constitutional incident

---

## Invariant 2 — Event Order is Append-Only

**Statement:** Event order is append-only and immutable

**Violation:** Event reordering, event removal, event insertion

**Consequence:** Constitutional incident

---

## Invariant 3 — No Prohibited Time Sources

**Statement:** Prohibited time sources are never used for constitutional ordering

**Violation:** Using wall clock, system clock, or network time for ordering

**Consequence:** Constitutional incident

---

## Invariant 4 — Timestamps are Metadata Only

**Statement:** Timestamps are metadata, not constitutional ordering

**Violation:** Using timestamps for constitutional ordering

**Consequence:** Constitutional incident

---

# FAILURE SEMANTICS

## Time Violation Detection

**Detection:** Time verification gate

**Severity:** CRITICAL

**Action:** Reject event, open constitutional incident

**Remediation:** Fix time logic, use event order only

## Event Ordering Corruption Detection

**Detection:** Event order verification

**Severity:** CRITICAL

**Action:** Open constitutional incident

**Remediation:** Investigate event ordering, fix corruption

## Replay Divergence Detection

**Detection:** Replay verification

**Severity:** CRITICAL

**Action:** Open constitutional incident

**Remediation:** Investigate time logic, fix replay divergence

---

# CONSTITUTIONAL PRINCIPLE

**Constitutional time is event order. Wall clock, system clock, and network time are prohibited for constitutional ordering.**

---

**Document ID:** CONSTITUTION-TIME-LAW-1.0
**Status:** FROZEN
**Amendment:** Requires constitutional amendment process
