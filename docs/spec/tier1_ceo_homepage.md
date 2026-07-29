# Tier 1 — CEO Homepage Specification

## Overview

Replace the engineering dashboard with a business-focused homepage that shows business owners what matters most immediately upon opening PING.

## User Experience

### Landing Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Good Morning, [Business Owner Name]                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Today's Priorities                                         │
│ ────────────────────────────────────────────────────────── │
│ • Call Acme (Lead waiting 2 days)                           │
│ • Respond to 2 new reviews                                  │
│ • Send 3 estimates                                          │
│ • Invoice Smith Roofing                                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Business Metrics                                            │
│ ────────────────────────────────────────────────────────── │
│ Revenue Today: $X,XXX                                       │
│ Leads Waiting: X                                            │
│ Jobs At Risk: X                                             │
│ Reviews Needing Response: X                                 │
│ Invoices Due: X                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ AI Summary                                                  │
│ ────────────────────────────────────────────────────────── │
│ Revenue is up 8% compared to last week.                     │
│ Two projects are at risk due to material delays.            │
│ One high-value lead needs immediate attention.             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Command                                                     │
│ ────────────────────────────────────────────────────────── │
│ > What should we do first?                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Technical Implementation

### Data Sources

All data comes from constitutional projections and the knowledge graph.

#### Revenue Today
- **Source**: Events of type `INVOICE_PAID`, `PAYMENT_RECEIVED`
- **Projection**: Daily revenue projection
- **Query**: Sum payments from events where `occurred_at` is today
- **API**: `GET /api/projections/revenue/today`

#### Leads Waiting
- **Source**: Events of type `LEAD_CREATED`
- **Projection**: Lead status projection
- **Query**: Count leads where status = 'new' and created_at > 24 hours ago
- **API**: `GET /api/projections/leads/waiting`

#### Jobs At Risk
- **Source**: Events of type `JOB_CREATED`, `MATERIAL_DELAY`, `CREW_UNAVAILABLE`
- **Projection**: Job risk projection
- **Query**: Count jobs with risk factors (delays, missing materials)
- **API**: `GET /api/projections/jobs/at-risk`

#### Reviews Needing Response
- **Source**: Events of type `REVIEW_RECEIVED`
- **Projection**: Review status projection
- **Query**: Count reviews where responded = false and created_at > 2 hours ago
- **API**: `GET /api/projections/reviews/unresponded`

#### Invoices Due
- **Source**: Events of type `INVOICE_CREATED`, `INVOICE_DUE`
- **Projection**: Invoice status projection
- **Query**: Count invoices where due_date <= today and paid = false
- **API**: `GET /api/projections/invoices/due`

### AI Summary

- **Source**: Knowledge graph + recent events
- **Implementation**: Ollama inference with context from:
  - Last 7 days of revenue events
  - Current lead pipeline
  - Job status events
  - Review sentiment analysis
- **API**: `POST /api/ai/summary/business-daily`

### Command Interface

- **Implementation**: Natural language command parsing
- **Backend**: Command creation via constitutional command endpoint
- **Examples**:
  - "What should we do first?" → Returns prioritized action list
  - "Show leads" → Opens lead view
  - "Schedule crews" → Opens crew scheduler
  - "Create estimate for Acme" → Opens estimate creation

## API Endpoints Required

### Projections

```
GET /api/projections/revenue/today
Response: { revenue: number, change_percent: number }

GET /api/projections/leads/waiting
Response: { count: number, leads: [{ id, name, waiting_hours }] }

GET /api/projections/jobs/at-risk
Response: { count: number, jobs: [{ id, name, risk_factors }] }

GET /api/projections/reviews/unresponded
Response: { count: number, reviews: [{ id, platform, rating, waiting_hours }] }

GET /api/projections/invoices/due
Response: { count: number, invoices: [{ id, customer, amount, due_date }] }
```

### AI Summary

```
POST /api/ai/summary/business-daily
Request: { time_range: string }
Response: { summary: string, metrics: object, recommendations: string[] }
```

### Priorities

```
GET /api/priorities/today
Response: { priorities: [{ id, title, urgency, action }] }
```

