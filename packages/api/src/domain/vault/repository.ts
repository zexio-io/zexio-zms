import { Secret } from "./entities";

export interface VaultRepository {
  saveSecret(secret: Secret): Promise<void>;
  getSecretByPath(envId: string, path: string): Promise<Secret | null>;
  deleteSecretByPath(envId: string, path: string): Promise<void>;
  listSecretsByEnv(envId: string): Promise<Secret[]>;
  listSecretsByContext(envId: string, serviceId: string): Promise<Secret[]>;
}
