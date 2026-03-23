import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../src/crypto';

describe('ZMS Crypto Engine (AES-256-GCM)', () => {
  const MASTER_KEY = 'super-secret-master-key';
  const PLAINTEXT = 'Sensitive data that needs protection';

  it('should encrypt and decrypt correctly', () => {
    const encrypted = encrypt(PLAINTEXT, MASTER_KEY);
    const decrypted = decrypt(encrypted, MASTER_KEY);
    
    expect(decrypted).toBe(PLAINTEXT);
    expect(encrypted).not.toContain(PLAINTEXT);
  });

  it('should throw error if Master Key is missing', () => {
    expect(() => encrypt(PLAINTEXT, '')).toThrow('Master Key is required');
    expect(() => decrypt('anybola', '')).toThrow('Master Key is required');
  });

  it('should throw error if format is invalid', () => {
    expect(() => decrypt('invalid:format', MASTER_KEY)).toThrow('Invalid encrypted blob format');
  });

  it('should fail if Master Key is incorrect', () => {
    const encrypted = encrypt(PLAINTEXT, MASTER_KEY);
    expect(() => decrypt(encrypted, 'wrong-key')).toThrow('Decryption failed');
  });

  it('should fail if ciphertext is tampered', () => {
    const encrypted = encrypt(PLAINTEXT, MASTER_KEY);
    const parts = encrypted.split(':');
    // Change a character in the ciphertext
    const tamperedCiphertext = parts[2].substring(0, parts[2].length - 1) + (parts[2].endsWith('A') ? 'B' : 'A');
    const tamperedBlob = `${parts[0]}:${parts[1]}:${tamperedCiphertext}`;
    
    expect(() => decrypt(tamperedBlob, MASTER_KEY)).toThrow('Decryption failed');
  });

  it('should fail if IV is tampered', () => {
    const encrypted = encrypt(PLAINTEXT, MASTER_KEY);
    const parts = encrypted.split(':');
    const tamperedIV = parts[0].substring(0, parts[0].length - 1) + (parts[0].endsWith('A') ? 'B' : 'A');
    const tamperedBlob = `${tamperedIV}:${parts[1]}:${parts[2]}`;
    
    expect(() => decrypt(tamperedBlob, MASTER_KEY)).toThrow('Decryption failed');
  });

  it('should fail if Auth Tag is tampered', () => {
    const encrypted = encrypt(PLAINTEXT, MASTER_KEY);
    const parts = encrypted.split(':');
    const authTag = Buffer.from(parts[1], 'base64');
    // Tamper with the first byte of the auth tag
    authTag[0] = authTag[0] ^ 0xFF; 
    const tamperedTag = authTag.toString('base64');
    const tamperedBlob = `${parts[0]}:${tamperedTag}:${parts[2]}`;
    
    expect(() => decrypt(tamperedBlob, MASTER_KEY)).toThrow('Decryption failed');
  });
});
