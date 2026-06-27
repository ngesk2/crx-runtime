/**
 * Fact Validator
 * Validates CIR Fact objects.
 */

import { Fact } from '../fact';

export class FactValidator {
  validate(fact: Fact): void {
    if (fact.type !== 'Fact') {
      throw new Error('Fact must have type "Fact"');
    }
    
    if (!fact.id || typeof fact.id !== 'string') {
      throw new Error('Fact must have a valid id');
    }
    
    if (!fact.kind || typeof fact.kind !== 'string') {
      throw new Error('Fact must have a valid kind');
    }
    
    if (!fact.subject || typeof fact.subject !== 'string') {
      throw new Error('Fact must have a valid subject');
    }
    
    if (!fact.predicate || typeof fact.predicate !== 'string') {
      throw new Error('Fact must have a valid predicate');
    }
    
    if (!fact.object || typeof fact.object !== 'string') {
      throw new Error('Fact must have a valid object');
    }
    
    if (!Array.isArray(fact.evidence)) {
      throw new Error('Fact must have an evidence array');
    }
    
    if (fact.evidence.length === 0) {
      throw new Error('Fact must have at least one evidence reference');
    }
  }
}
