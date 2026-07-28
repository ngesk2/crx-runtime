# ADR-0002: Replay Ownership

- Status: Accepted
- Date: 2026-06-27

## Context

Replay semantics must remain singularly owned to preserve determinism and auditability.

## Decision

Replay authority resides in runtime/kernel and is governed by the replay authority specification.

## Consequences

Replay logic outside runtime/kernel requires explicit review and evidence.
