const crypto = require('crypto');

const MISSION_TYPES = {
  ENTROPY_REDUCTION: {
    requiredCapabilities: ['authority.audit.time', 'authority.audit.identity', 'authority.audit.hash'],
    priority: 8,
    description: 'Reduce entropy sources in production modules'
  },
  WITNESS_IMPROVEMENT: {
    requiredCapabilities: ['replay.verify', 'witness.improve'],
    priority: 7,
    description: 'Improve witness coverage in replay-visible modules'
  },
  DEAD_CODE_AUDIT: {
    requiredCapabilities: ['graph.audit.dependency', 'dead_code.analyze'],
    priority: 5,
    description: 'Audit dormant modules for safe deletion candidates'
  },
  REPLAY_PROOF: {
    requiredCapabilities: ['replay.verify', 'certificate.generate'],
    priority: 9,
    description: 'Generate replay proofs for production modules'
  },
  DEPENDENCY_AUDIT: {
    requiredCapabilities: ['graph.audit.dependency'],
    priority: 4,
    description: 'Audit import graph for cycles, leaks, violations'
  },
  AUTHORITY_AUDIT: {
    requiredCapabilities: ['authority.audit.time', 'authority.audit.identity', 'authority.audit.hash'],
    priority: 6,
    description: 'Audit for authority bypasses in target files'
  },
  SERIALIZATION_AUDIT: {
    requiredCapabilities: ['serialization.audit'],
    priority: 5,
    description: 'Find JSON.parse(JSON.stringify()) deep clones'
  },
  DOCUMENTATION: {
    requiredCapabilities: ['documentation.generate'],
    priority: 3,
    description: 'Generate or update documentation'
  },
  TEST_GENERATION: {
    requiredCapabilities: ['test.generate'],
    priority: 6,
    description: 'Generate constitutional tests'
  },
  CERTIFICATION: {
    requiredCapabilities: ['certificate.generate', 'replay.verify'],
    priority: 10,
    description: 'Full module certification (replay + witness + authority + serialization)'
  }
};

class MissionCompiler {
  constructor(intelligenceGraph, eventQueue) {
    this._graph = intelligenceGraph;
    this._events = eventQueue;
  }

  compileMissions(options = {}) {
    const missions = [];
    const production = this._graph.getProductionNodes();
    const dormant = this._graph.getDormantNodes();

    const highEntropy = production.filter(n => n.entropy_score > 0.3);
    if (highEntropy.length > 0) {
      for (const node of highEntropy) {
        missions.push(this._createMission('ENTROPY_REDUCTION', {
          target: node.path,
          entropy_score: node.entropy_score,
          entropy_sources: this._identifyEntropySources(node),
          priority: Math.round(node.entropy_score * 10),
          files: [node.path]
        }));
      }
    }

    const lowWitness = production.filter(n => n.witness_score < 0.3 && n.replay_visibility !== 'none');
    if (lowWitness.length > 0) {
      for (const node of lowWitness) {
        missions.push(this._createMission('WITNESS_IMPROVEMENT', {
          target: node.path,
          witness_score: node.witness_score,
          replay_visibility: node.replay_visibility,
          priority: node.replay_visibility === 'full' ? 10 : 6,
          files: [node.path]
        }));
      }
    }

    const dormantWithDeps = dormant.filter(n => n.dependent_modules.length > 0);
    if (dormantWithDeps.length > 0) {
      missions.push(this._createMission('DEAD_CODE_AUDIT', {
        count: dormantWithDeps.length,
        files: dormantWithDeps.map(n => n.path),
        priority: 5,
        description: `${dormantWithDeps.length} dormant modules have active dependents — audit required`
      }));
    }

    const uncertified = production.filter(n => {
      const certificate = options.certificates?.[n.path];
      return !certificate || certificate.certificate_score < 80;
    });
    if (uncertified.length > 0) {
      missions.push(this._createMission('CERTIFICATION', {
        count: uncertified.length,
        files: uncertified.map(n => n.path),
        priority: 10,
        description: `${uncertified.length} production modules lack certification — full certification sweep`
      }));
    }

    if (missions.length === 0) {
      missions.push(this._createMission('DOCUMENTATION', {
        priority: 1,
        description: 'All clear — background documentation and graph maintenance',
        files: []
      }));
    }

    missions.sort((a, b) => b.metadata.priority - a.metadata.priority);

    for (const mission of missions) {
      this._events.emit('mission_created', { missionId: mission.id, type: mission.type, target: mission.target });
    }

    return missions;
  }

  compileMissionFromGitDiff(diff, graph) {
    const changedFiles = diff.split('\n')
      .filter(l => l.endsWith('.js') && !l.includes('node_modules'))
      .map(l => l.replace(/^[A-Z]\s+/, '').trim());

    if (changedFiles.length === 0) return [];

    const missions = [];
    for (const file of changedFiles) {
      const node = graph.getNode(file);
      if (!node) continue;

      if (node.classification === 'production') {
        missions.push(this._createMission('AUTHORITY_AUDIT', {
          target: file,
          files: [file],
          priority: 8,
          description: `Changed production module requires authority audit: ${file}`
        }));

        if (node.entropy_score > 0.2) {
          missions.push(this._createMission('ENTROPY_REDUCTION', {
            target: file,
            files: [file],
            entropy_score: node.entropy_score,
            priority: Math.round(node.entropy_score * 10),
            description: `Changed file has entropy ${node.entropy_score}: ${file}`
          }));
        }
      }

      if (node.replay_visibility !== 'none') {
        missions.push(this._createMission('REPLAY_PROOF', {
          target: file,
          files: [file],
          priority: 9,
          description: `Changed replay-visible module requires fresh replay proof: ${file}`
        }));
      }
    }

    return missions;
  }

  _createMission(type, overrides = {}) {
    const template = MISSION_TYPES[type];
    const mission = {
      id: `msn_${crypto.createHash('sha256').update(type + JSON.stringify(overrides)).digest('hex').substring(0, 16)}`,
      type,
      target: overrides.target || null,
      files: overrides.files || [],
      metadata: {
        priority: overrides.priority || template.priority,
        requiredCapabilities: template.requiredCapabilities,
        description: overrides.description || template.description
      },
      status: 'pending',
      workerAssignments: [],
      artifacts: [],
      consensus: null
    };
    return mission;
  }

  _identifyEntropySources(node) {
    const content = node.content || '';
    const sources = [];
    if (/Date\.now\(\)/.test(content)) sources.push('Date.now()');
    if (/new Date\(\)/.test(content)) sources.push('new Date()');
    if (/Math\.random\(\)/.test(content)) sources.push('Math.random()');
    if (/crypto\.randomUUID/.test(content)) sources.push('crypto.randomUUID');
    if (/crypto\.createHash/.test(content)) sources.push('crypto.createHash');
    if (/exec\(|execSync\(/.test(content)) sources.push('subprocess');
    return sources;
  }
}

module.exports = { MissionCompiler, MISSION_TYPES };
