/**
 * Verification Authority
 * 
 * Phase 3.4 — Authority Purification
 * Phase 11.1.2 — Witness-Only Verification Model
 * 
 * Pure authority that returns contracts.
 * No infrastructure calls. No side effects.
 * 
 * Phase 11.1.2 Enhancement:
 * - VerificationAuthority consumes only witnesses
 * - VerificationAuthority never inspects authority outputs directly
 * - VerificationAuthority never validates raw artifacts
 * 
 * Pipeline:
 * ConstitutionalResult → WitnessAuthority → Witness → VerificationAuthority → VerificationResult
 * 
 * Contract:
 * - artifacts: [...]
 * - lineage: [...]
 * - witnesses: [...]
 * - certifications: [...]
 * - publications: [...]
 * - events: [...]
 * - infrastructure: [...]
 * 
 * PATCH_004: Moved to runtime/kernel/authorities/
 * This file is now a gateway shim that re-exports from kernel
 */

const { VerificationAuthority: KernelVerificationAuthority } = require('../runtime/kernel/authorities/verification_authority');

// PATCH_004: Gateway shim - delegates to kernel implementation
class VerificationAuthority extends KernelVerificationAuthority {
  // No additional methods needed - pure delegation
}

module.exports = { VerificationAuthority };
