# RuntimeInputBoundary Design (Refined)

**Purpose:** Single entry point for all ingress into the constitutional runtime  
**Date:** 2026-07-14

---

## Overview

The RuntimeInputBoundary is the constitutional boundary layer that all external requests must pass through before entering the kernel. It validates, normalizes, and canonicalizes all ingress into constitutional commands.

**Pattern:** IngressRegistry with IngressAdapter pattern (extensible forever)

## Architecture

```
Ingress Sources
    ↓
RuntimeInputBoundary
    ↓
Validation & Normalization
    ↓
CanonicalCommand
    ↓
CommandBus
    ↓
Kernel
```

## Ingress Sources

All ingress must pass through RuntimeInputBoundary:

1. **HTTP** - REST API requests
2. **Webhook** - Provider webhooks (Kit, Twilio, GitHub)
3. **Worker** - Background worker tasks
4. **Scheduler** - Scheduled jobs
5. **CLI** - Command-line interface
6. **MCP** - Model Context Protocol requests

## CanonicalCommand Structure

All ingress is converted to a CanonicalCommand:

```python
@dataclass(frozen=True)
class CanonicalCommand:
    """Canonical command for all ingress"""
    
    command_id: str  # SHA256 hash of canonical data
    command_type: str  # e.g., "notification.requested", "sms.requested"
    ingress_source: str  # e.g., "http", "webhook.kit", "webhook.twilio"
    ingress_timestamp: datetime  # When the ingress was received
    payload: dict[str, Any]  # Canonical payload
    metadata: dict[str, Any]  # Ingress-specific metadata
    
    # Constitutional metadata
    correlation_id: str | None = None
    causality_id: str | None = None
    schema_version: str = "1.0.0"
```

## Ingress Canonicalization

### HTTP Ingress

```python
# HTTP request → CanonicalCommand
http_request = {
    "method": "POST",
    "path": "/notifications",
    "headers": {...},
    "body": {...}
}

canonical_command = RuntimeInputBoundary.canonicalize_http(http_request)
```

**Canonicalization Rules:**
- Extract command type from path/method
- Normalize headers (lowercase keys)
- Validate payload against schema
- Generate correlation_id if not present
- Store original HTTP metadata in metadata field

### Webhook Ingress

#### Kit Webhook

```python
# Kit webhook → CanonicalCommand
kit_webhook = {
    "event": {
        "name": "subscriber.subscriber_activate",
        "subscriber_id": 123
    },
    "subscriber": {...}
}

canonical_command = RuntimeInputBoundary.canonicalize_kit_webhook(kit_webhook)
```

**Canonicalization Mapping:**
- `subscriber.subscriber_activate` → `kit.subscriber.activated`
- `subscriber.subscriber_unsubscribe` → `kit.subscriber.unsubscribed`
- `subscriber.tag_add` → `kit.subscriber.tag_added`
- `subscriber.tag_remove` → `kit.subscriber.tag_removed`
- `subscriber.course_complete` → `kit.subscriber.sequence_completed`
- `purchase.purchase_create` → `kit.purchase.created`

**Payload Structure:**
```python
{
    "kit_subscriber_id": 123,
    "email_address": "user@example.com",
    "state": "active",
    "tags": [1, 2, 3],
    "fields": {...}
}
```

#### Twilio Webhook

```python
# Twilio webhook → CanonicalCommand
twilio_webhook = {
    "MessageSid": "SM123...",
    "From": "+1234567890",
    "To": "+0987654321",
    "Body": "Hello",
    "NumMedia": 0
}

canonical_command = RuntimeInputBoundary.canonicalize_twilio_webhook(twilio_webhook)
```

**Canonicalization Mapping:**
- Incoming SMS → `twilio.sms.received`
- Status callback → `twilio.sms.status_updated`

**Payload Structure:**
```python
{
    "message_sid": "SM123...",
    "from_number": "+1234567890",
    "to_number": "+0987654321",
    "body": "Hello",
    "status": "delivered",  # for status callbacks
    "media_urls": []  # if present
}
```

### Worker Ingress

```python
# Worker task → CanonicalCommand
worker_task = {
    "task_type": "send_notification",
    "task_id": "task_123",
    "parameters": {...}
}

canonical_command = RuntimeInputBoundary.canonicalize_worker(worker_task)
```

### Scheduler Ingress

```python
# Scheduled job → CanonicalCommand
scheduled_job = {
    "job_id": "job_456",
    "job_type": "daily_report",
    "scheduled_at": "2026-07-14T10:00:00Z"
}

canonical_command = RuntimeInputBoundary.canonicalize_scheduler(scheduled_job)
```

## Validation Rules

