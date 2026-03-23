import { describe, it, expect } from 'vitest';
import { ThresholdProvider } from './threshold-provider.js';

describe('ThresholdProvider (Shamir Secret Sharing)', () => {
  const SECRET = "zms_master_key_super_secret_123";

  it('should split and reconstruct a secret with a 3-of-5 threshold', () => {
    const n = 5;
    const t = 3;
    const shards = ThresholdProvider.split(SECRET, n, t);
    
    expect(shards.length).toBe(n);
    
    // Test with 3 random shards
    const quorum = [shards[0], shards[2], shards[4]];
    const reconstructed = ThresholdProvider.reconstruct(quorum);
    
    expect(reconstructed).toBe(SECRET);
  });

  it('should fail if threshold is not met (2-of-5)', () => {
    const n = 5;
    const t = 3;
    const shards = ThresholdProvider.split(SECRET, n, t);
    
    const partial = [shards[0], shards[4]];
    
    // In SSS, insufficient shards result in garbage data, not necessarily an error,
    // but we check that it's NOT the secret.
    const reconstructed = ThresholdProvider.reconstruct(partial);
    expect(reconstructed).not.toBe(SECRET);
  });

  it('should work with different data lengths', () => {
    const longSecret = "a".repeat(100);
    const shards = ThresholdProvider.split(longSecret, 3, 2);
    const reconstructed = ThresholdProvider.reconstruct([shards[0], shards[2]]);
    expect(reconstructed).toBe(longSecret);
  });
});
