import { describe, it, expect, beforeAll } from 'vitest';
import { saveSecret, getSecret, deleteSecret, generatePathIndex } from '../src/repository.js';
import { db, bootstrap } from '../src/index.js';
import * as schema from '../src/schema.js';
import { sql } from 'drizzle-orm';

const { secrets, user, organization, projects, environments } = schema;

describe('ZMS Repository (Persistence & Blind Indexing)', () => {
  const MASTER_KEY = 'test-master-key';
  const PATH = '/dev/database/password';
  const CONTENT = 'my-super-secret-password-123';

  let TEST_ENV_ID: string;
  let TEST_SERVICE_ID: string;

  beforeAll(async () => {
    process.env.MASTER_KEY = process.env.MASTER_KEY || 'test-master-key';
    await bootstrap();

    // 1. Force Clear tables (Bypass FK constraints for reset)
    await db.run(sql`PRAGMA foreign_keys = OFF`);
    await db.delete(schema.auditLogs);
    await db.delete(schema.secrets);
    await db.delete(schema.serviceTokens);
    await db.delete(schema.mcpTokens);
    await db.delete(schema.pendingOnboarding);
    await db.delete(schema.services);
    await db.delete(schema.environments);
    await db.delete(schema.projects);
    await db.delete(schema.organization);
    await db.delete(schema.session);
    await db.delete(schema.account);
    await db.delete(schema.verification);
    await db.delete(user);
    await db.run(sql`PRAGMA foreign_keys = ON`);

    // 2. Setup SaaS Hierarchy
    await db.insert(user).values({ 
      id: 'user-1',
      email: 'test@zexio.io', 
      name: 'Test Boss',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const [org] = await db.insert(organization).values({ 
      id: 'org-1',
      name: 'Test Org', 
      ownerId: 'user-1',
      tmkSalt: 'salt',
      createdAt: new Date()
    }).returning();

    const [project] = await db.insert(projects).values({ 
      name: 'Test Project', 
      organizationId: org.id 
    }).returning();

    const [env] = await db.insert(environments).values({ 
      name: 'development', 
      projectId: project.id 
    }).returning();
    
    const [service] = await db.insert(schema.services).values({
      name: 'test-service',
      projectId: project.id
    }).returning();

    TEST_ENV_ID = env.id;
    TEST_SERVICE_ID = service.id;
  });

  it('should generate a consistent blind index', () => {
    const index1 = generatePathIndex(PATH, MASTER_KEY);
    const index2 = generatePathIndex(PATH, MASTER_KEY);
    expect(index1).toBe(index2);
    expect(index1).not.toBe(PATH); 
  });

  it('should save and retrieve a secret', async () => {
    await saveSecret(PATH, CONTENT, MASTER_KEY, TEST_SERVICE_ID, TEST_ENV_ID, 'salt', { env: 'dev' });
    
    const decrypted = await getSecret(PATH, MASTER_KEY, TEST_SERVICE_ID, TEST_ENV_ID, 'salt');
    expect(decrypted).toBe(CONTENT);
  });

  it('should update an existing secret', async () => {
    const NEW_CONTENT = 'updated-password-456';
    await saveSecret(PATH, NEW_CONTENT, MASTER_KEY, TEST_SERVICE_ID, TEST_ENV_ID, 'salt');
    
    const decrypted = await getSecret(PATH, MASTER_KEY, TEST_SERVICE_ID, TEST_ENV_ID, 'salt');
    expect(decrypted).toBe(NEW_CONTENT);
  });

  it('should return null for non-existent secret', async () => {
    const result = await getSecret('/wrong/path', MASTER_KEY, TEST_SERVICE_ID, TEST_ENV_ID, 'salt');
    expect(result).toBeNull();
  });

  it('should delete a secret', async () => {
    await saveSecret('/to/delete', 'kill-me', MASTER_KEY, TEST_SERVICE_ID, TEST_ENV_ID, 'salt');
    await deleteSecret('/to/delete', MASTER_KEY, TEST_SERVICE_ID, TEST_ENV_ID, 'salt');
    
    const result = await getSecret('/to/delete', MASTER_KEY, TEST_SERVICE_ID, TEST_ENV_ID, 'salt');
    expect(result).toBeNull();
  });
});
