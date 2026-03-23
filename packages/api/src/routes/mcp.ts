import { OpenAPIHono } from '@hono/zod-openapi';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPTransport } from '@hono/mcp';
import { db, OrchestrationService, DrizzleOrchestrationRepository, saveSecret, getSecret, deleteSecret } from '@zexio/zms-core';
import { eq } from 'drizzle-orm';
import * as schema from '@zexio/zms-core';
import { getGlobalMasterKey } from '@zexio/zms-core';
import crypto from 'crypto';
import { z } from 'zod';
import { AsyncLocalStorage } from 'async_hooks';

export const mcpRouter = new OpenAPIHono();

// Global Context for Multi-Tenant Payload Isolation
export const mcpContext = new AsyncLocalStorage<{ orgId: string, tokenId: string }>();

const mcpServer = new McpServer({
  name: 'zms',
  version: '1.0.0'
});

const orchService = new OrchestrationService(new DrizzleOrchestrationRepository());

// Helper to resolve context (LOCKED TO 'development' env)
const resolveContext = async (projectId: string, serviceName: string) => {
  const store = mcpContext.getStore();
  if (!store?.orgId) throw new Error("Unauthorized context");

  const org = await orchService.getOrganizationById(store.orgId);
  if (!org) throw new Error(`Organization not found.`);

  const project = await orchService.getProjectById(projectId);
  if (!project) throw new Error(`Project "${projectId}" not found.`);

  // Systematically block access to 'staging' or 'production' for AI agents
  const envs = await (orchService as any).repo.findEnvironmentsByProject(project.id);
  const env = envs.find((e: any) => e.name.toLowerCase() === 'development');

  if (!env) throw new Error(`Environment "development" not found in project (AI Agents are restricted to development).`);

  const svcs = await (orchService as any).repo.findServicesByProject(project.id);
  const svc = svcs.find((s: any) => s.name.toLowerCase() === serviceName.toLowerCase());
  if (!svc) throw new Error(`Service "${serviceName}" not found.`);

  return { org, project, env, svc };
};

// --- Tool Registrations ---

mcpServer.registerTool('list_secrets', {
  description: "Lists all secret keys (paths) available in the DEV environment.",
  inputSchema: {
    projectId: z.string(),
    serviceName: z.string()
  }
},
  async (args) => {
    const ctx = await resolveContext(args.projectId, args.serviceName);
    const secretsList = await db.query.secrets.findMany({
      where: eq(schema.secrets.environmentId, ctx.env.id),
      columns: { path: true, id: true }
    });

    if (secretsList.length === 0) return { content: [{ type: 'text', text: 'No secrets found in this environment.' }] };

    const formatted = secretsList.map(s => `- ${s.path}`).join('\n');
    return { content: [{ type: 'text', text: `🔐 Available Secrets in DEV:\n${formatted}` }] };
  }
);

mcpServer.registerTool('save_secret', {
  description: "Saves an encrypted secret exclusively to the DEV environment.",
  inputSchema: {
    projectId: z.string(),
    serviceName: z.string(),
    path: z.string(),
    plaintext: z.string(),
  }
},
  async (args) => {
    const ctx = await resolveContext(args.projectId, args.serviceName);
    const MASTER_KEY = schema.getGlobalMasterKey();
    const result = await saveSecret(args.path, args.plaintext, MASTER_KEY, ctx.svc.id, ctx.env.id, ctx.org.tmkSalt);
    return { content: [{ type: 'text', text: `✅ Secret saved to development path: ${result.path} in ${ctx.project.name}` }] };
  }
);

