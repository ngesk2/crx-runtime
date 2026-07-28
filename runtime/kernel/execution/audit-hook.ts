/**
 * Audit Hook
 * Hook for audit trail generation.
 */

import { ExecutionContext } from './execution-context';
import { BaseExecutionHook } from './execution-hooks';
import { CanonicalIdentityService } from '../identity/canonical-identity-service';
import { CanonicalClock } from '../identity/canonical-clock';

export interface AuditEvent {
  eventId: string;
  timestamp: string;
  executionId: string;
  stage: string;
  action: string;
  actor?: string;
  resource?: string;
  outcome: 'success' | 'failure';
  metadata: Record<string, unknown>;
}

export class AuditHook extends BaseExecutionHook {
  name = 'audit';
  priority = 20;
  
  private identityService = CanonicalIdentityService.getInstance();
  private clock = CanonicalClock.getInstance();
  private auditEvents: AuditEvent[] = [];
  
  async before(context: ExecutionContext): Promise<void> {
    this.recordAuditEvent(context, 'execution_started', 'success');
  }
  
  async after(context: ExecutionContext, result: unknown): Promise<void> {
    this.recordAuditEvent(context, 'execution_completed', 'success');
  }
  
  async onError(context: ExecutionContext, error: Error): Promise<void> {
    this.recordAuditEvent(context, 'execution_failed', 'failure', {
      error: error.message,
      stack: error.stack,
    });
  }
  
  getAuditEvents(): AuditEvent[] {
    return this.auditEvents;
  }
  
  clearAuditEvents(): void {
    this.auditEvents = [];
  }
  
  private recordAuditEvent(
    context: ExecutionContext,
    action: string,
    outcome: 'success' | 'failure',
    metadata: Record<string, unknown> = {}
  ): void {
    const timestamp = this.clock.now();
    this.auditEvents.push({
      eventId: this.identityService.generateAuditId(context.executionId, action),
      timestamp,
      executionId: context.executionId,
      stage: context.metadata.stage as string,
      action,
      outcome,
      metadata: {
        ...metadata,
        input_id: context.metadata.inputId,
        output_id: context.metadata.outputId,
      },
    });
  }
}
