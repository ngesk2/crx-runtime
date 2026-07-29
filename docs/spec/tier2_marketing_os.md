# Tier 2 — Marketing Operating System Specification

## Overview

Transform PING into a complete marketing operating system where campaigns are driven by constitutional events and executed as automated missions.

## Core Concept

Every marketing action is an event. Every campaign is a mission. Every piece of content is evidence-backed.

## Campaign Center

### Campaign Types

```
┌─────────────────────────────────────────────────────────────┐
│ Campaign Center                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Active Campaigns                                           │
│ ────────────────────────────────────────────────────────── │
│ • Summer Roofing Promo (Google Business)                   │
│   Status: Running | Reach: 12,400 | Conversions: 23       │
│                                                             │
│ • Review Request Campaign (Email)                          │
│   Status: Running | Sent: 847 | Responses: 156           │
│                                                             │
│ • Referral Program (SMS)                                   │
│   Status: Paused | Sent: 234 | Referrals: 12             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [+] Create New Campaign                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Campaign Templates

#### Google Business Campaign
- **Trigger**: New completed job
- **Actions**:
  1. Generate Google Business post
  2. Upload project photos
  3. Publish with customer testimonial
  4. Track engagement
- **Events**: `CAMPAIGN_STARTED`, `CONTENT_GENERATED`, `CONTENT_PUBLISHED`

#### Facebook/Instagram Campaign
- **Trigger**: New completed job
- **Actions**:
  1. Generate social media post
  2. Create Instagram story
  3. Schedule Facebook post
  4. Track engagement
- **Events**: `CAMPAIGN_STARTED`, `CONTENT_GENERATED`, `CONTENT_SCHEDULED`

#### Email Campaign
- **Trigger**: New review received
- **Actions**:
  1. Analyze review sentiment
  2. Generate response draft
  3. Send to customer for approval
  4. Publish response
  5. Ask for referral
- **Events**: `REVIEW_RECEIVED`, `RESPONSE_GENERATED`, `RESPONSE_SENT`, `REFerral_REQUESTED`

#### SMS Campaign
- **Trigger**: Invoice sent
- **Actions**:
  1. Send payment reminder
  2. Include payment link
  3. Track payment
- **Events**: `INVOICE_SENT`, `SMS_SENT`, `PAYMENT_RECEIVED`

#### Referral Campaign
- **Trigger**: Job completed successfully
- **Actions**:
  1. Send referral request
  2. Include referral incentive
  3. Track referrals
  4. Reward successful referrals
- **Events**: `JOB_COMPLETED`, `REFERRAL_REQUESTED`, `REFERRAL_RECEIVED`, `REFERRAL_REWARDED`

#### SEO Campaign
- **Trigger**: New blog content
- **Actions**:
  1. Generate SEO metadata
  2. Submit to search engines
  3. Track rankings
- **Events**: `CONTENT_CREATED`, `SEO_OPTIMIZED`, `RANKING_TRACKED`

#### Blog Campaign
- **Trigger**: New completed job (case study)
- **Actions**:
  1. Generate blog article
  2. Add to website
  3. Share on social media
  4. Track traffic
- **Events**: `JOB_COMPLETED`, `BLOG_GENERATED`, `BLOG_PUBLISHED`, `TRAFFIC_TRACKED`

#### YouTube Campaign
- **Trigger**: New completed job (video content)
- **Actions**:
  1. Generate video script
  2. Create video
  3. Upload to YouTube
  4. Optimize metadata
  5. Track views
- **Events**: `VIDEO_CREATED`, `VIDEO_UPLOADED`, `VIEWS_TRACKED`

## Content Engine

### One-Button Content Promotion

User action: "Promote this completed project"

System automatically produces:

```
┌─────────────────────────────────────────────────────────────┐
│ Content Generated for: Acme Roofing Project                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ✅ Blog Article                                            │
│    Title: "How We Fixed Acme's Roof in One Day"            │
│    Status: Ready to publish                                 │
│    [View] [Publish] [Edit]                                  │
│                                                             │
│ ✅ Facebook Post                                            │
│    Content: "Just completed another great project..."        │
│    Status: Ready to publish                                 │
│    [View] [Publish] [Edit]                                  │
│                                                             │
│ ✅ Instagram Caption                                         │
│    Content: "Another satisfied customer..."                 │
│    Status: Ready to publish                                 │
│    [View] [Publish] [Edit]                                  │
│                                                             │
│ ✅ Google Business Update                                   │
│    Content: "Recent project completion..."                  │
│    Status: Ready to publish                                 │
│    [View] [Publish] [Edit]                                  │
│                                                             │
│ ✅ LinkedIn Post                                            │
│    Content: "Case study: Acme Roofing..."                    │
│    Status: Ready to publish                                 │
│    [View] [Publish] [Edit]                                  │
│                                                             │
│ ✅ Email Newsletter                                         │
│    Subject: "Project Spotlight: Acme Roofing"               │
│    Status: Ready to send                                    │
│    [View] [Send] [Edit]                                     │
│                                                             │
│ ✅ SMS Campaign                                             │
│    Content: "Check out our latest work..."                  │
│    Status: Ready to send                                    │
│    [View] [Send] [Edit]                                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Publish All] [Schedule All] [Customize]                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Content Generation Pipeline

