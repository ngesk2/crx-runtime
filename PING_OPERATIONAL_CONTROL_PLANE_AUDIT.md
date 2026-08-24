# READ-ONLY AUDIT — PING as Operational Control Plane

**Mode:** Read-only. No implementation. No refactoring.
**Objective:** Determine how PING evolves into the single operational control plane for all TenantOS websites/services.
**Basis:** `constitutional-runtime` (PING) + `happy-place-platform` (HPP) verified this session; reconciles with `SPRINT4_INFRASTRUCTURE_AUDIT.md` and `NEXT_PHASE_PLANNING_REVIEW.md`.
**Invariant (from SPRINT4):** canonical owner = *who owns the meaning*, not who stores / executes / monitors / references it.

---

## 0. Reconciliation — PING: Thin Execution vs. Control Plane

`NEXT_PHASE_PLANNING_REVIEW.md` narrowed PING to *Execution / Scheduling / Provider State / OAuth / Retries / Queues / Health / Metrics* (thin execution). This directive expands PING to *Fleet Health, Runtime State, Observability, Automation Timeline, Workflow Execution, Notifications, Deployment Management, Website Administration, Tenant Registry, Event Explorer, Logs, AI Ops, Ollama monitoring, Oracle infra monitoring, Fleet Command*.

**These are NOT in conflict** once the invariant is applied:
- PING owns **operational execution + operational visibility/control** of every tenant system.
- PING does **NOT** own *business meaning* (customers/projects/reviews/CRM/content/knowledge) — those stay HPP/Knowledge.
- PING *monitors the health* of HPP's Neo4j/Qdrant but does **not** own their business contents.
- Oracle *hosts* (compute/functions/storage/networking/IAM/secrets/tenancy); it does not own constitutional meaning.

So the control-plane framing is the **operational superset** of the thin-execution framing: PING executes AND observes execution, across all tenants, without owning any business meaning. The `NEXT_PHASE` narrowing (remove knowledge/neo4j/qdrant *ownership* from PING) still holds — PING monitors them, HPP owns them.

**Resolved model (three tiers + providers):**
| Tier | Owns (meaning) | Owns (operation) |
| --- | --- | --- |
| **Oracle** | — (hosting only) | tenancy, IAM, secrets vault, compute, functions, storage, networking, certs, backups |
| **HPP** | constitution, compiler, IR, generated runtime, business objects, knowledge (Neo4j/Qdrant contents) | business workflows, event *definitions* |
| **PING** | — | execution, scheduling, retries, queues, notifications, automation timeline, observability, deployment mgmt, website admin, tenant registry (metadata), logs, AI-ops monitoring |
| **Providers** (Google/Stripe/Twilio…) | their data | — |

---

## 1. PING Constitutional Boundary Audit (Control-Plane View)

| Concern | Canonical Owner | PING Role |
| --- | --- | --- |
| Business objects (customer/project/review/CRM) | HPP | references only |
| Knowledge (Neo4j/Qdrant contents) | HPP | monitors health; never reads meaning |
| Compiler IR / generated runtime | HPP | consumes; never modifies |
| Authority/Event/Workflow *definitions* | HPP | executes; never defines |
| Execution of automation | **PING** | owns |
| Retries / scheduling / queues | **PING** | owns |
| Notifications (email/SMS/push/Slack…) | **PING** (routing) | owns delivery + observability |
| Deployment state / rollback / blue-green | **PING** (admin) | owns metadata + control |
| Tenant registry (metadata only) | **PING** | owns metadata; not business data |
| Runtime state (version/SHA/deploy ID/flags) | **PING** | owns |
| Logs / metrics / traces | **PING** | owns aggregation + viz |
| Hermes / Ollama runtime health | **PING** (monitor) | monitors; Oracle hosts |
| Oracle infra (compute/functions/storage…) | Oracle | PING visualizes |

**PING MUST NEVER OWN:** customers, projects, reviews, CRM, content, knowledge meaning, compiler IR, canonical event/workflow/authority definitions, generated runtime definitions.

---

## 2. PING Observability Specification (what every tenant publishes)

Standard contract each tenant (HPP + future) emits to PING:

**Health:** `status` (healthy/warning/offline/updating/maintenance), `latency_ms`, `memory_pct`, `error_rate`, `version`, `last_deployment`.
**Runtime:** `git_sha`, `deployment_id`, `build_ts`, `environment`, `active_feature_flags[]`.
**Metrics:** `uptime_pct`, `requests_total`, `slow_requests`, `api_failures`, `queue_depth`, `cache_hit_ratio`, `storage_bytes`, `db_status`.
**Logs:** unified streams — application / infrastructure / automation / authentication / api — tagged by tenant + trace_id.
**Traces:** request → automation → provider call, with span for each.
**Events:** every constitutional event (see §5) is an observable event in PING's Event Explorer.

PING visualizes all; does not store business payloads — only operational metadata + event envelopes (hash, not content).

---

## 3. Tenant Administration Specification (common admin per site)

PING hosts administration for every TenantOS deployment. Capabilities:
- **Deploy / Restart / Maintenance Mode**
- **Health** dashboard
- **Feature Flags** (runtime toggle)
- **Backups** (trigger + restore point)
- **Domains / SSL / CDN** (metadata + status; Oracle owns actual certs)
- **Environment Variables / Secrets** (reference only; Oracle Vault stores)
- **Rollback** to previous version

All actions are observable events (who/what/when). PING controls; it does not own the site's business data.

---

## 4. Oracle Runtime Architecture

Oracle is the **hosting tier** (not a constitutional meaning-owner). PING becomes Oracle-aware to avoid console-hopping.

| Component | Hosted by | PING monitors |
| --- | --- | --- |
| Hermes (persistent agent service) | Oracle Compute | model availability, agent status, tool executions, queued tasks, failures, memory, latency |
| Ollama (persistent inference) | Oracle Compute (if resourced) | loaded models, GPU/CPU, memory, inference latency, queue, model versions, warm/cold |
| Postgres | Oracle | status, connections, storage |
| Redis | Oracle | status, memory, hit ratio |
| Object Storage | Oracle | bucket status, usage |
| Load Balancer / VCN | Oracle | traffic, health |
| Identity / Secrets / Logging / Monitoring | Oracle | status (PING visualizes) |

Hermes + Ollama are **long-running platform services**, not app features. PING exposes their operational state; Oracle hosts them.

---

## 5. Event Contract Specification (canonical schema tenants emit)

Every tenant (HPP + future) emits events PING can observe consistently. Envelope (reuse HPP `EventEnvelope`): `event_id` (content hash), `event_type`, `aggregate_id`, `aggregate_type`, `occurred_at`, `producer_id`, `correlation_id`, `causality_id`, `schema_version`, `witness_id`, `tenant_id`, `payload_hash`.

**Canonical event types PING observes (examples):**
`EstimateSubmitted`, `CRMCreated`, `ReviewImported`, `ReviewScheduled`, `EmailSent`, `ProjectCreated`, `ProjectCompleted`, `WorkflowFailed`, `DeploymentFinished`, `NotificationDelivered`, `AutomationQueued`, `OllamaInference`, `HermesToolCall`.

**Rule:** events carry operational + envelope metadata only. Business payloads stay in the tenant's store; PING sees the hash + type, not the content. This preserves the SPRINT4 single-owner invariant.

---

## 6. Open Constitutional Questions (read-only)

1. **PING scope tension** — resolved above via invariant (operational superset of thin execution). Confirm intentionally.
2. **Oracle "Identity" overlap** (from NEXT_PHASE) — Oracle IAM/tenant auth vs HPP business identity meaning. Still unresolved; must be split explicitly.
3. **Notification ownership** — PING "centralizes" notifications (email/SMS/Slack/Discord/Teams/webhook). Is PING the *system of record* for notification delivery state, or only a router? Recommend: PING owns delivery state + observability; provider owns the message. (Consistent with projection boundary in SPRINT4.)
4. **Website Administration secrets** — PING references secrets; Oracle Vault stores them. Confirm PING never caches secret *values*.

---

## 7. Conclusion

PING as operational control plane is **constitutionally sound** if scoped to *operational execution + operational visibility* and explicitly excluded from *business meaning*. The five requested specifications (Boundary, Observability, Tenant Admin, Oracle Runtime, Event Contract) are consistent with the frozen constitution and the SPRINT4 invariant. No implementation performed.

*Read-only audit. No code changed.*