### Schema Validation
- All payloads must match registered schema
- Schema version must be compatible with current BuildWitness
- Invalid payloads are rejected with 400 error

### Constitutional Validation
- Verify BuildWitness compatibility
- Check replay mode constraints
- Validate authority version
- Reject if constitutional constraints violated

### Security Validation
- Verify webhook signatures (Twilio X-Twilio-Signature)
- Verify API keys (Kit X-Kit-Api-Key)
- Validate CORS headers
- Rate limiting per ingress source

## Error Handling

### Validation Errors
```python
{
    "error": "validation_failed",
    "error_code": "INVALID_PAYLOAD",
    "message": "Payload does not match schema",
    "details": {...}
}
```

### Constitutional Errors
```python
{
    "error": "constitutional_violation",
    "error_code": "BUILD_WITNESS_MISMATCH",
    "message": "BuildWitness version mismatch",
    "details": {
        "expected": "1.0.0",
        "actual": "0.9.0"
    }
}
```

### Security Errors
```python
{
    "error": "security_violation",
    "error_code": "INVALID_SIGNATURE",
    "message": "Webhook signature verification failed",
    "details": {...}
}
```

## Implementation

### IngressRegistry (Data-Driven)

```python
class IngressRegistry:
    """Registry for ingress adapters with source-based routing
    
    Each ingress source becomes an IngressAdapter.
    This keeps ingress extensible forever.
    """
    
    def __init__(self):
        self._adapters: dict[str, IngressAdapter] = {}
    
    def register_adapter(
        self,
        adapter: IngressAdapter,
    ) -> None:
        """Register an ingress adapter"""
        self._adapters[adapter.source] = adapter
    
    def get_adapter(self, source: str) -> IngressAdapter:
        """Get adapter for ingress source"""
        adapter = self._adapters.get(source)
        if not adapter:
            raise ValueError(f"No adapter registered for source: {source}")
        return adapter
```

### IngressAdapter Interface

```python
class IngressAdapter(ABC):
    """Abstract interface for ingress adapters
    
    Each adapter owns:
    - Source validation
    - Canonicalization logic
    - Schema validation
    - Provider DTO conversion
    
    Nothing else.
    """
    
    @property
    @abstractmethod
    def source(self) -> str:
        """Ingress source name (http, webhook.kit, webhook.twilio, etc.)"""
        pass
    
    @abstractmethod
    async def canonicalize(
        self,
        raw_data: dict[str, Any],
        metadata: dict[str, Any] | None = None,
    ) -> CanonicalCommand:
        """
        Canonicalize raw ingress data into CanonicalCommand.
        
        Args:
            raw_data: Raw ingress data
            metadata: Additional metadata
        
        Returns:
            CanonicalCommand ready for CommandBus
        """
        pass
```

### RuntimeInputBoundary

```python
class RuntimeInputBoundary:
    """Single entry point for all ingress into the constitutional runtime
    
    Uses IngressRegistry for extensible ingress handling.
    """
    
    def __init__(
        self,
        ingress_registry: IngressRegistry,
        constitutional_authority: CanonicalAuthority,
        build_witness: BuildWitness,
        schema_registry: SchemaRegistry,
    ):
        self.ingress_registry = ingress_registry
        self.authority = constitutional_authority
        self.build_witness = build_witness
        self.schema_registry = schema_registry
    
    async def process_ingress(
        self,
        source: str,
        raw_data: dict[str, Any],
        metadata: dict[str, Any] | None = None,
    ) -> CanonicalCommand:
        """
        Process any ingress through the boundary.
        
        Args:
            source: Source of ingress (http, webhook.kit, webhook.twilio, etc.)
            raw_data: Raw ingress data
            metadata: Additional metadata
        
        Returns:
            CanonicalCommand ready for CommandBus
        """
        # Step 1: Get adapter for source
        adapter = self.ingress_registry.get_adapter(source)
        
        # Step 2: Canonicalize via adapter
        command = await adapter.canonicalize(raw_data, metadata)
        
        # Step 3: Validate schema
        self._validate_schema(command)
        
        # Step 4: Validate constitutional constraints
        self._validate_constitutional(command)
        
        return command
    
    def _validate_schema(self, command: CanonicalCommand) -> None:
        """Validate command against schema"""
        schema = self.schema_registry.get_schema(command.command_type)
        
        if not schema:
            raise ValueError(f"No schema registered for command type: {command.command_type}")
        
        # Validate against schema
        schema.validate(command.payload)
    
    def _validate_constitutional(self, command: CanonicalCommand) -> None:
        """Validate constitutional constraints"""
        # Check BuildWitness compatibility
        if not self.build_witness.is_compatible(command.schema_version):
            raise ConstitutionalViolationError(
                "BuildWitness version mismatch",
                expected=self.build_witness.constitutional_version,
                actual=command.schema_version,
            )
```

