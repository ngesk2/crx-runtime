# REUSE BEFORE CREATE Policy

**Policy ID**: POL-001
**Policy Version**: 0.1
**Severity**: critical
**Status**: active

## Policy Statement

Before creating ANY file, agents MUST:
1. Search repository
2. Search schemas
3. Search prompts
4. Search infrastructure
5. Search orchestration logic
6. Search event systems
7. Search replay systems
8. Search policy systems
9. Search observability systems
10. Search runtime definitions

## Decision Rules

### If functionality overlaps:
- **Action**: MERGE IT
- **Justification**: Required in policy evaluation event

### If systems duplicate:
- **Action**: CANONICALIZE THEM
- **Justification**: Required in policy evaluation event

### If architecture forks:
- **Action**: SIMPLIFY IT
- **Justification**: Required in policy evaluation event

### If no overlap exists:
- **Action**: CREATE NEW FILE
- **Justification**: Explicit justification required in policy evaluation event

## Enforcement

This policy is enforced at:
- File creation operations
- Schema definition operations
- Infrastructure definition operations
- Agent prompt creation operations

## Violation Consequences

Violations of this policy are classified as **critical** constitutional violations and:
- Block the operation
- Generate constitutional violation event
- Require remediation
- Update audit log

## Examples

### Correct Behavior
```
Agent wants to create new event schema
→ Searches events/ directory
→ Finds canonical-event-envelope.json
→ Extends existing schema instead of creating new
→ Policy evaluation: ALLOW
```

### Incorrect Behavior
```
Agent wants to create new event schema
→ Does not search existing schemas
→ Creates duplicate event schema
→ Policy evaluation: DENY
→ Constitutional violation event created
```
