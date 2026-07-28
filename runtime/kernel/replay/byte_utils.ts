/**
 * BYTE UTILITIES
 * 
 * Portable byte utilities for constitutional replay kernel.
 * 
 * Requirements:
 * - runtime-neutral (no Buffer, no Node crypto)
 * - pure Uint8Array
 * - standards-based APIs (TextEncoder, TextDecoder)
 * - works in browser, Node, Deno, Bun, WASM
 * 
 * PHASE 4: REMOVE NODE BUFFER AUTHORITY
 * Replaces Node Buffer with portable Uint8Array utilities.
 */

/**
 * Concatenate Uint8Arrays
 * Runtime-neutral implementation
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

/**
 * Encode string to UTF-8 bytes
 * Runtime-neutral implementation using TextEncoder
 */
export function utf8Encode(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

/**
 * Decode UTF-8 bytes to string
 * Runtime-neutral implementation using TextDecoder
 */
export function utf8Decode(bytes: Uint8Array): string {
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

/**
 * Encode bytes to hex string
 * Runtime-neutral implementation
 */
export function hexEncode(bytes: Uint8Array): string {
  const hexChars = '0123456789abcdef';
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    hex += hexChars[(byte >> 4) & 0x0f];
    hex += hexChars[byte & 0x0f];
  }
  return hex;
}

/**
 * Decode hex string to bytes
 * Runtime-neutral implementation
 */
export function hexDecode(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Encode bytes to base64url string
 * Runtime-neutral implementation
 */
export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Decode base64url string to bytes
 * Runtime-neutral implementation
 */
export function base64UrlDecode(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Compare two Uint8Arrays for equality
 * Runtime-neutral implementation
 */
export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
