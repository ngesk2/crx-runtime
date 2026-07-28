# Object Model Mapping

**Phase 6:** Map every CRX entity to constitutional primitives

---

## Overview

Object Model Mapping maps every CRX entity to constitutional primitives. No CRX entity may become authoritative. All mappings must use constitutional Objects, Events, Lineage, Witnesses, Relationships, Capabilities, Trust Edges, and Identities.

---

## CRX Entity Mappings

### 1. Post
**CRX Entity:** Post with content, author, timestamp, metadata
**Constitutional Primitive:** PostArtifact (ProtocolObject)
**Mapping:**
```python
class PostArtifact(Artifact):
    """Post artifact."""
    
    def __init__(
        self,
        post_id: UUID,
        content: str,
        author_identity_id: UUID,
        thread_id: UUID = None
    ):
        super().__init__(
            artifact_id=post_id,
            artifact_type='post',
            content_hash=compute_content_hash(content),
            lineage_id=uuid4()
        )
        self.post_id = post_id
        self.content = content
        self.author_identity_id = author_identity_id
        self.thread_id = thread_id
        self.created_at = datetime.utcnow()
```

### 2. Reply
**CRX Entity:** Reply with content, author, parent post, timestamp
**Constitutional Primitive:** ReplyArtifact (ProtocolObject)
**Mapping:**
```python
class ReplyArtifact(Artifact):
    """Reply artifact."""
    
    def __init__(
        self,
        reply_id: UUID,
        content: str,
        author_identity_id: UUID,
        parent_post_id: UUID,
        thread_id: UUID = None
    ):
        super().__init__(
            artifact_id=reply_id,
            artifact_type='reply',
            content_hash=compute_content_hash(content),
            lineage_id=uuid4()
        )
        self.reply_id = reply_id
        self.content = content
        self.author_identity_id = author_identity_id
        self.parent_post_id = parent_post_id
        self.thread_id = thread_id
        self.created_at = datetime.utcnow()
```

### 3. Identity
**CRX Entity:** User identity with public key, profile
**Constitutional Primitive:** IdentityArtifact (Constitutional Identity)
**Mapping:**
```python
class IdentityArtifact(Artifact):
    """Identity artifact."""
    
    def __init__(
        self,
        identity_id: UUID,
        public_key: str,
        identity_hash: str,
        capabilities: List[str],
        trust_edges: List[Dict],
        metadata: Dict
    ):
        super().__init__(
            artifact_id=identity_id,
            artifact_type='identity',
            content_hash=identity_hash,
            lineage_id=uuid4()
        )
        self.identity_id = identity_id
        self.public_key = public_key
        self.identity_hash = identity_hash
        self.capabilities = capabilities
        self.trust_edges = trust_edges
        self.metadata = metadata
```

### 4. Trust
**CRX Entity:** Trust relationship between users
**Constitutional Primitive:** TrustEdge
**Mapping:**
```python
class TrustEdge:
    """Trust edge."""
    
    def __init__(
        self,
        source_identity_id: UUID,
        target_identity_id: UUID,
        trust_level: float,
        trust_type: str,
        metadata: Dict = None
    ):
        self.source_identity_id = source_identity_id
        self.target_identity_id = target_identity_id
        self.trust_level = trust_level
        self.trust_type = trust_type
        self.metadata = metadata or {}
        self.created_at = datetime.utcnow()
```

### 5. Feed
**CRX Entity:** Feed of posts and replies
**Constitutional Primitive:** Projection (Feed)
**Mapping:**
```python
class Feed:
    """Feed projection."""
    
    def __init__(
        self,
        feed_id: UUID,
        posts: List[PostArtifact],
        replies: List[ReplyArtifact]
    ):
        self.feed_id = feed_id
        self.posts = posts
        self.replies = replies
        self.derived_at = datetime.utcnow()
```

### 6. Community
**CRX Entity:** Community with members, roles, governance
**Constitutional Primitive:** CommunityArtifact
**Mapping:**
```python
class CommunityArtifact(Artifact):
    """Community artifact."""
    
    def __init__(
        self,
        community_id: UUID,
        name: str,
        description: str,
        creator_identity_id: UUID,
        governance_model: str
    ):
        super().__init__(
            artifact_id=community_id,
            artifact_type='community',
            content_hash=compute_content_hash({
                'name': name,
                'description': description,
                'governance_model': governance_model
            }),
            lineage_id=uuid4()
        )
        self.community_id = community_id
        self.name = name
        self.description = description
        self.creator_identity_id = creator_identity_id
        self.governance_model = governance_model
        self.created_at = datetime.utcnow()
```

