/**
 * Stage Contracts
 * Defines the constitutional contracts for compiler stages.
 */

import { CanonicalObject } from '../../runtime/canonical/canonical-object';

export interface StageContract {
  inputFamily: string;
  outputFamily: string;
  allowedInputFamilies: string[];
  allowedOutputFamilies: string[];
  requiredInputFields: string[];
  requiredOutputFields: string[];
  invariants: Array<(input: CanonicalObject, output: CanonicalObject) => boolean>;
}

export class StageContractValidator {
  validateInput(input: CanonicalObject, contract: StageContract): boolean {
    if (!contract.allowedInputFamilies.includes(input.identity.kind)) {
      return false;
    }
    
    for (const field of contract.requiredInputFields) {
      if (!(field in (input.payload as any))) {
        return false;
      }
    }
    
    return true;
  }
  
  validateOutput(output: CanonicalObject, contract: StageContract): boolean {
    if (!contract.allowedOutputFamilies.includes(output.identity.kind)) {
      return false;
    }
    
    for (const field of contract.requiredOutputFields) {
      if (!(field in (output.payload as any))) {
        return false;
      }
    }
    
    return true;
  }
  
  validateInvariants(input: CanonicalObject, output: CanonicalObject, contract: StageContract): boolean {
    for (const invariant of contract.invariants) {
      if (!invariant(input, output)) {
        return false;
      }
    }
    
    return true;
  }
}
