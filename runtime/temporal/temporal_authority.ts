/**
 * Temporal Authority
 * 
 * Pure composition layer for temporal event processing.
 * Single entry point for deterministic temporal normalization and ordering.
 * Plugs into CRX replay at event ingestion boundary only.
 * 
 * FLAW 4 FIX: Enforce pipeline immutability contract throughout entire pipeline,
 * not just at final output.
 */

import { TemporalEvent, NormalizedEvent } from "./temporal_types";
import { TemporalNormalizer } from "./temporal_normalizer";
import { TemporalSort } from "./temporal_sort";

export class TemporalAuthority {
  /**
   * Process temporal events through normalization and sorting pipeline.
   * Pure function - same input always produces same output.
   * 
   * FLAW 4 FIX: Pipeline immutability contract
   * - Input array is frozen to prevent upstream mutation
   * - All intermediate operations use immutable patterns
   * - Output array is frozen to prevent downstream mutation
   * 
   * Integration point: Call this at CRX replay ingestion boundary.
   * 
   * @param events - Raw temporal events from agents/system/external sources
   * @returns Frozen, deterministically sorted normalized events
   */
  static process(events: TemporalEvent[]): readonly NormalizedEvent[] {
    // Freeze input to prevent upstream mutation
    const frozenInput = Object.freeze([...events]);
    
    const normalized = TemporalNormalizer.normalize(frozenInput);
    const ordered = TemporalSort.sort(normalized);
    
    // Freeze output to prevent downstream mutation
    return Object.freeze(ordered);
  }
}
