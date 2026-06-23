# Adapter Layer

**Phase 10:** Build CRX Compatibility Layer with adapters only

---

## Overview

Adapter Layer builds CRX Compatibility Layer with adapters only. Never modify constitutional primitives. CRX consumes Objects, Events, Lineage, Witnesses, Identities, Trust Graph, Capabilities through adapters.

---

## Adapter Architecture

### Adapter Interface
```python
class ConstitutionalAdapter:
    """Constitutional adapter interface."""
    
    def __init__(self, constitutional_api_url: str):
        """
        Initialize adapter.
        
        Args:
            constitutional_api_url: Constitutional API URL
        """
        self.constitutional_api_url = constitutional_api_url
    
    @abstractmethod
    def get_objects(self, filters: Dict = None) -> List[Artifact]:
        """Get objects from constitutional API."""
        pass
    
    @abstractmethod
    def get_events(self, filters: Dict = None) -> List[Event]:
        """Get events from constitutional API."""
        pass
    
    @abstractmethod
    def get_lineage(self, lineage_id: UUID) -> Lineage:
        """Get lineage from constitutional API."""
        pass
    
    @abstractmethod
    def get_witnesses(self, execution_id: UUID = None) -> List[Witness]:
        """Get witnesses from constitutional API."""
        pass
    
    @abstractmethod
    def get_identities(self, filters: Dict = None) -> List[IdentityArtifact]:
        """Get identities from constitutional API."""
        pass
    
    @abstractmethod
    def get_trust_graph(self, identity_id: UUID) -> List[TrustEdge]:
        """Get trust graph from constitutional API."""
        pass
    
    @abstractmethod
    def get_capabilities(self, identity_id: UUID) -> List[str]:
        """Get capabilities from constitutional API."""
        pass
```

---

## CRX Adapters

### Object Adapter
```python
class CRXObjectAdapter(ConstitutionalAdapter):
    """CRX object adapter."""
    
    def get_objects(self, filters: Dict = None) -> List[Artifact]:
        """Get objects from constitutional API."""
        response = requests.get(
            f"{self.constitutional_api_url}/artifacts",
            params=filters
        )
        return [Artifact.from_dict(obj) for obj in response.json()['artifacts']]
    
    def create_post(self, content: str, author_identity_id: UUID) -> PostArtifact:
        """Create post through adapter."""
        post_data = {
            'artifact_type': 'post',
            'content': content,
            'author_identity_id': str(author_identity_id)
        }
        response = requests.post(
            f"{self.constitutional_api_url}/artifacts",
            json=post_data
        )
        return PostArtifact.from_dict(response.json())
```

### Event Adapter
```python
class CRXEventAdapter(ConstitutionalAdapter):
    """CRX event adapter."""
    
    def get_events(self, filters: Dict = None) -> List[Event]:
        """Get events from constitutional API."""
        response = requests.get(
            f"{self.constitutional_api_url}/events",
            params=filters
        )
        return [Event.from_dict(evt) for evt in response.json()['events']]
    
    def emit_post_created(self, post_id: UUID, content: str, author_identity_id: UUID) -> Event:
        """Emit post created event through adapter."""
        event_data = {
            'event_type': 'POST_CREATED',
            'event_data': {
                'post_id': str(post_id),
                'content': content,
                'author_identity_id': str(author_identity_id)
            }
        }
        response = requests.post(
            f"{self.constitutional_api_url}/events",
            json=event_data
        )
        return Event.from_dict(response.json())
```

### Identity Adapter
```python
class CRXIdentityAdapter(ConstitutionalAdapter):
    """CRX identity adapter."""
    
    def get_identities(self, filters: Dict = None) -> List[IdentityArtifact]:
        """Get identities from constitutional API."""
        response = requests.get(
            f"{self.constitutional_api_url}/identities",
            params=filters
        )
        return [IdentityArtifact.from_dict(idt) for idt in response.json()['identities']]
    
    def create_identity(self, public_key: str, metadata: Dict) -> IdentityArtifact:
        """Create identity through adapter."""
        identity_data = {
            'public_key': public_key,
            'metadata': metadata
        }
        response = requests.post(
            f"{self.constitutional_api_url}/identities",
            json=identity_data
        )
        return IdentityArtifact.from_dict(response.json())
```

### Trust Adapter
```python
class CRXTrustAdapter(ConstitutionalAdapter):
    """CRX trust adapter."""
    
    def get_trust_graph(self, identity_id: UUID) -> List[TrustEdge]:
        """Get trust graph from constitutional API."""
        response = requests.get(
            f"{self.constitutional_api_url}/trust/{identity_id}"
        )
        return [TrustEdge.from_dict(edge) for edge in response.json()['trust_edges']]
    
    def add_trust_edge(self, source_identity_id: UUID, target_identity_id: UUID, trust_level: float):
        """Add trust edge through adapter."""
        trust_data = {
            'source_identity_id': str(source_identity_id),
            'target_identity_id': str(target_identity_id),
            'trust_level': trust_level
        }
        response = requests.post(
            f"{self.constitutional_api_url}/trust",
            json=trust_data
        )
        return TrustEdge.from_dict(response.json())
```

---

## Adapter Rules

### Rule 1: No Modification
**Statement:** Never modify constitutional primitives
**Implementation:**
- Adapters are read-only for constitutional primitives
- Adapters never modify objects
- Adapters never modify events
- Adapters never modify state

### Rule 2: API-Only Access
**Statement:** CRX consumes through adapters only
**Implementation:**
- All access through constitutional APIs
- No direct database access
- No direct object store access
- No direct canonical state access

### Rule 3: Read-First
**Statement:** Adapters read from constitutional primitives
**Implementation:**
- Adapters read objects
- Adapters read events
- Adapters read lineage
- Adapters read witnesses

### Rule 4: Write-Through API
**Statement:** Adapters write through constitutional APIs
**Implementation:**
- Adapters create objects through API
- Adapters emit events through API
- Adapters create lineage through API
- Adapters generate witnesses through API

### Rule 5: Verification
**Statement:** Adapters verify constitutional compliance
**Implementation:**
- Adapters verify object integrity
- Adapters verify event integrity
- Adapters verify witness integrity
- Adapters verify lineage integrity

---

## Adapter Best Practices

### 1. No Modification
- Adapters never modify constitutional primitives
- Adapters are read-only for constitutional primitives
- Adapters never modify objects
- Adapters never modify events

### 2. API-Only Access
- All access through constitutional APIs
- No direct database access
- No direct object store access
- No direct canonical state access

### 3. Read-First
- Adapters read from constitutional primitives
- Adapters read objects
- Adapters read events
- Adapters read lineage

### 4. Write-Through API
- Adapters create objects through API
- Adapters emit events through API
- Adapters create lineage through API
- Adapters generate witnesses through API

### 5. Verification
- Verify object integrity
- Verify event integrity
- Verify witness integrity
- Verify lineage integrity
