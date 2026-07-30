# Temporal Architectural Harvest

**Purpose:** Extract constitutional patterns from Temporal for PING

---

## Core Patterns

### 1. Deterministic Constraints

**Pattern:** Workflow code must be deterministic to support replay
- Any time workflow code is executed, it must make same API calls in same sequence given same input
- Commands generated must match existing Event History during replay
- Non-deterministic operations (API calls, LLM/AI, database queries) must be in Activities
- Activities execute outside replay path and are automatically retried

**Constitutional Rules:**
- Workflow code must be deterministic
- No non-deterministic operations in workflow code
- External interactions must be in Activities
- Same input + same history = same output

**PING Application:**
- Replay Service must be deterministic
- All external interactions must be outside replay path
- Event handlers must be pure functions
- No API calls, database queries, or random operations in replay logic

---

### 2. Replay

**Pattern:** Workflow Execution resumes by replaying Event History
- Replay is method by which workflow execution resumes making progress
- Commands generated are checked against existing Event History
- If failure occurs, workflow picks up where last recorded event occurred
- Worker Process supervises Command generation and maps to current Event History
- Commands batched and suspended when workflow cannot progress without Awaitable result

**Constitutional Rules:**
- Replay requires deterministic workflow code
- Commands must match Event History
- Workflow can only block on Awaitables provided by SDK
- Worker caches workflow state to avoid full replay

**PING Application:**
- Replay Service must support event history replay
- Commands must be checked against history
- Cache aggregate state to avoid full replay
- Suspend when awaiting external results

---

### 3. Commands and Awaitables

**Pattern:** Workflow issues Commands and waits on Awaitables
- Workflow Execution does two things: issue Commands, wait on Awaitables
- Commands generated whenever Workflow Function is executed
- Commands tell Temporal Service which Events to create in Event History
- Workflow Execution may only block on Awaitables provided through Temporal SDK API
- Worker Process batches Commands and suspends progress to send to Temporal Service

**Command-Producing APIs:**
- Starting or cancelling a Timer
- Scheduling or cancelling Activity Executions
- Starting or cancelling Child Workflow executions
- Signalling or cancelling signals to external Workflow Executions
- Scheduling or cancelling Nexus operations
- Ending the Workflow Execution (completing, failing, cancelling, continuing-as-new)
- `Patched` or `GetVersion` calls for Versioning
- Upserting Workflow Search Attributes
- Upserting Workflow Memos
- Running Side Effect or Mutable Side Effect

**Constitutional Rules:**
- Commands must not be reordered, added, or removed without versioning
- Workflow can only block on SDK-provided Awaitables
- Commands must match Event History during replay
- All external interactions must be Activities

**PING Application:**
- Event Service must support command generation
- All external operations must be Activities
- Commands must be checked against history
- No blocking on non-SDK awaitables

---

### 4. Event History

**Pattern:** Complete ordered log of everything that happened in workflow
- Event History is complete, ordered log of all workflow events
- Temporal keeps Event History to bring workflow back to exact state before pause
- Workflow code re-run from beginning, replays Event History step by step
- Uses recorded events instead of redoing work
- Activities run once, result recorded, reused during replay

**Constitutional Rules:**
- Event History is single source of truth
- Complete ordered log of all events
- Workflow state derived from replaying history
- Activities not executed again during replay

**PING Application:**
- Event Service must maintain complete Event History
- All state derived from replaying history
- Activities execute once, results recorded
- Replay uses recorded results, not recomputation

---

### 5. Workflow Cache

**Pattern:** In-memory LRU cache stores workflow state
- Workflow Cache is in-memory LRU cache maintained by Workers
- Stores state of Workflow Executions they have processed
- When Worker picks up Workflow Task, caches Workflow's state in memory
- Allows Worker to continue processing subsequent Tasks without fetching full Event History
- Closely tied to Sticky Execution
- If cached Workflow evicted, Worker must replay Event History to restore state

**Constitutional Rules:**
- Cache workflow state to avoid full replay
- LRU eviction requires replay to restore state
- Sticky Execution directs tasks to same Worker
- Cache is optimization, not source of truth

