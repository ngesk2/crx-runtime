# Trust Root — Operator Installation Guide

**Status:** the production admission boundary is fail-closed by absence until
this is installed. `gateway/server.js` boots `new GatewayRuntime()` with no
`commissioningTrust`; every admitted entrance (`POST /events`,
`/canonical-events`, `/ingest`, `POST /customers`, `POST /missions`) then
returns `503 commissioning_unconfigured` / `403` for everyone, legitimate or
not. This document is the operator-installable path to make admission admit
an entitled caller. It wires existing machinery only — no new authority is
invented here.

## 1. What the trust root is

A plain JavaScript object the operator constructs and hands to the gateway at
boot. It is the single plug point where PING meets the operator's existing
identity infrastructure (OIDC provider, operator directory, consent records).
The runtime never invents identities: `commissioning_contract.actor()` calls
`trust.resolveActor(context)` and requires `{ verified: true, actor_id }`.

## 2. The exact interface (all fields required for admission)

```js
const trust = {
  // Actor resolution. Receives the Express req (or internal context).
  // MUST return { actor_id: string, verified: true } for a positively
  // authenticated actor, or null. Never trust body fields.
  resolveActor: async (context) => { /* ... */ return null; },

  // Designated command issuers, installed by a trusted administrative
  // procedure — never from an HTTP body. Map: issuer_id ->
  // { actor_id, public_key (PEM Ed25519 SPKI), active: boolean }.
  // C.issuer() requires the resolved actor to EQUAL the issuer's actor_id
  // and verifies the Ed25519 signature over (action, issuer_id, body).
  issuers: new Map([
    ['owner-issuer-1', {
      actor_id: 'owner-alice',
      public_key: '-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n',
      active: true,
    }],
  ]),

  // OIDC issuers the operator accepts for owner-binding evidence.
  allowedOidcIssuers: new Set(['https://accounts.google.com']),

  // Evidence resolvers, keyed by content digest. Each MUST return the
  // verified record (with .verified === true and .digest) or undefined.
  // These read the operator's existing systems — they are lookups, not
  // new databases.
  resolveVerifiedOidcEvidence: async (digest) => { /* OIDC id_token record */ },
  resolveIndependentBusinessEvidence: async (digest) => { /* independent-operator-check record */ },
  resolveCommissioningConsentEvidence: async (digest) => { /* consent record */ },
};
```

Reference implementation shape (synthetic, test-only): see
`test/commissioning_admission.test.js` and `test/admitted_commands.test.js`
— the `trust` object at the top of each file. Those harnesses are the
executable specification of this interface.

## 3. Wiring it into the gateway

`GatewayRuntime` already accepts the trust root; only the boot call is
missing it:

```js
// gateway/server.js (operator edit)
const { GatewayRuntime } = require('./bootstrap/gateway_runtime');
const trust = require('./operator/trust_root'); // operator-owned module
const runtime = new GatewayRuntime(/* pool or null */, { commissioningTrust: trust });
```

Notes:

- `_initializeAdmissionRegistry` additionally requires the journal pool and
  the tenant-registry storage to be the SAME physical Postgres
  (database/address/port/cluster/server_start/registry OID all equal,
  primary, read-write). Point both at one database or admission stays
  closed with `commissioning_unconfigured` in the logs.
- `TenantRegistry` must be constructed with
  `{ commissioningPool, commissioningTrust }`; the gateway does this
  internally once the trust object is passed.
- Until a valid trust object is installed, every admitted entrance fails
  closed. That is the safe default — do not work around it.

## 4. The owner-binding → grant ceremony (per tenant, operator-run)

Admission does not come from the trust root alone; each tenant needs a
verified owner binding and a commissioning grant. Run once per tenant via an
operator script against `TenantRegistry` (see
`test/mission_atomicity.test.js::createAdmittedFixture` for the exact call
sequence):

1. **Register the tenant**: `registry.executeRegisterTenant({ tenantId, name })`.
2. **Bind the verified owner**: `registry.executeBindVerifiedOwner(operatorContext,
   signed('bind_owner', { tenant_id, controller_id, identity_evidence_digest,
   business_evidence_digest }))`.
   - `identity_evidence_digest` = digest of a record your
     `resolveVerifiedOidcEvidence` returns (issuer in `allowedOidcIssuers`,
     subject matching the owner, `verified: true`).
   - `business_evidence_digest` = digest of a record your
     `resolveIndependentBusinessEvidence` returns
     (`method: 'independent-operator-check'`, `verified_by` the issuer,
     `owner_actor_id`, `tenant_id`, `controller_id`).
   - `signed(action, body)` = `{ issuer_id, body, signature:
     Ed25519_sign(bytes({ action, issuer_id, body })) }` with the issuer's
     private key.
