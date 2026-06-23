# PORTABLE AUDIENCE SPECIFICATION

**Document ID:** PORTABLE-AUDIENCE-SPEC-1.0  
**Status:** CONSTITUTIONAL FREEZE  
**Constitutional Law:** TRUTH ≠ EMBEDDINGS  
**Amendment:** Requires constitutional amendment process

---

## SECTION 0 — DECLARATION

This specification defines constitutional portable audience for PING.

Portable audience is permanent constitutional substrate.

Mistakes propagate permanently.

No modifications after Phase B freeze.

**Constitutional Principle:**
- Audience belongs to creators
- Platforms host audiences
- Platforms do not own audiences
- Audience is portable

---

## SECTION 1 — AUDIENCE DEFINITION

### Constitutional Law

**Audience belongs to creators.**

**Platforms host audiences.**

**Platforms do not own audiences.**

### Audience Structure

```typescript
interface AudienceObject {
  audience_id: ObjectID;
  canonical_hash: CanonicalHash;
  creator_id: ObjectID;
  members: ObjectID[];
  lineage: Lineage;
  metadata: Metadata;
  version: string;
  created_at: ISO8601Timestamp;
  updated_at: ISO8601Timestamp;
}
```

### Audience Properties

Audience MUST be:
- Owned by creator
- Portable between platforms
- Hosted by platforms
- Governed by creator
- Independent of platform

---

## SECTION 2 — AUDIENCE OWNERSHIP

### Constitutional Law

**Audience belongs to creators.**

**Audience ownership is constitutional.**

### Ownership Requirements

Audience ownership MUST:
- Be assigned to creator
- Be transferable by creator
- Be revocable by creator
- Be independent of platform

### Ownership Violation

Ownership violations MUST:
- Fail deterministically
- Trigger constitutional audit
- Be recorded in event stream
- Prevent platform ownership

---

## SECTION 3 — PLATFORM HOSTING

### Constitutional Law

**Platforms host audiences.**

**Platforms do not own audiences.**

### Hosting Requirements

Platform hosting MUST:
- Host audience objects
- Provide audience access
- NOT claim audience ownership
- NOT prevent audience portability

### Hosting Violation

Hosting violations MUST:
- Fail deterministically
- Trigger constitutional audit
- Be recorded in event stream
- Prevent platform ownership claims

---

## SECTION 4 — AUDIENCE PORTABILITY

### Constitutional Law

**Audience is portable between platforms.**

### Portability Requirements

Audience portability MUST:
- Survive platform changes
- Survive platform migration
- Survive platform collapse
- Preserve audience membership

### Portability Algorithm

```
migrate_audience(audience_id, source_platform, target_platform):
  audience = load_audience(audience_id)
  verify_creator_ownership(audience)
  emit_audience_migration_event(audience_id, source_platform, target_platform)
  record_audience_migration_lineage(audience_id, source_platform, target_platform)
  migrate_audience_to_target_platform(audience, target_platform)
  return true
```

---

## SECTION 5 — AUDIENCE MEMBERSHIP

### Constitutional Law

**Audience membership is constitutional.**

### Membership Requirements

Audience membership MUST:
- Be recorded in audience object
- Be traceable to creator
- Be independent of platform
- Be portable between platforms

### Membership Algorithm

```
add_audience_member(audience_id, member_id, creator_id):
  verify_creator_ownership(audience_id, creator_id)
  emit_audience_member_added_event(audience_id, member_id, creator_id)
  record_audience_member_lineage(audience_id, member_id, creator_id)
  add_member_to_audience(audience_id, member_id)
  return true
```

---

## SECTION 6 — AUDIENCE TRANSFER

### Constitutional Law

**Audience ownership is transferable by creator.**

### Transfer Requirements

Audience transfer MUST:
- Be authorized by creator
- Be recorded as constitutional event
- Preserve audience membership
- Enable platform migration

### Transfer Algorithm

```
transfer_audience(audience_id, current_creator_id, new_creator_id):
  verify_creator_ownership(audience_id, current_creator_id)
  emit_audience_transfer_event(audience_id, current_creator_id, new_creator_id)
  record_audience_transfer_lineage(audience_id, current_creator_id, new_creator_id)
  transfer_audience_ownership(audience_id, new_creator_id)
  return true
```

---

## SECTION 7 — AUDIENCE REVOCATION

### Constitutional Law

**Audience ownership is revocable by creator.**

### Revocation Requirements

Audience revocation MUST:
- Be authorized by creator
- Be recorded as constitutional event
- Preserve audience history
- Enable audience reconstruction

### Revocation Algorithm

```
revoke_audience(audience_id, creator_id):
  verify_creator_ownership(audience_id, creator_id)
  emit_audience_revocation_event(audience_id, creator_id)
  record_audience_revocation_lineage(audience_id, creator_id)
  revoke_audience_ownership(audience_id)
  return true
```

---

## SECTION 8 — FINAL PRINCIPLE

Portable audience is constitutional substrate.

Audience belongs to creators.

Platforms host audiences.

Platforms do not own audiences.

**Constitutional Law:**
- Audience belongs to creators
- Platforms host audiences
- Platforms do not own audiences
- Audience is portable

---

**Document ID:** PORTABLE-AUDIENCE-SPEC-1.0  
**Status:** CONSTITUTIONAL FREEZE  
**Amendment:** Requires constitutional amendment process
