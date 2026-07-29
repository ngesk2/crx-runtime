# Tier 5 — Automation Marketplace Specification

## Overview

Create a marketplace where users can enable pre-built automations with one click. Internally, these are mission templates that execute via the constitutional runtime.

## Marketplace Interface

```
┌─────────────────────────────────────────────────────────────┐
│ Automation Marketplace                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Search Automations...                                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Featured Automations                                        │
│ ────────────────────────────────────────────────────────── │
│                                                             │
│ ★★★★★ Google Reviews                                        │
│ Automatically respond to Google reviews with AI.             │
│ Trigger: New review received                                │
│ [Enable] [Learn More]                                       │
│                                                             │
│ ★★★★★ Invoice Follow-up                                     │
│ Send payment reminders for overdue invoices.                │
│ Trigger: Invoice due date approaching                       │
│ [Enable] [Learn More]                                       │
│                                                             │
│ ★★★★★ Referral Engine                                       │
│ Request referrals from satisfied customers.                │
│ Trigger: Job completed successfully                          │
│ [Enable] [Learn More]                                       │
│                                                             │
│ ★★★★☆ Estimate Reminder                                     │
│ Follow up on estimates awaiting response.                   │
│ Trigger: Estimate sent > 3 days ago                         │
│ [Enable] [Learn More]                                       │
│                                                             │
│ ★★★★☆ Win-back Campaign                                    │
│ Re-engage customers who haven't purchased in 6 months.       │
│ Trigger: Customer inactive for 6 months                     │
│ [Enable] [Learn More]                                       │
│                                                             │
│ ★★★★☆ Seasonal Promotions                                  │
│ Send seasonal promotions to past customers.                  │
│ Trigger: Season start (spring, summer, fall, winter)        │
│ [Enable] [Learn More]                                       │
│                                                             │
│ ★★★☆☆ Crew Notifications                                    │
│ Notify crews of schedule changes and job updates.            │
│ Trigger: Schedule updated                                   │
│ [Enable] [Learn More]                                       │
│                                                             │
│ ★★★☆☆ Lead Qualification                                   │
| Qualify incoming leads with AI analysis.                    │
│ Trigger: New lead received                                  │
│ [Enable] [Learn More]                                       │
│                                                             │
│ ★★★☆☆ Marketing Funnel                                     │
│ Nurture leads through automated marketing sequence.         │
│ Trigger: Lead created                                       │
│ [Enable] [Learn More]                                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Categories: [All] [Reviews] [Invoicing] [Marketing] [Crew]  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Automation Templates

### 1. Google Reviews Automation

**Rating**: ★★★★★
**Category**: Reviews
**Trigger**: `REVIEW_RECEIVED` event where platform = 'google_business'

**Mission Steps**:
```yaml
steps:
  - worker: sentiment_analyzer
    capability: ollama
    config:
      analyze_sentiment: true
  
  - worker: response_generator
    capability: ollama
    config:
      tone: professional
      include_thank_you: true
  
  - worker: human_approval
    capability: ui
    config:
      auto_approve_positive: true
      require_approval_negative: true
  
  - worker: response_publisher
    capability: google_business
    config:
      platform: google_business
  
  - worker: social_poster
    capability: facebook
    config:
      auto_post_positive: true
      skip_negative: true
  
  - worker: referral_requester
    capability: email
    config:
      request_referral_positive: true
      skip_negative: true
```

**Events Created**:
- `SENTIMENT_ANALYZED`
- `RESPONSE_GENERATED`
- `RESPONSE_APPROVED`
- `RESPONSE_PUBLISHED`
- `SOCIAL_POST_CREATED`
- `REFERRAL_REQUESTED`

**Configuration Options**:
- Auto-approve positive reviews (default: true)
- Auto-post to social media (default: true)
- Request referrals (default: true)
- Response tone (default: professional)

### 2. Invoice Follow-up Automation

**Rating**: ★★★★★
**Category**: Invoicing
**Trigger**: `INVOICE_DUE` event where due_date <= today + 3 days

**Mission Steps**:
```yaml
steps:
  - worker: invoice_checker
    capability: postgres
    config:
      check_payment_status: true
  
  - worker: reminder_generator
    capability: ollama
    config:
      include_payment_link: true
      polite_reminder: true
  
  - worker: email_sender
    capability: email
    config:
      send_to_customer: true
      send_to_billing_contact: true
  
  - worker: sms_sender
    capability: sms
    config:
      send_sms: true
      include_payment_link: true
  
  - worker: payment_tracker
    capability: postgres
    config:
      track_reminder_sent: true
      track_payment_received: true
