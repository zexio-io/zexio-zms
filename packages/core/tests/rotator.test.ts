import { describe, it, expect, beforeAll } from 'vitest';
import { startOrganizationRotation, performRotationBatch } from '../src/rotator.js';
import { saveSecret, getSecret } from '../src/repository.js';
import { db, bootstrap } from '../src/index.js';
import * as schema from '../src/schema.js';
import { eq, and, lt, sql } from 'drizzle-orm';

const { secrets, user, organization, projects, environments } = schema;

describe('ZMS Key Rotator (Organization-wide)', () => {
  const MASTER_KEY = 'test-master-key';
  const PATH = '/prod/api/key';
  const CONTENT = 'secret-api-key-999';

  let TEST_ORG_ID: string;
  let TEST_ENV_ID: string;

  beforeAll(async () => {
    process.env.MASTER_KEY = MASTER_KEY;
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

    const [org] = await db.insert(organization).values({ 
      id: 'org-rot',
      name: 'Rot Org', 
      tmkSalt: 'old-salt',
      createdAt: new Date()
    }).returning();

    const [project] = await db.insert(projects).values({ 
      name: 'Rot Project', 
      organizationId: org.id 
    }).returning();

    const [env] = await db.insert(environments).values({ 
      name: 'prod', 
      projectId: project.id 
    }).returning();
    
    TEST_ORG_ID = org.id;
    TEST_ENV_ID = env.id;

    // Save with OLD salt
    await saveSecret(PATH, CONTENT, MASTER_KEY, TEST_ENV_ID, 'old-salt');
  });

  it('should rotate secrets to a new salt using the batch mechanism', async () => {
    // 1. Verify decryption with old salt
    const oldDecrypted = await getSecret(PATH, MASTER_KEY, TEST_ENV_ID, 'old-salt');
    expect(oldDecrypted).toBe(CONTENT);

    // 2. Start Rotation
    const startResult = await startOrganizationRotation(TEST_ORG_ID);
    expect(startResult.success).toBe(true);
    expect(startResult.newVersion).toBe(2);

    // 3. Verify that the current salt in DB has changed
    const [orgAfter] = await db.select().from(organization).where(eq(organization.id, TEST_ORG_ID));
    expect(orgAfter.tmkSalt).not.toBe('old-salt');
    expect((orgAfter.keyHistory as any[]).length).toBe(1);

    // 4. Perform Batch
    const batchResult = await performRotationBatch(TEST_ORG_ID, MASTER_KEY, 10);
    expect(batchResult.count).toBe(1);
    expect(batchResult.finished).toBe(true);

    // 5. Verify decryption with NEW salt
    const newDecrypted = await getSecret(PATH, MASTER_KEY, TEST_ENV_ID, orgAfter.tmkSalt);
    expect(newDecrypted).toBe(CONTENT);
  });
});
