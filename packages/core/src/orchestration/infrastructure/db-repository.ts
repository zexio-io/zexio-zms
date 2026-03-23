import { db } from "../../db.js";
import * as schema from "../../schema.js";
import { OrchestrationRepository } from "../domain/repository.js";
import { Organization, Project, Environment, Service, ServiceToken, McpToken, AuditLog } from "../domain/entities.js";
import { eq, count, desc, or, like, and, sql } from "drizzle-orm";

export class DrizzleOrchestrationRepository implements OrchestrationRepository {
  async findOrgById(id: string): Promise<Organization | null> {
    const res = await db.query.organization.findFirst({
      where: (o: any, { eq }: any) => eq(o.id, id),
    } as any);

    return res as Organization || null;
  }

  async listOrganizationsByUser(userId: string, options: { skip: number; take: number }): Promise<{ orgs: Organization[]; total: number }> {
    const totalRes = await db.select({ value: count() })
      .from(schema.organization)
      .where(eq(schema.organization.ownerId, userId));

    const total = Number(totalRes[0]?.value || 0);
    if (total === 0) return { orgs: [], total: 0 };

    const res = await db.select()
      .from(schema.organization)
      .where(eq(schema.organization.ownerId, userId))
      .offset(options.skip)
      .limit(options.take);

    // Fetch projects for these organizations
    const orgsWithProjects = await Promise.all((res as any[]).map(async (org) => {
      const projects = await db.select()
        .from(schema.projects)
        .where(eq(schema.projects.organizationId, org.id));
      
      return {
        ...org,
        projects: projects as Project[]
      } as Organization;
    }));

    return {
      orgs: orgsWithProjects,
      total
    };
  }

  async createOrg(org: Organization, tx?: any): Promise<void> {
    const client = tx || db;
    await client.insert(schema.organization).values({
      id: org.id,
      name: org.name,
      ownerId: org.ownerId, // Added ownerId
      createdAt: org.createdAt,
      tmkSalt: org.tmkSalt,
      keyHistory: org.keyHistory,
    });
  }

  async updateOrg(id: string, updates: Partial<Organization>): Promise<void> {
    await db.update(schema.organization)
      .set(updates as any)
      .where(eq(schema.organization.id, id));
  }

  async findProjectById(id: string): Promise<Project | null> {
    const res = await db.query.projects.findFirst({
      where: (p: any, { eq }: any) => eq(p.id, id),
    } as any);
    return res as Project || null;
  }

  async findProjectsByOrg(orgId: string): Promise<Project[]> {
    const res = await db.query.projects.findMany({
      where: (p: any, { eq }: any) => eq(p.organizationId, orgId),
    } as any);
    return (res as any[]).map(r => ({
      id: r.id,
      organizationId: r.organizationId,
      name: r.name,
      createdAt: r.createdAt,
    }));
  }

  async createProject(project: Project, tx?: any): Promise<void> {
    const client = tx || db;
    await client.insert(schema.projects).values({
      id: project.id,
      organizationId: project.organizationId,
      name: project.name,
      createdAt: project.createdAt,
    } as any);
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    await db.update(schema.projects)
      .set(updates as any)
      .where(eq(schema.projects.id, id));
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(schema.projects)
      .where(eq(schema.projects.id, id));
  }
  
  async findEnvironmentById(id: string): Promise<Environment | null> {
    const res = await db.query.environments.findFirst({
      where: (e: any, { eq }: any) => eq(e.id, id),
    } as any);
    return res as Environment || null;
  }

  async findEnvironmentsByProject(projectId: string): Promise<Environment[]> {
    const res = await db.query.environments.findMany({
      where: (e: any, { eq }: any) => eq(e.projectId, projectId),
    } as any);
    return (res as any[]).map(r => ({
      id: r.id,
      projectId: r.projectId,
      name: r.name,
      createdAt: r.createdAt,
    }));
  }

  async createEnvironment(env: Environment, tx?: any): Promise<void> {
    const client = tx || db;
    await client.insert(schema.environments).values({
      id: env.id,
      projectId: env.projectId,
      name: env.name,
      createdAt: env.createdAt,
    } as any);
  }

  async deleteEnvironment(id: string): Promise<void> {
    await db.delete(schema.environments)
      .where(eq(schema.environments.id, id));
  }

  async findServicesByProject(projectId: string): Promise<Service[]> {
    const res = await db.query.services.findMany({
      where: (s: any, { eq }: any) => eq(s.projectId, projectId),
    } as any);
    return (res as any[]).map(r => ({
      id: r.id,
      projectId: r.projectId,
      name: r.name,
      createdAt: r.createdAt,
    }));
  }

