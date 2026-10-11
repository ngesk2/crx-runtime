# Commissioning admission candidate

MERGE = HOLD. Production cutover = HOLD. No production routes, bootstrap,
database, credentials, or frontend authority bindings have been changed.

This branch extends TenantRegistry commands and the existing UnifiedEventRuntime
writer. It does not create an event store, scheduler, identity provider, or Rust
authorization authority. The optional Rust kernel has its own worktree and branch
and is not called by this admission candidate.

## Implemented, subject to the proof package

- Owner bindings require a server-resolved authenticated actor, an administratively
  designated issuer signature, an allowlisted verified OIDC identity receipt and
  an independent operator business-verification receipt. Caller owner labels,
  self-signed controller claims, bearer authentication alone and caller attestation
  text cannot create a binding.
- Grants persist issuer, verified owner binding/revision, tenant, controller,
  commissioning project, site, resource, delegated actor, signer/public key,
  permitted operations, purpose, consent digest, validity, revision and revocation.
  Consent must resolve independently and bind the exact grant scope.
- Admission verifies the authenticated actor, exact scope, signer, current grant
  and owner revisions, payload binding and signature. New wire v2 rejects duplicate
  fields before parsing, unknown intent/envelope fields, ambiguous base64 and
  invalid JSON. Historical identity bytes are unchanged. Existing canonical
  knowledge vocabulary and payload hashes are required; frontend Project support
  does not imply backend Project admission.
- The owner and grant are locked in that order, then the database clock establishes
  the authorization decision inside the event/receipt transaction. Revision and
  revocation changes conflict with those locks. Event and receipt use the same
  pool/client; rejection and interrupted writes roll back both. A decision before
  expiry may commit afterward within the bounded transaction; subsequent actions
  cannot use an expired grant. The receipt preserves the decision timestamp.
- Direct object writes through the *enabled candidate* shared writer are rejected,
  including JSON-forged bypass metadata. This flag is not enabled in production.
  Relationship admission is deliberately unavailable without endpoint scope proof.
- Duplicate admissions under a valid grant return the original receipt without
  dispatching again. `TenantRegistry.executeGetAdmissionReceipt` separately reads
  an accepted outcome after grant expiry, grant revocation or owner revocation.
  It resolves the original authenticated actor and matches tenant, controller,
  project, site, resource, logical operation and operation digest against the
  persisted receipt. It does not authorize a new write or invoke handlers.
  A missing or mismatched receipt returns UNKNOWN, not permission to retry.
- Real child processes are killed at four boundaries: after authorization/before
  append, after event insertion/before receipt, after commit/before dispatch and
  inside the existing projector transaction after object insertion. Interrupted
  writes roll back; an interrupted rebuild preserves its prior projection.
  Fresh-process and repeated PingProjector rebuilds after grant revocation produce
  the same object and transition, preserving journal and receipt bytes without
  invoking external effect handlers.

## Reproduce

```sh
python3 test/check_commissioning.py \
  --tools-root .build-tools \
  --node-path /home/nolan/ping/gateway/node_modules \
  --run-disposable-database-tests
```

