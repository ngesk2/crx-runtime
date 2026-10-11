'use strict';
const C=require('./commissioning_contract');
const {parseStrictJson,canonicalBase64,fields}=require('./strict_wire_json');
// This receives original request bytes. Passing an Express-parsed object cannot
// prove duplicate-field rejection and is deliberately unsupported.
function parseSubmission(raw,checkIntent){
  const s=parseStrictJson(raw);
  C.requireThat(fields(s,['intent','payload','metadata','signature']), 'invalid_wire_fields');
  checkIntent(s.intent);C.assertJson(s.payload);C.assertJson(s.metadata);
  C.requireThat(canonicalBase64(s.signature)&&Buffer.from(s.signature,'base64').length===64,'invalid_signature');
  return s;
}
function parseCommissioningSubmission(raw){return parseSubmission(raw,C.checkIntent);}
function parseCommandSubmission(raw){return parseSubmission(raw,C.checkCommandIntent);}
module.exports={parseCommissioningSubmission,parseCommandSubmission};
