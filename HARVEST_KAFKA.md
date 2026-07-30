# Kafka Architectural Harvest

**Purpose:** Extract constitutional patterns from Kafka for PING

---

## Core Patterns

### 1. Exactly-Once Semantics

**Pattern:** Each record processed exactly once, even under failures
- Kafka provides end-to-end exactly-once semantics for stream processing
- Guarantees that for each received record, its processed results will be reflected once
- Requires transactional writes across multiple partitions
- Idempotent producer removes possibility of duplicate messages
- Atomic commits on input topic offsets, state store updates, and output topic writes

**Constitutional Rules:**
- Exactly-once semantics for critical operations
- Idempotent operations to prevent duplicates
- Atomic commits across multiple operations
- No side effects outside Kafka transaction scope

**PING Application:**
- Event Service should support exactly-once semantics
- Idempotent event appends
- Atomic commits across event store and projections
- No side effects outside transaction scope

---

### 2. Ordering Guarantees

**Pattern:** Strong ordering within partitions, causal ordering across partitions
- Kafka provides strong ordering guarantees within a partition
- Records are ordered by offset within a partition
- No global ordering across partitions by default
- Ordering across partitions is non-deterministic
- Timestamps are insufficient for global ordering (clock skew, duplicate timestamps)

**Constitutional Rules:**
- Strong ordering within streams (partitions)
- Causal ordering across streams
- No global ordering guarantees by default
- Use explicit sequence numbers for global ordering

**PING Application:**
- Events ordered by timestamp within aggregate
- Causal relationships across aggregates
- No global event ordering required
- Use explicit sequence numbers if needed

---

### 3. Idempotent Producers

**Pattern:** Producer sends remove possibility of duplicate messages
- Idempotent producer can be performed many times without causing different effect
- Broker assigns each producer an ID and deduplicates messages using sequence number
- Resending message will not result in duplicate entries in log
- Log order is maintained
- Configure producer with `enable.idempotence=true`

**Constitutional Rules:**
- Idempotent operations for all critical writes
- Deduplication using sequence numbers
- Order preservation on retry
- No duplicate entries on retry

**PING Application:**
- Event Service should implement idempotent appends
- Use sequence numbers for deduplication
- Preserve event order on retry
- No duplicate events on retry

---

### 4. Transactional Writes

**Pattern:** Atomic writes across multiple partitions
- Producer can send batch of messages to multiple partitions atomically
- Either all messages in batch are eventually visible or none are visible
- Allows committing consumer offsets in same transaction as processed data
- Enables end-to-end exactly-once semantics
- Wraps all actions in single atomic transaction

**Constitutional Rules:**
- Atomic commits across multiple operations
- All-or-nothing visibility
- Offset commits in same transaction as data
- End-to-end exactly-once semantics

**PING Application:**
- Event Service should support transactional writes
- Atomic commits across event store and projections
- Offset commits in same transaction
- End-to-end exactly-once semantics

---

### 5. Stream Processing

**Pattern:** Unbounded, continuously updating data set
- Stream is ordered, replayable, fault-tolerant sequence of immutable data records
- Data record defined as key-value pair
- Supports exactly-once processing semantics
- Horizontal scaling while maintaining strong ordering guarantees
- No external dependencies other than Kafka

**Constitutional Rules:**
- Streams are ordered, replayable, fault-tolerant
- Immutable data records
- Exactly-once processing semantics
- Horizontal scaling with ordering guarantees

**PING Application:**
- Event Service should support stream processing
- Ordered, replayable, fault-tolerant events
- Immutable event records
- Exactly-once event processing

---

### 6. Offset Management

**Pattern:** Consumer controls position in log
- Each message in topic partition has sequential identifier called offset
- All replicas of partition have same log with same offsets
- Consumer controls its position in log
- On consumer failure, new consumer needs to know offset to start at
- Offset storage options: at-most-once, at-least-once, exactly-once

**Constitutional Rules:**
- Offset-based position tracking
- Consistent offsets across replicas
- Consumer controls position
- Offset commits for recovery

**PING Application:**
- Event Service should support offset management
- Offset-based position tracking
- Consumer controls position
- Offset commits for recovery

---

### 7. Determinism Challenges

**Pattern:** Non-determinism in stream processing
- Ordering across multiple input sources may be non-deterministic
- Ordering across multiple destination topics may be non-deterministic
- Aggregating or joining across multiple inputs introduces non-determinism
- Lookups against external DB or service updated out of band introduce non-determinism
- Failure and restart combined with non-determinism may result in incorrect results

**Constitutional Rules:**
- Non-determinism must be handled explicitly
- External lookups introduce non-determinism
- Aggregation across inputs introduces non-determinism
- Failure + non-determinism = incorrect results

**PING Application:**
- Replay Service must handle non-determinism
- External lookups must be idempotent
- Aggregation must be deterministic
- Failure recovery must handle non-determinism

---

### 8. Replay Challenges

**Pattern:** Guaranteeing true chronological order in replay
- Challenge isn't replay itself, but guaranteeing true chronological order
- Single mistake in sequencing can lead to corrupted data, race conditions
- Asynchronous processing lacks built-in internal ordering mechanism
- If events not sent in correct sequence, race conditions occur

**Constitutional Rules:**
- Replay must preserve chronological order
- Synchronous replay for determinism
- Global ordering requires explicit sequence numbers
- Timestamps insufficient for global ordering

**PING Application:**
- Replay Service must preserve chronological order
- Synchronous replay for determinism
- Use explicit sequence numbers for global ordering
- Timestamps insufficient for global ordering

---

### 9. Synchronous Replay Pattern

