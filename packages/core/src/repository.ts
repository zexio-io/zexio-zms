import { createHmac, pbkdf2Sync } from 'node:crypto';
import { db } from './db.js';
import { secrets } from './schema.js';
import { encrypt, decrypt } from './crypto.js';
import { eq, and } from 'drizzle-orm';

/**
 * Generates a deterministic Blind Index for a secret path using HMAC-SHA-256.
 */
export function generatePathIndex(path: string, masterKey: string, salt?: string): string {
  const key = salt ? pbkdf2Sync(masterKey, salt, 1000, 32, 'sha256') : masterKey;
  return createHmac('sha256', key)
    .update(path)
    .digest('base64');
}

/**
 * Saves or updates an encrypted secret in the database, scoped to an environment.
 */
export async function saveSecret(
  path: string, 
  plaintext: string, 
  masterKey: string, 
  serviceId: string,
  environmentId: string, 
  salt?: string,
  metadata: any = {}
) {
  const indexedPath = generatePathIndex(path, masterKey, salt);
  const encryptedPath = encrypt(path, masterKey, salt);
  const encryptedBlob = encrypt(plaintext, masterKey, salt);

  await db.insert(secrets)
    .values({
      serviceId,
      environmentId,
      path: indexedPath,
      encryptedPath,
      encryptedBlob,
      keyVersion: 1, // Default for now
      metadata,
    })
    .onConflictDoUpdate({
      target: [secrets.path, secrets.serviceId, secrets.environmentId],
      set: {
        encryptedPath,
        encryptedBlob,
        metadata,
        updatedAt: new Date(),
      }
    });

  return { path: indexedPath, status: 'saved' };
}

/**
 * Retrieves and decrypts a secret from the database.
 */
export async function getSecret(
  path: string, 
  masterKey: string, 
  serviceId: string,
  environmentId: string, 
  salt?: string
): Promise<string | null> {
  const indexedPath = generatePathIndex(path, masterKey, salt);
  
  const result = await db.query.secrets.findFirst({
    where: (secrets, { and, eq }) => and(
      eq(secrets.path, indexedPath),
      eq(secrets.serviceId, serviceId),
      eq(secrets.environmentId, environmentId)
    )
  });

  if (!result) return null;

  return decrypt(result.encryptedBlob, masterKey, salt);
}

/**
 * Lists and decrypts all secrets for a given context.
 */
export async function listSecrets(
  masterKey: string,
  serviceId: string,
  environmentId: string,
  salt?: string
): Promise<Record<string, string>> {
  const results = await db.query.secrets.findMany({
    where: (secrets, { and, eq }) => and(
      eq(secrets.serviceId, serviceId),
      eq(secrets.environmentId, environmentId)
    )
  });

  const decrypted: Record<string, string> = {};

  for (const item of results) {
    try {
      const path = decrypt(item.encryptedPath, masterKey, salt);
      const value = decrypt(item.encryptedBlob, masterKey, salt);
      decrypted[path] = value;
    } catch (error) {
      console.warn(`⚠️ ZMS Core: Failed to decrypt secret ${item.path}. Version mismatch or salt issue.`);
    }
  }

  return decrypted;
}

export async function deleteSecret(path: string, masterKey: string, serviceId: string, environmentId: string, salt?: string) {
  const indexedPath = generatePathIndex(path, masterKey, salt);
  
  await db.delete(secrets)
    .where(and(
      eq(secrets.path, indexedPath),
      eq(secrets.serviceId, serviceId),
      eq(secrets.environmentId, environmentId)
    ));
    
  return { status: 'deleted' };
}
