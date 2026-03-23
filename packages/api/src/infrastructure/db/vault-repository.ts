import { db, secrets } from "@zexio/zms-core";
import { VaultRepository } from "../../domain/vault/repository.js";
import { Secret } from "../../domain/vault/entities.js";
import { eq, and } from "drizzle-orm";

export class DrizzleVaultRepository implements VaultRepository {
  async saveSecret(secret: Secret): Promise<void> {
    // Note: The actual insertion is usually handled by the core @zexio/zms-core saveSecret utility
    // But for a pure Repository pattern, we'd do it here if we weren't using the utility.
    // For now, this is a placeholder as SecretService calls the utility directly.
  }

  async getSecretByPath(envId: string, path: string): Promise<Secret | null> {
    const res = await db.query.secrets.findFirst({
      where: (s: any, { eq, and }: any) => and(eq(s.environmentId, envId), eq(s.path, path)),
    } as any);
    return res as Secret || null;
  }

  async deleteSecretByPath(envId: string, path: string): Promise<void> {
    await db.delete(secrets)
      .where(and(eq(secrets.environmentId, envId), eq(secrets.path, path)));
  }

  async listSecretsByEnv(envId: string): Promise<Secret[]> {
    const res = await db.query.secrets.findMany({
      where: (s: any, { eq }: any) => eq(s.environmentId, envId),
    } as any);

    return (res as any[]).map(r => ({
      id: r.id,
      environmentId: r.environmentId,
      path: r.path,
      encryptedPath: r.encryptedPath,
      encryptedBlob: r.encryptedBlob,
      keyVersion: r.keyVersion,
      metadata: r.metadata,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async listSecretsByContext(envId: string, serviceId: string): Promise<Secret[]> {
    const res = await db.query.secrets.findMany({
      where: (s: any, { eq, and }: any) => and(
        eq(s.environmentId, envId),
        eq(s.serviceId, serviceId)
      ),
    } as any);

    return (res as any[]).map(r => ({
      id: r.id,
      environmentId: r.environmentId,
      path: r.path,
      encryptedPath: r.encryptedPath,
      encryptedBlob: r.encryptedBlob,
      keyVersion: r.keyVersion,
      metadata: r.metadata,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }
}
