# Connector Capabilities Integration

This document outlines how to wire connector capabilities into the Mission Runtime, making them first-class capabilities that are interchangeable through the Capability Registry.

## Architecture

**Current State:**
- Direct service instantiation (GoogleBusinessService, FacebookService, etc.)
- Tight coupling to specific implementations
- No capability abstraction

**Target State:**
```
CapabilityRegistry
    ↓
Connector (Capability Protocol)
    ↓
Mission Runtime
```

All connectors become interchangeable capabilities registered with the Capability Registry. The Mission Runtime never instantiates connectors directly - it always goes through the registry.

## Connector Protocol

All connectors must implement the Capability protocol:

```python
@runtime_checkable
class Capability(Protocol):
    @property
    def metadata(self) -> CapabilityMetadata:
        """Return capability metadata."""
        ...
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the capability with given context."""
        ...
    
    async def health_check(self) -> bool:
        """Check if the capability is healthy."""
        ...
    
    async def initialize(self) -> None:
        """Initialize the capability."""
        ...
    
    async def shutdown(self) -> None:
        """Shutdown the capability."""
        ...
```

## Connector Categories

### Communication Connectors
- **Google Business**: Google Business Profile API
- **Facebook**: Facebook Graph API
- **Instagram**: Instagram Graph API
- **Twilio**: SMS/Voice API
- **Mailgun**: Email API
- **SMTP**: Email protocol

### AI Connectors
- **OpenAI**: GPT-4, GPT-3.5, embeddings
- **Ollama**: Local LLM inference
- **Anthropic**: Claude API

### Storage Connectors
- **Qdrant**: Vector database
- **PostgreSQL**: Relational database
- **S3**: Object storage

### Analytics Connectors
- **Plausible**: Web analytics
- **PostHog**: Product analytics

## Connector Implementation Example

### Google Business Connector

```python
from typing import Dict, Any
from dataclasses import dataclass
from datetime import datetime
from constitution.registry.capability_registry import Capability, CapabilityMetadata, CapabilityCategory, CapabilityState

@dataclass
class GoogleBusinessConnector:
    """Google Business Profile connector."""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self._metadata = CapabilityMetadata(
            name="google_business",
            version="1.0.0",
            category=CapabilityCategory.ACQUIRE,
            description="Google Business Profile API connector",
            author="PING",
            dependencies=["http_client"],
            requires_secrets=["google_business_api_key"],
            state=CapabilityState.REGISTERED,
        )
    
    @property
    def metadata(self) -> CapabilityMetadata:
        return self._metadata
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute Google Business operation."""
        operation = context.get("operation")
        
        if operation == "get_reviews":
            return await self._get_reviews(context)
        elif operation == "post_update":
            return await self._post_update(context)
        else:
            raise ValueError(f"Unknown operation: {operation}")
    
    async def health_check(self) -> bool:
        """Check Google Business API health."""
        try:
            # Ping Google Business API
            return True
        except Exception:
            return False
    
    async def initialize(self) -> None:
        """Initialize connector."""
        # Validate API key
        self._metadata.state = CapabilityState.ACTIVE
    
    async def shutdown(self) -> None:
        """Shutdown connector."""
        self._metadata.state = CapabilityState.DISABLED
    
    async def _get_reviews(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Get Google Business reviews."""
        # Implementation
        pass
    
    async def _post_update(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Post update to Google Business."""
        # Implementation
        pass
```

## Mission Runtime Integration

### Mission Execution Flow

```
Mission Runtime
    ↓
CapabilityRegistry.execute("google_business", context)
    ↓
GoogleBusinessConnector.execute(context)
    ↓
Result
```

The Mission Runtime never knows which specific connector is being used - it only knows the capability name.

### Mission Definition

```python
@dataclass
class MissionStep:
    """A single step in a mission."""
    capability: str  # "google_business", "twilio", etc.
    operation: str  # "get_reviews", "send_sms", etc.
    context: Dict[str, Any]

@dataclass
class Mission:
    """A constitutional mission."""
    mission_id: str
    name: str
    steps: List[MissionStep]
    
    async def execute(self, registry: CapabilityRegistry) -> Dict[str, Any]:
        """Execute mission using capability registry."""
        results = []
        
        for step in self.steps:
            result = await registry.execute(step.capability, {
                "operation": step.operation,
                **step.context
            })
            results.append(result)
        
        return {"results": results}
```

## Connector Registration

### Bootstrap Registration

```python
async def register_connectors(registry: CapabilityRegistry):
    """Register all connector capabilities."""
    
    # Communication connectors
    google_business = GoogleBusinessConnector(api_key=os.getenv("GOOGLE_BUSINESS_API_KEY"))
    facebook = FacebookConnector(api_key=os.getenv("FACEBOOK_API_KEY"))
    twilio = TwilioConnector(account_sid=os.getenv("TWILIO_ACCOUNT_SID"))
    
    # AI connectors
    openai = OpenAIConnector(api_key=os.getenv("OPENAI_API_KEY"))
    ollama = OllamaConnector(base_url=os.getenv("OLLAMA_BASE_URL"))
    
    # Storage connectors
    qdrant = QdrantConnector(url=os.getenv("QDRANT_URL"))
    
    # Register all
    registry.register(google_business)
    registry.register(facebook)
    registry.register(twilio)
    registry.register(openai)
    registry.register(ollama)
    registry.register(qdrant)
    
    # Initialize all
    await registry.initialize_all()
```

## Capability Discovery

### By Category

```python
# Get all communication connectors
communication_connectors = registry.list(category=CapabilityCategory.ACQUIRE)
# ["google_business", "facebook", "twilio", "mailgun", "smtp"]
```

### By Tag

```python
# Get all AI connectors
ai_connectors = registry.discover_by_tag("ai")
# ["openai", "ollama", "anthropic"]
```

### By Dependency

```python
# Get all connectors requiring HTTP client
http_connectors = registry.discover_by_dependency("http_client")
# ["google_business", "facebook", "twilio", "openai"]
```

## Constitutional Benefits

### Interchangeability

Connectors can be swapped without changing mission definitions:

```python
# Mission uses "email" capability
# Can be satisfied by Mailgun, SMTP, or any other email connector
```

### Traceability

All connector executions are constitutional events:

```python
# Connector execution produces event
ConnectorExecuted(
    connector="google_business",
    operation="get_reviews",
    context={...},
    result={...},
)
```

### Replay

Connector executions can be replayed deterministically:

```python
# Replay connector execution
await registry.execute("google_business", replay_context)
```

### Health Monitoring

All connectors have consistent health checks:

```python
health_status = await registry.health_check_all()
# {"google_business": True, "facebook": False, "twilio": True}
```

## Implementation Steps

1. **Define Connector Protocol**
   - Ensure all connectors implement Capability protocol
   - Add metadata to each connector
   - Implement initialize/shutdown lifecycle

2. **Create Connector Implementations**
   - Implement Google Business connector
   - Implement Facebook connector
   - Implement Twilio connector
   - Implement OpenAI connector
   - Implement Ollama connector
   - Implement Qdrant connector

3. **Register Connectors**
   - Add connector registration to bootstrap
   - Load secrets from environment
   - Initialize all connectors

4. **Update Mission Runtime**
   - Remove direct connector instantiation
   - Use CapabilityRegistry for all connector access
   - Update mission definitions to use capability names

5. **Test Interchangeability**
   - Swap connectors without changing missions
   - Verify connector health checks
   - Test replay of connector executions