  async createService(service: Service, tx?: any): Promise<void> {
    const client = tx || db;
    await client.insert(schema.services).values({
      id: service.id,
      projectId: service.projectId,
      name: service.name,
      createdAt: service.createdAt,
    } as any);
  }

  async updateService(id: string, updates: Partial<Service>): Promise<void> {
    await db.update(schema.services)
      .set(updates as any)
      .where(eq(schema.services.id, id));
  }

  async deleteService(id: string): Promise<void> {
    await db.delete(schema.services)
      .where(eq(schema.services.id, id));
  }

  async isMember(orgId: string, userId: string): Promise<boolean> {
    // In CE, membership is defined by ownership
    const res = await db.query.organization.findFirst({
      where: (o: any, { and, eq }: any) => and(
        eq(o.id, orgId),
        eq(o.ownerId, userId)
      )
    } as any);
    return !!res;
  }

  async addMember(orgId: string, userId: string, role: string): Promise<void> {
    // No-op in Community Edition
    return;
  }

  async findServiceTokensByService(serviceId: string): Promise<ServiceToken[]> {
    const res = await db.select({
      token: schema.serviceTokens,
      service: schema.services,
      environment: schema.environments
    })
      .from(schema.serviceTokens)
      .leftJoin(schema.services, eq(schema.serviceTokens.serviceId, schema.services.id))
      .leftJoin(schema.environments, eq(schema.serviceTokens.environmentId, schema.environments.id))
      .where(eq(schema.serviceTokens.serviceId, serviceId));

    return res.map(r => ({
      ...r.token,
      service: r.service || undefined,
      environment: r.environment || undefined
    })) as ServiceToken[];
  }

  async findServiceTokensByProject(projectId: string): Promise<ServiceToken[]> {
    const res = await db.select({
      token: schema.serviceTokens,
      service: schema.services,
      environment: schema.environments
    })
      .from(schema.serviceTokens)
      .leftJoin(schema.services, eq(schema.serviceTokens.serviceId, schema.services.id))
      .leftJoin(schema.environments, eq(schema.serviceTokens.environmentId, schema.environments.id))
      .where(eq(schema.serviceTokens.projectId, projectId));

    return res.map(r => ({
      ...r.token,
      service: r.service || undefined,
      environment: r.environment || undefined
    })) as ServiceToken[];
  }

  async findServiceTokenByLookupHash(hash: string): Promise<ServiceToken | null> {
    const res = await db.query.serviceTokens.findFirst({
      where: (st: any, { eq }: any) => eq(st.lookupHash, hash),
    } as any);
    return (res as any) || null;
  }

  async createServiceToken(token: ServiceToken, tx?: any): Promise<void> {
    const client = tx || db;
    await client.insert(schema.serviceTokens).values({
      id: token.id,
      organizationId: token.organizationId,
      projectId: token.projectId,
      serviceId: token.serviceId,
      environmentId: token.environmentId,
      name: token.name,
      tokenHash: token.tokenHash,
      lookupHash: token.lookupHash,
      lastFour: token.lastFour,
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
    } as any);
  }

  async deleteServiceToken(tokenId: string): Promise<void> {
    await db.delete(schema.serviceTokens)
      .where(eq(schema.serviceTokens.id, tokenId));
  }

  async findMcpTokensByOrg(orgId: string): Promise<McpToken[]> {
    const res = await db.query.mcpTokens.findMany({
      where: (mt: any, { eq }: any) => eq(mt.organizationId, orgId),
    } as any);
    return res as any[] as McpToken[];
  }

  async createMcpToken(token: McpToken, tx?: any): Promise<void> {
    const client = tx || db;
    await client.insert(schema.mcpTokens).values({
        id: token.id,
        organizationId: token.organizationId,
        name: token.name,
        tokenHash: token.tokenHash,
        lastFour: token.lastFour,
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
    } as any);
  }

  async deleteMcpToken(tokenId: string, tx?: any): Promise<void> {
    const client = tx || db;
    await client.delete(schema.mcpTokens)
        .where(eq(schema.mcpTokens.id, tokenId));
  }

  async createAuditLog(log: AuditLog, tx?: any): Promise<void> {
    const client = tx || db;
    await client.insert(schema.auditLogs).values({
      id: log.id || crypto.randomUUID(),
      organizationId: log.organizationId,
      actorId: log.actorId,
      action: log.action,
      resourceId: log.resourceId,
      metadata: log.metadata,
      createdAt: log.createdAt,
    });
  }

