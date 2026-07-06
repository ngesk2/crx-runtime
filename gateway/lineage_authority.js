/**
 * Lineage Authority
 * 
 * Phase 46 Constitutional Freeze — Pure Lineage Edge Creation
 * 
 * Constitutional Constraint: LineageAuthority has no mutable state.
 * 
 * Removed:
 * - lineageEdges Map (mutable state)
 * - executionLineage Map (mutable state)
 * - in-memory lineage queries (getLineageForArtifact, getAncestors, getDescendants)
 * - event emission (delegated to ExecutionRuntime)
 * 
 * LineageAuthority now provides only:
 * - LineageEdge creation
 * - Lineage witness generation
 * - Persistence delegation
 * 
 * Lineage queries should go through persistence layer.
 * 
 * PATCH_004: Moved to runtime/kernel/authorities/
 * This file is now a gateway shim that re-exports from kernel
 */

const { LineageAuthority: KernelLineageAuthority } = require('../runtime/kernel/authorities/lineage_authority');

// PATCH_004: Gateway shim - delegates to kernel implementation
class LineageAuthority extends KernelLineageAuthority {
  // No additional methods needed - pure delegation
}

module.exports = { LineageAuthority };
