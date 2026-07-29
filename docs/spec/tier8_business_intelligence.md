# Tier 8 — Business Intelligence Specification

## Overview

Instead of exposing Neo4j directly, expose answers to business questions. The graph stays invisible; users get actionable insights backed by constitutional evidence.

## BI Interface

```
┌─────────────────────────────────────────────────────────────┐
│ Business Intelligence                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Ask Question] [Saved Questions] [Insights] [Reports]      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Ask a Question                                             │
│ ────────────────────────────────────────────────────────── │
│ > Why are estimates dropping?                               │
│                                                             │
│ AI Analysis:                                                │
│ ────────────────────────────────────────────────────────── │
│ Estimates are down 15% this month compared to last month.   │
│                                                             │
│ Root Causes:                                               │
│ • Material costs increased 12% (evidence: MATERIAL_COST events)│
│ • Competitor pricing decreased 8% (evidence: MARKET_RESEARCH events)│
│ • Lead quality decreased 20% (evidence: LEAD_QUALITY events)│
│                                                             │
│ Evidence:                                                  │
│ • 23 estimates sent this month vs 27 last month             │
│ • Average estimate value: $8,500 vs $10,000 last month     │
│ • Conversion rate: 35% vs 42% last month                   │
│                                                             │
│ Recommendations:                                            │
│ • Review material supplier pricing                          │
│ • Adjust pricing strategy                                  │
│ • Improve lead qualification process                        │
│                                                             │
│ [View Evidence] [Save Question] [Create Alert]              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Pre-built Questions

### Revenue Analysis

**Question**: "What's my revenue trend?"
**Answer**: Shows revenue over time with breakdown by:
- Month-over-month comparison
- Revenue by service type
- Revenue by customer segment
- Revenue by crew
- Seasonal patterns

**Evidence**: Revenue events, invoice events, payment events

**Visualization**: Line chart with trend line, bar chart breakdown

---

**Question**: "Which services generate the most profit?"
**Answer**: Shows profit analysis by service:
- Service type
- Revenue
- Cost (materials, labor, overhead)
- Profit margin
- Trend over time

**Evidence**: Revenue events, cost events, job events

**Visualization**: Bar chart with profit margins, trend lines

---

**Question**: "Who are my most valuable customers?"
**Answer**: Shows customer ranking by:
- Total revenue
- Profit margin
- Repeat purchase rate
- Referral count
- Payment reliability

**Evidence**: Invoice events, payment events, referral events

**Visualization**: Customer leaderboard, scatter plot (revenue vs. margin)

### Customer Analysis

**Question**: "Which customers haven't heard from us in 6 months?"
**Answer**: Shows inactive customers with:
- Customer name
- Last contact date
- Last service type
- Total revenue
- Contact information
- Suggested re-engagement action

**Evidence**: Event log (last event per customer)

**Visualization**: Customer list with last contact dates, re-engagement suggestions

---

**Question**: "Who is most likely to churn?"
**Answer**: Shows churn risk analysis with:
- Customer name
- Churn risk score
- Risk factors (decreased engagement, payment delays, complaints)
- Suggested retention actions

**Evidence**: Event patterns, payment events, review events

**Visualization**: Risk heatmap, customer list with risk factors

---

**Question**: "What do my most satisfied customers have in common?"
**Answer**: Shows satisfaction analysis with:
- Common characteristics (service type, location, crew)
- Common behaviors (referral rate, repeat purchase rate)
- Satisfaction drivers

**Evidence**: Review events, referral events, repeat purchase events

**Visualization**: Common factors list, satisfaction correlation chart

### Operational Analysis

**Question**: "Which crews generate the most profit?"
**Answer**: Shows crew performance with:
- Crew name
- Total revenue
- Total jobs
- Average job duration
- Customer satisfaction
- Profit margin

**Evidence**: Job events, crew assignment events, review events

**Visualization**: Crew leaderboard, performance radar chart

---

**Question**: "What's causing job delays?"
**Answer**: Shows delay analysis with:
- Delay type (material, weather, crew, customer)
- Frequency
- Average delay duration
- Impact on revenue
- Suggested mitigations

**Evidence**: Delay events, job events, weather events

**Visualization**: Delay breakdown chart, impact analysis

---

**Question**: "Which materials are most profitable?"
**Answer**: Shows material analysis with:
- Material type
- Usage frequency
- Cost per unit
- Revenue per unit
- Profit margin
- Supplier performance

**Evidence**: Material events, cost events, job events

**Visualization**: Material profitability chart, supplier comparison

### Marketing Analysis

**Question**: "Which marketing channel produces revenue?"
**Answer**: Shows marketing ROI with:
- Channel (Google, Facebook, referral, etc.)
- Spend
- Leads generated
- Conversion rate
- Revenue
- ROI

**Evidence**: Marketing events, lead events, conversion events

**Visualization**: ROI comparison chart, funnel analysis

---

**Question**: "What marketing is working?"
**Answer**: Shows marketing performance with:
- Campaign performance
- Content performance
- Channel performance
- Seasonal patterns
- Recommendations

**Evidence**: Marketing events, engagement events, conversion events

**Visualization**: Performance dashboard, trend analysis

### Project Analysis

**Question**: "Which completed jobs should become case studies?"
**Answer**: Shows case study candidates with:
- Job details
- Customer satisfaction
- Revenue
- Photo availability
- Testimonial availability
- Case study potential score

**Evidence**: Job events, review events, photo events

**Visualization**: Candidate list with scores, case study builder

---

**Question**: "What's my average job duration by service type?"
**Answer**: Shows duration analysis with:
- Service type
- Average duration
- Duration range
- Factors affecting duration
- Benchmark comparison

**Evidence**: Job events, duration events

**Visualization**: Duration chart, factor analysis

## Question Templates

### Revenue Templates
- "What's my revenue this month?"
- "Show revenue trend"
- "Which services are most profitable?"
- "Who are my most valuable customers?"
- "What's my profit margin?"

### Customer Templates
- "Which customers haven't heard from us in 6 months?"
- "Who is most likely to churn?"
- "What do satisfied customers have in common?"
- "Show customer lifetime value"
- "Which customers refer the most?"

### Operational Templates
- "Which crews generate the most profit?"
- "What's causing job delays?"
- "Which materials are most profitable?"
- "Show crew utilization"
- "What's my average job duration?"

### Marketing Templates
- "Which marketing channel produces revenue?"
- "What marketing is working?"
- "Show lead conversion rate"
- "What's my customer acquisition cost?"
- "Which campaigns have highest ROI?"

### Project Templates
- "Which jobs should become case studies?"
- "Show job completion rate"
- "What's my average job duration?"
- "Which jobs are most profitable?"
- "Show job satisfaction score"

## API Endpoints Required

### Question Processing

```
POST /api/bi/question
Request: { question, context }
Response: { answer, evidence, recommendations, visualization }

