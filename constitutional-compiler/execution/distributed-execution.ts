/**
 * Distributed Execution and Worker Scheduling
 * 
 * This is where the compiler becomes interesting for distributed compute.
 * 
 * The compiler should be embarrassingly parallel:
 * 
 * Node A: parses TS → Semantic IR → ships IR
 * Node B: Ownership Graph
 * Node C: Capability Graph
 * Node D: Rule Evaluation
 * Node E: Evidence Generation
 * 
 * Nobody should need the original source code except the frontend workers.
 * Everything else consumes semantic IR.
 */

import { SymbolID } from '../ir/node-types';
import { SemanticIRNode } from '../lowering/semantic-lowerer';
import { CanonicalSymbol } from '../lowering/semantic-lowerer';

/**
 * Worker Type
 */
export enum WorkerType {
  Frontend = 'Frontend',
  Ownership = 'Ownership',
  Capability = 'Capability',
  RuleEvaluation = 'RuleEvaluation',
  EvidenceGeneration = 'EvidenceGeneration',
  GraphComputation = 'GraphComputation',
  CounterEvidence = 'CounterEvidence',
  ReportGeneration = 'ReportGeneration',
}

/**
 * Worker Node
 */
export interface WorkerNode {
  id: SymbolID;
  type: WorkerType;
  address: string;
  port: number;
  status: WorkerStatus;
  capabilities: WorkerCapability[];
  currentTasks: SymbolID[];
  statistics: WorkerStatistics;
}

/**
 * Worker Status
 */
export enum WorkerStatus {
  Idle = 'Idle',
  Busy = 'Busy',
  Offline = 'Offline',
  Error = 'Error',
}

/**
 * Worker Capability
 */
export interface WorkerCapability {
  type: string;
  capacity: number;
  performance: number;
}

/**
 * Worker Statistics
 */
export interface WorkerStatistics {
  tasksCompleted: number;
  tasksFailed: number;
  averageTaskTime: number;
  totalUptime: number;
}

/**
 * Task
 */
export interface Task {
  id: SymbolID;
  type: TaskType;
  priority: TaskPriority;
  data: any;
  dependencies: SymbolID[];
  status: TaskStatus;
  assignedWorker?: SymbolID;
  startTime?: number;
  endTime?: number;
  result?: any;
  error?: string;
}

/**
 * Task Type
 */
export enum TaskType {
  Parse = 'Parse',
  Lower = 'Lower',
  Canonicalize = 'Canonicalize',
  ComputeOwnership = 'ComputeOwnership',
  ComputeCapability = 'ComputeCapability',
  EvaluateRules = 'EvaluateRules',
  GenerateEvidence = 'GenerateEvidence',
  ComputeGraph = 'ComputeGraph',
  GenerateCounterEvidence = 'GenerateCounterEvidence',
  GenerateReport = 'GenerateReport',
}

/**
 * Task Priority
 */
export enum TaskPriority {
  Critical = 'Critical',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

/**
 * Task Status
 */
export enum TaskStatus {
  Pending = 'Pending',
  Scheduled = 'Scheduled',
  Running = 'Running',
  Completed = 'Completed',
  Failed = 'Failed',
  Cancelled = 'Cancelled',
}

/**
 * Execution Plan
 */
export interface ExecutionPlan {
  id: SymbolID;
  tasks: Task[];
  workerAssignments: Map<SymbolID, SymbolID>; // taskId -> workerId
  estimatedDuration: number;
  dependencies: Map<SymbolID, SymbolID[]>; // taskId -> dependency taskIds
}

/**
 * Distributed Execution Engine
 */
export class DistributedExecutionEngine {
  private workers: Map<SymbolID, WorkerNode> = new Map();
  private tasks: Map<SymbolID, Task> = new Map();
  private taskQueue: Task[] = [];
  private workerTypeIndex: Map<WorkerType, SymbolID[]> = new Map();

  /**
   * Register worker
   */
  registerWorker(worker: WorkerNode): void {
    this.workers.set(worker.id, worker);
    
    if (!this.workerTypeIndex.has(worker.type)) {
      this.workerTypeIndex.set(worker.type, []);
    }
    this.workerTypeIndex.get(worker.type)!.push(worker.id);
  }

  /**
   * Unregister worker
   */
  unregisterWorker(workerId: SymbolID): void {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    this.workers.delete(workerId);
    
    const typeWorkers = this.workerTypeIndex.get(worker.type);
    if (typeWorkers) {
      const index = typeWorkers.indexOf(workerId);
      if (index > -1) {
        typeWorkers.splice(index, 1);
      }
    }
  }

  /**
   * Submit task
   */
  submitTask(task: Task): void {
    this.tasks.set(task.id, task);
    this.taskQueue.push(task);
  }

  /**
   * Submit tasks
   */
  submitTasks(tasks: Task[]): void {
    for (const task of tasks) {
      this.submitTask(task);
    }
  }

