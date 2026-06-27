# Phase S.15 — Architectural Platform Design

## Executive Summary

This document defines the next-generation architectural platform for the Constitutional Compiler, incorporating refinements from the surgical integration audit. The core principle is **separating commodity infrastructure from constitutional reasoning**, where the left column (parsing, symbol resolution, graph algorithms, query execution, source rewriting, LSP plumbing) is wrapped or reused, while the right column (authority reasoning, ownership reasoning, capability reasoning, governance reasoning, evidence generation, proof generation) represents unique value.

**Key Architectural Shift:**
- Constitutional Semantic IR is the **canonical internal model**
- CPG, CFG, DFG, Type Graph are **rich inputs**, not replacements
- Graph Engine becomes **Overlay Graph Engine** (shrunk to overlay construction)
- Evidence Graph becomes a **first-class object** with formal pipeline
- Ownership Engine becomes **Architectural Borrow Checker**
- Rule Compiler actually compiles (DSL → AST → Optimizer → Compiled Plan → Executor)
- Query layer is **backend-agnostic** (lowers into CodeQL, Joern, Cypher, Datalog)
- Execution Coordinator abstracts orchestration (Local, ThreadPool, Ray, Temporal)
- Repair Planner stays **declarative** (emits specifications for ts-morph, LibCST, Roslyn, OpenRewrite, Spoon)
- Organizational Reasoning scales from Repository → Team → Service → Organization

---

## Platform Architecture

### High-Level Architecture

```
Language Frontends
        │
        ▼
Semantic Adapters
        │
        ▼
Resolved Semantic Model
        │
        ├── CPG (rich input)
        ├── CFG
        ├── DFG
        └── Type Graph
                │
                ▼
Constitutional Semantic IR (canonical internal model)
                │
                ▼
Constitutional Overlay Graphs
                │
                ▼
Architectural Borrow Checker
                │
                ▼
Authority / Capability / Governance Engines
                │
                ▼
Evidence Graph
                │
                ▼
Proof Objects
                │
                ▼
Diagnostics
                │
                ▼
Repair Planner
                │
                ▼
Organizational Reasoning
```

### Commodity vs Constitutional Separation

| Commodity (Wrap/Reuse) | Constitutional (Unique Value) |
|------------------------|------------------------------|
| Parsing | Authority reasoning |
| Symbol resolution | Ownership reasoning |
| Graph algorithms | Capability reasoning |
| Query execution | Governance reasoning |
| Source rewriting | Evidence generation |
| LSP plumbing | Proof generation |

---

## Module 1 — Semantic Adapters

### Purpose

Replace custom language frontends with adapters that consume normalized semantic information from language servers and parsers.

### Architecture

```
Language Frontends
        │
        ├───────── TypeScript Compiler API
        ├───────── Tree-sitter
        ├───────── Roslyn
        ├───────── Rust Analyzer
        ├───────── Pyright
        ├───────── javac
        └───────── gopls
        │
        ▼
Semantic Adapters
        │
        ├───────── TypeScript Adapter
        ├───────── Python Adapter
        ├───────── Rust Adapter
        ├───────── C# Adapter
        ├───────── Java Adapter
        └───────── Go Adapter
        │
        ▼
Resolved Semantic Model
```

### Responsibilities

- **Consume** normalized semantic information from language-specific tools
- **Normalize** semantic models into a common interface
- **Extract** constitutional-relevant information (types, calls, data flow)
- **Emit** Resolved Semantic Model
- **Wrap** parser adapters such as Tree-sitter, tsserver, and language-server outputs instead of owning parsing in the compiler core
- **Preserve** the boundary by leaving deterministic replay and constitutional execution inside runtime/kernel

### Interface

```typescript
interface SemanticAdapter {
  language: string;
  source: string;
  resolve(): Promise<ResolvedSemanticModel>;
}

interface ResolvedSemanticModel {
  symbols: Map<SymbolID, SemanticSymbol>;
  types: Map<SymbolID, SemanticType>;
  calls: CallGraph;
  dataFlow: DataFlowGraph;
  controlFlow: ControlFlowGraph;
}
```

### Implementation Strategy

