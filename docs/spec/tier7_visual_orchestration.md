# Tier 7 — Visual Orchestration Specification

## Overview

Build a visual mission orchestration interface inspired by Orca and Omniroute. Users can inspect and debug missions visually, while the constitutional kernel remains unchanged.

## Visual Orchestration Interface

```
┌─────────────────────────────────────────────────────────────┐
│ Visual Mission Orchestration                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Missions] [Workflows] [Workers] [Debug]                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Active Missions                                             │
│ ────────────────────────────────────────────────────────── │
│                                                             │
│ Review Response Mission                                     │
│ Status: Running | Progress: 3/5 steps completed             │
│ [View Details] [Pause] [Debug]                              │
│                                                             │
│ Lead Nurturing Mission                                      │
│ Status: Running | Progress: 1/4 steps completed             │
│ [View Details] [Pause] [Debug]                              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Mission Visualizer: Review Response Mission                 │
│ ────────────────────────────────────────────────────────── │
│                                                             │
│ ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│ │ REVIEW_     │───→│ SENTIMENT_  │───→│ RESPONSE_   │       │
│ │ RECEIVED    │    │ ANALYZED    │    │ GENERATED   │       │
│ │ ✅ Complete │    │ ✅ Complete │    │ ✅ Complete │       │
│ └─────────────┘    └─────────────┘    └─────────────┘       │
│                                           │                  │
│                                           ▼                  │
│                              ┌─────────────┐               │
│                              │ RESPONSE_   │               │
│                              │ APPROVED    │               │
│                              │ ⏳ In Progress│              │
│                              └─────────────┘               │
│                                           │                  │
│                                           ▼                  │
│                              ┌─────────────┐               │
│                              │ RESPONSE_   │               │
│                              │ PUBLISHED   │               │
│                              │ ⏸️ Pending   │               │
│                              └─────────────┘               │
│                                                             │
│ [Step Details] [Event Log] [Retry Step] [Edit Mission]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Mission Visualization

### Node Types

**Event Nodes**:
- **Trigger Event**: The event that started the mission
- **Intermediate Events**: Events created during mission execution
- **Completion Event**: The event that marks mission completion

**Step Nodes**:
- **Worker Step**: A step executed by a worker
- **Condition Step**: A conditional branch in the mission
- **Parallel Step**: Steps that execute in parallel
- **Sub-mission Step**: A step that launches another mission

### Node States

- **Pending**: Step not yet started
- **In Progress**: Step currently executing
- **Completed**: Step completed successfully
- **Failed**: Step failed with error
- **Skipped**: Step skipped due to condition
- **Retrying**: Step being retried after failure

### Connection Types

- **Sequential**: Steps execute in order
- **Conditional**: Step executes based on condition
- **Parallel**: Steps execute simultaneously
- **Error**: Error handling path

## Mission Inspector

### Step Details Panel

```
┌─────────────────────────────────────────────────────────────┐
│ Step Details: Response Approval                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Step ID: step_abc123                                       │
│ Worker: human_approval                                      │
│ Capability: ui                                              │
│ Status: In Progress                                         │
│ Started: July 20, 2026 10:30 AM                             │
│ Duration: 15 minutes                                       │
│                                                             │
│ Input:                                                      │
│ {                                                           │
│   "review_id": "rev_xyz789",                                │
│   "sentiment": "positive",                                  │
│   "response_text": "Thank you for..."                        │
│ }                                                           │
│                                                             │
│ Output:                                                     │
│ (Pending)                                                   │
│                                                             │
│ Configuration:                                             │
│ {                                                           │
│   "auto_approve_positive": true,                            │
│   "require_approval_negative": true                         │
│ }                                                           │
│                                                             │
│ Events Created:                                             │
│ • RESPONSE_APPROVED (pending)                               │
│                                                             │
│ [View Worker] [View Capability] [Retry Step] [Skip Step]  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Event Log Panel

