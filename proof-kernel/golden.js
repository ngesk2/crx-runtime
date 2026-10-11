'use strict';
// Node remains the byte/ID reference. Private keys are ephemeral and never saved.
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const {CanonicalBytes,CanonicalAuthority}=require('../ping-runtime/authorities/canonical_authority');
const {identityAuthority}=require('../ping-runtime/authorities/identity_authority');
const digest=b=>CanonicalAuthority.hashBytes(b);
const strictBase64=s=>typeof s==='string'&&/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s);
function reference(r){
 if(!r||typeof r!=='object')return 'malformed_input';
 if(r.kind==='signature'){
  if(![r.bytes_base64,r.public_key_base64,r.signature_base64].every(strictBase64))return 'malformed_input';
  const key=Buffer.from(r.public_key_base64,'base64'),sig=Buffer.from(r.signature_base64,'base64');
  if(key.length!==32||sig.length!==64)return 'malformed_input';
  const spki=Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),key]);
  try{return crypto.verify(null,Buffer.from(r.bytes_base64,'base64'),crypto.createPublicKey({key:spki,format:'der',type:'spki'}),sig)?'valid':'invalid_signature';}catch{return 'invalid_signature';}
 }
 if(r.kind==='digest'){
  if(!strictBase64(r.bytes_base64)||!/^[a-f0-9]{64}$/.test(r.expected_digest))return 'malformed_input';
  return digest(Buffer.from(r.bytes_base64,'base64'))===r.expected_digest?'valid':'digest_mismatch';
 }
 if(r.kind==='evidence'){
  const refs=new Map(),seen=new Set();
  for(const v of r.immutable_refs){if(!v.id||refs.has(v.id)||!strictBase64(v.bytes_base64))return 'malformed_input';refs.set(v.id,Buffer.from(v.bytes_base64,'base64'));}
  for(const v of r.claim_refs){if(!v.id||seen.has(v.id)||!/^[a-f0-9]{64}$/.test(v.digest))return 'malformed_input';seen.add(v.id);if(!refs.has(v.id))return 'missing_evidence_reference';if(digest(refs.get(v.id))!==v.digest)return 'evidence_digest_mismatch';}
  return 'valid';
 }
 return 'malformed_input';
}
function run(binary){
 const vectors=fs.readFileSync(path.join(__dirname,'golden-vectors.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
 const input=vectors.map(v=>JSON.stringify(v.request)).join('\n')+'\n{bad json}\n';
 const result=spawnSync(binary,[],{input,encoding:'utf8'});assert.equal(result.status,0,result.stderr);
 const actual=result.stdout.trim().split('\n').map(JSON.parse);assert.equal(actual.length,vectors.length+1);
 for(let i=0;i<vectors.length;i++){const v=vectors[i];assert.equal(reference(v.request),v.expected,v.name+' Node');assert.equal(actual[i],v.expected,v.name+' Rust');
  if(v.object_id){const exact=Buffer.from(v.identity_bytes_base64,'base64');const expectedId=v.identity_context?require('../gateway/constitutional-dist/identity-authority').IdentityAuthority.generateId('object',v.identity_context):identityAuthority.generateFromCanonicalHash(exact,'object');assert.equal(v.object_id,expectedId);assert.equal(v.object_id,'object_'+v.request.expected_digest.slice(0,16));}}
 assert.equal(actual.at(-1),'malformed_input');
 return {vectors:vectors.length,malformed_json:1,parity:'PASS',object_id_vectors:vectors.filter(v=>v.object_id).length};
}
if(require.main===module)console.log(JSON.stringify(run(process.argv[2]||path.join(__dirname,'target/debug/ping-proof'))));
module.exports={reference,run};
