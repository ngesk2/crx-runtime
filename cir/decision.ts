/**
 * Decision
 * Represents a choice or determination made by the system.
 */

export interface Decision {
  type: 'Decision';
  id: string;
  kind: string;
  context: Record<string, unknown>;
  options: readonly Option[];
  selected: string;
  rationale: string;
}

export interface Option {
  id: string;
  description: string;
  metadata: Record<string, unknown>;
}
