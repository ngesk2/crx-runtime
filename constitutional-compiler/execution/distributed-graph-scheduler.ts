/**
 * Distributed Graph Scheduler
 * 
 * Once graphs exist, schedule:
 * - Ownership Graph
 * - Capability Graph
 * - Trust Graph
 * - Identity Graph
 * - Persistence Graph
 * 
 * simultaneously.
 * 
 * You already built worker scheduling.
 * Now use it.
 */

import { SymbolID } from '../ir/node-types';
import { GraphType } from '../graph/graph-engine';
import { DistributedExecutionEngine, Task, TaskType, TaskPriority } from '../execution/distributed-execution';

/**
 * Graph Computation Task
 */
export interface GraphComputationTask {
  id: SymbolID;
  graphType: GraphType;
  dependencies: GraphType[];
  priority: TaskPriority;
  estimatedDuration: number;
}

/**
 * Graph Schedule
 */
export interface GraphSchedule {
  id: SymbolID;
  tasks: GraphComputationTask[];
  parallelGroups: GraphType[][];
  estimatedTotalDuration: number;
}

/**
 * Distributed Graph Scheduler
 */
export class DistributedGraphScheduler {
  private executionEngine: DistributedExecutionEngine;
  private schedules: Map<SymbolID, GraphSchedule> = new Map();

  constructor(executionEngine: DistributedExecutionEngine) {
    this.executionEngine = executionEngine;
  }

  /**
   * Schedule graph computations
   */
  scheduleGraphComputations(
    graphTypes: GraphType[],
    dependencies: Map<GraphType, GraphType[]>
  ): GraphSchedule {
    const tasks = this.createTasks(graphTypes, dependencies);
    const parallelGroups = this.computeParallelGroups(tasks, dependencies);
    const estimatedTotalDuration = this.estimateTotalDuration(tasks);

    const schedule: GraphSchedule = {
      id: `schedule-${Date.now()}`,
      tasks,
      parallelGroups,
      estimatedTotalDuration,
    };

    this.schedules.set(schedule.id, schedule);
    return schedule;
  }

  /**
   * Create tasks for graph types
   */
  private createTasks(
    graphTypes: GraphType[],
    dependencies: Map<GraphType, GraphType[]>
  ): GraphComputationTask[] {
    const tasks: GraphComputationTask[] = [];

    for (const graphType of graphTypes) {
      const task: GraphComputationTask = {
        id: `task-${graphType}-${Date.now()}`,
        graphType,
        dependencies: dependencies.get(graphType) || [],
        priority: this.computePriority(graphType),
        estimatedDuration: this.estimateDuration(graphType),
      };

      tasks.push(task);
    }

    return tasks;
  }

  /**
   * Compute priority for graph type
   */
  private computePriority(graphType: GraphType): TaskPriority {
    // High priority for critical graphs
    const criticalGraphs = [
      GraphType.Ownership,
      GraphType.Capability,
      GraphType.Trust,
      GraphType.Authority,
    ];

    if (criticalGraphs.includes(graphType)) {
      return TaskPriority.High;
    }

    // Medium priority for important graphs
    const importantGraphs = [
      GraphType.Mutation,
      GraphType.Persistence,
      GraphType.Identity,
    ];

    if (importantGraphs.includes(graphType)) {
      return TaskPriority.Medium;
    }

    return TaskPriority.Low;
  }

  /**
   * Estimate duration for graph type
   */
  private estimateDuration(graphType: GraphType): number {
    // Estimate in milliseconds
    const durations: Record<GraphType, number> = {
      [GraphType.Construction]: 1000,
      [GraphType.Mutation]: 1500,
      [GraphType.Persistence]: 1200,
      [GraphType.Trust]: 2000,
      [GraphType.Ownership]: 1800,
      [GraphType.Capability]: 1600,
      [GraphType.Reflection]: 800,
      [GraphType.DynamicImport]: 900,
      [GraphType.Inheritance]: 1100,
      [GraphType.GenericInstantiation]: 1300,
      [GraphType.DependencyInjection]: 1400,
      [GraphType.Factory]: 1000,
      [GraphType.Builder]: 1000,
      [GraphType.Repository]: 1500,
      [GraphType.Identity]: 1700,
      [GraphType.Witness]: 1200,
      [GraphType.Replay]: 1900,
      [GraphType.Projection]: 1400,
      [GraphType.Knowledge]: 2000,
      [GraphType.Governance]: 2200,
      [GraphType.Scheduler]: 1100,
      [GraphType.Worker]: 1000,
      [GraphType.Mission]: 1300,
      [GraphType.Provider]: 1200,
      [GraphType.Service]: 1100,
      [GraphType.Authority]: 1800,
      [GraphType.ConstitutionalRoot]: 1500,
      [GraphType.BoundaryCrossing]: 1300,
      [GraphType.IllegalTransition]: 1000,
      [GraphType.StateMachine]: 1400,
      [GraphType.Lifecycle]: 1200,
      [GraphType.CryptographicTrust]: 2000,
      [GraphType.DataFlow]: 1600,
      [GraphType.ControlFlow]: 1400,
      [GraphType.Version]: 800,
      [GraphType.OwnershipTransfer]: 1500,
      [GraphType.Authorization]: 1700,
      [GraphType.CapabilityConsumption]: 1400,
      [GraphType.CapabilityProduction]: 1400,
      [GraphType.RuleDependency]: 1600,
      [GraphType.RuleProvenance]: 1800,
      [GraphType.ViolationLineage]: 1500,
      [GraphType.CounterEvidence]: 1700,
      [GraphType.CompilationDependency]: 1200,
      [GraphType.ModuleFederation]: 1300,
      [GraphType.PackageEvolution]: 1400,
      [GraphType.TrustDelegation]: 1600,
      [GraphType.IdentityResolution]: 1500,
      [GraphType.ReplayDeterminism]: 1900,
      [GraphType.CryptographicChain]: 2000,
      [GraphType.DistributedWorker]: 1100,
      [GraphType.Cluster]: 1200,
      [GraphType.Consensus]: 1800,
      [GraphType.Replication]: 1500,
    };

    return durations[graphType] || 1000;
  }

