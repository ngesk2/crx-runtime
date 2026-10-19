'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {Pool}=require('pg');
const {UnifiedEventRuntime}=require('../ping-runtime/events/unified_event_runtime');
const {PingProjector}=require('../gateway/constitutional-dist/ping-projector');
const {computePayloadHash}=require('../gateway/knowledge_ingest_adapter');
const root=path.resolve(__dirname,'..'),config=JSON.parse(fs.readFileSync(path.join(root,'.test-database.json'),'utf8'));
assert.equal(config.host,'127.0.0.1');assert.equal(config.database,'admission_proof');
let sequence=0;
async function fixture(action){
 const admin=new Pool(config),schema='snapshot_'+process.pid+'_'+(++sequence);
 let pool;
 try{
  assert.equal((await admin.query('SHOW cluster_name')).rows[0].cluster_name,'ping-admission-proof-20261010');
  await admin.query(`CREATE SCHEMA ${schema}`);pool=new Pool({...config,options:'-c search_path='+schema,max:6});
  await new UnifiedEventRuntime({pool}).initialize();await pool.query('ALTER TABLE ping_events ADD COLUMN sequence BIGSERIAL');
  await new PingProjector({db:pool}).initialize(fs.readFileSync(path.join(root,'database/ping_objects.sql'),'utf8'));
  await action(pool);
 }finally{if(pool)await pool.end();await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);await admin.end();}
}
async function append(db,id){
 const payload={object_id:id,schema:'ping.knowledge.business@1',controller:'snapshot-controller',content:{name:id}};
 payload.payload_hash=computePayloadHash(payload);
 await db.query("INSERT INTO ping_events(event_id,event_type,source,timestamp,payload,metadata,namespace,tenant_id) VALUES($1,'OBJECT_CREATED','snapshot-fixture',clock_timestamp(),$2,'{}','tenant::snapshot','snapshot')",['event-'+id,payload]);
}
const ids=async db=>(await db.query('SELECT object_id FROM ping_objects ORDER BY object_id')).rows.map(r=>r.object_id);
const transitions=async db=>(await db.query('SELECT object_id FROM ping_transitions ORDER BY object_id')).rows.map(r=>r.object_id);

test('a journal commit between projection phases waits for the next complete snapshot',()=>fixture(async pool=>{
 await append(pool,'a');const reader=await pool.connect(),writer=await pool.connect();let injected=false;
 const db={query:async(...args)=>{const result=await reader.query(...args);
  if(!injected&&args[0].includes('INSERT INTO ping_objects (')){injected=true;await append(writer,'b');}
  return result;}};
 try{
  assert.deepEqual(await new PingProjector({db}).rebuildAll(),{objects:1,relationships:0,transitions:1});
  assert.deepEqual(await ids(reader),['a']);assert.deepEqual(await transitions(reader),['a']);
  assert.deepEqual(await new PingProjector({db:reader}).rebuildAll(),{objects:2,relationships:0,transitions:2});
  assert.deepEqual(await ids(reader),['a','b']);assert.deepEqual(await transitions(reader),['a','b']);
 }finally{reader.release();writer.release();}
}));

test('a late lower-sequence commit is not lost behind an assumed numeric high-water mark',()=>fixture(async pool=>{
 await append(pool,'a');const late=await pool.connect(),reader=await pool.connect();
 try{
  await late.query('BEGIN');await append(late,'b');await append(pool,'c');
  await new PingProjector({db:reader}).rebuildAll();assert.deepEqual(await ids(reader),['a','c']);
  await late.query('COMMIT');await new PingProjector({db:reader}).rebuildAll();
  assert.deepEqual(await ids(reader),['a','b','c']);assert.deepEqual(await transitions(reader),['a','b','c']);
 }finally{await late.query('ROLLBACK');late.release();reader.release();}
}));

test('a failed replay preserves its previous complete projection',()=>fixture(async pool=>{
 await append(pool,'a');const reader=await pool.connect();
 try{
  await new PingProjector({db:reader}).rebuildAll();await append(pool,'b');
  const db={query:async(...args)=>{if(args[0].includes('INSERT INTO ping_transitions'))throw new Error('injected replay failure');return reader.query(...args);}};
  await assert.rejects(()=>new PingProjector({db}).rebuildAll(),/injected replay failure/);
  assert.deepEqual(await ids(reader),['a']);assert.deepEqual(await transitions(reader),['a']);
  await new PingProjector({db:reader}).rebuildAll();assert.deepEqual(await ids(reader),['a','b']);
 }finally{reader.release();}
}));

test('a pool caller leases exactly one connection for each rebuild',()=>fixture(async pool=>{
 await append(pool,'a');let leases=0,releases=0,directQueries=0;
 const db={query:async(...args)=>{directQueries++;return pool.query(...args);},connect:async()=>{
  leases++;const client=await pool.connect();return {query:client.query.bind(client),release:destroy=>{releases++;client.release(destroy);}};
 }};
 await new PingProjector({db}).rebuildAll();assert.equal(leases,1);assert.equal(releases,1);assert.equal(directQueries,0);
}));

test('concurrent rebuilds acquire projection ownership before choosing their snapshots',()=>fixture(async pool=>{
 await append(pool,'a');const first=await pool.connect(),second=await pool.connect();
 let signal,release;const ready=new Promise(r=>signal=r),paused=new Promise(r=>release=r);let injected=false;
 const db={query:async(...args)=>{const result=await first.query(...args);if(!injected&&args[0].includes('INSERT INTO ping_objects (')){injected=true;signal();await paused;}return result;}};
 let firstRun,secondRun;
 try{
  const pid=(await first.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
  firstRun=new PingProjector({db}).rebuildAll();await ready;await append(pool,'b');
  secondRun=new PingProjector({db:second}).rebuildAll();
  let waiting=false;
  for(let i=0;i<100;i++){
   const r=await pool.query("SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock' AND $1=ANY(pg_blocking_pids(pid))",[pid]);
   if(r.rows[0].n){waiting=true;break;}await new Promise(r=>setTimeout(r,10));
  }
  assert.ok(waiting,'second rebuild must wait on the first projection transaction');release();
  assert.deepEqual(await firstRun,{objects:1,relationships:0,transitions:1});
  assert.deepEqual(await secondRun,{objects:2,relationships:0,transitions:2});
  assert.deepEqual(await ids(pool),['a','b']);assert.deepEqual(await transitions(pool),['a','b']);
 }finally{release();await Promise.allSettled([firstRun,secondRun].filter(Boolean));first.release();second.release();}
}));

test('serialization failure retries the whole replay and repeated failure is bounded',()=>fixture(async pool=>{
 await append(pool,'a');const reader=await pool.connect();let begins=0,failures=1;
 const db={query:async(...args)=>{
  if(args[0].startsWith('BEGIN'))begins++;
  if(args[0].includes('INSERT INTO ping_transitions')&&failures-->0){const e=new Error('injected serialization failure');e.code='40001';throw e;}
  return reader.query(...args);
 }};
 try{
  await new PingProjector({db}).rebuildAll();assert.equal(begins,2);assert.deepEqual(await ids(reader),['a']);
  begins=0;failures=10;
  await assert.rejects(()=>new PingProjector({db}).rebuildAll(),/injected serialization failure/);
  assert.equal(begins,3);assert.deepEqual(await ids(reader),['a']);assert.deepEqual(await transitions(reader),['a']);
 }finally{reader.release();}
}));
