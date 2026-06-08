# Constitutional Validation Tests

This directory contains tests for constitutional validation.

## Test Philosophy

Tests verify constitutional invariants and prevent architectural entropy.

## Test Categories

### Invariant Tests
- Event uniqueness tests
- Event immutability tests
- Lineage completeness tests
- Policy evaluation completeness tests
- Replay determinism tests
- Audit completeness tests

### Constitutional Tests
- REUSE_BEFORE_CREATE compliance tests
- Infrastructure unification tests
- Configuration centralization tests
- Schema uniqueness tests
- Prompt uniqueness tests

### Replay Tests
- Snapshot consistency tests
- Replay determinism tests
- Divergence detection tests
- State hash verification tests

### Policy Tests
- Policy evaluation tests
- Policy enforcement tests
- Policy version consistency tests

## Test Execution

All tests must:
1. Run in isolated environment
2. Generate test events
3. Pass policy evaluation
4. Append to audit log
5. Support replay validation

## Test Coverage

Critical areas requiring test coverage:
- Event creation and validation
- Lineage chain construction
- Policy evaluation logic
- Replay engine
- Audit logging
- Agent execution boundaries
- Schema validation
- Configuration loading

## Continuous Validation

Tests run continuously to detect:
- Architectural drift
- Constitutional violations
- Invariant breaks
- Replay failures
