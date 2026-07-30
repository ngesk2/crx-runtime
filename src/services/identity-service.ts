/**
 * Identity Service
 *
 * Manages Customer, Crew, Company, and Roles.
 * Emits canonical events for all identity changes.
 */

import { EventService, Event } from "./event-service";

/**
 * Customer Entity
 */
export interface Customer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Crew Member Entity
 */
export interface CrewMember {
  id: string;
  customerId: string;
  companyId: string;
  role: "owner" | "manager" | "technician" | "admin";
  createdAt: string;
}

/**
 * Company Entity
 */
export interface Company {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Role Assignment
 */
export interface RoleAssignment {
  userId: string;
  role: string;
  assignedAt: string;
  assignedBy: string;
}

/**
 * Identity Events
 */
export type IdentityEvent =
  | CustomerCreated
  | CustomerUpdated
  | CrewMemberAdded
  | CrewMemberRemoved
  | CompanyCreated
  | CompanyUpdated
  | RoleAssigned;

export interface CustomerCreated extends Event {
  type: "CustomerCreated";
  aggregateType: "Customer";
  data: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
}

export interface CustomerUpdated extends Event {
  type: "CustomerUpdated";
  aggregateType: "Customer";
  data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
}

export interface CrewMemberAdded extends Event {
  type: "CrewMemberAdded";
  aggregateType: "CrewMember";
  data: {
    customerId: string;
    companyId: string;
    role: "owner" | "manager" | "technician" | "admin";
  };
}

export interface CrewMemberRemoved extends Event {
  type: "CrewMemberRemoved";
  aggregateType: "CrewMember";
  data: {
    crewMemberId: string;
  };
}

export interface CompanyCreated extends Event {
  type: "CompanyCreated";
  aggregateType: "Company";
  data: {
    name: string;
    address?: string;
    phone?: string;
  };
}

export interface CompanyUpdated extends Event {
  type: "CompanyUpdated";
  aggregateType: "Company";
  data: {
    name?: string;
    address?: string;
    phone?: string;
  };
}

export interface RoleAssigned extends Event {
  type: "RoleAssigned";
  aggregateType: "RoleAssignment";
  data: {
    userId: string;
    role: string;
    assignedBy: string;
  };
}

/**
 * Identity Service Interface
 */
export interface IdentityService {
  createCustomer(data: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<Customer>;

  updateCustomer(
    id: string,
    data: {
      email?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    }
  ): Promise<Customer>;

  addCrewMember(data: {
    customerId: string;
    companyId: string;
    role: "owner" | "manager" | "technician" | "admin";
  }): Promise<CrewMember>;

  removeCrewMember(crewMemberId: string): Promise<void>;

  createCompany(data: {
    name: string;
    address?: string;
    phone?: string;
  }): Promise<Company>;

  updateCompany(
    id: string,
    data: {
      name?: string;
      address?: string;
      phone?: string;
    }
  ): Promise<Company>;

  assignRole(userId: string, role: string, assignedBy: string): Promise<void>;

  getCustomer(id: string): Promise<Customer | null>;
  getCompany(id: string): Promise<Company | null>;
}

/**
 * In-Memory Identity Service
 *
 * WARNING: NOT SUITABLE FOR PRODUCTION
 * Data is lost on restart.
 * Use only for development/testing.
 */
export class InMemoryIdentityService implements IdentityService {
  private customers: Map<string, Customer> = new Map();
  private crewMembers: Map<string, CrewMember> = new Map();
  private companies: Map<string, Company> = new Map();
  private roleAssignments: Map<string, RoleAssignment> = new Map();

  constructor(private eventService: EventService) {}

