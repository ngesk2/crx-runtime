const crypto = require('crypto');
const { deterministicIdAuthority } = require('./deterministic_id_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');

const PROVIDER_DEFS = {
  github: {
    name: 'GitHub',
    icon: '🔗',
    type: 'external',
    capabilities: [
      { id: 'READ_REPOSITORY', label: 'Read Repository', authority: 'RepositoryAuthority', replayable: true },
      { id: 'READ_COMMITS', label: 'Read Commits', authority: 'RepositoryAuthority', replayable: true },
      { id: 'READ_PULL_REQUESTS', label: 'Read Pull Requests', authority: 'RepositoryAuthority', replayable: true },
      { id: 'READ_ISSUES', label: 'Read Issues', authority: 'RepositoryAuthority', replayable: true },
      { id: 'READ_ACTIONS', label: 'Read Actions', authority: 'RepositoryAuthority', replayable: true },
    ],
    testConnection: async () => {
      try {
        const resp = await fetch('https://api.github.com/rate_limit', {
          signal: AbortSignal.timeout(5000),
          headers: { 'User-Agent': 'crx-gateway/1.0' },
        });
        if (!resp.ok) return { connected: false, error: `HTTP ${resp.status}` };
        const data = await resp.json();
        return { connected: true, latency: 0, rateLimit: data.resources?.core || {} };
      } catch (e) {
        return { connected: false, error: e.message };
      }
    },
  },
  filesystem: {
    name: 'Filesystem',
    icon: '📁',
    type: 'local',
    capabilities: [
      { id: 'READ', label: 'Read Files', authority: 'RepositoryAuthority', replayable: true },
      { id: 'WRITE', label: 'Write Files', authority: 'RepositoryAuthority', replayable: false },
      { id: 'WATCH', label: 'Watch Directory', authority: 'RepositoryAuthority', replayable: false },
    ],
    testConnection: async () => {
      try {
        const fs = require('fs');
        fs.accessSync(process.cwd(), fs.constants.R_OK);
        return { connected: true, latency: 0 };
      } catch (e) {
        return { connected: false, error: e.message };
      }
    },
  },
  docker: {
    name: 'Docker',
    icon: '🐳',
    type: 'local',
    capabilities: [
      { id: 'EXECUTE', label: 'Execute Command', authority: 'ExecutionAuthority', replayable: false },
      { id: 'LIST_CONTAINERS', label: 'List Containers', authority: 'RepositoryAuthority', replayable: false },
      { id: 'LOGS', label: 'View Logs', authority: 'RepositoryAuthority', replayable: true },
      { id: 'STOP', label: 'Stop Container', authority: 'ExecutionAuthority', replayable: false },
      { id: 'START', label: 'Start Container', authority: 'ExecutionAuthority', replayable: false },
    ],
    testConnection: async () => {
      try {
        const resp = await fetch('http://localhost:8080/system/containers', {
          signal: AbortSignal.timeout(3000),
        });
        if (!resp.ok) return { connected: false, error: `HTTP ${resp.status}` };
        return { connected: true, latency: 0 };
      } catch (e) {
        return { connected: false, error: e.message };
      }
    },
  },
  git: {
    name: 'Git',
    icon: '🔀',
    type: 'local',
    capabilities: [
      { id: 'READ_COMMITS', label: 'Read Commits', authority: 'RepositoryAuthority', replayable: true },
      { id: 'READ_BRANCHES', label: 'Read Branches', authority: 'RepositoryAuthority', replayable: true },
      { id: 'READ_DIFF', label: 'Read Diff', authority: 'RepositoryAuthority', replayable: true },
    ],
    testConnection: async () => {
      try {
        const { simpleGitAdapter } = require('./simple_git_adapter');
        const available = await simpleGitAdapter.isAvailable();
        return { connected: available, latency: 0 };
      } catch (e) {
        return { connected: false, error: e.message };
      }
    },
  },
  postgresql: {
    name: 'PostgreSQL',
    icon: '🗄️',
    type: 'core',
    capabilities: [
      { id: 'READ_EVENTS', label: 'Read Events', authority: 'RepositoryAuthority', replayable: true },
      { id: 'WRITE_EVENTS', label: 'Write Events', authority: 'RepositoryAuthority', replayable: true },
      { id: 'QUERY', label: 'Query', authority: 'RepositoryAuthority', replayable: true },
    ],
    testConnection: async () => {
      try {
        const { Pool } = require('pg');
        const pool = new Pool({
          host: process.env.POSTGRES_HOST || 'brain-postgres',
          port: process.env.POSTGRES_PORT || '5432',
          database: process.env.POSTGRES_DB || 'crx_runtime',
          user: process.env.POSTGRES_USER || 'postgres',
          password: process.env.POSTGRES_PASSWORD || '',
          max: 1,
          connectionTimeoutMillis: 3000,
        });
        const result = await pool.query('SELECT 1 as ok');
        await pool.end();
        return { connected: true, latency: 0 };
      } catch (e) {
        return { connected: false, error: e.message };
      }
    },
  },
  qdrant: {
    name: 'Qdrant',
    icon: '🧠',
    type: 'core',
    capabilities: [
      { id: 'SEARCH_VECTORS', label: 'Search Vectors', authority: 'ProjectionAuthority', replayable: true },
      { id: 'UPSERT_VECTORS', label: 'Upsert Vectors', authority: 'ProjectionAuthority', replayable: true },
      { id: 'LIST_COLLECTIONS', label: 'List Collections', authority: 'ProjectionAuthority', replayable: true },
    ],
    testConnection: async () => {
      try {
        const url = process.env.QDRANT_URL || 'http://localhost:6333';
        const resp = await fetch(`${url}/collections`, {
          signal: AbortSignal.timeout(3000),
        });
        if (!resp.ok) return { connected: false, error: `HTTP ${resp.status}` };
        return { connected: true, latency: 0 };
      } catch (e) {
        return { connected: false, error: e.message };
      }
    },
  },
  ollama: {
    name: 'Ollama',
    icon: '🤖',
    type: 'inference',
    capabilities: [
      { id: 'CHAT', label: 'Chat Completion', authority: 'InferenceAuthority', replayable: false },
      { id: 'EMBED', label: 'Generate Embeddings', authority: 'InferenceAuthority', replayable: false },
      { id: 'LIST_MODELS', label: 'List Models', authority: 'InferenceAuthority', replayable: false },
    ],
    testConnection: async () => {
      try {
        const url = process.env.INFERENCE_BASE_URL || 'http://brain-ollama:11434';
        const resp = await fetch(`${url}/api/tags`, {
          signal: AbortSignal.timeout(3000),
        });
        if (!resp.ok) return { connected: false, error: `HTTP ${resp.status}` };
        const data = await resp.json();
        return { connected: true, latency: 0, models: (data.models || []).map(m => m.name) };
      } catch (e) {
        return { connected: false, error: e.message, disabled: true };
      }
    },
  },
};

