import { describe, it, expect } from "vitest";
import { OnboardingService } from "@/application/onboarding/onboarding-service";
import { OrchestrationService, DrizzleOrchestrationRepository, db, schema } from "@zexio/zms-core";
import { eq } from "drizzle-orm";

describe("Orchestration Integration (Phase 109 - CE)", () => {
  const orchRepo = new DrizzleOrchestrationRepository();
  const orchService = new OrchestrationService(orchRepo);
  const onboardingService = new OnboardingService(orchService);

  it("should perform atomic onboarding and persist to real database with ownerId", async () => {
    const adminUserId = "user-real-999";
    
    // Seed user first to satisfy FK
    await db.insert(schema.user).values({
      id: adminUserId,
      name: "Owner User",
      email: "owner@zexio.com",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await onboardingService.setup({
      orgName: "Zexio CE Corp",
      orgSlug: "zexio-ce",
      userId: adminUserId,
    });

    // Verify Organization Creation
    expect(result.organization.name).toBe("Zexio CE Corp");
    
    const orgs = await db.select().from(schema.organization).where(eq(schema.organization.id, result.organization.id));
    expect(orgs.length).toBe(1);
    expect(orgs[0].ownerId).toBe(adminUserId); // CRITICAL: Verify owner is set
    expect(orgs[0].tmkSalt).toBeDefined();

    // Verify there are NO member entries (since table is gone, we check we didn't crash or attempt it)
    // Actually, drizzle would crash if table didn't exist, so this test passing proves logic is clean.
  });
});
