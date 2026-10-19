'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { isDeepStrictEqual } = require('node:util');
const C = require('./commissioning_contract');

async function transaction(registry, action) {
  C.requireThat(registry._commissioningPool, 'commissioning_unconfigured');
  const client = await registry._commissioningPool.connect();
  const started = performance.now();
  let broken = false, committing = false;
  const onClientError = () => { broken = true; };
  client.on('error', onClientError);
  const bounded = {query: async (...args) => {
    const remaining = Math.floor(registry._commissioningTransactionMs - (performance.now() - started));
    C.requireThat(remaining > 0, 'commissioning_transaction_timeout');
    // Server-side waits and idle transactions are bounded as well as the next
    // application query. FOR SHARE must conflict with ordinary revocation UPDATEs.
    await client.query(`SELECT set_config('statement_timeout',$1,true),
      set_config('lock_timeout',$1,true),set_config('idle_in_transaction_session_timeout',$1,true)`, [remaining+'ms']);
    return client.query(...args);
  }};
  try {
    await client.query('BEGIN');
    const value = await action(bounded);
    committing = true;
    await bounded.query('COMMIT');
    return value;
  } catch (e) {
    if(committing) { broken=true; C.deny('admission_outcome_unknown'); }
    let timer;
    try {
      const ok=await Promise.race([client.query('ROLLBACK').then(()=>true,()=>false),
        new Promise(resolve=>{timer=setTimeout(()=>resolve(false),1000);})]);
      if(!ok) broken=true;
    } finally { if(timer) clearTimeout(timer); }
    throw e;
  }
  finally {
    client.removeListener('error',onClientError);
    try { client.release(broken); } catch (_) { console.error('[Commissioning] Transaction client release failed'); }
  }
}
async function lockBinding(client, bindingId, mode='update') {
  const r = await client.query('SELECT * FROM tenant_owner_bindings WHERE binding_id=$1 '+(mode==='share'?'FOR SHARE':'FOR UPDATE'), [bindingId]);
  C.requireThat(r.rows.length === 1 && r.rows[0].status === 'active', 'owner_binding_invalid');
  return r.rows[0];
}
async function lockGrant(registry, client, grantId, tenantId, admission=false) {
  // All admission/revocation commands use owner -> grant lock order.
  const pointer = await client.query('SELECT owner_binding_id FROM tenant_commissioning_grants WHERE grant_id=$1 AND ($2::text IS NULL OR tenant_id=$2)', [grantId,tenantId||null]);
  C.requireThat(pointer.rows.length === 1, 'admission_denied');
  const mode=admission?registry._commissioningAdmissionLock:'update';
  const binding = await lockBinding(client, pointer.rows[0].owner_binding_id,mode);
  const r = await client.query('SELECT * FROM tenant_commissioning_grants WHERE grant_id=$1 '+(mode==='share'?'FOR SHARE':'FOR UPDATE'), [grantId]);
  const grant = r.rows[0];
  C.requireThat(grant && grant.owner_binding_id === binding.binding_id && grant.owner_binding_revision === binding.revision, 'admission_denied');
  C.activeIssuer(registry._commissioningTrust, grant.issuer_id);
  C.activeIssuer(registry._commissioningTrust, binding.issuer_id);
  return { binding, grant };
}
async function evidence(trust, resolver, digest) {
  C.requireThat(/^[a-f0-9]{64}$/.test(digest || '') && typeof trust?.[resolver] === 'function', 'missing_verified_evidence');
  const record = await trust[resolver](digest);
  C.requireThat(record && record.verified === true && record.digest === digest, 'missing_verified_evidence');
  return record;
}

