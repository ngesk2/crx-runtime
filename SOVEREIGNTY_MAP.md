# Sovereignty Map

**Audit Date:** 2026-06-24
**Audit Type:** CEO Execution Audit (Revised)
**Auditor:** Adversarial Constitutional Auditor
**Framework:** Sovereignty Allocation Analysis
**Status:** IN PROGRESS

---

# Executive Summary

This document classifies all PING constitutional enforcement components by their sovereign power. The framework distinguishes between components that **create truth** (sovereign) and components that **observe truth** (non-sovereign).

**Total Components Analyzed:** 15
**Sovereign Components:** 1
**Non-Sovereign Components:** 10
**Partial Sovereignty Components:** 4
**Status:** Authority leakage identified in 4 components

---

# Constitutional Rule Zero

**A component may compute, verify, observe, diagnose, project, or witness constitutional state.**

**A component may never define constitutional truth outside deterministic event replay.**

---

# Sovereignty Classification Framework

## Sovereign Component
A component that **creates truth** by:
- Defining constitutional truth
- Modifying constitutional meaning
- Creating sovereign state outside event stream
- Bypassing replay determinism
- Mutating constitutional state directly

## Non-Sovereign Component
A component that **observes truth** by:
- Observing state
- Verifying state
- Rejecting malformed input
- Emitting diagnostics
- Producing derived projections
- Producing evidence
- Computing proofs

## Partial Sovereignty Component
A component that has **mixed behavior** - some operations are sovereign, some are non-sovereign.

---

# Component Classification

## Component 1: Event Store

**Exists:** Yes
**Sovereign:** Yes
**Action:** Keep

**Reasoning:**
- Event store is the sole source of constitutional truth
- Append-only event stream defines constitutional truth
- Replay determinism is guaranteed by event store

**Power:**
- ✓ Defines constitutional truth (via append-only event stream)
- ✓ Enforces replay determinism (via event order)
- ✗ Cannot be bypassed (must be sole source of truth)

**Verdict:** SOVEREIGN - Keep as sole source of truth

---

## Component 2: Replay Engine

**Exists:** Yes
**Sovereign:** No
**Action:** Keep

**Reasoning:**
- Replay engine reconstructs state from event stream
- Replay engine does not create truth, only reconstructs it
- Replay engine is deterministic (pure function of event stream)

**Power:**
- ✓ Observes state (reconstructs from event stream)
- ✓ Produces derived projections (state projection)
- ✓ Computes proofs (replay verification)
- ✗ Does not define constitutional truth (truth comes from event stream)
- ✗ Does not modify constitutional meaning (meaning comes from event stream)

**Verdict:** NON-SOVEREIGN - Keep as observer

---

## Component 3: Projection Verification

**Exists:** Yes
**Sovereign:** No
**Action:** Keep

**Reasoning:**
- Projection verification checks consistency between projections and event stream
- Projection verification does not create truth, only verifies it
- Projection verification emits diagnostics if inconsistency detected

**Power:**
- ✓ Verifies state (checks projection consistency)
- ✓ Rejects malformed input (rejects inconsistent projections)
- ✓ Emits diagnostics (emits verification events)
- ✗ Does not define constitutional truth (truth comes from event stream)
- ✗ Does not modify constitutional meaning (meaning comes from event stream)

**Verdict:** NON-SOVEREIGN - Keep as verifier

---

## Component 4: Witness System

**Exists:** Yes
**Sovereign:** No
**Action:** Keep

**Reasoning:**
- Witness system generates cryptographic evidence about already-existing truth
- Witness is derived from event stream, not source of truth
- Witness is evidence, not authority

**Power:**
- ✓ Produces evidence (witness generation)
- ✓ Computes proofs (witness verification)
- ✗ Does not define constitutional truth (truth comes from event stream)
- ✗ Does not modify constitutional meaning (meaning comes from event stream)

**Verdict:** NON-SOVEREIGN - Keep as evidence generator

---

## Component 5: Compiler Verification

**Exists:** Yes
**Sovereign:** No
**Action:** Keep

**Reasoning:**
- Compiler verification checks that compiled output matches constitutional requirements
- Compiler verification does not create truth, only verifies it
- Compiler verification emits diagnostics if verification fails

**Power:**
- ✓ Verifies state (checks compiler output)
- ✓ Rejects malformed input (rejects invalid compiler output)
- ✓ Emits diagnostics (emits verification events)
- ✗ Does not define constitutional truth (truth comes from event stream)
- ✗ Does not modify constitutional meaning (meaning comes from event stream)

**Verdict:** NON-SOVEREIGN - Keep as verifier

---

## Component 6: Security Events

