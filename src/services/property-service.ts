/**
 * Property Service
 *
 * Manages Property, Address, Ownership, and Geo.
 * Emits canonical events for all property changes.
 */

import { EventService, Event } from "./event-service";

/**
 * Address Entity
 */
export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

/**
 * Geo Coordinates
 */
export interface Geo {
  latitude: number;
  longitude: number;
}

/**
 * Property Entity
 */
export interface Property {
  id: string;
  address: Address;
  geo?: Geo;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Ownership Transfer
 */
export interface OwnershipTransfer {
  propertyId: string;
  fromOwnerId?: string;
  toOwnerId: string;
  transferredAt: string;
}

/**
 * Property Events
 */
export type PropertyEvent =
  | PropertyRegistered
  | PropertyUpdated
  | OwnershipTransferred
  | AddressUpdated;

export interface PropertyRegistered extends Event {
  type: "PropertyRegistered";
  aggregateType: "Property";
  data: {
    address: Address;
    geo?: Geo;
    ownerId?: string;
  };
}

export interface PropertyUpdated extends Event {
  type: "PropertyUpdated";
  aggregateType: "Property";
  data: {
    address?: Address;
    geo?: Geo;
  };
}

export interface OwnershipTransferred extends Event {
  type: "OwnershipTransferred";
  aggregateType: "OwnershipTransfer";
  data: {
    propertyId: string;
    fromOwnerId?: string;
    toOwnerId: string;
  };
}

export interface AddressUpdated extends Event {
  type: "AddressUpdated";
  aggregateType: "Property";
  data: {
    address: Address;
  };
}

/**
 * Property Service Interface
 */
export interface PropertyService {
  registerProperty(data: {
    address: Address;
    geo?: Geo;
    ownerId?: string;
  }): Promise<Property>;

  updateProperty(
    id: string,
    data: {
      address?: Address;
      geo?: Geo;
    }
  ): Promise<Property>;

  transferOwnership(
    propertyId: string,
    toOwnerId: string
  ): Promise<OwnershipTransfer>;

  updateAddress(propertyId: string, address: Address): Promise<Address>;

  getProperty(id: string): Promise<Property | null>;
}

/**
 * In-Memory Property Service
 *
 * WARNING: NOT SUITABLE FOR PRODUCTION
 * Data is lost on restart.
 * Use only for development/testing.
 */
export class InMemoryPropertyService implements PropertyService {
  private properties: Map<string, Property> = new Map();
  private ownershipTransfers: Map<string, OwnershipTransfer> = new Map();

  constructor(private eventService: EventService) {}

  async registerProperty(data: {
    address: Address;
    geo?: Geo;
    ownerId?: string;
  }): Promise<Property> {
    const id = this.generateId();
    const now = new Date().toISOString();

    const property: Property = {
      id,
      address: data.address,
      geo: data.geo,
      ownerId: data.ownerId,
      createdAt: now,
      updatedAt: now,
    };

    this.properties.set(id, property);

    const event: PropertyRegistered = {
      id: this.generateId(),
      aggregateId: id,
      aggregateType: "Property",
      type: "PropertyRegistered",
      data,
      timestamp: now,
      version: 1,
    };

    await this.eventService.appendEvent(event);

    return property;
  }

  async updateProperty(
    id: string,
    data: {
      address?: Address;
      geo?: Geo;
    }
  ): Promise<Property> {
    const property = this.properties.get(id);
    if (!property) {
      throw new Error(`Property not found: ${id}`);
    }

    const updatedProperty: Property = {
      ...property,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.properties.set(id, updatedProperty);

    const event: PropertyUpdated = {
      id: this.generateId(),
      aggregateId: id,
      aggregateType: "Property",
      type: "PropertyUpdated",
      data,
      timestamp: new Date().toISOString(),
      version: (await this.getLatestVersion(id)) + 1,
    };

    await this.eventService.appendEvent(event);

    return updatedProperty;
  }

  async transferOwnership(
    propertyId: string,
    toOwnerId: string
  ): Promise<OwnershipTransfer> {
    const property = this.properties.get(propertyId);
    if (!property) {
      throw new Error(`Property not found: ${propertyId}`);
    }

    const fromOwnerId = property.ownerId;
    const now = new Date().toISOString();

    const transfer: OwnershipTransfer = {
      propertyId,
      fromOwnerId,
      toOwnerId,
      transferredAt: now,
    };

    this.ownershipTransfers.set(
      `${propertyId}:${now}`,
      transfer
    );

    // Update property owner
    property.ownerId = toOwnerId;
    property.updatedAt = now;
    this.properties.set(propertyId, property);

    const event: OwnershipTransferred = {
      id: this.generateId(),
      aggregateId: `${propertyId}:${now}`,
      aggregateType: "OwnershipTransfer",
      type: "OwnershipTransferred",
      data: {
        propertyId,
        fromOwnerId,
        toOwnerId,
      },
      timestamp: now,
      version: 1,
    };

    await this.eventService.appendEvent(event);

    return transfer;
  }

  async updateAddress(
    propertyId: string,
    address: Address
  ): Promise<Address> {
    const property = this.properties.get(propertyId);
    if (!property) {
      throw new Error(`Property not found: ${propertyId}`);
    }

    property.address = address;
    property.updatedAt = new Date().toISOString();
    this.properties.set(propertyId, property);

    const event: AddressUpdated = {
      id: this.generateId(),
      aggregateId: propertyId,
      aggregateType: "Property",
      type: "AddressUpdated",
      data: { address },
      timestamp: new Date().toISOString(),
      version: (await this.getLatestVersion(propertyId)) + 1,
    };

    await this.eventService.appendEvent(event);

    return address;
  }

  async getProperty(id: string): Promise<Property | null> {
    return this.properties.get(id) || null;
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  private async getLatestVersion(aggregateId: string): Promise<number> {
    const events = await this.eventService.replay(aggregateId);
    return events.length > 0 ? events[events.length - 1].version : 0;
  }
}
