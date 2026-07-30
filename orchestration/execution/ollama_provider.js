const http = require('http');
const path = require('path');

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

// Generated from capability_registry.json — single source of truth
const _modelMappings = (() => {
  const registry = require(path.join(__dirname, '..', '..', 'gateway', 'generated', 'capability_registry.json'));
  if (!registry.model_mappings) throw new Error('[OllamaProvider] model_mappings not found in capability_registry.json');
  return registry.model_mappings;
})();

class OllamaProvider {
  constructor(capabilityRegistry, workerStateMachine) {
    this._capabilities = capabilityRegistry;
    this._stateMachine = workerStateMachine;
    this._workers = new Map();
    this._healthCache = {};
  }

  async discoverWorkers() {
    const models = await this._listModels();
    const workers = [];

    for (const model of models) {
      const workerId = `ollama:${model.name}`;
      const mapping = this._resolveMapping(model);
      const capabilities = mapping.capabilities;
      const contextWindow = mapping.context_window;

      const specialization = mapping.specialization;
      const worker = {
        id: workerId,
        model: model.name,
        capabilities,
        specialization,
        contextWindow,
        avgLatency: 0,
        avgTokens: 0,
        avgConfidence: null,
        acceptanceRate: null,
        replayCompatibility: mapping.replay_compatibility,
        maxLoad: mapping.max_load,
        currentLoad: 0,
        qualityHistory: [],
        failurePatterns: []
      };

      this._capabilities.registerWorker(workerId, worker);
      this._workers.set(workerId, { ...worker, details: model });
      this._stateMachine.transition(workerId, 'idle');
      workers.push(worker);
    }

    return workers;
  }

  registerOpenCode() {
    const id = 'opencode:local';
    const caps = _modelMappings.opencode;

    this._capabilities.registerWorker(id, {
      model: 'opencode-big-pickle',
      capabilities: caps.capabilities,
      specialization: caps.specialization,
      contextWindow: caps.context_window,
      avgLatency: 0,
      avgTokens: 0,
      avgConfidence: null,
      acceptanceRate: null,
      replayCompatibility: caps.replay_compatibility,
      maxLoad: caps.max_load,
      currentLoad: 0,
      qualityHistory: [],
      failurePatterns: []
    });

    this._workers.set(id, { id, model: 'opencode-big-pickle', capabilities: caps.capabilities });
    this._stateMachine.transition(id, 'idle');
    return id;
  }

  async checkHealth(workerId) {
    const worker = this._workers.get(workerId);
    if (!worker) return false;

    const cached = this._healthCache[workerId];
    if (cached && Date.now() - cached.timestamp < 30000) {
      return cached.alive;
    }

    try {
      const alive = await this._pingModel(worker.model);
      this._healthCache[workerId] = { alive, timestamp: Date.now() };
      return alive;
    } catch {
      this._healthCache[workerId] = { alive: false, timestamp: Date.now() };
      return false;
    }
  }

  async checkAllHealth() {
    const results = [];
    for (const [workerId] of this._workers) {
      const alive = await this.checkHealth(workerId);
      results.push({ workerId, alive });
      if (!alive) {
        this._stateMachine.transition(workerId, 'failed', { reason: 'health_check_failed' });
      }
    }
    return results;
  }

  async queryModel(model, prompt, options = {}) {
    const url = `${OLLAMA_BASE}/api/generate`;
    const body = JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature: options.temperature || 0.1,
        num_predict: options.maxTokens || 4096
      }
    });

    const startTime = Date.now();

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`);
    }

    const data = await response.json();
    const latency = Date.now() - startTime;

    const workerId = `ollama:${model}`;
    this._capabilities.recordLatency(workerId, latency);

    return {
      text: data.response || '',
      latency,
      tokensGenerated: data.tokens_generated || 0,
      tokensPerSecond: data.tokens_per_second || 0
    };
  }

  async _listModels() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${OLLAMA_BASE}/api/tags`, {
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) return [];
      const data = await response.json();
      return (data.models || []).map(m => ({
        name: m.name,
        size: m.size,
        modifiedAt: m.modified_at
      }));
    } catch {
      return [];
    }
  }

  async _pingModel(model) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${OLLAMA_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt: 'ping', stream: false }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      return response.ok;
    } catch {
      return false;
    }
  }

  _resolveMapping(model) {
    const name = model.name.toLowerCase();
    for (const m of _modelMappings.provider_models) {
      if (name.includes(m.pattern)) {
        return {
          capabilities: [...m.capabilities, ...(_modelMappings.fallback.capabilities || [])],
          specialization: m.specialization,
          context_window: m.context_window,
          replay_compatibility: m.replay_compatibility,
          max_load: m.max_load
        };
      }
    }
    return {
      capabilities: [...(_modelMappings.fallback.capabilities || [])],
      specialization: _modelMappings.fallback.specialization,
      context_window: _modelMappings.fallback.context_window,
      replay_compatibility: _modelMappings.fallback.replay_compatibility,
      max_load: _modelMappings.fallback.max_load
    };
  }

  getWorker(id) {
    return this._workers.get(id);
  }

  listWorkers() {
    return Array.from(this._workers.values()).map(w => ({
      id: w.id,
      model: w.model,
      capabilities: w.capabilities,
      state: this._stateMachine.getState(w.id),
      contextWindow: w.contextWindow
    }));
  }
}

module.exports = { OllamaProvider };
