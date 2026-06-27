/**
 * Constraint Solver
 * 
 * Every semantic object eventually becomes constraints:
 * 
 * Authority(UserRepository) must own Persistence(User) AND Capability(Write) AND Mutation(User)
 * 
 * Authority A requires Capability B requires Ownership C requires Trust D
 * 
 * Eventually you'll have thousands of constraints.
 * You need a graph constraint solver.
 * 
 * Think SAT solver combined with static analysis.
 */

import { SymbolID } from '../ir/node-types';
import { SemanticIRNode } from '../lowering/semantic-lowerer';
import { CanonicalSymbol } from '../lowering/semantic-lowerer';
import { OwnershipEngine } from '../engines/ownership-engine';
import { CapabilityEngine, CapabilityType } from '../engines/capability-engine';

/**
 * Constraint Type
 */
export enum ConstraintType {
  Ownership = 'Ownership',
  Capability = 'Capability',
  Trust = 'Trust',
  Authority = 'Authority',
  Persistence = 'Persistence',
  Mutation = 'Mutation',
  Identity = 'Identity',
  Boundary = 'Boundary',
  Lifecycle = 'Lifecycle',
}

/**
 * Constraint Operator
 */
export enum ConstraintOperator {
  Equals = 'Equals',
  NotEquals = 'NotEquals',
  Contains = 'Contains',
  NotContains = 'NotContains',
  Requires = 'Requires',
  Excludes = 'Excludes',
  Implies = 'Implies',
  And = 'And',
  Or = 'Or',
  Not = 'Not',
}

/**
 * Constraint
 */
export interface Constraint {
  id: SymbolID;
  type: ConstraintType;
  operator: ConstraintOperator;
  left: SymbolID;
  right: SymbolID | SymbolID[];
  satisfied: boolean;
  confidence: number;
  evidence: SymbolID[];
}

/**
 * Constraint Graph
 */
export interface ConstraintGraph {
  nodes: Map<SymbolID, Constraint>;
  edges: Map<SymbolID, SymbolID[]>; // constraintId -> dependent constraintIds
}

/**
 * Constraint Solution
 */
export interface ConstraintSolution {
  satisfiable: boolean;
  satisfiedConstraints: SymbolID[];
  unsatisfiedConstraints: SymbolID[];
  confidence: number;
  solution: Map<SymbolID, any>;
}

/**
 * Constraint Solver
 */
export class ConstraintSolver {
  private constraints: Map<SymbolID, Constraint> = new Map();
  private constraintGraph: ConstraintGraph = {
    nodes: new Map(),
    edges: new Map(),
  };
  private solutions: Map<SymbolID, ConstraintSolution> = new Map();

  /**
   * Add constraint
   */
  addConstraint(
    type: ConstraintType,
    operator: ConstraintOperator,
    left: SymbolID,
    right: SymbolID | SymbolID[]
  ): Constraint {
    const id = this.generateConstraintId(type, left, operator);
    const constraint: Constraint = {
      id,
      type,
      operator,
      left,
      right,
      satisfied: false,
      confidence: 0.0,
      evidence: [],
    };

    this.constraints.set(id, constraint);
    this.constraintGraph.nodes.set(id, constraint);
    this.constraintGraph.edges.set(id, []);

    return constraint;
  }

  /**
   * Add dependency between constraints
   */
  addConstraintDependency(fromId: SymbolID, toId: SymbolID): void {
    if (!this.constraintGraph.edges.has(fromId)) {
      this.constraintGraph.edges.set(fromId, []);
    }
    this.constraintGraph.edges.get(fromId)!.push(toId);
  }

