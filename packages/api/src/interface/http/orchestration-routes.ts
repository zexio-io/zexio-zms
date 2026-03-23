import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  OrchestrationService,
  DrizzleOrchestrationRepository,
  Environment
} from "@zexio/zms-core";
import { authGuard } from "../../middlewares/auth-guard.js";
import { AppEnv } from "../../types/hono.js";

export const orchestrationRoutes = new OpenAPIHono<AppEnv>();
export const serviceTokenRoutes = new OpenAPIHono<AppEnv>();

// Initialize Services & Repositories
const repo = new DrizzleOrchestrationRepository();
const orchService = new OrchestrationService(repo);

// Apply Global Middlewares for this sub-app
orchestrationRoutes.use("*", authGuard);
serviceTokenRoutes.use("*", authGuard);

// Schemas
const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
}).openapi("Project");

const orgSchema = z.object({
  id: z.string(),
  name: z.string(),
  projects: z.array(projectSchema).optional(),
}).openapi("Organization");

const mcpTokenSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  lastFour: z.string(),
  createdAt: z.string(),
}).openapi("McpToken");

const serviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
}).openapi("Service");

const serviceTokenSchema = z.object({
  id: z.string(),
  name: z.string(),
  lastFour: z.string(),
  environmentId: z.string().optional(),
  serviceId: z.string().optional(),
  createdAt: z.string(),
  service: z.object({ id: z.string(), name: z.string() }).optional(),
  environment: z.object({ id: z.string(), name: z.string() }).optional(),
}).openapi("ServiceToken");

const environmentSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  createdAt: z.string(),
}).openapi("Environment");

export {
  orgSchema,
  projectSchema,
  environmentSchema,
  mcpTokenSchema,
  serviceSchema,
  serviceTokenSchema
};

// 0. Route: List Organizations
const listOrgsRoute = createRoute({
  method: 'get',
  path: '/',
  summary: 'List organizations for the current user',
  tags: ['Organizations'],
  request: {
    query: z.object({
      page: z.string().optional().default("1").openapi({ example: "1" }),
      limit: z.string().optional().default("10").openapi({ example: "10" }),
    })
  },
  responses: {
    200: {
      description: 'Organization list with pagination',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.array(orgSchema),
            meta: z.object({
              total: z.number(),
              page: z.number(),
              limit: z.number()
            })
          })
        }
      }
    }
  }
});

// 1. Route: Create Organization
const createOrgRoute = createRoute({
  method: 'post',
  path: '/',
  summary: 'Create a new organization',
  tags: ['Organizations'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(3),
          })
        }
      }
    }
  },
  responses: {
    201: {
      description: 'Organization created',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), data: orgSchema }) } }
    }
  }
});

const getOrgRoute = createRoute({
  method: 'get',
  path: '/{id}',
  summary: 'Get organization details by ID',
  tags: ['Organizations'],
  request: {
    params: z.object({ id: z.string() })
  },
  responses: {
    200: {
      description: 'Organization found',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), data: orgSchema }) } }
    },
    404: { description: 'Not found' }
  }
});

const updateOrgRoute = createRoute({
  method: 'patch',
  path: '/{id}',
  summary: 'Update organization details',
  tags: ['Organizations'],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(3).optional(),
          })
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Organization updated',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), data: orgSchema }) } }
    },
    404: { description: 'Not found' }
  }
});

// 2b. Route: Get Project Details
const getProjectRoute = createRoute({
  method: 'get',
  path: '/{orgId}/projects/{projectId}',
  summary: 'Get a specific project detail by ID',
  tags: ['Projects'],
  request: {
    params: z.object({
      orgId: z.string(),
      projectId: z.string()
    })
  },
  responses: {
    200: {
      description: 'Project found',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), data: projectSchema }) } }
    },
    404: {
      description: 'Project not found',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), error: z.string() }) } }
    }
  }
});

// 3. Route: Get Projects
const getProjectsRoute = createRoute({
  method: 'get',
  path: '/{orgId}/projects',
  summary: 'List all projects in an organization',
  tags: ['Projects'],
  request: {
    params: z.object({ orgId: z.string() })
  },
  responses: {
    200: {
      description: 'Project list',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), data: z.array(projectSchema) }) } }
    }
  }
});

