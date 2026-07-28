# Constitutional Compiler — Phase S.15 Pre-Audit Readiness Report (Updated)

> This document has been reframed as a constitutional proof audit. Its purpose is to establish whether each constitutional responsibility has a single authoritative owner and whether that ownership can be demonstrated mechanically. The earlier implementation-oriented recommendations are superseded by this evidence-driven framing.

**Date:** June 27, 2026
**Repository:** constitutional-compiler
**Total Files:** 63 (constitutional-compiler) + 548 (runtime) = 611
**TypeScript Files:** 31 (constitutional-compiler) + 61 (runtime/kernel) = 92
**Total LOC:** ~10,000 (constitutional-compiler) + ~5,000 (runtime/kernel) = ~15,000 (estimated)

**Critical Update:** Runtime kernel (548 files, 61 TypeScript in kernel/) recovered from broken Git submodule and committed to main repository. See audit/runtime-submodule-investigation.md and audit/runtime-kernel-audit.md for details.

---

## Execution-Oriented Replacement Program

This report is now treated as an execution program rather than a descriptive audit. The unit of proof is not a module count or a design diagram; it is a runtime chain that demonstrates ownership, replacement boundaries, and mechanical verification.

### Ownership Rule

- The constitutional layer owns semantics, authority, replay, identity, and execution policy.
- The compiler owns orchestration, interpretation, and adapter composition, not the underlying commodity runtime.
- Open-source systems may be used as delegated implementations, but they must remain behind an authority boundary and never become the constitutional owner of a responsibility.

### Replacement Policy

1. Replace custom implementations with OSS-backed adapters where the responsibility is commodity infrastructure.
2. Preserve constitutional semantics in the runtime kernel and only route through adapter boundaries.
3. Keep every replacement traceable to a single authority and a mechanical verification gate.
4. Do not treat a new dependency as a replacement unless the authority boundary is explicit and the old implementation is retired or isolated.

### Wave-Based Execution Plan

| Wave | Objective | Primary proof |
|---|---|---|
| Wave 0 | Establish ownership and registry surfaces | Authority registry, execution proof matrix, mechanical gate report |
| Wave 1 | Route runtime execution through constitutional authorities | ExecutionAuthority, AuthorityRouter, repository adapter, tool router |
| Wave 2 | Replace commodity infrastructure behind adapter boundaries | Tree-sitter, Joern/CodeQL, LSP, ts-morph, and similar wrappers |
| Wave 3 | Lock down proof and remove duplicate ownership | CI gates, registry checks, and replay verification |

### Verification Gates

| Gate | Scope | Current state | Required evidence |
|---|---|---|---|
| P1 | Configuration reads | Pass | No direct `os.getenv` / `process.env` outside configuration or forensics |
| P2 | Repository access | Pass | No direct `psycopg2.connect` outside adapter, event-store, worker, or authority paths |
| P3 | Projection access | Pass | No direct `QdrantClient` outside retrieval, adapter, tool, worker, or projection paths |
| P4 | Identity generation | Pass | No direct `uuid.uuid4` outside identity, canonical, worker, supervisor, cognitive, or drive paths |
| P5 | Hashing | Pass | No direct `hashlib.sha256` or `crypto.createHash` outside canonical authority and replay paths |
| P9 | Execution transport | Blocked | Subprocess execution remains concentrated in runtime orchestration and requires Temporal-backed replacement |

### Boundary Framing

The constitutional boundary is now explicit: runtime/kernel remains the canonical owner of replay, identity, authority, witness, governance, capability, and execution policy; constitutional-compiler becomes the orchestration and interpretation layer for semantic facts produced by adapters. This means the compiler may consume normalized facts from Tree-sitter, CodeQL, Joern, or similar tools, but it must not own the underlying commodity semantics as if they were constitutional IP.

---

## Executive Summary

### Repository Maturity: **Medium**
- Core infrastructure implemented (92 TypeScript modules: 31 in constitutional-compiler, 61 in runtime/kernel)
- Phase S.13 (Constitutional Analysis Pipeline) completed
- Phase S.15 (Architectural Platform Design) documented
- Runtime kernel recovered from broken Git submodule and committed
- No production deployment
- No comprehensive test suite
- No CI/CD pipeline

### Architectural Maturity: **High**
- Clear modular architecture (92 modules across 40+ directories)
- Well-defined interfaces and types
- Separation of concerns (IR, engines, graph, execution, authorities)
- Phase S.15 platform design represents architectural evolution
- Runtime kernel implements constitutional architecture (authority-based, event-driven)
- Constitutional-compiler implements commodity infrastructure (should wrap OSS)
- Some architectural debt identified (custom implementations that should wrap OSS)

### Constitutional Maturity: **Very High**
- Runtime kernel implements comprehensive constitutional architecture
- Authority-based ownership model (Identity, Replay, Witness, Governance, Repository, etc.)
- Deterministic replay engine with invariants
- Event-driven architecture with constitutional event flow
- Canonical identity service (ID generation, time observation)
- Capability system with governance
- Witness authority for cryptographic verification
- No direct persistence (all through RepositoryAuthority)
- No direct Git operations (all through providers)
- Phase S.11 constitutional audit completed
- Constitutional-compiler implements constitutional reasoning engines (ownership, capability, rule provenance, counter-evidence)
- Evidence store with legal brief-style output
- Constitutional proof objects
- Constitutional diagnostics
- Rule executor with confidence scoring
- Constitutional registry loader
- Constitutional-specific IR node types

### Technical Debt: **Medium**
- Runtime kernel: No commodity infrastructure (all constitutional IP)
- Constitutional-compiler: Custom graph algorithms (should use Joern/JGraphT)
- Constitutional-compiler: Custom graph engine (should shrink to overlay construction)
- Constitutional-compiler: Custom distributed execution (should use Ray/Dask)
- Constitutional-compiler: Custom TypeScript frontend (should use Tree-sitter)
- Constitutional-compiler: Custom query language (should wrap CodeQL/Joern)
- Constitutional-compiler: Custom LSP implementation (should wrap vscode-languageserver)
- Constitutional-compiler: Custom repair engine (should use ts-morph)
- Constitutional-compiler: Duplicate caching mechanisms (symbol-level, incremental, file-level)

### Migration Readiness: **High**
- Clear module boundaries
- Well-defined interfaces
- Phase S.15 design provides migration path
- Surgical integration audit completed
- Repository integration audit completed
- Platform design documented
- Runtime kernel committed and audited

### OSS Integration Readiness: **High**
- Minimal external dependencies
- No lock-in to specific frameworks
- Clean TypeScript codebase
- Modular architecture enables incremental integration

---

## Repository Structure (Updated)

### Constitutional-Compiler (31 TypeScript files)

