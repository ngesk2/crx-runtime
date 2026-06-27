/**
 * Git as Infrastructure
 * 
 * Git should become infrastructure—not just source control.
 * 
 * Instead of thinking of Git as version control, think:
 * - Immutable constitutional history
 * - Evidence provenance
 * - Rule evolution
 * - Compiler reproducibility
 * - Distributed collaboration
 * 
 * Every compiler run should know exactly:
 * - commit SHA
 * - tree hash
 * - compiler version
 * - registry version
 * - rule version
 * - semantic IR version
 * 
 * This gives you reproducible audits.
 * 
 * Pull requests should be treated as constitutional proposals rather than just code changes:
 * - PR → Semantic diff
 * - Graph diff
 * - Capability diff
 * - Authority diff
 * - Ownership diff
 * - Constitutional violations
 * - Required reviewers
 * - Merge
 */

import { SymbolID } from '../ir/node-types';
import { SemanticIRNode } from '../lowering/semantic-lowerer';
import { CanonicalSymbol } from '../lowering/semantic-lowerer';

/**
 * Git Commit
 */
export interface GitCommit {
  sha: string;
  treeHash: string;
  parentSHAs: string[];
  author: string;
  authorEmail: string;
  authorDate: string;
  committer: string;
  committerEmail: string;
  committerDate: string;
  message: string;
}

/**
 * Compiler Run Metadata
 */
export interface CompilerRunMetadata {
  commitSHA: string;
  treeHash: string;
  compilerVersion: string;
  registryVersion: string;
  ruleVersion: string;
  semanticIRVersion: string;
  timestamp: string;
  runId: SymbolID;
}

/**
 * Semantic Diff
 */
export interface SemanticDiff {
  addedSymbols: SymbolID[];
  removedSymbols: SymbolID[];
  modifiedSymbols: Map<SymbolID, { before: SemanticIRNode; after: SemanticIRNode }>;
  ownershipChanges: OwnershipChange[];
  capabilityChanges: CapabilityChange[];
  authorityChanges: AuthorityChange[];
}

/**
 * Ownership Change
 */
export interface OwnershipChange {
  symbol: SymbolID;
  from: SymbolID | null;
  to: SymbolID | null;
  changeType: 'granted' | 'revoked' | 'transferred';
}

/**
 * Capability Change
 */
export interface CapabilityChange {
  symbol: SymbolID;
  capability: SymbolID;
  changeType: 'granted' | 'revoked';
  from: SymbolID | null;
  to: SymbolID | null;
}

/**
 * Authority Change
 */
export interface AuthorityChange {
  symbol: SymbolID;
  authority: SymbolID;
  changeType: 'assigned' | 'reassigned' | 'removed';
  from: SymbolID | null;
  to: SymbolID | null;
}

/**
 * Graph Diff
 */
export interface GraphDiff {
  graphType: string;
  addedNodes: SymbolID[];
  removedNodes: SymbolID[];
  addedEdges: GraphEdge[];
  removedEdges: GraphEdge[];
  modifiedEdges: GraphEdge[];
}

/**
 * Graph Edge
 */
export interface GraphEdge {
  from: SymbolID;
  to: SymbolID;
  type: string;
}

/**
 * Constitutional Violation
 */
export interface ConstitutionalViolation {
  ruleId: SymbolID;
  violationType: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  symbol: SymbolID;
  description: string;
  evidence: SymbolID[];
  requiredReviewer?: SymbolID;
}

/**
 * PR Proposal
 */
export interface PRProposal {
  prNumber: number;
  title: string;
  description: string;
  sourceCommit: GitCommit;
  targetCommit: GitCommit;
  semanticDiff: SemanticDiff;
  graphDiffs: GraphDiff[];
  constitutionalViolations: ConstitutionalViolation[];
  requiredReviewers: SymbolID[];
  approvedReviewers: SymbolID[];
  mergeable: boolean;
}

/**
 * Git Infrastructure Engine
 */
export class GitInfrastructureEngine {
  private compilerRuns: Map<SymbolID, CompilerRunMetadata> = new Map();
  private commitHistory: Map<string, GitCommit> = new Map();
  private semanticDiffs: Map<string, SemanticDiff> = new Map();
  private graphDiffs: Map<string, GraphDiff[]> = new Map();
  private prProposals: Map<number, PRProposal> = new Map();