GET /api/bi/questions/saved
Response: { questions: [{ id, question, answer, created_at }] }

POST /api/bi/questions/saved
Request: { question, name }
Response: { question_id }

DELETE /api/bi/questions/saved/{id}
Response: { deleted: true }
```

### Insights

```
GET /api/bi/insights
Response: { insights: [{ type, title, description, urgency, action }] }

GET /api/bi/insights/{id}
Response: { insight: { details, evidence, recommendations } }
```

### Reports

```
GET /api/bi/reports
Response: { reports: [{ id, name, type, created_at, schedule }] }

POST /api/bi/reports
Request: { name, type, query, schedule }
Response: { report_id }

GET /api/bi/reports/{id}
Response: { report: { data, visualization, generated_at } }
```

### Alerts

```
GET /api/bi/alerts
Response: { alerts: [{ id, type, condition, triggered, triggered_at }] }

POST /api/bi/alerts
Request: { name, condition, notification }
Response: { alert_id }

PUT /api/bi/alerts/{id}/acknowledge
Response: { acknowledged: true }
```

## Constitutional Events

### BI Events

```
BI_QUESTION_ASKED
- payload: { question_id, question, asked_by, asked_at }
- projection: BI history projection

BI_ANSWER_GENERATED
- payload: { question_id, answer, evidence, recommendations, generated_at }
- projection: BI history projection

BI_INSIGHT_GENERATED
- payload: { insight_id, type, title, description, urgency, generated_at }
- projection: BI insights projection

BI_REPORT_GENERATED
- payload: { report_id, name, type, data, generated_at }
- projection: BI reports projection

