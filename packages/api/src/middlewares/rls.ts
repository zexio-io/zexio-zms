import { Context, Next, MiddlewareHandler } from 'hono';
import { db } from '@zexio/zms-core';
import { AppEnv } from '../types/hono.js';

export const rls: MiddlewareHandler<AppEnv> = async (c, next) => {
  const isMachine = c.get('isMachine') || false;
  const envId = c.req.header('x-zms-environment-id') || (isMachine ? c.get('envId') : c.req.query('envId'));
  let orgId = c.req.param('orgId') || c.req.header('x-zms-organization-id') || c.get('organizationId');
  const projectId = c.req.param('projectId');

  if (!envId) {
    return c.json({ success: false, error: { code: 'MISSING_CONTEXT', message: 'Missing environmentId' } }, 400);
  }

  // 1. Verify Ownership Chain (Env -> Project -> Org)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(envId);

  const result = await db.query.environments.findFirst({
    where: (env, { eq, and }) => isUuid 
      ? eq(env.id, envId) 
      : and(eq(env.name, envId), eq(env.projectId, projectId as string)),
    with: {
      project: true
    }
  });

  if (!result) {
     return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Environment not found' } }, 404);
  }

  // Auto-infer orgId if missing
  if (!orgId && result.project.organizationId) {
    orgId = result.project.organizationId;
  }

  if (!orgId) {
    return c.json({ success: false, error: { code: 'MISSING_CONTEXT', message: 'Missing organizationId' } }, 400);
  }

  if (result.project.organizationId !== orgId) {
    return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Forbidden: Context mismatch' } }, 403);
  }

  // 2. If projectId is in URL, ensure it matches the environment's project
  const paramProjectId = c.req.param('projectId');
  if (paramProjectId && result.projectId !== paramProjectId) {
    return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Forbidden: Project mismatch' } }, 403);
  }

  c.set('envId', result.id);
  c.set('organizationId', orgId);
  await next();
};