```
Job Completed Event
      ↓
Evidence Collection (photos, testimonials, metrics)
      ↓
Content Generation (Ollama with project context)
      ↓
Content Review (human approval)
      ↓
Content Publication (multi-platform)
      ↓
Engagement Tracking
      ↓
Performance Analysis
```

## Marketing Missions

### New Review Mission

```
REVIEW_RECEIVED Event
      ↓
Analyze Sentiment (Ollama)
      ↓
Generate Response (Ollama with review context)
      ↓
Human Approval
      ↓
Publish Response (Google Business, Facebook)
      ↓
Create Social Post (if positive)
      ↓
Email Customer (thank you)
      ↓
Ask for Referral
      ↓
Track Outcomes
```

**Constitutional Events:**
- `REVIEW_RECEIVED`
- `SENTIMENT_ANALYZED`
- `RESPONSE_GENERATED`
- `RESPONSE_APPROVED`
- `RESPONSE_PUBLISHED`
- `SOCIAL_POST_CREATED`
- `EMAIL_SENT`
- `REFERRAL_REQUESTED`
- `REFERRAL_RECEIVED`

**Mission Configuration:**
```yaml
mission_type: "review_response"
trigger_event: "REVIEW_RECEIVED"
steps:
  - worker: "sentiment_analyzer"
    capability: "ollama"
  - worker: "response_generator"
    capability: "ollama"
  - worker: "human_approval"
    capability: "ui"
  - worker: "response_publisher"
    capability: "google_business"
  - worker: "social_poster"
    capability: "facebook"
  - worker: "emailer"
    capability: "email"
  - worker: "referral_requester"
    capability: "sms"
```

### Lead Nurturing Mission

```
LEAD_CREATED Event
      ↓
Qualify Lead (AI analysis)
      ↓
Send Welcome Email
      ↓
Schedule Follow-up Call
      ↓
Send Educational Content
      ↓
Track Engagement
      ↓
Escalate if High Intent
```

**Constitutional Events:**
- `LEAD_CREATED`
- `LEAD_QUALIFIED`
- `EMAIL_SENT`
- `CALL_SCHEDULED`
- `CONTENT_DELIVERED`
- `ENGAGEMENT_TRACKED`
- `LEAD_ESCALATED`

## API Endpoints Required

### Campaign Management

```
GET /api/campaigns
Response: { campaigns: [{ id, name, type, status, metrics }] }

POST /api/campaigns
Request: { name, type, trigger, config }
Response: { campaign_id }

GET /api/campaigns/{id}
Response: { campaign, performance, content }

PUT /api/campaigns/{id}/pause
Response: { status: "paused" }

PUT /api/campaigns/{id}/resume
Response: { status: "running" }
```

### Content Generation

```
POST /api/content/generate
Request: { source_type, source_id, content_types }
Response: { content: [{ type, content, status }] }

POST /api/content/publish
Request: { content_id, platforms }
Response: { published: true, urls: [] }

GET /api/content/{id}
Response: { content, analytics }
```

### Marketing Analytics

```
GET /api/analytics/campaigns
Response: { campaigns: [{ id, name, reach, conversions, roi }] }

GET /api/analytics/content
Response: { content: [{ id, type, views, engagement, conversions }] }

GET /api/analytics/channels
Response: { channels: [{ name, spend, reach, conversions, roi }] }
```

## Constitutional Events

### Campaign Events

```
CAMPAIGN_CREATED
- payload: { name, type, trigger, config }
- projection: Campaign status projection

CAMPAIGN_STARTED
- payload: { campaign_id, started_at }
- projection: Campaign performance projection

CAMPAIGN_PAUSED
- payload: { campaign_id, paused_at, reason }
- projection: Campaign status projection

CAMPAIGN_RESUMED
- payload: { campaign_id, resumed_at }
- projection: Campaign status projection

CAMPAIGN_COMPLETED
- payload: { campaign_id, completed_at, results }
- projection: Campaign performance projection
```

