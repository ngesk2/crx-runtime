/**
 * Projection Registry
 * 
 * PATCH_008: Moved to runtime/kernel/execution/
 * This file is now a gateway shim that re-exports from kernel
 */

const { ProjectionRegistry: KernelProjectionRegistry } = require('../../runtime/kernel/execution/projection_registry');

// PATCH_008: Gateway shim - delegates to kernel implementation
class ProjectionRegistry extends KernelProjectionRegistry {
  // No additional methods needed - pure delegation
}

module.exports = { ProjectionRegistry };
