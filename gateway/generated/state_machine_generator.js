// State Machine Generator
// P027: Compiler generates state_machine_registry.json from authority lifecycle patterns.
// Input: authorities/registry.yaml, intents/*/intent-manifest.yaml
// Output: generated/state_machine_registry.json
//
// Each machine contains: state IDs, transitions, events, guards, authority,
// deterministic transition table. Runtime never constructs state machines manually.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('yaml');

const SM_VERSION = '1.0.0';

class StateMachineGenerator {
  constructor(repoRoot) {
    this._repoRoot = repoRoot;
  }

  /**
   * Generate state_machine_registry.json.
   * @returns {{ state_machines: Object[], hash: string, count: number }}
   */
  generate() {
    const machines = [];

    // Standard authority lifecycle state machine
    machines.push(this._authorityLifecycleMachine());

    // Worker state machine (from orchestration)
    machines.push(this._workerStateMachine());

    // Deployment state machine
    machines.push(this._deploymentStateMachine());

    // Event processing state machine
    machines.push(this._eventProcessingMachine());

    // Generate per-authority state machines from authorities registry
    const authorityMachines = this._authoritySpecificMachines();
    machines.push(...authorityMachines);

    // Sort by machine_id for deterministic output
    machines.sort((a, b) => a.machine_id.localeCompare(b.machine_id));

    const hash = this._computeHash(machines);

    return {
      schema_version: '1.0.0',
      generator: 'StateMachineGenerator',
      generator_version: SM_VERSION,
      generated_at: new Date().toISOString(),
      count: machines.length,
      hash,
      state_machines: machines,
    };
  }