```
┌─────────────────────────────────────────────────────────────┐
│ Event Log: Review Response Mission                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ July 20, 2026 10:15 AM                                     │
│ ────────────────────────────────────────────────────────── │
│ REVIEW_RECEIVED                                            │
│ Event ID: evt_abc123                                       │
│ Global Sequence: 5001                                       │
│ Payload: { review_id, platform, rating, text }              │
│                                                             │
│ July 20, 2026 10:16 AM                                     │
│ ────────────────────────────────────────────────────────── │
│ SENTIMENT_ANALYZED                                          │
│ Event ID: evt_def456                                       │
│ Global Sequence: 5002                                       │
│ Payload: { review_id, sentiment, confidence }                │
│                                                             │
│ July 20, 2026 10:17 AM                                     │
│ ────────────────────────────────────────────────────────── │
│ RESPONSE_GENERATED                                          │
│ Event ID: evt_ghi789                                       │
│ Global Sequence: 5003                                       │
│ Payload: { review_id, response_text }                        │
│                                                             │
│ July 20, 2026 10:30 AM                                     │
│ ────────────────────────────────────────────────────────── │
│ RESPONSE_APPROVED                                           │
│ Event ID: evt_jkl012                                       │
│ Global Sequence: 5004                                       │
│ Payload: { review_id, approved_by, approved_at }             │
│                                                             │
│ [Filter Events] [Export Log] [Replay from Event]            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Mission Builder

### Visual Mission Builder

```
┌─────────────────────────────────────────────────────────────┐
│ Mission Builder                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Mission Name: [New Mission]                                │
│ Trigger Event: [Select Event Type ▼]                       │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Toolbox                                                  │ │
│ │ ─────────────────────────────────────────────────────── │ │
│ │ [Worker Step] [Condition] [Parallel] [Sub-mission]      │ │
│ │ [Event] [Delay] [Loop] [Error Handler]                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Canvas                                                     │
│ ────────────────────────────────────────────────────────── │
│                                                             │
│ [Trigger: REVIEW_RECEIVED]                                  │
│         │                                                   │
│         ▼                                                   │
│ [Worker: sentiment_analyzer]                                │
│         │                                                   │
│         ▼                                                   │
│ [Condition: sentiment == "positive"]                        │
│         │                                                   │
│         ├─→ [Worker: auto_approve]                          │
│         │         │                                         │
│         │         ▼                                         │
│         │    [Worker: publish_response]                     │
│         │                                                   │
│         └─→ [Worker: human_approval]                        │
│                   │                                         │
│                   ▼                                         │
│              [Worker: publish_response]                     │
│                                                             │
│ [Save Mission] [Test Mission] [Deploy Mission]             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Mission Configuration

```yaml
mission:
  name: "Review Response Mission"
  version: "1.0.0"
  trigger_event: "REVIEW_RECEIVED"
  
  steps:
    - id: "step_1"
      type: "worker"
      worker: "sentiment_analyzer"
      capability: "ollama"
      config:
        analyze_sentiment: true
      on_success: "step_2"
      on_failure: "error_handler"
    
    - id: "step_2"
      type: "condition"
      condition: "sentiment == 'positive'"
      on_true: "step_3a"
      on_false: "step_3b"
    
    - id: "step_3a"
      type: "worker"
      worker: "auto_approver"
      capability: "postgres"
      config:
        auto_approve: true
      on_success: "step_4"
      on_failure: "error_handler"
    
    - id: "step_3b"
      type: "worker"
      worker: "human_approval"
      capability: "ui"
      config:
        require_approval: true
      on_success: "step_4"
      on_failure: "error_handler"
    
    - id: "step_4"
      type: "worker"
      worker: "response_publisher"
      capability: "google_business"
      config:
        platform: "google_business"
      on_success: "complete"
      on_failure: "error_handler"
    
    - id: "error_handler"
      type: "worker"
      worker: "error_notifier"
      capability: "email"
      config:
        notify_admin: true
      on_success: "complete"
      on_failure: "complete"
```

## Debug Mode

### Mission Debugging

