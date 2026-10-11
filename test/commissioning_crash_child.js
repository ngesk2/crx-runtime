'use strict';
// Controlled crash harness only; consumes public fixture data over stdin.
const fs=require('node:fs'),{Pool}=require('pg');
const {TenantRegistry}=require('../ping-runtime/runtime/tenant_registry');
const {UnifiedEventRuntime}=require('../ping-runtime/events/unified_event_runtime');
async function main(){
 const input=JSON.parse(fs.readFileSync(0,'utf8'));
 if(input.config.database!=='admission_proof'||input.config.host!=='127.0.0.1'||input.config.options!=='-c search_path=recovery_proof')throw new Error('disposable_database_required');
 const pool=new Pool(input.config);
 if((await pool.query('SHOW cluster_name')).rows[0].cluster_name!=='ping-admission-proof-20261010')throw new Error('disposable_cluster_required');
 if(input.mode==='recover'){
  const db=await pool.connect();
  try{const {PingProjector}=require('../gateway/constitutional-dist/ping-projector');console.log(JSON.stringify(await new PingProjector({db}).rebuildAll()));}
  finally{db.release();await pool.end();}
  return;
 }
 const trust={resolveActor:async()=>({verified:true,actor_id:'synthetic-agent'}),issuers:new Map(input.issuers)};
 const registry=new TenantRegistry(pool,{commissioningPool:pool,commissioningTrust:trust});
 const runtime=new UnifiedEventRuntime({pool,requireCommissioningForObjectWrites:true});
 if(input.mode==='crash_before_receipt'){
  const emit=runtime.emit.bind(runtime);
  runtime.emit=async(...args)=>{await emit(...args);process.kill(process.pid,'SIGKILL');};
 }
 runtime._dispatchCommitted=async()=>process.kill(process.pid,'SIGKILL');
 await runtime.admitCommissionedEvent(registry,{},input.submission);
 throw new Error('expected_controlled_crash');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
