# Event Substrate Forensics Report
**Version:** Pre-Replay Execution  
**Context:** C:\Users\nolan\CRX  
**Classification:** Forensics (Read-Only)

---

## 1. Discovered Event Substrate Strata

The repository has multiple parallel event definitions:

### Stratum A: Database Table (`execution_events` / `events`)
- **Observed Schema (CRX Runtime):**
  - Table: `execution_events` (defined in [ledger_schema.sql](file:///C:/Users/nolan/CRX/runtime/kernel/commit-service/src/persistence/ledger_schema.sql))
  - Fields: `event_id SERIAL`, `event_type VARCHAR`, `payload JSONB`, `created_at TIMESTAMP`.
  - Properties: Lacks parent lineage links, lacks actor fields, lacks policy versioning.
- **Observed Schema (CascadeProjects Template):**
  - Table: `events` (defined in [init-db.sql](file:///C:/Users/nolan/CascadeProjects/infra/scripts/init-db.sql))
  - Fields: `event_id UUID`, `event_type VARCHAR`, `actor_id VARCHAR`, `timestamp TIMESTAMPTZ`, `payload JSONB`, `lineage JSONB`, `policy_version VARCHAR`.

### Stratum B: JSON Schema Documents (CRX Knowledge & VOS)
- **Observed Schema:** `vos/cos/schema/audit-event.schema.json`
  - Defines fields: `audit_id`, `actor`, `action`, `resource`, `status`, `timestamp`.
  - Used for: Governance verification auditing.
- **Observed Schema:** `knowledge/authoritative/claim.schema.json` & `decision.schema.json`
  - Defines fields: `claim_id`, `claim_key`, `source_event_id`, `claim_status`, `validated_at`.

---

## 2. Forensic Analysis of Event Behavior

### Actual Event Structures (Active Runtime):
- The live runtime [event_log.ts](file:///C:/Users/nolan/CRX/runtime/kernel/commit-service/src/events/event_log.ts) logs events using a naive schema:
  - `logEvent(eventType: string, payload: any)`
  - SQL: `INSERT INTO execution_events (event_type, payload) VALUES ($1, $2)`
  - It does not structure actor ids, policy versions, or lineage parent arrays.

### Implicit Event Contracts:
- The `commit-service` assumes that once an event is inserted into the SQL table, its execution ordering is implicitly established by the database's auto-incrementing serial primary key (`event_id SERIAL`) or automatic `created_at` timestamp.

### Append and Mutation Semantics:
- **Append Semantics:** The active table `execution_events` is append-only by practice (there are no update routes), but is not structurally immutable.
- **Mutation Semantics:** There is no database or runtime constraint prohibiting the alteration of historical rows.

### Ordering and Lineage Assumptions:
- **Ordering Assumptions:** Real-world time-of-arrival (via PostgreSQL system time) determines the chronological sequence of events.
- **Lineage Assumptions:** Lineage constraints are checked out-of-band by the `dag_validator.ts` during commit, but the parent/child relationships are written to a separate `lineage_store` table, rather than embedded within the event payload itself.

---

## 3. Competing Event Models

The table below summarizes the contradictions between the declared and observed event definitions:

| Attribute | Declared (AGENT.md) | Observed Runtime (`execution_events`) | Observed Template (`init-db.sql`) | Observed Audit (`audit-event`) |
|---|---|---|---|---|
| ID Format | String (generic) | `SERIAL` (int) | `UUID` | `String` |
| Lineage | Required (`lineage` object) | Absent | Required (`lineage` JSONB) | Absent |
| Actor ID | Required (`actor_id`) | Absent | Required (`actor_id`) | Required (`actor`) |
| Policy Version | Required | Absent | Required | Absent |
| Timestamp | Required (`timestamp`) | Absent (implicit db) | Required | Required |