  /**
   * Record compiler run
   */
  recordCompilerRun(
    commitSHA: string,
    treeHash: string,
    compilerVersion: string,
    registryVersion: string,
    ruleVersion: string,
    semanticIRVersion: string
  ): CompilerRunMetadata {
    const runId = `run-${commitSHA}-${Date.now()}`;
    const metadata: CompilerRunMetadata = {
      commitSHA,
      treeHash,
      compilerVersion,
      registryVersion,
      ruleVersion,
      semanticIRVersion,
      timestamp: new Date().toISOString(),
      runId,
    };

    this.compilerRuns.set(runId, metadata);
    return metadata;
  }

  /**
   * Record git commit
   */
  recordGitCommit(commit: GitCommit): void {
    this.commitHistory.set(commit.sha, commit);
  }

  /**
   * Compute semantic diff between two commits
   */
  computeSemanticDiff(
    beforeCommit: string,
    afterCommit: string,
    beforeIR: Map<SymbolID, SemanticIRNode>,
    afterIR: Map<SymbolID, SemanticIRNode>
  ): SemanticDiff {
    const addedSymbols: SymbolID[] = [];
    const removedSymbols: SymbolID[] = [];
    const modifiedSymbols = new Map<SymbolID, { before: SemanticIRNode; after: SemanticIRNode }>();
    const ownershipChanges: OwnershipChange[] = [];
    const capabilityChanges: CapabilityChange[] = [];
    const authorityChanges: AuthorityChange[] = [];

    // Find added symbols
    for (const [id, node] of afterIR) {
      if (!beforeIR.has(id)) {
        addedSymbols.push(id);
      }
    }

    // Find removed symbols
    for (const [id, node] of beforeIR) {
      if (!afterIR.has(id)) {
        removedSymbols.push(id);
      }
    }

    // Find modified symbols
    for (const [id, afterNode] of afterIR) {
      const beforeNode = beforeIR.get(id);
      if (beforeNode && !this.nodesEqual(beforeNode, afterNode)) {
        modifiedSymbols.set(id, { before: beforeNode, after: afterNode });

        // Check for ownership changes
        if (beforeNode.authorityRequired !== afterNode.authorityRequired) {
          ownershipChanges.push({
            symbol: id,
            from: beforeNode.authorityRequired || null,
            to: afterNode.authorityRequired || null,
            changeType: afterNode.authorityRequired ? 'granted' : 'revoked',
          });
        }

        // Check for capability changes
        const beforeCapabilities = new Set(beforeNode.capabilitiesConsumed);
        const afterCapabilities = new Set(afterNode.capabilitiesConsumed);
        
        for (const cap of afterCapabilities) {
          if (!beforeCapabilities.has(cap)) {
            capabilityChanges.push({
              symbol: id,
              capability: cap,
              changeType: 'granted',
              from: null,
              to: cap,
            });
          }
        }
        
        for (const cap of beforeCapabilities) {
          if (!afterCapabilities.has(cap)) {
            capabilityChanges.push({
              symbol: id,
              capability: cap,
              changeType: 'revoked',
              from: cap,
              to: null,
            });
          }
        }
      }
    }

    const diff: SemanticDiff = {
      addedSymbols,
      removedSymbols,
      modifiedSymbols,
      ownershipChanges,
      capabilityChanges,
      authorityChanges,
    };

    const diffKey = `${beforeCommit}:${afterCommit}`;
    this.semanticDiffs.set(diffKey, diff);

    return diff;
  }

