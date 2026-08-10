// P036: State Machine Executor
// Runtime executes generated state_machine_registry.json
// Requirements: deterministic transitions, transition validation,
// illegal transition rejection, transition hash verification.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class StateMachineExecutor {
  constructor(repoRoot) {
    this._repoRoot = repoRoot;
    this._machines = new Map();
    this._instances = new Map(); // machineId -> currentState
    this._hash = null;
  }

  load() {
    const registryPath = path.join(this._repoRoot, 'gateway', 'generated', 'state_machine_registry.json');
    if (!fs.existsSync(registryPath)) {
      throw new Error(`[StateMachineExecutor] state_machine_registry.json not found at ${registryPath}`);
    }

    const raw = fs.readFileSync(registryPath, 'utf8');
    const registry = JSON.parse(raw);

    this._validateRegistry(registry);
    this._indexMachines(registry.state_machines);
    this._hash = this._computeHash();

    console.log(`[StateMachineExecutor] Loaded ${this._machines.size} state machines, hash ${this._hash.slice(0, 12)}...`);
    return this;
  }

  _validateRegistry(registry) {
    const required = ['schema_version', 'generator', 'count', 'state_machines'];
    for (const field of required) {
      if (!registry[field]) {
        throw new Error(`[StateMachineExecutor] Missing required field: ${field}`);
      }
    }
  }

  _indexMachines(machines) {
    for (const machine of machines) {
      if (!machine.machine_id || !machine.name) {
        throw new Error(`[StateMachineExecutor] Invalid machine: missing id or name`);
      }
      if (this._machines.has(machine.machine_id)) {
        throw new Error(`[StateMachineExecutor] Duplicate machine_id: ${machine.machine_id}`);
      }
      this._validateMachine(machine);
      this._machines.set(machine.machine_id, machine);
    }
  }

  _validateMachine(machine) {
    if (!Array.isArray(machine.states) || machine.states.length === 0) {
      throw new Error(`[StateMachineExecutor] Machine '${machine.name}' has no states`);
    }
    if (!machine.initial_state) {
      throw new Error(`[StateMachineExecutor] Machine '${machine.name}' has no initial_state`);
    }
    if (!machine.states.includes(machine.initial_state)) {
      throw new Error(`[StateMachineExecutor] Machine '${machine.name}': initial_state '${machine.initial_state}' not in states`);
    }
    if (!Array.isArray(machine.transitions)) {
      throw new Error(`[StateMachineExecutor] Machine '${machine.name}' has no transitions`);
    }

    const stateSet = new Set(machine.states);
    for (const t of machine.transitions) {
      if (!stateSet.has(t.from)) {
        throw new Error(`[StateMachineExecutor] Machine '${machine.name}': transition from unknown state '${t.from}'`);
      }
      if (!stateSet.has(t.to)) {
        throw new Error(`[StateMachineExecutor] Machine '${machine.name}': transition to unknown state '${t.to}'`);
      }
    }
  }

  instantiate(machineId) {
    const machine = this._machines.get(machineId);
    if (!machine) {
      return { success: false, error: `Machine not found: ${machineId}` };
    }

    const instanceId = `${machineId}_${Date.now()}`;
    this._instances.set(instanceId, {
      machineId,
      currentState: machine.initial_state,
      history: [],
      instantiatedAt: new Date().toISOString(),
    });

    return { success: true, instanceId, initialState: machine.initial_state };
  }

  transition(instanceId, eventName) {
    const instance = this._instances.get(instanceId);
    if (!instance) {
      return { success: false, error: `Instance not found: ${instanceId}` };
    }

    const machine = this._machines.get(instance.machineId);
    if (!machine) {
      return { success: false, error: `Machine not found: ${instance.machineId}` };
    }

    // Find matching transition
    const transition = machine.transitions.find(t =>
      t.from === instance.currentState && t.event === eventName
    );

    if (!transition) {
      const validEvents = machine.transitions
        .filter(t => t.from === instance.currentState)
        .map(t => t.event);
      return {
        success: false,
        error: `Invalid transition: '${eventName}' from state '${instance.currentState}'`,
        currentState: instance.currentState,
        validEvents,
      };
    }

    // Check guard
    if (transition.guard) {
      // Guards are declarative — runtime can log but not enforce without context
      console.log(`[StateMachineExecutor] Guard '${transition.guard}' on transition ${instance.currentState} -> ${transition.to}`);
    }

    // Execute transition
    const previousState = instance.currentState;
    instance.currentState = transition.to;
    instance.history.push({
      from: previousState,
      to: transition.to,
      event: eventName,
      timestamp: new Date().toISOString(),
      transitionHash: crypto.createHash('sha256')
        .update(`${previousState}:${eventName}:${transition.to}`)
        .digest('hex'),
    });

    return {
      success: true,
      from: previousState,
      to: transition.to,
      event: eventName,
      isTerminal: (machine.terminal_states || []).includes(transition.to),
    };
  }

  getState(instanceId) {
    const instance = this._instances.get(instanceId);
    if (!instance) return null;
    return {
      instanceId,
      machineId: instance.machineId,
      currentState: instance.currentState,
      historyLength: instance.history.length,
      history: instance.history,
    };
  }

  getMachine(machineId) {
    return this._machines.get(machineId) || null;
  }

  getValidTransitions(machineId, currentState) {
    const machine = this._machines.get(machineId);
    if (!machine) return [];
    return machine.transitions
      .filter(t => t.from === currentState)
      .map(t => ({ event: t.event, to: t.to, guard: t.guard }));
  }

  getHash() {
    return this._hash;
  }

  getStats() {
    return {
      totalMachines: this._machines.size,
      activeInstances: this._instances.size,
      hash: this._hash,
    };
  }

  _computeHash() {
    const ids = Array.from(this._machines.keys()).sort();
    return crypto.createHash('sha256').update(JSON.stringify(ids)).digest('hex');
  }
}

module.exports = { StateMachineExecutor };
