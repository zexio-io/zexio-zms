export interface ServiceAccount {
  id: string;
  name: string;
  description?: string;
  orgId: string;
  ownerId: string;
  publicKey?: string;
  authMethod: "oidc" | "client_credentials" | "k8s";
  status: "active" | "revoked" | "pending";
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

export interface ServiceAccountDraft extends Pick<ServiceAccount, 'name' | 'description' | 'authMethod'> {
  isNew?: boolean;
}
