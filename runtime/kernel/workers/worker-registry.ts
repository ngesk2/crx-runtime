/**
 * Worker Registry
 * Registry of all available workers.
 */

import { Worker, WorkerID, CapabilityID, HealthStatus } from './worker';
import { CanonicalClock } from '../identity/canonical-clock';

export class WorkerRegistry {
  private workers: Map<WorkerID, Worker> = new Map();
  private capabilityIndex: Map<CapabilityID, WorkerID[]> = new Map();
  private clock = CanonicalClock.getInstance();
  
  registerWorker(worker: Worker): void {
    this.workers.set(worker.identity, worker);
    
    // Update capability index
    for (const capability of worker.capabilities) {
      if (!this.capabilityIndex.has(capability)) {
        this.capabilityIndex.set(capability, []);
      }
      this.capabilityIndex.get(capability)!.push(worker.identity);
    }
  }
  
  unregisterWorker(workerId: WorkerID): void {
    const worker = this.workers.get(workerId);
    if (!worker) return;
    
    // Remove from capability index
    for (const capability of worker.capabilities) {
      const workers = this.capabilityIndex.get(capability);
      if (workers) {
        const index = workers.indexOf(workerId);
        if (index > -1) {
          workers.splice(index, 1);
        }
      }
    }
    
    this.workers.delete(workerId);
  }
  
  getWorker(workerId: WorkerID): Worker | undefined {
    return this.workers.get(workerId);
  }
  
  listWorkers(): Worker[] {
    return Array.from(this.workers.values());
  }
  
  findWorkersByCapability(capabilityId: CapabilityID): Worker[] {
    const workerIds = this.capabilityIndex.get(capabilityId) || [];
    return workerIds
      .map(id => this.workers.get(id))
      .filter((w): w is Worker => w !== undefined);
  }
  
  findWorkersByHealth(health: HealthStatus): Worker[] {
    return this.listWorkers().filter(w => w.health === health);
  }
  
  findWorkersByRegion(region: string): Worker[] {
    return this.listWorkers().filter(w => w.descriptor.region === region);
  }
  
  findAvailableWorkers(): Worker[] {
    const now = this.clock.now();
    return this.listWorkers().filter(w => 
      w.health === HealthStatus.Healthy && 
      w.lease.expiresAt < now
    );
  }
}
