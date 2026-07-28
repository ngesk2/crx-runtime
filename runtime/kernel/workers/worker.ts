/**
 * Worker
 * Represents a worker that can execute capabilities.
 */

import { CapabilityID } from '../capabilities/capability';

export type WorkerID = string & { readonly __brand: unique symbol };
export { CapabilityID };

export interface Worker {
  identity: WorkerID;
  capabilities: readonly CapabilityID[];
  resourceProfile: ResourceProfile;
  health: HealthStatus;
  heartbeat: HeartbeatInfo;
  lease: LeaseInfo;
  descriptor: WorkerDescriptor;
}

export interface ResourceProfile {
  cpu: ResourceAllocation;
  memory: ResourceAllocation;
  gpu: ResourceAllocation;
  storage: ResourceAllocation;
  network: NetworkAllocation;
}

export interface ResourceAllocation {
  total: number;
  available: number;
  unit: string;
}

export interface NetworkAllocation {
  bandwidth: number;
  latency: number;
  regions: string[];
}

export enum HealthStatus {
  Healthy = 'healthy',
  Degraded = 'degraded',
  Unhealthy = 'unhealthy',
  Offline = 'offline',
}

export interface HeartbeatInfo {
  lastHeartbeat: string;
  interval: number;
  missedHeartbeats: number;
}

export interface LeaseInfo {
  leaseId: string;
  expiresAt: string;
  capabilities: readonly CapabilityID[];
}

export interface WorkerDescriptor {
  name: string;
  version: string;
  host: string;
  port: number;
  region: string;
  zone: string;
  labels: Record<string, string>;
}
