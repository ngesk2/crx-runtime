/**
 * Temporal Authority Module
 * 
 * Pure deterministic temporal processing layer for CRX replay.
 * Plugs into replay at event ingestion boundary only.
 * 
 * Usage:
 *   import { TemporalAuthority } from "./temporal"
 *   const orderedEvents = TemporalAuthority.process(events)
 */

export { TemporalAuthority } from "./temporal_authority";
export { TemporalNormalizer } from "./temporal_normalizer";
export { TemporalSort } from "./temporal_sort";
export { TemporalEvent, NormalizedEvent, EventSource } from "./temporal_types";
