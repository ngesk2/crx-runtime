# LangGraph Architectural Harvest

**Purpose:** Extract constitutional patterns from LangGraph for PING

---

## Core Patterns

### 1. Time Travel (Replay and Fork)

**Pattern:** Replay past executions and fork to explore alternative paths
- LangGraph supports time travel through checkpoints
- Replay: retry from a prior checkpoint
- Fork: branch from a prior checkpoint with modified state to explore alternative path
- Both work by resuming from a prior checkpoint
- Nodes before checkpoint not re-executed (results already saved)

**Replay Behavior:**
- Replay re-executes nodes after checkpoint
- Doesn't just read from cache
- LLM calls, API requests, and interrupts fire again
- May return different results
- Replaying from final checkpoint is no-op

**Fork Behavior:**
- Creates new branch from past checkpoint with modified state
- update_state creates new checkpoint that branches from specified point
- Original execution history remains intact
- Values applied using specified node's writers (including reducers)
- Execution resumes from node's successors

**Constitutional Rules:**
- Time travel for debugging and exploration
- Replay re-executes nodes (not cached)
- Fork creates new branch without modifying original
- LLM calls and API requests fire again on replay
- Interrupts re-triggered during time travel

**PING Application:**
- Replay Service should support time travel
- Replay re-executes events (not cached)
- Fork creates new branch without modifying original
- External calls fire again on replay
- Interrupts re-triggered during time travel

---

### 2. Checkpoint Log (Transaction Log)

**Pattern:** Append-only, durable, ordered checkpoint log
- Checkpoint log is genuine write-ahead-log (WAL) analog
- Append-only, durable, ordered
- Runtime reads to recover
- Every super-step writes a checkpoint
- Unique, monotonically increasing checkpoint ID (ordered like LSN)

**Checkpoint Structure:**
- `id`: unique, monotonically increasing checkpoint ID
- `ts`: ISO-8601 timestamp
- `channel_values`: actual state at that step
- `channel_versions`/`versions_seen`: per-channel version vectors
- `updated_channels`: what changed in this step

**Constitutional Rules:**
- Checkpoint log as transaction log
- Append-only, durable, ordered
- Monotonically increasing checkpoint ID
- Version vectors for deterministic control flow
- Authoritative state record

**PING Application:**
- Event Service should implement checkpoint log
- Append-only, durable, ordered event log
- Monotonically increasing event ID
- Version vectors for deterministic control flow
- Authoritative state record

---

### 3. Deterministic Replay

**Pattern:** Two distinct replay operations with different behavior
- Resume (durable execution/fault recovery): re-applies cached writes for completed nodes
- Completed nodes not re-executed (results read back from checkpoint)
- Deterministic by construction
- Powers "worker crashes, another worker picks up from last checkpoint"

