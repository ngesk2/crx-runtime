# NotificationAuthority Design (Refined)

**Purpose:** Central authority for routing notifications to external providers  
**Date:** 2026-07-14

---

## Overview

The NotificationAuthority is a tiny routing layer that delegates communication operations to external providers (Kit, Twilio, GitHub, Stripe). It contains no business logic, no replay logic, and no storage. It is purely an API adapter layer.

**Removed Concepts:**
- ❌ EmailAuthority
- ❌ SMSAuthority
- ❌ Email transport abstractions
- ❌ Delivery state machine
- ❌ SMTP anything
- ❌ Retry engine (provider SDK + outbox already solve it)

**These duplicate infrastructure that Kit and Twilio already provide.**

## Architecture

```
Runtime emits constitutional events
    ↓
Outbox Pattern
    ↓
NotificationAuthority
    ↓
ProviderRegistry
    ↓
KitProvider / TwilioProvider / ResendProvider
    ↓
External APIs
    ↓
Webhooks return
    ↓
RuntimeInputBoundary
    ↓
Constitutional events
```

## Principle

**Runtime owns only Intent. Providers own Infrastructure.**

The runtime emits constitutional events like:
- `NotificationRequested`
- `CampaignRequested`
- `SequenceEnrollmentRequested`
- `TagSubscriberRequested`
- `BroadcastRequested`
- `SMSRequested`

The NotificationAuthority routes these to the appropriate provider.

## NotificationAuthority

```python
class NotificationAuthority:
    """Central authority for routing notifications to external providers
    
    Only job: NotificationRequested → ProviderRegistry → Provider
    No business logic. No replay logic. No storage. Just routing.
    """
    
    def __init__(self, provider_registry: ProviderRegistry):
        self.provider_registry = provider_registry
    
    async def route_notification(
        self,
        notification_type: str,
        payload: dict[str, Any],
        build_witness_hash: str,
    ) -> NotificationEvidence:
        """
        Route notification to appropriate provider.
        
        Args:
            notification_type: Type of notification (email, sms, etc.)
            payload: Notification payload
            build_witness_hash: BuildWitness hash for constitutional tracking
        
        Returns:
            NotificationEvidence with provider response
        """
        # Determine provider based on notification type (data-driven routing)
        provider = self.provider_registry.get_provider_for_capability(notification_type)
        
        # Route to provider
        evidence = await provider.send_notification(payload, build_witness_hash)
        
        return evidence
```

## ProviderRegistry (Data-Driven)

```python
class ProviderRegistry:
    """Registry for notification providers with capability-based routing
    
    Providers advertise capabilities. Routing becomes deterministic instead of switch statements.
    """
    
    def __init__(self):
        self._providers: dict[str, NotificationProvider] = {}
        self._capabilities: dict[str, str] = {}  # capability -> provider_name
    
    def register_provider(
        self,
        provider: NotificationProvider,
    ) -> None:
        """Register a provider with its capabilities"""
        self._providers[provider.name] = provider
        
        # Register provider's capabilities
        for capability in provider.capabilities:
            self._capabilities[capability] = provider.name
    
    def get_provider_for_capability(self, capability: str) -> NotificationProvider:
        """Get provider for a specific capability (data-driven routing)"""
        provider_name = self._capabilities.get(capability)
        if not provider_name:
            raise ValueError(f"No provider registered for capability: {capability}")
        
        provider = self._providers.get(provider_name)
        if not provider:
            raise ValueError(f"Provider not found: {provider_name}")
        
        return provider
```

### Provider Capabilities

**Kit Provider Capabilities:**
- `subscriber` - Create/update subscribers
- `broadcast` - Send broadcasts
- `tag` - Add/remove tags
- `sequence` - Enroll in sequences
- `automation` - Trigger automations

**Twilio Provider Capabilities:**
- `sms` - Send SMS messages
- `mms` - Send MMS messages
- `voice` - Make voice calls

## NotificationProvider Interface