- **TypeScript:** Consume tsserver semantic model via LSP
- **Python:** Consume Pyright semantic model via LSP
- **Rust:** Consume Rust Analyzer semantic model via LSP
- **C#:** Consume Roslyn semantic model
- **Java:** Consume javac + language server
- **Go:** Consume gopls semantic model

### Files

- `adapters/semantic-adapter.ts` - Base adapter interface
- `adapters/typescript-adapter.ts` - TypeScript adapter
- `adapters/python-adapter.ts` - Python adapter
- `adapters/rust-adapter.ts` - Rust adapter
- `adapters/csharp-adapter.ts` - C# adapter
- `adapters/java-adapter.ts` - Java adapter
- `adapters/go-adapter.ts` - Go adapter

---

## Module 2 — Standard Analysis Layer

### Purpose

Generate rich inputs (CPG, CFG, DFG, Type Graph) from the Resolved Semantic Model. These serve as inputs to Constitutional Semantic IR, not replacements.

### Architecture

```
Resolved Semantic Model
        │
        ├──────────────► Joern CPG (rich input)
        │                     │
        ├──────────────► CodeQL (rich input)
        │                     │
        ├──────────────► Tree-sitter CFG (rich input)
        │                     │
        └──────────────► Language Server Data Flow (rich input)
        │
        ▼
Standard Analysis Results
        │
        ├───────── CPG (Code Property Graph)
        ├───────── CFG (Control Flow Graph)
        ├───────── DFG (Data Flow Graph)
        └───────── Type Graph
```

### Responsibilities

- **Generate** standard code analysis graphs as rich inputs
- **Normalize** analysis results into common interface
- **Provide** inputs to Constitutional Semantic IR (not replacements)

### Interface

```typescript
interface StandardAnalysis {
  ast: AST;
  cfg: ControlFlowGraph;
  dfg: DataFlowGraph;
  callGraph: CallGraph;
  typeHierarchy: TypeHierarchy;
}
```

### Implementation Strategy

- **Joern:** Generate CPG for all languages
- **CodeQL:** Query-based analysis
- **Tree-sitter:** CFG generation
- **Language Servers:** Data flow analysis

### Files

- `analysis/standard-analysis.ts` - Standard analysis interface
- `analysis/joern-cpg.ts` - Joern CPG integration
- `analysis/codeql-integration.ts` - CodeQL integration
- `analysis/treesitter-cfg.ts` - Tree-sitter CFG integration

---

## Module 3 — Constitutional Semantic IR

### Purpose

Canonical internal model that encodes architectural meaning. CPG represents program structure; Constitutional Semantic IR represents architectural meaning. These are different abstractions.

### Architecture

```
Standard Analysis Results (rich inputs)
        │
        ├──────────────► CPG (program structure)
        ├──────────────► CFG (control flow)
        ├──────────────► DFG (data flow)
        ├──────────────► Type Graph (type structure)
        ├──────────────► Repository Metadata
        ├──────────────► ADRs
        └──────────────► Constitutional Sources
        │
        ▼
Constitutional Semantic IR (canonical internal model)
```

### Constitutional Concepts (Not in CPG)

A CPG has no notion of:
- **Authority** - Who has authority over what
- **Ownership** - Who owns what
- **Mission** - Architectural mission boundaries
- **Constitutional Service** - Service-level constitutional obligations
- **Governance** - Organizational governance policies
- **Capability Lease** - Temporary capability grants
- **Organizational Trust** - Trust relationships across organizations

These belong in the Constitutional Semantic IR as the canonical internal model.

### Interface

```typescript
interface ConstitutionalSemanticIR {
  nodes: Map<SymbolID, ConstitutionalNode>;
  edges: Map<SymbolID, ConstitutionalEdge[]>;
  authorityOwnership: AuthorityOwnershipGraph;
  missionBoundaries: MissionBoundaryGraph;
  constitutionalServices: ConstitutionalServiceGraph;
  governancePolicies: GovernancePolicyGraph;
  capabilityLeasing: CapabilityLeasingGraph;
  replaySovereignty: ReplaySovereigntyGraph;
  proofObligations: ProofObligationGraph;
}
```

### Files

