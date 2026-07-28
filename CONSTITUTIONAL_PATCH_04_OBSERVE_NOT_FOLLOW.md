# CONSTITUTIONAL PATCH 04 — OBSERVE NOT FOLLOW

**Document ID:** CONSTITUTIONAL-PATCH-04-OBSERVE-NOT-FOLLOW-1.0  
**Status:** CONSTITUTIONAL AMENDMENT  
**Constitutional Law:** TRUTH ≠ EMBEDDINGS  
**Amendment:** Requires constitutional amendment process

---

## SECTION 0 — VULNERABILITY IDENTIFICATION

### Current Assumption

"Follow" actor → actor

### Problem

"Follow" is primitive leakage from 2010 internet.

### Historical Accident

Twitter/X logic is temporary.
X Corp. / X Platform logic is historically accidental.

### Constitutional Violation

"Follow" assumes social graph (historically accidental, not constitutional).

---

## SECTION 1 — FUTURE-PROOF ABSTRACTION

### Constitutional Law

**Replace "follow" with "observe".**

### Observe Definition

**Actor expresses continuity interest in another actor.**

### Observe Semantics

```
observe(actor_a, actor_b)
```

NOT:

```
follow(actor_a, actor_b)
```

---

## SECTION 2 — OBSERVE EVENT

### Constitutional Event

```json
{
  "event_type": "OBSERVE_CREATED",
  "payload": {
    "observer_id": "ping:actor:a1b2c3",
    "target_id": "ping:actor:d4e5f6",
    "created_at": "ISO8601Timestamp"
  }
}
```

### Observe Revocation

```json
{
  "event_type": "OBSERVE_REVOKED",
  "payload": {
    "observer_id": "ping:actor:a1b2c3",
    "target_id": "ping:actor:d4e5f6",
    "revoked_at": "ISO8601Timestamp",
    "reason": "string"
  }
}
```

---

## SECTION 3 — WEB COMPONENT UPDATE

### Constitutional Law

**Replace `<ping-follow>` with `<ping-observe>`.**

### Component Definition

**Definition:** `<ping-observe>` displays observe button and status.

**Attributes:**
- **target_id**: ObjectID of target object (required)
- **observer_id**: ObjectID of observer object (required)
- **observing**: Boolean, observe status (optional, default: false)
- **count**: Number, observer count (optional, default: 0)

**Serialization:**
```html
<ping-observe target_id="ping:profile:a1b2c3" observer_id="ping:profile:d4e5f6" observing="false" count="42"></ping-observe>
```

---

## SECTION 4 — RELATIONSHIP INFRASTRUCTURE UPDATE

### Constitutional Law

**Replace "follow" with "observe" in all relationship infrastructure.**

### Relationship Semantics

**<ping-observe> means: Actor observes Actor.**

**observer → target**

### Constitutional Event

```json
{
  "event_type": "OBSERVE_CREATED",
  "payload": {
    "observer_id": "ping:actor:a1b2c3",
    "target_id": "ping:actor:d4e5f6"
  }
}
```

---

## SECTION 5 — CONSTITUTIONAL AMENDMENT

### Amendment to RELATIONSHIP_INFRASTRUCTURE_SPEC.md

**Replace "follow" with "observe" throughout:**

- FOLLOW_CREATED → OBSERVE_CREATED
- FOLLOW_REVOKED → OBSERVE_REVOKED
- follower_id → observer_id
- following → observing
- <ping-follow> → <ping-observe>

**Add Observe Definition:**

Actor expresses continuity interest in another actor.

**Add Constitutional Law:**

Replace "follow" with "observe".

observe(actor_a, actor_b)
NOT follow(actor_a, actor_b)

### Amendment to WEB_COMPONENT_CONSTITUTION.md

**Replace PING-FOLLOW with PING-OBSERVE:**

- Component name: <ping-observe>
- Attributes: observer_id, observing
- Serialization: <ping-observe>

---

## SECTION 6 — FINAL PRINCIPLE

"Follow" is historically accidental.

"Observe" is constitutionally intentional.

**Constitutional Law:**
Replace "follow" with "observe".
Actor expresses continuity interest in another actor.
observe(actor_a, actor_b)
NOT follow(actor_a, actor_b)

---

**Document ID:** CONSTITUTIONAL-PATCH-04-OBSERVE-NOT-FOLLOW-1.0  
**Status:** CONSTITUTIONAL AMENDMENT  
**Amendment:** Requires constitutional amendment process
