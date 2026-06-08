# DEPENDENCY_GRAPH_CORRECTION

**Correction Date:** 2026-06-07  
**Protocol:** CRX-CONSTITUTIONAL-EXECUTION-READINESS-AUDIT  
**Mode:** READ-ONLY  
**Classification:** FACT, INFERENCE, UNKNOWN

---

## Executive Summary

**FACT:** Dependency graph correction completed.

**FACT:** Invalid dependency pattern identified: runtime → agents.

**FACT:** Valid dependency pattern: agents → runtime.

**FACT:** Dependency types must be distinguished: authority dependency, build dependency, deployment dependency, documentation reference.

**INFERENCE:** Dependency graph correction ensures constitutional dependency hierarchy.

**RECOMMENDATION:** Correct dependency graph before infrastructure expansion.

---

## Dependency Types

### Type 1: Authority Dependency

**Definition:** Defines constitutional truth relationships

**Example:** Replay depends on Event Log. Witness depends on Replay. Identity depends on Fingerprint.

**Classification:** AUTHORITY_DEPENDENCY

**Direction:** Higher authority → Lower authority

**Invalid:** Lower authority → Higher authority

---

### Type 2: Build Dependency

**Definition:** Defines compilation/import relationships

**Example:** runtime imports kernel. adapter imports protocol.

**Classification:** BUILD_DEPENDENCY

**Direction:** Any direction for compilation

**Invalid:** Circular build dependencies

---

### Type 3: Deployment Dependency

**Definition:** Defines operational deployment relationships

**Example:** Docker deploys runtime. runtime connects to postgres.

**Classification:** DEPLOYMENT_DEPENDENCY

**Direction:** Infrastructure → Runtime

**Invalid:** Runtime → Infrastructure (authority violation)

---

### Type 4: Documentation Reference

**Definition:** Defines informational references only

**Example:** ADR references Architecture. Threat Model references Protocol.

**Classification:** DOCUMENTATION_REFERENCE

**Direction:** Any direction for documentation

**Invalid:** None (documentation references are always allowed)

---

## Dependency Graph Corrections

### Correction 1: Runtime → Agents (INVALID)

**Current Pattern:** runtime → agents

**Classification:** INVALID_DEPENDENCY

**Reason:** Runtime is higher authority than agents. Runtime should not depend on agents.

**Correct Pattern:** agents → runtime

**Classification:** CORRECTED_DEPENDENCY

**Reason:** Agents are execution workers that depend on runtime.

---

### Correction 2: Authority Dependency Hierarchy

**Current Pattern:** constitutional → knowledge → vos → runtime → infra → agents

**Classification:** VALID_DEPENDENCY_HIERARCHY

**Reason:** Authority hierarchy is correct.

**Correct Pattern:** constitutional → knowledge → vos → runtime → infra → agents

**Classification:** VALID_DEPENDENCY_HIERARCHY

**Reason:** Authority hierarchy is correct.

---

### Correction 3: Build Dependency Hierarchy

**Current Pattern:** runtime imports kernel

**Classification:** VALID_BUILD_DEPENDENCY

**Reason:** Runtime depends on kernel for compilation.

**Correct Pattern:** runtime imports kernel

**Classification:** VALID_BUILD_DEPENDENCY

**Reason:** Runtime depends on kernel for compilation.

---

### Correction 4: Deployment Dependency Hierarchy

**Current Pattern:** Docker deploys runtime. runtime connects to postgres.

**Classification:** VALID_DEPLOYMENT_DEPENDENCY

**Reason:** Infrastructure deploys runtime. runtime depends on infrastructure.

**Correct Pattern:** Docker deploys runtime. runtime connects to postgres.

**Classification:** VALID_DEPLOYMENT_DEPENDENCY

**Reason:** Infrastructure deploys runtime. runtime depends on infrastructure.

---

## Dependency Graph Rules

### Rule 1: Authority Dependency Direction

**Rule:** Authority dependencies must flow from higher authority to lower authority

**Invalid:** Lower authority → Higher authority

**Valid:** Higher authority → Lower authority

**Classification:** AUTHORITY_DEPENDENCY_RULE

---

### Rule 2: Build Dependency Direction

**Rule:** Build dependencies must not create circular dependencies

**Invalid:** Circular build dependencies

**Valid:** Acyclic build dependencies

**Classification:** BUILD_DEPENDENCY_RULE

---

### Rule 3: Deployment Dependency Direction

**Rule:** Deployment dependencies must flow from infrastructure to runtime

**Invalid:** Runtime → Infrastructure (authority violation)

**Valid:** Infrastructure → Runtime

**Classification:** DEPLOYMENT_DEPENDENCY_RULE

---

### Rule 4: Documentation Reference Direction

**Rule:** Documentation references are always allowed

**Invalid:** None

**Valid:** Any direction

**Classification:** DOCUMENTATION_REFERENCE_RULE

---

## Dependency Graph Enforcement

### Enforcement Mechanism 1: Import Restrictions

**Mechanism:** Restrict imports from lower authority to higher authority

**Classification:** IMPORT_RESTRICTION_ENFORCEMENT

**Status:** NOT_IMPLEMENTED

---

### Enforcement Mechanism 2: Lint Rules

**Mechanism:** Lint rules detect invalid dependency patterns

**Classification:** LINT_ENFORCEMENT

**Status:** NOT_IMPLEMENTED

---

### Enforcement Mechanism 3: CI/CD Pipeline

**Mechanism:** CI/CD pipeline blocks invalid dependency patterns

**Classification:** CI_ENFORCEMENT

**Status:** NOT_IMPLEMENTED

---

### Enforcement Mechanism 4: Dependency Graph Validation

**Mechanism:** Dependency graph validation detects invalid patterns

**Classification:** DEPENDENCY_GRAPH_VALIDATION

**Status:** NOT_IMPLEMENTED

---

## Final Classification

**FACT:** Dependency graph correction completed

**FACT:** Invalid dependency pattern identified: runtime → agents

**FACT:** Valid dependency pattern: agents → runtime

**FACT:** 4 dependency types defined

**FACT:** 4 dependency graph rules defined

**FACT:** Dependency graph enforcement mechanisms are not implemented

**INFERENCE:** Dependency graph correction ensures constitutional dependency hierarchy

**RECOMMENDATION:** Implement dependency graph enforcement mechanisms before infrastructure expansion
