/**
 * Capability Registry
 * Registry of all available capabilities.
 * This is the constitutional registry, not the stage registry.
 */

import { Capability, CapabilityID } from './capability';

export class CapabilityRegistry {
  private capabilities: Map<CapabilityID, Capability> = new Map();
  
  registerCapability(capability: Capability): void {
    this.capabilities.set(capability.identity, capability);
  }
  
  getCapability(id: CapabilityID): Capability | undefined {
    return this.capabilities.get(id);
  }
  
  listCapabilities(): Capability[] {
    return Array.from(this.capabilities.values());
  }
  
  findCapabilitiesByInput(inputType: string): Capability[] {
    return this.listCapabilities().filter(cap => 
      cap.inputs.some(input => input.type === inputType)
    );
  }
  
  findCapabilitiesByOutput(outputType: string): Capability[] {
    return this.listCapabilities().filter(cap => 
      cap.outputs.some(output => output.type === outputType)
    );
  }
  
  findCapabilitiesByExecutor(executorClass: string): Capability[] {
    return this.listCapabilities().filter(cap => 
      cap.executorClass === executorClass
    );
  }
  
  findCapabilitiesByPriority(priority: string): Capability[] {
    return this.listCapabilities().filter(cap => 
      cap.priority === priority
    );
  }
}
