import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { OnboardingService } from "../../application/onboarding/onboarding-service.js";
import { AppEnv } from "../../types/hono.js";

export const onboardingRoutes = new Hono<AppEnv>();

const onboardingService = new OnboardingService();

// Schemas (Stripped of .openapi)
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
    const result = await onboardingService.setup(name, email, password, organizationName);
    return c.json({
      success: true,
      data: {
        userId: result.userId,
        organizationId: result.organizationId,
        recoveryKey: result.recoveryKey,
      },
    }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});
