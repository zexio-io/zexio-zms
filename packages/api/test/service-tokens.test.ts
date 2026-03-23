import { describe, it, expect, beforeEach } from "vitest";
import app from "../src/index";
import { db, schema } from "@zexio/zms-core";
import { eq } from "drizzle-orm";

describe("Service Token Lifecycle & M2M Auth (Integration)", () => {
  const testUser = {
    name: "DevOps Engineer",
    email: "devops@zexio.test",
    password: "secure-password-123"
  };

  let authToken: string;
  let orgId: string;
  let projectId: string;
  let serviceId: string;
  let environmentId: string;

  beforeEach(async () => {
    // 1. Setup system
    const setupRes = await app.request("/v1/auth/setup", {
      method: "POST",
      body: JSON.stringify(testUser),
      headers: { "Content-Type": "application/json" }
    });
    const setupData = await setupRes.json();
    authToken = setupData.token;

    // 2. Get Org
    const orgsRes = await app.request("/v1/orgs", {
      method: "GET",
      headers: { "Authorization": `Bearer ${authToken}` }
    });
    const orgsData = await orgsRes.json();
    orgId = orgsData.data[0].id;

    // 3. Create Project & Get Resources
    const projectRes = await app.request(`/v1/orgs/${orgId}/projects`, {
      method: "POST",
      body: JSON.stringify({ name: "M2M Project", services: ["backend"] }),
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      }
    });
    const projectData = await projectRes.json();
    projectId = projectData.data.id;

    // Fetch Env and Service IDs
    const envsRes = await app.request(`/v1/orgs/${orgId}/projects/${projectId}/environments`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${authToken}` }
    });
    environmentId = (await envsRes.json()).data.find((e: any) => e.name === "development").id;

    const servRes = await app.request(`/v1/orgs/${orgId}/projects/${projectId}/services`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${authToken}` }
    });
    serviceId = (await servRes.json()).data[0].id;
  });

  it("should generate a service token and use it for M2M authentication", async () => {
    // 1. Generate Token
    const genRes = await app.request("/v1/service-tokens", {
      method: "POST",
      body: JSON.stringify({
        organizationId: orgId,
        projectId,
        serviceId,
        environmentId,
        name: "CI/CD Token"
      }),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      }
    });

    const genData = await genRes.json();
    expect(genRes.status).toBe(201);
    expect(genData.token).toBeDefined();
    expect(genData.token).toMatch(/^zms_st_/);
    
    const m2mToken = genData.token;

    // 2. Use Token to access a protected route (e.g. List Orgs)
    const m2mRes = await app.request("/v1/orgs", {
      method: "GET",
      headers: {
        "X-ZMS-Token": m2mToken,
        "X-ZMS-Organization-Id": orgId
      }
    });

    expect(m2mRes.status).toBe(200);
    const m2mData = await m2mRes.json();
    expect(m2mData.success).toBe(true);
    expect(m2mData.data.length).toBeGreaterThan(0);

    // 3. Verify Session info reflects machine identity
    const sessionRes = await app.request("/v1/auth/session", {
      method: "GET",
      headers: {
        "X-ZMS-Token": m2mToken,
        "X-ZMS-Organization-Id": orgId
      }
    });

    const sessionData = await sessionRes.json();
    expect(sessionRes.status).toBe(200);
    expect(sessionData.isMachine).toBe(true);
    expect(sessionData.user.name).toContain("CI/CD Token");
  });

  it("should authenticate with only the token (no orgId header)", async () => {
    // 1. Generate Token
    const genRes = await app.request("/v1/service-tokens", {
      method: "POST",
      body: JSON.stringify({
        organizationId: orgId,
        projectId,
        serviceId,
        environmentId,
        name: "Token Only SDK"
      }),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      }
    });

    const genData = await genRes.json();
    const m2mToken = genData.token;

    // 2. Access WITHOUT X-ZMS-Organization-Id
    const m2mRes = await app.request("/v1/orgs", {
      method: "GET",
      headers: {
        "X-ZMS-Token": m2mToken
        // Missing org header
      }
    });

    expect(m2mRes.status).toBe(200);
    const m2mData = await m2mRes.json();
    expect(m2mData.success).toBe(true);

    // 3. Verify context is correctly resolved
    const sessionRes = await app.request("/v1/auth/session", {
      method: "GET",
      headers: {
        "X-ZMS-Token": m2mToken
      }
    });

    const sessionData = await sessionRes.json();
    expect(sessionRes.status).toBe(200);
    expect(sessionData.isMachine).toBe(true);
    expect(sessionData.organizationId).toBe(orgId);
  });

  it("should fail authentication with an invalid or revoked token", async () => {
    const invalidToken = "zms_st_invalid_entropy_12345";
    
    const res = await app.request("/v1/orgs", {
      method: "GET",
      headers: {
        "X-ZMS-Token": invalidToken,
        "X-ZMS-Organization-Id": orgId
      }
    });

    expect(res.status).toBe(401);
  });
});
