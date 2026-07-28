/**
 * ADMISSION POLICY
 * 
 * Constitutional admission boundary for event promotion.
 * 
 * Purpose:
 * - Explicit constitutional admission boundary
 * - Single admission authority
 * - Future: Constitutional legality rules
 * - Current: AllowAllAdmissionPolicy (minimal implementation)
 * 
 * Constitutional meaning:
 * - Policy → AllowAll → appendEvent
 * - Future: Policy → Legality Rules → appendEvent
 * 
 * No replay changes.
 * No witness changes.
 * No hash changes.
 * No invariant changes.
 * No serialization changes.
 * No authority changes.
 */

import { CanonicalEventEnvelope } from './canonical_event_envelope';

export interface AdmissionPolicy {
  admit(event: CanonicalEventEnvelope): void;
}

/**
 * AllowAllAdmissionPolicy
 * 
 * Minimal admission policy implementation.
 * 
 * Constitutional rule:
 * - Currently allows all events
 * - Future: Constitutional legality rules
 * 
 * This is the single admission authority.
 */
export class AllowAllAdmissionPolicy implements AdmissionPolicy {
  admit(_event: CanonicalEventEnvelope): void {
    // intentionally empty - allows all events
    // future: constitutional legality rules
  }
}
