import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { SecretService } from "../../application/vault/secret-service.js";
import { DrizzleVaultRepository } from "../../infrastructure/db/vault-repository.js";
import { DrizzleOrchestrationRepository } from "@zexio/zms-core";
import { authGuard } from "../../middlewares/auth-guard.js";
import { rls } from "../../middlewares/rls.js";

export const vaultRoutes = new OpenAPIHono();

// Initialize Services & Repositories
const vaultRepo = new DrizzleVaultRepository();
const orchRepo = new DrizzleOrchestrationRepository();
const secretService = new SecretService(vaultRepo);

// Apply Security Middlewares
vaultRoutes.use("*", authGuard, rls);

// Schemas
const secretSchema = z.object({
  path: z.string().openapi({ example: "prod/db/main" }),
  content: z.string().openapi({ example: "secret-value" }),
  metadata: z.record(z.any()).optional(),
}).openapi("SecretInput");

// Helper to fetch Organization Context
async function getOrgContext(orgId: string) {
  const org = await orchRepo.findOrgById(orgId);
  if (!org) throw new Error("Organization not found");
  return { tmkSalt: org.tmkSalt };
}

// --- Route Definitions ---

// 1. Write Secret
const writeSecretRoute = createRoute({
  method: 'post',
  path: '/',
  summary: 'Write a secret to the vault',
  tags: ['Vault'],
  request: {
    params: z.object({
      projectId: z.string(),
      serviceId: z.string()
    }),
    body: {
      content: {
        'application/json': { schema: secretSchema }
      }
    }
  },
  responses: {
    201: {
      description: 'Secret written successfully',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), message: z.string() }) } }
    }
  }
});

// 2. Read All Secrets (Context-Aware Shortcut)
const listCurrentSecretsRoute = createRoute({
  method: 'get',
  path: '/current',
  summary: 'List all secrets for the current context (token-based)',
  tags: ['Vault'],
  responses: {
    200: {
      description: 'List of secrets for the environment',
      content: {
        'application/json': {
          schema: z.object({ 
            success: z.boolean(),
            data: z.record(z.string())
          })
        }
      }
    }
  }
});

// 3. Read Single Secret (Context-Aware Shortcut)
const readCurrentSecretRoute = createRoute({
  method: 'get',
  path: '/current/:path',
  summary: 'Read a specific secret for the current context (token-based)',
  tags: ['Vault'],
  request: {
    params: z.object({
      path: z.string().openapi({ example: "DATABASE_URL" })
    })
  },
  responses: {
    200: {
      description: 'Secret content retrieved',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), data: z.object({ content: z.string() }) }) } }
    },
    404: { description: 'Secret not found' }
  }
});

// 4. Existing Read Single Secret (Explicit Path)
const readSecretRoute = createRoute({
  method: 'get',
  path: '/{path}',
  summary: 'Read a secret from the vault',
  tags: ['Vault'],
  request: {
    params: z.object({
      projectId: z.string(),
      serviceId: z.string(),
      path: z.string().openapi({ example: "prod%2Fdb%2Fmain" })
    })
  },
  responses: {
    200: {
      description: 'Secret content retrieved',
      content: { 'application/json': { schema: z.object({ content: z.string() }) } }
    },
    404: { description: 'Secret not found' }
  }
});

// 5. Existing Sync Route
const syncSecretsRoute = createRoute({
  method: 'get',
  path: '/',
  summary: 'List and sync all secrets for the environment',
  tags: ['Vault'],
  request: {
    params: z.object({
      projectId: z.string(),
      serviceId: z.string()
    })
  },
  responses: {
    200: {
      description: 'List of secrets for the environment',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), data: z.record(z.string()) }) } }
    }
  }
});

const writeBatchRoute = createRoute({
  method: 'post',
  path: '/batch',
  summary: 'Write multiple secrets to the vault',
  tags: ['Vault'],
  request: {
    params: z.object({
      projectId: z.string(),
      serviceId: z.string()
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            secrets: z.array(z.object({
              key: z.string(),
              value: z.string(),
              isSensitive: z.boolean(),
            }))
          })
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Batch secrets written successfully',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), message: z.string() }) } }
    }
  }
});

