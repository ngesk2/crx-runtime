/**
 * Temporal Sort Tests
 * 
 * Determinism validation for temporal processing layer.
 * Verifies replay stability across multiple executions.
 * 
 * NOTE: Requires Jest test framework and @types/jest
 * Install with: npm install --save-dev jest @types/jest
 */

import { TemporalAuthority } from "./temporal_authority";
import { TemporalEvent } from "./temporal_types";

describe("Temporal Authority Determinism Tests", () => {
  /**
   * Test 1: Same input produces identical output across 10,000 runs
   */
  test("same input → same output (10,000 runs)", () => {
    const events: TemporalEvent[] = [
      { event_id: "1", timestamp: "2024-01-01T10:00:00Z", source: "agent" },
      { event_id: "2", timestamp: "2024-01-01T09:00:00Z", source: "system" },
      { event_id: "3", timestamp: "2024-01-01T11:00:00Z", source: "external" },
    ];

    const firstResult = TemporalAuthority.process(events);
    const firstOutput = JSON.stringify(firstResult);

    // Run 10,000 times to verify determinism
    for (let i = 0; i < 10000; i++) {
      const result = TemporalAuthority.process(events);
      const output = JSON.stringify(result);
      expect(output).toBe(firstOutput);
    }
  });

  /**
   * Test 2: Shuffled input produces identical ordering
   */
  test("shuffled input → identical ordering", () => {
    const baseEvents: TemporalEvent[] = [
      { event_id: "1", timestamp: "2024-01-01T10:00:00Z", source: "agent" },
      { event_id: "2", timestamp: "2024-01-01T09:00:00Z", source: "system" },
      { event_id: "3", timestamp: "2024-01-01T11:00:00Z", source: "external" },
      { event_id: "4", timestamp: "2024-01-01T08:00:00Z", source: "agent" },
    ];

    // Process in original order
    const orderedResult = TemporalAuthority.process(baseEvents);

    // Shuffle and process multiple times
    for (let i = 0; i < 100; i++) {
      const shuffled = [...baseEvents].sort(() => Math.random() - 0.5);
      const shuffledResult = TemporalAuthority.process(shuffled);
      
      // Verify same ordering
      expect(JSON.stringify(shuffledResult)).toBe(JSON.stringify(orderedResult));
    }
  });

  /**
   * Test 3: Null timestamps have source-aware stable behavior (FLAW 1 FIX)
   */
  test("null timestamps source-aware stable behavior", () => {
    const events: TemporalEvent[] = [
      { event_id: "1", timestamp: null, source: "agent" },
      { event_id: "2", timestamp: "2024-01-01T10:00:00Z", source: "system" },
      { event_id: "3", timestamp: null, sequence_hint: 1, source: "external" },
      { event_id: "4", timestamp: null, sequence_hint: 0, source: "agent" },
    ];

    const firstResult = TemporalAuthority.process(events);
    const firstOutput = JSON.stringify(firstResult);

    // Verify stability across 1,000 runs
    for (let i = 0; i < 1000; i++) {
      const result = TemporalAuthority.process(events);
      const output = JSON.stringify(result);
      expect(output).toBe(firstOutput);
    }

    // Verify source-aware ordering: agent (rank 0) < system (rank 1) < external (rank 2)
    expect(firstResult[0].event_id).toBe("1"); // agent, null timestamp
    expect(firstResult[1].event_id).toBe("4"); // agent, sequence_hint: 0
    expect(firstResult[2].event_id).toBe("2"); // system, has timestamp
    expect(firstResult[3].event_id).toBe("3"); // external, null timestamp
    
    // Verify source-aware null timestamp expansion
    expect(firstResult[0].normalized_timestamp).toBe("ts::missing::agent");
    expect(firstResult[3].normalized_timestamp).toBe("ts::missing::external");
  });

  /**
   * Test 4: Source domain segregation (FLAW 3 FIX)
   */
  test("source domain segregation in ordering", () => {
    const events: TemporalEvent[] = [
      { event_id: "1", timestamp: "2024-01-01T10:00:00Z", source: "external" },
      { event_id: "2", timestamp: "2024-01-01T10:00:00Z", source: "system" },
      { event_id: "3", timestamp: "2024-01-01T10:00:00Z", source: "agent" },
    ];

    const result = TemporalAuthority.process(events);

    // Verify source_rank ordering: agent (0) < system (1) < external (2)
    expect(result[0].event_id).toBe("3"); // agent, rank 0
    expect(result[1].event_id).toBe("2"); // system, rank 1
    expect(result[2].event_id).toBe("1"); // external, rank 2
    
    // Verify source_rank field is set correctly
    expect(result[0].source_rank).toBe(0);
    expect(result[1].source_rank).toBe(1);
    expect(result[2].source_rank).toBe(2);
  });

  /**
   * Test 5: Event_id prevents collisions (FLAW 2 FIX)
   */
  test("event_id prevents sort key collisions", () => {
    const events: TemporalEvent[] = [
      { event_id: "aaa", timestamp: "2024-01-01T10:00:00Z", source: "agent" },
      { event_id: "zzz", timestamp: "2024-01-01T10:00:00Z", source: "agent" },
      { event_id: "mmm", timestamp: "2024-01-01T10:00:00Z", source: "agent" },
    ];

    const result = TemporalAuthority.process(events);

    // Verify event_id provides deterministic tiebreaker
    expect(result[0].event_id).toBe("aaa");
    expect(result[1].event_id).toBe("mmm");
    expect(result[2].event_id).toBe("zzz");
    
    // Verify sort key includes event_id
    expect(result[0].sort_key).toContain("aaa");
    expect(result[1].sort_key).toContain("mmm");
    expect(result[2].sort_key).toContain("zzz");
  });

  /**
   * Test 6: Sequence hint deterministic override works
   */
  test("sequence_hint deterministic override works", () => {
    const events: TemporalEvent[] = [
      { event_id: "1", timestamp: "2024-01-01T10:00:00Z", sequence_hint: 5, source: "agent" },
      { event_id: "2", timestamp: "2024-01-01T10:00:00Z", sequence_hint: 1, source: "agent" },
      { event_id: "3", timestamp: "2024-01-01T10:00:00Z", sequence_hint: 3, source: "agent" },
    ];

    const result = TemporalAuthority.process(events);

    // Verify ordering by sequence_hint (same source, same timestamp)
    expect(result[0].event_id).toBe("2"); // sequence_hint: 1
    expect(result[1].event_id).toBe("3"); // sequence_hint: 3
    expect(result[2].event_id).toBe("1"); // sequence_hint: 5
  });

  /**
   * Test 7: Frozen array prevents mutation (FLAW 4 FIX)
   */
  test("frozen array prevents mutation", () => {
    const events: TemporalEvent[] = [
      { event_id: "1", timestamp: "2024-01-01T10:00:00Z", source: "agent" },
    ];

    const result = TemporalAuthority.process(events);

    // Verify array is frozen
    expect(Object.isFrozen(result)).toBe(true);

    // Verify mutation attempt fails
    expect(() => {
      (result as any).push({ event_id: "2", timestamp: "2024-01-01T11:00:00Z", source: "system" });
    }).toThrow();
  });

  /**
   * Test 8: Complete sort key structure verification
   */
  test("complete sort key structure (source_rank::timestamp::sequence::event_id)", () => {
    const events: TemporalEvent[] = [
      { event_id: "event-123", timestamp: "2024-01-01T10:00:00Z", sequence_hint: 5, source: "agent" },
    ];

    const result = TemporalAuthority.process(events);
    
    // Verify sort key format: "0::2024-01-01T10:00:00Z::5::event-123"
    expect(result[0].sort_key).toBe("0::2024-01-01T10:00:00Z::5::event-123");
    expect(result[0].source_rank).toBe(0);
    expect(result[0].normalized_timestamp).toBe("2024-01-01T10:00:00Z");
  });

  /**
   * Test 9: Empty input produces empty output
   */
  test("empty input produces empty output", () => {
    const result = TemporalAuthority.process([]);
    expect(result).toEqual([]);
    expect(Object.isFrozen(result)).toBe(true);
  });

  /**
   * Test 10: Single event processing
   */
  test("single event processing", () => {
    const events: TemporalEvent[] = [
      { event_id: "1", timestamp: "2024-01-01T10:00:00Z", source: "agent" },
    ];

    const result = TemporalAuthority.process(events);
    expect(result.length).toBe(1);
    expect(result[0].event_id).toBe("1");
    expect(result[0].normalized_timestamp).toBe("2024-01-01T10:00:00Z");
    expect(result[0].source_rank).toBe(0);
    expect(result[0].sort_key).toBe("0::2024-01-01T10:00:00Z::0::1");
  });

  /**
   * Test 11: Complex multi-source ordering
   */
  test("complex multi-source ordering", () => {
    const events: TemporalEvent[] = [
      { event_id: "ext-1", timestamp: "2024-01-01T08:00:00Z", source: "external" },
      { event_id: "sys-1", timestamp: "2024-01-01T12:00:00Z", source: "system" },
      { event_id: "agent-1", timestamp: "2024-01-01T15:00:00Z", source: "agent" },
      { event_id: "agent-2", timestamp: "2024-01-01T09:00:00Z", source: "agent" },
    ];

    const result = TemporalAuthority.process(events);

    // Ordering: agent (rank 0) first, then system (rank 1), then external (rank 2)
    // Within same source: ordered by timestamp, then event_id
    expect(result[0].event_id).toBe("agent-2"); // agent, 09:00
    expect(result[1].event_id).toBe("agent-1"); // agent, 15:00
    expect(result[2].event_id).toBe("sys-1"); // system, 12:00
    expect(result[3].event_id).toBe("ext-1"); // external, 08:00
  });
});