// 4. Route: Create Project
const createProjectRoute = createRoute({
  method: 'post',
  path: '/{orgId}/projects',
  summary: 'Create a new project',
  tags: ['Projects'],
  request: {
    params: z.object({ orgId: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(2),
            services: z.array(z.string()).optional().openapi({ example: ["api", "worker"] })
          })
        }
      }
    }
  },
  responses: {
    201: {
      description: 'Project created',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), data: projectSchema }) } }
    }
  }
});

// 5. Route: Update Project
const updateProjectRoute = createRoute({
  method: 'patch',
  path: '/{orgId}/projects/{projectId}',
  summary: 'Update project configuration',
  tags: ['Projects'],
  request: {
    params: z.object({
      orgId: z.string().openapi({ example: "org-123" }),
      projectId: z.string().openapi({ example: "proj-456" })
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().optional().openapi({ example: "New Project Name" })
          })
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Project updated',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), data: projectSchema }) } }
    },
    404: {
      description: 'Project not found',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string() }) }) } }
    }
  }
});

// 6. Route: Delete Project
const deleteProjectRoute = createRoute({
  method: 'delete',
  path: '/{orgId}/projects/{projectId}',
  summary: 'Delete a project',
  tags: ['Projects'],
  request: {
    params: z.object({
      orgId: z.string().openapi({ example: "org-123" }),
      projectId: z.string().openapi({ example: "proj-456" })
    })
  },
  responses: {
    204: { description: 'Project deleted' },
    404: {
      description: 'Project not found',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string() }) }) } }
    }
  }
});

// 6b. Route: List Services in Project
const listServicesRoute = createRoute({
  method: 'get',
  path: '/{orgId}/projects/{projectId}/services',
  summary: 'List all services in a project',
  tags: ['Services'],
  request: {
    params: z.object({
      orgId: z.string(),
      projectId: z.string()
    })
  },
  responses: {
    200: {
      description: 'Service list',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), data: z.array(serviceSchema) }) } }
    }
  }
});

const getServiceRoute = createRoute({
  method: 'get',
  path: '/{orgId}/projects/{projectId}/services/{serviceId}',
  summary: 'Get a specific service detail',
  tags: ['Services'],
  request: {
    params: z.object({
      orgId: z.string(),
      projectId: z.string(),
      serviceId: z.string()
    })
  },
  responses: {
    200: {
      description: 'Service details',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), data: serviceSchema }) } }
    },
    404: { description: 'Service not found' }
  }
});

// 6c. Route: Add Service to Project
const addServiceRoute = createRoute({
  method: 'post',
  path: '/{orgId}/projects/{projectId}/services',
  summary: 'Add a new service to a project',
  tags: ['Services'],
  request: {
    params: z.object({
      orgId: z.string(),
      projectId: z.string()
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(2)
          })
        }
      }
    }
  },
  responses: {
    201: {
      description: 'Service created',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), data: serviceSchema }) } }
    }
  }
});

// 6e1. Route: Update Service (Rename)
const updateServiceRoute = createRoute({
  method: 'patch',
  path: '/{orgId}/projects/{projectId}/services/{serviceId}',
  summary: 'Update service configuration (e.g. rename)',
  tags: ['Services'],
  request: {
    params: z.object({
      orgId: z.string(),
      projectId: z.string(),
      serviceId: z.string()
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(2).optional()
          })
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Service updated',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), data: serviceSchema }) } }
    },
    404: { description: 'Service not found' }
  }
});

// 6e2. Route: Delete Service
const deleteServiceRoute = createRoute({
  method: 'delete',
  path: '/{orgId}/projects/{projectId}/services/{serviceId}',
  summary: 'Delete a service from a project',
  tags: ['Services'],
  request: {
    params: z.object({
      orgId: z.string(),
      projectId: z.string(),
      serviceId: z.string()
    })
  },
  responses: {
    200: {
      description: 'Service deleted',
      content: { 'application/json': { schema: z.object({ success: z.boolean() }) } }
    },
    404: { description: 'Service not found' }
  }
});