const FUTURE_PROVIDERS = [
  { name: 'Slack', icon: '💬', type: 'external' },
  { name: 'Discord', icon: '🎮', type: 'external' },
  { name: 'Email', icon: '📧', type: 'external' },
  { name: 'Calendar', icon: '📅', type: 'external' },
  { name: 'Browser', icon: '🌐', type: 'external' },
  { name: 'VS Code', icon: '💻', type: 'external' },
];

const AUTHORITY_CAPABILITY_MAP = {
  RepositoryAuthority: ['READ_EVENTS', 'WRITE_EVENTS', 'QUERY', 'READ_REPOSITORY', 'READ_COMMITS',
    'READ_PULL_REQUESTS', 'READ_ISSUES', 'READ_ACTIONS', 'READ', 'WRITE', 'WATCH',
    'LIST_CONTAINERS', 'LOGS', 'READ_BRANCHES', 'READ_DIFF'],
  ProjectionAuthority: ['SEARCH_VECTORS', 'UPSERT_VECTORS', 'LIST_COLLECTIONS'],
  ExecutionAuthority: ['EXECUTE', 'STOP', 'START'],
  InferenceAuthority: ['CHAT', 'EMBED', 'LIST_MODELS'],
};

class MCPRegistry {
  constructor() {
    this.providers = {};
    this.eventLog = [];
    this.maxEventLog = 500;
    this.queue = { queued: 0, running: 0, completed: 0, failed: 0, retrying: 0, blocked: 0 };
    this.providerHistory = {};
    for (const [key, def] of Object.entries(PROVIDER_DEFS)) {
      this.providers[key] = {
        ...def,
        id: key,
        enabled: key !== 'ollama',
        status: 'pending',
        connected: false,
        latency: 0,
        authStatus: 'unknown',
        lastEvent: null,
        eventsProcessed: 0,
        capabilities: def.capabilities.map(c => ({ ...c, enabled: key !== 'ollama' })),
      };
      this.providerHistory[key] = [];
    }
  }

  async refreshAll() {
    const results = await Promise.allSettled(
      Object.entries(this.providers).map(async ([key, provider]) => {
        if (!provider.enabled) return;
        const start = Date.now();
        const result = await provider.testConnection();
        const latency = Date.now() - start;
        provider.latency = latency;
        provider.connected = result.connected;
        provider.status = result.connected ? 'healthy'
          : result.disabled ? 'disabled'
          : 'disconnected';
        if (result.error) provider.lastError = result.error;
        this.providerHistory[key].push({ status: provider.status, latency, timestamp: new Date().toISOString() });
        if (this.providerHistory[key].length > 100) this.providerHistory[key].shift();
      })
    );
  }

  getProvider(name) {
    return this.providers[name] || null;
  }

  getAllProviders() {
    return Object.values(this.providers);
  }

