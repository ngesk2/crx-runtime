# ADR-0004: Adapter Doctrine

- Status: Accepted
- Date: 2026-06-27

## Context

Adapters are translation layers and must not make semantic decisions.

## Decision

Adapters are limited to syntax facts: nodes, spans, trivia, children, and tokens.

## Consequences

Any semantic leakage in an adapter is treated as a constitutional violation.