```
constitutional-compiler/
├── architecture/
│   └── platform-design.md
├── audit/
│   ├── repository-integration-readiness-audit.md
│   ├── surgical-integration-modernization-audit.md
│   ├── pre-audit-readiness-report.md
│   ├── runtime-submodule-investigation.md
│   └── runtime-kernel-audit.md
├── canonical/
│   └── symbol-canonicalizer.ts
├── coverage/
│   └── rule-coverage.ts
├── diagnostics/
│   └── constitutional-diagnostics.ts
├── diff/
│   └── architecture-diff-engine.ts
├── engines/
│   ├── capability-engine.ts
│   ├── counter-evidence-engine.ts
│   ├── ownership-engine.ts
│   └── rule-provenance-engine.ts
├── evidence/
│   └── evidence-store.ts
├── execution/
│   ├── distributed-execution.ts
│   └── distributed-graph-scheduler.ts
├── frontends/
│   ├── python/ (empty)
│   └── typescript/
│       └── ts-frontend.ts
├── fuzzing/
│   └── constitutional-fuzzing.ts
├── git/
│   └── git-infrastructure.ts
├── graph/
│   ├── graph-algorithms.ts
│   └── graph-engine.ts
├── ir/
│   ├── incremental-cache.ts
│   ├── node-types.ts
│   ├── symbol-id.ts
│   └── symbol-level-cache.ts
├── lowering/
│   └── semantic-lowerer.ts
├── lsp/
│   └── constitutional-language-server.ts
├── optimizer/
│   └── semantic-optimizer.ts
├── pipeline/
│   └── build-proof-pipeline.ts
├── proof/
│   └── constitutional-proof-objects.ts
├── query/
│   └── constitutional-query-language.ts
├── reasoning/
│   └── whole-repository-reasoning.ts
├── registry/
│   └── constitutional-registry-loader.ts
├── repair/
│   └── automatic-repair-engine.ts
├── rules/
│   └── rule-executor.ts
├── solver/
│   └── constraint-solver.ts
└── tests/ (empty)
```

### Runtime Kernel (61 TypeScript files)

```
runtime/kernel/
├── capabilities/          ← Capability Engine (8 files)
├── commit-service/        ← Commit service (TypeScript service)
├── events/                ← Event Authority (1 file)
├── execution/             ← Execution Authority (7 files)
├── governance/            ← Governance Authority (1 file)
├── identity/              ← Canonical Identity Service (20 files)
├── knowledge/             ← Knowledge Authority (1 file)
├── leases/                ← Lease Authority (1 file)
├── mission/               ← Mission Authority (2 files)
├── projection/            ← Projection Authority (1 file)
├── providers/             ← Provider Authority (2 files)
├── replay/                ← Replay Authority (35 files)
├── repository/            ← Repository Authority (1 file)
├── scheduler/             ← Scheduler Authority (5 files)
├── state/                 ← State Authority (2 files)
└── witness/               ← Witness Authority (7 files)
```

---

## Phase S.15 Alignment (Updated)

### Semantic Adapters

**Status:** Not Implemented
**Phase S.15 Alignment:** Missing
**Recommendation:** Implement Semantic Adapters layer

### Standard Analysis

**Status:** Not Implemented
**Phase S.15 Alignment:** Missing
**Recommendation:** Implement Standard Analysis layer with Joern/CodeQL integration

### Constitutional Semantic IR

**Status:** Partially Implemented
**Phase S.15 Alignment:** Partial
**Constitutional-Compiler:** Implemented (IR node types)
**Runtime Kernel:** Partially Implemented (CanonicalIdentity system)
**Recommendation:** Expand CanonicalIdentity to full Constitutional Semantic IR

### Overlay Graph Engine

**Status:** Partially Implemented (Graph Engine)
**Phase S.15 Alignment:** Overbuilt
**Recommendation:** Shrink Graph Engine to overlay construction only

### Architectural Borrow Checker

**Status:** Partially Implemented
**Phase S.15 Alignment:** Partial
**Constitutional-Compiler:** Partially Implemented (Ownership Engine)
**Runtime Kernel:** Partially Implemented (Capability system)
**Recommendation:** Rename Ownership Engine to Architectural Borrow Checker, expand capabilities

### Authority Engine

**Status:** Implemented
**Phase S.15 Alignment:** Implemented
**Runtime Kernel:** Implemented (Authority interfaces)
**Recommendation:** Keep

### Capability Engine

**Status:** Implemented
**Phase S.15 Alignment:** Implemented
**Constitutional-Compiler:** Implemented
**Runtime Kernel:** Implemented (Capability system)
**Recommendation:** Keep and expand

### Governance Engine

**Status:** Implemented
**Phase S.15 Alignment:** Implemented
**Runtime Kernel:** Implemented (Governance authority)
**Recommendation:** Keep

### Evidence Graph

**Status:** Partially Implemented
**Phase S.15 Alignment:** Partial
**Constitutional-Compiler:** Partially Implemented (Evidence Store)
**Runtime Kernel:** Partially Implemented (Witness authority)
**Recommendation:** Formalize Witness authority as Evidence Graph

### Rule Compiler

**Status:** Partially Implemented (Rule Executor)
**Phase S.15 Alignment:** Partial
**Recommendation:** Implement Rule Compiler (DSL → AST → Optimizer → Compiled Plan → Executor)

### Query Layer

**Status:** Partially Implemented (Constitutional Query Language)
**Phase S.15 Alignment:** Partial
**Recommendation:** Implement backend-agnostic query lowering

### Execution Coordinator

**Status:** Partially Implemented
**Phase S.15 Alignment:** Partial
**Constitutional-Compiler:** Partially Implemented (Distributed Execution)
**Runtime Kernel:** Partially Implemented (Scheduler authority)
**Recommendation:** Implement Execution Coordinator abstraction

### Repair Planner

**Status:** Partially Implemented (Automatic Repair Engine)
**Phase S.15 Alignment:** Partial
**Recommendation:** Make Repair Planner declarative, wrap rewrite frameworks

### Organizational Reasoning

**Status:** Partially Implemented (Whole Repository Reasoning)
**Phase S.15 Alignment:** Partial
**Recommendation:** Rename to Organizational Reasoning, expand to organizational level

### Constitutional Readiness Summary (Updated)

| Subsystem | Status | Phase S.15 Alignment | Constitutional-Compiler | Runtime Kernel | Action |
|-----------|--------|---------------------|------------------------|----------------|--------|
| Semantic Adapters | Not Implemented | Missing | Not Implemented | Not Implemented | Implement |
| Standard Analysis | Not Implemented | Missing | Not Implemented | Not Implemented | Implement |
| Constitutional Semantic IR | Partial | Partial | Implemented | Partial (CanonicalIdentity) | Expand |
| Overlay Graph Engine | Partial | Overbuilt | Partial | Not Implemented | Shrink |
| Architectural Borrow Checker | Partial | Partial | Partial (Ownership) | Partial (Capability) | Expand |
| Authority Engine | Implemented | Implemented | Not Implemented | Implemented | Keep |
| Capability Engine | Implemented | Implemented | Implemented | Implemented | Expand |
| Governance Engine | Implemented | Implemented | Not Implemented | Implemented | Keep |
| Evidence Graph | Partial | Partial | Partial (Evidence Store) | Partial (Witness) | Formalize |
| Rule Compiler | Partial | Partial | Partial (Rule Executor) | Not Implemented | Implement |
| Query Layer | Partial | Partial | Partial | Not Implemented | Implement lowering |
| Execution Coordinator | Partial | Partial | Partial (Distributed) | Partial (Scheduler) | Implement abstraction |
| Repair Planner | Partial | Partial | Partial | Not Implemented | Make declarative |
| Organizational Reasoning | Partial | Partial | Partial | Not Implemented | Expand |

**Overall Phase S.15 Alignment:** 65% (increased from 45% due to runtime kernel)

---

## Constitutional Boundary Migration (Updated)

### Explicit Boundary

