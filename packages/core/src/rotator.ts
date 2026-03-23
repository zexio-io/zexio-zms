import { db } from './db.js';
import { secrets, environments, projects, organization } from './schema.js';
import { rotateSecret } from './repository.js';
import { eq, and, lt } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';

/**
 * Initiates a key rotation for an organization.
 * Generates a new salt and moves the current one to history.
 */
export async function startOrganizationRotation(organizationId: string) {
  return await db.transaction(async (tx) => {
    const [org] = await tx.select().from(organization).where(eq(organization.id, organizationId));
    if (!org) throw new Error('Organization not found');

    const newSalt = randomBytes(32).toString('hex');
    const oldSalt = org.tmkSalt;
    
    // keyHistory is JSONB, we store it as an array of versions
    const history = (org.keyHistory as any[]) || [];
    const currentVersion = history.length + 1;

    const newHistory = [
      ...history,
      { version: currentVersion, salt: oldSalt, status: 'retiring', rotatedAt: new Date() }
    ].slice(-3); // Cap at 3 versions per ZUI audit

    await tx.update(organization)
      .set({
        tmkSalt: newSalt,
        keyHistory: newHistory,
        // We'll use metadata to track active rotation status
        metadata: JSON.stringify({ 
          ...JSON.parse(org.metadata || '{}'),
          rotation: {
            active: true,
            targetVersion: currentVersion + 1,
            startedAt: new Date(),
            lastProgressAt: new Date()
          }
        })
      })
      .where(eq(organization.id, organizationId));

    return { success: true, newVersion: currentVersion + 1 };
  });
}

/**
 * Performs a batch of secret re-encryptions for an organization.
 */
export async function performRotationBatch(organizationId: string, masterKey: string, limit: number = 100) {
  const [org] = await db.select().from(organization).where(eq(organization.id, organizationId));
  if (!org) throw new Error('Organization not found');

  const metadata = JSON.parse(org.metadata || '{}');
  if (!metadata.rotation?.active) return { finished: true, count: 0 };

  const targetVersion = metadata.rotation.targetVersion;
  const history = org.keyHistory as any[];
  const oldSalt = history[history.length - 1].salt;
  const newSalt = org.tmkSalt;

  // 1. Fetch pending secrets
  const pendingSecrets = await db.select({ id: secrets.id })
    .from(secrets)
    .innerJoin(environments, eq(secrets.environmentId, environments.id))
    .innerJoin(projects, eq(environments.projectId, projects.id))
    .where(and(
      eq(projects.organizationId, organizationId),
      lt(secrets.keyVersion, targetVersion)
    ))
    .limit(limit);

  let count = 0;
  for (const s of pendingSecrets) {
    await rotateSecret(s.id, oldSalt, newSalt, targetVersion, masterKey);
    count++;
  }

  // 2. Update Heartbeat
  await db.update(organization)
    .set({
      metadata: JSON.stringify({
        ...metadata,
        rotation: { ...metadata.rotation, lastProgressAt: new Date() }
      })
    })
    .where(eq(organization.id, organizationId));

  return { finished: pendingSecrets.length < limit, count };
}
