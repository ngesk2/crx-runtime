/**
 * Resource Profile
 * Manages worker resource profiles.
 */

import { WorkerID, ResourceProfile } from './worker';

export interface ResourceProfileUpdate {
  workerId: WorkerID;
  cpu?: Partial<ResourceAllocation>;
  memory?: Partial<ResourceAllocation>;
  gpu?: Partial<ResourceAllocation>;
  storage?: Partial<ResourceAllocation>;
  network?: Partial<NetworkAllocation>;
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

export class ResourceProfileManager {
  private profiles: Map<WorkerID, ResourceProfile> = new Map();
  
  updateProfile(update: ResourceProfileUpdate): void {
    const existing = this.profiles.get(update.workerId);
    if (!existing) return;
    
    const updated = { ...existing };
    
    if (update.cpu) updated.cpu = { ...updated.cpu, ...update.cpu };
    if (update.memory) updated.memory = { ...updated.memory, ...update.memory };
    if (update.gpu) updated.gpu = { ...updated.gpu, ...update.gpu };
    if (update.storage) updated.storage = { ...updated.storage, ...update.storage };
    if (update.network) updated.network = { ...updated.network, ...update.network };
    
    this.profiles.set(update.workerId, updated);
  }
  
  getProfile(workerId: WorkerID): ResourceProfile | undefined {
    return this.profiles.get(workerId);
  }
  
  setProfile(workerId: WorkerID, profile: ResourceProfile): void {
    this.profiles.set(workerId, profile);
  }
  
  getResourceUtilization(workerId: WorkerID): number {
    const profile = this.profiles.get(workerId);
    if (!profile) return 0;
    
    const cpuUtil = (profile.cpu.total - profile.cpu.available) / profile.cpu.total;
    const memUtil = (profile.memory.total - profile.memory.available) / profile.memory.total;
    
    return (cpuUtil + memUtil) / 2;
  }
}
