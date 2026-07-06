/**
 * Temporal Normalizer
 * 
 * Pure functional temporal normalization without system clock dependency.
 * All transformations are deterministic and replay-safe.
 */

import { TemporalEvent, NormalizedEvent, SourceRank } from "./temporal_types";

export class TemporalNormalizer {
  /**
   * Normalize temporal events by adding normalized timestamps, sort keys, and source ranks.
   * Pure function - same input always produces same output.
   * Accepts readonly arrays to enforce pipeline immutability contract.
   */
  static normalize(events: readonly TemporalEvent[]): NormalizedEvent[] {
    return events.map((event, index) => ({
      ...event,
      normalized_timestamp: this.normalizeTimestamp(event.timestamp, event.source),
      sort_key: this.computeSortKey(event, index),
      source_rank: this.computeSourceRank(event.source)
    }));
  }

  /**
   * Normalize timestamp to string format with source-aware null expansion.
   * Null timestamps are expanded to source-aware epochs to prevent artificial ordering bias.
   * 
   * FLAW 1 FIX: Source-aware deterministic null expansion
   * - agent → high priority default epoch (ts::missing::agent)
   * - system → mid priority default epoch (ts::missing::system)
   * - external → low priority default epoch (ts::missing::external)
   */
  private static normalizeTimestamp(ts: string | null, source: string): string {
    if (!ts) return `ts::missing::${source}`;
    return ts;
  }

  /**
   * Compute source rank for deterministic ordering.
   * Lower rank = higher priority in ordering.
   * agent (0) < system (1) < external (2)
   */
  private static computeSourceRank(source: string): SourceRank {
    switch (source) {
      case "agent": return 0;
      case "system": return 1;
      case "external": return 2;
      default: return 2; // Default to lowest priority for unknown sources
    }
  }

  /**
   * Compute deterministic sort key for event ordering.
   * 
   * FLAW 2 FIX: Include event_id for collision prevention
   * FLAW 3 FIX: Integrate source domain segregation
   * 
   * Format: "source_rank::timestamp::sequence_hint::event_id"
   * This ensures:
   * - Source domain segregation (agent < system < external)
   - Total ordering stability across distributed ingestion
   - Collision prevention via event_id
   */
  private static computeSortKey(event: TemporalEvent, index: number): string {
    const sourceRank = this.computeSourceRank(event.source);
    const timestamp = event.timestamp ?? `ts::missing::${event.source}`;
    const sequence = event.sequence_hint ?? index;
    const eventId = event.event_id;
    return `${sourceRank}::${timestamp}::${sequence}::${eventId}`;
  }
}