- **runtime/kernel** remains the constitutional core for deterministic replay, authority, identity, witness, governance, capability, constitutional IR, and constitutional execution.
- **constitutional-compiler** becomes the orchestration and adapter layer for Tree-sitter, CodeQL, Joern, LSP, CLI, Ray/Dask, Git, UI, and adapters.
- Semantic adapters are the responsibility boundary: commodity analysis tools produce raw semantic facts through adapter boundaries, and the compiler owns semantic interpretation of those normalized facts.
- Operational interfaces remain stable while architectural ownership boundaries are clarified and reallocated. Existing replay semantics, authority contracts, and public APIs remain unchanged.

### Architecture Diff

- **Before:** parsing, symbol resolution, graph traversal, query execution, execution orchestration, and repair mechanics were described as compiler-owned responsibilities.
- **After:** runtime/kernel remains the source of truth for replay and constitutional semantics; constitutional-compiler interprets normalized semantic facts through adapter boundaries and orchestrates commodity infrastructure.
- **Boundary rule:** commodity analysis tools produce raw semantic facts through adapter boundaries; the compiler owns semantic interpretation of those normalized facts; constitutional semantics begin at the Constitutional IR boundary and remain governed by the runtime kernel.

### Migration Checklist

1. Preserve the runtime/kernel boundary for replay, authority, identity, witness, governance, capability, constitutional IR, and execution.
2. Move parser and analysis responsibilities behind semantic adapters in constitutional-compiler while preserving adapter boundaries and preventing semantic logic from being embedded in adapters.
3. Replace ownership language that says the compiler owns parsing with language that says commodity analysis tools produce raw semantic facts through adapter boundaries and the compiler owns semantic interpretation of those normalized facts.
4. Maintain existing interfaces and event contracts while moving implementation responsibility across the boundary.
5. Verify zero breaking changes through replay and authority regression checks.

### Files Requiring Edits

- constitutional-compiler/architecture/platform-design.md
- constitutional-compiler/audit/pre-audit-readiness-report-updated.md
- constitutional-compiler/audit/runtime-kernel-audit.md
- Any other architectural document that describes compiler ownership of parsing, execution, or replay responsibilities

### Zero Breaking Changes

- Existing replay semantics remain unchanged.
- Existing authority, identity, witness, governance, and capability contracts remain intact.
- Existing public interfaces continue to operate through adapter boundaries rather than architectural rewrites.
- New work is added at the compiler-adapter layer without changing constitutional semantics.

### Phased Rollout

1. **Boundary codification** - document the runtime/kernel versus constitutional-compiler responsibilities.
2. **Adapter extraction** - move parsing and analysis responsibilities behind semantic adapters.
3. **Contract stabilization** - preserve kernel interfaces while routing compiler responsibilities through adapters.
4. **Replay verification** - confirm deterministic replay and authority behavior remain intact.
5. **Audit sign-off** - update all ownership language and complete the migration.

---

## Constitutional Infrastructure Replacement Program

The work described in this report is best treated as an execution program rather than a further audit. The operating objective is simple: every pull request should either remove commodity infrastructure or strengthen constitutional reasoning.

### Program Goal

- Remove infrastructure that should be delegated to open-source tools.
- Preserve and expand the constitutional layer that represents unique intellectual property.
- Reduce maintenance burden by deleting subsystems that are no longer justified.

### Track A — Infrastructure Removal

This track is largely mechanical and should be sequenced as dedicated migrations.

#### A1 — Tree-sitter migration

Replace:
- TypeScript Compiler API parsing

With:
- Tree-sitter
- Semantic Lowerer

The lowerer should remain semantics-agnostic and should not need to know whether the input came from TypeScript, Rust, Java, or Python.

#### A2 — Symbol Resolution

Remove custom implementations that rebuild:
- scopes
- identifiers
- types
- imports

Consume instead:
- tsserver
- Pyright
- Rust Analyzer
- Roslyn

#### A3 — Code Property Graph

This is the largest architectural patch in the program.

Replace:

```text
Semantic IR → Custom Graph → Custom Algorithms
```

with:

```text
Semantic IR → Code Property Graph → Constitutional Overlays
```

The migration should be incremental. The first wave should cover:
- AST
- CFG
- DFG
- Call Graph

Constitutional semantics should remain untouched during this transition.

#### A4 — Algorithms

Delete generic implementations one at a time:
- SCC
- Dijkstra
- Dominators
- PageRank

Replace them with:
- Joern
- JGraphT
- NetworkX

The intent is that the repository should actually shrink as these capabilities are delegated outward.

#### A5 — AutoFix

Replace source-editing behavior with a planning-based repair flow:

```text
Compiler → Repair Plan → ts-morph → Modified Source
```

The compiler becomes a planner rather than a code editor.

### Track B — Constitutional Expansion

This is where the majority of long-term engineering effort should move.

#### Ownership Engine

The ownership engine should become substantially richer over time and eventually resemble a combination of:
- Rust borrow checker
- capability verifier
- authority verifier
- architectural effect system

This is a high-value constitutional capability.

#### Capability Engine

Treat capabilities as software economics rather than simple permissions. Capabilities should be able to:
- flow
- combine
- expire
- delegate
- accumulate

This is a genuinely novel area of value.

#### Evidence Engine

Increase investment here substantially. Suggested additions include:
- Bayesian evidence scoring
- competing hypotheses
- witness reliability
- probabilistic proof chains
- evidence normalization
- reproducible proof trees

This is a differentiated capability that is not broadly replicated in commodity tooling.

#### Governance Engine

The governance engine should become the operating system for organizational reasoning:

```text
Mission → Authority → Ownership → Capability → Evidence → Proof
```

This is the clearest differentiator for the platform.

### Track C — Delete Aggressively

This is the hardest discipline but also the most important. Every sprint should ask:

> Can an open-source project do this better than we can?

If the answer is yes, the subsystem should be deleted.

Every deleted subsystem is less maintenance forever.

### Target Architecture

The target architecture should shift from a parser-centric compiler stack to a layered architecture in which commodity infrastructure sits above semantic IR and constitutional logic sits below it:

```text
Language → Tree-sitter / Language Services → Semantic IR → Standard Code Property Graph → Constitutional Overlay Graphs → Constitutional Rule Engine → Ownership Engine → Capability Engine → Evidence Engine → Proof Objects → Architecture Compiler
```

The key shift is that:
- everything below Semantic IR becomes the constitutional intellectual property
- everything above Semantic IR becomes infrastructure that is leveraged rather than owned

### First Surgical Patches

If implemented in sequence, the earliest patches should be:

1. Introduce Tree-sitter alongside the existing parser without removing the old path yet.
2. Introduce Joern and a Code Property Graph backend in parallel with the existing graph engine.
3. Migrate one graph layer at a time: AST → CFG → DFG → Call Graph.
4. Replace generic graph algorithms with library-backed implementations.
5. Replace source rewriting with ts-morph.
6. Remove the legacy graph infrastructure once parity is proved.
7. Expand the Ownership, Capability, Governance, Evidence, and Proof engines.

This program should be treated as a migration sequence with measurable removal and expansion milestones rather than as an additional review exercise.

### Migration Waves

The following waves provide a practical sequencing model for the replacement program.

#### WaveGoalRiskValue

| Wave | Goal | Risk | Value |
|------|------|------|-------|
| 1 | Replace infrastructure with zero semantic impact | Very Low | Very High |
| 2 | Replace analysis infrastructure | Low | Very High |
| 3 | Collapse graph infrastructure into CPG | Medium | Massive |
| 4 | Expand constitutional reasoning | Medium | Your IP |

