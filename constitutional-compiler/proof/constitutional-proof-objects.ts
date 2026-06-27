/**
 * Constitutional Proof Objects
 * 
 * This is probably your biggest differentiator.
 * 
 * Every build emits proof.json containing:
 * - Rule
 * - Evidence
 * - Counter Evidence
 * - Confidence
 * - Dependency chain
 * - Git commit
 * - Compiler version
 * - Hashes
 * 
 * This becomes:
 * "prove this architecture is valid."
 * 
 * Not:
 * "trust the compiler."
 */

import { SymbolID } from '../ir/node-types';
import { Finding } from '../rules/rule-executor';
import { ConstitutionalRule } from '../registry/constitutional-registry-loader';
import { Evidence } from '../evidence/evidence-store';
import { Diagnostic } from '../diagnostics/constitutional-diagnostics';
import { LegalBrief } from '../diagnostics/constitutional-diagnostics';

/**
 * Proof Metadata
 */
export interface ProofMetadata {
  proofId: SymbolID;
  timestamp: string;
  gitCommit: string;
  gitTree: string;
  compilerVersion: string;
  registryVersion: string;
  ruleVersion: string;
  semanticIRVersion: string;
  architectureHash: string;
}

/**
 * Proof Rule Reference
 */
export interface ProofRuleReference {
  ruleId: SymbolID;
  document: string;
  section: string;
  paragraph: string;
  exactQuote: string;
  ruleHash: string;
  version: string;
}

/**
 * Proof Evidence
 */
export interface ProofEvidence {
  evidenceId: SymbolID;
  type: string;
  target: SymbolID;
  mutationType: string;
  action: string;
  location: {
    sourceFile: string;
    sourceLine: number;
    sourceColumn: number;
  };
  authorityOwner: SymbolID;
  capabilityOwner: SymbolID;
  repositoryOwner: SymbolID;
  confidence: number;
}

/**
 * Proof Counter Evidence
 */
export interface ProofCounterEvidence {
  counterEvidenceId: SymbolID;
  originalEvidenceId: SymbolID;
  explanation: string;
  validity: string;
  strength: number;
  alternativeExplanation: {
    description: string;
    likelihood: number;
  };
}

/**
 * Proof Dependency Chain
 */
export interface ProofDependencyChain {
  nodeId: SymbolID;
  dependencies: SymbolID[];
  dependents: SymbolID[];
  depth: number;
}

/**
 * Proof Finding
 */
export interface ProofFinding {
  findingId: SymbolID;
  ruleId: SymbolID;
  nodeId: SymbolID;
  severity: string;
  type: string;
  confidence: number;
  satisfied: boolean;
  explanation: string;
  suggestedRepair: string;
}

/**
 * Constitutional Proof
 */
export interface ConstitutionalProof {
  metadata: ProofMetadata;
  ruleReferences: ProofRuleReference[];
  evidence: ProofEvidence[];
  counterEvidence: ProofCounterEvidence[];
  dependencyChains: ProofDependencyChain[];
  findings: ProofFinding[];
  diagnostics: Diagnostic[];
  legalBriefs: LegalBrief[];
  architectureScore: ArchitectureScore;
  conclusion: ProofConclusion;
}

/**
 * Architecture Score
 */
export interface ArchitectureScore {
  overall: number;
  trustScore: number;
  ownershipScore: number;
  capabilityIntegrity: number;
  ruleCoverage: number;
  evidenceConfidence: number;
  unresolvedCounterEvidence: number;
  totalViolations: number;
  totalCompliance: number;
}

/**
 * Proof Conclusion
 */
export interface ProofConclusion {
  valid: boolean;
  confidence: number;
  summary: string;
  recommendations: string[];
}

/**
 * Constitutional Proof Engine
 */
export class ConstitutionalProofEngine {
  private proofs: Map<SymbolID, ConstitutionalProof> = new Map();

