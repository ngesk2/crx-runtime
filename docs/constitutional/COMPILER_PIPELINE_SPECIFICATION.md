# Compiler Pipeline Specification

**Version:** 1.0
**Status:** DRAFT
**Purpose:** Define the contract for every compiler stage. This specification makes the compiler executable by any implementation.

---

## Stage Specification Template

Every compiler stage is defined with the following contract:

- **Stage Name** - Unique identifier for the stage
- **Inputs** - Required input object families
- **Allowed Object Families** - Permitted input object families
- **Transformation** - Description of the transformation
- **Output Object Family** - Canonical object family produced
- **Purity** - Whether the stage has side effects
- **Determinism** - Whether the stage produces identical outputs given identical inputs
- **Replay Contract** - Whether the stage can be replayed independently
- **Side Effects** - Allowed side effects (if any)
- **Failure Modes** - Possible failure conditions
- **Success Conditions** - Conditions for successful completion

---

## Stage 1: Discovery

**Stage Name:** Discovery

**Inputs:** External sources (Git repositories, websites, APIs, RFCs, humans, databases, telemetry streams, log streams)

**Allowed Object Families:** None (external sources only)

**Transformation:** Discover and register long-lived information sources. Source discovery identifies where information originates and creates Source objects.

**Output Object Family:** Source

**Purity:** Yes (no side effects on existing objects)

**Determinism:** Yes (same sources produce same Source objects)

**Replay Contract:** Replayable (source discovery can be replayed)

**Side Effects:** None

**Failure Modes:**
- Source unreachable
- Authentication failure
- Permission denied
- Network timeout
- Invalid source format

**Success Conditions:**
- Source object created with valid identity
- Source metadata populated
- Source provenance recorded

---

## Stage 2: Acquisition

**Stage Name:** Acquisition

**Inputs:** Source

**Allowed Object Families:** Source

**Transformation:** Acquire immutable snapshots from Sources. Snapshot acquisition creates Artifact objects representing the state of a Source at a point in time.

**Output Object Family:** Artifact

**Purity:** Yes (no side effects on Source objects)

**Determinism:** Yes (same Source + timestamp produces same Artifact)

**Replay Contract:** Replayable (snapshot acquisition can be replayed)

**Side Effects:** None

**Failure Modes:**
- Source unavailable
- Snapshot failure
- Corrupted data
- Size limit exceeded
- Timeout

**Success Conditions:**
- Artifact object created with valid identity
- Artifact hash computed
- Artifact provenance recorded
- Artifact linked to Source

---

## Stage 3: Parsing

**Stage Name:** Parsing

**Inputs:** Artifact

**Allowed Object Families:** Artifact

**Transformation:** Extract Evidence from Artifacts. Parsing analyzes the structure and content of Artifacts to extract raw Evidence (AST nodes, functions, imports, tables, endpoints, commit authors, dependencies, hashes, symbols).

**Output Object Family:** Evidence

**Purity:** Yes (no side effects on Artifact objects)

**Determinism:** Yes (same Artifact produces same Evidence)

**Replay Contract:** Replayable (parsing can be replayed)

**Side Effects:** None

**Failure Modes:**
- Parse error
- Invalid format
- Unsupported language
- Malformed data
- Schema violation

**Success Conditions:**
- Evidence objects created with valid identities
- Evidence linked to Artifact
- Evidence structure validated
- Evidence hash computed

---

## Stage 4: Fact Extraction

**Stage Name:** Fact Extraction

**Inputs:** Evidence

**Allowed Object Families:** Evidence

**Transformation:** Extract Facts from Evidence. Fact extraction identifies immutable factual relationships (Function Foo() calls Function Bar(), Module A imports Module B, File X contains Class Y, Endpoint Z depends on Database W).

**Output Object Family:** Fact

**Purity:** Yes (no side effects on Evidence objects)

**Determinism:** Yes (same Evidence produces same Facts)

**Replay Contract:** Replayable (fact extraction can be replayed)

**Side Effects:** None

**Failure Modes:**
- Extraction error
- Ambiguous relationship
- Incomplete data
- Circular dependency
- Invalid fact

**Success Conditions:**
- Fact objects created with valid identities
- Fact linked to Evidence
- Fact structure validated
- Fact hash computed

