/**
 * Rule Provenance Engine
 * 
 * Every rule contains:
 * - Document
 * - Section
 * - Paragraph
 * - Exact Quote
 * - Hash
 * - Version
 * 
 * This enables reproducible audits and rule evolution tracking.
 */

import { SymbolID } from '../ir/node-types';
import { ConstitutionalRule } from '../registry/constitutional-registry-loader';

/**
 * Rule Provenance
 */
export interface RuleProvenance {
  id: SymbolID;
  ruleId: SymbolID;
  document: string;
  section: string;
  paragraph: string;
  exactQuote: string;
  hash: string;
  version: string;
  author: SymbolID;
  createdAt: string;
  modifiedAt: string;
  gitCommit?: string;
  gitTree?: string;
  compilerVersion: string;
  registryVersion: string;
  ruleVersion: string;
  semanticIRVersion: string;
}

/**
 * Rule Dependency
 */
export interface RuleDependency {
  id: SymbolID;
  ruleId: SymbolID;
  dependsOn: SymbolID;
  dependencyType: DependencyType;
  evidence: SymbolID[];
}

/**
 * Dependency Type
 */
export enum DependencyType {
  Direct = 'Direct',
  Indirect = 'Indirect',
  Transitive = 'Transitive',
  Conditional = 'Conditional',
}

/**
 * Rule Evolution
 */
export interface RuleEvolution {
  id: SymbolID;
  ruleId: SymbolID;
  fromVersion: string;
  toVersion: string;
  changeType: ChangeType;
  changeDescription: string;
  author: SymbolID;
  timestamp: string;
  gitCommit?: string;
  evidence: SymbolID[];
}

/**
 * Change Type
 */
export enum ChangeType {
  Created = 'Created',
  Modified = 'Modified',
  Deprecated = 'Deprecated',
  Deleted = 'Deleted',
  Restored = 'Restored',
}

/**
 * Rule Violation
 */
export interface RuleViolation {
  id: SymbolID;
  ruleId: SymbolID;
  violationType: ViolationType;
  severity: Severity;
  target: SymbolID;
  location: {
    sourceFile: string;
    sourceLine: number;
    sourceColumn: number;
  };
  evidence: SymbolID[];
  counterEvidence: SymbolID[];
  confidence: number;
  timestamp: string;
}

/**
 * Violation Type
 */
export enum ViolationType {
  Ownership = 'Ownership',
  Capability = 'Capability',
  Persistence = 'Persistence',
  Trust = 'Trust',
  Identity = 'Identity',
  Event = 'Event',
  Mutation = 'Mutation',
  Construction = 'Construction',
  Boundary = 'Boundary',
  Lifecycle = 'Lifecycle',
}

/**
 * Severity
 */
export enum Severity {
  Critical = 'Critical',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
  Info = 'Info',
}

/**
 * Rule Provenance Engine
 */
export class RuleProvenanceEngine {
  private ruleProvenance: Map<SymbolID, RuleProvenance> = new Map();
  private ruleIndex: Map<SymbolID, SymbolID> = new Map(); // ruleId -> provenanceId
  private hashIndex: Map<string, SymbolID> = new Map(); // hash -> provenanceId
  
  private ruleDependencies: Map<SymbolID, RuleDependency> = new Map();
  private dependencyIndex: Map<SymbolID, SymbolID[]> = new Map(); // ruleId -> dependencies
  
  private ruleEvolutions: Map<SymbolID, RuleEvolution> = new Map();
  private evolutionIndex: Map<SymbolID, SymbolID[]> = new Map(); // ruleId -> evolutions
  
  private ruleViolations: Map<SymbolID, RuleViolation> = new Map();
  private violationIndex: Map<SymbolID, SymbolID[]> = new Map(); // ruleId -> violations
  private severityIndex: Map<Severity, SymbolID[]> = new Map(); // severity -> violations

  /**
   * Register rule provenance
   */
  registerRuleProvenance(
    rule: ConstitutionalRule,
    author: SymbolID,
    gitCommit?: string,
    gitTree?: string,
    compilerVersion: string = '1.0.0',
    registryVersion: string = '1.0.0',
    ruleVersion: string = '1.0.0',
    semanticIRVersion: string = '1.0.0'
  ): RuleProvenance {
    const id = this.generateProvenanceId(rule.id);
    const provenance: RuleProvenance = {
      id,
      ruleId: rule.id,
      document: rule.document,
      section: rule.section,
      paragraph: rule.paragraph,
      exactQuote: rule.exactQuote,
      hash: rule.hash,
      version: rule.version,
      author,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      gitCommit,
      gitTree,
      compilerVersion,
      registryVersion,
      ruleVersion,
      semanticIRVersion,
    };

    this.ruleProvenance.set(id, provenance);
    this.ruleIndex.set(rule.id, id);
    this.hashIndex.set(rule.hash, id);

    return provenance;
  }

