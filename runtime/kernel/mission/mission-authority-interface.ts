/**
 * Mission Authority Interface
 * Public interface for mission subsystem.
 * Only this interface crosses subsystem boundaries.
 */

export interface IMissionAuthority {
  createProgram(name: string, description: string): Program;
  createEpic(programId: string, name: string, description: string): Epic;
  createMission(epicId: string, name: string, description: string): Mission;
  createTask(missionId: string, name: string, description: string, capabilityId: string, input: unknown): Task;
  createExecution(taskId: string, input: unknown): Execution;
  updateMissionStatus(missionId: string, status: MissionStatus): void;
  updateExecutionStatus(executionId: string, status: ExecutionStatus, output?: unknown): void;
  getProgram(programId: string): Program | null;
  getEpic(epicId: string): Epic | null;
  getMission(missionId: string): Mission | null;
  getTask(taskId: string): Task | null;
  getExecution(executionId: string): Execution | null;
}

export interface Program {
  programId: string;
  name: string;
  description: string;
  version: string;
  epics: string[];
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
  epicId: string;
  programId: string;
  name: string;
  description: string;
  missions: string[];
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
  missionId: string;
  epicId: string;
  programId: string;
  name: string;
  description: string;
  tasks: string[];
  metadata: MissionMetadata;
}

export interface MissionMetadata {
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  status: MissionStatus;
  capabilities: string[];
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
  taskId: string;
  missionId: string;
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

export interface Execution {
  executionId: string;
  taskId: string;
  missionId: string;
  epicId: string;
  programId: string;
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

export interface ResourceRequirement {
  type: 'cpu' | 'gpu' | 'memory' | 'storage' | 'network';
  amount: number;
  unit: string;
}
