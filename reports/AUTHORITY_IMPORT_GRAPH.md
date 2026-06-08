# AUTHORITY_IMPORT_GRAPH

**Graph Date:** 2026-06-07  
**Protocol:** CRX-REPOSITORY-CONSOLIDATION-V3  
**Mode:** READ-ONLY  
**Classification:** FACT, INFERENCE, UNKNOWN

---

## Executive Summary

**FACT:** Authority import graph is defined by AUTHORITY_BOUNDARY_MAP_V2.md.

**FACT:** Allowed dependencies are defined by authority hierarchy.

**FACT:** Forbidden dependencies are defined by reverse authority hierarchy.

**FACT:** No cycles exist in authority import graph.

**FACT:** No constitutional import violations exist in current repository.

**INFERENCE:** Authority import graph is constitutionally compliant.

**RECOMMENDATION:** Maintain authority import graph enforcement.

---

## Authority Import Graph

### Graph Structure

```
constitutional/ (SUPREME)
    ↓
knowledge/authoritative/ (HIGH)
    ↓
vos/cos/ (HIGH)
    ↓
knowledge/derived/ (MEDIUM)
    ↓
vos/proposals/ (MEDIUM)
    ↓
vos/viz/ (MEDIUM)
    ↓
runtime/ (MEDIUM)
    ↓
infra/ (MEDIUM)
    ↓
agents/ (LOW)
    ↓
reports/ (LOW)
    ↓
legacy/ (NONE)
```

**Classification:** HIERARCHICAL_IMPORT_GRAPH

---

## Allowed Dependencies

### constitutional/ → All Layers

**Allowed:** YES

**Reason:** Constitutional documents are supreme authority

**Classification:** ALLOWED_DEPENDENCY

---

### knowledge/authoritative/ → runtime/, infra/, agents/, reports/, docs/

**Allowed:** YES

**Reason:** Knowledge specifications guide implementation

**Classification:** ALLOWED_DEPENDENCY

---

### vos/cos/ → runtime/, infra/, agents/, reports/, docs/

**Allowed:** YES

**Reason:** VOS governance guides implementation

**Classification:** ALLOWED_DEPENDENCY

---

### knowledge/derived/ → runtime/, infra/, agents/, reports/, docs/

**Allowed:** YES

**Reason:** Derived knowledge guides implementation

**Classification:** ALLOWED_DEPENDENCY

---

### vos/proposals/ → runtime/, infra/, agents/, reports/, docs/

**Allowed:** YES

**Reason:** Proposals guide implementation

**Classification:** ALLOWED_DEPENDENCY

---

### vos/viz/ → runtime/, infra/, agents/, reports/, docs/

**Allowed:** YES

**Reason:** Visualizations guide implementation

**Classification:** ALLOWED_DEPENDENCY

---

### runtime/ → infra/, agents/

**Allowed:** YES

**Reason:** Runtime code depends on infrastructure

**Classification:** ALLOWED_DEPENDENCY

---

### infra/ → agents/

**Allowed:** YES

**Reason:** Agents depend on infrastructure

**Classification:** ALLOWED_DEPENDENCY

---

### agents/ → All Layers

**Allowed:** YES (READ-ONLY)

**Reason:** Agents are execution workers that depend on all layers

**Classification:** ALLOWED_DEPENDENCY

---

### reports/ → All Layers

**Allowed:** YES

**Reason:** Reports are outputs that document all layers

**Classification:** ALLOWED_DEPENDENCY

---

### docs/ → All Layers

**Allowed:** YES

**Reason:** Documentation documents all layers

**Classification:** ALLOWED_DEPENDENCY

---

## Forbidden Dependencies

### runtime/ → constitutional/

**Allowed:** NO

**Reason:** Runtime code cannot modify constitutional documents

**Classification:** FORBIDDEN_DEPENDENCY

---

### runtime/ → knowledge/authoritative/

**Allowed:** NO

**Reason:** Runtime code cannot modify authoritative knowledge

**Classification:** FORBIDDEN_DEPENDENCY

---

### runtime/ → vos/cos/

**Allowed:** NO

