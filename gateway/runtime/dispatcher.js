/**
 * Dispatcher
 * 
 * PATCH_008: Moved to runtime/kernel/execution/
 * This file is now a gateway shim that re-exports from kernel
 */

const { Dispatcher: KernelDispatcher } = require('../../runtime/kernel/execution/dispatcher');

// PATCH_008: Gateway shim - delegates to kernel implementation
class Dispatcher extends KernelDispatcher {
  // No additional methods needed - pure delegation
}

module.exports = { Dispatcher };
