/**
 * Worker Authority Interface
 * Public interface for worker subsystem.
 * Only this interface crosses subsystem boundaries.
 */

export interface IWorkerAuthority {
  register(worker: Worker): void;
  unregister(workerId: string): void;
  get(workerId: string): Worker | null;
  list(filters: WorkerFilters): Worker[];
  claim(workerId: string, capabilityId: string): Lease | null;
  release(leaseId: string): void;
  getLease(leaseId: string): Lease | null;
  listLeases(workerId: string): Lease[];
  updateHealth(workerId: string, health: HealthStatus): void;
  updateResources(workerId: string, resources: ResourceAllocation): void;
}

export interface Worker {
  workerId: string;
  providerId: string;
  capabilities: string[];
  version: string;
  metadata: WorkerMetadata;
}

export interface WorkerMetadata {
  registeredAt: string;
  lastHeartbeat: string;
  region: string;
  status: WorkerStatus;
}

export enum WorkerStatus {
  Available = 'available',
  Busy = 'busy',
  Offline = 'offline',
  Draining = 'draining',
}

export interface WorkerFilters {
  capabilityId?: string;
  region?: string;
  status?: WorkerStatus;
  providerId?: string;
}

export interface Lease {
  leaseId: string;
  workerId: string;
  capabilityId: string;
  grantedAt: string;
  expiresAt: string;
  status: LeaseStatus;
}

export enum LeaseStatus {
  Active = 'active',
  Released = 'released',
  Expired = 'expired',
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  checks: HealthCheck[];
  lastUpdated: string;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  timestamp: string;
}

export interface ResourceAllocation {
  cpu: number;
  memory: number;
  gpu: number;
  storage: number;
  network: number;
}
