import { describe, it, expect, vi, beforeEach } from "vitest";
import { OnboardingService } from "./onboarding-service";
import { db } from "@zexio/zms-core";

vi.mock("@zexio/zms-core", () => ({
  db: {
    transaction: vi.fn((cb) => cb({ tx: "mock-tx" })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockReturnValue([
          { recoveryShards: ["mock-shard-1", "mock-shard-2"] }
        ])
      }))
    })),
    delete: vi.fn(() => ({
      where: vi.fn()
    })),
  },
  generateRecoveryShards: vi.fn(() => ["shard-1", "shard-2"]),
  pendingOnboarding: { userId: "userId" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
}));

describe("OnboardingService (Orchestration Domain)", () => {
  let onboardingService: OnboardingService;
  let mockOrchSrv: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockOrchSrv = {
      createOrganization: vi.fn().mockResolvedValue({ id: "org-1", name: "ZMS Test", slug: "zms-test" }),
      createProjectWithDefaults: vi.fn().mockResolvedValue({ 
        project: { id: "proj-1", name: "Alpha" },
        environments: [{ id: "env-1", name: "production" }]
      }),
    };

    onboardingService = new OnboardingService(mockOrchSrv);
  });

  describe("setup", () => {
    const params = {
      orgName: "ZMS Test",
      orgSlug: "zms-test",
      userId: "user-1",
    };

    it("should execute the simplified onboarding flow correctly (Single-Owner)", async () => {
      const result = await onboardingService.setup(params);

      // Verify DB Transaction was called
      expect(db.transaction).toHaveBeenCalled();

      // Verify Organization Creation
      expect(mockOrchSrv.createOrganization).toHaveBeenCalledWith(
        "ZMS Test",
        "user-1", // ownerId
        expect.anything() // tx
      );

      // Verify Result
      expect(result.organization.id).toBe("org-1");
      expect(result.project).toBeUndefined();
    });

    it("should throw error if organization creation fails", async () => {
      mockOrchSrv.createOrganization.mockRejectedValue(new Error("DB Error"));

      await expect(onboardingService.setup(params)).rejects.toThrow("DB Error");
    });
  });

  describe("getShards", () => {
    it("should return shards if found and then delete them", async () => {
      const shards = await onboardingService.getShards("user-1");

      expect(shards).toEqual(["mock-shard-1", "mock-shard-2"]);
      expect(db.select).toHaveBeenCalled();
      expect(db.delete).toHaveBeenCalled();
    });

    it("should return null if no shards found", async () => {
      // Mock db.select to return empty array
      (db.select as any).mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn().mockReturnValue([])
        }))
      });

      const shards = await onboardingService.getShards("user-1");
      expect(shards).toBeNull();
    });
  });
});
