/**
 * Ownership Engine
 * 
 * Who owns creation/mutation/persistence/destruction?
 * 
 * The compiler must answer:
 * - Who owns every mutable state?
 * - Who owns every identifier?
 * - Who owns every hash?
 * - Who owns every signature?
 * - Who owns every persistence operation?
 * - Which authority created every object?
 * - Which subsystem is permitted to mutate it?
 */

import { SymbolID } from '../ir/node-types';
import { CanonicalSymbol, CanonicalSymbolKind } from '../lowering/semantic-lowerer';
import { SemanticIRNode, MutationEdge, PersistenceAction } from '../lowering/semantic-lowerer';

/**
 * Ownership Record
 */
export interface OwnershipRecord {
  id: SymbolID;
  owner: SymbolID;
  authority: SymbolID;
  kind: OwnershipKind;
  target: SymbolID;
  ownershipType: OwnershipType;
  grantedAt: string;
  expiresAt?: string;
  conditions: OwnershipCondition[];
}

/**
 * Ownership Kind
 */
export enum OwnershipKind {
  Creation = 'Creation',
  Mutation = 'Mutation',
  Persistence = 'Persistence',
  Destruction = 'Destruction',
  Read = 'Read',
  Write = 'Write',
  Delete = 'Delete',
  Execute = 'Execute',
  Verify = 'Verify',
  Sign = 'Sign',
  Hash = 'Hash',
}

/**
 * Ownership Type
 */
export enum OwnershipType {
  Exclusive = 'Exclusive',
  Shared = 'Shared',
  Delegated = 'Delegated',
  Transient = 'Transient',
  Immutable = 'Immutable',
}

/**
 * Ownership Condition
 */
export interface OwnershipCondition {
  type: string;
  value: any;
  authority: SymbolID;
}

/**
 * Ownership Transfer
 */
export interface OwnershipTransfer {
  id: SymbolID;
  from: SymbolID;
  to: SymbolID;
  target: SymbolID;
  authority: SymbolID;
  timestamp: string;
  reason: string;
  evidence: SymbolID[];
}

/**
 * Ownership Engine
 */
export class OwnershipEngine {
  private ownershipRecords: Map<SymbolID, OwnershipRecord> = new Map();
  private ownershipIndex: Map<SymbolID, SymbolID[]> = new Map(); // target -> owners
  private ownerIndex: Map<SymbolID, SymbolID[]> = new Map(); // owner -> targets
  private authorityIndex: Map<SymbolID, SymbolID[]> = new Map(); // authority -> records
  private ownershipTransfers: Map<SymbolID, OwnershipTransfer> = new Map();

  /**
   * Register ownership
   */
  registerOwnership(
    owner: SymbolID,
    authority: SymbolID,
    kind: OwnershipKind,
    target: SymbolID,
    ownershipType: OwnershipType,
    conditions: OwnershipCondition[] = []
  ): OwnershipRecord {
    const id = this.generateOwnershipId(owner, target, kind);
    const record: OwnershipRecord = {
      id,
      owner,
      authority,
      kind,
      target,
      ownershipType,
      grantedAt: new Date().toISOString(),
      conditions,
    };

    this.ownershipRecords.set(id, record);
    
    // Index by target
    if (!this.ownershipIndex.has(target)) {
      this.ownershipIndex.set(target, []);
    }
    this.ownershipIndex.get(target)!.push(id);
    
    // Index by owner
    if (!this.ownerIndex.has(owner)) {
      this.ownerIndex.set(owner, []);
    }
    this.ownerIndex.get(owner)!.push(id);
    
    // Index by authority
    if (!this.authorityIndex.has(authority)) {
      this.authorityIndex.set(authority, []);
    }
    this.authorityIndex.get(authority)!.push(id);

    return record;
  }

  /**
   * Transfer ownership
   */
  transferOwnership(
    from: SymbolID,
    to: SymbolID,
    target: SymbolID,
    authority: SymbolID,
    reason: string,
    evidence: SymbolID[] = []
  ): OwnershipTransfer {
    const id = this.generateTransferId(from, to, target);
    const transfer: OwnershipTransfer = {
      id,
      from,
      to,
      target,
      authority,
      timestamp: new Date().toISOString(),
      reason,
      evidence,
    };

    this.ownershipTransfers.set(id, transfer);

    // Update ownership records
    const existingRecords = this.getOwnershipByTarget(target);
    for (const record of existingRecords) {
      if (record.owner === from) {
        const updatedRecord: OwnershipRecord = {
          ...record,
          owner: to,
        };
        this.ownershipRecords.set(record.id, updatedRecord);
        
        // Update owner index
        const ownerTargets = this.ownerIndex.get(from) || [];
        const index = ownerTargets.indexOf(record.id);
        if (index > -1) {
          ownerTargets.splice(index, 1);
        }
        
        if (!this.ownerIndex.has(to)) {
          this.ownerIndex.set(to, []);
        }
        this.ownerIndex.get(to)!.push(record.id);
      }
    }

    return transfer;
  }

