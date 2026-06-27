/**
 * Canonical Invariants
 * Enforces constitutional invariants on canonical objects.
 */

export class CanonicalInvariants {
  enforceImmutability(object: any): void {
    if (typeof object !== 'object' || object === null) {
      return;
    }
    
    Object.freeze(object);
    
    for (const key in object) {
      if (typeof object[key] === 'object' && object[key] !== null) {
        this.enforceImmutability(object[key]);
      }
    }
  }
  
  enforceReadonlyArrays(object: any, readonlyFields: string[]): void {
    for (const field of readonlyFields) {
      if (object[field] && Array.isArray(object[field])) {
        Object.freeze(object[field]);
      }
    }
  }
  
  validateStructuralInvariants(object: any, invariants: Record<string, (value: any) => boolean>): void {
    for (const [field, validator] of Object.entries(invariants)) {
      if (field in object) {
        if (!validator(object[field])) {
          throw new Error(`Structural invariant violated for field: ${field}`);
        }
      }
    }
  }
}
