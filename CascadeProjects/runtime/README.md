# Runtime Layer

This directory contains orchestration and execution logic.

## Runtime Philosophy

The runtime is the orchestration and execution layer, built on top of the constitutional kernel.

## Runtime Components

```
runtime/
├── orchestration/    # Event-driven orchestration
├── execution/        # Agent execution engine
├── scheduling/       # Cron and task scheduling
├── tool-routing/     # MCP/Composio tool routing
└── queues/           # Event queues and workers
```

## Event-Driven Architecture

Move away from manual command execution toward event-driven orchestration:

```
repo change → analysis event
markdown ingest → ontology extraction
replay divergence → repair workflow
failed invariant → constitutional alert
new schema → regeneration workflow
new evidence → mastery reevaluation
agent completion → audit append
Obsidian note change → ingestion event
```

Everything becomes append-only event transforms.

## Orchestration Flow

```
Event Created
 ↓
Queue
 ↓
Policy Evaluation
 ↓
Agent Assignment
 ↓
Execution
 ↓
Validation
 ↓
Replay Check
 ↓
Append Audit Event
```

## Scheduling

Safe autonomous tasks:
- Repo indexing
- Document parsing
- Schema generation
- Test generation
- Replay validation
- Lineage checks
- Vector refresh
- Dependency scanning
- Log summarization

NOT safe for autonomous execution:
- Self-modifying kernel logic
- Policy rewriting
- Unreviewed migrations

## Tool Routing

The MCP/Composio layer becomes capability routing fabric, equivalent to attention routing in transformers.

The runtime dynamically determines:
- What tool matters
- What context matters
- What policy matters
- What memory matters

Based on event context.
