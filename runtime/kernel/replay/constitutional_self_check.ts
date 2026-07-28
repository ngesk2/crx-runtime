/**
 * CONSTITUTIONAL SELF-CHECK SYSTEM
 * 
 * Mandatory startup verification for constitutional replay kernel.
 * Failure MUST abort startup.
 * 
 * PHASE 9: Constitutional Closure
 * - Delegates to NodeSelfCheckAdapter for host-specific operations
 * - Delegates to ConstitutionalSelfCheckCore for pure verification
 */

import { NodeSelfCheckAdapter } from './node_self_check_adapter';

/**
 * Run constitutional self-check on startup
 * Delegates to Node adapter for host-specific operations
 */
export async function runConstitutionalSelfCheck(): Promise<void> {
  const adapter = new NodeSelfCheckAdapter();
  await adapter.runStartupVerification();
}