  /**
   * Schedule task
   */
  scheduleTask(task: Task): WorkerNode | null {
    const availableWorkers = this.getAvailableWorkersForTask(task);
    
    if (availableWorkers.length === 0) {
      return null;
    }

    // Select worker with least current tasks (load balancing)
    const worker = availableWorkers.sort((a, b) => 
      a.currentTasks.length - b.currentTasks.length
    )[0];

    task.status = TaskStatus.Scheduled;
    task.assignedWorker = worker.id;
    worker.currentTasks.push(task.id);

    return worker;
  }

  /**
   * Get available workers for task
   */
  private getAvailableWorkersForTask(task: Task): WorkerNode[] {
    const workerType = this.mapTaskTypeToWorkerType(task.type);
    const workers = this.workerTypeIndex.get(workerType) || [];
    
    return workers
      .map(id => this.workers.get(id)!)
      .filter(worker => 
        worker.status === WorkerStatus.Idle && 
        worker.currentTasks.length < this.getWorkerCapacity(worker)
      );
  }

  /**
   * Map task type to worker type
   */
  private mapTaskTypeToWorkerType(taskType: TaskType): WorkerType {
    switch (taskType) {
      case TaskType.Parse:
        return WorkerType.Frontend;
      case TaskType.Lower:
      case TaskType.Canonicalize:
        return WorkerType.Frontend;
      case TaskType.ComputeOwnership:
        return WorkerType.Ownership;
      case TaskType.ComputeCapability:
        return WorkerType.Capability;
      case TaskType.EvaluateRules:
        return WorkerType.RuleEvaluation;
      case TaskType.GenerateEvidence:
        return WorkerType.EvidenceGeneration;
      case TaskType.ComputeGraph:
        return WorkerType.GraphComputation;
      case TaskType.GenerateCounterEvidence:
        return WorkerType.CounterEvidence;
      case TaskType.GenerateReport:
        return WorkerType.ReportGeneration;
      default:
        return WorkerType.Frontend;
    }
  }

  /**
   * Get worker capacity
   */
  private getWorkerCapacity(worker: WorkerNode): number {
    const capacityCapability = worker.capabilities.find(c => c.type === 'capacity');
    return capacityCapability ? capacityCapability.capacity : 1;
  }

  /**
   * Execute task
   */
  async executeTask(task: Task, semanticIR?: Map<SymbolID, SemanticIRNode>, canonicalSymbols?: Map<SymbolID, CanonicalSymbol>): Promise<any> {
    const worker = this.workers.get(task.assignedWorker!);
    if (!worker) {
      throw new Error(`Worker not found for任务: ${task.id}`);
    }

    task.status = TaskStatus.Running;
    task.startTime = Date.now();
    worker.status = WorkerStatus.Busy;

    try {
      // Execute task based on type
      const result = await this.executeTaskByType(task, semanticIR, canonicalSymbols);
      
      task.status = TaskStatus.Completed;
      task.endTime = Date.now();
      task.result = result;
      worker.status = WorkerStatus.Idle;
      worker.statistics.tasksCompleted++;
      worker.statistics.averageTaskTime = 
        (worker.statistics.averageTaskTime * (worker.statistics.tasksCompleted - 1) + 
         (task.endTime! - task.startTime!)) / worker.statistics.tasksCompleted;

      // Remove task from worker's current tasks
      const taskIndex = worker.currentTasks.indexOf(task.id);
      if (taskIndex > -1) {
        worker.currentTasks.splice(taskIndex, 1);
      }

      return result;
    } catch (error) {
      task.status = TaskStatus.Failed;
      task.endTime = Date.now();
      task.error = error instanceof Error ? error.message : String(error);
      worker.status = WorkerStatus.Error;
      worker.statistics.tasksFailed++;

      // Remove task from worker's current tasks
      const taskIndex = worker.currentTasks.indexOf(task.id);
      if (taskIndex > -1) {
        worker.currentTasks.splice(taskIndex, 1);
      }

      throw error;
    }
  }

