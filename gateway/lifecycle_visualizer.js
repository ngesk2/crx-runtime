/**
 * Lifecycle Visualizer
 * 
 * Runtime DAG visualization with health status.
 * 
 * Stages:
 * GitHub Snapshot → Compiler → Persistence → Embedding → Projection → 
 * Inference → Reflection → Mission → Replay → Witness
 * 
 * Each node shows:
 * - green/yellow/red health status
 * - duration
 * - inputs/outputs
 * - errors
 * 
 * Similar to GitHub Actions graph visualization.
 */

class LifecycleNode {
  constructor(name, stage, health = 'pending') {
    this.name = name;
    this.stage = stage;
    this.health = health; // pending, running, success, failure, skipped
    this.duration = 0;
    this.inputs = [];
    this.outputs = [];
    this.errors = [];
    this.startTime = null;
    this.endTime = null;
    this.dependencies = [];
  }

  start() {
    this.health = 'running';
    this.startTime = Date.now();
  }

  complete(outputs = []) {
    this.health = 'success';
    this.endTime = Date.now();
    this.duration = this.endTime - this.startTime;
    this.outputs = outputs;
  }

  fail(error) {
    this.health = 'failure';
    this.endTime = Date.now();
    this.duration = this.endTime - this.startTime;
    this.errors.push(error);
  }

  skip(reason) {
    this.health = 'skipped';
    this.errors.push(reason);
  }

  toJSON() {
    return {
      name: this.name,
      stage: this.stage,
      health: this.health,
      duration_ms: this.duration,
      inputs: this.inputs,
      outputs: this.outputs,
      errors: this.errors,
      started_at: this.startTime ? new Date(this.startTime).toISOString() : null,
      completed_at: this.endTime ? new Date(this.endTime).toISOString() : null,
      dependencies: this.dependencies,
    };
  }
}

class LifecycleDAG {
  constructor() {
    this._nodes = new Map();
    this._edges = new Map(); // source -> Set of targets
    this._lifecycleId = null;
    this._startedAt = null;
    this._completedAt = null;
  }

  initialize(lifecycleId) {
    this._lifecycleId = lifecycleId;
    this._startedAt = Date.now();
    
    // Define the DAG structure
    this._addNode('GitHub Snapshot', 'GitHubSnapshot');
    this._addNode('Compiler', 'BuildObjectsStage', ['GitHub Snapshot']);
    this._addNode('Persistence', 'PersistStage', ['Compiler']);
    this._addNode('Embedding', 'EmbeddingStage', ['Persistence']);
    this._addNode('Projection', 'EmbeddingStage', ['Embedding']);
    this._addNode('Inference', 'AnalyzeStage', ['Projection']);
    this._addNode('Reflection', 'ReflectStage', ['Inference']);
    this._addNode('Mission', 'MissionStage', ['Reflection']);
    this._addNode('Replay', 'ReplayStage', ['Mission']);
    this._addNode('Witness', 'WitnessStage', ['Replay']);
  }

  _addNode(name, stage, dependencies = []) {
    const node = new LifecycleNode(name, stage);
    this._nodes.set(name, node);
    node.dependencies = dependencies;
    
    for (const dep of dependencies) {
      if (!this._edges.has(dep)) {
        this._edges.set(dep, new Set());
      }
      this._edges.get(dep).add(name);
    }
  }

  getNode(name) {
    return this._nodes.get(name);
  }

  startNode(name) {
    const node = this.getNode(name);
    if (node) {
      node.start();
    }
  }

  completeNode(name, outputs = []) {
    const node = this.getNode(name);
    if (node) {
      node.complete(outputs);
    }
  }

  failNode(name, error) {
    const node = this.getNode(name);
    if (node) {
      node.fail(error);
    }
  }

  skipNode(name, reason) {
    const node = this.getNode(name);
    if (node) {
      node.skip(reason);
    }
  }

  getExecutionOrder() {
    // Topological sort
    const visited = new Set();
    const order = [];

    const visit = (nodeName) => {
      if (visited.has(nodeName)) return;
      visited.add(nodeName);

      const node = this.getNode(nodeName);
      if (node) {
        for (const dep of node.dependencies) {
          visit(dep);
        }
      }

      order.push(nodeName);
    };

    for (const nodeName of this._nodes.keys()) {
      visit(nodeName);
    }

    return order;
  }

  getReadyNodes() {
    // Get nodes whose dependencies are all complete
    const ready = [];
    
    for (const [name, node] of this._nodes) {
      if (node.health !== 'pending') continue;
      
      const depsComplete = node.dependencies.every(depName => {
        const depNode = this.getNode(depName);
        return depNode && depNode.health === 'success';
      });
      
      if (depsComplete) {
        ready.push(name);
      }
    }

    return ready;
  }

  getFailedNodes() {
    return Array.from(this._nodes.values())
      .filter(node => node.health === 'failure')
      .map(node => node.name);
  }

  getRunningNodes() {
    return Array.from(this._nodes.values())
      .filter(node => node.health === 'running')
      .map(node => node.name);
  }

  getCompletedNodes() {
    return Array.from(this._nodes.values())
      .filter(node => node.health === 'success')
      .map(node => node.name);
  }

  getOverallHealth() {
    const nodes = Array.from(this._nodes.values());
    
    if (nodes.length === 0) return 'pending';
    
    const failed = nodes.filter(n => n.health === 'failure').length;
    const running = nodes.filter(n => n.health === 'running').length;
    const completed = nodes.filter(n => n.health === 'success').length;
    const pending = nodes.filter(n => n.health === 'pending').length;
    
    if (failed > 0) return 'failure';
    if (running > 0) return 'running';
    if (pending > 0) return 'pending';
    if (completed === nodes.length) return 'success';
    
    return 'unknown';
  }

