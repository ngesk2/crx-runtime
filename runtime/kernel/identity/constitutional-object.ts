/**
 * Constitutional Object
 * Permanent constitutional runtime object with shared envelope and typed payloads.
 */

import { CanonicalID } from './canonical-id';

export interface ConstitutionalObject {
  id: CanonicalID;
  kind: ConstitutionalObjectKind;
  authority: string;
  identity: ConstitutionalIdentity;
  canonical_hash: string;
  lineage: ConstitutionalLineage;
  health: ConstitutionalHealth;
  confidence: number;
  embedding_id?: string;
  replay_id?: string;
  witness_id?: string;
  relationships: ConstitutionalRelationship[];
  metadata: Record<string, unknown>;
  payload: ConstitutionalPayload;
}

export enum ConstitutionalObjectKind {
  Repository = 'repository',
  Commit = 'commit',
  Branch = 'branch',
  Tag = 'tag',
  Release = 'release',
  Issue = 'issue',
  PullRequest = 'pull_request',
  Review = 'review',
  Discussion = 'discussion',
  Contributor = 'contributor',
  Reflection = 'reflection',
  Mission = 'mission',
  Replay = 'replay',
  Witness = 'witness',
  Knowledge = 'knowledge',
  Analysis = 'analysis',
}

export interface ConstitutionalIdentity {
  namespace: string;
  version: string;
  created_at: string;
  created_by: string;
}

export interface ConstitutionalLineage {
  parent_id?: string;
  source_id?: string;
  derivation_path: string[];
  provenance_chain: string[];
}

export enum ConstitutionalHealth {
  Healthy = 'healthy',
  Degraded = 'degraded',
  Unhealthy = 'unhealthy',
  Unknown = 'unknown',
}

export interface ConstitutionalRelationship {
  target_id: string;
  relation_type: string;
  strength: number;
  metadata: Record<string, unknown>;
}

export type ConstitutionalPayload =
  | RepositoryPayload
  | CommitPayload
  | BranchPayload
  | TagPayload
  | ReleasePayload
  | IssuePayload
  | PullRequestPayload
  | ReviewPayload
  | DiscussionPayload
  | ContributorPayload
  | ReflectionPayload
  | MissionPayload
  | ReplayPayload
  | WitnessPayload
  | KnowledgePayload
  | AnalysisPayload;

export interface RepositoryPayload {
  name: string;
  full_name: string;
  description: string;
  url: string;
  language: string;
  stars: number;
  forks: number;
  open_issues: number;
  default_branch: string;
  created_at: string;
  updated_at: string;
  owner: {
    login: string;
    type: string;
  };
}

export interface CommitPayload {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  committer: {
    name: string;
    email: string;
    date: string;
  };
  tree: {
    sha: string;
    url: string;
  };
  parents: Array<{
    sha: string;
    url: string;
  }>;
  url: string;
}

export interface BranchPayload {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface TagPayload {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  zipball_url: string;
  tarball_url: string;
}

export interface ReleasePayload {
  tag_name: string;
  name: string;
  body: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  author: {
    login: string;
  };
  assets: Array<{
    name: string;
    size: number;
    download_count: number;
  }>;
}

export interface IssuePayload {
  number: number;
  title: string;
  body: string;
  state: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  user: {
    login: string;
  };
  assignees: Array<{
    login: string;
  }>;
  labels: Array<{
    name: string;
    color: string;
  }>;
}

export interface PullRequestPayload {
  number: number;
  title: string;
  body: string;
  state: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  merged_at?: string;
  user: {
    login: string;
  };
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  mergeable?: boolean;
  merged?: boolean;
}

export interface ReviewPayload {
  id: number;
  user: {
    login: string;
  };
  body: string;
  state: string;
  submitted_at: string;
  commit_id: string;
}

export interface DiscussionPayload {
  number: number;
  title: string;
  body: string;
  state: string;
  created_at: string;
  updated_at: string;
  author: {
    login: string;
  };
  comments: number;
}

export interface ContributorPayload {
  login: string;
  id: number;
  avatar_url: string;
  type: string;
  contributions: number;
}

export interface ReflectionPayload {
  subject_id: string;
  subject_kind: ConstitutionalObjectKind;
  understanding: string;
  confidence: number;
  rationale: string;
  evidence_references: string[];
  analysis_references: string[];
  timestamp: string;
}

export interface MissionPayload {
  priority: MissionPriority;
  confidence: number;
  rationale: string;
  originating_reflections: string[];
  originating_evidence: string[];
  replay_safety: boolean;
  witness_requirements: string[];
  status: MissionStatus;
  created_at: string;
  updated_at: string;
}

export enum MissionPriority {
  Critical = 'critical',
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

export enum MissionStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Completed = 'completed',
  Blocked = 'blocked',
  Cancelled = 'cancelled',
}

export interface ReplayPayload {
  lifecycle_id: string;
  stages: ReplayStage[];
  result: ReplayResult;
  timestamp: string;
}

export interface ReplayStage {
  stage_name: string;
  input_ids: string[];
  output_ids: string[];
  duration_ms: number;
  success: boolean;
  error?: string;
}

export enum ReplayResult {
  Success = 'success',
  Failure = 'failure',
  Partial = 'partial',
}

export interface WitnessPayload {
  replay_id: string;
  witness_root: string;
  verification_status: VerificationStatus;
  timestamp: string;
  signature?: string;
}

export enum VerificationStatus {
  Verified = 'verified',
  Unverified = 'unverified',
  Failed = 'failed',
}

export interface KnowledgePayload {
  derived_facts: string[];
  supporting_evidence: string[];
  relationships: string[];
  confidence: number;
  authority: string;
  timestamp: string;
}

export interface AnalysisPayload {
  model: string;
  prompt_hash: string;
  object_ids: string[];
  evidence_references: string[];
  confidence: number;
  timestamp: string;
  result: unknown;
}