  /**
   * Execute task by type
   */
  private async executeTaskByType(
    task: Task,
    semanticIR?: Map<SymbolID, SemanticIRNode>,
    canonicalSymbols?: Map<SymbolID, CanonicalSymbol>
  ): Promise<any> {
    // TODO: Implement actual task execution
    // This would call the appropriate engine based on task type
    switch (task.type) {
      case TaskType.Parse:
        return { semanticIR: new Map() };
      case TaskType.Lower:
        return { canonicalSymbols: new Map() };
      case TaskType.ComputeOwnership:
        return { ownership: {} };
      case TaskType.ComputeCapability:
        return { capabilities: {} };
      case TaskType.EvaluateRules:
        return { violations: [] };
      case TaskType.GenerateEvidence:
        return { evidence: [] };
      case TaskType.ComputeGraph:
        return { graph: {} };
      case TaskType.GenerateCounterEvidence:
        return { counterEvidence: [] };
      case TaskType.GenerateReport:
        return { report: {} };
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  /**
   * Create execution plan
   */
  createExecutionPlan(tasks: Task[]): ExecutionPlan {
    const planId = `plan-${Date.now()}`;
    const workerAssignments = new Map<SymbolID, SymbolID>();
    const dependencies = new Map<SymbolID, SymbolID[]>();
    
    // Schedule tasks
    for (const task of tasks) {
      const worker = this.scheduleTask(task);
      if (worker) {
        workerAssignments.set(task.id, worker.id);
      }
      dependencies.set(task.id, task.dependencies);
    }

    // Estimate duration (simple heuristic)
    const estimatedDuration = tasks.length * 1000; // 1 second per task

    return {
      id: planId,
      tasks,
      workerAssignments,
      estimatedDuration,
      dependencies,
    };
  }

  /**
   * Execute execution plan
   */
  async executeExecutionPlan(plan: ExecutionPlan, semanticIR?: Map<SymbolID, SemanticIRNode>, canonicalSymbols?: Map<SymbolID, CanonicalSymbol>): Promise<Map<SymbolID, any>> {
    const results = new Map<SymbolID, any>();
    const completedTasks = new Set<SymbolID>();
    
    // Execute tasks in dependency order
    while (completedTasks.size < plan.tasks.length) {
      // Find tasks whose dependencies are all completed
      const readyTasks = plan.tasks.filter(task => 
        !completedTasks.has(task.id) &&
        task.dependencies.every(dep => completedTasks.has(dep))
      );

      if (readyTasks.length === 0) {
        throw new Error('Circular dependency detected or no ready tasks');
      }

      // Execute ready tasks in parallel
      const executions = readyTasks.map(task => 
        this.executeTask(task, semanticIR, canonicalSymbols)
      );

      const taskResults = await Promise.all(executions);
      
      for (let i = 0; i < readyTasks.length; i++) {
        results.set(readyTasks[i].id, taskResults[i]);
        completedTasks.add(readyTasks[i].id);
      }
    }

    return results;
  }

  /**
   * Get worker by ID
   */
  getWorker(workerId: SymbolID): WorkerNode | undefined {
    return this.workers.get(workerId);
  }

  /**
   * Get workers by type
   */
  getWorkersByType(type: WorkerType): WorkerNode[] {
    const ids = this.workerTypeIndex.get(type) || [];
    return ids.map(id => this.workers.get(id)!).filter(w => w !== undefined);
  }

  /**
   * Get all workers
   */
  getAllWorkers(): WorkerNode[] {
    return Array.from(this.workers.values());
  }

  /**
   * Get task by ID
   */
  getTask(taskId: SymbolID): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: TaskStatus): Task[] {
    return Array.from(this.tasks.values()).filter(task => task.status === status);
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get task queue
   */
  getTaskQueue(): Task[] {
    return [...this.taskQueue];
  }

  /**
   * Clear task queue
   */
  clearTaskQueue(): void {
    this.taskQueue = [];
  }

  /**
   * Clear all tasks
   */
  clearAllTasks(): void {
    this.tasks.clear();
    this.clearTaskQueue();
  }

  /**
   * Clear all workers
   */
  clearAllWorkers(): void {
    this.workers.clear();
    this.workerTypeIndex.clear();
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalWorkers: number;
    totalTasks: number;
    tasksByStatus: Record<TaskStatus, number>;
    workersByStatus: Record<WorkerStatus, number>;
    averageTaskTime: number;
  } {
    const tasksByStatus: Record<TaskStatus, number> = {} as any;
    const workersByStatus: Record<WorkerStatus, number> = {} as any;
    let totalTaskTime = 0;
    let completedTasks = 0;

    for (const task of this.tasks.values()) {
      tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
      
      if (task.status === TaskStatus.Completed && task.startTime && task.endTime) {
        totalTaskTime += task.endTime - task.startTime;
        completedTasks++;
      }
    }

    for (const worker of this.workers.values()) {
      workersByStatus[worker.status] = (workersByStatus[worker.status] || 0) + 1;
    }

    return {
      totalWorkers: this.workers.size,
      totalTasks: this.tasks.size,
      tasksByStatus,
      workersByStatus,
      averageTaskTime: completedTasks > 0 ? totalTaskTime / completedTasks : 0,
    };
  }

  /**
   * Export to JSON
   */
  exportToJSON(): string {
    const data = {
      workers: Array.from(this.workers.values()),
      tasks: Array.from(this.tasks.values()),
      statistics: this.getStatistics(),
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import from JSON
   */
  importFromJSON(json: string): void {
    const data = JSON.parse(json);
    
    for (const worker of data.workers) {
      this.registerWorker(worker);
    }
    
    for (const task of data.tasks) {
      this.submitTask(task);
    }
  }
}
