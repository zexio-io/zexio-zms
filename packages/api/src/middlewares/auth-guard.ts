import { Context, Next, MiddlewareHandler } from 'hono';
import { M2MService } from '../services/m2m.js';
import { AppEnv } from '../types/hono.js';
import { verifySessionToken } from '../lib/auth-utils.js';
import { db } from '@zexio/zms-core';
import * as schema from '@zexio/zms-core';
import { eq } from 'drizzle-orm';

export const authGuard: MiddlewareHandler<AppEnv> = async (c, next) => {
  const m2mToken = c.req.header('X-ZMS-Token');
  const orgHeader = c.req.header('X-ZMS-Organization-Id') || c.req.header('X-ZMS-Org-Id');
  const authHeader = c.req.header('Authorization');

  console.log(`🛡️ AuthGuard: [${c.req.method}] ${c.req.path} | ident: ${authHeader ? 'Bearer' : 'None'} | m2m: ${m2mToken ? 'Yes' : 'No'}`);

  // 1. Check for Service Token (Direct Machine Identity)
  if (m2mToken) {
    const serviceToken = await M2MService.verifyServiceToken(m2mToken, orgHeader);
    
    if (serviceToken) {
      c.set('isMachine', true);
      c.set('organizationId', serviceToken.organizationId);
      c.set('projectId', serviceToken.projectId);
      c.set('serviceId', serviceToken.serviceId);
      c.set('envId', serviceToken.environmentId);
      c.set('userId', `machine:token:${serviceToken.name}`); 
      return await next();
    }
  }

  // 2. Check for User Session (Human identity via Bearer Token)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = await verifySessionToken(token);

    if (payload) {
      const { userId } = payload;
      c.set('isMachine', false);
      c.set('userId', userId);

      // Auto-fetch active organization for the user
      const userOrg = await db.query.organization.findFirst({
        where: eq(schema.organization.ownerId, userId)
      });

      if (userOrg) {
        c.set('organizationId', userOrg.id);
      }

      const envHeader = c.req.header('X-ZMS-Environment-Id') || c.req.header('X-ZMS-Env-Id');
      if (envHeader) c.set('envId', envHeader);

      return await next();
    }
  }

  // 3. Reject if no identity found
  console.warn(`🚨 AuthGuard REJECT: [${c.req.method}] ${c.req.path} - No Identity Found`);
  return c.json({ 
    success: false, 
    error: { 
      code: 'UNAUTHORIZED', 
      message: 'No valid credentials found. Please sign in or provide a valid X-ZMS-Token.' 
    } 
  }, 401);
};
