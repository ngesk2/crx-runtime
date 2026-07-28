/**
 * Architecture Diff Engine
 * 
 * Git diff:
 * + line 17
 * 
 * isn't useful.
 * 
 * Instead:
 * - Authority changed
 * - Ownership transferred
 * - Capability widened
 * - Trust boundary weakened
 * - Persistence removed
 * 
 * Semantic diffs.
 */

import { SymbolID } from '../ir/node-types';
import { SemanticIRNode } from '../lowering/semantic-lowerer';
import { CanonicalSymbol } from '../lowering/semantic-lowerer';

/**
 * Diff Type
 */
export enum DiffType {
  Added = 'Added',
  Removed = 'Removed',
  Modified = 'Modified',
  Unchanged = 'Unchanged',
}

/**
 * Semantic Diff Type
 */
export enum SemanticDiffType {
  AuthorityChanged = 'AuthorityChanged',
  OwnershipTransferred = 'OwnershipTransferred',
  CapabilityWidened = 'CapabilityWidened',
  CapabilityNarrowed = 'CapabilityNarrowed',
  CapabilityAdded = 'CapabilityAdded',
  CapabilityRemoved = 'CapabilityRemoved',
  TrustBoundaryWeakened = 'TrustBoundaryWeakened',
  TrustBoundaryStrengthened = 'TrustBoundaryStrengthened',
  PersistenceAdded = 'PersistenceAdded',
  PersistenceRemoved = 'PersistenceRemoved',
  MutationAdded = 'MutationAdded',
  MutationRemoved = 'MutationRemoved',
  EventAdded = 'EventAdded',
  EventRemoved = 'EventRemoved',
}

/**
 * Semantic Diff
 */
export interface SemanticDiff {
  id: SymbolID;
  type: DiffType;
  semanticType: SemanticDiffType;
  symbol: SymbolID;
  before?: any;
  after?: any;
  description: string;
  impact: 'Critical' | 'High' | 'Medium' | 'Low';
}

/**
 * Architecture Diff
 */
export interface ArchitectureDiff {
  fromCommit: string;
  toCommit: string;
  timestamp: string;
  semanticDiffs: SemanticDiff[];
  summary: DiffSummary;
}

/**
 * Diff Summary
 */
export interface DiffSummary {
  totalChanges: number;
  added: number;
  removed: number;
  modified: number;
  byType: Record<SemanticDiffType, number>;
  byImpact: Record<string, number>;
}

/**
 * Architecture Diff Engine
 */
export class ArchitectureDiffEngine {
  private diffs: Map<string, ArchitectureDiff> = new Map();