  /**
   * Add rule dependency
   */
  addRuleDependency(
    ruleId: SymbolID,
    dependsOn: SymbolID,
    dependencyType: DependencyType,
    evidence: SymbolID[] = []
  ): RuleDependency {
    const id = this.generateDependencyId(ruleId, dependsOn);
    const dependency: RuleDependency = {
      id,
      ruleId,
      dependsOn,
      dependencyType,
      evidence,
    };

    this.ruleDependencies.set(id, dependency);
    
    if (!this.dependencyIndex.has(ruleId)) {
      this.dependencyIndex.set(ruleId, []);
    }
    this.dependencyIndex.get(ruleId)!.push(id);

    return dependency;
  }

  /**
   * Add rule evolution
   */
  addRuleEvolution(
    ruleId: SymbolID,
    fromVersion: string,
    toVersion: string,
    changeType: ChangeType,
    changeDescription: string,
    author: SymbolID,
    gitCommit?: string,
    evidence: SymbolID[] = []
  ): RuleEvolution {
    const id = this.generateEvolutionId(ruleId, toVersion);
    const evolution: RuleEvolution = {
      id,
      ruleId,
      fromVersion,
      toVersion,
      changeType,
      changeDescription,
      author,
      timestamp: new Date().toISOString(),
      gitCommit,
      evidence,
    };

    this.ruleEvolutions.set(id, evolution);
    
    if (!this.evolutionIndex.has(ruleId)) {
      this.evolutionIndex.set(ruleId, []);
    }
    this.evolutionIndex.get(ruleId)!.push(id);

    return evolution;
  }

  /**
   * Add rule violation
   */
  addRuleViolation(
    ruleId: SymbolID,
    violationType: ViolationType,
    severity: Severity,
    target: SymbolID,
    location: {
      sourceFile: string;
      sourceLine: number;
      sourceColumn: number;
    },
    evidence: SymbolID[] = [],
    counterEvidence: SymbolID[] = [],
    confidence: number = 1.0
  ): RuleViolation {
    const id = this.generateViolationId(ruleId, target);
    const violation: RuleViolation = {
      id,
      ruleId,
      violationType,
      severity,
      target,
      location,
      evidence,
      counterEvidence,
      confidence,
      timestamp: new Date().toISOString(),
    };

    this.ruleViolations.set(id, violation);
    
    if (!this.violationIndex.has(ruleId)) {
      this.violationIndex.set(ruleId, []);
    }
    this.violationIndex.get(ruleId)!.push(id);
    
    if (!this.severityIndex.has(severity)) {
      this.severityIndex.set(severity, []);
    }
    this.severityIndex.get(severity)!.push(id);

    return violation;
  }

  /**
   * Get rule provenance by rule ID
   */
  getRuleProvenance(ruleId: SymbolID): RuleProvenance | undefined {
    const provenanceId = this.ruleIndex.get(ruleId);
    if (!provenanceId) return undefined;
    return this.ruleProvenance.get(provenanceId);
  }

  /**
   * Get rule provenance by hash
   */
  getRuleProvenanceByHash(hash: string): RuleProvenance | undefined {
    const provenanceId = this.hashIndex.get(hash);
    if (!provenanceId) return undefined;
    return this.ruleProvenance.get(provenanceId);
  }

  /**
   * Get rule dependencies by rule ID
   */
  getRuleDependencies(ruleId: SymbolID): RuleDependency[] {
    const ids = this.dependencyIndex.get(ruleId) || [];
    return ids.map(id => this.ruleDependencies.get(id)!).filter(d => d !== undefined);
  }

  /**
   * Get rule evolutions by rule ID
   */
  getRuleEvolutions(ruleId: SymbolID): RuleEvolution[] {
    const ids = this.evolutionIndex.get(ruleId) || [];
    return ids.map(id => this.ruleEvolutions.get(id)!).filter(e => e !== undefined);
  }

  /**
   * Get rule violations by rule ID
   */
  getRuleViolations(ruleId: SymbolID): RuleViolation[] {
    const ids = this.violationIndex.get(ruleId) || [];
    return ids.map(id => this.ruleViolations.get(id)!).filter(v => v !== undefined);
  }

