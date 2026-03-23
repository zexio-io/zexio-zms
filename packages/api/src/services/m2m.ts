import { db, serviceTokens, OrchestrationService } from '@zexio/zms-core';
import { eq, and } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';

export class M2MService {
  /**
   * Hashes a secret with an organization-specific salt.
   * Mandated by ZUI Audit for Zero-Knowledge storage.
   */
  private static hashSecret(secret: string, orgId: string): string {
    return OrchestrationService.hashToken(secret, orgId);
  }

  /**
   * Generates a secure random token with the mandated prefix.
   */
  static generateServiceToken(): string {
    const entropy = randomBytes(24).toString('hex');
    return `zms_st_${entropy}`;
  }

  /**
   * Verifies a Service Token and returns its scope.
   * Supports both legacy (org-salted) and new (token-only lookup) flows.
   */
  static async verifyServiceToken(rawToken: string, orgId?: string) {
    if (!rawToken.startsWith('zms_st_')) return null;

    let result;

    if (orgId) {
      // 1. Legacy/Explicit Lookup (Hashed with OrgId)
      const tokenHash = this.hashSecret(rawToken, orgId);
      result = await db.query.serviceTokens.findFirst({
        where: and(
          eq(serviceTokens.tokenHash, tokenHash),
          eq(serviceTokens.organizationId, orgId)
        ),
        with: {
          project: true,
          service: true,
          environment: true,
        }
      });
    }

    if (!result) {
      // 2. Token-Only Lookup (Universal hash)
      const lookupHash = createHash('sha256').update(rawToken).digest('hex');
      result = await db.query.serviceTokens.findFirst({
        where: eq(serviceTokens.lookupHash, lookupHash),
        with: {
          project: true,
          service: true,
          environment: true,
        }
      });
    }

    if (result) {
      // Update last used
      await db.update(serviceTokens)
        .set({ lastUsedAt: new Date() })
        .where(eq(serviceTokens.id, result.id));
    }

    return result;
  }
}
