const crypto = require('crypto');
const path = require('path');

// Generated from state_machine_registry.json — single source of truth
const _generatedMachine = (() => {
  const registry = require(path.join(__dirname, '..', '..', '..', 'gateway', 'generated', 'state_machine_registry.json'));
  const worker = registry.state_machines.find(m => m.name === 'WorkerLifecycle');
  if (!worker) throw new Error('[WorkerPort] WorkerLifecycle not found in state_machine_registry.json');
  const transMap = {};
  for (const t of worker.transitions) {
    if (!transMap[t.from]) transMap[t.from] = [];
    transMap[t.from].push(t.to);
  }
  return { states: worker.states, transitions: transMap };
})();

// Generated from capability_registry.json — single source of truth
const _generatedCapabilities = (() => {
  const registry = require(path.join(__dirname, '..', '..', '..', 'gateway', 'generated', 'capability_registry.json'));
  const byOwner = {};
  for (const cap of registry.capabilities) {
    if (cap.owner === 'WorkerPort') {
      if (!byOwner[cap.name]) byOwner[cap.name] = cap;
    }
  }
  return byOwner;
})();

function getCapabilitiesByNames(names) {
  return names.filter(n => _generatedCapabilities[n]).sort();
}

const WORKER_STATES = _generatedMachine.states;
const VALID_TRANSITIONS = _generatedMachine.transitions;

class WorkerPort {
  constructor(config = {}) {
    this._workerId = config.workerId || `worker_${crypto.createHash('sha256').update(JSON.stringify(config)).digest('hex').substring(0, 8)}`;
    this._model = config.model || 'unknown';
    this._capabilities = config.capabilities || [];
    this._state = 'idle';
    this._currentMissionId = null;
    this._latency = [];
    this._history = [];
    this._failurePatterns = [];
    this._load = 0;
    this._maxLoad = config.maxLoad || 3;
    this._contextWindow = config.contextWindow || 32000;
    this._replayCompatibility = config.replayCompatibility || false;
    this._specialization = config.specialization || 'general_purpose';
    this._executor = config.executor || null;
    this._eventQueue = config.eventQueue || null;
  }

  get workerId() { return this._workerId; }
  get model() { return this._model; }
  get capabilities() { return [...this._capabilities]; }
  get state() { return this._state; }
  get currentLoad() { return this._load; }
  get maxLoad() { return this._maxLoad; }
  get currentMissionId() { return this._currentMissionId; }
  get averageLatency() {
    if (this._latency.length === 0) return 0;
    return this._latency.reduce((s, v) => s + v, 0) / this._latency.length;
  }
  get acceptanceRate() {
    if (this._history.length === 0) return 0;
    const accepted = this._history.filter(h => h.accepted).length;
    return accepted / this._history.length;
  }
  get failurePatterns() { return [...this._failurePatterns]; }
  get specialization() { return this._specialization; }
  get replayCompatibility() { return this._replayCompatibility; }
  get contextWindow() { return this._contextWindow; }
  get isAvailable() { return this._load < this._maxLoad; }

  canTransition(targetState) {
    const allowed = VALID_TRANSITIONS[this._state] || [];
    return allowed.includes(targetState);
  }

  transition(targetState, meta = {}) {
    if (!this.canTransition(targetState)) {
      console.warn(`[WorkerPort ${this._workerId}] Invalid transition: ${this._state} → ${targetState}`);
      return false;
    }
    const from = this._state;
    this._state = targetState;
    if (targetState === 'assigned') {
      this._load = Math.min(this._load + 1, this._maxLoad);
      this._currentMissionId = meta.missionId || this._currentMissionId;
    }
    if (targetState === 'idle') {
      this._load = 0;
      this._currentMissionId = null;
    }
    if (targetState === 'completed' || targetState === 'failed' || targetState === 'archived') {
      this._load = Math.max(this._load - 1, 0);
      if (this._load === 0) this._currentMissionId = null;
    }
    if (this._eventQueue) {
      this._eventQueue.emit('worker_state_changed', {
        workerId: this._workerId,
        from,
        to: targetState,
        missionId: meta.missionId || null,
        load: this._load
      });
    }
    return true;
  }

