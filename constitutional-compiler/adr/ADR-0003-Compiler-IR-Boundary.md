# ADR-0003: Compiler IR Boundary

- Status: Accepted
- Date: 2026-06-27

## Context

Compiler IR and constitutional IR must remain distinct to prevent semantic leakage.

## Decision

Compiler IR is an adapter-facing representation; constitutional IR remains kernel-owned and replay-visible.

## Consequences

Semantic interpretation occurs downstream of raw syntax facts and must not be embedded in adapters.
