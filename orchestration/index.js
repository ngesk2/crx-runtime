const { ExecutionEngine } = require('./execution/engine');
const { IntelligenceGraph } = require('./intelligence_graph');
const { MergeGate } = require('./merge_gate');
const { DormantClassifier, ReplayCertifier } = require('./dormant_classifier');
const { ExecutiveDashboard } = require('./dashboard');

class ConstitutionalOrchestrator {
  constructor() {
    this._engine = new ExecutionEngine();
    this._initialized = false;
  }

  async initialize() {
    await this._engine.initialize();
    this._initialized = true;
    return this._engine._graphData;
  }

  listWorkers() {
    return this._engine._registry.listWorkers();
  }

  listCapabilities() {
    return this._engine._registry.listAllCapabilities();
  }

  compileMissions() {
    return this._engine.compileMissions();
  }

  dispatchToAssignment(missionId, completionHandler) {
    return this._engine.dispatchToAssignment(missionId, completionHandler);
  }

  collectWorkerOutput(workerId, missionId, output) {
    return this._engine.collectWorkerOutput(workerId, missionId, output);
  }

  emitGitDiff(diff) {
    return this._engine.emitGitDiff(diff);
  }

  generateDashboard() {
    return this._engine.generateDashboard();
  }

  printDashboard() {
    this._engine.printDashboard();
  }

  getReport() {
    return this._engine.getReport();
  }

  getMergeGate() {
    return this._engine._mergeGate;
  }

  getEventQueue() {
    return this._engine._eventQueue;
  }

  getArtifactStore() {
    return this._engine._artifactStore;
  }
}

async function main() {
  const orchestrator = new ConstitutionalOrchestrator();
  await orchestrator.initialize();

  const report = orchestrator.getReport();
  console.log('\n=== CONSTITUTIONAL DISTRIBUTED EXECUTION FABRIC (Phase 38) ===\n');

  console.log('📊 CAPABILITY REGISTRY');
  console.log(`  Workers:      ${report.workers.length}`);
  console.log(`  Capabilities: ${report.capabilities.length}`);
  console.log(`  Quality:      ${report.dashboard.capability_registry.averageQuality}`);

  console.log('\n📋 MISSIONS');
  console.log(`  Total:    ${report.dashboard.missions.total}`);
  console.log(`  Pending:  ${report.dashboard.missions.pending}`);
  console.log(`  Complete: ${report.dashboard.missions.completed}`);
  console.log(`  Failed:   ${report.dashboard.missions.failed}`);

  if (report.high_priority_missions.length > 0) {
    console.log('\n⚡ HIGH PRIORITY MISSIONS');
    for (const m of report.high_priority_missions) {
      console.log(`  [P${m.priority}] ${m.type}: ${m.description}`);
      console.log(`    → capability: ${m.requiredCapabilities.join(', ')}`);
    }
  }

  console.log('\n📦 ARTIFACT STORE');
  console.log(`  Total:    ${report.dashboard.artifact_store.totalArtifacts}`);
  console.log(`  Avg conf: ${report.dashboard.artifact_store.averageConfidence}`);

  console.log('\n📈 VELOCITY');
  console.log(`  Closure rate:  ${report.dashboard.velocity.missionClosureRate}%`);
  console.log(`  Accept rate:   ${report.dashboard.velocity.missionAcceptRate}%`);
  console.log(`  Throughput:    ${report.dashboard.velocity.artifactThroughput} artifacts`);
  console.log(`  Efficiency:    ${report.dashboard.velocity.workerEfficiency}%`);

  const outputPath = require('path').join(__dirname, 'phase38_report.json');
  require('fs').writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\nPhase 38 report written to ${outputPath}`);
}

if (require.main === module) {
  main().catch(err => { console.error('Phase 38 failed:', err); process.exit(1); });
}

module.exports = { ConstitutionalOrchestrator };