  getFutureProviders() {
    return FUTURE_PROVIDERS;
  }

  getCapabilityMatrix() {
    const rows = [];
    for (const [authority, caps] of Object.entries(AUTHORITY_CAPABILITY_MAP)) {
      for (const capId of caps) {
        const providers = Object.values(this.providers).filter(p =>
          p.capabilities.some(c => c.id === capId)
        );
        const providerNames = providers.map(p => p.name);
        const anyEnabled = providers.some(p => p.enabled);
        rows.push({
          capability: capId,
          label: PROVIDER_DEFS.github?.capabilities.find(c => c.id === capId)?.label || capId,
          authority,
          providers: providerNames,
          enabled: anyEnabled,
          replayable: providers.some(p => p.capabilities.find(c => c.id === capId)?.replayable),
        });
      }
    }
    return rows;
  }

  pushEvent(event) {
    const { identityAuthority } = require('./identity_authority');
    const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
    const entry = {
      id: identityAuthority.generateId('event', { type: 'event' }),
      timestamp: constitutionalTimeAuthority.now(),
      ...event,
    };
    this.eventLog.push(entry);
    if (this.eventLog.length > this.maxEventLog) this.eventLog.shift();
    if (event.provider && this.providers[event.provider]) {
      this.providers[event.provider].eventsProcessed++;
      this.providers[event.provider].lastEvent = entry;
    }
    if (event.type === 'completed') this.queue.completed++;
    else if (event.type === 'failed') this.queue.failed++;
    else if (event.type === 'queued') this.queue.queued++;
    else if (event.type === 'running') this.queue.running++;
    else if (event.type === 'retrying') this.queue.retrying++;
    return entry;
  }

  getEvents(limit = 50) {
    return this.eventLog.slice(-limit);
  }

  getQueueStats() {
    return { ...this.queue };
  }

  enableProvider(name, enabled) {
    const p = this.providers[name];
    if (!p) return false;
    p.enabled = enabled;
    p.capabilities.forEach(c => c.enabled = enabled);
    this.pushEvent({
      type: enabled ? 'resumed' : 'paused',
      provider: name,
      source: 'mcp_registry',
      message: `Provider ${name} ${enabled ? 'enabled' : 'disabled'}`,
    });
    return true;
  }

  getReplayQueue() {
    return this.eventLog
      .filter(e => e.replayable !== false)
      .slice(-30)
      .map(e => ({
        id: e.id,
        timestamp: e.timestamp,
        type: e.type,
        provider: e.provider,
        authority: e.authority || 'unknown',
        message: e.message || '',
        replayed: false,
      }));
  }

  pauseProvider(name) { return this.enableProvider(name, false); }
  resumeProvider(name) { return this.enableProvider(name, true); }

  async reconnectProvider(name) {
    const p = this.providers[name];
    if (!p) return false;
    const start = Date.now();
    const result = await p.testConnection();
    p.latency = Date.now() - start;
    p.connected = result.connected;
    p.status = result.connected ? 'healthy' : 'disconnected';
    this.pushEvent({
      type: 'reconnect',
      provider: name,
      source: 'mcp_registry',
      message: `Provider ${name} reconnected: ${p.connected}`,
    });
    return p.connected;
  }

  simulatePipelineEvent() {
    const stages = [
      'GitHub Repository Event',
      'RepositoryAuthority',
      'KnowledgeEventBus',
      'IdentityAuthority',
      'CanonicalHashAuthority',
      'EmbeddingAuthority',
      'ProjectionAuthority',
      'Knowledge Graph',
      'Semantic Memory',
      'Mission Generation',
      'Reflection',
      'Recommendation',
      'Execution Planning',
      'Command Center',
    ];
    // Phase 36F: Use deterministic selection instead of Math.random
    const stageIndex = deterministicIdAuthority.generateIdFromObject({ context: 'stage', timestamp: constitutionalTimeAuthority.now() }).charCodeAt(0) % stages.length;
    const stage = stages[stageIndex];
    const providers = Object.keys(this.providers);
    const providerIndex = deterministicIdAuthority.generateIdFromObject({ context: 'provider', timestamp: constitutionalTimeAuthority.now() }).charCodeAt(0) % providers.length;
    const provider = providers[providerIndex];
    const types = ['queued', 'running', 'completed'];
    const typeIndex = deterministicIdAuthority.generateIdFromObject({ context: 'type', timestamp: constitutionalTimeAuthority.now() }).charCodeAt(0) % types.length;
    const type = types[typeIndex];

    this.pushEvent({
      type,
      provider,
      source: 'pipeline',
      stage,
      authority: stage,
      message: `[${stage}] ${type === 'completed' ? '✓' : type === 'running' ? '→' : '○'} processed`,
      replayable: type === 'completed',
    });
  }
}

module.exports = { MCPRegistry, PROVIDER_DEFS, AUTHORITY_CAPABILITY_MAP };