mcpServer.registerTool('bulk_save_secrets', {
  description: "Saves multiple encrypted secrets at once to the DEV environment.",
  inputSchema: {
    projectId: z.string(),
    serviceName: z.string(),
    secrets: z.record(z.string()).describe("A key-value object representing Env mapping, e.g. {'DATABASE_URL': 'postgres://...'}")
  }
},
  async (args) => {
    const ctx = await resolveContext(args.projectId, args.serviceName);
    const MASTER_KEY = schema.getGlobalMasterKey();
    let results = [];

    for (const [key, plaintext] of Object.entries(args.secrets)) {
      await saveSecret(key, String(plaintext), MASTER_KEY, ctx.svc.id, ctx.env.id, ctx.org.tmkSalt);
      results.push(key);
    }

    return { content: [{ type: 'text', text: `✅ ${results.length} secrets saved to DEV: ${results.join(', ')}` }] };
  }
);

mcpServer.registerTool('get_secret', {
  description: "Retrieves a protected reference to a DEV secret.",
  inputSchema: {
    projectId: z.string(),
    serviceName: z.string(),
    path: z.string(),
  }
},
  async (args) => {
    const ctx = await resolveContext(args.projectId, args.serviceName);
    const MASTER_KEY = getGlobalMasterKey();
    const plaintext = await getSecret(args.path, MASTER_KEY, ctx.svc.id, ctx.env.id, ctx.org.tmkSalt);

    if (!plaintext) {
      return { content: [{ type: 'text', text: `❌ Secret not found.` }], isError: true };
    }
    return { content: [{ type: 'text', text: `🔒 ZMS Protected Secret Found: [${args.path}]\nValue: [HIDDEN_FOR_AGENT_ISOLATION]` }] };
  }
);

mcpServer.registerTool('delete_secret', {
  description: "Deletes a DEV secret from the vault.",
  inputSchema: {
    projectId: z.string(),
    serviceName: z.string(),
    path: z.string(),
  }
},
  async (args) => {
    const ctx = await resolveContext(args.projectId, args.serviceName);
    const MASTER_KEY = getGlobalMasterKey();
    await deleteSecret(args.path, MASTER_KEY, ctx.svc.id, ctx.env.id, ctx.org.tmkSalt);
    return { content: [{ type: 'text', text: `✅ Secret deleted.` }] };
  }
);

mcpServer.registerTool('list_projects', {
  description: "Lists all projects belonging to the organization."
},
  async () => {
    const store = mcpContext.getStore();
    if (!store?.orgId) throw new Error("Unauthorized context");

    const projects = await orchService.getProjects(store.orgId);
    const projectList = projects.map(p => `- ${p.name} (UUID: ${p.id})`).join('\n');
    return { content: [{ type: 'text', text: `📂 Projects:\n${projectList || 'No projects found.'}` }] };
  }
);

mcpServer.registerTool('provision_project', {
  description: "Atomically creates a project, environments, and services for an organization.",
  inputSchema: {
    projectName: z.string().describe('Name of the new project'),
    services: z.array(z.string()).optional().describe('List of initial service names')
  }
},
  async (args) => {
    const store = mcpContext.getStore();
    if (!store?.orgId) throw new Error("Unauthorized context");

    const userRecord = await db.query.user.findFirst();
    const actorId = userRecord ? userRecord.id : 'mcp-agent';

    const result = await orchService.createProjectWithDefaults(store.orgId, args.projectName, actorId, args.services || []);

    const tokenLines = result.tokens.map(t => `- ${t.serviceName}: \`${t.token}\``).join('\n');
    const msg = `✅ Project "${args.projectName}" provisioned with ${result.environments.length} environments and ${result.services.length} services.\n\n` +
      `🔑 **ZMS_TOKEN (Development)**:\n${tokenLines || 'No services/tokens created.'}\n\n` +
      `> [!IMPORTANT]\n> To enable the **Bootstrap Pattern**, replace your entire \`.env.local\` with a single variable:\n> \`ZMS_TOKEN=zms_st_...\` (Use the token above)\n\n` +
      `> [!TIP]\n> Run your apps securely with the ZMS CLI:\n> \`npx @zexio/zms-cli run -- node server.ts\`\n\n` +
      `> Learn more at [zms.zexio.io/docs](https://zms.zexio.io/docs)`;

    return { content: [{ type: 'text', text: msg }] };
  }
);

