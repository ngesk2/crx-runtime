/**
 * Policy
 * Represents a rule or guideline that governs behavior.
 */

export interface Policy {
  type: 'Policy';
  id: string;
  kind: string;
  scope: string;
  rules: readonly Rule[];
  enforcement: 'strict' | 'soft' | 'advisory';
}

export interface Rule {
  id: string;
  condition: string;
  action: string;
  priority: number;
}
