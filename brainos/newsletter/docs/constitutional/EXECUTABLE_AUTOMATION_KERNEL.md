# EXECUTABLE AUTOMATION KERNEL

**Audit Date:** 2025-01-18  
**Audit Mode:** ZERO ASSUMPTION - READ ONLY - RUNTIME REALITY ONLY  
**Audit Principle:** Only after all previous phases. Construct minimum replayable kernel, minimum retrieval kernel, minimum verification kernel. Migration order, risk, rollback, complexity.

---

## EXECUTIVE SUMMARY

**Executable kernel is minimal.** Minimum replayable kernel requires event-first architecture, identity computation, lineage tracking, replay capability (130 hours, 3 weeks). Minimum retrieval kernel requires SQLite FTS5, article retrieval to dashboard, digest retrieval to dashboard (20 hours, 3 days). Minimum verification kernel requires self-verification (40 hours, 1 week). Total minimum executable kernel: 190 hours (5 weeks). Migration order: Retrieval → Verification → Replay. Risk: LOW for retrieval, MEDIUM for verification, HIGH for replay.

---

## MINIMUM REPLAYABLE KERNEL

### Components
- Event-first architecture (events emitted before state mutations)
- Identity computation (compute canonical hashes for all artifacts)
- Lineage tracking (track lineage edges for all artifacts)
- Replay engine (replay events to reconstruct state)

### Migration Order
1. Event Completeness (20 hours)
2. Identity Computation (20 hours)
3. Lineage Tracking (30 hours)
4. Replay Capability (40 hours)

### Risk
- Event Completeness: MEDIUM (requires changing event emission timing)
- Identity Computation: MEDIUM (requires adding identity computation to all work units)
- Lineage Tracking: HIGH (requires adding lineage tracking to all work units)
- Replay Capability: HIGH (requires changing event emission timing, making Ollama API calls deterministic)

### Rollback
- Event Completeness: LOW (can rollback by removing new events)
- Identity Computation: MEDIUM (can rollback by removing identity computation)
- Lineage Tracking: MEDIUM (can rollback by removing lineage tracking)
- Replay Capability: HIGH (cannot rollback event emission timing without data loss)

### Complexity
- Event Completeness: MEDIUM (requires adding 10 missing event types)
- Identity Computation: MEDIUM (requires adding identity computation to all work units)
- Lineage Tracking: HIGH (requires adding lineage tracking to all work units)
- Replay Capability: HIGH (requires changing event emission timing, making Ollama API calls deterministic)

### Expected Effort
- Total: 130 hours (3 weeks)

---

## MINIMUM RETRIEVAL KERNEL

### Components
- SQLite FTS5 (full-text search)
- Article retrieval to dashboard
- Digest retrieval to dashboard

### Migration Order
1. Enable SQLite FTS5 (10 hours)
2. Add article retrieval to dashboard (5 hours)
3. Add digest retrieval to dashboard (5 hours)

### Risk
- SQLite FTS5: LOW (can rollback by disabling FTS5)
- Article retrieval to dashboard: LOW (can rollback by removing article display)
- Digest retrieval to dashboard: LOW (can rollback by removing digest display)

### Rollback
- SQLite FTS5: LOW (can rollback by disabling FTS5)
- Article retrieval to dashboard: LOW (can rollback by removing article display)
- Digest retrieval to dashboard: LOW (can rollback by removing digest display)

### Complexity
- SQLite FTS5: LOW (requires FTS5 enablement)
- Article retrieval to dashboard: LOW (requires article display in dashboard)
- Digest retrieval to dashboard: LOW (requires digest display in dashboard)

### Expected Effort
- Total: 20 hours (3 days)

---

## MINIMUM VERIFICATION KERNEL

### Components
- Self-verification (agent verifies own state)
- Self-consistency (agent verifies own consistency)
- Self-integrity (agent verifies own integrity)

### Migration Order
1. Self-Verification (40 hours)

### Risk
- Self-Verification: HIGH (requires self-verification development)

### Rollback
- Self-Verification: MEDIUM (can rollback by removing self-verification)

### Complexity
- Self-Verification: HIGH (requires self-verification development)

### Expected Effort
- Total: 40 hours (1 week)

---

## MIGRATION ORDER

### Phase 1: Minimum Retrieval Kernel (20 hours, 3 days)
**Priority:** HIGHEST
**Why:** Users cannot search newsletters, articles, digests. Retrieval is the most visible user impact.
**Risk:** LOW
**Rollback:** LOW
**Complexity:** LOW

### Phase 2: Minimum Verification Kernel (40 hours, 1 week)
**Priority:** MEDIUM
**Why:** Self-verification is required for constitutional kernel but not for minimum viable BrainOS.
**Risk:** HIGH
**Rollback:** MEDIUM
**Complexity:** HIGH

### Phase 3: Minimum Replayable Kernel (130 hours, 3 weeks)
**Priority:** LOWEST
**Why:** Replay capability is required for constitutional kernel but not for minimum viable BrainOS.
**Risk:** HIGH
**Rollback:** HIGH
**Complexity:** HIGH