  write(outputPath) {
    const registry = this.generate();
    const json = JSON.stringify(registry, null, 2);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, json, 'utf8');
    console.log(`[StateMachineGenerator] Wrote ${registry.count} state machines to ${outputPath}`);
    return registry;
  }

  _authorityLifecycleMachine() {
    return {
      machine_id: this._computeId('authority_lifecycle'),
      name: 'AuthorityLifecycle',
      authority: 'any',
      version: SM_VERSION,
      states: ['registered', 'initialized', 'running', 'stopped', 'failed'],
      initial_state: 'registered',
      terminal_states: ['stopped', 'failed'],
      transitions: [
        { from: 'registered', to: 'initialized', event: 'initialize', guard: 'dependencies_ready' },
        { from: 'initialized', to: 'running', event: 'start', guard: 'all_deps_initialized' },
        { from: 'running', to: 'stopped', event: 'stop', guard: 'none' },
        { from: 'running', to: 'failed', event: 'error', guard: 'none' },
        { from: 'failed', to: 'registered', event: 'retry', guard: 'retry_count < max_retries' },
      ],
      events: ['initialize', 'start', 'stop', 'error', 'retry'],
      guards: ['dependencies_ready', 'all_deps_initialized', 'retry_count < max_retries'],
    };
  }

  _workerStateMachine() {
    return {
      machine_id: this._computeId('worker_lifecycle'),
      name: 'WorkerLifecycle',
      authority: 'SchedulerAuthority',
      version: SM_VERSION,
      states: ['idle', 'assigned', 'running', 'waiting', 'consensus', 'completed', 'failed', 'archived'],
      initial_state: 'idle',
      terminal_states: ['archived'],
      transitions: [
        { from: 'idle', to: 'assigned', event: 'assign', guard: 'worker_available' },
        { from: 'assigned', to: 'running', event: 'start_execution', guard: 'worker_ready' },
        { from: 'running', to: 'waiting', event: 'await_consensus', guard: 'output_produced' },
        { from: 'waiting', to: 'consensus', event: 'consensus_started', guard: 'multi_worker' },
        { from: 'consensus', to: 'completed', event: 'consensus_reached', guard: 'threshold_met' },
        { from: 'consensus', to: 'failed', event: 'consensus_failed', guard: 'threshold_not_met' },
        { from: 'running', to: 'completed', event: 'single_completion', guard: 'single_worker' },
        { from: 'running', to: 'failed', event: 'execution_error', guard: 'none' },
        { from: 'completed', to: 'idle', event: 'reset', guard: 'none' },
        { from: 'completed', to: 'assigned', event: 'reassign', guard: 'worker_available' },
        { from: 'completed', to: 'archived', event: 'archive', guard: 'none' },
        { from: 'failed', to: 'idle', event: 'reset', guard: 'none' },
        { from: 'failed', to: 'assigned', event: 'reassign', guard: 'retry_count < max_retries' },
        { from: 'failed', to: 'archived', event: 'archive', guard: 'none' },
        { from: 'archived', to: 'idle', event: 'unarchive', guard: 'none' },
        { from: 'assigned', to: 'idle', event: 'cancel', guard: 'none' },
      ],
      events: ['assign', 'start_execution', 'await_consensus', 'consensus_started', 'consensus_reached', 'consensus_failed', 'single_completion', 'execution_error', 'reset', 'reassign', 'archive', 'unarchive', 'cancel'],
      guards: ['worker_available', 'worker_ready', 'output_produced', 'multi_worker', 'threshold_met', 'threshold_not_met', 'single_worker', 'retry_count < max_retries'],
    };
  }

  _deploymentStateMachine() {
    return {
      machine_id: this._computeId('deployment_lifecycle'),
      name: 'DeploymentLifecycle',
      authority: 'DeploymentRegistry',
      version: SM_VERSION,
      states: ['pending', 'deploying', 'active', 'rolled_back', 'failed'],
      initial_state: 'pending',
      terminal_states: ['active', 'rolled_back', 'failed'],
      transitions: [
        { from: 'pending', to: 'deploying', event: 'deploy', guard: 'version_valid' },
        { from: 'deploying', to: 'active', event: 'health_check_pass', guard: 'all_healthy' },
        { from: 'deploying', to: 'failed', event: 'health_check_fail', guard: 'any_unhealthy' },
        { from: 'active', to: 'rolled_back', event: 'rollback', guard: 'rollback_target_exists' },
        { from: 'failed', to: 'pending', event: 'retry', guard: 'retry_count < max' },
      ],
      events: ['deploy', 'health_check_pass', 'health_check_fail', 'rollback', 'retry'],
      guards: ['version_valid', 'all_healthy', 'any_unhealthy', 'rollback_target_exists', 'retry_count < max'],
    };
  }

  _eventProcessingMachine() {
    return {
      machine_id: this._computeId('event_processing'),
      name: 'EventProcessing',
      authority: 'CanonicalEventEnvelope',
      version: SM_VERSION,
      states: ['emitted', 'persisted', 'processing', 'processed', 'failed'],
      initial_state: 'emitted',
      terminal_states: ['processed', 'failed'],
      transitions: [
        { from: 'emitted', to: 'persisted', event: 'persist', guard: 'storage_available' },
        { from: 'persisted', to: 'processing', event: 'dispatch', guard: 'handler_registered' },
        { from: 'processing', to: 'processed', event: 'complete', guard: 'handler_success' },
        { from: 'processing', to: 'failed', event: 'handler_error', guard: 'none' },
        { from: 'failed', to: 'persisted', event: 'retry', guard: 'retries_remaining' },
      ],
      events: ['persist', 'dispatch', 'complete', 'handler_error', 'retry'],
      guards: ['storage_available', 'handler_registered', 'handler_success', 'retries_remaining'],
    };
  }

  _authoritySpecificMachines() {
    const machines = [];
    const authoritiesPath = path.join(this._repoRoot, 'authorities', 'registry.yaml');

    if (!fs.existsSync(authoritiesPath)) return machines;

    const raw = fs.readFileSync(authoritiesPath, 'utf8');
    const data = yaml.parse(raw);

    if (!data.authorities) return machines;

    for (const [name, authority] of Object.entries(data.authorities)) {
      machines.push({
        machine_id: this._computeId(`${name}_lifecycle`),
        name: `${name}Lifecycle`,
        authority: name,
        version: SM_VERSION,
        states: ['registered', 'initialized', 'running', 'stopped', 'failed'],
        initial_state: 'registered',
        terminal_states: ['stopped', 'failed'],
        transitions: [
          { from: 'registered', to: 'initialized', event: 'initialize', guard: 'dependencies_ready' },
          { from: 'initialized', to: 'running', event: 'start', guard: 'all_deps_initialized' },
          { from: 'running', to: 'stopped', event: 'stop', guard: 'none' },
          { from: 'running', to: 'failed', event: 'error', guard: 'none' },
        ],
        events: ['initialize', 'start', 'stop', 'error'],
        guards: ['dependencies_ready', 'all_deps_initialized'],
        source: authority,
      });
    }

    return machines;
  }

  _computeId(input) {
    return crypto.createHash('sha256').update(`state_machine:${input}`).digest('hex').slice(0, 16);
  }

  _computeHash(machines) {
    const stable = { schema_version: '1.0.0', generator: 'StateMachineGenerator', generator_version: SM_VERSION, state_machines: machines };
    const canonical = JSON.stringify(stable, Object.keys(stable).sort());
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }
}

module.exports = { StateMachineGenerator };
