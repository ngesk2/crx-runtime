/**
 * Capability
 * Represents an abstract ability that can be derived from Knowledge.
 */

export interface Capability {
  type: 'Capability';
  id: string;
  kind: string;
  entity_id: string;
  requirements: readonly string[];
  dependencies: readonly string[];
}