// 5. Environment Routes
const listEnvironmentsRoute = createRoute({
  method: 'get',
  path: '/{orgId}/projects/{projectId}/environments',
  summary: 'List environments for a project',
  tags: ['Environments'],
  request: {
    params: z.object({ orgId: z.string(), projectId: z.string() })
  },
  responses: {
    200: {
      description: 'Environment list',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), data: z.array(environmentSchema) }) } }
    }
  }
});

const createEnvironmentRoute = createRoute({
  method: 'post',
  path: '/{orgId}/projects/{projectId}/environments',
  summary: 'Create a new environment',
  tags: ['Environments'],
  request: {
    params: z.object({ orgId: z.string(), projectId: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(2),
          })
        }
      }
    }
  },
  responses: {
    201: {
      description: 'Environment created',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), data: environmentSchema }) } }
    }
  }
});

// 6d. Route: List Service Tokens (Unified)
const listServiceTokensRoute = createRoute({
  method: 'get',
  path: '/',
  summary: 'List service tokens (filtered by project or service)',
  tags: ['Service Tokens'],
  request: {
    query: z.object({
      projectId: z.string().optional(),
      serviceId: z.string().optional()
    })
  },
  responses: {
    200: {
      description: 'Token list',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), data: z.array(serviceTokenSchema) }) } }
    }
  }
});

// 6e. Route: Create Service Token
const createServiceTokenRoute = createRoute({
  method: 'post',
  path: '/',
  summary: 'Create a new service token',
  tags: ['Service Tokens'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            projectId: z.string(),
            serviceId: z.string(),
            organizationId: z.string(),
            environmentId: z.string(),
            name: z.string().min(2)
          })
        }
      }
    }
  },
  responses: {
    201: {
      description: 'Token created',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), data: serviceTokenSchema, token: z.string() }) } }
    }
  }
});

// 6f. Route: Delete Service Token
const deleteServiceTokenRoute = createRoute({
  method: 'delete',
  path: '/{tokenId}',
  summary: 'Revoke a service token',
  tags: ['Service Tokens'],
  request: {
    params: z.object({
      tokenId: z.string()
    }),
    headers: z.object({
        'x-zms-organization-id': z.string()
    })
  },
  responses: {
    200: {
      description: 'Token revoked',
      content: { 'application/json': { schema: z.object({ success: z.boolean() }) } }
    }
  }
});

// 7. MCP Token Routes
const listMcpTokensRoute = createRoute({
  method: 'get',
  path: '/{orgId}/mcp-tokens',
  summary: 'List MCP tokens for an organization',
  tags: ['MCP Tokens'],
  request: {
    params: z.object({ orgId: z.string() })
  },
  responses: {
    200: {
      description: 'MCP token list',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), data: z.array(mcpTokenSchema) }) } }
    }
  }
});

const createMcpTokenRoute = createRoute({
  method: 'post',
  path: '/{orgId}/mcp-tokens',
  summary: 'Generate a new MCP token',
  tags: ['MCP Tokens'],
  request: {
    params: z.object({ orgId: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({ name: z.string().min(2) })
        }
      }
    }
  },
  responses: {
    201: {
      description: 'MCP token created',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), data: mcpTokenSchema, token: z.string() }) } }
    }
  }
});

const deleteMcpTokenRoute = createRoute({
  method: 'delete',
  path: '/{orgId}/mcp-tokens/{tokenId}',
  summary: 'Revoke an MCP token',
  tags: ['MCP Tokens'],
  request: {
    params: z.object({
      orgId: z.string(),
      tokenId: z.string()
    })
  },
  responses: {
    204: { description: 'Token revoked' }
  }
});

// Handlers
orchestrationRoutes.openapi(listOrgsRoute, (async (c: any) => {
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
    meta: {
      total,
      page: p,
      limit: l
    }
  }, 200);
}) as any);

orchestrationRoutes.openapi(createOrgRoute, (async (c: any) => {
  const { name } = c.req.valid("json");
  const userId = c.get("userId");
  const org = await orchService.createOrganization(name, userId);
  return c.json({
    success: true,
    data: { id: org.id, name: org.name }
  }, 201);
}) as any);

orchestrationRoutes.openapi(getOrgRoute, (async (c: any) => {
  const { id } = c.req.valid("param");
  const org = await orchService.getOrganizationById(id);

  if (!org) return c.json({ success: false, error: { code: "NOT_FOUND", message: "Organization not found" } }, 404);
  return c.json({
    success: true,
    data: { 
      id: org.id, 
      name: org.name,
      projects: org.projects?.map(p => ({ id: p.id, name: p.name }))
    }
  }, 200);
}) as any);

