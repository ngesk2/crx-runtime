/**
 * Lineage Verifier
 * Verifies lineage and provenance of canonical objects.
 */

import { CanonicalObject } from '../canonical/canonical-object';

export interface LineageVerificationResult {
  objectId: string;
  timestamp: string;
  status: 'verified' | 'failed';
  errors: string[];
  warnings: string[];
  lineageChain: LineageNode[];
}

export interface LineageNode {
  objectId: string;
  stage: string;
  timestamp: string;
  parentId?: string;
}

export class LineageVerifier {
  async verifyLineage(object: CanonicalObject): Promise<LineageVerificationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const lineageChain: LineageNode[] = [];
    
    // Verify provenance
    if (!object.provenance.source_id) {
      errors.push('Object missing source ID');
    }
    
    if (!object.provenance.origin) {
      errors.push('Object missing origin');
    }
    
    // Verify lineage chain
    const chain = this.buildLineageChain(object);
    lineageChain.push(...chain);
    
    // Verify each lineage node
    for (const node of chain) {
      if (!node.objectId) {
        errors.push('Lineage node missing object ID');
      }
      
      if (!node.stage) {
        errors.push('Lineage node missing stage');
      }
      
      if (!node.timestamp) {
        warnings.push('Lineage node missing timestamp');
      }
    }
    
    // Verify no cycles
    if (this.hasCycle(lineageChain)) {
      errors.push('Lineage contains cycles');
    }
    
    return {
      objectId: object.identity.id.hash,
      timestamp: new Date().toISOString(),
      status: errors.length === 0 ? 'verified' : 'failed',
      errors,
      warnings,
      lineageChain,
    };
  }
  
  private buildLineageChain(object: CanonicalObject): LineageNode[] {
    const chain: LineageNode[] = [];
    
    for (const parentId of object.provenance.parents) {
      chain.push({
        objectId: parentId,
        stage: object.provenance.origin,
        timestamp: object.metadata.created_at,
        parentId,
      });
    }
    
    return chain;
  }
  
  private hasCycle(chain: LineageNode[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    for (const node of chain) {
      if (this.hasCycleDFS(node, chain, visited, recursionStack)) {
        return true;
      }
    }
    
    return false;
  }
  
  private hasCycleDFS(
    node: LineageNode,
    chain: LineageNode[],
    visited: Set<string>,
    recursionStack: Set<string>
  ): boolean {
    if (recursionStack.has(node.objectId)) {
      return true;
    }
    
    if (visited.has(node.objectId)) {
      return false;
    }
    
    visited.add(node.objectId);
    recursionStack.add(node.objectId);
    
    const children = chain.filter(n => n.parentId === node.objectId);
    for (const child of children) {
      if (this.hasCycleDFS(child, chain, visited, recursionStack)) {
        return true;
      }
    }
    
    recursionStack.delete(node.objectId);
    return false;
  }
}
