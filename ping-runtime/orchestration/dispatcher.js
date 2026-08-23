const path = require('path');

class Dispatcher {
  constructor(graph, workerRegistry) {
    this._graph = graph;
    this._workers = workerRegistry;
    this._batchHistory = [];
    this._backgroundQueue = [];
  }

  planHighROIWork() {
    const production = this._graph.getProductionNodes();
    const graph = this._graph;
    const jobs = [];

    const highEntropy = production.filter(n => n.entropy_score > 0.3);
    for (const node of highEntropy) {
      jobs.push({
        type: 'entropy_reduction',
        target: node.path,
        entropy_score: node.entropy_score,
        priority: Math.round(node.entropy_score * 10),
        roi: Math.round(node.entropy_score * 100)
      });
    }

    const lowWitness = production.filter(n => n.witness_score < 0.3 && n.replay_visibility !== 'none');
    for (const node of lowWitness) {
      jobs.push({
        type: 'witness_improvement',
        target: node.path,
        witness_score: node.witness_score,
        replay_visibility: node.replay_visibility,
        priority: node.replay_visibility === 'full' ? 10 : 5,
        roi: node.replay_visibility === 'full' ? 90 : 50
      });
    }

    const unowned = production.filter(n => n.ownership === 'unowned' && n.lines > 10);
    for (const node of unowned) {
      jobs.push({
        type: 'ownership_assignment',
        target: node.path,
        lines: node.lines,
        priority: 3,
        roi: 30
      });
    }

    const dormantWithDeps = this._graph.getDormantNodes().filter(n => n.dependent_modules.length > 0);
    for (const node of dormantWithDeps) {
      jobs.push({
        type: 'dormant_dependency_resolution',
        target: node.path,
        dependents: node.dependent_modules.length,
        priority: Math.min(5, node.dependent_modules.length),
        roi: Math.min(50, node.dependent_modules.length * 20)
      });
    }

    jobs.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    return jobs;
  }

  createBatch(jobs, maxBatchSize = 5) {
    const batch = jobs.slice(0, maxBatchSize);
    const batchId = `batch_${Date.now()}_${this._batchHistory.length}`;

    const record = {
      batchId,
      jobs: batch,
      created_at: new Date().toISOString(),
      status: 'created'
    };
    this._batchHistory.push(record);
    return record;
  }

  assignToWorker(batch, workerId) {
    const worker = this._workers.get(workerId);
    if (!worker) return null;

    const filePaths = batch.jobs.map(j => j.target).filter(Boolean);

    const assignment = {
      batchId: batch.batchId,
      workerId,
      worker_name: worker.name,
      objective: this._buildObjective(batch.jobs, worker),
      filePaths,
      acceptance_criteria: this._buildAcceptanceCriteria(batch.jobs, worker),
      created_at: new Date().toISOString()
    };

    this._batchHistory.push(assignment);
    return assignment;
  }

  _buildObjective(jobs, worker) {
    const types = [...new Set(jobs.map(j => j.type))];
    return `Apply ${worker.role} to ${jobs.length} files. Types: ${types.join(', ')}.`;
  }

  _buildAcceptanceCriteria(jobs, worker) {
    const criteria = [];
    for (const job of jobs) {
      switch (job.type) {
        case 'entropy_reduction':
          criteria.push(`Reduce entropy in ${job.target} below 0.3`);
          break;
        case 'witness_improvement':
          criteria.push(`Improve witness_score in ${job.target} above 0.5`);
          break;
        case 'ownership_assignment':
          criteria.push(`Assign ownership for ${job.target}`);
          break;
        case 'dormant_dependency_resolution':
          criteria.push(`Resolve ${job.dependents} dormant dependency chains from ${job.target}`);
          break;
      }
    }
    return criteria;
  }

  scheduleBackgroundWork() {
    const idleWorkers = this._workers.list();
    const tasks = [];

    const taskTypes = [
      { type: 'dead_code_analysis', workerId: 'dead_code_excavator', scope: ['gateway/', 'runtime/'] },
      { type: 'dependency_graph_audit', workerId: 'import_graph_auditor', scope: ['gateway/', 'runtime/'] },
      { type: 'replay_proof_generation', workerId: 'replay_verifier', scope: ['gateway/runtime/', 'runtime/replay/'] },
      { type: 'documentation_update', workerId: 'documentation_engine', scope: ['orchestration/'] },
      { type: 'authority_mapping', workerId: 'authority_auditor', scope: ['gateway/'] }
    ];

    for (const worker of idleWorkers) {
      const task = taskTypes.find(t => t.workerId === worker.id);
      if (task) {
        tasks.push({
          workerId: worker.id,
          type: task.type,
          scope: task.scope,
          scheduled_at: new Date().toISOString()
        });
      }
    }

    this._backgroundQueue.push(...tasks);
    return tasks;
  }

  getNextBackgroundTask() {
    return this._backgroundQueue.shift() || null;
  }

  collectEvidence(batchId, workerOutputs) {
    return {
      batchId,
      worker_count: workerOutputs.length,
      findings: workerOutputs.map(o => ({
        worker: o.workerId,
        confidence: o.confidence || 0,
        findings_count: (o.findings || []).length,
        accepted: o.accepted || false
      })),
      consensus: this._computeConsensus(workerOutputs),
      collected_at: new Date().toISOString()
    };
  }

  _computeConsensus(outputs) {
    if (outputs.length < 2) return { level: 'single', confidence: outputs[0]?.confidence || 0 };
    const confidences = outputs.map(o => o.confidence || 0);
    const avg = confidences.reduce((s, c) => s + c, 0) / confidences.length;
    const variance = confidences.reduce((s, c) => s + (c - avg) ** 2, 0) / confidences.length;
    return {
      level: outputs.length >= 3 ? 'triple' : 'double',
      average_confidence: Math.round(avg * 100) / 100,
      variance: Math.round(variance * 100) / 100,
      strong_consensus: variance < 0.1 && avg > 0.7
    };
  }

  getUtilization() {
    const recent = this._batchHistory.filter(b => {
      const age = Date.now() - new Date(b.created_at).getTime();
      return age < 3600000;
    });
    return {
      total_batches: this._batchHistory.length,
      recent_batches: recent.length,
      background_queue_depth: this._backgroundQueue.length
    };
  }
}

module.exports = { Dispatcher };
