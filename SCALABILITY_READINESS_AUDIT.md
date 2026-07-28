# G.12 Scalability Readiness Audit

**Date:** 2026-06-25  
**Method:** Architecture analysis against growth factors: 10×, 100×, 1000×

---

## Current Architecture Characteristics

| Metric | Current Value |
|---|---|
| Events (Postgres) | 15 rows |
| Artifacts (Postgres) | 15 rows |
| Authority objects (Postgres) | 15 rows |
| Qdrant points | 5 |
| Active users | ~1-2 |
| Services running | 6 |
| Codebase size | ~70 MB (Python + JS + config) |

---

## Scaling Analysis

### Scaling Factor

| Component | 10× (150 events, 50 Qdrant points) | 100× (1,500 events, 500 points) | 1000× (15,000 events, 5,000 points) |
|---|---|---|---|
| **User-facing API** | ✅ Gateway stateless — scale horizontally | ✅ Gateway stateless — scale horizontally | ✅ Gateway stateless — scale horizontally |
| **Postgres** | ✅ Single node — fine (1,500 rows trivial) | ⚠️ Single node — no replica, no read replicas | ❌ CATASTROPHIC — single node cannot scale |
| **Qdrant** | ✅ Single node — fine (50 points trivial) | ⚠️ Single node — 500 points fine but no HA | ❌ FAILING — single collection, no sharding configured |
| **Ollama Inference** | ❌ Single GPU — queue builds up | ❌ Single GPU — request timeout expected | ❌ Single GPU — unusable |
| **Workers** | ✅ Single worker fine | ⚠️ Need horizontal worker pool | ❌ Need Redis queue, worker orchestration |
| **Newsletter Ingestion** | ✅ Fine | ⚠️ Rate-limited by Yahoo IMAP | ❌ Need OAuth service account, not single-user IMAP |
| **Filesystem** | ✅ Fine | ✅ Fine | ⚠️ Container logs could fill disk |
| **Secrets** | ❌ All in plaintext YAML | ❌ Same problem, multiplied | ❌ Unmanageable at scale |

---

## Bottleneck Analysis

### Immediate Bottlenecks (Blocking 10× Now)

| Bottleneck | Where | Fix Required |
|---|---|---|
| Secrets in plaintext | `docker-compose.yml`, `.env` files | Implement SecretAdapter or Vault before adding more services |
| YAHOO creds in VCS | `brainos/newsletter/.env` | Remove from git, use secret store |
| No Postgres backup | Everywhere | Implement pg_dump before accumulating more data |
| No monitoring | — | Cannot detect scaling issues without metrics |

### Medium-Term Bottlenecks (Blocking 100×)

| Bottleneck | Where | Fix Required |
|---|---|---|
| Single Postgres node | Database | Read replicas, connection pooling (PgBouncer) |
| Single Qdrant node | Vector store | Sharded collections, replication factor > 1 |
| No message queue | Worker orchestration | Deploy RabbitMQ or NATS |
| No horizontal scale for API | Gateway | Add load balancer, multiple gateway instances |
| No worker pool | Background processing | Celery or Temporal for distributed workers |
| No read replicas | Database | Postgres streaming replication |
| Ollama inference on single GPU | ML Inference | Multi-GPU, model sharding, request queue |

### Long-Term Bottlenecks (Blocking 1000×)

| Bottleneck | Where | Fix Required |
|---|---|---|
| Postgres single node | Database | Sharding, Citus, TimescaleDB |
| Qdrant single cluster | Vector store | Multi-cluster, geo-distributed |
| Monolithic codebase | Development | Microservices, independent deploy units |
| Local filesystem | Storage | Object store (S3-compatible) |
| Manual deployment | Operations | CI/CD with zero-downtime |
| No backup strategy | Data | Automated, verified, off-site backups |
| No disaster recovery | Operations | DR plan, cross-region failover |

---

## Scalability Score

| Area | Score (1-10) | Notes |
|---|---|---|
| **Horizontal scale** (API) | 7/10 | Gateway stateless — easy to scale. But no load balancer. |
| **Database scale** | 2/10 | Single node, no replicas, no pooler. |
| **Compute scale** (inference) | 1/10 | Single GPU, no queue. |
| **Workers** | 1/10 | No orchestration, no queue, no pool. |
| **Storage scale** | 3/10 | Local Docker volumes only. No object store. |
| **Secrets management** | 0/10 | Plaintext everywhere. No secret store. |
| **Monitoring** | 0/10 | No monitoring, no alerting, no metrics. |
| **Backup/recovery** | 1/10 | No backup exists. |
| **CI/CD** | 3/10 | Git exists, Dockerfiles exist. No automated pipeline. |
| **Overall** | **2/10** | Functional for current scale (15 events), zero readiness for growth. |

---

## Conclusion

**Scalability readiness: 2/10**

The system is functional at its current microscopic scale (<20 data rows) but has zero architectural provisions for growth. The stateless components (Gateway, UI) are ready for 10× scaling, but everything else is a single-node, single-instance design.

The most critical blockers are not architectural but operational: secrets in plaintext, no backups, no monitoring. These must be solved before any scaling effort.
