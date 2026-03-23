export interface Secret {
  id: string;
  environmentId: string;
  path: string; // HMAC'd path for blind indexing
  encryptedPath: string; // Reversible encrypted path for display
  encryptedBlob: string; // The sensitive data
  keyVersion: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface VaultRepository {
  saveSecret(secret: Secret): Promise<void>;
  getSecretByPath(envId: string, path: string): Promise<Secret | null>;
  deleteSecretByPath(envId: string, path: string): Promise<void>;
  listSecretsByEnv(envId: string): Promise<Secret[]>;
}
