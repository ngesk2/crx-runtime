/**
 * Constitutional Rule Executor
 * 
 * This is the single biggest missing subsystem.
 * 
 * Instead of just loading rules and tracking provenance, this actually executes them.
 * 
 * Think of this like a SAT solver combined with a static analyzer.
 * 
 * For each semantic node:
 * - Evaluate applicable rules
 * - Collect evidence
 * - Collect counter evidence
 * - Score confidence
 * - Emit finding
 */

import { SymbolID } from '../ir/node-types';
import { SemanticIRNode } from '../lowering/semantic-lowerer';
import { CanonicalSymbol } from '../lowering/semantic-lowerer';
import { ConstitutionalRule } from '../registry/constitutional-registry-loader';
import { Evidence, EvidenceType } from '../evidence/evidence-store';
import { OwnershipEngine, OwnershipKind } from '../engines/ownership-engine';
import { CapabilityEngine } from '../engines/capability-engine';
import { CounterEvidenceEngine } from '../engines/counter-evidence-engine';

/**
 * Rule Evaluation Context
 */
export interface RuleEvaluationContext {
  semanticIR: Map<SymbolID, SemanticIRNode>;
  canonicalSymbols: Map<SymbolID, CanonicalSymbol>;
  rules: Map<SymbolID, ConstitutionalRule>;
  ownershipEngine: OwnershipEngine;
  capabilityEngine: CapabilityEngine;
  counterEvidenceEngine: CounterEvidenceEngine;
}

/**
 * Rule Evaluation Result
 */
export interface RuleEvaluationResult {
  ruleId: SymbolID;
  nodeId: SymbolID;
  satisfied: boolean;
  confidence: number;
  evidence: Evidence[];
  counterEvidence: SymbolID[];
  explanation: string;
}

/**
 * Finding
 */
export interface Finding {
  id: SymbolID;
  ruleId: SymbolID;
  nodeId: SymbolID;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  type: 'Violation' | 'Compliance' | 'Warning';
  confidence: number;
  evidence: Evidence[];
  counterEvidence: SymbolID[];
  explanation: string;
  suggestedRepair?: string;
  timestamp: string;
}

/**
 * Constitutional Rule Executor
 */
export class ConstitutionalRuleExecutor {
  private findings: Map<SymbolID, Finding> = new Map();
  private ruleIndex: Map<SymbolID, SymbolID[]> = new Map(); // ruleId -> findings
  private nodeIndex: Map<SymbolID, SymbolID[]> = new Map(); // nodeId -> findings
  private severityIndex: Map<string, SymbolID[]> = new Map(); // severity -> findings

  /**
   * Execute all rules against semantic IR
   */
  async executeRules(
    context: RuleEvaluationContext
  ): Promise<Map<SymbolID, Finding>> {
    const results = new Map<SymbolID, Finding>();

    // For each semantic node
    for (const [nodeId, node] of context.semanticIR) {
      // Evaluate applicable rules
      const applicableRules = this.getApplicableRules(node, context.rules);
      
      for (const rule of applicableRules) {
        const result = await this.evaluateRule(rule, node, context);
        
        if (result) {
          const finding = this.createFinding(result, node, context);
          this.findings.set(finding.id, finding);
          results.set(finding.id, finding);
          
          // Index by rule
          if (!this.ruleIndex.has(rule.id)) {
            this.ruleIndex.set(rule.id, []);
          }
          this.ruleIndex.get(rule.id)!.push(finding.id);
          
          // Index by node
          if (!this.nodeIndex.has(nodeId)) {
            this.nodeIndex.set(nodeId, []);
          }
          this.nodeIndex.get(nodeId)!.push(finding.id);
          
          // Index by severity
          if (!this.severityIndex.has(finding.severity)) {
            this.severityIndex.set(finding.severity, []);
          }
          this.severityIndex.get(finding.severity)!.push(finding.id);
        }
      }
    }

    return results;
  }

  /**
   * Get applicable rules for a node
   */
  private getApplicableRules(
    node: SemanticIRNode,
    rules: Map<SymbolID, ConstitutionalRule>
  ): ConstitutionalRule[] {
    const applicable: ConstitutionalRule[] = [];

    for (const rule of rules.values()) {
      if (this.isRuleApplicable(rule, node)) {
        applicable.push(rule);
      }
    }

    return applicable;
  }