- `ir/constitutional-semantic-ir.ts` - Constitutional IR definition
- `ir/authority-ownership.ts` - Authority ownership graph
- `ir/mission-boundaries.ts` - Mission boundary graph
- `ir/constitutional-services.ts` - Constitutional service graph
- `ir/governance-policies.ts` - Governance policy graph

---

## Module 4 — Constitutional Overlay Graph Engine

### Purpose

Build constitutional overlays from CPG, semantic IR, repository metadata, ADRs, and constitutional sources. This is a much smaller subsystem (few thousand lines instead of tens of thousands) responsible only for overlay construction.

### Architecture

```
Constitutional Semantic IR (canonical internal model)
        │
        ├───────── CPG (rich input)
        ├───────── Repository Metadata
        ├───────── ADRs
        └───────── Constitutional Sources
        │
        ▼
Overlay Graph Engine (shrunk to overlay construction)
        │
        ├───────── Trust Overlay
        ├───────── Ownership Overlay
        ├───────── Capability Overlay
        ├───────── Identity Overlay
        ├───────── Event Overlay
        ├───────── Persistence Overlay
        └───────── Governance Overlay
        │
        ▼
Constitutional Overlay Graphs
```

### Responsibilities

- **Build** constitutional overlays from CPG
- **Merge** repository metadata
- **Merge** ADRs
- **Merge** constitutional sources
- **Maintain** cross-graph relationships
- **Expose** constitutional traversals

### Eliminated Responsibilities

- Custom graph storage (use mature graph libraries)
- Generic traversals (use mature graph libraries)
- Graph scheduling (use Execution Coordinator)
- Graph algorithms (use Joern, JGraphT, NetworkX, etc.)

### Interface

```typescript
interface OverlayGraphEngine {
  buildOverlays(
    cpg: CPG,
    semanticIR: ConstitutionalSemanticIR,
    repositoryMetadata: RepositoryMetadata,
    adrs: ADR[],
    constitutionalSources: ConstitutionalSource[]
  ): ConstitutionalOverlayGraphs;
  
  traverse(graphType: OverlayGraphType): TraversalResult;
  query(graphType: OverlayGraphType, query: string): QueryResult;
}
```

### Files

- `graph/overlay-graph-engine.ts` - Overlay graph engine
- `graph/trust-overlay.ts` - Trust overlay
- `graph/ownership-overlay.ts` - Ownership overlay
- `graph/capability-overlay.ts` - Capability overlay
- `graph/identity-overlay.ts` - Identity overlay
- `graph/event-overlay.ts` - Event overlay
- `graph/persistence-overlay.ts` - Persistence overlay
- `graph/governance-overlay.ts` - Governance overlay

---

## Module 5 — Architectural Borrow Checker

### Purpose

Enforce architectural safety using Rust-like borrow checking semantics: exclusive ownership, shared ownership, authority leasing, mutation permissions, lifetime constraints, effect boundaries.

### Architecture

```
Constitutional Overlay Graphs
        │
        ▼
Architectural Borrow Checker
        │
        ├───────── Ownership Checker
        ├───────── Authority Leasing Checker
        ├───────── Mutation Permission Checker
        ├───────── Lifetime Checker
        └───────── Effect Boundary Checker
        │
        ▼
Borrow Violations
```

### Responsibilities

- **Check** exclusive ownership violations
- **Check** shared ownership violations
- **Check** authority leasing violations
- **Check** mutation permission violations
- **Check** lifetime constraint violations
- **Check** effect boundary violations

### Interface

```typescript
interface ArchitecturalBorrowChecker {
  checkOwnership(node: SymbolID): BorrowCheckResult;
  checkAuthorityLeasing(node: SymbolID): BorrowCheckResult;
  checkMutationPermission(node: SymbolID): BorrowCheckResult;
  checkLifetime(node: SymbolID): BorrowCheckResult;
  checkEffectBoundary(node: SymbolID): BorrowCheckResult;
}

interface BorrowCheckResult {
  valid: boolean;
  violations: BorrowViolation[];
  explanation: string;
}
```

### Files

- `borrow/architectural-borrow-checker.ts` - Main borrow checker
- `borrow/ownership-checker.ts` - Ownership checking
- `borrow/authority-leasing-checker.ts` - Authority leasing checking
- `borrow/mutation-permission-checker.ts` - Mutation permission checking
- `borrow/lifetime-checker.ts` - Lifetime checking
- `borrow/effect-boundary-checker.ts` - Effect boundary checking

