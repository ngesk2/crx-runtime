/**
 * Event
 * Represents a discrete occurrence or notification.
 */

export interface Event {
  type: 'Event';
  id: string;
  kind: string;
  timestamp: string;
  entity_id: string;
  data: Record<string, unknown>;
}
