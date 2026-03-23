export type TokenScope = "read" | "write" | "admin";

export interface ServiceToken {
  id: string;
  name: string;
  projectId: string;
  scope: TokenScope;
  createdAt: string;
  expiresAt?: string;
  lastUsedAt?: string;
  token?: string; // Only available on creation
}
