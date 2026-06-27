/**
 * Evidence Store
 * 
 * Every finding stored independently, JSON only.
 * 
 * This is where the compiler becomes very different from traditional static analyzers.
 * 
 * Instead of:
 *   Violation: Repository writes outside authority
 * 
 * The compiler produces:
 *   Evidence:
 *   - Observed mutation
 *   - Mutation location
 *   - Authority owner
 *   - Capability owner
 *   - Repository owner
 *   - Constitutional paragraph
 *   - Rule hash
 *   - Counter evidence
 *   - Confidence
 *   - Proof chain
 *   - Witnesses
 *   - Alternative explanations
 * 
 * Almost like a legal brief.
 */

import { SymbolID } from '../ir/node-types';

/**
 * Evidence Type
 */
export enum EvidenceType {
  Violation = 'Violation',
  Compliance = 'Compliance',
  Ambiguous = 'Ambiguous',
  Warning = 'Warning',
}

/**
 * Evidence
 */
export interface Evidence {
  id: SymbolID;
  type: EvidenceType;
  timestamp: string;
  
  // Observed behavior
  observedMutation: ObservedMutation;
  mutationLocation: Location;
  
  // Ownership
  authorityOwner: SymbolID;
  capabilityOwner: SymbolID;
  repositoryOwner: SymbolID;
  
  // Constitutional reference
  constitutionalParagraph: ConstitutionalReference;
  ruleHash: string;
  
  // Counter-evidence
  counterEvidence: CounterEvidence[];
  
  // Confidence
  confidence: Confidence;
  
  // Proof chain
  proofChain: ProofChain;
  
  // Witnesses
  witnesses: Witness[];
  
  // Alternative explanations
  alternativeExplanations: AlternativeExplanation[];
}

/**
 * Observed Mutation
 */
export interface ObservedMutation {
  target: SymbolID;
  mutationType: 'field' | 'property' | 'collection' | 'repository' | 'cache' | 'filesystem';
  action: string;
  source: SymbolID;
}

/**
 * Location
 */
export interface Location {
  sourceFile: string;
  sourceLine: number;
  sourceColumn: number;
  astNodeId: SymbolID;
}

/**
 * Constitutional Reference
 */
export interface ConstitutionalReference {
  document: string;
  section: string;
  paragraph: string;
  exactQuote: string;
  ruleId: SymbolID;
}

/**
 * Counter Evidence
 */
export interface CounterEvidence {
  id: SymbolID;
  explanation: string;
  evidence: SymbolID[];
  validity: 'valid' | 'invalid' | 'uncertain';
}

/**
 * Confidence
 */
export interface Confidence {
  score: number; // 0-1
  derivation: string; // How confidence was derived (from evidence, not heuristics)
  evidence: SymbolID[];
}

/**
 * Proof Chain
 */
export interface ProofChain {
  steps: ProofStep[];
  complete: boolean;
}

/**
 * Proof Step
 */
export interface ProofStep {
  id: SymbolID;
  description: string;
  evidence: SymbolID[];
  inference: string;
}

/**
 * Witness
 */
export interface Witness {
  id: SymbolID;
  type: 'symbol' | 'rule' | 'event' | 'mutation' | 'persistence';
  description: string;
  evidence: SymbolID;
}

/**
 * Alternative Explanation
 */
export interface AlternativeExplanation {
  id: SymbolID;
  explanation: string;
  likelihood: number;
  evidence: SymbolID[];
}

/**
 * Evidence Store
 */
export class EvidenceStore {
  private evidence: Map<SymbolID, Evidence> = new Map();
  private evidenceIndex: Map<string, SymbolID[]> = new Map();

  /**
   * Add evidence
   */
  addEvidence(evidence: Evidence): void {
    this.evidence.set(evidence.id, evidence);
    
    // Index by type
    const typeKey = evidence.type;
    if (!this.evidenceIndex.has(typeKey)) {
      this.evidenceIndex.set(typeKey, []);
    }
    this.evidenceIndex.get(typeKey)!.push(evidence.id);
    
    // Index by rule
    const ruleKey = evidence.constitutionalParagraph.ruleId;
    if (!this.evidenceIndex.has(ruleKey)) {
      this.evidenceIndex.set(ruleKey, []);
    }
    this.evidenceIndex.get(ruleKey)!.push(evidence.id);
    
    // Index by authority
    const authorityKey = evidence.authorityOwner;
    if (!this.evidenceIndex.has(authorityKey)) {
      this.evidenceIndex.set(authorityKey, []);
    }
    this.evidenceIndex.get(authorityKey)!.push(evidence.id);
  }

  /**
   * Get evidence by ID
   */
  getEvidence(id: SymbolID): Evidence | undefined {
    return this.evidence.get(id);
  }

  /**
   * Get evidence by type
   */
  getEvidenceByType(type: EvidenceType): Evidence[] {
    const ids = this.evidenceIndex.get(type) || [];
    return ids.map(id => this.evidence.get(id)!).filter(e => e !== undefined);
  }

