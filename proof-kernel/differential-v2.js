'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const {VERSION,verifyProofV2}=require('./wire-v2');
const file=path.join(__dirname,'wire-v2-vectors.jsonl');
function generate(){
 const old=fs.readFileSync(path.join(__dirname,'golden-vectors.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
 const corpus=old.map(v=>({name:'historical-exact-bytes/'+v.name,raw:JSON.stringify({version:VERSION,...v.request}),expected:v.expected}));
 const d=JSON.parse(corpus.find(v=>JSON.parse(v.raw).kind==='digest').raw);
 function add(name,raw,expected='malformed_input'){corpus.push({name,raw,expected});}
 add('extra-field',JSON.stringify({...d,extra:true}));
 add('wrong-version',JSON.stringify({...d,version:'ping.proof-wire@99'}));
 add('missing-version',JSON.stringify(Object.fromEntries(Object.entries(d).filter(([k])=>k!=='version'))));
 add('duplicate-field',corpus[0].raw.replace('"kind":"digest"','"kind":"digest","kind":"digest"'));
 add('escaped-duplicate-field',corpus[0].raw.replace('"kind":"digest"','"kind":"digest","\\u006bind":"digest"'));
 for(const encoding of ['YR==','YQ','YQ=','YQ===',' YQ==','YQ==\n','YQ__','!','Zg=B'])add('binary/'+JSON.stringify(encoding),JSON.stringify({...d,bytes_base64:encoding}));
 add('wire-whitespace',' \t'+corpus[0].raw+'\r ',corpus[0].expected);
 add('wire-reordered',JSON.stringify(Object.fromEntries(Object.entries(d).reverse())),corpus[0].expected);
 add('UTF8-BOM','\ufeff'+corpus[0].raw);
 add('lone-surrogate-id','{"version":"'+VERSION+'","kind":"evidence","claim_refs":[],"immutable_refs":[{"id":"\\ud800","bytes_base64":""}]}');
 add('nested-duplicate','{"version":"'+VERSION+'","kind":"evidence","claim_refs":[],"immutable_refs":[{"id":"x","id":"y","bytes_base64":""}]}');
 add('nested-extra-field',JSON.stringify({version:VERSION,kind:'evidence',claim_refs:[{id:'x',digest:'0'.repeat(64),unknown:true}],immutable_refs:[]}));
 add('invalid-number',JSON.stringify(d).replace('"bytes_base64":'+JSON.stringify(d.bytes_base64),'"bytes_base64":1e400'));
 add('unsafe-integer',JSON.stringify({...d,bytes_base64:9007199254740992}));
 add('top-level-array','[]');add('top-level-null','null');add('malformed-json','{bad json}');add('trailing-data',corpus[0].raw+' {}');
 const unicode={version:VERSION,kind:'evidence',claim_refs:[{id:'é🦀𐐀',digest:'0'.repeat(64)}],immutable_refs:[]};
 add('unicode-identifiers',JSON.stringify(unicode),'missing_evidence_reference');
 for(let i=0;i<128;i++){
  const r={...d};if(i%4===0)r.bytes_base64=d.bytes_base64.slice(0,i%(d.bytes_base64.length+1));
  else if(i%4===1)r.expected_digest='0'.repeat(i%65);
  else if(i%4===2)r.kind='unknown';
  else r['unexpected_'+i]=i;
  const raw=JSON.stringify(r);add('deterministic-perturbation/'+i,raw,verifyProofV2(raw));
 }
 fs.writeFileSync(file,corpus.map(v=>JSON.stringify(v)).join('\n')+'\n');return corpus.length;
}
function run(){
 const corpus=[...fs.readFileSync(file,'utf8').trim().split('\n').map(JSON.parse),
  ...fs.readFileSync(path.join(__dirname,'curve-vectors.jsonl'),'utf8').trim().split('\n').map(JSON.parse)];
 const binary=process.argv[2]||path.join(__dirname,'target/debug/ping-proof');
 // The CLI is JSONL; embedded newlines are exercised through the native boundary.
 const single=corpus.filter(v=>!v.raw.includes('\n')&&!v.raw.includes('\r'));
 const q=spawnSync(binary,['--wire-v2'],{input:single.map(v=>v.raw).join('\n')+'\n',encoding:'utf8'});
 assert.equal(q.status,0,q.stderr);const results=q.stdout.trim().split('\n').map(JSON.parse);
 assert.equal(results.length,single.length);
 single.forEach((v,i)=>assert.equal(results[i],v.expected,'CLI '+v.name));
 const addon=require('./native/ping-proof.node');
 corpus.forEach(v=>{assert.equal(verifyProofV2(v.raw),v.expected,'Node '+v.name);assert.equal(addon.verifyProofV2(v.raw),v.expected,'NAPI '+v.name);});
 // These cannot travel through the UTF-8 JSONL CLI without being repaired by
 // Node's encoder. Exercise the original UTF-16 at the actual native boundary.
 const units=[0xd800,0xdbff,0xdc00,0xdfff];
 const nativeOnly=units.map(unit=>({name:'raw-unpaired-surrogate/'+unit.toString(16),raw:'{"version":"'+VERSION+'","kind":"evidence","claim_refs":[],"immutable_refs":[{"id":"'+String.fromCharCode(unit)+'","bytes_base64":""}]}',expected:'malformed_input'}));
 nativeOnly.forEach(v=>{assert.equal(verifyProofV2(v.raw),v.expected,'Node '+v.name);assert.equal(addon.verifyProofV2(v.raw),v.expected,'NAPI '+v.name);});
 return {version:VERSION,vectors:corpus.length,native_only_vectors:nativeOnly.length,cli_vectors:single.length,node_napi_failures:0,cli_failures:0};
}
if(require.main===module)console.log(JSON.stringify(process.argv[2]==='generate'?{generated:generate()}:run()));
module.exports={generate,run};
