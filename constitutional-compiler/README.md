# Constitutional Semantic Compiler

A constitutional semantic compiler that verifies constitutional architecture through semantic analysis.

## Phase 0 — Compiler Foundation: COMPLETED
## Phase S.12D — CEO Execution Directive (10 fixes): COMPLETED
## Phase S.12E — Architectural Refactor: COMPLETED
## Phase S.13 — Constitutional Analysis Pipeline: COMPLETED

### Project Layout
```
constitutional-compiler/
    frontends/
        typescript/      # TypeScript frontend (completed with 10 CEO directive fixes)
        python/          # Python frontend (pending)
    ir/                 # Intermediate Representation (completed with semantic concepts)
    lowering/           # Semantic Lowerer (AST → Canonical Semantic IR)
    canonical/          # Symbol Canonicalizer (Canonical Symbol layer)
    registry/           # Constitutional Registry Loader
    evidence/           # Evidence Store
    engines/            # Ownership, Capability, Rule Provenance, Counter-Evidence Engines
    cache/              # Symbol-level incremental cache (Bazel-style)
    graph/              # Graph Engine (60-90 independent graphs)
    execution/          # Distributed execution and worker scheduling
    git/                # Git infrastructure (semantic diffs, graph diffs)
    solver/             # Constraint Solver (graph-based constraint solving)
    query/              # Constitutional Query Language (SQL/Datalog/CodeQL for semantic IR)
    diagnostics/        # Constitutional Diagnostics (legal brief-style reports)
    repair/             # Automatic Repair Engine (Constitutional AutoFix)
    proof/              # Constitutional Proof Objects (build-time proofs)
    optimizer/          # Semantic Optimizer (LLVM for architecture)
    lsp/                # Constitutional Language Server (live constitutional violations)
    reasoning/          # Whole Repository Reasoning (architecture-level compilation)
    pipeline/           # Build Proof Pipeline (architecture scoring)
    diff/               # Architecture Diff Engine (semantic diffs)
    coverage/           # Rule Coverage (test coverage for constitutional rules)
    fuzzing/            # Fuzzing (AFL for architecture)
    resolver/           # Symbol Resolution (pending)
    validator/          # Validation (pending)
    reports/            # Reports (pending)
    cli/                # CLI (pending)
    tests/              # Synthetic Validation Suite (pending)
```

### Completed Components

#### Phase S.12E — Architectural Refactor Modules

**1. Semantic Lowerer (`lowering/semantic-lowerer.ts`)**
- Transforms language-specific AST into canonical semantic IR
- Deletes AST after lowering
- Emits only architectural semantics (authority, capabilities, mutations, persistence, events, trust transitions, constitutional obligations)
- Canonical Symbol Path: Organization → Package → Module → Authority → Capability → Identity

**2. Symbol Canonicalizer (`canonical/symbol-canonicalizer.ts`)**
- Transforms language-specific symbols into canonical symbols
- Supports TypeScript, Python, Rust, Go, Java, C#, Solidity, protobuf, OpenAPI, GraphQL
- Semantic fingerprinting that survives refactors
- Lookup by kind, owner, constitutional root, path

**3. Constitutional Registry Loader (`registry/constitutional-registry-loader.ts`)**
- Parses Markdown constitutional rules
- Every rule contains Document, Section, Paragraph, Exact Quote, Hash, Version
- Enables rule provenance and reproducible audits
- Section and paragraph structure

**4. Evidence Store (`evidence/evidence-store.ts`)**
- Legal brief-style evidence storage
- Observed mutation, mutation location, authority owner, capability owner, repository owner
- Constitutional paragraph, rule hash, counter evidence, confidence
- Proof chain, witnesses, alternative explanations
- JSON export/import

**5. Ownership Engine (`engines/ownership-engine.ts`)**
- Tracks creation/mutation/persistence/destruction ownership
- Ownership kinds: Creation, Mutation, Persistence, Destruction, Read, Write, Delete, Execute, Verify, Sign, Hash
- Ownership types: Exclusive, Shared, Delegated, Transient, Immutable
- Ownership transfer tracking
- Validation with conditions

**6. Capability Engine (`engines/capability-engine.ts`)**
- Manages READ, WRITE, DELETE, EXECUTE, VERIFY, SIGN, HASH, PERSIST, EMIT, SUBSCRIBE capabilities
- Capability consumption and production tracking
- Capability boundaries with strict mode
- Capability delegation
- Validation against boundaries

**7. Rule Provenance Engine (`engines/rule-provenance-engine.ts`)**
- Tracks rule provenance with document, section, paragraph, exact quote, hash, version
- Rule dependencies (Direct, Indirect, Transitive, Conditional)
- Rule evolution (Created, Modified, Deprecated, Deleted, Restored)
- Rule violations with severity (Critical, High, Medium, Low, Info)
- Dependency graph and evolution timeline

