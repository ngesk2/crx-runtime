# Measured candidate admission changes

Correctness gates ran before contention tuning. The service execution budget now
starts before pool acquisition. A timed-out acquisition never starts BEGIN or a
mutation; a client delivered late is released. Outstanding acquisition promises
are capped per registry (operator option commissioningMaxPending, default 64),
including abandoned requests until the driver settles them. pg.Pool has no
per-call cancellation seam, so those pending slots cannot be silently freed and
reused while abandoned connection requests remain queued. Overload and deadline
errors return 503; an ambiguous COMMIT still returns UNKNOWN. Body upload/parsing
and authentication are separate ingress concerns, not claimed inside this budget.
Rollback cleanup uses only that same remaining budget. If none remains or a
rollback stalls beyond it, the pooled connection is destroyed rather than given
an additional one-second cleanup allowance. A failed COMMIT acknowledgement still
remains UNKNOWN; no automatic replay or claim of rollback is invented.

Default admission owner/grant locks are now FOR SHARE, with UPDATE retained as an
explicit operator option. Grant/owner revocation and issuance still take UPDATE
locks. Logical-operation and resource advisory locks plus journal uniqueness
independently protect idempotency and object establishment. Shared locks never
serve as proof of actor entitlement. No identity, grant or revocation decisions
are cached.

The source-backed measurement fixture uses sixteen distinct fresh objects, one
owner and four concurrent callers. Six alternating UPDATE/SHARE runs yielded 48
admissions per mode. In this local sample p95 was 180.97ms versus 134.46ms and p99
204.13ms versus 166.99ms. These are synthetic, small-sample observations, not
production capacity or SLO promises. The affected admission, command and denial
suites remain required alongside both revocation ordering tests.

The measured path uses 23 SQL calls per fresh object, including eleven timeout
setup calls. Owner contention dominated. Per-query remaining-time configuration
is intentionally retained: fewer round trips are not worth weakening lock,
statement or cleanup deadlines. No custom SQL batching/compiler is introduced.

The actual ownership predicate was assessed on a 20,000-row synthetic clone of
the journal and its indexes. The existing partial object-creation UNIQUE index
served a one-row expression Index Scan; no additional ownership index was needed.
Append overhead and production query plans remain deployment measurement work.

Post-commit handler/integration dispatch is still sequential and synchronous to
the admission response. Handler failures are logged by the existing runtime;
there is no claimed universal persisted applied/failed/retryable provider state.
Existing journal-based projection recovery is tested, but external effect delivery
and UNKNOWN provider reconciliation remain UNPROVEN. No new outbox, queue,
scheduler or fire-and-forget execution is added by this patch. MERGE/cutover HOLD.
