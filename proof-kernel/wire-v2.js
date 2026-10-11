'use strict';
const {parseStrictJson,canonicalBase64,fields}=require('../ping-runtime/runtime/strict_wire_json');
const {reference}=require('./golden');
const VERSION='ping.proof-wire@2';
function verifyProofV2(raw){
 try{
  const r=parseStrictJson(raw);if(r.version!==VERSION)return 'malformed_input';
  const common=['version','kind'];
  if(r.kind==='signature'){
   if(!fields(r,[...common,'bytes_base64','public_key_base64','signature_base64'])||![r.bytes_base64,r.public_key_base64,r.signature_base64].every(canonicalBase64))return 'malformed_input';
  }else if(r.kind==='digest'){
   if(!fields(r,[...common,'bytes_base64','expected_digest'])||!canonicalBase64(r.bytes_base64)||typeof r.expected_digest!=='string')return 'malformed_input';
  }else if(r.kind==='evidence'){
   if(!fields(r,[...common,'claim_refs','immutable_refs'])||!Array.isArray(r.claim_refs)||!Array.isArray(r.immutable_refs))return 'malformed_input';
   if(!r.claim_refs.every(x=>fields(x,['id','digest'])&&typeof x.id==='string'&&typeof x.digest==='string')||
      !r.immutable_refs.every(x=>fields(x,['id','bytes_base64'])&&typeof x.id==='string'&&canonicalBase64(x.bytes_base64)))return 'malformed_input';
  }else return 'malformed_input';
  return reference(r);
 }catch(_){return 'malformed_input';}
}
module.exports={VERSION,verifyProofV2};