  /**
   * Compute graph diff between two commits
   */
  computeGraphDiff(
    beforeCommit: string,
    afterCommit: string,
    beforeGraph: Map<SymbolID, GraphEdge[]>,
    afterGraph: Map<SymbolID, GraphEdge[]>
  ): GraphDiff[] {
    const diffs: GraphDiff[] = [];

    // Compute diff for each graph type
    const graphTypes = new Set([...beforeGraph.keys(), ...afterGraph.keys()]);

    for (const graphType of graphTypes) {
      const beforeEdges = beforeGraph.get(graphType) || [];
      const afterEdges = afterGraph.get(graphType) || [];

      const addedEdges: GraphEdge[] = [];
      const removedEdges: GraphEdge[] = [];
      const modifiedEdges: GraphEdge[] = [];

      // Find added edges
      for (const edge of afterEdges) {
        if (!this.edgeExists(edge, beforeEdges)) {
          addedEdges.push(edge);
        }
      }

      // Find removed edges
      for (const edge of beforeEdges) {
        if (!this.edgeExists(edge, afterEdges)) {
          removedEdges.push(edge);
        }
      }

      const diff: GraphDiff = {
        graphType,
        addedNodes: [], // TODO: Compute node changes
        removedNodes: [], // TODO: Compute node changes
        addedEdges,
        removedEdges,
        modifiedEdges,
      };

      diffs.push(diff);
    }

    const diffKey = `${beforeCommit}:${afterCommit}`;
    this.graphDiffs.set(diffKey, diffs);

    return diffs;
  }

  /**
   * Check if edge exists in array
   */
  private edgeExists(edge: GraphEdge, edges: GraphEdge[]): boolean {
    return edges.some(e => 
      e.from === edge.from && 
      e.to === edge.to && 
      e.type === edge.type
    );
  }

  /**
   * Check if two nodes are equal
   */
  private nodesEqual(a: SemanticIRNode, b: SemanticIRNode): boolean {
    return (
      a.id === b.id &&
      a.type === b.type &&
      a.authorityRequired === b.authorityRequired &&
      JSON.stringify(a.capabilitiesConsumed) === JSON.stringify(b.capabilitiesConsumed) &&
      JSON.stringify(a.capabilitiesProduced) === JSON.stringify(b.capabilitiesProduced)
    );
  }

  /**
   * Create PR proposal
   */
  createPRProposal(
    prNumber: number,
    title: string,
    description: string,
    sourceCommit: GitCommit,
    targetCommit: GitCommit,
    semanticDiff: SemanticDiff,
    graphDiffs: GraphDiff[],
    constitutionalViolations: ConstitutionalViolation[]
  ): PRProposal {
    const requiredReviewers = this.computeRequiredReviewers(constitutionalViolations);

    const proposal: PRProposal = {
      prNumber,
      title,
      description,
      sourceCommit,
      targetCommit,
      semanticDiff,
      graphDiffs,
      constitutionalViolations,
      requiredReviewers,
      approvedReviewers: [],
      mergeable: constitutionalViolations.length === 0,
    };

    this.prProposals.set(prNumber, proposal);
    return proposal;
  }

  /**
   * Compute required reviewers based on violations
   */
  private computeRequiredReviewers(violations: ConstitutionalViolation[]): SymbolID[] {
    const reviewers = new Set<SymbolID>();

    for (const violation of violations) {
      if (violation.requiredReviewer) {
        reviewers.add(violation.requiredReviewer);
      }
    }

    return Array.from(reviewers);
  }

  /**
   * Approve PR reviewer
   */
  approveReviewer(prNumber: number, reviewer: SymbolID): void {
    const proposal = this.prProposals.get(prNumber);
    if (!proposal) return;

    if (!proposal.approvedReviewers.includes(reviewer)) {
      proposal.approvedReviewers.push(reviewer);
    }

    // Check if all required reviewers have approved
    const allApproved = proposal.requiredReviewers.every(r => 
      proposal.approvedReviewers.includes(r)
    );

    if (allApproved && proposal.constitutionalViolations.length === 0) {
      proposal.mergeable = true;
    }
  }

  /**
   * Get compiler run by ID
   */
  getCompilerRun(runId: SymbolID): CompilerRunMetadata | undefined {
    return this.compilerRuns.get(runId);
  }

  /**
   * Get compiler runs by commit
   */
  getCompilerRunsByCommit(commitSHA: string): CompilerRunMetadata[] {
    return Array.from(this.compilerRuns.values()).filter(
      run => run.commitSHA === commitSHA
    );
  }

  /**
   * Get git commit by SHA
   */
  getGitCommit(sha: string): GitCommit | undefined {
    return this.commitHistory.get(sha);
  }

  /**
   * Get semantic diff between commits
   */
  getSemanticDiff(beforeCommit: string, afterCommit: string): SemanticDiff | undefined {
    const diffKey = `${beforeCommit}:${afterCommit}`;
    return this.semanticDiffs.get(diffKey);
  }

