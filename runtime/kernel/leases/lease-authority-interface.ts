/**
 * Lease Authority Interface
 * Public interface for lease subsystem.
 * Only this interface crosses subsystem boundaries.
 */

export interface ILeaseAuthority {
  request(request: LeaseRequest): Lease | null;
  release(leaseId: string): boolean;
  renew(leaseId: string, duration: number): Lease | null;
  get(leaseId: string): Lease | null;
  list(filters: LeaseFilters): Lease[];
  cleanupExpired(): number;
}

export interface LeaseRequest {
  workerId: string;
  capabilityId: string;
  duration: number;
  priority: Priority;
}

export interface Lease {
  leaseId: string;
  workerId: string;
  capabilityId: string;
  grantedAt: string;
  expiresAt: string;
  status: LeaseStatus;
  priority: Priority;
}

export enum LeaseStatus {
  Pending = 'pending',
  Granted = 'granted',
  Released = 'released',
  Expired = 'expired',
  Denied = 'denied',
}

export interface LeaseFilters {
  workerId?: string;
  capabilityId?: string;
  status?: LeaseStatus;
}

export enum Priority {
  Critical = 'critical',
  High = 'high',
  Normal = 'normal',
  Low = 'low',
}
