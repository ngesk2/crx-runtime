/**
 * Scheduler Authority Interface
 * Public interface for scheduler subsystem.
 * Only this interface crosses subsystem boundaries.
 */

export interface ISchedulerAuthority {
  schedule(task: Task): ScheduleResult;
  cancel(scheduleId: string): boolean;
  getSchedule(scheduleId: string): Schedule | null;
  listSchedules(filters: ScheduleFilters): Schedule[];
  getQueue(): Task[];
  getActiveSchedules(): Schedule[];
}

export interface Task {
  taskId: string;
  missionId: string;
  capabilityId: string;
  input: unknown;
  priority: Priority;
  requirements: ScheduleRequirements;
}

export interface ScheduleRequirements {
  maxLatency?: number;
  maxCost?: number;
  requiredResources: ResourceRequirement[];
  preferredRegions: string[];
  requiredTraits: string[];
}

export interface ScheduleResult {
  success: boolean;
  scheduleId?: string;
  workerId?: string;
  estimatedStart?: string;
  error?: string;
}

export interface Schedule {
  scheduleId: string;
  taskId: string;
  workerId: string;
  capabilityId: string;
  status: ScheduleStatus;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: ScheduleResult;
}

export enum ScheduleStatus {
  Pending = 'pending',
  Scheduled = 'scheduled',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

export interface ScheduleFilters {
  taskId?: string;
  workerId?: string;
  capabilityId?: string;
  status?: ScheduleStatus;
}

export enum Priority {
  Critical = 'critical',
  High = 'high',
  Normal = 'normal',
  Low = 'low',
}

export interface ResourceRequirement {
  type: 'cpu' | 'gpu' | 'memory' | 'storage' | 'network';
  amount: number;
  unit: string;
}
