const path = require('path');

class ExecutiveDashboard {
  constructor(graph, classifier, certifier, queue, dispatcher, memory, pipeline) {
    this._graph = graph;
    this._classifier = classifier;
    this._certifier = certifier;
    this._queue = queue;
    this._dispatcher = dispatcher;
    this._memory = memory;
    this._pipeline = pipeline;
  }

  generate() {
    const graphMeta = this._graph ? {
      production: this._graph.summary.production,
      dormant: this._graph.summary.dormant,
      authorities: this._graph.summary.authorities,
      edges: this._graph.summary.edges,
      total_lines: this._graph.summary.total_lines,
      production_lines: this._graph.summary.production_lines
    } : {};

    const replayCov = this._graph ? this._graph.metadata.replay_coverage : {};
    const witnessCov = this._graph ? this._graph.metadata.witness_coverage : {};

    const debt = this._graph ? this._graph.metadata.constitutional_debt : {};
    const entropy = this._graph ? this._graph.metadata.entropy_distribution : {};

    const dormantSummary = this._classifier ? this._classifier.getSummary() : {};
    const certSummary = this._certifier ? this._certifier.getSummary() : {};

    const queueStats = this._queue ? this._queue.getStats() : {};
    const dispatcherUtil = this._dispatcher ? this._dispatcher.getUtilization() : {};
    const memSummary = this._memory ? this._memory.getSummary() : {};

    const proposals = this._pipeline ? this._pipeline.listProposals() : [];

    const mergedCount = queueStats.merged || 0;
    const rejectedCount = queueStats.rejected || 0;
    const pendingCount = (queueStats.submitted || 0) + (queueStats.artifact_complete || 0) +
      (queueStats.replay_verified || 0) + (queueStats.merge_gate || 0) +
      (queueStats.constitutional_review || 0);

    const closureRate = (mergedCount + rejectedCount) > 0
      ? Math.round(mergedCount / (mergedCount + rejectedCount) * 100)
      : 0;

    return {
      generated_at: new Date().toISOString(),
      version: '2.0.0',

      // PHASE 38A — Intelligence Graph
      repository: {
        production_modules: graphMeta.production || 0,
        dormant_modules: graphMeta.dormant || 0,
        total_authorities: graphMeta.authorities || 0,
        dependency_edges: graphMeta.edges || 0,
        total_lines: graphMeta.total_lines || 0,
        production_lines: graphMeta.production_lines || 0,
        ownership_distribution: this._graph ? this._graph.metadata.ownership_distribution : {}
      },

      // PHASE 38K — Replay Certification
      replay_coverage: {
        full: replayCov.full || 0,
        event: replayCov.event || 0,
        witness: replayCov.witness || 0,
        none: replayCov.none || 0
      },

      witness_coverage: {
        witnessed: witnessCov.witnessed || 0,
        total_production: witnessCov.total_production || 0,
        coverage_pct: witnessCov.coverage_pct || 0
      },

      authority_coverage: this._graph ? {
        total: this._graph.getAuthorities().length,
        on_production_path: this._graph.getProductionNodes().filter(n => n.authority_owner).length,
        unowned_production: this._graph.getProductionNodes().filter(n => !n.authority_owner).length
      } : {},

      // PHASE 38J — Dormant Code
      constitutional_debt: {
        total_files: debt.total_files || 0,
        total_lines: debt.total_lines || 0,
        high_entropy_dormant: debt.high_entropy || 0,
        dormant_summary: dormantSummary
      },

      // PHASE 38H — Merge Queue
      merge_queue: {
        total: queueStats.total || 0,
        merged: mergedCount,
        rejected: rejectedCount,
        pending: pendingCount,
        in_review: queueStats.constitutional_review || 0,
        by_stage: (() => {
          if (!queueStats) return {};
          const stages = ['submitted', 'artifact_complete', 'replay_verified', 'merge_gate', 'constitutional_review', 'merged', 'rejected', 'archived'];
          const result = {};
          for (const s of stages) {
            if (queueStats[s] !== undefined) result[s] = queueStats[s];
          }
          return result;
        })(),
        consensus_distribution: queueStats.consensus_distribution || {}
      },

      // PHASE 38B — Worker Utilization
      worker_utilization: {
        total_batches: dispatcherUtil.total_batches || 0,
        recent_batches: dispatcherUtil.recent_batches || 0,
        background_queue_depth: dispatcherUtil.background_queue_depth || 0
      },

      worker_memory: {
        workers_with_memory: memSummary.workers_with_memory || 0,
        total_findings: memSummary.total_findings || 0,
        total_accepted: memSummary.total_accepted || 0,
        total_rejected: memSummary.total_rejected || 0,
        total_patterns: memSummary.total_patterns || 0
      },

      // PHASE 38F — Proposals
      proposals: {
        total: proposals.length,
        by_status: (() => {
          const byStatus = {};
          for (const p of proposals) {
            if (!byStatus[p.status]) byStatus[p.status] = 0;
            byStatus[p.status]++;
          }
          return byStatus;
        })(),
        open: proposals.filter(p => !['merged', 'rejected', 'archived'].includes(p.status)).length
      },

      // PHASE 38K — Certificates
      certificates: {
        total_certified: certSummary.total_certified || 0,
        average_score: certSummary.average_score || 0,
        high: certSummary.by_score?.high || 0,
        medium: certSummary.by_score?.medium || 0,
        low: certSummary.by_score?.low || 0,
        fully_certified: certSummary.fully_certified || 0,
        needs_work: certSummary.needs_work || 0
      },

      // Entropy
      entropy_sources: {
        production_high: entropy.high || 0,
        production_medium: entropy.medium || 0,
        production_low: entropy.low || 0
      },

      // PHASE 38M — Velocity
      velocity: {
        closure_rate: closureRate,
        engineering_velocity: proposals.length > 0
          ? Math.round(mergedCount / Math.max(1, proposals.length) * 100)
          : 0,
        worker_efficiency: memSummary.workers_with_memory > 0
          ? Math.round(memSummary.total_accepted / Math.max(1, memSummary.total_accepted + memSummary.total_rejected) * 100)
          : 0
      }
    };
  }

