# PRESENTPING RECOVERY PLAN

**Date:** 2026-06-20
**Purpose:** Restore reliable presentation generation
**Mode:** READ-ONLY - No modifications, no code changes, no file moves

---

## CURRENT ENGINE LOCATION

**Canonical Location:** C:\Users\nolan\PING\presentping\engine\
**Mirror Location:** C:\Users\nolan\.gemini\antigravity\scratch\ping_presentation\v17-engine\
**Legacy Location:** C:\Users\nolan\CascadeProjects\ping_presentation\v17-engine\

**Status:** Converged to PING\presentping\engine\
**Convergence Date:** 2026-06-20 (per PING_ECOSYSTEM_INVENTORY.md)
**Convergence Method:** File copy from scratch directory to PING root (no code modifications, no refactors)

---

## RUNTIME ENTRY POINTS

**Primary Entry Point:**
- presentping/engine/index-v17.js (VERIFIED)
- Loads world architecture, verifies topology, loads narrative slide data, generates artifacts, renders presentations

**Secondary Entry Points:**
- presentping/engine/renderer-v17.js (VERIFIED)
- Renders architectural districts into pptxgenjs slide shapes

**Supporting Entry Points:**
- presentping/engine/verify_world_topology.js (VERIFIED)
- Verifies topology rules for constitutional city architecture
- presentping/engine/artifact-generator.js (VERIFIED)
- Generates artifacts for presentation rendering

---

## DEPENDENCIES

**Package Dependencies (presentping/package.json):**
- pptxgenjs (VERIFIED)
- sharp (VERIFIED)

**Internal Dependencies:**
- presentping/engine/district-geometry.js (VERIFIED)
- presentping/engine/districts.js (VERIFIED)
- presentping/engine/world.js (VERIFIED)
- presentping/engine/infrastructure.js (VERIFIED)
- presentping/engine/narrative.js (VERIFIED)

**Configuration Dependencies:**
- presentping/config/ (32 configuration files) (VERIFIED)
- presentping/artifacts/ (5 artifact JSON files) (VERIFIED)
- presentping/metadata/ (3 metadata JSON files) (VERIFIED)

---

## METADATA DEPENDENCIES

**Primary Metadata:**
- presentping/metadata/presentation-v17-metadata.json (302KB) (VERIFIED)
- presentping/engine/presentation-v17-metadata.json (139KB) (VERIFIED - duplicate)

**Secondary Metadata:**
- presentping/metadata/presentation-v16-metadata.json (23KB) (VERIFIED)
- presentping/metadata/presentation-v14-metadata.json (116KB) (VERIFIED)

**Artifact Metadata:**
- presentping/artifacts/camera-paths.json (2.3KB) (VERIFIED)
- presentping/artifacts/district-geometry.json (2KB) (VERIFIED)
- presentping/artifacts/failure-routes.json (3.6KB) (VERIFIED)
- presentping/artifacts/packet-layout.json (14.3KB) (VERIFIED)
- presentping/artifacts/world-layout.json (4.7KB) (VERIFIED)

---

## EXPORT PATHS

**Primary Export Path:**
- presentping/engine/PING_Presentation_V17_ConstitutionalCity.pptx (816KB) (VERIFIED)

**Secondary Export Path:**
- presentping/exports/ (empty directory) (VERIFIED)

**Legacy Export Paths (CascadeProjects\ping_presentation\):**
- PING_Presentation_V8_Editable.pptx (168KB)
- PING_Presentation_V10_Semantic.pptx (153KB)
- PING_Presentation_V11_Optimized.pptx (248KB)
- PING_Presentation_V12_LivingCivilization.pptx (172KB)
- PING_Presentation_V13_LivingCivilization.pptx (1.5MB)
- PING_Presentation_V14_ConstitutionalCivilization.pptx (530KB)
- PING_Presentation_V14.5_Civilization.pptx (562KB)
- PING_Presentation_V14_LoopBased.pptx (385KB)
- PING_Presentation_V16_ConstitutionalBaseline.pptx (202KB)
- PING_Presentation_V17_ConstitutionalCity.pptx (1.67MB)

---

## KNOWN RISKS

