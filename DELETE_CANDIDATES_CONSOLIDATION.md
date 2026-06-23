# DELETE_CANDIDATES_CONSOLIDATION.md

**Audit Type:** BRAINOS + PING CONSTITUTIONAL CONSOLIDATION AUDIT  
**Repository Root:** C:\Users\nolan\PING  
**Mode:** READ ONLY, NO REFACTORING, NO PATCHES, NO IMPLEMENTATION, NO CODE CHANGES, NO ARCHITECTURE PROPOSALS YET  

---

## EXECUTIVE SUMMARY

**Total Delete Candidates:** 9 directories  
**Delete Priority:** HIGH (empty, duplicate, or external projects)  
**Dependency Risk:** LOW (no runtime dependencies, no active references)

**Delete Candidates:**
1. `infra/` - Empty infrastructure definitions
2. `workspace/` - Empty workspace cache
3. `constitutional-integration-lab/` - Empty integration lab
4. `CascadeProjects/constitutional-extraction-lab/` - Empty extraction lab
5. `artifacts/` - Empty architecture intelligence artifacts
6. `CascadeProjects/infra/` - Duplicate of PING infra/
7. `CRX_REMOTE/` - External project
8. `PING_OBSERVATORY/` - External project
9. `research-pipeline/` - External project

---

## DELETE CANDIDATE DETAILS

### Candidate 1: infra/

