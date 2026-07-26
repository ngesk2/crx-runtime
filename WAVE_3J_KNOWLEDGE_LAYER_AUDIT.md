# WAVE 3J — KNOWLEDGE LAYER AUDIT (Read-Only)

**Mode:** Read-only audit. No code changes.
**Basis:** SPRINT4_INFRASTRUCTURE_AUDIT.md (HPP owns Knowledge), WAVE_3E_ORACLE_HOSTING_ARCHITECTURE.md §3 (Neo4j/Qdrant hosted Oracle, owned HPP), WAVE_3A5_OPERATIONAL_INVENTORY_AUDIT.md §3.1 (knowledge/graph.py World-B leak), PING_V2_CONSTITUTIONAL_OPERATIONAL_PLANE.md (Knowledge = replay-computed Facts), HAIOS brief (knowledge graph, deduplication, reconciliation).
**Role:** the Knowledge Layer is **HPP-owned institutional memory** — the canonical business-object graph. Oracle hosts the stores; PING executes graph queries operationally; HPP owns the meaning.

---

## 1. Knowledge Layer Definition

Per HAIOS + SPRINT4, the Knowledge Layer is the company's **institutional memory**:
- Business objects (Customer, Project, Photo, Service, Estimate, Review…)
- Their relationships (knowledge graph)
- Derived facts (replay-computed)

```
Canonical Events (PING event store, source of truth)
   ↓ (replay → facts)
Knowledge Graph (Neo4j — HPP-owned, Oracle-hosted)
   ↓ (vectors)
Qdrant (HPP-owned, Oracle-hosted)
```

PING v2: "Knowledge = replay-computed Facts." The graph is **derived**, not hand-authored — preventing drift.

---

## 2. Ownership (three-tier)

| Concern | Hosted by | Managed by | Owned by |
|---|---|---|---|
| Neo4j (graph) | Oracle | PING | **HPP** (graph contents) |
| Qdrant (vectors) | Oracle | PING | **HPP** (vectors) |
| Knowledge meaning | — | — | **HPP** (constitution/IR) |

This resolves the SPRINT4 Knowledge ambiguity: **Oracle hosts, PING manages runtime, HPP owns meaning.** No overlap.

---

## 3. Module Inventory

| Module | Role (evidence) | Status |
|---|---|---|
| `knowledge/graph.py` (root) | Knowledge graph (World-B Hermes leak) [WAVE_3A5 §3.1] | present, **mis-owned** (leak) |
| `runtime/knowledge/knowledge_graph.py` | Runtime knowledge graph copy | present |
| Neo4j (store) | Graph DB (Oracle-hosted, HPP-owned) | infra-specified (WAVE_3E) |
| Qdrant (store) | Vector DB (Oracle-hosted, HPP-owned) | infra-specified (WAVE_3E) |

**Finding:** the knowledge graph has a **World-B (Hermes) leak** at root `knowledge/graph.py` (flagged WAVE_3A5 §3.1 + WAVE_3A7 R8). It should be refactored into `runtime/knowledge/knowledge_graph.py` (or a clean HPP-owned module). This is a **mis-ownership**, not a missing module.

---

## 4. Knowledge Graph Shape (DAG, not chain)

HAIOS drew the graph as a linear chain (Photo→Project→Service→Homepage→Estimate→Marketing). The audit corrected this: real relationships are a **DAG** (many-to-many). The IR `Edge` model (pointer, not copy) enforces this:

```
Photo ──owned-by──▶ Project ──has──▶ Service ──appears-on──▶ Homepage
                              │                        │
                              └── generates ──▶ Estimate ──▶ Marketing
Customer ──owns──▶ Project ──▶ Review
```

**Single-owner preserved:** every Node has one Authority; every Edge is a *pointer*, not a copy. No duplicated ownership (HAIOS rule).

---

## 5. Deduplication / Reconciliation

| Concern | Mechanism | Status |
|---|---|---|
| Duplicate business objects | Canonical ID (Authority) per Node | IR-enforced (types.ts) |
| Duplicate relationships | Edge = pointer, not copy | IR-enforced |
| Orphaned facts | Replay rebuilds from event store | event-sourced (WAVE_3F) |
| Reconciliation | Replay-computed Facts (PING v2) | present (concept) |

**Finding:** deduplication is **structurally enforced** by the IR (canonical ID + pointer edges). No separate dedup service needed. The knowledge graph is derived from canonical events → always consistent.

---

## 6. Boundary Verification

| Check | Result | Evidence |
|---|---|---|
| HPP owns knowledge meaning | ✅ | SPRINT4 |
| Oracle hosts, PING manages, HPP owns | ✅ | WAVE_3E §3 |
| PING executes graph queries (operational) | ✅ | runtime/knowledge/knowledge_graph.py |
| Knowledge derived from canonical events | ✅ | PING v2 (replay-computed Facts) |
| No business authority in PING | ✅ | WAVE_3A5 §2 |
| No Oracle publication | ✅ | BI Boundary §9 |

---

## 7. What Exists vs Missing

**Exists:** IR Edge model (pointer-based, dedupe-enforced), runtime knowledge graph module, Neo4j/Qdrant infra-spec (Oracle-hosted), replay-derived facts concept.

**Missing (informational):**
- Clean HPP-owned knowledge module (root `knowledge/graph.py` leak R8 un-fixed — refactor, don't rebuild).
- Knowledge Constitution spec (canonical object → graph mapping document) — should be authored by HPP, not PING.
- Event Generator (WAVE_3B P003) populates the facts that feed the graph.

**Not missing (don't rebuild):** the graph store (Neo4j/Qdrant exist, hosted Oracle, owned HPP).

---

## 8. What NOT to Build (preserve freeze)

| Tempting knowledge feature | Verdict | Reason |
|---|---|---|
| New knowledge store | ❌ DON'T | Neo4j/Qdrant exist (Oracle-hosted, HPP-owned) |
| Business meaning in PING | ❌ DON'T | SPRINT4 (HPP owns Knowledge) |
| Hand-authored facts | ❌ DON'T | facts are replay-computed (PING v2) |
| Separate dedup service | ❌ DON'T | IR pointer-edges enforce dedupe |
| Oracle-owned knowledge | ❌ DON'T | HPP owns meaning (WAVE_3E) |

---

## 9. Build Prerequisites (read-only dependency)

Knowledge Layer is **conceptually complete** (IR-enforced, event-derived). Remaining work (informational):
1. Refactor `knowledge/graph.py` World-B leak → `runtime/knowledge/knowledge_graph.py` (WAVE_3A7 R8).
2. Author Knowledge Constitution spec (HPP-owned document).
3. Event Generator (WAVE_3B P003) populates facts → graph stays consistent.

No architectural change.

---

## 10. Success Criteria (answered)

| Question | Answer |
|---|---|
| Who owns knowledge? | **HPP** (meaning) |
| Who hosts the stores? | **Oracle** (Neo4j/Qdrant) |
| Who executes graph queries? | **PING** (operational) |
| Is the graph a DAG (not chain)? | **YES** (IR pointer-edges) |
| Is dedupe enforced? | **YES** (canonical ID + pointer edges) |
| Are facts replay-computed? | **YES** (PING v2) |
| Any boundary violation? | **NO** — all checks PASS |

*Read-only audit. No code changed. Committed as WAVE_3J_KNOWLEDGE_LAYER_AUDIT.md.*
