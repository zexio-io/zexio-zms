import { db, OrchestrationService, generateRecoveryShards, pendingOnboarding } from "@zexio/zms-core";
import { eq } from "drizzle-orm";

export class OnboardingService {
  constructor(
    private orchSrv: OrchestrationService
  ) {}

  async setup(params: {
    orgName: string;
    userId: string;
  }): Promise<any> {
    // Execute all in one transaction
    return await db.transaction(async (tx) => {
      // 1. Create Organization
      const org = await this.orchSrv.createOrganization(params.orgName, params.userId, tx);

      // 2. Create Default Project & Environments
      await this.orchSrv.createProjectWithDefaults(org.id, "Default Project", params.userId, ["api"], tx);

      // 3. Generate Shamir Recovery Shards
      const recoveryShards = generateRecoveryShards(5, 3);

      return {
        organization: org,
        recoveryShards
      };
    });
  }

  async getShards(userId: string): Promise<string[] | null> {
    const [result] = await db.select().from(pendingOnboarding).where(eq(pendingOnboarding.userId, userId));

    if (!result) return null;

    // One-time fetch: delete after retrieval
    await db.delete(pendingOnboarding).where(eq(pendingOnboarding.userId, userId));

    return result.recoveryShards as string[];
  }
}