**Path:** `C:\Users\nolan\PING\infra\`  
**Type:** Directory  
**Purpose:** Infrastructure definitions  
**Size:** 6 subfolders (all empty)  
**Dependency Risk:** LOW (no active code references)  
**Delete Priority:** HIGH  
**Confidence:** HIGH

**Contents:**
- infra/api/ (empty)
- infra/observability/ (empty)
- infra/ollama/ (empty)
- infra/postgres/ (empty - postgres/init/ is also empty)
- infra/redis/ (empty)
- infra/scripts/ (empty)
- infra/volumes/ (empty)
- infra/worker/ (empty)

**Evidence:**
- All subfolders are empty
- No runtime dependencies
- No active references in PING Gateway or Runtime
- No infrastructure code

**Delete Method:** Delete entire directory

---

### Candidate 2: workspace/

**Path:** `C:\Users\nolan\PING\workspace\`  
**Type:** Directory  
**Purpose:** Workspace cache  
**Size:** 1 subfolder (empty)  
**Dependency Risk:** LOW (no active code references)  
**Delete Priority:** HIGH  
**Confidence:** HIGH

**Contents:**
- workspace/cache/ (empty)

**Evidence:**
- cache/ subfolder is empty
- No runtime dependencies
- No active references in PING Gateway or Runtime
- No workspace code

**Delete Method:** Delete entire directory

---

### Candidate 3: constitutional-integration-lab/

**Path:** `C:\Users\nolan\PING\constitutional-integration-lab\`  
**Type:** Directory  
**Purpose:** Integration lab for constitutional modules  
**Size:** 4 subfolders (all empty)  
**Dependency Risk:** LOW (no active code references)  
**Delete Priority:** HIGH  
**Confidence:** HIGH

**Contents:**
- constitutional-integration-lab/archaeology/ (empty)
- constitutional-integration-lab/evidence/ (empty)
- constitutional-integration-lab/module_registry/ (empty)
- constitutional-integration-lab/extracted/ (5 empty subfolders: canonicalization, lineage, replay, runtime, witness)

**Evidence:**
- All subfolders are empty
- No runtime dependencies
- No active references in PING Gateway or Runtime
- No integration lab code

**Delete Method:** Delete entire directory

---

### Candidate 4: CascadeProjects/constitutional-extraction-lab/

**Path:** `C:\Users\nolan\CascadeProjects\constitutional-extraction-lab\`  
**Type:** Directory  
**Purpose:** Constitutional extraction lab  
**Size:** 3 subfolders (all empty)  
**Dependency Risk:** LOW (no active code references)  
**Delete Priority:** HIGH  
**Confidence:** HIGH

**Contents:**
- CascadeProjects/constitutional-extraction-lab/comparisons/ (empty)
- CascadeProjects/constitutional-extraction-lab/extracted/ (empty)
- CascadeProjects/constitutional-extraction-lab/temporary/ (empty)

**Evidence:**
- All subfolders are empty
- No runtime dependencies
- No active references in PING Gateway or Runtime
- Not part of PING (separate project in CascadeProjects)
- No extraction lab code

**Delete Method:** Delete entire directory

---

### Candidate 5: artifacts/

**Path:** `C:\Users\nolan\PING\artifacts\`  
**Type:** Directory  
**Purpose:** Architecture intelligence artifacts  
**Size:** 1 subfolder (8 empty sub-subfolders)  
**Dependency Risk:** LOW (no active code references)  
**Delete Priority:** HIGH  
**Confidence:** HIGH

**Contents:**
- artifacts/Architecture Intelligence/ (8 empty subfolders: ADRs, Architecture Comparisons, GitHub Intelligence, Knowledge Graph, Layer1 Reports, Release Analysis, Research, Semantic Maps)

**Evidence:**
- All subfolders are empty
- No runtime dependencies
- No active references in PING Gateway or Runtime
- No artifacts code

**Delete Method:** Delete entire directory

---

### Candidate 6: CascadeProjects/infra/

**Path:** `C:\Users\nolan\CascadeProjects\infra\`  
**Type:** Directory  
**Purpose:** Infrastructure planning  
**Size:** 5 files + 4 subfolders (empty)  
**Dependency Risk:** LOW (no active code references)  
**Delete Priority:** HIGH  
**Confidence:** HIGH

**Contents:**
- CascadeProjects/infra/AUTHORITY_ALIGNMENT_AUDIT.md
- CascadeProjects/infra/COGNITION_STACK_EXPANSION.md
- CascadeProjects/infra/GATEWAY_INSERTION_PLAN.md
- CascadeProjects/infra/INFRA_AUDIT.md
- CascadeProjects/infra/LOCAL_EXECUTION_SUBSTRATE_PROPOSAL.md
- CascadeProjects/infra/OLLAMA_READINESS.md
- CascadeProjects/infra/UI_INSERTION_PLAN.md
- CascadeProjects/infra/ollama/ (empty)
- CascadeProjects/infra/postgres/ (empty)
- CascadeProjects/infra/redis/ (empty)
- CascadeProjects/infra/ui-next/ (empty)
- CascadeProjects/infra/volumes/ (empty)

**Evidence:**
- Duplicate structure of PING infra/
- No runtime dependencies
- No active references in PING Gateway or Runtime
- Not part of PING (separate project in CascadeProjects)
- Historical infrastructure planning documents

**Delete Method:** Delete entire directory

---

### Candidate 7: CRX_REMOTE/

**Path:** `C:\Users\nolan\CascadeProjects\CRX_REMOTE\`  
**Type:** Directory  
**Purpose:** External project  
**Size:** Unknown  
**Dependency Risk:** LOW (no runtime dependencies on PING)  
**Delete Priority:** HIGH  
**Confidence:** HIGH

**Evidence:**
- Not part of PING
- Separate project in CascadeProjects
- No runtime dependencies on PING
- No active references in PING Gateway or Runtime

**Delete Method:** Delete entire directory

---

### Candidate 8: PING_OBSERVATORY/

**Path:** `C:\Users\nolan\CascadeProjects\PING_OBSERVATORY\`  
**Type:** Directory  
**Purpose:** External project  
**Size:** Unknown  
**Dependency Risk:** LOW (no runtime dependencies on PING)  
**Delete Priority:** HIGH  
**Confidence:** HIGH

**Evidence:**
- Not part of PING
- Separate project in CascadeProjects
- No runtime dependencies on PING
- No active references in PING Gateway or Runtime

**Delete Method:** Delete entire directory

---

### Candidate 9: research-pipeline/

**Path:** `C:\Users\nolan\CascadeProjects\research-pipeline\`  
**Type:** Directory  
**Purpose:** External project  
**Size:** Unknown  
**Dependency Risk:** LOW (no runtime dependencies on PING)  
**Delete Priority:** HIGH  
**Confidence:** HIGH

**Evidence:**
- Not part of PING
- Separate project in CascadeProjects
- No runtime dependencies on PING
- No active references in PING Gateway or Runtime

**Delete Method:** Delete entire directory

---

## DELETE PLAN

### Delete Structure

```
DELETE:
├── infra/ (8 empty subfolders)
├── workspace/ (1 empty subfolder)
├── constitutional-integration-lab/ (4 empty subfolders)
├── artifacts/ (1 subfolder with 8 empty sub-subfolders)
├── CascadeProjects/constitutional-extraction-lab/ (3 empty subfolders)
├── CascadeProjects/infra/ (5 files + 4 empty subfolders)
├── CascadeProjects/CRX_REMOTE/ (external project)
├── CascadeProjects/PING_OBSERVATORY/ (external project)
└── CascadeProjects/research-pipeline/ (external project)
```

### Delete Steps

1. **Delete infra/:**
   ```bash
   rm -rf infra/
   ```

2. **Delete workspace/:**
   ```bash
   rm -rf workspace/
   ```

3. **Delete constitutional-integration-lab/:**
   ```bash
   rm -rf constitutional-integration-lab/
   ```

4. **Delete artifacts/:**
   ```bash
   rm -rf artifacts/
   ```

5. **Delete CascadeProjects/constitutional-extraction-lab/:**
   ```bash
   rm -rf CascadeProjects/constitutional-extraction-lab/
   ```

6. **Delete CascadeProjects/infra/:**
   ```bash
   rm -rf CascadeProjects/infra/
   ```

7. **Delete CascadeProjects/CRX_REMOTE/:**
   ```bash
   rm -rf CascadeProjects/CRX_REMOTE/
   ```

8. **Delete CascadeProjects/PING_OBSERVATORY/:**
   ```bash
   rm -rf CascadeProjects/PING_OBSERVATORY/
   ```

9. **Delete CascadeProjects/research-pipeline/:**
   ```bash
   rm -rf CascadeProjects/research-pipeline/
   ```

### Delete Verification

After deleting, verify:
1. All deleted directories are removed
2. No broken references in active code
3. Active systems still function
4. PING Gateway and Runtime still work

---

## SUMMARY

| Candidate | Path | Size | Priority | Confidence | Evidence |
|-----------|------|------|----------|------------|----------|
| infra/ | C:\Users\nolan\PING\infra\ | 8 empty subfolders | HIGH | HIGH | All subfolders empty, no runtime dependencies |
| workspace/ | C:\Users\nolan\PING\workspace\ | 1 empty subfolder | HIGH | HIGH | cache/ empty, no runtime dependencies |
| constitutional-integration-lab/ | C:\Users\nolan\PING\constitutional-integration-lab\ | 4 empty subfolders | HIGH | HIGH | All subfolders empty, no runtime dependencies |
| artifacts/ | C:\Users\nolan\PING\artifacts\ | 1 subfolder with 8 empty sub-subfolders | HIGH | HIGH | All subfolders empty, no runtime dependencies |
| CascadeProjects/constitutional-extraction-lab/ | C:\Users\nolan\CascadeProjects\constitutional-extraction-lab\ | 3 empty subfolders | HIGH | HIGH | All subfolders empty, not part of PING |
| CascadeProjects/infra/ | C:\Users\nolan\CascadeProjects\infra\ | 5 files + 4 empty subfolders | HIGH | HIGH | Duplicate of PING infra/, not part of PING |
| CRX_REMOTE/ | C:\Users\nolan\CascadeProjects\CRX_REMOTE\ | Unknown | HIGH | HIGH | External project, not part of PING |
| PING_OBSERVATORY/ | C:\Users\nolan\CascadeProjects\PING_OBSERVATORY\ | Unknown | HIGH | HIGH | External project, not part of PING |
| research-pipeline/ | C:\Users\nolan\CascadeProjects\research-pipeline\ | Unknown | HIGH | HIGH | External project, not part of PING |

**Total Items to Delete:** 9 directories  
**Total Dependency Risk:** LOW  
**Delete Priority:** HIGH  
**Confidence:** HIGH
