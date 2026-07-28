/**
 * Health
 * Manages worker health monitoring.
 */

import { WorkerID, HealthStatus } from './worker';

export interface HealthCheck {
  workerId: WorkerID;
  status: HealthStatus;
  checks: HealthCheckResult[];
  timestamp: string;
}

export interface HealthCheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  duration: number;
}

export class HealthMonitor {
  private healthChecks: Map<WorkerID, HealthCheck> = new Map();
  
  recordHealthCheck(check: HealthCheck): void {
    this.healthChecks.set(check.workerId, check);
  }
  
  getHealthCheck(workerId: WorkerID): HealthCheck | undefined {
    return this.healthChecks.get(workerId);
  }
  
  getOverallHealth(workerId: WorkerID): HealthStatus {
    const check = this.healthChecks.get(workerId);
    if (!check) return HealthStatus.Offline;
    
    const hasFailures = check.checks.some(c => c.status === 'fail');
    const hasWarnings = check.checks.some(c => c.status === 'warn');
    
    if (hasFailures) return HealthStatus.Unhealthy;
    if (hasWarnings) return HealthStatus.Degraded;
    return HealthStatus.Healthy;
  }
  
  listUnhealthyWorkers(): WorkerID[] {
    return Array.from(this.healthChecks.keys())
      .filter(id => this.getOverallHealth(id) !== HealthStatus.Healthy);
  }
}
