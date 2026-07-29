# Tier 3 — Unified Command Specification

## Overview

Replace dozens of menus with a single command interface that understands natural language and routes to appropriate constitutional actions.

## Command Experience

### Command Interface

```
┌─────────────────────────────────────────────────────────────┐
│ Command                                                     │
│ ────────────────────────────────────────────────────────── │
│ > What needs attention?                                     │
│                                                             │
│ You have 5 items needing attention:                         │
│ • 3 leads waiting over 24 hours                             │
│ • 2 reviews needing response                                │
│ • 1 invoice due today                                       │
│ • 1 job at risk (material delay)                            │
│ • 1 crew scheduling conflict                                │
│                                                             │
│ [View All] [Prioritize]                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Command Examples

#### Business Operations

```
> Show leads
→ Opens lead view with pipeline

> Schedule crews
→ Opens crew scheduler with today's jobs

> Create estimate for Acme
→ Opens estimate creation form with Acme customer data

> Send invoice to Smith Roofing
→ Opens invoice creation with Smith Roofing project

> Show jobs at risk
→ Opens risk dashboard with affected jobs

> What's my revenue today?
→ Shows revenue metrics with breakdown

> Who hasn't paid this month?
→ Shows overdue invoices with customer contact info
```

#### Marketing Operations

```
> Write marketing campaign
→ Opens campaign builder with templates

> Find customers likely to buy
→ Opens lead scoring view with high-intent leads

> Promote this completed project
→ Triggers content generation for project

> Respond to new reviews
→ Opens review response interface with AI drafts

> Send referral requests
→ Opens referral campaign builder

> What marketing is working?
→ Shows campaign performance analytics
```

#### Analysis & Insights

```
> Summarize yesterday
→ Shows AI summary of yesterday's events

> Why are estimates dropping?
→ Shows analysis with evidence from events

> Which crews generate most profit?
→ Shows crew profitability analysis

> What's my customer satisfaction score?
→ Shows review sentiment analysis

> Show me projects at risk
→ Opens risk dashboard with affected projects

> What should we do first?
→ Shows prioritized action list
```

#### Knowledge & Search

```
> Find similar jobs to Acme
→ Searches knowledge graph for similar projects

> Show me Smith Roofing history
→ Shows customer timeline with all interactions

> What did we do for this customer last year?
→ Shows historical projects and outcomes

> Find customers who need roof replacement
→ Searches for leads with roof replacement intent

> Show me all reviews from last month
→ Opens review view with sentiment analysis
```

## Technical Implementation

### Command Pipeline

```
Natural Language Input
      ↓
Intent Classification (Ollama)
      ↓
Entity Extraction (Ollama)
      ↓
Context Resolution (Knowledge Graph)
      ↓
Action Routing (Capability Registry)
      ↓
Execution (Worker Runtime)
      ↓
Response Generation (Ollama)
      ↓
Result Presentation
```

### Intent Classification

**Categories:**
- `SHOW` - Display information (leads, jobs, metrics)
- `CREATE` - Create new entity (estimate, invoice, campaign)
- `UPDATE` - Modify existing entity (schedule, status)
- `ANALYZE` - Generate insights (why, what's working)
- `SEARCH` - Find information (similar jobs, customer history)
- `EXECUTE` - Perform action (send, publish, schedule)

**Examples:**
```
"Show leads" → SHOW + entity: leads
"Create estimate for Acme" → CREATE + entity: estimate + customer: Acme
"Why are estimates dropping" → ANALYZE + metric: estimates + trend: dropping
"Find similar jobs to Acme" → SEARCH + entity: jobs + similarity: Acme
"Send invoice to Smith" → EXECUTE + action: send + entity: invoice + customer: Smith
```

### Entity Extraction

**Entities:**
- Customer names
- Job/project names
- Lead names
- Invoice numbers
- Crew names
- Time ranges (today, yesterday, this week, last month)
- Metrics (revenue, profit, satisfaction)
- Platforms (Google, Facebook, Instagram)

**Example:**
```
Input: "Create estimate for Acme Roofing for $5000"
Entities:
- action: create
- entity: estimate
- customer: Acme Roofing
- amount: $5000
```

### Context Resolution

**Sources:**
- Knowledge graph (customer relationships, job history)
- Recent events (last 7 days)
- User preferences (default views, filters)
- Business context (current season, typical workload)

**Example:**
```
Input: "Show leads"
Context:
- User: Business owner
- Time: Current date
- Business type: Roofing
- Season: Summer (busy season)
Resolution: Show leads sorted by urgency, prioritize high-value leads
```

### Action Routing

**Routing Table:**

| Intent | Entity | Action | Capability |
|--------|--------|--------|------------|
| SHOW | leads | query_leads | postgres |
| SHOW | jobs | query_jobs | postgres |
| SHOW | revenue | query_revenue | postgres |
| CREATE | estimate | create_estimate | postgres |
| CREATE | invoice | create_invoice | postgres |
| CREATE | campaign | create_campaign | postgres |
| UPDATE | schedule | update_schedule | postgres |
| ANALYZE | estimates | analyze_estimates | ollama + postgres |
| SEARCH | jobs | search_jobs | qdrant + postgres |
| EXECUTE | send_invoice | send_invoice | email + postgres |

### Response Generation

**Response Types:**
- **Direct Answer**: Simple query result
- **Action Confirmation**: Confirm before executing
- **Multiple Options**: Present choices
- **Navigation**: Route to appropriate view
- **Insight**: AI-generated analysis

**Examples:**
```
"Show leads" → Direct Answer (list of leads)
"Send invoice to Smith" → Action Confirmation (confirm before sending)
"Why estimates dropping" → Insight (AI analysis with evidence)
"Find similar jobs" → Navigation (open search results)
```

## API Endpoints Required

### Command Processing

```
POST /api/command/parse
Request: { command: string, context: object }
Response: { intent, entities, confidence, suggested_actions }

