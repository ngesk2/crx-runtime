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
- Direct object/relationship writes through the shared writer require its private
  admission transaction capability, including when the old opt-in flag is absent
  or false. JSON-forged bypass metadata cannot open that writer. This candidate
  is not merged or deployed.
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
TypeScript reference and runs candidate admission/recovery tests plus nine existing
gateway suites, including affected HTTP contracts and existing event read tests. It returns nonzero if any suite fails, including known baseline
failures; a candidate pass is not an all-repository pass.

## Holds that these tests cannot remove

1. **Real owner root is BLOCKED.** Tests use synthetic server-only identities and
   resolved fixture receipts. No designated production issuer, independently
   verified business-owner evidence resolver, OIDC-to-business entitlement bridge,
   or real HPP commissioning consent has been provisioned. FYD has real Google
   OIDC code, but login is not business entitlement; its current owner-mode demo
   identity is unverified. No real HPP grant has been issued.
2. **All-writer convergence is UNPROVEN.** Three candidate HTTP journal entrances
   now use the existing byte admission gate; four processing mutations reject
   before SQL. Direct CanonicalEventEnvelope business callers, mission and registry
   mutations, AppendOrchestrator, EventRepository, ConstitutionalEventBus and older
   Python/TS paths remain uncovered. Some business authorities mutate their rows
   before appending legacy events, so guarding that append alone is insufficient.
   Non-object shared-writer events remain outside this gate. Production is untouched;
   the default bootstrap lacks the trusted resolver root and keeps these POSTs closed. This is not a zero-bypass proof
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
exactly one persisted event. The old HTTP normalization body no longer authorizes
a write: an unconfigured admission root returns 503 with no persisted change.
Authorized v2 HTTP retries are proven separately against real disposable
owner/grant tables and return the same immutable receipt across all three aliases. Missing persistence
still rejects without handlers or rows. Timestamp differences retain the existing
logical identity but cannot overwrite different accepted payload bytes: the
second submission must report a collision. No runtime collision rule or historical
canonical byte format was changed. The schema is dropped after the suite.

## Source entrance evidence (not deployed enforcement)

| Entrance | Candidate behavior | Remaining gap |
| --- | --- | --- |
| Gateway POST `/events`, `/ingest`, `/canonical-events` | Actual bootstrap mount uses the same original-byte admission handler, trusted actor resolver and event/receipt transaction | Synthetic owner proof only; default root is absent. `/canonical-events` GET still reads historical legacy rows, not the new receipt's journal |
| Four processed/failed POSTs | Reject with 403 before authority callbacks or SQL | No authorized processing-status command is added |
| Shared writer OBJECT/RELATIONSHIP events | Private admission transaction is mandatory; absent/false opt-in cannot bypass | Other event types and journals remain uncovered |
| Business `/projects`, `/customers`, review mutations | Existing authority SQL/provider effects precede legacy event append | No tested admission or entitlement boundary for these effects |
| `/missions`, `/tenants`, deployment/runtime registry mutations | Existing direct commands remain | Exact actor/tenant/resource entitlement and canonical-write coverage not proven |
| KnowledgeCompiler / ConstitutionalEventBus | Existing publishing passes use a different event store | Does not establish common admission coverage |
| Kernel GatewayAdapter / EventRepository | Existing repository journal writer | Deployed callers and admission still unproven |
| AppendOrchestrator and legacy Python/TS producers | Static INSERT inventory spans other stores | Enabled caller tracing and before-mutation proof required |
| FYD owner override API | Demo owner context and JSON owner-event log remain unchanged | Real entitlement and admitted PING-to-FYD customer projection are not certified |

The source scan has 14 non-test hits, including one comment in
`runtime/ingestion/drive_ingestor.py`; this is 13 SQL write sites, not 14 proven
enabled entrances. The new persisted-state tests cover three journal POSTs,
four refused processing mutations, the mandatory shared object guard and
same-store/bootstrap configuration checks. They invoke the actual bootstrap
middleware and admission mount, without starting its other jobs or providers.
The bootstrap keeps the root closed unless both pools identify the same physical
tenant registry; unavailable metadata or different storage also keeps it closed.
No tenant records are copied and no database privilege is granted. This is not
an all-writer or full-bootstrap integration proof. No deployment can be promoted
while any enabled mutation entrance remains uncovered.

## Lock evidence

The suite records p50/p95/p99, throughput, waiter samples and deadlocks for 64 real
scoped admissions, eight concurrent callers/resources, one shared owner and 10ms
of injected database work. It exercises both UPDATE and SHARE locks plus real
revocation races. SHARE conflicts with ordinary revocation UPDATEs; KEY SHARE is
not used. The default remains UPDATE. Results are environment-specific synthetic
measurements, not production capacity claims or authorization to change the lock.

Review the recorded results before promotion. Neither the Rust lane nor these
synthetic authority tests closes the production entitlement or provenance gap.
