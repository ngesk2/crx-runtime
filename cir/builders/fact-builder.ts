/**
 * Fact Builder
 * Builder for creating CIR Fact objects with validation.
 */

import { Fact } from '../fact';
import { FactValidator } from '../validators/fact-validator';

export class FactBuilder {
  private validator: FactValidator;
  
  constructor() {
    this.validator = new FactValidator();
  }
  
  buildFact(
    id: string,
    kind: string,
    subject: string,
    predicate: string,
    object: string,
    evidence: readonly string[]
  ): Fact {
    const fact: Fact = {
      type: 'Fact',
      id,
      kind,
      subject,
      predicate,
      object,
      evidence,
    };
    
    this.validator.validate(fact);
    return Object.freeze(fact);
  }
  
  withEvidence(fact: Fact, evidenceId: string): Fact {
    return this.buildFact(
      fact.id,
      fact.kind,
      fact.subject,
      fact.predicate,
      fact.object,
      [...fact.evidence, evidenceId] as readonly string[]
    );
  }
}