```python
class NotificationProvider(ABC):
    """Abstract interface for notification providers
    
    Each adapter owns:
    - SDK
    - Retries
    - Authentication
    - Webhook verification
    - Provider DTO conversion
    
    Nothing else.
    """
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name"""
        pass
    
    @property
    @abstractmethod
    def capabilities(self) -> list[str]:
        """Provider capabilities (for data-driven routing)"""
        pass
    
    @abstractmethod
    async def send_notification(
        self,
        payload: dict[str, Any],
        build_witness_hash: str,
    ) -> NotificationEvidence:
        """
        Send notification via provider.
        
        Args:
            payload: Notification payload
            build_witness_hash: BuildWitness hash for constitutional tracking
        
        Returns:
            NotificationEvidence with provider response
        """
        pass
    
    @abstractmethod
    async def handle_webhook(
        self,
        webhook_data: dict[str, Any],
        build_witness_hash: str,
    ) -> NotificationEvidence:
        """
        Handle webhook from provider.
        
        Args:
            webhook_data: Webhook payload
            build_witness_hash: BuildWitness hash for constitutional tracking
        
        Returns:
            NotificationEvidence with webhook data
        """
        pass
```

## NotificationEvidence (Strengthened BuildWitness)

```python
@dataclass(frozen=True)
class NotificationEvidence(Evidence):
    """Evidence for notification operations with strong BuildWitness tracking
    
    Every outbound request captures:
    - Provider
    - Provider API version
    - SDK version
    - Runtime version
    - Schema version
    - BuildWitness.root_hash
    
    Replay can prove: "this message was emitted under exactly this constitutional build."
    """
    
    provider: str  # "kit", "twilio", "resend"
    provider_api_version: str  # "v4", "2010-04-01", etc.
    provider_sdk_version: str  # SDK version used
    runtime_version: str  # Runtime version
    provider_request_id: str | None = None  # Provider's request ID
    provider_response: dict[str, Any] | None = None  # Provider's response
    build_witness_root_hash: str = ""  # BuildWitness root hash
    authority_version: str = "1.0.0"
    schema_version: str = "1.0.0"
    replay_version: str = "1.0.0"
```

## KitProvider

### Responsibilities

1. **Create subscriber** - Add new subscriber to Kit
2. **Update subscriber** - Update existing subscriber
3. **Add tag** - Add tag to subscriber
4. **Remove tag** - Remove tag from subscriber
5. **Enroll sequence** - Enroll subscriber in sequence
6. **Trigger automation** - Trigger Kit automation
7. **Trigger broadcast** - Send broadcast
8. **Lookup subscriber** - Get subscriber by email or ID
9. **Receive webhooks** - Handle Kit webhooks

### Capabilities

```python
@property
def name(self) -> str:
    return "kit"

@property
def capabilities(self) -> list[str]:
    return ["subscriber", "broadcast", "tag", "sequence", "automation"]
```

### Implementation

