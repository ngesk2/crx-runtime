# Admission Receipt Backup and Recovery

Status: PROCEDURE DOCUMENTED. Automated backup is NOT implemented; it is the
explicit next step (see below). No backup automation may be built under the
2026-10-11 PRODUCTION HOLD and the CEO "no new infrastructure" directive
without a separate owner decision.

## What gets backed up

One admission receipt is worthless without the rows that let it be re-verified.
The backup unit is the full admission closure set, per tenant:

1. `tenant_admission_receipts` (the receipt rows; append-only, never updated)
2. `ping_events` rows referenced by `tenant_admission_receipts.event_id`
3. `tenant_commissioning_grants` rows referenced by `tenant_admission_receipts.grant_id`
4. `tenant_owner_bindings` rows referenced by the grants' `owner_binding_id`
5. `tenant_registry` row for the tenant

Method: `pg_dump` (custom format) of exactly these tables, schema-qualified,
plus a SHA-256 manifest of the dump file. Logical dump, not filesystem copy,
so a restore can land on any PostgreSQL 16 instance for verification.

What is deliberately NOT in the backup: live credentials, private keys, OIDC
tokens. The backup holds digests and public keys only, which is sufficient to
re-verify every receipt.

## How often

Recommended (owner decision required before any production use):

- Continuous WAL archiving on the production database (point-in-time recovery).
- Daily base backup retaining 30 days; weekly full retained 1 year.
- A `pg_dump` of the five tables immediately BEFORE and AFTER any migration
  that touches them (including trigger changes like the append-only work).

Test plane (current): dump after each proof run that writes receipts; keep the
dump next to the run's evidence. No automation exists yet.

## Recovery procedure

Recover into a scratch database. Never restore over the live database.

1. `createdb receipt_recovery_<date>` on an isolated PostgreSQL instance.
2. `pg_restore -d receipt_recovery_<date> <dump-file>` (schema-qualified tables only).
3. Verify the dump manifest: `sha256sum <dump-file>` matches the recorded manifest.
4. Re-verify every receipt, in this order:
   a. Primary-key uniqueness: no duplicate
      `(tenant_id, actor_id, logical_operation_id)` in `tenant_admission_receipts`.
   b. Foreign-key closure: every receipt's `event_id` exists in `ping_events`,
      every `grant_id` exists in `tenant_commissioning_grants`, every grant's
      `owner_binding_id` exists in `tenant_owner_bindings`.
   c. Receipt integrity: `receipt` JSON parses; `receipt.event_id`,
      `receipt.operation_digest`, `receipt.grant_id`, `receipt.grant_revision`
      match the row columns; `authorization_decision_at` is present for all
      receipts created after the column existed (historical rows predate it;
      never invent a backfill).
   d. Grant validity at decision time: receipt `authorization_decision_at`
      falls inside the grant's `[valid_from, expires_at)` and the grant row's
      `status` was `active` with no `revoked_at` before the decision time.
   e. Immutability spot check: attempt `UPDATE`/`DELETE` on one restored
      receipt row and confirm the append-only trigger rejects it (the triggers
      are part of `commissioning_schema.sql` and restore with the schema).
5. Any check that fails: the recovered set is NOT trusted. Quarantine it and
   escalate; do not promote recovered rows as verified.

## Explicit next step (not implemented)

Automated, scheduled backup of the five tables with manifest hashing, restore
drills, and alerting on failure. Blocked on: owner decision for backup target,
retention, and who holds the manifests; plus the standing PRODUCTION HOLD.
When authorized, implement it as a standalone operator-run script against the
production database, never as a new service or new infrastructure.