async function executeLockedGrant(registry,actorId,submission,writeEvent) {
  const {intent,payload,metadata={},signature}=submission;
  const operationDigest = C.digest(C.bytes(intent));
  return transaction(registry, async client => {
    const { grant } = await lockGrant(registry, client, intent.grant_id, intent.tenant_id, true);
    C.requireThat(grant.status === 'active' && grant.revision === intent.grant_revision &&
      C.SCOPE.every(k=>grant[k]===intent[k]) && grant.delegated_actor===actorId &&
      grant.authorized_signer===intent.authorized_signer && grant.purpose===intent.purpose &&
      grant.operations.includes(intent.operation), 'admission_denied');
    C.verify(grant.signer_public_key, signature, C.bytes(intent));
    if(intent.operation==='OBJECT_UPDATED'){
      const owners=await client.query("SELECT DISTINCT payload->>'controller' AS controller FROM ping_events WHERE tenant_id=$1 AND event_type='OBJECT_CREATED' AND payload->>'object_id'=$2",[intent.tenant_id,intent.resource_id]);
      C.requireThat(owners.rows.length===1&&owners.rows[0].controller===intent.controller_id,'object_control_unproven');
    }
    // Compatible grant locks permit concurrency. Serialize the logical
    // request BEFORE receipt lookup and before any callback mutation.
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',
      ['commissioning-logical-operation',JSON.stringify([intent.tenant_id,actorId,intent.logical_operation_id])]);
    // clock_timestamp() is evaluated after owner, grant and logical-operation lock acquisition, not at transaction start.
    const now = (await client.query('SELECT clock_timestamp() AS now')).rows[0].now.getTime();
    C.requireThat(new Date(grant.valid_from).getTime()<=now && now<new Date(grant.expires_at).getTime(), 'admission_denied');
    const params = [intent.tenant_id,actorId,intent.logical_operation_id];
    const prior = await client.query('SELECT operation_digest,receipt FROM tenant_admission_receipts WHERE tenant_id=$1 AND actor_id=$2 AND logical_operation_id=$3',params);
    if (prior.rows.length) {
      C.requireThat(prior.rows[0].operation_digest===operationDigest, 'idempotency_conflict');
      return {receipt:prior.rows[0].receipt,duplicate:true,commandResult:prior.rows[0].receipt.command_result};
    }
    let result;
    if(intent.operation==='OBJECT_CREATED') {
      // ping_objects has a global object_id key. Tenant-local locking alone
      // would let two tenants poison that same projection identity. Reuse the
      // existing transactional advisory-lock pattern, backed by the journal's
      // partial UNIQUE index (which also protects uncovered direct writers).
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',
        ['ping-object-create',intent.resource_id]);
      const existing=await client.query(`SELECT e.*,r.receipt AS creation_receipt
        FROM ping_events e LEFT JOIN tenant_admission_receipts r
          ON r.event_id=e.event_id AND r.operation_digest=e.metadata->'commissioning'->>'operation_digest'
        WHERE e.event_type='OBJECT_CREATED' AND e.payload->>'object_id'=$1`,[intent.resource_id]);
      if(existing.rows.length) {
        const original=existing.rows[0],receipt=original.creation_receipt;
        // A new logical request can observe the identical original creation,
        // but cannot reinterpret its tenant, controller, grant or provenance.
        // A renewed/different grant must update, never re-create the object.
        C.requireThat(existing.rows.length===1 && receipt &&
          C.INTENT.filter(k=>k!=='logical_operation_id').every(k=>receipt[k]===intent[k]) &&
          original.tenant_id===intent.tenant_id && C.payloadDigest(original.payload,metadata)===intent.payload_digest,
          'object_creation_conflict');
        result={status:'ok',eventId:original.event_id,event:original,inserted:false};
      }
    }
    if(!result)result=await writeEvent(client, {intent,payload,metadata,operationDigest});
    C.requireThat(result.error!=='object_creation_conflict','object_creation_conflict');
    C.requireThat(result.status==='ok', 'event_persistence_failed');
    if(C.COMMAND_OPERATIONS.has(intent.operation)) {
      const key=intent.operation==='CUSTOMER_UPSERT'?'customer_id':'mission_id';
      const expected=intent.operation==='CUSTOMER_UPSERT'?payload.customer.customer_id:require('../orchestration/mission_runtime').MissionRuntime.missionIdFor(intent.tenant_id,payload.missionType,payload.payload);
      C.requireThat(result.commandResult && Object.keys(result.commandResult).length===1 && result.commandResult[key]===expected,'invalid_command_result');
      const persisted=await client.query('SELECT event_id,event_type,source,tenant_id,payload FROM ping_events WHERE event_id=$1',[result.eventId]);
      const event=persisted.rows[0];
      const customer=intent.operation==='CUSTOMER_UPSERT';
      const expectedPayload=customer?{customer_id:payload.customer.customer_id,display_name:payload.customer.display_name||null,email:payload.customer.email||null,command:payload}:
        {missionId:expected,missionType:payload.missionType,payload:payload.payload,priority:payload.priority};
      C.requireThat(persisted.rows.length===1 && event.tenant_id===intent.tenant_id &&
        event.source===(customer?'customer-authority':'mission-runtime') &&
        (customer?['CUSTOMER_CREATED','CUSTOMER_UPDATED'].includes(event.event_type):event.event_type==='MISSION_CREATED') &&
        isDeepStrictEqual(event.payload,expectedPayload),'event_persistence_failed');
    }
    const decisionAt = new Date(now).toISOString();
    const receipt = { schema:'commissioning-admission-receipt@2', ...intent, operation_digest:operationDigest,
      authorization_decision_at:decisionAt, event_id:result.eventId,
      ...(C.COMMAND_OPERATIONS.has(intent.operation)?{command_result:result.commandResult}:{}),
      ...(result.compatibilityEventId?{compatibility_event_id:result.compatibilityEventId}:{}) };
    const stored = await client.query(`INSERT INTO tenant_admission_receipts
      (tenant_id,actor_id,logical_operation_id,operation_digest,grant_id,grant_revision,event_id,receipt,authorization_decision_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(tenant_id,actor_id,logical_operation_id) DO NOTHING RETURNING receipt`,
    [...params,operationDigest,intent.grant_id,intent.grant_revision,result.eventId,JSON.stringify(receipt),decisionAt]);
    // A conflict after this lock cannot be a legitimate concurrent retry.
    // Roll back callback effects rather than commit behind another receipt.
    C.requireThat(stored.rows.length===1,'idempotency_conflict');
    C.requireThat(isDeepStrictEqual(stored.rows[0].receipt,receipt),'receipt_persistence_failed');
    return {receipt:stored.rows[0].receipt,duplicate:false,event:result.event,inserted:result.inserted,commandResult:result.commandResult};
  });
}

