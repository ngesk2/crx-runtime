# CRX Constitutional Mapping

**Phase 4:** Constitutional compatibility audit and mapping

---

## Overview

CRX Constitutional Mapping determines what CRX concepts already exist as constitutional primitives (Objects, Events, Lineage, Witnesses, Relationships, Capabilities, Trust Edges, Identities). Classifies each as Compatible, Needs Adapter, or Must Be Replaced.

---

## Mapping Categories

### Classification Criteria

**Compatible:**
- CRX concept already exists as constitutional primitive
- Direct mapping possible
- No adapter required
- No modification required

**Needs Adapter:**
- CRX concept similar to constitutional primitive
- Adapter layer required for mapping
- No modification to constitutional primitive
- CRX code requires modification

**Must Be Replaced:**
- CRX concept incompatible with constitutional primitive
- No mapping possible
- CRX code must be replaced
- Constitutional primitive must be used instead

---

## CRX Concept Mapping

### 1. Post
**CRX Concept:** Post object with content, author, timestamp
**Constitutional Primitive:** ProtocolObject (PostArtifact)
**Classification:** Compatible
**Mapping:** Direct mapping to PostArtifact
**Adapter Required:** No

### 2. Reply
**CRX Concept:** Reply object with content, author, parent post, timestamp
**Constitutional Primitive:** ProtocolObject (ReplyArtifact)
**Classification:** Compatible
**Mapping:** Direct mapping to ReplyArtifact
**Adapter Required:** No

### 3. Identity
**CRX Concept:** User identity with public key, profile
**Constitutional Primitive:** Constitutional Identity (IdentityArtifact)
**Classification:** Compatible
**Mapping:** Direct mapping to IdentityArtifact
**Adapter Required:** No

### 4. Trust
**CRX Concept:** Trust relationship between users
**Constitutional Primitive:** Trust Edge (TrustEdge)
**Classification:** Compatible
**Mapping:** Direct mapping to TrustEdge
**Adapter Required:** No

### 5. Feed
**CRX Concept:** Feed of posts and replies
**Constitutional Primitive:** Projection (Feed)
**Classification:** Needs Adapter
**Mapping:** Feed derived from PostArtifact and ReplyArtifact
**Adapter Required:** Yes - FeedAdapter

### 6. Community
**CRX Concept:** Community with members, roles, governance
**Constitutional Primitive:** Community Object (CommunityArtifact)
**Classification:** Compatible
**Mapping:** Direct mapping to CommunityArtifact
**Adapter Required:** No

### 7. Thread
**CRX Concept:** Thread of posts and replies
**Constitutional Primitive:** Relationship Graph
**Classification:** Needs Adapter
**Mapping:** Thread derived from PostArtifact and ReplyArtifact relationships
**Adapter Required:** Yes - ThreadAdapter

### 8. Like
**CRX Concept:** Like reaction on post
**Constitutional Primitive:** Attestation (AttestationArtifact)
**Classification:** Compatible
**Mapping:** Direct mapping to AttestationArtifact (endorsement type)
**Adapter Required:** No

### 9. Follow
**CRX Concept:** Follow relationship between users
**Constitutional Primitive:** Trust Edge (TrustEdge)
**Classification:** Compatible
**Mapping:** Direct mapping to TrustEdge (follow type)
**Adapter Required:** No

### 10. Notification
**CRX Concept:** Notification to user
**Constitutional Primitive:** Event (NotificationEvent)
**Classification:** Needs Adapter
**Mapping:** Notification derived from constitutional events
**Adapter Required:** Yes - NotificationAdapter

---

## Mapping Summary

### Compatible Concepts (Direct Mapping)
- Post → PostArtifact
- Reply → ReplyArtifact
- Identity → IdentityArtifact
- Trust → TrustEdge
- Community → CommunityArtifact
- Like → AttestationArtifact
- Follow → TrustEdge

### Needs Adapter Concepts
- Feed → FeedAdapter
- Thread → ThreadAdapter
- Notification → NotificationAdapter

### Must Be Replaced Concepts
- None identified (all CRX concepts have constitutional equivalents)

---

## Adapter Specifications

### FeedAdapter
**Purpose:** Derive feed from constitutional objects
**Input:** PostArtifact, ReplyArtifact
**Output:** Feed projection
**Implementation:**
```python
class FeedAdapter:
    """Feed adapter for CRX."""
    
    def derive_feed(self, feed_id: UUID) -> Feed:
        """Derive feed from constitutional objects."""
        # Get feed objects
        feed_objects = get_feed_objects(feed_id)
        
        # Categorize objects
        posts = [obj for obj in feed_objects if obj.artifact_type == 'post']
        replies = [obj for obj in feed_objects if obj.artifact_type == 'reply']
        
        # Generate feed
        feed = Feed(feed_id=feed_id, posts=posts, replies=replies)
        
        return feed
```

### ThreadAdapter
**Purpose:** Derive thread from constitutional objects
**Input:** PostArtifact, ReplyArtifact
**Output:** Thread projection
**Implementation:**
```python
class ThreadAdapter:
    """Thread adapter for CRX."""
    
    def derive_thread(self, thread_id: UUID) -> Thread:
        """Derive thread from constitutional objects."""
        # Get thread objects
        thread_objects = get_thread_objects(thread_id)
        
        # Build thread structure
        posts = [obj for obj in thread_objects if obj.artifact_type == 'post']
        replies = [obj for obj in thread_objects if obj.artifact_type == 'reply']
        
        # Generate thread
        thread = Thread(thread_id=thread_id, posts=posts, replies=replies)
        
        return thread
```

### NotificationAdapter
**Purpose:** Derive notifications from constitutional events
**Input:** Constitutional events
**Output:** Notification projection
**Implementation:**
```python
class NotificationAdapter:
    """Notification adapter for CRX."""
    
    def derive_notifications(self, identity_id: UUID) -> List[Notification]:
        """Derive notifications from constitutional events."""
        # Get events for identity
        events = get_events_for_identity(identity_id)
        
        # Filter notification events
        notification_events = [e for e in events if e.event_type in ['POST_CREATED', 'REPLY_CREATED']]
        
        # Generate notifications
        notifications = []
        for event in notification_events:
            notification = Notification.from_event(event)
            notifications.append(notification)
        
        return notifications
```

---

## Constitutional Mapping Best Practices

### 1. Direct Mapping
- Use direct mapping where possible
- No adapter required for compatible concepts
- No modification to constitutional primitives
- No modification to CRX code

### 2. Adapter Layer
- Use adapter layer for concepts requiring derivation
- Adapters consume constitutional primitives
- Adapters never modify constitutional primitives
- Adapters generate projections

### 3. No Replacement
- No CRX concepts require full replacement
- All CRX concepts have constitutional equivalents
- Constitutional primitives used instead of replacements
- No competing architectures

### 4. Verification
- Verify mapping correctness
- Verify adapter correctness
- Verify projection correctness
- Verify constitutional compliance

### 5. Documentation
- Document all mappings
- Document all adapters
- Document mapping decisions
- Document adapter implementations
