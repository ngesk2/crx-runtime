/**
 * Fact
 * Represents an immutable truth derived from Evidence.
 * This is a CIR payload type, not a canonical object.
 * Fact should be wrapped in CanonicalObject<Fact>.
 */

export interface Fact {
  kind: string;
  subject: string;
  predicate: string;
  object: string;
  evidence: readonly EvidenceReference[];
}

export type EvidenceReference = string & { readonly __brand: unique symbol };