---

## Stage 5: Relationship

**Stage Name:** Relationship

**Inputs:** Fact, Evidence

**Allowed Object Families:** Fact, Evidence

**Transformation:** Extract and formalize Relationships. Relationship stage identifies dependency edges, ownership edges, and other structural relationships between Facts and Evidence.

**Output Object Family:** Relationship

**Purity:** Yes (no side effects on Fact or Evidence objects)

**Determinism:** Yes (same Fact + Evidence produces same Relationships)

**Replay Contract:** Replayable (relationship extraction can be replayed)

**Side Effects:** None

**Failure Modes:**
- Relationship extraction error
- Ambiguous relationship
- Circular dependency
- Invalid relationship
- Missing reference

**Success Conditions:**
- Relationship objects created with valid identities
- Relationship linked to Fact and Evidence
- Relationship structure validated
- Relationship hash computed

---

## Stage 6: Knowledge Compilation

**Stage Name:** Knowledge Compilation

**Inputs:** Fact, Evidence, Relationship

**Allowed Object Families:** Fact, Evidence, Relationship

**Transformation:** Compile Knowledge from Facts, Evidence, and Relationships. Knowledge compilation is the first semantic stage, producing Knowledge objects that reference Facts, Evidence, Relationships, and Constitution.

**Output Object Family:** Knowledge

**Purity:** Yes (no side effects on Fact, Evidence, or Relationship objects)

**Determinism:** Yes (same Fact + Evidence + Relationship produces same Knowledge)

**Replay Contract:** Replayable (knowledge compilation can be replayed)

**Side Effects:** None

**Failure Modes:**
- Compilation error
- Missing dependency
- Incomplete knowledge
- Invalid reference
- Constitution violation

**Success Conditions:**
- Knowledge objects created with valid identities
- Knowledge linked to Fact, Evidence, Relationship
- Knowledge structure validated
- Knowledge hash computed
- Knowledge contains zero subjective fields

---

## Stage 7: Assessment

**Stage Name:** Assessment

**Inputs:** Knowledge

**Allowed Object Families:** Knowledge

**Transformation:** Generate Assessment from Knowledge. Assessment generates opinions about Knowledge (confidence, freshness, risk, complexity, security, quality, coverage, trust, priority).

**Output Object Family:** Assessment

**Purity:** Yes (no side effects on Knowledge objects)

**Determinism:** Yes (same Knowledge produces same Assessment)

**Replay Contract:** Replayable (assessment can be replayed)

**Side Effects:** None

**Failure Modes:**
- Assessment error
- Invalid metric
- Missing data
- Calculation error
- Timeout

**Success Conditions:**
- Assessment objects created with valid identities
- Assessment linked to Knowledge
- Assessment structure validated
- Assessment hash computed
- Assessment never modifies Knowledge

---

## Stage 8: Capability

**Stage Name:** Capability

**Inputs:** Knowledge

**Allowed Object Families:** Knowledge

**Transformation:** Compile Capability from Knowledge. Capability compilation identifies abstractions (Search, Authentication, Payment, Logging, Metrics, Deployment) that can be derived from Knowledge.

**Output Object Family:** Capability

**Purity:** Yes (no side effects on Knowledge objects)

**Determinism:** Yes (same Knowledge produces same Capability)

**Replay Contract:** Replayable (capability compilation can be replayed)

**Side Effects:** None

**Failure Modes:**
- Capability compilation error
- Missing dependency
- Invalid capability
- Incomplete specification
- Constitution violation

**Success Conditions:**
- Capability objects created with valid identities
- Capability linked to Knowledge
- Capability structure validated
- Capability hash computed
- Capability is an abstraction, not code

---

## Stage 9: Planning

**Stage Name:** Planning

**Inputs:** Knowledge, Capability, Policy, Goal

**Allowed Object Families:** Knowledge, Capability, Policy, Goal

**Transformation:** Generate Plan from Knowledge, Capability, Policy, and Goal. Planning generates executable intent that can be consumed by Runtime.

**Output Object Family:** Plan

**Purity:** Yes (no side effects on Knowledge, Capability, Policy, or Goal objects)

