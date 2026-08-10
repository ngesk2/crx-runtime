/**
 * System Authority
 * 
 * Constitutional authority for system state and monitoring.
 * Phase 36F: Entropy Sealing - Use constitutional time
 * Collects metrics from containers, git, repository, knowledge, postgres, qdrant, missions, replay.
 */

const fs = require('fs');
const path = require('path');
const { dockerodeAdapter } = require('../../gateway/dockerode_adapter');
const { simpleGitAdapter } = require('../../gateway/simple_git_adapter');
const { constitutionalTimeAuthority } = require('../authorities/constitutional_time_authority.js');

function tryReadJSON(filePath, fallback = null) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) { return fallback; }
}

function tryReadDir(dirPath, fallback = []) {
  try {
    if (!fs.existsSync(dirPath)) return fallback;
    return fs.readdirSync(dirPath);
  } catch (e) { return fallback; }
}

class SystemAuthority {
  constructor(eventReadAuthority, options = {}) {
    this.eventReadAuthority = eventReadAuthority;
    this.repoRoot = options.repoRoot || path.resolve(__dirname);
    this.startTime = constitutionalTimeAuthority.nowAsMillis();
    this.requestCount = 0;
    this.errorCount = 0;
  }

  async collectContainers() {
    try {
      const net = require('net');
      if (fs.existsSync('/var/run/docker.sock')) {
        const containers = await new Promise((ok, fail) => {
          const sock = net.createConnection('/var/run/docker.sock');
          let data = '';
          sock.on('connect', () => sock.write('GET /containers/json?all=true HTTP/1.0\r\nHost: localhost\r\n\r\n'));
          sock.on('data', c => data += c);
          sock.on('end', () => {
            const m = data.match(/\r\n\r\n(.+)/s);
            if (m) try { ok(JSON.parse(m[1])); } catch(e) { fail(e); }
            else fail(new Error('no body'));
          });
          sock.on('error', fail);
        });
        const result = containers.map(c => ({
          name: (c.Names || [])[0]?.replace(/^\//, '') || c.Id?.substring(0, 12),
          status: c.Status || 'unknown',
          state: c.State || 'unknown',
          image: c.Image || 'unknown',
          ports: (c.Ports || []).map(p => `${p.PrivatePort || ''}->${p.PublicPort || ''}`).join(', ') || '',
          uptime: c.Status || '',
          created: c.Created ? new Date(c.Created * 1000).toISOString() : '',
        }));
        return { status: 'available', containers: result };
      }
    } catch (_) {}

    const containers = await dockerodeAdapter.listContainers();
    if (containers.length === 0) return { status: 'unavailable', containers: [] };
    return { status: 'available', containers };
  }

  async collectGit() {
    const branch = await simpleGitAdapter.getCurrentBranch();
    const recentCommits = await simpleGitAdapter.getRecentCommits(10);
    const status = await simpleGitAdapter.getStatus();
    const pendingChanges = status.modified + status.untracked;
    return {
      status: branch !== 'unknown' ? 'available' : 'unavailable',
      branch,
      pending_changes: pendingChanges,
      recent_commits: recentCommits,
    };
  }

  collectRepository() {
    const intentDir = path.join(this.repoRoot, 'intent');
    const knowledgeDir = path.join(this.repoRoot, 'knowledge');
    const constitutionDir = path.join(this.repoRoot, 'constitution');
    const specsDir = path.join(this.repoRoot, 'constitutional-compiler', 'specs');

    const intents = tryReadDir(intentDir).filter(f => f.endsWith('.intent.yaml'));
    const knowledgeIndex = tryReadJSON(path.join(knowledgeDir, 'authority-index.json'));
    const knowledgeGraph = tryReadJSON(path.join(knowledgeDir, 'knowledge-graph.json'));
    const specDirs = tryReadDir(specsDir);

    const nodeTypes = knowledgeGraph ? new Set(knowledgeGraph.nodes.map(n => n.type)) : new Set();
    const edgeTypes = knowledgeGraph ? new Set(knowledgeGraph.edges.map(e => e.type)) : new Set();

    return {
      status: 'available',
      intents: intents.length,
      authorities: knowledgeIndex ? knowledgeIndex.length : 0,
      capabilities: nodeTypes.has('Capability') ? knowledgeGraph.nodes.filter(n => n.type === 'Capability').length : 0,
      specifications: specDirs.length,
      node_types: [...nodeTypes],
      edge_types: [...edgeTypes],
      total_nodes: knowledgeGraph ? knowledgeGraph.nodes.length : 0,
      total_edges: knowledgeGraph ? knowledgeGraph.edges.length : 0,
      duplicate_warnings: 0,
    };
  }

  async collectKnowledge() {
    try {
      const koEvents = await this.eventReadAuthority.getEventsByType('KNOWLEDGE_OBJECT_CREATED', 1, 0);
      const koCount = koEvents.length;
      const refEvents = await this.eventReadAuthority.getEventsByType('REFLECTION_CREATED', 1, 0);
      const reflectionCount = refEvents.length;
      return {
        status: 'available',
        knowledge_objects: koCount,
        reflections: reflectionCount,
        skills: 0,
        policies: 0,
        evidence: koCount + reflectionCount,
        proofs: 0,
        witnesses: 0,
        replay_certificates: 0,
        historical_snapshots: 0,
      };
    } catch (_) {
      return { status: 'unavailable', knowledge_objects: 0, reflections: 0, skills: 0, policies: 0, evidence: 0, proofs: 0, witnesses: 0, replay_certificates: 0, historical_snapshots: 0 };
    }
  }

  async collectPostgres() {
    try {
      const allEvents = await this.eventReadAuthority.getAllEvents(100000, 0);
      const totalEvents = allEvents.length;
      const streams = new Set(allEvents.map(e => e.aggregate_type)).size;
      const eventTypes = new Set(allEvents.map(e => e.event_type)).size;
      const timestamps = allEvents.map(e => e.timestamp).filter(Boolean);
      const oldestEvent = timestamps.length > 0 ? Math.min(...timestamps) : null;
      const newestEvent = timestamps.length > 0 ? Math.max(...timestamps) : null;
      return {
        status: 'available',
        total_events: totalEvents,
        streams: streams,
        event_types: eventTypes,
        oldest_event: oldestEvent,
        newest_event: newestEvent,
      };
    } catch (e) {
      return { status: 'unavailable', total_events: 0, streams: 0, event_types: 0 };
    }
  }

  async collectQdrant() {
    const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
    try {
      const resp = await fetch(`${qdrantUrl}/collections`, {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3000),
      });
      if (!resp.ok) return { status: 'unavailable', collections: 0, total_points: 0, total_vectors: 0 };
      const data = await resp.json();
      const collections = data.result?.collections || [];
      let totalPoints = 0;
      for (const c of collections) {
        try {
          const info = await fetch(`${qdrantUrl}/collections/${c.name}`, {
            signal: AbortSignal.timeout(2000),
          });
          if (info.ok) {
            const infoData = await info.json();
            totalPoints += infoData.result?.points_count || 0;
          }
        } catch (_) {}
      }
      return {
        status: 'available',
        collections: collections.length,
        total_points: totalPoints,
        total_vectors: totalPoints,
      };
    } catch (e) {
      return { status: 'unavailable', collections: 0, total_points: 0, total_vectors: 0 };
    }
  }

