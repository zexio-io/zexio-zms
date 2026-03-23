import { OrchestrationRepository } from "../domain/repository.js";
import { Organization, Project, Environment, Service, ServiceToken, McpToken, AuditLog } from "../domain/entities.js";
import { randomBytes } from "node:crypto";

export class OrchestrationService {
  constructor(private repo: OrchestrationRepository) {}

  async createOrganization(name: string, ownerId: string, tx?: any): Promise<Organization> {
    const org: Organization = {
      id: crypto.randomUUID(),
      ownerId, // ZMS CE: Direct ownership
      name,
      createdAt: new Date(),
      tmkSalt: randomBytes(32).toString("hex"),
      keyHistory: [],
    };

    await this.repo.createOrg(org, tx);

    // Initial Audit Log
    await this.repo.createAuditLog({
      organizationId: org.id,
      actorId: ownerId,
      action: 'ORG_CREATE' as any,
      resourceId: org.id,
      metadata: { name: org.name },
      createdAt: new Date()
    }, tx);

    return org;
  }

  async findOrgById(id: string): Promise<Organization | null> {
    return await this.repo.findOrgById(id);
  }

  async createProjectWithDefaults(orgId: string, name: string, actorId: string, servicesToCreate: string[] = [], tx?: any): Promise<{ project: Project; environments: Environment[]; services: Service[]; tokens: { serviceId: string; serviceName: string; token: string }[] }> {
    const project: Project = {
      id: crypto.randomUUID(),
      organizationId: orgId,
      name,
      createdAt: new Date(),
    };

    await this.repo.createProject(project, tx);

    // Audit Log
    await this.repo.createAuditLog({
      organizationId: orgId,
      actorId: actorId,
      action: 'PROJECT_CREATE',
      resourceId: project.id,
      metadata: { name: project.name },
      createdAt: new Date()
    }, tx);

    const envNames = ["production", "staging", "development"];
    const environments: Environment[] = envNames.map((name) => ({
      id: crypto.randomUUID(),
      projectId: project.id,
      name,
      createdAt: new Date(),
    }));

    for (const env of environments) {
      await this.repo.createEnvironment(env, tx);
    }

    const services: Service[] = servicesToCreate.map((sName) => ({
      id: crypto.randomUUID(),
      projectId: project.id,
      name: sName,
      createdAt: new Date(),
    }));

    for (const service of services) {
      await this.repo.createService(service, tx);
    }

    // Automatic Token Provisioning for Development
    const devEnv = environments.find(e => e.name === "development");
    const tokens: { serviceId: string; serviceName: string; token: string }[] = [];

    if (devEnv) {
      for (const service of services) {
        const { token } = await this.generateServiceToken(orgId, project.id, service.id, devEnv.id, `${service.name} Default Token`, tx);
        tokens.push({ serviceId: service.id, serviceName: service.name, token });
      }
    }

    return { project, environments, services, tokens };
  }

  async createEnvironment(projectId: string, name: string, tx?: any): Promise<Environment> {
    const env: Environment = {
      id: crypto.randomUUID(),
      projectId,
      name,
      createdAt: new Date(),
    };
    await this.repo.createEnvironment(env, tx);
    return env;
  }

  async createService(projectId: string, name: string, tx?: any): Promise<Service> {
    const service: Service = {
      id: crypto.randomUUID(),
      projectId,
      name,
      createdAt: new Date(),
    };
    await this.repo.createService(service, tx);
    return service;
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    return this.repo.findOrgById(id);
  }

  async updateOrganization(orgId: string, updates: Partial<Organization>, actorId: string): Promise<void> {
    await this.repo.updateOrg(orgId, updates);
    
    // Audit Log
    await this.repo.createAuditLog({
      organizationId: orgId,
      actorId: actorId,
      action: 'ORG_UPDATE' as any,
      resourceId: orgId,
      metadata: updates,
      createdAt: new Date()
    });
  }

  async listUserOrganizations(userId: string, page: number = 1, limit: number = 10): Promise<{ orgs: Organization[]; total: number }> {
    const skip = (page - 1) * limit;
    return this.repo.listOrganizationsByUser(userId, { skip, take: limit });
  }

  async getProjects(orgId: string): Promise<Project[]> {
    return this.repo.findProjectsByOrg(orgId);
  }

  async getProjectById(projectId: string): Promise<Project | null> {
    return this.repo.findProjectById(projectId);
  }

