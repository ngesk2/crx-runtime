/**
 * Temporal Types
 * 
 * Pure type definitions for temporal event processing.
 * No runtime dependencies, no external state.
 */

export type EventSource = "agent" | "system" | "external";

/**
 * Source rank for deterministic ordering.
 * Lower rank = higher priority in ordering.
 * agent < system < external
 */
export type SourceRank = 0 | 1 | 2;

export interface TemporalEvent {
  event_id: string;
  timestamp: string | null;
  sequence_hint?: number;
  source: EventSource;
  [key: string]: any; // Allow additional payload fields
}

export interface NormalizedEvent extends TemporalEvent {
  normalized_timestamp: string;
  sort_key: string;
  source_rank: SourceRank;
}