**Replay/Fork (Time Travel):**
- Take prior checkpoint's config and invoke from it
- Re-executes nodes (doesn't just read from cache)
- LLM calls, API requests, interrupts fire again
- May return different results
- Fork same but via update_state to branch with modified state

**Constitutional Rules:**
- Resume: deterministic by construction (cached writes)
- Replay/Fork: re-executes nodes (may return different results)
- Resume for fault recovery
- Replay/Fork for time travel and debugging
- Tool invocations replayable in two senses

**PING Application:**
- Replay Service should support both resume and replay
- Resume: deterministic by construction (cached writes)
- Replay/Fork: re-executes events (may return different results)
- Resume for fault recovery
- Replay/Fork for time travel and debugging

---

### 4. Interrupt Handling

**Pattern:** Human-in-the-loop workflows with interrupts
- Interrupts always re-triggered during time travel
- Node containing interrupt re-executes
- interrupt() pauses for new Command(resume=...)
- Replay from before interrupt node: node re-executes and interrupt re-fires
- Replay from before interrupt then resume with new answer

**Interrupt Behavior:**
- Interrupts re-fire on replay
- Each replay creates fork with unique interrupt ID
- Stable across replays (identical results)
- Human-in-the-loop workflows
- Seamless human oversight

**Constitutional Rules:**
- Interrupts re-triggered during time travel
- Node containing interrupt re-executes
- interrupt() pauses for new resume
- Stable across replays
- Human-in-the-loop workflows

**PING Application:**
- Event Service should support interrupt handling
- Interrupts re-triggered during time travel
- Node containing interrupt re-executes
- interrupt() pauses for new resume
- Stable across replays

---

### 5. State Reducers

**Pattern:** Control how updates from nodes are applied
- Each key in state can have independent reducer function
- Controls how updates from nodes are applied
- If no reducer specified, all updates override key
- Reducers can append successive updates instead of overwriting
- For lists, concatenates new list with existing list

**Reducer Behavior:**
- Override by default
- Append with reducers
- Accumulate values for specific key
- Combine or accumulate values
- Custom update logic

**Constitutional Rules:**
- Independent reducer functions per key
- Override by default
- Append with reducers
- Accumulate values
- Custom update logic

**PING Application:**
- Event Service should implement state reducers
- Independent reducer functions per key
- Override by default
- Append with reducers
- Accumulate values

---

### 6. Parallel Execution

**Pattern:** Native support for parallel execution of nodes
- Parallel execution of nodes essential for speed
- Fan-out and fan-in mechanisms
- Standard edges and conditional edges
- Reducer add operation for combining values
- Concatenates new list with existing list for lists

**Parallel Execution Features:**
- Fan-out from Node A to B and C
- Fan-in to D
- Reducer add operation
- Combine or accumulate values
- Concatenate lists

**Constitutional Rules:**
- Parallel execution for performance
- Fan-out and fan-in mechanisms
- Reducer add operation
- Combine or accumulate values
- Concatenate lists

**PING Application:**
- Event Service should support parallel execution
- Fan-out and fan-in mechanisms
- Reducer add operation
- Combine or accumulate values
- Concatenate lists

---

### 7. Durable Execution

**Pattern:** Build agents that persist through failures
- State checkpointed between execution of nodes
- Automatically resuming from exactly where left off
- Long-running, stateful agents
- Persist through failures
- Extended periods of execution

**Durable Execution Features:**
- Checkpoint between node execution
- Automatic resume from checkpoint
- Long-running agents
- Persist through failures
- Extended execution periods

**Constitutional Rules:**
- Checkpoint between node execution
- Automatic resume from checkpoint
- Long-running agents
- Persist through failures
- Extended execution periods

**PING Application:**
- Event Service should support durable execution
- Checkpoint between event execution
- Automatic resume from checkpoint
- Long-running event processing
- Persist through failures

---

### 8. Version Vectors

**Pattern:** Per-channel version vectors for deterministic control flow
- channel_versions/versions_seen: per-channel version vectors
- Record exactly which data each node had already observed
- Makes replay deterministic about control flow
- Ordered chain of checkpoints for thread_id
- Transaction log for agent systems

**Version Vector Features:**
- Per-channel version vectors
- Record data observed by each node
- Deterministic control flow
- Ordered chain of checkpoints
- Transaction log

**Constitutional Rules:**
- Per-channel version vectors
- Record data observed by each node
- Deterministic control flow
- Ordered chain of checkpoints
- Transaction log

**PING Application:**
- Event Service should implement version vectors
- Per-channel version vectors
- Record data observed by each node
- Deterministic control flow
- Ordered chain of events

---

### 9. Retry Policies

**Pattern:** Custom retry policies for nodes
- Custom retry policy for API calls, database queries, LLM calls
- RetryPolicy named tuple object
- Error handler function runs on error
- Configured per node
- Configurable retry behavior

**Retry Policy Features:**
- Custom retry policies
- API calls, database queries, LLM calls
- RetryPolicy named tuple
- Error handler function
- Configurable per node

**Constitutional Rules:**
- Custom retry policies
- Error handling
- Configurable per node
- Retry on failure
- Configurable behavior

**PING Application:**
- Event Service should implement retry policies
- Custom retry policies
- Error handling
- Configurable per node
- Retry on failure

---

### 10. Subgraph Handling

**Pattern:** Support for subgraphs with checkpointing
- Subgraph replay loads accumulated state then resume
- Two parent invocations, then replay from before subgraph
- Subgraph checkpoint loads accumulated state
- Resume after replay
- Hierarchical graph structures

**Subgraph Features:**
- Subgraph checkpointing
- Load accumulated state
- Replay from before subgraph
- Resume after replay
- Hierarchical structures

**Constitutional Rules:**
- Subgraph checkpointing
- Load accumulated state
- Replay from before subgraph
- Resume after replay
- Hierarchical structures

**PING Application:**
- Event Service should support subgraph handling
- Subgraph checkpointing
- Load accumulated state
- Replay from before subgraph
- Resume after replay

---

## Implementation Patterns

### Time Travel
- Replay from prior checkpoint
- Fork from prior checkpoint with modified state
- Nodes before checkpoint not re-executed
- Nodes after checkpoint re-execute
- Interrupts re-triggered during time travel

### Checkpoint Log
- Append-only, durable, ordered
- Monotonically increasing checkpoint ID
- Per-channel version vectors
- Authoritative state record
- Transaction log analog

### Deterministic Replay
- Resume: cached writes (deterministic)
- Replay/Fork: re-executes nodes (may differ)
- Resume for fault recovery
- Replay/Fork for time travel
- Tool invocations replayable in two senses

---

## Anti-Patterns to Avoid

### 1. Non-Idempotent Tools in Replay
- **Problem:** Fork re-executes side-effecting tools (charges credit card twice)
- **Solution:** Wrap non-idempotent tools, fork only up to point before side effect

### 2. Ignoring Version Vectors
- **Problem:** Non-deterministic control flow
- **Solution:** Use per-channel version vectors for deterministic control flow

### 3. Not Using Reducers
- **Problem:** Cannot accumulate values, only override
- **Solution:** Use reducers to control how updates are applied

### 4. Single-Threaded Execution
- **Problem:** Poor performance
- **Solution:** Use parallel execution with fan-out/fan-in

### 5. No Checkpointing
- **Problem:** Cannot recover from failures
- **Solution:** Checkpoint between node execution for durable execution

---

## PING-Specific Recommendations

### Event Service
- Implement checkpoint log (transaction log)
- Support time travel (replay and fork)
- Implement version vectors
- Support interrupt handling
- Implement state reducers

### Replay Service
- Support both resume and replay
- Resume: deterministic by construction
- Replay/Fork: re-executes events
- Support interrupt handling
- Support subgraph handling

### Durable Execution Service
- Checkpoint between event execution
- Automatic resume from checkpoint
- Long-running event processing
- Persist through failures
- Extended execution periods

### Parallel Execution Service
- Support parallel event execution
- Fan-out and fan-in mechanisms
- Reducer add operation
- Combine or accumulate values
- Concatenate lists

---

## Performance Considerations

### Time Travel Performance
- Replay re-executes nodes (not cached)
- Fork creates new branch
- Interrupts re-triggered
- LLM calls and API requests fire again
- May return different results

### Checkpoint Log Performance
- Append-only, durable, ordered
- Monotonically increasing checkpoint ID
- Per-channel version vectors
- Authoritative state record
- Transaction log analog

### Parallel Execution Performance
- Parallel execution for speed
- Fan-out and fan-in mechanisms
- Reducer add operation
- Combine or accumulate values
- Concatenate lists

---

## Monitoring and Observability

### Checkpoint Metrics
- Checkpoint creation rate
- Checkpoint size
- Checkpoint ID sequence
- Version vector size
- Channel update rate

### Replay Metrics
- Replay rate
- Fork rate
- Interrupt rate
- Re-execution rate
- Determinism rate

### Execution Metrics
- Node execution rate
- Parallel execution rate
- Retry rate
- Error rate
- Durable execution rate

---

## Migration Path

### From Simple Execution to Durable Execution
1. Implement checkpoint log
2. Checkpoint between node execution
3. Implement automatic resume
4. Support long-running agents
5. Persist through failures

### From Simple Replay to Time Travel
1. Implement replay from prior checkpoint
2. Implement fork with modified state
3. Support interrupt handling
4. Implement version vectors
5. Support subgraph handling

---

## References

- [Time Travel](https://docs.langchain.com/oss/python/langgraph/use-time-travel)
- [Transaction Log](https://forum.langchain.com/t/what-is-the-equivalent-of-a-transaction-log-for-agent-systems/3986)
- [Time Travel Tests](https://github.com/langchain-ai/langgraph/blob/b674dd46/libs/langgraph/tests/test_time_travel.py)
- [LangGraph README](https://github.com/langchain-ai/langgraph)
- [Graph API](https://docs.langchain.com/oss/python/langgraph/use-graph-api)
