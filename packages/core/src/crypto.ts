import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM
const AUTH_TAG_LENGTH = 16;
const DIGEST = 'sha256';
const STATIC_SALT = 'zms-static-salt'; // Default fallback salt
const ITERATIONS = 100000;
const KEY_LEN = 32;

const MAX_CACHE_SIZE = 100;
const keyCache = new Map<string, Buffer>();

/**
 * Derives a 256-bit key from the Master Key and an optional Salt.
 * Optimization: Uses an in-memory cache to avoid expensive 100k PBKDF2 iterations.
 */
function deriveKey(masterKey: string, salt: string = STATIC_SALT): Buffer {
  const cacheKey = `${masterKey}:${salt}`;
  
  if (keyCache.has(cacheKey)) {
    return keyCache.get(cacheKey)!;
  }

  const derived = pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LEN, DIGEST);
  
  // Basic FIFO eviction for memory safety
  if (keyCache.size >= MAX_CACHE_SIZE) {
    const firstKey = keyCache.keys().next().value;
    if (firstKey !== undefined) {
      keyCache.delete(firstKey);
    }
  }
  
  keyCache.set(cacheKey, derived);
  return derived;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a base64 string formatted as `iv:authTag:ciphertext`.
 */
export function encrypt(plaintext: string, masterKey: string, salt?: string): string {
  if (!masterKey) throw new Error('Master Key is required');
  
  const key = deriveKey(masterKey, salt);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * Decrypts a base64 blob formatted as `iv:authTag:ciphertext`.
 */
export function decrypt(encryptedBlob: string, masterKey: string, salt?: string): string {
  if (!masterKey) throw new Error('Master Key is required');
  
  const [ivBase64, authTagBase64, ciphertextBase64] = encryptedBlob.split(':');
  
  if (!ivBase64 || !authTagBase64 || !ciphertextBase64) {
    throw new Error('Invalid encrypted blob format');
  }
  
  const key = deriveKey(masterKey, salt);
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const ciphertext = Buffer.from(ciphertextBase64, 'base64');
  
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  try {
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error('Decryption failed: Identity or Integrity could not be verified');
  }
}