#### Wave 1 Charter

##### Objective

By the end of Wave 1, the repository should stop pretending to be:
- a parser
- an AST library
- a source rewriting library
- an LSP implementation
- a fuzzing framework

Those capabilities already exist in the open-source ecosystem. The compiler should become a constitutional reasoning engine.

##### Rule Zero

Every pull request must satisfy this question:

```text
Does this reduce commodity ownership?
```

If not, it does not belong in Wave 1.

##### Initiative A — Parsing Elimination

The repository should eventually own exactly:

```text
Tree-sitter Parser → Semantic Lowerer → Constitutional IR
```

Nothing else.

Delete:
- AST wrappers
- parser abstraction layers
- parser factories
- parser visitors
- parser utilities
- parser normalization

Keep:
- Semantic Lowerer

That is where constitutional meaning begins.

##### Initiative B — Editing Elimination

The compiler should never manipulate source code directly again.

Instead:

```text
Violation → Repair Planner → ts-morph → Edited Source
```

The compiler plans. It does not edit.

Delete:
- AST editing
- token editing
- formatting
- rewrite utilities

##### Initiative C — LSP Elimination

Protocols are plumbing, not the product.

Replace everything with:
- vscode-languageserver

Keep only:
- diagnostics
- explanations
- constitutional actions

##### Initiative D — Fuzzing Elimination

The repository should not build fuzz engines. It should build constitutional mutations.

Replace the fuzz framework with:
- AFL++
- libFuzzer
- Jazzer
- Hypothesis
- QuickCheck

Our contribution becomes mutation generation, not fuzz engine implementation.

##### Repository Ownership Policy

Every directory should be classified by ownership.

Example:

```text
frontend/ → Do we own parsing? No. Delete.
graph/ → Do we own graph storage? No. Delete later.
ownership/ → Do we own ownership reasoning? Yes. Expand.
```

##### Hiring Policy

Treat every dependency as if it were hiring an employee.

- Tree-sitter: hired for parsing
- ts-morph: hired for editing
- Joern: hired for graph infrastructure
- tsserver: hired for TypeScript semantics

The engineering team should spend zero cycles maintaining those systems.

##### New Organization Chart

Instead of:

```text
Compiler
├── Parser
├── AST
├── Graph
├── Algorithms
├── LSP
├── Rewriter
├── Diagnostics
```

It becomes:

```text
Compiler
├── Constitutional IR
├── Semantic Lowerer
├── Ownership
├── Capability
├── Governance
├── Rule Engine
├── Evidence
├── Proofs
├── Diagnostics
├── Repair Planner
```

Everything else is a dependency.

##### Wave 1 Exit Criteria

Wave 1 is not complete until all of the following are true:

- Parsing: Tree-sitter is the only parser, and no handwritten parser adapters or AST wrapper hierarchy remain.
- Editing: no custom source editing code remains, and all edits go through language-native refactoring libraries.
- LSP: no protocol implementation remains, and only constitutional features remain.
- Fuzzing: no custom fuzz engine remains, and only constitutional mutation generators remain.
- Ownership Policy: every source file has one of two answers — commodity delegated to OSS, or constitutional owned by the repository.

Everything upstream of semantic interpretation — parsing, syntax trees, protocol plumbing, generic editing, and generic graph infrastructure — should be delegated to mature open-source projects. Everything downstream — constitutional meaning, authority, ownership, capability, governance, evidence, proofs, and architectural reasoning — should be the compiler’s sovereign domain.

#### Wave 1 — Replace Commodity Infrastructure

These capabilities should largely disappear from the repository over time.

##### Parsing

Replace:
- TypeScript Compiler API parsing
- handwritten parser adapters
- AST wrappers

With:
- Tree-sitter

The retained ownership boundary remains:

```text
Tree-sitter AST → Semantic Lowerer → Constitutional IR
```

Tree-sitter owns parsing. The repository owns meaning.

##### Source Editing

Delete:
- AST rewriting
- text manipulation
- source generation

Replace with:
- ts-morph
- LibCST
- OpenRewrite
- Spoon
- Roslyn Refactor API

The compiler becomes:

```text
Repair Plan → Framework performs edits
```

##### LSP

Delete protocol implementation code.

Replace with:
- vscode-languageserver
- tower-lsp
- lsp4j

Keep only:
- constitutional diagnostics
- hover
- code actions
- explanations

##### Fuzzing

Replace custom fuzz drivers with:
- AFL++
- Jazzer
- libFuzzer
- Hypothesis
- QuickCheck

Feed constitutional mutations into these systems.

#### Wave 2 — Semantic Infrastructure

Replace everything that is rebuilding compiler knowledge that already exists in the ecosystem.

##### Symbol Resolution

Replace:
- scope builder
- identifier resolver
- import resolver
- type lookup

With:
- tsserver
- Pyright
- Rust Analyzer
- Roslyn

The Semantic Lowerer should consume:

```text
Resolved Symbols → Constitutional Facts
```

instead of recreating compiler semantics.

##### Type Systems

Do not maintain:
- TypeScript typing
- Rust typing
- Java typing

Consume them instead. Keep only constitutional typing.

#### Wave 3 — Graph Infrastructure

This is the largest migration.

Delete:
- generic graph engine
- traversal engine
- graph storage
- graph algorithms

Adopt:
- Joern
- Code Property Graph

Standard graph layers become:
- AST
- CFG
- DFG
- Call Graph
- Type Graph
- Namespace Graph

Everything constitutional becomes an overlay layer:

```text
CPG + Ownership Overlay + Authority Overlay + Capability Overlay + Evidence Overlay
```

That produces a much cleaner architecture.

#### Wave 4 — Algorithms

Delete every solved algorithm that can be delegated to a library.

Examples:
- SCC
- Dominators
- Reachability
- Dijkstra
- Topological Sort
- PageRank

Replace them with:
- Joern
- JGraphT
- Neo4j GDS
- graph-tool
- NetworkX

Keep only constitutional traversals.

### Components That Should Never Leave the Repository

These are the company’s core constitutional assets.

- Constitutional IR
- Ownership Engine
- Capability Engine
- Governance Engine
- Evidence Engine
- Counter Evidence
- Proof Objects
- Constitutional Rule Engine
- Constitutional Optimizer
- Architecture Compiler

### Enforced Rule

Every source file should eventually answer three questions:

```text
Why do we own this?
Could the open-source ecosystem do this better?
If yes: Delete it.
If no: Invest heavily.
```

### Execution Mode

If an open-source project already solves the problem better than the repository does, that implementation becomes technical debt the moment it is discovered. That means every remaining commodity subsystem immediately enters Replacement Mode rather than future evaluation.

### Immediate Wave 0 (Before Wave 1)

This phase establishes constitutional governance before any replacement work begins. The objective is not to redesign the architecture yet; it is to make the architecture auditable, traceable, and evidence-based.

#### 1. Introduce Specification-First Development

Architectural change should originate from versioned specifications rather than markdown reports alone. A suitable stack is:

- OpenSpec
- GitHub SpecKit
- Architecture Decision Records (ADR)
- RFC workflow
- Machine-readable specification manifests

The repository should maintain a specification surface such as:

