/**
 * Reducer Authority
 * 
 * Phase 36 Constitutional Refinement
 * 
 * Cryptographically binds reducer code to replay state.
 * 
 * Constitutional Constraint:
 * Different reducer code must NOT produce same event stream with different state.
 * 
 * Architecture:
 * ReducerAuthority
 *   ↓
 * ReducerHash (code fingerprint)
 *   ↓
 * ReducerWitness (execution proof)
 *   ↓
 * ReplayCertificate (state convergence proof)
 * 
 * Prevents constitutional drift where reducer mutations
 * silently change replay semantics.
 * 
 * PATCH_010: Moved to runtime/kernel/authorities/
 * This file is now a gateway shim that re-exports from kernel
 */

const { ReducerAuthority: KernelReducerAuthority, reducerAuthority: kernelReducerAuthority } = require('../runtime/kernel/authorities/reducer_authority');

// PATCH_010: Gateway shim - delegates to kernel implementation
class ReducerAuthority extends KernelReducerAuthority {
  // No additional methods needed - pure delegation
}

// Export both the class and the singleton from kernel
module.exports = {
  ReducerAuthority,
  reducerAuthority: kernelReducerAuthority
};