// 7. Delete Secret
const deleteSecretRoute = createRoute({
  method: 'delete',
  path: '/{path}',
  summary: 'Delete a secret from the vault',
  tags: ['Vault'],
  request: {
    params: z.object({
      projectId: z.string(),
      serviceId: z.string(),
      path: z.string().openapi({ example: "DATABASE_URL" })
    })
  },
  responses: {
    200: {
      description: 'Secret deleted successfully',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), message: z.string() }) } }
    },
    404: { description: 'Secret not found' }
  }
});

// --- Handlers ---

vaultRoutes.openapi(listCurrentSecretsRoute, (async (c: any) => {
  const orgId = c.get("organizationId");
  const projectId = c.get("projectId");
  const serviceId = c.get("serviceId");
  const envId = c.get("envId");

  if (!projectId || !serviceId || !envId) {
    return c.json({ success: false, error: "Token not scoped to a service/project" }, 400);
  }

  const { tmkSalt } = await getOrgContext(orgId);
  const secrets = await secretService.listSecrets({ orgId, envId, serviceId, tmkSalt });

  return c.json({ success: true, data: secrets }, 200);
}) as any);

vaultRoutes.openapi(readCurrentSecretRoute, (async (c: any) => {
  const { path } = c.req.valid("param");
  const decodedPath = decodeURIComponent(path);
  const orgId = c.get("organizationId");
  const projectId = c.get("projectId");
  const serviceId = c.get("serviceId");
  const envId = c.get("envId");

  if (!projectId || !serviceId || !envId) {
    return c.json({ success: false, error: "Token not scoped to a service/project" }, 400);
  }

  const { tmkSalt } = await getOrgContext(orgId);
  const value = await secretService.readSecret({ orgId, userId: c.get("userId"), projectId, serviceId, envId, path: decodedPath, tmkSalt });

  if (!value) return c.json({ success: false, error: "Secret not found" }, 404);
  return c.json({ success: true, data: { content: value } }, 200);
}) as any);

// Existing handlers...
vaultRoutes.openapi(writeSecretRoute, (async (c: any) => {
    const { path, content, metadata } = c.req.valid("json");
    const { projectId, serviceId } = c.req.valid("param");
    const orgId = c.get("organizationId");
    const userId = c.get("userId");
    const envId = c.get("envId");
  
    const { tmkSalt } = await getOrgContext(orgId);
    
    await secretService.writeSecret({
      orgId, userId, projectId, serviceId, envId, path, value: content, metadata, tmkSalt
    });
  
    return c.json({ success: true, message: "Secret stored." }, 201);
}) as any);

vaultRoutes.openapi(readSecretRoute, (async (c: any) => {
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
}) as any);

vaultRoutes.openapi(syncSecretsRoute, (async (c: any) => {
    const { projectId, serviceId } = c.req.valid("param");
    const orgId = c.get("organizationId");
    const envId = c.get("envId");
  
    const { tmkSalt } = await getOrgContext(orgId);
    const secrets = await secretService.listSecrets({ orgId, envId, serviceId, tmkSalt });
  
    return c.json({ success: true, data: secrets }, 200);
}) as any);

vaultRoutes.openapi(writeBatchRoute, (async (c: any) => {
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
}) as any);

vaultRoutes.openapi(deleteSecretRoute, (async (c: any) => {
    const { path, projectId, serviceId } = c.req.valid("param");
    const decodedPath = decodeURIComponent(path);
    const orgId = c.get("organizationId");
    const userId = c.get("userId");
    const envId = c.get("envId");
  
    const { tmkSalt } = await getOrgContext(orgId);
    
    await secretService.deleteSecret({
      orgId, userId, projectId, serviceId, envId, path: decodedPath, tmkSalt
    });
  
    return c.json({ success: true, message: "Secret deleted." }, 200);
}) as any);
