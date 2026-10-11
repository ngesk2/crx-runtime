'use strict';

// Raw-boundary validation only. Signed-object serialization remains with the
// existing authorities. Duplicate names must be rejected BEFORE JSON.parse.
// https://www.rfc-editor.org/rfc/rfc8785#section-3.1
const MAX_BYTES = 1024 * 1024;
function fail() { throw new Error('malformed_input'); }
function unicode(s) {
  for (let i=0;i<s.length;i++) {
    const c=s.charCodeAt(i);
    if(c>=0xd800&&c<=0xdbff) { const next=s.charCodeAt(++i); if(!(next>=0xdc00&&next<=0xdfff))fail(); }
    else if(c>=0xdc00&&c<=0xdfff)fail();
  }
}
function parseStrictJson(raw) {
  if(Buffer.isBuffer(raw)) {
    if(raw.length>MAX_BYTES)fail();
    try { raw=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(raw); } catch(_) { fail(); }
  }
  if(typeof raw!=='string'||Buffer.byteLength(raw)>MAX_BYTES)fail();
  let pos=0;
  function ws(){while(/[\x20\t\r\n]/.test(raw[pos]||'\0'))pos++;}
  function string(){
    const start=pos;
    if(raw[pos++]!=='"')fail();
    while(pos<raw.length) {
      const c=raw[pos++];
      if(c==='"'){const s=JSON.parse(raw.slice(start,pos));unicode(s);return s;}
      if(c==='\\')pos++;
    }
    fail();
  }
  function value(depth){
    if(depth>128)fail();ws();
    if(raw[pos]==='"'){string();return;}
    if(raw[pos]==='{'){
      pos++;ws();const names=new Set();if(raw[pos]==='}'){pos++;return;}
      while(true){ws();const name=string();if(names.has(name)||name==='__proto__')fail();names.add(name);
        ws();if(raw[pos++]!==':')fail();value(depth+1);ws();const c=raw[pos++];if(c==='}')return;if(c!==',')fail();}
    }
    if(raw[pos]==='['){pos++;ws();if(raw[pos]===']'){pos++;return;}
      while(true){value(depth+1);ws();const c=raw[pos++];if(c===']')return;if(c!==',')fail();}}
    const match=/^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(raw.slice(pos));
    if(!match)fail();pos+=match[0].length;
    if(!['true','false','null'].includes(match[0])){
      const n=Number(match[0]);if(!Number.isFinite(n)||(Number.isInteger(n)&&!Number.isSafeInteger(n)))fail();
    }
  }
  value(0);ws();if(pos!==raw.length)fail();
  return JSON.parse(raw);
}
function canonicalBase64(s){return typeof s==='string'&&/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s)&&Buffer.from(s,'base64').toString('base64')===s;}
function fields(value,allowed){return value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===allowed.length&&allowed.every(k=>Object.hasOwn(value,k));}
module.exports={parseStrictJson,canonicalBase64,fields,MAX_BYTES};