```

**Events Created**:
- `INVOICE_REMINDER_SENT`
- `EMAIL_SENT`
- `SMS_SENT`
- `PAYMENT_RECEIVED`

**Configuration Options**:
- Reminder timing (default: 3 days before due)
- Send email (default: true)
- Send SMS (default: true)
- Include payment link (default: true)

### 3. Referral Engine Automation

**Rating**: ★★★★★
**Category**: Marketing
**Trigger**: `JOB_COMPLETED` event where customer_satisfaction >= 4

**Mission Steps**:
```yaml
steps:
  - worker: satisfaction_checker
    capability: postgres
    config:
      minimum_rating: 4
  
  - worker: referral_request_generator
    capability: ollama
    config:
      personalized_message: true
      include_incentive: true
  
  - worker: email_sender
    capability: email
    config:
      send_referral_request: true
      include_referral_link: true
  
  - worker: referral_tracker
    capability: postgres
    config:
      track_referral_sent: true
      track_referral_received: true
      track_referral_converted: true
  
  - worker: reward_processor
    capability: postgres
    config:
      reward_successful_referrals: true
      reward_amount: 100
```

**Events Created**:
- `REFERRAL_REQUEST_SENT`
- `EMAIL_SENT`
- `REFERRAL_RECEIVED`
- `REFERRAL_CONVERTED`
- `REFERRAL_REWARDED`

**Configuration Options**:
- Minimum satisfaction rating (default: 4)
- Incentive amount (default: $100)
- Send via email (default: true)
- Send via SMS (default: false)

### 4. Estimate Reminder Automation

**Rating**: ★★★★☆
**Category**: Sales
**Trigger**: `ESTIMATE_SENT` event where sent_at > 3 days ago and status = 'pending'

**Mission Steps**:
```yaml
steps:
  - worker: estimate_checker
    capability: postgres
    config:
      check_response_status: true
      days_since_sent: 3
  
  - worker: reminder_generator
    capability: ollama
    config:
      polite_follow_up: true
      include_alternative_options: false
  
  - worker: email_sender
    capability: email
    config:
      send_follow_up: true
  
  - worker: sms_sender
    capability: sms
    config:
      send_sms: false
```

**Events Created**:
- `ESTIMATE_REMINDER_SENT`
- `EMAIL_SENT`

**Configuration Options**:
- Days before reminder (default: 3)
- Send email (default: true)
- Send SMS (default: false)

### 5. Win-back Campaign Automation

**Rating**: ★★★★☆
**Category**: Marketing
**Trigger**: Customer with no events in 6 months

**Mission Steps**:
```yaml
steps:
  - worker: customer_segmenter
    capability: postgres
    config:
      inactive_days: 180
  
  - worker: win_back_offer_generator
    capability: ollama
    config:
      personalized_offer: true
      discount_percentage: 10
  
  - worker: email_sender
    capability: email
    config:
      send_win_back_offer: true
  
  - worker: engagement_tracker
    capability: postgres
    config:
      track_offer_opened: true
      track_offer_accepted: true
```

**Events Created**:
- `WIN_BACK_OFFER_SENT`
- `EMAIL_SENT`
- `OFFER_OPENED`
- `OFFER_ACCEPTED`

**Configuration Options**:
- Inactive period (default: 180 days)
- Discount percentage (default: 10%)
- Send email (default: true)

### 6. Seasonal Promotions Automation

**Rating**: ★★★★☆
**Category**: Marketing
**Trigger**: Season start (spring: March 20, summer: June 21, fall: September 22, winter: December 21)

**Mission Steps**:
```yaml
steps:
  - worker: season_detector
    capability: postgres
    config:
      check_season_start: true
  
  - worker: promotion_generator
    capability: ollama
    config:
      seasonal_content: true
      industry_specific: true
  
  - worker: email_sender
    capability: email
    config:
      send_promotion: true
  
  - worker: social_poster
    capability: facebook
    config:
      post_promotion: true
  
  - worker: performance_tracker
    capability: postgres
    config:
      track_promotion_performance: true
