'use strict';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const {Pool}=require('pg');
const {TenantRegistry}=require('../ping-runtime/runtime/tenant_registry');
const {UnifiedEventRuntime}=require('../ping-runtime/events/unified_event_runtime');
const C=require('../ping-runtime/runtime/commissioning_contract');

// Synthetic test-only authority and independently resolved receipts; NEVER an HPP grant.
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
const admin=context('synthetic-operator'), owner=context('synthetic-owner'), agent=context('synthetic-agent'), stranger=context('synthetic-stranger');
const records=new Map();
const trust={issuers:new Map([['synthetic-designated-issuer',{actor_id:'synthetic-operator',public_key:pem(issuerKeys),active:true}]]),
  allowedOidcIssuers:new Set(['https://synthetic-oidc.invalid']),resolveActor:async c=>contexts.get(c)||null,
  resolveVerifiedOidcEvidence:async d=>records.get(d),resolveIndependentBusinessEvidence:async d=>records.get(d),
  resolveCommissioningConsentEvidence:async d=>records.get(d)};
const registry=new TenantRegistry(pool,{commissioningPool:pool,commissioningTrust:trust});
const runtime=new UnifiedEventRuntime({pool,requireCommissioningForObjectWrites:true,eventValidator:{isRegistered:x=>['OBJECT_CREATED','OBJECT_UPDATED'].includes(x)}});
let derived=0;runtime.on('OBJECT_CREATED',async()=>{derived++;});
let n=0;
function record(value){const digest=C.digest(C.bytes(value));records.set(digest,{...value,digest,verified:true});return digest;}
function signed(action,body,keys=issuerKeys,issuerId='synthetic-designated-issuer'){
 return {issuer_id:issuerId,body,signature:crypto.sign(null,C.bytes({action,issuer_id:issuerId,body}),keys.privateKey).toString('base64')};
}
async function setup(suffix='t'+(++n),tenantRegistry=registry){
 const tenant='proof-'+suffix;
 await tenantRegistry.executeRegisterTenant({tenantId:tenant,name:'Synthetic '+suffix});
 const identity=record({issuer:'https://synthetic-oidc.invalid',subject:'test-owner-subject',actor_id:'synthetic-owner'});
 const business=record({method:'independent-operator-check',verified_by:'synthetic-designated-issuer',owner_actor_id:'synthetic-owner',tenant_id:tenant,controller_id:'controller-'+suffix});
 const bindingBody={tenant_id:tenant,controller_id:'controller-'+suffix,identity_evidence_digest:identity,business_evidence_digest:business};
 const binding=await tenantRegistry.executeBindVerifiedOwner(admin,signed('bind_owner',bindingBody));
 const scope={tenant_id:tenant,controller_id:binding.controller_id,commissioning_project_id:'commission-'+suffix,
  site_id:'site-'+suffix,resource_id:'object-'+suffix,delegated_actor:'synthetic-agent',authorized_signer:C.keyId(pem(signerKeys)),
  operations:['OBJECT_CREATED','OBJECT_UPDATED'],purpose:'harvest-test',valid_from:new Date(Date.now()-60000).toISOString(),expires_at:new Date(Date.now()+3600000).toISOString()};
 const consent=record({owner_binding_id:binding.binding_id,owner_actor_id:'synthetic-owner',scope_digest:C.digest(C.bytes(scope))});
 const body={...scope,owner_binding_id:binding.binding_id,owner_binding_revision:binding.revision,signer_public_key:pem(signerKeys),consent_evidence_digest:consent};
 const grant=await tenantRegistry.executeIssueCommissioningGrant(admin,signed('issue_grant',body));
 return {binding,bindingBody,grant,grantBody:body};
}
function submission(f,changes={},keys=signerKeys){
 const scope=Object.fromEntries(C.SCOPE.map(k=>[k,f.grant[k]]));
 const payload={schema:'ping.knowledge.business@1',object_id:scope.resource_id,controller:scope.controller_id,content:{name:'Synthetic evidence-backed object',claim_basis:'website_statement'}};
 const metadata={scope,provenance:{source_url:'https://synthetic.invalid/source',source_type:'website',observed_at:'2026-10-10T00:00:00Z'}};
 const intent={protocol_version:C.PROTOCOL,authenticated_actor:'synthetic-agent',authorized_signer:f.grant.authorized_signer,grant_id:f.grant.grant_id,
  grant_revision:f.grant.revision,...scope,operation:'OBJECT_CREATED',purpose:'harvest-test',payload_digest:'',logical_operation_id:'operation-1',...changes};
 // Wrong-scope vectors remain internally consistent and correctly signed:
 // rejection must come from the server-resolved grant, not an accidental payload mismatch.
 for(const k of C.SCOPE)metadata.scope[k]=intent[k];
 payload.controller=intent.controller_id;payload.object_id=intent.resource_id;
 payload.payload_hash=require('../gateway/knowledge_ingest_adapter').computePayloadHash(payload);
 intent.payload_digest=C.payloadDigest(payload,metadata);
 return {intent,payload,metadata,signature:crypto.sign(null,C.bytes(intent),keys.privateKey).toString('base64')};
}
async function counts(){const r=await pool.query('SELECT (SELECT count(*)::int FROM ping_events) AS events,(SELECT count(*)::int FROM tenant_admission_receipts) AS receipts');return {...r.rows[0],derived};}
function receiptQuery(s){return {...Object.fromEntries(C.SCOPE.map(k=>[k,s.intent[k]])),
 logical_operation_id:s.intent.logical_operation_id,operation_digest:C.digest(C.bytes(s.intent))};}
