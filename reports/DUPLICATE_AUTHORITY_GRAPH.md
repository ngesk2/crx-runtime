# DUPLICATE_AUTHORITY_GRAPH.md

**Generated:** 2026-06-07
**Method:** Direct source comparison of all competing implementations

---

## FINGERPRINT DOMAIN — 3 COMPETING AUTHORITIES

```
canonical_fingerprint_service.js (479 LOC) ← WINNER
├── 14 fingerprint domains
├── NFC normalization
├── Circular reference detection
├── Type rejection (BigInt, Symbol, Function, undefined)
├── verifyFingerprint()
├── Schema version: fingerprint.schema.3.0
└── Node.js syntax: VERIFIED OK

identity_engine.ts (15 LOC) ← LOSER
├── 0 domains
├── No normalization
├── No circular detection
├── No type rejection
├── No verification
├── No schema version
└── Compiles: YES

canonical_engine.ts (18 LOC) ← LOSER
├── 0 domains
├── No normalization
├── No circular detection
├── No type rejection
├── No error handling
├── No schema version
└── Compiles: YES

canonical.py.docx (~400 chars Python) ← LEGACY
├── 0 domains
├── json.dumps(sort_keys=True)
├── No normalization
├── No verification
└── Format: Python embedded in .docx (extractable)
```

**Resolution:** `canonical_fingerprint_service.js` wins. Port to TypeScript. Deprecate `identity_engine.ts` and `canonical_engine.ts` to `archives/`. Preserve `canonical.py.docx` in `archives/python-legacy/`.

---

## LINEAGE DOMAIN — 2 COMPETING AUTHORITIES

```
formal_invariant_graph_verifier.js (262 LOC) ← WINNER
├── Full DFS cycle detection
├── Required edge verification (8 edges)
├── Forbidden edge detection (5 bypass patterns)
├── Invariant topology binding (9 nodes)
├── Graph fingerprinting
├── Domain-separated (STRUCTURAL_NODE)
└── Node.js syntax: VERIFIED OK

dag_validator.ts (13 LOC) ← LOSER
├── Direct self-loop check only
├── Duplicate parent check only
├── No transitive cycle detection
├── No graph fingerprinting
├── No invariant binding
└── Compiles: YES

graph_primitives.py.docx (~7629 chars Python) ← LEGACY
├── Partial graph primitives
├── Python in .docx format
└── Extractable: YES
```

**Resolution:** `formal_invariant_graph_verifier.js` wins. Port to TypeScript. Deprecate `dag_validator.ts` to `archives/`.

---

## EVENT DOMAIN — 5 COMPETING SCHEMAS

```
canonical-event-envelope.json (CascadeProjects) ← WINNER (schema)
├── 7 required fields
├── UUID v4 event_id
├── ISO 8601 timestamp
├── lineage (parent_event_ids, causal_chain)
├── policy_version
└── actor_id

init-db.sql (integration lab) ← WINNER (implementation)
├── 10+ tables
├── events table with UUID, actor_id, timestamptz, payload JSONB, lineage JSONB
├── GIN indexes for JSONB
├── policy_evaluations table
├── lineage_chains table
├── replay_snapshots table
└── constitutional_violations table

event_log.ts (runtime) ← LOSER
├── 2 fields only (event_type, payload)
├── No event_id
├── No actor attribution
├── No fingerprint
├── No lineage
└── No policy version

audit-event.schema.json (CRX/vos) ← DOMAIN-SPECIFIC
├── 8 fields
├── Audit domain only
└── Quarantine to audit domain

claim.schema.json (CRX/knowledge) ← DOMAIN-SPECIFIC
├── 9 required fields
├── UCIA domain only
└── Quarantine to UCIA domain
```

**Resolution:** Adopt `canonical-event-envelope.json` as canonical schema. Adopt `init-db.sql` as canonical persistence schema. Refactor `event_log.ts` to use canonical envelope. Quarantine domain-specific schemas.

---

## PERSISTENCE DOMAIN — 2 COMPETING SCHEMAS

