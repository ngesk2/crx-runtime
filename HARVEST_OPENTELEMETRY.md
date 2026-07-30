# OpenTelemetry Architectural Harvest

**Purpose:** Extract constitutional patterns from OpenTelemetry for PING

---

## Core Patterns

### 1. Deterministic ID Generation

**Pattern:** Predictable trace and span IDs for testing and replay
- Random trace and span IDs make assertions difficult
- Cannot compare expected trace output against actual output when IDs change on every run
- Deterministic ID generator produces predictable sequence of IDs
- Makes test assertions stable and trace replay scenarios reproducible
- IDs generated from sequential counters (e.g., 00000000000000000000000000000001, 00000000000000000000000000000002)

**Use Cases:**
- Unit testing: Assert on exact span attributes including IDs
- Snapshot testing: Compare trace output against golden files
- Trace replay: Re-import exported traces with consistent IDs
- Documentation: Generate example traces with readable IDs
- Debugging: Produce specific ID patterns easy to spot in logs

**Constitutional Rules:**
- Deterministic ID generation for replay
- Sequential counters for ID generation
- Same input = same IDs
- IDs must be reproducible across runs

**PING Application:**
- Event Service should use deterministic event IDs
- Sequential counters for event ID generation
- Reproducible event IDs across replays
- Deterministic IDs for testing and debugging

---

### 2. Span Context Propagation

**Pattern:** SpanContext represents portion of Span which propagates
- SpanContext represents portion of Span which propagates across process boundaries
- SpanContexts propagate alongside of Span
- MUST return non-recording Span with SpanContext in parent Context
- If parent Context contains no Span, return empty non-recording Span
- SpanContext provided by configured Propagator propagates through to child spans

**Constitutional Rules:**
- Context propagation across boundaries
- Non-recording spans for propagation
- Empty spans for missing context
- Propagator injects/extracts context

**PING Application:**
- Event Service should support context propagation
- Event context propagates across services
- Non-recording events for context propagation
- Propagator injects/extracts event context

---

### 3. Replay-Safe Tracing

**Pattern:** Suppress span emission during workflow replay
- Workflows must be deterministic during replay
- Standard tracing uses system time or random UUIDs, breaking determinism
- Replay-safe tracing uses workflow-safe random generator
- Uses workflow.now() for timestamps
- Uses workflow.new_random() for deterministic Trace and Span IDs
- Suppresses span emission during workflow replay to prevent duplicate telemetry

**Constitutional Rules:**
- Replay-safe tracing for deterministic systems
- Use deterministic time sources
- Use deterministic random generators
- Suppress emission during replay
- Prevent duplicate telemetry

**PING Application:**
- Replay Service should use replay-safe tracing
- Deterministic time sources for replay
- Deterministic random generators for replay
- Suppress event emission during replay
- Prevent duplicate telemetry

---

### 4. Span Hierarchy

**Pattern:** Spans form tree structure representing causality
- Span represents single operation within trace
- Spans can be nested to form trace tree
- Each trace contains root span describing entire operation
- Root span has optional sub-spans for sub-operations
- Each span has zero or one parent span and zero or more child spans
- Child spans represent causally related operations
- Tree of related spans comprises trace
- Root span has no parent, is shared ancestor of all other spans in trace

**Constitutional Rules:**
- Spans form tree structure
- Root span describes entire operation
- Child spans represent sub-operations
- Causal relationships through parent-child
- Single root span per trace

**PING Application:**
- Events form tree structure
- Root event describes entire operation
- Child events represent sub-operations
- Causal relationships through parent-child
- Single root event per trace

---

### 5. Trace ID as Key

**Pattern:** Trace ID ties captured data to trace
- Capture file is dead bytes without way to find it
- OTel trace ID is key to find capture
- In record mode, every span gets index matching corresponding span attribute
- Span at index 7 in trace lines up with row 7 in capture file
- Capture is ordered list of step rows
- Each row gets integer index matching corresponding span attribute

**Constitutional Rules:**
- Trace ID as key for captured data
- Ordered list of steps indexed by span
- Span index matches capture row index
- Trace ID enables capture lookup
- Deterministic indexing for replay

