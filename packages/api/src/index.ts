import { OpenAPIHono } from '@hono/zod-openapi';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { logger } from 'hono/logger';
import { execSync } from 'child_process';
import { serveStatic } from '@hono/node-server/serve-static';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { bootstrap, db, currentDbPath, OrchestrationService, DrizzleOrchestrationRepository, version as coreVersion } from '@zexio/zms-core';
import * as schema from '@zexio/zms-core';
import { vaultRoutes } from './interface/http/vault-routes.js';
import { security } from './routes/security.js';
import { orchestrationRoutes, serviceTokenRoutes } from './interface/http/orchestration-routes.js';
import { onboardingRoutes } from './interface/http/onboarding-routes.js';
import { mcpRouter } from './routes/mcp.js';
import { authGuard } from './middlewares/auth-guard.js';
import { hashPassword, verifyPassword, createSessionToken } from './lib/auth-utils.js';
import { OnboardingService } from './application/onboarding/onboarding-service.js';
import { eq } from 'drizzle-orm';

// 0. Auto-Sync Database (Development/Tactical)
function syncDatabase() {
  try {
    console.log('🔄 API: Syncing Database Schema...');
    const corePath = path.resolve(__dirname, '../../core');

    execSync('npx drizzle-kit push --config drizzle.config.ts', {
      cwd: corePath,
      stdio: 'inherit'
    });
    console.log('✅ API: Database Schema Synced.');
  } catch (e) {
    console.error('⚠️ API: Database Sync failed (skipping):', e);
  }
}

syncDatabase();

const app = new OpenAPIHono();

