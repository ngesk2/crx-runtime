/**
 * Metrics Hook
 * Hook for collecting execution metrics.
 */

import { ExecutionContext } from './execution-context';
import { BaseExecutionHook } from './execution-hooks';
import { CanonicalClock } from '../identity/canonical-clock';

export interface Metric {
  name: string;
  value: number;
  timestamp: string;
  labels: Record<string, string>;
}

export class MetricsHook extends BaseExecutionHook {
  name = 'metrics';
  priority = 10;
  
  private clock = CanonicalClock.getInstance();
  private metrics: Metric[] = [];
  
  async before(context: ExecutionContext): Promise<void> {
    this.recordMetric('execution_started', 1, {
      execution_id: context.executionId,
      stage: context.metadata.stage as string,
    });
  }
  
  async after(context: ExecutionContext, result: unknown): Promise<void> {
    const duration = this.calculateDuration(context.startTime);
    this.recordMetric('execution_duration_ms', duration, {
      execution_id: context.executionId,
      stage: context.metadata.stage as string,
    });
    this.recordMetric('execution_completed', 1, {
      execution_id: context.executionId,
      stage: context.metadata.stage as string,
    });
  }
  
  async onError(context: ExecutionContext, error: Error): Promise<void> {
    this.recordMetric('execution_failed', 1, {
      execution_id: context.executionId,
      stage: context.metadata.stage as string,
      error: error.name,
    });
  }
  
  getMetrics(): Metric[] {
    return this.metrics;
  }
  
  clearMetrics(): void {
    this.metrics = [];
  }
  
  private recordMetric(name: string, value: number, labels: Record<string, string>): void {
    this.metrics.push({
      name,
      value,
      timestamp: this.clock.now(),
      labels,
    });
  }
  
  private calculateDuration(startTime: string): number {
    // In a real implementation, this would use canonical time difference
    // For now, this is a placeholder
    return 0;
  }
}