  /**
   * Generate constitutional proof
   */
  generateProof(
    findings: Finding[],
    rules: Map<SymbolID, ConstitutionalRule>,
    evidence: Map<SymbolID, Evidence>,
    diagnostics: Diagnostic[],
    legalBriefs: LegalBrief[],
    metadata: ProofMetadata,
    dependencyChains: ProofDependencyChain[]
  ): ConstitutionalProof {
    const ruleReferences = this.extractRuleReferences(rules);
    const proofEvidence = this.extractProofEvidence(evidence);
    const proofCounterEvidence = this.extractProofCounterEvidence(findings);
    const proofFindings = this.extractProofFindings(findings);
    const architectureScore = this.computeArchitectureScore(findings, diagnostics, legalBriefs);
    const conclusion = this.generateConclusion(architectureScore, diagnostics);

    const proof: ConstitutionalProof = {
      metadata,
      ruleReferences,
      evidence: proofEvidence,
      counterEvidence: proofCounterEvidence,
      dependencyChains,
      findings: proofFindings,
      diagnostics,
      legalBriefs,
      architectureScore,
      conclusion,
    };

    this.proofs.set(metadata.proofId, proof);
    return proof;
  }

  /**
   * Extract rule references
   */
  private extractRuleReferences(rules: Map<SymbolID, ConstitutionalRule>): ProofRuleReference[] {
    const references: ProofRuleReference[] = [];

    for (const rule of rules.values()) {
      references.push({
        ruleId: rule.id,
        document: rule.document,
        section: rule.section,
        paragraph: rule.paragraph,
        exactQuote: rule.exactQuote,
        ruleHash: rule.hash,
        version: rule.version,
      });
    }

    return references;
  }

  /**
   * Extract proof evidence
   */
  private extractProofEvidence(evidence: Map<SymbolID, Evidence>): ProofEvidence[] {
    const proofEvidence: ProofEvidence[] = [];

    for (const [id, ev] of evidence) {
      proofEvidence.push({
        evidenceId: id,
        type: ev.type,
        target: ev.observedMutation.target,
        mutationType: ev.observedMutation.mutationType,
        action: ev.observedMutation.action,
        location: {
          sourceFile: ev.mutationLocation.sourceFile,
          sourceLine: ev.mutationLocation.sourceLine,
          sourceColumn: ev.mutationLocation.sourceColumn,
        },
        authorityOwner: ev.authorityOwner,
        capabilityOwner: ev.capabilityOwner,
        repositoryOwner: ev.repositoryOwner,
        confidence: ev.confidence.score,
      });
    }

    return proofEvidence;
  }

  /**
   * Extract proof counter evidence
   */
  private extractProofCounterEvidence(findings: Finding[]): ProofCounterEvidence[] {
    const counterEvidence: ProofCounterEvidence[] = [];

    for (const finding of findings) {
      for (const counterEvidenceId of finding.counterEvidence) {
        counterEvidence.push({
          counterEvidenceId,
          originalEvidenceId: finding.id,
          explanation: 'Counter evidence generated for this finding',
          validity: 'uncertain',
          strength: 0.5,
          alternativeExplanation: {
            description: 'Alternative explanation exists',
            likelihood: 0.5,
          },
        });
      }
    }

    return counterEvidence;
  }

  /**
   * Extract proof findings
   */
  private extractProofFindings(findings: Finding[]): ProofFinding[] {
    const proofFindings: ProofFinding[] = [];

    for (const finding of findings) {
      proofFindings.push({
        findingId: finding.id,
        ruleId: finding.ruleId,
        nodeId: finding.nodeId,
        severity: finding.severity,
        type: finding.type,
        confidence: finding.confidence,
        satisfied: finding.type === 'Compliance',
        explanation: finding.explanation,
        suggestedRepair: finding.suggestedRepair || 'Review constitutional requirements',
      });
    }

    return proofFindings;
  }

