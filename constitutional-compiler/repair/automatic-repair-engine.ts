/**
 * Automatic Repair Engine
 * 
 * Huge feature.
 * 
 * Instead of:
 * Violation
 * 
 * produce:
 * Patch
 * 
 * Move authority
 * Rename capability
 * Insert ownership
 * Split repository
 * Generate event
 * Add persistence boundary
 * 
 * Basically: Constitutional AutoFix.
 */

import { SymbolID } from '../ir/node-types';
import { SemanticIRNode } from '../lowering/semantic-lowerer';
import { CanonicalSymbol } from '../lowering/semantic-lowerer';
import { Diagnostic } from '../diagnostics/constitutional-diagnostics';

/**
 * Repair Type
 */
export enum RepairType {
  MoveAuthority = 'MoveAuthority',
  RenameCapability = 'RenameCapability',
  InsertOwnership = 'InsertOwnership',
  RemoveOwnership = 'RemoveOwnership',
  SplitRepository = 'SplitRepository',
  GenerateEvent = 'GenerateEvent',
  AddPersistenceBoundary = 'AddPersistenceBoundary',
  RemovePersistenceBoundary = 'RemovePersistenceBoundary',
  AddCapability = 'AddCapability',
  RemoveCapability = 'RemoveCapability',
  AddTrust = 'AddTrust',
  RemoveTrust = 'RemoveTrust',
  AddIdentity = 'AddIdentity',
  RemoveIdentity = 'RemoveIdentity',
}

/**
 * Repair Action
 */
export interface RepairAction {
  id: SymbolID;
  type: RepairType;
  target: SymbolID;
  from?: SymbolID;
  to?: SymbolID;
  description: string;
  confidence: number;
  risk: 'Low' | 'Medium' | 'High';
}

/**
 * Repair Patch
 */
export interface RepairPatch {
  id: SymbolID;
  diagnosticId: SymbolID;
  actions: RepairAction[];
  description: string;
  estimatedImpact: 'Small' | 'Medium' | 'Large';
  confidence: number;
  risk: 'Low' | 'Medium' | 'High';
  timestamp: string;
}

/**
 * Applied Repair
 */
export interface AppliedRepair {
  patchId: SymbolID;
  actions: RepairAction[];
  success: boolean;
  error?: string;
  timestamp: string;
}

/**
 * Automatic Repair Engine
 */
export class AutomaticRepairEngine {
  private patches: Map<SymbolID, RepairPatch> = new Map();
  private appliedRepairs: Map<SymbolID, AppliedRepair> = new Map();

  /**
   * Generate repair patch for diagnostic
   */
  generateRepairPatch(
    diagnostic: Diagnostic,
    semanticIR: Map<SymbolID, SemanticIRNode>,
    canonicalSymbols: Map<SymbolID, CanonicalSymbol>
  ): RepairPatch {
    const actions = this.generateRepairActions(diagnostic, semanticIR, canonicalSymbols);
    const description = this.generatePatchDescription(actions);
    const estimatedImpact = this.estimateImpact(actions);
    const confidence = this.computeConfidence(actions);
    const risk = this.computeRisk(actions);

    const patch: RepairPatch = {
      id: `patch-${diagnostic.id}`,
      diagnosticId: diagnostic.id,
      actions,
      description,
      estimatedImpact,
      confidence,
      risk,
      timestamp: new Date().toISOString(),
    };

    this.patches.set(patch.id, patch);
    return patch;
  }

  /**
   * Generate repair actions
   */
  private generateRepairActions(
    diagnostic: Diagnostic,
    semanticIR: Map<SymbolID, SemanticIRNode>,
    canonicalSymbols: Map<SymbolID, CanonicalSymbol>
  ): RepairAction[] {
    const actions: RepairAction[] = [];

    // Generate actions based on diagnostic type and evidence
    switch (diagnostic.type) {
      case 'Violation':
        actions.push(...this.generateViolationRepairs(diagnostic, semanticIR));
        break;
      case 'Warning':
        actions.push(...this.generateWarningRepairs(diagnostic, semanticIR));
        break;
      default:
        break;
    }

    return actions;
  }

