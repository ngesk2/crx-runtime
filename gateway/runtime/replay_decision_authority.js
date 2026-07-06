/**
 * Replay Decision Authority
 * 
 * PATCH_008: Moved to runtime/kernel/execution/
 * This file is now a gateway shim that re-exports from kernel
 */

const { ReplayDecisionAuthority: KernelReplayDecisionAuthority } = require('../../runtime/kernel/execution/replay_decision_authority');

// PATCH_008: Gateway shim - delegates to kernel implementation
class ReplayDecisionAuthority extends KernelReplayDecisionAuthority {
  // No additional methods needed - pure delegation
}

module.exports = { ReplayDecisionAuthority };
