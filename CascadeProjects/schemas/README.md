# Canonical Schemas

This directory contains canonical schema definitions for the constitutional cognition substrate.

## Schema Principles

1. **Single Source of Truth**: Each concept has ONE canonical schema
2. **No Duplication**: Duplicate schemas are constitutional violations
3. **Versioned Evolution**: Schemas evolve via versioning, not replacement
4. **Backward Compatibility**: Schema changes maintain backward compatibility where possible
5. **Validation Required**: All data must validate against canonical schemas

## Schema Categories

### Event Schemas
- `canonical-event-envelope.json` - The single canonical event schema
- Event type-specific schemas extend the canonical envelope

### Domain Schemas
- Provenance schemas
- Claim schemas
- Decision schemas
- Fact schemas
- Rule schemas

### Infrastructure Schemas
- Configuration schemas
- Deployment schemas
- Observability schemas

## Schema Evolution

When evolving schemas:
1. Create new version with incremented version number
2. Maintain backward compatibility
3. Update policy_version references
4. Document breaking changes
5. Run validation tests

## Schema Validation

All data entering the system must:
1. Validate against canonical schema
2. Pass policy evaluation
3. Record validation event
4. Append to audit log
