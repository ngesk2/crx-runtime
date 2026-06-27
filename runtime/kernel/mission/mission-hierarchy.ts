/**
 * Mission Hierarchy
 * Program → Epic → Mission → Task → Execution
 * Mission becomes replay root.
 * All time/sequence comes from CanonicalClock, never runtime.
 */

import { CanonicalIdentityService } from '../identity/canonical-identity-service';
import { CanonicalClock } from '../identity/canonical-clock';
import { ProgramReference, EpicReference, MissionReference, TaskReference, ExecutionReference } from '../identity/typed-references';
import { ReferenceBuilder } from '../identity/typed-references';

export interface Program {
  programId: ProgramReference;
  name: string;
  description: string;
  version: string;
  epics: readonly EpicReference[];
  metadata: ProgramMetadata;
}

export interface ProgramMetadata {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  status: ProgramStatus;
}

export enum ProgramStatus {
  Draft = 'draft',
  Active = 'active',
  Paused = 'paused',
  Completed = 'completed',
  Archived = 'archived',
}

export interface Epic {
  epicId: EpicReference;
  programId: ProgramReference;
  name: string;
  description: string;
  missions: readonly MissionReference[];
  metadata: EpicMetadata;
}

export interface EpicMetadata {
  createdAt: string;
  updatedAt: string;
  status: EpicStatus;
  priority: Priority;
}

export enum EpicStatus {
  Planned = 'planned',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum Priority {
  Critical = 'critical',
  High = 'high',
  Normal = 'normal',
  Low = 'low',
}

export interface Mission {
  missionId: MissionReference;
  epicId: EpicReference;
  programId: ProgramReference;
  name: string;
  description: string;
  tasks: readonly TaskReference[];
  metadata: MissionMetadata;
}

export interface MissionMetadata {
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  status: MissionStatus;
  capabilities: readonly string[];
  requiredResources: ResourceRequirement[];
}

export enum MissionStatus {
  Queued = 'queued',
  Claimed = 'claimed',
  Running = 'running',
  Succeeded = 'succeeded',
  Verified = 'verified',
  Merged = 'merged',
  Projected = 'projected',
  Archived = 'archived',
  Failed = 'failed',
}

export interface Task {
  taskId: TaskReference;
  missionId: MissionReference;
  name: string;
  description: string;
  capabilityId: string;
  input: unknown;
  metadata: TaskMetadata;
}

export interface TaskMetadata {
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  status: TaskStatus;
  executionId?: string;
  workerId?: string;
}

export enum TaskStatus {
  Pending = 'pending',
  Scheduled = 'scheduled',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

export interface ResourceRequirement {
  type: 'cpu' | 'gpu' | 'memory' | 'storage' | 'network';
  amount: number;
  unit: string;
}

export interface Execution {
  executionId: ExecutionReference;
  taskId: TaskReference;
  missionId: MissionReference;
  epicId: EpicReference;
  programId: ProgramReference;
  input: unknown;
  output?: unknown;
  metadata: ExecutionMetadata;
}

export interface ExecutionMetadata {
  startedAt: string;
  completedAt?: string;
  status: ExecutionStatus;
  error?: string;
  duration?: number;
}

export enum ExecutionStatus {
  Started = 'started',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

export class MissionHierarchyBuilder {
  private identityService = CanonicalIdentityService.getInstance();
  private clock = CanonicalClock.getInstance();
  
  createProgram(name: string, description: string, canonicalTimestamp?: string): Program {
    const timestamp = canonicalTimestamp || this.clock.now();
    return {
      programId: this.identityService.generateUUIDv5('program', name) as ProgramReference,
      name,
      description,
      version: '1.0.0',
      epics: [],
      metadata: {
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: 'system',
        status: ProgramStatus.Draft,
      },
    };
  }
  
  createEpic(programId: ProgramReference, name: string, description: string, canonicalTimestamp?: string): Epic {
    const timestamp = canonicalTimestamp || this.clock.now();
    return {
      epicId: this.identityService.generateEpicId(programId, name) as EpicReference,
      programId,
      name,
      description,
      missions: [],
      metadata: {
        createdAt: timestamp,
        updatedAt: timestamp,
        status: EpicStatus.Planned,
        priority: Priority.Normal,
      },
    };
  }
  
  createMission(epicId: EpicReference, programId: ProgramReference, name: string, description: string, canonicalTimestamp?: string): Mission {
    const timestamp = canonicalTimestamp || this.clock.now();
    return {
      missionId: this.identityService.generateMissionId(programId, epicId) as MissionReference,
      epicId,
      programId,
      name,
      description,
      tasks: [],
      metadata: {
        createdAt: timestamp,
        status: MissionStatus.Queued,
        capabilities: [],
        requiredResources: [],
      },
    };
  }
  
  createTask(missionId: MissionReference, name: string, description: string, capabilityId: string, input: unknown, canonicalTimestamp?: string): Task {
    const timestamp = canonicalTimestamp || this.clock.now();
    const sequence = this.clock.nextSequence();
    return {
      taskId: this.identityService.generateTaskId(missionId, sequence) as TaskReference,
      missionId,
      name,
      description,
      capabilityId,
      input,
      metadata: {
        createdAt: timestamp,
        status: TaskStatus.Pending,
      },
    };
  }
  
  createExecution(taskId: TaskReference, missionId: MissionReference, epicId: EpicReference, programId: ProgramReference, input: unknown, canonicalTimestamp?: string): Execution {
    const timestamp = canonicalTimestamp || this.clock.now();
    const sequence = this.clock.nextSequence();
    const executionId = this.identityService.generateUUIDv5('execution', `${taskId}:${sequence}`);
    return {
      executionId: ReferenceBuilder.buildExecutionReference(executionId),
      taskId,
      missionId,
      epicId,
      programId,
      input,
      metadata: {
        startedAt: timestamp,
        status: ExecutionStatus.Started,
      },
    };
  }
}