### 7. Thread
**CRX Entity:** Thread of posts and replies
**Constitutional Primitive:** Relationship Graph
**Mapping:**
```python
class Thread:
    """Thread projection."""
    
    def __init__(
        self,
        thread_id: UUID,
        posts: List[PostArtifact],
        replies: List[ReplyArtifact]
    ):
        self.thread_id = thread_id
        self.posts = posts
        self.replies = replies
        self.derived_at = datetime.utcnow()
```

### 8. Like
**CRX Entity:** Like reaction on post
**Constitutional Primitive:** AttestationArtifact
**Mapping:**
```python
class AttestationArtifact(Artifact):
    """Attestation artifact."""
    
    def __init__(
        self,
        attestation_id: UUID,
        attestation_type: str,
        target_artifact_id: UUID,
        attester_identity_id: UUID,
        attestation_data: Dict,
        signature: str
    ):
        super().__init__(
            artifact_id=attestation_id,
            artifact_type='attestation',
            content_hash=compute_attestation_hash(attestation_data),
            lineage_id=uuid4()
        )
        self.attestation_id = attestation_id
        self.attestation_type = attestation_type
        self.target_artifact_id = target_artifact_id
        self.attester_identity_id = attester_identity_id
        self.attestation_data = attestation_data
        self.signature = signature
        self.created_at = datetime.utcnow()
```

### 9. Follow
**CRX Entity:** Follow relationship between users
**Constitutional Primitive:** TrustEdge (follow type)
**Mapping:**
```python
# Follow is a type of TrustEdge
trust_edge = TrustEdge(
    source_identity_id=follower_id,
    target_identity_id=following_id,
    trust_level=1.0,
    trust_type='follow'
)
```

### 10. Notification
**CRX Entity:** Notification to user
**Constitutional Primitive:** Event (NotificationEvent)
**Mapping:**
```python
class NotificationEvent(Event):
    """Notification event."""
    
    def __init__(
        self,
        event_id: UUID,
        notification_type: str,
        recipient_identity_id: UUID,
        notification_data: Dict
    ):
        super().__init__(
            event_id=event_id,
            event_type='NOTIFICATION',
            event_data=notification_data,
            aggregate_id=recipient_identity_id,
            causation_id=None,
            correlation_id=None,
            timestamp=datetime.utcnow()
        )
        self.notification_type = notification_type
        self.recipient_identity_id = recipient_identity_id
        self.notification_data = notification_data
```

---

## Mapping Rules

### Rule 1: No Authority
**Statement:** No CRX entity may become authoritative
**Implementation:**
- All CRX entities map to constitutional primitives
- Constitutional primitives remain authoritative
- CRX entities are projections or adapters
- No CRX entity becomes source of truth

### Rule 2: Constitutional Storage
**Statement:** All CRX entities stored as constitutional objects
**Implementation:**
- Posts stored as PostArtifact
- Replies stored as ReplyArtifact
- Identities stored as IdentityArtifact
- Communities stored as CommunityArtifact

### Rule 3: Lineage Tracking
**Statement:** All CRX entities track lineage
**Implementation:**
- All artifacts have lineage_id
- All artifacts track ancestry
- All artifacts track provenance
- All artifacts are replayable

### Rule 4: Witness Generation
**Statement:** All CRX entities generate witnesses
**Implementation:**
- All artifacts generate object witnesses
- All events generate event witnesses
- All relationships generate relationship witnesses
- All protocols generate protocol witnesses

### Rule 5: Signature Support
**Statement:** All CRX entities support signing
**Implementation:**
- All artifacts can be signed
- All events can be signed
- All witnesses can be signed
- All lineage can be signed

---

## Object Model Best Practices

### 1. Constitutional Mapping
- Map all CRX entities to constitutional primitives
- No CRX entity becomes authoritative
- Constitutional primitives remain authoritative
- CRX entities are projections or adapters

### 2. Storage Strategy
- Store all CRX entities as constitutional objects
- Use constitutional object store
- Use constitutional event log
- Use constitutional canonical state

### 3. Lineage Tracking
- Track lineage for all CRX entities
- Track ancestry for all CRX entities
- Track provenance for all CRX entities
- Ensure replayability

### 4. Witness Generation
- Generate witnesses for all CRX entities
- Generate object witnesses
- Generate event witnesses
- Generate relationship witnesses

### 5. Signature Support
- Support signing for all CRX entities
- Support object signing
- Support event signing
- Support witness signing
