/**
 * Constraint
 * Represents a rule or limitation that must be satisfied.
 */

export interface Constraint {
  type: 'Constraint';
  id: string;
  kind: string;
  scope: string;
  expression: string;
  severity: 'error' | 'warning' | 'info';
}
