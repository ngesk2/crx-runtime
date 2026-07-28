/**
 * Rule Coverage
 * 
 * Like test coverage.
 * 
 * But for constitutional rules.
 * 
 * "Your architecture is 94.3% covered by constitutional rules."
 * 
 * "Rule Ownership-001 covers 87% of repositories."
 * 
 * "Rule Capability-003 covers 0% of events."
 */

import { SymbolID } from '../ir/node-types';
import { SemanticIRNode } from '../lowering/semantic-lowerer';
import { CanonicalSymbol } from '../lowering/semantic-lowerer';
import { ConstitutionalRule, RuleType } from '../registry/constitutional-registry-loader';

/**
 * Coverage Metric
 */
export interface CoverageMetric {
  ruleId: SymbolID;
  ruleName: string;
  ruleType: RuleType;
  totalNodes: number;
  coveredNodes: number;
  coverage: number;
  uncoveredNodes: SymbolID[];
}

/**
 * Architecture Coverage
 */
export interface ArchitectureCoverage {
  totalRules: number;
  totalNodes: number;
  overallCoverage: number;
  ruleMetrics: CoverageMetric[];
  byRuleType: Record<RuleType, number>;
  byNodeType: Map<string, number>;
}

/**
 * Rule Coverage Engine
 */
export class RuleCoverageEngine {
  private coverageResults: Map<string, ArchitectureCoverage> = new Map();

  /**
   * Compute rule coverage
   */
  computeCoverage(
    rules: Map<SymbolID, ConstitutionalRule>,
    semanticIR: Map<SymbolID, SemanticIRNode>,
    canonicalSymbols: Map<SymbolID, CanonicalSymbol>
  ): ArchitectureCoverage {
    const ruleMetrics: CoverageMetric[] = [];
    const byRuleType: Record<RuleType, number> = {} as any;
    const byNodeType = new Map<string, number>();

    // Count nodes by type
    for (const node of semanticIR.values()) {
      byNodeType.set(node.type, (byNodeType.get(node.type) || 0) + 1);
    }

    // Compute coverage for each rule
    for (const rule of rules.values()) {
      const metric = this.computeRuleCoverage(rule, semanticIR, canonicalSymbols);
      ruleMetrics.push(metric);

      byRuleType[rule.ruleType] = (byRuleType[rule.ruleType] || 0) + metric.coverage;
    }

    // Compute overall coverage
    const totalNodes = semanticIR.size;
    const totalCoverage = ruleMetrics.reduce((sum, m) => sum + m.coverage, 0);
    const overallCoverage = rules.size > 0 ? totalCoverage / rules.size : 0;

    const coverage: ArchitectureCoverage = {
      totalRules: rules.size,
      totalNodes,
      overallCoverage,
      ruleMetrics,
      byRuleType,
      byNodeType,
    };

    const coverageKey = `coverage-${Date.now()}`;
    this.coverageResults.set(coverageKey, coverage);

    return coverage;
  }

  /**
   * Compute coverage for a single rule
   */
  private computeRuleCoverage(
    rule: ConstitutionalRule,
    semanticIR: Map<SymbolID, SemanticIRNode>,
    canonicalSymbols: Map<SymbolID, CanonicalSymbol>
  ): CoverageMetric {
    const coveredNodes: SymbolID[] = [];
    const uncoveredNodes: SymbolID[] = [];

    // Determine which nodes are covered by this rule
    for (const [nodeId, node] of semanticIR) {
      if (this.isNodeCoveredByRule(node, rule, canonicalSymbols)) {
        coveredNodes.push(nodeId);
      } else {
        uncoveredNodes.push(nodeId);
      }
    }

    const totalNodes = semanticIR.size;
    const coverage = totalNodes > 0 ? coveredNodes.length / totalNodes : 0;

    return {
      ruleId: rule.id,
      ruleName: `${rule.ruleType}-${rule.id.substring(0, 8)}`,
      ruleType: rule.ruleType,
      totalNodes,
      coveredNodes: coveredNodes.length,
      coverage,
      uncoveredNodes,
    };
  }

  /**
   * Check if a node is covered by a rule
   */
  private isNodeCoveredByRule(
    node: SemanticIRNode,
    rule: ConstitutionalRule,
    canonicalSymbols: Map<SymbolID, CanonicalSymbol>
  ): boolean {
    switch (rule.ruleType) {
      case RuleType.Ownership:
        return this.checkOwnershipCoverage(node, rule);
      case RuleType.Capability:
        return this.checkCapabilityCoverage(node, rule);
      case RuleType.Persistence:
        return this.checkPersistenceCoverage(node, rule);
      case RuleType.Trust:
        return this.checkTrustCoverage(node, rule);
      case RuleType.Identity:
        return this.checkIdentityCoverage(node, rule);
      case RuleType.Event:
        return this.checkEventCoverage(node, rule);
      case RuleType.Mutation:
        return this.checkMutationCoverage(node, rule);
      case RuleType.Construction:
        return this.checkConstructionCoverage(node, rule);
      case RuleType.Boundary:
        return this.checkBoundaryCoverage(node, rule);
      case RuleType.Lifecycle:
        return this.checkLifecycleCoverage(node, rule);
      default:
        return false;
    }
  }

  /**
   * Check ownership coverage
   */
  private checkOwnershipCoverage(node: SemanticIRNode, rule: ConstitutionalRule): boolean {
    return node.authorityRequired !== undefined;
  }