  /**
   * Solve all constraints
   */
  async solveConstraints(
    semanticIR: Map<SymbolID, SemanticIRNode>,
    canonicalSymbols: Map<SymbolID, CanonicalSymbol>,
    ownershipEngine: OwnershipEngine,
    capabilityEngine: CapabilityEngine
  ): Promise<ConstraintSolution> {
    const satisfiedConstraints: SymbolID[] = [];
    const unsatisfiedConstraints: SymbolID[] = [];
    let totalConfidence = 0;

    // Solve each constraint
    for (const constraint of this.constraints.values()) {
      const result = await this.solveConstraint(
        constraint,
        semanticIR,
        canonicalSymbols,
        ownershipEngine,
        capabilityEngine
      );

      constraint.satisfied = result.satisfied;
      constraint.confidence = result.confidence;
      constraint.evidence = result.evidence;

      if (result.satisfied) {
        satisfiedConstraints.push(constraint.id);
      } else {
        unsatisfiedConstraints.push(constraint.id);
      }

      totalConfidence += result.confidence;
    }

    const averageConfidence = this.constraints.size > 0 ? totalConfidence / this.constraints.size : 0;
    const satisfiable = unsatisfiedConstraints.length === 0;

    const solution: ConstraintSolution = {
      satisfiable,
      satisfiedConstraints,
      unsatisfiedConstraints,
      confidence: averageConfidence,
      solution: new Map(),
    };

    this.solutions.set('current', solution);
    return solution;
  }

  /**
   * Solve a single constraint
   */
  private async solveConstraint(
    constraint: Constraint,
    semanticIR: Map<SymbolID, SemanticIRNode>,
    canonicalSymbols: Map<SymbolID, CanonicalSymbol>,
    ownershipEngine: OwnershipEngine,
    capabilityEngine: CapabilityEngine
  ): Promise<{ satisfied: boolean; confidence: number; evidence: SymbolID[] }> {
    switch (constraint.type) {
      case ConstraintType.Ownership:
        return this.solveOwnershipConstraint(constraint, ownershipEngine);
      case ConstraintType.Capability:
        return this.solveCapabilityConstraint(constraint, capabilityEngine);
      case ConstraintType.Trust:
        return this.solveTrustConstraint(constraint, semanticIR);
      case ConstraintType.Authority:
        return this.solveAuthorityConstraint(constraint, semanticIR);
      case ConstraintType.Persistence:
        return this.solvePersistenceConstraint(constraint, semanticIR);
      case ConstraintType.Mutation:
        return this.solveMutationConstraint(constraint, semanticIR);
      case ConstraintType.Identity:
        return this.solveIdentityConstraint(constraint, semanticIR);
      case ConstraintType.Boundary:
        return this.solveBoundaryConstraint(constraint, semanticIR);
      case ConstraintType.Lifecycle:
        return this.solveLifecycleConstraint(constraint, semanticIR);
      default:
        return { satisfied: false, confidence: 0.0, evidence: [] };
    }
  }

  /**
   * Solve ownership constraint
   */
  private solveOwnershipConstraint(
    constraint: Constraint,
    ownershipEngine: OwnershipEngine
  ): { satisfied: boolean; confidence: number; evidence: SymbolID[] } {
    const owner = constraint.left;
    const target = Array.isArray(constraint.right) ? constraint.right[0] : constraint.right;

    const hasOwnership = ownershipEngine.hasOwnership(owner, target);

    return {
      satisfied: hasOwnership,
      confidence: hasOwnership ? 1.0 : 0.0,
      evidence: hasOwnership ? [constraint.id] : [],
    };
  }

  /**
   * Solve capability constraint
   */
  private solveCapabilityConstraint(
    constraint: Constraint,
    capabilityEngine: CapabilityEngine
  ): { satisfied: boolean; confidence: number; evidence: SymbolID[] } {
    const entity = constraint.left;
    const requiredCapabilities = Array.isArray(constraint.right) ? constraint.right : [constraint.right];

    let satisfied = true;
    let confidence = 1.0;
    const evidence: SymbolID[] = [];

    for (const capability of requiredCapabilities) {
      const hasCapability = capabilityEngine.hasCapability(entity, CapabilityType.Execute, capability);
      if (!hasCapability) {
        satisfied = false;
        confidence *= 0.5;
      } else {
        evidence.push(capability);
      }
    }

    return { satisfied, confidence, evidence };
  }

  /**
   * Solve trust constraint
   */
  private solveTrustConstraint(
    constraint: Constraint,
    semanticIR: Map<SymbolID, SemanticIRNode>
  ): { satisfied: boolean; confidence: number; evidence: SymbolID[] } {
    // TODO: Implement trust constraint solving
    return { satisfied: true, confidence: 0.5, evidence: [] };
  }

