/**
 * Constitutional Execution Planner
 * 
 * Ω.95.1 — Constitutional Execution Planner
 * 
 * PURE planner - no IO, no execution, no replay, no witness, no commits, no persistence.
 * Only produces immutable execution plans.
 * 
 * Input: Mission
 * Output: ExecutionPlan
 * 
 * Performs:
 * - Dependency resolution
 * - DAG generation
 * - Rollback generation
 * - Artifact dependency generation
 * - Execution ordering
 */

const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');

class ConstitutionalExecutionPlanner {
  constructor() {
    // Planner is stateless - pure function
  }

  /**
   * Plan execution from mission
   * 
   * @param {Object} mission - Mission specification
   * @returns {Object} Execution plan
   */
  planExecution(mission) {
    console.log(`[ExecutionPlanner] Planning execution for mission ${mission.mission_id}`);

    // Generate execution DAG
    const dag = this._generateExecutionDAG(mission);

    // Generate rollback DAG
    const rollbackDag = this._generateRollbackDAG(dag);

    // Generate artifact dependencies
    const artifactDependencies = this._generateArtifactDependencies(dag);

    // Generate execution ordering
    const executionOrder = this._generateExecutionOrder(dag);

    // Generate expected artifacts
    const expectedArtifacts = this._generateExpectedArtifacts(dag);

    // Generate policies
    const policies = this._generatePolicies(mission);

    // Create execution plan
    const executionPlan = {
      plan_id: this._generatePlanId(mission),
      mission_id: mission.mission_id,
      version: '1.0.0',
      created_at: new Date(constitutionalTimeAuthority.now()).toISOString(),
      inputs: [mission],
      nodes: dag.nodes,
      edges: dag.edges,
      rollback_nodes: rollbackDag.nodes,
      rollback_edges: rollbackDag.edges,
      expected_artifacts: expectedArtifacts,
      artifact_dependencies: artifactDependencies,
      execution_order: executionOrder,
      policies: policies,
      dependency_manifest: this._generateDependencyManifest(dag, policies),
      canonical_hash: null, // Will be set after canonical serialization
      witness_hash: null, // Will be set after witness signing
    };

    // Set canonical hash
    executionPlan.canonical_hash = CanonicalAuthority.hash(executionPlan);

    console.log(`[ExecutionPlanner] Generated execution plan ${executionPlan.plan_id} with ${executionPlan.nodes.length} nodes`);
    return executionPlan;
  }

  /**
   * Generate plan ID
   */
  _generatePlanId(mission) {
    const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
    return `plan-${CanonicalAuthority.hash({ mission_id: mission.mission_id, timestamp: constitutionalTimeAuthority.nowAsMillis() })}`;
  }

