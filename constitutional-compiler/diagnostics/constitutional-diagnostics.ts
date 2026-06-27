/**
 * Constitutional Diagnostics
 * 
 * Don't output:
 * Error 1042
 * 
 * Output:
 * 
 * Violation
 * Rule: Ownership-001
 * Document: Architecture.md
 * Section 4.3
 * Evidence: Repository<User> writes Projection<Order>
 * Counter evidence: None
 * Confidence: 99.1%
 * Suggested repair: Move persistence into UserRepository.
 * 
 * Legal brief. Not compiler error.
 */

import { SymbolID } from '../ir/node-types';
import { Finding } from '../rules/rule-executor';
import { ConstitutionalRule } from '../registry/constitutional-registry-loader';
import { Evidence } from '../evidence/evidence-store';

/**
 * Diagnostic Severity
 */
export enum DiagnosticSeverity {
  Critical = 'Critical',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
  Info = 'Info',
}

/**
 * Diagnostic Type
 */
export enum DiagnosticType {
  Violation = 'Violation',
  Compliance = 'Compliance',
  Warning = 'Warning',
  Suggestion = 'Suggestion',
}

/**
 * Diagnostic
 */
export interface Diagnostic {
  id: SymbolID;
  type: DiagnosticType;
  severity: DiagnosticSeverity;
  title: string;
  message: string;
  ruleId: SymbolID;
  ruleName: string;
  document: string;
  section: string;
  paragraph: string;
  exactQuote: string;
  evidence: DiagnosticEvidence;
  counterEvidence: DiagnosticCounterEvidence;
  confidence: number;
  suggestedRepair: string;
  location: DiagnosticLocation;
  timestamp: string;
}

/**
 * Diagnostic Evidence
 */
export interface DiagnosticEvidence {
  symbol: SymbolID;
  symbolType: string;
  action: string;
  target: SymbolID;
  description: string;
}

/**
 * Diagnostic Counter Evidence
 */
export interface DiagnosticCounterEvidence {
  exists: boolean;
  description: string;
  alternativeExplanation: string;
}

/**
 * Diagnostic Location
 */
export interface DiagnosticLocation {
  sourceFile: string;
  sourceLine: number;
  sourceColumn: number;
  astNodeId: SymbolID;
}

/**
 * Legal Brief
 */
export interface LegalBrief {
  violation: Diagnostic;
  constitutionalReference: {
    document: string;
    section: string;
    paragraph: string;
    exactQuote: string;
    ruleId: SymbolID;
  };
  evidenceChain: Evidence[];
  proofSteps: string[];
  witnesses: SymbolID[];
  conclusion: string;
}

/**
 * Constitutional Diagnostics Engine
 */
export class ConstitutionalDiagnosticsEngine {
  private diagnostics: Map<SymbolID, Diagnostic> = new Map();
  private legalBriefs: Map<SymbolID, LegalBrief> = new Map();

  /**
   * Generate diagnostic from finding
   */
  generateDiagnostic(
    finding: Finding,
    rule: ConstitutionalRule,
    evidence: Evidence[]
  ): Diagnostic {
    const id = `diagnostic-${finding.id}`;
    const severity = this.mapSeverity(finding.severity);
    const type = this.mapType(finding.type);
    const diagnosticEvidence = this.extractDiagnosticEvidence(evidence);
    const counterEvidence = this.extractCounterEvidence(finding.counterEvidence);
    const location = this.extractLocation(evidence);

    const diagnostic: Diagnostic = {
      id,
      type,
      severity,
      title: this.generateTitle(finding, rule),
      message: finding.explanation,
      ruleId: rule.id,
      ruleName: `${rule.ruleType}-${rule.id.substring(0, 8)}`,
      document: rule.document,
      section: rule.section,
      paragraph: rule.paragraph,
      exactQuote: rule.exactQuote,
      evidence: diagnosticEvidence,
      counterEvidence,
      confidence: finding.confidence,
      suggestedRepair: finding.suggestedRepair || 'Review constitutional requirements',
      location,
      timestamp: finding.timestamp,
    };

    this.diagnostics.set(id, diagnostic);
    return diagnostic;
  }

