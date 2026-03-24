import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { SecretService } from "../../application/vault/secret-service.js";
import { DrizzleVaultRepository } from "../../infrastructure/db/vault-repository.js";
import { DrizzleOrchestrationRepository } from "@zexio/zms-core";
import { authGuard } from "../../middlewares/auth-guard.js";
import { rls } from "../../middlewares/rls.js";
import { AppEnv } from "../../types/hono.js";

export const vaultRoutes = new Hono<AppEnv>();

// Initialize Services & Repositories
const vaultRepo = new DrizzleVaultRepository();
const orchRepo = new DrizzleOrchestrationRepository();
const secretService = new SecretService(vaultRepo);

// Apply Security Middlewares
vaultRoutes.use("*", authGuard, rls);

// Schemas
const secretSchema = z.object({
  path: z.string(),
  content: z.string(),
  metadata: z.record(z.any()).optional(),
});

// Helper to fetch Organization Context
async function getOrgContext(orgId: string) {
  const org = await orchRepo.findOrgById(orgId);
  if (!org) throw new Error("Organization not found");
  return { tmkSalt: org.tmkSalt };
}

// --- Route Definitions & Handlers ---

// 1. Write Secret
vaultRoutes.post('/', zValidator('json', secretSchema), zValidator('param', z.object({ projectId: z.string(), serviceId: z.string() })), async (c) => {
    const { path, content, metadata } = c.req.valid("json");
    const { projectId, serviceId } = c.req.valid("param");
    const orgId = c.get("organizationId")!;
    const userId = c.get("userId")!;
    const envId = c.get("envId")!;
  
    const { tmkSalt } = await getOrgContext(orgId);
    
    await secretService.writeSecret({
      orgId, userId, projectId, serviceId, envId, path, value: content, metadata, tmkSalt
    });
  
    return c.json({ success: true, message: "Secret stored." }, 201);
});

// 2. Read All Secrets (Context-Aware Shortcut)
vaultRoutes.get('/current', async (c) => {
  const orgId = c.get("organizationId")!;
  const projectId = c.get("projectId")!;
  const serviceId = c.get("serviceId")!;
  const envId = c.get("envId")!;

  if (!projectId || !serviceId || !envId) {
    return c.json({ success: false, error: "Token not scoped to a service/project" }, 400);
  }

  const { tmkSalt } = await getOrgContext(orgId);
  const secrets = await secretService.listSecrets({ orgId, envId, serviceId, tmkSalt });

  return c.json({ success: true, data: secrets }, 200);
});

// 3. Read Single Secret (Context-Aware Shortcut)
vaultRoutes.get('/current/:path', zValidator('param', z.object({ path: z.string() })), async (c) => {
  const { path } = c.req.valid("param");
  const decodedPath = decodeURIComponent(path);
  const orgId = c.get("organizationId")!;
  const projectId = c.get("projectId")!;
  const serviceId = c.get("serviceId")!;
  const envId = c.get("envId")!;

  if (!projectId || !serviceId || !envId) {
    return c.json({ success: false, error: "Token not scoped to a service/project" }, 400);
  }

  const { tmkSalt } = await getOrgContext(orgId);
  const value = await secretService.readSecret({ orgId, userId: c.get("userId"), projectId, serviceId, envId, path: decodedPath, tmkSalt });

  if (!value) return c.json({ success: false, error: "Secret not found" }, 404);
  return c.json({ success: true, data: { content: value } }, 200);
});

// 4. Existing Read Single Secret (Explicit Path)
vaultRoutes.get('/:path', zValidator('param', z.object({ projectId: z.string(), serviceId: z.string(), path: z.string() })), async (c) => {
    const { path, projectId, serviceId } = c.req.valid("param");
    const decodedPath = decodeURIComponent(path);
    const orgId = c.get("organizationId");
    const userId = c.get("userId");
    const envId = c.get("envId");
  
    const { tmkSalt } = await getOrgContext(orgId);
    
    const value = await secretService.readSecret({
      orgId, userId, projectId, serviceId, envId, path: decodedPath, tmkSalt
    });
  
    if (!value) return c.json({ success: false, error: "Secret not found" }, 404);
    return c.json({ content: value }); // Keep legacy format for this route
});

// 5. Existing Sync Route
vaultRoutes.get('/', zValidator('param', z.object({ projectId: z.string(), serviceId: z.string() })), async (c) => {
    const { projectId, serviceId } = c.req.valid("param");
    const orgId = c.get("organizationId");
    const envId = c.get("envId");
  
    const { tmkSalt } = await getOrgContext(orgId);
    const secrets = await secretService.listSecrets({ orgId, envId, serviceId, tmkSalt });
  
    return c.json({ success: true, data: secrets }, 200);
});

// 6. Batch Write
vaultRoutes.post('/batch', zValidator('param', z.object({ projectId: z.string(), serviceId: z.string() })), zValidator('json', z.object({
    secrets: z.array(z.object({
      key: z.string(),
      value: z.string(),
      isSensitive: z.boolean(),
    }))
})), async (c) => {
    const { secrets } = c.req.valid("json");
    const { projectId, serviceId } = c.req.valid("param");
    const orgId = c.get("organizationId");
    const userId = c.get("userId");
    const envId = c.get("envId");
  
    const { tmkSalt } = await getOrgContext(orgId);
    
    await secretService.writeSecretBatch({
      orgId, userId, projectId, serviceId, envId, secrets, tmkSalt
    });
  
    return c.json({ success: true, message: "Batch stored." }, 200);
});

// 7. Delete Secret
vaultRoutes.delete('/:path', zValidator('param', z.object({ projectId: z.string(), serviceId: z.string(), path: z.string() })), async (c) => {
    const { path, projectId, serviceId } = c.req.valid("param");
    const decodedPath = decodeURIComponent(path);
    const orgId = c.get("organizationId")!;
    const userId = c.get("userId")!;
    const envId = c.get("envId")!;
  
    const { tmkSalt } = await getOrgContext(orgId);
    
    await secretService.deleteSecret({
      orgId, userId, projectId, serviceId, envId, path: decodedPath, tmkSalt
    });
  
    return c.json({ success: true, message: "Secret deleted." }, 200);
});