  async createCustomer(data: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<Customer> {
    const id = this.generateId();
    const now = new Date().toISOString();

    const customer: Customer = {
      id,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      createdAt: now,
      updatedAt: now,
    };

    this.customers.set(id, customer);

    const event: CustomerCreated = {
      id: this.generateId(),
      aggregateId: id,
      aggregateType: "Customer",
      type: "CustomerCreated",
      data,
      timestamp: now,
      version: 1,
    };

    await this.eventService.appendEvent(event);

    return customer;
  }

  async updateCustomer(
    id: string,
    data: {
      email?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    }
  ): Promise<Customer> {
    const customer = this.customers.get(id);
    if (!customer) {
      throw new Error(`Customer not found: ${id}`);
    }

    const updatedCustomer: Customer = {
      ...customer,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.customers.set(id, updatedCustomer);

    const event: CustomerUpdated = {
      id: this.generateId(),
      aggregateId: id,
      aggregateType: "Customer",
      type: "CustomerUpdated",
      data,
      timestamp: new Date().toISOString(),
      version: (await this.getLatestVersion(id)) + 1,
    };

    await this.eventService.appendEvent(event);

    return updatedCustomer;
  }

  async addCrewMember(data: {
    customerId: string;
    companyId: string;
    role: "owner" | "manager" | "technician" | "admin";
  }): Promise<CrewMember> {
    const id = this.generateId();
    const now = new Date().toISOString();

    const crewMember: CrewMember = {
      id,
      customerId: data.customerId,
      companyId: data.companyId,
      role: data.role,
      createdAt: now,
    };

    this.crewMembers.set(id, crewMember);

    const event: CrewMemberAdded = {
      id: this.generateId(),
      aggregateId: id,
      aggregateType: "CrewMember",
      type: "CrewMemberAdded",
      data,
      timestamp: now,
      version: 1,
    };

    await this.eventService.appendEvent(event);

    return crewMember;
  }

  async removeCrewMember(crewMemberId: string): Promise<void> {
    this.crewMembers.delete(crewMemberId);

    const event: CrewMemberRemoved = {
      id: this.generateId(),
      aggregateId: crewMemberId,
      aggregateType: "CrewMember",
      type: "CrewMemberRemoved",
      data: { crewMemberId },
      timestamp: new Date().toISOString(),
      version: (await this.getLatestVersion(crewMemberId)) + 1,
    };

    await this.eventService.appendEvent(event);
  }

  async createCompany(data: {
    name: string;
    address?: string;
    phone?: string;
  }): Promise<Company> {
    const id = this.generateId();
    const now = new Date().toISOString();

    const company: Company = {
      id,
      name: data.name,
      address: data.address,
      phone: data.phone,
      createdAt: now,
      updatedAt: now,
    };

    this.companies.set(id, company);

    const event: CompanyCreated = {
      id: this.generateId(),
      aggregateId: id,
      aggregateType: "Company",
      type: "CompanyCreated",
      data,
      timestamp: now,
      version: 1,
    };

    await this.eventService.appendEvent(event);

    return company;
  }

  async updateCompany(
    id: string,
    data: {
      name?: string;
      address?: string;
      phone?: string;
    }
  ): Promise<Company> {
    const company = this.companies.get(id);
    if (!company) {
      throw new Error(`Company not found: ${id}`);
    }

    const updatedCompany: Company = {
      ...company,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.companies.set(id, updatedCompany);

    const event: CompanyUpdated = {
      id: this.generateId(),
      aggregateId: id,
      aggregateType: "Company",
      type: "CompanyUpdated",
      data,
      timestamp: new Date().toISOString(),
      version: (await this.getLatestVersion(id)) + 1,
    };

    await this.eventService.appendEvent(event);

    return updatedCompany;
  }

  async assignRole(
    userId: string,
    role: string,
    assignedBy: string
  ): Promise<void> {
    const now = new Date().toISOString();

    const assignment: RoleAssignment = {
      userId,
      role,
      assignedAt: now,
      assignedBy,
    };

    this.roleAssignments.set(`${userId}:${role}`, assignment);

    const event: RoleAssigned = {
      id: this.generateId(),
      aggregateId: `${userId}:${role}`,
      aggregateType: "RoleAssignment",
      type: "RoleAssigned",
      data: { userId, role, assignedBy },
      timestamp: now,
      version: 1,
    };

    await this.eventService.appendEvent(event);
  }

  async getCustomer(id: string): Promise<Customer | null> {
    return this.customers.get(id) || null;
  }

  async getCompany(id: string): Promise<Company | null> {
    return this.companies.get(id) || null;
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  private async getLatestVersion(aggregateId: string): Promise<number> {
    const events = await this.eventService.replay(aggregateId);
    return events.length > 0 ? events[events.length - 1].version : 0;
  }
}