## Frontend Components

### CEOHomepage
- **Purpose**: Main landing page for business owners
- **Components**:
  - GreetingHeader
  - PrioritiesList
  - BusinessMetricsGrid
  - AISummaryCard
  - CommandInput

### PrioritiesList
- **Purpose**: Display actionable priorities
- **Data**: From `/api/priorities/today`
- **Interaction**: Click to navigate to relevant view

### BusinessMetricsGrid
- **Purpose**: Display key business metrics
- **Data**: From projection endpoints
- **Visual**: Cards with trend indicators

### AISummaryCard
- **Purpose**: Display AI-generated business summary
- **Data**: From `/api/ai/summary/business-daily`
- **Refresh**: Auto-refresh every 30 minutes

### CommandInput
- **Purpose**: Natural language command interface
- **Behavior**: Parse command, route to appropriate action
- **Examples**: See above

## Constitutional Events

### Priority Events

```
PRIORITY_CREATED
- payload: { title, urgency, action_type, entity_id }
- projection: Updates priorities list

PRIORITY_COMPLETED
- payload: { priority_id, completed_at }
- projection: Removes from priorities list
```

### Metric Events

```
REVENUE_RECORDED
- payload: { amount, source, date }
- projection: Updates revenue projection

LEAD_STATUS_CHANGED
- payload: { lead_id, old_status, new_status }
- projection: Updates lead projection

JOB_RISK_DETECTED
- payload: { job_id, risk_type, severity }
- projection: Updates job risk projection

REVIEW_RECEIVED
- payload: { review_id, platform, rating, sentiment }
- projection: Updates review projection

INVOICE_STATUS_CHANGED
- payload: { invoice_id, old_status, new_status }
- projection: Updates invoice projection
```

## Projections Required

### DailyRevenueProjection
- **Source**: `REVENUE_RECORDED` events
- **Output**: Daily revenue totals with comparison
- **Storage**: PostgreSQL projection table
- **Update**: Real-time on new events

### LeadStatusProjection
- **Source**: `LEAD_STATUS_CHANGED` events
- **Output**: Current lead pipeline state
- **Storage**: PostgreSQL projection table
- **Update**: Real-time on new events

### JobRiskProjection
- **Source**: `JOB_RISK_DETECTED` events
- **Output**: Current job risk status
- **Storage**: PostgreSQL projection table
- **Update**: Real-time on new events

### ReviewStatusProjection
- **Source**: `REVIEW_RECEIVED`, `REVIEW_RESPONDED` events
- **Output**: Current review response status
- **Storage**: PostgreSQL projection table
- **Update**: Real-time on new events

### InvoiceStatusProjection
- **Source**: `INVOICE_STATUS_CHANGED` events
- **Output**: Current invoice payment status
- **Storage**: PostgreSQL projection table
- **Update**: Real-time on new events

## Priority Calculation Logic

### Priority Generation

Priorities are generated based on:

1. **Lead Age**: Leads waiting > 24 hours = high priority
2. **Review Response**: Reviews unresponded > 2 hours = high priority
3. **Invoice Due**: Invoices due today = medium priority
4. **Job Risk**: Jobs at risk = high priority
5. **Revenue Target**: Daily revenue below target = medium priority

### Priority Scoring

- **Urgency**: critical (1), high (2), medium (3), low (4)
- **Sort**: By urgency, then by waiting time
- **Limit**: Top 5 priorities shown

## Implementation Order

1. Create projection endpoints for business metrics
2. Implement priority calculation logic
3. Create AI summary endpoint with Ollama
4. Build frontend CEOHomepage component
5. Wire command input to command creation
6. Add real-time updates via WebSocket
7. Test with sample business data

## Success Criteria

- Homepage loads in < 2 seconds
- All metrics are accurate and real-time
- AI summary provides actionable insights
- Command interface understands common business commands
- Priorities are correctly ranked and actionable
- Page works on mobile and desktop

## Notes

- Hide all engineering diagnostics behind "Developer Mode" toggle
- Default to business view for all non-admin users
- Allow customization of metrics shown per business
- Support multiple business entities per account
