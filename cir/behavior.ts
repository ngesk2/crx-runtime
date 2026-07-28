/**
 * Behavior
 * Represents the dynamic behavior or logic of an Entity.
 */

export interface Behavior {
  type: 'Behavior';
  id: string;
  kind: string;
  entity_id: string;
  definition: string;
  triggers: readonly string[];
}