```

**Events Created**:
- `SEASONAL_PROMOTION_SENT`
- `EMAIL_SENT`
- `SOCIAL_POST_CREATED`
- `PROMOTION_TRACKED`

**Configuration Options**:
- Season (auto-detected)
- Industry-specific content (default: true)
- Send email (default: true)
- Post to social media (default: true)

### 7. Crew Notifications Automation

**Rating**: ★★★☆☆
**Category**: Operations
**Trigger**: `SCHEDULE_UPDATED` event

**Mission Steps**:
```yaml
steps:
  - worker: schedule_checker
    capability: postgres
    config:
      check_schedule_changes: true
  
  - worker: notification_generator
    capability: ollama
    config:
      include_job_details： true
      include_location: true
  
  - worker: sms_sender
    capability: sms
    config:
      send_to_crew: true
      send_to_crew_lead: true
  
  - worker: email_sender
    capability: email
    config:
      send_schedule_update: true
```

**Events Created**:
- `CREW_NOTIFICATION_SENT`
- `SMS_SENT`
- `EMAIL_SENT`

**Configuration Options**:
- Send SMS (default: true)
- Send email (default: true)
- Notify crew lead (default: true)

### 8. Lead Qualification Automation

**Rating**: ★★★☆☆
**Category**: Sales
**Trigger**: `LEAD_CREATED` event

**Mission Steps**:
```yaml
steps:
  - worker: lead_analyzer
    capability: ollama
    config:
      analyze_lead_quality: true
      assign_score: true
  
  - worker: lead_segmenter
    capability: postgres
    config:
      segment_by_score: true
      high_score_threshold: 80
  
  - worker: notification_sender
    capability: email
    config:
      notify_sales_team: true
      notify_on_high_score: true
  
  - worker: follow_up_scheduler
    capability: postgres
    config:
      schedule_follow_up: true
      high_score_follow_up: 1_hour
      medium_score_follow_up: 24_hours
```

**Events Created**:
- `LEAD_QUALIFIED`
- `LEAD_SCORED`
- `LEAD_SEGMENTED`
- `FOLLOW_UP_SCHEDULED`

**Configuration Options**:
- High score threshold (default: 80)
- Notify sales team (default: true)
- Auto-schedule follow-up (default: true)

### 9. Marketing Funnel Automation

**Rating**: ★★★☆☆
**Category**: Marketing
**Trigger**: `LEAD_CREATED` event

**Mission Steps**:
```yaml
steps:
  - worker: welcome_email_sender
    capability: email
    config:
      send_welcome_email: true
      delay: 0_minutes
  
  - worker: educational_content_sender
    capability: email
    config:
      send_educational_content: true
      delay: 24_hours
  
  - worker: case_study_sender
    capability: email
    config:
      send_case_study: true
      delay: 72_hours
  
  - worker: offer_sender
    capability: email
    config:
      send_special_offer: true
      delay: 7_days
  
  - worker: engagement_tracker
    capability: postgres
    config:
      track_email_opens: true
      track_link_clicks: true
```

**Events Created**:
- `WELCOME_EMAIL_SENT`
- `EDUCATIONAL_CONTENT_SENT`
- `CASE_STUDY_SENT`
- `OFFER_SENT`
- `EMAIL_OPENED`
- `LINK_CLICKED`

**Configuration Options**:
- Send welcome email (default: true)
- Send educational content (default: true)
- Send case study (default: true)
- Send special offer (default: true)

## API Endpoints Required

### Marketplace

```
GET /api/marketplace/automations
Response: { automations: [{ id, name, rating, category, description, trigger }] }

GET /api/marketplace/automations/{id}
Response: { automation: { id, name, steps, configuration, events_created } }

POST /api/marketplace/automations/{id}/enable
Request: { configuration }
Response: { mission_id, enabled: true }

GET /api/marketplace/automations/enabled
Response: { automations: [{ mission_id, automation_id, configuration, status }] }

