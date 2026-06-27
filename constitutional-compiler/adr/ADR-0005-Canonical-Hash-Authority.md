# ADR-0005: Canonical Hash Authority

- Status: Accepted
- Date: 2026-06-27

## Context

Hashing must have one canonical authority to preserve determinism and auditability.

## Decision

The canonical hash authority is runtime/kernel and is specified through the hashing specification.

## Consequences

Utility-level hash helpers are allowed; only canonical hash implementations are constitutional authorities.
