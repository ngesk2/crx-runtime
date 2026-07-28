/**
 * Interface
 * Represents the contract or boundary of an Entity.
 */

export interface Interface {
  type: 'Interface';
  id: string;
  kind: string;
  entity_id: string;
  methods: readonly Method[];
  properties: readonly Property[];
}

export interface Method {
  name: string;
  inputs: readonly string[];
  outputs: readonly string[];
}

export interface Property {
  name: string;
  type: string;
  required: boolean;
}
