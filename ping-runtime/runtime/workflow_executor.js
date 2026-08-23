// P032: Generated Workflow Executor
// Runtime loads workflow_registry.json and builds execution graph directly.
// No handwritten workflow map. Deterministic loading. Startup failure on invalid graph.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class WorkflowExecutor {
  constructor(repoRoot) {
    this._repoRoot = repoRoot;
    this._workflows = new Map();
    this._executionGraph = null;
    this._hash = null;
  }

  load() {
    const registryPath = path.join(this._repoRoot, 'gateway', 'generated', 'workflow_registry.json');
    if (!fs.existsSync(registryPath)) {
      throw new Error(`[WorkflowExecutor] workflow_registry.json not found at ${registryPath}`);
    }

    const raw = fs.readFileSync(registryPath, 'utf8');
    const registry = JSON.parse(raw);

    this._validateRegistry(registry);
    this._indexWorkflows(registry.workflows);
    this._buildExecutionGraph();
    this._validateGraph();
    this._hash = this._computeHash();

    console.log(`[WorkflowExecutor] Loaded ${this._workflows.size} workflows, graph valid`);
    return this;
  }

  _validateRegistry(registry) {
    const required = ['schema_version', 'generator', 'count', 'workflows'];
    for (const field of required) {
      if (!registry[field]) {
        throw new Error(`[WorkflowExecutor] Missing required field: ${field}`);
      }
    }
    if (!Array.isArray(registry.workflows)) {
      throw new Error(`[WorkflowExecutor] workflows must be an array`);
    }
  }

  _indexWorkflows(workflows) {
    for (const wf of workflows) {
      if (!wf.workflow_id || !wf.workflow_type || !wf.authority) {
        throw new Error(`[WorkflowExecutor] Invalid workflow: missing required fields (id, type, authority)`);
      }
      if (this._workflows.has(wf.workflow_id)) {
        throw new Error(`[WorkflowExecutor] Duplicate workflow_id: ${wf.workflow_id}`);
      }
      this._workflows.set(wf.workflow_id, wf);
    }
  }

  _buildExecutionGraph() {
    const graph = new Map();

    for (const [id, wf] of this._workflows) {
      graph.set(id, {
        workflow: wf,
        dependencies: new Set(),
        dependents: new Set(),
        eventInputs: wf.event_inputs || [],
        eventOutputs: wf.event_outputs || [],
        capabilities: wf.capability_requirements || [],
      });
    }

    // Build edges: workflow B depends on workflow A if A's event_outputs overlap B's event_inputs
    for (const [idA, nodeA] of graph) {
      for (const [idB, nodeB] of graph) {
        if (idA === idB) continue;
        const overlap = nodeA.eventOutputs.some(out => nodeB.eventInputs.includes(out));
        if (overlap) {
          nodeB.dependencies.add(idA);
          nodeA.dependents.add(idB);
        }
      }
    }

    this._executionGraph = graph;
  }

  _validateGraph() {
    // Check for cycles using DFS
    const visited = new Set();
    const inStack = new Set();
    const cycles = [];

    const dfs = (nodeId, path) => {
      if (inStack.has(nodeId)) {
        cycles.push([...path, nodeId]);
        return;
      }
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      inStack.add(nodeId);
      path.push(nodeId);

      const node = this._executionGraph.get(nodeId);
      if (node) {
        for (const dep of node.dependencies) {
          dfs(dep, path);
        }
      }

      path.pop();
      inStack.delete(nodeId);
    };

    for (const nodeId of this._executionGraph.keys()) {
      dfs(nodeId, []);
    }

    if (cycles.length > 0) {
      throw new Error(`[WorkflowExecutor] Invalid graph: ${cycles.length} cycle(s) detected. First: ${cycles[0].join(' -> ')}`);
    }
  }

  getWorkflow(workflowId) {
    return this._workflows.get(workflowId) || null;
  }

  getWorkflowByType(workflowType) {
    for (const [, wf] of this._workflows) {
      if (wf.workflow_type === workflowType) return wf;
    }
    return null;
  }

  getExecutionOrder() {
    // Topological sort
    const inDegree = new Map();
    for (const [id] of this._executionGraph) {
      inDegree.set(id, 0);
    }
    for (const [, node] of this._executionGraph) {
      for (const dep of node.dependencies) {
        inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
      }
    }

    const queue = [];
    for (const [id, degree] of inDegree) {
      if (degree === 0) queue.push(id);
    }

    const sorted = [];
    while (queue.length > 0) {
      const current = queue.shift();
      sorted.push(current);
      const node = this._executionGraph.get(current);
      if (node) {
        for (const dependent of node.dependents) {
          const newDegree = (inDegree.get(dependent) || 1) - 1;
          inDegree.set(dependent, newDegree);
          if (newDegree === 0) queue.push(dependent);
        }
      }
    }

    return sorted;
  }

  canExecute(workflowId) {
    const node = this._executionGraph.get(workflowId);
    if (!node) return { canExecute: false, reason: 'workflow not found' };
    return { canExecute: true, dependencies: Array.from(node.dependencies) };
  }

  getHash() {
    return this._hash;
  }

  getStats() {
    return {
      totalWorkflows: this._workflows.size,
      graphNodes: this._executionGraph.size,
      graphHash: this._hash,
      executionOrder: this.getExecutionOrder(),
    };
  }

  _computeHash() {
    const data = {
      workflowIds: Array.from(this._workflows.keys()).sort(),
      graphEdges: Array.from(this._executionGraph.entries())
        .map(([id, node]) => ({ id, deps: Array.from(node.dependencies).sort() }))
        .sort((a, b) => a.id.localeCompare(b.id)),
    };
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }
}

module.exports = { WorkflowExecutor };
