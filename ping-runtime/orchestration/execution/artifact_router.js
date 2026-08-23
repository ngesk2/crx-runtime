const crypto = require('crypto');

class ArtifactRouter {
  constructor(intelligenceGraph, eventQueue) {
    this._graph = intelligenceGraph;
    this._events = eventQueue;
  }

  buildWorkerContext(mission, workerId) {
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
      path: a.path
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
      generated_at: new Date().toISOString()
    };

    this._events.emit('context_built', {
      missionId: mission.id,
      workerId,
      fileCount: fileNodes.length,
      violationCount: violations.length
    });

    return context;
  }

  buildPrompt(mission, context, workerMemory) {
    const promptParts = [];

    promptParts.push(`CONSTITUTIONAL MISSION: ${mission.type}`);
    promptParts.push(`Target: ${mission.target || '(repository-wide)'}`);
    promptParts.push(`Priority: ${mission.metadata.priority}`);
    promptParts.push(`Description: ${mission.metadata.description}`);
    promptParts.push('');

    if (context.file_slice && context.file_slice.length > 0) {
      promptParts.push('--- TARGET FILES ---');
      for (const f of context.file_slice) {
        promptParts.push(`${f.path} (${f.lines} lines, entropy: ${f.entropy_score}, witness: ${f.witness_score})`);
      }
      promptParts.push('');
    }

    if (context.known_violations && context.known_violations.length > 0) {
      promptParts.push('--- KNOWN VIOLATIONS ---');
      for (const v of context.known_violations) {
        promptParts.push(`  [${v.type}] ${v.path} (score: ${v.score})`);
      }
      promptParts.push('');
    }

    promptParts.push('--- CONSTITUTIONAL CONSTRAINTS ---');
    for (const law of context.canonical_laws) {
      promptParts.push(`  ${law}`);
    }
    promptParts.push('');
    promptParts.push('ABSOLUTE PROHIBITIONS:');
    promptParts.push('  You may NOT create new authorities');
    promptParts.push('  You may NOT bypass RuntimeIdentityAuthority, CanonicalAuthority, ConstitutionalTimeAuthority');
    promptParts.push('  You produce PROPOSALS only — never direct modifications');
    promptParts.push('  You may NOT use Math.random() or any non-deterministic source');
    promptParts.push('');

    if (workerMemory) {
      promptParts.push('--- WORKER MEMORY ---');
      promptParts.push(workerMemory);
      promptParts.push('');
    }

    promptParts.push('--- REQUIRED OUTPUT ---');
    const outputSchema = mission.type === 'ENTROPY_REDUCTION' ? `
{
  "findings": [
    {
      "file": "path",
      "line": number,
      "pattern": "original code",
      "bypass_type": "Date.now|Math.random|crypto.createHash",
      "correct_authority": "ConstitutionalTimeAuthority|RuntimeIdentityAuthority|CanonicalAuthority",
      "confidence": 0.0-1.0,
      "risk": "critical|high|medium|low"
    }
  ],
  "patch": "diff format or null",
  "replay_impact": "deterministic analysis",
  "confidence": 0.0-1.0
}` : `
{
  "findings": [],
  "analysis": "text analysis",
  "replay_proof": {},
  "confidence": 0.0-1.0
}`;
    promptParts.push(outputSchema);

    const prompt = promptParts.join('\n');
    const promptHash = crypto.createHash('sha256').update(prompt).digest('hex');

    this._events.emit('prompt_generated', {
      missionId: mission.id,
      promptLength: prompt.length,
      promptHash
    });

    return prompt;
  }

  _collectAllDependents(node, allNodes) {
    const result = new Set();
    const queue = [...node.dependent_modules];
    while (queue.length > 0) {
      const depPath = queue.shift();
      if (result.has(depPath)) continue;
      result.add(depPath);
      const depNode = allNodes.find(n => n.path === depPath);
      if (depNode) {
        queue.push(...depNode.dependent_modules);
      }
    }
    return Array.from(result);
  }
}

module.exports = { ArtifactRouter };