  /**
   * Generate execution DAG
   */
  _generateExecutionDAG(mission) {
    const nodes = [];
    const edges = [];

    // Node 1: WorkflowIR Compilation
    const workflowIRNode = {
      node_id: 'node-workflow-ir',
      node_type: 'compile',
      authority: 'WorkflowCompiler',
      input_artifacts: ['mission'],
      output_artifacts: ['workflow_ir'],
      dependencies: [],
    };
    nodes.push(workflowIRNode);

    // Node 2: Replay Operations Generation
    const replayOpsNode = {
      node_id: 'node-replay-ops',
      node_type: 'generate',
      authority: 'ReplayGenerator',
      input_artifacts: ['workflow_ir'],
      output_artifacts: ['replay_operations'],
      dependencies: ['node-workflow-ir'],
    };
    nodes.push(replayOpsNode);
    edges.push({ from: 'node-workflow-ir', to: 'node-replay-ops' });

    // Node 3: Replay Sandbox Creation
    const sandboxNode = {
      node_id: 'node-sandbox',
      node_type: 'create',
      authority: 'SandboxAuthority',
      input_artifacts: ['mission', 'replay_operations'],
      output_artifacts: ['sandbox'],
      dependencies: ['node-replay-ops'],
    };
    nodes.push(sandboxNode);
    edges.push({ from: 'node-replay-ops', to: 'node-sandbox' });

    // Node 4: Apply Mission Changes
    const applyNode = {
      node_id: 'node-apply',
      node_type: 'apply',
      authority: 'SandboxAuthority',
      input_artifacts: ['sandbox', 'mission'],
      output_artifacts: ['sandbox_applied'],
      dependencies: ['node-sandbox'],
    };
    nodes.push(applyNode);
    edges.push({ from: 'node-sandbox', to: 'node-apply' });

    // Node 5: Replay Verification
    const replayVerifyNode = {
      node_id: 'node-replay-verify',
      node_type: 'verify',
      authority: 'ReplayAuthority',
      input_artifacts: ['sandbox_applied'],
      output_artifacts: ['replay_evidence'],
      dependencies: ['node-apply'],
    };
    nodes.push(replayVerifyNode);
    edges.push({ from: 'node-apply', to: 'node-replay-verify' });

    // Node 6: Witness Verification
    const witnessVerifyNode = {
      node_id: 'node-witness-verify',
      node_type: 'verify',
      authority: 'WitnessAuthority',
      input_artifacts: ['sandbox_applied'],
      output_artifacts: ['witness_evidence'],
      dependencies: ['node-apply'],
    };
    nodes.push(witnessVerifyNode);
    edges.push({ from: 'node-apply', to: 'node-witness-verify' });

    // Node 7: Policy Evaluation
    const policyNode = {
      node_id: 'node-policy',
      node_type: 'evaluate',
      authority: 'PolicyEngine',
      input_artifacts: ['replay_evidence', 'witness_evidence'],
      output_artifacts: ['gate_decision'],
      dependencies: ['node-replay-verify', 'node-witness-verify'],
    };
    nodes.push(policyNode);
    edges.push({ from: 'node-replay-verify', to: 'node-policy' });
    edges.push({ from: 'node-witness-verify', to: 'node-policy' });

    // Node 8: Integration (if approved)
    const integrationNode = {
      node_id: 'node-integration',
      node_type: 'integrate',
      authority: 'SandboxAuthority',
      input_artifacts: ['sandbox_applied', 'gate_decision'],
      output_artifacts: ['integration'],
      dependencies: ['node-policy'],
      condition: { gate_decision: 'approved' },
    };
    nodes.push(integrationNode);
    edges.push({ from: 'node-policy', to: 'node-integration' });

    // Node 9: Commit Manifest
    const commitNode = {
      node_id: 'node-commit',
      node_type: 'commit',
      authority: 'CommitAuthority',
      input_artifacts: ['integration', 'gate_decision'],
      output_artifacts: ['commit_manifest'],
      dependencies: ['node-integration'],
    };
    nodes.push(commitNode);
    edges.push({ from: 'node-integration', to: 'node-commit' });

    // Node 10: History Record
    const historyNode = {
      node_id: 'node-history',
      node_type: 'record',
      authority: 'HistoryAuthority',
      input_artifacts: ['commit_manifest', 'replay_evidence', 'witness_evidence'],
      output_artifacts: ['history_record'],
      dependencies: ['node-commit'],
    };
    nodes.push(historyNode);
    edges.push({ from: 'node-commit', to: 'node-history' });

    return { nodes, edges };
  }

  /**
   * Generate rollback DAG
   */
  _generateRollbackDAG(executionDag) {
    const nodes = [];
    const edges = [];

    // Rollback nodes in reverse order
    const reversedNodes = [...executionDag.nodes].reverse();

    for (const node of reversedNodes) {
      if (node.node_type === 'create' || node.node_type === 'apply' || node.node_type === 'integrate') {
        const rollbackNode = {
          node_id: `rollback-${node.node_id}`,
          node_type: 'rollback',
          authority: node.authority,
          input_artifacts: node.output_artifacts,
          output_artifacts: [`rollback_${node.output_artifacts[0]}`],
          dependencies: [],
          original_node: node.node_id,
        };
        nodes.push(rollbackNode);
      }
    }

    // Chain rollback nodes
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({ from: nodes[i].node_id, to: nodes[i + 1].node_id });
    }