  /**
   * Compute architecture diff between two commits
   */
  computeDiff(
    fromCommit: string,
    toCommit: string,
    beforeIR: Map<SymbolID, SemanticIRNode>,
    afterIR: Map<SymbolID, SemanticIRNode>,
    beforeSymbols: Map<SymbolID, CanonicalSymbol>,
    afterSymbols: Map<SymbolID, CanonicalSymbol>
  ): ArchitectureDiff {
    const semanticDiffs: SemanticDiff[] = [];

    // Find added symbols
    for (const [symbolId, symbol] of afterSymbols) {
      if (!beforeSymbols.has(symbolId)) {
        semanticDiffs.push({
          id: `diff-added-${symbolId}`,
          type: DiffType.Added,
          semanticType: SemanticDiffType.CapabilityAdded,
          symbol: symbolId,
          after: symbol,
          description: `Added symbol: ${symbol.name}`,
          impact: 'Medium',
        });
      }
    }

    // Find removed symbols
    for (const [symbolId, symbol] of beforeSymbols) {
      if (!afterSymbols.has(symbolId)) {
        semanticDiffs.push({
          id: `diff-removed-${symbolId}`,
          type: DiffType.Removed,
          semanticType: SemanticDiffType.CapabilityRemoved,
          symbol: symbolId,
          before: symbol,
          description: `Removed symbol: ${symbol.name}`,
          impact: 'High',
        });
      }
    }

    // Find modified symbols
    for (const [symbolId, afterSymbol] of afterSymbols) {
      const beforeSymbol = beforeSymbols.get(symbolId);
      if (!beforeSymbol) continue;

      const beforeNode = beforeIR.get(symbolId);
      const afterNode = afterIR.get(symbolId);
      if (!beforeNode || !afterNode) continue;

      // Check for authority changes
      if (beforeNode.authorityRequired !== afterNode.authorityRequired) {
        semanticDiffs.push({
          id: `diff-authority-${symbolId}`,
          type: DiffType.Modified,
          semanticType: SemanticDiffType.AuthorityChanged,
          symbol: symbolId,
          before: beforeNode.authorityRequired,
          after: afterNode.authorityRequired,
          description: `Authority changed from ${beforeNode.authorityRequired} to ${afterNode.authorityRequired}`,
          impact: 'Critical',
        });
      }

      // Check for capability changes
      const beforeCapabilities = new Set(beforeNode.capabilitiesConsumed);
      const afterCapabilities = new Set(afterNode.capabilitiesConsumed);
      
      for (const capability of afterCapabilities) {
        if (!beforeCapabilities.has(capability)) {
          semanticDiffs.push({
            id: `diff-capability-added-${symbolId}-${capability}`,
            type: DiffType.Modified,
            semanticType: SemanticDiffType.CapabilityAdded,
            symbol: symbolId,
            before: null,
            after: capability,
            description: `Added capability: ${capability}`,
            impact: 'High',
          });
        }
      }
      
      for (const capability of beforeCapabilities) {
        if (!afterCapabilities.has(capability)) {
          semanticDiffs.push({
            id: `diff-capability-removed-${symbolId}-${capability}`,
            type: DiffType.Modified,
            semanticType: SemanticDiffType.CapabilityRemoved,
            symbol: symbolId,
            before: capability,
            after: null,
            description: `Removed capability: ${capability}`,
            impact: 'Critical',
          });
        }
      }

      // Check for persistence changes
      const beforePersistence = beforeNode.persistenceActions.length;
      const afterPersistence = afterNode.persistenceActions.length;
      
      if (afterPersistence > beforePersistence) {
        semanticDiffs.push({
          id: `diff-persistence-added-${symbolId}`,
          type: DiffType.Modified,
          semanticType: SemanticDiffType.PersistenceAdded,
          symbol: symbolId,
          before: beforePersistence,
          after: afterPersistence,
          description: `Added persistence actions`,
          impact: 'High',
        });
      } else if (afterPersistence < beforePersistence) {
        semanticDiffs.push({
          id: `diff-persistence-removed-${symbolId}`,
          type: DiffType.Modified,
          semanticType: SemanticDiffType.PersistenceRemoved,
          symbol: symbolId,
          before: beforePersistence,
          after: afterPersistence,
          description: `Removed persistence actions`,
          impact: 'Critical',
        });
      }

      // Check for mutation changes
      const beforeMutations = beforeNode.stateMutations.length;
      const afterMutations = afterNode.stateMutations.length;
      
      if (afterMutations > beforeMutations) {
        semanticDiffs.push({
          id: `diff-mutation-added-${symbolId}`,
          type: DiffType.Modified,
          semanticType: SemanticDiffType.MutationAdded,
          symbol: symbolId,
          before: beforeMutations,
          after: afterMutations,
          description: `Added mutation actions`,
          impact: 'High',
        });
      } else if (afterMutations < beforeMutations) {
        semanticDiffs.push({
          id: `diff-mutation-removed-${symbolId}`,
          type: DiffType.Modified,
          semanticType: SemanticDiffType.MutationRemoved,
          symbol: symbolId,
          before: beforeMutations,
          after: afterMutations,
          description: `Removed mutation actions`,
          impact: 'Critical',
        });
      }

      // Check for event changes
      const beforeEvents = beforeNode.eventsEmitted.length;
      const afterEvents = afterNode.eventsEmitted.length;
      
      if (afterEvents > beforeEvents) {
        semanticDiffs.push({
          id: `diff-event-added-${symbolId}`,
          type: DiffType.Modified,
          semanticType: SemanticDiffType.EventAdded,
          symbol: symbolId,
          before: beforeEvents,
          after: afterEvents,
          description: `Added event emissions`,
          impact: 'Medium',
        });
      } else if (afterEvents < beforeEvents) {
        semanticDiffs.push({
          id: `diff-event-removed-${symbolId}`,
          type: DiffType.Modified,
          semanticType: SemanticDiffType.EventRemoved,
          symbol: symbolId,
          before: beforeEvents,
          after: afterEvents,
          description: `Removed event emissions`,
          impact: 'Medium',
        });
      }

      // Check for trust changes
      const beforeTrust = beforeNode.trustTransitions.length;
      const afterTrust = afterNode.trustTransitions.length;
      
      if (afterTrust > beforeTrust) {
        semanticDiffs.push({
          id: `diff-trust-strengthened-${symbolId}`,
          type: DiffType.Modified,
          semanticType: SemanticDiffType.TrustBoundaryStrengthened,
          symbol: symbolId,
          before: beforeTrust,
          after: afterTrust,
          description: `Added trust transitions`,
          impact: 'High',
        });
      } else if (afterTrust < beforeTrust) {
        semanticDiffs.push({
          id: `diff-trust-weakened-${symbolId}`,
          type: DiffType.Modified,
          semanticType: SemanticDiffType.TrustBoundaryWeakened,
          symbol: symbolId,
          before: beforeTrust,
          after: afterTrust,
          description: `Removed trust transitions`,
          impact: 'Critical',
        });
      }
    }

    const summary = this.computeSummary(semanticDiffs);

    const diff: ArchitectureDiff = {
      fromCommit,
      toCommit,
      timestamp: new Date().toISOString(),
      semanticDiffs,
      summary,
    };

    const diffKey = `${fromCommit}:${toCommit}`;
    this.diffs.set(diffKey, diff);

    return diff;
  }

