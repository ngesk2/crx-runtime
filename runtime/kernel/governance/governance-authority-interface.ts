/**
 * Governance Authority Interface
 * Public interface for governance subsystem.
 * Only this interface crosses subsystem boundaries.
 */

import { CanonicalObject } from '../repository/repository-authority-interface';

export interface IGovernanceAuthority {
  validate(object: CanonicalObject): ValidationResult;
  enforce(policy: Policy, action: Action): EnforcementResult;
  checkAuthority(actor: string, resource: string, permission: string): boolean;
  audit(event: AuditEvent): Promise<void>;
  getComplianceReport(scope: ComplianceScope): ComplianceReport;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface Policy {
  policyId: string;
  name: string;
  rules: Rule[];
  scope: PolicyScope;
}

export interface Rule {
  ruleId: string;
  condition: Condition;
  action: Action;
  enforcement: EnforcementLevel;
}

export enum EnforcementLevel {
  Advisory = 'advisory',
  Warning = 'warning',
  Error = 'error',
  Blocking = 'blocking',
}

export interface Action {
  actionId: string;
  type: ActionType;
  parameters: Record<string, unknown>;
}

export enum ActionType {
  Allow = 'allow',
  Deny = 'deny',
  Log = 'log',
  Transform = 'transform',
  Redirect = 'redirect',
}

export interface Condition {
  type: ConditionType;
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

export enum ConditionType {
  Field = 'field',
  Metadata = 'metadata',
  Authority = 'authority',
  Version = 'version',
}

export enum ConditionOperator {
  Equals = 'equals',
  NotEquals = 'not_equals',
  Contains = 'contains',
  Matches = 'matches',
  GreaterThan = 'greater_than',
  LessThan = 'less_than',
  In = 'in',
  NotIn = 'not_in',
}

export interface EnforcementResult {
  enforced: boolean;
  action: Action | null;
  reason: string;
}

export interface AuditEvent {
  eventId: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  outcome: 'allowed' | 'denied';
  metadata: Record<string, unknown>;
}

export interface ComplianceReport {
  reportId: string;
  scope: ComplianceScope;
  timestamp: string;
  compliant: boolean;
  violations: Violation[];
  score: number;
}

export interface ComplianceScope {
  subsystems: string[];
  timeRange: TimeRange;
  policies: string[];
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface Violation {
  violationId: string;
  policyId: string;
  ruleId: string;
  severity: ViolationSeverity;
  description: string;
  timestamp: string;
}

export enum ViolationSeverity {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export enum PolicyScope {
  Repository = 'repository',
  Replay = 'replay',
  Mission = 'mission',
  Witness = 'witness',
  Execution = 'execution',
  Global = 'global',
}
