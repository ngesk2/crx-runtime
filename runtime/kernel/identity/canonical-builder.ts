/**
 * Canonical Builder
 * Builder pattern for creating canonical objects with validation.
 */

import { CanonicalObject } from './canonical-object';
import { CanonicalID, formatCanonicalID } from './canonical-id';
import { CanonicalValidator } from './canonical-validator';
import { CanonicalInvariants } from './canonical-invariants';

export class CanonicalBuilder<T extends CanonicalObject> {
  private validator: CanonicalValidator;
  private invariants: CanonicalInvariants;
  
  constructor() {
    this.validator = new CanonicalValidator();
    this.invariants = new CanonicalInvariants();
  }
  
  buildCanonicalID(
    authority: string,
    namespace: string,
    kind: string,
    version: string,
    hash: string
  ): CanonicalID {
    const id: CanonicalID = {
      authority,
      namespace,
      kind,
      version,
      hash,
    };
    
    this.validator.validateCanonicalID(id);
    return id;
  }
  
  buildCanonicalObject(
    identity: any,
    metadata: any,
    provenance: any,
    lifecycle: any,
    payload: any
  ): T {
    const object: any = {
      identity,
      metadata,
      provenance,
      lifecycle,
      payload,
    };
    
    this.validator.validateCanonicalObject(object);
    this.invariants.enforceImmutability(object);
    
    return Object.freeze(object) as T;
  }
  
  canonicalizeID(id: string): CanonicalID {
    return this.validator.canonicalizeID(id);
  }
}