POST /api/command/execute
Request: { command: string, context: object, action_id: string }
Response: { result, events_created, next_actions }

GET /api/command/suggestions
Request: { partial_command: string }
Response: { suggestions: [{ command, description }] }
```

### Command History

```
GET /api/command/history
Response: { commands: [{ command, result, timestamp }] }

POST /api/command/favorite
Request: { command: string, name: string }
Response: { favorite_id }
```

### Command Templates

```
GET /api/command/templates
Response: { templates: [{ name, command, description }] }

POST /api/command/templates
Request: { name, command, description }
Response: { template_id }
```

## Constitutional Events

### Command Events

```
COMMAND_RECEIVED
- payload: { command, user_id, timestamp }
- projection: Command history projection

COMMAND_PARSED
- payload: { command_id, intent, entities, confidence }
- projection: Command analytics projection

COMMAND_EXECUTED
- payload: { command_id, action_id, result, events_created }
- projection: Command history projection

COMMAND_FAILED
- payload: { command_id, error, context }
- projection: Command analytics projection
```

### Action Events

```
ACTION_ROUTED
- payload: { command_id, action, capability, worker_id }
- projection: Action routing projection

ACTION_EXECUTED
- payload: { action_id, result, duration }
- projection: Action performance projection
```

## Projections Required

### CommandHistoryProjection
- **Source**: Command events
- **Output**: Command history with results
- **Storage**: PostgreSQL
- **Update**: Real-time

### CommandAnalyticsProjection
- **Source**: Command events
- **Output**: Command usage statistics (most used, success rate)
- **Storage**: PostgreSQL
- **Update**: Hourly

### ActionRoutingProjection
- **Source**: Action events
- **Output**: Routing performance and optimization
- **Storage**: PostgreSQL
- **Update**: Real-time

### ActionPerformanceProjection
- **Source**: Action events
- **Output**: Worker performance metrics
- **Storage**: PostgreSQL
- **Update**: Hourly

## Workers Required

### IntentClassifier
- **Capability**: Ollama
- **Input**: Command text
- **Output**: Intent classification with confidence
- **Events**: `COMMAND_PARSED`

### EntityExtractor
- **Capability**: Ollama
- **Input**: Command text
- **Output**: Extracted entities
- **Events**: `COMMAND_PARSED`

### ContextResolver
- **Capability**: Knowledge Graph
- **Input**: Intent + entities
- **Output**: Resolved context
- **Events**: `COMMAND_PARSED`

### ActionRouter
- **Capability**: Capability Registry
- **Input**: Intent + entities + context
- **Output**: Routed action with worker
- **Events**: `ACTION_ROUTED`

### ResponseGenerator
- **Capability**: Ollama
- **Input**: Action result + context
- **Output**: Natural language response
- **Events**: `COMMAND_EXECUTED`

## Frontend Components

### CommandInput
- **Purpose**: Primary command interface
- **Features**:
  - Auto-suggestions
  - Command history
  - Favorite commands
  - Template shortcuts
- **Behavior**: Parse on submit, show suggestions while typing

### CommandResult
- **Purpose**: Display command results
- **Types**:
  - ListResult (show leads, jobs)
  - MetricResult (revenue, profit)
  - InsightResult (analysis, why questions)
  - ConfirmationResult (send invoice, schedule)
  - NavigationResult (find similar, search)

### CommandSuggestions
- **Purpose**: Suggest commands while typing
- **Behavior**: Show partial matches and templates
- **Source**: Command history + templates

### CommandHistory
- **Purpose**: Show recent commands
- **Behavior**: Click to re-execute or view result
- **Filter**: By date, by type, by user

### CommandTemplates
- **Purpose**: Pre-built command templates
- **Examples**:
  - "Show today's schedule"
  - "Create estimate for [customer]"
  - "Send invoice to [customer]"
  - "What needs attention?"
- **Behavior**: Click to execute with parameter prompts

## Implementation Order

1. Implement intent classification with Ollama
2. Build entity extraction with Ollama
3. Create action routing logic
4. Build command history projection
5. Implement command input UI with suggestions
6. Add command templates
7. Build response generation
8. Add command favorites
9. Implement context resolution with knowledge graph
10. Add command analytics

## Success Criteria

- Commands are parsed with >90% accuracy
- Entity extraction correctly identifies >85% of entities
- Action routing correctly routes >95% of commands
- Response generation provides helpful natural language responses
- Command suggestions improve over time based on usage
- Command history enables quick re-execution
- Templates reduce typing for common operations
- Context resolution provides relevant results

## Notes

- All commands are constitutional events for full audit trail
- Command usage analytics drive template suggestions
- Failed commands are logged for improvement
- Context resolution uses knowledge graph for relevance
- Response generation adapts to user role (owner vs. staff)
- Command interface works on mobile and desktop
