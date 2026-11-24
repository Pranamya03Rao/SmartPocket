import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_VERSION = 1;

let encryptionKey;

/**
 * Initialize crypto with the base64-encoded 32-byte key from env.
 * Must be called once at startup.
 */
export function initCrypto(base64Key) {
  encryptionKey = Buffer.from(base64Key, 'base64');
  if (encryptionKey.length !== 32) {
    throw new Error('ENCRYPTION_KEY must decode to exactly 32 bytes');
  }
}

/**
 * Encrypt plaintext using AES-256-GCM.
 * Output format: v{version}:{iv_b64}:{authTag_b64}:{ciphertext_b64}
 * The version prefix enables future key rotation.
 */
export function encrypt(plaintext) {
  if (!plaintext) return plaintext;
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `v${KEY_VERSION}:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * Decrypt cipherstring produced by encrypt().
 * Validates version prefix for future key rotation support.
 */
export function decrypt(cipherstring) {
  if (!cipherstring) return cipherstring;
  // If the value doesn't look encrypted (no version prefix), return as-is
  if (!cipherstring.startsWith('v')) return cipherstring;

  const parts = cipherstring.split(':');
  if (parts.length !== 4) throw new Error('Invalid encrypted format');

  const version = parseInt(parts[0].slice(1), 10);
  if (version !== KEY_VERSION) {
    throw new Error(`Unsupported key version: ${version}. Current: ${KEY_VERSION}`);
  }

  const iv = Buffer.from(parts[1], 'base64');
  const authTag = Buffer.from(parts[2], 'base64');
  const encrypted = Buffer.from(parts[3], 'base64');

  const decipher = createDecipheriv(ALGORITHM, encryptionKey, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted, undefined, 'utf8') + decipher.final('utf8');
}
