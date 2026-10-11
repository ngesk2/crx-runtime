'use strict';
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');const {performance}=require('node:perf_hooks');
const {reference}=require('../golden');
const addon=require(path.resolve(process.argv[2]||path.join(__dirname,'ping-proof.node')));
const vectors=fs.readFileSync(path.join(__dirname,'../golden-vectors.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
for(const v of vectors)assert.equal(addon.verifyProof(JSON.stringify(v.request)),reference(v.request),v.name);
assert.equal(addon.verifyProof('{bad json}'),'malformed_input');
// Same prebuilt wire requests, one process, warm-up, repeated batches. This measures
// the JSON/base64 bridge too and does not justify a production language rewrite.
const runs=1000, prepared=vectors.map(v=>({r:v.request,json:JSON.stringify(v.request)}));
for(let i=0;i<100;i++)for(const v of prepared){reference(v.r);addon.verifyProof(v.json);}
function elapsed(fn){const t=performance.now();for(let i=0;i<runs;i++)for(const v of prepared)fn(v);return performance.now()-t;}
const samples=[];for(let i=0;i<5;i++){if(i%2){const rust=elapsed(v=>addon.verifyProof(v.json));const node=elapsed(v=>reference(v.r));samples.push({node_ms:node,rust_ms:rust});}else{const node=elapsed(v=>reference(v.r));const rust=elapsed(v=>addon.verifyProof(v.json));samples.push({node_ms:node,rust_ms:rust});}}
const median=key=>samples.map(s=>s[key]).sort((a,b)=>a-b)[2];
const result={parity:'PASS',vectors:vectors.length,malformed_json:1,platform:process.platform,architecture:process.arch,node:process.version,
 calls_per_sample:runs*prepared.length,samples,node_median_ms:median('node_ms'),rust_median_ms:median('rust_ms'),
 speed_ratio_node_over_rust:median('node_ms')/median('rust_ms'),scope:'Synthetic mixed verification requests including JSON/base64 FFI; not production throughput.'};
console.log(JSON.stringify(result,null,2));
