/**
 * Reducer Registry
 * 
 * PATCH_008: Moved to runtime/kernel/execution/
 * This file is now a gateway shim that re-exports from kernel
 */

const { ReducerRegistry: KernelReducerRegistry } = require('../../runtime/kernel/execution/reducer_registry');

// PATCH_008: Gateway shim - delegates to kernel implementation
class ReducerRegistry extends KernelReducerRegistry {
  // No additional methods needed - pure delegation
}

module.exports = { ReducerRegistry };
