export interface RotationPolicy {
  id: string;
  targetId: string; // Secret ID or Project ID
  targetType: "secret" | "project";
  frequencyDays: number;
  lastRotatedAt?: string;
  nextRotationAt: string;
  status: "active" | "paused" | "failed";
  provider: "aws" | "gcp" | "azure" | "manual";
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  action: string; // e.g., "SECRET_REVEAL", "VAULT_SYNC", "SA_REVOKE"
  targetId: string;
  targetType: string;
  metadata: Record<string, any>;
  ipAddress?: string;
  severity: "info" | "warning" | "critical";
  envName?: string;
  serviceName?: string;
}
