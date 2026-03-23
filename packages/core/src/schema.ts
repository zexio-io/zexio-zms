import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// 1. User (Better Auth Core)
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull(),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  twoFactorEnabled: integer('two_factor_enabled', { mode: 'boolean' }).default(false).notNull(),
  twoFactorSecret: text('two_factor_secret'),
  twoFactorBackupCodes: text('two_factor_backup_codes'),
});

// 2. Session (Better Auth Core)
export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
});

// 3. Account (Better Auth Core - Required)
export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// 4. Verification (Better Auth Core - Required)
export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});


// 4. Organization (Better Auth Plugin)
export const organization = sqliteTable('organization', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ownerId: text('owner_id').notNull().references(() => user.id), // ZMS CE: Direct ownership
  logo: text('logo'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  metadata: text('metadata'),
  // ZMS Add-on: Tenant Master Key salt for cryptographic isolation
  tmkSalt: text('tmk_salt').notNull(),
  keyHistory: text('key_history', { mode: 'json' }).default(JSON.stringify([])).notNull(),
});

// 7. Projects (Logical Scoping)
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

// 8. Environments (Global Stages for a Project)
export const environments = sqliteTable('environments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(), // 'production' | 'staging' | 'development'
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

// 8b. Services (Microservices within a Project)
export const services = sqliteTable('services', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(), // e.g. 'auth-service', 'billing-api'
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

// 9. Secrets (Vault Bounded Context - Scoped by Service and Environment)
export const secrets = sqliteTable('secrets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  serviceId: text('service_id').references(() => services.id, { onDelete: 'cascade' }).notNull(),
  environmentId: text('environment_id').references(() => environments.id, { onDelete: 'cascade' }).notNull(),
  path: text('path').notNull(), // HMAC'd path (Blind Index)
  encryptedPath: text('encrypted_path').notNull(), 
  encryptedBlob: text('encrypted_blob').notNull(),
  keyVersion: integer('key_version').default(1).notNull(),
  rotationId: text('rotation_id'),
  metadata: text('metadata', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
}, (table) => {
  return {
    pathSvcEnvIdx: uniqueIndex('path_svc_env_idx').on(table.path, table.serviceId, table.environmentId),
    envIdx: index('env_idx').on(table.environmentId),
    svcIdx: index('svc_idx').on(table.serviceId),
  };
});

// 10. Audit Logs (Audit Bounded Context)
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  actorId: text('actor_id').notNull().references(() => user.id),
  action: text('action').notNull(), // 'SECRET_READ', 'SECRET_WRITE', 'KEY_ROTATION'
  resourceId: text('resource_id'),
  metadata: text('metadata', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
}, (table) => {
  return {
    orgAtIdx: index('org_at_idx').on(table.organizationId, table.createdAt),
  };
});

// 12. Service Tokens (Direct Scoped Access)
export const serviceTokens = sqliteTable('service_tokens', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  serviceId: text('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  environmentId: text('environment_id').notNull().references(() => environments.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  tokenHash: text('token_hash').notNull(), // SHA-256 of 'zms_st_...' with orgId salt (Legacy)
  lookupHash: text('lookup_hash'), // SHA-256 of 'zms_st_...' (New, for token-only lookup)
  lastFour: text('last_four').notNull(),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

// 12b. MCP Tokens (Organization-wide AI Agent Access)
export const mcpTokens = sqliteTable('mcp_tokens', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  tokenHash: text('token_hash').notNull(),
  lastFour: text('last_four').notNull(),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

// 13. Pending Onboarding (For CE Zero-Click flow)
export const pendingOnboarding = sqliteTable('pending_onboarding', {
  userId: text('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  recoveryShards: text('recovery_shards', { mode: 'json' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

// --- Relations ---

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  projects: many(projects),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  project: one(projects, { fields: [services.projectId], references: [projects.id] }),
  secrets: many(secrets),
  serviceTokens: many(serviceTokens),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  organization: one(organization, { fields: [projects.organizationId], references: [organization.id] }),
  environments: many(environments),
  services: many(services),
}));

export const environmentsRelations = relations(environments, ({ one, many }) => ({
  project: one(projects, { fields: [environments.projectId], references: [projects.id] }),
  secrets: many(secrets),
}));

export const secretsRelations = relations(secrets, ({ one }) => ({
  service: one(services, { fields: [secrets.serviceId], references: [services.id] }),
  environment: one(environments, { fields: [secrets.environmentId], references: [environments.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  organization: one(organization, { fields: [auditLogs.organizationId], references: [organization.id] }),
  actor: one(user, { fields: [auditLogs.actorId], references: [user.id] }),
}));

export const serviceTokensRelations = relations(serviceTokens, ({ one }) => ({
  organization: one(organization, { fields: [serviceTokens.organizationId], references: [organization.id] }),
  project: one(projects, { fields: [serviceTokens.projectId], references: [projects.id] }),
  service: one(services, { fields: [serviceTokens.serviceId], references: [services.id] }),
  environment: one(environments, { fields: [serviceTokens.environmentId], references: [environments.id] }),
}));

export const mcpTokensRelations = relations(mcpTokens, ({ one }) => ({
  organization: one(organization, { fields: [mcpTokens.organizationId], references: [organization.id] }),
}));
