import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { OnboardingService } from "../../application/onboarding/onboarding-service.js";
import { OrchestrationService, DrizzleOrchestrationRepository, db, pendingOnboarding } from "@zexio/zms-core";
import { AppEnv } from "../../types/hono.js";
import { hashPassword, createSessionToken } from "../../lib/auth-utils.js";
import * as schema from "@zexio/zms-core";
import { eq } from "drizzle-orm";
import { authGuard } from "../../middlewares/auth-guard.js";
import crypto from "crypto";

export const onboardingRoutes = new Hono<AppEnv>();

const repo = new DrizzleOrchestrationRepository();
const orchService = new OrchestrationService(repo);
const onboardingService = new OnboardingService(orchService);

// Schemas
const setupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  organizationName: z.string().min(2).optional(),
});

// Handlers
onboardingRoutes.post("/setup", zValidator("json", setupSchema), async (c) => {
  const { name, email, password, organizationName } = c.req.valid("json");

  try {
    return await db.transaction(async (tx) => {
      // 1. Check for Single-User Lock
      const existingUser = await tx.select().from(schema.user).limit(1);
      if (existingUser.length > 0) {
        return c.json({ success: false, error: "System already initialized" }, 403);
      }

      // 2. Create User
      const userId = crypto.randomUUID();
      const [user] = await tx.insert(schema.user).values({
        id: userId,
        name,
        email,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      // 3. Create Account (for Password)
      const hashedPassword = await hashPassword(password);
      await tx.insert(schema.account).values({
        id: crypto.randomUUID(),
        accountId: userId,
        providerId: 'credential',
        userId: userId,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 4. Setup Organization & Projects
      const result = await onboardingService.setup({
        orgName: organizationName || `${name}'s Workspace`,
        userId: user.id
      }, tx);

      // 5. Store Shards for Retrieval (Automated Flow B016)
      await tx.insert(pendingOnboarding).values({
        userId: user.id,
        recoveryShards: result.recoveryShards,
      });

      // 6. Create Session
      const token = await createSessionToken(user.id);

      return c.json({
        success: true,
        token,
        user: { id: user.id, name: user.name, email: user.email },
        data: {
          userId: user.id,
          organizationId: result.organization.id,
          recoveryKey: result.recoveryShards[0]
        },
      }, 201);
    });
  } catch (error: any) {
    console.error("Setup Error:", error);
    return c.json({ success: false, error: error.message }, 400);
  }
});

onboardingRoutes.get("/shards", authGuard, async (c) => {
  const userId = c.get("userId");
  const shards = await onboardingService.getShards(userId);

  if (!shards) return c.json({ success: false, error: "No pending shards found" }, 404);

  return c.json({
    success: true,
    data: { recoveryShards: shards }
  });
});