  /**
   * Generate violation repairs
   */
  private generateViolationRepairs(
    diagnostic: Diagnostic,
    semanticIR: Map<SymbolID, SemanticIRNode>
  ): RepairAction[] {
    const actions: RepairAction[] = [];

    // Check if it's an ownership violation
    if (diagnostic.message.includes('does not own')) {
      actions.push({
        id: `repair-insert-ownership-${Date.now()}`,
        type: RepairType.InsertOwnership,
        target: diagnostic.evidence.symbol,
        to: diagnostic.evidence.target,
        description: `Insert ownership from ${diagnostic.evidence.symbol} to ${diagnostic.evidence.target}`,
        confidence: 0.8,
        risk: 'Medium',
      });
    }

    // Check if it's a capability violation
    if (diagnostic.message.includes('Missing capability')) {
      actions.push({
        id: `repair-add-capability-${Date.now()}`,
        type: RepairType.AddCapability,
        target: diagnostic.evidence.symbol,
        description: `Add required capability to ${diagnostic.evidence.symbol}`,
        confidence: 0.7,
        risk: 'Low',
      });
    }

    // Check if it's a persistence violation
    if (diagnostic.message.includes('does not own persistence')) {
      actions.push({
        id: `repair-move-persistence-${Date.now()}`,
        type: RepairType.MoveAuthority,
        target: diagnostic.evidence.symbol,
        description: `Move persistence operations into owning authority`,
        confidence: 0.9,
        risk: 'High',
      });
    }

    return actions;
  }

  /**
   * Generate warning repairs
   */
  private generateWarningRepairs(
    diagnostic: Diagnostic,
    semanticIR: Map<SymbolID, SemanticIRNode>
  ): RepairAction[] {
    const actions: RepairAction[] = [];

    // Generate less aggressive repairs for warnings
    if (diagnostic.message.includes('duplicate')) {
      actions.push({
        id: `repair-remove-duplicate-${Date.now()}`,
        type: RepairType.RemoveOwnership,
        target: diagnostic.evidence.symbol,
        description: `Remove duplicate ownership`,
        confidence: 0.6,
        risk: 'Low',
      });
    }

    return actions;
  }

  /**
   * Generate patch description
   */
  private generatePatchDescription(actions: RepairAction[]): string {
    if (actions.length === 0) {
      return 'No repair actions available';
    }

    const descriptions = actions.map(a => a.description);
    return `Apply the following repairs: ${descriptions.join('; ')}`;
  }

  /**
   * Estimate impact
   */
  private estimateImpact(actions: RepairAction[]): 'Small' | 'Medium' | 'Large' {
    if (actions.length === 0) return 'Small';
    
    const highRiskActions = actions.filter(a => a.risk === 'High').length;
    if (highRiskActions > 0) return 'Large';
    
    if (actions.length > 3) return 'Medium';
    
    return 'Small';
  }

  /**
   * Compute confidence
   */
  private computeConfidence(actions: RepairAction[]): number {
    if (actions.length === 0) return 0.0;
    
    const totalConfidence = actions.reduce((sum, a) => sum + a.confidence, 0);
    return totalConfidence / actions.length;
  }

  /**
   * Compute risk
   */
  private computeRisk(actions: RepairAction[]): 'Low' | 'Medium' | 'High' {
    if (actions.length === 0) return 'Low';
    
    const highRiskActions = actions.filter(a => a.risk === 'High').length;
    if (highRiskActions > 0) return 'High';
    
    const mediumRiskActions = actions.filter(a => a.risk === 'Medium').length;
    if (mediumRiskActions > 0) return 'Medium';
    
    return 'Low';
  }

  /**
   * Apply repair patch
   */
  async applyRepairPatch(
    patch: RepairPatch,
    semanticIR: Map<SymbolID, SemanticIRNode>,
    canonicalSymbols: Map<SymbolID, CanonicalSymbol>
  ): Promise<AppliedRepair> {
    const appliedActions: RepairAction[] = [];
    let success = true;
    let error: string | undefined;

    for (const action of patch.actions) {
      try {
        await this.applyRepairAction(action, semanticIR, canonicalSymbols);
        appliedActions.push(action);
      } catch (e) {
        success = false;
        error = e instanceof Error ? e.message : String(e);
        break;
      }
    }

    const appliedRepair: AppliedRepair = {
      patchId: patch.id,
      actions: appliedActions,
      success,
      error,
      timestamp: new Date().toISOString(),
    };

    this.appliedRepairs.set(patch.id, appliedRepair);
    return appliedRepair;
  }

  /**
   * Apply repair action
   */
  private async applyRepairAction(
    action: RepairAction,
    semanticIR: Map<SymbolID, SemanticIRNode>,
    canonicalSymbols: Map<SymbolID, CanonicalSymbol>
  ): Promise<void> {
    switch (action.type) {
      case RepairType.MoveAuthority:
        await this.applyMoveAuthority(action, semanticIR);
        break;
      case RepairType.InsertOwnership:
        await this.applyInsertOwnership(action, semanticIR);
        break;
      case RepairType.RemoveOwnership:
        await this.applyRemoveOwnership(action, semanticIR);
        break;
      case RepairType.AddCapability:
        await this.applyAddCapability(action, semanticIR);
        break;
      case RepairType.RemoveCapability:
        await this.applyRemoveCapability(action, semanticIR);
        break;
      default:
        throw new Error(`Repair type not implemented: ${action.type}`);
    }
  }

