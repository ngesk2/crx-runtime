/**
 * Event Repository
 * 
 * Constitutional repository for event history (replay support).
 * 
 * Handles repository_events table for event sourcing and replay.
 * 
 * PATCH_002: Moved to runtime/kernel/
 * This file is now a gateway shim that re-exports from kernel
 */

const { EventRepository: KernelEventRepository } = require('../runtime/kernel/event_repository');

// PATCH_002: Gateway shim - delegates to kernel implementation
class EventRepository extends KernelEventRepository {
  // No additional methods needed - pure delegation
}

module.exports = { EventRepository };