**PING Application:**
- Replay Service should cache aggregate state
- Use LRU cache for frequently accessed aggregates
- Cache eviction triggers replay from history
- Sticky execution for performance

---

### 6. Sticky Execution

**Pattern:** Direct future Workflow Tasks to same Worker that cached Workflow
- Temporal Service directs future Workflow Tasks to same Worker via dedicated "Sticky Queue"
- Allows Worker to use cached state instead of replaying from scratch
- Improves performance by avoiding full Event History fetch
- If Worker fails, tasks redistributed to other Workers (must replay)

**Constitutional Rules:**
- Sticky Execution for performance optimization
- Direct tasks to same Worker when possible
- Fallback to replay on Worker failure
- Not required for correctness

**PING Application:**
- Replay Service should support sticky execution
- Cache aggregate state per worker
- Direct replay requests to same worker when possible
- Fallback to full replay on cache miss

---

### 7. Non-Determinism Errors

**Pattern:** Commands don't match Event History during replay
- If generated Command doesn't match existing Event History, workflow fails with non-deterministic error
- Two reasons for non-determinism:
  1. Code changes to Workflow Definition in use by running Workflow Execution
  2. Intrinsic non-deterministic logic (inline random branching)
- Example: changing Timer to Activity would cause Command mismatch

**Constitutional Rules:**
- Non-determinism errors must be prevented
- Code changes require versioning
- No intrinsic non-deterministic logic in workflow code
- All non-deterministic operations in Activities

**PING Application:**
- Replay Service must detect non-determinism
- Version changes to event handlers
- No non-deterministic operations in replay logic
- All external operations in Activities

---

### 8. Workflow Versioning

**Pattern:** Safe code changes to running workflows
- Workflow Definition can change in very limited ways once Workflow Execution depends on it
- Two versioning methods:
  1. Worker Versioning - tag Workers and programmatically roll out versioned deployments
  2. Versioning with Patching - add branches to code tied to specific revisions
- Patching applies code change to new executions while avoiding disruptive changes to in-progress executions

**Patching Process:**
1. Patch in new code using `patched()` function
2. Run new patched code alongside old code
3. Remove old code and use `deprecatePatch()` to mark patch as deprecated
4. Once no open Workflow Executions of previous version, remove `deprecatePatch()`

**Constitutional Rules:**
- Code changes require versioning
- Use patching for safe deployments
- Deprecated patches serve as bridge
- Remove patches only after old executions complete

**PING Application:**
- Event Service must support versioning
- Use patching for event handler changes
- Support multiple versions of event handlers
- Deprecate old versions safely

---

### 9. Replay Testing

**Pattern:** Verify code compatibility before deployment
- Replay testing takes existing Event Histories and runs against current Workflow code
- Verifies current code is compatible with provided history
- Multiple points in development lifecycle:
  - During development: early feedback on compatibility
  - During pre-deployment validation: representative environment
  - At deployment time: production environment with new code
- Best way to verify code won't cause non-determinism errors

**Constitutional Rules:**
- Replay testing before deployment
- Verify compatibility with existing histories
- Test in representative environments
- Scrub PII from production histories

**PING Application:**
- Replay Service must support replay testing
- Test event handler changes against existing histories
- Verify determinism before deployment
- Scrub sensitive data from test histories

---

### 10. Activities

**Pattern:** External interactions execute outside replay path
- Activities handle everything that interacts with outside world
- Activities run once, result recorded in Event History
- During replay, result reused, not recomputed
- Activities not executed again during replay
- Automatically retried on failure

**Constitutional Rules:**
- All external interactions must be Activities
- Activities execute outside replay path
- Activity results recorded in Event History
- Activities automatically retried

**PING Application:**
- All external operations must be Activities
- API calls, database queries, external services
- Activity results recorded in events
- Retry on failure with exponential backoff

---

## Implementation Patterns

