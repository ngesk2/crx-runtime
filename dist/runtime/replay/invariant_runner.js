"use strict";
/**
 * INVARIANT RUNNER
 *
 * Pure TypeScript implementation of invariant runner.
 * Ported from constitutional-integration-lab/extracted/js_txt/formal_invariant_graph_verifier.js
 *
 * Requirements:
 * - DAG cycle detection
 * - forbidden edge detection
 * - lineage validation
 * - invariant execution pipeline
 * - deterministic traversal ordering
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvariantRunner = void 0;
class InvariantRunner {
    invariants = new Map();
    registerInvariant(invariant) {
        this.invariants.set(invariant.invariant_id, invariant);
    }
    /**
     * Run all invariants against replay state
     * Constitutional rule: deterministic invariant execution order by invariant_id
     */
    runInvariants(state) {
        const violations = [];
        // Constitutional rule: sort invariants by invariant_id for deterministic execution order
        const sortedInvariants = Array.from(this.invariants.values()).sort((a, b) => {
            if (a.invariant_id < b.invariant_id)
                return -1;
            if (a.invariant_id > b.invariant_id)
                return 1;
            return 0;
        });
        for (const invariant of sortedInvariants) {
            const violation = invariant.invariant_function(state);
            if (violation) {
                violations.push(violation);
            }
        }
        return violations;
    }
    /**
     * Detect cycles in lineage graph
     * Constitutional rule: deterministic graph traversal ordering
     */
    detectCycles(lineage) {
        const cycles = [];
        const visited = new Set();
        const recursionStack = new Set();
        const graph = this.buildAdjacencyMap(lineage.edges);
        // Constitutional rule: sort nodes deterministically for traversal
        const sortedNodes = Array.from(graph.keys()).sort((a, b) => {
            if (a < b)
                return -1;
            if (a > b)
                return 1;
            return 0;
        });
        for (const nodeId of sortedNodes) {
            if (this.hasCycleDFS(nodeId, visited, recursionStack, graph)) {
                cycles.push(nodeId);
            }
        }
        return cycles;
    }
    /**
     * Detect forbidden edges in lineage graph
     */
    detectForbiddenEdges(lineage, forbiddenEdgeTypes) {
        return lineage.edges.filter(edge => forbiddenEdgeTypes.includes(edge.edge_type));
    }
    /**
     * Validate lineage integrity
     */
    validateLineage(lineage, state) {
        // Check that all parent artifacts exist in state
        for (const edge of lineage.edges) {
            if (!state.artifacts.has(edge.parent_id)) {
                return false;
            }
            if (!state.artifacts.has(edge.child_id)) {
                return false;
            }
        }
        return true;
    }
    /**
     * Build adjacency map from lineage edges
     */
    buildAdjacencyMap(edges) {
        const graph = new Map();
        for (const edge of edges) {
            if (!graph.has(edge.parent_id)) {
                graph.set(edge.parent_id, []);
            }
            graph.get(edge.parent_id).push(edge.child_id);
        }
        return graph;
    }
    /**
     * DFS cycle detection
     * Constitutional rule: deterministic neighbor traversal ordering
     */
    hasCycleDFS(nodeId, visited, recursionStack, graph) {
        visited.add(nodeId);
        recursionStack.add(nodeId);
        // Constitutional rule: sort neighbors deterministically for traversal
        const neighbors = [...(graph.get(nodeId) || [])].sort((a, b) => {
            if (a < b)
                return -1;
            if (a > b)
                return 1;
            return 0;
        });
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                if (this.hasCycleDFS(neighbor, visited, recursionStack, graph)) {
                    return true;
                }
            }
            else if (recursionStack.has(neighbor)) {
                return true;
            }
        }
        recursionStack.delete(nodeId);
        return false;
    }
}
exports.InvariantRunner = InvariantRunner;
