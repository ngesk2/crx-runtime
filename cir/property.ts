/**
 * Property
 * Represents an attribute or characteristic of an Entity or Relationship.
 */

export interface Property {
  type: 'Property';
  id: string;
  kind: string;
  entity_id: string;
  value: unknown;
  property_type: string;
}