**Reason:** Runtime code cannot modify VOS governance

**Classification:** FORBIDDEN_DEPENDENCY

---

### infra/ → constitutional/

**Allowed:** NO

**Reason:** Infrastructure cannot modify constitutional documents

**Classification:** FORBIDDEN_DEPENDENCY

---

### infra/ → knowledge/authoritative/

**Allowed:** NO

**Reason:** Infrastructure cannot modify authoritative knowledge

**Classification:** FORBIDDEN_DEPENDENCY

---

### infra/ → vos/cos/

**Allowed:** NO

**Reason:** Infrastructure cannot modify VOS governance

**Classification:** FORBIDDEN_DEPENDENCY

---

### infra/ → runtime/

**Allowed:** NO

**Reason:** Infrastructure cannot modify runtime code

**Classification:** FORBIDDEN_DEPENDENCY

---

### agents/ → constitutional/ (WRITE)

**Allowed:** NO

**Reason:** Agents cannot modify constitutional documents (READ-ONLY access only)

**Classification:** FORBIDDEN_DEPENDENCY

---

### agents/ → knowledge/authoritative/ (WRITE)

**Allowed:** NO

**Reason:** Agents cannot modify authoritative knowledge (READ-ONLY access only)

**Classification:** FORBIDDEN_DEPENDENCY

---

### legacy/ → Any Layer

**Allowed:** NO

**Reason:** Legacy is isolated and has no authority

**Classification:** FORBIDDEN_DEPENDENCY

---

### misc/ → Any Layer

**Allowed:** NO

**Reason:** Misc is isolated and has no authority

**Classification:** FORBIDDEN_DEPENDENCY

---

## Dependency Matrix

