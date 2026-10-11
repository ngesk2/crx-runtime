# Isolated legacy command compatibility contract

MERGE HOLD. PRODUCTION HOLD. RUST FROZEN. This contract precedes implementation.
It does not provision a production identity, issuer, owner binding or grant.

## Existing authority and exact bounded actions

Reuse TenantRegistry's verified actor resolver, designated issuer, independent
owner evidence, consent, scoped grant, owner/grant locks and admission receipts.
IdentityAuthority creates IDs; it does not authenticate. Exterior authentication
alone does not establish tenant ownership. No resolver is synthesized from a
request body, bearer label, frontend owner toggle or event source string.

Two explicit command operations extend the existing signed grant operation
allowlist: CUSTOMER_UPSERT and MISSION_CREATE. OBJECT permissions cannot authorize
either command. The existing v2 intent fields, signed bytes, payload digest,
receipt table and revocation/expiry rules remain. Object parsing and validation
remain limited to object operations. The Rust object-proof lane is unchanged.

Both commands require an independently verified owner binding, exact tenant,
controller, commissioning project, site, resource, delegated actor, signer,
purpose and consent. Policy is the exact granted command and resource; there is
no wildcard customer or mission permission. A production issuer must explicitly
approve these new actions. Synthetic fixtures prove implementation only.

CUSTOMER_UPSERT payload is `{tenant_id, customer}` with explicit customer_id,
validated supported fields and no caller actor. Resource is the existing exact
`customer://tenant/customer_id` identity. Tenant is taken from the verified intent
and must equal payload tenant. No arbitrary object/source promotion occurs.
Only manual source is supported; provider claims are rejected. Complete validated
command data is retained in the admitted customer event for evidence replay.
Result uses existing CUSTOMER_CREATED or CUSTOMER_UPDATED events, not an OBJECT
event or a new customer event type.

MISSION_CREATE payload is `{tenant_id, missionType, payload, priority}`. Payload
namespace must equal `tenant::tenant`; creator is the admitted actor, never a
body-createdBy. Resource is `mission://tenant/existing_deterministic_mission_id`.
The granted resource binds mission type and event identity using the existing
MissionRuntime identity rule. Full command bytes bind remaining payload/priority.
Evidence remains MISSION_CREATED; no object semantics are introduced.

## Callers and unsupported access

- POST /customers forwards original strict JSON bytes to CustomerAuthority's
  admitted-upsert operation. Raw tenant/customer bodies are LEGACY-BLOCKED.
  Direct unadmitted executeUpsertCustomer calls reject before SQL.
- POST /missions forwards original strict JSON bytes to the admitted mission
  creation operation. Raw tenant/createdBy bodies are LEGACY-BLOCKED.
- Customer import/email/calendar mutation routes and direct authority calls are
  LEGACY-BLOCKED before provider access until an external-effect authorization,
  idempotency and reconciliation contract exists. Reads remain available.
- Ordinary HTTP tenant registration/update/delete/heartbeat are LEGACY-BLOCKED.
  Owner grants cannot bootstrap tenant registration because the binding requires
  an existing tenant. Trusted issuer administration is a separate unimplemented
  contract; no fake tenant event/receipt is emitted.
- EventToMissionBridge's actual internal create caller retains its processor
  behavior and gains atomic mission/evidence persistence. Its actor/tenant
  authority remains UNPROVEN; event source strings are not owner entitlement.
  ClaimMissionChainer is callable but not constructed by the inspected bootstrap.
  This is not a blanket scheduler disable or whole-writer certification.

## Atomicity and compatibility evidence

Authorization and typed validation precede the first business mutation or provider
effect. Owner and grant locks use the existing order and database decision clock.
The same admitted PostgreSQL transaction performs customer/mission SQL, accurate
existing PING event append, and immutable admission receipt. Any failure before
commit rolls back all of them; no handler or integration runs before commit.

Customer legacy read compatibility requires its existing CanonicalEventEnvelope
record in that same transaction. It is explicitly a compatibility mirror pointing
to the admitted PING event and operation digest, marked processed by the admission
writer so EventBridge cannot re-emit it. No second authorization decision or event
authority is introduced. Persisted mirror bytes must be verified; a failed or
colliding mirror append rolls back customer, PING event and receipt together.
This touches only the newly created command record, never historical records.
Bootstrap retains legacy read storage. Separate adapter/journal pools require
matching physical customer and mirror relation identities; admitted transactions
recheck those relation OIDs before mutation. No table or customer data is copied.

Exact logical-command retries return the immutable receipt without repeating SQL,
mirror append or dispatch. Same operation ID with different bytes rejects. Resource
locking serializes customer commands across grants. The logical-operation lock is
acquired before receipt lookup so concurrent retries cannot mutate then collide. Mission retries verify stored
mission semantics and durable MISSION_CREATED evidence. Existing mission rows with
missing/conflicting evidence remain UNKNOWN; no historical evidence is invented.
Internal processor creation also uses one transaction for mission and event and
checks the writer's error result. After-commit delivery remains the existing
best-effort handler path; external effects and restart delivery are not certified.
An ambiguous commit is UNKNOWN until scoped receipt/evidence reconciliation.

## Required isolated proof

Re-run the original twelve HTTP probes with strict original-byte middleware,
asserting 401/403 or defined closed-contract denial, zero changed rows/events/
receipts, no cross-tenant writes and no downstream effects. Exercise actual narrow
customer/mission grants separately from the existing object fixtures. Prove
authorized insert/update/create, unrelated identity denial, revoked/expired grant,
scope/payload/operation/signature tampering, identical/concurrent retries, logical
ID conflicts, SQL/event/mirror/receipt rollback, post-commit dispatch, scoped receipt
read after revocation, and persisted mission evidence recovery.

The full gate remains mandatory at a clean recorded SHA. Passing this bounded
contract cannot certify the remaining writers, a production owner or FYD reload.
Production exposure remains UNKNOWN until verified endpoint/provenance and
upstream authentication/network boundaries are established read-only.
