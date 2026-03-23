import { bootstrap, db, OrchestrationService, DrizzleOrchestrationRepository } from '@zexio/zms-core';
import crypto from 'crypto';
import * as schema from '@zexio/zms-core';

async function restoreMcp() {
  await bootstrap();
  const orch = new OrchestrationService(new DrizzleOrchestrationRepository());
  
  // 1. Get/Create First Organization
  let org = await db.query.organization.findFirst();
  if (!org) {
    console.log('No organization found. Creating default...');
    const user = await db.query.user.findFirst();
    if (!user) throw new Error('No users found. Please initialize the system via UI first.');
    org = await orch.createOrganization('Tactical Workspace', user.id);
  }

  // 2. Create MCP Token
  const token = `zms_mcp_${crypto.randomBytes(32).toString('hex')}`;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  await db.insert(schema.mcpTokens).values({
    id: crypto.randomUUID(),
    organizationId: org.id,
    name: 'EDITH Tactical Recovery Token',
    tokenHash: tokenHash,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('✅ MCP Token Restored.');
  console.log(`TOKEN: ${token}`);
  process.exit(0);
}

restoreMcp().catch(err => {
  console.error(err);
  process.exit(1);
});
