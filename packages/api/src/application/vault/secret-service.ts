import { VaultRepository } from "../../domain/vault/repository.js";
import { getSecret, saveSecret, deleteSecret, getGlobalMasterKey, listSecrets as bulkDecrypt } from "@zexio/zms-core";
import { logAction } from "../../services/audit.js";

export class SecretService {
  constructor(
    private repo: VaultRepository
  ) {}

  async writeSecret(params: {
    orgId: string;
    userId: string;
    projectId: string;
    serviceId: string;
    envId: string;
    path: string;
    value: string;
    metadata?: any;
    tmkSalt: string;
  }): Promise<void> {
    const masterKey = getGlobalMasterKey();
    
    // 1. Encryption via Core Utility
    await saveSecret(
      params.path,
      params.value,
      masterKey,
      params.serviceId,
      params.envId,
      params.tmkSalt,
      params.metadata
    );

    // 2. Audit Log
    logAction(params.orgId, params.userId, "SECRET_WRITE", `secret:${params.path}`, {
      path: params.path,
      projectId: params.projectId,
      envId: params.envId
    }, params.serviceId);
  }

  async writeSecretBatch(params: {
    orgId: string;
    userId: string;
    projectId: string;
    serviceId: string;
    envId: string;
    secrets: Array<{ key: string; value: string; isSensitive: boolean }>;
    tmkSalt: string;
  }): Promise<void> {
    const masterKey = getGlobalMasterKey();

    for (const s of params.secrets) {
        await saveSecret(
            s.key,
            s.value,
            masterKey,
            params.serviceId,
            params.envId,
            params.tmkSalt,
            { isSensitive: s.isSensitive }
        );
    }

    logAction(params.orgId, params.userId, "SECRET_BATCH_WRITE", "secret:batch", {
      count: params.secrets.length,
      projectId: params.projectId,
      envId: params.envId
    }, params.serviceId);
  }

  async readSecret(params: {
    orgId: string;
    userId: string;
    projectId: string;
    serviceId: string;
    envId: string;
    path: string;
    tmkSalt: string;
  }): Promise<string | null> {
    const masterKey = getGlobalMasterKey();
    const content = await getSecret(params.path, masterKey, params.serviceId, params.envId, params.tmkSalt);
    
    if (!content) return null;

    logAction(params.orgId, params.userId, "SECRET_READ", `secret:${params.path}`, {
      path: params.path,
      projectId: params.projectId,
      envId: params.envId
    }, params.serviceId);

    return content;
  }

  async deleteSecret(params: {
    orgId: string;
    userId: string;
    projectId: string;
    serviceId: string;
    envId: string;
    path: string;
    tmkSalt: string;
  }): Promise<void> {
    const masterKey = getGlobalMasterKey();
    await deleteSecret(params.path, masterKey, params.serviceId, params.envId, params.tmkSalt);

    logAction(params.orgId, params.userId, "SECRET_DELETE", `secret:${params.path}`, {
      path: params.path,
      projectId: params.projectId,
      envId: params.envId
    }, params.serviceId);
  }

  async listSecrets(params: {
    orgId: string;
    envId: string;
    serviceId: string;
    tmkSalt: string;
  }): Promise<Record<string, string>> {
    const masterKey = getGlobalMasterKey();
    
    // We use the core utility which handles bulk decryption efficiently
    const secrets = await bulkDecrypt(
      masterKey,
      params.serviceId,
      params.envId,
      params.tmkSalt
    );

    return secrets;
  }
}