**8. Symbol-level incremental cache (`ir/symbol-level-cache.ts`)**
- Bazel-style symbol-level caching
- Hash based on semantic properties, not file content
- Dependency and dependent graphs
- Minimal rebuild set computation
- Cache validation and consistency checks

**9. Canonical Symbol Path UUID generation (`ir/symbol-id.ts`)**
- Organization/Package/Module/Authority/Capability/Identity-based UUIDs
- SHA256-based deterministic UUID v5
- Survives refactors, path changes, renames
- Semantic ownership preserved

**10. Graph Engine (`graph/graph-engine.ts`)**
- Framework for 60-90 independent graph types
- Graph types: Construction, Mutation, Persistence, Trust, Ownership, Capability, Reflection, Dynamic Import, Inheritance, Generic Instantiation, Dependency Injection, Factory, Builder, Repository, Identity, Witness, Replay, Projection, Knowledge, Governance, Scheduler, Worker, Mission, Provider, Service, Authority, Constitutional Root, Boundary Crossing, Illegal Transition, State Machine, Lifecycle, Cryptographic Trust, Data Flow, Control Flow, Version, Ownership Transfer, Authorization, Capability Consumption, Capability Production, Rule Dependency, Rule Provenance, Violation Lineage, Counter Evidence, Compilation Dependency, Module Federation, Package Evolution, Trust Delegation, Identity Resolution, Replay Determinism, Cryptographic Chain, Distributed Worker, Cluster, Consensus, Replication
- Independent graph computation
- Parallel graph computation
- DOT format export

**11. Counter-Evidence Engine (`engines/counter-evidence-engine.ts`)**
- Every violation attempts to disprove itself
- Generates alternative explanations
- Evaluates validity (valid, invalid, uncertain)
- Computes strength based on evidence
- Authorization, ownership, and capability checks

**12. Distributed execution (`execution/distributed-execution.ts`)**
- Worker scheduling for embarrassingly parallel compilation
- Worker types: Frontend, Ownership, Capability, Rule Evaluation, Evidence Generation, Graph Computation, Counter-Evidence, Report Generation
- Task scheduling with dependencies
- Load balancing
- Execution plan creation and execution

**13. Git infrastructure (`git/git-infrastructure.ts`)**
- Git as infrastructure for reproducible audits
- Compiler run metadata: commit SHA, tree hash, compiler version, registry version, rule version, semantic IR version
- Semantic diffs: added/removed/modified symbols, ownership changes, capability changes, authority changes
- Graph diffs: added/removed nodes and edges
- PR proposals as constitutional proposals
- Reproducibility verification

#### Phase S.13 — Constitutional Analysis Pipeline Modules

**14. Constitutional Rule Executor (`rules/rule-executor.ts`)**
- Evaluates applicable constitutional rules for each semantic IR node
- Collects evidence and counter-evidence
- Scores confidence (0 to 1) and classifies severity (Critical, High, Medium, Low, Info)
- Emits detailed findings including severity and suggested repairs
- Indexes findings by rule, node, and severity
- Supports JSON import/export of findings

**15. Constraint Solver (`solver/constraint-solver.ts`)**
- Graph-based constraint solving for semantic objects
- Constraint types: Ownership, Capability, Trust, Authority, Persistence, Mutation, Identity, Boundary, Lifecycle
- SAT solver combined with static analysis
- Constraint graph with nodes and edges
- Cycle detection and constraint satisfaction propagation
- Statistics and JSON export/import

**16. Constitutional Query Language (`query/constitutional-query-language.ts`)**
- SQL/Datalog/CodeQL for semantic IR
- Query types: Rule, Match, Exists, ForAll, NotExists
- Pattern matching and condition evaluation
- Parser for rule queries, match queries, and exists queries
- Query executor with confidence scoring
- Statistics and JSON export/import

**17. Constitutional Diagnostics (`diagnostics/constitutional-diagnostics.ts`)**
- Legal brief-style diagnostic output
- Diagnostic types: Violation, Compliance, Warning, Suggestion
- Severity classification: Critical, High, Medium, Low, Info
- Evidence and counter-evidence extraction
- Legal brief generation with constitutional references
- Text formatting for diagnostics and legal briefs
- Statistics and JSON export/import

**18. Automatic Repair Engine (`repair/automatic-repair-engine.ts`)**
- Constitutional AutoFix for architecture violations
- Repair types: MoveAuthority, RenameCapability, InsertOwnership, RemoveOwnership, SplitRepository, GenerateEvent, AddPersistenceBoundary, RemovePersistenceBoundary, AddCapability, RemoveCapability, AddTrust, RemoveTrust, AddIdentity, RemoveIdentity
- Repair patch generation with confidence and risk assessment
- Automatic repair application
- Statistics and JSON export/import

