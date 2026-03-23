import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { db, generateRecoveryKey, startOrganizationRotation, performRotationBatch, getGlobalMasterKey } from '@zexio/zms-core';
import { authGuard } from '../middlewares/auth-guard.js';
import { logAction } from '../services/audit.js';
import * as OTPAuth from 'otpauth';

export const security = new OpenAPIHono();

// Security routes only require Authentication, not Environment RLS
security.use('*', authGuard as any);

// Schemas
const recoveryKeyResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    recoveryKey: z.string(),
    disclaimer: z.string(),
  })
}).openapi("RecoveryKeyResponse");

const rotationResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    newVersion: z.number(),
  })
}).openapi("RotationResponse");

// 1. Route: Get Recovery Key
const getRecoveryKeyRoute = createRoute({
  method: 'get',
  path: '/recovery-key',
  summary: 'Generate and download MFA-protected Organization Recovery Key',
  tags: ['Security'],
  request: {
    headers: z.object({
      'x-zms-mfa': z.string().optional().openapi({ description: 'TOTP Code if 2FA is enabled' })
    })
  },
  responses: {
    200: {
      description: 'Recovery key generated',
      content: { 'application/json': { schema: recoveryKeyResponseSchema } }
    },
    400: {
      description: 'Bad Request',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string() }) }) } }
    },
    403: {
      description: 'MFA Required',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string() }) }) } }
    },
    401: {
      description: 'Invalid MFA',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string() }) }) } }
    },
    404: {
      description: 'Not Found',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string() }) }) } }
    }
  }
});

// 2. Route: Rotate Keys
const rotateKeysRoute = createRoute({
  method: 'post',
  path: '/rotate-keys',
  summary: 'Initialize Organization-wide Key Rotation',
  tags: ['Security'],
  responses: {
    200: {
      description: 'Rotation started',
      content: { 'application/json': { schema: rotationResponseSchema } }
    },
    400: {
      description: 'Bad Request',
      content: { 'application/json': { schema: z.object({ error: z.string() }) } }
    }
  }
});

// Handlers
security.openapi(getRecoveryKeyRoute, (async (c: any) => {
  const userId = c.get('userId' as any);
  const orgId = c.get('organizationId' as any);

  if (!orgId) return c.json({ success: false, error: { code: 'ACTIVE_ORG_REQUIRED', message: 'Active Organization Required' } } as any, 400);

  // 1. Fetch User MFA State
  const userData = await db.query.user.findFirst({
    where: (u: any, { eq }: any) => eq(u.id, userId)
  });

  if (!userData) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } } as any, 404);

  // 2. MFA Enforcement
  if ((userData as any).twoFactorEnabled) {
    const mfaCode = c.req.header('x-zms-mfa');
    if (!mfaCode) {
      return c.json({ 
        success: false,
        error: { 
          code: 'MFA_REQUIRED', 
          message: 'The provided MFA code is incorrect or expired.' 
        }
      } as any, 403);
    }

    const totp = new OTPAuth.TOTP({
      issuer: 'Zexio ZMS',
      label: userData.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: (userData as any).twoFactorSecret,
    });

    const delta = totp.validate({ token: mfaCode, window: 1 });
    
    if (delta === null) {
      logAction(orgId, userId, 'SECURITY_RECOVERY_KEY_MFA_FAILURE', `org:${orgId}`, { 
        attempt: mfaCode 
      });
      return c.json({ 
        success: false, 
        error: { code: 'INVALID_MFA_CODE', message: 'The provided MFA code is incorrect or expired.' } 
      }, 401);
    }

    logAction(orgId, userId, 'SECURITY_RECOVERY_KEY_MFA_SUCCESS', `org:${orgId}`);
  } else {
    // Log as high-risk access
    await logAction(orgId, userId, 'SECURITY_RECOVERY_KEY_VIEW_UNPROTECTED', `org:${orgId}`, { 
      warning: 'MFA not enabled' 
    });
  }

  // 3. Generate Key
  const org = await db.query.organization.findFirst({
    where: (o: any, { eq }: any) => eq(o.id, orgId)
  });

  if (!org) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Organization not found' } } as any, 404);

  const recoveryKey = generateRecoveryKey(orgId, org.tmkSalt);
  
  // Log Success
  await logAction(orgId, userId, 'SECURITY_RECOVERY_KEY_VIEW', `org:${orgId}`);

  return c.json({ 
    success: true,
    data: {
      recoveryKey,
      disclaimer: 'Zero-Knowledge: ZMS cannot recover this key once lost.'
    }
  }, 200);
}) as any);

security.openapi(rotateKeysRoute, (async (c: any) => {
  const userId = c.get('userId' as any);
  const orgId = c.get('organizationId' as any);

  if (!orgId) return c.json({ success: false, error: { code: 'BAD_REQUEST', message: 'Active Organization Required' } }, 400);

  // 1. Start Rotation (Update salts)
  const result = await startOrganizationRotation(orgId);
  
  // 2. Log Action
  await logAction(orgId, userId, 'KEY_ROTATION_START', `org:${orgId}`, { 
    newVersion: result.newVersion 
  });

  // 3. Kick off first batch (optional, could be background)
  const masterKey = getGlobalMasterKey();
  const batch = await performRotationBatch(orgId, masterKey, 100);

  return c.json({ 
    success: true,
    data: {
      newVersion: result.newVersion
    }
  }, 200);
}) as any);