---

## RISK ASSESSMENT

### Phase 1: Minimum Retrieval Kernel
**Risk:** LOW
**Why:** Can rollback by disabling FTS5, removing article display, removing digest display. No data loss.
**Mitigation:** Implement feature flags for each change. Test each change independently before deployment.

### Phase 2: Minimum Verification Kernel
**Risk:** HIGH
**Why:** Self-verification development is complex. May introduce bugs in verification logic.
**Mitigation:** Implement self-verification in isolated service. Test self-verification against known good state. Rollback by disabling self-verification service.

### Phase 3: Minimum Replayable Kernel
**Risk:** HIGH
**Why:** Cannot rollback event emission timing without data loss. Cannot rollback deterministic Ollama API calls without data loss.
**Mitigation:** Implement event-first architecture in isolated service. Test replay capability against known good state. Rollback by disabling replay service (but data loss may occur).

---

## ROLLBACK STRATEGY

### Phase 1: Minimum Retrieval Kernel
**Rollback Strategy:** Feature flags
- Disable SQLite FTS5 (feature flag)
- Remove article retrieval from dashboard (feature flag)
- Remove digest retrieval from dashboard (feature flag)
**Data Loss:** NONE
**Rollback Time:** 1 hour

### Phase 2: Minimum Verification Kernel
**Rollback Strategy:** Service disable
- Disable self-verification service (feature flag)
**Data Loss:** NONE
**Rollback Time:** 1 hour

### Phase 3: Minimum Replayable Kernel
**Rollback Strategy:** Service disable
- Disable replay service (feature flag)
- Revert event emission timing (requires data migration)
**Data Loss:** POSSIBLE (events emitted during rollback window may be lost)
**Rollback Time:** 4 hours (includes data migration)

---

## COMPLEXITY ASSESSMENT

### Phase 1: Minimum Retrieval Kernel
**Complexity:** LOW
**Why:** SQLite FTS5 enablement is straightforward. Article retrieval to dashboard is straightforward. Digest retrieval to dashboard is straightforward.
**Dependencies:** NONE
**Estimated Effort:** 20 hours (3 days)

### Phase 2: Minimum Verification Kernel
**Complexity:** HIGH
**Why:** Self-verification development is complex. Requires understanding of state consistency, integrity, validation.
**Dependencies:** NONE
**Estimated Effort:** 40 hours (1 week)

### Phase 3: Minimum Replayable Kernel
**Complexity:** HIGH
**Why:** Event-first architecture requires changing event emission timing. Identity computation requires adding identity computation to all work units. Lineage tracking requires adding lineage tracking to all work units. Replay capability requires making Ollama API calls deterministic.
**Dependencies:** Phase 2 (Minimum Verification Kernel) depends on Phase 1 (Minimum Retrieval Kernel) for state verification
**Estimated Effort:** 130 hours (3 weeks)

---

## ANSWER

**Minimum Replayable Kernel:**
- Components: Event-first architecture, identity computation, lineage tracking, replay engine
- Migration Order: Event Completeness → Identity Computation → Lineage Tracking → Replay Capability
- Risk: MEDIUM (Event Completeness), MEDIUM (Identity Computation), HIGH (Lineage Tracking), HIGH (Replay Capability)
- Rollback: LOW (Event Completeness), MEDIUM (Identity Computation), MEDIUM (Lineage Tracking), HIGH (Replay Capability)
- Complexity: MEDIUM (Event Completeness), MEDIUM (Identity Computation), HIGH (Lineage Tracking), HIGH (Replay Capability)
- Expected Effort: 130 hours (3 weeks)

**Minimum Retrieval Kernel:**
- Components: SQLite FTS5, article retrieval to dashboard, digest retrieval to dashboard
- Migration Order: SQLite FTS5 → Article retrieval to dashboard → Digest retrieval to dashboard
- Risk: LOW (SQLite FTS5), LOW (Article retrieval to dashboard), LOW (Digest retrieval to dashboard)
- Rollback: LOW (SQLite FTS5), LOW (Article retrieval to dashboard), LOW (Digest retrieval to dashboard)
- Complexity: LOW (SQLite FTS5), LOW (Article retrieval to dashboard), LOW (Digest retrieval to dashboard)
- Expected Effort: 20 hours (3 days)

**Minimum Verification Kernel:**
- Components: Self-verification, self-consistency, self-integrity
- Migration Order: Self-Verification
- Risk: HIGH (Self-Verification)
- Rollback: MEDIUM (Self-Verification)
- Complexity: HIGH (Self-Verification)
- Expected Effort: 40 hours (1 week)

**Migration Order:**
- Phase 1: Minimum Retrieval Kernel (20 hours, 3 days)
- Phase 2: Minimum Verification Kernel (40 hours, 1 week)
- Phase 3: Minimum Replayable Kernel (130 hours, 3 weeks)

**Total Minimum Executable Kernel Effort:** 190 hours (5 weeks)
