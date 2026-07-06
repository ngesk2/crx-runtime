const crypto = require('crypto');

class ContextAuthority {
  constructor(intelligenceGraph, artifactStore, eventQueue) {
    this._graph = intelligenceGraph;
    this._store = artifactStore;
    this._events = eventQueue;
    this._adrIndex = this._buildADRIndex();
  }

  buildContext(mission, workerId) {
    const files = mission.files || [];
    const fileNodes = files.map(f => this._graph.getNode(f)).filter(Boolean);
    const production = this._graph.getProductionNodes();
    const dormant = this._graph.getDormantNodes();
    const authorities = this._graph.getAuthorities();

    const repoSlice = {
      totalProduction: production.length,
      totalDormant: dormant.length,
      totalNodes: production.length + dormant.length,
      totalAuthorities: authorities.length,
      totalEdges: (this._graph._edges || []).length
    };

    const fileSlice = fileNodes.map(n => ({
      path: n.path,
      lines: n.lines,
      exports: n.exports,
      requires: n.requires,
      classification: n.classification,
      authority_owner: n.authority_owner,
      replay_visibility: n.replay_visibility,
      entropy_score: n.entropy_score,
      witness_score: n.witness_score,
      serialization_score: n.serialization_score,
      dependent_modules: n.dependent_modules
    }));

    const depGraph = {};
    for (const node of fileNodes) {
      depGraph[node.path] = {
        imports: node.requires,
        dependents: node.dependent_modules,
        allDependents: this._collectAllDependents(node, production)
      };
    }

    const relevantAuthorities = authorities.filter(a =>
      fileNodes.some(n => n.path.includes(a.name.replace('.js', '')))
    );

    const authSlice = relevantAuthorities.map(a => ({
      name: a.name,
      exports: a.exports,
      path: a.path,
      className: a.classification || 'unknown'
    }));

    const replaySlice = fileNodes.map(n => ({
      path: n.path,
      replayVisibility: n.replay_visibility,
      witnessScore: n.witness_score,
      entropyScore: n.entropy_score,
      hasAuthority: !!n.authority_owner
    }));

    const violations = [];
    for (const node of fileNodes) {
      if (node.entropy_score > 0.3) {
        violations.push({ path: node.path, type: 'high_entropy', score: node.entropy_score });
      }
      if (node.witness_score < 0.3 && node.replay_visibility !== 'none') {
        violations.push({ path: node.path, type: 'low_witness', score: node.witness_score });
      }
      if (node.serialization_score < 0.5) {
        violations.push({ path: node.path, type: 'serialization_risk', score: node.serialization_score });
      }
    }

    const priorArtifacts = this._findPriorArtifacts(files, mission.type);
    const relevantADRs = this._findRelevantADRs(files);

    const context = {
      mission: {
        id: mission.id,
        type: mission.type,
        target: mission.target,
        description: mission.metadata.description,
        priority: mission.metadata.priority
      },
      repository_slice: repoSlice,
      file_slice: fileSlice,
      dependency_graph: depGraph,
      authority_slice: authSlice,
      replay_slice: replaySlice,
      prior_artifacts: priorArtifacts,
      relevant_adrs: relevantADRs,
      known_violations: violations,
      canonical_laws: [
        'Truth = immutable verified event',
        'Authority flows from declared class, not inference',
        'All replay-visible operations must be deterministic',
        'No module creates its own authorities',
        'Every wall-clock access must route through ConstitutionalTimeAuthority',
        'Every hash must route through CanonicalAuthority',
        'Every identity must route through RuntimeIdentityAuthority',
        'Dormant code is constitutional debt until archived'
      ],
      worker_id: workerId,
      context_hash: null
    };

    context.context_hash = crypto.createHash('sha256')
      .update(JSON.stringify(context))
      .digest('hex')
      .substring(0, 16);

    if (this._events) {
      this._events.emit('context_built', {
        missionId: mission.id,
        workerId,
        fileCount: fileNodes.length,
        violationCount: violations.length,
        contextHash: context.context_hash
      });
    }

    return context;
  }

