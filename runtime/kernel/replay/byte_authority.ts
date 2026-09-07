/**
 * BYTE AUTHORITY
 *
 * Single canonical source for portable byte operations in the constitutional
 * replay kernel.  Supersedes the ad-hoc helpers that were scattered across
 * byte_utils.ts — that file is being converted to re-export from here.
 *
 * Requirements:
 * - runtime-neutral (no Buffer, no Node crypto)
 * - pure Uint8Array
 * - standards-based APIs (TextEncoder, TextDecoder, btoa, atob)
 * - works in browser, Node, Deno, Bun, WASM
 */

// ---------------------------------------------------------------------------
// UTF-8
// ---------------------------------------------------------------------------

/**
 * Encode a string to UTF-8 bytes.
 * Runtime-neutral via TextEncoder (available in all target environments).
 */
export function encodeUtf8(text: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(text);
}

/**
 * Decode UTF-8 bytes to a string.
 * Runtime-neutral via TextDecoder.
 */
export function decodeUtf8(bytes: Uint8Array): string {
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

// ---------------------------------------------------------------------------
// Hex
// ---------------------------------------------------------------------------

const HEX_CHARS = '0123456789abcdef';

/**
 * Encode bytes to a lowercase hex string.
 */
export function encodeHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    hex += HEX_CHARS[(byte >> 4) & 0x0f];
    hex += HEX_CHARS[byte & 0x0f];
  }
  return hex;
}

/**
 * Decode a hex string to bytes.
 * Throws if the input has an odd length.
 */
export function decodeHex(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error(`Invalid hex string: odd length (${hex.length})`);
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// ---------------------------------------------------------------------------
// Base64 (standard)
// ---------------------------------------------------------------------------

/**
 * Encode bytes to a standard base64 string (with padding).
 */
export function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decode a standard base64 string to bytes.
 */
export function decodeBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ---------------------------------------------------------------------------
// Base64-URL (no padding)
// ---------------------------------------------------------------------------

/**
 * Encode bytes to a base64url string (no padding, RFC 4648 §5).
 */
export function encodeBase64Url(bytes: Uint8Array): string {
  return encodeBase64(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Decode a base64url string to bytes.
 */
export function decodeBase64Url(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    '=',
  );
  return decodeBase64(padded);
}

// ---------------------------------------------------------------------------
// Concatenation
// ---------------------------------------------------------------------------

/**
 * Concatenate an arbitrary number of Uint8Arrays into a single Uint8Array.
 */
export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

/**
 * Compare two Uint8Arrays for byte-wise equality.
 */
export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Class facade (backward-compat with callers that expected `ByteAuthority`)
// ---------------------------------------------------------------------------

/**
 * Static facade over the standalone functions above.
 *
 * Every method is identical to the corresponding free function — callers
 * should prefer the free functions directly; the class exists solely for
 * callers that already import a "ByteAuthority" namespace.
 */
export class ByteAuthority {
  static readonly encodeUtf8 = encodeUtf8;
  static readonly decodeUtf8 = decodeUtf8;
  static readonly encodeHex = encodeHex;
  static readonly decodeHex = decodeHex;
  static readonly encodeBase64 = encodeBase64;
  static readonly decodeBase64 = decodeBase64;
  static readonly encodeBase64Url = encodeBase64Url;
  static readonly decodeBase64Url = decodeBase64Url;
  static readonly concatBytes = concatBytes;
  static readonly bytesEqual = bytesEqual;
}