    return { nodes, edges };
  }

  /**
   * Generate artifact dependencies
   */
  _generateArtifactDependencies(dag) {
    const dependencies = new Map();

    for (const node of dag.nodes) {
      for (const inputArtifact of node.input_artifacts) {
        if (!dependencies.has(inputArtifact)) {
          dependencies.set(inputArtifact, []);
        }
        dependencies.get(inputArtifact).push(node.node_id);
      }
    }

    return Object.fromEntries(dependencies);
  }

  /**
   * Generate execution order (topological sort)
   */
  _generateExecutionOrder(dag) {
    const order = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (nodeId) => {
      if (visiting.has(nodeId)) {
        throw new Error(`Cycle detected in execution DAG at node ${nodeId}`);
      }
      if (visited.has(nodeId)) {
        return;
      }

      visiting.add(nodeId);

      const node = dag.nodes.find(n => n.node_id === nodeId);
      if (node) {
        for (const dep of node.dependencies) {
          visit(dep);
        }
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
      order.push(nodeId);
    };

    for (const node of dag.nodes) {
      visit(node.node_id);
    }

    return order;
  }

  /**
   * Generate expected artifacts
   */
  _generateExpectedArtifacts(dag) {
    const artifacts = new Set();

    for (const node of dag.nodes) {
      for (const artifact of node.output_artifacts) {
        artifacts.add(artifact);
      }
    }

    return Array.from(artifacts);
  }

  /**
   * Generate policies
   */
  _generatePolicies(mission) {
    return [
      {
        policy_id: 'replay-policy',
        policy_type: 'ReplayPolicy',
        version: '1.0.0',
        rules: [
          {
            rule_id: 'replay-deterministic',
            condition: 'replay_evidence.deterministic === true',
            action: 'approve',
          },
          {
            rule_id: 'replay-hash-match',
            condition: 'replay_evidence.hash_match === true',
            action: 'approve',
          },
        ],
      },
      {
        policy_id: 'witness-policy',
        policy_type: 'WitnessPolicy',
        version: '1.0.0',
        rules: [
          {
            rule_id: 'witness-signature-valid',
            condition: 'witness_evidence.signature_valid === true',
            action: 'approve',
          },
          {
            rule_id: 'witness-hash-match',
            condition: 'witness_evidence.hash_match === true',
            action: 'approve',
          },
        ],
      },
      {
        policy_id: 'canonical-policy',
        policy_type: 'CanonicalPolicy',
        version: '1.0.0',
        rules: [
          {
            rule_id: 'canonical-serialization',
            condition: 'all_artifacts.canonical_serialized === true',
            action: 'approve',
          },
        ],
      },
      {
        policy_id: 'determinism-policy',
        policy_type: 'DeterminismPolicy',
        version: '1.0.0',
        rules: [
          {
            rule_id: 'fuzz-determinism',
            condition: 'replay_evidence.fuzz_deterministic === true',
            action: 'approve',
          },
        ],
      },
      {
        policy_id: 'integration-policy',
        policy_type: 'IntegrationPolicy',
        version: '1.0.0',
        rules: [
          {
            rule_id: 'all-policies-approved',
            condition: 'all_policies.approved === true',
            action: 'approve',
          },
        ],
      },
      {
        policy_id: 'rollback-policy',
        policy_type: 'RollbackPolicy',
        version: '1.0.0',
        rules: [
          {
            rule_id: 'rollback-on-failure',
            condition: 'any_policy.failed === true',
            action: 'rollback',
          },
        ],
      },
    ];
  }

  /**
   * Generate immutable dependency manifest
   * 
   * Ω.96.8 — Immutable Dependency Manifest
   * 
   * Every execution plan contains:
   * - Authority versions
   * - Policy versions
   * - Schema versions
   * - Artifact versions
   * - Compiler versions
   * - Runtime version
   * 
   * Replay now reconstructs the entire execution environment.
   */
  _generateDependencyManifest(dag, policies) {
    // Extract unique authorities from DAG nodes
    const authorityVersions = new Map();
    for (const node of dag.nodes) {
      if (!authorityVersions.has(node.authority)) {
        authorityVersions.set(node.authority, '1.0.0'); // Default version
      }
    }

    // Extract policy versions
    const policyVersions = new Map();
    for (const policy of policies) {
      policyVersions.set(policy.policy_id, policy.version);
    }

    // Schema versions (default to 1.0.0 for now)
    const schemaVersions = {
      execution_plan: '1.0.0',
      artifact: '1.0.0',
      mission: '1.0.0',
      policy: '1.0.0',
      authority: '1.0.0',
      event: '1.0.0',
    };

    // Artifact type versions (default to 1.0.0 for now)
    const artifactTypeVersions = {
      WorkflowIR: '1.0.0',
      ExecutionPlan: '1.0.0',
      ReplayEvidence: '1.0.0',
      WitnessEvidence: '1.0.0',
      PolicyDecision: '1.0.0',
      CommitManifest: '1.0.0',
      Mission: '1.0.0',
      RFC: '1.0.0',
      HistoryRecord: '1.0.0',
      Artifact: '1.0.0',
    };

    // Compiler versions
    const compilerVersions = {
      execution_graph_compiler: '1.0.0',
      policy_compiler: '1.0.0',
    };

    // Runtime version
    const runtimeVersion = '1.0.0';

    return {
      authority_versions: Object.fromEntries(authorityVersions),
      policy_versions: Object.fromEntries(policyVersions),
      schema_versions: schemaVersions,
      artifact_type_versions: artifactTypeVersions,
      compiler_versions: compilerVersions,
      runtime_version: runtimeVersion,
      constitutional_version: 'Ω.96',
      generated_at: new Date(constitutionalTimeAuthority.now()).toISOString(),
      canonical_hash: CanonicalAuthority.hash({
        authority_versions: Object.fromEntries(authorityVersions),
        policy_versions: Object.fromEntries(policyVersions),
        schema_versions: schemaVersions,
        artifact_type_versions: artifactTypeVersions,
        compiler_versions: compilerVersions,
        runtime_version: runtimeVersion,
      }),
    };
  }

  /**
   * Validate execution plan
   */
  validatePlan(executionPlan) {
    const errors = [];

    // Check for cycles
    const visited = new Set();
    const visiting = new Set();

    const checkCycle = (nodeId) => {
      if (visiting.has(nodeId)) {
        errors.push(`Cycle detected at node ${nodeId}`);
        return;
      }
      if (visited.has(nodeId)) {
        return;
      }

      visiting.add(nodeId);

      const node = executionPlan.nodes.find(n => n.node_id === nodeId);
      if (node) {
        for (const dep of node.dependencies) {
          checkCycle(dep);
        }
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
    };

    for (const node of executionPlan.nodes) {
      checkCycle(node.node_id);
    }

    // Check that all dependencies exist
    for (const node of executionPlan.nodes) {
      for (const dep of node.dependencies) {
        if (!executionPlan.nodes.find(n => n.node_id === dep)) {
          errors.push(`Dependency ${dep} not found for node ${node.node_id}`);
        }
      }
    }

    // Check that all edges reference valid nodes
    for (const edge of executionPlan.edges) {
      if (!executionPlan.nodes.find(n => n.node_id === edge.from)) {
        errors.push(`Edge from ${edge.from} references non-existent node`);
      }
      if (!executionPlan.nodes.find(n => n.node_id === edge.to)) {
        errors.push(`Edge to ${edge.to} references non-existent node`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }
}

module.exports = { ConstitutionalExecutionPlanner };