---

## Module 6 — Authority / Capability / Governance Engines

### Purpose

Core constitutional reasoning engines that represent unique value.

### Architecture

```
Constitutional Overlay Graphs
        │
        ├───────── Authority Engine
        ├───────── Capability Engine
        └───────── Governance Engine
        │
        ▼
Constitutional Violations
```

### Responsibilities

**Authority Engine:**
- Track authority ownership
- Verify authority boundaries
- Detect authority violations

**Capability Engine:**
- Track capability consumption and production
- Verify capability boundaries
- Detect capability violations

**Governance Engine:**
- Track governance policies
- Verify policy compliance
- Detect governance violations

### Files

- `engines/authority-engine.ts` - Authority engine (expanded)
- `engines/capability-engine.ts` - Capability engine (expanded)
- `engines/governance-engine.ts` - Governance engine (new)

---

## Module 7 — Evidence Graph

### Purpose

Formalize evidence as a first-class object with a formal pipeline: Rule → Observation → Evidence Graph → Counter Evidence → Confidence → Proof Object → Diagnostic. Every conclusion becomes replayable and inspectable.

### Architecture

```
Constitutional Violations
        │
        ▼
Rule
        │
        ▼
Observation
        │
        ▼
Evidence Graph (first-class object)
        │
        ├───────── Evidence Nodes
        ├───────── Evidence Edges
        ├───────── Witness Nodes
        └───────── Counter Evidence Nodes
        │
        ▼
Confidence
        │
        ▼
Proof Object
        │
        ▼
Diagnostic
```

### Benefits

- **Explanation graphs** - Trace how conclusions were reached
- **Competing hypotheses** - Compare alternative explanations
- **Legal-style briefs** - Generate legal citation-style evidence
- **Uncertainty propagation** - Track uncertainty through evidence chains
- **Replayable conclusions** - Every finding can be replayed and inspected

### Responsibilities

- **Generate** evidence graphs from observations
- **Track** witnesses and counter-evidence
- **Compute** confidence scores
- **Generate** proof objects
- **Emit** diagnostics

### Interface

```typescript
interface EvidenceGraph {
  nodes: Map<SymbolID, EvidenceNode>;
  edges: Map<SymbolID, EvidenceEdge[]>;
  witnesses: Map<SymbolID, Witness>;
  counterEvidence: Map<SymbolID, CounterEvidence>;
  confidence: Confidence;
}

interface EvidenceNode {
  id: SymbolID;
  type: EvidenceType;
  observation: Observation;
  proof: ProofStep;
}

interface Witness {
  id: SymbolID;
  reliability: number;
  reputation: number;
}
```

### Files

- `evidence/evidence-graph.ts` - Evidence graph definition
- `evidence/evidence-generator.ts` - Evidence generation
- `evidence/witness-scoring.ts` - Witness scoring
- `evidence/counter-evidence.ts` - Counter-evidence generation
- `evidence/confidence.ts` - Confidence computation
- `evidence/proof-object.ts` - Proof object generation

---

## Module 8 — Rule Compiler

### Purpose

Actually compile constitutional rules (not interpret JSON): Rule DSL → Rule AST → Rule Optimizer → Compiled Rule Plan → Rule Executor. This enables rule simplification, optimization, deduplication, dependency ordering, caching, and explainability.

### Architecture

```
Constitutional Rules (DSL)
        │
        ▼
Rule Parser
        │
        ▼
Rule AST
        │
        ▼
Rule Optimizer
        │
        ├───────── Rule Simplification
        ├───────── Optimization
        ├───────── Deduplication
        └───────── Dependency Analysis
        │
        ▼
Compiled Rule Plan
        │
        ├───────── Execution Plan
        ├───────── Dependency Graph
        └───────── Cache Keys
        │
        ▼
Rule Executor
```

### Benefits

- **Rule simplification** - Simplify complex rules
- **Optimization** - Optimize rule execution
- **Deduplication** - Remove duplicate rules
- **Dependency ordering** - Order rules by dependencies
- **Caching** - Cache compiled rules for performance
- **Explainability** - Explain rule decisions and execution