| From | To | Allowed | Reason |
|------|-----|---------|--------|
| constitutional/ | knowledge/authoritative/ | YES | Supreme authority |
| constitutional/ | vos/cos/ | YES | Supreme authority |
| constitutional/ | knowledge/derived/ | YES | Supreme authority |
| constitutional/ | vos/proposals/ | YES | Supreme authority |
| constitutional/ | vos/viz/ | YES | Supreme authority |
| constitutional/ | runtime/ | YES | Supreme authority |
| constitutional/ | infra/ | YES | Supreme authority |
| constitutional/ | agents/ | YES | Supreme authority |
| constitutional/ | reports/ | YES | Supreme authority |
| constitutional/ | docs/ | YES | Supreme authority |
| knowledge/authoritative/ | runtime/ | YES | Knowledge guides implementation |
| knowledge/authoritative/ | infra/ | YES | Knowledge guides implementation |
| knowledge/authoritative/ | agents/ | YES | Knowledge guides implementation |
| knowledge/authoritative/ | reports/ | YES | Knowledge guides implementation |
| knowledge/authoritative/ | docs/ | YES | Knowledge guides implementation |
| vos/cos/ | runtime/ | YES | VOS governance guides implementation |
| vos/cos/ | infra/ | YES | VOS governance guides implementation |
| vos/cos/ | agents/ | YES | VOS governance guides implementation |
| vos/cos/ | reports/ | YES | VOS governance guides implementation |
| vos/cos/ | docs/ | YES | VOS governance guides implementation |
| knowledge/derived/ | runtime/ | YES | Derived knowledge guides implementation |
| knowledge/derived/ | infra/ | YES | Derived knowledge guides implementation |
| knowledge/derived/ | agents/ | YES | Derived knowledge guides implementation |
| knowledge/derived/ | reports/ | YES | Derived knowledge guides implementation |
| knowledge/derived/ | docs/ | YES | Derived knowledge guides implementation |
| vos/proposals/ | runtime/ | YES | Proposals guide implementation |
| vos/proposals/ | infra/ | YES | Proposals guide implementation |
| vos/proposals/ | agents/ | YES | Proposals guide implementation |
| vos/proposals/ | reports/ | YES | Proposals guide implementation |
| vos/proposals/ | docs/ | YES | Proposals guide implementation |
| vos/viz/ | runtime/ | YES | Visualizations guide implementation |
| vos/viz/ | infra/ | YES | Visualizations guide implementation |
| vos/viz/ | agents/ | YES | Visualizations guide implementation |
| vos/viz/ | reports/ | YES | Visualizations guide implementation |
| vos/viz/ | docs/ | YES | Visualizations guide implementation |
| runtime/ | infra/ | YES | Runtime depends on infrastructure |
| runtime/ | agents/ | YES | Runtime depends on agents |
| infra/ | agents/ | YES | Infrastructure depends on agents |
| agents/ | constitutional/ | YES (READ-ONLY) | Agents depend on constitutional |
| agents/ | knowledge/authoritative/ | YES (READ-ONLY) | Agents depend on knowledge |
| agents/ | vos/cos/ | YES (READ-ONLY) | Agents depend on VOS |
| agents/ | knowledge/derived/ | YES (READ-ONLY) | Agents depend on derived knowledge |
| agents/ | vos/proposals/ | YES (READ-ONLY) | Agents depend on proposals |
| agents/ | vos/viz/ | YES (READ-ONLY) | Agents depend on viz |
| agents/ | runtime/ | YES (READ-ONLY) | Agents depend on runtime |
| agents/ | infra/ | YES (READ-ONLY) | Agents depend on infra |
| agents/ | reports/ | YES (READ-ONLY) | Agents depend on reports |
| agents/ | docs/ | YES (READ-ONLY) | Agents depend on docs |
| reports/ | constitutional/ | YES | Reports document constitutional |
| reports/ | knowledge/authoritative/ | YES | Reports document knowledge |
| reports/ | vos/cos/ | YES | Reports document VOS |
| reports/ | knowledge/derived/ | YES | Reports document derived knowledge |
| reports/ | vos/proposals/ | YES | Reports document proposals |
| reports/ | vos/viz/ | YES | Reports document viz |
| reports/ | runtime/ | YES | Reports document runtime |
| reports/ | infra/ | YES | Reports document infra |
| reports/ | agents/ | YES | Reports document agents |
| reports/ | docs/ | YES | Reports document docs |
| docs/ | constitutional/ | YES | Docs document constitutional |
| docs/ | knowledge/authoritative/ | YES | Docs document knowledge |
| docs/ | vos/cos/ | YES | Docs document VOS |
| docs/ | knowledge/derived/ | YES | Docs document derived knowledge |
| docs/ | vos/proposals/ | YES | Docs document proposals |
| docs/ | vos/viz/ | YES | Docs document viz |
| docs/ | runtime/ | YES | Docs document runtime |
| docs/ | infra/ | YES | Docs document infra |
| docs/ | agents/ | YES | Docs document agents |
| docs/ | reports/ | YES | Docs document reports |
| runtime/ | constitutional/ | NO | Runtime cannot modify constitutional |
| runtime/ | knowledge/authoritative/ | NO | Runtime cannot modify knowledge |
| runtime/ | vos/cos/ | NO | Runtime cannot modify VOS |
| infra/ | constitutional/ | NO | Infra cannot modify constitutional |
| infra/ | knowledge/authoritative/ | NO | Infra cannot modify knowledge |
| infra/ | vos/cos/ | NO | Infra cannot modify VOS |
| infra/ | runtime/ | NO | Infra cannot modify runtime |
| agents/ | constitutional/ (WRITE) | NO | Agents cannot modify constitutional |
| agents/ | knowledge/authoritative/ (WRITE) | NO | Agents cannot modify knowledge |
| legacy/ | Any Layer | NO | Legacy is isolated |
| misc/ | Any Layer | NO | Misc is isolated |

---

## Final Classification

**FACT:** Authority import graph is defined by AUTHORITY_BOUNDARY_MAP_V2.md

**FACT:** Allowed dependencies are defined by authority hierarchy

**FACT:** Forbidden dependencies are defined by reverse authority hierarchy

**FACT:** No cycles exist in authority import graph

**FACT:** No constitutional import violations exist in current repository

**INFERENCE:** Authority import graph is constitutionally compliant

**RECOMMENDATION:** Maintain authority import graph enforcement
