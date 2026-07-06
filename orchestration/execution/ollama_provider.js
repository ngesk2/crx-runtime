const http = require('http');

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

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
      const capabilities = this._inferCapabilities(model);
      const contextWindow = this._inferContextWindow(model);

      const specialization = this._inferSpecialization(model);
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
        replayCompatibility: model.name.includes('coder'),
        maxLoad: model.name.includes('70b') ? 1 : model.name.includes('14b') ? 2 : 4,
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
    const capabilities = [
      'authority.audit.time', 'authority.audit.identity', 'authority.audit.hash',
      'graph.audit.dependency', 'dead_code.analyze', 'replay.verify',
      'documentation.generate', 'test.generate', 'certificate.generate',
      'orchestration.plan', 'orchestration.review', 'orchestration.merge'
    ];

    this._capabilities.registerWorker(id, {
      model: 'opencode-big-pickle',
      capabilities,
      specialization: 'orchestration',
      contextWindow: 128000,
      avgLatency: 0,
      avgTokens: 0,
      avgConfidence: null,
      acceptanceRate: null,
      replayCompatibility: true,
      maxLoad: 10,
      currentLoad: 0,
      qualityHistory: [],
      failurePatterns: []
    });

    this._workers.set(id, { id, model: 'opencode-big-pickle', capabilities });
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

  _inferCapabilities(model) {
    const name = model.name.toLowerCase();
    const caps = [];

    if (name.includes('coder') || name.includes('codeqwen') || name.includes('deepseek')) {
      caps.push('authority.audit.time', 'authority.audit.hash', 'authority.audit.identity');
      caps.push('dead_code.analyze');
      caps.push('replay.verify');
      caps.push('test.generate');
    }

    if (name.includes('qwen') || name.includes('deepseek') || name.includes('mixtral')) {
      caps.push('documentation.generate');
      caps.push('graph.audit.dependency');
    }

    caps.push('serialization.audit');
    caps.push('certificate.generate');

    return caps;
  }

  _inferSpecialization(model) {
    const name = model.name.toLowerCase();
    if (name.includes('coder') || name.includes('codeqwen')) return 'code_audit';
    if (name.includes('deepseek')) return 'architecture';
    if (name.includes('qwen')) return 'general_purpose';
    if (name.includes('mixtral')) return 'analysis';
    return 'general_purpose';
  }

  _inferContextWindow(model) {
    const name = model.name.toLowerCase();
    if (name.includes('128k') || name.includes('deepseek')) return 128000;
    if (name.includes('32k') || name.includes('qwen')) return 32768;
    if (name.includes('8k')) return 8192;
    return 4096;
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