  /**
   * Get evidence by rule
   */
  getEvidenceByRule(ruleId: SymbolID): Evidence[] {
    const ids = this.evidenceIndex.get(ruleId) || [];
    return ids.map(id => this.evidence.get(id)!).filter(e => e !== undefined);
  }

  /**
   * Get evidence by authority
   */
  getEvidenceByAuthority(authorityId: SymbolID): Evidence[] {
    const ids = this.evidenceIndex.get(authorityId) || [];
    return ids.map(id => this.evidence.get(id)!).filter(e => e !== undefined);
  }

  /**
   * Get evidence by target
   */
  getEvidenceByTarget(targetId: SymbolID): Evidence[] {
    const results: Evidence[] = [];
    
    for (const evidence of this.evidence.values()) {
      if (evidence.observedMutation.target === targetId) {
        results.push(evidence);
      }
    }
    
    return results;
  }

  /**
   * Get violations
   */
  getViolations(): Evidence[] {
    return this.getEvidenceByType(EvidenceType.Violation);
  }

  /**
   * Get compliance evidence
   */
  getCompliance(): Evidence[] {
    return this.getEvidenceByType(EvidenceType.Compliance);
  }

  /**
   * Get ambiguous evidence
   */
  getAmbiguous(): Evidence[] {
    return this.getEvidenceByType(EvidenceType.Ambiguous);
  }

  /**
   * Get warnings
   */
  getWarnings(): Evidence[] {
    return this.getEvidenceByType(EvidenceType.Warning);
  }

  /**
   * Get all evidence
   */
  getAllEvidence(): Evidence[] {
    return Array.from(this.evidence.values());
  }

  /**
   * Merge evidence from another store
   */
  merge(other: EvidenceStore): void {
    for (const evidence of other.getAllEvidence()) {
      this.addEvidence(evidence);
    }
  }

  /**
   * Clear all evidence
   */
  clear(): void {
    this.evidence.clear();
    this.evidenceIndex.clear();
  }

  /**
   * Export to JSON
   */
  exportToJSON(): string {
    const evidence = this.getAllEvidence();
    return JSON.stringify(evidence, null, 2);
  }

  /**
   * Import from JSON
   */
  importFromJSON(json: string): void {
    const evidence: Evidence[] = JSON.parse(json);
    for (const e of evidence) {
      this.addEvidence(e);
    }
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalEvidence: number;
    byType: Record<EvidenceType, number>;
    averageConfidence: number;
    withCounterEvidence: number;
  } {
    const byType: Record<EvidenceType, number> = {} as any;
    let totalConfidence = 0;
    let withCounterEvidence = 0;

    for (const evidence of this.evidence.values()) {
      byType[evidence.type] = (byType[evidence.type] || 0) + 1;
      totalConfidence += evidence.confidence.score;
      if (evidence.counterEvidence.length > 0) {
        withCounterEvidence++;
      }
    }

    return {
      totalEvidence: this.evidence.size,
      byType,
      averageConfidence: this.evidence.size > 0 ? totalConfidence / this.evidence.size : 0,
      withCounterEvidence,
    };
  }

  /**
   * Generate legal brief
   */
  generateLegalBrief(): LegalBrief {
    const violations = this.getViolations();
    const compliance = this.getCompliance();
    const ambiguous = this.getAmbiguous();
    
    return {
      summary: {
        totalViolations: violations.length,
        totalCompliance: compliance.length,
        totalAmbiguous: ambiguous.length,
        averageConfidence: this.getStatistics().averageConfidence,
      },
      violations: violations.map(v => this.formatEvidence(v)),
      compliance: compliance.map(c => this.formatEvidence(c)),
      ambiguous: ambiguous.map(a => this.formatEvidence(a)),
    };
  }

  /**
   * Format evidence for legal brief
   */
  private formatEvidence(evidence: Evidence): FormattedEvidence {
    return {
      id: evidence.id,
      type: evidence.type,
      mutation: evidence.observedMutation,
      location: evidence.mutationLocation,
      authority: evidence.authorityOwner,
      constitutionalReference: evidence.constitutionalParagraph,
      confidence: evidence.confidence.score,
      counterEvidence: evidence.counterEvidence.length,
    };
  }
}

/**
 * Legal Brief
 */
export interface LegalBrief {
  summary: {
    totalViolations: number;
    totalCompliance: number;
    totalAmbiguous: number;
    averageConfidence: number;
  };
  violations: FormattedEvidence[];
  compliance: FormattedEvidence[];
  ambiguous: FormattedEvidence[];
}

/**
 * Formatted Evidence
 */
export interface FormattedEvidence {
  id: SymbolID;
  type: EvidenceType;
  mutation: ObservedMutation;
  location: Location;
  authority: SymbolID;
  constitutionalReference: ConstitutionalReference;
  confidence: number;
  counterEvidence: number;
}
