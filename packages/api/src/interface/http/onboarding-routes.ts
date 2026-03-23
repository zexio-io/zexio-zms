import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { OnboardingService } from "../../application/onboarding/onboarding-service.js";
import { OrchestrationService, DrizzleOrchestrationRepository } from "@zexio/zms-core";
import { authGuard } from "../../middlewares/auth-guard.js";

export const onboardingRoutes = new OpenAPIHono();

// Initialize Services & Repositories
const orchRepo = new DrizzleOrchestrationRepository();
const orchSrv = new OrchestrationService(orchRepo);
const onboardingSrv = new OnboardingService(orchSrv);

// Apply Security Middlewares
onboardingRoutes.use("*", authGuard);
onboardingRoutes.use("/shards", authGuard);

// Schemas
const onboardingSchema = z.object({
  orgName: z.string().openapi({ example: "Example Inc." }),
}).openapi("OnboardingInput");

// Route Definition
const setupRoute = createRoute({
  method: 'post',
  path: '/setup',
  summary: 'Setup a new organization',
  tags: ['Onboarding'],
  request: {
    body: {
      content: {
        'application/json': { schema: onboardingSchema }
      }
    }
  },
  responses: {
    201: {
      description: 'Organization setup successfully',
      content: {
        'application/json': {
          schema: z.object({ success: z.boolean(), data: z.any() })
        }
      }
    }
  }
});

const getShardsRoute = createRoute({
  method: 'get',
  path: '/shards',
  summary: 'Fetch pending recovery shards for auto-onboarded user',
  tags: ['Onboarding'],
  responses: {
    200: {
      description: 'Recovery shards found',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), data: z.object({ recoveryShards: z.array(z.string()) }) }) } }
    },
    404: {
      description: 'No pending shards found'
    }
  }
});

// Route Handler
onboardingRoutes.openapi(setupRoute, async (c) => {
  const { orgName } = c.req.valid("json");
  const userId = c.get("userId" as any);

  const result = await onboardingSrv.setup({
    orgName,
    userId
  });

  return c.json({ 
    success: true, 
    data: { 
      organization: {
        id: result.organization.id,
        name: result.organization.name
      },
      recoveryShards: result.recoveryShards
    } 
  }, 201);
});

onboardingRoutes.openapi(getShardsRoute, async (c) => {
  const userId = c.get("userId" as any);

  try {
    const recoveryShards = await onboardingSrv.getShards(userId);
    
    if (!recoveryShards) {
      return c.json({ success: false, error: "No pending shards found" }, 404);
    }

    return c.json({ 
      success: true, 
      data: { recoveryShards } 
    }, 200);
  } catch (error: any) {
    console.error(`❌ Shard retrieval failed for user ${userId}:`, error);
    return c.json({ success: false, error: "Internal Server Error" }, 500);
  }
});
