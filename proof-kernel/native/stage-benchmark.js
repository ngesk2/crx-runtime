'use strict';
// Synthetic, isolated-process measurements. No provider, authority or DB writes.
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const {spawnSync,execFileSync}=require('node:child_process');
const {VERSION,verifyProofV2}=require('../wire-v2');
const native=require('./ping-proof.node');
const root=path.resolve(__dirname,'../..');
const hex=b=>crypto.createHash('sha256').update(b).digest('hex');
function summary(values){const s=[...values].sort((a,b)=>a-b);return {p50_us:s[Math.ceil(s.length*.5)-1],p95_us:s[Math.ceil(s.length*.95)-1],p99_us:s[Math.ceil(s.length*.99)-1]};}
function measure(stage,input){
 const r=JSON.parse(input.raw),decoded=r.bytes_base64===undefined?null:Buffer.from(r.bytes_base64,'base64');
 const publicKey=r.kind==='signature'?crypto.createPublicKey({key:Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),Buffer.from(r.public_key_base64,'base64')]),format:'der',type:'spki'}):null;
 const signature=r.kind==='signature'?Buffer.from(r.signature_base64,'base64'):null;
 const action={wire_node:()=>verifyProofV2(input.raw),wire_rust:()=>native.verifyProofV2(input.raw),
  parse_json:()=>JSON.parse(input.raw),decode_base64:()=>Buffer.from(r.bytes_base64,'base64'),
  sha256:()=>hex(decoded),ed25519_cached:()=>crypto.verify(null,decoded,publicKey,signature)}[stage];
 if(!action)throw new Error('Unknown benchmark stage');
 if(['wire_node','wire_rust'].includes(stage)&&action()!==input.expected)throw new Error('Parity failed before measuring');
 for(let i=0;i<30;i++)action();if(global.gc)global.gc();
 const memoryBefore=process.memoryUsage(),cpuBefore=process.cpuUsage(),start=process.hrtime.bigint(),latency=[];
 const count=Buffer.byteLength(input.raw)>32768?128:512;
 for(let i=0;i<count;i++){const t=process.hrtime.bigint();action();latency.push(Number(process.hrtime.bigint()-t)/1000);}
 const durationMs=Number(process.hrtime.bigint()-start)/1e6,cpu=process.cpuUsage(cpuBefore),memoryAfter=process.memoryUsage();
 return {stage,calls:count,wire_bytes:Buffer.byteLength(input.raw),...summary(latency),duration_ms:durationMs,
  calls_per_second:count*1000/durationMs,cpu_user_us:cpu.user,cpu_system_us:cpu.system,
  memory_before:memoryBefore,memory_after:memoryAfter,process_peak_rss_kib:process.resourceUsage().maxRSS};
}
if(process.argv[2]==='--child'){
 const input=JSON.parse(fs.readFileSync(0,'utf8'));
 console.log(JSON.stringify(measure(process.argv[3],input)));
}else{
 const cases=[];
 for(const size of [0,1024,65536]){const b=Buffer.alloc(size,97);cases.push({name:'digest-'+size,request:{version:VERSION,kind:'digest',bytes_base64:b.toString('base64'),expected_digest:hex(b)},expected:'valid'});}
 const key=crypto.generateKeyPairSync('ed25519'),message=Buffer.alloc(1024,98);
 cases.push({name:'signature-1024',request:{version:VERSION,kind:'signature',bytes_base64:message.toString('base64'),public_key_base64:key.publicKey.export({format:'der',type:'spki'}).subarray(-32).toString('base64'),signature_base64:crypto.sign(null,message,key.privateKey).toString('base64')},expected:'valid'});
 const refs=Array.from({length:16},(_,i)=>({id:'ref-'+i,bytes_base64:Buffer.alloc(1024,i).toString('base64')}));
 cases.push({name:'evidence-16x1024',request:{version:VERSION,kind:'evidence',claim_refs:refs.map(r=>({id:r.id,digest:hex(Buffer.from(r.bytes_base64,'base64'))})),immutable_refs:refs},expected:'valid'});
 cases.push({name:'malformed-kind',request:{version:VERSION,kind:'unknown'},expected:'malformed_input'});
 const results=[];
 for(const c of cases){
  const input={raw:JSON.stringify(c.request),expected:c.expected};
  const stages=['wire_node','wire_rust'];if(c.expected==='valid')stages.push('parse_json');
  if(c.request.bytes_base64!==undefined)stages.push('decode_base64');
  if(c.request.kind==='digest')stages.push('sha256');
  if(c.request.kind==='signature')stages.push('ed25519_cached');
  for(const stage of stages){
   const p=spawnSync(process.execPath,['--expose-gc',__filename,'--child',stage],{input:JSON.stringify(input),encoding:'utf8',timeout:15000});
   if(p.status!==0)throw new Error(p.stderr||'Benchmark child failed');results.push({case:c.name,...JSON.parse(p.stdout)});
  }
 }
 console.log(JSON.stringify({source_sha:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
  tree_sha:execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:root,encoding:'utf8'}).trim(),
  tracked_changes:execFileSync('git',['-c','core.filemode=false','status','--porcelain','--untracked-files=no'],{cwd:root,encoding:'utf8'}).trim(),
  native_sha256:hex(fs.readFileSync(path.join(__dirname,'ping-proof.node'))),
  benchmark_sha256:hex(fs.readFileSync(__filename)),node:process.version,openssl:process.versions.openssl,platform:process.platform,arch:process.arch,
  scope:'Synthetic fresh-process stages; full-wire variants receive identical public requests. Component stages are not end-to-end comparisons. No production throughput or event-loop/load claim.',results},null,2));
}
