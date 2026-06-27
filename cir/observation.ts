/**
 * Observation
 * Represents a recorded event or state change.
 */

export interface Observation {
  type: 'Observation';
  id: string;
  kind: string;
  timestamp: string;
  entity_id: string;
  data: Record<string, unknown>;
}