  /**
   * Check if rule is applicable to node
   */
  private isRuleApplicable(rule: ConstitutionalRule, node: SemanticIRNode): boolean {
    // TODO: Implement sophisticated rule applicability checking
    // For now, apply all rules
    return true;
  }

  /**
   * Evaluate a single rule against a node
   */
  private async evaluateRule(
    rule: ConstitutionalRule,
    node: SemanticIRNode,
    context: RuleEvaluationContext
  ): Promise<RuleEvaluationResult | null> {
    // Evaluate rule based on type
    switch (rule.ruleType) {
      case 'Ownership':
        return await this.evaluateOwnershipRule(rule, node, context);
      case 'Capability':
        return await this.evaluateCapabilityRule(rule, node, context);
      case 'Persistence':
        return await this.evaluatePersistenceRule(rule, node, context);
      case 'Trust':
        return await this.evaluateTrustRule(rule, node, context);
      case 'Identity':
        return await this.evaluateIdentityRule(rule, node, context);
      case 'Event':
        return await this.evaluateEventRule(rule, node, context);
      case 'Mutation':
        return await this.evaluateMutationRule(rule, node, context);
      case 'Construction':
        return await this.evaluateConstructionRule(rule, node, context);
      case 'Boundary':
        return await this.evaluateBoundaryRule(rule, node, context);
      case 'Lifecycle':
        return await this.evaluateLifecycleRule(rule, node, context);
      default:
        return null;
    }
  }

  /**
   * Evaluate ownership rule
   */
  private async evaluateOwnershipRule(
    rule: ConstitutionalRule,
    node: SemanticIRNode,
    context: RuleEvaluationContext
  ): Promise<RuleEvaluationResult> {
    const authority = node.authorityRequired;
    const target = node.canonicalSymbol;

    // Check if authority owns the target
    const owns = context.ownershipEngine.hasOwnership(
      authority || target,
      target,
      OwnershipKind.Creation
    );

    const satisfied = owns;
    const confidence = owns ? 1.0 : 0.0;
    const explanation = owns
      ? `Authority ${authority} owns ${target}`
      : `Authority ${authority} does not own ${target}`;

    // Generate counter-evidence
    const counterEvidenceIds: SymbolID[] = [];
    if (!owns) {
      // Attempt to disprove
      const counterEvidence = await context.counterEvidenceEngine.generateCounterEvidence(
        {
          id: `temp-${Date.now()}`,
          type: EvidenceType.Violation,
          timestamp: new Date().toISOString(),
          observedMutation: {
            target,
            mutationType: 'field',
            action: 'creation',
            source: authority || target,
          },
          mutationLocation: {
            sourceFile: 'unknown',
            sourceLine: 0,
            sourceColumn: 0,
            astNodeId: node.id,
          },
          authorityOwner: authority || target,
          capabilityOwner: authority || target,
          repositoryOwner: authority || target,
          constitutionalParagraph: {
            document: rule.document,
            section: rule.section,
            paragraph: rule.paragraph,
            exactQuote: rule.exactQuote,
            ruleId: rule.id,
          },
          ruleHash: rule.hash,
          counterEvidence: [],
          confidence: { score: 0.0, derivation: 'temp', evidence: [] },
          proofChain: { steps: [], complete: false },
          witnesses: [],
          alternativeExplanations: [],
        },
        {
          semanticIR: context.semanticIR,
          canonicalSymbols: context.canonicalSymbols,
          rules: context.rules,
        }
      );
      counterEvidenceIds.push(counterEvidence.id);
    }

    return {
      ruleId: rule.id,
      nodeId: node.id,
      satisfied,
      confidence,
      evidence: [],
      counterEvidence: counterEvidenceIds,
      explanation,
    };
  }

