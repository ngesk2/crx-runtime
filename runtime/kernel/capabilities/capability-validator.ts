/**
 * Capability Validator
 * Validates capabilities against constitutional requirements.
 */

import { Capability, CapabilityID } from './capability';

export class CapabilityValidator {
  validateCapability(capability: Capability): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate identity
    if (!capability.identity) {
      errors.push('Capability must have an identity');
    }
    
    // Validate version
    if (!capability.version) {
      errors.push('Capability must have a version');
    }
    
    // Validate inputs
    if (!capability.inputs.length) {
      errors.push('Capability must have at least one input');
    }
    
    // Validate outputs
    if (!capability.outputs.length) {
      errors.push('Capability must have at least one output');
    }
    
    // Validate required authorities
    if (!capability.requiredAuthorities.length) {
      warnings.push('Capability has no required authorities');
    }
    
    // Validate timeout
    if (capability.timeout <= 0) {
      errors.push('Capability timeout must be positive');
    }
    
    // Validate cost
    if (capability.cost.amount < 0) {
      errors.push('Capability cost cannot be negative');
    }
    
    // Validate required resources
    if (!capability.requiredResources.length) {
      warnings.push('Capability has no resource requirements');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
  
  validateCapabilityContract(capability: Capability): boolean {
    // Check if capability has all required fields for execution
    return (
      !!capability.identity &&
      !!capability.version &&
      capability.inputs.length > 0 &&
      capability.outputs.length > 0 &&
      capability.timeout > 0
    );
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
