/**
 * Entity Builder
 * Builder for creating CIR Entity objects with validation.
 */

import { Entity } from '../entity';
import { EntityValidator } from '../validators/entity-validator';

export class EntityBuilder {
  private validator: EntityValidator;
  
  constructor() {
    this.validator = new EntityValidator();
  }
  
  buildEntity(
    id: string,
    kind: string,
    properties: Record<string, unknown>,
    relationships: readonly string[]
  ): Entity {
    const entity: Entity = {
      type: 'Entity',
      id,
      kind,
      properties,
      relationships,
    };
    
    this.validator.validate(entity);
    return Object.freeze(entity);
  }
  
  withProperties(entity: Entity, properties: Record<string, unknown>): Entity {
    return this.buildEntity(
      entity.id,
      entity.kind,
      { ...entity.properties, ...properties },
      entity.relationships
    );
  }
  
  withRelationship(entity: Entity, relationshipId: string): Entity {
    return this.buildEntity(
      entity.id,
      entity.kind,
      entity.properties,
      [...entity.relationships, relationshipId] as readonly string[]
    );
  }
}