  getProgress() {
    const nodes = Array.from(this._nodes.values());
    const total = nodes.length;
    const completed = nodes.filter(n => n.health === 'success').length;
    const failed = nodes.filter(n => n.health === 'failure').length;
    
    return {
      total,
      completed,
      failed,
      pending: total - completed - failed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  getDuration() {
    if (this._completedAt) {
      return this._completedAt - this._startedAt;
    }
    if (this._startedAt) {
      return Date.now() - this._startedAt;
    }
    return 0;
  }

  complete() {
    this._completedAt = Date.now();
  }

  toJSON() {
    return {
      lifecycle_id: this._lifecycleId,
      started_at: this._startedAt ? new Date(this._startedAt).toISOString() : null,
      completed_at: this._completedAt ? new Date(this._completedAt).toISOString() : null,
      duration_ms: this.getDuration(),
      overall_health: this.getOverallHealth(),
      progress: this.getProgress(),
      nodes: Array.from(this._nodes.values()).map(node => node.toJSON()),
      edges: Array.from(this._edges.entries()).map(([source, targets]) => ({
        source,
        targets: Array.from(targets),
      })),
    };
  }

  toGraphViz() {
    // Generate GraphViz DOT format for visualization
    let dot = 'digraph Lifecycle {\n';
    dot += '  rankdir=LR;\n';
    dot += '  node [shape=box];\n\n';

    // Add nodes with colors based on health
    const healthColors = {
      'pending': 'lightgray',
      'running': 'yellow',
      'success': 'lightgreen',
      'failure': 'lightcoral',
      'skipped': 'lightblue',
    };

    for (const [name, node] of this._nodes) {
      const color = healthColors[node.health] || 'white';
      const label = `${name}\\n${node.health}\\n${node.duration}ms`;
      dot += `  "${name}" [fillcolor="${color}", style="filled", label="${label}"];\n`;
    }

    dot += '\n';

    // Add edges
    for (const [source, targets] of this._edges) {
      for (const target of targets) {
        dot += `  "${source}" -> "${target}";\n`;
      }
    }

    dot += '}\n';
    return dot;
  }

  toMermaid() {
    // Generate Mermaid diagram for visualization
    let mermaid = 'graph LR\n';

    // Add nodes with status indicators
    const statusIcons = {
      'pending': '⏳',
      'running': '🔄',
      'success': '✅',
      'failure': '❌',
      'skipped': '⏭️',
    };

    for (const [name, node] of this._nodes) {
      const icon = statusIcons[node.health] || '⏳';
      mermaid += `  ${name.replace(/\s+/g, '_')}["${icon} ${name}"]\n`;
    }

    mermaid += '\n';

    // Add edges
    for (const [source, targets] of this._edges) {
      for (const target of targets) {
        mermaid += `  ${source.replace(/\s+/g, '_')} --> ${target.replace(/\s+/g, '_')}\n`;
      }
    }

    return mermaid;
  }
}

class LifecycleVisualizer {
  constructor(postgresPool) {
    this._postgres = postgresPool;
    this._currentDAG = null;
  }

  createDAG(lifecycleId) {
    const dag = new LifecycleDAG();
    dag.initialize(lifecycleId);
    this._currentDAG = dag;
    return dag;
  }

  getCurrentDAG() {
    return this._currentDAG;
  }

  async persistDAG(dag) {
    await this._postgres.query(`
      INSERT INTO events (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data)
      VALUES ($1, $2, NOW(), $3, $4, $5)
    `, [
      `${dag._lifecycleId}-dag`,
      'LIFECYCLE_DAG',
      dag._lifecycleId,
      'LIFECYCLE',
      JSON.stringify(dag.toJSON()),
    ]);
  }

  async loadDAG(lifecycleId) {
    const result = await this._postgres.query(`
      SELECT event_data
      FROM events
      WHERE event_type = 'LIFECYCLE_DAG'
      AND aggregate_id = $1
      ORDER BY timestamp DESC
      LIMIT 1
    `, [lifecycleId]);

    if (result.rows.length === 0) {
      return null;
    }

    const data = result.rows[0].event_data;
    const dag = new LifecycleDAG();
    dag._lifecycleId = data.lifecycle_id;
    dag._startedAt = new Date(data.started_at).getTime();
    dag._completedAt = data.completed_at ? new Date(data.completed_at).getTime() : null;

    // Reconstruct nodes
    for (const nodeData of data.nodes) {
      const node = new LifecycleNode(nodeData.name, nodeData.stage, nodeData.health);
      node.duration = nodeData.duration_ms;
      node.inputs = nodeData.inputs;
      node.outputs = nodeData.outputs;
      node.errors = nodeData.errors;
      node.startTime = nodeData.started_at ? new Date(nodeData.started_at).getTime() : null;
      node.endTime = nodeData.completed_at ? new Date(nodeData.completed_at).getTime() : null;
      node.dependencies = nodeData.dependencies;
      dag._nodes.set(nodeData.name, node);
    }

    // Reconstruct edges
    for (const edgeData of data.edges) {
      dag._edges.set(edgeData.source, new Set(edgeData.targets));
    }

    this._currentDAG = dag;
    return dag;
  }

  async getVisualization(lifecycleId, format = 'json') {
    const dag = await this.loadDAG(lifecycleId);
    if (!dag) {
      throw new Error(`DAG not found for lifecycle: ${lifecycleId}`);
    }

    switch (format) {
      case 'json':
        return dag.toJSON();
      case 'graphviz':
        return dag.toGraphViz();
      case 'mermaid':
        return dag.toMermaid();
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
}

module.exports = {
  LifecycleNode,
  LifecycleDAG,
  LifecycleVisualizer,
};