**Dependency Risks:**
- pptxgenjs dependency may require specific version (UNKNOWN)
- sharp dependency may require specific version (UNKNOWN)
- Node.js version compatibility (UNKNOWN)

**Path Dependency Risks:**
- presentping/engine/index-v17.js may have hardcoded paths (UNKNOWN)
- presentping/engine/renderer-v17.js may have hardcoded paths (UNKNOWN)
- Configuration files may have path dependencies (UNKNOWN)

**Metadata Risks:**
- Duplicate presentation-v17-metadata.json files (presentping/metadata/ and presentping/engine/)
- Metadata file size (302KB) may indicate complexity (OBSERVED)

**Convergence Risks:**
- Runtime behavior unknown after convergence from scratch directory
- Original scratch directory preserved (not deleted)
- Legacy ping_presentation directory preserved (not deleted)

**Export Risks:**
- presentping/exports/ is empty (OBSERVED)
- Primary export exists in presentping/engine/ (OBSERVED)

---

## MISSING VALIDATION

**Runtime Validation:**
- Runtime behavior of presentping/engine/index-v17.js not tested (UNKNOWN)
- Runtime behavior of presentping/engine/renderer-v17.js not tested (UNKNOWN)
- Runtime behavior of presentping/engine/verify_world_topology.js not tested (UNKNOWN)

**Dependency Validation:**
- pptxgenjs installation not verified (UNKNOWN)
- sharp installation not verified (UNKNOWN)
- Node.js version compatibility not verified (UNKNOWN)

**Path Validation:**
- Path dependencies in index-v17.js not verified (UNKNOWN)
- Path dependencies in renderer-v17.js not verified (UNKNOWN)
- Path dependencies in configuration files not verified (UNKNOWN)

**Metadata Validation:**
- Metadata file integrity not verified (UNKNOWN)
- Duplicate metadata files not reconciled (OBSERVED)

**Export Validation:**
- Export path functionality not verified (UNKNOWN)
- presentping/exports/ directory functionality not verified (UNKNOWN)

---

## SHORTEST PATH TO GENERATING PRESENTATIONS

**Step 1: Dependency Installation**
```bash
cd C:\Users\nolan\PING\presentping
npm install
```
**Purpose:** Install pptxgenjs and sharp dependencies
**Risk:** UNKNOWN - dependency versions may not be compatible

**Step 2: Runtime Entry Point Execution**
```bash
cd C:\Users\nolan\PING\presentping\engine
node index-v17.js
```
**Purpose:** Execute primary entry point to generate presentation
**Risk:** UNKNOWN - runtime behavior not validated

**Step 3: Export Verification**
```bash
ls C:\Users\nolan\PING\presentping\engine\*.pptx
ls C:\Users\nolan\PING\presentping\exports\*.pptx
```
**Purpose:** Verify PowerPoint export generation
**Risk:** UNKNOWN - export path functionality not validated

---

## ALTERNATIVE RECOVERY PATHS

**Path 1: Legacy Build Script (CascadeProjects\ping_presentation\)**
```bash
cd C:\Users\nolan\CascadeProjects\ping_presentation
node build_deck.js
```
**Purpose:** Use legacy build script to generate presentations
**Risk:** UNKNOWN - legacy build script may not work in current environment
**Status:** LEGACY - preserved as historical reference

**Path 2: Original Scratch Directory**
```bash
cd C:\Users\nolan\.gemini\antigravity\scratch\ping_presentation\v17-engine
node index-v17.js
```
**Purpose:** Use original scratch directory to generate presentations
**Risk:** UNKNOWN - original directory may have different dependencies
**Status:** ORIGINAL - preserved as original location

---

## RECOVERY VALIDATION CHECKLIST

**Pre-Recovery Validation:**
- [ ] Verify Node.js version compatibility
- [ ] Verify npm installation
- [ ] Verify presentping/package.json exists
- [ ] Verify presentping/engine/index-v17.js exists
- [ ] Verify presentping/engine/renderer-v17.js exists
- [ ] Verify presentping/config/ directory exists with 32 files
- [ ] Verify presentping/artifacts/ directory exists with 5 JSON files
- [ ] Verify presentping/metadata/ directory exists with 3 JSON files

