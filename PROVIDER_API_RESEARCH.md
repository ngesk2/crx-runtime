# Provider API Research

**Date:** 2026-07-14  
**Purpose:** Research Kit and Twilio APIs for constitutional communication architecture

---

## Kit API Research

### Overview
Kit (formerly ConvertKit) is a creator CRM platform for email marketing, subscriber management, and campaign automation.

### API Versioning
- **Current Version:** V4
- **Previous Version:** V3 (still accessible but not in active development)
- **Base URL:** `https://api.kit.com/v4/`
- **V3 URL:** `https://api.convertkit.com/v3/`

### Authentication
Two authentication strategies:

1. **API Key Authentication**
   - Header: `X-Kit-Api-Key: <api-key>`
   - Rate Limit: 120 requests per 60-second rolling window
   - Use Case: Individual use, testing, personal automation

2. **OAuth 2.0**
   - Authorization Code Grant (with PKCE for SPAs/mobile)
   - Rate Limit: 600 requests per 60-second rolling window
   - Use Case: Apps, integrations, bulk endpoints, higher rate limits

**Important:** V4 API keys are only meant for individual use. For public apps, must use OAuth.

### Rate Limits
- **API Key:** 120 requests per 60-second rolling window
- **OAuth:** 600 requests per 60-second rolling window
- **Error Response:** HTTP 429 with error message
- **Recommendation:** Exponential backoff

### Webhook Events

#### Available Event Types (V4)
- `subscriber.subscriber_activate` - Subscriber activated
- `subscriber.subscriber_unsubscribe` - Subscriber unsubscribed
- `subscriber.subscriber_bounce` - Email bounced
- `subscriber.subscriber_complain` - Email marked as spam
- `subscriber.form_subscribe` - Form subscription (requires `form_id`)
- `subscriber.course_subscribe` - Sequence subscription (requires `sequence_id`)
- `subscriber.course_complete` - Sequence completion (requires `sequence_id`)
- `subscriber.link_click` - Link clicked (requires `initiator_value`)
- `subscriber.product_purchase` - Product purchased (requires `product_id`)
- `subscriber.tag_add` - Tag added (requires `tag_id`)
- `subscriber.tag_remove` - Tag removed (requires `tag_id`)
- `purchase.purchase_create` - Purchase created
- `custom_field.field_created` - Custom field created
- `custom_field.field_deleted` - Custom field deleted
- `custom_field.field_value_updated` - Custom field updated (requires `custom_field_id`)

#### Webhook Payload Structure
```json
{
  "subscriber": {
    "id": 1,
    "first_name": "John",
    "email_address": "John@example.com",
    "state": "active",
    "created_at": "2018-02-15T19:40:24.913Z",
    "fields": {
      "My Custom Field": "Value"
    }
  }
}
```

#### Purchase Event Payload
```json
{
  "id": 8,
  "transaction_id": "123-abcd-456-efgh",
  "status": "paid",
  "email_address": "crashoverride@hackers.com",
  "currency": "JPY",
  "transaction_time": "2018-03-17T11:28:04Z",
  "subtotal": 20.0,
  "shipping": 2.0,
  "discount": 3.0,
  "tax": 2.0,
  "total": 21.0,
  "products": [
    {
      "unit_price": 5.0,
      "quantity": 2,
      "sku": "7890-ijkl",
      "name": "Floppy Disk (512k)"
    }
  ]
}
```

### Subscriber API

#### Create Subscriber
- **Endpoint:** `POST /v4/subscribers`
- **Authentication:** API Key or OAuth
- **Payload:**
```json
{
  "first_name": "Test Subscriber",
  "email_address": "subscriber@example.com"
}
```

#### Bulk Create Subscribers
- **Endpoint:** `POST /v4/bulk/subscribers`
- **Authentication:** OAuth required
- **Payload:**
```json
{
  "subscribers": [
    {
      "first_name": "Test Subscriber 0",
      "email_address": "subscriber_0@example.com"
    }
  ],
  "callback_url": null
}
```

#### Update Subscriber
- **Endpoint:** `PUT /v4/subscribers/{id}`
- **Authentication:** API Key or OAuth

#### Tag Subscriber
- **Endpoint:** `POST /v4/tags/{tag_id}/subscribers/{id}`
- **Authentication:** API Key or OAuth

### Pagination
- **Mechanism:** Cursor-based pagination
- **Parameters:** `?after=<end_cursor>` or `?before=<start_cursor>`
- **Default:** 500 results per page
- **Maximum:** 1000 results per page
- **Total Count:** `?total_count=true` (can cause slow responses)

### Idempotency
- **Not explicitly documented** in V4 API
- **Recommendation:** Implement client-side idempotency keys

### Key Features Provided by Kit
- ✅ Subscriber database
- ✅ Email delivery
- ✅ Campaign engine
- ✅ Sequence engine
- ✅ Email analytics
- ✅ Open tracking
- ✅ Click tracking
- ✅ Bounce handling
- ✅ Marketing automations
- ✅ Unsubscribe management
- ✅ Tag management
- ✅ Form management
- ✅ Broadcast API with HTML support

**Conclusion:** Kit provides all email marketing infrastructure. Runtime should NOT duplicate these.