```
┌─────────────────────────────────────────────────────────────┐
│ Debug Mode: Review Response Mission                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Current State:                                             │
│ ────────────────────────────────────────────────────────── │
│ Mission ID: mission_abc123                                 │
│ Status: Running                                            │
│ Current Step: step_3b (human_approval)                      │
│ Progress: 3/5 steps completed                              │
│                                                             │
│ Step Execution:                                            │
│ ────────────────────────────────────────────────────────── │
│ step_1 (sentiment_analyzer): ✅ Completed (2s)              │
│ step_2 (condition): ✅ Completed (0.1s)                     │
│ step_3a (auto_approver): ⏭️ Skipped (condition false)       │
│ step_3b (human_approval): ⏳ In Progress (15m)              │
│ step_4 (response_publisher): ⏸️ Pending                     │
│                                                             │
│ Variables:                                                  │
│ ────────────────────────────────────────────────────────── │
│ sentiment: "negative"                                      │
│ review_id: "rev_xyz789"                                    │
│ response_text: "We apologize..."                            │
│                                                             │
│ [Resume] [Pause] [Retry Step] [Skip Step] [View Logs]      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Error Handling

```
┌─────────────────────────────────────────────────────────────┐
│ Error: Step Failed                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Step: step_4 (response_publisher)                           │
│ Error: Connection timeout to Google Business API             │
│ Timestamp: July 20, 2026 10:45 AM                           │
│ Retry Count: 2/3                                            │
│                                                             │
│ Error Details:                                              │
│ {                                                           │
│   "error_type": "ConnectionError",                          │
│   "message": "Connection timeout after 30s",                │
│   "stack_trace": "..."                                      │
│ }                                                           │
│                                                             │
│ [Retry Now] [Skip Step] [Edit Step] [Abort Mission]        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints Required

### Mission Visualization

```
GET /api/orchestration/missions
Response: { missions: [{ id, name, status, progress, trigger }] }

GET /api/orchestration/missions/{id}
Response: { mission: { id, name, steps, current_step, progress } }

GET /api/orchestration/missions/{id}/visualization
Response: { visualization: { nodes, connections, layout } }

GET /api/orchestration/missions/{id}/steps/{step_id}
Response: { step: { id, worker, capability, status, input, output, config } }
```

### Mission Execution

```
POST /api/orchestration/missions/{id}/pause
Response: { paused: true }

POST /api/orchestration/missions/{id}/resume
Response: { resumed: true }

POST /api/orchestration/missions/{id}/steps/{step_id}/retry
Response: { retried: true }

POST /api/orchestration/missions/{id}/steps/{step_id}/skip
Response: { skipped: true }
```

### Mission Building

```
POST /api/orchestration/missions
Request: { name, trigger_event, steps }
Response: { mission_id }

PUT /api/orchestration/missions/{id}
Request: { steps }
Response: { updated: true }

POST /api/orchestration/missions/{id}/test
Request: { test_event }
Response: { test_result: { success, steps_executed, events_created } }
```

### Mission Debugging

```
GET /api/orchestration/missions/{id}/debug
Response: { debug: { current_state, variables, logs } }

GET /api/orchestration/missions/{id}/logs
Response: { logs: [{ timestamp, step, status, result }] }

GET /api/orchestration/missions/{id}/events
Response: { events: [{ event_id, type, timestamp, payload }] }
```

## Constitutional Events

### Mission Orchestration Events

```
MISSION_VISUALIZED
- payload: { mission_id, visualization, visualized_at }
- projection: Mission visualization projection

MISSION_STEP_DEBUGGED
- payload: { mission_id, step_id, debug_info, debugged_at }
- projection: Mission debug projection

MISSION_STEP_RETRIED
- payload: { mission_id, step_id, retry_count, retried_at }
- projection: Mission execution projection

MISSION_STEP_SKIPPED
- payload: { mission_id, step_id, skip_reason, skipped_at }
- projection: Mission execution projection
```

### Mission Builder Events