```python
class KitProvider(NotificationProvider):
    """Kit provider for email marketing operations
    
    Owns:
    - Kit SDK (httpx client)
    - Retries (exponential backoff)
    - Authentication (X-Kit-Api-Key)
    - Webhook verification (if Kit implements signatures)
    - Provider DTO conversion (Kit JSON → NotificationEvidence)
    
    Nothing else.
    """
    
    def __init__(
        self,
        api_key: str,
        sdk_version: str = "1.0.0",
        base_url: str = "https://api.kit.com/v4",
    ):
        self.api_key = api_key
        self.sdk_version = sdk_version
        self.base_url = base_url
        self.client = httpx.AsyncClient()
    
    @property
    def name(self) -> str:
        return "kit"
    
    @property
    def capabilities(self) -> list[str]:
        return ["subscriber", "broadcast", "tag", "sequence", "automation"]
    
    async def send_notification(
        self,
        payload: dict[str, Any],
        build_witness_hash: str,
    ) -> NotificationEvidence:
        """Send notification via Kit"""
        capability = payload.get("capability")
        
        if capability == "subscriber":
            return await self._create_subscriber(payload, build_witness_hash)
        elif capability == "tag":
            return await self._add_tag(payload, build_witness_hash)
        elif capability == "sequence":
            return await self._enroll_sequence(payload, build_witness_hash)
        elif capability == "broadcast":
            return await self._trigger_broadcast(payload, build_witness_hash)
        else:
            raise ValueError(f"Unknown capability: {capability}")
    
    async def _create_subscriber(
        self,
        payload: dict[str, Any],
        build_witness_hash: str,
    ) -> NotificationEvidence:
        """Create subscriber in Kit"""
        url = f"{self.base_url}/subscribers"
        headers = {"X-Kit-Api-Key": self.api_key}
        
        response = await self.client.post(
            url,
            headers=headers,
            json={
                "first_name": payload.get("first_name"),
                "email_address": payload.get("email_address"),
                "fields": payload.get("fields", {}),
            },
        )
        
        return NotificationEvidence(
            provider="kit",
            provider_api_version="v4",
            provider_sdk_version=self.sdk_version,
            runtime_version="1.0.0",  # From runtime config
            provider_request_id=response.json().get("id"),
            provider_response=response.json(),
            build_witness_root_hash=build_witness_hash,
        )
    
    async def _add_tag(
        self,
        payload: dict[str, Any],
        build_witness_hash: str,
    ) -> NotificationEvidence:
        """Add tag to subscriber in Kit"""
        tag_id = payload["tag_id"]
        subscriber_id = payload["subscriber_id"]
        
        url = f"{self.base_url}/tags/{tag_id}/subscribers/{subscriber_id}"
        headers = {"X-Kit-Api-Key": self.api_key}
        
        response = await self.client.post(url, headers=headers, json={})
        
        return NotificationEvidence(
            provider="kit",
            provider_api_version="v4",
            provider_sdk_version=self.sdk_version,
            runtime_version="1.0.0",
            provider_request_id=str(response.json().get("id")),
            provider_response=response.json(),
            build_witness_root_hash=build_witness_hash,
        )
    
    async def _enroll_sequence(
        self,
        payload: dict[str, Any],
        build_witness_hash: str,
    ) -> NotificationEvidence:
        """Enroll subscriber in sequence"""
        sequence_id = payload["sequence_id"]
        subscriber_id = payload["subscriber_id"]
        
        url = f"{self.base_url}/sequences/{sequence_id}/subscribers/{subscriber_id}"
        headers = {"X-Kit-Api-Key": self.api_key}
        
        response = await self.client.post(url, headers=headers, json={})
        
        return NotificationEvidence(
            provider="kit",
            provider_api_version="v4",
            provider_sdk_version=self.sdk_version,
            runtime_version="1.0.0",
            provider_request_id=str(response.json().get("id")),
            provider_response=response.json(),
            build_witness_root_hash=build_witness_hash,
        )
    
    async def _trigger_broadcast(
        self,
        payload: dict[str, Any],
        build_witness_hash: str,
    ) -> NotificationEvidence:
        """Trigger broadcast"""
        url = f"{self.base_url}/broadcasts"
        headers = {"X-Kit-Api-Key": self.api_key}
        
        response = await self.client.post(
            url,
            headers=headers,
            json={
                "subject": payload.get("subject"),
                "content": payload.get("content"),
                "segment_id": payload.get("segment_id"),
            },
        )
        
        return NotificationEvidence(
            provider="kit",
            provider_api_version="v4",
            provider_sdk_version=self.sdk_version,
            runtime_version="1.0.0",
            provider_request_id=str(response.json().get("id")),
            provider_response=response.json(),
            build_witness_root_hash=build_witness_hash,
        )
    
    async def handle_webhook(
        self,
        webhook_data: dict[str, Any],
        build_witness_hash: str,
    ) -> NotificationEvidence:
        """Handle Kit webhook"""
        return NotificationEvidence(
            provider="kit",
            provider_api_version="v4",
            provider_sdk_version=self.sdk_version,
            runtime_version="1.0.0",
            provider_request_id=webhook_data.get("subscriber", {}).get("id"),
            provider_response=webhook_data,
            build_witness_root_hash=build_witness_hash,
        )
```

## TwilioProvider

### Responsibilities

1. **Send SMS** - Send SMS message
2. **Handle status callbacks** - Process delivery status
3. **Handle incoming SMS** - Process incoming messages
4. **Signature verification** - Verify webhook signatures

### Capabilities

```python
@property
def name(self) -> str:
    return "twilio"

@property
def capabilities(self) -> list[str]:
    return ["sms", "mms", "voice"]
```

### Implementation

