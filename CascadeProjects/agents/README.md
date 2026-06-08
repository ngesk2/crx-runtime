# Constrained Execution Workers

This directory contains agent definitions for constrained execution workers.

## Agent Philosophy

Agents are execution transforms, NOT authorities.

## Agent Capabilities

Agents MAY:
- Analyze
- Classify
- Summarize
- Propose
- Validate
- Repair
- Generate diffs
- Generate tests
- Orchestrate tooling
- Create PRs
- Run replay validation

Agents MUST NOT:
- Mutate constitutional truth directly
- Bypass policy
- Fabricate lineage
- Overwrite history
- Bypass replay
- Invent ontology silently

## Agent Hierarchy

```
Kernel
 ↓
Policy Engine
 ↓
Planner Agent
 ↓
Execution Agents
 ↓
Verification Agents
 ↓
Replay Validator
 ↓
Audit Agent
 ↓
Repair Agent
```

**Critical**: Verification agents outrank execution agents. This prevents entropy explosion.

## Agent Types

### Constitutional Agents
- Audit Agent
- Policy Evaluation Agent
- Replay Validation Agent
- Constitutional Repair Agent

### Runtime Agents
- Refactor Agent
- Schema Generation Agent
- Test Generation Agent
- Repo Indexing Agent

### Domain Agents
- Education-specific agents
- Pedagogical agents
- Assessment agents

## Agent Execution

All agent execution follows:
```
Event
 → Policy
 → Assignment
 → Execution
 → Validation
 → Replay Check
 → Audit Event
```

## Agent Permissions

Each agent type has scoped permissions:
- **Refactor Agent**: modify implementation only
- **Schema Agent**: cannot alter constitutional contracts
- **Replay Agent**: read-only
- **Audit Agent**: append-only
- **Policy Agent**: propose but not merge