  async execute(mission, context) {
    const start = Date.now();
    this._emit('worker_execution_started', { missionId: mission.id });

    let result;
    if (this._executor) {
      try {
        result = await this._executor(mission, context);
      } catch (err) {
        this._recordFailure(mission.id, err.message);
        result = { error: err.message, confidence: 0, findings: [] };
      }
    } else {
      result = { error: 'no_executor', confidence: 0, findings: [] };
    }

    const elapsed = Date.now() - start;
    this._latency.push(elapsed);
    if (this._latency.length > 100) this._latency.shift();

    result._latency = elapsed;
    result._workerId = this._workerId;

    this._emit('worker_execution_completed', {
      missionId: mission.id,
      workerId: this._workerId,
      latency: elapsed,
      confidence: result.confidence || 0,
      findingsCount: (result.findings || []).length
    });

    return result;
  }

  async health() {
    return {
      workerId: this._workerId,
      model: this._model,
      state: this._state,
      available: this.isAvailable,
      load: this._load,
      maxLoad: this._maxLoad,
      averageLatency: this.averageLatency,
      acceptanceRate: this.acceptanceRate,
      capabilities: this._capabilities
    };
  }

  getCapabilities() {
    return this._capabilities.map(c => ({
      name: c,
      workerId: this._workerId,
      specialization: this._specialization,
      contextWindow: this._contextWindow,
      replayCompatible: this._replayCompatibility
    }));
  }

  _recordFailure(missionId, reason) {
    this._failurePatterns.push({ missionId, reason, timestamp: Date.now() });
    if (this._failurePatterns.length > 50) this._failurePatterns.shift();
  }

  _emit(type, data) {
    if (this._eventQueue) {
      this._eventQueue.emit(type, { ...data, workerId: this._workerId });
    }
  }
}

class OpenCodeWorkerPort extends WorkerPort {
  constructor(config = {}) {
    super({
      workerId: config.workerId || 'opencode:local',
      model: config.model || 'opencode:big-pickle',
      capabilities: config.capabilities || getCapabilitiesByNames([
        'orchestration.plan', 'orchestration.review', 'orchestration.merge',
        'authority.audit', 'authority.audit.time', 'authority.audit.identity',
        'authority.audit.hash', 'authority.audit.serialization', 'authority.audit.subprocess',
        'replay.verify', 'code.generate', 'code.refactor'
      ]),
      specialization: config.specialization || 'orchestration',
      contextWindow: config.contextWindow || 128000,
      replayCompatibility: config.replayCompatibility !== false,
      maxLoad: config.maxLoad || 2,
      executor: config.executor || null,
      eventQueue: config.eventQueue || null,
      ...config
    });
  }
}

class OllamaWorkerPort extends WorkerPort {
  constructor(config = {}) {
    const model = config.model || 'qwen2.5-coder:7b';
    const specialization = model.includes('coder') ? 'code_audit'
      : model.includes('deepseek') ? 'analysis'
      : model.includes('qa') ? 'verification'
      : 'general_purpose';
    super({
      workerId: config.workerId || `ollama:${model.replace(/[.:]/g, '-')}`,
      model,
      capabilities: config.capabilities || getCapabilitiesByNames([
        'code.generate', 'code.refactor', 'authority.audit', 'replay.verify'
      ]),
      specialization,
      contextWindow: config.contextWindow || 32000,
      replayCompatibility: false,
      maxLoad: config.maxLoad || 1,
      executor: config.executor || null,
      eventQueue: config.eventQueue || null,
      ...config
    });
  }
}

