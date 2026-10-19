# Replay snapshot and transaction ownership

One complete rebuild owns one PostgreSQL connection and one Repeatable Read
transaction. A supplied pool is leased exactly once; an already leased client or
minimal injected session is used directly. Conflict detection receives that same
session instead of falling back to `pool.query`. The caller must not nest this
operation in another transaction.

Before its first journal read, the transaction obtains exclusive locks on the
three existing projection tables. LOCK is a utility command; the snapshot is
established by the subsequent first journal SELECT. This serializes competing
rebuilds before snapshot selection and prevents an older rebuild from publishing
after a newer one. These locks do not stop journal admission, but they do block
projection readers for the duration of the rebuild. That existing full-rebuild
availability cost remains; this patch does not claim an online incremental view.

Conflict validation, object/relationship reconstruction and transition generation
all see that one committed journal snapshot. Accepted events retain the existing
sequence and tie-breaker ordering. A sequence allocation is not commit order or a
safe incremental cursor: a lower-sequence transaction can commit later. No new
high-water checkpoint is invented. The next full rebuild includes all events
committed before its snapshot, including late lower-sequence commits. Automatic
production catch-up and startup wiring remain a deployment proof requirement;
this patch introduces no scheduler or event store.

A failure rolls back every projection change, retaining the previous complete
projection. SQLSTATE 40001/40P01 retries the entire safe database-only rebuild up
to three attempts, each with a fresh transaction/snapshot. Other failures are
reported immediately. A pooled client whose rollback fails is destroyed. No
external provider or handler is invoked or retried by the projector.

Disposable PostgreSQL tests use independent connections and controlled commits
between projection phases, late lower-sequence commits, concurrent rebuilds,
failure after truncation, whole-transaction retries and pool lease/release checks.
Existing process-kill recovery remains in the admission suite. These checks prove
the candidate algorithm, not production schema/sequence or owner authority.
