# Constitutional Principles

## Core Principles

### 1. Event Sovereignty
Events are the sole source of truth. Agents may analyze, classify, summarize, propose, validate, repair, generate diffs, and generate tests, but agents may NOT:
- Mutate canonical truth directly
- Bypass policy
- Fabricate lineage
- Overwrite history
- Bypass replay validation

### 2. Lineage Immutability
All causal relationships must be preserved. Lineage chains are append-only and immutable.

### 3. Policy Primacy
All state transitions must pass through policy evaluation. Policy decisions are recorded and auditable.

### 4. Replay Determinism
The system must be reconstructable from the event log. Replay validation is mandatory for all mutations.

### 5. Audit Append-Only
All audit records are append-only. Audit trails are never modified, only extended.

### 6. Constitutional Minimalism
The kernel remains minimal. Domain-specific logic (education, FERPA, etc.) lives in layers above the kernel.

## Derived Principles

### REUSE BEFORE CREATE
Before creating ANY file:
- Search repository
- Search schemas
- Search prompts
- Search infrastructure
- Search orchestration logic
- Search event systems
- Search replay systems
- Search policy systems
- Search observability systems
- Search runtime definitions

If functionality overlaps: MERGE IT.
If systems duplicate: CANONICALIZE THEM.
If architecture forks: SIMPLIFY IT.

### Infrastructure Unification
There must be ONE canonical infrastructure stack in `infra/`. All services boot from `docker compose up -d` ONLY.

### Configuration Centralization
All configuration must be centralized in `infra/.env`. Do not scatter ports, runtime flags, service endpoints, model names, feature flags, secrets, or observability settings.

### Observability Derivation
Observability derives from lineage. All telemetry systems must converge on the same event substrate.