**PING Application:**
- Event ID as key for captured data
- Ordered list of events indexed by event
- Event index matches capture row index
- Event ID enables capture lookup
- Deterministic indexing for replay

---

### 6. Side-Effect Capture

**Pattern:** Capture all side effects for deterministic replay
- Replay has to fake all side effects
- Useful capture has six categories of side-effect
- Every side-effect keyed to step index inside agent loop
- Skip any category and replay drifts
- Categories: Retries, Time, RNG, Model, Tools, External calls

**Side-Effect Categories:**
- Retries: Each retry attempt with delay to reproduce backoff sequence
- Time: Wall-clock values for deterministic timing
- RNG: Random values for deterministic randomness
- Model: Model calls with prompts and responses
- Tools: Tool calls with arguments and results
- External calls: External service calls with requests and responses

**Constitutional Rules:**
- Capture all side effects
- Key to step index
- Ordered list for sequential replay
- Complete capture for deterministic replay
- No side-effect skipping

**PING Application:**
- Event Service should capture all side effects
- Key to event index
- Ordered list for sequential replay
- Complete capture for deterministic replay
- No side-effect skipping

---

### 7. Divergence Checking

**Pattern:** Compare current run against captured run
- Capture stores request kwargs and response
- In replay mode, want divergence check
- If prompt today doesn't match original run prompt, want to know before response
- Harness can compare two and fail loudly or log divergence span
- For tool calls, divergence check on tool name is early-warning system
- If original run called refund_order at step 12 and replay tries cancel_subscription, harness fails fast

**Constitutional Rules:**
- Divergence checking for replay
- Compare current run against captured run
- Fail fast on divergence
- Early warning for tool call divergence
- Log divergence for debugging

**PING Application:**
- Replay Service should implement divergence checking
- Compare current replay against original run
- Fail fast on divergence
- Early warning for event divergence
- Log divergence for debugging

---

### 8. Context Propagation Across Boundaries

**Pattern:** Proper trace context propagation across operation boundaries
- Context propagation interceptor for propagating trace/span IDs
- Proper trace context propagation across all operation boundaries
- ID seeding ensures OTEL IDs match deterministic IDs
- Parenting ensures activity spans correctly parented to workflow span
- Even though they execute on different workers

**Constitutional Rules:**
- Context propagation across boundaries
- ID seeding for deterministic IDs
- Proper parent-child relationships
- Cross-worker context propagation
- Boundary-aware context propagation

**PING Application:**
- Event Service should support context propagation across boundaries
- ID seeding for deterministic event IDs
- Proper parent-child event relationships
- Cross-service event context propagation
- Boundary-aware event context propagation

---

### 9. Read-Only Mode Detection

**Pattern:** Handle read-only operations safely
- Read-only mode detection for queries and update validators
- Handle tracing safely in read-only mode
- Update validators not technically during replay
- Use is_read_only instead of is_replaying
- Read-only operations need special handling

**Constitutional Rules:**
- Read-only mode detection
- Safe tracing in read-only mode
- Special handling for queries
- Special handling for validators
- Distinguish replay from read-only

**PING Application:**
- Event Service should detect read-only mode
- Safe event processing in read-only mode
- Special handling for queries
- Special handling for validators
- Distinguish replay from read-only

---

### 10. Span Export Suppression

**Pattern:** Skip span export during workflow replay
- Replay-aware processing skips span export during workflow replay
- Prevent duplicate telemetry
- TemporalSpanProcessor checks is_replaying_history_events()
- Only allows span export when not replaying
- Prevents duplicate telemetry from replay

**Constitutional Rules:**
- Suppress export during replay
- Prevent duplicate telemetry
- Check replay status before export
- Only export when not replaying
- Replay-aware processing

**PING Application:**
- Event Service should suppress export during replay
- Prevent duplicate event telemetry
- Check replay status before export
- Only export when not replaying
- Replay-aware event processing

---

## Implementation Patterns

