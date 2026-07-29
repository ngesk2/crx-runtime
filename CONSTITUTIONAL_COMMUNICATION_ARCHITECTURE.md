# Constitutional Communication Architecture (Final)

**Purpose:** Orchestration engine for external provider communication  
**Date:** 2026-07-14

---

## Executive Summary

The runtime becomes an orchestration engine that owns only **intent**. All infrastructure (delivery, analytics, state machines, retries) is delegated to external providers (Kit, Twilio, GitHub, Stripe).

**Final Architecture Components:**
- RuntimeInputBoundary - Single entry point for all ingress
- NotificationAuthority - Tiny routing layer for outbound communications
- ProviderRegistry - Data-driven provider routing
- KitProvider - Kit API adapter
- TwilioProvider - Twilio API adapter
- OutboxProcessor - Transactional outbox pattern
- WebhookAdapters - Provider webhook canonicalization

**Removed Concepts:**
- ❌ EmailAuthority
- ❌ SMSAuthority
- ❌ Email transport abstractions
- ❌ Delivery state machine
- ❌ SMTP anything
- ❌ Retry engine (provider SDK + outbox already solve it)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        KERNEL                                    │
│                    (Intent Emission)                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
                    Constitutional Event
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      EVENT STORE                                  │
│                  (Append-Only Log)                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                       OUTBOX                                     │
│              (Transactional Outbox Pattern)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                  OUTBOX PROCESSOR                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│              NOTIFICATION AUTHORITY                              │
│              (Tiny Routing Layer)                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                  PROVIDER REGISTRY                               │
│            (Data-Driven Capability Routing)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ↓              ↓              ↓
         KitProvider   TwilioProvider   GitHubProvider
              │              │              │
              ↓              ↓              ↓
           Kit API       Twilio API    GitHub API
              │              │              │
              └──────────────┼──────────────┘
                             ↓
                    Provider Webhooks
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│              RUNTIME INPUT BOUNDARY                              │
│          (IngressRegistry + IngressAdapters)                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
                    CanonicalCommand
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                        KERNEL                                    │
│                    (Intent Processing)                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Summary

### RuntimeInputBoundary
**Purpose:** Single entry point for all ingress  
**Pattern:** IngressRegistry with IngressAdapter  
**Extensibility:** Forever extensible via adapter registration

**Ingress Sources:**
- HTTP (REST API)
- Webhook (Kit, Twilio, GitHub, Stripe)
- Worker (background tasks)
- Scheduler (scheduled jobs)
- CLI (command-line)
- MCP (Model Context Protocol)

**Key Features:**
- Data-driven adapter registry
- Consistent validation
- Canonicalization
- Constitutional constraint checking

### NotificationAuthority
**Purpose:** Tiny routing layer for outbound communications  
**Responsibility:** NotificationRequested → ProviderRegistry → Provider  
**No Business Logic:** Pure routing only

**Key Features:**
- Data-driven capability routing
- Provider abstraction
- BuildWitness tracking
- Evidence collection

### ProviderRegistry
**Purpose:** Data-driven provider routing  
**Pattern:** Capability-based routing (no switch statements)

**Provider Capabilities:**
- **Kit:** subscriber, broadcast, tag, sequence, automation
- **Twilio:** sms, mms, voice
- **GitHub:** webhook, repository, issue
- **Stripe:** payment, customer, subscription

### KitProvider
**Purpose:** Kit API adapter  
**Owns:** SDK, retries, authentication, webhook verification, DTO conversion  
**Nothing Else:** No business logic, no replay logic, no storage

**Responsibilities:**
- Create/update subscribers
- Add/remove tags
- Enroll in sequences
- Trigger automations
- Trigger broadcasts
- Handle Kit webhooks

### TwilioProvider
**Purpose:** Twilio API adapter  
**Owns:** SDK, retries, authentication, webhook verification, DTO conversion  
**Nothing Else:** No business logic, no replay logic, no storage

**Responsibilities:**
- Send SMS/MMS
- Handle status callbacks
- Handle incoming SMS
- Verify webhook signatures

### OutboxProcessor
**Purpose:** Transactional outbox pattern  
**Pattern:** Industry-standard implementation

**Flow:**
```
EventStore (append event)
    ↓
OutboxMessage (transactional)
    ↓
OutboxProcessor (worker)
    ↓
Provider
    ↓
Webhook
    ↓
RuntimeInputBoundary
```

### WebhookAdapters
**Purpose:** Canonicalize provider webhooks into constitutional events  
**Pattern:** IngressAdapter for each provider

**Kit Webhook Events:**
- KitSubscriberActivated
- KitSubscriberUnsubscribed
- KitSubscriberTagged
- KitSubscriberUntagged
- KitSequenceEnrolled
- KitSequenceCompleted
- KitBroadcastTriggered
- KitPurchaseCreated

**Twilio Webhook Events:**
- TwilioMessageDelivered
- TwilioMessageFailed
- TwilioMessageReceived

**Mirroring Provider Vocabulary:**
- Instead of inventing events like EmailQueued, EmailSent, EmailOpened, EmailClicked
- Mirror Kit's vocabulary exactly
- Runtime merely constitutionalizes provider events

---

## BuildWitness Tracking

Every outbound communication captures:

```python
@dataclass(frozen=True)
class CommunicationWitness:
    """BuildWitness tracking for outbound communications"""
    
    provider: str  # "kit", "twilio", "github", "stripe"
    provider_api_version: str  # "v4", "2010-04-01", etc.
    provider_sdk_version: str  # SDK version used
    runtime_version: str  # Runtime version
    schema_version: str  # Schema version
    build_witness_root_hash: str  # BuildWitness root hash
    timestamp: datetime  # When communication was sent
```

**Replay can prove:** "This message was emitted under exactly this constitutional build."

---

## Constitutional Events

### Runtime Events (Emitted by Runtime)
- `NotificationRequested` - Send notification (delegated to provider based on capability)
- `SMSRequested` - Send SMS message (delegated to Twilio)

### Kit Events (From Kit Webhooks)
- `KitSubscriberActivated` - Subscriber activated in Kit
- `KitSubscriberUnsubscribed` - Subscriber unsubscribed from Kit
- `KitSubscriberTagged` - Tag added to subscriber in Kit
- `KitSubscriberUntagged` - Tag removed from subscriber in Kit
- `KitSequenceEnrolled` - Subscriber enrolled in sequence in Kit
- `KitSequenceCompleted` - Subscriber completed sequence in Kit
- `KitBroadcastTriggered` - Broadcast triggered in Kit
- `KitPurchaseCreated` - Purchase created in Kit

### Twilio Events (From Twilio Webhooks)
- `TwilioMessageDelivered` - SMS delivered via Twilio
- `TwilioMessageFailed` - SMS failed via Twilio
- `TwilioMessageReceived` - SMS received via Twilio

**Key Principle:** These events originate from providers. The runtime merely constitutionalizes them.

---

## Data Storage

### What Runtime Stores
- ✅ KitSubscriberID (reference only)
- ✅ Constitutional events
- ✅ BuildWitness hashes
- ✅ NotificationEvidence

### What Providers Store
- ✅ Subscriber data (Kit)
- ✅ Email delivery state (Kit)
- ✅ Campaign execution (Kit)
- ✅ SMS delivery state (Twilio)
- ✅ Bounce handling (Kit)
- ✅ Open/click tracking (Kit)

**Key Principle:** Runtime stores only references. Providers own the data.

---

## Security

### Webhook Signature Verification
- **Twilio:** X-Twilio-Signature (HMAC-SHA1)
- **Kit:** Implement if Kit provides signatures
- **GitHub:** X-Hub-Signature-256 (HMAC-SHA256)
- **Stripe:** Stripe-Signature (HMAC-SHA256)

### API Key Management
- Store in environment variables
- Rotate regularly
- Different keys for dev/prod

### Rate Limiting
- Respect provider rate limits
- Implement exponential backoff
- Per-source rate limiting

---

## Performance

### Async Processing
- All provider calls are async
- Non-blocking I/O
- Parallel requests where possible

### Caching
- Cache provider responses
- Cache subscriber lookups
- Cache webhook signatures

### Monitoring
- Track provider metrics
- Track ingress source metrics
- Track validation failure rates

---

## Testing Strategy

### Unit Tests
- Test each provider independently
- Test each ingress adapter independently
- Test provider registry routing
- Test error handling

### Integration Tests
- Test end-to-end with Kit API
- Test end-to-end with Twilio API
- Test webhook handling
- Test outbox pattern integration

### Constitutional Tests
- Test BuildWitness tracking
- Test version compatibility
- Test replay verification

---

## Migration Strategy

### Phase 1: Implement Core Components
- Implement RuntimeInputBoundary with IngressRegistry
- Implement NotificationAuthority with ProviderRegistry
- Implement KitProvider
- Implement TwilioProvider

### Phase 2: Integrate Outbox
- Connect OutboxProcessor to NotificationAuthority
- Test end-to-end flow
- Monitor for issues

### Phase 3: Add Webhook Support
- Implement Kit webhook adapter
- Implement Twilio webhook adapter
- Test webhook flow

### Phase 4: Full Rollout
- Enable for all ingress sources
- Monitor provider metrics
- Optimize based on usage

---

## Final Architecture Size

The communication stack becomes surprisingly small:

**Core Components:**
1. RuntimeInputBoundary
2. NotificationAuthority
3. ProviderRegistry
4. KitProvider
5. TwilioProvider
6. OutboxProcessor
7. WebhookAdapters
8. CommunicationEvidence

**Everything else** (subscriber state, email delivery, bounce handling, campaign execution, SMS delivery) is delegated to external providers.

---

## Key Principles

1. **Runtime owns only intent** - Emit constitutional events, delegate infrastructure
2. **Providers own infrastructure** - Kit and Twilio already solve delivery, analytics, state machines
3. **Mirror provider vocabulary** - Don't invent events, constitutionalize provider events
4. **Data-driven routing** - No switch statements, use capability-based routing
5. **Strong BuildWitness tracking** - Prove exact constitutional build for replay
6. **Extensible forever** - IngressRegistry and ProviderRegistry patterns allow infinite extensibility
7. **No duplication** - Don't rebuild what providers already provide

---

## Conclusion

The constitutional communication architecture is a minimal orchestration engine that delegates all infrastructure to external providers. The runtime owns only intent (constitutional events) and ensures constitutional tracking (BuildWitness). All delivery, analytics, state machines, and retries are handled by providers.

This design ensures:
- Minimal runtime code
- Perfect replay via BuildWitness tracking
- Extensible ingress and provider handling
- No duplication of provider infrastructure
- Strong constitutional guarantees
