/**
 * Relationship
 * Represents a connection between Entities or other CIR elements.
 * This is a CIR payload type, not a canonical object.
 * Relationship should be wrapped in CanonicalObject<Relationship>.
 */

export interface Relationship {
  kind: string;
  source: EntityReference;
  target: EntityReference;
  properties: Record<string, unknown>;
}

export type EntityReference = string & { readonly __brand: unique symbol };
