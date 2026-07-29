# Tier 4 — AI Workspace Specification

## Overview

Build a Buzz-style interaction model where chat, canvas, tasks, evidence, timeline, knowledge, and automation all reference the same constitutional objects.

## Workspace Layout

```
┌─────────────────────────────────────────────────────────────┐
│ AI Workspace                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Chat] [Canvas] [Tasks] [Evidence] [Timeline] [Knowledge]   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Chat Panel                                                  │
│ ────────────────────────────────────────────────────────── │
│ You: What's the status of the Acme project?                 │
│                                                             │
│ AI: The Acme project is currently in progress.            │
│     Evidence:                                              │
│     • Started on July 15, 2026                             │
│     • Materials delivered on July 18, 2026                 │
│     • Crew scheduled for July 20, 2026                      │
│     • No delays reported                                   │
│                                                             │
│     Timeline:                                              │
│     July 15: Project started                               │
│     July 18: Materials delivered                           │
│     July 20: Crew scheduled                                │
│                                                             │
│     Related entities:                                      │
│     • Customer: Acme Roofing                               │
│     • Crew: Alpha Team                                     │
│     • Estimate: #EST-2024-001                              │
│                                                             │
│ [View in Canvas] [View Timeline] [View Tasks]              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Workspace Components

### 1. Chat

**Purpose**: Natural language interface to constitutional objects

**Features**:
- Context-aware conversations
- Reference to constitutional entities
- Evidence-backed responses
- Action suggestions
- Multi-turn conversations

**Example Conversations**:

```
User: What's the status of the Acme project?
AI: [Shows project status with evidence from events]

User: Why is it delayed?
AI: [Shows delay events with causal chain]

User: What can we do about it?
AI: [Suggests actions based on similar past situations]