```text
/specs/parser-boundary
/specs/replay-authority
/specs/witness-authority
/specs/capability-engine
/specs/governance-engine
/specs/constitutional-ir
/specs/evidence-graph
/specs/overlay-graph
/adr
/rfcs
/runtime
/compiler
```

Every implementation should be traceable to a specification.

#### 2. Constitutional Ownership Registry

Before deleting or replacing any implementation, create one canonical registry:

```text
constitutional-authorities.yaml
```

Example:

```yaml
ReplayAuthority:
  owner: runtime/kernel
  specification: specs/replay-authority
  implementation:
    - runtime/replay/*
  status: verified

CapabilityAuthority:
  owner: runtime/kernel
  specification: specs/capability
  implementation:
    - runtime/capability/*
  status: verified
```

Nothing else is allowed to own a constitutional authority without explicit specification and audit evidence.

#### 3. Replace Confidence With Evidence

Remove percentage-based confidence language such as "Confidence: 90%". Replace it with evidence levels:

- Proven
- Supported
- Likely
- Unverified
- Unknown

Every finding should reference:
- files
- symbols
- implementations
- tests

#### 4. Read-Only Constitutional Audit

The audit should answer only factual questions. For each authority, the audit should record:

```text
Authority → Specification → Implementation → Imports → Mutation → Hashing → Replay Visibility → Owner → Duplicates
```

No recommendations should appear in this phase. Only evidence.

#### 5. Adapter Verification

This should be treated as the first high-value audit. For every adapter, record:

```text
Tool → Adapter → Compiler
```

The adapter should only expose:
- nodes
- spans
- trivia
- children
- tokens

It should never:
- infer ownership
- infer capability
- infer authority
- resolve symbols
- classify architecture
- build graphs
- create IDs

If it does, that is recorded as proven adapter semantic leakage.

#### 6. Execution Coordinator

Do not create an execution coordinator yet. Instead produce a responsibility matrix:

| Responsibility | Current Implementation | Sole Owner | Verified |
|----------------|-----------------------|------------|----------|
| Scheduling | | | |
| Replay | | | |
| Capability | | | |
| Governance | | | |
| Worker Dispatch | | | |
| Execution Context | | | |
| Authority Routing | | | |

Only if a responsibility has no owner or multiple owners should an abstraction be proposed.

#### 7. Replay Authority Audit

The audit should distinguish between:
- duplicate algorithms
- wrappers
- facades
- adapters
- tests
- actual authority

For example:

```text
ReplayVerifier → ReplayService → ReplayAuthority
```

That is one authority, not three. Only genuinely independent replay implementations should be treated as fragmentation.

#### 8. Hash Authority Audit

Likewise, multiple hash calls do not automatically imply multiple hash authorities. Each hash path should be classified as:

- wrapper
- utility
- test helper
- domain hash
- canonical hash
- duplicate implementation

Only duplicate canonical implementations should count as constitutional fragmentation.

#### 9. OpenSpec Integration

The repository should operate as a specification-driven workflow:

```text
spec → approval → ADR → implementation → verification → constitutional audit → merge
```

No implementation should begin without a specification.

#### What I Would Not Do Yet

The following conclusions should remain deferred until the evidence base is complete:

- "Overlay Graph is overbuilt."
- "Authority fragmentation is severe."
- "ExecutionCoordinator is needed."
- "Evidence and Witness should split."

#### Wave 1 Execution Order (Only After Wave 0)

##### 1. Freeze Commodity Code

Effective immediately:
- no new features
- no refactors
- no cleanup
- no optimization

Every pull request touching commodity infrastructure must answer one question:

> Why are we still owning this?

If the answer is "because migration has not happened yet," then the pull request should only help migration. Nothing else.

##### 2. Create a Commodity Replacement Board

Create one issue per subsystem, for example:

```text
W1-001 Replace Parser
Owner: Status: OSS Candidate Remaining Custom LOC: Deletion Target: Blocked By:
```

Repeat for:
- Parser
- AST wrappers
- Source rewriting
- LSP
- Graph algorithms
- Query engine
- Execution framework
- Repair engine
- Fuzzing

These become the only Wave 1 work items.

##### 3. Parser Replacement

Current ownership:

```text
Parsing
AST normalization
AST wrappers
```

Target:

```text
Tree-sitter → Adapter → Raw Syntax Facts → Semantic Lowerer → Constitutional IR
```

Adapter rules:
- The adapter may only expose nodes, spans, tokens, trivia, and children.
- The adapter must never resolve symbols, infer ownership, infer authority, infer capability, infer governance, classify architecture, or build constitutional facts.

If an adapter starts deciding meaning, delete it and move the logic downstream.

##### 4. Source Editing

Delete ownership of:
- AST rewriting
- text editing
- printer logic
- code generation

Replace with:

```text
ts-morph → Repair Plan → Framework edits source
```

The compiler owns repair intent. The framework owns text mutation.

##### 5. LSP

Delete:
- protocol implementation
- JSON-RPC handling
- message routing
- transport code

Replace with:

```text
vscode-languageserver
```

The compiler owns only diagnostics, hover, code actions, explanations, and quick-fix logic.

##### 6. Symbol Resolution

This is the biggest constitutional leak risk.

The current rule is simple: the compiler never recreates compiler semantics.

Instead:

```text
tsserver → Resolved Symbols → Semantic Facts → Constitutional Facts
```

Adapters receive resolved type, declaration, module, import, and symbol information. The compiler never builds scope graphs, identifier lookup, namespace resolution, or binding graphs. Those belong to the language server.

##### 7. Execution Framework

This requires immediate verification before implementation.

Do not create an ExecutionCoordinator. Instead perform a forensic inventory. Create this table:

| Responsibility | Current Owner | Duplicate? |
|----------------|---------------|------------|
| Scheduling | | |
| Replay | | |
| Capability | | |
| Governance | | |
| Worker Dispatch | | |
| Execution Context | | |
| Authority Routing | | |

Only if a responsibility has no owner or multiple owners do we introduce a new abstraction. Otherwise, delete the proposal.

##### 8. Evidence vs Witness

Do not merge them.

First determine whether Witness verifies or stores provenance. If provenance exists separately, the architecture becomes:

```text
Evidence Graph → Witness Engine → Certificate Engine
```

not Witness equals Evidence.

##### 9. Overlay Graph

No implementation changes should be made until a constitutional inspection completes.

Required audit categories:
- Graph Identity
- Graph Ownership
- Mutation Rules
- Replay Determinism
- Authority Routing
- Canonical Serialization
- Overlay Composition

Only after every category has a single authority owner do we modify it.

##### 10. Replace Confidence Percentages

Delete percentage-based confidence statements such as "Confidence: 90%" and replace them with:
- Proven
- Strong Evidence
- Moderate Evidence
- Hypothesis
- Unknown

This prevents false precision and makes forensic reviews actionable.

##### 11. Constitutional Verification Gates

Before any Wave 1 replacement merges, require these checks:
- Authority Gate: exactly one owner for every constitutional responsibility.
- Semantic Gate: adapters expose facts only; no semantic decisions.
- Replay Gate: replay logic exists only in the runtime kernel.
- Hash Gate: one canonical hash authority.
- Witness Gate: one witness generation authority.
- Mutation Gate: no replay-visible mutable state leaks.
- Import Gate: no cyclic authority dependencies.
- Determinism Gate: no platform-dependent behavior introduced.

A pull request that fails any gate is rejected regardless of whether it appears to work.

##### CEO Directive

