# SEMANTIC DEBT HEATMAP

**Generated:** 2026-06-11  
**Scope:** CRX Repository Complete Assessment  
**Methodology:** Evidence-based from 12 semantic audits  

---

## HEAT SCALE

```
GREEN (LOW):      0-25 semantic debt points
YELLOW (MEDIUM):  25-50 semantic debt points  
ORANGE (HIGH):    50-75 semantic debt points
RED (CRITICAL):   75-100 semantic debt points
```

---

## SEMANTIC DEBT INVENTORY (15 Items)

### 1. CRITICAL: Byte Authority Fragmentation

**Heat Level:** 🔴 RED (85/100)

**Location:** 
- `runtime/replay/canonical_json.ts` line 89: `Buffer.from(text, 'utf8')`
- `runtime/replay/merkle_tree.ts` line 134: `Buffer.concat()`
- `runtime/replay/state_serializer.ts` line 201: `Buffer.allocUnsafe()`
- 12+ additional Buffer operations scattered across kernel

**Impact:** 
- Byte semantics fragmented across 4+ authorities
- No centralized ByteAuthority (should exist)
- Portability risk (buffer encoding assumptions)
- Determinism risk (undocumented byte order semantics)

**Remediation:** Surgical Patch Phase 1 (ByteAuthority)

**Timeline to Fix:** 2-3 weeks

---

### 2. CRITICAL: Hash Authority Fragmentation

**Heat Level:** 🔴 RED (82/100)

**Location:**
- `runtime/replay/canonical_hash_authority.ts` line 71: `crypto.createHash('sha256')`
- `runtime/replay/merkle_tree.ts` line 252: `crypto.createHash('sha256')`
- `runtime/replay/constitutional_self_check.ts` line 83: `crypto.createHash('sha256')`

**Impact:**
- 3+ independent hash authorities
- No FingerprintAuthority (should centralize)
- Determinism risk (hash algorithm assumptions)
- Audit difficulty (multiple hash locations)

**Remediation:** Surgical Patch Phase 2 (FingerprintAuthority)

**Timeline to Fix:** 2-3 weeks

---

### 3. HIGH: WitnessAuthority Shadow Authority

**Heat Level:** 🟠 ORANGE (72/100)

**Location:** `runtime/replay/witness_authority.ts` (entire file)

**Constitutional Violation:**
- Constitution: WitnessAuthority eliminated, absorbed by Identity + Replay
- Code: WitnessAuthority exists as separate class
- Risk: MEDIUM (currently delegates correctly, but semantic boundary wrong)

**Functional Impact:**
- Currently works but violates one-authority-per-domain
- Could become hidden king if Replay Authority removed
- Audit complexity increases

**Remediation:** Eliminate class, merge logic into Identity + Replay

**Timeline to Fix:** 1-2 weeks

---

### 4. HIGH: CanonicalHashAuthority Shadow Authority

**Heat Level:** 🟠 ORANGE (70/100)

**Location:** `runtime/replay/canonical_hash_authority.ts` (entire file)

**Constitutional Violation:**
- Constitution: CanonicalHashAuthority eliminated, absorbed by Identity
- Code: CanonicalHashAuthority exists as separate class
- Risk: MEDIUM (same as WitnessAuthority)