async function denied(action){const before=await counts();await assert.rejects(action);assert.deepEqual(await counts(),before);}
function resign(s){
 s.intent.payload_digest=C.payloadDigest(s.payload,s.metadata);
 s.signature=crypto.sign(null,C.bytes(s.intent),signerKeys.privateKey).toString('base64');
 return s;
}
function updateSubmission(f,changes={name:'Corrected supported name'}){
 const s=submission(f,{operation:'OBJECT_UPDATED',logical_operation_id:'update-1'});
 s.payload={object_id:f.grant.resource_id,updated_by:f.grant.controller_id,changes};
 s.payload.payload_hash=require('../gateway/knowledge_ingest_adapter').computePayloadHash(s.payload);
 return resign(s);
}
async function resourceGrant(f,overrides={}){
 const body={...f.grantBody,...overrides};
 const scope=Object.fromEntries([...C.SCOPE,'delegated_actor','authorized_signer','operations','purpose','valid_from','expires_at'].map(k=>[k,body[k]]));
 body.consent_evidence_digest=record({owner_binding_id:f.binding.binding_id,owner_actor_id:'synthetic-owner',scope_digest:C.digest(C.bytes(scope))});
 return {...f,grant:await registry.executeIssueCommissioningGrant(admin,signed('issue_grant',body))};
}
function changedCreation(f,operation,name){
 const s=submission(f,{logical_operation_id:operation,purpose:f.grant.purpose});
 s.payload.content.name=name;
 s.payload.payload_hash=require('../gateway/knowledge_ingest_adapter').computePayloadHash(s.payload);
 return resign(s);
}
async function waitingOn(client){
 const pid=(await client.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
 for(let i=0;i<100;i++){
  const r=await pool.query("SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock' AND $1=ANY(pg_blocking_pids(pid))",[pid]);
  if(r.rows[0].n>0)return;
  await new Promise(r=>setTimeout(r,10));
 }
 assert.fail('Expected a real PostgreSQL lock wait');
}
before(async()=>{
 // Only the disposable database is reset. No production schema/data is touched.
 assert.equal((await pool.query('SHOW cluster_name')).rows[0].cluster_name,'ping-admission-proof-20261010','Refuse schema reset without the dedicated test-cluster marker');
 await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
 await pool.query('CREATE TABLE tenant_registry(tenant_id VARCHAR(64) PRIMARY KEY,name TEXT,domains TEXT[],health_endpoint TEXT,metrics_endpoint TEXT,logs_endpoint TEXT,traces_endpoint TEXT,events_endpoint TEXT,capabilities TEXT[],metadata JSONB,updated_at TIMESTAMPTZ)');
 await runtime.initialize();await registry.initializeCommissioning();
 // Acceptance ordering is provisioned only in this empty disposable journal;
 // production migration/startup ordering remains a separate held gap.
 await pool.query('ALTER TABLE ping_events ADD COLUMN sequence BIGSERIAL');
});
after(async()=>{await pool.end();});

// HTTP proof uses the actual bootstrap middleware/mount. Identity resolution is
// deliberately synthetic and server-side; no HPP entitlement is implied.
async function startAdmissionHttp(boundary={eventRuntime:runtime,tenantRegistry:registry}){
 const {GatewayRuntime}=require('../gateway/bootstrap/gateway_runtime');
 const {CanonicalEventEnvelope}=require('../gateway/canonical_event_envelope');
 const gateway=new GatewayRuntime(pool,{commissioningTrust:boundary.tenantRegistry?._commissioningTrust||null});
 if(boundary.tenantRegistry===registry)boundary={...boundary,tenantRegistry:await gateway._initializeAdmissionRegistry(pool)};
 gateway._app.use((req,res,next)=>{
  const identity={'Bearer synthetic-agent':agent,'Bearer synthetic-stranger':stranger}[req.get('authorization')];
  if(identity)contexts.set(req,contexts.get(identity));
  next();
 });
 const legacy=new CanonicalEventEnvelope(pool);await legacy.initialize();
 gateway._mountAdmissionRoutes({...boundary,unifiedEventRuntime:boundary.eventRuntime,canonicalEventEnvelope:legacy,eventReadAuthority:{},pool});
 const server=await new Promise(resolve=>{const s=gateway._app.listen(0,'127.0.0.1',()=>resolve(s));});
 return {server,url:'http://127.0.0.1:'+server.address().port};
}
async function postAdmission(http,route,body,authorization='Bearer synthetic-agent'){
 return fetch(http.url+route,{method:'POST',headers:{'Content-Type':'application/json',...(authorization?{authorization}:{})},
  body:typeof body==='string'?body:JSON.stringify(body)});
}
async function persistedSnapshot(){
 const names=(await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows;
 const rows={};for(const {tablename} of names){
  assert.match(tablename,/^[a-z_]+$/);
  rows[tablename]=(await pool.query(`SELECT row_to_json(t) AS row FROM "${tablename}" t ORDER BY row_to_json(t)::text`)).rows;
 }
 return {rows,derived};
}
async function closeHttp(http){await new Promise(resolve=>http.server.close(resolve));}

for(const entrance of ['/canonical-events','/events','/ingest']){
 test(entrance+' HTTP admission has zero-mutation authorization and byte-level denial proof',async()=>{
  const f=await setup(),http=await startAdmissionHttp();
  try{
   const s=submission(f),legacy={tenant_id:f.grant.tenant_id,event_type:'REVIEW_RECEIVED',source:'claimed-owner',actor:'synthetic-agent',payload:{id:'spoof'},
    aggregate_id:'spoof',aggregate_type:'review',event_data:{id:'spoof'},eventType:'REVIEW_RECEIVED'};
   const attempts=[['unauthenticated',s,null],['unrelated actor',s,'Bearer synthetic-stranger'],['legacy caller claims',legacy,null],
    ['missing entitlement',submission(f,{grant_id:'invented-grant'})],['wrong tenant',submission(f,{tenant_id:'other-business'})],
    ['wrong controller',submission(f,{controller_id:'other-controller'})],['wrong project',submission(f,{commissioning_project_id:'other-project'})],
    ['wrong site',submission(f,{site_id:'other-site'})],['wrong resource',submission(f,{resource_id:'other-object'})],
    ['wrong purpose',submission(f,{purpose:'other-purpose'})],['wrong digest',{...s,payload:{...s.payload,content:{name:'tampered'}}}],
    ['wrong signer',submission(f,{},otherKeys)],['duplicate JSON field',JSON.stringify(s).replace('"intent":{','"intent":{},"intent":{')]];
   for(const [label,body,auth] of attempts){
    const before=await persistedSnapshot(),res=await postAdmission(http,entrance,body,auth===undefined?'Bearer synthetic-agent':auth);
    assert.ok(res.status>=400&&res.status<500,label+': '+res.status+' '+await res.text());
    assert.deepEqual(await persistedSnapshot(),before,label);
   }
  }finally{await closeHttp(http);}
 });
 test(entrance+' HTTP authorized retry and recovery preserve one transition per operation',async()=>{
  const f=await setup(),s=submission(f),http=await startAdmissionHttp();
  try{
   const before=await counts();
   const first=await postAdmission(http,entrance,s);assert.equal(first.status,201,await first.clone().text());
   const accepted=await first.json();
   // All three aliases reach one decision and one event, never three journals.
   for(const alias of ['/canonical-events','/events','/ingest']){
    const retry=await postAdmission(http,alias,s);assert.equal(retry.status,201,await retry.clone().text());
    assert.deepEqual((await retry.json()).receipt,accepted.receipt);
   }
   const update=updateSubmission(f,{name:'Authorized HTTP correction'});
   const changed=await postAdmission(http,entrance,update);assert.equal(changed.status,201,await changed.clone().text());
   const updateReceipt=(await changed.json()).receipt;
   for(const alias of ['/canonical-events','/events','/ingest']){
    const retry=await postAdmission(http,alias,update);assert.equal(retry.status,201);
    assert.deepEqual((await retry.json()).receipt,updateReceipt);
   }
   assert.deepEqual(await counts(),{events:before.events+2,receipts:before.receipts+2,derived:before.derived+1});
   assert.equal((await pool.query('SELECT count(*)::int AS n FROM canonical_events')).rows[0].n,0);
   const {PingProjector}=require('../gateway/constitutional-dist/ping-projector');
   const db=await pool.connect();
   try{const projector=new PingProjector({db});await projector.initialize(fs.readFileSync(path.join(root,'database/ping_objects.sql'),'utf8'));await projector.rebuildAll();
    assert.equal((await db.query('SELECT count(*)::int AS n FROM ping_transitions WHERE object_id=$1',[f.grant.resource_id])).rows[0].n,2);
    assert.equal((await db.query('SELECT content FROM ping_objects WHERE object_id=$1',[f.grant.resource_id])).rows[0].content.name,'Authorized HTTP correction');
    const firstProjection=(await db.query('SELECT transition_id,object_id,operation,sequence,previous_transition,payload_hash FROM ping_transitions ORDER BY object_id,sequence')).rows;
    await projector.rebuildAll();assert.deepEqual((await db.query('SELECT transition_id,object_id,operation,sequence,previous_transition,payload_hash FROM ping_transitions ORDER BY object_id,sequence')).rows,firstProjection);
   }finally{db.release();}
   for(const target of ['grant','owner']){
    if(target==='grant')await registry.executeRevokeCommissioningGrant(owner,{grant_id:f.grant.grant_id,reason_digest:C.digest(Buffer.from('HTTP revoke'))});
    else await registry.executeRevokeOwnerBinding(owner,{binding_id:f.binding.binding_id});
    const beforeDenied=await persistedSnapshot();
    const denied=await postAdmission(http,entrance,submission(f,{logical_operation_id:'new-after-'+target}));assert.equal(denied.status,403);
    const read=await postAdmission(http,'/events/receipt',receiptQuery(s));assert.equal(read.status,200,await read.clone().text());
    assert.deepEqual(await read.json(),{status:'ACCEPTED',receipt:accepted.receipt});
    const strangerRead=await postAdmission(http,'/events/receipt',receiptQuery(s),'Bearer synthetic-stranger');
    assert.deepEqual(await strangerRead.json(),{status:'UNKNOWN'});
    assert.deepEqual(await persistedSnapshot(),beforeDenied);
   }
  }finally{await closeHttp(http);}
 });
}

test('HTTP missing authority or original bytes is closed before every writer',async()=>{
 const f=await setup(),s=submission(f);
 for(const boundary of [{},{eventRuntime:runtime,tenantRegistry:new TenantRegistry(pool)}]){
  const http=await startAdmissionHttp(boundary);
  try{for(const entrance of ['/canonical-events','/events','/ingest']){
   const before=await persistedSnapshot(),res=await postAdmission(http,entrance,s);assert.equal(res.status,503);
   assert.deepEqual(await persistedSnapshot(),before);
  }}finally{await closeHttp(http);}
 }
 const {commissionedWriteHandler}=require('../gateway/route_middleware');
 const handler=commissionedWriteHandler(runtime,registry),before=await persistedSnapshot();
 const response={status(code){this.code=code;return this;},json(body){this.body=body;}};
 await handler({body:s},response);assert.equal(response.code,400);assert.deepEqual(await persistedSnapshot(),before);
});

test('HTTP unadmitted processing mutations cannot change either event store',async()=>{
 const http=await startAdmissionHttp();
 try{for(const route of ['/canonical-events/00000000-0000-0000-0000-000000000000/processed',
  '/canonical-events/00000000-0000-0000-0000-000000000000/failed','/events/processed?tenant=proof-one','/events/failed?tenant=proof-one']){
  const before=await persistedSnapshot(),res=await postAdmission(http,route,{event_id:'invented',worker:'owner',error:'spoof'});
  assert.equal(res.status,403);assert.deepEqual(await persistedSnapshot(),before);
 }}finally{await closeHttp(http);}
});

test('shared object writer cannot disable admission through omitted or false options',async()=>{
 const before=await persistedSnapshot();
 for(const options of [{pool},{pool,requireCommissioningForObjectWrites:false}]){
  const raw=new UnifiedEventRuntime(options);
  for(const event of ['OBJECT_CREATED','OBJECT_UPDATED','RELATIONSHIP_CREATED']){
   assert.equal((await raw.emit(event,'claimed-owner',{object_id:'bypass'})).error,'commissioning_required');
  }
 }
 assert.deepEqual(await persistedSnapshot(),before);
});

test('bootstrap keeps admission closed across different physical tenant registries',async()=>{
 const {GatewayRuntime}=require('../gateway/bootstrap/gateway_runtime');
 await pool.query('CREATE SCHEMA admission_other_store; CREATE TABLE admission_other_store.tenant_registry(tenant_id TEXT PRIMARY KEY)');
 const otherPool=new Pool({...config,options:'-c search_path=admission_other_store'});
 try{
  const gateway=new GatewayRuntime(pool,{commissioningTrust:trust});
  const closed=await gateway._initializeAdmissionRegistry(otherPool);
  assert.equal(closed._commissioningPool,null);
  const f=await setup(),http=await startAdmissionHttp({eventRuntime:runtime,tenantRegistry:closed});
  const scopedBefore=await persistedSnapshot();
  try{for(const route of ['/events','/canonical-events','/ingest'])assert.equal((await postAdmission(http,route,submission(f))).status,503);}
  finally{await closeHttp(http);}
  assert.deepEqual(await persistedSnapshot(),scopedBefore);
  assert.equal((await otherPool.query('SELECT count(*)::int AS n FROM tenant_registry')).rows[0].n,0);
 }finally{await otherPool.end();await pool.query('DROP SCHEMA admission_other_store CASCADE');}
});

test('bootstrap missing storage-identity permission cannot enable admission',async()=>{
 const {GatewayRuntime}=require('../gateway/bootstrap/gateway_runtime');
 const gateway=new GatewayRuntime(pool,{commissioningTrust:trust}),before=await persistedSnapshot();
 const closed=await gateway._initializeAdmissionRegistry({query:async()=>{throw new Error('metadata permission unavailable');}});
 assert.equal(closed._commissioningPool,null);assert.equal(closed._commissioningTrust,null);
 assert.deepEqual(await persistedSnapshot(),before);
});

test('unconfigured default has no commissioning authority',async()=>{
 const unconfigured=new TenantRegistry(pool);
 await assert.rejects(()=>unconfigured.initializeCommissioning());
 await denied(()=>unconfigured.executeBindVerifiedOwner(admin,signed('bind_owner',{})));
});
test('forged issuer and forged authenticated context produce no owner binding',async()=>{
 const f=await setup();const count=(await pool.query('SELECT count(*)::int AS n FROM tenant_owner_bindings')).rows[0].n;
 await assert.rejects(()=>registry.executeBindVerifiedOwner(admin,signed('bind_owner',f.bindingBody,otherKeys)));
 await assert.rejects(()=>registry.executeBindVerifiedOwner({actor_id:'synthetic-operator',verified:true},signed('bind_owner',f.bindingBody)));
 await assert.rejects(()=>registry.executeBindVerifiedOwner(admin,signed('bind_owner',f.bindingBody,otherKeys,'forged-issuer')));
 assert.equal((await pool.query('SELECT count(*)::int AS n FROM tenant_owner_bindings')).rows[0].n,count);
});
test('OIDC login alone and caller attestation text confer no business ownership',async()=>{
 const f=await setup();
 await assert.rejects(()=>registry.executeBindVerifiedOwner(admin,signed('bind_owner',{...f.bindingBody,business_evidence_digest:C.digest(Buffer.from('invented owner label'))})));
 const forged=record({method:'caller-attestation',verified_by:'synthetic-designated-issuer',owner_actor_id:'synthetic-owner',tenant_id:f.binding.tenant_id,controller_id:f.binding.controller_id});
 await assert.rejects(()=>registry.executeBindVerifiedOwner(admin,signed('bind_owner',{...f.bindingBody,business_evidence_digest:forged})));
});
test('unauthorized delegation and mismatched consent are rejected',async()=>{
 const f=await setup();const command=signed('issue_grant',f.grantBody);
 await assert.rejects(()=>registry.executeIssueCommissioningGrant(agent,command));
 await assert.rejects(()=>registry.executeIssueCommissioningGrant(admin,signed('issue_grant',{...f.grantBody,site_id:'other-site'})));
});
for(const [name,changes,ctx,keys] of [
 ['missing grant',{grant_id:'absent'}],['wrong actor',{authenticated_actor:'synthetic-stranger'},stranger],
 ['wrong signer',{authorized_signer:C.keyId(pem(otherKeys))},agent,otherKeys],['wrong tenant',{tenant_id:'other-tenant'}],
 ['wrong controller',{controller_id:'other-controller'}],['wrong commissioning project',{commissioning_project_id:'other-commission'}],
 ['wrong site',{site_id:'other-site'}],['wrong resource',{resource_id:'other-object'}],['wrong purpose',{purpose:'publish'}],
 ['wrong operation',{operation:'WITNESS_CREATED'}],['stale revision',{grant_revision:2}],
 ])test(name+' has zero canonical/receipt/derived writes',async()=>{const f=await setup();await denied(()=>runtime.admitCommissionedEvent(registry,ctx||agent,submission(f,changes,keys||signerKeys)));});
test('tampered signed payload, altered outer scope, malformed signature fail closed',async()=>{
 const f=await setup();const s=submission(f);s.payload.content.name='tampered';await denied(()=>runtime.admitCommissionedEvent(registry,agent,s));
 const t=submission(f);t.metadata.scope.tenant_id='elsewhere';await denied(()=>runtime.admitCommissionedEvent(registry,agent,t));
 const u=submission(f);u.signature='garbage';await denied(()=>runtime.admitCommissionedEvent(registry,agent,u));
 const v=submission(f,{},otherKeys);await denied(()=>runtime.admitCommissionedEvent(registry,agent,v));
});
test('expired and not-yet-valid grants fail closed',async()=>{
 const f=await setup();await pool.query("UPDATE tenant_commissioning_grants SET valid_from=clock_timestamp()-interval '2 hours',expires_at=clock_timestamp()-interval '1 hour' WHERE grant_id=$1",[f.grant.grant_id]);
 await denied(()=>runtime.admitCommissionedEvent(registry,agent,submission(f)));
 const g=await setup();await pool.query("UPDATE tenant_commissioning_grants SET valid_from=clock_timestamp()+interval '1 hour',expires_at=clock_timestamp()+interval '2 hours' WHERE grant_id=$1",[g.grant.grant_id]);
 await denied(()=>runtime.admitCommissionedEvent(registry,agent,submission(g)));
});
test('scoped admission persists a receipt read back from the same store',async()=>{
 const f=await setup();const before=await counts();const result=await runtime.admitCommissionedEvent(registry,agent,submission(f));
 assert.equal(result.duplicate,false);assert.deepEqual(await counts(),{events:before.events+1,receipts:before.receipts+1,derived:before.derived+1});
 const stored=await pool.query('SELECT receipt FROM tenant_admission_receipts WHERE event_id=$1',[result.receipt.event_id]);assert.deepEqual(stored.rows[0].receipt,result.receipt);
});

test('correct signatures cannot admit an unknown schema, missing content or incorrect payload hash',async()=>{
 const f=await setup();
 for(const alter of [p=>{p.schema='ping.social.project@1';},p=>{delete p.content;},p=>{p.payload_hash='0'.repeat(64);},p=>{delete p.payload_hash;}]){
  const s=submission(f);alter(s.payload);
  if(s.payload.schema!=='ping.knowledge.business@1'||!s.payload.content)s.payload.payload_hash=require('../gateway/knowledge_ingest_adapter').computePayloadHash(s.payload);
  await denied(()=>runtime.admitCommissionedEvent(registry,agent,resign(s)));
 }
});

test('an update needs a prior journal object controlled by the granted controller',async()=>{
 const f=await setup();await denied(()=>runtime.admitCommissionedEvent(registry,agent,updateSubmission(f)));
 await runtime.admitCommissionedEvent(registry,agent,submission(f));
 const wrong=updateSubmission(f);wrong.payload.updated_by='unrelated-controller';wrong.payload.payload_hash=require('../gateway/knowledge_ingest_adapter').computePayloadHash(wrong.payload);
 await denied(()=>runtime.admitCommissionedEvent(registry,agent,resign(wrong)));
 const malformed=updateSubmission(f);malformed.payload.changes=[];malformed.payload.payload_hash=require('../gateway/knowledge_ingest_adapter').computePayloadHash(malformed.payload);
 await denied(()=>runtime.admitCommissionedEvent(registry,agent,resign(malformed)));
 const accepted=await runtime.admitCommissionedEvent(registry,agent,updateSubmission(f));
 assert.equal(accepted.duplicate,false);
 assert.deepEqual((await pool.query('SELECT payload FROM ping_events WHERE event_id=$1',[accepted.receipt.event_id])).rows[0].payload.changes,{name:'Corrected supported name'});
});
test('concurrent duplicates return the identical receipt and dispatch only once',async()=>{
 const f=await setup();const before=await counts();const s=submission(f);const results=await Promise.all(Array.from({length:8},()=>runtime.admitCommissionedEvent(registry,agent,s)));
 assert.equal(results.filter(r=>!r.duplicate).length,1);for(const r of results)assert.deepEqual(r.receipt,results[0].receipt);
 assert.deepEqual(await counts(),{events:before.events+1,receipts:before.receipts+1,derived:before.derived+1});
});
test('same logical operation with changed payload conflicts',async()=>{
 const f=await setup();await runtime.admitCommissionedEvent(registry,agent,submission(f));
 const s=submission(f);s.payload.content.name='different';s.payload.payload_hash=require('../gateway/knowledge_ingest_adapter').computePayloadHash(s.payload);s.intent.payload_digest=C.payloadDigest(s.payload,s.metadata);s.signature=crypto.sign(null,C.bytes(s.intent),signerKeys.privateKey).toString('base64');
 const before=await counts();await assert.rejects(()=>runtime.admitCommissionedEvent(registry,agent,s),/idempotency_conflict/);assert.deepEqual(await counts(),before);
});

test('a second logical create cannot change an existing resource or poison its journal',async()=>{
 const f=await setup();await runtime.admitCommissionedEvent(registry,agent,submission(f));
 const before=await counts();
 await assert.rejects(()=>runtime.admitCommissionedEvent(registry,agent,changedCreation(f,'second-create','Conflicting semantics')),/object_creation_conflict/);
 assert.deepEqual(await counts(),before);
 await runtime.admitCommissionedEvent(registry,agent,updateSubmission(f));
 await denied(()=>runtime.admitCommissionedEvent(registry,agent,changedCreation(f,'create-instead-of-update','Another conflicting value')));
});

test('identical creation under another logical operation reuses the original event without redispatch',async()=>{
 const f=await setup(),first=await runtime.admitCommissionedEvent(registry,agent,submission(f));
 const before=await counts(),second=await runtime.admitCommissionedEvent(registry,agent,submission(f,{logical_operation_id:'same-create-new-request'}));
 assert.equal(second.receipt.event_id,first.receipt.event_id);
 assert.equal(second.duplicate,false,'a distinct signed logical operation has its own receipt');
 assert.deepEqual(await counts(),{...before,receipts:before.receipts+1});
 assert.deepEqual((await runtime.admitCommissionedEvent(registry,agent,submission(f,{logical_operation_id:'same-create-new-request'}))).receipt,second.receipt);
});

test('different grants, scope or tenants cannot recreate the same globally projected object id',async()=>{
 const f=await setup();await runtime.admitCommissionedEvent(registry,agent,submission(f));
 const otherGrant=await resourceGrant(f,{purpose:'other-purpose'});
 await denied(()=>runtime.admitCommissionedEvent(registry,agent,submission(otherGrant,{purpose:'other-purpose'})));
 const otherScope=await resourceGrant(f,{site_id:'different-site'});
 await denied(()=>runtime.admitCommissionedEvent(registry,agent,submission(otherScope)));
 const tenant=await setup(),crossTenant=await resourceGrant(tenant,{resource_id:f.grant.resource_id});
 await denied(()=>runtime.admitCommissionedEvent(registry,agent,submission(crossTenant)));
});

test('concurrent conflicting creates under SHARE locks accept exactly one event and receipt',async()=>{
 const f=await setup(),shared=new TenantRegistry(pool,{commissioningPool:pool,commissioningTrust:trust,commissioningAdmissionLock:'share'}),before=await counts();
 const results=await Promise.allSettled(Array.from({length:8},(_,i)=>runtime.admitCommissionedEvent(shared,agent,changedCreation(f,'race-'+i,'Distinct semantic value '+i))));
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 for(const r of results.filter(r=>r.status==='rejected'))assert.match(r.reason.message,/object_creation_conflict/);
 assert.deepEqual(await counts(),{events:before.events+1,receipts:before.receipts+1,derived:before.derived+1});
});

test('concurrent identical creates with distinct logical ids reuse one event',async()=>{
 const f=await setup(),shared=new TenantRegistry(pool,{commissioningPool:pool,commissioningTrust:trust,commissioningAdmissionLock:'share'}),before=await counts();
 const results=await Promise.all(Array.from({length:8},(_,i)=>runtime.admitCommissionedEvent(shared,agent,submission(f,{logical_operation_id:'identical-race-'+i}))));
 assert.equal(new Set(results.map(r=>r.receipt.event_id)).size,1);
 assert.deepEqual(await counts(),{events:before.events+1,receipts:before.receipts+8,derived:before.derived+1});
});

test('concurrent cross-tenant grants cannot establish the same projection identity twice',async()=>{
 const f=await setup(),other=await setup(),g=await resourceGrant(other,{resource_id:f.grant.resource_id}),before=await counts();
 const results=await Promise.allSettled([runtime.admitCommissionedEvent(registry,agent,submission(f)),runtime.admitCommissionedEvent(registry,agent,submission(g))]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 assert.match(results.find(r=>r.status==='rejected').reason.message,/object_creation_conflict/);
 assert.deepEqual(await counts(),{events:before.events+1,receipts:before.receipts+1,derived:before.derived+1});
});

test('the database rejects raw conflicting creates and permits exact event retry',async()=>{
 const f=await setup(),first=await runtime.admitCommissionedEvent(registry,agent,submission(f));
 const row=(await pool.query('SELECT * FROM ping_events WHERE event_id=$1',[first.receipt.event_id])).rows[0],before=await counts();
 const columns='event_id,event_type,source,timestamp,payload,metadata,namespace,tenant_id';
 const args=[row.event_id,row.event_type,row.source,row.timestamp,row.payload,row.metadata,row.namespace,row.tenant_id];
 assert.equal((await pool.query(`INSERT INTO ping_events (${columns}) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(event_id) DO NOTHING`,args)).rowCount,0);
 await assert.rejects(()=>pool.query(`INSERT INTO ping_events (${columns}) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,['raw-recreate',...args.slice(1)]),/object_creation_conflict|uq_ping_events_object_created/);
 assert.deepEqual(await counts(),before);
});

test('database uniqueness serializes conflicting raw creates even at Repeatable Read',async()=>{
 const f=await setup(),s=submission(f),a=await pool.connect(),b=await pool.connect();
 const sql="INSERT INTO ping_events(event_id,event_type,source,timestamp,payload,metadata,namespace,tenant_id) VALUES($1,'OBJECT_CREATED','raw-constraint-proof',clock_timestamp(),$2,'{}',$3,$4)";
 const values=[s.payload,'tenant::'+f.grant.tenant_id,f.grant.tenant_id],before=await counts();
 try{
  await a.query('BEGIN ISOLATION LEVEL REPEATABLE READ');await b.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
  await b.query('SELECT count(*) FROM ping_events');
  await a.query(sql,['raw-unique-a',...values]);
  const rejected=assert.rejects(b.query(sql,['raw-unique-b',...values]),e=>['23505','40001'].includes(e.code));
  await waitingOn(a);await a.query('COMMIT');await rejected;await b.query('ROLLBACK');
  assert.deepEqual(await counts(),{...before,events:before.events+1});
 }finally{await a.query('ROLLBACK');await b.query('ROLLBACK');a.release();b.release();}
});
test('cross-tenant receipt probing does not return the existing receipt',async()=>{
 const f=await setup();await runtime.admitCommissionedEvent(registry,agent,submission(f));await denied(()=>runtime.admitCommissionedEvent(registry,agent,submission(f,{tenant_id:'unknown-other-tenant'})));
});
test('owner revocation increments revision and forbids both retry and fresh write',async()=>{
 const f=await setup();const s=submission(f);await runtime.admitCommissionedEvent(registry,agent,s);
 await assert.rejects(()=>registry.executeRevokeCommissioningGrant(stranger,{grant_id:f.grant.grant_id,reason_digest:'a'.repeat(64)}));
 const revoked=await registry.executeRevokeCommissioningGrant(owner,{grant_id:f.grant.grant_id,reason_digest:'a'.repeat(64)});assert.equal(revoked.revision,2);
 await denied(()=>runtime.admitCommissionedEvent(registry,agent,s));await denied(()=>runtime.admitCommissionedEvent(registry,agent,submission(f,{logical_operation_id:'new-operation'})));
});
test('owner binding revocation invalidates all dependent grants',async()=>{
 const f=await setup();await registry.executeRevokeOwnerBinding(owner,{binding_id:f.binding.binding_id});await denied(()=>runtime.admitCommissionedEvent(registry,agent,submission(f)));
});
test('revocation commits first: blocked admission sees revoked row and writes nothing',async()=>{
 const f=await setup();const holder=await pool.connect();await holder.query('BEGIN');await holder.query('SELECT * FROM tenant_owner_bindings WHERE binding_id=$1 FOR UPDATE',[f.binding.binding_id]);
 await holder.query("UPDATE tenant_commissioning_grants SET status='revoked',revision=revision+1 WHERE grant_id=$1",[f.grant.grant_id]);
 const before=await counts();const attempted=runtime.admitCommissionedEvent(registry,agent,submission(f));const rejected=assert.rejects(attempted);await waitingOn(holder);await holder.query('COMMIT');holder.release();await rejected;assert.deepEqual(await counts(),before);
});
test('admission commits first: competing revocation waits, then forbids subsequent writes',async()=>{
 const f=await setup();let release,locked;const blocker=new Promise(r=>release=r),ready=new Promise(r=>locked=r);
 const original=runtime.emit.bind(runtime);runtime.emit=async(...args)=>{locked();await blocker;return original(...args);};
 const admission=runtime.admitCommissionedEvent(registry,agent,submission(f));await ready;
 const revocation=registry.executeRevokeCommissioningGrant(owner,{grant_id:f.grant.grant_id,reason_digest:'b'.repeat(64)});
 for(let i=0;i<100;i++){const r=await pool.query("SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock'");if(r.rows[0].n)break;if(i===99)assert.fail('Revocation did not block');await new Promise(r=>setTimeout(r,10));}
 release();await admission;runtime.emit=original;await revocation;await denied(()=>runtime.admitCommissionedEvent(registry,agent,submission(f,{logical_operation_id:'later'})));
});
test('receipt write failure rolls back event and prevents derived dispatch',async()=>{
 const f=await setup();await pool.query("ALTER TABLE tenant_admission_receipts ADD CONSTRAINT force_test_rollback CHECK(logical_operation_id<>'force-rollback')");
 const before=await counts();const persistedBefore=runtime._stats.persisted;await denied(()=>runtime.admitCommissionedEvent(registry,agent,submission(f,{logical_operation_id:'force-rollback'})));assert.deepEqual(await counts(),before);assert.equal(runtime._stats.persisted,persistedBefore);
 await pool.query('ALTER TABLE tenant_admission_receipts DROP CONSTRAINT force_test_rollback');
});
test('a different persistence pool is rejected before admission',async()=>{
 const f=await setup();const wrong=new UnifiedEventRuntime({pool:{}});await denied(()=>wrong.admitCommissionedEvent(registry,agent,submission(f)));
});
test('expiry is re-evaluated after a genuine grant-lock wait',async()=>{
 const f=await setup();const holder=await pool.connect();await holder.query('BEGIN');
 await holder.query('SELECT * FROM tenant_owner_bindings WHERE binding_id=$1 FOR UPDATE',[f.binding.binding_id]);
 await holder.query("UPDATE tenant_commissioning_grants SET expires_at=clock_timestamp()+interval '150 milliseconds' WHERE grant_id=$1",[f.grant.grant_id]);
 const before=await counts();const attempt=assert.rejects(()=>runtime.admitCommissionedEvent(registry,agent,submission(f)));
 await waitingOn(holder);await new Promise(r=>setTimeout(r,200));await holder.query('COMMIT');holder.release();await attempt;assert.deepEqual(await counts(),before);
});
test('small-order and noncanonical alias keys cannot become commissioning signers',async()=>{
 const {SMALL_ORDER}=require('../ping-runtime/runtime/commissioning_key_policy');
 for(const hex of SMALL_ORDER){
  for(const signBit of [0,128]){
   const raw=Buffer.from(hex,'hex');raw[31]|=signBit;
   const key=crypto.createPublicKey({key:Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),raw]),format:'der',type:'spki'});
   assert.throws(()=>C.keyId(key.export({format:'pem',type:'spki'})),/weak_signer/);
  }
 }
});
test('numeric array boundaries and non-JSON values cannot bypass signed payload binding',async()=>{
 const f=await setup();const s=submission(f);s.payload.content.values=[1,23];s.intent.payload_digest=C.payloadDigest(s.payload,s.metadata);
 s.signature=crypto.sign(null,C.bytes(s.intent),signerKeys.privateKey).toString('base64');
 const oldBytes=C.bytes(s.payload);s.payload.content.values=[12,3];assert.deepEqual(C.bytes(s.payload),oldBytes);
 await denied(()=>runtime.admitCommissionedEvent(registry,agent,s));
 assert.throws(()=>C.payloadDigest({value:Infinity},{}),/invalid_json_payload/);
 assert.throws(()=>C.payloadDigest({value:undefined},{}),/invalid_json_payload/);
 assert.throws(()=>C.payloadDigest(JSON.parse('{"__proto__":{"forged":true}}'),{}),/invalid_json_payload/);
});
test('the enabled shared writer gate rejects raw/API/internal object writes and JSON-forged bypasses',async()=>{
 const f=await setup();const s=submission(f);const before=await counts();
 for(const source of ['api','internal','bridge']){
  for(const eventType of ['OBJECT_CREATED','OBJECT_UPDATED','RELATIONSHIP_CREATED']){
   const result=await runtime.emit(eventType,source,s.payload,{tenant_id:f.grant.tenant_id,_skipGovernance:true,commissioningTransaction:{client:pool}});
   assert.equal(result.status,'error');assert.equal(result.error,'commissioning_required');
  }
 }
 assert.deepEqual(await counts(),before);
});
test('input mutation while admission waits cannot change the signed persisted payload',async()=>{
 const f=await setup();const holder=await pool.connect();await holder.query('BEGIN');
 await holder.query('SELECT * FROM tenant_owner_bindings WHERE binding_id=$1 FOR UPDATE',[f.binding.binding_id]);
 const s=submission(f);const expected=s.payload.content.name;const attempt=runtime.admitCommissionedEvent(registry,agent,s);
 await waitingOn(holder);s.payload.content.name='mutated while waiting';await holder.query('COMMIT');holder.release();
 const result=await attempt;const stored=await pool.query('SELECT payload FROM ping_events WHERE event_id=$1',[result.receipt.event_id]);assert.equal(stored.rows[0].payload.content.name,expected);
});

test('raw v2 admissions reject duplicate names, encoding aliases and wrong protocol before persistence',async()=>{
 const {parseCommissioningSubmission:parse}=require('../ping-runtime/runtime/commissioning_wire');
 const f=await setup(),s=submission(f),raw=JSON.stringify(s);
 assert.deepEqual(parse(Buffer.from(raw)),s);
 const before=await counts();
 for(const bad of [raw.replace('"payload":','"payload":{},"payload":'),raw.replace('"name":','"name":"fake","name":'),
  JSON.stringify({...s,unknown:true}),JSON.stringify({...s,intent:{...s.intent,protocol_version:'commissioning-admission@1'}}),
  JSON.stringify({...s,signature:s.signature.replace(/==$/,'')}),Buffer.from([0xff,0xfe])])assert.throws(()=>parse(bad));
 assert.deepEqual(await counts(),before);
 await denied(()=>runtime.admitCommissionedBytes(registry,agent,raw.replace('"payload":','"payload":{},"payload":')));
 const receipt=await runtime.admitCommissionedBytes(registry,agent,Buffer.from(raw));
 assert.equal(receipt.duplicate,false);assert.equal(receipt.receipt.protocol_version,C.PROTOCOL);
});

test('FOR SHARE admission still conflicts with both owner and grant revocation updates',async()=>{
 const shared=new TenantRegistry(pool,{commissioningPool:pool,commissioningTrust:trust,commissioningAdmissionLock:'share'});
 for(const target of ['grant','owner']){
  const f=await setup(),holder=await pool.connect();await holder.query('BEGIN');
  if(target==='grant')await holder.query("UPDATE tenant_commissioning_grants SET status='revoked',revision=revision+1 WHERE grant_id=$1",[f.grant.grant_id]);
  else await holder.query("UPDATE tenant_owner_bindings SET status='revoked',revision=revision+1 WHERE binding_id=$1",[f.binding.binding_id]);
  const before=await counts(),attempt=assert.rejects(()=>runtime.admitCommissionedEvent(shared,agent,submission(f)));
  await waitingOn(holder);await holder.query('COMMIT');holder.release();await attempt;assert.deepEqual(await counts(),before);
 }
});

test('admission holding FOR SHARE forces the actual revocation command to wait',async()=>{
 const shared=new TenantRegistry(pool,{commissioningPool:pool,commissioningTrust:trust,commissioningAdmissionLock:'share'}),f=await setup();
 const original=runtime.emit;let release,readyResolve;const paused=new Promise(r=>release=r),ready=new Promise(r=>readyResolve=r);
 runtime.emit=async function(...args){readyResolve();await paused;return original.apply(this,args);};
 try{
  const admission=runtime.admitCommissionedEvent(shared,agent,submission(f));await ready;
  const revoke=registry.executeRevokeCommissioningGrant(owner,{grant_id:f.grant.grant_id,reason_digest:C.digest(Buffer.from('shared-lock race'))});
  for(let i=0;i<100;i++){if((await pool.query("SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock'")).rows[0].n)break;if(i===99)assert.fail('Revocation did not wait');await new Promise(r=>setTimeout(r,10));}
  release();await admission;await revoke;
 }finally{release();runtime.emit=original;}
 await denied(()=>runtime.admitCommissionedEvent(shared,agent,submission(f,{logical_operation_id:'after-shared-revoke'})));
});

test('owner-lock benchmark exercises real scoped admissions and captures database waits',async()=>{
 const {performance}=require('node:perf_hooks');const f=await setup(),grants=[];
 for(let i=0;i<8;i++){
  const b={...f.grantBody,resource_id:'bench-resource-'+i};
  const scope=Object.fromEntries([...C.SCOPE,'delegated_actor','authorized_signer','operations','purpose','valid_from','expires_at'].map(k=>[k,b[k]]));
  b.consent_evidence_digest=record({owner_binding_id:f.binding.binding_id,owner_actor_id:'synthetic-owner',scope_digest:C.digest(C.bytes(scope))});
  grants.push(await registry.executeIssueCommissioningGrant(admin,signed('issue_grant',b)));
 }
 const results=[];
 for(const mode of ['update','share']){
  const reg=new TenantRegistry(pool,{commissioningPool:pool,commissioningTrust:trust,commissioningAdmissionLock:mode}),rt=new UnifiedEventRuntime({pool,requireCommissioningForObjectWrites:true});
  const original=rt.emit;rt.emit=async function(...args){await args[3][Object.getOwnPropertySymbols(args[3])[0]].client.query('SELECT pg_sleep(0.01)');return original.apply(this,args);};
  const deadlocksBefore=Number((await pool.query('SELECT deadlocks FROM pg_stat_database WHERE datname=current_database()')).rows[0].deadlocks);
  let next=0,waitSamples=0,maxWaiters=0,sampleRunning=false;
  const monitor=setInterval(async()=>{if(sampleRunning)return;sampleRunning=true;try{
   const row=(await pool.query("SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock'")).rows[0];waitSamples+=row.n;maxWaiters=Math.max(maxWaiters,row.n);
  }finally{sampleRunning=false;}},5);
  const latency=[],start=performance.now();
  try{await Promise.all(Array.from({length:8},async()=>{while(next<64){const i=next++,s=submission({grant:grants[i%8]},{logical_operation_id:'bench-'+mode+'-'+i}),t=performance.now();await rt.admitCommissionedEvent(reg,agent,s);latency.push(performance.now()-t);}}));}
  finally{clearInterval(monitor);while(sampleRunning)await new Promise(r=>setTimeout(r,5));}
  const duration=performance.now()-start;latency.sort((a,b)=>a-b);
  const percentile=p=>latency[Math.min(latency.length-1,Math.ceil(latency.length*p)-1)];
  const deadlocksAfter=Number((await pool.query('SELECT deadlocks FROM pg_stat_database WHERE datname=current_database()')).rows[0].deadlocks);
  results.push({mode,operations:64,concurrency:8,grants:8,p50_ms:percentile(.5),p95_ms:percentile(.95),p99_ms:percentile(.99),duration_ms:duration,operations_per_second:64000/duration,lock_waiter_samples:waitSamples,max_lock_waiters:maxWaiters,deadlocks_delta:deadlocksAfter-deadlocksBefore});
  await reg.executeRevokeCommissioningGrant(owner,{grant_id:grants[0].grant_id,reason_digest:C.digest(Buffer.from('benchmark denial proof'))});
  await denied(()=>rt.admitCommissionedEvent(reg,agent,submission({grant:grants[0]},{logical_operation_id:'after-bench-revocation-'+mode})));
  // The second mode uses a separately consented grant for the revoked slot.
  if(mode==='update'){const b={...f.grantBody,resource_id:'bench-replacement'};const sc=Object.fromEntries([...C.SCOPE,'delegated_actor','authorized_signer','operations','purpose','valid_from','expires_at'].map(k=>[k,b[k]]));b.consent_evidence_digest=record({owner_binding_id:f.binding.binding_id,owner_actor_id:'synthetic-owner',scope_digest:C.digest(C.bytes(sc))});grants[0]=await registry.executeIssueCommissioningGrant(admin,signed('issue_grant',b));}
 }
 fs.writeFileSync(path.join(root,'artifacts/owner-lock-benchmark.json'),JSON.stringify({scope:'Synthetic real admission transactions; shared owner, eight resources, 10ms injected database work per admission; not production throughput.',results},null,2)+'\n');
 for(const r of results)assert.equal(r.deadlocks_delta,0);
});

test('the authorization decision timestamp is persisted and duplicate admission preserves it',async()=>{
 const f=await setup(),s=submission(f),r=await runtime.admitCommissionedEvent(registry,agent,s);
 const row=(await pool.query('SELECT authorization_decision_at FROM tenant_admission_receipts WHERE event_id=$1',[r.receipt.event_id])).rows[0];
 assert.equal(row.authorization_decision_at.toISOString(),r.receipt.authorization_decision_at);
 assert.equal(r.receipt.schema,'commissioning-admission-receipt@2');
 assert.deepEqual((await runtime.admitCommissionedEvent(registry,agent,s)).receipt,r.receipt);
});

test('a decision before expiry may commit afterward but cannot authorize a later action',async()=>{
 const f=await setup();
 await pool.query("UPDATE tenant_commissioning_grants SET expires_at=clock_timestamp()+interval '150 milliseconds' WHERE grant_id=$1",[f.grant.grant_id]);
 const expires=(await pool.query('SELECT expires_at FROM tenant_commissioning_grants WHERE grant_id=$1',[f.grant.grant_id])).rows[0].expires_at;
 const original=runtime.emit;
 runtime.emit=async function(...args){await args[3][Object.getOwnPropertySymbols(args[3])[0]].client.query('SELECT pg_sleep(0.25)');return original.apply(this,args);};
 let r;try{r=await runtime.admitCommissionedEvent(registry,agent,submission(f));}finally{runtime.emit=original;}
 assert.ok(Date.parse(r.receipt.authorization_decision_at)<expires.getTime());
 assert.ok((await pool.query('SELECT clock_timestamp() AS now')).rows[0].now.getTime()>expires.getTime());
 await denied(()=>runtime.admitCommissionedEvent(registry,agent,submission(f,{logical_operation_id:'after-expiry'})));
});

test('bounded database work times out and rolls back both admission rows',async()=>{
 const f=await setup();
 const limited=new TenantRegistry(pool,{commissioningPool:pool,commissioningTrust:trust,commissioningTransactionMs:75});
 const original=runtime.emit;
 runtime.emit=async function(...args){await args[3][Object.getOwnPropertySymbols(args[3])[0]].client.query('SELECT pg_sleep(0.2)');return original.apply(this,args);};
 try{await denied(()=>runtime.admitCommissionedEvent(limited,agent,submission(f)));}finally{runtime.emit=original;}
});

test('the admission deadline includes pool wait and late acquisition cannot mutate or leak a client',async()=>{
 const f=await setup(),small=new Pool({...config,max:1,connectionTimeoutMillis:2000}),holder=await small.connect();
 const limited=new TenantRegistry(small,{commissioningPool:small,commissioningTrust:trust,commissioningTransactionMs:75,commissioningMaxPending:1});
 const rt=new UnifiedEventRuntime({pool:small});let released=false;const before=await counts();
 const release=()=>{if(!released){released=true;holder.release();}};
 const timer=setTimeout(release,300);
 try{
  await assert.rejects(()=>rt.admitCommissionedEvent(limited,agent,submission(f)),/commissioning_transaction_timeout/);
  assert.equal(released,false,'deadline must expire before the held connection becomes available');
  await assert.rejects(()=>rt.admitCommissionedEvent(limited,agent,submission(f,{logical_operation_id:'queue-overflow'})),/commissioning_overloaded/);
  release();
  for(let i=0;i<100&&small.waitingCount;i++)await new Promise(r=>setTimeout(r,5));
  const probe=await small.connect();try{assert.equal((await probe.query('SELECT 1 AS ok')).rows[0].ok,1);}finally{probe.release();}
  assert.deepEqual(await counts(),before,'expired queued work never starts a mutation');
 }finally{clearTimeout(timer);release();await small.end();}
});

test('records actual pool, SQL, lock, transaction and dispatch costs for fresh admissions',async()=>{
 const {performance}=require('node:perf_hooks'),samples=[],queries=[],transactions=[],dispatch=[];
 const timedPool={query:pool.query.bind(pool),connect:async()=>{
  const waiting=performance.now(),client=await pool.connect();samples.push(performance.now()-waiting);let begun;
  return {on:client.on.bind(client),removeListener:client.removeListener.bind(client),release:client.release.bind(client),query:async(...args)=>{
   const text=String(args[0]),start=performance.now();if(text==='BEGIN')begun=start;
   try{return await client.query(...args);}finally{
    const kind=text.startsWith('SELECT set_config(')?'timeout_setup':text.includes('tenant_owner_bindings')&&text.includes('FOR ')?'owner_lock':
     text.includes('tenant_commissioning_grants')&&text.includes('FOR ')?'grant_lock':text.includes('pg_advisory_xact_lock')?'logical_or_resource_lock':text==='ROLLBACK'?'rollback':'other';
    queries.push({kind,ms:performance.now()-start});if(text==='COMMIT'&&begun)transactions.push(performance.now()-begun);
   }
  }};
 }};
 const reg=new TenantRegistry(timedPool,{commissioningPool:timedPool,commissioningTrust:trust}),rt=new UnifiedEventRuntime({pool:timedPool});
 const original=rt._dispatchCommitted.bind(rt);rt._dispatchCommitted=async event=>{const t=performance.now();try{return await original(event);}finally{dispatch.push(performance.now()-t);}};
 const f=await setup(),fixtures=[];for(let i=0;i<16;i++)fixtures.push(await resourceGrant(f,{resource_id:'metrics-'+f.grant.tenant_id+'-'+i}));
 const latency=[];let next=0;
 await Promise.all(Array.from({length:4},async()=>{while(next<fixtures.length){const current=fixtures[next++],t=performance.now();await rt.admitCommissionedEvent(reg,agent,submission(current,{logical_operation_id:'metrics-'+current.grant.resource_id}));latency.push(performance.now()-t);}}));
 const summary=values=>{const s=[...values].sort((a,b)=>a-b);return {samples:s.length,p50_ms:s[Math.ceil(s.length*.5)-1]??null,p95_ms:s[Math.ceil(s.length*.95)-1]??null,p99_ms:s[Math.ceil(s.length*.99)-1]??null};};
 const report={scope:'Synthetic sixteen fresh objects, one owner, four concurrent callers; no production capacity claim',operations:16,
  pool_wait:summary(samples),transaction:summary(transactions),admission:summary(latency),dispatch:summary(dispatch),query_count:queries.length,
  query_stages:Object.fromEntries([...new Set(queries.map(q=>q.kind))].map(kind=>[kind,summary(queries.filter(q=>q.kind===kind).map(q=>q.ms))]))};
 fs.writeFileSync(path.join(root,'artifacts/admission-transaction-metrics.json'),JSON.stringify(report,null,2)+'\n');
 assert.equal(transactions.length,16);assert.equal(dispatch.length,16);
});

test('receipt recovery after expiry returns the original outcome without admitting a new action',async()=>{
 const f=await setup(),s=submission(f),accepted=await runtime.admitCommissionedEvent(registry,agent,s);
 await pool.query("UPDATE tenant_commissioning_grants SET valid_from=clock_timestamp()-interval '2 hours',expires_at=clock_timestamp()-interval '1 hour' WHERE grant_id=$1",[f.grant.grant_id]);
 const before=await counts();
 assert.deepEqual(await registry.executeGetAdmissionReceipt(agent,receiptQuery(s)),{status:'ACCEPTED',receipt:accepted.receipt});
 assert.deepEqual(await counts(),before);
 await denied(()=>runtime.admitCommissionedEvent(registry,agent,s));
 await denied(()=>runtime.admitCommissionedEvent(registry,agent,submission(f,{logical_operation_id:'expired-new-action'})));
});

test('receipt recovery survives grant and owner revocation without authorizing effects',async()=>{
 for(const target of ['grant','owner']){
  const f=await setup(),s=submission(f),accepted=await runtime.admitCommissionedEvent(registry,agent,s);
  if(target==='grant')await registry.executeRevokeCommissioningGrant(owner,{grant_id:f.grant.grant_id,reason_digest:C.digest(Buffer.from('revoke after acceptance'))});
  else await registry.executeRevokeOwnerBinding(owner,{binding_id:f.binding.binding_id});
  const before=await counts();
  assert.deepEqual(await registry.executeGetAdmissionReceipt(agent,receiptQuery(s)),{status:'ACCEPTED',receipt:accepted.receipt});
  assert.deepEqual(await counts(),before);
  await denied(()=>runtime.admitCommissionedEvent(registry,agent,submission(f,{logical_operation_id:'revoked-new-action'})));
 }
});

test('receipt recovery requires the original authenticated actor and complete accepted scope',async()=>{
 const f=await setup(),s=submission(f);await runtime.admitCommissionedEvent(registry,agent,s);
 const q=receiptQuery(s),before=await counts();
 assert.deepEqual(await registry.executeGetAdmissionReceipt(stranger,q),{status:'UNKNOWN'});
 for(const key of [...C.SCOPE,'logical_operation_id','operation_digest']){
  const value=key==='operation_digest'?'0'.repeat(64):'unrelated-'+key.replaceAll('_','-');
  assert.deepEqual(await registry.executeGetAdmissionReceipt(agent,{...q,[key]:value}),{status:'UNKNOWN'});
 }
 await assert.rejects(()=>registry.executeGetAdmissionReceipt({actor_id:'synthetic-agent',verified:true},q));
 for(const invalid of [null,{...q,extra:true},{...q,resource_id:undefined},{...q,operation_digest:[q.operation_digest]}]){
  await assert.rejects(()=>registry.executeGetAdmissionReceipt(agent,invalid));
 }
 assert.deepEqual(await counts(),before);
});

test('real process death at all four boundaries recovers through the existing projector without effects',async()=>{
 const {spawnSync}=require('node:child_process');
 const {PingProjector}=require('../gateway/constitutional-dist/ping-projector');
 await pool.query('DROP SCHEMA IF EXISTS recovery_proof CASCADE; CREATE SCHEMA recovery_proof');
 await pool.query('CREATE TABLE recovery_proof.tenant_registry (LIKE public.tenant_registry INCLUDING ALL)');
 const recoveryConfig={...config,options:'-c search_path=recovery_proof'},rp=new Pool(recoveryConfig);
 try{
  const rr=new TenantRegistry(rp,{commissioningPool:rp,commissioningTrust:trust});
  const rt=new UnifiedEventRuntime({pool:rp,requireCommissioningForObjectWrites:true});
  await rt.initialize();await rr.initializeCommissioning();
  // Empty test journal only: provision the existing projector's database-order
  // contract. This is NOT a historical sequence migration or live schema proof.
  assert.equal((await rp.query('SELECT count(*)::int AS n FROM ping_events')).rows[0].n,0);
  await rp.query('ALTER TABLE ping_events ADD COLUMN sequence BIGSERIAL');
  const db=await rp.connect();
  try{await new PingProjector({db}).initialize(fs.readFileSync(path.join(root,'database/ping_objects.sql'),'utf8'));}finally{db.release();}
  const f=await setup('crash',rr),s=submission(f);
  s.payload={...s.payload,created_at:'2026-10-10T00:00:00.000Z',refs:[],visibility:'public',status:'active',metadata:s.metadata};
  s.payload.payload_hash=require('../gateway/knowledge_ingest_adapter').computePayloadHash(s.payload);
  s.intent.payload_digest=C.payloadDigest(s.payload,s.metadata);
  s.signature=crypto.sign(null,C.bytes(s.intent),signerKeys.privateKey).toString('base64');
  for(const mode of ['crash_before_append','crash_before_receipt']){
   const interrupted=spawnSync(process.execPath,[path.join(__dirname,'commissioning_crash_child.js')],{input:JSON.stringify({config:recoveryConfig,issuers:[...trust.issuers],submission:s,mode}),encoding:'utf8',timeout:10000});
   assert.equal(interrupted.signal,'SIGKILL',mode+': '+interrupted.stderr);
   assert.equal((await rp.query('SELECT count(*)::int AS n FROM ping_events')).rows[0].n,0,mode);
   assert.equal((await rp.query('SELECT count(*)::int AS n FROM tenant_admission_receipts')).rows[0].n,0,mode);
  }
  // The same request is now retried in a fresh process; the killed transaction
  // did not leave a durable event without its authorization receipt.
  const child=spawnSync(process.execPath,[path.join(__dirname,'commissioning_crash_child.js')],{input:JSON.stringify({config:recoveryConfig,issuers:[...trust.issuers],submission:s}),encoding:'utf8',timeout:10000});
  assert.equal(child.signal,'SIGKILL',child.stderr);
  assert.equal((await rp.query('SELECT count(*)::int AS n FROM tenant_admission_receipts')).rows[0].n,1);
  assert.equal((await rp.query('SELECT count(*)::int AS n FROM ping_events')).rows[0].n,1);
  assert.equal((await rp.query('SELECT count(*)::int AS n FROM ping_objects')).rows[0].n,0);
  let effects=0;rt.on('OBJECT_CREATED',async()=>{effects++;});
  assert.equal((await rt.admitCommissionedEvent(rr,agent,s)).duplicate,true);
  await rr.executeRevokeCommissioningGrant(owner,{grant_id:f.grant.grant_id,reason_digest:C.digest(Buffer.from('test revoke after accepted action'))});
  const restarted=spawnSync(process.execPath,[path.join(__dirname,'commissioning_crash_child.js')],{input:JSON.stringify({config:recoveryConfig,mode:'recover'}),encoding:'utf8',timeout:10000});
  assert.equal(restarted.status,0,restarted.stderr);assert.deepEqual(JSON.parse(restarted.stdout),{objects:1,relationships:0,transitions:1});
  const restartDb=await rp.connect();
  try{
   const projector=new PingProjector({db:restartDb});
   const snapshot=async()=>C.digest(Buffer.from(JSON.stringify({objects:(await restartDb.query('SELECT object_id,schema,controller,content,refs,visibility,status,metadata FROM ping_objects ORDER BY object_id')).rows,
    transitions:(await restartDb.query('SELECT * FROM ping_transitions ORDER BY object_id,sequence')).rows})));
   const rebuilt=await projector.rebuildAll();assert.deepEqual(rebuilt,{objects:1,relationships:0,transitions:1});
   assert.deepEqual((await restartDb.query('SELECT content FROM ping_objects WHERE object_id=$1',[s.payload.object_id])).rows[0].content,s.payload.content);
   const first=await snapshot();await projector.rebuildAll();assert.equal(await snapshot(),first);
   const journalBefore=(await rp.query('SELECT event_id,payload,metadata FROM ping_events ORDER BY event_id')).rows;
   const receiptsBefore=(await rp.query('SELECT receipt FROM tenant_admission_receipts ORDER BY event_id')).rows;
   const interrupted=spawnSync(process.execPath,[path.join(__dirname,'commissioning_crash_child.js')],{input:JSON.stringify({config:recoveryConfig,mode:'crash_during_projection'}),encoding:'utf8',timeout:10000});
   assert.equal(interrupted.signal,'SIGKILL',interrupted.stderr);
   assert.equal(await snapshot(),first,'interrupted projection rolls back to its prior checkpoint');
   const recovered=spawnSync(process.execPath,[path.join(__dirname,'commissioning_crash_child.js')],{input:JSON.stringify({config:recoveryConfig,mode:'recover'}),encoding:'utf8',timeout:10000});
   assert.equal(recovered.status,0,recovered.stderr);assert.equal(await snapshot(),first);
   assert.deepEqual((await rp.query('SELECT event_id,payload,metadata FROM ping_events ORDER BY event_id')).rows,journalBefore);
   assert.deepEqual((await rp.query('SELECT receipt FROM tenant_admission_receipts ORDER BY event_id')).rows,receiptsBefore);
   assert.deepEqual(await rr.executeGetAdmissionReceipt(agent,receiptQuery(s)),{status:'ACCEPTED',receipt:receiptsBefore[0].receipt});
  }finally{restartDb.release();}
  assert.equal(effects,0);
  await assert.rejects(()=>rt.admitCommissionedEvent(rr,agent,{...s,intent:{...s.intent,logical_operation_id:'revoked-new-action'}}));
 }finally{await rp.end();}
});