  async findAuditLogsByOrg(orgId: string, options: { skip: number; take: number; search?: string; action?: string; projectId?: string }): Promise<{ logs: AuditLog[]; total: number }> {
    let finalWhere = eq(schema.auditLogs.organizationId, orgId);

    if (options.action) {
      finalWhere = and(
        finalWhere,
        eq(schema.auditLogs.action, options.action)
      ) as any;
    }

    if (options.projectId) {
      // Filter by projectId in metadata (JSON) or resourceId (for project-level events)
      // Triple-layer security: ResourceId, json_extract, and raw string LIKE fallback
      finalWhere = and(
        finalWhere,
        or(
          eq(schema.auditLogs.resourceId, options.projectId),
          sql`json_extract(${schema.auditLogs.metadata}, '$.projectId') = ${options.projectId}`,
          like(schema.auditLogs.metadata, `%projectId%${options.projectId}%`)
        )
      ) as any;
    }

    if (options.search) {
      const searchTerm = `%${options.search}%`;
      finalWhere = and(
        finalWhere,
        or(
          like(schema.user.name, searchTerm),
          like(schema.user.email, searchTerm),
          like(schema.auditLogs.action, searchTerm),
          like(schema.auditLogs.resourceId, searchTerm)
        )
      ) as any;
    }

    const totalRes = await db.select({ value: count() })
      .from(schema.auditLogs)
      .leftJoin(schema.user, eq(schema.auditLogs.actorId, schema.user.id))
      .where(finalWhere);

    const total = Number(totalRes[0]?.value || 0);

    const res = await db.select({
      id: schema.auditLogs.id,
      organizationId: schema.auditLogs.organizationId,
      actorId: schema.auditLogs.actorId,
      actorName: schema.user.name,
      actorEmail: schema.user.email,
      action: schema.auditLogs.action,
      resourceId: schema.auditLogs.resourceId,
      metadata: schema.auditLogs.metadata,
      createdAt: schema.auditLogs.createdAt,
    })
      .from(schema.auditLogs)
      .leftJoin(schema.user, eq(schema.auditLogs.actorId, schema.user.id))
      .where(finalWhere)
      .orderBy(desc(schema.auditLogs.createdAt))
      .offset(options.skip)
      .limit(options.take);

    return { 
      logs: res.map(l => ({
        ...l,
        actorName: l.actorName || l.actorId // Fallback if user deleted
      })) as any, 
      total 
    };
  }

  async findAuditLogsByProject(projectId: string, options: { skip: number; take: number; search?: string; action?: string }): Promise<{ logs: AuditLog[]; total: number }> {
    // For project-level logs, we filter by resourceId OR metadata.projectId
    let finalWhere = or(
      eq(schema.auditLogs.resourceId, projectId),
      sql`json_extract(${schema.auditLogs.metadata}, '$.projectId') = ${projectId}`,
      like(schema.auditLogs.metadata, `%projectId%${projectId}%`)
    );

    if (options.action) {
      finalWhere = and(
        finalWhere,
        eq(schema.auditLogs.action, options.action)
      ) as any;
    }

    if (options.search) {
      const searchTerm = `%${options.search}%`;
      finalWhere = and(
        finalWhere,
        or(
          like(schema.user.name, searchTerm),
          like(schema.user.email, searchTerm),
          like(schema.auditLogs.action, searchTerm),
          like(schema.auditLogs.resourceId, searchTerm)
        )
      ) as any;
    }

    const totalRes = await db.select({ value: count() })
      .from(schema.auditLogs)
      .leftJoin(schema.user, eq(schema.auditLogs.actorId, schema.user.id))
      .where(finalWhere);

    const total = Number(totalRes[0]?.value || 0);

    const res = await db.select({
      id: schema.auditLogs.id,
      organizationId: schema.auditLogs.organizationId,
      actorId: schema.auditLogs.actorId,
      actorName: schema.user.name,
      actorEmail: schema.user.email,
      action: schema.auditLogs.action,
      resourceId: schema.auditLogs.resourceId,
      metadata: schema.auditLogs.metadata,
      createdAt: schema.auditLogs.createdAt,
    })
      .from(schema.auditLogs)
      .leftJoin(schema.user, eq(schema.auditLogs.actorId, schema.user.id))
      .where(finalWhere)
      .orderBy(desc(schema.auditLogs.createdAt))
      .offset(options.skip)
      .limit(options.take);

    return { 
      logs: res.map(l => ({
        ...l,
        actorName: l.actorName || l.actorId
      })) as any, 
      total 
    };
  }
}
