/**
 * Constitutional Execution Pipeline
 * 
 * PATCH_008: Moved to runtime/kernel/execution/
 * This file is now a gateway shim that re-exports from kernel
 */

const { ConstitutionalExecutionPipeline: KernelConstitutionalExecutionPipeline } = require('../../runtime/kernel/execution/constitutional_execution_pipeline');

// PATCH_008: Gateway shim - delegates to kernel implementation
class ConstitutionalExecutionPipeline extends KernelConstitutionalExecutionPipeline {
  // No additional methods needed - pure delegation
}

module.exports = { ConstitutionalExecutionPipeline };
