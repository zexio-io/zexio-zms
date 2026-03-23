import { createHmac, randomBytes } from 'node:crypto';
import { getGlobalMasterKey } from './index.js';

/**
 * ZMS Recovery Key Module (Zero-Knowledge)
 * Model 1: User holds the physical key (Derived TMK Wrapped).
 */

/**
 * Generates a high-entropy Recovery Key for an organization.
 * This key IS the Tenant Master Key (TMK) in a human-readable format,
 * or the data needed to regenerate it if the Global Master Key is lost.
 */
export function generateRecoveryKey(orgId: string, tmkSalt: string): string {
  const globalMasterKey = getGlobalMasterKey();
  // The Recovery Key for the user is essentially the raw TMK.
  // If we lose GlobalMasterKey, the user provides this string to restore access.
  const tmk = createHmac('sha256', globalMasterKey).update(tmkSalt).digest('hex');
  
  // Format as ZMS-REC-<ORG>-<TMK_PART> for UX
  return `ZMS-REC-${orgId.slice(0, 8)}-${tmk}`;
}

/**
 * Validates a recovery key and returns the TMK.
 */
export function verifyRecoveryKey(orgId: string, recoveryKey: string): string {
  if (!recoveryKey.startsWith(`ZMS-REC-${orgId.slice(0, 8)}-`)) {
    throw new Error("Invalid Recovery Key format for this organization.");
  }
  
  return recoveryKey.split('-').pop()!;
}