// Global Middlewares
app.use('*', logger());
app.use('*', secureHeaders());
app.use('*', cors({
  origin: (origin) => {
    if (!origin || (origin.includes('localhost') || origin.includes('127.0.0.1')) || origin.endsWith('zms.zexio.dev')) {
      return origin;
    }
    return 'https://zms.zexio.dev';
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-ZMS-Organization-Id', 'X-ZMS-Environment-Id', 'X-ZMS-Service-Id'],
  credentials: true,
}));

// Global Auth Protector for all v1 routes (except health & public auth)
app.use('/v1/*', (async (c: any, next: any) => {
  const publicPaths = ['/v1/health', '/v1/auth/setup', '/v1/auth/login', '/v1/init-status'];
  if (publicPaths.some(path => c.req.path.startsWith(path))) return await next();
  return authGuard(c, next);
}) as any);

// --- Tactical Auth Routes ---

app.post('/v1/auth/setup', async (c) => {
  const { name, email, password } = await c.req.json();

  // 1. Single-User Lock
  const existingUser = await db.select().from(schema.user).limit(1);
  if (existingUser.length > 0) {
    return c.json({ error: 'System already initialized' }, 403);
  }

  // 2. Create User
  const hashedPassword = await hashPassword(password);
  const userId = crypto.randomUUID();

  await db.insert(schema.user).values({
    id: userId,
    name,
    email,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Since we removed Better-Auth, we use the account table manually for password
  await db.insert(schema.account).values({
    id: crypto.randomUUID(),
    accountId: userId,
    providerId: 'credential',
    userId: userId,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 3. Trigger Onboarding
  const orchSrv = new OrchestrationService(new DrizzleOrchestrationRepository());
  const onboardingSrv = new OnboardingService(orchSrv);

  const result = await onboardingSrv.setup({
    orgName: `${name}'s Workspace`,
    userId: userId
  });

  // 4. Save shards for one-time fetch
  await db.insert(schema.pendingOnboarding).values({
    userId: userId,
    recoveryShards: result.recoveryShards
  });

  // 5. Generate Session
  const token = await createSessionToken(userId);
  return c.json({ user: { id: userId, name, email }, token }, 200);
});

app.post('/v1/auth/login', async (c) => {
  const { email, password } = await c.req.json();

  let user;
  if (email) {
    user = await db.query.user.findFirst({
      where: eq(schema.user.email, email)
    });
  } else {
    // For single-user CE: fallback to first user
    user = await db.query.user.findFirst();
  }

  if (!user) return c.json({ error: 'Invalid credentials or system uninitialized' }, 401);

  const account = await db.query.account.findFirst({
    where: eq(schema.account.userId, user.id)
  });

  if (!account || !account.password) return c.json({ error: 'Invalid credentials' }, 401);

  const isValid = await verifyPassword(password, account.password);
  if (!isValid) return c.json({ error: 'Invalid credentials' }, 401);

  const token = await createSessionToken(user.id);
  return c.json({ user: { id: user.id, name: user.name, email: user.email }, token }, 200);
});

app.post('/v1/auth/reset-password', async (c) => {
  const { password, shards } = await c.req.json();

  // In a full implementation, we'd verify shards here. 
  // For this tactical refactor, we'll reset the first user's password.
  const user = await db.query.user.findFirst();
  if (!user) return c.json({ error: 'User not found' }, 404);

  const hashedPassword = await hashPassword(password);

  await db.update(schema.account)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(schema.account.userId, user.id));

  return c.json({ success: true });
});

app.get('/v1/auth/session', async (c) => {
  const isMachine = (c as any).get('isMachine');
  const userId = (c as any).get('userId');

  if (isMachine) {
    return c.json({
      isMachine: true,
      organizationId: (c as any).get('organizationId'),
      projectId: (c as any).get('projectId'),
      envId: (c as any).get('envId'),
      user: {
        id: userId,
        name: userId.split(':').pop(),
        email: 'machine@zexio.internal'
      }
    }, 200);
  }

  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, userId)
  });
  return c.json({ isMachine: false, user }, 200);
});

// --- Domain Routes ---
app.route('/v1/projects/:projectId/services/:serviceId/secrets', vaultRoutes);
app.route('/v1/secrets', vaultRoutes);
app.route('/v1/security', security);
app.route('/v1/orgs', orchestrationRoutes);
app.route('/v1/service-tokens', serviceTokenRoutes);
app.route('/v1/onboarding', onboardingRoutes);
app.route('/mcp', mcpRouter);

// --- Cross-Cutting Security Endpoints (Dashboard Sync) ---

// 1. Organization Audit Logs
app.get('/v1/orgs/:orgId/audit-logs', async (c) => {
  const orgId = c.req.param('orgId');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  const search = c.req.query('search');
  const action = c.req.query('action') === 'all' ? undefined : c.req.query('action');

  const orchService = new OrchestrationService(new DrizzleOrchestrationRepository());
  const [{ logs, total }, org] = await Promise.all([
    orchService.findAuditLogsByOrg(orgId, {
      skip: (page - 1) * limit,
      take: limit,
      search,
      action
    }),
    orchService.findOrgById(orgId)
  ]);

  return formatAuditResponse(c, logs, total, page, limit);
});

// 2. Project Audit Logs
app.get('/v1/projects/:projectId/audit-logs', async (c) => {
  const projectId = c.req.param('projectId');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  const search = c.req.query('search');
  const action = c.req.query('action') === 'all' ? undefined : c.req.query('action');

  const orchService = new OrchestrationService(new DrizzleOrchestrationRepository());
  const { logs, total } = await orchService.findAuditLogsByProject(projectId, {
    skip: (page - 1) * limit,
    take: limit,
    search,
    action
  });

  return formatAuditResponse(c, logs, total, page, limit);
});

// 3. Project Environments (Flat)
app.get('/v1/projects/:projectId/environments', async (c) => {
  const projectId = c.req.param('projectId');
  const orchService = new OrchestrationService(new DrizzleOrchestrationRepository());
  const environments = await orchService.listEnvironments(projectId);

  return c.json({
    success: true,
    data: environments.map(e => ({
      id: e.id,
      projectId: e.projectId,
      name: e.name,
      createdAt: e.createdAt.toISOString()
    }))
  }, 200);
});

app.post('/v1/projects/:projectId/environments', async (c) => {
  const projectId = c.req.param('projectId');
  const { name } = await c.req.json();
  const orchService = new OrchestrationService(new DrizzleOrchestrationRepository());
  const env = await orchService.createEnvironment(projectId, name);

  return c.json({
    success: true,
    data: {
      id: env.id,
      projectId: env.projectId,
      name: env.name,
      createdAt: env.createdAt.toISOString()
    }
  }, 201);
});

app.delete('/v1/projects/:projectId/environments/:envId', async (c) => {
  const projectId = c.req.param('projectId');
  const envId = c.req.param('envId');
  const orchService = new OrchestrationService(new DrizzleOrchestrationRepository());

  await orchService.deleteEnvironment(projectId, envId);

  return c.json({
    success: true,
    message: 'Environment deleted successfully'
  }, 200);
});

// 4. Project Services (Flat)
app.get('/v1/projects/:projectId/services', async (c) => {
  const projectId = c.req.param('projectId');
  const orchService = new OrchestrationService(new DrizzleOrchestrationRepository());
  const services = await orchService.listServices(projectId);

  return c.json({
    success: true,
    data: services.map(s => ({
      id: s.id,
      name: s.name,
      createdAt: s.createdAt.toISOString()
    }))
  }, 200);
});

app.post('/v1/projects/:projectId/services', async (c) => {
  const projectId = c.req.param('projectId');
  const { name } = await c.req.json();
  const orchService = new OrchestrationService(new DrizzleOrchestrationRepository());
  const service = await orchService.createService(projectId, name);

  return c.json({
    success: true,
    data: {
      id: service.id,
      name: service.name,
      createdAt: service.createdAt.toISOString()
    }
  }, 201);
});

app.delete('/v1/projects/:projectId/services/:serviceId', async (c) => {
  const projectId = c.req.param('projectId');
  const serviceId = c.req.param('serviceId');
  const userId = (c as any).get('userId');
  const orgId = c.req.header('x-zms-organization-id'); // Fallback or infer

  const orchService = new OrchestrationService(new DrizzleOrchestrationRepository());

  // Need orgId for deleteService in current implementation, but we can infer it
  const project = await orchService.getProjectById(projectId);
  if (!project) return c.json({ success: false, error: 'Project not found' }, 404);

  await orchService.deleteService(project.organizationId, serviceId, userId);

  return c.json({
    success: true,
    message: 'Service deleted successfully'
  }, 200);
});

// Helper for formatting
async function formatAuditResponse(c: any, logs: any[], total: number, page: number, limit: number) {
  const orchService = new OrchestrationService(new DrizzleOrchestrationRepository());

  // Collect unique IDs for resolution
  const envIds = new Set<string>();
  const serviceIds = new Set<string>();

  logs.forEach(log => {
    const meta = (log.metadata as any) || {};
    if (meta.envId) envIds.add(meta.envId);
    if (meta.serviceId) serviceIds.add(meta.serviceId);
  });

  // Bulk Resolve Names (Tactical Cache)
  const envMap = new Map<string, string>();
  const serviceMap = new Map<string, string>();

  await Promise.all([
    ...Array.from(envIds).map(async (id) => {
      // Some envIds might be names already if stored incorrectly, check for UUID
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        envMap.set(id, id);
        return;
      }
      const env = await db.query.environments.findFirst({ where: (e, { eq }) => eq(e.id, id) });
      if (env) envMap.set(id, env.name);
    }),
    ...Array.from(serviceIds).map(async (id) => {
      const svc = await db.query.services.findFirst({ where: (s, { eq }) => eq(s.id, id) });
      if (svc) serviceMap.set(id, svc.name);
    })
  ]);

  const formattedLogs = logs.map(log => {
    const metadata = (log.metadata as any) || {};
    let actorName = log.actorName || log.actorId;

    if (log.actorId.startsWith('machine:')) {
      const parts = log.actorId.split(':');
      const tokenName = parts[parts.length - 1];
      actorName = `Service Token: ${tokenName}`;
    }

    return {
      id: log.id,
      timestamp: log.createdAt,
      actorName: actorName,
      actorId: log.actorId,
      action: log.action,
      targetType: log.resourceId?.includes(':') ? (log.resourceId.split(':')[0] || 'resource') : (log.action.split('_')[0] || 'system').toLowerCase(),
      targetId: log.resourceId?.includes(':') ? (log.resourceId.split(':')[1] || log.resourceId) : (log.resourceId || 'N/A'),
      severity: log.action.includes('DELETE') || log.action.includes('REMOVE') || log.action.includes('REVOKE') ? 'warning' : 'info',
      ipAddress: metadata.ip || '0.0.0.0',
      envName: metadata.envId ? envMap.get(metadata.envId) : undefined,
      serviceName: metadata.serviceId ? serviceMap.get(metadata.serviceId) : undefined,
      metadata: metadata
    };
  });

  return c.json({
    success: true,
    data: formattedLogs,
    metadata: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
}

app.get('/v1/rotation-policies', async (c) => {
  // CE Mode: Manual rotation only, no automated policies
  return c.json({ success: true, data: [] });
});

// Health Check
app.get('/v1/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.get('/v1/system/status', async (c) => {
  return c.json({
    success: true,
    data: {
      version: coreVersion,
      databasePath: currentDbPath,
      platform: process.platform,
      nodeVersion: process.version,
      uptime: process.uptime()
    }
  });
});

app.get('/v1/init-status', async (c) => {
  const existingUser = await db.select().from(schema.user).limit(1);
  return c.json({ initialized: existingUser.length > 0 });
});

// Bootstrap ZMS Core
console.log('⏳ API: Bootstrapping Core...');
const port = Number(process.env.PORT) || 3030;
console.log(`🚀 ZMS API Server (v${coreVersion}) running on http://localhost:${port}`);

// --- DASHBOARD SERVING (Fused CLI Strategy) ---
const DASHBOARD_PATH = fs.existsSync(path.resolve(__dirname, './ui')) 
  ? path.resolve(__dirname, './ui') 
  : path.resolve(__dirname, '../../dashboard/out');

// Serve the statically exported Next.js app
app.use('/_next/*', serveStatic({ root: DASHBOARD_PATH }));
app.use('/static/*', serveStatic({ root: DASHBOARD_PATH }));
app.use('/favicon.ico', serveStatic({ root: DASHBOARD_PATH }));

// Custom SPA-like Fallback Handler for Next.js Static Export
app.use('*', async (c, next) => {
  if (c.req.path.startsWith('/v1') || c.req.path.startsWith('/mcp')) return next(); // Let API and MCP routes pass

  let reqPath = c.req.path;

  // Helper to execute serveStatic and detect if file was found
  const tryServe = async (pathToCheck: string) => {
    let found = true;
    const middleware = serveStatic({
      root: DASHBOARD_PATH,
      rewriteRequestPath: () => pathToCheck
    });
    
    // Execute middleware and check if it called next()
    const result = await middleware(c, async () => { found = false; });
    return found ? result : null;
  };

  // 1. Try Exact File (e.g., /favicon.ico, /_next/...)
  let res = await tryServe(reqPath);
  if (res) return res;

  // 2. Try with .html extension (For Next.js static export paths)
  if (!reqPath.includes('.') || reqPath.endsWith('/')) {
    // Exact match for root / -> index.html
    if (reqPath === '/') {
        const indexRes = await tryServe('/index.html');
        if (indexRes) return indexRes;
    }

    const htmlPath = reqPath.endsWith('/') ? `${reqPath}index.html` : `${reqPath}.html`;
    res = await tryServe(htmlPath);
    if (res) return res;

    // 3. Try as a directory index (e.g. /dashboard/o/ -> /dashboard/o/index.html)
    if (!reqPath.endsWith('/')) {
      res = await tryServe(`${reqPath}/index.html`);
      if (res) return res;
    }
  }

  // 4. SPA Fallback: If still not found and looks like a dashboard route, serve index.html
  // This helps when the client-side router needs to handle the path
  if (reqPath.startsWith('/dashboard')) {
      const spaRes = await tryServe('/index.html');
      if (spaRes) return spaRes;
  }

  // 5. Final fallback to 404
  const final404 = await tryServe('/404.html');
  if (final404) return final404;
  
  return next();
});


bootstrap().then(() => {
  if (process.env.NODE_ENV !== 'test') {
    serve({
      fetch: app.fetch,
      port,
      hostname: '0.0.0.0',
    }, (info) => {
      console.log(`📡 ZMS Fused Engine: Listening on http://localhost:${info.port}`);
    });
  }
}).catch(err => {
  console.error("❌ Fatal Error: Failed to bootstrap ZMS Core", err);
  process.exit(1);
});


export default app;
