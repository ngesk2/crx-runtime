# Roadmap Traceability Matrix
**Version:** Pre-Replay Execution  
**Classification:** Forensics (Read-Only)

This matrix evaluates the proposed CRX roadmap recommendations against actual repository evidence.

---

## Roadmap Matrix

| Proposed Component | Supported by Repo Evidence? | Supported by JS.txt? | Supported by AGENT.md? | Status Classification | Rationale |
|---|---|---|---|---|---|
| **kernel/canonical/** | `NO` (only naive sorter) | `YES` (canonicalize) | `YES` (Priority 2/3) | **FULLY JUSTIFIED** | Extracted from JS.txt to isolate key normalization. |
| **kernel/fingerprint/** | `NO` (naive SHA-256) | `YES` (fingerprint) | `YES` | **FULLY JUSTIFIED** | Essential for domain-separated hashing. |
| **kernel/identity/** | `NO` (uses hashing directly) | `NO` (spec only) | `YES` | **SPECULATIVE** | Identity semantics must be designed; none exist in JS.txt or runtime. |
| **kernel/lineage/** | `PARTIAL` (simple parent check) | `YES` (DFS verifier) | `YES` | **FULLY JUSTIFIED** | Integrates full loop and bypass validation checks. |
| **kernel/replay/** | `NO` | `YES` (harness.js) | `YES` | **PARTIALLY JUSTIFIED** | Extraction is justified, but runtime execution depends on unwritten scheduler adapters. |
| **kernel/witness/** | `NO` | `YES` (auditor.js) | `YES` | **PARTIALLY JUSTIFIED** | Proof verification exists in JS.txt but event schemas must stabilize first. |
| **infra/postgres/** | `YES` (runtime pg Pool) | `NO` | `YES` | **FULLY JUSTIFIED** | Needed locally to host the event and artifact stores. |
| **infra/redis/** | `NO` | `NO` | `YES` | **SPECULATIVE** | No active code references Redis; only doc-level queue aspirations exist. |
| **infra/ollama/** | `NO` | `NO` | `YES` | **SPECULATIVE** | No active code references Ollama; only doc-level local LLM aspirations exist. |
| **infra/observability/** | `NO` (pino only) | `NO` | `YES` | **SPECULATIVE** | Prometheus/Grafana/Loki/Tempo are not referenced by executable code. |
| **worktrees/** | `NO` | `NO` | `YES` | **SPECULATIVE** | Git worktrees increase topological complexity and are not required for a single developer local build. |\n