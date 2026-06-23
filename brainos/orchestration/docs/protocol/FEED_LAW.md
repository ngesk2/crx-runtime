# Feed Law

**Phase 32:** Future feeds must derive from constitutional objects

---

## Overview

Feed Law establishes that future feeds must derive from constitutional objects. Feed objects include Post, Reply, Thread, Comment, Signal, Subscription. Feeds are generated views. Feeds are not storage. Feeds are not truth.

---

## Feed Objects

### Post Object
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

### Reply Object
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

### Thread Object
```python
class ThreadArtifact(Artifact):
    """Thread artifact."""
    
    def __init__(
        self,
        thread_id: UUID,
        title: str,
        creator_identity_id: UUID
    ):
        super().__init__(
            artifact_id=thread_id,
            artifact_type='thread',
            content_hash=compute_content_hash(title),
            lineage_id=uuid4()
        )
        self.thread_id = thread_id
        self.title = title
        self.creator_identity_id = creator_identity_id
        self.created_at = datetime.utcnow()
```

### Comment Object
```python
class CommentArtifact(Artifact):
    """Comment artifact."""
    
    def __init__(
        self,
        comment_id: UUID,
        content: str,
        author_identity_id: UUID,
        target_artifact_id: UUID
    ):
        super().__init__(
            artifact_id=comment_id,
            artifact_type='comment',
            content_hash=compute_content_hash(content),
            lineage_id=uuid4()
        )
        self.comment_id = comment_id
        self.content = content
        self.author_identity_id = author_identity_id
        self.target_artifact_id = target_artifact_id
        self.created_at = datetime.utcnow()
```

### Signal Object
```python
class SignalArtifact(Artifact):
    """Signal artifact."""
    
    def __init__(
        self,
        signal_id: UUID,
        signal_type: str,
        signal_data: Dict,
        source_identity_id: UUID
    ):
        super().__init__(
            artifact_id=signal_id,
            artifact_type='signal',
            content_hash=compute_content_hash(signal_data),
            lineage_id=uuid4()
        )
        self.signal_id = signal_id
        self.signal_type = signal_type
        self.signal_data = signal_data
        self.source_identity_id = source_identity_id
        self.created_at = datetime.utcnow()
```

### Subscription Object
```python
class SubscriptionArtifact(Artifact):
    """Subscription artifact."""
    
    def __init__(
        self,
        subscription_id: UUID,
        subscriber_identity_id: UUID,
        target_feed_id: UUID
    ):
        super().__init__(
            artifact_id=subscription_id,
            artifact_type='subscription',
            content_hash=compute_content_hash({
                'subscriber_identity_id': str(subscriber_identity_id),
                'target_feed_id': str(target_feed_id)
            }),
            lineage_id=uuid4()
        )
        self.subscription_id = subscription_id
        self.subscriber_identity_id = subscriber_identity_id
        self.target_feed_id = target_feed_id
        self.created_at = datetime.utcnow()
```

---

## Feed Derivation

### Feed Generation
```python
def derive_feed(feed_id: UUID) -> Feed:
    """
    Derive feed from constitutional objects.
    
    Args:
        feed_id: Feed ID
    
    Returns:
        Derived feed
    
    Requirement:
        Feeds are generated views, not storage, not truth
    """
    # Get feed objects
    feed_objects = get_feed_objects(feed_id)
    
    # Categorize objects
    posts = [obj for obj in feed_objects if obj.artifact_type == 'post']
    replies = [obj for obj in feed_objects if obj.artifact_type == 'reply']
    comments = [obj for obj in feed_objects if obj.artifact_type == 'comment']
    signals = [obj for obj in feed_objects if obj.artifact_type == 'signal']
    
    # Generate feed
    feed = Feed(
        feed_id=feed_id,
        posts=posts,
        replies=replies,
        comments=comments,
        signals=signals,
        derived_at=datetime.utcnow()
    )
    
    return feed
```

---

## Feed Rebuildability

### Rebuild Procedure
```python
def rebuild_feed(feed_id: UUID) -> Feed:
    """
    Rebuild feed from constitutional objects.
    
    Args:
        feed_id: Feed ID
    
    Returns:
        Rebuilt feed
    
    Requirement:
        Feeds are rebuildable from constitutional objects
    """
    # Rebuild from constitutional truth
    feed = derive_feed(feed_id)
    
    # Verify rebuild correctness
    verify_feed_rebuild(feed_id, feed)
    
    return feed
```

---

## Feed Best Practices

### 1. Feed Objects
- Posts are constitutional objects
- Replies are constitutional objects
- Threads are constitutional objects
- Comments are constitutional objects
- Signals are constitutional objects
- Subscriptions are constitutional objects

### 2. Feed Derivation
- Feeds are generated views
- Feeds are derived from constitutional objects
- Feeds are not storage
- Feeds are not truth

### 3. Feed Rebuildability
- Feeds are rebuildable
- Feeds are deterministic
- Feeds are verifiable
- Feeds are auditable

### 4. Feed Consistency
- Feed consistency verified
- Feed completeness verified
- Feed ordering verified
- Feed integrity verified

### 5. Feed Performance
- Optimize feed generation
- Cache feed results
- Incremental feed updates
- Feed indexing