  /**
   * Evaluate capability rule
   */
  private async evaluateCapabilityRule(
    rule: ConstitutionalRule,
    node: SemanticIRNode,
    context: RuleEvaluationContext
  ): Promise<RuleEvaluationResult> {
    const authority = node.authorityRequired || node.canonicalSymbol;
    const requiredCapabilities = node.capabilitiesConsumed;

    let satisfied = true;
    let confidence = 1.0;
    const explanation: string[] = [];

    for (const capability of requiredCapabilities) {
      const hasCapability = context.capabilityEngine.hasCapability(
        authority,
        this.inferCapabilityType(node),
        capability
      );

      if (!hasCapability) {
        satisfied = false;
        confidence *= 0.5;
        explanation.push(`Missing capability: ${capability}`);
      }
    }

    return {
      ruleId: rule.id,
      nodeId: node.id,
      satisfied,
      confidence,
      evidence: [],
      counterEvidence: [],
      explanation: explanation.join('; ') || 'All capabilities satisfied',
    };
  }

  /**
   * Evaluate persistence rule
   */
  private async evaluatePersistenceRule(
    rule: ConstitutionalRule,
    node: SemanticIRNode,
    context: RuleEvaluationContext
  ): Promise<RuleEvaluationResult> {
    const hasPersistence = node.persistenceActions.length > 0;
    const authority = node.authorityRequired || node.canonicalSymbol;

    if (!hasPersistence) {
      return {
        ruleId: rule.id,
        nodeId: node.id,
        satisfied: true,
        confidence: 1.0,
        evidence: [],
        counterEvidence: [],
        explanation: 'No persistence actions to validate',
      };
    }

    // Check if authority owns persistence
    const ownsPersistence = context.ownershipEngine.hasOwnership(
      authority,
      node.canonicalSymbol,
      OwnershipKind.Persistence
    );

    return {
      ruleId: rule.id,
      nodeId: node.id,
      satisfied: ownsPersistence,
      confidence: ownsPersistence ? 1.0 : 0.0,
      evidence: [],
      counterEvidence: [],
      explanation: ownsPersistence
        ? `Authority owns persistence`
        : `Authority does not own persistence`,
    };
  }

  /**
   * Evaluate trust rule
   */
  private async evaluateTrustRule(
    rule: ConstitutionalRule,
    node: SemanticIRNode,
    context: RuleEvaluationContext
  ): Promise<RuleEvaluationResult> {
    // TODO: Implement trust rule evaluation
    return {
      ruleId: rule.id,
      nodeId: node.id,
      satisfied: true,
      confidence: 0.5,
      evidence: [],
      counterEvidence: [],
      explanation: 'Trust rule evaluation not yet implemented',
    };
  }

  /**
   * Evaluate identity rule
   */
  private async evaluateIdentityRule(
    rule: ConstitutionalRule,
    node: SemanticIRNode,
    context: RuleEvaluationContext
  ): Promise<RuleEvaluationResult> {
    // TODO: Implement identity rule evaluation
    return {
      ruleId: rule.id,
      nodeId: node.id,
      satisfied: true,
      confidence: 0.5,
      evidence: [],
      counterEvidence: [],
      explanation: 'Identity rule evaluation not yet implemented',
    };
  }

  /**
   * Evaluate event rule
   */
  private async evaluateEventRule(
    rule: ConstitutionalRule,
    node: SemanticIRNode,
    context: RuleEvaluationContext
  ): Promise<RuleEvaluationResult> {
    const hasEvents = node.eventsEmitted.length > 0;
    const authority = node.authorityRequired || node.canonicalSymbol;

    if (!hasEvents) {
      return {
        ruleId: rule.id,
        nodeId: node.id,
        satisfied: true,
        confidence: 1.0,
        evidence: [],
        counterEvidence: [],
        explanation: 'No events to validate',
      };
    }

    // Check if authority owns events
    const ownsEvents = context.ownershipEngine.hasOwnership(
      authority,
      node.canonicalSymbol,
      OwnershipKind.Creation
    );

    return {
      ruleId: rule.id,
      nodeId: node.id,
      satisfied: ownsEvents,
      confidence: ownsEvents ? 1.0 : 0.0,
      evidence: [],
      counterEvidence: [],
      explanation: ownsEvents ? 'Authority owns events' : 'Authority does not own events',
    };
  }

