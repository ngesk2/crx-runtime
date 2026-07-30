/**
 * Constitutional Runtime - Projection Contracts
 * 
 * Shared projection interfaces and base types.
 * Published by Constitutional Runtime, consumed by PING and HPP.
 */

/**
 * Projection ID
 * Unique identifier for a projection.
 */
export interface ProjectionId {
  type: string;
  version: string;
  id: string;
}

/**
 * Time Window
 * Time range for projections.
 */
export interface TimeWindow {
  start: string;
  end: string;
  granularity: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
}

/**
 * Projection Summary
 * Summary statistics for a projection.
 */
export interface ProjectionSummary {
  count: number;
  generatedAt: string;
  window: TimeWindow;
  metadata?: Record<string, unknown>;
}

/**
 * Projection
 * Base projection interface.
 */
export interface Projection<T> {
  id: ProjectionId;
  generatedAt: string;
  window: TimeWindow;
  summary: ProjectionSummary;
  items: T[];
}

/**
 * Projection Interface
 * Interface for projection implementations.
 */
export interface ProjectionInterface {
  generate(events: unknown[]): Promise<Projection<unknown>>;
  getType(): string;
  getVersion(): string;
}
