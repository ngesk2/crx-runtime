# CRX Agent Permission Boundaries

## Authority Structure

```
/authoritative/    - Read-only for all agents except Governance Agent
/derived/          - Read/write for Documentation Agent, read for others
/experimental/     - Read/write for Refactor Agent, read for others
```

## Agent Definitions

### Planner Agent
**Purpose:** Propose changes without executing

**Can:**
- Read all files in `/authoritative/`, `/derived/`, `/experimental/`
- Generate proposals in `/experimental/proposals/`
- Create analysis documents in `/derived/analysis/`

**Cannot:**
- Write to `/authoritative/`
- Modify any existing files
- Execute proposals

**Permission Matrix:**
```
/authoritative/  : READ
/derived/        : READ
/experimental/  : READ/WRITE (proposals only)
```

---

### Refactor Agent
**Purpose:** Modify experimental code safely

**Can:**
- Read all files
- Write to `/experimental/` only
- Create refactor plans in `/experimental/refactor/`
- Generate tests in `/experimental/tests/`

**Cannot:**
- Write to `/authoritative/`
- Write to `/derived/`
- Modify schemas or constitutions

**Permission Matrix:**
```
/authoritative/  : READ
/derived/        : READ
/experimental/  : READ/WRITE
```

---

### Documentation Agent
**Purpose:** Update derived documentation

**Can:**
- Read all files
- Write to `/derived/` only
- Generate documentation from code
- Update README files
- Create diagrams in `/derived/docs/`

**Cannot:**
- Write to `/authoritative/`
- Write to `/experimental/`
- Modify runtime code

**Permission Matrix:**
```
/authoritative/  : READ
/derived/        : READ/WRITE
/experimental/  : READ
```

---

### Governance Agent
**Purpose:** Generate audits and enforce rules

**Can:**
- Read all files
- Write to `/authoritative/audits/` only
- Generate audit reports
- Validate compliance
- Create decision records

**Cannot:**
- Write to any other directories
- Modify constitutions directly
- Execute changes

**Permission Matrix:**
```
/authoritative/  : READ/WRITE (audits only)
/derived/        : READ
/experimental/  : READ
```

---

## Permission Enforcement

### File-Level Permissions
```json
{
  "agent_permissions": {
    "planner": {
      "read": ["authoritative/**", "derived/**", "experimental/**"],
      "write": ["experimental/proposals/**", "derived/analysis/**"]
    },
    "refactor": {
      "read": ["authoritative/**", "derived/**", "experimental/**"],
      "write": ["experimental/**"]
    },
    "documentation": {
      "read": ["authoritative/**", "derived/**", "experimental/**"],
      "write": ["derived/**"]
    },
    "governance": {
      "read": ["authoritative/**", "derived/**", "experimental/**"],
      "write": ["authoritative/audits/**"]
    }
  }
}
```

### Operation-Level Permissions
```json
{
  "operations": {
    "planner": ["read", "analyze", "propose"],
    "refactor": ["read", "modify_experimental", "test"],
    "documentation": ["read", "document", "diagram"],
    "governance": ["read", "audit", "validate"]
  }
}
```

---

## Safety Mechanisms

### 1. Pre-Flight Checks
- Verify agent identity
- Check permission scope
- Validate target path
- Confirm operation type

### 2. Audit Trail
- Log all agent operations
- Track file modifications
- Record permission violations
- Maintain decision history

### 3. Rollback Capability
- Git commits before agent writes
- Snapshot experimental directory
- Restore points for each operation
- Automatic rollback on failure

### 4. Approval Gates
- Critical changes require human approval
- Authoritative modifications require Governance Agent + human
- Experimental changes require Planner Agent proposal first
- Documentation changes auto-approved for `/derived/`

---

## Implementation Priority

1. **Phase 1:** Permission matrix definition (this file)
2. **Phase 2:** Permission checking middleware
3. **Phase 3:** Audit logging system
4. **Phase 4:** Rollback mechanism
5. **Phase 5:** Approval gate system
