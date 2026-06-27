/**
 * REPLAY EXECUTION LIMITS
 * 
 * Deterministic execution limits to prevent:
 * - Cyclic lineage explosions
 * - Replay bombs
 * - Gigantic witness graphs
 * - Pathological attestations
 * 
 * All limit failures become EXECUTION_LIMIT_EXCEEDED
 */

export const REPLAY_LIMITS = {
  MAX_EVENTS: 100000,
  MAX_LINEAGE_DEPTH: 1024,
  MAX_WITNESS_NODES: 1000000,
  MAX_PAYLOAD_BYTES: 1048576, // 1MB
  MAX_ARTIFACTS: 100000,
  MAX_INVARIANT_VIOLATIONS: 1000,
  MAX_EVENT_PAYLOAD_SIZE: 1048576 // 1MB
} as const;
