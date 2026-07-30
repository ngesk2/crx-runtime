/**
 * Constitutional Runtime - Shared Contracts
 * 
 * This package exports shared contracts for:
 * - Event schemas and interfaces
 * - Provider interfaces and capability definitions
 * - Projection interfaces and base types
 * 
 * Published by Constitutional Runtime.
 * Consumed by PING and HPP.
 * 
 * Usage:
 * import { ConstitutionalEvent } from '@constitutional-runtime/contracts/events';
 * import { AbstractConnector } from '@constitutional-runtime/contracts/providers';
 * import { Projection } from '@constitutional-runtime/contracts/projections';
 */

export * from './events';
export * from './providers';
export * from './projections';