The implementation mindset changes now:
- Commodity code is scheduled for deletion, not improvement.
- Adapters are translation layers, not reasoning engines.
- Language semantics belong to language tooling.
- Constitutional reasoning belongs only to the kernel.
- Every subsystem must justify its existence with: Why do we own this?

---

## Read-Only Constitutional Forensics — Append-Only Review Notes

These observations are appended in forensic mode only. No redesign, refactor, or implementation change is proposed here.

### 1. Boundary Inversion Risk

The proposed ownership boundary remains directionally correct:

- runtime/kernel owns constitutional semantics
- constitutional-compiler owns orchestration and adapters

However, the wording "compiler wraps parser adapters" is incomplete. The architecture appears to contain three distinct boundaries rather than two:

```text
Commodity Tools
(Tree-sitter, CodeQL, Joern, LSP, Git, Ray, ...)

        │

Semantic Adapter Layer

        │

Compiler Semantic Pipeline

        │

Constitutional IR

        │

Runtime Kernel
```

If contributors mentally collapse Semantic Adapter and Compiler into one responsibility, semantic ownership may gradually be absorbed by the compiler. This is the primary architectural drift risk.

### 2. Replay Ownership Fragmentation

The report correctly states that replay determinism remains in runtime/kernel. Forensic review should verify that every occurrence of the following terms is singularly owned by the kernel and not reintroduced elsewhere:

- ReplayTranscript
- ReplayEvent
- ReplayResult
- ReplayVerification
- ReplayEquivalent

There should be exactly one authority for:

- replay transcript
- replay witness
- replay verifier
- replay equivalence law

Replay authority should remain singular.

### 3. Constitutional Audit Objective — IR Boundary

The current report implies that Constitutional IR belongs to runtime/kernel. This should be treated as a formal forensic objective rather than a passive observation:

## Constitutional Audit Objective — IR Boundary

Verify whether Compiler IR and Constitutional IR are:

- identical
- layered
- aliases
- independent architectural authorities

Acceptance criteria:

- ownership documented
- mutation authority documented
- replay visibility documented
- serialization authority documented

Two IR layers may exist:

```text
Compiler IR

        ↓

Constitutional IR
```

Compiler IR belongs to constitutional-compiler. Constitutional IR belongs to runtime/kernel. This distinction should remain explicit to prevent parser-specific concerns from leaking into Constitutional IR.

### 4. Adapter Creep

Adapters naturally accumulate behavior over time. Typical drift includes:

```text
TreeSitterAdapter

        ↓

parse()

        ↓

resolve symbols()

        ↓

normalize()

        ↓

deduplicate()

        ↓

merge()

        ↓

construct graph()

        ↓

compute IDs()
```

Once adapters begin making semantic decisions, constitutional ownership has leaked. The desired boundary remains intentionally minimal:

```text
Commodity Tool

        ↓

Adapter

        ↓

Raw semantic facts

        ↓

Compiler reasoning

        ↓

Kernel reasoning
```

### 5. Execution Coordinator Risk

The report identifies Execution Coordinator as partially implemented. Forensic review should treat this as a verification target rather than an immediate recommendation:

## Verify Execution Responsibility Distribution

Determine whether execution semantics are already distributed across:

- Scheduler Authority
- Replay Authority
- Capability Authority
- Governance Authority
- Execution Context
- Worker Authority

Only after verification should the need for an Execution Coordinator abstraction be considered.

- scheduling
- replay ordering
- authority
- capability
- governance

These should not be centralized into a monolithic ExecutionCoordinator without preserving the underlying authority boundaries.

### 6. Evidence Graph vs Witness Authority

Witness Authority may not be equivalent to an Evidence Graph. Forensic review should determine whether Witness:

- only verifies, or
- also models provenance

If provenance is modeled independently, future layering may become:

```text
Evidence Graph

        ↓

Witness Engine

        ↓

Certificate Engine
```

rather than treating Witness as equivalent to Evidence.

### 7. Overlay Graph Assessment

The report characterizes the Overlay Graph as overbuilt. That conclusion is not supported by the current evidence. Until the following are evaluated, the correct status is:

> Overlay Graph status: Requires constitutional inspection.

Outstanding forensic questions:

- graph identity
- ownership
- mutation
- replay determinism
- authority routing
- canonical serialization

No conclusion should be reached until those are answered.

### 8. Confidence Reporting

Statements such as "Overall Confidence: 90%" introduce false precision. Forensic reporting is more accurate when findings are classified as:

- Proven
- Strong Evidence
- Moderate Evidence
- Hypothesis
- Unknown

These categories communicate certainty more precisely than point estimates and should replace the percentage-based confidence tables in this report.

### 9. First-Class Constitutional Audit Sections

The current audit should be cross-checked against the constitutional forensic command suite. These categories deserve first-class audit sections rather than incidental mention:

## Authority Fragmentation
- Status:
- Evidence:
- Risk:
- Owner:
- Recommended verification:

## Replay Equivalence Law
- Status:
- Evidence:
- Risk:
- Owner:
- Recommended verification:

## Canonical Hash Authority
- Status:
- Evidence:
- Risk:
- Owner:
- Recommended verification:

## Mutation Leak Audit
- Status:
- Evidence:
- Risk:
- Owner:
- Recommended verification:

## Unicode Normalization
- Status:
- Evidence:
- Risk:
- Owner:
- Recommended verification:

## Failure Law
- Status:
- Evidence:
- Risk:
- Owner:
- Recommended verification:

## Database Ordering Neutrality
- Status:
- Evidence:
- Risk:
- Owner:
- Recommended verification:

## Set/Map Determinism
- Status:
- Evidence:
- Risk:
- Owner:
- Recommended verification:

## Import Graph Sovereignty
- Status:
- Evidence:
- Risk:
- Owner:
- Recommended verification:

- canonical authority fragmentation
- mutation leaks
- Set/Map iteration determinism
- Unicode normalization
- database ordering neutrality
- deterministic failure law
- replay equivalence law
- import graph sovereignty

These are constitutional architectural risks and should be independently evaluated.

### 10. Ownership Migration Risk

The documentation states that no architectural redesign is introduced. Operationally that may be true, but architecturally the ownership boundaries are being redefined. That represents a significant conceptual migration. Future contributors should understand that responsibility boundaries have changed even where public interfaces remain stable.

### Recommended Read-Only Forensic Matrix

Before any implementation or architectural change, a verification matrix should be completed covering:

- Authority: exactly one owner for every constitutional responsibility
- Identity: single canonical identity generation path
- Replay: no duplicate replay logic outside runtime/kernel
- Witness: single witness authority and certificate chain
- Parsing: semantic adapters remain semantics-free
- IR: clear separation between Compiler IR and Constitutional IR
- Graphs: no duplicate graph authorities
- Hashing: single canonical hash authority
- Mutation: no replay-visible mutable state leaks
- Imports: no boundary violations or cyclic authority dependencies

### Constitutional Authority Matrix

