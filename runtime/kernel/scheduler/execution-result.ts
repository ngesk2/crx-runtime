/**
 * Execution Result
 * Represents the result of executing a capability.
 */

export interface ExecutionResult {
  success: boolean;
  requestId: string;
  output?: unknown;
  error?: string;
  metadata: Record<string, unknown>;
  duration?: number;
  completedAt?: string;
}

export class ExecutionResultBuilder {
  buildSuccess(
    requestId: string,
    output: unknown,
    metadata: Record<string, unknown> = {}
  ): ExecutionResult {
    return {
      success: true,
      requestId,
      output,
      metadata,
      completedAt: new Date().toISOString(),
    };
  }
  
  buildFailure(
    requestId: string,
    error: string,
    metadata: Record<string, unknown> = {}
  ): ExecutionResult {
    return {
      success: false,
      requestId,
      error,
      metadata,
      completedAt: new Date().toISOString(),
    };
  }
  
  withDuration(result: ExecutionResult, duration: number): ExecutionResult {
    return { ...result, duration };
  }
  
  withMetadata(result: ExecutionResult, metadata: Record<string, unknown>): ExecutionResult {
    return { ...result, metadata: { ...result.metadata, ...metadata } };
  }
}