3. **Issue the commissioning grant**:
   `registry.executeIssueCommissioningGrant(operatorContext,
   signed('issue_grant', { ...scope, owner_binding_id,
   owner_binding_revision, signer_public_key (PEM), consent_evidence_digest }))`.
   - `scope` = `{ tenant_id, controller_id, commissioning_project_id,
     site_id, resource_id, delegated_actor, authorized_signer:
     C.keyId(signerPem), operations: ['CUSTOMER_UPSERT' | 'MISSION_CREATE' |
     'OBJECT_CREATED' | 'OBJECT_UPDATED'], purpose, valid_from, expires_at }`.
     `resource_id` is exact: `customer://{tenant}/{customer_id}` or
     `mission://{tenant}/{mission_id}`.
   - `consent_evidence_digest` = digest of a record your
     `resolveCommissioningConsentEvidence` returns (`owner_binding_id`,
     `owner_actor_id`, `scope_digest: C.digest(C.bytes(scope))`).
4. **Hand the signer private key to the entitled caller** (the delegated
   actor). The caller builds submissions as `{ intent, payload, metadata,
   signature }` where `signature = Ed25519_sign(C.bytes(intent))` and the
   intent carries the grant reference (`grant_id`, `grant_revision`,
   `authenticated_actor`, `authorized_signer`, `operation`,
   `logical_operation_id`, `payload_digest`, all 5 scope fields).

At admission time `executeLockedGrant` re-verifies everything inside one
transaction: owner→grant lock order, grant active + revision current, all 5
scope fields equal, `delegated_actor === actorId`, signer/purpose match,
operation in `grant.operations`, DB-clock validity window, Ed25519 signature
over the canonical intent bytes, and idempotency via
`tenant_admission_receipts`. Any failure rolls back the whole mutation —
business SQL, event append, and receipt together.

## 5. HTTP-layer credential provisioning (exterior agents)

The admitted command entrances (`POST /customers`, `POST /missions`) speak
the commissioning wire protocol above. The HPP business routes
(`/reviews`, `/projects`, `/knowledge`) and Mission Control cards
(`/api/v1/missions`) instead use the exterior API-key boundary:

1. Insert the agent credential:
   `INSERT INTO exterior_agent_credentials (api_key, agent_id, agent_name)
   VALUES ($1, $2, $3)`.
2. Bind its tenant allow-list (P2, 2026-10-11) — either column:
   `UPDATE exterior_agent_credentials SET tenant_allowlist = '{tenant-a,tenant-b}'
   WHERE agent_id = $1`,
   or environment (read at gateway boot):
   `EXTERIOR_TENANT_ALLOWLIST='{"agent-id":["tenant-a","tenant-b"]}'`.
   The entry `'*'` grants all tenants; it is an explicit operator grant,
   never a default. An empty/unset allow-list fails closed
   (`403 tenant_scope_unconfigured`) — a valid key alone authorizes nothing.
3. Knowledge-graph namespaces are the scope there: bind the namespaces the
   agent may write (`tenant::acme`, `core::system`, …).

## 6. Verification checklist (operator)

- `POST /events` with no trust root → `503 commissioning_unconfigured`.
- After installing the trust root + binding + grant: a correctly signed
  `CUSTOMER_UPSERT` / `MISSION_CREATE` submission → `201` with an admission
  receipt; the receipt round-trips via `POST /events/receipt`.
- Same logical operation retried → the ORIGINAL receipt, no duplicate
  mutation. Same logical ID with different bytes → `idempotency_conflict`.
- Wrong signature / unknown issuer / expired grant / revoked binding →
  `403`, zero business rows, zero events, zero receipts.
- `POST /reviews/sync` with a valid key but a tenant outside the agent's
  allow-list → `403 tenant_not_authorized`, zero side effects.

## 7. What this does NOT do

- It does not create a new authority. Every check above already exists in
  `commissioning_contract.js` / `commissioning_commands.js`; this document
  only tells the operator what to install so those checks have something
  real to check against.
- It does not certify the live Oracle path. Disposable-Postgres proofs do
  not transfer; see the P0 directive's live-mutation restriction.
- FYD real-owner entitlement (P5) needs the same ceremony pointed at a real
  OIDC provider and real business-evidence source — the interface is ready,
  the operator bindings are not.