  /**
   * Evaluate mutation rule
   */
  private async evaluateMutationRule(
    rule: ConstitutionalRule,
    node: SemanticIRNode,
    context: RuleEvaluationContext
  ): Promise<RuleEvaluationResult> {
    const hasMutations = node.stateMutations.length > 0;
    const authority = node.authorityRequired || node.canonicalSymbol;

    if (!hasMutations) {
      return {
        ruleId: rule.id,
        nodeId: node.id,
        satisfied: true,
        confidence: 1.0,
        evidence: [],
        counterEvidence: [],
        explanation: 'No mutations to validate',
      };
    }

    // Check if authority owns mutations
    const ownsMutations = context.ownershipEngine.hasOwnership(
      authority,
      node.canonicalSymbol,
      OwnershipKind.Mutation
    );

    return {
      ruleId: rule.id,
      nodeId: node.id,
      satisfied: ownsMutations,
      confidence: ownsMutations ? 1.0 : 0.0,
      evidence: [],
      counterEvidence: [],
      explanation: ownsMutations ? 'Authority owns mutations' : 'Authority does not own mutations',
    };
  }

  /**
   * Evaluate construction rule
   */
  private async evaluateConstructionRule(
    rule: ConstitutionalRule,
    node: SemanticIRNode,
    context: RuleEvaluationContext
  ): Promise<RuleEvaluationResult> {
    const authority = node.authorityRequired || node.canonicalSymbol;

    // Check if authority owns construction
    const ownsConstruction = context.ownershipEngine.hasOwnership(
      authority,
      node.canonicalSymbol,
      OwnershipKind.Creation
    );

    return {
      ruleId: rule.id,
      nodeId: node.id,
      satisfied: ownsConstruction,
      confidence: ownsConstruction ? 1.0 : 0.0,
      evidence: [],
      counterEvidence: [],
      explanation: ownsConstruction
        ? 'Authority owns construction'
        : 'Authority does not own construction',
    };
  }

  /**
   * Evaluate boundary rule
   */
  private async evaluateBoundaryRule(
    rule: ConstitutionalRule,
    node: SemanticIRNode,
    context: RuleEvaluationContext
  ): Promise<RuleEvaluationResult> {
    // TODO: Implement boundary rule evaluation
    return {
      ruleId: rule.id,
      nodeId: node.id,
      satisfied: true,
      confidence: 0.5,
      evidence: [],
      counterEvidence: [],
      explanation: 'Boundary rule evaluation not yet implemented',
    };
  }

  /**
   * Evaluate lifecycle rule
   */
  private async evaluateLifecycleRule(
    rule: ConstitutionalRule,
    node: SemanticIRNode,
    context: RuleEvaluationContext
  ): Promise<RuleEvaluationResult> {
    // TODO: Implement lifecycle rule evaluation
    return {
      ruleId: rule.id,
      nodeId: node.id,
      satisfied: true,
      confidence: 0.5,
      evidence: [],
      counterEvidence: [],
      explanation: 'Lifecycle rule evaluation not yet implemented',
    };
  }

  /**
   * Infer capability type from node
   */
  private inferCapabilityType(node: SemanticIRNode): any {
    // TODO: Implement capability type inference
    return 'Execute';
  }