**Dependency Installation Validation:**
- [ ] npm install completes successfully
- [ ] pptxgenjs installed successfully
- [ ] sharp installed successfully
- [ ] node_modules/ directory created

**Runtime Execution Validation:**
- [ ] node index-v17.js executes without errors
- [ ] World topology verification passes
- [ ] Artifact generation completes
- [ ] Presentation rendering completes
- [ ] No runtime errors in console output

**Export Validation:**
- [ ] PowerPoint file generated in presentping/engine/
- [ ] PowerPoint file generated in presentping/exports/
- [ ] PowerPoint file can be opened in PowerPoint
- [ ] PowerPoint file contains expected slides
- [ ] PowerPoint file contains expected content

**Post-Recovery Validation:**
- [ ] Presentation generation is repeatable
- [ ] Presentation generation is deterministic
- [ ] Presentation generation produces consistent output

---

## RECOVERY FAILURE SCENARIOS

**Scenario 1: Dependency Installation Failure**
**Symptom:** npm install fails with dependency errors
**Cause:** pptxgenjs or sharp version incompatibility
**Recovery:** Try alternative dependency versions, check Node.js version compatibility
**Risk:** MEDIUM - dependency version issues can be resolved

**Scenario 2: Runtime Execution Failure**
**Symptom:** node index-v17.js fails with runtime errors
**Cause:** Path dependencies, missing configuration files, metadata issues
**Recovery:** Verify path dependencies, verify configuration files, verify metadata files
**Risk:** HIGH - runtime errors may indicate convergence issues

**Scenario 3: Export Generation Failure**
**Symptom:** PowerPoint file not generated
**Cause:** pptxgenjs rendering failure, sharp processing failure
**Recovery:** Verify pptxgenjs installation, verify sharp installation, check console errors
**Risk:** MEDIUM - export generation issues can be debugged

**Scenario 4: Export Path Failure**
**Symptom:** PowerPoint file generated in wrong location
**Cause:** Export path configuration issue
**Recovery:** Verify export path configuration, update export path if needed
**Risk:** LOW - export path issues can be corrected

---

## RECOVERY SUCCESS CRITERIA

**Minimum Success Criteria:**
- PowerPoint file generated successfully
- PowerPoint file can be opened in PowerPoint
- PowerPoint file contains expected slides

**Full Success Criteria:**
- PowerPoint file generated in presentping/engine/
- PowerPoint file generated in presentping/exports/
- PowerPoint file can be opened in PowerPoint
- PowerPoint file contains expected slides
- PowerPoint file contains expected content
- Presentation generation is repeatable
- Presentation generation is deterministic

---

## RECOMMENDATIONS

**Immediate Actions:**
1. Install dependencies (npm install)
2. Execute runtime entry point (node index-v17.js)
3. Verify PowerPoint export generation
4. Validate PowerPoint file content

**Validation Actions:**
1. Verify Node.js version compatibility
2. Verify npm installation
3. Verify dependency installation
4. Verify runtime execution
5. Verify export generation
6. Verify PowerPoint file content

**Backup Actions:**
1. Preserve original scratch directory (.gemini\antigravity\scratch\ping_presentation\v17-engine\)
2. Preserve legacy ping_presentation directory (CascadeProjects\ping_presentation\)
3. Preserve current presentping directory (C:\Users\nolan\PING\presentping\)

**Documentation Actions:**
1. Document dependency versions
2. Document Node.js version
3. Document runtime execution steps
4. Document export generation steps
5. Document validation results

---

## UNKNOWN INFORMATION

**Dependency Versions:** UNKNOWN - pptxgenjs and sharp versions not verified
**Node.js Version:** UNKNOWN - Node.js version compatibility not verified
**Path Dependencies:** UNKNOWN - path dependencies in source files not verified
**Runtime Behavior:** UNKNOWN - runtime behavior not tested
**Export Path Configuration:** UNKNOWN - export path configuration not verified
**Metadata Integrity:** UNKNOWN - metadata file integrity not verified
**Duplicate Metadata:** UNKNOWN - duplicate metadata files not reconciled