module.exports = {
  async initializeCommissioning() {
    C.requireThat(this._commissioningPool && this._commissioningTrust, 'commissioning_unconfigured');
    await this._commissioningPool.query(fs.readFileSync(path.join(__dirname, 'commissioning_schema.sql'), 'utf8'));
  },

  async executeBindVerifiedOwner(context, command) {
    command = structuredClone(command);
    const issuerId = await C.issuer(this._commissioningTrust, context, 'bind_owner', command);
    const b = command.body;
    C.requireThat(C.text(b.tenant_id) && C.text(b.controller_id), 'invalid_scope');
    const identity = await evidence(this._commissioningTrust, 'resolveVerifiedOidcEvidence', b.identity_evidence_digest);
    const business = await evidence(this._commissioningTrust, 'resolveIndependentBusinessEvidence', b.business_evidence_digest);
    C.requireThat(C.text(identity.issuer) && C.text(identity.subject) && C.text(identity.actor_id), 'invalid_owner_identity');
    C.requireThat(this._commissioningTrust.allowedOidcIssuers?.has(identity.issuer), 'invalid_oidc_issuer');
    C.requireThat(business.method === 'independent-operator-check' && business.verified_by === issuerId &&
      business.owner_actor_id === identity.actor_id && business.tenant_id === b.tenant_id &&
      business.controller_id === b.controller_id, 'business_owner_unverified');
    const bindingId = C.id('owner-binding', { issuerId, ...b, owner_actor_id: identity.actor_id, oidc_issuer: identity.issuer, oidc_subject: identity.subject });
    return transaction(this, async client => {
      const r = await client.query(`INSERT INTO tenant_owner_bindings
        (binding_id,tenant_id,controller_id,owner_actor_id,oidc_issuer,oidc_subject,issuer_id,
         identity_evidence_digest,business_evidence_digest,issuance)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(binding_id) DO NOTHING RETURNING *`,
      [bindingId,b.tenant_id,b.controller_id,identity.actor_id,identity.issuer,identity.subject,issuerId,
        b.identity_evidence_digest,b.business_evidence_digest,JSON.stringify(command)]);
      if (r.rows.length) return r.rows[0];
      return (await client.query('SELECT * FROM tenant_owner_bindings WHERE binding_id=$1', [bindingId])).rows[0];
    });
  },

  async executeIssueCommissioningGrant(context, command) {
    command = structuredClone(command);
    const issuerId = await C.issuer(this._commissioningTrust, context, 'issue_grant', command);
    const b = command.body;
    C.checkScope(b);
    C.requireThat(C.text(b.delegated_actor) && C.text(b.purpose), 'invalid_delegation');
    C.requireThat(Array.isArray(b.operations) && b.operations.length > 0 && b.operations.every(x => C.OPERATIONS.has(x)||C.COMMAND_OPERATIONS.has(x)), 'invalid_operation');
    C.requireThat(C.keyId(b.signer_public_key) === b.authorized_signer, 'invalid_signer');
    const consent = await evidence(this._commissioningTrust, 'resolveCommissioningConsentEvidence', b.consent_evidence_digest);
    // Consent is a server-resolved immutable record, not caller prose or a checkbox.
    const scope = Object.fromEntries([...C.SCOPE,'delegated_actor','authorized_signer','operations','purpose','valid_from','expires_at'].map(k=>[k,b[k]]));
    C.requireThat(C.digest(C.bytes(scope)) === consent.scope_digest && consent.owner_binding_id === b.owner_binding_id, 'consent_scope_mismatch');
    const grantId = C.id('commissioning-grant', { issuerId, ...b });
    return transaction(this, async client => {
      const owner = await lockBinding(client, b.owner_binding_id);
      C.requireThat(owner.tenant_id === b.tenant_id && owner.controller_id === b.controller_id &&
        owner.owner_actor_id === consent.owner_actor_id && owner.revision === b.owner_binding_revision, 'owner_binding_invalid');
      C.activeIssuer(this._commissioningTrust, owner.issuer_id);
      const now = (await client.query('SELECT clock_timestamp() AS now')).rows[0].now;
      C.requireThat(Number.isFinite(Date.parse(b.valid_from)) && Date.parse(b.expires_at) > now.getTime() &&
        Date.parse(b.expires_at)>Date.parse(b.valid_from), 'invalid_validity');
      const r = await client.query(`INSERT INTO tenant_commissioning_grants
        (grant_id,owner_binding_id,owner_binding_revision,issuer_id,tenant_id,controller_id,commissioning_project_id,
         site_id,resource_id,delegated_actor,authorized_signer,signer_public_key,operations,purpose,
         consent_evidence_digest,valid_from,expires_at,issuance)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
        ON CONFLICT(grant_id) DO NOTHING RETURNING *`,
      [grantId,b.owner_binding_id,b.owner_binding_revision,issuerId,...C.SCOPE.map(k=>b[k]),b.delegated_actor,
        b.authorized_signer,b.signer_public_key,b.operations,b.purpose,b.consent_evidence_digest,b.valid_from,b.expires_at,JSON.stringify(command)]);
      if (r.rows.length) return r.rows[0];
      return (await client.query('SELECT * FROM tenant_commissioning_grants WHERE grant_id=$1', [grantId])).rows[0];
    });
  },

  async executeRevokeCommissioningGrant(context, command) {
    const actorId = await C.actor(this._commissioningTrust, context);
    C.requireThat(command && C.text(command.grant_id) && /^[a-f0-9]{64}$/.test(command.reason_digest || ''), 'invalid_revocation');
    return transaction(this, async client => {
      const { binding, grant } = await lockGrant(this, client, command.grant_id);
      if (actorId !== binding.owner_actor_id) {
        await C.issuer(this._commissioningTrust, context, 'revoke_grant', command.issuer_command);
        C.requireThat(command.issuer_command.body.grant_id === command.grant_id &&
          command.issuer_command.body.reason_digest === command.reason_digest, 'invalid_revocation');
      }
      if (grant.status === 'revoked') return grant;
      return (await client.query(`UPDATE tenant_commissioning_grants SET status='revoked',revision=revision+1,
        revoked_at=clock_timestamp(),revoked_by=$2,revocation_reason_digest=$3 WHERE grant_id=$1 RETURNING *`,
      [grant.grant_id,actorId,command.reason_digest])).rows[0];
    });
  },

  async executeRevokeOwnerBinding(context, command) {
    const actorId = await C.actor(this._commissioningTrust, context);
    return transaction(this, async client => {
      const binding = await lockBinding(client, command.binding_id);
      if (actorId !== binding.owner_actor_id) {
        await C.issuer(this._commissioningTrust, context, 'revoke_owner', command.issuer_command);
        C.requireThat(command.issuer_command.body.binding_id === command.binding_id, 'invalid_revocation');
      }
      return (await client.query("UPDATE tenant_owner_bindings SET status='revoked',revision=revision+1 WHERE binding_id=$1 RETURNING *", [binding.binding_id])).rows[0];
    });
  },

  async executeGetAdmissionReceipt(context, query) {
    const actorId = await C.actor(this._commissioningTrust, context);
    C.requireThat(this._commissioningPool, 'commissioning_unconfigured');
    C.requireThat(query && typeof query === 'object' && !Array.isArray(query), 'invalid_receipt_query');
    query = structuredClone(query);
    const fields = [...C.SCOPE, 'logical_operation_id', 'operation_digest'];
    C.requireThat(Object.keys(query).length === fields.length && fields.every(k => Object.hasOwn(query, k)), 'invalid_receipt_query');
    C.checkScope(query);
    C.requireThat(C.text(query.logical_operation_id) && typeof query.operation_digest === 'string' && /^[a-f0-9]{64}$/.test(query.operation_digest), 'invalid_receipt_query');
    // Read permission belongs to the original authenticated actor and accepted
    // scope, not to a currently active write grant. Never call the admission
    // command, mint a receipt, dispatch effects, or reinterpret the decision.
    const result = await this._commissioningPool.query(`SELECT receipt FROM tenant_admission_receipts
      WHERE tenant_id=$1 AND actor_id=$2 AND logical_operation_id=$3 AND operation_digest=$4
        AND receipt->>'controller_id'=$5 AND receipt->>'commissioning_project_id'=$6
        AND receipt->>'site_id'=$7 AND receipt->>'resource_id'=$8`,
    [query.tenant_id, actorId, query.logical_operation_id, query.operation_digest,
      query.controller_id, query.commissioning_project_id, query.site_id, query.resource_id]);
    // Absence is not proof of rejection: an interrupted/unknown request may
    // still need reconciliation. Do not authorize a retry or disclose another
    // actor's receipt when any part of the scope differs.
    if (!result.rows.length) return { status: 'UNKNOWN' };
    return { status: 'ACCEPTED', receipt: result.rows[0].receipt };
  },

  async executeWithCommissioningGrant(context, submission, writeEvent) {
    submission = structuredClone(submission);
    const actorId = await C.actor(this._commissioningTrust, context);
    const { intent, payload, metadata = {} } = submission;
    C.checkIntent(intent);
    C.requireThat(intent.authenticated_actor === actorId, 'admission_denied');
    C.requireThat(C.payloadDigest(payload,metadata) === intent.payload_digest, 'payload_digest_mismatch');
    C.requireThat((intent.operation==='OBJECT_CREATED'?payload?.controller:payload?.updated_by) === intent.controller_id && payload?.object_id === intent.resource_id &&
      C.SCOPE.every(k=>metadata.scope?.[k]===intent[k]), 'resource_scope_mismatch');
    const {isCanonicalSchema}=require('../../gateway/constitutional-dist/ping-vocabulary');
    const {computePayloadHash}=require('../../gateway/knowledge_ingest_adapter');
    if(intent.operation==='OBJECT_CREATED')C.requireThat(isCanonicalSchema(payload.schema)&&payload.content&&typeof payload.content==='object'&&!Array.isArray(payload.content),'unprojectable_object');
    else C.requireThat(payload.changes&&typeof payload.changes==='object'&&!Array.isArray(payload.changes),'unprojectable_object');
    C.requireThat(payload.payload_hash===computePayloadHash(payload),'invalid_payload_hash');
    // This first candidate admits object writes only; relationship endpoint ownership is a separate scope proof.
    C.requireThat(intent.operation !== 'RELATIONSHIP_CREATED', 'operation_not_implemented');
    return executeLockedGrant(this,actorId,submission,writeEvent);
  },
  async executeWithCommandGrant(context,submission,writeCommand) {
    submission=structuredClone(submission);
    const actorId=await C.actor(this._commissioningTrust,context);
    const {intent,payload,metadata={}}=submission;
    C.checkCommandIntent(intent);
    C.requireThat(intent.authenticated_actor===actorId,'admission_denied');
    C.checkCommandPayload(intent,payload,metadata);
    C.requireThat(C.payloadDigest(payload,metadata)===intent.payload_digest,'payload_digest_mismatch');
    return executeLockedGrant(this,actorId,submission,writeCommand);
  },
};