The ignored `.test-database.json` must point to a disposable loopback database
named `admission_proof` with `cluster_name=ping-admission-proof-20261010`. The suite
checks that marker before resetting its test schemas. The latest isolated cluster
is PostgreSQL 16.15, built from the official checksum-verified archive in
`/tmp/ping-admission-postgresql-20261010`; no system installation was performed.
The cluster's source archive SHA-256 is
`c1575341fa7bd40f5274ea465b34390f4dc64cdd0770af327005caaeb9f6b7ed`.
The source is available at [PostgreSQL's official file browser](https://www.postgresql.org/ftp/source/v16.15/).

The runner refuses dirty tracked sources before touching the database and fails
if tracked sources change during the gate. Existing untracked proof artifacts and
ignored local dependencies are not committed; this is tracked-source cleanliness.
It records one source SHA, source hashes, environment, exact commands,
counts and exits in `artifacts/commissioning-proof.json`. It compiles the existing
TypeScript reference and runs candidate admission/recovery tests plus five existing
gateway suites. It returns nonzero if any suite fails, including known baseline
failures; a candidate pass is not an all-repository pass.

## Holds that these tests cannot remove

1. **Real owner root is BLOCKED.** Tests use synthetic server-only identities and
   resolved fixture receipts. No designated production issuer, independently
   verified business-owner evidence resolver, OIDC-to-business entitlement bridge,
   or real HPP commissioning consent has been provisioned. FYD has real Google
   OIDC code, but login is not business entitlement; its current owner-mode demo
   identity is unverified. No real HPP grant has been issued.
2. **All-writer convergence is UNPROVEN.** The static inventory records multiple
   stores and writers. `/canonical-events` uses CanonicalEventEnvelope rather than
   the shared writer; AppendOrchestrator, EventRepository, ConstitutionalEventBus
   and older Python/TS paths require caller and deployment tracing. The knowledge
   compiler actually publishes through ConstitutionalEventBus. Production bootstrap
   remains unchanged and commissioning disabled. This is not a zero-bypass proof
   or a decision that any class owns universal event authority.
3. **Object authority still needs convergence.** The candidate checks known
   vocabulary/hash/controller prerequisites and update ownership in the existing
   journal. It does not prove globally race-safe same-object creation across all
   grants, tenants or legacy writers. Project vocabulary is not added. No admitted
   HPP Project has reached the actual FYD projection or customer loop.
4. **Production recovery is UNPROVEN.** The recovery fixture provisions acceptance
   sequence only in an empty test journal. Live sequence/migration and startup
   recovery wiring are not proven. No external provider execution occurred; there
   is no claimed universal PENDING/SUCCEEDED/FAILED/UNKNOWN effect lifecycle or
   reconciliation proof. Unknown provider outcomes must not be blindly retried.
5. **Live provenance is UNVERIFIED.** The historical image snapshot has no revision
   labels/source mounts. No inspected source revision matches all six sampled
   critical image files. Docker was subsequently shut down; it was not restarted
   by this proof. The snapshot is not evidence of the current live state.
6. **Customer verification remains separate.** Held FYD tests/browser checks
   remain unexecuted by this backend-only candidate. The latest full admission
   gate must pass at the recorded clean source SHA before any green gate claim;
   that pass still cannot certify the actual FYD customer surface.

## Ingest fixture contract

The five ingest failures were reproduced at the original checkout: test fixtures
constructed the existing runtime without persistence, which correctly rejected
writes. The fixtures now use the marked disposable PostgreSQL database in their
own `ingest_boundary_proof` schema. Exact retries must return success and leave
exactly one persisted event; HTTP retries must return 201. Missing persistence
still rejects without handlers or rows. Timestamp differences retain the existing
logical identity but cannot overwrite different accepted payload bytes: the
second submission must report a collision. No runtime collision rule or historical
canonical byte format was changed. The schema is dropped after the suite.

## Source entrance evidence (not deployed enforcement)

| Entrance | Existing write path | Remaining gap |
| --- | --- | --- |
| Gateway `/events` and `/ingest` | Bootstrap constructs UnifiedEventRuntime without `requireCommissioningForObjectWrites` | Candidate gate is not enabled in the inspected bootstrap |
| Gateway `/canonical-events` | Mounted route forwards caller `actor` and `tenant_id` to CanonicalEventEnvelope | No commissioning grant or trusted actor binding demonstrated at this entrance |
| KnowledgeCompiler | Constructor creates ConstitutionalEventBus and publishing passes use it | Does not establish common commissioning-gate coverage |
| Kernel GatewayAdapter | Constructor creates EventRepository | Deployed caller/reachability and common admission still unproven |
| AppendOrchestrator and legacy Python/TS producers | Static INSERT inventory spans other existing journal stores | Each enabled caller needs tracing; absent callers in a targeted search do not prove incapability |

The static scan has 14 non-test hits, including one comment in
`runtime/ingestion/drive_ingestor.py`; this is 13 SQL write sites, not 14 proven
enabled entrances. The candidate shared-writer rejection tests prove only that
writer when its guard is enabled. No deployment can be promoted from this proof
while any enabled entrance remains uncovered. Route removal or rejection must be
tested against the actual deployment contract before production changes.

## Lock evidence

The suite records p50/p95/p99, throughput, waiter samples and deadlocks for 64 real
scoped admissions, eight concurrent callers/resources, one shared owner and 10ms
of injected database work. It exercises both UPDATE and SHARE locks plus real
revocation races. SHARE conflicts with ordinary revocation UPDATEs; KEY SHARE is
not used. The default remains UPDATE. Results are environment-specific synthetic
measurements, not production capacity claims or authorization to change the lock.

Review the recorded results before promotion. Neither the Rust lane nor these
synthetic authority tests closes the production entitlement or provenance gap.
