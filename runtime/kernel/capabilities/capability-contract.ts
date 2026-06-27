/**
 * Capability Contract
 * Defines the constitutional contract for a capability.
 */

import { Capability, CapabilityID } from './capability';

export interface CapabilityContract {
  capabilityId: CapabilityID;
  inputContract: InputContract;
  outputContract: OutputContract;
  resourceContract: ResourceContract;
  policyContract: PolicyContract;
  replayContract: ReplayContract;
}

export interface InputContract {
  requiredInputs: string[];
  optionalInputs: string[];
  inputSchemas: Record<string, string>;
  validationRules: string[];
}

export interface OutputContract {
  guaranteedOutputs: string[];
  optionalOutputs: string[];
  outputSchemas: Record<string, string>;
  outputGuarantees: string[];
}

export interface ResourceContract {
  maxCPU: number;
  maxMemory: number;
  maxGPU: number;
  maxDuration: number;
  allowedRegions: string[];
}

export interface PolicyContract {
  requiredPolicies: string[];
  forbiddenPolicies: string[];
  policyVersion: string;
}

export interface ReplayContract {
  replayable: boolean;
  deterministic: boolean;
  idempotent: boolean;
  replayVersion: string;
}

export class CapabilityContractValidator {
  validateContract(contract: CapabilityContract): boolean {
    // Validate input contract
    if (!contract.inputContract.requiredInputs.length && !contract.inputContract.optionalInputs.length) {
      return false;
    }
    
    // Validate output contract
    if (!contract.outputContract.guaranteedOutputs.length) {
      return false;
    }
    
    // Validate resource contract
    if (contract.resourceContract.maxCPU <= 0) {
      return false;
    }
    
    if (contract.resourceContract.maxMemory <= 0) {
      return false;
    }
    
    if (contract.resourceContract.maxDuration <= 0) {
      return false;
    }
    
    return true;
  }
}
