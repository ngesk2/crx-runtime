# WAVE 3E — ORACLE HOSTING ARCHITECTURE AUDIT (Read-Only)

**Mode:** Read-only audit. No code changes. No infrastructure changes.
**Basis:** PING_V2_CONSTITUTIONAL_OPERATIONAL_PLANE.md (Oracle = host tier), architecture/infrastructure/PING_ORACLE_* blueprints, WAVE_3A5_OPERATIONAL_INVENTORY.md (shared services), BUSINESS_INTELLIGENCE_BOUNDARY.md (Oracle = infra advice only).
**Invariant (SPRINT4):** canonical owner = who owns *meaning*. Oracle owns **neither meaning nor execution** — it is the host.

---

## 1. Oracle Tier Definition

Oracle is the **host tier**. It provides infrastructure and runs the services PING manages. Oracle:
- **OWNS:** Compute, Kubernetes (OCI Container Instances), OCI Functions, Load Balancer, DNS, Certificates, Vault, Object Storage, PostgreSQL hosting, Networking, Monitoring agents.
- **NEVER KNOWS:** Customer, Review, Project, Invoice, Workflow, Knowledge, Compiler, Runtime meaning.

This is consistent with SPRINT4 (Oracle = host, not authority) + PING v2 (Oracle "almost invisible").

---

## 2. Oracle Service Inventory