class DevinWorkerPort extends WorkerPort {
  constructor(config = {}) {
    super({
      workerId: config.workerId || 'devin:default',
      model: config.model || 'devin:default',
      capabilities: config.capabilities || getCapabilitiesByNames([
        'code.generate', 'code.refactor', 'code.test', 'documentation.write'
      ]),
      specialization: 'general_purpose',
      contextWindow: config.contextWindow || 64000,
      replayCompatibility: false,
      maxLoad: config.maxLoad || 1,
      executor: config.executor || null,
      eventQueue: config.eventQueue || null,
      ...config
    });
  }
}

class WorkerPortRegistry {
  constructor(eventQueue) {
    this._workers = new Map();
    this._events = eventQueue;
  }

  register(worker) {
    if (this._workers.has(worker.workerId)) return false;
    this._workers.set(worker.workerId, worker);
    if (this._events) {
      this._events.emit('worker_registered', {
        workerId: worker.workerId,
        model: worker.model,
        capabilities: worker.capabilities,
        specialization: worker.specialization,
        contextWindow: worker.contextWindow,
        replayCompatible: worker.replayCompatibility
      });
    }
    return true;
  }

  unregister(workerId) {
    this._workers.delete(workerId);
  }

  get(workerId) {
    return this._workers.get(workerId) || null;
  }

  findAvailable(capability, count = 1) {
    const candidates = [];
    for (const worker of this._workers.values()) {
      if (worker.isAvailable && (worker.capabilities.includes(capability) || capability === '*')) {
        candidates.push(worker);
      }
    }
    candidates.sort((a, b) => a.currentLoad - b.currentLoad || a.averageLatency - b.averageLatency);
    return candidates.slice(0, count);
  }

  findBest(capability, missionType) {
    let best = null;
    let bestScore = -1;
    for (const worker of this._workers.values()) {
      if (!worker.isAvailable) continue;
      if (!worker.capabilities.includes(capability)) continue;
      const score = this._computeScore(worker, missionType);
      if (score > bestScore) {
        bestScore = score;
        best = worker;
      }
    }
    return best;
  }

  _computeScore(worker, missionType) {
    const capMatch = worker.capabilities.filter(c => c.includes(missionType.split('.')[0])).length;
    const specMatch = worker.specialization === missionType.split('.')[0] ? 3 : 0;
    const latency = Math.max(0, 1000 - worker.averageLatency) / 1000;
    const acceptance = worker.acceptanceRate;
    const load = 1 - (worker.currentLoad / worker.maxLoad);
    return capMatch * 0.25 + specMatch * 0.3 + latency * 0.15 + acceptance * 0.2 + load * 0.1;
  }

  listAll() {
    return Array.from(this._workers.values()).map(w => ({
      workerId: w.workerId,
      model: w.model,
      state: w.state,
      load: `${w.currentLoad}/${w.maxLoad}`,
      capabilities: w.capabilities,
      specialization: w.specialization,
      averageLatency: Math.round(w.averageLatency),
      acceptanceRate: Math.round(w.acceptanceRate * 100) / 100
    }));
  }

  getStats() {
    const workers = this.listAll();
    return {
      totalWorkers: workers.length,
      byState: workers.reduce((acc, w) => {
        acc[w.state] = (acc[w.state] || 0) + 1;
        return acc;
      }, {}),
      idle: workers.filter(w => w.state === 'idle').length,
      running: workers.filter(w => w.state === 'running').length,
      totalCapabilities: [...new Set(workers.flatMap(w => w.capabilities))].length,
      averageLatency: workers.length > 0
        ? Math.round(workers.reduce((s, w) => s + w.averageLatency, 0) / workers.length)
        : 0,
      averageAcceptance: workers.length > 0
        ? Math.round(workers.reduce((s, w) => s + w.acceptanceRate, 0) / workers.length * 100) / 100
        : 0
    };
  }
}

module.exports = {
  WorkerPort, OpenCodeWorkerPort, OllamaWorkerPort,
  DevinWorkerPort, WorkerPortRegistry,
  WORKER_STATES, VALID_TRANSITIONS, getCapabilitiesByNames
};
