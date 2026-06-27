/**
 * Artifact Router
 * Routes artifacts to capabilities based on routing policies.
 */

import { CapabilityID } from '../capability/capability';
import { WorkerID } from '../workers/worker';
import { RoutingPolicy } from './routing-policy';
import { ExecutionRequest } from './execution-request';
import { ExecutionResult } from './execution-result';

export class ArtifactRouter {
  private policies: RoutingPolicy[] = [];
  
  registerPolicy(policy: RoutingPolicy): void {
    this.policies.push(policy);
  }
  
  async route(request: ExecutionRequest): Promise<ExecutionResult> {
    const policy = this.selectPolicy(request);
    if (!policy) {
      return {
        success: false,
        error: 'No matching routing policy',
        requestId: request.requestId,
      };
    }
    
    return await policy.execute(request);
  }
  
  private selectPolicy(request: ExecutionRequest): RoutingPolicy | undefined {
    return this.policies.find(policy => policy.matches(request));
  }
  
  listPolicies(): RoutingPolicy[] {
    return this.policies;
  }
}
