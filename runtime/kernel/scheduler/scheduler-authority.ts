import { CanonicalIdentityService } from '../identity/canonical-identity-service';
import { CanonicalClock } from '../identity/canonical-clock';
import { ISchedulerAuthority, Task, ScheduleResult, Schedule, ScheduleFilters, ScheduleStatus } from './scheduler-authority-interface';
import { ArtifactRouter } from './artifact-router';
import { ArtifactDispatcher, DispatchRequest } from './artifact-dispatch';
import { ExecutionRequestBuilder } from './execution-request';

export class SchedulerAuthority implements ISchedulerAuthority {
  private schedules: Map<string, Schedule> = new Map();
  private taskQueue: Task[] = [];
  private router: ArtifactRouter;
  private dispatcher: ArtifactDispatcher;
  private requestBuilder: ExecutionRequestBuilder;
  private identityService = CanonicalIdentityService.getInstance();
  private clock = CanonicalClock.getInstance();

  constructor() {
    this.router = new ArtifactRouter();
    this.dispatcher = new ArtifactDispatcher();
    this.requestBuilder = new ExecutionRequestBuilder();
  }

  schedule(task: Task): ScheduleResult {
    const scheduleId = this.identityService.generateUUIDv5('schedule', task.taskId);
    const timestamp = this.clock.now();

    const schedule: Schedule = {
      scheduleId,
      taskId: task.taskId,
      workerId: '',
      capabilityId: task.capabilityId,
      status: ScheduleStatus.Pending,
      scheduledAt: timestamp,
    };

    const request = this.requestBuilder.buildRequest(task.input, task.capabilityId as any);
    this.router.route(request).then(result => {
      schedule.status = result.success ? ScheduleStatus.Completed : ScheduleStatus.Failed;
    });

    this.schedules.set(scheduleId, schedule);
    this.taskQueue.push(task);

    return { success: true, scheduleId, estimatedStart: timestamp };
  }

  cancel(scheduleId: string): boolean {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule || schedule.status === ScheduleStatus.Completed) return false;
    schedule.status = ScheduleStatus.Cancelled;
    return true;
  }

  getSchedule(scheduleId: string): Schedule | null {
    return this.schedules.get(scheduleId) || null;
  }

  listSchedules(filters: ScheduleFilters): Schedule[] {
    let results = Array.from(this.schedules.values());
    if (filters.taskId) results = results.filter(s => s.taskId === filters.taskId);
    if (filters.capabilityId) results = results.filter(s => s.capabilityId === filters.capabilityId);
    if (filters.status) results = results.filter(s => s.status === filters.status);
    return results;
  }

  getQueue(): Task[] {
    return [...this.taskQueue];
  }

  getActiveSchedules(): Schedule[] {
    return Array.from(this.schedules.values()).filter(
      s => s.status === ScheduleStatus.Scheduled || s.status === ScheduleStatus.Running
    );
  }
}