```python
class TwilioProvider(NotificationProvider):
    """Twilio provider for SMS operations
    
    Owns:
    - Twilio SDK (httpx client)
    - Retries (exponential backoff)
    - Authentication (Account SID + Auth Token)
    - Webhook verification (X-Twilio-Signature)
    - Provider DTO conversion (Twilio JSON → NotificationEvidence)
    
    Nothing else.
    """
    
    def __init__(
        self,
        account_sid: str,
        auth_token: str,
        sdk_version: str = "1.0.0",
        base_url: str = "https://api.twilio.com/2010-04-01",
    ):
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.sdk_version = sdk_version
        self.base_url = base_url
        self.client = httpx.AsyncClient()
    
    @property
    def name(self) -> str:
        return "twilio"
    
    @property
    def capabilities(self) -> list[str]:
        return ["sms", "mms", "voice"]
    
    async def send_notification(
        self,
        payload: dict[str, Any],
        build_witness_hash: str,
    ) -> NotificationEvidence:
        """Send SMS via Twilio"""
        capability = payload.get("capability")
        
        if capability == "sms":
            return await self._send_sms(payload, build_witness_hash)
        else:
            raise ValueError(f"Unknown capability: {capability}")
    
    async def _send_sms(
        self,
        payload: dict[str, Any],
        build_witness_hash: str,
    ) -> NotificationEvidence:
        """Send SMS via Twilio"""
        url = f"{self.base_url}/Accounts/{self.account_sid}/Messages.json"
        
        response = await self.client.post(
            url,
            auth=(self.account_sid, self.auth_token),
            data={
                "From": payload["from_number"],
                "To": payload["to_number"],
                "Body": payload["body"],
            },
        )
        
        return NotificationEvidence(
            provider="twilio",
            provider_api_version="2010-04-01",
            provider_sdk_version=self.sdk_version,
            runtime_version="1.0.0",
            provider_request_id=response.json().get("sid"),
            provider_response=response.json(),
            build_witness_root_hash=build_witness_hash,
        )
    
    async def handle_webhook(
        self,
        webhook_data: dict[str, Any],
        build_witness_hash: str,
    ) -> NotificationEvidence:
        """Handle Twilio webhook"""
        # Verify signature
        if not self._verify_signature(webhook_data):
            raise SecurityError("Invalid Twilio signature")
        
        return NotificationEvidence(
            provider="twilio",
            provider_api_version="2010-04-01",
            provider_sdk_version=self.sdk_version,
            runtime_version="1.0.0",
            provider_request_id=webhook_data.get("MessageSid"),
            provider_response=webhook_data,
            build_witness_root_hash=build_witness_hash,
        )
    
    def _verify_signature(self, webhook_data: dict[str, Any]) -> bool:
        """Verify Twilio webhook signature using Twilio SDK"""
        # Use Twilio SDK for signature verification
        # Implementation details depend on Twilio Python SDK
        return True  # Placeholder
```

## ResendProvider

### Responsibilities

1. **Send transactional email** - Send one-off emails
2. **Handle webhooks** - Process delivery events

**Note:** This provider may not be needed if Kit provides all email functionality. Defer implementation until Kit integration is complete.

### Implementation

```python
class ResendProvider(NotificationProvider):
    """Resend provider for transactional email"""
    
    def __init__(self, api_key: str, base_url: str = "https://api.resend.com"):
        self.api_key = api_key
        self.base_url = base_url
        self.client = httpx.AsyncClient()
    
    async def send_notification(
        self,
        payload: dict[str, Any],
        build_witness_hash: str,
    ) -> NotificationEvidence:
        """Send email via Resend"""
        url = f"{self.base_url}/emails"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        
        response = await self.client.post(
            url,
            headers=headers,
            json={
                "from": payload["from"],
                "to": payload["to"],
                "subject": payload["subject"],
                "html": payload.get("html"),
                "text": payload.get("text"),
            },
        )
        
        return NotificationEvidence(
            provider="resend",
            provider_api_version="v1",
            provider_request_id=response.json().get("id"),
            provider_response=response.json(),
            build_witness_hash=build_witness_hash,
        )
    
    async def handle_webhook(
        self,
        webhook_data: dict[str, Any],
        build_witness_hash: str,
    ) -> NotificationEvidence:
        """Handle Resend webhook"""
        return NotificationEvidence(
            provider="resend",
            provider_api_version="v1",
            provider_request_id=webhook_data.get("id"),
            provider_response=webhook_data,
            build_witness_hash=build_witness_hash,
        )
```

## Provider Registration

```python
# Initialize providers
kit_provider = KitProvider(
    api_key=settings.kit_api_key,
    sdk_version="1.0.0",
)
twilio_provider = TwilioProvider(
    account_sid=settings.twilio_account_sid,
    auth_token=settings.twilio_auth_token,
    sdk_version="1.0.0",
)

# Register providers (data-driven - providers advertise capabilities)
provider_registry = ProviderRegistry()
provider_registry.register_provider(kit_provider)
provider_registry.register_provider(twilio_provider)

# Initialize NotificationAuthority
notification_authority = NotificationAuthority(provider_registry)
```

## Constitutional Events (Mirroring Provider Vocabulary)

**Instead of inventing events like EmailQueued, EmailSent, EmailOpened, EmailClicked, we mirror Kit's vocabulary.**

