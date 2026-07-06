/**
 * LEGACY BOOTSTRAP - REMOVED
 * 
 * This file contained a legacy execution path that directly constructed
 * constitutional components, bypassing the canonical bootstrap and OmniRouter.
 * 
 * Constitutional Constraint:
 * All execution must pass through:
 * Gateway → GatewayToKernelAdapter → Kernel → OmniRouter → ConstitutionalExecutionPipeline
 * 
 * Use the canonical bootstrap instead:
 * - runtime/kernel/omni_router_bootstrap.js (constitutional kernel bootstrap)
 * - gateway/bootstrap/index.js (gateway DI container bootstrap)
 * 
 * This file is kept for reference only. Do not use it.
 * 
 * REMOVED: 2026-07-05 - Final Constitutional Surgical Audit
 */

console.error('ERROR: This legacy bootstrap has been removed.');
console.error('Use the canonical bootstrap instead:');
console.error('  - runtime/kernel/omni_router_bootstrap.js (constitutional kernel)');
console.error('  - gateway/bootstrap/index.js (gateway DI container)');
process.exit(1);
