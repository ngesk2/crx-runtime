/**
 * Temporal Sort
 * 
 * Pure deterministic sorting of normalized events.
 * Uses lexicographic sort_key ordering for reproducible results.
 */

import { NormalizedEvent } from "./temporal_types";

export class TemporalSort {
  /**
   * Sort events deterministically by sort_key.
   * Pure function - same input always produces same output.
   * Uses array spread to avoid mutating input array.
   */
  static sort(events: NormalizedEvent[]): NormalizedEvent[] {
    return [...events].sort((a, b) => {
      if (a.sort_key < b.sort_key) return -1;
      if (a.sort_key > b.sort_key) return 1;
      return 0;
    });
  }
}
