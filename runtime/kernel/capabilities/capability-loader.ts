/**
 * Capability Loader
 * Loads capabilities from RepositoryAuthority.
 * Direct filesystem/registry/network/memory access is unconstitutional.
 * All capability loading must route through RepositoryAuthority.
 */

import { Capability, CapabilityID } from './capability';
import { CapabilityDescriptor } from './capability-descriptor';
import { IRepositoryAuthority, CanonicalObject } from '../repository/repository-authority-interface';

export interface CapabilitySource {
  type: 'repository';
  location: string;
  version?: string;
}

export class CapabilityLoader {
  private repositoryAuthority: IRepositoryAuthority;
  
  constructor(repositoryAuthority: IRepositoryAuthority) {
    this.repositoryAuthority = repositoryAuthority;
  }
  
  async loadCapability(source: CapabilitySource): Promise<Capability> {
    if (source.type !== 'repository') {
      throw new Error(`Only repository source type is constitutional. Got: ${source.type}`);
    }
    
    // Load capability through RepositoryAuthority
    const canonicalObject = await this.repositoryAuthority.load(source.location);
    if (!canonicalObject) {
      throw new Error(`Capability not found: ${source.location}`);
    }
    
    // Extract capability from CanonicalObject data field
    return canonicalObject.data as Capability;
  }
  
  async loadCapabilities(sources: CapabilitySource[]): Promise<Capability[]> {
    const capabilities = await Promise.all(
      sources.map(source => this.loadCapability(source))
    );
    return capabilities;
  }
}