orchestrationRoutes.openapi(updateOrgRoute, (async (c: any) => {
  const { id } = c.req.valid("param");
  const { name } = c.req.valid("json");
  const userId = c.get("userId");

  const org = await orchService.getOrganizationById(id);
  if (!org) return c.json({ success: false, error: { code: "NOT_FOUND", message: "Organization not found" } }, 404);

  await orchService.updateOrganization(id, { name: name || org.name }, userId);
  
  return c.json({
    success: true,
    data: { id: org.id, name: name || org.name }
  }, 200);
}) as any);

orchestrationRoutes.openapi(getProjectRoute, (async (c: any) => {
  const { projectId } = c.req.valid("param");
  const project = await orchService.getProjectById(projectId);

  if (!project) return c.json({ success: false, error: "Project not found" }, 404);
  return c.json({
    success: true,
    data: { id: project.id, name: project.name }
  }, 200);
}) as any);

orchestrationRoutes.openapi(getProjectsRoute, (async (c: any) => {
  const { orgId } = c.req.valid("param");
  const projects = await orchService.getProjects(orgId);
  return c.json({
    success: true,
    data: projects.map((p: any) => ({ id: p.id, name: p.name }))
  }, 200);
}) as any);

orchestrationRoutes.openapi(createProjectRoute, (async (c: any) => {
  const { orgId } = c.req.valid("param");
  const { name, services } = c.req.valid("json");
  const userId = (c as any).get("userId");
  const result = await orchService.createProjectWithDefaults(orgId, name, userId, services || []);
  return c.json({
    success: true,
    data: { id: result.project.id, name: result.project.name }
  }, 201);
}) as any);

orchestrationRoutes.openapi(updateProjectRoute, (async (c: any) => {
  const { orgId, projectId } = c.req.valid("param");
  const { name } = c.req.valid("json");
  const userId = c.get("userId");

  const project = await orchService.getProjectById(projectId);
  if (!project) return c.json({ success: false, error: { code: "NOT_FOUND", message: "Project not found" } }, 404);

  await orchService.updateProject(orgId, projectId, { name: name || project.name }, userId);
  return c.json({
    success: true,
    data: { id: project.id, name: name || project.name }
  }, 200);
}) as any);

orchestrationRoutes.openapi(deleteProjectRoute, (async (c: any) => {
  const { orgId, projectId } = c.req.valid("param");
  const userId = (c as any).get("userId");

  const project = await orchService.getProjectById(projectId);
  if (!project) return c.json({ success: false, error: { code: "NOT_FOUND", message: "Project not found" } }, 404);

  await orchService.deleteProject(orgId, projectId, userId);
  return c.json({ success: true }, 200);
}) as any);

orchestrationRoutes.openapi(listServicesRoute, (async (c: any) => {
  const { projectId } = c.req.valid("param");
  const services = await orchService.listServices(projectId);
  return c.json({
    success: true,
    data: services.map((s: any) => ({ id: s.id, name: s.name, createdAt: s.createdAt.toISOString() }))
  }, 200);
}) as any);

orchestrationRoutes.openapi(getServiceRoute, (async (c: any) => {
  const { projectId, serviceId } = c.req.valid("param");
  const service = await orchService.getServiceById(projectId, serviceId);

  if (!service) return c.json({ success: false, error: "Service not found" }, 404);

  return c.json({
    success: true,
    data: { id: service.id, name: service.name, createdAt: service.createdAt.toISOString() }
  }, 200);
}) as any);

orchestrationRoutes.openapi(addServiceRoute, (async (c: any) => {
  const { projectId } = c.req.valid("param");
  const { name } = c.req.valid("json");
  const service = await orchService.createService(projectId, name);
  return c.json({
    success: true,
    data: { id: service.id, name: service.name, createdAt: service.createdAt.toISOString() }
  }, 201);
}) as any);