  /**
   * Get violations by severity
   */
  getViolationsBySeverity(severity: Severity): RuleViolation[] {
    const ids = this.severityIndex.get(severity) || [];
    return ids.map(id => this.ruleViolations.get(id)!).filter(v => v !== undefined);
  }

  /**
   * Get violations by type
   */
  getViolationsByType(violationType: ViolationType): RuleViolation[] {
    const results: RuleViolation[] = [];
    
    for (const violation of this.ruleViolations.values()) {
      if (violation.violationType === violationType) {
        results.push(violation);
      }
    }
    
    return results;
  }

  /**
   * Get violations by target
   */
  getViolationsByTarget(target: SymbolID): RuleViolation[] {
    const results: RuleViolation[] = [];
    
    for (const violation of this.ruleViolations.values()) {
      if (violation.target === target) {
        results.push(violation);
      }
    }
    
    return results;
  }

  /**
   * Get critical violations
   */
  getCriticalViolations(): RuleViolation[] {
    return this.getViolationsBySeverity(Severity.Critical);
  }

  /**
   * Get high severity violations
   */
  getHighSeverityViolations(): RuleViolation[] {
    return this.getViolationsBySeverity(Severity.High);
  }

  /**
   * Get all rule provenance
   */
  getAllRuleProvenance(): RuleProvenance[] {
    return Array.from(this.ruleProvenance.values());
  }

  /**
   * Get all rule dependencies
   */
  getAllRuleDependencies(): RuleDependency[] {
    return Array.from(this.ruleDependencies.values());
  }

  /**
   * Get all rule evolutions
   */
  getAllRuleEvolutions(): RuleEvolution[] {
    return Array.from(this.ruleEvolutions.values());
  }

  /**
   * Get all rule violations
   */
  getAllRuleViolations(): RuleViolation[] {
    return Array.from(this.ruleViolations.values());
  }

  /**
   * Build dependency graph
   */
  buildDependencyGraph(): Map<SymbolID, SymbolID[]> {
    const graph = new Map<SymbolID, SymbolID[]>();
    
    for (const dependency of this.ruleDependencies.values()) {
      if (!graph.has(dependency.ruleId)) {
        graph.set(dependency.ruleId, []);
      }
      graph.get(dependency.ruleId)!.push(dependency.dependsOn);
    }
    
    return graph;
  }

