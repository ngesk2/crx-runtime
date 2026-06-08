# Constitutional Policies

This directory contains constitutional policies that govern all system behavior.

## Policy Structure

```
policies/
├── constitutional/    # Core constitutional policies
├── operational/       # Operational policies
├── security/          # Security policies
└── domain/           # Domain-specific policies (education, FERPA, etc.)
```

## Policy Evaluation

All state transitions must pass through policy evaluation:

```
Event
 → Policy Evaluation
 → Decision (allow/deny/modify)
 → Assignment
 → Execution
 → Validation
 → Replay Check
 → Audit Event
```

## Policy Categories

### Constitutional Policies
- Event sovereignty policies
- Lineage immutability policies
- Replay determinism policies
- Audit completeness policies

### Operational Policies
- Infrastructure policies
- Deployment policies
- Configuration policies
- Observability policies

### Security Policies
- Access control policies
- Supply chain policies
- Identity policies
- Authorization policies

### Domain Policies
- Education-specific policies
- FERPA compliance policies
- Pedagogical policies
- Assessment policies

## Policy Versioning

Policies are versioned. All events reference the policy version that evaluated them.

Policy evolution:
1. Create new version
2. Document changes
3. Update policy_version in new events
4. Maintain backward compatibility
5. Run validation tests

## Policy Enforcement

Policy enforcement modes:
- **strict**: All violations block execution
- **warn**: Violations generate warnings but allow execution
- **audit**: Violations are logged but not enforced

Default mode: strict