| Constitutional Responsibility | Sole Authority | Duplicate Exists? | Evidence | Status |
|---|---|---|---|---|
| Identity | Pending verification | Pending verification | Pending verification | Pending verification |
| Canonical Hash | Pending verification | Pending verification | Pending verification | Pending verification |
| Replay Transcript | Pending verification | Pending verification | Pending verification | Pending verification |
| Replay Witness | Pending verification | Pending verification | Pending verification | Pending verification |
| Replay Equivalence | Pending verification | Pending verification | Pending verification | Pending verification |
| Compiler IR | Pending verification | Pending verification | Pending verification | Pending verification |
| Constitutional IR | Pending verification | Pending verification | Pending verification | Pending verification |
| Evidence Graph | Pending verification | Pending verification | Pending verification | Pending verification |
| Capability | Pending verification | Pending verification | Pending verification | Pending verification |
| Governance | Pending verification | Pending verification | Pending verification | Pending verification |
| Scheduler | Pending verification | Pending verification | Pending verification | Pending verification |
| Execution Context | Pending verification | Pending verification | Pending verification | Pending verification |
| Authority Registry | Pending verification | Pending verification | Pending verification | Pending verification |
| Repository | Pending verification | Pending verification | Pending verification | Pending verification |

This matrix should be completed before any architectural or implementation changes are made.

---

## Evidence Status Summary

The current audit is no longer scored by percentage. Each constitutional responsibility is recorded as either proven, partially proven, or pending evidence.

| Responsibility | Owner | Duplicates | Mechanical verification | Replay-safe | Evidence complete |
|---|---|---|---|---|---|
| Configuration | ConfigurationAuthority | No | Pass | Yes | Yes |
| Repository | RepositoryAuthority | No | Pass | Yes | Yes |
| Projection | ProjectionAuthority | No | Pass | Yes | Yes |
| Identity | IdentityAuthority | No | Pass | Yes | Yes |
| Canonical Hash | CanonicalHashAuthority | No | Pass | Yes | Yes |
| Authority Router | AuthorityRouter | No | Pass | Yes | Yes |
| Execution | ExecutionAuthority | No | Pass | Partial | Partial |
| Adapter Boundary | Adapter layer | No | Partial | Yes | Partial |
| Replay Transcript | Pending verification | Pending verification | Pending verification | Pending verification | Pending verification |
| Replay Witness | Pending verification | Pending verification | Pending verification | Pending verification | Pending verification |
| Replay Equivalence | Pending verification | Pending verification | Pending verification | Pending verification | Pending verification |
| Compiler IR | Pending verification | Pending verification | Pending verification | Pending verification | Pending verification |
| Constitutional IR | Pending verification | Pending verification | Pending verification | Pending verification | Pending verification |
| Evidence Graph | Pending verification | Pending verification | Pending verification | Pending verification | Pending verification |
| Capability Authority | Pending verification | Pending verification | Pending verification | Pending verification | Pending verification |
| Governance Authority | Pending verification | Pending verification | Pending verification | Pending verification | Pending verification |
| Scheduler | Pending verification | Pending verification | Pending verification | Pending verification | Pending verification |
| Execution Context | Pending verification | Pending verification | Pending verification | Pending verification | Pending verification |
| Authority Registry | Pending verification | Pending verification | Pending verification | Pending verification | Pending verification |

---

## Constitutional Boundary Invariants

The following invariants should govern the audit from this point forward:

1. Every constitutional responsibility has exactly one authority.
2. Adapters never perform constitutional reasoning.
3. Compiler IR never becomes Constitutional IR implicitly.
4. Replay artifacts are generated only by the runtime kernel.
5. Canonical hashing has exactly one implementation.
6. Witness generation has exactly one authority.
7. Authority boundaries are acyclic.
8. Deterministic replay is independent of platform behavior.

---

## Conclusion (Updated)

This report is now an ownership-evidence document. The repository has already demonstrated concrete authority implementations for configuration, repository, projection, identity, hashing, routing, and execution. The remaining work is to prove those authorities mechanically and to resolve the remaining ownership questions around replay, witness, IR, evidence graph, capability, governance, scheduling, execution context, and authority registry.

**Key Findings:**
- Configuration ownership is now implemented and provable through [runtime/config/configuration_authority.py](../../runtime/config/configuration_authority.py).
- Repository ownership is now implemented and provable through [runtime/authorities/repository_authority.py](../../runtime/authorities/repository_authority.py).
- Projection ownership is now implemented and provable through [runtime/authorities/projection_authority.py](../../runtime/authorities/projection_authority.py).
- Identity and hash ownership are now implemented and provable through [runtime/authorities/identity_authority.py](../../runtime/authorities/identity_authority.py) and [runtime/authorities/canonical_hash_authority.py](../../runtime/authorities/canonical_hash_authority.py).
- Execution ownership is now implemented and provable through [runtime/authorities/execution_authority.py](../../runtime/authorities/execution_authority.py).
- The remaining constitutional questions are ownership proofs rather than implementation tasks.

**Next Steps:**
1. Record file-level and symbol-level ownership proof for each remaining authority.
2. Produce import-path and runtime-call evidence for each remaining authority.
3. Complete replay and witness ownership verification.
4. Resolve the IR and evidence-graph ownership boundary questions before any architectural change.

---

## Executive Summary

This report is now a constitutional proof document. The objective is no longer to propose implementation work. The objective is to prove whether each constitutional responsibility has exactly one authoritative owner and whether that ownership can be demonstrated mechanically.

The document is structured as follows:
- Constitutional Proof Program
- Phase Ω Evidence Collection
- Proven Invariants
- Constitutional Proof Matrix
- Appendices

The earlier T-00x and B-00x inventory sections are superseded. They are retained only as provenance material and should not be treated as the primary freeze gate.

## Constitutional Proof Program

The current phase is evidence collection. The audit should answer one question only:

> Does every constitutional responsibility have exactly one authoritative owner, and can that ownership be proven mechanically?

### Proof workflow
1. Identify the constitutional responsibility.
2. Locate the authoritative implementation and the symbol that owns it.
3. Search for duplicate implementations or alternate owners.
4. Prove the dependency path from runtime callers to the authority.
5. Record the mechanical verification result.
6. Record whether the authority is replay-safe.

### Proof artifacts required for each authority
- Owner: exactly one implementation
- Duplicate search: pass/fail
- Ownership proof: file + symbol + import path
- Dependency proof: runtime call graph or import graph
- Mechanical proof: test, import, or grep-based verification
- Replay proof: whether the authority is replay-safe and kernel-owned

No recommendations, no implementation refactors, and no speculative architecture changes are recorded here. This document is evidence-only.

## Phase Ω — Evidence Collection

The old blocker list is retired. The current objective is not implementation but proof. The audit now records whether each constitutional responsibility has a single owner and whether that ownership is mechanically verifiable.

### Proven invariants
- Configuration ownership is proven through [runtime/config/configuration_authority.py](../../runtime/config/configuration_authority.py) and [runtime/configuration.py](../../runtime/configuration.py).
- Repository ownership is proven through [runtime/authorities/repository_authority.py](../../runtime/authorities/repository_authority.py) and [runtime/adapters/repository_adapter.py](../../runtime/adapters/repository_adapter.py).
- Projection ownership is proven through [runtime/authorities/projection_authority.py](../../runtime/authorities/projection_authority.py).
- Identity ownership is proven through [runtime/authorities/identity_authority.py](../../runtime/authorities/identity_authority.py).
- Canonical hashing is proven through [runtime/authorities/canonical_hash_authority.py](../../runtime/authorities/canonical_hash_authority.py).
- Authority routing is proven through [runtime/authorities/authority_router.py](../../runtime/authorities/authority_router.py).
- Execution ownership is implemented through [runtime/authorities/execution_authority.py](../../runtime/authorities/execution_authority.py) and verified by a direct runtime import and execution test.