### Content Events

```
CONTENT_GENERATED
- payload: { campaign_id, content_type, content, source_id }
- projection: Content inventory projection

CONTENT_APPROVED
- payload: { content_id, approved_by, approved_at }
- projection: Content status projection

CONTENT_PUBLISHED
- payload: { content_id, platform, url, published_at }
- projection: Content performance projection

CONTENT_ENGAGEMENT
- payload: { content_id, platform, engagement_type, value }
- projection: Content performance projection
```

### Marketing Events

```
REVIEW_RECEIVED
- payload: { review_id, platform, rating, text, customer_id }
- projection: Review projection

SENTIMENT_ANALYZED
- payload: { review_id, sentiment, confidence, analysis }
- projection: Sentiment projection

RESPONSE_GENERATED
- payload: { review_id, response_text, generated_at }
- projection: Response projection

REFERRAL_REQUESTED
- payload: { customer_id, channel, incentive, requested_at }
- projection: Referral projection

REFERRAL_RECEIVED
- payload: { referrer_id, referred_customer_id, received_at }
- projection: Referral projection
```

## Projections Required

### CampaignStatusProjection
- **Source**: Campaign events
- **Output**: Current campaign states
- **Storage**: PostgreSQL
- **Update**: Real-time

### CampaignPerformanceProjection
- **Source**: Campaign events + engagement events
- **Output**: Campaign metrics (reach, conversions, ROI)
- **Storage**: PostgreSQL
- **Update**: Hourly

### ContentInventoryProjection
- **Source**: Content events
- **Output**: Content library with status
- **Storage**: PostgreSQL
- **Update**: Real-time

### ContentPerformanceProjection
- **Source**: Content engagement events
- **Output**: Content analytics (views, engagement, conversions)
- **Storage**: PostgreSQL
- **Update**: Hourly

### ReviewProjection
- **Source**: Review events
- **Output**: Review status and sentiment
- **Storage**: PostgreSQL
- **Update**: Real-time

### ReferralProjection
- **Source**: Referral events
- **Output**: Referral pipeline and rewards
- **Storage**: PostgreSQL
- **Update**: Real-time

## Workers Required

### SentimentAnalyzer
- **Capability**: Ollama
- **Input**: Review text
- **Output**: Sentiment score, analysis
- **Events**: `SENTIMENT_ANALYZED`

### ResponseGenerator
- **Capability**: Ollama
- **Input**: Review + business context
- **Output**: Response draft
- **Events**: `RESPONSE_GENERATED`

### ContentGenerator
- **Capability**: Ollama
- **Input**: Project evidence
- **Output**: Multi-platform content
- **Events**: `CONTENT_GENERATED`

### ContentPublisher
- **Capability**: Multi-platform (Google, Facebook, Instagram, LinkedIn)
- **Input**: Content + platform
- **Output**: Published URL
- **Events**: `CONTENT_PUBLISHED`

### EmailWorker
- **Capability**: Email (SendGrid/SMTP)
- **Input**: Recipient + content
- **Output**: Sent status
- **Events**: `EMAIL_SENT`

### SMSWorker
- **Capability**: SMS (Twilio)
- **Input**: Phone number + message
- **Output**: Sent status
- **Events**: `SMS_SENT`

### ReferralTracker
- **Capability**: Database
- **Input**: Referral events
- **Output**: Referral status
- **Events**: `REFERRAL_TRACKED`

## Implementation Order

1. Create campaign management endpoints
2. Implement content generation pipeline with Ollama
3. Build content publisher workers (Google, Facebook)
4. Create review response mission
5. Implement referral tracking
6. Build campaign analytics
7. Create content approval UI
8. Add multi-platform publishing
9. Implement campaign templates
10. Build campaign performance dashboard

## Success Criteria

- One-button content promotion generates all required content
- Campaigns execute automatically based on triggers
- Review responses are generated and published within 2 hours
- Referral program tracks and rewards successful referrals
- Campaign ROI is accurately calculated
- Content performance is tracked across all platforms
- Marketing missions are configurable via templates

## Notes

- All marketing actions are constitutional events for full audit trail
- Content generation uses project evidence for accuracy
- Human approval required before publishing sensitive content
- Campaign performance drives future campaign optimization
- Referral program is fully automated with reward tracking
