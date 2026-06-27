/**
 * Canonical Validator
 * Validates canonical objects and enforces constitutional rules.
 */

import { CanonicalID, parseCanonicalID, formatCanonicalID } from './canonical-id';

export class CanonicalValidator {
  validateCanonicalID(id: CanonicalID): void {
    if (!id.authority || typeof id.authority !== 'string') {
      throw new Error('Canonical ID must have a valid authority');
    }
    if (!id.namespace || typeof id.namespace !== 'string') {
      throw new Error('Canonical ID must have a valid namespace');
    }
    if (!id.kind || typeof id.kind !== 'string') {
      throw new Error('Canonical ID must have a valid kind');
    }
    if (!id.version || typeof id.version !== 'string') {
      throw new Error('Canonical ID must have a valid version');
    }
    if (!id.hash || typeof id.hash !== 'string') {
      throw new Error('Canonical ID must have a valid hash');
    }
  }
  
  canonicalizeID(id: string): CanonicalID {
    try {
      return parseCanonicalID(id);
    } catch (error) {
      throw new Error(`Invalid canonical ID format: ${id}`);
    }
  }
  
  validateCanonicalObject(object: any): void {
    if (!object.identity) {
      throw new Error('Canonical object must have identity');
    }
    if (!object.metadata) {
      throw new Error('Canonical object must have metadata');
    }
    if (!object.provenance) {
      throw new Error('Canonical object must have provenance');
    }
    if (!object.lifecycle) {
      throw new Error('Canonical object must have lifecycle');
    }
    if (!object.payload) {
      throw new Error('Canonical object must have payload');
    }
    
    this.validateCanonicalID(object.identity.id);
  }
  
  validatePayloadStructure(payload: any, requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (!(field in payload)) {
        throw new Error(`Payload must contain required field: ${field}`);
      }
    }
  }
}
