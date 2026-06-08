evaluation_context_assembler.js


- Immutable snapshots
- Artifact-bound outputs
- Deterministic replay
- Domain-separated fingerprinting
- Authority containment
- Structural identity binding


That is not infrastructure.


That is a **safe longitudinal memory substrate**.


Now we elevate it into a:


> Teacher-guided longitudinal evaluation memory fabric


But we do it without duplicating layers or introducing conceptual redundancy.


---


# I. First: Redundancy Audit (Brutally Honest)


Let’s examine overlap risks in what you’ve proposed.


### Potential Redundancy Zones


## 1?? Drift Detection vs Structural Drift Guard


You already have:
- structural_drift_guard.js
- snapshot_lineage_integrity_guard.js
- deterministic replay verification


If we introduce:
- memory_drift_detector.js


We must ensure it does **not**:
- Re-validate structural span rules
- Re-validate fingerprint equivalence
- Re-validate scheduler determinism


Instead it must only detect:
- Pedagogical contradictions
- Reinforcement flag inconsistency
- Mastery state regression
- Memory unit conflicts


That’s semantic drift, not structural drift.


If we blur that line ? redundancy.


---


## 2?? Replay Harness vs Memory Validation


Replay harness verifies:
- Byte equivalence
- Fingerprint equivalence
- Artifact ordering
- Entropy stability


If evaluation_context_assembler re-validates fingerprints, or re-verifies artifacts structurally ? redundancy.


It should:
- Trust constitution layer
- Only assemble deterministic bundles


---


## 3?? Semantic Associator vs Structural Graph


You already have:
- Structural identity graph
- Invariant DAG


If semantic_memory_associator starts building graph edges:
You have duplicated graph systems.


Semantic associator must:
- Produce advisory artifacts only
- Never modify structural graph
- Never introduce new identity nodes


Otherwise you create dual topology layers.


---


## 4?? Registry vs Memory Domain Separation


You already have domain registry enforcement.


If we add:
FINGERPRINT_DOMAINS.EVALUATION_MEMORY  
FINGERPRINT_DOMAINS.INSTRUCTIONAL_MEMORY  


We must:
- Add once
- Lock in domain_lockfile
- Never dynamically extend


If memory modules try to declare their own domains ? governance fracture.


---


## 5?? Teacher Curator vs Artifact Firewall


Teacher curator must:
- Operate after artifact firewall
- Never bypass semantic delta validation
- Never write directly into snapshot


If it writes memory units that don’t go through artifact binding ? constitutional break.


---


# II. What Actually Needs Hardening (Not Rebuilding)


Now we look at weak surfaces.


You’re not weak structurally.


You’re weak in these areas:


---


## A. Canonicalization Risk (High Importance)


You rely on JSON.stringify equivalence in multiple modules.


Risk:
- Key order drift
- Unicode normalization drift
- Undefined field omission drift


Patch:
- Introduce canonical_serializer.js
- Strict sorted key ordering
- NFC normalization
- Reject undefined fields
- Deterministic array sorting where required


Replace all JSON.stringify comparisons with canonical serializer.


This is silent determinism risk.


---


## B. Artifact Schema Strictness (Medium)


You validate required fields.


You do not strictly reject unknown fields.


That allows:
- Hidden authority fields
- Hidden ranking hints
- Future injection vectors


Patch:
Exact allowed-key enforcement.


No extra keys allowed.


---


## C. Authority Neutrality Check Loophole (Critical)


If anywhere you have:


artifact.declaredNonAuthoritative === true || true


That is a constitutional bypass.


It must be:


artifact.declaredNonAuthoritative === true


No OR.
No fallback.
No auto default.


---


## D. Entropy Boundary Trust (Medium-High)


Worker reports entropy usage.
Scheduler trusts report.


You should:
- Hash entropy report
- Bind to execution record fingerprint
- Replay-verify entropy usage


Otherwise malicious plugin could lie about entropy usage.


---


## E. Domain Registry Freeze Verification


You freeze registry.


But do you assert in CI that:
Object.isFrozen(DOMAIN_REGISTRY) === true ?


Add:
registry_freeze_verifier.js
