/**
 * Standard Event Schema
 * 
 * Phase A1.4 — Constitutional Standard Event Schema
 * 
 * Every persisted event must conform to one immutable constitutional schema.
 * 
 * Minimum fields:
 * - event_id
 * - event_type
 * - aggregate_id
 * - aggregate_type
 * - aggregate_version
 * - sequence
 * - authority
 * - authority_version
 * - causation_id
 * - correlation_id
 * - timestamp
 * - payload_version
 * - payload
 * - witness_hash
 * - schema_hash
 * - canonical_hash
 * 
 * No authority may define custom envelopes.
 * 
 * PATCH_011: Moved to runtime/kernel/authorities/
 * This file is now a gateway shim that re-exports from kernel
 */

const { StandardEventSchema: KernelStandardEventSchema } = require('../runtime/kernel/authorities/standard_event_schema');

// PATCH_011: Gateway shim - delegates to kernel implementation
class StandardEventSchema extends KernelStandardEventSchema {
  // No additional methods needed - pure delegation
}

module.exports = { StandardEventSchema };