### ID Generation
- Use deterministic ID generator for testing and replay
- Sequential counters for trace and span IDs
- Reset counters between tests
- Same input = same IDs

### Context Propagation
- Use SpanContext for propagation
- Non-recording spans for propagation
- Propagator injects/extracts context
- Cross-boundary context propagation

### Replay Safety
- Use deterministic time sources
- Use deterministic random generators
- Suppress emission during replay
- Prevent duplicate telemetry

### Span Hierarchy
- Root span describes entire operation
- Child spans represent sub-operations
- Causal relationships through parent-child
- Single root span per trace

### Side-Effect Capture
- Capture all side effects
- Key to step index
- Ordered list for sequential replay
- Complete capture for deterministic replay

---

## Anti-Patterns to Avoid

### 1. Random ID Generation
- **Problem:** Non-deterministic IDs break replay
- **Solution:** Use deterministic ID generator with sequential counters

### 2. System Time in Replay
- **Problem:** Non-deterministic timing breaks replay
- **Solution:** Use deterministic time sources (workflow.now())

### 3. Export During Replay
- **Problem:** Duplicate telemetry from replay
- **Solution:** Suppress export during replay

### 4. Missing Side-Effect Capture
- **Problem:** Replay drifts from original run
- **Solution:** Capture all side effects

### 5. Skipping Divergence Checking
- **Problem:** Silent failures, incorrect replay
- **Solution:** Implement divergence checking

---

## PING-Specific Recommendations

### Event Service
- Use deterministic event ID generation
- Support context propagation across boundaries
- Implement replay-safe event processing
- Suppress event export during replay
- Capture all side effects

### Replay Service
- Use deterministic time sources
- Use deterministic random generators
- Implement divergence checking
- Suppress emission during replay
- Prevent duplicate telemetry

### Tracing Service
- Implement span hierarchy for events
- Use event ID as key for captured data
- Support context propagation across boundaries
- Implement read-only mode detection
- Replay-aware span processing

### Capture Service
- Capture all side effects
- Key to event index
- Ordered list for sequential replay
- Implement divergence checking
- Store request and response data

---

## Performance Considerations

### ID Generation Overhead
- Deterministic ID generation has minimal overhead
- Sequential counters are fast
- Reset counters between tests
- Same input = same IDs

### Context Propagation Overhead
- Context propagation has minimal overhead
- Non-recording spans for propagation
- Propagator injects/extracts context
- Cross-boundary context propagation

### Replay Safety Overhead
- Deterministic time sources have minimal overhead
- Deterministic random generators have minimal overhead
- Suppressing export saves resources
- Prevents duplicate telemetry

---

## Monitoring and Observability

### Tracing Metrics
- Span creation rate
- Span export rate
- Context propagation rate
- Replay suppression rate

### Replay Metrics
- Replay rate
- Divergence rate
- Side-effect capture rate
- Replay success rate

### ID Generation Metrics
- ID generation rate
- ID collision rate
- Counter reset rate
- Deterministic ID verification rate

---

## Migration Path

### From Random IDs to Deterministic IDs
1. Implement deterministic ID generator
2. Use sequential counters for IDs
3. Reset counters between tests
4. Verify deterministic ID generation
5. Update tests to use deterministic IDs

### From Standard Tracing to Replay-Safe Tracing
1. Implement deterministic time sources
2. Implement deterministic random generators
3. Suppress export during replay
4. Implement divergence checking
5. Verify replay safety

---

## References

- [Deterministic Span ID Generator](https://oneuptime.com/blog/post/2026-02-06-deterministic-span-id-generator-testing/view)
- [OpenTelemetry Trace API](https://opentelemetry.io/docs/specs/otel/trace/api/)
- [Stateful Agent Replay](https://dev.to/gabrielanhaia/stateful-agent-replay-deterministic-reruns-from-a-captured-trace-e9d)
- [Temporal OpenTelemetry v2 Integration](https://github.com/temporalio/sdk-python/pull/1314)
- [OpenAI Agent Tracing](https://deepwiki.com/temporalio/sdk-python/11.6-openai-agent-tracing)