  /**
   * Generate legal brief from diagnostic
   */
  generateLegalBrief(
    diagnostic: Diagnostic,
    evidenceChain: Evidence[],
    proofSteps: string[],
    witnesses: SymbolID[]
  ): LegalBrief {
    const brief: LegalBrief = {
      violation: diagnostic,
      constitutionalReference: {
        document: diagnostic.document,
        section: diagnostic.section,
        paragraph: diagnostic.paragraph,
        exactQuote: diagnostic.exactQuote,
        ruleId: diagnostic.ruleId,
      },
      evidenceChain,
      proofSteps,
      witnesses,
      conclusion: this.generateConclusion(diagnostic),
    };

    this.legalBriefs.set(diagnostic.id, brief);
    return brief;
  }

  /**
   * Map severity
   */
  private mapSeverity(severity: string): DiagnosticSeverity {
    switch (severity) {
      case 'Critical':
        return DiagnosticSeverity.Critical;
      case 'High':
        return DiagnosticSeverity.High;
      case 'Medium':
        return DiagnosticSeverity.Medium;
      case 'Low':
        return DiagnosticSeverity.Low;
      case 'Info':
        return DiagnosticSeverity.Info;
      default:
        return DiagnosticSeverity.Medium;
    }
  }

  /**
   * Map type
   */
  private mapType(type: string): DiagnosticType {
    switch (type) {
      case 'Violation':
        return DiagnosticType.Violation;
      case 'Compliance':
        return DiagnosticType.Compliance;
      case 'Warning':
        return DiagnosticType.Warning;
      default:
        return DiagnosticType.Suggestion;
    }
  }

  /**
   * Generate title
   */
  private generateTitle(finding: Finding, rule: ConstitutionalRule): string {
    const ruleName = `${rule.ruleType}-${rule.id.substring(0, 8)}`;
    if (finding.type === 'Violation') {
      return `Constitutional Violation: ${ruleName}`;
    } else if (finding.type === 'Compliance') {
      return `Constitutional Compliance: ${ruleName}`;
    } else {
      return `Constitutional Warning: ${ruleName}`;
    }
  }

  /**
   * Extract diagnostic evidence
   */
  private extractDiagnosticEvidence(evidence: Evidence[]): DiagnosticEvidence {
    if (evidence.length === 0) {
      return {
        symbol: 'unknown',
        symbolType: 'unknown',
        action: 'unknown',
        target: 'unknown',
        description: 'No evidence available',
      };
    }

    const primaryEvidence = evidence[0];
    return {
      symbol: primaryEvidence.observedMutation.target,
      symbolType: primaryEvidence.observedMutation.mutationType,
      action: primaryEvidence.observedMutation.action,
      target: primaryEvidence.observedMutation.target,
      description: `${primaryEvidence.observedMutation.action} on ${primaryEvidence.observedMutation.target}`,
    };
  }

  /**
   * Extract counter evidence
   */
  private extractCounterEvidence(counterEvidenceIds: SymbolID[]): DiagnosticCounterEvidence {
    if (counterEvidenceIds.length === 0) {
      return {
        exists: false,
        description: 'No counter evidence',
        alternativeExplanation: 'No alternative explanations available',
      };
    }

    return {
      exists: true,
      description: `${counterEvidenceIds.length} counter-evidence items found`,
      alternativeExplanation: 'Alternative explanations exist',
    };
  }

  /**
   * Extract location
   */
  private extractLocation(evidence: Evidence[]): DiagnosticLocation {
    if (evidence.length === 0) {
      return {
        sourceFile: 'unknown',
        sourceLine: 0,
        sourceColumn: 0,
        astNodeId: 'unknown',
      };
    }

    const primaryEvidence = evidence[0];
    return {
      sourceFile: primaryEvidence.mutationLocation.sourceFile,
      sourceLine: primaryEvidence.mutationLocation.sourceLine,
      sourceColumn: primaryEvidence.mutationLocation.sourceColumn,
      astNodeId: primaryEvidence.mutationLocation.astNodeId,
    };
  }