```
MISSION_DESIGNED
- payload: { mission_id, name, steps, designed_at }
- projection: Mission design projection

MISSION_TESTED
- payload: { mission_id, test_result, tested_at }
- projection: Mission test projection

MISSION_DEPLOYED
- payload: { mission_id, deployed_at, deployed_by }
- projection: Mission deployment projection
```

## Projections Required

### MissionVisualizationProjection
- **Source**: Mission orchestration events
- **Output**: Mission visualization state
- **Storage**: PostgreSQL
- **Update**: Real-time

### MissionDebugProjection
- **Source**: Mission debug events
- **Output**: Mission debug state and logs
- **Storage**: PostgreSQL
- **Update**: Real-time

### MissionDesignProjection
- **Source**: Mission builder events
- **Output**: Mission designs and versions
- **Storage**: PostgreSQL
- **Update**: Real-time

### MissionTestProjection
- **Source**: Mission test events
- **Output**: Mission test results
- **Storage**: PostgreSQL
- **Update**: Real-time

## Workers Required

### MissionVisualizer
- **Capability**: PostgreSQL
- **Input**: Mission ID
- **Output**: Mission visualization (nodes, connections)
- **Events**: `MISSION_VISUALIZED`

### MissionDebugger
- **Capability**: PostgreSQL
- **Input**: Mission ID
- **Output**: Mission debug state
- **Events**: `MISSION_STEP_DEBUGGED`

### StepRetryer
- **Capability**: Mission Runtime
- **Input**: Mission ID + Step ID
- **Output**: Retry execution
- **Events**: `MISSION_STEP_RETRIED`

### StepSkipper
- **Capability**: Mission Runtime
- **Input**: Mission ID + Step ID
- **Output**: Skip execution
- **Events**: `MISSION_STEP_SKIPPED`

### MissionTester
- **Capability**: Mission Runtime
- **Input**: Mission design + test event
- **Output**: Test execution result
- **Events**: `MISSION_TESTED`

## Frontend Components

### MissionOrchestrationDashboard
- **Purpose**: Main dashboard for mission orchestration
- **Components**: Mission list, mission visualizer, mission builder, debug panel
- **Behavior**: Show active missions, visualize mission execution, build new missions

### MissionVisualizer
- **Purpose**: Visualize mission execution
- **Features**: Node graph, step states, connections, real-time updates
- **Behavior**: Display mission as flowchart, update in real-time

### StepDetailsPanel
- **Purpose**: Show step details
- **Features**: Step configuration, input/output, events created, retry options
- **Behavior**: Display step information, allow retry/skip

### EventLogPanel
- **Purpose**: Show mission event log
- **Features**: Chronological event list, event details, replay options
- **Behavior**: Display events created by mission, allow replay from any point

### MissionBuilder
- **Purpose**: Build new missions visually
- **Features**: Drag-and-drop steps, configuration panel, test mode
- **Behavior**: Drag steps to canvas, configure each step, test before deploy

### DebugPanel
- **Purpose**: Debug mission execution
- **Features**: Current state, variables, logs, error handling
- **Behavior**: Show mission execution state, allow pause/resume/retry

## Implementation Order

1. Create mission visualization endpoints
2. Build mission visualizer UI with node graph
3. Implement step details panel
4. Add event log panel
5. Create mission builder UI
6. Implement mission testing
7. Build debug panel
8. Add retry/skip functionality
9. Implement error handling visualization
10. Add mission deployment

## Success Criteria

- Missions visualize correctly as flowcharts
- Step states update in real-time
- Step details show accurate information
- Event log shows all mission events
- Mission builder allows drag-and-drop creation
- Mission testing executes without side effects
- Debug panel shows accurate mission state
- Retry/skip functionality works correctly
- Error handling is visualized clearly
- Mission deployment is successful

## Notes

- All mission visualizations are derived from constitutional events
- Mission builder creates mission designs that can be versioned
- Mission testing uses isolated execution environment
- Debug mode allows inspection without affecting production
- Retry/skip actions create constitutional events
- Mission visualizations are replayable from event log
- Mission builder supports template missions
- Debug logs are stored as constitutional events
