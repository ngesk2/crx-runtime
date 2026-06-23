# Protocol Projection Law

**Phase 12:** CRX becomes projection layer, not storage/truth/identity/lineage/witness layer

---

## Overview

Protocol Projection Law establishes that CRX becomes a projection layer, not storage layer, not truth layer, not identity layer, not lineage layer, not witness layer. Truth remains constitutional substrate.

---

## Projection Layers

### What CRX Is
- **Projection Layer:** CRX generates views of constitutional truth
- **Protocol Layer:** CRX implements protocol logic
- **Adapter Layer:** CRX adapts to constitutional primitives
- **Interface Layer:** CRX provides user interface

### What CRX Is Not
- **NOT Storage Layer:** CRX does not store constitutional truth
- **NOT Truth Layer:** CRX does not become source of truth
- **NOT Identity Layer:** CRX does not manage identity
- **NOT Lineage Layer:** CRX does not manage lineage
- **NOT Witness Layer:** CRX does not manage witnesses

---

## Constitutional Truth Layers

### Layer 0: Immutable Object Store
**Authority:** Constitutional
**CRX Role:** Consumer only
**Access:** Through constitutional APIs

### Layer 1: Event Log
**Authority:** Constitutional
**CRX Role:** Consumer only
**Access:** Through constitutional APIs

### Layer 2: Canonical State
**Authority:** Constitutional
**CRX Role:** Consumer only
**Access:** Through constitutional APIs

### Layer 3: Constitutional Runtime Kernel
**Authority:** Constitutional
**CRX Role:** Consumer only
**Access:** Through constitutional APIs

### Layer 4: Constitutional Object Substrate
**Authority:** Constitutional
**CRX Role:** Consumer only
**Access:** Through constitutional APIs

---

## CRX Projection Architecture

### Projection Generation
```python
class CRXProjectionGenerator:
    """CRX projection generator."""
    
    def __init__(self, constitutional_adapter: ConstitutionalAdapter):
        """
        Initialize projection generator.
        
        Args:
            constitutional_adapter: Constitutional adapter
        """
        self.constitutional_adapter = constitutional_adapter
    
    def generate_feed_projection(self, feed_id: UUID) -> Feed:
        """
        Generate feed projection from constitutional truth.
        
        Args:
            feed_id: Feed ID
        
        Returns:
            Feed projection
        
        Requirement:
            CRX is projection layer, not storage layer
        """
        # Get objects from constitutional truth
        objects = self.constitutional_adapter.get_objects({'feed_id': str(feed_id)})
        
        # Generate feed projection
        feed = Feed(
            feed_id=feed_id,
            posts=[obj for obj in objects if obj.artifact_type == 'post'],
            replies=[obj for obj in objects if obj.artifact_type == 'reply']
        )
        
        return feed
    
    def generate_thread_projection(self, thread_id: UUID) -> Thread:
        """
        Generate thread projection from constitutional truth.
        
        Args:
            thread_id: Thread ID
        
        Returns:
            Thread projection
        
        Requirement:
            CRX is projection layer, not storage layer
        """
        # Get objects from constitutional truth
        objects = self.constitutional_adapter.get_objects({'thread_id': str(thread_id)})
        
        # Generate thread projection
        thread = Thread(
            thread_id=thread_id,
            posts=[obj for obj in objects if obj.artifact_type == 'post'],
            replies=[obj for obj in objects if obj.artifact_type == 'reply']
        )
        
        return thread
```

---

## Projection Rules

### Rule 1: No Storage
**Statement:** CRX does not store constitutional truth
**Implementation:**
- CRX never stores objects directly
- CRX never stores events directly
- CRX never stores state directly
- All storage through constitutional APIs

### Rule 2: No Truth
**Statement:** CRX does not become source of truth
**Implementation:**
- CRX never becomes authoritative
- CRX never modifies constitutional truth
- CRX never bypasses event sourcing
- All truth remains constitutional

### Rule 3: No Identity Management
**Statement:** CRX does not manage identity
**Implementation:**
- CRX never manages identity directly
- CRX uses constitutional identity system
- CRX uses constitutional identity APIs
- All identity remains constitutional

### Rule 4: No Lineage Management
**Statement:** CRX does not manage lineage
**Implementation:**
- CRX never manages lineage directly
- CRX uses constitutional lineage system
- CRX uses constitutional lineage APIs
- All lineage remains constitutional

### Rule 5: No Witness Management
**Statement:** CRX does not manage witnesses
**Implementation:**
- CRX never manages witnesses directly
- CRX uses constitutional witness system
- CRX uses constitutional witness APIs
- All witnesses remain constitutional

---

## Projection Best Practices

### 1. Projection Generation
- CRX generates projections from constitutional truth
- CRX never stores constitutional truth
- CRX never becomes source of truth
- All projections are disposable

### 2. API-Only Access
- CRX accesses constitutional truth through APIs only
- CRX never accesses database directly
- CRX never accesses object store directly
- All access through constitutional APIs

### 3. Read-Only Access
- CRX has read-only access to constitutional truth
- CRX never modifies constitutional truth
- CRX never bypasses event sourcing
- All modifications through constitutional APIs

### 4. Disposable Projections
- CRX projections are disposable
- CRX projections are rebuildable
- CRX projections are replaceable
- All projections are verifiable

### 5. Constitutional Authority
- Constitutional truth remains authoritative
- CRX never becomes authoritative
- CRX never becomes source of truth
- All truth remains constitutional