**Functional Impact:**
- Violates sole-authority-per-domain
- Fragments hash authority (see heat #2)
- Complicates Identity Authority

**Remediation:** Eliminate class, integrate into Identity Authority

**Timeline to Fix:** 1-2 weeks

---

### 5. HIGH: KernelCommitService Shadow Authority

**Heat Level:** 🟠 ORANGE (75/100)

**Location:** `runtime/replay/authority_registry.ts` line 41

**Constitutional Violation:**
- Classification: SHADOW (not eliminated, not classified)
- Consequence: Competing truth source with Event Recording Authority
- Risk: HIGH (immediately dangerous)

**Functional Impact:**
- Two independent sources claim event authority
- Divergence during failure scenarios
- No clear winner in conflicts

**Remediation:** Either eliminate or integrate with Event Recording Authority

**Timeline to Fix:** 1-2 weeks

---

### 6. CRITICAL: Policy Authority Not Implemented

**Heat Level:** 🔴 RED (90/100)

**Location:** Missing entirely (no file)

**Constitutional Violation:**
- Constitution: Policy Authority defined as root authority
- Code: Not implemented
- Risk: HIGH (no mutation authorization mechanism)

**Functional Impact:**
- No way to authorize state mutations
- No policy enforcement engine
- Permission checks not enforced

**Remediation:** Implement complete Policy Authority subsystem

**Timeline to Fix:** 4-6 weeks

---

### 7. HIGH: Semantic Embeddings Authority Creep Risk

**Heat Level:** 🟠 ORANGE (68/100)

**Location:** `audit/context_state_sweep.md` lines 142-156

**Risk Classification:** "HIGH - Embedding authority creep is one of the biggest future dangers"

**Constitutional Status:**
- Classification: Non-canonical, non-authoritative
- Enforcement: Documented, not code-enforced
- Prevention: Required to keep embeddings as retrieval helpers only

**Future Risk:**
- Embeddings could be promoted to canonical without warning
- No code-level prevention
- Risk increases as embeddings improve

**Prevention:** Implement code-level enforcement blocking embedding promotion

**Timeline to Fix:** 3-4 weeks

---

### 8. HIGH: Cached Summaries Shadow Copy Risk

**Heat Level:** 🟠 ORANGE (65/100)

**Location:** `audit/context_state_sweep.md` lines 118-130

**Risk Classification:** "HIGH - Shadow copy risk"

**Constitutional Status:**
- Classification: Non-canonical, disposable
- Enforcement: Documented only
- Prevention: Must be regenerated, never persisted

**Functional Risk:**
- Cached values could diverge from canonical state
- No invalidation strategy
- Could become de-facto truth

**Remediation:** Implement cache invalidation, mark all caches as ephemeral

**Timeline to Fix:** 2-3 weeks

---

### 9. MEDIUM: Creator System Snapshot Thinking

**Heat Level:** 🟡 YELLOW (42/100)

**Location:** `knowledge/derived/creator-canonical-storage-spec-v1.md` (entire spec)

**Pre-Constitutional Assumption:**
- Model: Document + snapshot = truth
- Status: Properly isolated from kernel
- Risk: LOW (contained to legacy system)

**Semantic Debt:**
- Snapshot concepts not removed, just isolated
- New developers could confuse legacy with kernel
- Documentation shows old worldview

**Remediation:** Mark creator system as legacy, update documentation

**Timeline to Fix:** 1-2 weeks (documentation only)

---

### 10. MEDIUM: Agent-Centric Infrastructure Naming

**Heat Level:** 🟡 YELLOW (48/100)

**Location:** 
- `knowledge/derived/multi-agent-runtime-model.md`
- `constitutional-agent-infrastructure.md`
- Source code agent classes

**Semantic Gap:**
- Naming implies agent sovereignty
- Implementation shows constitutional scoping
- New developers may misunderstand architecture

**Functional Impact:**
- Low (system works correctly)
- High (documentation/mental model confusion)

**Remediation:** Rename "agents" to "scoped tools" in documentation

**Timeline to Fix:** 2-3 weeks (refactoring, documentation)

---

### 11. MEDIUM: Infrastructure Fragmentation (Docker-Compose)

**Heat Level:** 🟡 YELLOW (45/100)

**Location:** 
- `docker-compose.yml` (main)
- `CascadeProjects/infra/docker-compose.yml`
- `gateway/docker-compose.yml`

**Semantic Problem:**
- 3 separate compose files = 3 potential truth sources
- Configuration scattered = understanding scattered
- Maintenance burden increases

**Functional Impact:**
- Deployment complexity
- Configuration divergence risk
- Scaling difficulty

**Remediation:** Consolidate into single compose file

**Timeline to Fix:** 1 week

---

### 12. MEDIUM: Documentation Rot (Creator System)

**Heat Level:** 🟡 YELLOW (50/100)

**Location:**
- `knowledge/derived/ai-memory-architecture.md`: Describes old model
- `knowledge/derived/creator-canonical-storage-spec-v1.md`: Snapshot-based
- READMEs in `CascadeProjects/`

**Accuracy Issue:**
- Describes pre-constitutional system
- Does NOT describe replay kernel
- New developers read old model first

**Functional Impact:**
- Onboarding confusion
- Wrong mental models
- Misconceptions about authority

**Remediation:** Add "LEGACY" markers, create new kernel documentation

**Timeline to Fix:** 2-3 weeks

---

### 13. LOW: Semantic Fossils (saveState/loadState)

**Heat Level:** 🟢 GREEN (15/100)

**Location:** 
- `knowledge/derived/creator-canonical-storage-spec-v1.md`: Mentioned
- NO execution in kernel

**Semantic Debt:**
- Old terminology still referenced
- Zero functional impact
- Safely contained

**Status:** No remediation needed (properly fossil)

**Timeline to Fix:** N/A (skip)

---

### 14. LOW: Pre-Constitutional Terminology

**Heat Level:** 🟢 GREEN (18/100)

**Location:**
- "Truth store" (eliminated)
- "Snapshot" (creator only)
- "Memory as authority" (corrected)

**Semantic Drift:**
- Successfully evolved in most areas
- Minor terminology gaps
- Low risk of re-emergence

**Remediation:** Minor terminology audit, then freeze

**Timeline to Fix:** 1 week

---

### 15. MEDIUM: Neo4j Infrastructure (Proposed)

**Heat Level:** 🟡 YELLOW (52/100)

**Location:** `CascadeProjects/infra/COGNITION_STACK_EXPANSION.md`

**Future Risk:**
- Neo4j proposed but not yet authority
- Not implemented = no risk yet
- Future danger if promoted without safeguards

**Prevention Required:**
- Code-level enforcement blocking Neo4j as canonical
- Documentation marking as non-canonical
- Integration tests checking isolation

**Remediation:** Pre-emptively mark as non-canonical before implementation

**Timeline to Fix:** 3-4 weeks (prevention before implementation)

---

## HEAT MAP SUMMARY TABLE

| Rank | Item | Heat | Category | Timeline | P |
|------|------|------|----------|----------|---|
| 1 | Byte Authority Fragmentation | 🔴85 | Critical | 2-3 weeks | P0 |
| 2 | Hash Authority Fragmentation | 🔴82 | Critical | 2-3 weeks | P0 |
| 3 | Policy Authority Missing | 🔴90 | Critical | 4-6 weeks | P0 |
| 4 | KernelCommitService Shadow | 🟠75 | High | 1-2 weeks | P0 |
| 5 | WitnessAuthority Shadow | 🟠72 | High | 1-2 weeks | P0 |
| 6 | CanonicalHashAuthority Shadow | 🟠70 | High | 1-2 weeks | P0 |
| 7 | Embeddings Creep Risk | 🟠68 | High | 3-4 weeks | P1 |
| 8 | Cached Summaries Risk | 🟠65 | High | 2-3 weeks | P1 |
| 9 | Neo4j Preemption Needed | 🟡52 | Medium | 3-4 weeks | P1 |
| 10 | Creator System Isolation | 🟡42 | Medium | 1-2 weeks | P1 |
| 11 | Infrastructure Fragmentation | 🟡45 | Medium | 1 week | P2 |
| 12 | Agent Naming Gap | 🟡48 | Medium | 2-3 weeks | P2 |
| 13 | Documentation Rot | 🟡50 | Medium | 2-3 weeks | P2 |
| 14 | Semantic Fossils | 🟢15 | Low | N/A | - |
| 15 | Pre-Constitutional Terminology | 🟢18 | Low | 1 week | - |

---

## HEAT AGGREGATION

**Total Semantic Debt:** 875 points (across 15 items)

**Average Heat Per Item:** 58/100 = MEDIUM-HIGH

**Heat Distribution:**
- 🔴 RED (critical): 3 items (22%)
- 🟠 ORANGE (high): 5 items (33%)
- 🟡 YELLOW (medium): 6 items (40%)
- 🟢 GREEN (low): 2 items (5%)

**Danger Profile:**
- CRITICAL MASS: 3 items in red zone
- URGENT: 5 items in orange zone
- MANAGEABLE: 6 items in yellow zone
- CONTAINED: 2 items in green zone

---

## REMEDIATION ROADMAP

### Phase 0 (Immediate - Week 1)
- Consolidate docker-compose (1 item)
- Mark terminology (1 item)
- Total heat reduction: 63 points (7% reduction)

### Phase 1 (Urgent - Weeks 2-4)
- Eliminate WitnessAuthority (1 item: 72 points)
- Eliminate CanonicalHashAuthority (1 item: 70 points)
- Eliminate KernelCommitService (1 item: 75 points)
- Implement ByteAuthority (1 item: 85 points)
- Implement FingerprintAuthority (1 item: 82 points)
- Total heat reduction: 384 points (44% reduction)

### Phase 2 (Important - Weeks 4-8)
- Implement Policy Authority (1 item: 90 points)
- Enforce embeddings isolation (1 item: 68 points)
- Enforce cache invalidation (1 item: 65 points)
- Update documentation (1 item: 50 points)
- Total heat reduction: 273 points (31% reduction)

### Phase 3 (Polish - Weeks 8-10)
- Refactor agent infrastructure (1 item: 48 points)
- Mark Neo4j prevention (1 item: 52 points)
- Mark creator system legacy (1 item: 42 points)
- Total heat reduction: 142 points (16% reduction)

**Post-Remediation Total:** ~36 points (4% semantic debt)  
**Estimated Completion:** 10 weeks

---

## RISK SUMMARY

**Current State:**
- HIGH semantic debt (875 points)
- 3 critical items requiring immediate attention
- 5 high-risk items needing urgent remediation
- Completion critical for Layer 1 freeze

**Post-Remediation State (10 weeks):**
- LOW semantic debt (36 points)
- All critical items addressed
- Constitutional consistency 88+/100
- Ready for production deployment

---

**End of Heatmap**
