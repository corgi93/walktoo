import { gcm } from '@noble/ciphers/aes.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import * as ExpoCrypto from 'expo-crypto';

const ENC_PREFIX = 'enc:v1:';

function b64encode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function b64decode(str: string): Uint8Array {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derive a 32-byte AES-256 key per couple using HKDF-SHA256.
 * IKM = EXPO_PUBLIC_AES_KEY, salt = coupleId UTF-8 bytes, info = 'pairwalk-v1'
 * Both partners derive the same key (same coupleId), so they can decrypt each other.
 */
export function deriveKey(coupleId: string): Uint8Array {
  const appSecret = process.env.EXPO_PUBLIC_AES_KEY ?? '';
  const ikm = new TextEncoder().encode(appSecret);
  const salt = new TextEncoder().encode(coupleId);
  const info = new TextEncoder().encode('pairwalk-v1');
  return hkdf(sha256, ikm, salt, info, 32);
}

/**
 * Encrypt a plaintext string.
 * Returns 'enc:v1:<base64-nonce>:<base64-ciphertext+tag>'
 * Empty strings are returned as-is (no point encrypting nothing).
 */
export function encryptField(plaintext: string, key: Uint8Array): string {
  if (!plaintext) return plaintext;
  const nonce = ExpoCrypto.getRandomBytes(12);
  const aes = gcm(key, nonce);
  const ciphertext = aes.encrypt(new TextEncoder().encode(plaintext));
  return `${ENC_PREFIX}${b64encode(nonce)}:${b64encode(ciphertext)}`;
}

/**
 * Decrypt a field encrypted by encryptField.
 * Passes through plain strings that don't have the enc:v1: prefix (legacy data).
 */
export function decryptField(value: string, key: Uint8Array): string {
  if (!value || !value.startsWith(ENC_PREFIX)) return value;
  try {
    const rest = value.slice(ENC_PREFIX.length);
    const colonIdx = rest.indexOf(':');
    if (colonIdx === -1) return value;
    const nonce = b64decode(rest.slice(0, colonIdx));
    const ciphertext = b64decode(rest.slice(colonIdx + 1));
    const aes = gcm(key, nonce);
    const plainBytes = aes.decrypt(ciphertext);
    return new TextDecoder().decode(plainBytes);
  } catch {
    // Key mismatch or corrupt data — return as-is rather than crashing
    return value;
  }
}