  /**
   * Compute parallel groups using topological sort
   */
  private computeParallelGroups(
    tasks: GraphComputationTask[],
    dependencies: Map<GraphType, GraphType[]>
  ): GraphType[][] {
    const groups: GraphType[][] = [];
    const remaining = new Set<GraphType>(tasks.map(t => t.graphType));
    const completed = new Set<GraphType>();

    while (remaining.size > 0) {
      const currentGroup: GraphType[] = [];

      for (const graphType of remaining) {
        const deps = dependencies.get(graphType) || [];
        const allDepsCompleted = deps.every(dep => completed.has(dep));

        if (allDepsCompleted) {
          currentGroup.push(graphType);
        }
      }

      if (currentGroup.length === 0) {
        // Circular dependency detected
        // Add remaining tasks to current group
        currentGroup.push(...Array.from(remaining));
      }

      for (const graphType of currentGroup) {
        remaining.delete(graphType);
        completed.add(graphType);
      }

      groups.push(currentGroup);
    }

    return groups;
  }

  /**
   * Estimate total duration
   */
  private estimateTotalDuration(tasks: GraphComputationTask[]): number {
    return tasks.reduce((sum, task) => sum + task.estimatedDuration, 0);
  }

  /**
   * Execute graph schedule
   */
  async executeSchedule(
    schedule: GraphSchedule,
    semanticIR: Map<SymbolID, any>,
    canonicalSymbols: Map<SymbolID, any>
  ): Promise<Map<SymbolID, any>> {
    const results = new Map<SymbolID, any>();

    // Execute parallel groups sequentially
    for (const group of schedule.parallelGroups) {
      const groupTasks = schedule.tasks.filter(t => group.includes(t.graphType));
      
      // Create execution tasks
      const executionTasks: Task[] = groupTasks.map(task => ({
        id: task.id,
        type: TaskType.ComputeGraph,
        priority: task.priority,
        data: { graphType: task.graphType },
        dependencies: task.dependencies.map(dep => `task-${dep}`),
        status: 'Pending' as any,
      }));

      // Submit tasks
      this.executionEngine.submitTasks(executionTasks);

      // Create execution plan
      const plan = this.executionEngine.createExecutionPlan(executionTasks);

      // Execute plan
      const taskResults = await this.executionEngine.executeExecutionPlan(plan, semanticIR, canonicalSymbols);

      // Collect results
      for (const [taskId, result] of taskResults) {
        results.set(taskId, result);
      }
    }

    return results;
  }

  /**
   * Get schedule by ID
   */
  getSchedule(id: SymbolID): GraphSchedule | undefined {
    return this.schedules.get(id);
  }

  /**
   * Get latest schedule
   */
  getLatestSchedule(): GraphSchedule | undefined {
    const schedules = Array.from(this.schedules.values());
    if (schedules.length === 0) return undefined;

    return schedules.sort((a, b) => 
      parseInt(b.id.split('-')[1]) - parseInt(a.id.split('-')[1])
    )[0];
  }

  /**
   * Get all schedules
   */
  getAllSchedules(): GraphSchedule[] {
    return Array.from(this.schedules.values());
  }

  /**
   * Clear all schedules
   */
  clear(): void {
    this.schedules.clear();
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalSchedules: number;
    averageGraphsPerSchedule: number;
    averageParallelGroups: number;
    averageDuration: number;
  } {
    const schedules = this.getAllSchedules();

    if (schedules.length === 0) {
      return {
        totalSchedules: 0,
        averageGraphsPerSchedule: 0,
        averageParallelGroups: 0,
        averageDuration: 0,
      };
    }

    let totalGraphs = 0;
    let totalParallelGroups = 0;
    let totalDuration = 0;

    for (const schedule of schedules) {
      totalGraphs += schedule.tasks.length;
      totalParallelGroups += schedule.parallelGroups.length;
      totalDuration += schedule.estimatedTotalDuration;
    }

    return {
      totalSchedules: schedules.length,
      averageGraphsPerSchedule: totalGraphs / schedules.length,
      averageParallelGroups: totalParallelGroups / schedules.length,
      averageDuration: totalDuration / schedules.length,
    };
  }

  /**
   * Export to JSON
   */
  exportToJSON(): string {
    return JSON.stringify(this.getAllSchedules(), null, 2);
  }

  /**
   * Import from JSON
   */
  importFromJSON(json: string): void {
    const schedules: GraphSchedule[] = JSON.parse(json);
    
    for (const schedule of schedules) {
      this.schedules.set(schedule.id, schedule);
    }
  }
}
