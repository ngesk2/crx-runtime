/**
 * Constitutional Runtime - Provider Capabilities
 * 
 * Capability-based connector interface.
 * Published by Constitutional Runtime, consumed by PING and HPP.
 */

// Capability markers
export interface Readable {
  read<T>(resource: string, options?: ReadOptions): Promise<T[]>;
  readOne<T>(resource: string, id: string, options?: ReadOptions): Promise<T>;
}

export interface Writable {
  create<T>(resource: string, data: unknown): Promise<T>;
  update<T>(resource: string, id: string, data: unknown): Promise<T>;
  delete(resource: string, id: string): Promise<void>;
  upsert<T>(resource: string, data: unknown): Promise<T>;
}

export interface Queryable {
  query<T>(query: string, options?: QueryOptions): Promise<T[]>;
}

export interface Discoverable {
  discover(): Promise<Schema>;
  getResourceSchema(resource: string): Promise<ResourceSchema>;
}

export interface Observable {
  subscribe(resource: string, callback: StreamCallback): Unsubscribe;
  subscribeQuery(query: string, callback: StreamCallback): Unsubscribe;
}

export interface Transformable {
  transformToCanonical(data: unknown, resource: string): unknown;
  transformFromCanonical(data: unknown, resource: string): unknown;
}

export interface Webhookable {
  handleWebhook(event: WebhookEvent): Promise<void>;
  verifyWebhook(signature: string, payload: unknown): boolean;
}

// Supporting types
export interface ReadOptions {
  fields?: string[];
  filter?: Record<string, unknown>;
  sort?: Record<string, 'asc' | 'desc'>;
  limit?: number;
  offset?: number;
}

export interface QueryOptions {
  parameters?: Record<string, unknown>;
}

export interface StreamCallback {
  (data: unknown, event: StreamEvent): void;
}

export type Unsubscribe = () => void;

export interface StreamEvent {
  type: 'created' | 'updated' | 'deleted';
  timestamp: string;
  id: string;
}

export interface WebhookEvent {
  type: string;
  payload: unknown;
  timestamp: string;
  signature?: string;
}

export interface Schema {
  resources: ResourceSchema[];
  version: string;
}

export interface ResourceSchema {
  name: string;
  fields: FieldSchema[];
  operations: string[];
}

export interface FieldSchema {
  name: string;
  type: string;
  required: boolean;
  readonly?: boolean;
}

// Capability detection
export function isReadable(connector: unknown): connector is Readable {
  return !!(connector && typeof (connector as Readable).read === 'function' && typeof (connector as Readable).readOne === 'function');
}

export function isWritable(connector: unknown): connector is Writable {
  return !!(connector && 
    typeof (connector as Writable).create === 'function' && 
    typeof (connector as Writable).update === 'function' && 
    typeof (connector as Writable).delete === 'function' &&
    typeof (connector as Writable).upsert === 'function');
}

export function isQueryable(connector: unknown): connector is Queryable {
  return !!(connector && typeof (connector as Queryable).query === 'function');
}

export function isDiscoverable(connector: unknown): connector is Discoverable {
  return !!(connector && 
    typeof (connector as Discoverable).discover === 'function' && 
    typeof (connector as Discoverable).getResourceSchema === 'function');
}

export function isObservable(connector: unknown): connector is Observable {
  return !!(connector && 
    typeof (connector as Observable).subscribe === 'function' && 
    typeof (connector as Observable).subscribeQuery === 'function');
}

export function isTransformable(connector: unknown): connector is Transformable {
  return !!(connector && 
    typeof (connector as Transformable).transformToCanonical === 'function' && 
    typeof (connector as Transformable).transformFromCanonical === 'function');
}

export function isWebhookable(connector: unknown): connector is Webhookable {
  return !!(connector && 
    typeof (connector as Webhookable).handleWebhook === 'function' && 
    typeof (connector as Webhookable).verifyWebhook === 'function');
}

// Capability advertisement
export interface ConnectorCapabilities {
  readable: boolean;
  writable: boolean;
  queryable: boolean;
  discoverable: boolean;
  observable: boolean;
  transformable: boolean;
  webhookable: boolean;
}

export function getConnectorCapabilities(connector: unknown): ConnectorCapabilities {
  return {
    readable: isReadable(connector),
    writable: isWritable(connector),
    queryable: isQueryable(connector),
    discoverable: isDiscoverable(connector),
    observable: isObservable(connector),
    transformable: isTransformable(connector),
    webhookable: isWebhookable(connector)
  };
}