### Responsibilities

- **Parse** constitutional rule DSL
- **Optimize** rule AST
- **Compile** rules into execution plans
- **Cache** compiled rules
- **Execute** compiled rules

### Interface

```typescript
interface RuleCompiler {
  compile(rule: ConstitutionalRule): CompiledRulePlan;
  optimize(ruleAST: RuleAST): OptimizedRuleAST;
  generateExecutionPlan(ruleAST: OptimizedRuleAST): ExecutionPlan;
  cache(plan: CompiledRulePlan): void;
}

interface CompiledRulePlan {
  id: SymbolID;
  executionPlan: ExecutionPlan;
  dependencies: SymbolID[];
  cacheKey: string;
}
```

### Files

- `rules/rule-compiler.ts` - Rule compiler
- `rules/rule-parser.ts` - Rule DSL parser
- `rules/rule-optimizer.ts` - Rule optimizer
- `rules/rule-execution-plan.ts` - Execution plan generation
- `rules/rule-cache.ts` - Rule caching
- `rules/compiled-rule-executor.ts` - Compiled rule executor

---

## Module 9 — Query Layer

### Purpose

Backend-agnostic query layer. Constitutional queries like `constitutional.ownership(node)` lower into whichever backend is available (CodeQL, Joern, Cypher, Datalog), preserving portability and avoiding invention of a new query language.

### Architecture

```
Constitutional Query
        │
        ├───────── constitutional.ownership()
        ├───────── constitutional.authority()
        ├───────── constitutional.persistence()
        ├───────── constitutional.capability()
        ├───────── constitutional.trust()
        ├───────── constitutional.identity()
        └───────── constitutional.event()
        │
        ▼
Query Lowering (backend-agnostic)
        │
        ├───────── CodeQL Backend
        ├───────── Joern Backend
        ├───────── Cypher Backend
        └───────── Datalog Backend
        │
        ▼
Query Results
```

### Benefits

- **Portability** - Queries work across multiple backends
- **No new query language** - Leverage existing mature query languages
- **Backend flexibility** - Switch backends without changing queries
- **Mature tooling** - Benefit from existing query tooling

### Responsibilities

- **Parse** constitutional queries
- **Lower** queries to backend-specific format
- **Execute** queries on available backend
- **Normalize** results

### Interface

```typescript
interface QueryLowering {
  lower(query: ConstitutionalQuery, backend: QueryBackend): BackendQuery;
  execute(backendQuery: BackendQuery, backend: QueryBackend): QueryResult;
  normalize(result: BackendResult): QueryResult;
}

enum QueryBackend {
  CodeQL = 'CodeQL',
  Joern = 'Joern',
  Cypher = 'Cypher',
  Datalog = 'Datalog',
}
```

### Files

- `query/query-lowering.ts` - Query lowering
- `query/codeql-backend.ts` - CodeQL backend
- `query/joern-backend.ts` - Joern backend
- `query/cypher-backend.ts` - Cypher backend
- `query/datalog-backend.ts` - Datalog backend

---

## Module 10 — Execution Coordinator

### Purpose

Abstract orchestration to keep constitutional layer independent of execution backend. Implementations: Local, ThreadPool, Ray, Temporal. The constitutional layer shouldn't care how work is distributed.

### Architecture

```
Constitutional Tasks
        │
        ▼
Execution Coordinator (orchestration abstraction)
        │
        ├───────── Local Implementation
        ├───────── ThreadPool Implementation
        ├───────── Ray Implementation
        └───────── Temporal Implementation
        │
        ▼
Execution Results
```

### Benefits

- **Execution flexibility** - Switch execution backends without changing constitutional logic
- **No premature distributed infrastructure** - Start local, scale to distributed as needed
- **Constitutional layer independence** - Constitutional reasoning doesn't depend on execution strategy
- **Mature orchestration** - Leverage battle-tested orchestration frameworks

### Responsibilities

- **Schedule** constitutional tasks
- **Execute** tasks using configured backend
- **Abstract** execution strategy from constitutional logic

### Interface