  /**
   * Get ownership by target
   */
  getOwnershipByTarget(target: SymbolID): OwnershipRecord[] {
    const ids = this.ownershipIndex.get(target) || [];
    return ids.map(id => this.ownershipRecords.get(id)!).filter(r => r !== undefined);
  }

  /**
   * Get ownership by owner
   */
  getOwnershipByOwner(owner: SymbolID): OwnershipRecord[] {
    const ids = this.ownerIndex.get(owner) || [];
    return ids.map(id => this.ownershipRecords.get(id)!).filter(r => r !== undefined);
  }

  /**
   * Get ownership by authority
   */
  getOwnershipByAuthority(authority: SymbolID): OwnershipRecord[] {
    const ids = this.authorityIndex.get(authority) || [];
    return ids.map(id => this.ownershipRecords.get(id)!).filter(r => r !== undefined);
  }

  /**
   * Get ownership by kind
   */
  getOwnershipByKind(kind: OwnershipKind): OwnershipRecord[] {
    const results: OwnershipRecord[] = [];
    
    for (const record of this.ownershipRecords.values()) {
      if (record.kind === kind) {
        results.push(record);
      }
    }
    
    return results;
  }

  /**
   * Check if owner has ownership of target
   */
  hasOwnership(owner: SymbolID, target: SymbolID, kind?: OwnershipKind): boolean {
    const records = this.getOwnershipByTarget(target);
    
    for (const record of records) {
      if (record.owner === owner) {
        if (kind === undefined || record.kind === kind) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Get owner of target
   */
  getOwner(target: SymbolID, kind?: OwnershipKind): SymbolID | null {
    const records = this.getOwnershipByTarget(target);
    
    for (const record of records) {
      if (kind === undefined || record.kind === kind) {
        return record.owner;
      }
    }
    
    return null;
  }

  /**
   * Get authority for target
   */
  getAuthority(target: SymbolID, kind?: OwnershipKind): SymbolID | null {
    const records = this.getOwnershipByTarget(target);
    
    for (const record of records) {
      if (kind === undefined || record.kind === kind) {
        return record.authority;
      }
    }
    
    return null;
  }

  /**
   * Resolve ownership from semantic IR
   */
  resolveOwnershipFromSemanticIR(semanticIR: Map<SymbolID, SemanticIRNode>): void {
    for (const [id, node] of semanticIR) {
      // Resolve authority ownership
      if (node.authorityRequired) {
        this.registerOwnership(
          node.authorityRequired,
          node.authorityRequired,
          OwnershipKind.Creation,
          id,
          OwnershipType.Exclusive
        );
      }

      // Resolve mutation ownership
      for (const mutation of node.stateMutations) {
        this.registerOwnership(
          mutation.authority,
          mutation.authority,
          OwnershipKind.Mutation,
          mutation.target,
          OwnershipType.Exclusive
        );
      }

      // Resolve persistence ownership
      for (const persistence of node.persistenceActions) {
        this.registerOwnership(
          persistence.authority,
          persistence.authority,
          OwnershipKind.Persistence,
          persistence.target,
          OwnershipType.Exclusive
        );
      }

      // Resolve event ownership
      for (const event of node.eventsEmitted) {
        this.registerOwnership(
          event.authority,
          event.authority,
          OwnershipKind.Creation,
          event.eventType,
          OwnershipType.Exclusive
        );
      }
    }
  }

  /**
   * Resolve ownership from canonical symbols
   */
  resolveOwnershipFromCanonicalSymbols(symbols: Map<SymbolID, CanonicalSymbol>): void {
    for (const [id, symbol] of symbols) {
      // Register ownership based on canonical symbol
      this.registerOwnership(
        symbol.owner,
        symbol.constitutionalRoot,
        OwnershipKind.Creation,
        id,
        OwnershipType.Exclusive
      );
    }
  }

  /**
   * Get ownership transfer by ID
   */
  getOwnershipTransfer(id: SymbolID): OwnershipTransfer | undefined {
    return this.ownershipTransfers.get(id);
  }

  /**
   * Get ownership transfers by target
   */
  getOwnershipTransfersByTarget(target: SymbolID): OwnershipTransfer[] {
    const results: OwnershipTransfer[] = [];
    
    for (const transfer of this.ownershipTransfers.values()) {
      if (transfer.target === target) {
        results.push(transfer);
      }
    }
    
    return results;
  }

  /**
   * Get ownership transfers by owner
   */
  getOwnershipTransfersByOwner(owner: SymbolID): OwnershipTransfer[] {
    const results: OwnershipTransfer[] = [];
    
    for (const transfer of this.ownershipTransfers.values()) {
      if (transfer.from === owner || transfer.to === owner) {
        results.push(transfer);
      }
    }
    
    return results;
  }

  /**
   * Get all ownership records
   */
  getAllOwnershipRecords(): OwnershipRecord[] {
    return Array.from(this.ownershipRecords.values());
  }

  /**
   * Get all ownership transfers
   */
  getAllOwnershipTransfers(): OwnershipTransfer[] {
    return Array.from(this.ownershipTransfers.values());
  }

  /**
   * Merge ownership from another engine
   */
  merge(other: OwnershipEngine): void {
    for (const record of other.getAllOwnershipRecords()) {
      this.ownershipRecords.set(record.id, record);
      
      // Update indexes
      if (!this.ownershipIndex.has(record.target)) {
        this.ownershipIndex.set(record.target, []);
      }
      this.ownershipIndex.get(record.target)!.push(record.id);
      
      if (!this.ownerIndex.has(record.owner)) {
        this.ownerIndex.set(record.owner, []);
      }
      this.ownerIndex.get(record.owner)!.push(record.id);
      
      if (!this.authorityIndex.has(record.authority)) {
        this.authorityIndex.set(record.authority, []);
      }
      this.authorityIndex.get(record.authority)!.push(record.id);
    }
    
    for (const transfer of other.getAllOwnershipTransfers()) {
      this.ownershipTransfers.set(transfer.id, transfer);
    }
  }

  /**
   * Clear all ownership
   */
  clear(): void {
    this.ownershipRecords.clear();
    this.ownershipIndex.clear();
    this.ownerIndex.clear();
    this.authorityIndex.clear();
    this.ownershipTransfers.clear();
  }

  /**
   * Generate ownership ID
   */
  private generateOwnershipId(owner: SymbolID, target: SymbolID, kind: OwnershipKind): SymbolID {
    return `${owner}:${target}:${kind}`;
  }

  /**
   * Generate transfer ID
   */
  private generateTransferId(from: SymbolID, to: SymbolID, target: SymbolID): SymbolID {
    return `transfer:${from}:${to}:${target}:${Date.now()}`;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalOwnershipRecords: number;
    totalOwnershipTransfers: number;
    byKind: Record<OwnershipKind, number>;
    byType: Record<OwnershipType, number>;
    byAuthority: Map<SymbolID, number>;
  } {
    const byKind: Record<OwnershipKind, number> = {} as any;
    const byType: Record<OwnershipType, number> = {} as any;
    const byAuthority = new Map<SymbolID, number>();

    for (const record of this.ownershipRecords.values()) {
      byKind[record.kind] = (byKind[record.kind] || 0) + 1;
      byType[record.ownershipType] = (byType[record.ownershipType] || 0) + 1;
      byAuthority.set(record.authority, (byAuthority.get(record.authority) || 0) + 1);
    }

    return {
      totalOwnershipRecords: this.ownershipRecords.size,
      totalOwnershipTransfers: this.ownershipTransfers.size,
      byKind,
      byType,
      byAuthority,
    };
  }

  /**
   * Validate ownership
   */
  validateOwnership(
    owner: SymbolID,
    target: SymbolID,
    kind: OwnershipKind,
    requiredType?: OwnershipType
  ): { valid: boolean; reason?: string } {
    const records = this.getOwnershipByTarget(target);
    
    for (const record of records) {
      if (record.owner === owner && record.kind === kind) {
        if (requiredType === undefined || record.ownershipType === requiredType) {
          // Check conditions
          if (record.conditions.length === 0) {
            return { valid: true };
          }
          
          // TODO: Evaluate conditions
          return { valid: true };
        } else {
          return {
            valid: false,
            reason: `Ownership type mismatch: expected ${requiredType}, got ${record.ownershipType}`,
          };
        }
      }
    }
    
    return {
      valid: false,
      reason: `No ownership record found for ${owner} over ${target} with kind ${kind}`,
    };
  }
}