  /**
   * Compute diff summary
   */
  private computeSummary(diffs: SemanticDiff[]): DiffSummary {
    const byType: Record<SemanticDiffType, number> = {} as any;
    const byImpact: Record<string, number> = {} as any;
    let added = 0;
    let removed = 0;
    let modified = 0;

    for (const diff of diffs) {
      byType[diff.semanticType] = (byType[diff.semanticType] || 0) + 1;
      byImpact[diff.impact] = (byImpact[diff.impact] || 0) + 1;

      switch (diff.type) {
        case DiffType.Added:
          added++;
          break;
        case DiffType.Removed:
          removed++;
          break;
        case DiffType.Modified:
          modified++;
          break;
      }
    }

    return {
      totalChanges: diffs.length,
      added,
      removed,
      modified,
      byType,
      byImpact,
    };
  }

  /**
   * Get diff by commits
   */
  getDiff(fromCommit: string, toCommit: string): ArchitectureDiff | undefined {
    const diffKey = `${fromCommit}:${toCommit}`;
    return this.diffs.get(diffKey);
  }

  /**
   * Get all diffs
   */
  getAllDiffs(): ArchitectureDiff[] {
    return Array.from(this.diffs.values());
  }

  /**
   * Get diffs by type
   */
  getDiffsByType(semanticType: SemanticDiffType): SemanticDiff[] {
    const allDiffs: SemanticDiff[] = [];

    for (const diff of this.diffs.values()) {
      allDiffs.push(...diff.semanticDiffs.filter(d => d.semanticType === semanticType));
    }

    return allDiffs;
  }

  /**
   * Get diffs by impact
   */
  getDiffsByImpact(impact: string): SemanticDiff[] {
    const allDiffs: SemanticDiff[] = [];

    for (const diff of this.diffs.values()) {
      allDiffs.push(...diff.semanticDiffs.filter(d => d.impact === impact));
    }

    return allDiffs;
  }

  /**
   * Get critical diffs
   */
  getCriticalDiffs(): SemanticDiff[] {
    return this.getDiffsByImpact('Critical');
  }

  /**
   * Clear all diffs
   */
  clear(): void {
    this.diffs.clear();
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalDiffs: number;
    totalChanges: number;
    averageChangesPerDiff: number;
    byType: Record<SemanticDiffType, number>;
    byImpact: Record<string, number>;
  } {
    const diffs = this.getAllDiffs();
    const totalChanges = diffs.reduce((sum, diff) => sum + diff.summary.totalChanges, 0);
    const byType: Record<SemanticDiffType, number> = {} as any;
    const byImpact: Record<string, number> = {} as any;

    for (const diff of diffs) {
      for (const type in diff.summary.byType) {
        byType[type as SemanticDiffType] = (byType[type as SemanticDiffType] || 0) + diff.summary.byType[type as SemanticDiffType];
      }
      for (const impact in diff.summary.byImpact) {
        byImpact[impact] = (byImpact[impact] || 0) + diff.summary.byImpact[impact];
      }
    }

    return {
      totalDiffs: diffs.length,
      totalChanges,
      averageChangesPerDiff: diffs.length > 0 ? totalChanges / diffs.length : 0,
      byType,
      byImpact,
    };
  }

  /**
   * Export to JSON
   */
  exportToJSON(): string {
    return JSON.stringify(this.getAllDiffs(), null, 2);
  }

  /**
   * Import from JSON
   */
  importFromJSON(json: string): void {
    const diffs: ArchitectureDiff[] = JSON.parse(json);
    
    for (const diff of diffs) {
      const diffKey = `${diff.fromCommit}:${diff.toCommit}`;
      this.diffs.set(diffKey, diff);
    }
  }
}
