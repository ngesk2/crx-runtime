/**
 * Execution Request
 * Represents a request to execute a capability on an artifact.
 */

import { CapabilityID } from '../capabilities/capability';
import { WorkerID } from '../workers/worker';
import { CanonicalIdentityService } from '../identity/canonical-identity-service';
import { CanonicalClock } from '../identity/canonical-clock';

export interface ExecutionRequest {
  requestId: string;
  input: unknown;
  capabilityId: CapabilityID;
  targetWorker?: WorkerID;
  priority: number;
  timeout: number;
  metadata: Record<string, unknown>;
}

export class ExecutionRequestBuilder {
  private identityService = CanonicalIdentityService.getInstance();
  private clock = CanonicalClock.getInstance();
  
  buildRequest(
    input: unknown,
    capabilityId: CapabilityID
  ): ExecutionRequest {
    const timestamp = this.clock.now();
    return {
      requestId: this.identityService.generateRequestId(timestamp),
      input,
      capabilityId,
      priority: 0,
      timeout: 30000,
      metadata: {},
    };
  }
  
  withTargetWorker(request: ExecutionRequest, workerId: WorkerID): ExecutionRequest {
    return { ...request, targetWorker: workerId };
  }
  
  withPriority(request: ExecutionRequest, priority: number): ExecutionRequest {
    return { ...request, priority };
  }
  
  withTimeout(request: ExecutionRequest, timeout: number): ExecutionRequest {
    return { ...request, timeout };
  }
  
  withMetadata(request: ExecutionRequest, metadata: Record<string, unknown>): ExecutionRequest {
    return { ...request, metadata: { ...request.metadata, ...metadata } };
  }
}