| Service | Role | Evidence | Business meaning? |
|---|---|---|---|
| Compute / K8s | Run PING + tenant runtimes | architecture/infrastructure/PING_ORACLE_* | NO |
| OCI Functions | Serverless execution | architecture/infrastructure/* | NO |
| Load Balancer | Traffic routing | architecture/infrastructure/* | NO |
| DNS | Name resolution | architecture/infrastructure/* | NO |
| Certificates | TLS | architecture/infrastructure/* | NO |
| Vault | Secret storage (references only) | PING v2 §"Secrets References" | NO (stores, never reads meaning) |
| Object Storage | Artifacts/binaries | architecture/infrastructure/* | NO |
| PostgreSQL hosting | DB hosting (per-tenant schema) | PING v2 §"PostgreSQL per-tenant" | NO (hosts; PING/HPP own data) |
| Networking | VCN/subnets | architecture/infrastructure/* | NO |
| Monitoring agents | Infra telemetry | architecture/infrastructure/* | NO |

**Verification:** ✅ Oracle never stores or processes business meaning. It hosts the databases/services; PING + HPP own the data inside them.

---

## 3. Shared Services (hosted once, consumed by all tenants)

Per PING v2 + WAVE_3A5 §Oracle Persistence:

| Shared service | Hosted by | Managed by | Owned by | Consumers |
|---|---|---|---|---|
| **Hermes Runtime** | Oracle | PING | PING (execution only) | all tenants (agent service) |
| **Ollama Runtime** | Oracle | PING | PING (model telemetry) | all tenants (shared, no per-tenant model) |
| **Neo4j** | Oracle | PING | **HPP** (graph contents) | HPP knowledge |
| **Qdrant** | Oracle | PING | **HPP** (vectors) | HPP knowledge |
| **PostgreSQL** | Oracle | PING | PING (operational metadata) + HPP (business data, per-tenant schema) | all |

**Key boundary:** Neo4j + Qdrant are **hosted by Oracle, managed by PING, OWNED by HPP** (knowledge meaning). PostgreSQL is **hosted by Oracle, managed by PING, split**: PING operational metadata vs HPP business data (per-tenant schema). This resolves the earlier SPRINT4 ambiguity (Knowledge ownership → HPP; hosting → Oracle).

---

## 4. Per-Tenant PostgreSQL Split (critical boundary)

```
PostgreSQL (Oracle-hosted)
   ├── PING operational schema    → deployment/health/queue/replay metadata  [PING owns]
   ├── HPP business schema        → customers/projects/reviews/estimates    [HPP owns]
   └── Future tenant schemas      → isolated per tenant                     [tenant owns]
```

Oracle hosts the instance; it does NOT own the schemas. PING owns operational metadata; HPP owns business data. No shared ownership (SPRINT4 single-owner holds at the schema level).

---

## 5. Secret Management (Vault)

- Oracle **Vault stores secrets** (API keys, DB creds, provider tokens).
- PING **references** secrets (PING v2 "Secrets References") — never caches values.
- HPP business secrets (CRM keys, etc.) stored in Vault; HPP references them.
- **Oracle NEVER reads secret *meaning*** — it's opaque storage.

This matches BUSINESS_INTELLIGENCE_BOUNDARY §9 (no Oracle publication path) + PING v2 (Secrets References, not Secrets Ownership).

---

## 6. Oracle as "Invisible"

Per PING v2: "Oracle should become almost invisible." PING consumes Oracle metrics via monitoring agents; humans never console-hop. Oracle is the substrate, not a participant.

| Oracle concern | Visible to whom? |
|---|---|
| Compute health | PING (observability) |
| DB status | PING (operational dashboard) |
| Vault status | PING (secrets reference health) |
| Cost analysis | Oracle advisory → PING (WAVE_3A5 §Oracle suggestions) |
| Business data | HPP (inside PostgreSQL schema) |

Oracle itself is not a dashboard user — it's monitored *by* PING.

---

## 7. Boundary Verification

| Check | Result | Evidence |
|---|---|---|
| Oracle never knows business meaning | ✅ | §1 (never-knows list) |
| Oracle owns no authority | ✅ | SPRINT4 (host tier) |
| Neo4j/Qdrant owned by HPP | ✅ | §3 (hosted Oracle / managed PING / owned HPP) |
| PostgreSQL split (PING vs HPP) | ✅ | §4 |
| Vault = reference, not ownership | ✅ | §5 |
| No Oracle publication path | ✅ | BUSINESS_INTELLIGENCE_BOUNDARY §9 |
| Oracle = invisible substrate | ✅ | §6 |

---

## 8. What NOT to Build (preserve freeze)

| Tempting Oracle work | Verdict | Reason |
|---|---|---|
| Business logic in Oracle | ❌ DON'T | Oracle = host only |
| Oracle-owned analytics | ❌ DON'T | HPP owns analytics (BI Boundary) |
| Oracle console as admin UI | ❌ DON'T | PING owns admin (PING v2 Website Administration) |
| Per-tenant Ollama/Hermes | ❌ DON'T | shared, hosted once (PING v2) |
| Oracle-managed business data | ❌ DON'T | HPP owns business schemas |

---

## 9. Build Prerequisites (read-only dependency)

Oracle hosting is **already specified** in architecture/infrastructure/PING_ORACLE_* blueprints. The remaining work is **operational**, not architectural:
1. Stand up shared Hermes/Ollama (Oracle-hosted, PING-managed) — PING v2 priority.
2. Provision Neo4j/Qdrant (Oracle-hosted, HPP-owned contents).
3. Create per-tenant PostgreSQL schemas (PING operational + HPP business).
4. Wire Vault secret references (PING + HPP reference, never cache).

None of this changes the frozen architecture — it's deployment of the already-specified tiers.

---

## 10. Success Criteria (answered)

| Question | Answer |
|---|---|
| What does Oracle own? | **Infrastructure only** (compute/K8s/Vault/Postgres/DNS/certs/networking/monitoring) |
| Does Oracle know business meaning? | **NO** — never-knows list enforced |
| Who owns Neo4j/Qdrant contents? | **HPP** (hosted Oracle, managed PING) |
| Who owns PostgreSQL data? | **PING (operational) + HPP (business), per-tenant schema** |
| Is Oracle a participant or substrate? | **Substrate** — monitored by PING, not a user |
| Are boundaries preserved? | **YES** — all checks PASS |

*Read-only audit. No code changed. Committed as WAVE_3E_ORACLE_HOSTING_ARCHITECTURE.md.*