  /**
   * Generate conclusion
   */
  private generateConclusion(diagnostic: Diagnostic): string {
    if (diagnostic.type === DiagnosticType.Violation) {
      return `The architecture violates constitutional rule ${diagnostic.ruleName} (${diagnostic.ruleId}) as defined in ${diagnostic.document} section ${diagnostic.section} paragraph ${diagnostic.paragraph}. The violation has ${diagnostic.confidence * 100}% confidence based on the evidence presented.`;
    } else if (diagnostic.type === DiagnosticType.Compliance) {
      return `The architecture complies with constitutional rule ${diagnostic.ruleName} (${diagnostic.ruleId}) as defined in ${diagnostic.document} section ${diagnostic.section} paragraph ${diagnostic.paragraph}. Compliance has ${diagnostic.confidence * 100}% confidence.`;
    } else {
      return `The architecture may have a constitutional concern regarding ${diagnostic.ruleName} (${diagnostic.ruleId}) as defined in ${diagnostic.document} section ${diagnostic.section} paragraph ${diagnostic.paragraph}. The concern has ${diagnostic.confidence * 100}% confidence.`;
    }
  }

  /**
   * Format diagnostic as text
   */
  formatDiagnosticAsText(diagnostic: Diagnostic): string {
    const lines: string[] = [];

    lines.push(`${diagnostic.type}: ${diagnostic.title}`);
    lines.push('');
    lines.push(`Rule: ${diagnostic.ruleName} (${diagnostic.ruleId})`);
    lines.push(`Document: ${diagnostic.document}`);
    lines.push(`Section: ${diagnostic.section}`);
    lines.push(`Paragraph: ${diagnostic.paragraph}`);
    lines.push('');
    lines.push('Evidence:');
    lines.push(`  Symbol: ${diagnostic.evidence.symbol}`);
    lines.push(`  Type: ${diagnostic.evidence.symbolType}`);
    lines.push(`  Action: ${diagnostic.evidence.action}`);
    lines.push(`  Target: ${diagnostic.evidence.target}`);
    lines.push(`  Description: ${diagnostic.evidence.description}`);
    lines.push('');
    lines.push('Counter Evidence:');
    lines.push(`  Exists: ${diagnostic.counterEvidence.exists}`);
    lines.push(`  Description: ${diagnostic.counterEvidence.description}`);
    lines.push(`  Alternative Explanation: ${diagnostic.counterEvidence.alternativeExplanation}`);
    lines.push('');
    lines.push(`Confidence: ${(diagnostic.confidence * 100).toFixed(1)}%`);
    lines.push('');
    lines.push('Suggested Repair:');
    lines.push(`  ${diagnostic.suggestedRepair}`);
    lines.push('');
    lines.push('Location:');
    lines.push(`  File: ${diagnostic.location.sourceFile}`);
    lines.push(`  Line: ${diagnostic.location.sourceLine}`);
    lines.push(`  Column: ${diagnostic.location.sourceColumn}`);

    return lines.join('\n');
  }

  /**
   * Format legal brief as text
   */
  formatLegalBriefAsText(brief: LegalBrief): string {
    const lines: string[] = [];

    lines.push('=== CONSTITUTIONAL LEGAL BRIEF ===');
    lines.push('');
    lines.push('VIOLATION:');
    lines.push(this.formatDiagnosticAsText(brief.violation));
    lines.push('');
    lines.push('=== CONSTITUTIONAL REFERENCE ===');
    lines.push(`Document: ${brief.constitutionalReference.document}`);
    lines.push(`Section: ${brief.constitutionalReference.section}`);
    lines.push(`Paragraph: ${brief.constitutionalReference.paragraph}`);
    lines.push(`Exact Quote: "${brief.constitutionalReference.exactQuote}"`);
    lines.push(`Rule ID: ${brief.constitutionalReference.ruleId}`);
    lines.push('');
    lines.push('=== EVIDENCE CHAIN ===');
    for (let i = 0; i < brief.evidenceChain.length; i++) {
      lines.push(`${i + 1}. ${brief.evidenceChain[i].type}`);
    }
    lines.push('');
    lines.push('=== PROOF STEPS ===');
    for (let i = 0; i < brief.proofSteps.length; i++) {
      lines.push(`${i + 1}. ${brief.proofSteps[i]}`);
    }
    lines.push('');
    lines.push('=== WITNESSES ===');
    for (const witness of brief.witnesses) {
      lines.push(`- ${witness}`);
    }
    lines.push('');
    lines.push('=== CONCLUSION ===');
    lines.push(brief.conclusion);

    return lines.join('\n');
  }

