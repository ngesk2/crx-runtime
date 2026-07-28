/**
 * State Authority Interface
 * Public interface for state subsystem.
 * Only this interface crosses subsystem boundaries.
 */

export interface IStateAuthority {
  get(key: string): StateValue | null;
  set(key: string, value: StateValue): void;
  delete(key: string): boolean;
  list(prefix: string): StateValue[];
  transaction(operations: StateOperation[]): TransactionResult;
  snapshot(): StateSnapshot;
  restore(snapshot: StateSnapshot): void;
  watch(key: string, callback: WatchCallback): WatchHandle;
  unwatch(handle: WatchHandle): void;
}

export interface StateValue {
  key: string;
  value: unknown;
  version: number;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface StateOperation {
  type: 'get' | 'set' | 'delete';
  key: string;
  value?: unknown;
}

export interface TransactionResult {
  success: boolean;
  operations: StateOperation[];
  results: (StateValue | null)[];
  error?: string;
}

export interface StateSnapshot {
  snapshotId: string;
  timestamp: string;
  values: StateValue[];
}

export interface WatchHandle {
  handleId: string;
  key: string;
}

export type WatchCallback = (key: string, value: StateValue | null) => void;

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
  areVersionsCompatible(required: VersionInfo, actual: VersionInfo): boolean {
    return (
      this.isCompatible(required.constitutionVersion, actual.constitutionVersion) &&
      this.isCompatible(required.schemaVersion, actual.schemaVersion) &&
      this.isCompatible(required.capabilityABIVersion, actual.capabilityABIVersion)
    );
  }
  
  private isCompatible(required: string, actual: string): boolean {
    const requiredMajor = parseInt(required.split('.')[0]);
    const actualMajor = parseInt(actual.split('.')[0]);
    return requiredMajor === actualMajor;
  }
  
  validateVersionInfo(versionInfo: VersionInfo): boolean {
    const versionRegex = /^\d+\.\d+\.\d+$/;
    return (
      versionRegex.test(versionInfo.constitutionVersion) &&
      versionRegex.test(versionInfo.schemaVersion) &&
      versionRegex.test(versionInfo.capabilityABIVersion)
    );
  }
}
