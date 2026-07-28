/**
 * Relationship Builder
 * Builder for creating CIR Relationship objects with validation.
 */

import { Relationship } from '../relationship';
import { RelationshipValidator } from '../validators/relationship-validator';

export class RelationshipBuilder {
  private validator: RelationshipValidator;
  
  constructor() {
    this.validator = new RelationshipValidator();
  }
  
  buildRelationship(
    id: string,
    kind: string,
    source: string,
    target: string,
    properties: Record<string, unknown>
  ): Relationship {
    const relationship: Relationship = {
      type: 'Relationship',
      id,
      kind,
      source,
      target,
      properties,
    };
    
    this.validator.validate(relationship);
    return Object.freeze(relationship);
  }
  
  withProperties(relationship: Relationship, properties: Record<string, unknown>): Relationship {
    return this.buildRelationship(
      relationship.id,
      relationship.kind,
      relationship.source,
      relationship.target,
      { ...relationship.properties, ...properties }
    );
  }
}