  /**
   * Compute architecture score
   */
  private computeArchitectureScore(
    findings: Finding[],
    diagnostics: Diagnostic[],
    legalBriefs: LegalBrief[]
  ): ArchitectureScore {
    const violations = findings.filter(f => f.type === 'Violation');
    const compliance = findings.filter(f => f.type === 'Compliance');
    
    const trustScore = this.computeTrustScore(diagnostics);
    const ownershipScore = this.computeOwnershipScore(diagnostics);
    const capabilityIntegrity = this.computeCapabilityIntegrity(diagnostics);
    const ruleCoverage = this.computeRuleCoverage(findings);
    const evidenceConfidence = this.computeEvidenceConfidence(findings);
    const unresolvedCounterEvidence = findings.filter(f => f.counterEvidence.length > 0).length;

    const overall = (
      trustScore * 0.2 +
      ownershipScore * 0.2 +
      capabilityIntegrity * 0.2 +
      ruleCoverage * 0.2 +
      evidenceConfidence * 0.2
    );

    return {
      overall,
      trustScore,
      ownershipScore,
      capabilityIntegrity,
      ruleCoverage,
      evidenceConfidence,
      unresolvedCounterEvidence,
      totalViolations: violations.length,
      totalCompliance: compliance.length,
    };
  }

  /**
   * Compute trust score
   */
  private computeTrustScore(diagnostics: Diagnostic[]): number {
    const total = diagnostics.length;
    if (total === 0) return 1.0;

    const violations = diagnostics.filter(d => d.type === 'Violation').length;
    return 1.0 - (violations / total);
  }

  /**
   * Compute ownership score
   */
  private computeOwnershipScore(diagnostics: Diagnostic[]): number {
    const ownershipDiagnostics = diagnostics.filter(d => 
      d.message.includes('ownership') || d.message.includes('own')
    );
    
    if (ownershipDiagnostics.length === 0) return 1.0;

    const violations = ownershipDiagnostics.filter(d => d.type === 'Violation').length;
    return 1.0 - (violations / ownershipDiagnostics.length);
  }

  /**
   * Compute capability integrity
   */
  private computeCapabilityIntegrity(diagnostics: Diagnostic[]): number {
    const capabilityDiagnostics = diagnostics.filter(d => 
      d.message.includes('capability') || d.message.includes('Capability')
    );
    
    if (capabilityDiagnostics.length === 0) return 1.0;

    const violations = capabilityDiagnostics.filter(d => d.type === 'Violation').length;
    return 1.0 - (violations / capabilityDiagnostics.length);
  }

  /**
   * Compute rule coverage
   */
  private computeRuleCoverage(findings: Finding[]): number {
    // TODO: Implement actual rule coverage computation
    // For now, return a placeholder
    return 0.95;
  }

  /**
   * Compute evidence confidence
   */
  private computeEvidenceConfidence(findings: Finding[]): number {
    if (findings.length === 0) return 1.0;

    const totalConfidence = findings.reduce((sum, f) => sum + f.confidence, 0);
    return totalConfidence / findings.length;
  }

  /**
   * Generate conclusion
   */
  private generateConclusion(score: ArchitectureScore, diagnostics: Diagnostic[]): ProofConclusion {
    const valid = score.overall >= 0.9 && score.totalViolations === 0;
    const confidence = score.overall;

    let summary: string;
    let recommendations: string[] = [];

    if (valid) {
      summary = `The architecture is constitutionally valid with an overall score of ${(score.overall * 100).toFixed(1)}%. All constitutional requirements are satisfied.`;
      recommendations.push('Architecture is compliant with all constitutional rules.');
    } else {
      summary = `The architecture has constitutional concerns with an overall score of ${(score.overall * 100).toFixed(1)}%. ${score.totalViolations} violations found.`;
      
      if (score.totalViolations > 0) {
        recommendations.push(`Address ${score.totalViolations} constitutional violations.`);
      }
      
      if (score.unresolvedCounterEvidence > 0) {
        recommendations.push(`Review ${score.unresolvedCounterEvidence} unresolved counter-evidence items.`);
      }
      
      if (score.trustScore < 0.9) {
        recommendations.push('Improve trust score by addressing trust-related violations.');
      }
      
      if (score.ownershipScore < 0.9) {
        recommendations.push('Improve ownership score by addressing ownership-related violations.');
      }
      
      if (score.capabilityIntegrity < 0.9) {
        recommendations.push('Improve capability integrity by addressing capability-related violations.');
      }
    }

    return {
      valid,
      confidence,
      summary,
      recommendations,
    };
  }

