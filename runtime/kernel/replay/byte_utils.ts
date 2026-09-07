/**
 * BYTE UTILITIES
 *
 * Compatibility facade over ByteAuthority (byte_authority.ts).
 *
 * This file no longer contains standalone implementations.  Every helper has
 * been unified into the single canonical source — ByteAuthority — and the
 * legacy names below are re-exported aliases so existing importers continue to
 * work unchanged.
 *
 * Legacy-name map:
 *   utf8Encode        -> encodeUtf8
 *   utf8Decode        -> decodeUtf8
 *   hexEncode         -> encodeHex
 *   hexDecode         -> decodeHex
 *   concatBytes       -> concatBytes (same name)
 *   base64UrlEncode   -> encodeBase64Url
 *   base64UrlDecode   -> decodeBase64Url
 *   bytesEqual        -> bytesEqual (same name)
 *
 * PHASE 4: REMOVE NODE BUFFER AUTHORITY
 * Replaces Node Buffer with portable Uint8Array utilities.
 */

import {
  encodeUtf8,
  decodeUtf8,
  encodeHex as _encodeHex,
  decodeHex as _decodeHex,
  encodeBase64Url as _encodeBase64Url,
  decodeBase64Url as _decodeBase64Url,
  concatBytes as _concatBytes,
  bytesEqual as _bytesEqual,
} from './byte_authority';

/**
 * Concatenate Uint8Arrays.
 */
export const concatBytes = _concatBytes;

/**
 * Encode string to UTF-8 bytes.
 */
export const utf8Encode = encodeUtf8;

/**
 * Decode UTF-8 bytes to string.
 */
export const utf8Decode = decodeUtf8;

/**
 * Encode bytes to hex string (lowercase).
 */
export const hexEncode = _encodeHex;

/**
 * Decode hex string to bytes.
 * Throws if the input has an odd length.
 */
export const hexDecode = _decodeHex;

/**
 * Encode bytes to base64url string (no padding).
 */
export const base64UrlEncode = _encodeBase64Url;

/**
 * Decode base64url string to bytes.
 */
export const base64UrlDecode = _decodeBase64Url;

/**
 * Compare two Uint8Arrays for equality.
 */
export const bytesEqual = _bytesEqual;
