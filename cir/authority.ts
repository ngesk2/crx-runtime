/**
 * Authority
 * Represents the governance or ownership of an Entity or Relationship.
 */

export interface Authority {
  type: 'Authority';
  id: string;
  kind: string;
  scope: string;
  level: 'constitutional' | 'domain' | 'namespace' | 'version' | 'certification';
  constraints: readonly string[];
}
