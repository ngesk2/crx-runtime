/**
 * Telemetry Hook
 * Hook for OpenTelemetry-style telemetry collection.
 */

import { ExecutionContext } from './execution-context';
import { BaseExecutionHook } from './execution-hooks';
import { CanonicalIdentityService } from '../identity/canonical-identity-service';
import { CanonicalClock } from '../identity/canonical-clock';

export interface Span {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  name: string;
  startTime: string;
  endTime?: string;
  status: 'ok' | 'error';
  attributes: Record<string, unknown>;
  events: TelemetryEvent[];
}

export interface TelemetryEvent {
  name: string;
  timestamp: string;
  attributes: Record<string, unknown>;
}

export class TelemetryHook extends BaseExecutionHook {
  name = 'telemetry';
  priority = 15;
  
  private identityService = CanonicalIdentityService.getInstance();
  private clock = CanonicalClock.getInstance();
  private spans: Map<string, Span> = new Map();
  private currentSpan?: Span;
  
  async before(context: ExecutionContext): Promise<void> {
    this.currentSpan = {
      spanId: this.identityService.generateSpanId(context.executionId, context.metadata.stage as string),
      traceId: context.executionId,
      name: context.metadata.stage as string,
      startTime: this.clock.now(),
      status: 'ok',
      attributes: {
        execution_id: context.executionId,
        stage: context.metadata.stage,
        input_id: context.metadata.inputId,
      },
      events: [],
    };
    
    this.spans.set(this.currentSpan.spanId, this.currentSpan);
  }
  
  async after(context: ExecutionContext, result: unknown): Promise<void> {
    if (!this.currentSpan) return;
    
    this.currentSpan.endTime = this.clock.now();
    this.currentSpan.status = 'ok';
    this.currentSpan.attributes.output_id = context.metadata.outputId;
    
    this.recordEvent('execution_completed', {
      duration: this.calculateDuration(this.currentSpan.startTime),
    });
  }
  
  async onError(context: ExecutionContext, error: Error): Promise<void> {
    if (!this.currentSpan) return;
    
    this.currentSpan.endTime = this.clock.now();
    this.currentSpan.status = 'error';
    this.currentSpan.attributes.error = error.message;
    
    this.recordEvent('execution_failed', {
      error: error.name,
      message: error.message,
    });
  }
  
  recordEvent(name: string, attributes: Record<string, unknown>): void {
    if (!this.currentSpan) return;
    
    this.currentSpan.events.push({
      name,
      timestamp: this.clock.now(),
      attributes,
    });
  }
  
  getSpans(): Span[] {
    return Array.from(this.spans.values());
  }
  
  getCurrentSpan(): Span | undefined {
    return this.currentSpan;
  }
  
  private calculateDuration(startTime: string): number {
    // In a real implementation, this would use canonical time difference
    // For now, this is a placeholder
    return 0;
  }
}
