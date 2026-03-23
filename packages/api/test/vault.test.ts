import { describe, it, expect } from "vitest";
import { SecretService } from "@/application/vault/secret-service";
import { DrizzleVaultRepository } from "@/infrastructure/db/vault-repository";
import { OnboardingService } from "@/application/onboarding/onboarding-service";
import { OrchestrationService, DrizzleOrchestrationRepository, db, schema, generatePathIndex } from "@zexio/zms-core";
import { eq, and } from "drizzle-orm";

describe("Vault Core Persistence (Phase 107 - CE)", () => {
  // Setup Repos
  const vaultRepo = new DrizzleVaultRepository();
  const orchRepo = new DrizzleOrchestrationRepository();

  // Setup Services
  const secretSrv = new SecretService(vaultRepo);
  const orchSrv = new OrchestrationService(orchRepo);
  const onboardingSrv = new OnboardingService(orchSrv);

  it("should persist encrypted secret and log action in real DB", async () => {
    // 1. Setup Tenant (User & Organization)
    const adminUserId = "user-vault-test-107";
    await db.insert(schema.user).values({
      id: adminUserId,
      name: "Vault Owner",
      email: "vault-owner@zexio.com",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const setupResult = await onboardingSrv.setup({
      orgName: "Security Org CE",
      orgSlug: "sec-org-ce",
      userId: adminUserId,
    });

    const orgId = setupResult.organization.id;
    
    // Create a dummy project/env/service for context since onboarding-srv setup is now minimal
    const project = await orchSrv.createProjectWithDefaults(orgId, "Project Alpha", adminUserId, ["vault-service"]);
    const envId = project.environments[0].id; // Development
    const serviceId = project.services[0].id;

    // 2. Write Secret
    const secretPath = "prod/db/password";
    const secretValue = "super-secret-123";
    
    await secretSrv.writeSecret({
      orgId,
      envId,
      path: secretPath,
      value: secretValue,
      userId: adminUserId,
      serviceId,
      tmkSalt: setupResult.organization.tmkSalt,
    });

    // 3. Verification: Physical Persistence (PostgreSQL)
    const masterKey = process.env.MASTER_KEY!;
    const expectedIndexedPath = generatePathIndex(secretPath, masterKey, setupResult.organization.tmkSalt);

    const secretsInDb = await db.select().from(schema.secrets).where(
        and(eq(schema.secrets.environmentId, envId), eq(schema.secrets.path, expectedIndexedPath))
    );
    expect(secretsInDb.length).toBe(1);
    expect(secretsInDb[0].encryptedBlob).toBeDefined();

    // 4. Verification: Audit Trail
    const logs = await db.select().from(schema.auditLogs).where(
        and(eq(schema.auditLogs.organizationId, orgId), eq(schema.auditLogs.action, "SECRET_WRITE"))
    );
    expect(logs.length).toBe(1);
    expect(logs[0].actorId).toBe(adminUserId);
  });
});
