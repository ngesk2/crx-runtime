'use strict';
// Small-order encodings harvested from libsodium 1.0.20-RELEASE,
// ge25519_has_small_order (ISC; see COMMISSIONING_THIRD_PARTY_NOTICES.md).
// SHA256 of upstream ed25519_ref10.c:
// 4b4a0f1f285b5afcf03a21d5be65cbd5bf00cfc7ecc6d9741d8791a5631baad4
// This policy applies only to NEW commissioning keys, not historical proofs.
const SMALL_ORDER = Object.freeze([
  '00'.repeat(32), '01'+'00'.repeat(31),
  '26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc05',
  'c7176a703d4dd84fba3c0b760d10670f2a2053fa2c39ccc64ec7fd7792ac037a',
  'ec'+'ff'.repeat(30)+'7f', 'ed'+'ff'.repeat(30)+'7f', 'ee'+'ff'.repeat(30)+'7f',
]);
function isSmallOrder(raw) {
  if(raw.length!==32)return true;
  const point=Buffer.from(raw);point[31]&=0x7f;
  return SMALL_ORDER.includes(point.toString('hex'));
}
module.exports={isSmallOrder,SMALL_ORDER};
