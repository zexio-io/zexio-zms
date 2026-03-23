import { bootstrap, OrchestrationService, DrizzleOrchestrationRepository, saveSecret, db } from '@zexio/zms-core';
import fs from 'fs';
import path from 'path';

async function uploadEnv() {
  await bootstrap();
  const repo = new DrizzleOrchestrationRepository();
  const orch = new OrchestrationService(repo);

  console.log('Fetching MCP Token context...');
  const tokenRecord = await db.query.mcpTokens.findFirst();
  if (!tokenRecord) {
    throw new Error('No MCP Tokens found in DB. Cannot identify organization.');
  }

  const orgId = tokenRecord.organizationId;
  const org = await orch.getOrganizationById(orgId);

  if (!org) throw new Error('Organization not found.');

  console.log(`Using Organization: ${org.name}`);

  const userRecord = await db.query.user.findFirst();
  const actorId = userRecord ? userRecord.id : 'mcp-agent';

  // Create Project
  console.log('Provisioning Project...');
  const result = await orch.createProjectWithDefaults(org.id, "ZMS Configuration", actorId, ['api-core']);
  
  const env = result.environments.find(e => e.name.toLowerCase() === 'development');
  const svc = result.services[0];
  
  if (!env || !svc) throw new Error('Failed to resolve dev env or service.');

  const envPath = path.resolve(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');

  const MASTER_KEY = process.env.MASTER_KEY || '';
  if (!MASTER_KEY) throw new Error('System MASTER_KEY is not configured in env.');

  for(const line of lines) {
    if(line.trim() && !line.startsWith('#')) {
      const parts = line.split('=');
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').split('#')[0].trim();
      
      if(key && val) {
         console.log(`Saving /${key}`);
         await saveSecret(`/${key}`, val, MASTER_KEY, svc.id, env.id, org.tmkSalt);
      }
    }
  }
  console.log('✅ Upload to ZMS complete!');
  process.exit(0);
}

uploadEnv().catch(err => {
  console.error(err);
  process.exit(1);
});
