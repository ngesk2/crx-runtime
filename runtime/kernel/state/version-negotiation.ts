/**
 * Version Negotiation
 * Three independent contracts for constitutional runtimes:
 * - Constitution Version: Runtime laws
 * - Canonical Schema Version: Object encoding
 * - Capability ABI Version: Execution compatibility
 * Provider versions collapsed into Capability ABI (only ABI matters for replay).
 */

export interface VersionInfo {
  constitutionVersion: string;
  schemaVersion: string;
  capabilityABIVersion: string;
}

export const CURRENT_VERSIONS: VersionInfo = {
  constitutionVersion: '1.0.0',
  schemaVersion: '1.0.0',
  capabilityABIVersion: '1.0.0',
};

export class VersionNegotiator {
  /**
   * Check if versions are compatible
   */
  areVersionsCompatible(required: VersionInfo, actual: VersionInfo): boolean {
    return (
      this.isCompatible(required.constitutionVersion, actual.constitutionVersion) &&
      this.isCompatible(required.schemaVersion, actual.schemaVersion) &&
      this.isCompatible(required.capabilityABIVersion, actual.capabilityABIVersion)
    );
  }
  
  /**
   * Check if a single version is compatible (semantic versioning)
   */
  private isCompatible(required: string, actual: string): boolean {
    const requiredMajor = parseInt(required.split('.')[0]);
    const actualMajor = parseInt(actual.split('.')[0]);
    
    // Major version must match
    return requiredMajor === actualMajor;
  }
  
  /**
   * Get minimum required versions for a capability
   */
  getCapabilityRequirements(capabilityId: string): VersionInfo {
    // Placeholder: In production, this would look up capability requirements
    return CURRENT_VERSIONS;
  }
  
  /**
   * Validate version info
   */
  validateVersionInfo(versionInfo: VersionInfo): boolean {
    const versionRegex = /^\d+\.\d+\.\d+$/;
    
    return (
      versionRegex.test(versionInfo.constitutionVersion) &&
      versionRegex.test(versionInfo.schemaVersion) &&
      versionRegex.test(versionInfo.capabilityABIVersion)
    );
  }
}

/**
 * Versioned interface wrapper
 */
export interface Versioned<T> {
  data: T;
  version: VersionInfo;
  timestamp: string;
}

export class VersionedWrapper {
  static wrap<T>(data: T, version: VersionInfo = CURRENT_VERSIONS): Versioned<T> {
    return {
      data,
      version,
      timestamp: new Date().toISOString(),
    };
  }
  
  static unwrap<T>(versioned: Versioned<T>): T {
    return versioned.data;
  }
  
  static getVersion<T>(versioned: Versioned<T>): VersionInfo {
    return versioned.version;
  }
}
