'use strict';
// P0 commissioning signature-binding regression tests.
// Verifies the executeLockedGrant signature binding end-to-end on disposable
// PostgreSQL: valid signed admission succeeds; missing/invalid signature and
// mismatched canonical payload reject with zero writes; authorization denial
// creates no admitted transition; a successful response corresponds to durable
// acceptance (receipt row + journal row both present).
//
// RUN STANDALONE: this file resets the disposable schema in its own before()
// hook. Do NOT run in the same `node --test` invocation as
// test/commissioning_admission.test.js (both reset the schema).
//
//   NODE_PATH=/tmp/sigfix/node_modules node --test test/commissioning_signature_regression.test.js
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const {Pool}=require('pg');
const {TenantRegistry}=require('../ping-runtime/runtime/tenant_registry');
const {UnifiedEventRuntime}=require('../ping-runtime/events/unified_event_runtime');
const C=require('../ping-runtime/runtime/commissioning_contract');

// Synthetic test-only authority; NEVER an HPP grant.
const root=path.resolve(__dirname,'..');
const config=JSON.parse(fs.readFileSync(path.join(root,'.test-database.json'),'utf8'));
assert.equal(config.database,'admission_proof');assert.equal(config.host,'127.0.0.1');
const pool=new Pool(config);
const issuerKeys=crypto.generateKeyPairSync('ed25519');
const signerKeys=crypto.generateKeyPairSync('ed25519');
const otherKeys=crypto.generateKeyPairSync('ed25519');
const pem=k=>k.publicKey.export({format:'pem',type:'spki'}).toString();
const contexts=new WeakMap();
function context(actorId){const c={};contexts.set(c,{actor_id:actorId,verified:true});return c;}
const admin=context('synthetic-operator'), agent=context('synthetic-agent');
const records=new Map();
const trust={issuers:new Map([['synthetic-designated-issuer',{actor_id:'synthetic-operator',public_key:pem(issuerKeys),active:true}]]),
  allowedOidcIssuers:new Set(['https://synthetic-oidc.invalid']),resolveActor:async c=>contexts.get(c)||null,
  resolveVerifiedOidcEvidence:async d=>records.get(d),resolveIndependentBusinessEvidence:async d=>records.get(d),
  resolveCommissioningConsentEvidence:async d=>records.get(d)};
const registry=new TenantRegistry(pool,{commissioningPool:pool,commissioningTrust:trust});
const runtime=new UnifiedEventRuntime({pool,requireCommissioningForObjectWrites:true,eventValidator:{isRegistered:x=>['OBJECT_CREATED','OBJECT_UPDATED'].includes(x)}});
let n=0;
function record(value){const digest=C.digest(C.bytes(value));records.set(digest,{...value,digest,verified:true});return digest;}
function signed(action,body,keys=issuerKeys,issuerId='synthetic-designated-issuer'){
 return {issuer_id:issuerId,body,signature:crypto.sign(null,C.bytes({action,issuer_id:issuerId,body}),keys.privateKey).toString('base64')};
}
async function setup(suffix='t'+(++n)){
 const tenant='sigreg-'+suffix;
 await registry.executeRegisterTenant({tenantId:tenant,name:'Synthetic '+suffix});
 const identity=record({issuer:'https://synthetic-oidc.invalid',subject:'test-owner-subject',actor_id:'synthetic-owner'});
 const business=record({method:'independent-operator-check',verified_by:'synthetic-designated-issuer',owner_actor_id:'synthetic-owner',tenant_id:tenant,controller_id:'controller-'+suffix});
 const bindingBody={tenant_id:tenant,controller_id:'controller-'+suffix,identity_evidence_digest:identity,business_evidence_digest:business};
 const binding=await registry.executeBindVerifiedOwner(admin,signed('bind_owner',bindingBody));
 const scope={tenant_id:tenant,controller_id:binding.controller_id,commissioning_project_id:'commission-'+suffix,
  site_id:'site-'+suffix,resource_id:'object-'+suffix,delegated_actor:'synthetic-agent',authorized_signer:C.keyId(pem(signerKeys)),
  operations:['OBJECT_CREATED','OBJECT_UPDATED'],purpose:'sigreg-test',valid_from:new Date(Date.now()-60000).toISOString(),expires_at:new Date(Date.now()+3600000).toISOString()};
 const consent=record({owner_binding_id:binding.binding_id,owner_actor_id:'synthetic-owner',scope_digest:C.digest(C.bytes(scope))});
 const body={...scope,owner_binding_id:binding.binding_id,owner_binding_revision:binding.revision,signer_public_key:pem(signerKeys),consent_evidence_digest:consent};
 const grant=await registry.executeIssueCommissioningGrant(admin,signed('issue_grant',body));
 return {grant,grantBody:body};
}
function submission(f,changes={},keys=signerKeys){
 const scope=Object.fromEntries(C.SCOPE.map(k=>[k,f.grant[k]]));
 const payload={schema:'ping.knowledge.business@1',object_id:scope.resource_id,controller:scope.controller_id,content:{name:'Synthetic evidence-backed object',claim_basis:'website_statement'}};
 const metadata={scope,provenance:{source_url:'https://synthetic.invalid/source',source_type:'website',observed_at:'2026-10-10T00:00:00Z'}};
 const intent={protocol_version:C.PROTOCOL,authenticated_actor:'synthetic-agent',authorized_signer:f.grant.authorized_signer,grant_id:f.grant.grant_id,
  grant_revision:f.grant.revision,...scope,operation:'OBJECT_CREATED',purpose:'sigreg-test',payload_digest:'',logical_operation_id:'sigreg-operation-1',...changes};
 for(const k of C.SCOPE)metadata.scope[k]=intent[k];
 payload.controller=intent.controller_id;payload.object_id=intent.resource_id;
 payload.payload_hash=require('../gateway/knowledge_ingest_adapter').computePayloadHash(payload);
 intent.payload_digest=C.payloadDigest(payload,metadata);
 return {intent,payload,metadata,signature:crypto.sign(null,C.bytes(intent),keys.privateKey).toString('base64')};
}
async function counts(){const r=await pool.query('SELECT (SELECT count(*)::int FROM ping_events) AS events,(SELECT count(*)::int FROM tenant_admission_receipts) AS receipts');return {...r.rows[0]};}
async function denied(action){const before=await counts();await assert.rejects(action);assert.deepEqual(await counts(),before);}