BI_ALERT_TRIGGERED
- payload: { alert_id, condition, value, triggered_at }
- projection: BI alerts projection
```

## Projections Required

### BIHistoryProjection
- **Source**: BI events
- **Output**: Question history with answers
- **Storage**: PostgreSQL
- **Update**: Real-time

### BIInsightsProjection
- **Source**: BI insight events
- **Output**: Current insights with urgency
- **Storage**: PostgreSQL
- **Update**: Hourly

### BIReportsProjection
- **Source**: BI report events
- **Output**: Report library with schedules
- **Storage**: PostgreSQL
- **Update**: On schedule

### BIAlertsProjection
- **Source**: BI alert events
- **Output**: Active alerts with status
- **Storage**: PostgreSQL
- **Update**: Real-time

## Workers Required

### QuestionAnalyzer
- **Capability**: Ollama + Knowledge Graph
- **Input**: Natural language question
- **Output**: Structured query + evidence sources
- **Events**: `BI_QUESTION_ASKED`

### EvidenceCollector
- **Capability**: PostgreSQL + Knowledge Graph
- **Input**: Structured query
- **Output**: Evidence from events and graph
- **Events**: None (query only)

### AnswerGenerator
- **Capability**: Ollama
- **Input**: Evidence + question
- **Output**: Natural language answer with recommendations
- **Events**: `BI_ANSWER_GENERATED`

### InsightGenerator
- **Capability**: Ollama + PostgreSQL
- **Input**: Event patterns
- **Output**: Insights with urgency and actions
- **Events**: `BI_INSIGHT_GENERATED`

### ReportGenerator
- **Capability**: PostgreSQL
- **Input**: Report query
- **Output**: Report data with visualization
- **Events**: `BI_REPORT_GENERATED`

### AlertMonitor
- **Capability**: PostgreSQL
- **Input**: Alert conditions
- **Output**: Alert triggers
- **Events**: `BI_ALERT_TRIGGERED`

## Frontend Components

### BIInterface
- **Purpose**: Main BI interface
- **Components**: Question input, saved questions, insights, reports, alerts
- **Behavior**: Ask questions, view answers, save questions, set up alerts

### QuestionInput
- **Purpose**: Natural language question input
- **Features**: Auto-suggestions, question templates, history
- **Behavior**: Type question, get suggestions, submit for analysis

### AnswerDisplay
- **Purpose**: Display BI answers
- **Features**: Answer text, evidence list, recommendations, visualization
- **Behavior**: Show answer with evidence and recommendations

### SavedQuestions
- **Purpose**: Manage saved questions
- **Features**: Question library, quick access, sharing
- **Behavior**: Save questions, access saved questions, share with team

### InsightsPanel
- **Purpose**: Display AI-generated insights
- **Features**: Insight cards, urgency indicators, action buttons
- **Behavior**: Show insights, acknowledge insights, take actions

### ReportsPanel
- **Purpose**: Manage scheduled reports
- **Features**: Report library, scheduling, export options
- **Behavior**: View reports, schedule reports, export data

### AlertsPanel
- **Purpose**: Monitor BI alerts
- **Features**: Alert list, alert details, acknowledgment
- **Behavior**: Show alerts, acknowledge alerts, configure alerts

## Implementation Order

1. Implement question analyzer with Ollama
2. Build evidence collector from event log and knowledge graph
3. Create answer generator with recommendations
4. Implement insight generator
5. Build report generator
6. Create alert monitor
7. Build BI interface UI
8. Add question templates
9. Implement saved questions
10. Add alert configuration

## Success Criteria

- Questions are understood with >90% accuracy
- Answers are backed by constitutional evidence
- Recommendations are actionable
- Insights are relevant and timely
- Reports generate correctly on schedule
- Alerts trigger appropriately
- Visualizations accurately represent data
- Question templates reduce typing
- Saved questions enable quick access
- BI interface is intuitive for non-technical users

## Notes

- All BI queries use constitutional events as evidence
- Knowledge graph provides relationship context
- Answers are fully reproducible from event log
- Recommendations are based on historical patterns
- Insights are generated automatically from event patterns
- Reports are scheduled and delivered automatically
- Alerts are configurable with custom conditions
- All BI actions create constitutional events
- BI interface hides graph complexity from users
- Question history enables learning and improvement