orchestrationRoutes.openapi(updateServiceRoute, (async (c: any) => {
  const { orgId, serviceId } = c.req.valid("param");
  const { name } = c.req.valid("json");
  const userId = c.get("userId");

  await orchService.updateService(orgId, serviceId, { name }, userId);
  const service = await orchService.getServiceById("", serviceId); // projectId not strictly needed for fetch by ID if implemented correctly

  return c.json({
    success: true,
    data: service ? { id: service.id, name: service.name, createdAt: service.createdAt.toISOString() } : null
  }, 200);
}) as any);

orchestrationRoutes.openapi(deleteServiceRoute, (async (c: any) => {
  const { orgId, serviceId } = c.req.valid("param");
  const userId = c.get("userId");

  await orchService.deleteService(orgId, serviceId, userId);
  return c.json({ success: true }, 200);
}) as any);

orchestrationRoutes.openapi(listEnvironmentsRoute, (async (c: any) => {
    const { projectId } = c.req.valid("param");
    const envs = await orchService.listEnvironments(projectId);
    return c.json({
        success: true,
        data: envs.map((e: any) => ({
            id: e.id,
            projectId: e.projectId,
            name: e.name,
            createdAt: e.createdAt.toISOString()
        }))
    }, 200);
}) as any);

orchestrationRoutes.openapi(createEnvironmentRoute, (async (c: any) => {
    const { projectId } = c.req.valid("param");
    const { name } = c.req.valid("json");
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
}) as any);

serviceTokenRoutes.openapi(listServiceTokensRoute, (async (c: any) => {
  const { projectId, serviceId } = c.req.valid("query");
  
  if (!projectId && !serviceId) {
    return c.json({ success: false, data: [] } as any, 200);
  }

  let tokens: any[] = [];
  if (serviceId) {
    tokens = await orchService.listServiceTokensByService(serviceId);
  } else if (projectId) {
    tokens = await orchService.listServiceTokensByProject(projectId);
  }

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
  }, 200);
}) as any);

serviceTokenRoutes.openapi(createServiceTokenRoute, (async (c: any) => {
  const { projectId, serviceId, organizationId, environmentId, name } = await c.req.json();
  const result = await orchService.generateServiceToken(organizationId, projectId, serviceId, environmentId, name);
  
  return c.json({
    success: true,
    token: result.token,
    data: {
      id: result.entity.id,
      name: result.entity.name,
      lastFour: result.entity.lastFour,
      environmentId: result.entity.environmentId,
      serviceId: result.entity.serviceId,
      createdAt: result.entity.createdAt.toISOString()
    }
  }, 201);
}) as any);

serviceTokenRoutes.openapi(deleteServiceTokenRoute, (async (c: any) => {
  const { tokenId } = c.req.valid("param");
  const orgId = c.req.header('x-zms-organization-id')!;
  const userId = (c as any).get("userId");

  await orchService.deleteServiceToken(orgId, tokenId, userId);
  return c.json({ success: true }, 200);
}) as any);

// MCP Token Handlers
orchestrationRoutes.openapi(listMcpTokensRoute, (async (c: any) => {
  const { orgId } = c.req.valid("param");
  const tokens = await orchService.listMcpTokens(orgId);
  return c.json({
    success: true,
    data: tokens.map((t: any) => ({
      id: t.id,
      organizationId: t.organizationId,
      name: t.name,
      lastFour: t.lastFour,
      createdAt: t.createdAt.toISOString()
    }))
  }, 200);
}) as any);

orchestrationRoutes.openapi(createMcpTokenRoute, (async (c: any) => {
  const { orgId } = c.req.valid("param");
  const { name } = c.req.valid("json");
  const userId = (c as any).get("userId");
  const { token, entity } = await orchService.generateMcpToken(orgId, name, userId);
  return c.json({
    success: true,
    token, // Return raw token ONLY ONCE
    data: {
      id: entity.id,
      organizationId: entity.organizationId,
      name: entity.name,
      lastFour: entity.lastFour,
      createdAt: entity.createdAt.toISOString()
    }
  }, 201);
}) as any);

orchestrationRoutes.openapi(deleteMcpTokenRoute, (async (c: any) => {
  const { orgId, tokenId } = c.req.valid("param");
  const userId = (c as any).get("userId");
  await orchService.deleteMcpToken(orgId, tokenId, userId);
  return c.json({ success: true }, 200);
}) as any);
