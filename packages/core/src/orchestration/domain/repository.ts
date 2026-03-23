import { Organization, Project, Environment, Service, ServiceToken, McpToken, AuditLog } from "./entities.js";

export interface OrchestrationRepository {
  // Organization Ops
  findOrgById(id: string): Promise<Organization | null>;
  listOrganizationsByUser(userId: string, options: { skip: number; take: number }): Promise<{ orgs: Organization[]; total: number }>;
  createOrg(org: Organization, tx?: any): Promise<void>;
  updateOrg(id: string, updates: Partial<Organization>): Promise<void>;

  // Project Ops
  findProjectById(id: string): Promise<Project | null>;
  findProjectsByOrg(orgId: string): Promise<Project[]>;
  createProject(project: Project, tx?: any): Promise<void>;
  updateProject(id: string, updates: Partial<Project>): Promise<void>;
  deleteProject(id: string): Promise<void>;
  
  // Environment Ops
  findEnvironmentById(id: string): Promise<Environment | null>;
  findEnvironmentsByProject(projectId: string): Promise<Environment[]>;
  createEnvironment(env: Environment, tx?: any): Promise<void>;
  deleteEnvironment(id: string): Promise<void>;

  // Service Ops
  findServicesByProject(projectId: string): Promise<Service[]>;
  createService(service: Service, tx?: any): Promise<void>;
  updateService(id: string, updates: Partial<Service>): Promise<void>;
  deleteService(id: string): Promise<void>;

  // Membership Ops
  isMember(orgId: string, userId: string): Promise<boolean>;
  addMember(orgId: string, userId: string, role: string): Promise<void>;

  // Service Token Ops
  findServiceTokensByService(serviceId: string): Promise<ServiceToken[]>;
  findServiceTokensByProject(projectId: string): Promise<ServiceToken[]>;
  findServiceTokenByLookupHash(hash: string): Promise<ServiceToken | null>;
  createServiceToken(token: ServiceToken, tx?: any): Promise<void>;
  deleteServiceToken(tokenId: string): Promise<void>;

  // MCP Token Ops
  findMcpTokensByOrg(orgId: string): Promise<McpToken[]>;
  createMcpToken(token: McpToken, tx?: any): Promise<void>;
  deleteMcpToken(tokenId: string, tx?: any): Promise<void>;

  // Audit Ops
  createAuditLog(log: AuditLog, tx?: any): Promise<void>;
  findAuditLogsByOrg(orgId: string, options: { skip: number; take: number; search?: string; action?: string; projectId?: string }): Promise<{ logs: AuditLog[]; total: number }>;
  findAuditLogsByProject(projectId: string, options: { skip: number; take: number; search?: string; action?: string }): Promise<{ logs: AuditLog[]; total: number }>;
}