### Kit Events (from Kit webhooks)
- `KitSubscriberActivated` - Subscriber activated in Kit
- `KitSubscriberUnsubscribed` - Subscriber unsubscribed from Kit
- `KitSubscriberTagged` - Tag added to subscriber in Kit
- `KitSubscriberUntagged` - Tag removed from subscriber in Kit
- `KitSequenceEnrolled` - Subscriber enrolled in sequence in Kit
- `KitSequenceCompleted` - Subscriber completed sequence in Kit
- `KitBroadcastTriggered` - Broadcast triggered in Kit
- `KitPurchaseCreated` - Purchase created in Kit

**These events originate from Kit. The runtime merely constitutionalizes them.**

### Twilio Events (from Twilio webhooks)
- `TwilioMessageDelivered` - SMS delivered via Twilio
- `TwilioMessageFailed` - SMS failed via Twilio
- `TwilioMessageReceived` - SMS received via Twilio

**Twilio already owns delivery state. Replay just replays webhook events.**

### Runtime Events (emitted by runtime)
- `NotificationRequested` - Send notification (delegated to provider based on capability)
- `SMSRequested` - Send SMS message (delegated to Twilio)

## Outbox Pattern Integration

```
Kernel
    ↓
EventStore (append event)
    ↓
OutboxMessage (transactional)
    ↓
OutboxProcessor
    ↓
NotificationAuthority
    ↓
ProviderRegistry
    ↓
KitProvider / TwilioProvider
    ↓
External API
    ↓
Webhook
    ↓
RuntimeInputBoundary
    ↓
CanonicalCommand
    ↓
Kernel
```

## BuildWitness Tracking

Every outbound communication stores:

```python
@dataclass(frozen=True)
class CommunicationWitness:
    """BuildWitness tracking for outbound communications"""
    
    build_witness_hash: str  # BuildWitness hash
    authority_version: str  # Authority version
    provider: str  # "kit", "twilio", "resend"
    provider_api_version: str  # Provider API version
    schema_version: str  # Schema version
    replay_version: str  # Replay version
    timestamp: datetime  # When communication was sent
```

This ensures perfect replay by tracking all versions involved in the communication.

## Error Handling

### Provider Errors
- Rate limiting (429) - Exponential backoff
- Authentication errors (401) - Alert and retry
- Validation errors (400) - Log and fail
- Server errors (5xx) - Retry with backoff

### Constitutional Errors
- BuildWitness mismatch - Reject and alert
- Schema version mismatch - Reject and alert
- Authority version mismatch - Reject and alert

## Testing Strategy

### Unit Tests
- Test each provider independently
- Test provider registry routing
- Test error handling
- Test signature verification

### Integration Tests
- Test end-to-end with Kit API
- Test end-to-end with Twilio API
- Test webhook handling
- Test outbox pattern integration

### Constitutional Tests
- Test BuildWitness tracking
- Test version compatibility
- Test replay verification

## Security Considerations

### API Key Management
- Store API keys in environment variables
- Rotate keys regularly
- Use different keys for dev/prod

### Webhook Security
- Verify all webhook signatures
- Use HTTPS for all webhooks
- Implement rate limiting

### Data Privacy
- Never store subscriber data in runtime
- Store only KitSubscriberID
- Comply with GDPR/CCPA

## Performance Considerations

### Rate Limiting
- Respect provider rate limits
- Implement exponential backoff
- Queue requests when rate limited

### Async Processing
- All provider calls are async
- Non-blocking I/O
- Parallel requests where possible

### Caching
- Cache provider responses
- Cache subscriber lookups
- Cache webhook signatures

## Migration Strategy

### Phase 1: Implement Providers
- Implement KitProvider
- Implement TwilioProvider
- Implement ProviderRegistry
- Implement NotificationAuthority

### Phase 2: Integrate Outbox
- Connect OutboxProcessor to NotificationAuthority
- Test end-to-end flow
- Monitor for issues

### Phase 3: Add Webhook Support
- Implement webhook canonicalization
- Implement webhook handling
- Test webhook flow

### Phase 4: Full Rollout
- Enable for all notifications
- Monitor provider metrics
- Optimize based on usage

## Conclusion

The NotificationAuthority is a tiny routing layer that delegates communication operations to external providers. It contains no business logic, no replay logic, and no storage. It is purely an API adapter layer that ensures constitutional tracking of all outbound communications.

This design ensures that:
1. Runtime owns only intent (constitutional events)
2. Providers own infrastructure (delivery, analytics, etc.)
3. All communications are tracked via BuildWitness
4. Perfect replay is possible via outbox pattern
5. Webhooks are canonicalized back into constitutional events