  /**
   * Get diagnostic by ID
   */
  getDiagnostic(id: SymbolID): Diagnostic | undefined {
    return this.diagnostics.get(id);
  }

  /**
   * Get diagnostics by severity
   */
  getDiagnosticsBySeverity(severity: DiagnosticSeverity): Diagnostic[] {
    return Array.from(this.diagnostics.values()).filter(d => d.severity === severity);
  }

  /**
   * Get diagnostics by type
   */
  getDiagnosticsByType(type: DiagnosticType): Diagnostic[] {
    return Array.from(this.diagnostics.values()).filter(d => d.type === type);
  }

  /**
   * Get violations
   */
  getViolations(): Diagnostic[] {
    return this.getDiagnosticsByType(DiagnosticType.Violation);
  }

  /**
   * Get critical diagnostics
   */
  getCriticalDiagnostics(): Diagnostic[] {
    return this.getDiagnosticsBySeverity(DiagnosticSeverity.Critical);
  }

  /**
   * Get all diagnostics
   */
  getAllDiagnostics(): Diagnostic[] {
    return Array.from(this.diagnostics.values());
  }

  /**
   * Get legal brief by diagnostic ID
   */
  getLegalBrief(diagnosticId: SymbolID): LegalBrief | undefined {
    return this.legalBriefs.get(diagnosticId);
  }

  /**
   * Get all legal briefs
   */
  getAllLegalBriefs(): LegalBrief[] {
    return Array.from(this.legalBriefs.values());
  }

  /**
   * Clear all diagnostics
   */
  clear(): void {
    this.diagnostics.clear();
    this.legalBriefs.clear();
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalDiagnostics: number;
    violations: number;
    compliance: number;
    warnings: number;
    suggestions: number;
    bySeverity: Record<DiagnosticSeverity, number>;
    averageConfidence: number;
  } {
    const bySeverity: Record<DiagnosticSeverity, number> = {} as any;
    let violations = 0;
    let compliance = 0;
    let warnings = 0;
    let suggestions = 0;
    let totalConfidence = 0;

    for (const diagnostic of this.diagnostics.values()) {
      bySeverity[diagnostic.severity] = (bySeverity[diagnostic.severity] || 0) + 1;
      
      switch (diagnostic.type) {
        case DiagnosticType.Violation:
          violations++;
          break;
        case DiagnosticType.Compliance:
          compliance++;
          break;
        case DiagnosticType.Warning:
          warnings++;
          break;
        case DiagnosticType.Suggestion:
          suggestions++;
          break;
      }
      
      totalConfidence += diagnostic.confidence;
    }

    return {
      totalDiagnostics: this.diagnostics.size,
      violations,
      compliance,
      warnings,
      suggestions,
      bySeverity,
      averageConfidence: this.diagnostics.size > 0 ? totalConfidence / this.diagnostics.size : 0,
    };
  }

  /**
   * Export to JSON
   */
  exportToJSON(): string {
    const data = {
      diagnostics: Array.from(this.diagnostics.values()),
      legalBriefs: Array.from(this.legalBriefs.values()),
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import from JSON
   */
  importFromJSON(json: string): void {
    const data = JSON.parse(json);
    
    for (const diagnostic of data.diagnostics) {
      this.diagnostics.set(diagnostic.id, diagnostic);
    }
    
    for (const brief of data.legalBriefs) {
      this.legalBriefs.set(brief.violation.id, brief);
    }
  }
}