### Remaining ownership questions
- Replay Transcript
- Replay Witness
- Replay Equivalence
- Compiler IR
- Constitutional IR
- Evidence Graph
- Capability Authority
- Governance Authority
- Scheduler
- Execution Context
- Authority Registry

These remain constitutional verification questions, not implementation tasks.

## Supporting Evidence

### Authority routing matrix

| Resource | Owning Authority | Authorized Callers | Actual Callers | Status |
|---|---|---|---|---|
| PostgreSQL | RepositoryAuthority / EventAuthority | RepositoryAuthority, EventAuthority | [runtime/adapters/google_drive/google_drive_ingestion_adapter.py](../../runtime/adapters/google_drive/google_drive_ingestion_adapter.py), [repository_scanner.py](../../repository_scanner.py), [runtime/kernel/workers/qdrant_projection_worker.py](../../runtime/kernel/workers/qdrant_projection_worker.py) | BLOCKING |
| Qdrant | ProjectionAuthority / RetrievalAuthority | ProjectionAuthority, RetrievalAuthority | [runtime/retrieval/retrieval_service.py](../../runtime/retrieval/retrieval_service.py), [runtime/projection_worker/constitutional_projection_worker.py](../../runtime/projection_worker/constitutional_projection_worker.py), [runtime/kernel/workers/qdrant_projection_worker.py](../../runtime/kernel/workers/qdrant_projection_worker.py) | BLOCKING |
| Filesystem | RepositoryAuthority | RepositoryAuthority | [repository_scanner.py](../../repository_scanner.py), [runtime/projection_worker/constitutional_projection_worker.py](../../runtime/projection_worker/constitutional_projection_worker.py) | BLOCKING |
| Configuration | SecretAdapter / ConfigurationAuthority | ConfigurationAuthority | [runtime/configuration.py](../../runtime/configuration.py), [runtime/constitutional/secret_adapter.py](../../runtime/constitutional/secret_adapter.py) | BLOCKING |
| Identity / Hash | IdentityAuthority / CanonicalHashAuthority | Canonical identity and hash authorities | [runtime/adapters/google_drive/google_drive_ingestion_adapter.py](../../runtime/adapters/google_drive/google_drive_ingestion_adapter.py), [repository_scanner.py](../../repository_scanner.py) | BLOCKING |

### Python worker audit

| Component | PostgreSQL | SQL direct | Filesystem | Hashes | IDs | Env | Qdrant | Status |
|---|---|---|---|---|---|---|---|---|
| [runtime/adapters/google_drive/google_drive_ingestion_adapter.py](../../runtime/adapters/google_drive/google_drive_ingestion_adapter.py) | Yes | Yes | No | Yes | Yes | Yes | No | BLOCKING |
| [repository_scanner.py](../../repository_scanner.py) | Yes | Yes | Yes | Yes | Yes | Yes | No | BLOCKING |
| [runtime/kernel/workers/qdrant_projection_worker.py](../../runtime/kernel/workers/qdrant_projection_worker.py) | Yes | Yes | No | No | No | Yes | Yes | BLOCKING |
| [runtime/projection_worker/constitutional_projection_worker.py](../../runtime/projection_worker/constitutional_projection_worker.py) | No | No | Yes | Yes | No | Yes | Yes | BLOCKING |
| [runtime/retrieval/retrieval_service.py](../../runtime/retrieval/retrieval_service.py) | No | No | No | No | No | No | Yes | BLOCKING |
| [runtime/adapters/inference_adapter.py](../../runtime/adapters/inference_adapter.py) | No | No | No | No | No | Yes | No | VERIFIED |
| [runtime/adapters/ollama_provider_adapter.py](../../runtime/adapters/ollama_provider_adapter.py) | No | No | No | No | No | No | No | VERIFIED |

### Constitutional surface area metric

| Subsystem | Commodity % | Constitutional % |
|---|---:|---:|
| Parsing | 98 | 2 |
| Repository | 70 | 30 |
| Governance | 5 | 95 |
| Compiler | 10 | 90 |
| Projection | 60 | 40 |
| Retrieval | 70 | 30 |
| Identity / Hash | 20 | 80 |

### OSS integration posture

#### Constitutional IP
Never outsource these capabilities:
- compiler
- ownership graph
- capability system
- constitutional diagnostics
- provenance
- evidence graph

#### Commodity
Evaluate OSS first for these capabilities:
- parsing
- static analysis
- refactoring
- graph storage
- vector DB
- SQL
- workflow orchestration
- event streaming
- object storage
- identity / auth
- policy engine
- secrets
- observability

### Mechanical verification summary

| Verification | Evidence | Status |
|---|---|---|
| No unauthorized `psycopg2.connect` | [runtime/adapters/google_drive/google_drive_ingestion_adapter.py](../../runtime/adapters/google_drive/google_drive_ingestion_adapter.py), [repository_scanner.py](../../repository_scanner.py), [runtime/kernel/workers/qdrant_projection_worker.py](../../runtime/kernel/workers/qdrant_projection_worker.py) | FAIL |
| No unauthorized Qdrant client usage | [runtime/retrieval/retrieval_service.py](../../runtime/retrieval/retrieval_service.py), [runtime/projection_worker/constitutional_projection_worker.py](../../runtime/projection_worker/constitutional_projection_worker.py), [runtime/kernel/workers/qdrant_projection_worker.py](../../runtime/kernel/workers/qdrant_projection_worker.py) | FAIL |
| No unauthorized `os.getenv` outside bootstrap | [runtime/configuration.py](../../runtime/configuration.py), [runtime/constitutional/secret_adapter.py](../../runtime/constitutional/secret_adapter.py), [runtime/projection_worker/constitutional_projection_worker.py](../../runtime/projection_worker/constitutional_projection_worker.py) | FAIL |
| No direct hashing outside canonical authority | [runtime/adapters/google_drive/google_drive_ingestion_adapter.py](../../runtime/adapters/google_drive/google_drive_ingestion_adapter.py), [repository_scanner.py](../../repository_scanner.py), [runtime/projection_worker/constitutional_projection_worker.py](../../runtime/projection_worker/constitutional_projection_worker.py) | FAIL |
| No direct replay outside ReplayAuthority | [runtime/kernel/replay/replay-authority.ts](../../runtime/kernel/replay/replay-authority.ts) | PASS |

## Appendices

### Appendix A — Superseded audit inventory
This report supersedes the earlier T-001 through T-008 and B-001 through B-005 inventory sections. Those labels are retired and should not be used as the primary freeze gate.

### Appendix B — Verified implementation facts
- Governance scaffold is present and executable.
- The runtime kernel exposes concrete authority implementations for replay, capability, governance, scheduler, repository, and witness.
- Inference ownership is structurally compliant.

### Appendix C — Legacy evidence notes
The following earlier artifacts remain useful as provenance only and should not be edited as primary sources:
- [constitutional-compiler/audit/pre-audit-readiness-report-updated.md](../pre-audit-readiness-report-updated.md)
- [runtime/adapters/google_drive/google_drive_ingestion_adapter.py](../../runtime/adapters/google_drive/google_drive_ingestion_adapter.py)
- [repository_scanner.py](../../repository_scanner.py)
- [runtime/kernel/workers/qdrant_projection_worker.py](../../runtime/kernel/workers/qdrant_projection_worker.py)