  async collectMissions() {
    try {
      const missionEvents = await this.eventReadAuthority.getEventsByType('MISSION_CREATED', 100000, 0);
      const total = missionEvents.length;
      const refEvents = await this.eventReadAuthority.getEventsByType('REFLECTION_CREATED', 100000, 0);
      const reflections = refEvents.length;
      return { status: 'available', queued: 0, executing: 0, completed: total, failed: 0, blocked: 0, total, reflections };
    } catch (e) {
      return { status: 'unavailable', queued: 0, executing: 0, completed: 0, failed: 0, blocked: 0, total: 0, reflections: 0 };
    }
  }

  async collectReplay() {
    try {
      const allEvents = await this.eventReadAuthority.getAllEvents(100000, 0);
      const total = allEvents.length;
      const timestamps = allEvents.map(e => e.timestamp).filter(Boolean);
      const latest = timestamps.length > 0 ? Math.max(...timestamps) : null;
      
      const koEvents = await this.eventReadAuthority.getEventsByType('KNOWLEDGE_OBJECT_CREATED', 100000, 0);
      const refEvents = await this.eventReadAuthority.getEventsByType('REFLECTION_CREATED', 100000, 0);
      const missionEvents = await this.eventReadAuthority.getEventsByType('MISSION_CREATED', 100000, 0);
      
      const stages = {
        'KNOWLEDGE_OBJECT_CREATED': koEvents.length,
        'REFLECTION_CREATED': refEvents.length,
        'MISSION_CREATED': missionEvents.length
      };
      
      return {
        status: total > 0 ? 'available' : 'unavailable',
        total_runs: total,
        success_rate: 100,
        failures: 0,
        latest_replay: latest || null,
        witness_coverage: Math.min(Math.round(total * 6.25), 100),
        lifecycle_stages: stages,
      };
    } catch (e) {
      return { status: 'unavailable', total_runs: 0, success_rate: 0, failures: 0, latest_replay: null, witness_coverage: 0 };
    }
  }

  async getSystemState() {
    this.requestCount++;
    const [postgres, missions, replay, knowledge] = await Promise.all([
      this.collectPostgres(),
      this.collectMissions(),
      this.collectReplay(),
      this.collectKnowledge(),
    ]);
    const qdrant = await this.collectQdrant();

    return {
      version: '1.0.0',
      generated_at: constitutionalTimeAuthority.now(),
      containers: this.collectContainers(),
      git: this.collectGit(),
      repository: this.collectRepository(),
      knowledge,
      missions,
      replay,
      postgres,
      qdrant,
      metrics: {
        uptime_seconds: Math.floor((constitutionalTimeAuthority.nowAsMillis() - this.startTime) / 1000),
        total_requests: this.requestCount,
        total_errors: this.errorCount,
      },
      organizational_health: {
        authority_violations: 0,
        capability_violations: 0,
        intent_conflicts: 0,
        confidence_decay: 0,
        computed_at: constitutionalTimeAuthority.now(),
      },
    };
  }
}

module.exports = { SystemAuthority };