  /**
   * Solve authority constraint
   */
  private solveAuthorityConstraint(
    constraint: Constraint,
    semanticIR: Map<SymbolID, SemanticIRNode>
  ): { satisfied: boolean; confidence: number; evidence: SymbolID[] } {
    const authority = constraint.left;
    const target = Array.isArray(constraint.right) ? constraint.right[0] : constraint.right;

    const node = semanticIR.get(target);
    if (!node) {
      return { satisfied: false, confidence: 0.0, evidence: [] };
    }

    const hasAuthority = node.authorityRequired === authority;

    return {
      satisfied: hasAuthority,
      confidence: hasAuthority ? 1.0 : 0.0,
      evidence: hasAuthority ? [constraint.id] : [],
    };
  }

  /**
   * Solve persistence constraint
   */
  private solvePersistenceConstraint(
    constraint: Constraint,
    semanticIR: Map<SymbolID, SemanticIRNode>
  ): { satisfied: boolean; confidence: number; evidence: SymbolID[] } {
    const authority = constraint.left;
    const target = Array.isArray(constraint.right) ? constraint.right[0] : constraint.right;

    const node = semanticIR.get(target);
    if (!node) {
      return { satisfied: false, confidence: 0.0, evidence: [] };
    }

    const hasPersistence = node.persistenceActions.length > 0;
    const authorityOwns = node.authorityRequired === authority;

    const satisfied = hasPersistence && authorityOwns;

    return {
      satisfied,
      confidence: satisfied ? 1.0 : 0.5,
      evidence: satisfied ? [constraint.id] : [],
    };
  }

  /**
   * Solve mutation constraint
   */
  private solveMutationConstraint(
    constraint: Constraint,
    semanticIR: Map<SymbolID, SemanticIRNode>
  ): { satisfied: boolean; confidence: number; evidence: SymbolID[] } {
    const authority = constraint.left;
    const target = Array.isArray(constraint.right) ? constraint.right[0] : constraint.right;

    const node = semanticIR.get(target);
    if (!node) {
      return { satisfied: false, confidence: 0.0, evidence: [] };
    }

    const hasMutation = node.stateMutations.length > 0;
    const authorityOwns = node.authorityRequired === authority;

    const satisfied = hasMutation && authorityOwns;

    return {
      satisfied,
      confidence: satisfied ? 1.0 : 0.5,
      evidence: satisfied ? [constraint.id] : [],
    };
  }

  /**
   * Solve identity constraint
   */
  private solveIdentityConstraint(
    constraint: Constraint,
    semanticIR: Map<SymbolID, SemanticIRNode>
  ): { satisfied: boolean; confidence: number; evidence: SymbolID[] } {
    // TODO: Implement identity constraint solving
    return { satisfied: true, confidence: 0.5, evidence: [] };
  }

  /**
   * Solve boundary constraint
   */
  private solveBoundaryConstraint(
    constraint: Constraint,
    semanticIR: Map<SymbolID, SemanticIRNode>
  ): { satisfied: boolean; confidence: number; evidence: SymbolID[] } {
    // TODO: Implement boundary constraint solving
    return { satisfied: true, confidence: 0.5, evidence: [] };
  }

  /**
   * Solve lifecycle constraint
   */
  private solveLifecycleConstraint(
    constraint: Constraint,
    semanticIR: Map<SymbolID, SemanticIRNode>
  ): { satisfied: boolean; confidence: number; evidence: SymbolID[] } {
    // TODO: Implement lifecycle constraint solving
    return { satisfied: true, confidence: 0.5, evidence: [] };
  }

  /**
   * Generate constraint ID
   */
  private generateConstraintId(type: ConstraintType, left: SymbolID, operator: ConstraintOperator): SymbolID {
    return `constraint:${type}:${left}:${operator}`;
  }

  /**
   * Get constraint by ID
   */
  getConstraint(id: SymbolID): Constraint | undefined {
    return this.constraints.get(id);
  }

  /**
   * Get constraints by type
   */
  getConstraintsByType(type: ConstraintType): Constraint[] {
    return Array.from(this.constraints.values()).filter(c => c.type === type);
  }

  /**
   * Get unsatisfied constraints
   */
  getUnsatisfiedConstraints(): Constraint[] {
    return Array.from(this.constraints.values()).filter(c => !c.satisfied);
  }

