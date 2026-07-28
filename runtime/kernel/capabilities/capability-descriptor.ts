/**
 * Capability Descriptor
 * Describes a capability for discovery and registration.
 */

import { Capability, CapabilityID } from './capability';

export interface CapabilityDescriptor {
  identity: CapabilityID;
  name: string;
  description: string;
  category: string;
  tags: string[];
  version: string;
  author: string;
  license: string;
  documentation?: string;
  examples?: string[];
}

export class CapabilityDescriptorBuilder {
  buildDescriptor(
    identity: CapabilityID,
    name: string,
    description: string,
    category: string
  ): CapabilityDescriptor {
    return {
      identity,
      name,
      description,
      category,
      tags: [],
      version: '1.0.0',
      author: 'unknown',
      license: 'MIT',
    };
  }
  
  withTags(descriptor: CapabilityDescriptor, tags: string[]): CapabilityDescriptor {
    return { ...descriptor, tags };
  }
  
  withDocumentation(descriptor: CapabilityDescriptor, documentation: string): CapabilityDescriptor {
    return { ...descriptor, documentation };
  }
  
  withExamples(descriptor: CapabilityDescriptor, examples: string[]): CapabilityDescriptor {
    return { ...descriptor, examples };
  }
}
