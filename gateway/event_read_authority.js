/**
 * Event Read Authority
 * 
 * Constitutional read-side authority for event queries (CQRS).
 * 
 * Responsibilities:
 * - Query events by type, stream, correlation ID
 * - Get event statistics
 * - Provide read models for context endpoints
 * 
 * Write operations are handled by EventWriteAuthority.
 * 
 * PATCH_003: Moved to runtime/kernel/
 * This file is now a gateway shim that re-exports from kernel
 */

const { EventReadAuthority: KernelEventReadAuthority } = require('../runtime/kernel/event_read_authority');

// PATCH_003: Gateway shim - delegates to kernel implementation
class EventReadAuthority extends KernelEventReadAuthority {
  // No additional methods needed - pure delegation
}

module.exports = { EventReadAuthority };
