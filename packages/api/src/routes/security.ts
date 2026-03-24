import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db, generateRecoveryKey, startOrganizationRotation, performRotationBatch, getGlobalMasterKey } from "@zexio/zms-core";
import { authGuard } from "../middlewares/auth-guard.js";
import { logAction } from "../services/audit.js";
import * as OTPAuth from "otpauth";
import { AppEnv } from "../types/hono.js";

export const security = new Hono<AppEnv>();

// Security routes only require Authentication, not Environment RLS
security.use("*", authGuard);

// Handlers
security.get("/recovery-key", async (c) => {
  const userId = c.get("userId");
  const orgId = c.get("organizationId");

  if (!orgId) return c.json({ success: false, error: { code: "ACTIVE_ORG_REQUIRED", message: "Active Organization Required" } }, 400);

  // 1. Fetch User MFA State
  const userData = await db.query.user.findFirst({
    where: (u: any, { eq }: any) => eq(u.id, userId),
  });

  if (!userData) return c.json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } }, 404);

  // 2. MFA Enforcement
  if (userData.twoFactorEnabled) {
    const mfaCode = c.req.header("x-zms-mfa");
    if (!mfaCode) {
      return c.json({
        success: false,
        error: {
          code: "MFA_REQUIRED",
          message: "The provided MFA code is incorrect or expired.",
        },
      }, 403);
    }

    const totp = new OTPAuth.TOTP({
      issuer: "Zexio ZMS",
      label: userData.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: userData.twoFactorSecret!,
    });

    const delta = totp.validate({ token: mfaCode, window: 1 });

    if (delta === null) {
      logAction(orgId, userId, "SECURITY_RECOVERY_KEY_MFA_FAILURE", `org:${orgId}`, {
        attempt: mfaCode,
      });
      return c.json({
        success: false,
        error: { code: "INVALID_MFA_CODE", message: "The provided MFA code is incorrect or expired." },
      }, 401);
    }

    logAction(orgId, userId, "SECURITY_RECOVERY_KEY_MFA_SUCCESS", `org:${orgId}`);
  } else {
    // Log as high-risk access
    await logAction(orgId, userId, "SECURITY_RECOVERY_KEY_VIEW_UNPROTECTED", `org:${orgId}`, {
      warning: "MFA not enabled",
    });
  }

  // 3. Generate Key
  const org = await db.query.organization.findFirst({
    where: (o: any, { eq }: any) => eq(o.id, orgId),
  });

  if (!org) return c.json({ success: false, error: { code: "NOT_FOUND", message: "Organization not found" } }, 404);

  const recoveryKey = generateRecoveryKey(orgId, org.tmkSalt);

  // Log Success
  await logAction(orgId, userId, "SECURITY_RECOVERY_KEY_VIEW", `org:${orgId}`);

  return c.json({
    success: true,
    data: {
      recoveryKey,
      disclaimer: "Zero-Knowledge: ZMS cannot recover this key once lost.",
    },
  }, 200);
});

security.post("/rotate-keys", async (c) => {
  const userId = c.get("userId");
  const orgId = c.get("organizationId");

  if (!orgId) return c.json({ success: false, error: { code: "BAD_REQUEST", message: "Active Organization Required" } }, 400);

  // 1. Start Rotation (Update salts)
  const result = await startOrganizationRotation(orgId);

  // 2. Log Action
  await logAction(orgId, userId, "KEY_ROTATION_START", `org:${orgId}`, {
    newVersion: result.newVersion,
  });

  // 3. Kick off first batch
  const masterKey = await getGlobalMasterKey();
  await performRotationBatch(orgId, masterKey, 100);

  return c.json({
    success: true,
    data: {
      newVersion: result.newVersion,
    },
  }, 200);
});