before(async()=>{
 assert.equal((await pool.query('SHOW cluster_name')).rows[0].cluster_name,'ping-admission-proof-20261010','Refuse schema reset without the dedicated test-cluster marker');
 await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
 await pool.query('CREATE TABLE tenant_registry(tenant_id VARCHAR(64) PRIMARY KEY,name TEXT,domains TEXT[],health_endpoint TEXT,metrics_endpoint TEXT,logs_endpoint TEXT,traces_endpoint TEXT,events_endpoint TEXT,capabilities TEXT[],metadata JSONB,updated_at TIMESTAMPTZ)');
 await runtime.initialize();await registry.initializeCommissioning();
 await pool.query('ALTER TABLE ping_events ADD COLUMN sequence BIGSERIAL');
});
after(async()=>{await pool.end();});

// (i) valid signed admission succeeds: executes executeLockedGrant through the
// real admission path. A missing signature binding would throw
// ReferenceError here instead of returning a receipt.
test('(i) valid signed admission succeeds through the patched executeLockedGrant',async()=>{
 const f=await setup();
 const s=submission(f);
 const result=await runtime.admitCommissionedEvent(registry,agent,s);
 assert.equal(result.duplicate,false);
 assert.ok(result.receipt && typeof result.receipt.event_id==='string');
 assert.equal(result.receipt.operation_digest,C.digest(C.bytes(s.intent)));
});

// (ii) missing signature rejects: submission.signature deleted. C.verify must
// fail closed with invalid_signature, not ReferenceError, and write nothing.
test('(ii) missing signature rejects with zero writes',async()=>{
 const f=await setup();const s=submission(f);delete s.signature;
 await denied(()=>runtime.admitCommissionedEvent(registry,agent,s));
});

// (iii) invalid signature rejects with zero writes.
test('(iii) invalid signature rejects with zero writes',async()=>{
 const f=await setup();const s=submission(f);s.signature='garbage';
 await denied(()=>runtime.admitCommissionedEvent(registry,agent,s));
 const t=submission(f,{},otherKeys); // well-formed but wrong signer
 await denied(()=>runtime.admitCommissionedEvent(registry,agent,t));
});

// (iv) mismatched canonical payload rejects: tamper after signing without
// re-signing, so signature no longer covers the canonical bytes.
test('(iv) mismatched canonical payload rejects with zero writes',async()=>{
 const f=await setup();const s=submission(f);
 s.payload.content.name='tampered-after-signing';
 await denied(()=>runtime.admitCommissionedEvent(registry,agent,s));
});

// (v) authorization denial creates no admitted transition: expired grant.
test('(v) authorization denial (expired grant) creates no admitted transition',async()=>{
 const f=await setup();
 await pool.query("UPDATE tenant_commissioning_grants SET valid_from=clock_timestamp()-interval '2 hours',expires_at=clock_timestamp()-interval '1 hour' WHERE grant_id=$1",[f.grant.grant_id]);
 await denied(()=>runtime.admitCommissionedEvent(registry,agent,submission(f)));
});

// (vi) a successful response corresponds to durable acceptance: the receipt
// row AND the journal row are both present and agree on the event id.
test('(vi) successful response corresponds to durable acceptance (receipt + journal rows)',async()=>{
 const f=await setup();
 const result=await runtime.admitCommissionedEvent(registry,agent,submission(f));
 assert.equal(result.duplicate,false);
 const eventId=result.receipt.event_id;
 const receiptRows=await pool.query('SELECT receipt FROM tenant_admission_receipts WHERE event_id=$1',[eventId]);
 assert.equal(receiptRows.rows.length,1,'receipt row missing');
 assert.deepEqual(receiptRows.rows[0].receipt,result.receipt,'stored receipt differs from returned receipt');
 const journalRows=await pool.query('SELECT event_id,event_type,tenant_id FROM ping_events WHERE event_id=$1',[eventId]);
 assert.equal(journalRows.rows.length,1,'journal row missing');
 assert.equal(journalRows.rows[0].event_type,'OBJECT_CREATED');
 assert.equal(journalRows.rows[0].tenant_id,f.grant.tenant_id);
});
