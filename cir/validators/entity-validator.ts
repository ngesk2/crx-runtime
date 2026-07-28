/**
 * Entity Validator
 * Validates CIR Entity objects.
 */

import { Entity } from '../entity';

export class EntityValidator {
  validate(entity: Entity): void {
    if (entity.type !== 'Entity') {
      throw new Error('Entity must have type "Entity"');
    }
    
    if (!entity.id || typeof entity.id !== 'string') {
      throw new Error('Entity must have a valid id');
    }
    
    if (!entity.kind || typeof entity.kind !== 'string') {
      throw new Error('Entity must have a valid kind');
    }
    
    if (!entity.properties || typeof entity.properties !== 'object') {
      throw new Error('Entity must have valid properties');
    }
    
    if (!Array.isArray(entity.relationships)) {
      throw new Error('Entity must have a relationships array');
    }
  }
}