  /**
   * Get proof by ID
   */
  getProof(proofId: SymbolID): ConstitutionalProof | undefined {
    return this.proofs.get(proofId);
  }

  /**
   * Get latest proof
   */
  getLatestProof(): ConstitutionalProof | undefined {
    const proofs = Array.from(this.proofs.values());
    if (proofs.length === 0) return undefined;

    return proofs.sort((a, b) => 
      new Date(b.metadata.timestamp).getTime() - new Date(a.metadata.timestamp).getTime()
    )[0];
  }

  /**
   * Get all proofs
   */
  getAllProofs(): ConstitutionalProof[] {
    return Array.from(this.proofs.values());
  }

  /**
   * Verify proof
   */
  verifyProof(proof: ConstitutionalProof): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check metadata
    if (!proof.metadata.proofId) {
      errors.push('Missing proof ID');
    }

    if (!proof.metadata.gitCommit) {
      errors.push('Missing git commit');
    }

    if (!proof.metadata.compilerVersion) {
      errors.push('Missing compiler version');
    }

    // Check rule references
    if (proof.ruleReferences.length === 0) {
      errors.push('No rule references found');
    }

    // Check evidence
    if (proof.evidence.length === 0) {
      errors.push('No evidence found');
    }

    // Check conclusion
    if (!proof.conclusion.valid && proof.conclusion.recommendations.length === 0) {
      errors.push('Invalid proof has no recommendations');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Export proof to JSON
   */
  exportProofToJSON(proof: ConstitutionalProof): string {
    return JSON.stringify(proof, null, 2);
  }

  /**
   * Export proof to file
   */
  exportProofToFile(proof: ConstitutionalProof, filePath: string): void {
    const json = this.exportProofToJSON(proof);
    // TODO: Write to file
  }

  /**
   * Import proof from JSON
   */
  importProofFromJSON(json: string): ConstitutionalProof {
    const proof: ConstitutionalProof = JSON.parse(json);
    this.proofs.set(proof.metadata.proofId, proof);
    return proof;
  }

  /**
   * Clear all proofs
   */
  clear(): void {
    this.proofs.clear();
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalProofs: number;
    averageOverallScore: number;
    averageTrustScore: number;
    averageOwnershipScore: number;
    averageCapabilityIntegrity: number;
    totalViolations: number;
    totalCompliance: number;
  } {
    const proofs = this.getAllProofs();
    
    if (proofs.length === 0) {
      return {
        totalProofs: 0,
        averageOverallScore: 0,
        averageTrustScore: 0,
        averageOwnershipScore: 0,
        averageCapabilityIntegrity: 0,
        totalViolations: 0,
        totalCompliance: 0,
      };
    }

    let totalOverallScore = 0;
    let totalTrustScore = 0;
    let totalOwnershipScore = 0;
    let totalCapabilityIntegrity = 0;
    let totalViolations = 0;
    let totalCompliance = 0;

    for (const proof of proofs) {
      totalOverallScore += proof.architectureScore.overall;
      totalTrustScore += proof.architectureScore.trustScore;
      totalOwnershipScore += proof.architectureScore.ownershipScore;
      totalCapabilityIntegrity += proof.architectureScore.capabilityIntegrity;
      totalViolations += proof.architectureScore.totalViolations;
      totalCompliance += proof.architectureScore.totalCompliance;
    }

    return {
      totalProofs: proofs.length,
      averageOverallScore: totalOverallScore / proofs.length,
      averageTrustScore: totalTrustScore / proofs.length,
      averageOwnershipScore: totalOwnershipScore / proofs.length,
      averageCapabilityIntegrity: totalCapabilityIntegrity / proofs.length,
      totalViolations,
      totalCompliance,
    };
  }
}
