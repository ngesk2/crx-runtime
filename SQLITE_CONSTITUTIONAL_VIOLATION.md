# SQLITE CONSTITUTIONAL VIOLATION

**Date**: 2026-06-22
**Blocker**: #3 - SQLite Constitutional Violation

---

## ISSUE

SQLite databases contain knowledge outside the constitutional event stream.

**Locations**:
- C:\Users\nolan\CascadeProjects\crx-digestion-worker\knowledge.db
- C:\Users\nolan\CascadeProjects\crx-newsletter-brain\newsletters.db

**Constitutional Violation**: These databases store knowledge independently of the event stream, creating shadow authorities for knowledge storage.

---

## CONSTITUTIONAL REQUIREMENT

All constitutional truth must originate from the event stream:
```
Event → Replay → State → Knowledge
```

SQLite databases bypass this flow:
```
SQLite → Knowledge (independent of events)
```

---

## RESOLUTION OPTIONS

### Option A (Preferred): Convert to Projections

**Steps**:
1. Migrate SQLite data to Postgres events
2. Add replay regeneration for knowledge
3. Delete SQLite databases
4. Knowledge becomes replay-derived projection

**Result**: SAFE - Knowledge is constitutional

### Option B: Delete Entirely

**Steps**:
1. Delete SQLite databases
2. Move all data into events
3. Knowledge is reconstructed from events

**Result**: SAFE - Knowledge is constitutional

---

## CURRENT STATUS

**Location**: CascadeProjects (external to PING)

**Action Required**: Convert to projections or delete before PING can be certified as sovereign continuity substrate.

**Priority**: HIGH - This is a constitutional violation that prevents sovereign continuity certification.

---

## RECOMMENDATION

Implement Option A:
1. Create migration script to convert SQLite data to Postgres events
2. Add knowledge replay regeneration to ReplayStateMachine
3. Delete SQLite databases
4. Verify knowledge reconstruction via Constitutional Reconstruction Test