  async updateProject(orgId: string, projectId: string, updates: Partial<Project>, actorId: string): Promise<void> {
    await this.repo.updateProject(projectId, updates);
    
    // Audit Log
    await this.repo.createAuditLog({
      organizationId: orgId,
      actorId: actorId,
      action: 'PROJECT_UPDATE' as any,
      resourceId: projectId,
      metadata: updates,
      createdAt: new Date()
    });
  }

  async listEnvironments(projectId: string): Promise<Environment[]> {
    return this.repo.findEnvironmentsByProject(projectId);
  }

  async deleteEnvironment(projectId: string, envId: string): Promise<void> {
    const env = await this.repo.findEnvironmentById(envId);
    if (!env || env.projectId !== projectId) {
      throw new Error('Environment not found or project mismatch');
    }
    await this.repo.deleteEnvironment(envId);
  }

  async deleteProject(orgId: string, projectId: string, actorId: string): Promise<void> {
    await this.repo.deleteProject(projectId);

    // Audit Log
    await this.repo.createAuditLog({
      organizationId: orgId,
      actorId: actorId,
      action: 'PROJECT_DELETE',
      resourceId: projectId,
      createdAt: new Date()
    });
  }

  async listServices(projectId: string): Promise<Service[]> {
    return this.repo.findServicesByProject(projectId);
  }

  async updateService(orgId: string, serviceId: string, updates: Partial<Service>, actorId: string): Promise<void> {
    await this.repo.updateService(serviceId, updates);
    
    // Audit Log
    await this.repo.createAuditLog({
      organizationId: orgId,
      actorId: actorId,
      action: 'SERVICE_UPDATE' as any,
      resourceId: serviceId,
      metadata: updates,
      createdAt: new Date()
    });
  }

  async deleteService(orgId: string, serviceId: string, actorId: string): Promise<void> {
    await this.repo.deleteService(serviceId);

    // Audit Log
    await this.repo.createAuditLog({
      organizationId: orgId,
      actorId: actorId,
      action: 'SERVICE_DELETE' as any,
      resourceId: serviceId,
      createdAt: new Date()
    });
  }

  async getServiceById(projectId: string, serviceId: string): Promise<Service | null> {
    const services = await this.repo.findServicesByProject(projectId);
    return services.find(s => s.id === serviceId) || null;
  }

  async getOrCreateDefaultOrg(userId: string): Promise<Organization> {
    const existing = await this.repo.listOrganizationsByUser(userId, { skip: 0, take: 1 });
    if (existing.total > 0) return existing.orgs[0];

    const orgId = crypto.randomUUID();
    const org: Organization = {
      id: orgId,
      ownerId: userId, // ZMS CE: First user becomes owner
      name: "Default Org",
      createdAt: new Date(),
      tmkSalt: randomBytes(16).toString("hex"),
      keyHistory: [],
    };
    await this.repo.createOrg(org);

    return org;
  }

  static hashToken(token: string, orgId: string): string {
    const { createHash } = require('node:crypto');
    return createHash('sha256')
      .update(`${token}.${orgId}`)
      .digest('hex');
  }

  async generateServiceToken(
    orgId: string,
    projectId: string,
    serviceId: string,
    environmentId: string,
    name: string,
    tx?: any
  ): Promise<{ token: string; entity: ServiceToken }> {
    const rawToken = `zms_st_${randomBytes(24).toString("hex")}`;
    const tokenHash = OrchestrationService.hashToken(rawToken, orgId);

    const { createHash } = require('node:crypto');
    const lookupHash = createHash('sha256').update(rawToken).digest('hex');
    
    const token: ServiceToken = {
      id: crypto.randomUUID(),
      organizationId: orgId,
      projectId,
      serviceId,
      environmentId,
      name,
      tokenHash,
      lookupHash,
      lastFour: rawToken.slice(-4),
      createdAt: new Date(),
    };

    await this.repo.createServiceToken(token, tx);
    return { token: rawToken, entity: token };
  }

  async listServiceTokensByProject(projectId: string): Promise<ServiceToken[]> {
    return this.repo.findServiceTokensByProject(projectId);
  }

  async listServiceTokensByService(serviceId: string): Promise<ServiceToken[]> {
    return this.repo.findServiceTokensByService(serviceId);
  }

  async deleteServiceToken(orgId: string, tokenId: string, actorId: string): Promise<void> {
    await this.repo.deleteServiceToken(tokenId);
    
    // Audit Log
    await this.repo.createAuditLog({
      organizationId: orgId,
      actorId: actorId,
      action: 'SERVICE_TOKEN_REVOKE' as any,
      resourceId: tokenId,
      createdAt: new Date()
    });
  }