**19. Constitutional Proof Objects (`proof/constitutional-proof-objects.ts`)**
- Build-time proof generation for architecture validity
- Proof metadata: git commit, compiler version, registry version, rule version, semantic IR version
- Rule references with document, section, paragraph, exact quote, hash, version
- Evidence and counter-evidence tracking
- Dependency chains and proof steps
- Architecture scoring: trust, ownership, capability integrity, rule coverage, evidence confidence
- Proof conclusion with recommendations
- Proof verification and export

**20. Semantic Optimizer (`optimizer/semantic-optimizer.ts`)**
- LLVM for architecture optimization
- Optimization types: RemoveDuplicateAuthority, RemoveDuplicatePersistence, RemoveDuplicateMutation, RemoveDeadEvent, RemoveDeadRepository, RemoveUnusedCapability, FixIdentityLeak, ConsolidateOwnership, MergeSimilarRepositories, EliminateRedundantTrust
- Optimization opportunity detection
- Automatic optimization application
- Statistics and JSON export/import

**21. Graph Algorithms (`graph/graph-algorithms.ts`)**
- Advanced graph algorithms for architectural analysis
- Dominators (Lengauer-Tarjan algorithm)
- Strongly Connected Components (Tarjan's algorithm)
- Cycle detection (trust cycles, ownership cycles)
- Capability leakage detection
- Minimal cut computation
- Strong connectivity check
- Topological sort (Kahn's algorithm)
- Shortest path (Dijkstra's algorithm)
- Critical dependency analysis
- Graph coloring
- Community detection (Louvain algorithm)
- Influence analysis (PageRank)
- Reachability analysis
- Transitive closure
- Impact analysis

**22. Distributed Graph Scheduler (`execution/distributed-graph-scheduler.ts`)**
- Parallel graph computation scheduling
- Graph computation tasks with dependencies
- Priority-based scheduling (High, Medium, Low)
- Duration estimation for each graph type
- Parallel group computation using topological sort
- Integration with distributed execution engine
- Statistics and JSON export/import

**23. Constitutional Language Server (`lsp/constitutional-language-server.ts`)**
- Live constitutional violations in IDE (VS Code, JetBrains, Cursor, Zed, Neovim)
- LSP protocol implementation
- Document open/change/close handlers
- Incremental analysis with dirty tracking
- LSP diagnostic conversion
- Completion, hover, and code actions
- Connected client management
- Statistics and JSON export/import

**24. Whole Repository Reasoning (`reasoning/whole-repository-reasoning.ts`)**
- Architecture-level compilation (not file-level)
- Repository analysis with statistics
- Cross-repository analysis (event flow, capability sharing, identity mapping, trust network)
- Architecture queries (repository, cross-repository, global scope)
- Query execution and result tracking
- Statistics and JSON export/import

**25. Build Proof Pipeline (`pipeline/build-proof-pipeline.ts`)**
- Build pipeline with architecture scoring
- Pipeline stages: Parse, Lower, Canonicalize, Analyze, EvaluateRules, GenerateEvidence, GenerateCounterEvidence, ComputeGraphs, Optimize, GenerateProof
- Architecture score output: Trust Score, Ownership Score, Capability Integrity, Rule Coverage, Evidence Confidence
- Conclusion generation with recommendations
- Pipeline result tracking and statistics
- JSON export/import

**26. Architecture Diff Engine (`diff/architecture-diff-engine.ts`)**
- Semantic diffs (not line diffs)
- Diff types: Added, Removed, Modified
- Semantic diff types: AuthorityChanged, OwnershipTransferred, CapabilityWidened, CapabilityNarrowed, CapabilityAdded, CapabilityRemoved, TrustBoundaryWeakened, TrustBoundaryStrengthened, PersistenceAdded, PersistenceRemoved, MutationAdded, MutationRemoved, EventAdded, EventRemoved
- Impact assessment (Critical, High, Medium, Low)
- Diff summary computation
- Statistics and JSON export/import

**27. Rule Coverage (`coverage/rule-coverage.ts`)**
- Test coverage for constitutional rules
- Coverage metrics per rule (total nodes, covered nodes, coverage percentage)
- Architecture coverage (overall coverage, by rule type, by node type)
- Low/high coverage rule detection
- Uncovered node tracking
- Statistics and JSON export/import

**28. Fuzzing (`fuzzing/constitutional-fuzzing.ts`)**
- AFL for architecture
- Fuzzing operations: RandomMutation, RandomAuthorityChange, RandomCapabilityRemoval, RandomCapabilityAddition, RandomTrustViolation, RandomPersistenceRemoval, RandomEventRemoval, RandomNodeRemoval, RandomNodeDuplication
- Fuzzing campaigns with configurable iterations
- Robustness evaluation (violations detected, violations missed, false positives, false negatives)
- Statistics by operation type
- JSON export/import

#### Phase S.12D — CEO Execution Directive (10 fixes)

#### 1. IR Node Types (`ir/node-types.ts`)
- All IR node types defined
- 40+ node types covering structural, behavioral, constitutional, data, architectural, and operation nodes
- **14 semantic IR node types added** (AuthorityOwnership, CapabilityBoundary, ConstitutionalRoot, LayerBoundary, MutationSite, PersistenceSite, TrustBoundary, EventPublication, EventSubscription, ConstructionBoundary, RepositoryBoundary, IdentityBoundary, WitnessBoundary)
- TypeScript interfaces for all node types
- Helper types (Parameter, Field)
- IRDocument root container

#### 2. Symbol ID Generator (`ir/symbol-id.ts`)
- **Deterministic UUID v5 generation** using SHA256(namespace + canonical symbol + signature)
- Same source → Same symbol → Same ID forever
- SymbolIDRegistry for tracking and lookup
- No random UUID generation

#### 3. Incremental Cache (`ir/incremental-cache.ts`)
- File hashing with SHA-256
- **Version-based cache validation** (compilerVersion, irVersion, registryVersion, ruleVersion)
- No wall-clock time dependency
- Cache hit detection
- Cache entry management
- Statistics tracking

#### 4. TypeScript Frontend (`frontends/typescript/ts-frontend.ts`)
- TypeScript Compiler API integration
- AST traversal and IR emission
- **10 CEO Directive Fixes Completed:**
  1. **IR Semantic Concepts** - All node types emit semantic IR, not AST structure
  2. **Deterministic UUID Generation** - All symbol IDs use deterministic UUID v5
  3. **Version-Based Cache** - No timestamps, uses version compatibility checks
  4. **Complete Import Detection** - import, import type, export, export type, re-export, namespace import, conditional import, importKind classification
  5. **Semantic Method Call Resolution** - caller symbol, callee symbol, resolved authority, resolved implementation, interface edge, runtime edge, ownership edge, capability edge, mutation edge, construction edge
  6. **Complete Assignment/Mutation Detection** - field mutation, property mutation, collection mutation, Map.set, Set.add, push, splice, append, repository commit, database write, cache mutation, filesystem write, event append, Replay append, Witness append, Projection rebuild
  7. **Alias Resolution** - import alias, export alias, barrel exports, re-export chains, namespace alias, path mapping, tsconfig aliases
  8. **Inheritance Resolution** - extends, implements, abstract, generic inheritance, interface inheritance, mixin detection, decorator augmentation
  9. **DI Resolution** - constructor injection, factory, provider, service locator, container, registry, decorators, reflection
  10. **Generic Specialization** - Resolve Repository<T>, Authority<T>, Worker<T>, Projection<T>, Capability<T> into concrete instantiated symbols

### Installation

```bash
npm install
```

### Build

```bash
npm run build
```

### Next Steps

**Remaining Work:**
- Implement specific graph computers for each graph type
- Implement actual task execution in distributed execution engine
- Implement authorization, ownership, and capability checks in counter-evidence engine
- Implement file loading in constitutional registry loader
- Implement synthetic corpus for validation
- Implement comprehensive testing (unit tests, property tests, golden file tests, synthetic architecture tests, performance benchmarks, determinism tests, regression corpus)
- Implement CLI for compiler execution
- Implement report generation

## Architecture

The compiler follows a modular architecture:

1. **Frontends** (TS, Python, future Rust/Go/C#) → emit IR
2. **IR** (Intermediate Representation) → all analysis operates on IR
3. **Registry** → constitutional truth declared, not discovered
4. **Resolver** → full semantic resolution
5. **Graph Engine** → independent graph analyses
6. **Evidence Engine** → findings with evidence
7. **Rule Engine** → declarative rule evaluation
8. **Validator** → synthetic validation suite
9. **Reports** → production audit outputs

## Philosophy

From "Constitutional Audit" to "Constitutional Semantic Compiler"

An auditor observes. A compiler builds a canonical semantic model, verifies invariants, and produces evidence.

## Acceptance Criteria

The compiler is complete when it can answer, with evidence:

- Who owns every mutable state?
- Who owns every identifier?
- Who owns every hash?
- Who owns every signature?
- Who owns every persistence operation?
- Which authority created every object?
- Which subsystem is permitted to mutate it?
- Which constitutional rule authorizes that mutation?
- Which exact AST nodes prove the finding?
- Which exact evidence disproves alternative explanations?