```typescript
interface ExecutionCoordinator {
  schedule(task: Task): void;
  execute(task: Task): Promise<Result>;
  setBackend(backend: ExecutionBackend): void;
}

enum ExecutionBackend {
  Local = 'Local',
  ThreadPool = 'ThreadPool',
  Ray = 'Ray',
  Temporal = 'Temporal',
}
```

### Files

- `execution/execution-coordinator.ts` - Execution coordinator
- `execution/local-execution.ts` - Local implementation
- `execution/threadpool-execution.ts` - ThreadPool implementation
- `execution/ray-execution.ts` - Ray implementation
- `execution/temporal-execution.ts` - Temporal implementation

---

## Module 11 — Repair Planner

### Purpose

Stay declarative. Decide what to repair, why, and in what order. Emit repair specifications for language-specific tools (ts-morph, LibCST, Roslyn, OpenRewrite, Spoon). Language mechanics stay out of the constitutional core.

### Architecture

```
Diagnostics
        │
        ▼
Repair Planner (declarative)
        │
        ├───────── Repair Strategy
        ├───────── Repair Prioritization
        ├───────── Repair Impact Analysis
        └───────── Repair Risk Assessment
        │
        ▼
Repair Specifications
        │
        ├───────── ts-morph (TypeScript)
        ├───────── LibCST (Python)
        ├───────── Roslyn Refactor API (C#)
        ├───────── OpenRewrite (Multi-language)
        └───────── Spoon (Java)
        │
        ▼
Applied Repairs
```

### Benefits

- **Declarative approach** - Compiler decides what, frameworks decide how
- **Language-agnostic core** - Constitutional logic doesn't depend on language mechanics
- **Leverage mature tools** - Use battle-tested rewrite frameworks
- **Portability** - Easy to add new language support via new frameworks

### Responsibilities

- **Plan** repair strategies
- **Prioritize** repairs
- **Analyze** repair impact
- **Assess** repair risk
- **Generate** repair specifications

### Interface

```typescript
interface RepairPlanner {
  plan(diagnostics: Diagnostic[]): RepairPlan;
  prioritize(repairs: Repair[]): Repair[];
  analyzeImpact(repair: Repair): ImpactAnalysis;
  assessRisk(repair: Repair): RiskAssessment;
  generateSpecification(repair: Repair): RepairSpecification;
}

interface RepairSpecification {
  target: SymbolID;
  action: RepairAction;
  framework: RewriteFramework;
  edits: EditSpecification[];
}
```

### Files

- `repair/repair-planner.ts` - Repair planner
- `repair/repair-strategy.ts` - Repair strategy
- `repair/repair-prioritization.ts` - Repair prioritization
- `repair/impact-analysis.ts` - Impact analysis
- `repair/risk-assessment.ts` - Risk assessment

---

## Module 12 — Organizational Reasoning

### Purpose

Repository-wide and organizational-level constitutional reasoning. Naturally scales from Repository → Team → Service → Organization without changing the conceptual model.

### Architecture

```
Constitutional Violations
        │
        ▼
Organizational Reasoning
        │
        ├───────── Repository Analysis
        ├───────── Team Analysis
        ├───────── Service Analysis
        └───────── Organizational Impact Analysis
        │
        ▼
Organizational Findings
```

### Benefits

- **Scalable model** - Same conceptual model scales across organizational levels
- **Consistent reasoning** - Apply same constitutional reasoning at all levels
- **Organizational visibility** - Track constitutional compliance across organization

### Responsibilities

- **Analyze** repository-wide constitutional compliance
- **Analyze** team-level constitutional compliance
- **Analyze** service-level constitutional compliance
- **Assess** organizational impact

### Files

- `reasoning/organizational-reasoning.ts` - Organizational reasoning
- `reasoning/repository-analysis.ts` - Repository analysis
- `reasoning/team-analysis.ts` - Team analysis
- `reasoning/service-analysis.ts` - Service analysis

---

## Proprietary Value Boundary

### Constitutional Core (Unique Value)

The constitutional core should own these components. These represent the differentiator and should never be replaced with OSS:

1. **Constitutional Semantic IR** - Canonical internal model encoding architectural meaning
2. **Overlay Semantics** - Constitutional overlay construction and traversal
3. **Architectural Borrow Checker** - Rust-like architectural safety enforcement
4. **Authority Engine** - Authority reasoning and verification
5. **Capability Engine** - Capability reasoning and verification
6. **Governance Engine** - Governance policy reasoning and verification
7. **Evidence Graph** - First-class evidence pipeline with formal semantics
8. **Proof Objects** - Build-time constitutional validity proofs
9. **Rule Compiler** - Constitutional rule compilation and optimization
10. **Organizational Reasoning** - Repository → Team → Service → Organization scaling
11. **Repair Planner** - Declarative repair planning and specification

### Adapters (Commodity Infrastructure)

Everything else can be adapters wrapping mature OSS:

1. **Parsing** - Tree-sitter, TypeScript Compiler API, Roslyn, javac, gopls
2. **Symbol Resolution** - tsserver, Pyright, Rust Analyzer, Roslyn, gopls
3. **Graph Algorithms** - Joern, JGraphT, NetworkX, Neo4j
4. **Query Execution** - CodeQL, Joern, Cypher, Datalog
5. **Source Rewriting** - ts-morph, LibCST, Roslyn Refactor API, OpenRewrite, Spoon
6. **LSP Plumbing** - vscode-languageserver
7. **Execution Orchestration** - Ray, Dask, Temporal, Prefect
8. **Graph Storage** - Neo4j, PostgreSQL, Redis

### Clear Boundary

This explicit separation ensures:
- **Engineering efficiency** - Leverage billions of dollars of R&D from OSS
- **Focus on novel IP** - Constitutional reasoning is the differentiator
- **Strategic positioning** - Constitutional reasoning platform on top of established compiler infrastructure
- **Long-term design** - Clearer separation of concerns, stronger architecture

---

## Architecture Diff

- **Before:** parsing, symbol resolution, graph traversal, query execution, and execution orchestration were treated as compiler-owned responsibilities.
- **After:** runtime/kernel remains the constitutional core for replay, authority, identity, witness, governance, capability, constitutional IR, and execution; constitutional-compiler wraps parser adapters and orchestration services for Tree-sitter, CodeQL, Joern, LSP, CLI, Ray/Dask, Git, UI, and adapters.
- **Boundary rule:** the compiler may wrap and coordinate commodity infrastructure, but it does not absorb constitutional execution semantics or deterministic replay semantics.

## Migration Checklist

1. Confirm the runtime/kernel boundary for replay, authority, identity, witness, governance, capability, constitutional IR, and execution.
2. Move parser and analysis responsibilities to semantic adapters in constitutional-compiler that wrap Tree-sitter, CodeQL, Joern, LSP, CLI, Ray/Dask, Git, UI, and adapter implementations.
3. Replace ownership language that says the compiler owns parsing with language that says the compiler wraps parser adapters.
4. Preserve public interfaces, event contracts, and replay determinism while shifting implementation ownership across the boundary.
5. Validate zero breaking changes by replaying existing constitutional events and checking unchanged authority and witness behavior.

## Files Requiring Edits

- constitutional-compiler/architecture/platform-design.md
- constitutional-compiler/audit/pre-audit-readiness-report-updated.md
- constitutional-compiler/audit/runtime-kernel-audit.md
- Any project documentation that describes compiler ownership of parsing or execution responsibilities

## Zero Breaking Changes

- Existing replay semantics remain unchanged.
- Existing authority, identity, witness, governance, and capability contracts remain intact.
- Existing public interfaces continue to operate through adapter boundaries rather than architectural rewrites.
- New work is added at the compiler-adapter layer without changing constitutional semantics.

## Phased Rollout

1. **Boundary codification** - document the runtime/kernel vs constitutional-compiler responsibilities.
2. **Adapter extraction** - move parsing and analysis responsibilities behind semantic adapters.
3. **Contract stabilization** - preserve kernel interfaces while routing compiler responsibilities through adapters.
4. **Replay verification** - confirm deterministic replay and authority behavior remain intact.
5. **Audit sign-off** - update all ownership language and close the migration.

## Implementation Roadmap

### Phase 1: Semantic Adapters (Weeks 1-4)

