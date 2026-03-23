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

  beforeAll(async () => {
    process.env.MASTER_KEY = process.env.MASTER_KEY || 'test-master-key';
    await bootstrap();

    // 0. Disable Audit Protection Trigger for testing cleanup
    await db.execute(sql`DROP TRIGGER IF EXISTS trg_protect_audit_logs ON audit_logs`);

    // 1. Clear tables
    await db.delete(schema.auditLogs);
    await db.delete(secrets);
    await db.delete(environments);
    await db.delete(projects);
    await db.delete(organization);
    await db.delete(user);

    // 0b. Re-enable Audit Protection Trigger after cleanup
    await db.execute(sql`
      CREATE TRIGGER trg_protect_audit_logs
      BEFORE UPDATE OR DELETE ON audit_logs
      FOR EACH ROW EXECUTE FUNCTION protect_audit_logs();
    `);

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
    
    TEST_ENV_ID = env.id;
  });

  it('should generate a consistent blind index', () => {
    const index1 = generatePathIndex(PATH, MASTER_KEY);
    const index2 = generatePathIndex(PATH, MASTER_KEY);
    expect(index1).toBe(index2);
    expect(index1).not.toBe(PATH); 
  });

  it('should save and retrieve a secret', async () => {
    await saveSecret(PATH, CONTENT, MASTER_KEY, TEST_ENV_ID, 'salt', { env: 'dev' });
    
    const decrypted = await getSecret(PATH, MASTER_KEY, TEST_ENV_ID, 'salt');
    expect(decrypted).toBe(CONTENT);
  });

  it('should update an existing secret', async () => {
    const NEW_CONTENT = 'updated-password-456';
    await saveSecret(PATH, NEW_CONTENT, MASTER_KEY, TEST_ENV_ID, 'salt');
    
    const decrypted = await getSecret(PATH, MASTER_KEY, TEST_ENV_ID, 'salt');
    expect(decrypted).toBe(NEW_CONTENT);
  });

  it('should return null for non-existent secret', async () => {
    const result = await getSecret('/wrong/path', MASTER_KEY, TEST_ENV_ID, 'salt');
    expect(result).toBeNull();
  });

  it('should delete a secret', async () => {
    await saveSecret('/to/delete', 'kill-me', MASTER_KEY, TEST_ENV_ID, 'salt');
    await deleteSecret('/to/delete', MASTER_KEY, TEST_ENV_ID, 'salt');
    
    const result = await getSecret('/to/delete', MASTER_KEY, TEST_ENV_ID, 'salt');
    expect(result).toBeNull();
  });
});