  async generateMcpToken(orgId: string, name: string, actorId: string): Promise<{ token: string; entity: McpToken }> {
    const rawToken = `zms_mcp_${randomBytes(24).toString("hex")}`;
    const { createHash } = require('node:crypto');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    
    const token: McpToken = {
      id: crypto.randomUUID(),
      organizationId: orgId,
      name,
      tokenHash,
      lastFour: rawToken.slice(-4),
      createdAt: new Date(),
    };

    await this.repo.createMcpToken(token);

    // Audit Log
    await this.repo.createAuditLog({
      organizationId: orgId,
      actorId: actorId,
      action: 'MCP_TOKEN_GENERATE',
      resourceId: token.id,
      metadata: { name: token.name },
      createdAt: new Date()
    });

    return { token: rawToken, entity: token };
  }

  async listMcpTokens(orgId: string): Promise<McpToken[]> {
    return this.repo.findMcpTokensByOrg(orgId);
  }

  async findAuditLogsByOrg(orgId: string, options: { skip: number; take: number; search?: string; action?: string; projectId?: string } = { skip: 0, take: 50 }): Promise<{ logs: AuditLog[]; total: number }> {
    return await this.repo.findAuditLogsByOrg(orgId, options);
  }

  async findAuditLogsByProject(projectId: string, options: { skip: number; take: number; search?: string; action?: string } = { skip: 0, take: 50 }): Promise<{ logs: AuditLog[]; total: number }> {
    return await this.repo.findAuditLogsByProject(projectId, options);
  }

  async deleteMcpToken(orgId: string, tokenId: string, actorId: string): Promise<void> {
    // Fetch info before deletion for audit record
    const tokens = await this.repo.findMcpTokensByOrg(orgId);
    const token = tokens.find(t => t.id === tokenId);
    const tokenName = token?.name || 'Unknown Token';

    await this.repo.deleteMcpToken(tokenId);
    
    // Audit Log
    await this.repo.createAuditLog({
      organizationId: orgId,
      actorId: actorId,
      action: 'MCP_TOKEN_REVOKE',
      resourceId: tokenId,
      metadata: { name: tokenName },
      createdAt: new Date()
    });
  }

  async listSecrets(params: {
    orgId?: string;
    projectId?: string;
    envName?: string;
  }): Promise<any[]> {
    const { getGlobalMasterKey, listSecrets: bulkDecrypt } = require('../../repository.js');
    
    // 1. Resolve Org
    let org: Organization | null = null;
    if (params.orgId) {
      org = await this.repo.findOrgById(params.orgId);
    } else {
      const orgs = await this.repo.listOrganizationsByUser("default", { skip: 0, take: 1 });
      if (orgs.total > 0) org = orgs.orgs[0];
      
      if (!org) {
          const allOrgs = await this.repo.listOrganizationsByUser("", { skip: 0, take: 1 });
          if (allOrgs.total > 0) org = allOrgs.orgs[0];
      }
    }
    if (!org) throw new Error("Organization not found. Run 'zms init' first.");

    // 2. Resolve Project
    let project: Project | null = null;
    if (params.projectId) {
      project = await this.repo.findProjectById(params.projectId);
    } else {
      const projects = await this.repo.findProjectsByOrg(org.id);
      if (projects.length > 0) project = projects[0];
    }
    if (!project) throw new Error("Project not found.");

    // 3. Resolve Environment
    const envs = await this.repo.findEnvironmentsByProject(project.id);
    const env = envs.find(e => e.name === (params.envName || "production")) || envs[0];
    if (!env) throw new Error("No environment found for this project.");

    // 4. Resolve Services & Decrypt Secrets
    const services = await this.repo.findServicesByProject(project.id);
    const masterKey = getGlobalMasterKey();
    let allSecrets: any[] = [];

    for (const service of services) {
      const secretsMap = await bulkDecrypt(masterKey, service.id, env.id, org.tmkSalt);
      Object.entries(secretsMap).forEach(([key, value]) => {
        if (!allSecrets.find(s => s.key === key)) {
          allSecrets.push({ key, value: value as string });
        }
      });
    }

    return allSecrets;
  }

  async resolveTokenContext(rawToken: string): Promise<{ orgId: string; projectId: string; envName: string } | null> {
    const { createHash } = require('node:crypto');
    const lookupHash = createHash('sha256').update(rawToken).digest('hex');
    
    const tokenRecord = await this.repo.findServiceTokenByLookupHash(lookupHash);
    if (!tokenRecord) return null;

    const env = await this.repo.findEnvironmentById(tokenRecord.environmentId);
    
    return {
      orgId: tokenRecord.organizationId,
      projectId: tokenRecord.projectId,
      envName: env?.name || 'production'
    };
  }
}
