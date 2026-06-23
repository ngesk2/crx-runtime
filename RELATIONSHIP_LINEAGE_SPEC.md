# RELATIONSHIP LINEAGE SPECIFICATION

**Document ID:** RELATIONSHIP-LINEAGE-SPEC-1.0  
**Status:** CONSTITUTIONAL FREEZE  
**Constitutional Law:** TRUTH ≠ EMBEDDINGS  
**Amendment:** Requires constitutional amendment process

---

## SECTION 0 — DECLARATION

This specification defines constitutional relationship lineage for PING.

Relationship lineage is permanent constitutional substrate.

Mistakes propagate permanently.

No modifications after Phase B freeze.

**Constitutional Principle:**
- Relationships are constitutional objects
- Relationships are created through events
- Relationships preserve lineage
- Relationships are reconstructable

---

## SECTION 1 — RELATIONSHIP DEFINITION

### Constitutional Law

**Relationships are constitutional objects.**

**Relationships are created through events.**

### Relationship Structure

```typescript
interface RelationshipObject {
  relationship_id: ObjectID;
  canonical_hash: CanonicalHash;
  relationship_type: RelationshipType;
  source_actor_id: ObjectID;
  target_actor_id: ObjectID;
  lineage: Lineage;
  metadata: Metadata;
  version: string;
  created_at: ISO8601Timestamp;
  updated_at: ISO8601Timestamp;
}
```

### Relationship Types

**FOLLOW**
- Source actor observes target actor
- Constitutional object created through FOLLOW_CREATED event

**SUBSCRIBE**
- Source actor subscribes to target actor content
- Constitutional object created through SUBSCRIBE_CREATED event

**TRUST**
- Source actor trusts target actor
- Constitutional object created through TRUST_CREATED event

**BLOCK**
- Source actor blocks target actor
- Constitutional object created through BLOCK_CREATED event

**MUTE**
- Source actor mutes target actor
- Constitutional object created through MUTE_CREATED event

---

## SECTION 2 — RELATIONSHIP CREATION

### Constitutional Law

**Relationship creation MUST emit constitutional event.**

### Relationship Creation Event

**FOLLOW_CREATED**
- Creates Relationship Object
- Records source actor
- Records target actor
- Records timestamp
- Records lineage

**SUBSCRIBE_CREATED**
- Creates Relationship Object
- Records source actor
- Records target actor
- Records timestamp
- Records lineage

**TRUST_CREATED**
- Creates Relationship Object
- Records source actor
- Records target actor
- Records timestamp
- Records lineage

**BLOCK_CREATED**
- Creates Relationship Object
- Records source actor
- Records target actor
- Records timestamp
- Records lineage

**MUTE_CREATED**
- Creates Relationship Object
- Records source actor
- Records target actor
- Records timestamp
- Records lineage

### Relationship Creation Algorithm

```
create_relationship(source_actor_id, target_actor_id, relationship_type):
  relationship_id = generate_object_id()
  canonical_hash = compute_canonical_hash(source_actor_id, target_actor_id, relationship_type)
  emit_relationship_created_event(source_actor_id, target_actor_id, relationship_type, relationship_id)
  record_relationship_lineage(relationship_id, source_actor_id, target_actor_id)
  return relationship_id
```

---

## SECTION 3 — RELATIONSHIP REMOVAL

### Constitutional Law

**Relationship removal MUST emit constitutional event.**

### Relationship Removal Event

**FOLLOW_REMOVED**
- Marks Relationship Object as removed
- Records source actor
- Records target actor
- Records timestamp
- Records lineage

**SUBSCRIBE_REMOVED**
- Marks Relationship Object as removed
- Records source actor
- Records target actor
- Records timestamp
- Records lineage

**TRUST_REMOVED**
- Marks Relationship Object as removed
- Records source actor
- Records target actor
- Records timestamp
- Records lineage

**BLOCK_REMOVED**
- Marks Relationship Object as removed
- Records source actor
- Records target actor
- Records timestamp
- Records lineage

**MUTE_REMOVED**
- Marks Relationship Object as removed
- Records source actor
- Records target actor
- Records timestamp
- Records lineage

### Relationship Removal Algorithm

```
remove_relationship(relationship_id, source_actor_id, target_actor_id, relationship_type):
  emit_relationship_removed_event(source_actor_id, target_actor_id, relationship_type, relationship_id)
  record_relationship_removal_lineage(relationship_id, source_actor_id, target_actor_id)
  mark_relationship_as_removed(relationship_id)
  return true
```

---

## SECTION 4 — RELATIONSHIP LINEAGE

### Constitutional Law

**Relationships MUST preserve lineage.**

### Lineage Requirements

Relationship lineage MUST:
- Record creation event
- Record removal event
- Preserve source actor
- Preserve target actor
- Preserve relationship type
- Enable reconstruction

### Lineage Structure

```typescript
interface RelationshipLineage {
  relationship_id: ObjectID;
  created_event: EventID;
  removed_event: EventID | null;
  source_actor_id: ObjectID;
  target_actor_id: ObjectID;
  relationship_type: RelationshipType;
  created_at: ISO8601Timestamp;
  removed_at: ISO8601Timestamp | null;
}
```

---

## SECTION 5 — RELATIONSHIP RECONSTRUCTION

### Constitutional Law

**Relationships MUST be reconstructable.**

### Reconstruction Requirements

Relationship reconstruction MUST:
- Load relationship lineage
- Replay relationship events
- Reconstruct relationship state
- Verify relationship continuity

### Reconstruction Algorithm

```
reconstruct_relationship(relationship_id):
  lineage = load_relationship_lineage(relationship_id)
  events = load_relationship_events(relationship_id)
  relationship = replay_relationship_events(events)
  verify_relationship_continuity(relationship_id, relationship)
  return relationship
```

---

## SECTION 6 — RELATIONSHIP ANCESTOR RECONSTRUCTION

### Constitutional Law

**Relationship ancestors MUST be reconstructable.**

### Ancestor Reconstruction Requirements

Ancestor reconstruction MUST:
- Load relationship lineage
- Trace ancestor chain
- Reconstruct ancestor states
- Verify ancestor continuity

### Ancestor Reconstruction Algorithm

```
reconstruct_relationship_ancestors(relationship_id):
  lineage = load_relationship_lineage(relationship_id)
  ancestors = trace_ancestor_chain(lineage)
  ancestor_states = reconstruct_ancestor_states(ancestors)
  verify_ancestor_continuity(ancestor_states)
  return ancestor_states
```

---

## SECTION 7 — RELATIONSHIP VERSION RECONSTRUCTION

### Constitutional Law

**Relationship versions MUST be reconstructable.**

### Version Reconstruction Requirements

Version reconstruction MUST:
- Load relationship lineage
- Load relationship events
- Reconstruct version states
- Verify version continuity

### Version Reconstruction Algorithm

```
reconstruct_relationship_versions(relationship_id):
  lineage = load_relationship_lineage(relationship_id)
  events = load_relationship_events(relationship_id)
  versions = reconstruct_version_states(events)
  verify_version_continuity(versions)
  return versions
```

---

## SECTION 8 — FINAL PRINCIPLE

Relationship lineage is constitutional substrate.

Relationships are constitutional objects created through events.

Relationships preserve lineage.

Relationships are reconstructable.

**Constitutional Law:**
- Relationships are constitutional objects
- Relationships are created through events
- Relationships preserve lineage
- Relationships are reconstructable

---

**Document ID:** RELATIONSHIP-LINEAGE-SPEC-1.0  
**Status:** CONSTITUTIONAL FREEZE  
**Amendment:** Requires constitutional amendment process
