/**
 * Relationship Validator
 * Validates CIR Relationship objects.
 */

import { Relationship } from '../relationship';

export class RelationshipValidator {
  validate(relationship: Relationship): void {
    if (relationship.type !== 'Relationship') {
      throw new Error('Relationship must have type "Relationship"');
    }
    
    if (!relationship.id || typeof relationship.id !== 'string') {
      throw new Error('Relationship must have a valid id');
    }
    
    if (!relationship.kind || typeof relationship.kind !== 'string') {
      throw new Error('Relationship must have a valid kind');
    }
    
    if (!relationship.source || typeof relationship.source !== 'string') {
      throw new Error('Relationship must have a valid source');
    }
    
    if (!relationship.target || typeof relationship.target !== 'string') {
      throw new Error('Relationship must have a valid target');
    }
    
    if (!relationship.properties || typeof relationship.properties !== 'object') {
      throw new Error('Relationship must have valid properties');
    }
  }
}
