/**
 * Artifact Dispatch
 * Dispatches artifacts to workers for execution.
 */

import { WorkerID } from '../workers/worker';
import { CapabilityID } from '../capability/capability';
import { ExecutionRequest } from './execution-request';
import { ExecutionResult } from './execution-result';

export interface DispatchRequest {
  requestId: string;
  artifactId: string;
  capabilityId: CapabilityID;
  targetWorker: WorkerID;
  priority: number;
  timeout: number;
}

export interface DispatchResult {
  requestId: string;
  workerId: WorkerID;
  status: 'pending' | 'dispatched' | 'completed' | 'failed';
  dispatchedAt: string;
  completedAt?: string;
  error?: string;
}

export class ArtifactDispatcher {
  private dispatches: Map<string, DispatchResult> = new Map();
  
  async dispatch(request: DispatchRequest): Promise<DispatchResult> {
    const result: DispatchResult = {
      requestId: request.requestId,
      workerId: request.targetWorker,
      status: 'dispatched',
      dispatchedAt: new Date().toISOString(),
    };
    
    this.dispatches.set(request.requestId, result);
    
    // Placeholder for actual dispatch logic
    return result;
  }
  
  getDispatch(requestId: string): DispatchResult | undefined {
    return this.dispatches.get(requestId);
  }
  
  completeDispatch(requestId: string, success: boolean, error?: string): void {
    const dispatch = this.dispatches.get(requestId);
    if (!dispatch) return;
    
    dispatch.status = success ? 'completed' : 'failed';
    dispatch.completedAt = new Date().toISOString();
    if (error) dispatch.error = error;
  }
  
  listPendingDispatches(): DispatchResult[] {
    return Array.from(this.dispatches.values()).filter(
      d => d.status === 'dispatched' || d.status === 'pending'
    );
  }
}
