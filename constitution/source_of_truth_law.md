# SOURCE OF TRUTH LAW

**Status:** FROZEN CONSTITUTIONAL AUTHORITY
**Scope:** Source of truth ownership and derivation rules only. No implementation details.

---

# SOURCE OF TRUTH PRINCIPLE

## One Authority Per Truth Domain

**AXIOM:** One authority per truth domain. No duplicate canonical owners.

**RATIONALE:** Multiple sources of truth for the same domain create ambiguity, divergence, and corruption risk. Constitutional coherence requires single canonical ownership.

**VIOLATION CONSEQUENCE:** Recursive corruption, unresolvable disputes, replay divergence, verification collapse.

---

# TRUTH DOMAIN CLASSIFICATION

## Source Authority

**DEFINITION:** The ONLY canonical owner of a truth domain.

**PROPERTIES:**
- Owns the root fact
- Defines the canonical representation
- Controls mutation
- Provides verification

**EXAMPLES:**
- Event Recording Authority owns event occurrence facts
- Identity Authority owns identity facts
- Lineage Authority owns lineage edge facts

---

## Generated Derivations

**DEFINITION:** Projections, views, or computed data derived from source authority.

**PROPERTIES:**
- Derived from source authority
- Non-authoritative
- Recomputable from source
- May be cached for performance

**EXAMPLES:**
- State projections derived from replay
- Indexes derived from event stream
- Summaries derived from artifacts

---

## Shadow Copies

**DEFINITION:** Dangerous duplicates that create competing sources of truth.

**PROPERTIES:**
- Duplicate canonical representation
- Independent mutation capability
- Not synchronized with source
- Create ambiguity

**EXAMPLES:**
- Mutable caches of canonical state
- Duplicated YAML configurations
- Runtime patches to invariant definitions
- Shadow databases

---

# TRUTH DOMAIN INVENTORY

## Event Domain

**Source Authority:** Event Recording Authority

**Generated Derivations:**
- Event projections
- Event indexes
- Event summaries

**Shadow Copies (DANGEROUS):**
- Mutable event caches
- Duplicated event logs
- Shadow event databases

---

## Identity Domain

**Source Authority:** Identity Authority

**Generated Derivations:**
- Identity indexes
- Identity lookups
- Identity mappings

**Shadow Copies (DANGEROUS):**
- Mutable identity caches
- Shadow identity registries
- Identity patches

---

## Lineage Domain

**Source Authority:** Lineage Authority

**Generated Derivations:**
- Lineage projections
- Lineage indexes
- Lineage visualizations

**Shadow Copies (DANGEROUS):**
- Mutable lineage caches
- Duplicated lineage graphs
- Shadow lineage databases

---

## Policy Domain

**Source Authority:** Policy Authority

**Generated Derivations:**
- Policy projections
- Policy indexes
- Policy summaries

**Shadow Copies (DANGEROUS):**
- Mutable policy caches
- Duplicated policy configurations
- Shadow policy databases

---

## Replay Domain

**Source Authority:** Replay Authority

**Generated Derivations:**
- State projections
- Replay summaries
- Replay indexes

**Shadow Copies (DANGEROUS):**
- Mutable replay caches
- Shadow replay logs
- Replay patches

---

## State Domain

**Source Authority:** State Authority (derived)

**Generated Derivations:**
- State projections
- State summaries
- State indexes

**Shadow Copies (DANGEROUS):**
- Mutable state caches
- Shadow state databases
- State patches

---

# DERIVATION RULES

## Derivation Requirements

Derivations MUST:
- Be explicitly declared as derived
- Be traceable to source authority
- Be recomputable from source
- Be marked as non-authoritative
- Be invalidated on source mutation

---

## Derivation Verification

Derivations MUST be verified for:
- **Traceability** — Can be traced to source authority
- **Recomputability** — Can be recomputed from source
- **Consistency** — Consistent with source
- **Currency** — Reflects latest source state

---

## Derivation Failure

Derivation failures MUST:
- Fail deterministically with structured failure codes
- Invalidate derivation
- Provide sufficient context for diagnosis
- Trigger recomputation from source

---

# SHADOW COPY PREVENTION

## Prohibited Shadow Copies

The following shadow copies are PROHIBITED:

1. **Mutable caches of canonical state** — Creates competing truth
2. **Duplicated YAML configurations** — Creates configuration ambiguity
3. **Runtime patches to invariant definitions** — Creates invariant drift
4. **Shadow databases** — Creates data divergence
5. **Shadow event logs** — Creates event ambiguity
6. **Shadow identity registries** — Creates identity ambiguity
7. **Shadow lineage graphs** — Creates lineage ambiguity
8. **Shadow policy databases** — Creates policy ambiguity

---

## Shadow Copy Detection

Shadow copies MUST be detected by:
- Authority inventory audit
- Source of truth sweep
- Dependency analysis
- Runtime verification

---

## Shadow Copy Remediation

Shadow copies MUST be remediated by:
- Eliminating shadow copy
- Routing all access to source authority
- Invalidating dependent derivations
- Recording remediation in event stream

---

# SOURCE OF TRUTH VERIFICATION

## Verification Requirements

Source of truth MUST be verified for:
- **Uniqueness** — Only one source authority per domain
- **Canonicality** — Source is authoritative
- **Mutability** — Only source may mutate
- **Traceability** — All derivations trace to source

---

## Verification Failure

Source of truth failures MUST:
- Fail deterministically with structured failure codes
- Prevent mutation from proceeding
- Provide sufficient context for diagnosis
- Trigger constitutional audit

---

# SOURCE OF TRUTH FAILURE SEMANTICS

## Failure Classification

Source of truth failures MUST be deterministic:
- **DUPLICATE_SOURCE_AUTHORITY:** Multiple sources for same truth domain
- **SHADOW_COPY_DETECTED:** Dangerous duplicate detected
- **DERIVATION_DIVERGENCE:** Derivation inconsistent with source
- **UNAUTHORIZED_MUTATION:** Mutation outside source authority
- **SOURCE_UNTRACEABLE:** Derivation cannot be traced to source

## Failure Handling

Source of truth failures MUST:
- Fail deterministically with structured failure codes
- Prevent mutation from proceeding
- Provide sufficient context for diagnosis
- Trigger constitutional audit

---

**Document ID:** CONSTITUTION-SOURCE-OF-TRUTH-LAW-1.0
**Status:** FROZEN
**Amendment:** Requires constitutional amendment process