- Implement Semantic Adapter interface
- Implement TypeScript adapter (tsserver)
- Implement Python adapter (Pyright)
- Implement Rust adapter (Rust Analyzer)
- Implement C# adapter (Roslyn)

### Phase 2: Standard Analysis Layer (Weeks 5-8)

- Integrate Joern CPG
- Integrate CodeQL
- Integrate Tree-sitter CFG
- Normalize analysis results

### Phase 3: Constitutional Semantic IR (Weeks 9-12)

- Define Constitutional Semantic IR
- Implement authority ownership graph
- Implement mission boundary graph
- Implement constitutional service graph
- Implement governance policy graph

### Phase 4: Overlay Graph Engine (Weeks 13-16)

- Redefine Graph Engine as Overlay Graph Engine
- Implement trust overlay
- Implement ownership overlay
- Implement capability overlay
- Implement identity overlay

### Phase 5: Architectural Borrow Checker (Weeks 17-20)

- Rename Ownership Engine to Architectural Borrow Checker
- Implement ownership checking
- Implement authority leasing checking
- Implement mutation permission checking
- Implement lifetime checking

### Phase 6: Evidence Graph (Weeks 21-24)

- Define Evidence Graph as first-class object
- Implement evidence generation
- Implement witness scoring
- Implement counter-evidence generation
- Implement confidence computation

### Phase 7: Rule Compiler (Weeks 25-28)

- Implement Rule DSL parser
- Implement Rule optimizer
- Implement execution plan generation
- Implement rule caching
- Implement compiled rule executor

### Phase 8: Query Layer (Weeks 29-32)

- Implement query lowering
- Implement CodeQL backend
- Implement Joern backend
- Implement Cypher backend
- Implement Datalog backend

### Phase 9: Execution Coordinator (Weeks 33-36)

- Implement Execution Coordinator abstraction
- Implement Local execution
- Implement ThreadPool execution
- Implement Ray execution
- Implement Temporal execution

### Phase 10: Repair Planner (Weeks 37-40)

- Implement Repair Planner
- Implement repair strategy
- Implement repair prioritization
- Implement impact analysis
- Implement risk assessment

### Phase 11: Organizational Reasoning (Weeks 41-44)

- Implement organizational reasoning
- Implement repository analysis
- Implement team analysis
- Implement service analysis

### Phase 12: Integration & Testing (Weeks 45-48)

- Integrate all modules
- End-to-end testing
- Performance optimization
- Documentation

---

## Expected Benefits

### Engineering Efficiency

- **Frontend development:** 60-70% reduction (use language servers)
- **Graph algorithms:** 80-90% reduction (use mature libraries)
- **Query execution:** 50-60% reduction (use existing backends)
- **Execution infrastructure:** 70-80% reduction (use Ray/Dask)
- **Source rewriting:** 60-70% reduction (use ts-morph, etc.)

### Focus on Novel IP

- **Authority reasoning:** 100% focus (no commodity work)
- **Ownership reasoning:** 100% focus (no commodity work)
- **Capability reasoning:** 100% focus (no commodity work)
- **Governance reasoning:** 100% focus (no commodity work)
- **Evidence generation:** 100% focus (no commodity work)
- **Proof generation:** 100% focus (no commodity work)

### Strategic Positioning

- **Platform architecture:** Constitutional reasoning layer on top of industry-standard infrastructure
- **Multi-language support:** Out of the box via language servers
- **Query portability:** Lower into multiple backends
- **Execution flexibility:** Pluggable execution backends
- **Repair portability:** Use language-specific rewrite frameworks

---

## Conclusion

The Phase S.15 Architectural Platform Design represents a strategic refinement of the integration strategy:

1. **CPG as input, not canonical** - Constitutional Semantic IR encodes architectural concepts not in CPG
2. **Overlay Graph Engine** - Shrink, not delete, to build constitutional overlays
3. **Evidence Graph as first-class** - Formalize evidence pipeline
4. **Architectural Borrow Checker** - Rust-like architectural safety
5. **Rule Compiler** - Optimize constitutional rules
6. **Execution abstraction** - Pluggable backends
7. **Query portability** - Lower into multiple backends

This architecture maximizes leverage from mature open-source infrastructure while preserving the unique constitutional reasoning engine as the primary differentiator.