---

## Twilio API Research

### Overview
Twilio is a cloud communications platform for SMS, voice, and messaging.

### API Versioning
- **Current Version:** 2010-04-01
- **Base URL:** `https://api.twilio.com/2010-04-01`
- **Authentication:** Account SID and Auth Token (HTTP Basic Auth)

### Authentication
- **Method:** HTTP Basic Auth
- **Credentials:** Account SID (username) and Auth Token (password)
- **Security:** HTTPS required for production
- **SSL Validation:** Enforced via Console settings

### Rate Limits
- **Not explicitly documented** in basic API docs
- **Recommendation:** Implement rate limiting and exponential backoff

### Messaging API

#### Send SMS
- **Endpoint:** `POST /Accounts/{AccountSid}/Messages.json`
- **Required Parameters:**
  - `From` - Twilio phone number
  - `To` - Recipient phone number
  - `Body` - Message content

#### Incoming SMS Webhooks
- **Method:** HTTP POST or GET
- **Parameters:** Form-encoded or query parameters
- **Response:** TwiML (Twilio Markup Language)
- **Key Parameters:**
  - `MessageSid` - Message unique identifier
  - `AccountSid` - Account SID
  - `From` - Sender phone number
  - `To` - Recipient phone number
  - `Body` - Message content
  - `NumMedia` - Number of media attachments
  - `MediaUrl0` - Media attachment URL (if present)
  - `Latitude` - Location data (if shared)
  - `Longitude` - Location data (if shared)

#### Outbound Message Status Callbacks
- **Purpose:** Track message delivery status
- **Status Transitions:** queued → sent → delivered → undelivered → failed
- **Configuration:** Set via `StatusCallback` parameter or Messaging Service
- **Status Values:**
  - `queued` - Message queued for sending
  - `sent` - Message sent to carrier
  - `delivered` - Message delivered
  - `undelivered` - Message not delivered
  - `failed` - Message failed
  - `read` - Message read (for supported channels)

### Webhook Security

#### Signature Verification
- **Header:** `X-Twilio-Signature`
- **Algorithm:** HMAC-SHA1
- **Secret:** Twilio Auth Token
- **Input:** URL + parameters (GET or POST)
- **Validation:** Use Twilio SDK (recommended, not custom implementation)

#### Signature Validation Code Example
```javascript
const client = require('twilio');
const authToken = process.env.TWILIO_AUTH_TOKEN;
const url = 'https://mycompany.com/myapp';
const params = {
  CallSid: 'CA1234567890ABCDE',
  Caller: '+12349013030',
  // ... all parameters
};
const twilioSignature = 'Np1nax6uFoY6qpfT5l9jWwJeit0=';
console.log(client.validateRequest(authToken, twilioSignature, url, params));
```

#### Important Security Notes
- ⚠️ **Do not pin Twilio certificates** - they rotate without notice
- ⚠️ **Parameters vary by channel and event type** - implementation must handle evolving parameters
- ⚠️ **Use Twilio SDK for signature validation** - do not implement custom validation
- ⚠️ **WebSocket headers are lowercase:** `x-twilio-signature`

### Rich Messaging Features
- **ButtonPayload** - Button interaction data
- **ButtonText** - Button text
- **ButtonType** - Button type (REPLY, ACTION)
- **InteractiveData** - Interactive response data
- **FlowData** - Flow response data
- **ChannelMetadata** - Channel-specific metadata (RCS, WhatsApp)

### Key Features Provided by Twilio
- ✅ SMS delivery
- ✅ MMS delivery
- ✅ Voice calls
- ✅ Status callbacks
- ✅ Signature verification
- ✅ Rich messaging (RCS, WhatsApp)
- ✅ Location sharing
- ✅ Media handling

**Conclusion:** Twilio provides all SMS infrastructure. Runtime should NOT duplicate these.

---

## Transactional Email Providers

### Research Status: PENDING

**Question:** Are transactional email providers (Resend/Postmark/SES) needed outside Kit?

**Initial Assessment:**
- Kit provides email delivery infrastructure
- Kit has broadcast API with HTML support
- Kit handles delivery, bounces, analytics
- **Likely NOT needed** for most use cases

**Decision:** Defer research until Kit integration is complete. Kit may be sufficient for all email needs.

---

## Summary

### Kit API
- **Version:** V4 (REST)
- **Auth:** API Key (120 req/min) or OAuth (600 req/min)
- **Webhooks:** 15+ event types covering full subscriber lifecycle
- **Pagination:** Cursor-based
- **Idempotency:** Not documented (implement client-side)
- **Provides:** Complete email marketing infrastructure

### Twilio API
- **Version:** 2010-04-01 (REST)
- **Auth:** HTTP Basic Auth (Account SID + Auth Token)
- **Webhooks:** Incoming SMS, status callbacks
- **Security:** HMAC-SHA1 signature verification
- **Provides:** Complete SMS infrastructure

### Next Steps
1. Design RuntimeInputBoundary
2. Design NotificationAuthority with ProviderRegistry
3. Design KitProvider adapter
4. Design TwilioProvider adapter
5. Design constitutional events for communication
6. Design webhook canonicalization
