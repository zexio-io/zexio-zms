import { describe, it, expect, beforeEach } from "vitest";
import app from "../src/index";
import { db, schema } from "@zexio/zms-core";
import { eq } from "drizzle-orm";

describe("Project & Environment Management (Integration)", () => {
  const testUser = {
    name: "Project Manager",
    email: "pm@zexio.test",
    password: "secure-password-123"
  };

  let authToken: string;
  let orgId: string;

  beforeEach(async () => {
    // 1. Setup system and get token
    const setupRes = await app.request("/v1/auth/setup", {
      method: "POST",
      body: JSON.stringify(testUser),
      headers: { "Content-Type": "application/json" }
    });
    const setupData = await setupRes.json();
    authToken = setupData.token;

    // 2. Get Org ID
    const orgsRes = await app.request("/v1/orgs", {
      method: "GET",
      headers: { "Authorization": `Bearer ${authToken}` }
    });
    const orgsData = await orgsRes.json();
    orgId = orgsData.data[0].id;
  });

  it("should create a new project with default environments and services", async () => {
    const projectName = "Zexio Core API";
    const services = ["api-gateway", "auth-service"];

    const createRes = await app.request(`/v1/orgs/${orgId}/projects`, {
      method: "POST",
      body: JSON.stringify({
        name: projectName,
        services
      }),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      }
    });

    const createData = await createRes.json();
    expect(createRes.status).toBe(201);
    expect(createData.data.name).toBe(projectName);
    
    const projectId = createData.data.id;

    // 1. Verify Environments (Dev, Staging, Production)
    const envsRes = await app.request(`/v1/orgs/${orgId}/projects/${projectId}/environments`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${authToken}` }
    });
    const envsData = await envsRes.json();
    expect(envsData.data.length).toBe(3);
    const envNames = envsData.data.map((e: any) => e.name);
    expect(envNames).toContain("development");
    expect(envNames).toContain("staging");
    expect(envNames).toContain("production");

    // 2. Verify Services
    const servicesRes = await app.request(`/v1/orgs/${orgId}/projects/${projectId}/services`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${authToken}` }
    });
    const servicesData = await servicesRes.json();
    
    // Services should include the requested ones + 'default' if not provided? 
    // In OrchestrationService.createProjectWithDefaults, it maps what's provided.
    expect(servicesData.data.length).toBe(2);
    const serviceNames = servicesData.data.map((s: any) => s.name);
    expect(serviceNames).toContain("api-gateway");
    expect(serviceNames).toContain("auth-service");
  });

  it("should list projects within an organization", async () => {
    // Create another project
    await app.request(`/v1/orgs/${orgId}/projects`, {
      method: "POST",
      body: JSON.stringify({ name: "Project Alpha" }),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      }
    });

    const listRes = await app.request(`/v1/orgs/${orgId}/projects`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${authToken}` }
    });

    const listData = await listRes.json();
    expect(listRes.status).toBe(200);
    // 1 project from onboarding + 1 created here = 2
    expect(listData.data.length).toBe(2); 
    expect(listData.data.some((p: any) => p.name === "Project Alpha")).toBe(true);
  });
});
