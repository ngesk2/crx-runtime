/**
 * Heartbeat
 * Manages worker heartbeats for health monitoring.
 */

import { WorkerID, HeartbeatInfo, HealthStatus } from './worker';

export interface HeartbeatEvent {
  workerId: WorkerID;
  timestamp: string;
  status: HealthStatus;
  metadata: Record<string, unknown>;
}

export class HeartbeatManager {
  private heartbeatInterval: number;
  private missedThreshold: number;
  private lastHeartbeats: Map<WorkerID, string> = new Map();
  private missedCount: Map<WorkerID, number> = new Map();
  
  constructor(heartbeatInterval: number = 5000, missedThreshold: number = 3) {
    this.heartbeatInterval = heartbeatInterval;
    this.missedThreshold = missedThreshold;
  }
  
  recordHeartbeat(workerId: WorkerID): HeartbeatEvent {
    const now = new Date().toISOString();
    this.lastHeartbeats.set(workerId, now);
    this.missedCount.set(workerId, 0);
    
    return {
      workerId,
      timestamp: now,
      status: HealthStatus.Healthy,
      metadata: {},
    };
  }
  
  checkHeartbeat(workerId: WorkerID): HealthStatus {
    const lastHeartbeat = this.lastHeartbeats.get(workerId);
    if (!lastHeartbeat) {
      return HealthStatus.Offline;
    }
    
    const now = new Date();
    const last = new Date(lastHeartbeat);
    const elapsed = now.getTime() - last.getTime();
    
    if (elapsed > this.heartbeatInterval * this.missedThreshold) {
      const missed = (this.missedCount.get(workerId) || 0) + 1;
      this.missedCount.set(workerId, missed);
      
      if (missed >= this.missedThreshold) {
        return HealthStatus.Unhealthy;
      }
      return HealthStatus.Degraded;
    }
    
    return HealthStatus.Healthy;
  }
  
  getHeartbeatInfo(workerId: WorkerID): HeartbeatInfo {
    const lastHeartbeat = this.lastHeartbeats.get(workerId) || new Date(0).toISOString();
    const missed = this.missedCount.get(workerId) || 0;
    
    return {
      lastHeartbeat,
      interval: this.heartbeatInterval,
      missedHeartbeats: missed,
    };
  }
}