  /**
   * Build evolution timeline
   */
  buildEvolutionTimeline(ruleId: SymbolID): RuleEvolution[] {
    const evolutions = this.getRuleEvolutions(ruleId);
    return evolutions.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Trace rule lineage
   */
  traceRuleLineage(ruleId: SymbolID): RuleProvenance[] {
    const lineage: RuleProvenance[] = [];
    const visited = new Set<SymbolID>();
    
    this.traceRuleLineageRecursive(ruleId, lineage, visited);
    
    return lineage;
  }

  /**
   * Trace rule lineage recursively
   */
  private traceRuleLineageRecursive(
    ruleId: SymbolID,
    lineage: RuleProvenance[],
    visited: Set<SymbolID>
  ): void {
    if (visited.has(ruleId)) return;
    visited.add(ruleId);
    
    const provenance = this.getRuleProvenance(ruleId);
    if (provenance) {
      lineage.push(provenance);
    }
    
    const dependencies = this.getRuleDependencies(ruleId);
    for (const dependency of dependencies) {
      this.traceRuleLineageRecursive(dependency.dependsOn, lineage, visited);
    }
  }

  /**
   * Merge provenance from another engine
   */
  merge(other: RuleProvenanceEngine): void {
    for (const provenance of other.getAllRuleProvenance()) {
      this.ruleProvenance.set(provenance.id, provenance);
      this.ruleIndex.set(provenance.ruleId, provenance.id);
      this.hashIndex.set(provenance.hash, provenance.id);
    }
    
    for (const dependency of other.getAllRuleDependencies()) {
      this.ruleDependencies.set(dependency.id, dependency);
      
      if (!this.dependencyIndex.has(dependency.ruleId)) {
        this.dependencyIndex.set(dependency.ruleId, []);
      }
      this.dependencyIndex.get(dependency.ruleId)!.push(dependency.id);
    }
    
    for (const evolution of other.getAllRuleEvolutions()) {
      this.ruleEvolutions.set(evolution.id, evolution);
      
      if (!this.evolutionIndex.has(evolution.ruleId)) {
        this.evolutionIndex.set(evolution.ruleId, []);
      }
      this.evolutionIndex.get(evolution.ruleId)!.push(evolution.id);
    }
    
    for (const violation of other.getAllRuleViolations()) {
      this.ruleViolations.set(violation.id, violation);
      
      if (!this.violationIndex.has(violation.ruleId)) {
        this.violationIndex.set(violation.ruleId, []);
      }
      this.violationIndex.get(violation.ruleId)!.push(violation.id);
      
      if (!this.severityIndex.has(violation.severity)) {
        this.severityIndex.set(violation.severity, []);
      }
      this.severityIndex.get(violation.severity)!.push(violation.id);
    }
  }

  /**
   * Clear all provenance
   */
  clear(): void {
    this.ruleProvenance.clear();
    this.ruleIndex.clear();
    this.hashIndex.clear();
    this.ruleDependencies.clear();
    this.dependencyIndex.clear();
    this.ruleEvolutions.clear();
    this.evolutionIndex.clear();
    this.ruleViolations.clear();
    this.violationIndex.clear();
    this.severityIndex.clear();
  }

  /**
   * Generate provenance ID
   */
  private generateProvenanceId(ruleId: SymbolID): SymbolID {
    return `provenance:${ruleId}`;
  }

  /**
   * Generate dependency ID
   */
  private generateDependencyId(ruleId: SymbolID, dependsOn: SymbolID): SymbolID {
    return `dependency:${ruleId}:${dependsOn}`;
  }

  /**
   * Generate evolution ID
   */
  private generateEvolutionId(ruleId: SymbolID, version: string): SymbolID {
    return `evolution:${ruleId}:${version}`;
  }

  /**
   * Generate violation ID
   */
  private generateViolationId(ruleId: SymbolID, target: SymbolID): SymbolID {
    return `violation:${ruleId}:${target}:${Date.now()}`;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalProvenance: number;
    totalDependencies: number;
    totalEvolutions: number;
    totalViolations: number;
    bySeverity: Record<Severity, number>;
    byViolationType: Record<ViolationType, number>;
    averageConfidence: number;
  } {
    const bySeverity: Record<Severity, number> = {} as any;
    const byViolationType: Record<ViolationType, number> = {} as any;
    let totalConfidence = 0;

    for (const violation of this.ruleViolations.values()) {
      bySeverity[violation.severity] = (bySeverity[violation.severity] || 0) + 1;
      byViolationType[violation.violationType] = (byViolationType[violation.violationType] || 0) + 1;
      totalConfidence += violation.confidence;
    }

    return {
      totalProvenance: this.ruleProvenance.size,
      totalDependencies: this.ruleDependencies.size,
      totalEvolutions: this.ruleEvolutions.size,
      totalViolations: this.ruleViolations.size,
      bySeverity,
      byViolationType,
      averageConfidence: this.ruleViolations.size > 0 ? totalConfidence / this.ruleViolations.size : 0,
    };
  }

  /**
   * Export to JSON
   */
  exportToJSON(): string {
    const data = {
      provenance: this.getAllRuleProvenance(),
      dependencies: this.ruleDependencies,
      evolutions: this.getAllRuleEvolutions(),
      violations: this.getAllRuleViolations(),
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import from JSON
   */
  importFromJSON(json: string): void {
    const data = JSON.parse(json);
    
    for (const provenance of data.provenance) {
      this.ruleProvenance.set(provenance.id, provenance);
      this.ruleIndex.set(provenance.ruleId, provenance.id);
      this.hashIndex.set(provenance.hash, provenance.id);
    }
    
    for (const dependency of data.dependencies) {
      this.ruleDependencies.set(dependency.id, dependency);
      
      if (!this.dependencyIndex.has(dependency.ruleId)) {
        this.dependencyIndex.set(dependency.ruleId, []);
      }
      this.dependencyIndex.get(dependency.ruleId)!.push(dependency.id);
    }
    
    for (const evolution of data.evolutions) {
      this.ruleEvolutions.set(evolution.id, evolution);
      
      if (!this.evolutionIndex.has(evolution.ruleId)) {
        this.evolutionIndex.set(evolution.ruleId, []);
      }
      this.evolutionIndex.get(evolution.ruleId)!.push(evolution.id);
    }
    
    for (const violation of data.violations) {
      this.ruleViolations.set(violation.id, violation);
      
      if (!this.violationIndex.has(violation.ruleId)) {
        this.violationIndex.set(violation.ruleId, []);
      }
      this.violationIndex.get(violation.ruleId)!.push(violation.id);
      
      if (!this.severityIndex.has(violation.severity)) {
        this.severityIndex.set(violation.severity, []);
      }
      this.severityIndex.get(violation.severity)!.push(violation.id);
    }
  }
}
