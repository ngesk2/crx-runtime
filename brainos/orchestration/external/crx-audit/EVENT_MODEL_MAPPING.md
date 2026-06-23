# Event Model Mapping

**Phase 7:** Map all CRX actions to constitutional events

---

## Overview

Event Model Mapping converts all CRX actions to constitutional events. No hidden state allowed. All events must be replayable, deterministic, and verifiable.

---

## CRX Event Mappings

### 1. PostCreated
**CRX Action:** Create post
**Constitutional Event:** POST_CREATED
**Mapping:**
```python
class PostCreatedEvent(Event):
    """Post created event."""
    
    def __init__(
        self,
        event_id: UUID,
        post_id: UUID,
        content: str,
        author_identity_id: UUID,
        thread_id: UUID = None
    ):
        super().__init__(
            event_id=event_id,
            event_type='POST_CREATED',
            event_data={
                'post_id': str(post_id),
                'content': content,
                'author_identity_id': str(author_identity_id),
                'thread_id': str(thread_id) if thread_id else None
            },
            aggregate_id=post_id,
            causation_id=None,
            correlation_id=None,
            timestamp=datetime.utcnow()
        )
```

### 2. ReplyCreated
**CRX Action:** Create reply
**Constitutional Event:** REPLY_CREATED
**Mapping:**
```python
class ReplyCreatedEvent(Event):
    """Reply created event."""
    
    def __init__(
        self,
        event_id: UUID,
        reply_id: UUID,
        content: str,
        author_identity_id: UUID,
        parent_post_id: UUID,
        thread_id: UUID = None
    ):
        super().__init__(
            event_id=event_id,
            event_type='REPLY_CREATED',
            event_data={
                'reply_id': str(reply_id),
                'content': content,
                'author_identity_id': str(author_identity_id),
                'parent_post_id': str(parent_post_id),
                'thread_id': str(thread_id) if thread_id else None
            },
            aggregate_id=reply_id,
            causation_id=parent_post_id,
            correlation_id=thread_id,
            timestamp=datetime.utcnow()
        )
```

### 3. IdentityCreated
**CRX Action:** Create identity
**Constitutional Event:** IDENTITY_CREATED
**Mapping:**
```python
class IdentityCreatedEvent(Event):
    """Identity created event."""
    
    def __init__(
        self,
        event_id: UUID,
        identity_id: UUID,
        public_key: str,
        metadata: Dict
    ):
        super().__init__(
            event_id=event_id,
            event_type='IDENTITY_CREATED',
            event_data={
                'identity_id': str(identity_id),
                'public_key': public_key,
                'metadata': metadata
            },
            aggregate_id=identity_id,
            causation_id=None,
            correlation_id=None,
            timestamp=datetime.utcnow()
        )
```

### 4. TrustGranted
**CRX Action:** Grant trust
**Constitutional Event:** TRUST_GRANTED
**Mapping:**
```python
class TrustGrantedEvent(Event):
    """Trust granted event."""
    
    def __init__(
        self,
        event_id: UUID,
        source_identity_id: UUID,
        target_identity_id: UUID,
        trust_level: float,
        trust_type: str
    ):
        super().__init__(
            event_id=event_id,
            event_type='TRUST_GRANTED',
            event_data={
                'source_identity_id': str(source_identity_id),
                'target_identity_id': str(target_identity_id),
                'trust_level': trust_level,
                'trust_type': trust_type
            },
            aggregate_id=source_identity_id,
            causation_id=None,
            correlation_id=None,
            timestamp=datetime.utcnow()
        )
```

### 5. CommunityJoined
**CRX Action:** Join community
**Constitutional Event:** COMMUNITY_JOINED
**Mapping:**
```python
class CommunityJoinedEvent(Event):
    """Community joined event."""
    
    def __init__(
        self,
        event_id: UUID,
        community_id: UUID,
        member_identity_id: UUID,
        role: str
    ):
        super().__init__(
            event_id=event_id,
            event_type='COMMUNITY_JOINED',
            event_data={
                'community_id': str(community_id),
                'member_identity_id': str(member_identity_id),
                'role': role
            },
            aggregate_id=community_id,
            causation_id=None,
            correlation_id=None,
            timestamp=datetime.utcnow()
        )
```

### 6. LikeCreated
**CRX Action:** Create like
**Constitutional Event:** ATTESTATION_CREATED
**Mapping:**
```python
class AttestationCreatedEvent(Event):
    """Attestation created event."""
    
    def __init__(
        self,
        event_id: UUID,
        attestation_id: UUID,
        attestation_type: str,
        target_artifact_id: UUID,
        attester_identity_id: UUID
    ):
        super().__init__(
            event_id=event_id,
            event_type='ATTESTATION_CREATED',
            event_data={
                'attestation_id': str(attestation_id),
                'attestation_type': attestation_type,
                'target_artifact_id': str(target_artifact_id),
                'attester_identity_id': str(attester_identity_id)
            },
            aggregate_id=attestation_id,
            causation_id=target_artifact_id,
            correlation_id=None,
            timestamp=datetime.utcnow()
        )
```

### 7. FollowCreated
**CRX Action:** Create follow
**Constitutional Event:** TRUST_GRANTED (follow type)
**Mapping:**
```python
# Follow is a type of TrustGrantedEvent
trust_event = TrustGrantedEvent(
    event_id=uuid4(),
    source_identity_id=follower_id,
    target_identity_id=following_id,
    trust_level=1.0,
    trust_type='follow'
)
```

---

## Event Rules

### Rule 1: No Hidden State
**Statement:** No hidden state allowed in events
**Implementation:**
- All state in event_data
- No external state references
- No hidden side effects
- All state explicit

### Rule 2: Deterministic Events
**Statement:** All events must be deterministic
**Implementation:**
- Same event → same state
- No randomness in events
- No time-based operations in events
- No external dependencies in events

### Rule 3: Replayable Events
**Statement:** All events must be replayable
**Implementation:**
- Events are immutable
- Events are append-only
- Events are causally ordered
- Events are verifiable

### Rule 4: Verifiable Events
**Statement:** All events must be verifiable
**Implementation:**
- Events have event_id
- Events have timestamp
- Events have causation_id
- Events have correlation_id

### Rule 5: Signed Events
**Statement:** All events must support signing
**Implementation:**
- Events can be signed
- Events can be verified
- Events have signature field
- Events use constitutional identity

---

## Event Best Practices

### 1. No Hidden State
- All state in event_data
- No external state references
- No hidden side effects
- All state explicit

### 2. Deterministic Events
- Same event → same state
- No randomness in events
- No time-based operations
- No external dependencies

### 3. Replayable Events
- Events are immutable
- Events are append-only
- Events are causally ordered
- Events are verifiable

### 4. Verifiable Events
- Events have event_id
- Events have timestamp
- Events have causation_id
- Events have correlation_id

### 5. Signed Events
- Events can be signed
- Events can be verified
- Events have signature field
- Events use constitutional identity