  /**
   * Get graph diffs between commits
   */
  getGraphDiffs(beforeCommit: string, afterCommit: string): GraphDiff[] | undefined {
    const diffKey = `${beforeCommit}:${afterCommit}`;
    return this.graphDiffs.get(diffKey);
  }

  /**
   * Get PR proposal by number
   */
  getPRProposal(prNumber: number): PRProposal | undefined {
    return this.prProposals.get(prNumber);
  }

  /**
   * Get all PR proposals
   */
  getAllPRProposals(): PRProposal[] {
    return Array.from(this.prProposals.values());
  }

  /**
   * Get mergeable PRs
   */
  getMergeablePRs(): PRProposal[] {
    return Array.from(this.prProposals.values()).filter(pr => pr.mergeable);
  }

  /**
   * Verify reproducibility
   */
  verifyReproducibility(
    runId: SymbolID,
    expectedCommitSHA: string,
    expectedCompilerVersion: string,
    expectedRegistryVersion: string,
    expectedRuleVersion: string,
    expectedSemanticIRVersion: string
  ): { reproducible: boolean; differences: string[] } {
    const run = this.compilerRuns.get(runId);
    if (!run) {
      return {
        reproducible: false,
        differences: ['Compiler run not found'],
      };
    }

    const differences: string[] = [];

    if (run.commitSHA !== expectedCommitSHA) {
      differences.push(`Commit SHA mismatch: expected ${expectedCommitSHA}, got ${run.commitSHA}`);
    }

    if (run.compilerVersion !== expectedCompilerVersion) {
      differences.push(`Compiler version mismatch: expected ${expectedCompilerVersion}, got ${run.compilerVersion}`);
    }

    if (run.registryVersion !== expectedRegistryVersion) {
      differences.push(`Registry version mismatch: expected ${expectedRegistryVersion}, got ${run.registryVersion}`);
    }

    if (run.ruleVersion !== expectedRuleVersion) {
      differences.push(`Rule version mismatch: expected ${expectedRuleVersion}, got ${run.ruleVersion}`);
    }

    if (run.semanticIRVersion !== expectedSemanticIRVersion) {
      differences.push(`Semantic IR version mismatch: expected ${expectedSemanticIRVersion}, got ${run.semanticIRVersion}`);
    }

    return {
      reproducible: differences.length === 0,
      differences,
    };
  }

  /**
   * Export to JSON
   */
  exportToJSON(): string {
    const data = {
      compilerRuns: Array.from(this.compilerRuns.values()),
      commitHistory: Array.from(this.commitHistory.values()),
      semanticDiffs: Array.from(this.semanticDiffs.entries()),
      graphDiffs: Array.from(this.graphDiffs.entries()),
      prProposals: Array.from(this.prProposals.values()),
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import from JSON
   */
  importFromJSON(json: string): void {
    const data = JSON.parse(json);
    
    for (const run of data.compilerRuns) {
      this.compilerRuns.set(run.runId, run);
    }
    
    for (const commit of data.commitHistory) {
      this.commitHistory.set(commit.sha, commit);
    }
    
    for (const [key, diff] of data.semanticDiffs) {
      this.semanticDiffs.set(key, diff);
    }
    
    for (const [key, diffs] of data.graphDiffs) {
      this.graphDiffs.set(key, diffs);
    }
    
    for (const proposal of data.prProposals) {
      this.prProposals.set(proposal.prNumber, proposal);
    }
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalCompilerRuns: number;
    totalCommits: number;
    totalSemanticDiffs: number;
    totalGraphDiffs: number;
    totalPRProposals: number;
    mergeablePRs: number;
  } {
    return {
      totalCompilerRuns: this.compilerRuns.size,
      totalCommits: this.commitHistory.size,
      totalSemanticDiffs: this.semanticDiffs.size,
      totalGraphDiffs: this.graphDiffs.size,
      totalPRProposals: this.prProposals.size,
      mergeablePRs: this.getMergeablePRs().length,
    };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.compilerRuns.clear();
    this.commitHistory.clear();
    this.semanticDiffs.clear();
    this.graphDiffs.clear();
    this.prProposals.clear();
  }
}
