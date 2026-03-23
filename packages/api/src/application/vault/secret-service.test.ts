import { describe, it, expect, vi, beforeEach } from "vitest";
import { SecretService } from "./secret-service";
import * as core from "@zexio/zms-core";
import * as audit from "@/services/audit";

// 1. Mock Dependencies
vi.mock("@zexio/zms-core", () => ({
  saveSecret: vi.fn(),
  getSecret: vi.fn(),
  deleteSecret: vi.fn(),
  getGlobalMasterKey: vi.fn(() => "test-master-key"),
}));

vi.mock("@/services/audit", () => ({
  logAction: vi.fn(),
}));

describe("SecretService (Vault Domain - CE)", () => {
  let secretService: SecretService;
  let mockRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = {}; // VaultRepository as needed
    secretService = new SecretService(mockRepo);
  });

  describe("writeSecret", () => {
    const params = {
      orgId: "org-123",
      userId: "user-456",
      serviceId: "svc-999",
      projectId: "proj-123",
      envId: "env-789",
      path: "prod/api_key",
      value: "secret-value",
      tmkSalt: "salt-abc",
    };

    it("should encrypt and save secret (No Quota Enforcement in CE)", async () => {
      await secretService.writeSecret(params);

      // Verify Core Encryption call
      expect(core.saveSecret).toHaveBeenCalledWith(
        "prod/api_key",
        "secret-value",
        "test-master-key",
        "svc-999",
        "env-789",
        "salt-abc",
        undefined
      );

      // Verify Audit Logging
      expect(audit.logAction).toHaveBeenCalledWith("org-123", "user-456", "SECRET_WRITE", "secret:prod/api_key", {
        path: "prod/api_key",
        projectId: "proj-123",
        envId: "env-789"
      }, "svc-999");
    });
  });

  describe("readSecret", () => {
    it("should return content and log action on success", async () => {
      (core.getSecret as any).mockResolvedValue("decrypted-content");

      const result = await secretService.readSecret({
        orgId: "org-123",
        userId: "user-456",
        serviceId: "svc-999",
        projectId: "proj-123",
        envId: "env-789",
        path: "prod/api_key",
        tmkSalt: "salt-abc",
      });

      expect(result).toBe("decrypted-content");
      expect(audit.logAction).toHaveBeenCalledWith("org-123", "user-456", "SECRET_READ", "secret:prod/api_key", {
        path: "prod/api_key",
        projectId: "proj-123",
        envId: "env-789"
      }, "svc-999");
    });

    it("should return null if secret not found", async () => {
      (core.getSecret as any).mockResolvedValue(null);

      const result = await secretService.readSecret({
        orgId: "org-123",
        userId: "user-456",
        serviceId: "svc-999",
        projectId: "proj-123",
        envId: "env-789",
        path: "prod/api_key",
        tmkSalt: "salt-abc",
      });

      expect(result).toBeNull();
      expect(audit.logAction).not.toHaveBeenCalled();
    });
  });

  describe("deleteSecret", () => {
    it("should delete from core and log action", async () => {
      await secretService.deleteSecret({
        orgId: "org-123",
        userId: "user-456",
        serviceId: "svc-999",
        projectId: "proj-123",
        envId: "env-789",
        path: "prod/api_key",
        tmkSalt: "salt-abc",
      });

      expect(core.deleteSecret).toHaveBeenCalled();
      expect(audit.logAction).toHaveBeenCalledWith("org-123", "user-456", "SECRET_DELETE", "secret:prod/api_key", {
        path: "prod/api_key",
        projectId: "proj-123",
        envId: "env-789"
      }, "svc-999");
    });
  });
});
