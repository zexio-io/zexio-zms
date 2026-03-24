import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import {
  OrchestrationService,
  DrizzleOrchestrationRepository,
} from "@zexio/zms-core";
import { authGuard } from "../../middlewares/auth-guard.js";
import { AppEnv } from "../../types/hono.js";

export const orchestrationRoutes = new Hono<AppEnv>();
export const serviceTokenRoutes = new Hono<AppEnv>();

// Initialize Services & Repositories
const repo = new DrizzleOrchestrationRepository();
const orchService = new OrchestrationService(repo);

// Apply Global Middlewares
orchestrationRoutes.use("*", authGuard);
serviceTokenRoutes.use("*", authGuard);

// Schemas (Stripped of .openapi)
const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const orgSchema = z.object({
  id: z.string(),
  name: z.string(),
  projects: z.array(projectSchema).optional(),
});

const mcpTokenSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  lastFour: z.string(),
  createdAt: z.string(),
});

const serviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
});

const serviceTokenSchema = z.object({
  id: z.string(),
  name: z.string(),
  lastFour: z.string(),
  environmentId: z.string().optional(),
  serviceId: z.string().optional(),
  createdAt: z.string(),
  service: z.object({ id: z.string(), name: z.string() }).optional(),
  environment: z.object({ id: z.string(), name: z.string() }).optional(),
});

const environmentSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  createdAt: z.string(),
});

export {
  orgSchema,
  projectSchema,
  environmentSchema,
  mcpTokenSchema,
  serviceSchema,
  serviceTokenSchema
};

// --- Handlers (Orchestration) ---

orchestrationRoutes.get('/', zValidator('query', z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
})), async (c) => {
  const isMachine = c.get('isMachine');
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const { page, limit } = c.req.valid("query");

  if (isMachine && orgId) {
    const org = await orchService.getOrganizationById(orgId);
    return c.json({
      success: true,
      data: org ? [{ id: org.id, name: org.name }] : [],
      meta: { total: org ? 1 : 0, page: 1, limit: 10 }
    }, 200);
  }

  const p = Math.max(1, parseInt(page));
  const l = Math.max(1, Math.min(100, parseInt(limit)));
  const { orgs, total } = await orchService.listUserOrganizations(userId, p, l);

  return c.json({
    success: true,
    data: orgs.map(o => ({ 
      id: o.id, 
      name: o.name,
      projects: o.projects?.map(p => ({ id: p.id, name: p.name }))
    })),
    meta: { total, page: p, limit: l }
  }, 200);
});

orchestrationRoutes.post('/', zValidator('json', z.object({ name: z.string().min(3) })), async (c) => {
  const { name } = c.req.valid("json");
  const userId = c.get("userId");
  const org = await orchService.createOrganization(name, userId);
  return c.json({ success: true, data: { id: org.id, name: org.name } }, 201);
});

orchestrationRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const org = await orchService.getOrganizationById(id);
  if (!org) return c.json({ success: false, error: "Not found" }, 404);
  return c.json({
    success: true,
    data: { id: org.id, name: org.name, projects: org.projects?.map(p => ({ id: p.id, name: p.name })) }
  }, 200);
});

// Projects
orchestrationRoutes.get('/:orgId/projects', async (c) => {
  const { orgId } = c.req.param();
  const projects = await orchService.getProjects(orgId);
  return c.json({ success: true, data: projects.map((p: any) => ({ id: p.id, name: p.name })) });
});

orchestrationRoutes.post('/:orgId/projects', zValidator('json', z.object({ name: z.string().min(2), services: z.array(z.string()).optional() })), async (c) => {
  const { orgId } = c.req.param();
  const { name, services } = c.req.valid("json");
  const userId = c.get("userId");
  const result = await orchService.createProjectWithDefaults(orgId, name, userId, services || []);
  return c.json({ success: true, data: { id: result.project.id, name: result.project.name } }, 201);
});

orchestrationRoutes.get('/:orgId/projects/:projectId', async (c) => {
  const { projectId } = c.req.param();
  const project = await orchService.getProjectById(projectId);
  if (!project) return c.json({ success: false, error: "Project not found" }, 404);
  return c.json({ success: true, data: { id: project.id, name: project.name } });
});

// Services
orchestrationRoutes.get('/:orgId/projects/:projectId/services', async (c) => {
  const { projectId } = c.req.param();
  const services = await orchService.listServices(projectId);
  return c.json({ success: true, data: services.map((s: any) => ({ id: s.id, name: s.name, createdAt: s.createdAt.toISOString() })) });
});