**Exists:** Yes
**Sovereign:** No
**Action:** Keep

**Reasoning:**
- Security events are diagnostic stream, not constitutional fact
- Security events notify operators of violations
- Security events do not change constitutional state

**Power:**
- ✓ Emits diagnostics (emits security events)
- ✓ Observes state (detects violations)
- ✗ Does not define constitutional truth (truth comes from event stream)
- ✗ Does not modify constitutional meaning (meaning comes from event stream)
- ✗ Does not change constitutional state (state comes from event stream)

**Verdict:** NON-SOVEREIGN - Keep as diagnostic stream

---

## Component 7: Contradiction Worker

**Exists:** Yes
**Sovereign:** No
**Action:** Keep

**Reasoning:**
- Contradiction worker detects contradictions in event stream
- Contradiction worker does not create truth, only detects inconsistencies
- Contradiction worker emits diagnostics if contradiction detected

**Power:**
- ✓ Observes state (detects contradictions)
- ✓ Emits diagnostics (emits contradiction events)
- ✗ Does not define constitutional truth (truth comes from event stream)
- ✗ Does not modify constitutional meaning (meaning comes from event stream)

**Verdict:** NON-SOVEREIGN - Keep as observer

---

## Component 8: Repository Cognition

**Exists:** Yes
**Sovereign:** No
**Action:** Keep

**Reasoning:**
- Repository cognition analyzes repository structure and relationships
- Repository cognition does not create truth, only analyzes it
- Repository cognition produces derived projections

**Power:**
- ✓ Observes state (analyzes repository)
- ✓ Produces derived projections (cognition output)
- ✗ Does not define constitutional truth (truth comes from event stream)
- ✗ Does not modify constitutional meaning (meaning comes from event stream)

**Verdict:** NON-SOVEREIGN - Keep as analyzer

---

## Component 9: Governance Workflow

**Exists:** Yes
**Sovereign:** Partial
**Action:** Convert

**Reasoning:**
- Governance workflow currently allows governance agents to approve constitutional changes
- Governance agents can bypass constitutional restrictions through approval
- Governance workflow should produce events, not approve truth

**Current Power (Sovereign):**
- ✗ Defines constitutional truth (via governance approval)
- ✗ Modifies constitutional meaning (via governance approval)
- ✗ Bypasses replay determinism (via governance approval)

**Required Power (Non-Sovereign):**
- ✓ Produces events (governance events)
- ✓ Observes state (governance proposals)
- ✓ Emits diagnostics (governance events)

**Conversion Required:**
- Remove governance agent approval authority
- Convert governance workflow to event producer
- Governance events are recorded in event stream
- Constitutional truth is determined by event replay, not governance approval

**Verdict:** PARTIAL SOVEREIGNTY - Convert to non-sovereign

---

## Component 10: Runtime Firewall

**Exists:** Yes
**Sovereign:** Partial
**Action:** Strip authority

**Reasoning:**
- Runtime firewall currently can approve or reject constitutional mutations
- Runtime firewall can become sovereign if it can approve mutations
- Runtime firewall should only reject malformed input, not approve truth

**Current Power (Sovereign):**
- ✗ Defines constitutional truth (via approval)
- ✗ Modifies constitutional meaning (via approval)

**Required Power (Non-Sovereign):**
- ✓ Rejects malformed input (rejects invalid mutations)
- ✓ Emits diagnostics (emits rejection events)
- ✗ Does not approve mutations (approval comes from event stream)

**Authority Stripping Required:**
- Remove approval authority from runtime firewall
- Runtime firewall can only reject malformed input
- Runtime firewall cannot approve mutations
- Mutations are approved by event stream, not runtime firewall

**Verdict:** PARTIAL SOVEREIGNTY - Strip authority

---

## Component 11: Database Triggers

**Exists:** Yes
**Sovereign:** Partial
**Action:** Strip authority

**Reasoning:**
- Database triggers currently can prevent or allow mutations
- Database triggers can become sovereign if they can allow mutations
- Database triggers should only reject prohibited mutations, not allow truth

**Current Power (Sovereign):**
- ✗ Defines constitutional truth (via system field exceptions)
- ✗ Modifies constitutional meaning (via system field exceptions)

**Required Power (Non-Sovereign):**
- ✓ Rejects malformed input (rejects prohibited mutations)
- ✓ Emits diagnostics (emits rejection events)
- ✗ Does not allow mutations (allowance comes from event stream)

**Authority Stripping Required:**
- Remove system field exceptions from database triggers
- Database triggers can only reject prohibited mutations
- Database triggers cannot allow mutations via exceptions
- Mutations are allowed by event stream, not database triggers

**Verdict:** PARTIAL SOVEREIGNTY - Strip authority

