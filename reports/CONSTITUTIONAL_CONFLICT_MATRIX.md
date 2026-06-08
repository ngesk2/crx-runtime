# Constitutional Conflict Matrix
**Version:** Pre-Replay Execution  
**Classification:** Forensics (Read-Only)

This document maps the conflicting assumptions and models between the active CRX runtime and the specifications.

---

## Conflict Matrix

| Conflict Area | CRX Active Runtime Model | Declared / Spec Model | Conflict Details |
|---|---|---|---|
| **Identity Model** | Bare SHA-256 of object representation. | Domain-separated length-prefixed fingerprinting. | The runtime can collide identical object structures across different domains, breaking replay stability. |
| **Lineage Model** | Local validation (parent/child checks only). | Global DAG topology verification. | The runtime does not traverse the graph, allowing deep cycles to bypass commit validations. |
| **Replay Model** | Execution proceeds directly without replay proofs. | Double-execution verification checks. | The runtime assumes execution is implicitly deterministic without running double-execution verifications. |
| **Persistence Model** | Relational DDL represents system contracts. | Append-only event stream owns truth. | The active codebase depends on PostgreSQL structure updates to change execution behaviors. |\n