## Integration Points

### Adapter Registration

```python
# Initialize ingress adapters
http_adapter = HTTPAdapter()
kit_webhook_adapter = KitWebhookAdapter()
twilio_webhook_adapter = TwilioWebhookAdapter()
worker_adapter = WorkerAdapter()
scheduler_adapter = SchedulerAdapter()

# Register adapters (data-driven - extensible forever)
ingress_registry = IngressRegistry()
ingress_registry.register_adapter(http_adapter)
ingress_registry.register_adapter(kit_webhook_adapter)
ingress_registry.register_adapter(twilio_webhook_adapter)
ingress_registry.register_adapter(worker_adapter)
ingress_registry.register_adapter(scheduler_adapter)

# Initialize RuntimeInputBoundary
boundary = RuntimeInputBoundary(
    ingress_registry=ingress_registry,
    constitutional_authority=get_canonical_authority(),
    build_witness=get_build_witness(),
    schema_registry=get_schema_registry(),
)
```

### API Integration

```python
# api/main.py
@app.post("/notifications")
async def create_notification(request: NotificationRequest):
    # Pass through RuntimeInputBoundary
    boundary = get_runtime_input_boundary()
    canonical_command = await boundary.process_ingress(
        source="http",
        raw_data=request.model_dump(),
        metadata={"path": "/notifications", "method": "POST"},
    )
    
    # Send to CommandBus
    command_bus = get_command_bus()
    result = await command_bus.send(canonical_command)
    
    return result
```

### Webhook Integration

```python
# api/webhooks.py
@app.post("/webhooks/kit")
async def kit_webhook(request: Request):
    # Verify Kit signature (if implemented) - handled by adapter
    # Pass through RuntimeInputBoundary
    boundary = get_runtime_input_boundary()
    canonical_command = await boundary.process_ingress(
        source="webhook.kit",
        raw_data=await request.json(),
        metadata={"webhook_type": "kit"},
    )
    
    # Send to CommandBus
    command_bus = get_command_bus()
    result = await command_bus.send(canonical_command)
    
    return {"status": "received"}
```

## Testing Strategy

### Unit Tests
- Test each canonicalizer independently
- Test validation rules
- Test error handling
- Test schema validation

### Integration Tests
- Test HTTP → CanonicalCommand flow
- Test webhook → CanonicalCommand flow
- Test worker → CanonicalCommand flow
- Test end-to-end with CommandBus

### Constitutional Tests
- Test BuildWitness validation
- Test replay mode constraints
- Test authority version checking

## Security Considerations

### Webhook Signature Verification
- Twilio: Verify X-Twilio-Signature using HMAC-SHA1
- Kit: Implement signature verification if available
- GitHub: Verify X-Hub-Signature-256

### Rate Limiting
- Per ingress source rate limits
- Per IP rate limits
- Exponential backoff on 429

### Input Sanitization
- Sanitize all user input
- Validate against schemas
- Reject malformed payloads

## Performance Considerations

### Async Processing
- All canonicalization is async
- Non-blocking I/O for external calls
- Parallel validation where possible

### Caching
- Cache schema definitions
- Cache BuildWitness version
- Cache canonicalization rules

### Monitoring
- Track ingress source metrics
- Track validation failure rates
- Track processing latency

## Migration Strategy

### Phase 1: Implement Boundary
- Create RuntimeInputBoundary class
- Implement HTTP canonicalizer
- Implement basic validation

### Phase 2: Migrate HTTP Ingress
- Update API endpoints to use boundary
- Test HTTP flow
- Monitor for issues

### Phase 3: Add Webhook Support
- Implement Kit webhook canonicalizer
- Implement Twilio webhook canonicalizer
- Add signature verification

### Phase 4: Add Other Ingress
- Implement worker canonicalizer
- Implement scheduler canonicalizer
- Implement CLI canonicalizer

### Phase 5: Full Rollout
- Enable for all ingress sources
- Remove old direct paths
- Monitor constitutional compliance

## Conclusion

The RuntimeInputBoundary ensures that all ingress passes through a single constitutional boundary layer before entering the kernel. This provides:

1. **Consistent Validation** - All ingress is validated against the same rules
2. **Canonicalization** - All ingress is converted to a uniform format
3. **Security** - Centralized signature verification and rate limiting
4. **Observability** - Single point for monitoring all ingress
5. **Constitutional Compliance** - Ensures all commands meet constitutional constraints

This is the highest priority implementation to achieve full constitutional compliance.