```
init-db.sql (156 LOC, integration lab) ← WINNER
├── events, policy_evaluations, lineage_chains, replay_snapshots
├── constitutional_violations, agent_executions
├── facts, claims, rules, audit_log
├── GIN indexes, foreign keys
└── UUID primary keys

ledger_schema.sql (20 LOC, runtime) ← LOSER
├── 3 tables only (artifacts, lineage_edges, execution_events)
├── No indexes for lineage traversal
├── No GIN indexes
├── No policy tables
└── No state tables
```

**Resolution:** Replace `ledger_schema.sql` with `init-db.sql`.

---

## REPLAY DOMAIN — 1 IMPLEMENTATION (NO COMPETITION)

```
deterministic_replay_harness.js (296 LOC) ← SOLE IMPLEMENTATION
├── Double-execution replay proof
├── Snapshot binding verification
├── Registry binding verification
├── Invariant topology binding
├── Deterministic ordering
├── Fingerprint verification
├── State reconstruction
├── Transcript generation
├── Drift detection
└── Strict replay mode

delta_engine.py.docx (~1549 chars Python) ← LEGACY
├── Partial delta engine
├── Python in .docx
└── Extractable: YES

snapshot_reconstructor.py.docx (~2231 chars Python) ← LEGACY
├── Partial reconstructor
├── Python in .docx
└── Extractable: YES
```

**Resolution:** `deterministic_replay_harness.js` is the only complete replay implementation. Port to TypeScript. No competition.

---

## WITNESS DOMAIN — 1 IMPLEMENTATION SET (NO COMPETITION)

```
merkle_anchor_chain_validator.js (220 LOC) ← PRIMARY
merkle_anchor_replay_verifier.js (234 LOC) ← SUPPORTING
cross_anchor_drift_detector.js (258 LOC) ← SUPPORTING
authority_boundary_prover.js (342 LOC) ← SUPPORTING
execution_integrity_auditor.js (395 LOC) ← SUPPORTING
+ 10 additional Merkle/drift modules
```

**Resolution:** 15+ modules form a complete witness system. No competition. Port all to TypeScript.

---

## POLICY DOMAIN — 1 IMPLEMENTATION (NO COMPETITION)

```
constitutional_ci_gate.js (872 LOC) ← SOLE IMPLEMENTATION
├── Sovereign constitutional deployment gate
├── Blocks if ANY invariant fails
├── Validates: snapshot isolation, projection containment, artifact neutrality,
│   structural identity stability, scheduler determinism, replay equivalence,
│   registry sovereignty, domain separation, entropy containment
└── Node.js syntax: VERIFIED OK

plugin_contract_validator.js (422 LOC) ← SUPPORTING
policy table (init-db.sql) ← SCHEMA ONLY
```

**Resolution:** `constitutional_ci_gate.js` is the only policy engine. Port to TypeScript.

---

## STATE DOMAIN — NO IMPLEMENTATION

```
constitutional-state.schema.json ← SCHEMA ONLY (Codex/2026-06-04/outputs/)
snapshot_schema.py.docx ← LEGACY (Python in .docx)
replay_snapshots table (init-db.sql) ← SCHEMA ONLY
```

**Resolution:** State Authority is the ONLY capability with no executable implementation. Must be built from schema definitions.

---

## CONSOLIDATION SUMMARY

| Domain | Competing Authorities | Winner | Losers | Action |
|--------|----------------------|--------|--------|--------|
| Fingerprint | 3 | canonical_fingerprint_service.js | identity_engine.ts, canonical_engine.ts | Port + deprecate |
| Lineage | 2 | formal_invariant_graph_verifier.js | dag_validator.ts | Port + deprecate |
| Event | 5 schemas | canonical-event-envelope.json + init-db.sql | event_log.ts, domain schemas | Adopt + quarantine |
| Persistence | 2 | init-db.sql | ledger_schema.sql | Replace |
| Replay | 1 | deterministic_replay_harness.js | (none) | Port |
| Witness | 15 modules | merkle_anchor_chain_validator.js + 14 | (none) | Port all |
| Policy | 1 | constitutional_ci_gate.js | (none) | Port |
| State | 0 | **NONE EXISTS** | (none) | Build from schema |

---

**Classification:** FACT (all comparisons based on direct source inspection)
**Confidence:** HIGH
