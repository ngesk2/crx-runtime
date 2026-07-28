import { CanonicalIdentityService } from '../identity/canonical-identity-service';
import { CanonicalClock } from '../identity/canonical-clock';
import { CanonicalObject } from '../repository/repository-authority-interface';
import { IGovernanceAuthority, ValidationResult, Policy, Action, EnforcementResult, AuditEvent, ComplianceReport, ComplianceScope, Violation, ViolationSeverity, EnforcementLevel, PolicyScope } from './governance-authority-interface';

export class GovernanceAuthority implements IGovernanceAuthority {
  private policies: Map<string, Policy> = new Map();
  private auditLog: AuditEvent[] = [];
  private identityService = CanonicalIdentityService.getInstance();
  private clock = CanonicalClock.getInstance();

  registerPolicy(policy: Policy): void {
    this.policies.set(policy.policyId, policy);
  }

  validate(object: CanonicalObject): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!object.id) errors.push('Object missing id');
    if (!object.kind) errors.push('Object missing kind');
    if (object.data === undefined || object.data === null) errors.push('Object missing data');

    for (const policy of this.policies.values()) {
      if (policy.scope === PolicyScope.Global || policy.scope === object.kind as PolicyScope) {
        for (const rule of policy.rules) {
          const fieldValue = (object.data as Record<string, unknown>)?.[rule.condition.field];
          const metadataValue = object.metadata?.[rule.condition.field];

          switch (rule.condition.type) {
            case 'field': {
              if (!this.evaluate(fieldValue, rule.condition.operator, rule.condition.value)) {
                const msg = `Policy ${policy.name}: field ${rule.condition.field} failed ${rule.condition.operator} check`;
                if (rule.enforcement === EnforcementLevel.Error) errors.push(msg);
                else warnings.push(msg);
              }
              break;
            }
            case 'metadata': {
              if (!this.evaluate(metadataValue, rule.condition.operator, rule.condition.value)) {
                const msg = `Policy ${policy.name}: metadata ${rule.condition.field} failed ${rule.condition.operator} check`;
                if (rule.enforcement === EnforcementLevel.Error) errors.push(msg);
                else warnings.push(msg);
              }
              break;
            }
          }
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  enforce(policy: Policy, action: Action): EnforcementResult {
    if (action.type === 'deny') {
      return { enforced: true, action, reason: `Action ${action.actionId} denied by policy ${policy.name}` };
    }
    return { enforced: true, action, reason: `Action ${action.actionId} allowed by policy ${policy.name}` };
  }

  checkAuthority(actor: string, resource: string, permission: string): boolean {
    for (const policy of this.policies.values()) {
      for (const rule of policy.rules) {
        if (rule.condition.field === 'actor' && this.evaluate(actor, rule.condition.operator, rule.condition.value)) {
          if (rule.enforcement === EnforcementLevel.Blocking) return false;
        }
      }
    }
    return true;
  }

  async audit(event: AuditEvent): Promise<void> {
    this.auditLog.push({ ...event, timestamp: event.timestamp || this.clock.now() });
  }

  getComplianceReport(scope: ComplianceScope): ComplianceReport {
    const violations: Violation[] = [];
    for (const event of this.auditLog) {
      if (scope.subsystems.length > 0 && !scope.subsystems.includes(event.resource)) continue;
      if (event.outcome === 'denied') {
        violations.push({
          violationId: this.identityService.generateUUIDv5('violation', event.eventId),
          policyId: 'audit',
          ruleId: 'access_control',
          severity: ViolationSeverity.High,
          description: `${event.actor} denied ${event.action} on ${event.resource}`,
          timestamp: event.timestamp,
        });
      }
    }

    return {
      reportId: this.identityService.generateUUIDv5('compliance', this.clock.now()),
      scope,
      timestamp: this.clock.now(),
      compliant: violations.length === 0,
      violations,
      score: violations.length === 0 ? 1.0 : Math.max(0, 1.0 - violations.length * 0.1),
    };
  }

  private evaluate(value: unknown, operator: string, target: unknown): boolean {
    switch (operator) {
      case 'equals': return value === target;
      case 'not_equals': return value !== target;
      case 'contains': return Array.isArray(value) && value.includes(target);
      case 'matches': return typeof value === 'string' && typeof target === 'string' && new RegExp(target).test(value);
      case 'greater_than': return typeof value === 'number' && typeof target === 'number' && value > target;
      case 'less_than': return typeof value === 'number' && typeof target === 'number' && value < target;
      case 'in': return Array.isArray(target) && target.includes(value);
      case 'not_in': return Array.isArray(target) && !target.includes(value);
      default: return true;
    }
  }
}
