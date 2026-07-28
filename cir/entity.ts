/**
 * Entity
 * Represents a distinct, identifiable object in the system.
 * This is a CIR payload type, not a canonical object.
 * Entity should be wrapped in CanonicalObject<Entity>.
 */

export interface Entity {
  kind: string;
  properties: Record<string, unknown>;
  relationships: readonly EntityReference[];
}

export type EntityReference = string & { readonly __brand: unique symbol };