User: Schedule the crew for tomorrow.
AI: [Creates schedule event, confirms with evidence]
```

**Constitutional References**:
- All chat responses reference specific events
- All claims are backed by evidence from the event log
- All actions create constitutional events
- All suggestions are based on historical patterns

### 2. Canvas

**Purpose**: Visual workspace for organizing and manipulating constitutional objects

**Features**:
- Drag-and-drop entity cards
- Relationship visualization
- Timeline view
- Workflow builder
- Document workspace

**Canvas Objects**:
- Customer cards
- Project cards
- Task cards
- Evidence cards
- Timeline events
- Relationship lines

**Example Canvas**:
```
┌─────────────────────────────────────────────────────────────┐
│ Canvas: Acme Project                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Customer: Acme Roofing]                                    │
│         │                                                   │
│         ├─→ [Project: Roof Replacement]                     │
│         │         │                                         │
│         │         ├─→ [Task: Material Delivery] ✅          │
│         │         ├─→ [Task: Crew Scheduling] 📅           │
│         │         └─→ [Task: Installation] ⏳              │
│         │                                                   │
│         └─→ [Estimate: #EST-2024-001] 💰                   │
│                                                             │
│ [Evidence: Project started July 15]                         │
│ [Evidence: Materials delivered July 18]                     │
│ [Evidence: Crew scheduled July 20]                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. Tasks

**Purpose**: Task management linked to constitutional events

**Features**:
- Task creation from chat
- Task assignment to crews
- Task dependencies
- Task completion with evidence
- Task timeline

**Task States**:
- Pending
- In Progress
- Blocked
- Completed
- Cancelled

**Constitutional Events**:
```
TASK_CREATED
- payload: { task_id, title, assignee, due_date, dependencies }
- projection: Task projection

TASK_ASSIGNED
- payload: { task_id, assignee, assigned_at }
- projection: Task projection

TASK_COMPLETED
- payload: { task_id, completed_at, evidence }
- projection: Task projection
```

### 4. Evidence

**Purpose**: Display evidence backing AI claims and recommendations

**Features**:
- Evidence cards with source events
- Evidence timeline
- Evidence verification
- Evidence export
- Evidence sharing

**Evidence Types**:
- Event-based evidence (from event log)
- Document-based evidence (uploaded files)
- Testimonial evidence (customer reviews)
- Metric evidence (calculated from events)

**Example Evidence Card**:
```
┌─────────────────────────────────────────────────────────────┐
│ Evidence: Project Status                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Source: Events                                              │
│                                                             │
│ • PROJECT_STARTED (July 15, 2026)                           │
│   Event ID: evt_abc123                                      │
│   Global Sequence: 1001                                     │
│                                                             │
│ • MATERIAL_DELIVERED (July 18, 2026)                        │
│   Event ID: evt_def456                                      │
│   Global Sequence: 1050                                     │
│                                                             │
│ • CREW_SCHEDULED (July 20, 2026)                            │
│   Event ID: evt_ghi789                                      │
│   Global Sequence: 1100                                     │
│                                                             │
│ Verification: ✅ All events verified via replay              │
│                                                             │
│ [View in Timeline] [Export Evidence]                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5. Timeline

**Purpose**: Chronological view of constitutional events for any entity

**Features**:
- Event timeline
- Causality visualization
- Event filtering
- Event replay
- Event export

**Timeline View**:
```
┌─────────────────────────────────────────────────────────────┐
│ Timeline: Acme Project                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ July 15, 2026                                               │
│ ────────────────────────────────────────────────────────── │
│ 9:00 AM  PROJECT_STARTED                                   │
│          Created project for Acme Roofing                  │
│          Event ID: evt_abc123                              │
│                                                             │
│ July 18, 2026                                               │
│ ────────────────────────────────────────────────────────── │
│ 2:30 PM  MATERIAL_DELIVERED                                 │
│          Roofing materials delivered to site                │
│          Event ID: evt_def456                              │
│                                                             │
│ July 20, 2026                                               │
│ ────────────────────────────────────────────────────────── │
│ 8:00 AM  CREW_SCHEDULED                                    │
│          Alpha Team scheduled for installation              │
│          Event ID: evt_ghi789                              │
│                                                             │
│ [Filter Events] [Replay Timeline] [Export Timeline]        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6. Knowledge

**Purpose**: Query knowledge graph for relationships and insights

**Features**:
- Entity search
- Relationship visualization
- Path finding
- Similar entity discovery
- Knowledge export

**Knowledge Queries**:
```
"Show me all customers similar to Acme"
→ Returns customers with similar project types, revenue, location

"What projects has Alpha Team completed?"
→ Returns all projects with Alpha Team as crew

"Show me the relationship between Acme and Smith Roofing"
→ Returns if they're related (referrals, same location, etc.)

"Find customers who haven't heard from us in 6 months"
→ Returns customers with no events in last 6 months
```

### 7. Automation

**Purpose**: Configure and monitor automated missions

**Features**:
- Mission templates
- Active missions
- Mission performance
- Mission editing
- Mission cloning

**Automation View**:
```
┌─────────────────────────────────────────────────────────────┐
│ Automation                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Active Missions                                             │
│ ────────────────────────────────────────────────────────── │
│                                                             │
│ Review Response Mission                                     │
│ Status: Running | Trigger: REVIEW_RECEIVED                  │
│ Last run: 2 hours ago | Success rate: 98%                  │
│ [View Details] [Pause] [Edit]                               │
│                                                             │
│ Lead Nurturing Mission                                      │
│ Status: Running | Trigger: LEAD_CREATED                    │
│ Last run: 1 day ago | Success rate: 85%                     │
│ [View Details] [Pause] [Edit]                               │
│                                                             │
│ Invoice Follow-up Mission                                   │
│ Status: Paused | Trigger: INVOICE_SENT                     │
│ Last run: 3 days ago | Success rate: 92%                    │
│ [View Details] [Resume] [Edit]                              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [+] Create New Mission                                      │
│ [Browse Mission Templates]                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Cross-Component Integration

### Chat → Canvas
```
User: "Show me the Acme project on canvas"
AI: Opens canvas with Acme project entities
```

### Chat → Tasks
```
User: "Create a task to schedule the crew for tomorrow"
AI: Creates task in Tasks panel, shows confirmation
```

### Chat → Evidence
```
User: "Show me evidence for the Acme project status"
AI: Opens Evidence panel with relevant events
```

### Chat → Timeline
```
User: "Show me the timeline for the Acme project"
AI: Opens Timeline panel with project events
```

### Chat → Knowledge
```
User: "Find customers similar to Acme"
AI: Opens Knowledge panel with similar customers
```

### Canvas → Timeline
```
User: Clicks project card on canvas
→ Opens Timeline panel with project events
```

### Canvas → Tasks
```
User: Drags task card to crew card
→ Assigns task to crew, creates TASK_ASSIGNED event
```

### Timeline → Evidence
```
User: Clicks event on timeline
→ Opens Evidence panel with event details
```

### Knowledge → Canvas
```
User: Clicks customer in Knowledge panel
→ Opens Canvas panel with customer entities
```

## API Endpoints Required

### Chat

```
POST /api/workspace/chat
Request: { message, context, workspace_id }
Response: { response, evidence, actions, suggested_views }

GET /api/workspace/chat/history
Response: { messages: [{ role, content, timestamp }] }

POST /api/workspace/chat/context
Request: { entity_id, entity_type }
Response: { context: { entity, related_entities, timeline } }
```

### Canvas

```
GET /api/workspace/canvas/{workspace_id}
Response: { canvas: { entities, relationships, layout } }

POST /api/workspace/canvas/{workspace_id}/entities
Request: { entity_id, entity_type, position }
Response: { entity_id }

PUT /api/workspace/canvas/{workspace_id}/layout
Request: { layout }
Response: { updated: true }
```

### Tasks

```
GET /api/workspace/tasks
Response: { tasks: [{ id, title, status, assignee, due_date }] }

POST /api/workspace/tasks
Request: { title, assignee, due_date, dependencies }
Response: { task_id }

PUT /api/workspace/tasks/{id}/complete
Request: { evidence }
Response: { completed: true }
```

### Evidence

```
GET /api/workspace/evidence/{entity_id}
Response: { evidence: [{ event_id, type, timestamp, data }] }

POST /api/workspace/evidence/verify
Request: { evidence_ids }
Response: { verification: { verified, details } }
```

### Timeline

```
GET /api/workspace/timeline/{entity_id}
Response: { timeline: [{ event_id, type, timestamp, data }] }

GET /api/workspace/timeline/{entity_id}/replay
Request: { checkpoint }
Response: { replay: { events, state } }
```

### Knowledge

```
GET /api/workspace/knowledge/search
Request: { query, entity_type }
Response: { results: [{ entity_id, type, relevance }] }

GET /api/workspace/knowledge/relationships
Request: { entity_id }
Response: { relationships: [{ from, to, type, strength }] }
```

### Automation

```
GET /api/workspace/automation/missions
Response: { missions: [{ id, name, status, trigger, performance }] }

POST /api/workspace/automation/missions
Request: { name, trigger, steps }
Response: { mission_id }

PUT /api/workspace/automation/missions/{id}/pause
Response: { paused: true }
```

## Constitutional Events

### Workspace Events

```
WORKSPACE_CREATED
- payload: { workspace_id, name, owner_id }
- projection: Workspace projection

WORKSPACE_UPDATED
- payload: { workspace_id, changes }
- projection: Workspace projection

WORKSPACE_SHARED
- payload: { workspace_id, shared_with, permissions }
- projection: Workspace projection
```

### Chat Events

```
CHAT_MESSAGE_SENT
- payload: { workspace_id, message, role, context }
- projection: Chat history projection

CHAT_CONTEXT_UPDATED
- payload: { workspace_id, context }
- projection: Chat context projection
```

### Canvas Events

```
CANVAS_ENTITY_ADDED
- payload: { workspace_id, entity_id, entity_type, position }
- projection: Canvas projection

CANVAS_LAYOUT_UPDATED
- payload: { workspace_id, layout }
- projection: Canvas projection
```

### Task Events

```
TASK_CREATED
- payload: { task_id, title, assignee, due_date, dependencies }
- projection: Task projection

TASK_COMPLETED
- payload: { task_id, completed_at, evidence }
- projection: Task projection
```

## Projections Required

### WorkspaceProjection
- **Source**: Workspace events
- **Output**: Current workspace states
- **Storage**: PostgreSQL
- **Update**: Real-time

### ChatHistoryProjection
- **Source**: Chat events
- **Output**: Chat conversation history
- **Storage**: PostgreSQL
- **Update**: Real-time

### CanvasProjection
- **Source**: Canvas events
- **Output**: Canvas layout and entities
- **Storage**: PostgreSQL
- **Update**: Real-time

### TaskProjection
- **Source**: Task events
- **Output**: Task states and assignments
- **Storage**: PostgreSQL
- **Update**: Real-time

## Workers Required

### ChatContextWorker
- **Capability**: Knowledge Graph + PostgreSQL
- **Input**: Entity reference
- **Output**: Context with related entities and timeline
- **Events**: `CHAT_CONTEXT_UPDATED`

### EvidenceCollector
- **Capability**: PostgreSQL + Replay Engine
- **Input**: Entity reference
- **Output**: Evidence from event log
- **Events**: None (query only)

### TaskAssignmentWorker
- **Capability**: PostgreSQL
- **Input**: Task + assignee
- **Output**: Task assignment
- **Events**: `TASK_ASSIGNED`

### MissionExecutor
- **Capability**: Mission Runtime
- **Input**: Mission trigger
- **Output**: Mission execution
- **Events**: Mission-specific events

## Frontend Components

### WorkspaceLayout
- **Purpose**: Main workspace container
- **Components**: Chat, Canvas, Tasks, Evidence, Timeline, Knowledge, Automation panels
- **Behavior**: Tab-based navigation, persistent state

### ChatPanel
- **Purpose**: Chat interface
- **Features**: Message input, message history, context sidebar
- **Behavior**: Send message, display AI response, show evidence

### CanvasPanel
- **Purpose**: Visual workspace
- **Features**: Entity cards, relationship lines, drag-and-drop
- **Behavior**: Add entities, move entities, show relationships

### TasksPanel
- **Purpose**: Task management
- **Features**: Task list, task creation, task completion
- **Behavior**: Create task, assign task, complete task

### EvidencePanel
- **Purpose**: Evidence display
- **Features**: Evidence cards, source events, verification
- **Behavior**: Show evidence, verify evidence, export evidence

### TimelinePanel
- **Purpose**: Timeline view
- **Features**: Event timeline, causality visualization, replay
- **Behavior**: Show timeline, filter events, replay timeline

### KnowledgePanel
- **Purpose**: Knowledge graph query
- **Features**: Entity search, relationship visualization, path finding
- **Behavior**: Search entities, show relationships, find paths

### AutomationPanel
- **Purpose**: Mission management
- **Features**: Mission list, mission details, mission editing
- **Behavior**: View missions, pause missions, edit missions

## Implementation Order

1. Implement chat interface with context resolution
2. Build evidence collection from event log
3. Create timeline view with event filtering
4. Implement knowledge graph queries
5. Build canvas with entity cards
6. Add task management
7. Implement mission monitoring
8. Add cross-component navigation
9. Build workspace persistence
10. Add workspace sharing

## Success Criteria

- Chat responses are evidence-backed with source events
- Canvas allows visual organization of constitutional entities
- Tasks are linked to constitutional events
- Evidence is verifiable via replay
- Timeline shows complete event history
- Knowledge queries return accurate relationships
- Automation missions are monitorable and editable
- All components reference the same constitutional objects
- Cross-component navigation is seamless
- Workspace state persists across sessions

## Notes

- All workspace actions create constitutional events
- All AI claims are backed by evidence from the event log
- All components reference the same constitutional entities
- Workspace state is fully replayable from events
- Knowledge graph queries use Neo4j for relationship discovery
- Chat context uses both event log and knowledge graph
- Canvas layout is stored as constitutional events
- Tasks create constitutional events for audit trail
