/**
 * Lease
 * Manages capability leases for workers.
 */

import { WorkerID, CapabilityID, LeaseInfo } from './worker';
import { CanonicalIdentityService } from '../identity/canonical-identity-service';
import { CanonicalClock } from '../identity/canonical-clock';

export interface LeaseRequest {
  workerId: WorkerID;
  capabilities: readonly CapabilityID[];
  duration: number;
  priority: number;
}

export interface LeaseGrant {
  leaseId: string;
  workerId: WorkerID;
  capabilities: readonly CapabilityID[];
  grantedAt: string;
  expiresAt: string;
  priority: number;
}

export class LeaseManager {
  private leases: Map<string, LeaseGrant> = new Map();
  private workerLeases: Map<WorkerID, string[]> = new Map();
  private identityService = CanonicalIdentityService.getInstance();
  private clock = CanonicalClock.getInstance();
  
  requestLease(request: LeaseRequest): LeaseGrant | null {
    // Check if worker is available
    const existingLeases = this.workerLeases.get(request.workerId) || [];
    const now = this.clock.now();
    const hasConflictingLease = existingLeases.some(leaseId => {
      const lease = this.leases.get(leaseId);
      if (!lease) return false;
      return lease.expiresAt > now;
    });
    
    if (hasConflictingLease) {
      return null;
    }
    
    // Grant lease
    const leaseId = this.identityService.generateLeaseId(request.workerId, request.capabilities[0] || 'default');
    const grantedAt = this.clock.now();
    const expiresAt = this.clock.addDuration(grantedAt, request.duration);
    
    const grant: LeaseGrant = {
      leaseId,
      workerId: request.workerId,
      capabilities: request.capabilities,
      grantedAt,
      expiresAt,
      priority: request.priority,
    };
    
    this.leases.set(leaseId, grant);
    
    if (!this.workerLeases.has(request.workerId)) {
      this.workerLeases.set(request.workerId, []);
    }
    this.workerLeases.get(request.workerId)!.push(leaseId);
    
    return grant;
  }
  
  releaseLease(leaseId: string): boolean {
    const lease = this.leases.get(leaseId);
    if (!lease) return false;
    
    const workerLeases = this.workerLeases.get(lease.workerId);
    if (workerLeases) {
      const index = workerLeases.indexOf(leaseId);
      if (index > -1) {
        workerLeases.splice(index, 1);
      }
    }
    
    this.leases.delete(leaseId);
    return true;
  }
  
  getLease(leaseId: string): LeaseGrant | undefined {
    return this.leases.get(leaseId);
  }
  
  getWorkerLeases(workerId: WorkerID): LeaseGrant[] {
    const leaseIds = this.workerLeases.get(workerId) || [];
    return leaseIds
      .map(id => this.leases.get(id))
      .filter((l): l is LeaseGrant => l !== undefined);
  }
  
  cleanupExpiredLeases(): void {
    const now = this.clock.now();
    
    for (const [leaseId, lease] of this.leases.entries()) {
      if (lease.expiresAt < now) {
        this.releaseLease(leaseId);
      }
    }
  }
}