  buildPrompt(mission, context, workerMemory) {
    const parts = [];

    parts.push(`CONSTITUTIONAL MISSION: ${mission.type}`);
    parts.push(`Target: ${mission.target || '(repository-wide)'}`);
    parts.push(`Priority: ${mission.metadata.priority}`);
    parts.push(`Description: ${mission.metadata.description}`);
    parts.push('');

    if (context.file_slice && context.file_slice.length > 0) {
      parts.push('--- TARGET FILES ---');
      for (const f of context.file_slice) {
        parts.push(`  ${f.path} (${f.lines} lines, entropy: ${f.entropy_score}, witness: ${f.witness_score}, owner: ${f.authority_owner || 'none'})`);
      }
      parts.push('');
    }

    if (context.authority_slice && context.authority_slice.length > 0) {
      parts.push('--- APPLICABLE AUTHORITIES ---');
      for (const a of context.authority_slice) {
        parts.push(`  ${a.name} (${a.className}) — ${a.path}`);
      }
      parts.push('');
    }

    if (context.prior_artifacts && context.prior_artifacts.length > 0) {
      parts.push('--- PRIOR ARTIFACTS ---');
      for (const a of context.prior_artifacts.slice(-5)) {
        parts.push(`  [${a.type}] ${a.worker_id} — confidence: ${a.confidence}`);
      }
      parts.push('');
    }

    if (context.relevant_adrs && context.relevant_adrs.length > 0) {
      parts.push('--- RELEVANT ADRs ---');
      for (const adr of context.relevant_adrs) {
        parts.push(`  ${adr.title}`);
        parts.push(`    Decision: ${adr.decision}`);
        parts.push(`    Status: ${adr.status}`);
      }
      parts.push('');
    }

    if (context.known_violations && context.known_violations.length > 0) {
      parts.push('--- KNOWN VIOLATIONS ---');
      for (const v of context.known_violations) {
        parts.push(`  [${v.type}] ${v.path} (score: ${v.score})`);
      }
      parts.push('');
    }

    parts.push('--- CONSTITUTIONAL CONSTRAINTS ---');
    for (const law of context.canonical_laws) {
      parts.push(`  ${law}`);
    }
    parts.push('');
    parts.push('ABSOLUTE PROHIBITIONS:');
    parts.push('  You may NOT create new authorities');
    parts.push('  You may NOT bypass RuntimeIdentityAuthority, CanonicalAuthority, ConstitutionalTimeAuthority');
    parts.push('  You produce PROPOSALS only — never direct modifications');
    parts.push('  You may NOT use Math.random() or any non-deterministic source');
    parts.push('');

    if (workerMemory) {
      parts.push('--- WORKER MEMORY ---');
      parts.push(workerMemory);
      parts.push('');
    }

    parts.push('--- REQUIRED OUTPUT ---');
    const schema = mission.type === 'ENTROPY_REDUCTION' ? `{
  "findings": [{
    "file": "path",
    "line": number,
    "pattern": "original code",
    "bypass_type": "Date.now|Math.random|crypto.createHash",
    "correct_authority": "ConstitutionalTimeAuthority|RuntimeIdentityAuthority|CanonicalAuthority",
    "confidence": 0.0-1.0,
    "risk": "critical|high|medium|low"
  }],
  "patch": "diff format or null",
  "replay_impact": "deterministic analysis",
  "confidence": 0.0-1.0
}` : `{
  "findings": [],
  "analysis": "text analysis",
  "replay_proof": {},
  "confidence": 0.0-1.0
}`;
    parts.push(schema);

    const prompt = parts.join('\n');

    if (this._events) {
      this._events.emit('prompt_generated', {
        missionId: mission.id,
        promptLength: prompt.length,
        promptHash: crypto.createHash('sha256').update(prompt).digest('hex')
      });
    }

    return prompt;
  }

  _findPriorArtifacts(files, missionType) {
    if (!this._store) return [];
    const artifacts = [];
    for (const file of files) {
      const byFile = this._store.findByFile ? this._store.findByFile(file) : [];
      for (const a of byFile) {
        if (a.type === 'proposal' || a.type === 'analysis' || a.type === 'consensus_proof') {
          artifacts.push({
            id: a.id,
            type: a.type,
            worker_id: a.workerId || a.worker_id,
            mission_id: a.missionId || a.mission_id,
            confidence: a.confidence,
            hash: a.hash,
            created_at: a.createdAt || a.created_at
          });
        }
      }
    }
    return artifacts.sort((a, b) => (b.id || '').localeCompare(a.id || '')).slice(0, 20);
  }

  _findRelevantADRs(files) {
    const relevant = [];
    for (const [adr, patterns] of Object.entries(this._adrIndex)) {
      for (const file of files) {
        if (patterns.some(p => file.includes(p))) {
          relevant.push(adr);
          break;
        }
      }
    }
    return relevant;
  }

  _buildADRIndex() {
    return {
      'constitutional-time-enforcement': ['time', 'clock', 'timestamp', 'Date'],
      'hash-authority-collapse': ['hash', 'sha256', 'crypto', 'digest'],
      'replay-determinism': ['replay', 'deterministic', 'reproducible'],
      'event-sourcing': ['event', 'event_id', 'causation', 'correlation'],
      'authority-registry': ['authority', 'adapter', 'constitutional'],
      'worker-port': ['worker', 'orchestration', 'schedule']
    };
  }

  _collectAllDependents(node, allNodes) {
    const result = new Set();
    const queue = [...(node.dependent_modules || [])];
    while (queue.length > 0) {
      const depPath = queue.shift();
      if (result.has(depPath)) continue;
      result.add(depPath);
      const depNode = allNodes.find(n => n.path === depPath);
      if (depNode) {
        queue.push(...(depNode.dependent_modules || []));
      }
    }
    return Array.from(result);
  }
}

module.exports = { ContextAuthority };