**Determinism:** Yes (same Knowledge + Capability + Policy + Goal produces same Plan)

**Replay Contract:** Replayable (planning can be replayed)

**Side Effects:** None

**Failure Modes:**
- Planning error
- Unsolvable goal
- Missing dependency
- Invalid plan
- Constitution violation

**Success Conditions:**
- Plan objects created with valid identities
- Plan linked to Knowledge, Capability, Policy, Goal
- Plan structure validated
- Plan hash computed
- Plan is executable intent

---

## Stage 10: Projection

**Stage Name:** Projection

**Inputs:** Knowledge, Relationship

**Allowed Object Families:** Knowledge, Relationship

**Transformation:** Generate Projection from Knowledge and Relationship. Projection generates reproducible views (Graph, Vector, Lexical, Architecture, Search, Temporal) of Knowledge and Relationships.

**Output Object Family:** Projection

**Purity:** Yes (no side effects on Knowledge or Relationship objects)

**Determinism:** Yes (same Knowledge + Relationship produces same Projection)

**Replay Contract:** Replayable (projection can be replayed)

**Side Effects:** None

**Failure Modes:**
- Projection error
- Missing data
- Invalid projection
- Timeout
- Memory limit exceeded

**Success Conditions:**
- Projection objects created with valid identities
- Projection linked to Knowledge and Relationship
- Projection structure validated
- Projection hash computed
- Projection is reproducible

---

## Stage 11: Replay

**Stage Name:** Replay

**Inputs:** Knowledge

**Allowed Object Families:** Knowledge

**Transformation:** Execute Replay on Knowledge. Replay execution generates Certificates (Replay, Witness, Verification, Signature, Audit) that verify the correctness of Knowledge.

**Output Object Family:** Certificate

**Purity:** Yes (no side effects on Knowledge objects)

**Determinism:** Yes (same Knowledge produces same Certificate)

**Replay Contract:** Replayable (replay can be replayed)

**Side Effects:** None

**Failure Modes:**
- Replay failure
- Verification failure
- Hash mismatch
- Version mismatch
- Constitution violation

**Success Conditions:**
- Certificate objects created with valid identities
- Certificate linked to Knowledge
- Certificate structure validated
- Certificate hash computed
- Certificate verifies correctness

---

## Stage Properties Summary

### Stage Purity
All stages are pure. No stage has side effects on existing objects.

### Stage Determinism
All stages are deterministic. Same inputs produce identical outputs.

### Stage Locality
All stages only inspect their declared inputs. No global lookups. No runtime state.

### Stage Replayability
All stages are replayable independently without downstream stages.

### Stage Completeness
All stages produce outputs containing enough information that downstream stages never reopen the original source. Once Parsing finishes, Compiler never reopens Repository, File, Website, API again. Everything flows forward.

---

## Compiler Pipeline Flow

```
External Sources
    ↓
Discovery → Source
    ↓
Acquisition → Artifact
    ↓
Parsing → Evidence
    ↓
Fact Extraction → Fact
    ↓
Relationship → Relationship
    ↓
Knowledge Compilation → Knowledge
    ↓
Assessment → Assessment
    ↓
Capability → Capability
    ↓
Planning → Plan
    ↓
Projection → Projection
    ↓
Replay → Certificate
```

---

## Invariants

1. **Stage Purity:** Every stage has Input Family → Output Family. No side effects.
2. **Stage Determinism:** Running twice produces identical Canonical Object IDs, Hashes, Relationships, Evidence.
3. **Stage Locality:** Stage may only inspect its declared inputs. No global lookups. No runtime state.
4. **Stage Replayability:** Entire stage replayed independently without downstream stages.
5. **Stage Completeness:** Output contains enough information that downstream stages never reopen the original source.

---

## Implementation Requirements

Any implementation of this compiler pipeline must:

1. Accept the specified input object families for each stage
2. Produce the specified output object family for each stage
3. Maintain purity (no side effects on existing objects)
4. Maintain determinism (same inputs produce same outputs)
5. Support replayability (stages can be replayed independently)
6. Respect stage locality (no global lookups or runtime state)
7. Ensure stage completeness (downstream stages never reopen original sources)

---

**Status:** DRAFT
**Version:** 1.0