  /**
   * Apply move authority
   */
  private async applyMoveAuthority(
    action: RepairAction,
    semanticIR: Map<SymbolID, SemanticIRNode>
  ): Promise<void> {
    const node = semanticIR.get(action.target);
    if (!node) {
      throw new Error(`Target node not found: ${action.target}`);
    }

    if (action.to) {
      node.authorityRequired = action.to;
    }
  }

  /**
   * Apply insert ownership
   */
  private async applyInsertOwnership(
    action: RepairAction,
    semanticIR: Map<SymbolID, SemanticIRNode>
  ): Promise<void> {
    const node = semanticIR.get(action.target);
    if (!node) {
      throw new Error(`Target node not found: ${action.target}`);
    }

    if (action.to) {
      node.authorityRequired = action.to;
    }
  }

  /**
   * Apply remove ownership
   */
  private async applyRemoveOwnership(
    action: RepairAction,
    semanticIR: Map<SymbolID, SemanticIRNode>
  ): Promise<void> {
    const node = semanticIR.get(action.target);
    if (!node) {
      throw new Error(`Target node not found: ${action.target}`);
    }

    node.authorityRequired = undefined;
  }

  /**
   * Apply add capability
   */
  private async applyAddCapability(
    action: RepairAction,
    semanticIR: Map<SymbolID, SemanticIRNode>
  ): Promise<void> {
    const node = semanticIR.get(action.target);
    if (!node) {
      throw new Error(`Target node not found: ${action.target}`);
    }

    if (action.to) {
      node.capabilitiesConsumed.push(action.to);
    }
  }

  /**
   * Apply remove capability
   */
  private async applyRemoveCapability(
    action: RepairAction,
    semanticIR: Map<SymbolID, SemanticIRNode>
  ): Promise<void> {
    const node = semanticIR.get(action.target);
    if (!node) {
      throw new Error(`Target node not found: ${action.target}`);
    }

    if (action.to) {
      const index = node.capabilitiesConsumed.indexOf(action.to);
      if (index > -1) {
        node.capabilitiesConsumed.splice(index, 1);
      }
    }
  }

  /**
   * Get patch by ID
   */
  getPatch(id: SymbolID): RepairPatch | undefined {
    return this.patches.get(id);
  }

  /**
   * Get patches by diagnostic
   */
  getPatchesByDiagnostic(diagnosticId: SymbolID): RepairPatch[] {
    return Array.from(this.patches.values()).filter(p => p.diagnosticId === diagnosticId);
  }

  /**
   * Get all patches
   */
  getAllPatches(): RepairPatch[] {
    return Array.from(this.patches.values());
  }

  /**
   * Get applied repair by patch ID
   */
  getAppliedRepair(patchId: SymbolID): AppliedRepair | undefined {
    return this.appliedRepairs.get(patchId);
  }

  /**
   * Get all applied repairs
   */
  getAllAppliedRepairs(): AppliedRepair[] {
    return Array.from(this.appliedRepairs.values());
  }

  /**
   * Clear all patches
   */
  clear(): void {
    this.patches.clear();
    this.appliedRepairs.clear();
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalPatches: number;
    totalApplied: number;
    successful: number;
    failed: number;
    byRisk: Record<string, number>;
    averageConfidence: number;
  } {
    const byRisk: Record<string, number> = {} as any;
    let totalConfidence = 0;
    let successful = 0;
    let failed = 0;

    for (const patch of this.patches.values()) {
      byRisk[patch.risk] = (byRisk[patch.risk] || 0) + 1;
      totalConfidence += patch.confidence;
    }

    for (const applied of this.appliedRepairs.values()) {
      if (applied.success) {
        successful++;
      } else {
        failed++;
      }
    }

    return {
      totalPatches: this.patches.size,
      totalApplied: this.appliedRepairs.size,
      successful,
      failed,
      byRisk,
      averageConfidence: this.patches.size > 0 ? totalConfidence / this.patches.size : 0,
    };
  }

  /**
   * Export to JSON
   */
  exportToJSON(): string {
    const data = {
      patches: Array.from(this.patches.values()),
      appliedRepairs: Array.from(this.appliedRepairs.values()),
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import from JSON
   */
  importFromJSON(json: string): void {
    const data = JSON.parse(json);
    
    for (const patch of data.patches) {
      this.patches.set(patch.id, patch);
    }
    
    for (const applied of data.appliedRepairs) {
      this.appliedRepairs.set(applied.patchId, applied);
    }
  }
}
