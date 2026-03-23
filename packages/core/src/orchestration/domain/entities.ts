export interface Organization {
  id: string;
  name: string;
  ownerId: string; // ZMS CE: Direct ownership
  logo?: string;
  createdAt: Date;
  metadata?: any;
  // Security Layer
  tmkSalt: string; // Tenant Master Key Salt
  keyHistory: any[];
  projects?: Project[];
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  createdAt: Date;
}

export interface Environment {
  id: string;
  projectId: string;
  name: string; // 'production', 'staging', 'development'
  createdAt: Date;
}

export interface Service {
  id: string;
  projectId: string;
  name: string; // 'auth-api', 'billing-worker'
  createdAt: Date;
}

export interface ServiceToken {
  id: string;
  organizationId: string;
  projectId: string;
  serviceId: string;
  environmentId: string;
  name: string;
  tokenHash: string;
  lookupHash?: string;
  lastFour: string;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  // Joins
  service?: Service;
  environment?: Environment;
}

export interface McpToken {
  id: string;
  organizationId: string;
  name: string;
  tokenHash: string;
  lastFour: string;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface AuditLog {
  id?: string;
  organizationId: string;
  actorId: string;
  actorName?: string;
  actorEmail?: string;
  action: string;
  resourceId?: string;
  metadata?: any;
  createdAt: Date;
}
