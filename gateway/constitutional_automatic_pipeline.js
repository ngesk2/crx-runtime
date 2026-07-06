/**
 * Constitutional Automatic Pipeline (DAG-Based)
 * 
 * Ω.95.10 — DAG-Based Execution
 * 
 * Replaced imperative orchestration with DAG interpretation.
 * 
 * Flow:
 * 1. Dequeue Mission
 * 2. Generate Execution Plan (using ConstitutionalExecutionPlanner)
 * 3. Register Plan (using ExecutionPlanAuthority)
 * 4. Execute DAG (using ConstitutionalDAGRuntime)
 * 
 * Runtime never decides. Runtime only interprets immutable plans.
 */

const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { deterministicIdAuthority } = require('./deterministic_id_authority');
const { ConstitutionalExecutionPlanner } = require('./constitutional_execution_planner');

class ConstitutionalAutomaticPipeline {
  constructor(postgresPool, executionPlanAuthority, artifactAuthority, authorities, eventSourcing) {
    this._postgres = postgresPool;
    this._executionPlanAuthority = executionPlanAuthority;
    this._artifactAuthority = artifactAuthority;
    this._authorities = authorities;
    this._eventSourcing = eventSourcing;
    this._executionPlanner = new ConstitutionalExecutionPlanner();
    this._isRunning = false;
  }

  /**
   * Initialize automatic pipeline
   */
  async initialize() {
    console.log('[AutomaticPipeline] Initializing constitutional automatic pipeline (DAG-based)');
    console.log('[AutomaticPipeline] Automatic pipeline initialized');
  }

  /**
   * Run automatic pipeline (DAG-based)
   * 
   * DAG-based execution:
   * 1. Dequeue Mission
   * 2. Generate Execution Plan (PURE planning)
   * 3. Register Plan (immutable)
   * 4. Execute DAG (deterministic interpretation)
   * 
   * No imperative orchestration. No stage ordering outside planner.
   */
  async runAutomaticPipeline(repoId, repositoryPath) {
    console.log(`[AutomaticPipeline] Running DAG-based pipeline for ${repoId}`);

    if (this._isRunning) {
      console.log('[AutomaticPipeline] Pipeline already running, cannot start new pipeline');
      return {
        success: false,
        message: 'Pipeline already running',
      };
    }

    this._isRunning = true;

    try {
      // Stage 1: Dequeue Mission
      console.log(`[AutomaticPipeline] Stage 1: Dequeue Mission`);
      const mission = await this._authorities.get('MissionQueue').dequeueMission();

      if (!mission) {
        console.log('[AutomaticPipeline] No mission to dequeue');
        return {
          success: true,
          message: 'No mission to process',
        };
      }

      // Emit MissionSelected event
      await this._eventSourcing.emitEvent('MissionSelected', { mission_id: mission.mission_id }, mission.mission_id);

      // Stage 2: Generate Execution Plan (PURE planning - no IO, no execution)
      console.log(`[AutomaticPipeline] Stage 2: Generate Execution Plan`);
      const executionPlan = this._executionPlanner.planExecution(mission);

      // Validate plan
      const validation = this._executionPlanner.validatePlan(executionPlan);
      if (!validation.valid) {
        console.error('[AutomaticPipeline] Execution plan validation failed:', validation.errors);
        return {
          success: false,
          message: 'Execution plan validation failed',
          errors: validation.errors,
        };
      }

      // Stage 3: Register Execution Plan (immutable)
      console.log(`[AutomaticPipeline] Stage 3: Register Execution Plan`);
      const registeredPlan = await this._executionPlanAuthority.registerPlan(executionPlan);

      // Emit ExecutionPlanned event
      await this._eventSourcing.emitEvent('ExecutionPlanned', { plan_id: registeredPlan.plan_id, mission_id: mission.mission_id }, mission.mission_id);

      // Stage 4: Plan registered (execution delegated to ConstitutionalRuntime)
      console.log(`[AutomaticPipeline] Stage 4: Plan registered for execution`);
      
      console.log(`[AutomaticPipeline] DAG-based pipeline complete`);
      return {
        success: true,
        mission: mission,
        plan_id: registeredPlan.plan_id,
      };
    } catch (error) {
      console.error(`[AutomaticPipeline] DAG-based pipeline failed:`, error.message);
      return {
        success: false,
        message: error.message,
      };
    } finally {
      this._isRunning = false;
    }
  }

  /**
   * Process next mission in queue (DAG-based)
   */
  async processNextMission() {
    if (this._isRunning) {
      console.log('[AutomaticPipeline] Pipeline already running');
      return {
        success: false,
        message: 'Pipeline already running',
      };
    }

    const mission = await this._authorities.get('MissionQueue').dequeueMission();

    if (!mission) {
      return {
        success: false,
        message: 'No mission in queue',
      };
    }

    // Generate and register plan (execution delegated to ConstitutionalRuntime)
    const executionPlan = this._executionPlanner.planExecution(mission);
    const registeredPlan = await this._executionPlanAuthority.registerPlan(executionPlan);

    return {
      success: true,
      plan_id: registeredPlan.plan_id,
    };
  }

  /**
   * Is pipeline running
   */
  isRunning() {
    return this._isRunning;
  }
}

module.exports = { ConstitutionalAutomaticPipeline };