  /**
   * Create finding from evaluation result
   */
  private createFinding(
    result: RuleEvaluationResult,
    node: SemanticIRNode,
    context: RuleEvaluationContext
  ): Finding {
    const rule = context.rules.get(result.ruleId);
    const severity = this.computeSeverity(result, rule);
    const type = result.satisfied ? 'Compliance' : 'Violation';
    const suggestedRepair = this.generateSuggestedRepair(result, node, rule);

    return {
      id: `finding-${result.ruleId}-${result.nodeId}-${Date.now()}`,
      ruleId: result.ruleId,
      nodeId: result.nodeId,
      severity,
      type,
      confidence: result.confidence,
      evidence: result.evidence,
      counterEvidence: result.counterEvidence,
      explanation: result.explanation,
      suggestedRepair,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Compute severity from result
   */
  private computeSeverity(
    result: RuleEvaluationResult,
    rule?: ConstitutionalRule
  ): 'Critical' | 'High' | 'Medium' | 'Low' | 'Info' {
    if (result.satisfied) {
      return 'Info';
    }

    if (result.confidence < 0.3) {
      return 'Low';
    } else if (result.confidence < 0.5) {
      return 'Medium';
    } else if (result.confidence < 0.7) {
      return 'High';
    } else {
      return 'Critical';
    }
  }

  /**
   * Generate suggested repair
   */
  private generateSuggestedRepair(
    result: RuleEvaluationResult,
    node: SemanticIRNode,
    rule?: ConstitutionalRule
  ): string | undefined {
    if (result.satisfied) {
      return undefined;
    }

    // Generate repair based on rule type
    if (rule) {
      switch (rule.ruleType) {
        case 'Ownership':
          return `Assign ownership of ${node.canonicalSymbol} to appropriate authority`;
        case 'Capability':
          return `Grant required capabilities to ${node.authorityRequired || node.canonicalSymbol}`;
        case 'Persistence':
          return `Move persistence operations into owning authority`;
        default:
          return `Review ${rule.ruleType} requirements for ${node.canonicalSymbol}`;
      }
    }

    return 'Review constitutional requirements';
  }

  /**
   * Get finding by ID
   */
  getFinding(id: SymbolID): Finding | undefined {
    return this.findings.get(id);
  }

  /**
   * Get findings by rule
   */
  getFindingsByRule(ruleId: SymbolID): Finding[] {
    const ids = this.ruleIndex.get(ruleId) || [];
    return ids.map(id => this.findings.get(id)!).filter(f => f !== undefined);
  }

  /**
   * Get findings by node
   */
  getFindingsByNode(nodeId: SymbolID): Finding[] {
    const ids = this.nodeIndex.get(nodeId) || [];
    return ids.map(id => this.findings.get(id)!).filter(f => f !== undefined);
  }

  /**
   * Get findings by severity
   */
  getFindingsBySeverity(severity: string): Finding[] {
    const ids = this.severityIndex.get(severity) || [];
    return ids.map(id => this.findings.get(id)!).filter(f => f !== undefined);
  }

  /**
   * Get violations
   */
  getViolations(): Finding[] {
    return Array.from(this.findings.values()).filter(f => f.type === 'Violation');
  }

  /**
   * Get compliance findings
   */
  getCompliance(): Finding[] {
    return Array.from(this.findings.values()).filter(f => f.type === 'Compliance');
  }

  /**
   * Get critical findings
   */
  getCriticalFindings(): Finding[] {
    return this.getFindingsBySeverity('Critical');
  }

  /**
   * Get all findings
   */
  getAllFindings(): Finding[] {
    return Array.from(this.findings.values());
  }

  /**
   * Clear all findings
   */
  clear(): void {
    this.findings.clear();
    this.ruleIndex.clear();
    this.nodeIndex.clear();
    this.severityIndex.clear();
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalFindings: number;
    violations: number;
    compliance: number;
    bySeverity: Record<string, number>;
    averageConfidence: number;
  } {
    const bySeverity: Record<string, number> = {} as any;
    let totalConfidence = 0;

    for (const finding of this.findings.values()) {
      bySeverity[finding.severity] = (bySeverity[finding.severity] || 0) + 1;
      totalConfidence += finding.confidence;
    }

    return {
      totalFindings: this.findings.size,
      violations: this.getViolations().length,
      compliance: this.getCompliance().length,
      bySeverity,
      averageConfidence: this.findings.size > 0 ? totalConfidence / this.findings.size : 0,
    };
  }

  /**
   * Export to JSON
   */
  exportToJSON(): string {
    return JSON.stringify(this.getAllFindings(), null, 2);
  }

  /**
   * Import from JSON
   */
  importFromJSON(json: string): void {
    const findings: Finding[] = JSON.parse(json);
    
    for (const finding of findings) {
      this.findings.set(finding.id, finding);
      
      if (!this.ruleIndex.has(finding.ruleId)) {
        this.ruleIndex.set(finding.ruleId, []);
      }
      this.ruleIndex.get(finding.ruleId)!.push(finding.id);
      
      if (!this.nodeIndex.has(finding.nodeId)) {
        this.nodeIndex.set(finding.nodeId, []);
      }
      this.nodeIndex.get(finding.nodeId)!.push(finding.id);
      
      if (!this.severityIndex.has(finding.severity)) {
        this.severityIndex.set(finding.severity, []);
      }
      this.severityIndex.get(finding.severity)!.push(finding.id);
    }
  }
}