  /**
   * Get satisfied constraints
   */
  getSatisfiedConstraints(): Constraint[] {
    return Array.from(this.constraints.values()).filter(c => c.satisfied);
  }

  /**
   * Get constraint graph
   */
  getConstraintGraph(): ConstraintGraph {
    return this.constraintGraph;
  }

  /**
   * Get solution
   */
  getSolution(): ConstraintSolution | undefined {
    return this.solutions.get('current');
  }

  /**
   * Detect constraint cycles
   */
  detectCycles(): SymbolID[][] {
    const cycles: SymbolID[][] = [];
    const visited = new Set<SymbolID>();
    const recursionStack = new Set<SymbolID>();

    const dfs = (nodeId: SymbolID, path: SymbolID[]): void => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const neighbors = this.constraintGraph.edges.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path]);
        } else if (recursionStack.has(neighbor)) {
          // Found cycle
          const cycleStart = path.indexOf(neighbor);
          cycles.push(path.slice(cycleStart));
        }
      }

      recursionStack.delete(nodeId);
      path.pop();
    };

    for (const nodeId of this.constraintGraph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    }

    return cycles;
  }

  /**
   * Propagate constraint satisfaction
   */
  propagateSatisfaction(): void {
    const visited = new Set<SymbolID>();
    const queue: SymbolID[] = [];

    // Start with satisfied constraints
    for (const constraint of this.constraints.values()) {
      if (constraint.satisfied) {
        queue.push(constraint.id);
      }
    }

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const dependents = this.constraintGraph.edges.get(currentId) || [];
      for (const dependentId of dependents) {
        const dependent = this.constraints.get(dependentId);
        if (dependent && !dependent.satisfied) {
          // Check if all dependencies are satisfied
          const dependencies = this.getDependencies(dependentId);
          const allSatisfied = dependencies.every(depId => {
            const dep = this.constraints.get(depId);
            return dep && dep.satisfied;
          });

          if (allSatisfied) {
            dependent.satisfied = true;
            dependent.confidence = 1.0;
            queue.push(dependentId);
          }
        }
      }
    }
  }

  /**
   * Get dependencies of a constraint
   */
  private getDependencies(constraintId: SymbolID): SymbolID[] {
    const dependencies: SymbolID[] = [];
    for (const [id, dependents] of this.constraintGraph.edges) {
      if (dependents.includes(constraintId)) {
        dependencies.push(id);
      }
    }
    return dependencies;
  }

  /**
   * Clear all constraints
   */
  clear(): void {
    this.constraints.clear();
    this.constraintGraph.nodes.clear();
    this.constraintGraph.edges.clear();
    this.solutions.clear();
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalConstraints: number;
    satisfied: number;
    unsatisfied: number;
    byType: Record<ConstraintType, number>;
    cycles: number;
  } {
    const byType: Record<ConstraintType, number> = {} as any;
    let satisfied = 0;
    let unsatisfied = 0;

    for (const constraint of this.constraints.values()) {
      byType[constraint.type] = (byType[constraint.type] || 0) + 1;
      if (constraint.satisfied) {
        satisfied++;
      } else {
        unsatisfied++;
      }
    }

    const cycles = this.detectCycles();

    return {
      totalConstraints: this.constraints.size,
      satisfied,
      unsatisfied,
      byType,
      cycles: cycles.length,
    };
  }

  /**
   * Export to JSON
   */
  exportToJSON(): string {
    const data = {
      constraints: Array.from(this.constraints.values()),
      graph: {
        nodes: Array.from(this.constraintGraph.nodes.entries()),
        edges: Array.from(this.constraintGraph.edges.entries()),
      },
      solution: this.solutions.get('current'),
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import from JSON
   */
  importFromJSON(json: string): void {
    const data = JSON.parse(json);
    
    for (const constraint of data.constraints) {
      this.constraints.set(constraint.id, constraint);
      this.constraintGraph.nodes.set(constraint.id, constraint);
    }
    
    for (const [id, edges] of data.graph.edges) {
      this.constraintGraph.edges.set(id, edges);
    }
    
    if (data.solution) {
      this.solutions.set('current', data.solution);
    }
  }
}