### Workflow Definition
- Must be deterministic
- Use only SDK-provided APIs for external interactions
- No API calls, database queries, random operations in workflow code
- Use Activities for all external interactions

### Command Generation
- Commands generated deterministically based on workflow code
- Commands must match Event History during replay
- Commands batched and sent to Temporal Service
- Worker supervises Command generation

### Event History
- Complete ordered log of all events
- Single source of truth for workflow state
- Used for replay and recovery
- Activities results recorded, not recomputed

### Caching Strategy
- Use LRU cache for workflow state
- Sticky Execution to direct tasks to same Worker
- Cache eviction triggers replay from history
- Cache is optimization, not source of truth

### Versioning Strategy
- Use patching for safe code changes
- Worker Versioning for deployment management
- Deprecate old versions after executions complete
- Remove patches only after retention period

### Testing Strategy
- Replay testing before deployment
- Test against representative histories
- Scrub PII from production data
- Verify determinism in CI/CD

---

## Anti-Patterns to Avoid

### 1. Non-Deterministic Workflow Code
- **Problem:** Causes replay failures, non-determinism errors
- **Solution:** Keep workflow code deterministic, use Activities for external interactions

### 2. Direct External Calls in Workflow
- **Problem:** Breaks replay, causes non-determinism
- **Solution:** All external interactions must be Activities

### 3. Skipping Versioning for Code Changes
- **Problem:** Causes non-determinism errors for running workflows
- **Solution:** Always use versioning for code changes

### 4. Ignoring Replay Testing
- **Problem:** Deployments break running workflows
- **Solution:** Always replay test before deployment

### 5. Relying on Cache for Correctness
- **Problem:** Cache eviction causes incorrect state
- **Solution:** Cache is optimization, Event History is source of truth

---

## PING-Specific Recommendations

### Replay Service
- Implement deterministic replay (pure event handlers)
- Support Event History replay
- Implement command generation and checking
- Support workflow caching for performance
- Implement sticky execution for performance

### Event Service
- Maintain complete Event History
- Support command generation
- Implement optimistic concurrency
- Support versioning for event handlers
- Implement replay testing

### Activity Service
- Execute all external interactions
- Automatically retry on failure
- Record activity results in events
- Support exponential backoff
- Support idempotent operations

### Workflow Service
- Implement workflow orchestration
- Support command generation
- Support versioning with patching
- Implement sticky execution
- Support workflow caching

---

## Performance Considerations

### Replay Performance
- Replay from beginning is expensive
- Workflow cache reduces replay cost
- Sticky execution improves performance
- Cache eviction triggers full replay

### Activity Performance
- Activities execute once, results reused
- Automatic retry on failure
- Exponential backoff for retries
- Activities execute outside replay path

### Caching Performance
- LRU cache for workflow state
- Cache hit avoids full replay
- Cache miss triggers replay from history
- Cache size must be tuned

---

## Monitoring and Observability

### Workflow Metrics
- Workflow Execution duration
- Replay rate
- Cache hit/miss rate
- Non-determinism error rate

### Activity Metrics
- Activity execution duration
- Activity retry rate
- Activity failure rate
- Activity throughput

### Command Metrics
- Command generation rate
- Command mismatch rate
- Command batch size
- Command latency

---

## Migration Path

### From In-Memory to Temporal
1. Implement deterministic workflow code
2. Move external interactions to Activities
3. Implement Event History persistence
4. Implement replay logic
5. Add workflow caching
6. Add versioning support

### From Simple Replay to Temporal
1. Implement Command generation
2. Implement Awaitable blocking
3. Add workflow caching
4. Add sticky execution
5. Add versioning with patching
6. Add replay testing

---

## References

- [Temporal Workflow Execution](https://docs.temporal.io/workflow-execution)
- [Temporal Workflow Definition](https://docs.temporal.io/workflow-definition)
- [Temporal Safe Deployments](https://docs.temporal.io/develop/safe-deployments)
- [Temporal Workflows](https://docs.temporal.io/workflows)
- [Temporal Versioning](https://docs.temporal.io/develop/typescript/workflows/versioning)