---

## Component 12: Verification Worker

**Exists:** Yes
**Sovereign:** Partial
**Action:** Strip authority

**Reasoning:**
- Verification worker currently can block state mutation forever if verification fails
- Verification worker can become sovereign if it can block state mutation
- Verification worker should only emit diagnostics if verification fails, not block truth

**Current Power (Sovereign):**
- ✗ Defines constitutional truth (via blocking state mutation)
- ✗ Modifies constitutional meaning (via blocking state mutation)

**Required Power (Non-Sovereign):**
- ✓ Verifies state (checks verification)
- ✓ Emits diagnostics (emits verification events)
- ✗ Does not block state mutation (blocking comes from event stream)

**Authority Stripping Required:**
- Remove blocking authority from verification worker
- Verification worker can only emit diagnostics if verification fails
- Verification worker cannot block state mutation
- State mutation is blocked by event stream, not verification worker

**Verdict:** PARTIAL SOVEREIGNTY - Strip authority

---

## Component 13: Lineage Analysis

**Exists:** Yes
**Sovereign:** No
**Action:** Keep

**Reasoning:**
- Lineage analysis traces event lineage and relationships
- Lineage analysis does not create truth, only analyzes it
- Lineage analysis produces derived projections

**Power:**
- ✓ Observes state (analyzes lineage)
- ✓ Produces derived projections (lineage output)
- ✗ Does not define constitutional truth (truth comes from event stream)
- ✗ Does not modify constitutional meaning (meaning comes from event stream)

**Verdict:** NON-SOVEREIGN - Keep as analyzer

---

## Component 14: State Projection

**Exists:** Yes
**Sovereign:** No
**Action:** Keep

**Reasoning:**
- State projection projects state from event replay
- State projection does not create truth, only projects it
- State projection is derived from event stream

**Power:**
- ✓ Produces derived projections (state projection)
- ✓ Observes state (projects from event stream)
- ✗ Does not define constitutional truth (truth comes from event stream)
- ✗ Does not modify constitutional meaning (meaning comes from event stream)

**Verdict:** NON-SOVEREIGN - Keep as projector

---

## Component 15: Provenance Tracking

**Exists:** Yes
**Sovereign:** No
**Action:** Keep

**Reasoning:**
- Provenance tracking tracks event provenance and origin
- Provenance tracking does not create truth, only tracks it
- Provenance tracking produces derived projections

**Power:**
- ✓ Observes state (tracks provenance)
- ✓ Produces derived projections (provenance output)
- ✗ Does not define constitutional truth (truth comes from event stream)
- ✗ Does not modify constitutional meaning (meaning comes from event stream)

**Verdict:** NON-SOVEREIGN - Keep as tracker

---

# Summary Table

| Component | Exists | Sovereign | Action | Reason |
|-----------|--------|-----------|--------|--------|
| Event Store | Yes | Yes | Keep | Sole source of truth |
| Replay Engine | Yes | No | Keep | Observer only |
| Projection Verification | Yes | No | Keep | Verifier only |
| Witness System | Yes | No | Keep | Evidence only |
| Compiler Verification | Yes | No | Keep | Verifier only |
| Security Events | Yes | No | Keep | Diagnostic only |
| Contradiction Worker | Yes | No | Keep | Observer only |
| Repository Cognition | Yes | No | Keep | Analyzer only |
| Governance Workflow | Yes | Partial | Convert | Remove approval authority |
| Runtime Firewall | Yes | Partial | Strip authority | Remove approval authority |
| Database Triggers | Yes | Partial | Strip authority | Remove system field exceptions |
| Verification Worker | Yes | Partial | Strip authority | Remove blocking authority |
| Lineage Analysis | Yes | No | Keep | Analyzer only |
| State Projection | Yes | No | Keep | Projector only |
| Provenance Tracking | Yes | No | Keep | Tracker only |

---

# Authority Leakage Summary

**Total Components:** 15
**Sovereign Components:** 1 (Event Store)
**Non-Sovereign Components:** 10
**Partial Sovereignty Components:** 4 (Governance Workflow, Runtime Firewall, Database Triggers, Verification Worker)
**Authority Leakage:** 4 components have partial sovereignty that must be stripped

---

# Next Steps

1. **Governance Workflow:** Convert to event producer (remove approval authority)
2. **Runtime Firewall:** Strip approval authority (only reject malformed input)
3. **Database Triggers:** Strip system field exceptions (only reject prohibited mutations)
4. **Verification Worker:** Strip blocking authority (only emit diagnostics)

---

**Audit Status:** Authority leakage identified in 4 components
**Recommendation:** Strip authority from partial sovereignty components
