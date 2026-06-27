/**
 * Worker Descriptor
 * Describes a worker for discovery and registration.
 */

import { WorkerID } from './worker';

export interface WorkerDescriptor {
  name: string;
  version: string;
  host: string;
  port: number;
  region: string;
  zone: string;
  labels: Record<string, string>;
  capabilities: string[];
}

export class WorkerDescriptorBuilder {
  buildDescriptor(
    name: string,
    version: string,
    host: string,
    port: number
  ): WorkerDescriptor {
    return {
      name,
      version,
      host,
      port,
      region: 'default',
      zone: 'default',
      labels: {},
      capabilities: [],
    };
  }
  
  withRegion(descriptor: WorkerDescriptor, region: string): WorkerDescriptor {
    return { ...descriptor, region };
  }
  
  withZone(descriptor: WorkerDescriptor, zone: string): WorkerDescriptor {
    return { ...descriptor, zone };
  }
  
  withLabels(descriptor: WorkerDescriptor, labels: Record<string, string>): WorkerDescriptor {
    return { ...descriptor, labels: { ...descriptor.labels, ...labels } };
  }
  
  withCapabilities(descriptor: WorkerDescriptor, capabilities: string[]): WorkerDescriptor {
    return { ...descriptor, capabilities };
  }
}