**Pattern:** Enforce synchronous behavior for determinism
- Send message to Kafka
- Wait for acknowledgment from target service that processing is complete
- Only then move to next message
- Guarantees order but imposes high cost on latency and reduces throughput

**Constitutional Rules:**
- Synchronous replay for determinism
- Wait for acknowledgment before next message
- Trade-off: order vs latency/throughput
- Use when determinism is critical

**PING Application:**
- Replay Service should support synchronous replay
- Wait for acknowledgment before next event
- Trade-off: determinism vs performance
- Use for critical replay operations

---

### 10. Global Offset

**Pattern:** Continuous global index across all topics
- Kafka lacks built-in continuous global index across all topics
- Create global offset using external sequence (e.g., PostgreSQL)
- Every message published requests new sequence number
- Sequence number embedded in Kafka header as `global_offset`
- Provides stable, source-of-truth order independent of machine clocks

**Constitutional Rules:**
- Global offset for cross-topic ordering
- External sequence for global ordering
- Sequence number embedded in message header
- Independent of machine clocks

**PING Application:**
- Event Service should support global offset
- External sequence for global ordering
- Sequence number in event metadata
- Independent of machine clocks

---

## Implementation Patterns

### Producer Configuration
- Enable idempotence for exactly-once per partition
- Use transactional writes for atomic commits across partitions
- Configure appropriate delivery semantics (at-most-once, at-least-once, exactly-once)
- Use sequence numbers for deduplication

### Consumer Configuration
- Configure offset management strategy
- Use exactly-once processing semantics
- Handle out-of-order data appropriately
- Implement graceful failure recovery

### Stream Processing
- Use Kafka Streams for stream processing
- Enable exactly-once semantics
- Implement stateful operations with state stores
- Handle aggregation and joins deterministically

### Replay Strategy
- Use synchronous replay for determinism
- Implement global offset for cross-topic ordering
- Handle overlapping ranges with last-wins resolution
- Preserve chronological order

### Transaction Strategy
- Use transactional writes for atomic commits
- Commit offsets in same transaction as data
- Wrap all actions in single atomic transaction
- Handle transaction failures gracefully

---

## Anti-Patterns to Avoid

### 1. Relying on Timestamps for Global Ordering
- **Problem:** Clock skew, duplicate timestamps, non-deterministic ordering
- **Solution:** Use explicit sequence numbers for global ordering

### 2. Asynchronous Replay for Critical Operations
- **Problem:** Race conditions, incorrect ordering, corrupted data
- **Solution:** Use synchronous replay for determinism

### 3. Non-Idempotent Operations
- **Problem:** Duplicates on retry, incorrect results
- **Solution:** Make all operations idempotent

### 4. Ignoring Non-Determinism
- **Problem:** Incorrect results on failure, data corruption
- **Solution:** Handle non-determinism explicitly

### 5. External Side Effects in Transactions
- **Problem:** Breaks exactly-once semantics, incorrect results
- **Solution:** No side effects outside transaction scope

---

## PING-Specific Recommendations

### Event Service
- Implement exactly-once semantics
- Support idempotent event appends
- Support transactional writes across multiple operations
- Implement offset management for recovery

### Replay Service
- Preserve chronological order during replay
- Support synchronous replay for determinism
- Implement global offset for cross-stream ordering
- Handle non-determinism explicitly

### Stream Processing
- Use stream processing for real-time event processing
- Enable exactly-once semantics
- Implement stateful operations with state stores
- Handle aggregation and joins deterministically

### Projection Service
- Use exactly-once semantics for projection updates
- Implement idempotent projection updates
- Commit offsets in same transaction as projection updates
- Handle projection failures gracefully

---

## Performance Considerations

### Throughput vs Latency
- Synchronous replay guarantees order but reduces throughput
- Asynchronous processing improves throughput but risks ordering
- Trade-off between determinism and performance
- Choose based on application requirements

### Exactly-Once Overhead
- Exactly-once semantics have higher overhead than at-least-once
- Transactional writes add latency
- Idempotent operations add overhead
- Balance correctness with performance

### Replay Performance
- Replay can be expensive for large date ranges
- Global offset adds overhead to each message
- Synchronous replay reduces throughput
- Optimize replay for common use cases

---

## Monitoring and Observability

### Producer Metrics
- Message send rate
- Duplicate message rate
- Transaction commit rate
- Transaction failure rate

### Consumer Metrics
- Message consumption rate
- Offset commit rate
- Offset lag
- Consumer lag

### Stream Processing Metrics
- Processing rate
- State store size
- Aggregation accuracy
- Join accuracy

---

## Migration Path

### From At-Least-Once to Exactly-Once
1. Enable idempotent producer
2. Implement transactional writes
3. Configure exactly-once processing
4. Update consumer offset management
5. Test exactly-once semantics

### From Simple Replay to Deterministic Replay
1. Implement synchronous replay
2. Add global offset for ordering
3. Handle overlapping ranges
4. Implement last-wins resolution
5. Test determinism guarantees

---

## References

- [KIP-129: Streams Exactly-Once Semantics](https://cwiki.apache.org/confluence/display/KAFKA/KIP-129%3A+Streams+Exactly-Once+Semantics)
- [Guaranteeing True Ordering in Kafka Replays](https://dev.to/tsofnat_m/how-to-guarantee-true-ordering-in-complex-kafka-replays-solving-the-determinism-nightmare-5d03)
- [Kafka Streams Core Concepts](https://kafka.apache.org/27/streams/core-concepts/)
- [Exactly-once Semantics in Apache Kafka](https://www.confluent.io/blog/exactly-once-semantics-are-possible-heres-how-apache-kafka-does-it/)
- [Message Delivery Guarantees for Apache Kafka](https://docs.confluent.io/kafka/design/delivery-semantics.html)