  /**
   * Check capability coverage
   */
  private checkCapabilityCoverage(node: SemanticIRNode, rule: ConstitutionalRule): boolean {
    return node.capabilitiesConsumed.length > 0 || node.capabilitiesProduced.length > 0;
  }

  /**
   * Check persistence coverage
   */
  private checkPersistenceCoverage(node: SemanticIRNode, rule: ConstitutionalRule): boolean {
    return node.persistenceActions.length > 0;
  }

  /**
   * Check trust coverage
   */
  private checkTrustCoverage(node: SemanticIRNode, rule: ConstitutionalRule): boolean {
    return node.trustTransitions.length > 0;
  }

  /**
   * Check identity coverage
   */
  private checkIdentityCoverage(node: SemanticIRNode, rule: ConstitutionalRule): boolean {
    // TODO: Implement identity coverage check
    return false;
  }

  /**
   * Check event coverage
   */
  private checkEventCoverage(node: SemanticIRNode, rule: ConstitutionalRule): boolean {
    return node.eventsEmitted.length > 0;
  }

  /**
   * Check mutation coverage
   */
  private checkMutationCoverage(node: SemanticIRNode, rule: ConstitutionalRule): boolean {
    return node.stateMutations.length > 0;
  }

  /**
   * Check construction coverage
   */
  private checkConstructionCoverage(node: SemanticIRNode, rule: ConstitutionalRule): boolean {
    // TODO: Implement construction coverage check
    return false;
  }

  /**
   * Check boundary coverage
   */
  private checkBoundaryCoverage(node: SemanticIRNode, rule: ConstitutionalRule): boolean {
    // TODO: Implement boundary coverage check
    return false;
  }

  /**
   * Check lifecycle coverage
   */
  private checkLifecycleCoverage(node: SemanticIRNode, rule: ConstitutionalRule): boolean {
    // TODO: Implement lifecycle coverage check
    return false;
  }

  /**
   * Get coverage result by key
   */
  getCoverageResult(key: string): ArchitectureCoverage | undefined {
    return this.coverageResults.get(key);
  }

  /**
   * Get latest coverage result
   */
  getLatestCoverageResult(): ArchitectureCoverage | undefined {
    const results = Array.from(this.coverageResults.values());
    if (results.length === 0) return undefined;

    return results[results.length - 1];
  }

  /**
   * Get all coverage results
   */
  getAllCoverageResults(): ArchitectureCoverage[] {
    return Array.from(this.coverageResults.values());
  }

  /**
   * Get rule metric by rule ID
   */
  getRuleMetric(ruleId: SymbolID): CoverageMetric | undefined {
    for (const coverage of this.coverageResults.values()) {
      const metric = coverage.ruleMetrics.find(m => m.ruleId === ruleId);
      if (metric) return metric;
    }
    return undefined;
  }

  /**
   * Get low coverage rules (below threshold)
   */
  getLowCoverageRules(threshold: number = 0.5): CoverageMetric[] {
    const latest = this.getLatestCoverageResult();
    if (!latest) return [];

    return latest.ruleMetrics.filter(m => m.coverage < threshold);
  }

  /**
   * Get high coverage rules (above threshold)
   */
  getHighCoverageRules(threshold: number = 0.9): CoverageMetric[] {
    const latest = this.getLatestCoverageResult();
    if (!latest) return [];

    return latest.ruleMetrics.filter(m => m.coverage >= threshold);
  }

  /**
   * Get uncovered nodes for a rule
   */
  getUncoveredNodes(ruleId: SymbolID): SymbolID[] {
    const metric = this.getRuleMetric(ruleId);
    if (!metric) return [];

    return metric.uncoveredNodes;
  }

  /**
   * Clear all coverage results
   */
  clear(): void {
    this.coverageResults.clear();
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalCoverageResults: number;
    averageOverallCoverage: number;
    averageRuleCoverage: number;
    lowCoverageRules: number;
    highCoverageRules: number;
  } {
    const results = this.getAllCoverageResults();

    if (results.length === 0) {
      return {
        totalCoverageResults: 0,
        averageOverallCoverage: 0,
        averageRuleCoverage: 0,
        lowCoverageRules: 0,
        highCoverageRules: 0,
      };
    }

    const totalOverallCoverage = results.reduce((sum, r) => sum + r.overallCoverage, 0);
    const averageOverallCoverage = totalOverallCoverage / results.length;

    let totalRuleCoverage = 0;
    let totalRules = 0;
    for (const result of results) {
      totalRuleCoverage += result.ruleMetrics.reduce((sum, m) => sum + m.coverage, 0);
      totalRules += result.ruleMetrics.length;
    }
    const averageRuleCoverage = totalRules > 0 ? totalRuleCoverage / totalRules : 0;

    const latest = this.getLatestCoverageResult();
    const lowCoverageRules = latest ? this.getLowCoverageRules().length : 0;
    const highCoverageRules = latest ? this.getHighCoverageRules().length : 0;

    return {
      totalCoverageResults: results.length,
      averageOverallCoverage,
      averageRuleCoverage,
      lowCoverageRules,
      highCoverageRules,
    };
  }

  /**
   * Export to JSON
   */
  exportToJSON(): string {
    return JSON.stringify(this.getAllCoverageResults(), null, 2);
  }

  /**
   * Import from JSON
   */
  importFromJSON(json: string): void {
    const results: ArchitectureCoverage[] = JSON.parse(json);
    
    let index = 0;
    for (const result of results) {
      const key = `coverage-imported-${index++}`;
      this.coverageResults.set(key, result);
    }
  }
}
