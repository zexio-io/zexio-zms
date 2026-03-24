import { db, OrchestrationService, generateRecoveryShards, pendingOnboarding } from "@zexio/zms-core";
import { eq } from "drizzle-orm";

export class OnboardingService {
  constructor(
    private orchSrv: OrchestrationService
  ) {}

  async setup(params: {
    orgName: string;
    userId: string;
  }, tx?: any): Promise<any> {
    const client = tx || db;
    // Execute all in one transaction (if not already in one)
    const runInTx = async (workTx: any) => {
      // 1. Create Organization
      const org = await this.orchSrv.createOrganization(params.orgName, params.userId, workTx);

      // 2. Create Default Project & Environments
      await this.orchSrv.createProjectWithDefaults(org.id, "Default Project", params.userId, ["api"], workTx);

      // 3. Generate Shamir Recovery Shards
      const recoveryShards = generateRecoveryShards(5, 3);

      return {
        organization: org,
        recoveryShards
      };
    };

    return tx ? await runInTx(tx) : await db.transaction(runInTx);
  }

  async getShards(userId: string): Promise<string[] | null> {
    const [result] = await db.select().from(pendingOnboarding).where(eq(pendingOnboarding.userId, userId));

    if (!result) return null;

    // One-time fetch: delete after retrieval
    await db.delete(pendingOnboarding).where(eq(pendingOnboarding.userId, userId));

    return result.recoveryShards as string[];
  }
}