orchestrationRoutes.post('/:orgId/projects/:projectId/services', zValidator('json', z.object({ name: z.string().min(2) })), async (c) => {
  const { projectId } = c.req.param();
  const { name } = c.req.valid("json");
  const service = await orchService.createService(projectId, name);
  return c.json({ success: true, data: { id: service.id, name: service.name, createdAt: service.createdAt.toISOString() } }, 201);
});

orchestrationRoutes.delete('/:orgId/projects/:projectId/services/:serviceId', async (c) => {
    const { orgId, serviceId } = c.req.param();
    const userId = c.get("userId");
    await orchService.deleteService(orgId, serviceId, userId);
    return c.json({ success: true });
});

// Environments
orchestrationRoutes.get('/:orgId/projects/:projectId/environments', async (c) => {
    const { projectId } = c.req.param();
    const envs = await orchService.listEnvironments(projectId);
    return c.json({ success: true, data: envs.map((e: any) => ({ id: e.id, projectId: e.projectId, name: e.name, createdAt: e.createdAt.toISOString() })) });
});

orchestrationRoutes.post('/:orgId/projects/:projectId/environments', zValidator('json', z.object({ name: z.string().min(2) })), async (c) => {
    const { projectId } = c.req.param();
    const { name } = c.req.valid("json");
    const env = await orchService.createEnvironment(projectId, name);
    return c.json({ success: true, data: { id: env.id, projectId: env.projectId, name: env.name, createdAt: env.createdAt.toISOString() } }, 201);
});

// --- Handlers (Service Tokens) ---

serviceTokenRoutes.get('/', zValidator('query', z.object({ projectId: z.string().optional(), serviceId: z.string().optional() })), async (c) => {
  const { projectId, serviceId } = c.req.valid("query");
  if (!projectId && !serviceId) return c.json({ success: true, data: [] });

  let tokens: any[] = [];
  if (serviceId) tokens = await orchService.listServiceTokensByService(serviceId);
  else if (projectId) tokens = await orchService.listServiceTokensByProject(projectId);

  return c.json({
    success: true,
    data: tokens.map((t: any) => ({
      id: t.id,
      name: t.name,
      lastFour: t.lastFour,
      environmentId: t.environmentId || undefined,
      serviceId: t.serviceId || undefined,
      createdAt: t.createdAt.toISOString(),
      service: t.service ? { id: t.service.id, name: t.service.name } : undefined,
      environment: t.environment ? { id: t.environment.id, name: t.environment.name } : undefined,
    }))
  });
});

serviceTokenRoutes.post('/', zValidator('json', z.object({
    projectId: z.string(),
    serviceId: z.string(),
    organizationId: z.string(),
    environmentId: z.string(),
    name: z.string().min(2)
})), async (c) => {
  const { projectId, serviceId, organizationId, environmentId, name } = c.req.valid("json");
  const result = await orchService.generateServiceToken(organizationId, projectId, serviceId, environmentId, name);
  return c.json({
    success: true,
    token: result.token,
    data: { id: result.entity.id, name: result.entity.name, lastFour: result.entity.lastFour, createdAt: result.entity.createdAt.toISOString() }
  }, 201);
});

serviceTokenRoutes.delete('/:tokenId', async (c) => {
  const tokenId = c.req.param('tokenId');
  const orgId = c.req.header('x-zms-organization-id')!;
  const userId = c.get("userId");
  await orchService.deleteServiceToken(orgId, tokenId, userId);
  return c.json({ success: true });
});

// MCP Tokens
orchestrationRoutes.get('/:orgId/mcp-tokens', async (c) => {
  const { orgId } = c.req.param();
  const tokens = await orchService.listMcpTokens(orgId);
  return c.json({ success: true, data: tokens.map((t: any) => ({ id: t.id, name: t.name, lastFour: t.lastFour, createdAt: t.createdAt.toISOString() })) });
});

orchestrationRoutes.post('/:orgId/mcp-tokens', zValidator('json', z.object({ name: z.string().min(2) })), async (c) => {
  const { orgId } = c.req.param();
  const { name } = c.req.valid("json");
  const userId = c.get("userId");
  const { token, entity } = await orchService.generateMcpToken(orgId, name, userId);
  return c.json({ success: true, token, data: { id: entity.id, name: entity.name, lastFour: entity.lastFour, createdAt: entity.createdAt.toISOString() } }, 201);
});

orchestrationRoutes.delete('/:orgId/mcp-tokens/:tokenId', async (c) => {
  const { orgId, tokenId } = c.req.param();
  const userId = c.get("userId");
  await orchService.deleteMcpToken(orgId, tokenId, userId);
  return c.json({ success: true }, 200);
});
