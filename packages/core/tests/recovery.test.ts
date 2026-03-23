import { describe, it, expect, beforeAll } from 'vitest';
import { generateRecoveryKey, verifyRecoveryKey } from '../src/recovery.js';
import { bootstrap } from '../src/index.js';

describe('ZMS Recovery Key (Self-Custody)', () => {
  const ORG_ID = 'org_12345678';
  const TMK_SALT = 'super-secret-salt';

  beforeAll(async () => {
    process.env.MASTER_KEY = 'global-master-key';
    await bootstrap();
  });

  it('should generate a valid recovery key matching the ZMS format', () => {
    const recoveryKey = generateRecoveryKey(ORG_ID, TMK_SALT);
    expect(recoveryKey).toMatch(/^ZMS-REC-org_1234/);
    expect(recoveryKey.split('-')).toHaveLength(4);
  });

  it('should extract the exact TMK from a valid recovery key', () => {
    const recoveryKey = generateRecoveryKey(ORG_ID, TMK_SALT);
    const tmk = verifyRecoveryKey(ORG_ID, recoveryKey);
    
    // Manual derivation to verify
    const expectedTmk = recoveryKey.split('-').pop();
    expect(tmk).toBe(expectedTmk);
  });

  it('should throw an error if the recovery key is for a different organization', () => {
    const recoveryKey = generateRecoveryKey(ORG_ID, TMK_SALT);
    expect(() => verifyRecoveryKey('wrong_org', recoveryKey)).toThrow('Invalid Recovery Key format');
  });
});