  print() {
    const d = this.generate();
    const line = (label, value) => console.log(`  ${label}: ${value}`);

    console.log('\n========================================');
    console.log('  CONSTITUTIONAL ENGINEERING DASHBOARD');
    console.log('========================================\n');

    console.log('📊 REPOSITORY OVERVIEW');
    line('  Production modules', `${d.repository.production_modules}`);
    line('  Dormant modules', `${d.repository.dormant_modules}`);
    line('  Total lines', `${d.repository.total_lines}`);
    line('  Authorities', `${d.repository.total_authorities}`);

    console.log('\n🔐 CONSTITUTIONAL COVERAGE');
    line('  Replay — full', `${d.replay_coverage.full}`);
    line('  Replay — event', `${d.replay_coverage.event}`);
    line('  Replay — witness', `${d.replay_coverage.witness}`);
    line('  Replay — none', `${d.replay_coverage.none}`);
    line('  Witness coverage', `${d.witness_coverage.coverage_pct}%`);
    line('  Fully certified', `${d.certificates.fully_certified}/${d.certificates.total_certified}`);
    line('  Avg certificate score', `${d.certificates.average_score}%`);

    console.log('\n💳 CONSTITUTIONAL DEBT');
    line('  Dormant files', `${d.constitutional_debt.total_files}`);
    line('  Dormant lines', `${d.constitutional_debt.total_lines}`);
    line('  Safe deletions', `${d.constitutional_debt.dormant_summary.high_confidence_deletions || 0}`);
    line('  Migrate candidates', `${d.constitutional_debt.dormant_summary.migration_candidates || 0}`);
    line('  Needs review', `${d.constitutional_debt.dormant_summary.needs_review || 0}`);

    console.log('\n⚡ ENTROPY (production)');
    line('  High entropy', `${d.entropy_sources.production_high}`);
    line('  Medium entropy', `${d.entropy_sources.production_medium}`);
    line('  Low entropy', `${d.entropy_sources.production_low}`);

    console.log('\n📋 MERGE QUEUE');
    line('  Total entries', `${d.merge_queue.total}`);
    line('  Merged', `${d.merge_queue.merged}`);
    line('  Rejected', `${d.merge_queue.rejected}`);
    line('  Pending', `${d.merge_queue.pending}`);
    line('  In review', `${d.merge_queue.in_review}`);

    console.log('\n👷 WORKER UTILIZATION');
    line('  Total batches', `${d.worker_utilization.total_batches}`);
    line('  Recent batches', `${d.worker_utilization.recent_batches}`);
    line('  Background queue', `${d.worker_utilization.background_queue_depth}`);
    line('  Workers with memory', `${d.worker_memory.workers_with_memory}`);
    line('  Total fixes accepted', `${d.worker_memory.total_accepted}`);

    console.log('\n📈 VELOCITY');
    line('  Closure rate', `${d.velocity.closure_rate}%`);
    line('  Engineering velocity', `${d.velocity.engineering_velocity}%`);
    line('  Worker efficiency', `${d.velocity.worker_efficiency}%`);

    console.log('\n========================================\n');
  }
}

module.exports = { ExecutiveDashboard };