mcpServer.registerTool('list_services', {
  description: "Lists all services within a specific project.",
  inputSchema: {
    projectId: z.string().describe('The UUID of the project')
  }
},
  async (args) => {
    const store = mcpContext.getStore();
    if (!store?.orgId) throw new Error("Unauthorized context");

    const project = await orchService.getProjectById(args.projectId);
    if (!project || project.organizationId !== store.orgId) throw new Error(`Project not found in this organization.`);

    const services = await (orchService as any).repo.findServicesByProject(project.id);
    const serviceList = services.map((s: any) => `- ${s.name} (UUID: ${s.id})`).join('\n');
    return { content: [{ type: 'text', text: `🔧 Services:\n${serviceList || 'No services found.'}` }] };
  }
);

mcpServer.registerTool('add_service', {
  description: "Adds a service to an existing project.",
  inputSchema: {
    projectId: z.string(),
    serviceName: z.string()
  }
},
  async (args) => {
    const store = mcpContext.getStore();
    if (!store?.orgId) throw new Error("Unauthorized context");

    const project = await orchService.getProjectById(args.projectId);
    if (!project || project.organizationId !== store.orgId) throw new Error(`Project not found in this organization.`);

    await orchService.createService(project.id, args.serviceName);

    // Auto-generate token for development env
    const envs = await (orchService as any).repo.findEnvironmentsByProject(project.id);
    const devEnv = envs.find((e: any) => e.name.toLowerCase() === 'development');
    const svcs = await (orchService as any).repo.findServicesByProject(project.id);
    const svc = svcs.find((s: any) => s.name.toLowerCase() === args.serviceName.toLowerCase());

    let tokenInfo = "";
    if (devEnv && svc) {
      const { token } = await orchService.generateServiceToken(store.orgId, project.id, svc.id, devEnv.id, `${args.serviceName} Default Token`);
      tokenInfo = `\n\n🔑 **ZMS_TOKEN (Development)**: \`${token}\`\n\n` +
                  `> [!IMPORTANT]\n> Replace your \`.env.local\` with a single \`ZMS_TOKEN=\` to activate the Bootstrap Pattern.\n\n` +
                  `> [!TIP]\n> Start your app using: \`npx @zexio/zms-cli run -- node your-server.js\`\n` +
                  `> Visit [zms.zexio.io/docs](https://zms.zexio.io/docs) for details.`;
    }

    return { content: [{ type: 'text', text: `✅ Service "${args.serviceName}" created successfully.${tokenInfo}` }] };
  }
);

// --- Routing & Transport ---

const transport = new StreamableHTTPTransport();

// Pre-connect the server to the transport
mcpServer.connect(transport as any).catch(console.error);

// Token Middleware
mcpRouter.use('*', async (c: any, next: any) => {
  let token = '';
  const authHeader = c.req.header('Authorization') || c.req.header('x-zms-mcp-token');

  if (authHeader) {
    token = authHeader.replace(/^Bearer\s+/i, '').trim();
  } else {
    token = c.req.query('token') || '';
  }

  if (!token) return c.json({ error: 'Missing MCP Token (Header or ?token=)' }, 401);

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const mcpToken = await db.query.mcpTokens.findFirst({
    where: eq(schema.mcpTokens.tokenHash, tokenHash)
  });

  if (!mcpToken) return c.json({ error: 'Invalid or revoked MCP Token' }, 401);

  db.update(schema.mcpTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(schema.mcpTokens.id, mcpToken.id))
    .execute()
    .catch(console.error);

  return mcpContext.run({
    orgId: mcpToken.organizationId,
    tokenId: mcpToken.id
  }, () => next());
});

mcpRouter.all('*', async (c) => {
  const path = c.req.path;
  if (path === '/mcp' || path === '/mcp/' || path === '/' || path === '') {
    return transport.handleRequest(c);
  }
  return c.text(`Not Found in MCP Router: ${path}`, 404);
});
