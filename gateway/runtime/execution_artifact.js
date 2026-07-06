/**
 * Execution Artifact
 * 
 * PATCH_008: Moved to runtime/kernel/execution/
 * This file is now a gateway shim that re-exports from kernel
 */

const { ExecutionArtifact: KernelExecutionArtifact } = require('../../runtime/kernel/execution/execution_artifact');

// PATCH_008: Gateway shim - delegates to kernel implementation
class ExecutionArtifact extends KernelExecutionArtifact {
  // No additional methods needed - pure delegation
}

module.exports = { ExecutionArtifact };