PUT /api/marketplace/automations/enabled/{mission_id}/disable
Response: { disabled: true }
```

### Automation Management

```
GET /api/automations/{mission_id}/performance
Response: { performance: { runs, successes, failures, avg_duration } }

GET /api/automations/{mission_id}/logs
Response: { logs: [{ timestamp, step, status, result }] }

PUT /api/automations/{mission_id}/configure
Request: { configuration }
Response: { updated: true }
```

## Constitutional Events

### Marketplace Events

```
AUTOMATION_ENABLED
- payload: { automation_id, mission_id, configuration, enabled_at }
- projection: Automation status projection

AUTOMATION_DISABLED
- payload: { mission_id, disabled_at, reason }
- projection: Automation status projection

AUTOMATION_CONFIGURED
- payload: { mission_id, configuration, configured_at }
- projection: Automation configuration projection
```

### Mission Events

```
MISSION_TRIGGERED
- payload: { mission_id, trigger_event, triggered_at }
- projection: Mission execution projection

MISSION_STEP_STARTED
- payload: { mission_id, step_id, worker_id, started_at }
- projection: Mission execution projection

MISSION_STEP_COMPLETED
- payload: { mission_id, step_id, worker_id, completed_at, result }
- projection: Mission execution projection

MISSION_FAILED
- payload: { mission_id, failed_at, step_id, error }
- projection: Mission execution projection

MISSION_COMPLETED
- payload: { mission_id, completed_at, results }
- projection: Mission execution projection
```

## Projections Required

### AutomationStatusProjection
- **Source**: Marketplace events
- **Output**: Enabled automations with configuration
- **Storage**: PostgreSQL
- **Update**: Real-time

### MissionExecutionProjection
- **Source**: Mission events
- **Output**: Mission execution history and performance
- **Storage**: PostgreSQL
- **Update**: Real-time

### AutomationPerformanceProjection
- **Source**: Mission events
- **Output**: Automation performance metrics (success rate, avg duration)
- **Storage**: PostgreSQL
- **Update**: Hourly

## Workers Required

### MissionTrigger
- **Capability**: Event Store
- **Input**: Trigger event
- **Output**: Mission execution
- **Events**: `MISSION_TRIGGERED`

### StepExecutor
- **Capability**: Capability Registry
- **Input**: Mission step
- **Output**: Step result
- **Events**: `MISSION_STEP_STARTED`, `MISSION_STEP_COMPLETED`

### MissionMonitor
- **Capability**: PostgreSQL
- **Input**: Mission execution
- **Output**: Mission status
- **Events**: `MISSION_COMPLETED`, `MISSION_FAILED`

## Frontend Components

### AutomationMarketplace
- **Purpose**: Browse and enable automations
- **Features**: Search, filter by category, ratings, enable/disable
- **Behavior**: Show automation details, enable with configuration

### AutomationDetails
- **Purpose**: Show automation details
- **Features**: Mission steps, configuration options, events created
- **Behavior**: Display step-by-step mission flow

### EnabledAutomations
- **Purpose**: Manage enabled automations
- **Features**: List enabled automations, performance metrics, configure, disable
- **Behavior**: Show automation status, allow configuration changes

### AutomationPerformance
- **Purpose**: Show automation performance
- **Features**: Success rate, execution logs, error tracking
- **Behavior**: Display performance metrics and execution history

## Implementation Order

1. Create automation marketplace endpoints
2. Implement mission trigger system
3. Build step executor with capability routing
4. Create mission monitoring
5. Build automation marketplace UI
6. Implement 9 core automation templates
7. Add automation performance tracking
8. Build automation configuration UI
9. Add automation logs viewer
10. Implement automation recommendations

## Success Criteria

- One-click enable for all automations
- Automations execute reliably on triggers
- Mission steps execute in correct order
- Failed steps are logged and retryable
- Automation performance is tracked accurately
- Configuration options are intuitive
- Automations can be disabled without side effects
- Marketplace ratings reflect real performance
- Automation logs provide debugging information

## Notes

- All automation executions are constitutional events
- Mission templates are versioned for reproducibility
- Failed automations can be retried from failure point
- Automation performance drives marketplace ratings
- Configuration options are validated before enabling
- Automations can be cloned and customized
- Marketplace includes community-contributed automations
