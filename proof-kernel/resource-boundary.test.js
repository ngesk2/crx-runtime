'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {spawn,spawnSync}=require('node:child_process');
const path=require('node:path');
const {verifyProofV2,VERSION}=require('./wire-v2');
const native=require('./native/ping-proof.node');
const binary=path.join(__dirname,'target/debug/ping-proof'),MAX=1024*1024;
const request=JSON.stringify({version:VERSION,kind:'digest',bytes_base64:'',expected_digest:'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'});
const pad=(s,n)=>s+' '.repeat(n-Buffer.byteLength(s));
function cli(input,args=['--wire-v2']){
 const r=spawnSync(binary,args,{input,encoding:'utf8',timeout:5000,maxBuffer:1024*1024});
 assert.equal(r.status,0,r.stderr||String(r.error));return r.stdout.trim()?r.stdout.trim().split('\n').map(JSON.parse):[];
}
test('max-1, max and max+1 use UTF-8 bytes and preserve CRLF/EOF behavior',()=>{
 for(const n of [MAX-1,MAX,MAX+1]){
  const raw=pad(request,n),expected=n<=MAX?'valid':'malformed_input';
  assert.equal(verifyProofV2(raw),expected);assert.equal(native.verifyProofV2(raw),expected);
  assert.deepEqual(cli(raw),[expected]);assert.deepEqual(cli(raw+'\n'),[expected]);assert.deepEqual(cli(raw+'\r\n'),[expected]);
 }
 assert.deepEqual(cli(''),[]);assert.deepEqual(cli('\n'),['malformed_input']);
});
test('multibyte strings, malformed Unicode and simultaneous violations agree',()=>{
 const unicode=JSON.stringify({version:VERSION,kind:'evidence',claim_refs:[],immutable_refs:[{id:'é🦀𐐀',bytes_base64:''}]});
 for(const n of [MAX-1,MAX,MAX+1]){
  const raw=pad(unicode,n),expected=n<=MAX?'valid':'malformed_input';
  assert.equal(verifyProofV2(raw),expected);assert.equal(native.verifyProofV2(raw),expected);assert.deepEqual(cli(raw+'\n'),[expected]);
 }
 for(const raw of ['{',request.replace('"kind":','"kind":"digest","kind":'),request+String.fromCharCode(0xd800),pad('{',MAX+1)]){
  assert.equal(verifyProofV2(raw),'malformed_input');assert.equal(native.verifyProofV2(raw),'malformed_input');
 }
 assert.deepEqual(cli(Buffer.from([0xff,0x0a])),['malformed_input']);
});
test('oversized unterminated input is rejected while stdin remains open',async()=>{
 const child=spawn(binary,['--wire-v2'],{stdio:['pipe','pipe','pipe']});let timer;
 try{
  const result=new Promise((resolve,reject)=>{
   child.stdout.once('data',data=>resolve(data.toString().trim()));child.once('error',reject);
   timer=setTimeout(()=>reject(new Error('reader waited for newline/EOF after the byte limit')),1500);
  });
  child.stdin.on('error',()=>{});child.stdin.write('x'.repeat(MAX+1));
  assert.equal(await result,'"malformed_input"');
 }finally{clearTimeout(timer);child.stdin.destroy();child.kill();}
});
