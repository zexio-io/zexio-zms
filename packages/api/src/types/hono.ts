export interface AppEnv {
  Variables: {
    userId: string;
    organizationId: string;
    projectId?: string;
    serviceId?: string;
    envId?: string;
    isMachine?: boolean;
    user?: any; // Better Auth user object
  };
}
