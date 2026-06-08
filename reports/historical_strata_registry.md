# Historical Strata Registry Report
**Version:** Pre-Replay Execution  
**Context:** C:\Users\nolan\CRX  
**Classification:** Forensics (Read-Only)

---

## 1. Strata Registry Table

| Path | Classification | Git Status | Executable | Active |
|---|---|---|---|---|
| `C:\Users\nolan\CRX\knowledge\` | **ACTIVE** | `YES` (branch: master, clean) | `NO` (docs only) | `YES` (authoritative UCIA specs) |
| `C:\Users\nolan\CRX\vos\` | **ACTIVE** | `YES` (branch: main, clean) | `NO` (docs only) | `YES` (authoritative COS specs) |
| `C:\Users\nolan\CRX\runtime\` | **ACTIVE** | `YES` (branch: audit-hardening, ahead by 3 commits) | `YES` (Express server) | `YES` (live runtime code) |
| `C:\Users\nolan\CRX\agents\` | **REFERENCE** | `NO` (no git) | `PARTIAL` (Python indexer) | `YES` (used for indexing references) |
| `C:\Users\nolan\CascadeProjects\` | **ARCHAEOLOGICAL** (Quarantine Target) | `NO` (no git) | `NO` | `NO` (duplicate wrong-location folder) |
| `C:\Users\nolan\constitutional-integration-lab\` | **ARCHAEOLOGICAL** | `NO` (no git) | `NO` | `NO` (previous audit reports/evidence) |
| `C:\Users\nolan\Documents\Codex\` | **ARCHAEOLOGICAL** | `NO` (no git) | `PARTIAL` (archived JS.txt monolith) | `NO` (historical reference data) |

---

## 2. Retention Registry Policies

- **Rule 1:** No repository or folder in the registry may be deleted or purged during this consolidation phase.
- **Rule 2:** Archaeological files that present duplicate authority (e.g. `CascadeProjects/`) must be quarantined intact under `archive/quarantined/` to preserve historical lineage.
- **Rule 3:** The archived `JS.txt` monolith in the `Codex` directory must be preserved as the raw forensic baseline for all future kernel extractions.
